// Brings Java TACZ attachments (reference/TACZ-JAVA.zip) onto our guns.
//
//   node tools/weapons/java-attach.mjs <gun> [<gun> ...]   add the attachments Java allows on these guns
//   node tools/weapons/java-attach.mjs --remove <gun> ...   remove those guns' Java attachments
//   node tools/weapons/java-attach.mjs --sync               regenerate everything for the guns listed now
//
// The guns with Java attachments are the keys of GUN_ATTACHMENTS in the generated config; every run rebuilds all
// files from that list. Per gun (its Java id from java.cjs JAVA_TO_OURS / PORTED): the attachments Java allows (its
// allow_attachments tag, resolved) of a type we show (SLOTS: scope, muzzle, grip, stock, laser), for slots whose
// mount bone (scope_pos, muzzle_pos ...) the gun model has.
// Since v1.34.2 every attachment is ONE model shared by all guns (TACZ-R/models/entity/attachments/<att>.geo.json,
// geometry.tacz_att.<att>): Java's bones (prefixed "a_") in Java's coordinates under a root bone bound by name to
// the held gun's mount bone (Bedrock bone `binding`); the user's AKM test showed it sitting on the rail. Before,
// each gun had its own copy carrying the gun's bone chain (~40 KB per gun and attachment: 68 MB for all guns).
// Left out: Java's camera markers (scope_view, views). Kept: the reticle planes (division*: drawn with the glow
// material, as the original pack's built-in sights do).
// Textures: TACZ-R/textures/attachment/<att>.png, menu icons TACZ-R/textures/attachment/slot/<att>.png.
// Generated: TACZ-B/scripts/config/javaAttachments.js (ATTACHMENT_INFO, GUN_ATTACHMENTS, MODEL_INDEX),
// TACZ-R/render_controllers/tacz_attachments.json (one render controller per slot, its geometry and texture picked
// by krep:att_<slot>), the att_* names and the 5 render controllers in TACZ-R/entity/player.entity.json, the
// krep:att_<slot> properties in TACZ-B/entities/player.json.
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const { openJava, JAVA_TO_OURS, PORTED } = require("./java.cjs");
const { parse } = require("./lenient.cjs");
const { format } = require("./format.cjs");

const root = process.cwd();
const abs = (f) => path.join(root, f);
const exists = (f) => fs.existsSync(abs(f));
const readText = (f) => fs.readFileSync(abs(f), "utf8");
// Keep each file's line endings (Windows or Unix).
const writeText = (f, text) => {
  fs.mkdirSync(path.dirname(abs(f)), { recursive: true });
  const crlf = exists(f) && readText(f).includes("\r\n");
  fs.writeFileSync(abs(f), crlf ? text.replace(/\r?\n/g, "\r\n") : text);
};
const log = (...a) => console.log(...a);

export const SLOTS = ["scope", "muzzle", "grip", "stock", "laser"];
const MOUNT = { scope: "scope_pos", muzzle: "muzzle_pos", grip: "grip_pos", stock: "stock_pos", laser: "laser_pos" };
const LEFT_OUT = /^(scope_view|views)$/;
const ROOT_BONE = "tacz_att_root"; // bound to the gun's mount bone
const GLOW = /division|illuminated|reticle/;
const MODELS_DIR = "TACZ-R/models/entity/attachments";
const CONFIG_FILE = "TACZ-B/scripts/config/javaAttachments.js";
const RC_FILE = "TACZ-R/render_controllers/tacz_attachments.json";
const ENTITY_FILE = "TACZ-R/entity/player.entity.json";
const PLAYER_FILE = "TACZ-B/entities/player.json";
const MAX_INDEX = 2047;

const java = openJava(root);
const OURS_TO_JAVA = Object.fromEntries(Object.entries({ ...JAVA_TO_OURS, ...PORTED }).map(([j, o]) => [o, j]));
const geometryOf = (g) => g["minecraft:geometry"]?.[0] ?? Object.entries(g).find(([k, v]) => k.startsWith("geometry.") && v?.bones)?.[1];
const round = (x) => +x.toFixed(5);

