// Converts a Java TACZ gun's model, animations and first-person pose into our format.
//
//   node tools/weapons/java-convert.mjs <javaId> <ourId> --compare     compare with our existing files
//   node tools/weapons/java-convert.mjs <javaId> <ourId> --out <dir>   write the converted files to <dir>
//
// What it builds (the rules were measured on the 37 guns both versions have):
//   Gun model   Java's bones and cubes, with Java's `root` renamed `rot` and put under our player
//               skeleton (root > waist > body > joints > rot; head, cape, jacket, legs), the player's
//               arms hung off the gun's hand bones (rightArm under lefthand_pos, leftArm under
//               righthand_pos: first person mirrors them), Java's hand placeholder cubes and helper
//               bones (camera, *_view, refit_*, positioning, ground, fixed, thirdperson_hand) removed.
//   Arms model  (taczuniversal<N>) the same skeleton with the player's body cubes only.
//   Animations  draw, shoot, reload_tactical (fp.tac), reload_empty (fp.reload), inspect, inspect_empty:
//               Java's keyframes; Java `root` -> `rot`, `camera` dropped, plus our fixed first-person
//               bones (root turned 180°, joints = the hold pose, the arms' offsets).
//   Pose        aim (fp.sight end): joints = [0, 27.5 - iron_view.y, 0.5 - iron_view.z] from the Java
//               model's iron_view bone (within ±0.3 up/down for 30 of 34 guns); hold = aim + [-3, -1, -3].
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const { parse } = require("./lenient.cjs");
const { format } = require("./format.cjs");
const { openJava } = require("./java.cjs");

const root = process.cwd();
const HELPER_BONES = /^(camera|positioning|ground|fixed|thirdperson_hand|view|iron_view|idle_view|refit_.*_view|refit_view)$/;
const EYE_HEIGHT = 27.5, EYE_DEPTH = 0.5, HOLD_OFFSET = [-3, -1, -3];
// Player skeleton around the gun (same pivots in every gun we have).
const SKELETON = [
  { name: "root", pivot: [0, 0, 0] },
  { name: "waist", parent: "root", pivot: [0, 12, 0] },
  { name: "body", parent: "waist", pivot: [0, 24, 0] },
  { name: "head", parent: "body", pivot: [0, 24, 0] },
  { name: "hat", parent: "head", pivot: [0, 24, 0] },
  { name: "cape", parent: "body", pivot: [0, 24, 3] },
  { name: "joints", parent: "body", pivot: [0, 0, 0] },
];
const ARMS = [
  { name: "rightArm", parent: "lefthand_pos", pivot: [-5, 22, 0] },
  { name: "rightSleeve", parent: "rightArm", pivot: [-5, 22, 0] },
  { name: "rightItem", parent: "rightArm", pivot: [-6, 15, 1] },
  { name: "leftArm", parent: "righthand_pos", pivot: [5, 22, 0] },
  { name: "leftSleeve", parent: "leftArm", pivot: [5, 22, 0] },
  { name: "leftItem", parent: "leftArm", pivot: [6, 15, 1] },
];
const LOWER_BODY = [
  { name: "jacket", parent: "body", pivot: [0, 24, 0] },
  { name: "leftLeg", parent: "root", pivot: [1.9, 12, 0] },
  { name: "leftPants", parent: "leftLeg", pivot: [1.9, 12, 0] },
  { name: "rightLeg", parent: "root", pivot: [-1.9, 12, 0] },
  { name: "rightPants", parent: "rightLeg", pivot: [-1.9, 12, 0] },
];
const FIXED_FP = { root: { rotation: [0, 180, 0] }, leftArm: { rotation: [0, 0, 180], position: [2, -12, 0] }, rightArm: { rotation: [0, 0, 180], position: [-2, -12, 0] } };
const ANIMATIONS = { draw: "draw", shoot: "shoot", reload_tactical: "fp.tac", reload_empty: "fp.reload", inspect: "fp.inspect", inspect_empty: "fp.inspect_empty" };
const FIRST_PERSON = new Set(["fp.tac", "fp.reload", "fp.inspect", "fp.inspect_empty"]);

const round = (v) => v.map((x) => +x.toFixed(3));
const geometryOf = (json) => (json["minecraft:geometry"] ?? [])[0];

// Java bones named like a bone of our player skeleton (e.g. the SPAS-12's "body") are renamed
// "<name>_gun": bone names must be unique. Returns { oldName: newName } (also used for animations).
export function boneRenames(javaGeo) {
  const reserved = new Set([...SKELETON, ...ARMS, ...LOWER_BODY].map((b) => b.name.toLowerCase()));
  return Object.fromEntries(javaGeo.bones.filter((b) => b.name !== "root" && reserved.has(b.name.toLowerCase())).map((b) => [b.name, `${b.name}_gun`]));
}

