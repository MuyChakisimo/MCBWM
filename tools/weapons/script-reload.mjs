// Moves guns from controller reloading to script reloading (combat/reload.js).
//
//   node tools/weapons/script-reload.mjs <gun> [<gun> ...]
//
// Per gun:
//   - reads the timing from its BP reload animations (empty: <id>reload, tactical: <id>reloadtac): when the
//     rounds go in (the "/event entity @s krep:<id>_reload" cue) and when the animation ends;
//   - config/weapons.js: scriptReload: { empty: [load, end], tac: [load, end] } (seconds);
//   - removes what the script replaces: controller.animation.<id>.reload and its player.json entries, the two
//     BP reload animations, the <id>reloadN / krep:<id>_reload events, functions <id>quantity and <id>reload;
//   - wires the shared swing detector (animation_controllers/shared_reload.json) the first time.
// Also handled (see reload.js): per-magazine reloads (byMagazine), one-round reloads (emptyOne), reload
// events (tacEvents, reset), a round loaded into the item (RPG). Refuses shell by shell and the minigun.
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
  console.log("usage: node tools/weapons/script-reload.mjs <gun> [<gun> ...]");
  process.exit(1);
}

const P = "TACZ-B/entities/player.json";
let weapons = read("TACZ-B/scripts/config/weapons.js").replace(/\r\n/g, "\n");

