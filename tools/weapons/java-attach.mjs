// Brings Java TACZ attachments (reference/TACZ-JAVA.zip) onto our guns.
//
//   node tools/weapons/java-attach.mjs <gun> [<gun> ...]   add the attachments Java allows on these guns
//   node tools/weapons/java-attach.mjs --remove <gun> ...   remove those guns' Java attachments
//   node tools/weapons/java-attach.mjs --sync               only regenerate the shared files from what is on disk
//
// Per gun (its Java id from java.cjs JAVA_TO_OURS / PORTED), for each attachment Java allows (its
// allow_attachments tag, resolved) of a type we show (SLOTS: scope, muzzle, grip, stock, laser):
//   TACZ-R/models/entity/attachments/<gun>/<att>.geo.json   geometry.tacz_att.<gun>.<att>: the gun's bone chain
//       from the root down to the mount bone (names, pivots, rotations, no cubes: so the gun's animations move it
//       exactly like the gun), then the attachment's bones (prefixed "a_") under the mount bone, moved by the mount
//       bone's pivot (the same placement as Java; checked against the original pack's built-in M4A1 sights).
//       Left out: Java's camera markers (scope_view, views). Kept: the reticle planes (division*: far in front,
//       drawn with the glow material, as the original pack's built-in sights do).
//   TACZ-R/textures/attachment/<att>.png, TACZ-R/textures/attachment/slot/<att>.png (menu icon): shared by all guns.
// Then the shared files, from every geometry on disk (so re-running is safe and removing a gun's folder removes it):
//   TACZ-B/scripts/config/javaAttachments.js (GENERATED): ATTACHMENT_INFO (name, type, icon, zoom, silencer,
//       recoil multipliers ...), GUN_ATTACHMENTS (per gun and slot, in Java's order), MODEL_INDEX (per slot,
//       "<gun>:<att>" -> the number the script writes to krep:att_<slot>).
//   TACZ-R/render_controllers/tacz_attachments.json: one render controller per slot, its geometry and texture
//       picked from arrays by krep:att_<slot> (1-based; 0 = none).
//   TACZ-R/entity/player.entity.json: the att_* geometry and texture short names and the 5 render controllers.
//   TACZ-B/entities/player.json: the properties krep:att_<slot>.
// Why per gun: an attachment must follow the gun's own moving bones (the G17's sight rides the slide), and Bedrock
// animates bones by name, so its model carries that gun's chain. Only the guns' allowed attachments get a model.
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

// ---------------------------------------------------------------- per gun
function gunGeometry(gun) {
  const f = `TACZ-R/models/entity/guns/${gun}.geo.json`;
  if (!exists(f)) throw new Error(`${gun}: no ${f}`);
  return geometryOf(parse(readText(f)));
}

/** The gun's bones from its root to the mount bone: names, parents, pivots, rotations (no cubes). */
function chainTo(geo, mount) {
  const by = Object.fromEntries(geo.bones.map((b) => [b.name, b]));
  if (!by[mount]) return null;
  const chain = [];
  for (let b = by[mount]; b; b = by[b.parent]) chain.unshift(b);
  return chain.map((b) => {
    const out = { name: b.name };
    if (b.parent) out.parent = b.parent;
    out.pivot = b.pivot ?? [0, 0, 0];
    if (b.rotation) out.rotation = b.rotation;
    return out;
  });
}