export function convertModel(javaGeo, id) {
  const bones = [];
  const renames = boneRenames(javaGeo);
  for (const b of javaGeo.bones) {
    if (HELPER_BONES.test(b.name) && !b.cubes?.length) continue;
    const bone = structuredClone(b);
    if (renames[bone.name]) bone.name = renames[bone.name];
    if (renames[bone.parent]) bone.parent = renames[bone.parent];
    if (bone.name === "root") {
      bone.name = "rot";
      bone.parent = "joints";
    } else if (bone.parent === "root") bone.parent = "rot";
    if (bone.name === "lefthand_pos" || bone.name === "righthand_pos") delete bone.cubes;
    bones.push(bone);
  }
  const names = new Set(bones.map((b) => b.name));
  for (const need of ["lefthand_pos", "righthand_pos", "rot"]) if (!names.has(need)) throw new Error(`Java model has no ${need} bone`);
  return {
    format_version: "1.12.0",
    "minecraft:geometry": [{ description: { ...javaGeo.description, identifier: `geometry.${id}` }, bones: [...SKELETON, ...bones, ...ARMS, ...LOWER_BODY] }],
  };
}

// The arms model: the gun model's skeleton, with the player's cubes (from an existing arms model).
export function armsModel(gunModel, templateArms, number) {
  const template = geometryOf(templateArms) ?? Object.values(templateArms).find((v) => v?.bones);
  const playerCubes = new Map(template.bones.filter((b) => b.cubes?.length).map((b) => [b.name, b.cubes]));
  const bones = geometryOf(gunModel).bones.map(({ cubes, ...b }) => (playerCubes.has(b.name) ? { ...b, cubes: playerCubes.get(b.name) } : b));
  const description = { ...(template.description ?? { texture_width: 64, texture_height: 64 }), identifier: `geometry.taczuniversal${number}` };
  return { format_version: "1.12.0", "minecraft:geometry": [{ description, bones }] };
}

export function pose(javaGeo) {
  const iron = javaGeo.bones.find((b) => b.name === "iron_view")?.pivot;
  if (!iron) return null;
  const aim = round([0, EYE_HEIGHT - iron[1], EYE_DEPTH - iron[2]]);
  return { aim, hold: round(aim.map((v, i) => v + HOLD_OFFSET[i])) };
}

// Java animation -> ours: root -> rot, camera dropped, fixed first-person bones added.
export function convertAnimation(anim, firstPerson, hold, renames = {}) {
  const out = structuredClone(anim);
  const bones = {};
  for (const [name, b] of Object.entries(out.bones ?? {})) {
    if (name === "camera") continue;
    bones[name === "root" ? "rot" : renames[name] ?? name] = b;
  }
  if (firstPerson) Object.assign(bones, structuredClone(FIXED_FP), { joints: { position: hold } });
  out.bones = bones;
  return out;
}

export function convertGun(java, javaId, id) {
  const javaGeo = geometryOf(java.json(`assets/tacz/geo_models/gun/${javaId}_geo.json`));
  const javaAnims = java.json(`assets/tacz/animations/${javaId}.animation.json`).animations;
  const p = pose(javaGeo);
  const animations = {};
  for (const [j, ours] of Object.entries(ANIMATIONS)) {
    if (!javaAnims[j]) continue;
    animations[`animation.${id}.${ours}`] = convertAnimation(javaAnims[j], FIRST_PERSON.has(ours), p?.hold ?? [-3, 14, -15], boneRenames(javaGeo));
  }
  return { model: convertModel(javaGeo, id), animations, pose: p };
}

