#!/usr/bin/env node
// =====================================================================
// TACZ Bedrock add-on static validator.
//
//   node tools/validate.mjs            -> console summary + docs/VALIDATION_REPORT.md
//   node tools/validate.mjs --strict   -> exit code 1 if any ERROR is found
//
// Cross-checks the resource pack (TACZ-R) and behavior pack (TACZ-B):
// parse errors, duplicate identifiers, unresolved geometry / texture /
// animation / render-controller / particle / sound / function references,
// render-controller key resolution against the owning entity, item icon
// resolution, BP item <-> RP attachable pairing, JS import reachability,
// manifest linkage, case mismatches, orphans and packaging junk.
//
// No dependencies. Static analysis cannot prove in-game alignment; it
// catches the missing-step and broken-link class of failures.
// =====================================================================
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const RP = path.join(ROOT, "TACZ-R");
const BP = path.join(ROOT, "TACZ-B");
const STRICT = process.argv.includes("--strict");

// ---------------------------------------------------------------------
// Identifiers supplied by the vanilla game. References to these are not
// errors even though no file in this project defines them.
// ---------------------------------------------------------------------
const VANILLA_ID_PREFIXES = [
  "animation.player.",
  "animation.humanoid.",
  "animation.skeleton.attack",
  "controller.animation.player.",
  "controller.animation.humanoid.",
  "controller.animation.persona.",
  "controller.render.player.first_person_spectator",
  "controller.render.player.third_person_spectator",
  "controller.render.item_default",
  "geometry.humanoid",
  "geometry.cape",
];
const VANILLA_TEXTURE_PREFIXES = ["textures/entity/steve", "textures/misc/enchanted_item_glint", "textures/misc/"];
const VANILLA_SOUND_PREFIXES = ["random.", "mob.", "step.", "dig.", "block.", "item.", "armor.", "game.", "use.", "fall.", "hit.", "damage.", "liquid.", "ambient."];
const isVanillaId =(id) => VANILLA_ID_PREFIXES.some((p) => id.startsWith(p));
// "textures/nothing" is intentionally absent: gun attachables use it as an
// empty texture_mesh so the vanilla item sprite is suppressed and the gun is
// drawn by the player's own render controllers instead.
const INTENTIONALLY_MISSING_TEXTURES = new Set(["textures/nothing"]);
const isVanillaTexture = (t) => INTENTIONALLY_MISSING_TEXTURES.has(t) || VANILLA_TEXTURE_PREFIXES.some((p) => t.startsWith(p));

// ---------------------------------------------------------------------
const findings = []; // {level, category, message, file}
const add = (level, category, message, file = "") => findings.push({ level, category, message, file: file && rel(file) });
const rel = (p) => path.relative(ROOT, p).split(path.sep).join("/");

function walk(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else out.push(p);
  }
  return out;
}

function parseJsonLenient(text) {
  try {
    return JSON.parse(text);
  } catch {
    // Bedrock tolerates comments and trailing commas.
    let s = text.replace(/^\uFEFF/, "");
    s = s.replace(/("(?:\\.|[^"\\])*")|\/\/[^\n]*|\/\*[\s\S]*?\*\//g, (m, str) => str ?? "");
    s = s.replace(/,(\s*[}\]])/g, "$1");
    return JSON.parse(s);
  }
}

const jsonCache = new Map();
function readJson(file) {
  if (jsonCache.has(file)) return jsonCache.get(file);
  let v = null;
  try {
    v = parseJsonLenient(fs.readFileSync(file, "utf8"));
  } catch (e) {
    add("ERROR", "parse", `JSON parse failure: ${e.message}`, file);
  }
  jsonCache.set(file, v);
  return v;
}