function attachmentModel(gun, geo, att) {
  const mount = MOUNT[att.index.type];
  const chain = chainTo(geo, mount);
  if (!chain) return null;
  const offset = chain[chain.length - 1].pivot;
  const jg = geometryOf(java.json(`assets/tacz/${att.display.model.replace(/^tacz:/, "geo_models/")}.json`));
  const out = new Set(jg.bones.filter((b) => LEFT_OUT.test(b.name)).map((b) => b.name));
  for (let grew = true; grew; ) { grew = false; for (const b of jg.bones) if (!out.has(b.name) && out.has(b.parent)) { out.add(b.name); grew = true; } }
  const move = (v) => v.map((x, i) => round(x + offset[i]));
  const bones = jg.bones.filter((b) => !out.has(b.name)).map((b) => {
    const bone = structuredClone(b);
    // (Letters, digits and _ only: a space in a bone name made the game reject a whole file, v1.25.1.)
    const safe = (n) => `a_${n.replace(/[^A-Za-z0-9_]/g, "_")}`;
    bone.name = safe(b.name);
    bone.parent = b.parent && !out.has(b.parent) ? safe(b.parent) : mount;
    if (bone.pivot) bone.pivot = move(bone.pivot);
    delete bone.locators;
    for (const c of bone.cubes ?? []) {
      c.origin = move(c.origin);
      if (c.pivot) c.pivot = move(c.pivot);
    }
    return bone;
  });
  const { texture_width, texture_height } = jg.description;
  return {
    format_version: "1.12.0",
    "minecraft:geometry": [{
      description: { identifier: `geometry.tacz_att.${gun}.${att.id}`, texture_width, texture_height, visible_bounds_width: 4, visible_bounds_height: 4, visible_bounds_offset: [0, 1.5, 0] },
      bones: [...chain, ...bones],
    }],
  };
}

function addGun(gun) {
  const javaGun = OURS_TO_JAVA[gun];
  if (!javaGun) throw new Error(`${gun}: no Java id (java.cjs JAVA_TO_OURS / PORTED)`);
  const geo = gunGeometry(gun);
  const added = {}, skipped = [];
  for (const att of allowedFor(javaGun)) {
    const model = attachmentModel(gun, geo, att);
    if (!model) { skipped.push(`${att.id} (no ${MOUNT[att.index.type]})`); continue; }
    writeText(`${MODELS_DIR}/${gun}/${att.id}.geo.json`, format(model));
    const tex = `assets/tacz/textures/${att.display.texture.replace(/^tacz:/, "")}.png`;
    if (!exists(`TACZ-R/textures/attachment/${att.id}.png`)) { fs.mkdirSync(abs("TACZ-R/textures/attachment/slot"), { recursive: true }); fs.writeFileSync(abs(`TACZ-R/textures/attachment/${att.id}.png`), java.read(tex)); }
    const slotIcon = att.display.slot && `assets/tacz/textures/${att.display.slot.replace(/^tacz:/, "")}.png`;
    if (slotIcon && java.has(slotIcon) && !exists(`TACZ-R/textures/attachment/slot/${att.id}.png`)) fs.writeFileSync(abs(`TACZ-R/textures/attachment/slot/${att.id}.png`), java.read(slotIcon));
    (added[att.index.type] ??= []).push(att.id);
  }
  log(`${gun} (Java ${javaGun}): ${SLOTS.map((s) => `${added[s]?.length ?? 0} ${s}`).join(", ")}${skipped.length ? `; skipped ${skipped.join(", ")}` : ""}`);
}

// ---------------------------------------------------------------- shared files
function onDisk() {
  const dir = abs(MODELS_DIR);
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir).sort().flatMap((gun) => fs.readdirSync(path.join(dir, gun)).filter((f) => f.endsWith(".geo.json")).sort().map((f) => ({ gun, id: f.replace(".geo.json", "") })));
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

