// Usage: node --import ./tools/script-surface/register.mjs tools/script-surface/run.mjs
// Imports TACZ-B/scripts/main.js against a recording stub and prints every
// event subscription, interval and command issued at module load.
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const { records } = await import("./stub-server.mjs");
try {
  await import(pathToFileURL(path.join(root, "TACZ-B/scripts/main.js")).href);
} catch (e) {
  console.error("main.js threw during load:", e?.message ?? e);
}
const groups = {};
for (const r of records) (groups[r.module] ??= []).push(r.api.replace(/\(\)/g, "") + (r.interval !== undefined ? ` every ${r.interval}t` : ""));
for (const [m, list] of Object.entries(groups).sort()) {
  const counts = list.reduce((c, x) => ((c[x] = (c[x] ?? 0) + 1), c), {});
  console.log(m);
  for (const [k, v] of Object.entries(counts)) console.log(`   ${v > 1 ? v + "x " : ""}${k}`);
}

// Execute every interval once with 1 and 10 fake players and count API calls.
const { probe } = await import("./stub-server.mjs");
console.log("\nPer-execution API calls inside each runInterval (1 player -> 10 players):");
for (const r of records.filter((r) => r.cb)) {
  const run = (n) => {
    probe.players = n; probe.calls = {}; probe.counting = true;
    try { r.cb(); } catch (e) { probe.calls["<threw: " + String(e?.message ?? e).slice(0, 40) + ">"] = 1; }
    probe.counting = false;
    return probe.calls;
  };
  const one = run(1), ten = run(10);
  const total = (c) => Object.values(c).reduce((a, b) => a + b, 0);
  const top = Object.entries(ten).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([k, v]) => `${k}=${v}`).join(" ");
  if (probe.args?.size) { console.log("     args:", [...probe.args].join(" | ")); probe.args.clear(); }
  console.log(`  ${r.module} every ${r.interval}t: ${total(one)} -> ${total(ten)} calls  [${top}]`);
}
