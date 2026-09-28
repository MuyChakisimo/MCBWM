// Behavior trace: loads <scriptsDir>/main.js against a recording stub of @minecraft/server,
// fires every event handler / interval / timeout it registers, and writes every API call
// (path + arguments) to <out.txt>. Two script trees behave the same if their traces match.
//
// Each handler is fired once per candidate string (every string literal found in
// <stringsFromDir>, e.g. item ids like "krep:m4a1") so typeId/message comparisons take
// every branch. Use the SAME <stringsFromDir> for both runs you want to compare.
//
// Usage (see README): run.mjs <scriptsDir> <out.txt> [stringsFromDir=scriptsDir]
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
const [, , dir, out, strDir = dir] = process.argv;
const stub = await import("./stub.mjs");
const { trace, callbacks, probe } = stub;
const log = (s) => trace.push(s);
const say = console.log;
console.warn = (...a) => log("WARN " + a.join(" "));
console.log = (...a) => log("LOG " + a.join(" "));
console.error = (...a) => log("ERR " + a.join(" "));
// Error text quotes source code, which differs between equivalent programs; keep only the fact.
process.on("unhandledRejection", () => log("UNHANDLED"));

const strings = new Set([""]);
for (const f of fs.readdirSync(strDir, { recursive: true }).filter((f) => f.endsWith(".js"))) {
  const text = fs.readFileSync(path.join(strDir, f), "utf8");
  for (const m of text.matchAll(/"((?:[^"\\\n]|\\.){1,60})"/g)) {
    try { strings.add(JSON.parse(`"${m[1]}"`)); } catch {}
  }
}

try { await import(pathToFileURL(path.resolve(dir, "main.js")).href); } catch (e) { log("LOAD THROW"); process.stderr.write(`load error: ${e?.stack ?? e}\n`); }
const roots = callbacks.splice(0);
log("=== load done, root callbacks: " + roots.length);
let fired = 0;
for (const variant of [{ num: 1, bool: true }, { num: 0, bool: false }, { num: 30, bool: true }]) {
  for (const s of [...strings].sort()) {
    Object.assign(probe, variant, { str: s });
    const queue = roots.slice();
    for (let i = 0; i < queue.length && i < 200; i++) {
      const { label, fn } = queue[i];
      log(`=== fire ${label} str=${s} v=${variant.num}`);
      try {
        const r = fn(stub.default.event, stub.default.event2);
        if (r && typeof r.then === "function") await r.catch(() => log("ASYNC THROW"));
      } catch { log("THROW"); }
      fired++;
      queue.push(...callbacks.splice(0));
    }
    await new Promise((r) => setImmediate(r));
    callbacks.splice(0);
  }
}
fs.writeFileSync(out, trace.join("\n"));
say(`${out}: ${trace.length} lines, ${trace.filter((l) => l.startsWith("CALL")).length} API calls, ${fired} handler runs`);
