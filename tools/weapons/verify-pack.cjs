// Proves two pack trees are equivalent to the game: same definitions (id -> content incl.
// format_version), same duplicate ids in the same files, and identical non-definition files.
// Usage: verify-pack.cjs <rootA> <rootB>
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { collectDefinitions, defKey, defValue } = require("./packmap.cjs");
const [, , A, B] = process.argv;
const a = collectDefinitions(A), b = collectDefinitions(B);
let errors = 0;
const err = (m) => { errors++; if (errors <= 40) console.log("  " + m); };

// Definitions (dead kanjut/ copies excluded: Bedrock never loads that folder).
const live = (d) => !d.file.startsWith("TACZ-B/kanjut/");
const multiset = (defs) => { const m = new Map(); for (const d of defs.filter(live)) { const k = defKey(d) + "\n" + defValue(d); m.set(k, (m.get(k) ?? 0) + 1); } return m; };
const ma = multiset(a.defs), mb = multiset(b.defs);
for (const [k, n] of ma) if ((mb.get(k) ?? 0) !== n) err(`definition changed/missing: ${k.split("\n")[0]}`);
for (const [k, n] of mb) if ((ma.get(k) ?? 0) !== n) err(`definition added/changed: ${k.split("\n")[0]}`);

// Duplicated ids must be in the same files as before.
const dupFiles = (defs) => { const m = new Map(); for (const d of defs.filter(live)) (m.get(defKey(d)) ?? m.set(defKey(d), []).get(defKey(d))).push(d.file); return new Map([...m].filter(([, v]) => v.length > 1).map(([k, v]) => [k, v.sort().join(",")])); };
const da = dupFiles(a.defs), db = dupFiles(b.defs);
for (const [k, v] of da) if (db.get(k) !== v) err(`duplicate ${k} moved: ${v} -> ${db.get(k)}`);
for (const k of db.keys()) if (!da.has(k)) err(`new duplicate ${k}`);

// Files without definitions (functions, sounds, textures, ui, ...) must be byte-identical.
const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)]));
const defFiles = (x) => new Set(x.files.filter((f) => f.count > 0 || f.error).map((f) => f.file));
const hashes = (root, skip) => { const m = new Map(); for (const pack of ["TACZ-B", "TACZ-R"]) for (const f of walk(path.join(root, pack))) { const rel = path.relative(root, f).split(path.sep).join("/"); if (!skip.has(rel) && !rel.startsWith("TACZ-B/kanjut/")) m.set(rel, crypto.createHash("sha1").update(fs.readFileSync(f)).digest("hex")); } return m; };
const ha = hashes(A, defFiles(a)), hb = hashes(B, defFiles(b));
for (const [f, h] of ha) if (hb.get(f) !== h) err(`non-definition file changed/missing: ${f}`);
for (const f of hb.keys()) if (!ha.has(f)) err(`new non-definition file: ${f}`);
// Unparseable files must be byte-identical and in place.
for (const f of a.files.filter((x) => x.error)) {
  const pa = path.join(A, f.file), pb = path.join(B, f.file);
  if (!fs.existsSync(pb) || !fs.readFileSync(pa).equals(fs.readFileSync(pb))) err(`unparseable file changed: ${f.file}`);
}
console.log(`${[...ma.values()].reduce((s, n) => s + n, 0)} definitions compared; ${a.files.length} -> ${b.files.length} files; ${errors} difference(s)`);
process.exit(errors ? 1 : 0);
