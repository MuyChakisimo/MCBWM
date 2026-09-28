// One-time reorganization of the pack JSON into readable per-weapon files.
// Usage: reorganize.cjs <sourceRoot> <outRoot>   (outRoot gets a full copy with the new layout)
// Bedrock identifies definitions by the id inside the file, so file names/folders are free to
// change as long as every definition stays identical; verify-pack.cjs proves that afterwards.
const fs = require("fs");
const path = require("path");
const { collectDefinitions } = require("./packmap.cjs");

const [, , src, out] = process.argv;
const weaponsSrc = fs.readFileSync(path.join(src, "TACZ-B/scripts/config/weapons.js"), "utf8");
const GUNS = new Set([...weaponsSrc.matchAll(/^  ([a-z0-9]+): \{$/gm)].map((m) => m[1]));
const ammoSrc = fs.readFileSync(path.join(src, "TACZ-B/scripts/config/ammo.js"), "utf8");
const AMMO = new Set([...ammoSrc.matchAll(/^  ([a-z0-9]+): \{/gm)].map((m) => m[1]));

// Folders that are reorganized, and whether their files may go in subfolders (only where the
// original pack already used subfolders, so loading from them is proven).
const SCOPE = {
  "TACZ-B/animations": { nested: true },
  "TACZ-B/animation_controllers": { nested: false },
  "TACZ-B/items": { nested: true },
  "TACZ-B/entities": { nested: true },
  "TACZ-R/animations": { nested: true },
  "TACZ-R/animation_controllers": { nested: false },
  "TACZ-R/render_controllers": { nested: false },
  "TACZ-R/attachables": { nested: false },
  "TACZ-R/models": { nested: true },
};
const DEAD_FOLDERS = ["TACZ-B/kanjut"]; // not a Bedrock folder; never loaded

// Controllers/animations that serve every gun even though their id names one gun.
const SHARED_BY_ID = {
  "controller.animation.akm.inspect": "inspect",
  "controller.animation.universalscope": "scope",
};

const { defs, files } = collectDefinitions(src);
const scopeOf = (file) => Object.keys(SCOPE).find((d) => file.startsWith(d + "/"));

// Duplicate ids must stay in their original files (load order decides which copy wins).
const count = new Map();
for (const d of defs.filter((d) => !d.file.startsWith("TACZ-B/kanjut/"))) count.set(`${d.pack}|${d.kind}|${d.id}`, (count.get(`${d.pack}|${d.kind}|${d.id}`) ?? 0) + 1);
const isDuplicate = (d) => count.get(`${d.pack}|${d.kind}|${d.id}`) > 1;

function owner(d) {
  const id = d.id ?? "";
  if (SHARED_BY_ID[id]) return { type: "shared", name: SHARED_BY_ID[id] };
  const t = id.split(/[.:]/);
  let token;
  if (d.kind === "minecraft:item" || d.kind === "minecraft:attachable") token = t[1]?.replace(/_emp$/, "");
  else if (d.kind === "minecraft:entity") token = t[0] === "bullet" ? t[1] : t.join("_");
  else if (id.startsWith("controller.animation.") || id.startsWith("controller.render.")) token = t[2];
  else token = t[1];
  if (d.kind === "minecraft:entity" && id === "minecraft:player") return { type: "player" };
  if (GUNS.has(token)) return { type: "gun", name: token, empty: /_emp$/.test(id) };
  if (d.kind === "minecraft:item" || d.kind === "minecraft:attachable") {
    const item = t[1];
    return AMMO.has(item) ? { type: "ammo", name: item } : { type: "misc", name: item };
  }
  if (d.kind === "minecraft:entity") return { type: "entity", name: token };
  return { type: "shared", name: token || "misc" };
}

function targetPath(dir, o, d) {
  const nested = SCOPE[dir].nested;
  const kindDir = dir.split("/")[1];
  if (kindDir === "items") {
    if (o.type === "gun") return `${dir}/guns/${o.name}/${o.name}${o.empty ? "_emp" : ""}.json`;
    return `${dir}/${o.type === "ammo" ? "ammo" : "misc"}/${o.name}.json`;
  }
  if (kindDir === "entities") {
    if (o.type === "player") return `${dir}/player.json`;
    if (o.type === "gun") return `${dir}/bullet/${o.name}.json`;
    return `${dir}/${o.name}.json`;
  }
  if (kindDir === "attachables") {
    if (o.type === "gun") return `${dir}/gun_${o.name}${o.empty ? "_emp" : ""}.json`;
    return `${dir}/${o.type === "ammo" ? "ammo_" : ""}${o.name}.json`;
  }
  const base = o.type === "gun" ? o.name : o.name;
  const ext = kindDir === "models" ? ".geo.json" : ".json";
  if (kindDir === "models") return `${dir}/entity/${o.type === "gun" ? "guns" : "shared"}/${base}${ext}`;
  if (nested) return `${dir}/${o.type === "gun" ? "guns" : "shared"}/${base}${ext}`;
  return `${dir}/${o.type === "gun" ? "gun_" : "shared_"}${base}${ext}`;
}

// Group definitions into output files. One file per (path, kind, format_version).
const groups = new Map(); // key -> { path, kind, fv, defs: [] }
const keepInPlace = new Map(); // original file -> defs that stay
const skippedFiles = new Set();
for (const f of files) if (f.error && scopeOf(f.file)) skippedFiles.add(f.file); // unparseable: leave untouched
for (const d of defs) {
  const dir = scopeOf(d.file);
  if (!dir || skippedFiles.has(d.file)) continue;
  if (d.file.startsWith("TACZ-B/kanjut/")) continue;
  if (isDuplicate(d)) { (keepInPlace.get(d.file) ?? keepInPlace.set(d.file, []).get(d.file)).push(d); continue; }
  const o = owner(d);
  let p = targetPath(dir, o, d);
  const key = `${p}|${d.kind}|${d.formatVersion}`;
  if (!groups.has(key)) groups.set(key, { path: p, kind: d.kind, fv: d.formatVersion, defs: [] });
  groups.get(key).defs.push(d);
}
// Same path but different kind/format_version: suffix the file name.
const byPath = new Map();
for (const g of groups.values()) (byPath.get(g.path) ?? byPath.set(g.path, []).get(g.path)).push(g);
for (const [p, gs] of byPath) if (gs.length > 1) gs.forEach((g, i) => { if (i > 0) g.path = p.replace(/(\.geo)?\.json$/, `.${String(g.fv ?? "nofv").replace(/\./g, "_")}${g.kind === "geometry_legacy" ? "_legacy" : ""}$1.json`); });
// One-item-per-file kinds must not share a file.
for (const g of groups.values()) if (g.kind.startsWith("minecraft:") && g.defs.length > 1) throw new Error(`two ${g.kind} in ${g.path}: ${g.defs.map((d) => d.id)}`);

function render(g) {
  const j = {};
  if (g.fv !== undefined) j.format_version = g.fv;
  if (["animations", "animation_controllers", "render_controllers"].includes(g.kind)) j[g.kind] = Object.fromEntries(g.defs.map((d) => [d.id, d.json]));
  else if (g.kind === "geometry") j["minecraft:geometry"] = g.defs.map((d) => d.json);
  else if (g.kind === "geometry_legacy") for (const d of g.defs) j[d.id] = d.json;
  else j[g.kind] = g.defs[0].json;
  return stringify(j) + "\n";
}

// Readable but compact JSON: anything that fits in 100 characters stays on one line, so model
// cubes and keyframes don't explode into one number per line (keeps the pack download small).
function stringify(value, indent = "") {
  const flat = JSON.stringify(value);
  if (value === null || typeof value !== "object" || indent.length + flat.length <= 100) return spaced(value);
  const inner = indent + "  ";
  if (Array.isArray(value)) return `[\n${value.map((x) => inner + stringify(x, inner)).join(",\n")}\n${indent}]`;
  const entries = Object.entries(value).map(([k, x]) => `${inner}${JSON.stringify(k)}: ${stringify(x, inner)}`);
  return `{\n${entries.join(",\n")}\n${indent}}`;
}
// One-line JSON with a space after "," and ":" (outside strings).
function spaced(value) {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(spaced).join(", ")}]`;
  return `{${Object.entries(value).map(([k, x]) => `${JSON.stringify(k)}: ${spaced(x)}`).join(", ")}}`;
}

// Build the output tree: full copy, then replace the scoped files.
fs.rmSync(out, { recursive: true, force: true });
for (const pack of ["TACZ-B", "TACZ-R"]) fs.cpSync(path.join(src, pack), path.join(out, pack), { recursive: true });
for (const dead of DEAD_FOLDERS) fs.rmSync(path.join(out, dead), { recursive: true, force: true });
const moved = [];
for (const f of files) {
  const dir = scopeOf(f.file);
  if (!dir || skippedFiles.has(f.file) || f.error) continue;
  if (f.otherKeys.length) throw new Error("unexpected keys in " + f.file + ": " + f.otherKeys);
  if (keepInPlace.has(f.file)) continue;
  fs.rmSync(path.join(out, f.file));
  moved.push(f.file);
}
for (const [file, keep] of keepInPlace) {
  const g = { kind: keep[0].kind, fv: keep[0].formatVersion, defs: keep };
  if (keep.some((d) => d.kind !== g.kind || d.formatVersion !== g.fv)) throw new Error("mixed kept defs in " + file);
  fs.writeFileSync(path.join(out, file), render(g));
}
for (const g of groups.values()) {
  const p = path.join(out, g.path);
  if (fs.existsSync(p)) throw new Error("output collision " + g.path);
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, render(g));
}
// Remove folders left empty.
const prune = (d) => { for (const e of fs.readdirSync(d, { withFileTypes: true })) if (e.isDirectory()) prune(path.join(d, e.name)); if (!fs.readdirSync(d).length) fs.rmdirSync(d); };
for (const dir of Object.keys(SCOPE)) prune(path.join(out, dir));
console.log(`moved ${moved.length} files into ${groups.size} files; kept ${keepInPlace.size} duplicate-holding files in place; left ${skippedFiles.size} unparseable file(s) untouched`);