// ---------------------------------------------------------------- Java data
const TAGS = "data/tacz/tacz_tags/attachments/";
function resolveTag(entries, seen = new Set()) {
  return entries.flatMap((e) => {
    if (!e.startsWith("#")) return [e.replace(/^tacz:/, "")];
    const t = e.slice(1).replace(/^tacz:/, "");
    if (seen.has(t)) return [];
    seen.add(t);
    return java.has(`${TAGS}${t}.json`) ? resolveTag(java.json(`${TAGS}${t}.json`), seen) : [];
  });
}
const LANG = java.json("assets/tacz/lang/en_us.json");
function attachment(id) {
  const indexFile = `data/tacz/index/attachments/${id}.json`;
  if (!java.has(indexFile)) return null;
  const index = java.json(indexFile);
  const display = java.json(`assets/tacz/display/attachments/${index.display.replace(/^tacz:/, "")}.json`);
  const data = java.json(`data/tacz/data/attachments/${index.data.replace(/^tacz:/, "")}.json`) ?? {};
  // (A few have no English name in Java: "laser_peq15" -> "Laser Peq15".)
  const name = (LANG[index.name] ?? id.split("_").map((w) => w[0].toUpperCase() + w.slice(1)).join(" ")).replace(/§./g, "").trim();
  return { id, index, display, data, name };
}
function allowedFor(javaGun) {
  const file = `${TAGS}allow_attachments/${javaGun}.json`;
  if (!java.has(file)) return [];
  const ids = [...new Set(resolveTag(java.json(file)))];
  return ids.map(attachment).filter((a) => a && SLOTS.includes(a.index.type) && a.display.model).sort((a, b) => (a.index.sort ?? 0) - (b.index.sort ?? 0) || a.id.localeCompare(b.id));
}

// ---------------------------------------------------------------- guns and models
/** The guns that have Java attachments: the keys of GUN_ATTACHMENTS in the generated config. */
function enabledGuns() {
  if (!exists(CONFIG_FILE)) return [];
  const block = /export const GUN_ATTACHMENTS = Object\.freeze\(\{\n([\s\S]*?)\n\}\);/.exec(readText(CONFIG_FILE).replace(/\r\n/g, "\n"));
  return block ? [...block[1].matchAll(/^ {2}([a-z0-9_]+):/gm)].map((m) => m[1]) : [];
}

/** The bone names of our gun model. */
function gunBones(gun) {
  const f = `TACZ-R/models/entity/guns/${gun}.geo.json`;
  if (!exists(f)) throw new Error(`${gun}: no ${f}`);
  return new Set(geometryOf(parse(readText(f))).bones.map((b) => b.name));
}

/** What a gun takes, per slot, in Java's order: Java's allow list, only slots whose mount bone the gun model has. */
function gunAttachments(gun) {
  const javaGun = OURS_TO_JAVA[gun];
  if (!javaGun) throw new Error(`${gun}: no Java id (java.cjs JAVA_TO_OURS / PORTED)`);
  const bones = gunBones(gun);
  const slots = {}, skipped = new Set();
  for (const att of allowedFor(javaGun)) {
    const mount = MOUNT[att.index.type];
    if (!bones.has(mount)) { skipped.add(`${att.index.type} (no ${mount})`); continue; }
    (slots[att.index.type] ??= []).push(att.id);
  }
  return { slots, skipped: [...skipped] };
}

/** One model per attachment, shared by every gun: Java's bones (prefixed "a_") under a root bone bound to the held
 * gun's mount bone by name (Bedrock bone `binding`), in Java's own coordinates. Tested on the AKM (v1.34.0): the
 * shared ACOG sat on its rail. The gun's animations move the mount bone, so the attachment follows them. */
function sharedModel(att) {
  const mount = MOUNT[att.index.type];
  const jg = geometryOf(java.json(`assets/tacz/${att.display.model.replace(/^tacz:/, "geo_models/")}.json`));
  const out = new Set(jg.bones.filter((b) => LEFT_OUT.test(b.name)).map((b) => b.name));
  for (let grew = true; grew; ) { grew = false; for (const b of jg.bones) if (!out.has(b.name) && out.has(b.parent)) { out.add(b.name); grew = true; } }
  // (Letters, digits and _ only: a space in a bone name made the game reject a whole file, v1.25.1.)
  const safe = (n) => `a_${n.replace(/[^A-Za-z0-9_]/g, "_")}`;
  const bones = jg.bones.filter((b) => !out.has(b.name)).map((b) => {
    const bone = structuredClone(b);
    bone.name = safe(b.name);
    bone.parent = b.parent && !out.has(b.parent) ? safe(b.parent) : ROOT_BONE;
    delete bone.locators;
    return bone;
  });
  const { texture_width, texture_height } = jg.description;
  return {
    format_version: "1.12.0",
    "minecraft:geometry": [{
      description: { identifier: `geometry.tacz_att.${att.id}`, texture_width, texture_height, visible_bounds_width: 4, visible_bounds_height: 4, visible_bounds_offset: [0, 1.5, 0] },
      bones: [{ name: ROOT_BONE, pivot: [0, 0, 0], binding: `'${mount}'` }, ...bones],
    }],
  };
}

