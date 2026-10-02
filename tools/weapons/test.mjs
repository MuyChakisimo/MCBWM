// Tests the weapon tools on a scratch copy of the packs (the real packs are never touched).
//
//   node tools/weapons/test.mjs            quick: a representative set of guns (a few minutes)
//   node tools/weapons/test.mjs --full     every gun (30-40 minutes)
//   node tools/weapons/test.mjs --keep     keep the scratch copy afterwards (its path is printed)
//
// Checks, each starting from the unchanged packs:
//   check      tools/weapons/check.mjs passes
//   clone      gun.mjs clone <gun> -> check.mjs passes -> gun.mjs remove -> every file identical to the start
//   remove     gun.mjs remove <gun> -> either refused (another gun uses it) or check.mjs passes
//   port       java-port.mjs <java gun> --from <gun> -> check.mjs passes -> gun.mjs remove -> identical
//              (needs reference/TACZ-JAVA.zip)
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import crypto from "node:crypto";
import { spawnSync } from "node:child_process";
import { pathToFileURL } from "node:url";

const repo = process.cwd();
const full = process.argv.includes("--full"), keep = process.argv.includes("--keep");
const QUICK = ["sks", "m4a1", "m16", "deagle", "fal", "vector", "rpg", "m870", "minigun", "cp"];
// Java guns to port, each as the test gun "zzp" (so it works whether or not the gun is in the packs).
// cz75 from the P320 covers a source gun with the other arm layout (right arm on the right hand; see
// java-port.mjs steps 4 and 7), rhino357 from the Colt Python a Java pistol from a mirrored source.
const PORTS = [["cz75", "p320"], ["rhino357", "cp"], ["spr15hb", "m4a1"], ["rpk", "type81"], ["kar98", "awp"], ["spas_12", "m870"], ["db_long", "db"]];

const walk = (d) => (fs.existsSync(d) ? fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)])) : []);
const rel = (base, f) => path.relative(base, f).split(path.sep).join("/");

// Scratch copy: the packs, the tools and (if present) the Java zip.
const work = fs.mkdtempSync(path.join(os.tmpdir(), "tacz-test-"));
for (const d of ["TACZ-B", "TACZ-R", "tools"]) fs.cpSync(path.join(repo, d), path.join(work, d), { recursive: true });
const javaZip = path.join(repo, "reference", "TACZ-JAVA.zip");
if (fs.existsSync(javaZip)) { fs.mkdirSync(path.join(work, "reference")); fs.copyFileSync(javaZip, path.join(work, "reference", "TACZ-JAVA.zip")); }

const packFiles = () => ["TACZ-B", "TACZ-R"].flatMap((d) => walk(path.join(work, d))).map((f) => rel(work, f));
const hash = (f) => crypto.createHash("md5").update(fs.readFileSync(path.join(work, f))).digest("hex");
const start = new Map(packFiles().map((f) => [f, hash(f)]));
const original = (f) => path.join(repo, f);

// Differences from the start; restore() puts the start back.
function diff() {
  const now = packFiles(), out = [];
  for (const f of now) if (!start.has(f)) out.push(`+ ${f}`); else if (start.get(f) !== hash(f)) out.push(`M ${f}`);
  for (const f of start.keys()) if (!fs.existsSync(path.join(work, f))) out.push(`- ${f}`);
  return out;
}
function restore() {
  for (const d of diff()) {
    const f = d.slice(2);
    if (d[0] === "+") fs.rmSync(path.join(work, f));
    else { fs.mkdirSync(path.dirname(path.join(work, f)), { recursive: true }); fs.copyFileSync(original(f), path.join(work, f)); }
  }
}
const run = (...args) => {
  const r = spawnSync(process.execPath, args, { cwd: work, encoding: "utf8", maxBuffer: 1 << 26 });
  return { ok: r.status === 0, out: (r.stdout ?? "") + (r.stderr ?? "") };
};
const check = () => run("tools/weapons/check.mjs");
const lastLines = (s, n = 4) => s.trim().split("\n").slice(-n).map((l) => "      " + l).join("\n");

const results = [];
const report = (name, ok, detail = "") => {
  results.push({ name, ok });
  console.log(`${ok ? "ok  " : "FAIL"} ${name}${detail ? "\n" + detail : ""}`);
};

// ---------------------------------------------------------------- tests
{
  const c = check();
  report("check.mjs on the unchanged packs", c.ok, c.ok ? "" : lastLines(c.out, 12));
  if (!c.ok) finish();
}
const { WEAPONS } = await import(pathToFileURL(path.join(work, "TACZ-B/scripts/config/weapons.js")).href);
const guns = full ? Object.keys(WEAPONS) : QUICK.filter((g) => WEAPONS[g]);

for (const g of guns) {
  const c1 = run("tools/weapons/gun.mjs", "clone", g, "zzt", "--name", "Test");
  const c2 = c1.ok ? check() : c1;
  const c3 = c1.ok ? run("tools/weapons/gun.mjs", "remove", "zzt") : { ok: true, out: "" };
  const left = diff();
  const ok = c1.ok && c2.ok && c3.ok && left.length === 0;
  report(`clone ${g}`, ok, ok ? "" : [!c1.ok && lastLines(c1.out), !c2.ok && lastLines(c2.out, 8), !c3.ok && lastLines(c3.out), left.length && "      left behind: " + left.slice(0, 5).join(", ")].filter(Boolean).join("\n"));
  restore();
}

for (const g of guns) {
  const r = run("tools/weapons/gun.mjs", "remove", g);
  const refused = !r.ok && /other files still use/.test(r.out);
  const c = r.ok ? check() : { ok: true };
  report(`remove ${g}${refused ? " (refused: other files use it)" : ""}`, refused || (r.ok && c.ok), r.ok && !c.ok ? lastLines(c.out, 8) : !r.ok && !refused ? lastLines(r.out) : "");
  restore();
}

if (fs.existsSync(path.join(work, "reference", "TACZ-JAVA.zip"))) {
  const id = "zzp";
  for (const [javaId, from] of PORTS) {
    const p = run("tools/weapons/java-port.mjs", javaId, id, "--from", from);
    const c = p.ok ? check() : p;
    const r = p.ok ? run("tools/weapons/gun.mjs", "remove", id) : { ok: true, out: "" };
    const left = diff();
    const ok = p.ok && c.ok && r.ok && left.length === 0;
    report(`port ${javaId} (from ${from})`, ok, ok ? "" : [!p.ok && lastLines(p.out, 6), !c.ok && lastLines(c.out, 8), !r.ok && lastLines(r.out), left.length && "      left behind: " + left.slice(0, 5).join(", ")].filter(Boolean).join("\n"));
    restore();
  }
} else console.log("skip port tests: reference/TACZ-JAVA.zip not found");

finish();

function finish() {
  const failed = results.filter((r) => !r.ok);
  console.log(`\n${results.length - failed.length}/${results.length} passed${failed.length ? "; failed: " + failed.map((r) => r.name).join(", ") : ""}`);
  if (keep) console.log(`scratch copy kept: ${work}`);
  else fs.rmSync(work, { recursive: true, force: true });
  process.exit(failed.length ? 1 : 0);
}
