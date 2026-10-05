// Checks that TACZ-B/scripts/config/*.js and the pack files agree, for every gun and ammo type.
// Run from the repo root (see README "Tools"). Exit code 1 if anything is wrong.
//
// For each gun it checks: BP items krep:<id> / krep:<id>_emp, RP attachables, icon, name and lore
// text, the ammo item, that it fires and reloads from the scripts (no per-gun BP controller files),
// and the stats the scripts read.
//
// Then, for the whole pack (refs.cjs): every animation, controller, model, texture, particle,
// sound, function and event something refers to exists (errors), and what is never used
// (warnings, listed with --unused).
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { pathToFileURL } from "node:url";
const require = createRequire(import.meta.url);
const { loadAll, parse } = require("./lenient.cjs");
const { checkPack } = require("./refs.cjs");

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

// Vanilla Minecraft textures menus may use (not in the pack).
const VANILLA_TEXTURES = new Set(["textures/blocks/barrier"]);

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

  // Every gun fires and reloads from the scripts (combat/firing.js, reload.js; the minigun overheats: heat.js).
  // The per-gun BP files of the old controller system must not come back (a gun cloned the old way).
  if (!w.scriptFiring) bad(id, "scriptFiring: true missing (every gun fires from combat/firing.js)", "config/weapons.js");
  if (!w.scriptReload && !w.heat) bad(id, "scriptReload missing (only a heat gun has none)", "config/weapons.js");
  if (player.events[`krep:${id}_fire`]) bad(id, `old fire event krep:${id}_fire (nothing triggers it)`, "TACZ-B/entities/player.json");
  for (const f of [`TACZ-B/animation_controllers/gun_${id}.json`, `TACZ-B/animations/guns/${id}.json`, `TACZ-B/functions/${id}quantity.mcfunction`, `TACZ-B/functions/${id}reload.mcfunction`])
    if (read(f) !== null) bad(id, "old controller-system file (the scripts do its job)", f);
  if (!bpItems.has(w.ammo)) bad(id, `ammo item ${w.ammo} does not exist`, "config/weapons.js ammo");

  // Stats the scripts read.
  const num = (v) => typeof v === "number" && Number.isFinite(v);
  if (!num(w.damage) || w.damage <= 0) bad(id, "damage missing or not a positive number", "config/weapons.js");
  if (!num(w.penetration) || w.penetration < 0 || w.penetration > 1) bad(id, "penetration must be 0..1", "config/weapons.js");
  for (const mode of ["hip", "ads"]) if (!(w.recoil?.[mode]?.length === 2 && w.recoil[mode].every(num))) bad(id, `recoil.${mode} must be [power, duration]`, "config/weapons.js");
  if (w.pellets > 1 && !(num(w.spread?.hip) && num(w.spread?.ads))) bad(id, "pellets without spread { hip, ads }", "config/weapons.js");
  if (!["semi", "burst", "auto"].includes(w.fireMode)) bad(id, `fireMode must be semi, burst or auto`, "config/weapons.js");
  if (!num(w.rpm) || w.rpm <= 0) bad(id, "rpm missing or not positive", "config/weapons.js");
  if (w.fireMode === "burst" && !(num(w.burst?.count) && num(w.burst?.rpm) && num(w.burst?.delay))) bad(id, "burst needs { count, rpm, delay }", "config/weapons.js");
  if (w.headshot != null && !(num(w.headshot) && w.headshot > 0)) bad(id, "headshot must be a positive number", "config/weapons.js");
  if (w.falloff != null) {
    const ok = Array.isArray(w.falloff) && w.falloff.length && w.falloff.every(([d, m], i) => (d === null ? i === w.falloff.length - 1 : num(d)) && num(m));
    if (!ok) bad(id, "falloff must be [[blocks, multiplier], ..., [null, multiplier]]", "config/weapons.js");
  }
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
    if (icon && !VANILLA_TEXTURES.has(icon) && !fs.existsSync(path.join(root, "TACZ-R", icon + ".png"))) warn(id, `attachment icon ${icon}.png not found (${label})`, "config/attachments.js");