function copyTextures(att) {
  fs.mkdirSync(abs("TACZ-R/textures/attachment/slot"), { recursive: true });
  const tex = `assets/tacz/textures/${att.display.texture.replace(/^tacz:/, "")}.png`;
  if (!exists(`TACZ-R/textures/attachment/${att.id}.png`)) fs.writeFileSync(abs(`TACZ-R/textures/attachment/${att.id}.png`), java.read(tex));
  const slotIcon = att.display.slot && `assets/tacz/textures/${att.display.slot.replace(/^tacz:/, "")}.png`;
  if (slotIcon && java.has(slotIcon) && !exists(`TACZ-R/textures/attachment/slot/${att.id}.png`)) fs.writeFileSync(abs(`TACZ-R/textures/attachment/slot/${att.id}.png`), java.read(slotIcon));
}

function info(att) {
  const { display, data } = att;
  const recoil = data.recoil ?? {};
  const out = { type: att.index.type, name: att.name, icon: exists(`TACZ-R/textures/attachment/slot/${att.id}.png`) ? `textures/attachment/slot/${att.id}` : `textures/attachment/${att.id}` };
  if (display.zoom?.length) out.zoom = display.zoom[0];
  if (display.scope) out.magnified = true;
  if (data.silence?.use_silence_sound) out.silencer = true;
  const pitch = recoil.pitch?.multiplier, yaw = recoil.yaw?.multiplier;
  if (pitch !== undefined || yaw !== undefined) out.recoil = { pitch: pitch ?? 1, yaw: yaw ?? 1 };
  return out;
}

