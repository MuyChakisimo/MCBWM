// Puts a gun's first-person arms on their own hand bones, copying the arm offsets of a gun that
// already holds correctly (default: the P320).
//
//   node tools/weapons/arm-layout.mjs <gun> [<gun> ...] [--like p320]
//
// Two arm layouts exist. Most guns hang the right arm off lefthand_pos and the left arm off
// righthand_pos (first person mirrors the model) with small offsets (about +-2): on rifles that holds
// fine, but on pistols the right arm ends up in front of the camera and isn't seen (G17, G18, Deagle,
// Golden Deagle, B93R, Timeless 50 showed only the left hand). The P320 and AA-12 hang each arm off its
// own hand bone with offsets of about +-10, and both hands show. This tool switches a gun to that:
//   - gun model and its first-person arms model (taczuniversal<N>): rightArm under righthand_pos,
//     leftArm under lefthand_pos;
//   - every first-person animation of the gun that places the arms: rightArm/leftArm set to the
//     reference gun's fp.hold values.
// When the gun's hand bones sit elsewhere than the reference gun's (the CZ75's right hand is 4 further
// back), the arm offsets move by the same amount, so each arm still ends on its hand.
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { pathToFileURL } from "node:url";
const require = createRequire(import.meta.url);
const { parse } = require("./lenient.cjs");
const { format } = require("./format.cjs");

const geometryOf = (j) => (j["minecraft:geometry"] ?? [])[0] ?? Object.entries(j).filter(([k]) => k.startsWith("geometry.")).map(([, v]) => v)[0];

export function armLayout(root, ids, like = "p320", log = console.log) {
  const abs = (f) => path.join(root, f);
  const read = (f) => fs.readFileSync(abs(f), "utf8");
  const write = (f, j) => { const crlf = read(f).includes("\r\n"); const t = format(j); fs.writeFileSync(abs(f), crlf ? t.replace(/\n/g, "\r\n") : t); };
  const walk = (d) => fs.readdirSync(abs(d), { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(`${d}/${e.name}`) : [`${d}/${e.name}`]));
  const entity = parse(read("TACZ-R/entity/player.entity.json"))["minecraft:client_entity"].description;
  const rcs = parse(read("TACZ-R/render_controllers/shared_player.json")).render_controllers;
  const modelFiles = walk("TACZ-R/models/entity").filter((f) => f.endsWith(".json"));
  const modelFileOf = (geoId) => modelFiles.find((f) => { try { return geometryOf(parse(read(f)))?.description?.identifier === geoId || Object.keys(parse(read(f))).some((k) => k.split(":")[0] === geoId); } catch { return false; } });
  const animFiles = walk("TACZ-R/animations").filter((f) => f.endsWith(".json"));

  // The reference gun's arm values.
  const refAnim = parse(read(`TACZ-R/animations/guns/${like}.json`)).animations[`animation.${like}.fp.hold`];
  const ref = Object.fromEntries(Object.entries(refAnim.bones).filter(([k]) => /^(right|left)arm$/i.test(k)).map(([k, v]) => [k.toLowerCase(), v]));
  const refModel = geometryOf(parse(read(`TACZ-R/models/entity/guns/${like}.geo.json`)));
  const pivot = (g, n) => g.bones.find((b) => b.name === n)?.pivot;
  const near = (a, b) => a && b && a.every((v, i) => Math.abs(v - b[i]) <= 0.6);
  // An arm channel with its position moved by d (a constant or keyframes).
  const add = (p, d) => p.map((v, i) => +(Number(v) + d[i]).toFixed(4));
  const shifted = (channel, d) => {
    const c = structuredClone(channel);
    if (!c.position || d.every((v) => Math.abs(v) < 1e-6)) return c;
    if (Array.isArray(c.position)) c.position = add(c.position, d);
    else for (const [t, k] of Object.entries(c.position)) {
      if (Array.isArray(k)) c.position[t] = add(k, d);
      else for (const s of ["pre", "post"]) if (k[s]) k[s] = add(k[s], d);
    }
    return c;
  };

  const done = new Set();
  for (const id of ids) {
    // 1. Models: the gun model and every first-person arms model drawn for this gun.
    const v = new RegExp(`\\b(?:v|variable)\\.${id}\\b`);
    const armsGeos = entity.render_controllers
      .map((r) => (typeof r === "string" ? [r, ""] : Object.entries(r)[0]))
      .filter(([n, c]) => /universal\d*\.first_person$/.test(n) && v.test(c)) // the M16s' is plain "universal"
      .map(([n]) => rcs[n]?.geometry?.replace(/^Geometry\./i, "geometry."));
    const files = [`TACZ-R/models/entity/guns/${id}.geo.json`, ...armsGeos.map(modelFileOf)];
    if (files.some((f) => !f)) throw new Error(`${id}: arms model not found`);
    const gunModel = geometryOf(parse(read(files[0])));
    const shift = {};
    for (const [arm, n] of [["rightarm", "righthand"], ["leftarm", "lefthand"]]) {
      if (!pivot(gunModel, n) || !pivot(refModel, n)) throw new Error(`${id}: no ${n} bone in ${id} or ${like}`);
      shift[arm] = pivot(gunModel, n).map((v, i) => v - pivot(refModel, n)[i]);
    }
    for (const f of files) {
      if (done.has(f)) continue;
      const j = parse(read(f));
      const g = geometryOf(j);
      for (const n of ["righthand", "lefthand"]) if (!near(pivot(g, n), pivot(gunModel, n))) throw new Error(`${f}: ${n} at ${JSON.stringify(pivot(g, n))}, the ${id} model has it at ${JSON.stringify(pivot(gunModel, n))}; fix the models first`);
      for (const [arm, hand] of [["rightArm", "righthand_pos"], ["leftArm", "lefthand_pos"]]) {
        const b = g.bones.find((x) => x.name === arm);
        if (!b || !g.bones.some((x) => x.name === hand)) throw new Error(`${f}: no ${arm} or ${hand}`);
        b.parent = hand;
      }
      write(f, j);
      done.add(f);
      log(`   ${f}: rightArm under righthand_pos, leftArm under lefthand_pos`);
    }
    // 2. First-person animations that place the arms.
    const names = new Set(Object.entries(entity.animations).filter(([k, a]) => k.startsWith(`${id}_fp`) && a.startsWith("animation.")).map(([, a]) => a));
    let changed = 0;
    for (const f of animFiles) {
      const j = parse(read(f));
      let edited = false;
      for (const [aid, a] of Object.entries(j.animations ?? {})) {
        if (!names.has(aid) || done.has(aid)) continue;
        for (const k of Object.keys(a.bones ?? {})) {
          if (!/^(right|left)arm$/i.test(k)) continue;
          a.bones[k] = shifted(ref[k.toLowerCase()], shift[k.toLowerCase()]);
          edited = true;
        }
        done.add(aid);
        changed++;
      }
      if (edited) write(f, j);
    }
    log(`   ${id}: arm offsets from ${like} in ${changed} first-person animation(s)`);
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  const args = process.argv.slice(2);
  const likeAt = args.indexOf("--like");
  const like = likeAt >= 0 ? args.splice(likeAt, 2)[1] : "p320";
  if (!args.length) { console.log("usage: node tools/weapons/arm-layout.mjs <gun> [<gun> ...] [--like p320]"); process.exit(1); }
  armLayout(process.cwd(), args, like);
  console.log("Done. Run tools/weapons/check.mjs.");
}
