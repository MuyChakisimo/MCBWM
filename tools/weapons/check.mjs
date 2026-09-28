// Checks that TACZ-B/scripts/config/*.js and the pack files agree, for every gun and ammo type.
// Run from the repo root (see README "Tools"). Exit code 1 if anything is wrong.
//
// For each gun it checks: BP items krep:<id> / krep:<id>_emp, RP attachables, icon, name and
// lore text, magazine size and ammo item (functions/<id>*.mcfunction), and that the fire event
// in entities/player.json runs the hitscan scriptevent (and spawns nothing).
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { pathToFileURL } from "node:url";
const require = createRequire(import.meta.url);
const { loadAll, parse } = require("./lenient.cjs");

const root = process.cwd();
const cfg = (f) => import(pathToFileURL(path.join(root, "TACZ-B/scripts/config", f)).href);
const { WEAPONS } = await cfg("weapons.js");
const { AMMO } = await cfg("ammo.js");
const { ATTACHMENTS } = await cfg("attachments.js");
const { RECOIL_ATTACHMENTS } = await cfg("recoil.js");

const read = (f) => (fs.existsSync(path.join(root, f)) ? fs.readFileSync(path.join(root, f), "utf8") : null);
const bpItems = new Set(), itemNames = new Map(), attachables = new Set();
for (const { json } of loadAll(path.join(root, "TACZ-B/items")).filter((x) => x.json))
  if (json["minecraft:item"]) {
    const id = json["minecraft:item"].description.identifier;
    bpItems.add(id);
    itemNames.set(id, json["minecraft:item"].components?.["minecraft:display_name"]?.value);
  }
for (const { json } of loadAll(path.join(root, "TACZ-R/attachables")).filter((x) => x.json))
  if (json["minecraft:attachable"]) attachables.add(json["minecraft:attachable"].description.identifier);
const itemTextures = parse(read("TACZ-R/textures/item_texture.json")).texture_data;
const lang = new Map(read("TACZ-R/texts/en_US.lang").split(/\r?\n/).map((l) => [l.split("=")[0], l.slice(l.indexOf("=") + 1)]));
const player = parse(read("TACZ-B/entities/player.json"))["minecraft:entity"];

const problems = [], warnings = [];
const line = (id, msg, where) => `${id.padEnd(9)} ${msg}${where ? `  [${where}]` : ""}`;
const bad = (...a) => problems.push(line(...a));
const warn = (...a) => warnings.push(line(...a)); // missing optional assets inherited from the original pack