// Case-sensitive existence check (Bedrock on Android/iOS/Linux is case sensitive).
const dirListing = new Map();
function existsExact(p) {
  const dir = path.dirname(p);
  if (!dirListing.has(dir)) dirListing.set(dir, fs.existsSync(dir) ? fs.readdirSync(dir) : []);
  return dirListing.get(dir).includes(path.basename(p));
}
function resolveAsset(pack, ref, exts) {
  if (path.extname(ref) && existsExact(path.join(pack, ref))) return { ok: true, path: path.join(pack, ref) };
  for (const ext of exts) {
    const p = path.join(pack, ref + ext);
    if (existsExact(p)) return { ok: true, path: p };
  }
  for (const ext of exts) {
    const p = path.join(pack, ref + ext);
    if (fs.existsSync(p)) return { ok: false, caseMismatch: true, path: p };
  }
  return { ok: false };
}
const TEX_EXT = [".png", ".tga", ".jpg", ".jpeg"];

// Registry of identifier -> [{file, json}] with duplicate detection.
class Registry {
  constructor(kind) {
    this.kind = kind;
    this.map = new Map();
  }
  add(id, file, value) {
    if (!id) return;
    if (!this.map.has(id)) this.map.set(id, []);
    this.map.get(id).push({ file, value });
  }
  has(id) {
    return this.map.has(id);
  }
  reportDuplicates() {
    for (const [id, defs] of this.map) {
      if (defs.length < 2) continue;
      const bodies = new Set(defs.map((d) => JSON.stringify(d.value)));
      const files = defs.map((d) => rel(d.file)).join(", ");
      if (bodies.size > 1) add("ERROR", `duplicate-${this.kind}`, `"${id}" defined ${defs.length}x with DIFFERENT content (load-order dependent): ${files}`);
      else add("WARN", `duplicate-${this.kind}`, `"${id}" defined ${defs.length}x (identical copies): ${files}`);
    }
  }
}

// =====================================================================
// 1. Index the resource pack
// =====================================================================
const rpFiles = walk(RP);
const RP_DEF_DIRS = ["entity", "attachables", "render_controllers", "animations", "animation_controllers", "models", "particles"];
const inDirRp = (f) => RP_DEF_DIRS.some((d) => rel(f).startsWith(`${rel(RP)}/${d}/`));
const bpFiles = walk(BP);
const reg = {
  clientEntity: new Registry("client-entity"),
  attachable: new Registry("attachable"),
  renderController: new Registry("render-controller"),
  animation: new Registry("animation"),
  animationController: new Registry("animation-controller"),
  geometry: new Registry("geometry"),
  particle: new Registry("particle"),
  bpEntity: new Registry("bp-entity"),
  bpItem: new Registry("bp-item"),
  bpAnimation: new Registry("bp-animation"),
  bpAnimationController: new Registry("bp-animation-controller"),
};

for (const f of rpFiles.filter((f) => f.endsWith(".json"))) {
  if (!inDirRp(f)) continue;
  const d = readJson(f);
  if (!d || typeof d !== "object") continue;
  if (d["minecraft:client_entity"]) reg.clientEntity.add(d["minecraft:client_entity"].description?.identifier, f, d);
  if (d["minecraft:attachable"]) reg.attachable.add(d["minecraft:attachable"].description?.identifier, f, d);
  if (d.render_controllers && typeof d.render_controllers === "object" && !Array.isArray(d.render_controllers))
    for (const [id, v] of Object.entries(d.render_controllers)) reg.renderController.add(id, f, v);
  if (d.animations && typeof d.animations === "object" && !d["minecraft:client_entity"] && !d["minecraft:attachable"])
    for (const [id, v] of Object.entries(d.animations)) reg.animation.add(id, f, v);
  if (d.animation_controllers) for (const [id, v] of Object.entries(d.animation_controllers)) reg.animationController.add(id, f, v);
  if (Array.isArray(d["minecraft:geometry"])) for (const g of d["minecraft:geometry"]) reg.geometry.add(g?.description?.identifier, f, g);
  for (const [k, v] of Object.entries(d)) if (k.startsWith("geometry.")) reg.geometry.add(k.split(":")[0], f, v);
  if (d.particle_effect) reg.particle.add(d.particle_effect.description?.identifier, f, d);
}
// Bedrock only loads definitions from these folders; templates/ and other
// scratch folders are not part of the runtime.
const inDir = (f, pack, ...dirs) => dirs.some((d) => rel(f).startsWith(`${rel(pack)}/${d}/`));
for (const f of bpFiles.filter((f) => f.endsWith(".json") && inDir(f, BP, "entities", "items", "animations", "animation_controllers"))) {
  const d = readJson(f);
  if (!d || typeof d !== "object") continue;
  if (d["minecraft:entity"]) reg.bpEntity.add(d["minecraft:entity"].description?.identifier, f, d);
  if (d["minecraft:item"]) reg.bpItem.add(d["minecraft:item"].description?.identifier, f, d);
  if (d.animations && !d["minecraft:entity"]) for (const [id, v] of Object.entries(d.animations)) reg.bpAnimation.add(id, f, v);
  if (d.animation_controllers) for (const [id, v] of Object.entries(d.animation_controllers)) reg.bpAnimationController.add(id, f, v);
}
Object.values(reg).forEach((r) => r.reportDuplicates());

