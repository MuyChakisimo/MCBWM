// Compare two traces from run.mjs as multisets of handler runs, so module load order does not
// matter. Prints the differing handler runs grouped by their first few API calls.
// Usage: compare.mjs a.txt b.txt
import fs from "node:fs";
const [, , fa, fb] = process.argv;
function blocks(file) {
  const out = new Map();
  let head = null, body = [];
  const flush = () => {
    if (head === null) return;
    const key = head + "\n" + body.join("\n");
    out.set(key, (out.get(key) ?? 0) + 1);
  };
  for (const line of fs.readFileSync(file, "utf8").split("\n")) {
    if (line.startsWith("=== fire ")) { flush(); head = line.replace(/^=== fire /, ""); body = []; }
    else if (head !== null) body.push(line);
  }
  flush();
  return out;
}
const a = blocks(fa), b = blocks(fb);
const onlyIn = (x, y) => {
  const res = [];
  for (const [k, n] of x) { const m = y.get(k) ?? 0; for (let i = m; i < n; i++) res.push(k); }
  return res;
};
const ra = onlyIn(a, b), rb = onlyIn(b, a);
const sig = (k) => k.split("\n").slice(1).filter((l) => l.startsWith("CALL")).slice(0, 3).map((l) => l.replace(/\(.*$/, "(…)")).join(" | ") || "(no calls)";
const group = (list) => { const g = new Map(); for (const k of list) g.set(sig(k), (g.get(sig(k)) ?? 0) + 1); return [...g].sort((x, y) => y[1] - x[1]); };
console.log(`handler runs: ${[...a.values()].reduce((s, n) => s + n, 0)} vs ${[...b.values()].reduce((s, n) => s + n, 0)}; only in A: ${ra.length}, only in B: ${rb.length}`);
console.log("\nOnly in A, by first calls:"); for (const [s, n] of group(ra).slice(0, 25)) console.log(`  ${n}x ${s}`);
console.log("\nOnly in B, by first calls:"); for (const [s, n] of group(rb).slice(0, 25)) console.log(`  ${n}x ${s}`);
if (process.env.SHOW) { const k = (process.env.SHOW === "A" ? ra : rb)[+process.env.N || 0]; console.log("\nSample:\n" + k?.slice(0, 3000)); }