// ---------------------------------------------------------------- everything, from the list of guns
function build(guns) {
  const gunList = {};
  for (const gun of [...new Set(guns)].sort()) {
    const { slots, skipped } = gunAttachments(gun);
    gunList[gun] = slots;
    log(`${gun} (Java ${OURS_TO_JAVA[gun]}): ${SLOTS.map((s) => `${slots[s]?.length ?? 0} ${s}`).join(", ")}${skipped.length ? `; no slot for ${skipped.join(", ")}` : ""}`);
  }
  // Every attachment any of these guns takes: one shared model each.
  const used = new Map();
  for (const slots of Object.values(gunList)) for (const ids of Object.values(slots)) for (const id of ids) if (!used.has(id)) used.set(id, attachment(id));
  const atts = [...used.values()].sort((a, b) => a.id.localeCompare(b.id));
  fs.mkdirSync(abs(MODELS_DIR), { recursive: true });
  const wanted = new Set(atts.map((a) => `${a.id}.geo.json`));
  for (const entry of fs.readdirSync(abs(MODELS_DIR), { withFileTypes: true }))
    if (entry.isDirectory() || !wanted.has(entry.name)) fs.rmSync(abs(`${MODELS_DIR}/${entry.name}`), { recursive: true, force: true }); // per-gun copies (before v1.34.2) and unused models
  for (const att of atts) {
    writeText(`${MODELS_DIR}/${att.id}.geo.json`, format(sharedModel(att)));
    copyTextures(att);
  }

  // Per slot: the render controller arrays and the number of each attachment (1-based, 0 = none).
  const modelIndex = Object.fromEntries(SLOTS.map((s) => [s, {}]));
  const arrays = Object.fromEntries(SLOTS.map((s) => [s, { geometries: [], textures: [], glow: new Set() }]));
  for (const att of atts) {
    const s = att.index.type, a = arrays[s];
    a.geometries.push(`Geometry.att_${att.id}`);
    a.textures.push(`Texture.att_${att.id}`);
    modelIndex[s][att.id] = a.geometries.length;
    // Reticles and illuminated dots glow (explicit part names: no wildcard patterns needed).
    for (const b of geometryOf(parse(readText(`${MODELS_DIR}/${att.id}.geo.json`))).bones) if (b.name.startsWith("a_") && GLOW.test(b.name)) a.glow.add(b.name);
  }
  for (const s of SLOTS) if (arrays[s].geometries.length > MAX_INDEX) throw new Error(`${s}: more than ${MAX_INDEX} models`);

  // Script config.
  const js = (v) => JSON.stringify(v);
  writeText(CONFIG_FILE,
    `// GENERATED by tools/weapons/java-attach.mjs from the Java TACZ attachments: re-run it, don't edit.\n` +
    `// ATTACHMENT_INFO: per attachment its slot type, name, menu icon, zoom (scopes), magnified, silencer, recoil\n` +
    `// multipliers (pitch / yaw, 1 = unchanged). GUN_ATTACHMENTS: per gun and slot, what fits (Java's allow lists,\n` +
    `// slots whose mount bone the gun model has). MODEL_INDEX: per slot, attachment -> the value of krep:att_<slot>\n` +
    `// that shows its shared model (render controller arrays in TACZ-R/render_controllers/tacz_attachments.json;\n` +
    `// 0 = nothing).\n` +
    `export const SLOTS = ${js(SLOTS)};\n` +
    `export const ATTACHMENT_INFO = Object.freeze({\n${atts.map((a) => `  ${a.id}: ${js(info(a))},`).join("\n")}\n});\n` +
    `export const GUN_ATTACHMENTS = Object.freeze({\n${Object.entries(gunList).map(([g, s]) => `  ${g}: ${js(s)},`).join("\n")}\n});\n` +
    `export const MODEL_INDEX = Object.freeze({\n${SLOTS.map((s) => `  ${s}: ${js(modelIndex[s])},`).join("\n")}\n});\n`);

  // Render controllers: one per slot.
  const rc = { format_version: "1.8.0", render_controllers: {} };
  for (const s of SLOTS) {
    if (!arrays[s].geometries.length) continue;
    const i = `q.property('krep:att_${s}') - 1`;
    rc.render_controllers[`controller.render.tacz_att_${s}`] = {
      arrays: { geometries: { "Array.geo": arrays[s].geometries }, textures: { "Array.tex": arrays[s].textures } },
      geometry: `Array.geo[${i}]`,
      materials: [{ "*": "Material.guns" }, ...[...arrays[s].glow].sort().map((b) => ({ [b]: "Material.glow" }))],
      textures: [`Array.tex[${i}]`],
      is_hurt_color: { r: 0, g: 0, b: 0, a: 0 },
      on_fire_color: { r: 0, g: 0, b: 0, a: 0 },
    };
  }
  writeText(RC_FILE, format(rc));

  // Client entity: att_* names and the render controllers.
  {
    const j = parse(readText(ENTITY_FILE));
    const d = j["minecraft:client_entity"].description;
    for (const k of Object.keys(d.geometry)) if (k.startsWith("att_")) delete d.geometry[k];
    for (const k of Object.keys(d.textures)) if (k.startsWith("att_")) delete d.textures[k];
    for (const att of atts) {
      d.geometry[`att_${att.id}`] = `geometry.tacz_att.${att.id}`;
      d.textures[`att_${att.id}`] = `textures/attachment/${att.id}`;
    }
    const ours = new Set(SLOTS.map((s) => `controller.render.tacz_att_${s}`)); // (only these: others may be listed too)
    d.render_controllers = d.render_controllers.filter((r) => !ours.has(Object.keys(typeof r === "string" ? { [r]: 1 } : r)[0]));
    for (const s of SLOTS) if (arrays[s].geometries.length) d.render_controllers.push({ [`controller.render.tacz_att_${s}`]: `q.property('krep:att_${s}') > 0` });
    writeText(ENTITY_FILE, format(j));
  }
  // Player properties.
  {
    const j = parse(readText(PLAYER_FILE));
    const props = j["minecraft:entity"].description.properties;
    for (const s of SLOTS) props[`krep:att_${s}`] = { range: [0, MAX_INDEX], default: 0, type: "int", client_sync: true };
    writeText(PLAYER_FILE, format(j));
  }
  log(`shared files: ${atts.length} attachment models for ${Object.keys(gunList).length} gun(s)`);
}

// ---------------------------------------------------------------- main
if ((process.argv[1] ?? "").replace(/\\/g, "/").endsWith("java-attach.mjs")) {
  const args = process.argv.slice(2);
  if (!args.length) {
    console.log("usage: node tools/weapons/java-attach.mjs <gun> [<gun> ...] | --remove <gun> [<gun> ...] | --sync");
    process.exit(1);
  }
  const guns = args.filter((a) => !a.startsWith("--"));
  const current = enabledGuns();
  if (args.includes("--remove")) {
    for (const gun of guns) log(`${gun}: Java attachments removed`);
    build(current.filter((g) => !guns.includes(g)));
  } else build([...current, ...guns]);
  console.log("Done. Run tools/weapons/check.mjs.");
}