// Sound definitions
const soundDefFile = path.join(RP, "sounds", "sound_definitions.json");
const soundDefsRaw = fs.existsSync(soundDefFile) ? readJson(soundDefFile) : {};
const soundDefs = soundDefsRaw?.sound_definitions ?? soundDefsRaw ?? {};
const referencedSoundFiles = new Set();
for (const [event, def] of Object.entries(soundDefs)) {
  if (event === "format_version" || typeof def !== "object") continue;
  for (const s of def.sounds ?? []) {
    const name = typeof s === "string" ? s : s?.name;
    if (!name) continue;
    const r = resolveAsset(RP, name, [".ogg", ".wav", ".fsb", ""]);
    if (r.ok) referencedSoundFiles.add(r.path);
    else if (r.caseMismatch) add("ERROR", "case-mismatch", `sound "${event}" -> "${name}" differs only by case from an existing file`, soundDefFile);
    else if (!name.startsWith("sounds/") || fs.existsSync(path.join(RP, "sounds")))
      add("WARN", "missing-sound-file", `sound event "${event}" -> "${name}" has no audio file`, soundDefFile);
  }
}

// Item texture atlas
const itemTexFile = path.join(RP, "textures", "item_texture.json");
const itemTextures = (fs.existsSync(itemTexFile) && readJson(itemTexFile)?.texture_data) || {};
const texturesReferenced = new Set();
function noteTexture(ref, owner, label) {
  if (!ref || typeof ref !== "string") return;
  if (isVanillaTexture(ref)) return;
  const r = resolveAsset(RP, ref, TEX_EXT);
  if (r.ok) texturesReferenced.add(r.path);
  else if (r.caseMismatch) add("ERROR", "case-mismatch", `${label}: "${ref}" differs only by case`, owner);
  else add("ERROR", "missing-texture", `${label}: "${ref}" does not exist`, owner);
}
for (const [key, v] of Object.entries(itemTextures)) {
  const t = v?.textures;
  for (const ref of Array.isArray(t) ? t : [t]) noteTexture(typeof ref === "object" ? ref?.path : ref, itemTexFile, `item_texture "${key}"`);
}
const terrainTexFile = path.join(RP, "textures", "terrain_texture.json");
if (fs.existsSync(terrainTexFile))
  for (const [key, v] of Object.entries(readJson(terrainTexFile)?.texture_data ?? {})) {
    const t = v?.textures;
    for (const ref of Array.isArray(t) ? t : [t]) noteTexture(typeof ref === "object" ? ref?.path : ref, terrainTexFile, `terrain_texture "${key}"`);
  }

// =====================================================================
// 2. Client entities and attachables: resolve every reference
// =====================================================================
const geometryReferenced = new Set();
const animationReferenced = new Set();
const rcReferenced = new Set();

