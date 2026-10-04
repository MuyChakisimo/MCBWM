// Reload timing of a gun ported from Java TACZ, from Java's own numbers:
//
//   node tools/weapons/reload-timing.mjs <ourId> <javaId> [<ourId> <javaId> ...]
//
// config/weapons.js scriptReload: { empty: [load, end], tac: [load, end] } (seconds):
//   load = Java's reload.feed (when the rounds go in), end = the length of our first-person reload animation
//   (fp.reload / fp.tac, Java's animation since the port), so the animation always plays to its end.
// script-reload.mjs took the timing from the BP reload animations, which ported guns inherited from the gun they
// were cloned from (v1.31.1: the Rhino's reload ended at 2.5 s, its animation is 4.23 s). java-port.mjs runs this.
// Shell-by-shell reloads (shells) are left alone; other scriptReload keys (emptyOne ...) are kept.
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const { parse } = require("./lenient.cjs");
const { openJava } = require("./java.cjs");

/** Length of an animation: animation_length, else its last keyframe. */
function animLength(anim) {
  if (anim.animation_length) return anim.animation_length;
  const times = [];
  for (const bone of Object.values(anim.bones ?? {}))
    for (const channel of Object.values(bone)) if (channel && typeof channel === "object" && !Array.isArray(channel)) times.push(...Object.keys(channel).map(Number));
  for (const k of ["sound_effects", "particle_effects", "timeline"]) times.push(...Object.keys(anim[k] ?? {}).map(Number));
  return Math.max(0, ...times.filter((t) => !Number.isNaN(t)));
}

export function reloadTiming(root, id, javaId, log = console.log) {
  const abs = (f) => path.join(root, f);
  const feed = openJava(root).gunData(javaId).reload?.feed ?? {};
  const anims = parse(fs.readFileSync(abs(`TACZ-R/animations/guns/${id}.json`), "utf8")).animations;
  const file = abs("TACZ-B/scripts/config/weapons.js");
  const raw = fs.readFileSync(file, "utf8"), crlf = raw.includes("\r\n");
  const text = raw.replace(/\r\n/g, "\n");
  const entry = new RegExp(`(\\n  ${id}: \\{\\n[\\s\\S]*?\\n)(    scriptReload: .*)\\n`).exec(text);
  if (!entry) throw new Error(`${id}: no scriptReload line in config/weapons.js`);
  let line = entry[2];
  if (/shells:/.test(line)) return log(`   reload timing: ${id} reloads shell by shell, left alone`);
  const done = [];
  for (const [kind, java, role] of [["empty", "empty", "fp.reload"], ["tac", "tactical", "fp.tac"]]) {
    const re = new RegExp(`\\b${kind}: \\[[\\d.]+, [\\d.]+\\]`);
    const anim = anims[`animation.${id}.${role}`];
    if (!re.test(line) || !anim || feed[java] === undefined) continue;
    const end = +animLength(anim).toFixed(4);
    const load = +Math.min(feed[java], end - 0.05).toFixed(4);
    line = line.replace(re, `${kind}: [${load}, ${end}]`);
    done.push(`${kind} load ${load} s, end ${end} s`);
  }
  const out = text.slice(0, entry.index) + entry[1] + line + "\n" + text.slice(entry.index + entry[0].length);
  fs.writeFileSync(file, crlf ? out.replace(/\n/g, "\r\n") : out);
  log(`   reload timing (Java ${javaId}): ${done.join("; ") || "nothing to set"}`);
}

if (process.argv[1]?.endsWith("reload-timing.mjs")) {
  const args = process.argv.slice(2);
  if (!args.length || args.length % 2) {
    console.log("usage: node tools/weapons/reload-timing.mjs <ourId> <javaId> [<ourId> <javaId> ...]");
    process.exit(1);
  }
  for (let i = 0; i < args.length; i += 2) {
    console.log(args[i]);
    reloadTiming(process.cwd(), args[i], args[i + 1]);
  }
}