// Item lore (config/lore.js) is generated from the English lang file.
{
  const { generateLore, LORE_FILE, LANG_FILE } = require("./lore.cjs");
  const crlfToLf = (s) => (s ?? "").split("\r\n").join("\n");
  if (crlfToLf(read(LORE_FILE)) !== generateLore(read(LANG_FILE))) problems.push(`${LORE_FILE} is out of date with ${LANG_FILE}: run node tools/weapons/lore.cjs`);
}
// Java attachments (java-attach.mjs): the generated list matches the model files, every gun in it exists.
{
  const dir = path.join(root, "TACZ-R/models/entity/attachments");
  const onDisk = fs.existsSync(dir) ? fs.readdirSync(dir).flatMap((g) => fs.readdirSync(path.join(dir, g)).filter((f) => f.endsWith(".geo.json")).map((f) => `${g}:${f.replace(".geo.json", "")}`)).sort() : [];
  const { MODEL_INDEX = {}, GUN_ATTACHMENTS = {} } = fs.existsSync(path.join(root, "TACZ-B/scripts/config/javaAttachments.js")) ? await cfg("javaAttachments.js") : {};
  const listed = Object.values(MODEL_INDEX).flatMap((m) => Object.keys(m)).sort();
  if (onDisk.join() !== listed.join()) problems.push(`Java attachments: config/javaAttachments.js doesn't match ${path.relative(root, dir)}: run node tools/weapons/java-attach.mjs --sync`);
  for (const g of Object.keys(GUN_ATTACHMENTS)) if (!WEAPONS[g]) problems.push(`Java attachments for "${g}", which is not a gun: node tools/weapons/java-attach.mjs --remove ${g}`);
}
// The held-gun numbers (config/held.js) cover every gun, and the RP compares them, not item names (v1.33.14).
{
  const { generateHeld, rewriteEntity, HELD_FILE, WEAPONS_FILE, ENTITY_FILE } = require("./held.cjs");
  const lf = (s) => (s ?? "").split("\r\n").join("\n");
  const held = lf(read(HELD_FILE));
  if (held !== generateHeld(read(WEAPONS_FILE), held)) problems.push(`${HELD_FILE} is out of date with ${WEAPONS_FILE}: run node tools/weapons/held.cjs`);
  else {
    let entity = lf(read(ENTITY_FILE)), rewritten;
    try {
      rewritten = rewriteEntity(entity, held);
    } catch (error) {
      problems.push(String(error.message));
    }
    if (rewritten !== undefined && rewritten !== entity) problems.push(`${ENTITY_FILE}: held-gun lines don't match ${HELD_FILE}: run node tools/weapons/held.cjs`);
    for (const id of Object.keys(WEAPONS))
      if (new RegExp(`"variable\\.${id}(b|emp) = (?!q\\.property\\('krep:held'\\))`).test(entity)) problems.push(`${ENTITY_FILE}: variable.${id}b / emp must compare krep:held (run node tools/weapons/held.cjs)`);
  }
}
// The lore's Group / Caliber / Damage follow the config (v1.32.0: ported guns showed their clone source's).
{
  const { loreFacts, loreFactsOf, catalogGroups } = await import("./config-sync.mjs");
  const { CATEGORIES } = await cfg("weapons.js");
  const en = read("TACZ-R/texts/en_US.lang");
  for (const id of Object.keys(WEAPONS)) {
    const text = lang.get(`krep:gun.${id}.lore`);
    if (text === undefined) continue; // reported above
    let want;
    try { want = loreFacts(id, WEAPONS, CATEGORIES, AMMO, en); } catch (e) { bad(id, e.message, "config/weapons.js"); continue; }
    const have = loreFactsOf(text);
    for (const k of ["group", "caliber", "damage"])
      if (have[k] !== want[k]) bad(id, `lore ${k} is "${have[k]}", the config says "${want[k]}": run node tools/weapons/config-sync.mjs`, "TACZ-R/texts/en_US.lang");
  }
  // Creative inventory: each gun in its class's group (v1.33.5: clones stayed in their source's group).
  const groups = catalogGroups(parse(read("TACZ-B/item_catalog/crafting_item_catalog.json")));
  for (const [id, w] of Object.entries(WEAPONS)) {
    const want = CATEGORIES[w.category]?.group;
    if (want && !groups[want]?.includes(`krep:${id}`)) bad(id, `not in its creative group ${want}: run node tools/weapons/config-sync.mjs`, "item_catalog/crafting_item_catalog.json");
  }
}

// Pack-wide references (refs.cjs): everything referenced exists; unused things are listed.
const pack = checkPack(root);
for (const p of pack.problems) problems.push(`${p.file}: ${p.msg}`);
const unused = pack.warnings.map((w) => `${w.file}: ${w.msg}`);

const guns = Object.keys(WEAPONS).length;
console.log(`${guns} guns, ${Object.keys(AMMO).length} ammo types and all pack references checked.`);
if (warnings.length) {
  console.log(`
${warnings.length} warning(s) (missing assets, the game shows a blank icon):`);
  for (const w of warnings) console.log("  " + w);
}
if (unused.length) {
  const all = process.argv.includes("--unused");
  console.log(`
${unused.length} unused definition(s)${all ? ":" : " (run with --unused to list them)"}`);
  if (all) for (const u of unused) console.log("  " + u);
}
if (problems.length) {
  console.log(`\n${problems.length} problem(s):`);
  for (const p of problems) console.log("  " + p);
  process.exit(1);
}
console.log("Everything matches.");
