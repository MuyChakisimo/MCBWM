// Regression checks for recovery gaps, staged reloads and sight alignment.
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { duration, sequence } from "./import-repair.mjs";
const require = createRequire(import.meta.url);
const { parse } = require("./lenient.cjs");
const root = process.cwd();
const read = f => parse(fs.readFileSync(path.join(root, f), "utf8"));
const end = c => Array.isArray(c) ? c : Object.values(c).at(-1);

const joined = sequence([
  { animation_length: 1, bones: { hand: { position: { "0": [0, 0, 0], "1.2": [1, 2, 3] } }, shell: { scale: 0 } }, sound_effects: { "0.5": { effect: "insert" } } },
  { animation_length: 0.5, bones: { hand: { position: [4, 5, 6] } }, sound_effects: { "0.1": { effect: "click" } } },
]);
assert.equal(duration(joined), 1.7, "late recovery keys must not be cut off");
assert.deepEqual(joined.bones.hand.position["1.2"], { pre: [1, 2, 3], post: [4, 5, 6] });
assert.deepEqual(joined.bones.shell.scale["1.2"], { pre: 0, post: [1, 1, 1] }, "absent channels must reset between stages");
assert.ok(joined.sound_effects["1.3"], "second-stage cues must retain their offset");

for (const id of ["kar98", "m700", "spas12"]) {
  const rp = read(`TACZ-R/animations/guns/${id}.json`).animations;
  const bp = read(`TACZ-B/animations/guns/${id}.json`).animations;
  const role = id === "spas12" ? "pump" : "bolt";
  const action = rp[`animation.${id}.fp.${role}`];
  assert.equal(action.loop, "hold_on_last_frame", `${id}: must keep rendering during delayed server cleanup`);
  assert.equal(action.animation_length, bp[`animation.${id}.bolt`].animation_length);
  for (const role of ["reload", "tac"]) {
    const a = rp[`animation.${id}.fp.${role}`], b = bp[`animation.${id}.${role === "tac" ? "reload.tac" : role}`];
    assert.equal(a.animation_length, b.animation_length, `${id}: reload lock must match visuals`);
    assert.ok(Object.keys(b.timeline).every(t => +t <= b.animation_length), `${id}: every ammo command must run`);
  }
}
const sp = read("TACZ-R/animations/guns/spas12.json").animations;
assert.ok(Object.keys(sp["animation.spas12.fp.reload"].bones.lefthand.position).length > 10, "empty reload must move the support hand");
const bpSp = read("TACZ-B/animations/guns/spas12.json").animations;
for (const [role, count] of [["reload", 5], ["reload.tac", 5]]) {
  const commands = Object.values(bpSp[`animation.spas12.${role}`].timeline).flat();
  assert.equal(commands.filter(c => c === "/event entity @s krep:spas12_reload").length, count, "reload must neither duplicate nor lose shells");
  assert.equal(commands.filter(c => c.startsWith("/clear ")).length, count, "each awarded shell must consume one round");
}
const finish = read("TACZ-B/animation_controllers/gun_spas12.json").animation_controllers["controller.animation.spas12.reload"].states;
assert.ok(finish.reloadfinish.transitions.some(t => t.setup === "q.all_animations_finished"), "finish must wait for the closing motion");
const aim = read("TACZ-R/animations/guns/m320.json").animations["animation.m320.fp.sight"].bones.joints;
const [px, py, pz] = end(aim.position), [rx, ry, rz] = end(aim.rotation);
const r = rx * Math.PI / 180;
// Independent source sight coordinates: placing it at the eye must cancel both offset and tilt.
assert.ok(Math.abs(px + 2) < 0.001);
assert.ok(Math.abs(py + 16.54788 * Math.cos(r) - 7.95971 * Math.sin(r) - 27.5) < 0.001);
assert.ok(Math.abs(pz + 16.54788 * Math.sin(r) + 7.95971 * Math.cos(r) - 0.5) < 0.001);
assert.deepEqual([rx, ry, rz], [-7.5, 0, 0]);
for (const id of ["kar98", "m700", "spas12", "spr15"]) {
  const geo = read(`TACZ-R/models/entity/guns/${id}.geo.json`)["minecraft:geometry"][0];
  assert.equal(geo.bones.find(b => b.name === "rightArm").parent, "righthand_pos");
  assert.equal(geo.bones.find(b => b.name === "leftArm").parent, "lefthand_pos");
}
for (const id of ["cz75", "mk23"]) {
  const a = read(`TACZ-R/animations/guns/${id}.json`).animations;
  assert.deepEqual(a[`animation.${id}.fp.hold`].bones.root.rotation, a[`animation.${id}.fp.reload`].bones.root.rotation, "reload must not spin the root through 360 degrees");
}
assert.deepEqual(read("TACZ-R/animations/guns/mk23.json").animations["animation.mk23.tp.hold"].bones.joints.position, [-3.8, 17.837, -10], "retain the user's confirmed MK23 placement");
console.log("Import recovery, shell counts, hand motion and M320 sight regression checks passed.");