// ---------------------------------------------------------------- compare with an existing gun
function compare(converted, id) {
  const lines = [];
  const ourModel = geometryOf(parse(fs.readFileSync(path.join(root, `TACZ-R/models/entity/guns/${id}.geo.json`), "utf8")));
  const newModel = geometryOf(converted.model);
  const key = (b) => JSON.stringify([b.parent ?? "", b.pivot, b.rotation ?? null]);
  const ours = new Map(ourModel.bones.map((b) => [b.name, b])), mine = new Map(newModel.bones.map((b) => [b.name, b]));
  const lower = (m) => new Map([...m].map(([k, v]) => [k.toLowerCase(), v]));
  const oursL = lower(ours);
  let same = 0, diff = [];
  for (const [n, b] of mine) {
    const o = ours.get(n) ?? oursL.get(n.toLowerCase());
    if (!o) continue;
    const parentOk = (b.parent ?? "").toLowerCase() === (o.parent ?? "").toLowerCase();
    if (parentOk && JSON.stringify(b.pivot) === JSON.stringify(o.pivot) && JSON.stringify(b.cubes ?? []) === JSON.stringify(o.cubes ?? [])) same++;
    else diff.push(n);
  }
  const onlyMine = [...mine.keys()].filter((n) => !oursL.has(n.toLowerCase()));
  const onlyOurs = [...ours.keys()].filter((n) => !mine.has(n) && !lower(mine).has(n.toLowerCase()));
  lines.push(`Model: ${same} bones identical (parent, pivot, cubes), ${diff.length} differ${diff.length ? ": " + diff.join(", ") : ""}`);
  lines.push(`  only in converted: ${onlyMine.join(", ") || "-"}`);
  lines.push(`  only in ours: ${onlyOurs.join(", ") || "-"}`);
  const cubes = (g) => g.bones.reduce((n, b) => n + (b.cubes?.length ?? 0), 0);
  lines.push(`  cubes: converted ${cubes(newModel)}, ours ${cubes(ourModel)}`);

  const ourAnims = parse(fs.readFileSync(path.join(root, `TACZ-R/animations/guns/${id}.json`), "utf8")).animations;
  const flat = (v) => (Array.isArray(v) ? v : v && typeof v === "object" && !Array.isArray(v) ? Object.fromEntries(Object.entries(v).map(([k, x]) => [k, Array.isArray(x) ? x : x.post ?? x])) : v);
  const sameChannel = (a, b) => JSON.stringify(flat(a)) === JSON.stringify(flat(b));
  lines.push("Animations (bone channels equal to ours after flattening Java's {post, lerp_mode} keyframes):");
  for (const [name, a] of Object.entries(converted.animations)) {
    const o = ourAnims[name];
    if (!o) {
      lines.push(`  ${name}: not in ours`);
      continue;
    }
    let eq = 0, total = 0;
    const differ = [];
    for (const [bone, ch] of Object.entries(a.bones ?? {}))
      for (const [c, v] of Object.entries(ch)) {
        total++;
        const ob = o.bones?.[bone] ?? o.bones?.[Object.keys(o.bones ?? {}).find((k) => k.toLowerCase() === bone.toLowerCase())];
        if (ob && sameChannel(v, ob[c])) eq++;
        else differ.push(`${bone}.${c}`);
      }
    lines.push(`  ${name}: length ${a.animation_length}/${o.animation_length}, ${eq}/${total} channels equal${differ.length ? " (differ: " + differ.join(", ") + ")" : ""}`);
  }
  const jb = (a) => a?.bones?.[Object.keys(a.bones ?? {}).find((k) => k.toLowerCase() === "joints")]?.position;
  const last = (v) => (Array.isArray(v) ? v : v && Object.values(v).at(-1));
  const first = (v) => (Array.isArray(v) ? v : v && Object.values(v)[0]);
  const aimOurs = last(jb(ourAnims[`animation.${id}.fp.sight`])), holdOurs = first(jb(ourAnims[`animation.${id}.fp.hold`]));
  if (converted.pose) {
    const d = (a, b) => (a && b ? round(a.map((v, i) => v - (Array.isArray(b[i]) ? b[i][0] : b[i]))) : "-");
    lines.push(`Pose: aim ${JSON.stringify(converted.pose.aim)} vs ours ${JSON.stringify(aimOurs)} (off by ${JSON.stringify(d(converted.pose.aim, aimOurs))}); hold ${JSON.stringify(converted.pose.hold)} vs ours ${JSON.stringify(holdOurs)} (off by ${JSON.stringify(d(converted.pose.hold, holdOurs))})`);
  }
  return lines.join("\n");
}

// ---------------------------------------------------------------- main
if ((process.argv[1] ?? "").replace(/\\/g, "/").endsWith("java-convert.mjs")) {
  const [javaId, id] = process.argv.slice(2).filter((a) => !a.startsWith("--"));
  if (!javaId || !id) {
    console.log(fs.readFileSync(new URL(import.meta.url), "utf8").split("\n").slice(0, 5).join("\n"));
    process.exit(1);
  }
  const java = openJava(root);
  const converted = convertGun(java, javaId, id);
  const outIdx = process.argv.indexOf("--out");
  if (outIdx > 0) {
    const out = process.argv[outIdx + 1];
    fs.mkdirSync(out, { recursive: true });
    fs.writeFileSync(path.join(out, `${id}.geo.json`), format(converted.model));
    fs.writeFileSync(path.join(out, `${id}.animations.json`), format({ format_version: "1.8.0", animations: converted.animations }));
    console.log(`wrote ${id}.geo.json and ${id}.animations.json to ${out}`);
  }
  if (process.argv.includes("--compare")) console.log(compare(converted, id));
}