function checkRenderable(kind, id, file, desc) {
  const label = `${kind} ${id}`;
  const geo = desc.geometry ?? {};
  const tex = desc.textures ?? {};
  const mat = desc.materials ?? {};
  for (const [k, g] of Object.entries(geo)) {
    geometryReferenced.add(g);
    if (!reg.geometry.has(g) && !isVanillaId(g)) add("ERROR", "missing-geometry", `${label}: geometry.${k} -> "${g}" is not defined`, file);
  }
  for (const [k, t] of Object.entries(tex)) noteTexture(t, file, `${label}: texture.${k}`);
  for (const [k, a] of Object.entries(desc.animations ?? {})) {
    animationReferenced.add(a);
    if (!reg.animation.has(a) && !reg.animationController.has(a) && !isVanillaId(a))
      add("ERROR", "missing-animation", `${label}: animation "${k}" -> "${a}" is not defined`, file);
  }
  for (const [k, p] of Object.entries(desc.particle_effects ?? {}))
    if (!reg.particle.has(p) && !p.startsWith("minecraft:")) add("ERROR", "missing-particle", `${label}: particle "${k}" -> "${p}" is not defined`, file);
  for (const [k, s] of Object.entries(desc.sound_effects ?? {})) {
    const ev = s?.effect ?? s;
    if (typeof ev === "string" && !soundDefs[ev] && !VANILLA_SOUND_PREFIXES.some((p) => ev.startsWith(p)))
      add("WARN", "missing-sound-event", `${label}: sound "${k}" -> "${ev}" has no sound definition`, file);
  }

  const keysOf = (o) => new Set(Object.keys(o).map((k) => k.toLowerCase()));
  const geoK = keysOf(geo), texK = keysOf(tex), matK = keysOf(mat);
  for (const entry of desc.render_controllers ?? []) {
    const [rcId, cond] = typeof entry === "string" ? [entry, null] : Object.entries(entry)[0];
    rcReferenced.add(rcId);
    if (!reg.renderController.has(rcId)) {
      if (!isVanillaId(rcId)) add("ERROR", "missing-render-controller", `${label}: render controller "${rcId}" is not defined`, file);
      continue;
    }
    for (const def of reg.renderController.map.get(rcId)) {
      const body = JSON.stringify(def.value);
      const arrays = new Set();
      for (const group of Object.values(def.value.arrays ?? {})) for (const a of Object.keys(group)) arrays.add(a.toLowerCase().replace(/^array\./, ""));
      const check = (re, pool, what) => {
        for (const m of body.matchAll(re)) if (!pool.has(m[1].toLowerCase())) add("ERROR", "unresolved-rc-key", `${label}: ${rcId} uses ${what}.${m[1]} which ${kind} does not declare`, def.file);
      };
      check(/\bgeometry\.([A-Za-z0-9_]+)/gi, geoK, "Geometry");
      check(/\btexture\.([A-Za-z0-9_]+)/gi, texK, "Texture");
      check(/\bmaterial\.([A-Za-z0-9_]+)/gi, matK, "Material");
      for (const m of body.matchAll(/\barray\.([A-Za-z0-9_]+)/gi))
        if (!arrays.has(m[1].toLowerCase())) add("ERROR", "unresolved-rc-key", `${label}: ${rcId} uses Array.${m[1]} which it does not define`, def.file);
    }
    if (cond && typeof cond === "string" && /variable\.is_third_person\b/.test(cond) && rcId === "controller.render.player.third_person")
      add("WARN", "fragile-visibility", `${label}: base body render controller depends on a pre_animation variable; use !variable.is_first_person && !variable.map_face_icon`, file);
  }
}

for (const [id, defs] of reg.clientEntity.map)
  for (const { file, value } of defs) checkRenderable("client_entity", id, file, value["minecraft:client_entity"].description);
for (const [id, defs] of reg.attachable.map)
  for (const { file, value } of defs) checkRenderable("attachable", id, file, value["minecraft:attachable"].description);

