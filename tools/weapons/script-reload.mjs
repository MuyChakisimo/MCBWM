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
// Refuses guns whose reload does more (shell by shell, minigun ammo box ...): reload.js needs support first.
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
  const STATES = ["setup", "trigger.tac", "trigger.reload", "reload", "reload.tac", "reloadfinish"];
  const extra = Object.keys(ac.states).filter((s) => !STATES.includes(s));
  if (extra.length) throw new Error(`${id}: its reload has more states (${extra.join(", ")}); reload.js doesn't do that yet`);

  // Timing from the BP reload animations.
  const bpFile = `TACZ-B/animations/guns/${id}.json`;
  const bp = parse(read(bpFile));
  const shortOf = (state) => (ac.states[state]?.animations ?? []).map((a) => (typeof a === "string" ? a : Object.keys(a)[0]))[0];
  const ALLOWED = [`/function ${id}reload`, `/event entity @s krep:${id}_reload`, `/replaceitem entity @s slot.weapon.mainhand 1 krep:${id} 1 0`, `/function ${id}`, new RegExp(`^/scoreboard players set @s\\[scores=\\{${id}=\\d+\\.\\.\\}\\] ${id} \\d+$`)];
  const timing = {};
  const removedAnims = [];
  for (const [kind, state] of [["empty", "reload"], ["tac", "reload.tac"]]) {
    const short = shortOf(state);
    const animId = desc.animations[short];
    const anim = bp.animations[animId];
    if (!anim) throw new Error(`${id}: no BP animation for ${state} (${short})`);
    const cues = Object.entries(anim.timeline ?? {}).flatMap(([t, cs]) => [].concat(cs).map((c) => [+t, c]));
    const odd = cues.filter(([, c]) => !ALLOWED.some((p) => (typeof p === "string" ? p === c : p.test(c))));
    if (odd.length) throw new Error(`${id}: its ${state} also runs ${JSON.stringify(odd.map(([, c]) => c))}; reload.js doesn't do that yet`);
    const loads = cues.filter(([, c]) => c === `/event entity @s krep:${id}_reload`).map(([t]) => t);
    if (loads.length !== 1) throw new Error(`${id}: its ${state} loads ${loads.length} times (shell by shell?); reload.js doesn't do that yet`);
    timing[kind] = [loads[0], +anim.animation_length];
    removedAnims.push([short, animId]);
  }

  // Remove the controller machinery.
  delete ctrlJson.animation_controllers[ctrlId];
  write(ctrlFile, format(ctrlJson));
  for (const [short, animId] of removedAnims) {
    delete desc.animations[short];
    delete bp.animations[animId];
  }
  write(bpFile, format(bp));
  const ctrlShort = Object.keys(desc.animations).find((k) => desc.animations[k] === ctrlId);
  if (ctrlShort) delete desc.animations[ctrlShort];
  desc.scripts.animate = desc.scripts.animate.filter((x) => (typeof x === "string" ? x : Object.keys(x)[0]) !== ctrlShort);
  let evs = 0;
  for (const k of Object.keys(events)) if (new RegExp(`^${id}reload\\d+$`).test(k) || k === `krep:${id}_reload`) { delete events[k]; evs++; }

  // The shared swing detector for tactical reloads.
  if (!desc.animations.reload_input) {
    desc.animations.reload_input = "controller.animation.reload_input";
    desc.scripts.animate.push("reload_input");
  }
  write(P, format(pj));
  for (const f of [`TACZ-B/functions/${id}quantity.mcfunction`, `TACZ-B/functions/${id}reload.mcfunction`]) if (fs.existsSync(abs(f))) fs.rmSync(abs(f));

  // config/weapons.js
  const line = `    scriptReload: { empty: [${timing.empty.join(", ")}], tac: [${timing.tac.join(", ")}] },`;
  const body = entry[1].replace(/^( {4}scriptFiring: true,)$/m, `$1\n${line}`);
  weapons = weapons.replace(entry[0], `\n  ${id}: {\n${body}\n  },\n`);
  write("TACZ-B/scripts/config/weapons.js", weapons);
  console.log(`${id}: empty reload loads at ${timing.empty[0]} s of ${timing.empty[1]}, tactical at ${timing.tac[0]} of ${timing.tac[1]}; removed ${ctrlId}, ${removedAnims.length} BP animations, ${evs} events, 2 functions`);
}
console.log("Done. Run tools/weapons/check.mjs.");