for (const id of ids) {
  const entry = new RegExp(`\\n  ${id}: \\{\\n([\\s\\S]*?)\\n  \\},\\n`).exec(weapons);
  if (!entry) throw new Error(`${id}: not in config/weapons.js`);
  if (/^ {4}scriptReload: /m.test(entry[1])) { console.log(`${id}: already script-reloaded`); continue; }
  if (!/^ {4}scriptFiring: true,/m.test(entry[1])) throw new Error(`${id}: convert its firing first (script-firing.mjs)`);

  const pj = parse(read(P));
  const desc = pj["minecraft:entity"].description;
  const events = pj["minecraft:entity"].events;
  const ctrlId = `controller.animation.${id}.reload`;
  const ctrlFile = `TACZ-B/animation_controllers/gun_${id}.json`;
  const ctrlJson = parse(read(ctrlFile));
  const ac = ctrlJson.animation_controllers[ctrlId];
  if (!ac) throw new Error(`${id}: no ${ctrlId}`);
  const STATES = /^(setup|trigger\.(tac|reload)\d*|reload|reload1|reload\.tac|reloadfinish1?)$/;
  const extra = Object.keys(ac.states).filter((s) => !STATES.test(s));
  if (extra.length) throw new Error(`${id}: its reload has more states (${extra.join(", ")}); reload.js doesn't do that yet`);

  // Timing from the BP reload animations (one per magazine attachment on the Vector / Golden Deagle).
  const bpFile = `TACZ-B/animations/guns/${id}.json`;
  const bp = fs.existsSync(abs(bpFile)) ? parse(read(bpFile)) : { animations: {} };
  const ammo = /^ {4}ammo: "([\w:]+)",/m.exec(entry[1])?.[1];
  const ALLOWED = [
    new RegExp(`^/function ${id}reload\\d*$`), `/event entity @s krep:${id}_reload`, `/replaceitem entity @s slot.weapon.mainhand 1 krep:${id} 1 0`, `/function ${id}`,
    new RegExp(`^/scoreboard players set @s\\[scores=\\{${id}=\\d+\\.\\.\\}\\] ${id} \\d+$`),
    `@s krep:${id}_range`, `@s krep:${id}_rangeemp`, // caps, read from the scoreboard line or the events
    `/clear @s[m=!c] ${ammo} 0 1`, // RPG, M320: the round goes into the item
    /^@s (?!krep:)\w+:\w+$/, // visual events during the reload (Evolys belt: evolys:bulletcache)
  ];
  const removedAnims = [];
  const read1 = (state, short) => {
    const animId = desc.animations[short];
    const anim = bp.animations[animId];
    if (!anim) throw new Error(`${id}: no BP animation for ${state} (${short})`);
    const cues = Object.entries(anim.timeline ?? {}).flatMap(([t, cs]) => [].concat(cs).map((c) => [+t, c])).sort((a, b) => a[0] - b[0]);
    const odd = cues.filter(([, c]) => !ALLOWED.some((p) => (typeof p === "string" ? p === c : p.test(c))));
    if (odd.length) throw new Error(`${id}: its ${state} also runs ${JSON.stringify(odd.map(([, c]) => c))}; reload.js doesn't do that yet`);
    const loads = cues.filter(([, c]) => c === `/event entity @s krep:${id}_reload` || c === `/clear @s[m=!c] ${ammo} 0 1`).map(([t]) => t);
    if (loads.length !== 1) throw new Error(`${id}: its ${state} loads ${loads.length} times (shell by shell?); reload.js doesn't do that yet`);
    const cap = cues.map(([, c]) => new RegExp(`\\] ${id} (\\d+)$`).exec(c)?.[1]).find(Boolean);
    removedAnims.push([short, animId]);
    return { timing: [loads[0], +anim.animation_length], cap: cap === undefined ? undefined : +cap, events: cues.filter(([, c]) => /^@s (?!krep:)\w+:\w+$/.test(c)).map(([t, c]) => [t, c.slice(3)]) };
  };
  const sr = {};
  // Shell by shell (M870, SPAS-12, M1014: a "reloadfinish1" closing state): a shell at every time the ammo item is
  // cleared, until full / out of ammo / fire pressed; then the closing animation.
  const shellMode = Boolean(ac.states.reloadfinish1);
  if (shellMode) {
    const SHELL = [
      /^\/clear @s\[/, new RegExp(`^/event entity @s(\\[.*\\])? (krep:${id}_reload|${id}reload\\d+)$`),
      new RegExp(`^/function ${id}(quantity\\d*)?$`), new RegExp(`^/replaceitem entity @s(\\[scores=\\{${id}=1\\.\\.\\}\\])? slot\\.weapon\\.mainhand 1 krep:${id} 1 0$`),
    ];
    const shells = {};
    const shortOf = (state) => (ac.states[state]?.animations ?? []).map((a) => (typeof a === "string" ? a : Object.keys(a)[0]))[0];
    for (const [kind, state] of [["empty", "reload"], ["tac", "reload.tac"]]) {
      const short = shortOf(state);
      const anim = bp.animations[desc.animations[short]];
      if (!anim) throw new Error(`${id}: no BP animation for ${state} (${short})`);
      const cues = Object.entries(anim.timeline ?? {}).flatMap(([t, cs]) => [].concat(cs).map((c) => [+t, c])).sort((a, b) => a[0] - b[0]);
      const odd = cues.filter(([, c]) => !SHELL.some((p) => p.test(c)));
      if (odd.length) throw new Error(`${id}: its ${state} also runs ${JSON.stringify(odd.map(([, c]) => c))}; reload.js doesn't do that yet`);
      const clears = cues.filter(([, c]) => c.startsWith("/clear ") && c.includes(` ${ammo} `));
      shells[kind] = [...new Set(clears.map(([t]) => t))];
      if (clears.some(([, c]) => / 0 2$/.test(c))) shells.perCue = 2; // the M1014 loads two at a time when it can
      removedAnims.push([short, desc.animations[short]]);
    }
    const endShort = shortOf("reloadfinish1");
    const endAnim = bp.animations[desc.animations[endShort]];
    if (!endAnim) throw new Error(`${id}: no BP closing animation (${endShort})`);
    shells.finish = +endAnim.animation_length;
    removedAnims.push([endShort, desc.animations[endShort]]);
    shells.loading = events[`${id}reload1`]?.set_property?.["krep:ammoreload"];
    shells.ending = events[`${id}:end`]?.set_property?.["krep:ammoreload"];
    if (shells.loading === undefined || shells.ending === undefined) throw new Error(`${id}: can't read its loading / ending values`);
    sr.shells = shells;
  }
  if (!shellMode) {
  // Per state: its animations, keyed by magazine attachment when there are several.
  const byMag = [];
  for (const [kind, state] of [["empty", "reload"], ["tac", "reload.tac"], ["emptyOne", "reload1"]]) {
    const anims = (ac.states[state]?.animations ?? []).map((a) => (typeof a === "string" ? [a, ""] : Object.entries(a)[0]));
    if (!anims.length) continue;
    if (anims.length === 1) {
      const r = read1(state, anims[0][0]);
      sr[kind] = r.timing;
      if (kind === "tac" && r.events.length) sr.tacEvents = r.events;
      continue;
    }
    for (const [short, cond] of anims) {
      const m = /krep:magazine'\)\s*==\s*(\d+)/.exec(cond)?.[1];
      if (m === undefined) throw new Error(`${id}: ${state} has several animations not chosen by magazine; reload.js doesn't do that yet`);
      const r = read1(state, short);
      byMag[+m] ??= {};
      byMag[+m][kind] = r.timing;
      byMag[+m].caps ??= [];
      byMag[+m].caps[kind === "tac" ? 1 : 0] = r.cap;
    }
  }
  if (!sr.empty && !byMag.length) throw new Error(`${id}: no empty reload found`);
  if (byMag.length) {
    // Caps the animation didn't state come from the gun's range events (krep:<id>_rangeemp / _range).
    for (const [k, i] of [[`krep:${id}_rangeemp`, 0], [`krep:${id}_range`, 1]])
      for (const x of events[k]?.sequence ?? []) {
        const c = new RegExp(`\\] ${id} (\\d+)$`).exec(x.queue_command?.command?.[0] ?? "")?.[1];
        if (c !== undefined && byMag[x.filters.value] && byMag[x.filters.value].caps[i] === undefined) byMag[x.filters.value].caps[i] = +c;
      }
    if (byMag.some((b) => !b || b.caps.some((c) => c === undefined) || b.caps.length < 2)) throw new Error(`${id}: can't read every magazine's capacity`);
    sr.byMagazine = byMag;
  }
  if (sr.emptyOne) sr.emptyProperty = [1, 2].map((n) => events[`${id}reload${n}`]?.set_property?.["krep:ammoreload"]);
  if (sr.emptyProperty?.some((v) => v === undefined)) throw new Error(`${id}: can't read the one-round reload's property values`);
  const reset = Object.values(ac.states).flatMap((s) => s.on_entry ?? []).map((c) => /^@s (\w+:reset)$/.exec(c)?.[1]).find(Boolean);
  if (reset) sr.reset = reset;
  }

  // Remove the controller machinery.
  delete ctrlJson.animation_controllers[ctrlId];
  write(ctrlFile, format(ctrlJson));
  for (const [short, animId] of removedAnims) {
    delete desc.animations[short];
    delete bp.animations[animId];
  }
  // Minecraft rejects an animation file with no animations: delete it when the reload was all it had.
  if (Object.keys(bp.animations).length) write(bpFile, format(bp));
  else fs.rmSync(abs(bpFile));
  const ctrlShort = Object.keys(desc.animations).find((k) => desc.animations[k] === ctrlId);
  if (ctrlShort) delete desc.animations[ctrlShort];
  desc.scripts.animate = desc.scripts.animate.filter((x) => (typeof x === "string" ? x : Object.keys(x)[0]) !== ctrlShort);
  let evs = 0;
  // (krep:<id>_rangeemp only capped the old empty reload; krep:<id>_range stays: nothing else used it, but it's
  // harmless and the caps above were read from it.)
  for (const k of Object.keys(events)) if (new RegExp(`^${id}reload\\d+$`).test(k) || k === `krep:${id}_reload` || k === `krep:${id}_rangeemp` || (shellMode && k === `${id}:end`)) { delete events[k]; evs++; }

  // The shared swing detector for tactical reloads.
  if (!desc.animations.reload_input) {
    desc.animations.reload_input = "controller.animation.reload_input";
    desc.scripts.animate.push("reload_input");
  }
  write(P, format(pj));
  // Its quantity / reload functions (Vector, Golden Deagle: one per magazine, vectorquantity1 ...).
  const fns = fs.readdirSync(abs("TACZ-B/functions")).filter((f) => new RegExp(`^${id}(quantity|reload)\\d*\\.mcfunction$`).test(f));
  for (const f of fns) fs.rmSync(abs(`TACZ-B/functions/${f}`));

  // config/weapons.js
  const js = (v) => (Array.isArray(v) ? `[${v.map(js).join(", ")}]` : v && typeof v === "object" ? `{ ${Object.entries(v).map(([k, x]) => `${k}: ${js(x)}`).join(", ")} }` : JSON.stringify(v));
  const line = `    scriptReload: ${js(sr)},`;
  const body = entry[1].replace(/^( {4}scriptFiring: true,)$/m, `$1\n${line}`);
  weapons = weapons.replace(entry[0], `\n  ${id}: {\n${body}\n  },\n`);
  write("TACZ-B/scripts/config/weapons.js", weapons);
  console.log(`${id}: ${line.trim()} removed ${ctrlId}, ${removedAnims.length} BP animations, ${evs} events, ${fns.length} functions`);
}
console.log("Done. Run tools/weapons/check.mjs.");