for (const [id, w] of Object.entries(WEAPONS)) {
  for (const item of [`krep:${id}`, `krep:${id}_emp`]) {
    if (!bpItems.has(item)) bad(id, `missing BP item ${item}`, "TACZ-B/items/");
    if (!attachables.has(item)) bad(id, `missing RP attachable ${item}`, "TACZ-R/attachables/");
  }
  if (!itemTextures[id]) bad(id, `no item icon "${id}"`, "TACZ-R/textures/item_texture.json");
  if (w.icon && !fs.existsSync(path.join(root, "TACZ-R", w.icon + ".png"))) bad(id, `menu icon ${w.icon}.png not found`, "config/weapons.js icon");
  for (const key of [itemNames.get(`krep:${id}`), itemNames.get(`krep:${id}_emp`), `krep:gun.${id}.lore`, `krep:gun.${id}_emp.lore`])
    if (key && !lang.has(key)) bad(id, `no text for ${key}`, "TACZ-R/texts/*.lang");
  if (typeof w.damage !== "number" || typeof w.penetration !== "number") bad(id, "damage/penetration missing", "config/weapons.js");

  // Magazine and ammo, from the HUD and reload functions.
  const hud = read(`TACZ-B/functions/${id}.mcfunction`) ?? "";
  const quantity = read(`TACZ-B/functions/${id}quantity.mcfunction`) ?? "";
  if (w.overheat) {
    // Minigun: no magazine; reloads from an ammo box.
  } else if (w.magazine != null && id !== "rpg") {
    const hudSize = +(/"\/(\d+)/.exec(hud)?.[1] ?? NaN);
    if (hudSize !== w.magazine) bad(id, `magazine ${w.magazine} but HUD shows /${hudSize}`, `TACZ-B/functions/${id}.mcfunction`);
    const fill = +(/quantity=(\d+)\.\.\},\{item=krep:ammoboxc/.exec(quantity)?.[1] ?? NaN);
    // A reload may load one extra round (magazine + one chambered, capped by the reload animation).
    const expected = w.reload === "single" ? 1 : w.magazine;
    if (fill !== expected && fill !== expected + 1) bad(id, `reload loads ${fill} rounds, expected ${expected}`, `TACZ-B/functions/${id}quantity.mcfunction`);
    const ammo = /item=(krep:[a-z0-9_]+),quantity=\d+\}?,\{item=krep:ammoboxc/.exec(quantity)?.[1];
    if (ammo !== w.ammo) bad(id, `ammo ${w.ammo} but reload uses ${ammo}`, `TACZ-B/functions/${id}quantity.mcfunction`);
  }
  if (!bpItems.has(w.ammo)) bad(id, `ammo item ${w.ammo} does not exist`, "config/weapons.js ammo");

  // Fire event runs the hitscan scriptevent.
  const fire = player.events[`krep:${id}_fire`];
  if (!fire) bad(id, "no fire event krep:" + id + "_fire", "TACZ-B/entities/player.json");
  else {
    const steps = fire.sequence ?? [fire];
    const hitscan = steps.every((s) => (s.queue_command?.command ?? []).some((c) => c.startsWith(`scriptevent tacz:weapon_hitscan ${id} `)));
    const spawns = steps.some((s) => s.add?.component_groups?.length);
    if (!hitscan || spawns) bad(id, "fire event lacks the hitscan scriptevent or still adds a component group", "TACZ-B/entities/player.json");
  }
  // Stats the scripts read.
  const num = (v) => typeof v === "number" && Number.isFinite(v);
  if (!num(w.damage) || w.damage <= 0) bad(id, "damage missing or not a positive number", "config/weapons.js");
  if (!num(w.penetration) || w.penetration < 0 || w.penetration > 1) bad(id, "penetration must be 0..1", "config/weapons.js");
  for (const mode of ["hip", "ads"]) if (!(w.recoil?.[mode]?.length === 2 && w.recoil[mode].every(num))) bad(id, `recoil.${mode} must be [power, duration]`, "config/weapons.js");
  if (w.pellets > 1 && !(num(w.spread?.hip) && num(w.spread?.ads))) bad(id, "pellets without spread { hip, ads }", "config/weapons.js");
  for (const [item] of w.recipe ?? []) if (item !== "log" && !/^[a-z_]+$/.test(item)) bad(id, `odd recipe item ${item}`, "config/weapons.js");
}

for (const [id, a] of Object.entries(AMMO)) {
  if (!bpItems.has(`krep:${id}`)) bad(id, `missing BP item krep:${id}`, "TACZ-B/items/");
  if (!lang.has(a.lore)) bad(id, `no text for ${a.lore}`, "TACZ-R/texts/*.lang");
  if (!fs.existsSync(path.join(root, "TACZ-R", a.icon + ".png"))) bad(id, `menu icon ${a.icon}.png not found`, "config/ammo.js");
}
for (const id of Object.keys(ATTACHMENTS)) if (!WEAPONS[id]) bad(id, "has attachments but is not in WEAPONS", "config/attachments.js");
for (const id of Object.keys(RECOIL_ATTACHMENTS)) if (!WEAPONS[id]) bad(id, "has attachment recoil but is not in WEAPONS", "config/recoil.js");
for (const [id, gun] of Object.entries(ATTACHMENTS))
  for (const [label, icon] of [...(gun.sights ?? []), ...(gun.slots ?? []).flatMap((s) => [[s.label, s.icon], ...(s.options ?? []), ...(s.sights ?? [])])])
    if (icon && !fs.existsSync(path.join(root, "TACZ-R", icon + ".png"))) warn(id, `attachment icon ${icon}.png not found (${label})`, "config/attachments.js");

const guns = Object.keys(WEAPONS).length;
console.log(`${guns} guns, ${Object.keys(AMMO).length} ammo types checked.`);
if (warnings.length) {
  console.log(`
${warnings.length} warning(s) (missing assets, the game shows a blank icon):`);
  for (const w of warnings) console.log("  " + w);
}
if (problems.length) {
  console.log(`\n${problems.length} problem(s):`);
  for (const p of problems) console.log("  " + p);
  process.exit(1);
}
console.log("Everything matches.");
