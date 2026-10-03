// Moves guns from controller firing to script firing (combat/firing.js), as was done by hand for the M4A1.
//
//   node tools/weapons/script-firing.mjs <gun> [<gun> ...]
//
// Per gun:
//   - BP controller.animation.<id>: the states that fire (on_entry runs krep:<id>_fire) are removed, with
//     every state only they lead to (delay.*) and the transitions into them. setup1 (starting ammo), setup
//     (HUD) and the "use at 0 rounds" state stay; reloading is untouched.
//   - config/weapons.js: scriptFiring: true; shootSound when the gun played another gun's shot sound
//     (G18 -> g17); shootAnimation when its fire event played other animation names than
//     animation.<id>.shoot.sight / .nsight (pistol ports: fp.shoot.*, Double Barrel: shoot.stock ...).
// Refuses guns whose firing does more than the standard shot (bolt/pump cycle, minigun heat, per-magazine
// caps, item swaps): those need firing.js support first.
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const { parse } = require("./lenient.cjs");
const { format } = require("./format.cjs");

const root = process.cwd();
const abs = (f) => path.join(root, f);
const read = (f) => fs.readFileSync(abs(f), "utf8");
const write = (f, text) => fs.writeFileSync(abs(f), read(f).includes("\r\n") ? text.replace(/\r?\n/g, "\r\n") : text);
const ids = process.argv.slice(2);
if (!ids.length) {
  console.log("usage: node tools/weapons/script-firing.mjs <gun> [<gun> ...]");
  process.exit(1);
}

const events = parse(read("TACZ-B/entities/player.json"))["minecraft:entity"].events;
let weapons = read("TACZ-B/scripts/config/weapons.js").replace(/\r\n/g, "\n");