// RC Molang predicate sanity on the player: every weapon RC must be gated.
const playerDefs = reg.clientEntity.map.get("minecraft:player") ?? [];
if (playerDefs.length === 1) {
  const desc = playerDefs[0].value["minecraft:client_entity"].description;
  const pre = (desc.scripts?.pre_animation ?? []).join("\n");
  const defined = new Set([...pre.matchAll(/\b(?:variable|v)\.([a-z0-9_]+)\s*=/gi)].map((m) => m[1].toLowerCase()));
  (desc.scripts?.initialize ?? []).join("\n").replace(/\b(?:variable|v)\.([a-z0-9_]+)\s*=/gi, (_, n) => defined.add(n.toLowerCase()));
  const ENGINE_VARS = new Set(["is_first_person", "map_face_icon", "attack_time", "is_paperdoll", "is_brandishing_spear", "is_holding_spyglass", "player_x_rotation", "gliding_speed_value", "is_using_brush", "is_tooting_goat_horn", "item_use_normalized", "is_horizontal_splitscreen", "is_vertical_splitscreen", "is_holding_left", "is_holding_right", "melee_spear_java_to_bedrock_scale"]);
  for (const entry of desc.render_controllers ?? []) {
    if (typeof entry === "string") continue;
    const [rcId, cond] = Object.entries(entry)[0];
    for (const m of cond.matchAll(/\b(?:variable|v)\.([a-z0-9_]+)/gi)) {
      const n = m[1].toLowerCase();
      if (!defined.has(n) && !ENGINE_VARS.has(n)) add("WARN", "undefined-molang-variable", `minecraft:player RC ${rcId} condition reads variable.${m[1]} which is never assigned`, playerDefs[0].file);
    }
  }
} else if (playerDefs.length > 1) add("ERROR", "duplicate-client-entity", "minecraft:player client entity defined more than once");

// =====================================================================
// 3. Behavior pack references
// =====================================================================
const functionDir = path.join(BP, "functions");
const functionsReferenced = new Set();
function checkCommand(cmd, file) {
  const m = cmd.match(/^\s*\/?function\s+([^\s]+)/);
  if (m) {
    const p = path.join(functionDir, m[1] + ".mcfunction");
    functionsReferenced.add(p);
    if (!existsExact(p)) add("ERROR", "missing-function", `"/function ${m[1]}" has no functions/${m[1]}.mcfunction`, file);
  }
  for (const a of cmd.matchAll(/playanimation\s+\S+\s+(animation\.[A-Za-z0-9_.]+|controller\.[A-Za-z0-9_.]+)/g)) {
    animationReferenced.add(a[1]);
    if (!reg.animation.has(a[1]) && !isVanillaId(a[1])) add("ERROR", "missing-animation", `playanimation of "${a[1]}" which the RP does not define`, file);
  }
}

for (const [id, defs] of reg.bpEntity.map)
  for (const { file, value } of defs) {
    const desc = value["minecraft:entity"].description;
    for (const [k, a] of Object.entries(desc.animations ?? {}))
      if (!reg.bpAnimation.has(a) && !reg.bpAnimationController.has(a)) add("ERROR", "missing-bp-animation", `BP entity ${id}: animation "${k}" -> "${a}" is not defined`, file);
    for (const [ev, body] of Object.entries(value["minecraft:entity"].events ?? {})) {
      // Only "add" matters: removing an absent group is a no-op.
      const added = [];
      const collect = (o) => {
        if (Array.isArray(o)) return o.forEach(collect);
        if (!o || typeof o !== "object") return;
        if (o.add?.component_groups) added.push(...o.add.component_groups);
        Object.values(o).forEach(collect);
      };
      collect(body);
      for (const name of new Set(added))
        if (!value["minecraft:entity"].component_groups?.[name]) add("WARN", "missing-component-group", `BP entity ${id}: event "${ev}" adds component group "${name}" which does not exist`, file);
    }
  }

function scanStrings(o, fn) {
  if (typeof o === "string") fn(o);
  else if (Array.isArray(o)) o.forEach((v) => scanStrings(v, fn));
  else if (o && typeof o === "object") Object.values(o).forEach((v) => scanStrings(v, fn));
}
// Entity events run commands via queue_command (no leading slash).
for (const [, defs] of reg.bpEntity.map) for (const { file, value } of defs) scanStrings(value["minecraft:entity"].events ?? {}, (s) => /^(function|playanimation)\s/.test(s) && checkCommand(s, file));
for (const [, defs] of reg.bpAnimationController.map) for (const { file, value } of defs) scanStrings(value, (s) => s.startsWith("/") && checkCommand(s.slice(1), file));
for (const [, defs] of reg.bpAnimation.map) for (const { file, value } of defs) scanStrings(value.timeline ?? {}, (s) => s.startsWith("/") && checkCommand(s.slice(1), file));
for (const f of bpFiles.filter((f) => f.endsWith(".mcfunction")))
  for (const line of fs.readFileSync(f, "utf8").split(/\r?\n/)) if (line.trim() && !line.trim().startsWith("#")) checkCommand(line.replace(/^.*?\brun\s+/, ""), f);