function sync() {
  const pairs = onDisk();
  const atts = new Map();
  for (const { id } of pairs) if (!atts.has(id)) atts.set(id, attachment(id));
  // Per gun and slot, in Java's order (the order of allowedFor).
  const byGun = {};
  for (const { gun, id } of pairs) (byGun[gun] ??= new Set()).add(id);
  const gunAttachments = {};
  for (const [gun, ids] of Object.entries(byGun)) {
    gunAttachments[gun] = {};
    for (const a of allowedFor(OURS_TO_JAVA[gun])) if (ids.has(a.id)) (gunAttachments[gun][a.index.type] ??= []).push(a.id);
  }
  const modelIndex = Object.fromEntries(SLOTS.map((s) => [s, {}]));
  const arrays = Object.fromEntries(SLOTS.map((s) => [s, { geometries: [], textures: [], glow: new Set() }]));
  for (const [gun, slots] of Object.entries(gunAttachments))
    for (const [slot, ids] of Object.entries(slots))
      for (const id of ids) {
        arrays[slot].geometries.push(`Geometry.att_${gun}_${id}`);
        arrays[slot].textures.push(`Texture.att_${id}`);
        modelIndex[slot][`${gun}:${id}`] = arrays[slot].geometries.length;
        // Reticles and illuminated dots glow (explicit part names: no wildcard patterns needed).
        const geo = geometryOf(parse(readText(`${MODELS_DIR}/${gun}/${id}.geo.json`)));
        for (const b of geo.bones) if (b.name.startsWith("a_") && GLOW.test(b.name)) arrays[slot].glow.add(b.name);
      }
  for (const s of SLOTS) if (arrays[s].geometries.length > MAX_INDEX) throw new Error(`${s}: more than ${MAX_INDEX} models`);

  // Script config.
  const js = (v) => JSON.stringify(v);
  const infoLines = [...atts.values()].sort((a, b) => a.id.localeCompare(b.id)).map((a) => `  ${a.id}: ${js(info(a))},`);
  const gunLines = Object.entries(gunAttachments).map(([g, s]) => `  ${g}: ${js(s)},`);
  const indexLines = SLOTS.map((s) => `  ${s}: ${js(modelIndex[s])},`);
  writeText(CONFIG_FILE,
    `// GENERATED by tools/weapons/java-attach.mjs from the Java TACZ attachments: re-run it, don't edit.\n` +
    `// ATTACHMENT_INFO: per attachment its slot type, name, menu icon, zoom (scopes), magnified, silencer, recoil\n` +
    `// multipliers (pitch / yaw, 1 = unchanged). GUN_ATTACHMENTS: per gun and slot, what fits (Java's allow lists).\n` +
    `// MODEL_INDEX: per slot, "<gun>:<attachment>" -> the value of krep:att_<slot> that shows it (render controller\n` +
    `// arrays in TACZ-R/render_controllers/tacz_attachments.json; 0 = nothing).\n` +
    `export const SLOTS = ${js(SLOTS)};\n` +
    `export const ATTACHMENT_INFO = Object.freeze({\n${infoLines.join("\n")}\n});\n` +
    `export const GUN_ATTACHMENTS = Object.freeze({\n${gunLines.join("\n")}\n});\n` +
    `export const MODEL_INDEX = Object.freeze({\n${indexLines.join("\n")}\n});\n`);

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
    const text = readText(ENTITY_FILE);
    const j = parse(text);
    const d = j["minecraft:client_entity"].description;
    for (const k of Object.keys(d.geometry)) if (k.startsWith("att_")) delete d.geometry[k];
    for (const k of Object.keys(d.textures)) if (k.startsWith("att_")) delete d.textures[k];
    for (const { gun, id } of pairs) d.geometry[`att_${gun}_${id}`] = `geometry.tacz_att.${gun}.${id}`;
    for (const id of atts.keys()) d.textures[`att_${id}`] = `textures/attachment/${id}`;
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
  log(`shared files: ${pairs.length} models, ${atts.size} attachments, ${Object.keys(gunAttachments).length} gun(s)`);
}

// ---------------------------------------------------------------- main
if ((process.argv[1] ?? "").replace(/\\/g, "/").endsWith("java-attach.mjs")) {
  const args = process.argv.slice(2);
  if (!args.length) {
    console.log("usage: node tools/weapons/java-attach.mjs <gun> [<gun> ...] | --remove <gun> [<gun> ...] | --sync");
    process.exit(1);
  }
  const guns = args.filter((a) => !a.startsWith("--"));
  if (args.includes("--remove")) {
    // A gun's Java attachments go (its models); the shared files are rebuilt without them. Textures stay (shared).
    for (const gun of guns) {
      fs.rmSync(abs(`${MODELS_DIR}/${gun}`), { recursive: true, force: true });
      log(`${gun}: Java attachments removed`);
    }
  } else for (const gun of guns) addGun(gun);
  sync();
  console.log("Done. Run tools/weapons/check.mjs.");
}