for (const id of ids) {
  const entry = new RegExp(`\\n  ${id}: \\{\\n([\\s\\S]*?)\\n  \\},\\n`).exec(weapons);
  if (!entry) throw new Error(`${id}: not in config/weapons.js`);
  if (/^ {4}scriptFiring: true,/m.test(entry[1])) { console.log(`${id}: already script-fired`); continue; }

  // 1. The BP controller.
  const file = `TACZ-B/animation_controllers/gun_${id}.json`;
  const json = parse(read(file));
  const ac = json.animation_controllers[`controller.animation.${id}`];
  const states = ac.states;
  const fire = Object.keys(states).filter((s) => (states[s].on_entry ?? []).includes(`@s krep:${id}_fire`));
  if (!fire.length) throw new Error(`${id}: no state runs krep:${id}_fire`);
  const STANDARD = [
    `@s krep:${id}_fire`, `/function ${id}`, /^\/playsound [\w.]+\.(shoot|suppress) @a\[r=\d+\]$/,
    new RegExp(`^/scoreboard players (remove|set) @s\\[scores=\\{${id}=\\d+\\.\\.(\\d+)?\\}\\] ${id} \\d+$`),
    new RegExp(`^/replaceitem entity @s\\[scores=\\{${id}=0\\}\\] slot\\.weapon\\.mainhand 1 krep:${id}_emp 1 0$`),
    new RegExp(`^/title @s\\[scores=\\{${id}=0\\}\\] actionbar No Ammunition$`),
    /^\/scriptevent krep_\w+_recoil$/, // MP5: no script listens for it
    // MP7: its per-shot sound only played with a never-created mp7sound score (firing.js plays it every shot).
    /^\/execute as @s\[scores=\{\w+=0\}\] run playsound [\w.]+\.shoot @a\[r=\d+\]$/,
    `@s krep:${id}_range`, // capByMagazine (Vector, Golden Deagle)
    // RPG, M320: the loaded item is the round.
    `/replaceitem entity @s slot.weapon.mainhand 1 krep:${id}_emp 1 0`, "/title @s actionbar No Ammunition",
  ];
  const odd = fire.flatMap((s) => states[s].on_entry).filter((c) => !STANDARD.some((p) => (typeof p === "string" ? p === c : p.test(c))));
  if (odd.length) throw new Error(`${id}: its shot also runs ${JSON.stringify([...new Set(odd)])}; firing.js doesn't do that yet`);

  const sounds = new Set(fire.flatMap((s) => states[s].on_entry).map((c) => /(?:^\/| run )playsound ([\w.]+)\.shoot /.exec(c)?.[1]).filter(Boolean));
  if (sounds.size > 1) throw new Error(`${id}: plays several shot sounds: ${[...sounds]}`);
  const shootSound = [...sounds][0] ?? id;

  const fireCmds = fire.flatMap((s) => states[s].on_entry);
  const roundInItem = fireCmds.includes(`/replaceitem entity @s slot.weapon.mainhand 1 krep:${id}_emp 1 0`);
  // Fires only while aiming: every transition into the shot requires sneaking.
  const into = Object.values(states).flatMap((st) => st.transitions ?? []).filter((x) => fire.includes(Object.keys(x)[0])).map((x) => Object.values(x)[0]);
  const aimToFire = into.length > 0 && into.every((c) => /(?<!!)\bq(uery)?\.is_sneaking\b/.test(c));
  let capByMagazine = null;
  if (fireCmds.includes(`@s krep:${id}_range`)) {
    capByMagazine = [];
    for (const x of events[`krep:${id}_range`]?.sequence ?? []) {
      const cap = new RegExp(`\\] ${id} (\\d+)$`).exec(x.queue_command?.command?.[0] ?? "")?.[1];
      if (x.filters?.domain !== "krep:magazine" || cap === undefined) throw new Error(`${id}: can't read krep:${id}_range`);
      capByMagazine[x.filters.value] = +cap;
    }
  }

  // Silencer threshold: most guns' muzzles 4+ are silencers, a few (G17, SKS) treat any muzzle as one.
  const anyMuzzle = /krep:muzzle'\)\s*(>=\s*1|==\s*0)\b/.test(JSON.stringify(states));

  // Drop the firing states, then whatever is no longer reachable from the initial state.
  const dropped = new Set(fire);
  const targets = (s) => (states[s].transitions ?? []).map((t) => Object.keys(t)[0]);
  const reachable = (without) => {
    const reach = new Set([ac.initial_state ?? Object.keys(states)[0]]);
    for (let grew = true; grew; ) {
      grew = false;
      for (const s of [...reach]) for (const t of targets(s)) if (!without.has(t) && states[t] && !reach.has(t)) { reach.add(t); grew = true; }
    }
    return reach;
  };
  const wasReachable = reachable(new Set()); // states nothing led to before (the RPG's rpg.31) are left alone
  for (;;) {
    const reach = reachable(dropped);
    const more = Object.keys(states).filter((s) => wasReachable.has(s) && !reach.has(s) && !dropped.has(s));
    if (!more.length) break;
    more.forEach((s) => dropped.add(s));
  }
  // States only the shot led to may just wait (delay.*); one that runs commands (the AWM's bolt) is part of
  // the shot that firing.js doesn't do.
  const busy = [...dropped].filter((s) => !fire.includes(s) && (states[s].on_entry?.length || states[s].on_exit?.length));
  // A bolt / pump (AWM, M870 ...): "bolt" sets krep:ammoreload (RP bolt animation), "jawir" waits and resets it.
  let cycle = null;
  const CYCLE = new Set([`@s ${id}:bolt`, `@s ${id}:normal`, `/function ${id}`]);
  if (busy.length && busy.every((s) => !states[s].on_exit?.length && states[s].on_entry.every((c) => CYCLE.has(c)))) {
    const bp = parse(read(`TACZ-B/animations/guns/${id}.json`)).animations;
    const short = parse(read("TACZ-B/entities/player.json"))["minecraft:entity"].description.animations;
    const len = (s) => Math.max(0, ...(states[s]?.animations ?? []).map((a) => bp[short[typeof a === "string" ? a : Object.keys(a)[0]]]?.animation_length ?? 0));
    const boltState = busy.find((s) => states[s].on_entry.includes(`@s ${id}:bolt`));
    const waitState = busy.find((s) => s !== boltState);
    const value = events[`${id}:bolt`]?.set_property?.["krep:ammoreload"];
    if (!boltState || value === undefined) throw new Error(`${id}: can't read its bolt cycle`);
    cycle = { after: len(fire[0]), seconds: len(boltState), delay: waitState ? len(waitState) : 0, value };
    busy.length = 0;
  }
  if (busy.length) throw new Error(`${id}: after the shot it goes through ${busy.join(", ")} (${JSON.stringify(busy.flatMap((s) => states[s].on_entry ?? []))}); firing.js doesn't do that yet`);
  for (const s of dropped) delete states[s];
  for (const st of Object.values(states)) if (st.transitions) st.transitions = st.transitions.filter((t) => !dropped.has(Object.keys(t)[0]));

  // 2. Animations its fire event played (sneaking = aiming).
  const seq = events[`krep:${id}_fire`]?.sequence ?? [];
  const animFor = (sneaking) => seq.find((x) => x.filters?.value === sneaking)?.queue_command?.command?.map((c) => /^playanimation @s\S* (animation\.\S+)/.exec(c)?.[1]).find(Boolean);
  const anim = { ads: animFor(true), hip: animFor(false) };
  if (!anim.ads || !anim.hip) throw new Error(`${id}: can't read the shoot animations from krep:${id}_fire`);
  const defaultAnim = anim.ads === `animation.${id}.shoot.sight` && anim.hip === `animation.${id}.shoot.nsight`;

  // 3. config/weapons.js
  const lines = [`    scriptFiring: true,`];
  if (shootSound !== id) lines.push(`    shootSound: "${shootSound}",`);
  if (!defaultAnim) lines.push(`    shootAnimation: { ads: "${anim.ads}", hip: "${anim.hip}" },`);
  if (anyMuzzle) lines.push(`    suppressedFrom: 1,`);
  if (cycle) lines.push(`    cycle: { after: ${cycle.after}, seconds: ${cycle.seconds}, delay: ${cycle.delay}, value: ${cycle.value} },`);
  if (roundInItem) lines.push(`    roundInItem: true,`);
  if (aimToFire) lines.push(`    aimToFire: true,`);
  if (capByMagazine) lines.push(`    capByMagazine: [${capByMagazine.join(", ")}],`);
  const body = entry[1].replace(/^( {4}rpm: .*)$/m, `$1\n${lines.join("\n")}`);
  if (body === entry[1]) throw new Error(`${id}: no rpm line in config/weapons.js`);
  write(file, format(json));
  weapons = weapons.replace(entry[0], `\n  ${id}: {\n${body}\n  },\n`);
  write("TACZ-B/scripts/config/weapons.js", weapons); // per gun: a refused gun later leaves no half-done one
  console.log(`${id}: removed ${[...dropped].join(", ")}${shootSound !== id ? `; sound ${shootSound}.shoot` : ""}${defaultAnim ? "" : `; animations ${anim.ads.replace(`animation.${id}.`, "")} / ${anim.hip.replace(`animation.${id}.`, "")}`}`);
}
console.log("Done. Run tools/weapons/check.mjs.");