const tickFile = path.join(functionDir, "tick.json");
if (fs.existsSync(tickFile)) for (const v of readJson(tickFile)?.values ?? []) checkCommand(`function ${v}`, tickFile);

// Items: icon resolution + weapon attachable pairing
for (const [id, defs] of reg.bpItem.map)
  for (const { file, value } of defs) {
    const comps = value["minecraft:item"].components ?? {};
    const icon = comps["minecraft:icon"];
    const iconKey = typeof icon === "string" ? icon : icon?.texture ?? icon?.textures?.default;
    if (iconKey && !itemTextures[iconKey]) add("ERROR", "missing-item-icon", `item ${id}: icon "${iconKey}" is not a key in textures/item_texture.json`, file);
  }

// =====================================================================
// 4. Scripts: import graph from the manifest entry point
// =====================================================================
const bpManifest = readJson(path.join(BP, "manifest.json"));
const rpManifest = readJson(path.join(RP, "manifest.json"));
const entry = bpManifest?.modules?.find((m) => m.type === "script")?.entry;
const jsFiles = bpFiles.filter((f) => f.endsWith(".js"));
const reachable = new Set();
if (entry) {
  const stack = [path.join(BP, entry)];
  while (stack.length) {
    const f = stack.pop();
    if (reachable.has(f)) continue;
    if (!fs.existsSync(f)) {
      add("ERROR", "missing-import", `import target does not exist: ${rel(f)}`);
      continue;
    }
    reachable.add(f);
    const src = fs.readFileSync(f, "utf8");
    for (const m of src.matchAll(/(?:import|export)\s[^'"]*?from\s*["'](\.[^"']+)["']|import\s*["'](\.[^"']+)["']|import\(\s*["'](\.[^"']+)["']\s*\)/g)) {
      const spec = m[1] ?? m[2] ?? m[3];
      stack.push(path.resolve(path.dirname(f), spec));
    }
    // Literal animation / sound references in scripts.
    for (const a of src.matchAll(/["'`](animation\.[A-Za-z0-9_.]+)["'`]/g)) animationReferenced.add(a[1]);
  }
  for (const f of jsFiles) if (!reachable.has(f)) add("WARN", "unreachable-script", `not imported (directly or transitively) from ${entry}`, f);
}

// =====================================================================
// 4b. Weapon completeness: every registry entry must be wired end to end.
// config/weapons.js has no @minecraft imports, so the real registry is
// loaded here. This is the "did I forget a step when adding a weapon"
// check documented in docs/ARCHITECTURE.md.
// =====================================================================
let weaponCount = 0;
try {
  const { WEAPONS } = await import(new URL(`file://${path.join(BP, "scripts/config/weapons.js")}`).href);
  const player = reg.clientEntity.map.get("minecraft:player")?.[0]?.value["minecraft:client_entity"].description;
  const pre = (player?.scripts?.pre_animation ?? []).join("\n");
  const playerGeo = new Set(Object.keys(player?.geometry ?? {}));
  const javaRc = reg.renderController.map.get("controller.render.java_import_weapon")?.[0]?.value;
  const javaRcGeo = new Set((javaRc?.arrays?.geometries?.["Array.java_import_geometry"] ?? []).map((g) => g.replace(/^Geometry\./, "")));
  for (const [id, w] of Object.entries(WEAPONS)) {
    weaponCount++;
    // Script-played clips are named via template strings; count them as used.
    for (const a of Object.values(w.animations ?? {})) animationReferenced.add(a);
    const where = `TACZ-B/scripts/config/weapons.js (${id})`;
    const need = (cond, msg) => cond || add("ERROR", "weapon-incomplete", `${id}: ${msg}`, path.join(ROOT, "TACZ-B/scripts/config/weapons.js"));
    need(reg.bpItem.has(`krep:${id}`), `no BP item krep:${id}`);
    need(reg.attachable.has(`krep:${id}`), `no RP attachable krep:${id} (vanilla item sprite would show in third person)`);
    if (w.ammoItem) need(reg.bpItem.has(w.ammoItem), `ammo item ${w.ammoItem} is not a BP item`);
    need(new RegExp(`(?:variable|v)\\.${id}\\s*=`).test(pre), `player.entity.json pre_animation never assigns variable.${id} (renderer cannot detect it)`);
    if (w.modularInput) {
      need(playerGeo.has(id) && javaRcGeo.has(id), `modular weapon not in player geometry map + controller.render.java_import_weapon arrays`);
      need(reg.animation.has(w.animations?.shoot), `shoot animation ${w.animations?.shoot} not defined in RP`);
      for (const k of ["reloadEmpty", "reloadTactical"]) need(reg.animation.has(w.animations?.[k]), `${k} animation ${w.animations?.[k]} not defined in RP`);
      for (const k of ["shoot", "reloadEmpty", "reloadTactical"]) if (w.sounds?.[k] && !soundDefs[w.sounds[k]]) add("WARN", "weapon-incomplete", `${id}: ${k} sound ${w.sounds[k]} has no sound definition`, where);
    } else {
      // Legacy weapons render through the player entity itself: a geometry
      // key, and at least one render controller in the player's list whose
      // condition reads variable.<id>.
      const listed = (player?.render_controllers ?? []).some((e) => typeof e === "object" && new RegExp(`(?:variable|v)\\.${id}\\b`).test(Object.values(e)[0]));
      need(listed, `no render controller in player.entity.json is gated on variable.${id} (weapon can never be drawn)`);
      need(playerGeo.has(id) || [...(player?.render_controllers ?? [])].some((e) => typeof e === "object" && /universal/.test(Object.keys(e)[0]) && new RegExp(`(?:variable|v)\\.${id}\\b`).test(Object.values(e)[0])), `player.entity.json has no geometry key "${id}" and no universal first-person rig for it`);
    }
  }
} catch (e) {
  add("ERROR", "weapon-registry", `could not load TACZ-B/scripts/config/weapons.js: ${e.message}`);
}

// =====================================================================
// 5. Manifests
// =====================================================================
if (bpManifest && rpManifest) {
  const bpUuid = bpManifest.header?.uuid, rpUuid = rpManifest.header?.uuid;
  const deps = (m) => (m.dependencies ?? []).map((d) => d.uuid).filter(Boolean);
  if (!deps(bpManifest).includes(rpUuid)) add("ERROR", "manifest", "behavior pack does not depend on the resource pack UUID");
  if (!deps(rpManifest).includes(bpUuid)) add("WARN", "manifest", "resource pack does not depend on the behavior pack UUID");
  for (const [n, m] of [["BP", bpManifest], ["RP", rpManifest]]) {
    const hv = JSON.stringify(m.header?.version);
    for (const mod of m.modules ?? []) if (JSON.stringify(mod.version) !== hv) add("WARN", "manifest", `${n} module ${mod.type} version ${JSON.stringify(mod.version)} != header ${hv}`);
  }
  for (const d of bpManifest.dependencies ?? [])
    if (d.uuid === rpUuid && JSON.stringify(d.version) !== JSON.stringify(rpManifest.header.version)) add("WARN", "manifest", "BP dependency version does not match RP header version");
  const rpEngine = (rpManifest.header?.min_engine_version ?? []).join(".");
  if (rpEngine !== "1.20.0") add("WARN", "manifest", `RP min_engine_version is ${rpEngine}; player.entity.json was validated under 1.20.0 (Molang semantics are version-gated)`);
}

// =====================================================================
// 6. Orphans and packaging junk
// =====================================================================
const allRpText = rpFiles.filter((f) => f.endsWith(".json")).map((f) => fs.readFileSync(f, "utf8")).join("\n");
for (const [id, defs] of reg.geometry.map)
  if (!geometryReferenced.has(id)) add("INFO", "orphan-geometry", `geometry "${id}" is not referenced by any client entity or attachable`, defs[0].file);
for (const f of rpFiles.filter((f) => TEX_EXT.includes(path.extname(f).toLowerCase()) && rel(f).startsWith("TACZ-R/textures/"))) {
  if (texturesReferenced.has(f)) continue;
  const key = rel(f).replace(/^TACZ-R\//, "").replace(/\.[^.]+$/, "");
  if (!allRpText.includes(key) && !/textures\/(ui|gui|blocks|environment|particle)\//.test(key)) add("INFO", "orphan-texture", `texture "${key}" is not referenced`, f);
}
// Animation controllers reference animations by the owning entity's short
// name, so an animation is only an orphan when no entity/attachable map,
// command or script mentions its full identifier.
for (const [id, defs] of reg.animation.map)
  if (!animationReferenced.has(id))
    add("INFO", "orphan-animation", `animation "${id}" is not referenced by any entity, attachable, command or script`, defs[0].file);
for (const f of rpFiles.filter((f) => /\.(ogg|wav|fsb)$/i.test(f))) if (!referencedSoundFiles.has(f)) add("INFO", "orphan-sound", "audio file not referenced by sound_definitions.json", f);
for (const f of [...rpFiles, ...bpFiles]) {
  const b = path.basename(f);
  if (b === ".DS_Store" || b.startsWith("._") || rel(f).includes("__MACOSX/")) add("ERROR", "packaging-junk", "macOS metadata must not ship", f);
  if (/ copy\.json$/.test(b)) add("WARN", "packaging-junk", "Finder-style ' copy' duplicate", f);
}

// =====================================================================
// Report
// =====================================================================
const order = { ERROR: 0, WARN: 1, INFO: 2 };
findings.sort((a, b) => order[a.level] - order[b.level] || a.category.localeCompare(b.category) || a.message.localeCompare(b.message));
const counts = findings.reduce((c, f) => ((c[f.level] = (c[f.level] ?? 0) + 1), c), {});
const byCat = {};
for (const f of findings) (byCat[`${f.level} ${f.category}`] ??= []).push(f);

let md = `# Validation Report\n\nGenerated by \`node tools/validate.mjs\`. Do not edit by hand.\n\n`;
md += `| Level | Count |\n|---|---|\n| ERROR | ${counts.ERROR ?? 0} |\n| WARN | ${counts.WARN ?? 0} |\n| INFO | ${counts.INFO ?? 0} |\n\n`;
md += `Indexed: ${weaponCount} registered weapons, ${reg.clientEntity.map.size} client entities, ${reg.attachable.map.size} attachables, ${reg.renderController.map.size} render controllers, ${reg.animation.map.size} RP animations, ${reg.animationController.map.size} RP animation controllers, ${reg.geometry.map.size} geometries, ${reg.bpItem.map.size} BP items, ${reg.bpEntity.map.size} BP entities, ${reachable.size}/${jsFiles.length} reachable scripts.\n\n`;
md += `## Summary by category\n\n| Level | Category | Count |\n|---|---|---|\n`;
for (const [k, v] of Object.entries(byCat)) md += `| ${k.split(" ")[0]} | ${k.split(" ")[1]} | ${v.length} |\n`;
for (const [k, v] of Object.entries(byCat)) {
  md += `\n## ${k}\n\n`;
  for (const f of v.slice(0, 400)) md += `- ${f.message}${f.file ? ` — \`${f.file}\`` : ""}\n`;
  if (v.length > 400) md += `- … ${v.length - 400} more\n`;
}
fs.mkdirSync(path.join(ROOT, "docs"), { recursive: true });
fs.writeFileSync(path.join(ROOT, "docs", "VALIDATION_REPORT.md"), md);

console.log(`TACZ validator: ${counts.ERROR ?? 0} error(s), ${counts.WARN ?? 0} warning(s), ${counts.INFO ?? 0} info`);
for (const [k, v] of Object.entries(byCat)) console.log(`  ${k.padEnd(40)} ${v.length}`);
for (const f of findings.filter((f) => f.level === "ERROR").slice(0, 40)) console.log(`  ERROR ${f.category}: ${f.message}${f.file ? ` (${f.file})` : ""}`);
console.log("Full report: docs/VALIDATION_REPORT.md");
if (STRICT && counts.ERROR) process.exit(1);
