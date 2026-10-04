// Repairs the tested Java imports without re-porting their stats, recoil or recipes.
// Also called by java-port.mjs so fresh ports retain these corrections.
// node tools/weapons/import-repair.mjs
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { createRequire } from "node:module";
import { pathToFileURL } from "node:url";
import { convertAnimation, boneRenames, pose } from "./java-convert.mjs";
import { armLayout } from "./arm-layout.mjs";
const require = createRequire(import.meta.url);
const { parse, walk } = require("./lenient.cjs");
const { format } = require("./format.cjs");
const { openJava } = require("./java.cjs");
const IMPORTS = { kar98: "kar98", m700: "m700", spas12: "spas_12", spr15: "spr15hb", cz75: "cz75", mk23: "hk_mk23", taurus943: "taurus943", m320: "m320" };
const round = n => +n.toFixed(4);
const last = v => Array.isArray(v) || typeof v !== "object" ? v : last(Object.values(v).at(-1).post ?? Object.values(v).at(-1));

// Some Java exports contain recovery keys after animation_length. Keep that recovery.
export function duration(a) {
  return Math.max(a.animation_length ?? 0, ...Object.values(a.bones ?? {}).flatMap(b => Object.values(b).flatMap(c => c && typeof c === "object" && !Array.isArray(c) ? Object.keys(c).map(Number).filter(Number.isFinite) : [])));
}

// Join absolute poses, resetting channels absent from a stage instead of accidentally
// inheriting a shell/part pose from a later stage. Pre/post preserves stage boundaries.
export function sequence(stages) {
  const out = { loop: "hold_on_last_frame", animation_length: round(stages.reduce((n, a) => n + duration(a), 0)), bones: {}, sound_effects: {} };
  const channels = new Map();
  for (const a of stages) for (const [bone, b] of Object.entries(a.bones ?? {})) for (const c of Object.keys(b)) channels.set(`${bone}/${c}`, [bone, c]);
  for (const [bone, c] of channels.values()) {
    const keys = {}; let offset = 0, previous;
    for (const a of stages) {
      const channel = a.bones?.[bone]?.[c] ?? (c === "scale" ? [1, 1, 1] : [0, 0, 0]);
      const frames = Array.isArray(channel) || typeof channel !== "object" ? { "0": channel } : channel;
      const entries = Object.entries(frames).sort((a, b) => +a[0] - +b[0]);
      const first = entries[0][1];
      const start = first.pre ?? first.post ?? first;
      keys[String(round(offset))] = previous === undefined ? structuredClone(start) : { pre: structuredClone(previous), post: structuredClone(start) };
      for (const [t, value] of entries) if (+t > 0) keys[String(round(offset + +t))] = structuredClone(value);
      previous = last(channel);
      offset = round(offset + duration(a));
      keys[String(offset)] = structuredClone(previous);
    }
    (out.bones[bone] ??= {})[c] = keys;
  }
  let offset = 0;
  for (const a of stages) {
    for (const [t, fx] of Object.entries(a.sound_effects ?? {})) out.sound_effects[String(round(offset + +t))] = structuredClone(fx);
    offset = round(offset + duration(a));
  }
  return out;
}

export function repairImport(root, javaId, id, log = console.log) {
  if (!Object.values(IMPORTS).includes(javaId)) return;
  const read = f => fs.readFileSync(path.join(root, f), "utf8");
  const write = (f, j) => { const old = read(f), text = format(j); fs.writeFileSync(path.join(root, f), old.includes("\r\n") ? text.replace(/\n/g, "\r\n") : text); };
  const edit = (f, fn) => { const j = parse(read(f)); fn(j); write(f, j); };
  const java = openJava(root);
  const display = java.json(`assets/tacz/display/guns/${java.gunIndex(javaId).display.split(":")[1]}.json`);
  const geo = java.json(display.model.replace("tacz:", "assets/tacz/geo_models/") + ".json")["minecraft:geometry"][0];
  const animFile = `TACZ-R/animations/guns/${id}.json`, file = parse(read(animFile)), anims = file.animations;
  const entityFile = "TACZ-R/entity/player.entity.json", entity = parse(read(entityFile));
  const desc = entity["minecraft:client_entity"].description;
  const controllerFile = `TACZ-R/animation_controllers/gun_${id}.json`;
  const controllers = parse(read(controllerFile)), fp = controllers.animation_controllers[`controller.animation.${id}.fp`];
  const bpFile = `TACZ-B/animations/guns/${id}.json`, bp = parse(read(bpFile));
  const javaAnims = java.json(`assets/tacz/animations/${javaId}.animation.json`).animations;

  if (javaId === "spas_12") {
    // Since v1.30 the template (M870) reloads from the script: the shell times go to config scriptReload.shells
    // instead of BP reload animation timelines.
    const cfgFile = "TACZ-B/scripts/config/weapons.js";
    const cfg = read(cfgFile);
    const shellLine = new RegExp(`(\\n  ${id}: \\{\\r?\\n[\\s\\S]*?\\n    scriptReload: \\{ shells: )(\\{[^\\n]*\\})( \\},)`).exec(cfg);
    const reloadActive = shellLine
      ? +/loading: (\d+)/.exec(shellLine[2])[1]
      : parse(read("TACZ-B/entities/player.json"))["minecraft:entity"].events[`${id}reload1`].set_property["krep:ammoreload"];
    // Empty: one chambered shell then four tube shells. Tactical: up to five
    // tube shells, preserving the existing 5 empty / 6 tactical capacity rules.
    anims[`animation.${id}.fp.reload`] = convertAnimation(sequence([javaAnims.reload_empty_intro, ...Array(4).fill(javaAnims.reload_loop)]), true, pose(geo).hold, boneRenames(geo));
    anims[`animation.${id}.fp.tac`] = convertAnimation(sequence([javaAnims.reload_intro, ...Array(5).fill(javaAnims.reload_loop)]), true, pose(geo).hold, boneRenames(geo));
    anims[desc.animations[`${id}_fp_rend`]] = convertAnimation(javaAnims.reload_end, true, pose(geo).hold, boneRenames(geo));
    const insert = (time, first = false) => {
      const timeline = {};
      if (!first) timeline[String(round(time - 0.1))] = [`/function ${id}quantity`];
      timeline[String(round(time))] = [`/clear @s[m=!c,hasitem={item=krep:gauge12,quantity=1..}] krep:gauge12 0 1`, `/event entity @s krep:${id}_reload`];
      timeline[String(round(time + 0.05))] = [...(first ? [`/replaceitem entity @s slot.weapon.mainhand 1 krep:${id} 1 0`] : []), `/function ${id}`];
      return timeline;
    };
    const shellTimes = (intro, count, first) => [...(first ? [0.7333] : []), ...Array.from({ length: count }, (_, i) => round(duration(intro) + i * duration(javaAnims.reload_loop) + 0.2167))];
    if (shellLine) {
      const old = shellLine[2];
      const keep = (k) => /(\w+: \d+)/.test(old) && new RegExp(`${k}: (\\d+)`).exec(old)?.[1];
      const shells = `{ empty: [${shellTimes(javaAnims.reload_empty_intro, 4, true).join(", ")}], tac: [${shellTimes(javaAnims.reload_intro, 5).join(", ")}], finish: ${round(duration(javaAnims.reload_end))}, loading: ${keep("loading")}, ending: ${keep("ending")} }`;
      fs.writeFileSync(path.join(root, cfgFile), cfg.replace(shellLine[0], shellLine[1] + shells + shellLine[3]));
    } else {
      for (const [role, intro, count] of [["reload", javaAnims.reload_empty_intro, 4], ["tac", javaAnims.reload_intro, 5]]) {
        const b = bp.animations[`animation.${id}.${role === "tac" ? "reload.tac" : role}`];
        b.animation_length = anims[`animation.${id}.fp.${role}`].animation_length;
        b.timeline = role === "reload" ? insert(0.7333, true) : {};
        for (let i = 0; i < count; i++) Object.assign(b.timeline, insert(duration(intro) + i * duration(javaAnims.reload_loop) + 0.2167));
      }
      bp.animations[`animation.${id}.end`].animation_length = duration(javaAnims.reload_end);
      edit(`TACZ-B/animation_controllers/gun_${id}.json`, j => {
        const states = j.animation_controllers[`controller.animation.${id}.reload`].states;
        for (const name of ["reloadfinish", "reloadfinish1"]) states[name].transitions = [{ setup: "q.all_animations_finished" }, { setup: `query.get_equipped_item_name!='${id}' && query.get_equipped_item_name!='${id}_emp'` }];
      });
    }
    // Finish must win over returning directly to hold when the server signals end.
    fp.states.reload.transitions = [{ rend: `v.${id} && q.property('krep:ammoreload')!=${reloadActive}` }, { hold: `!v.${id}` }];
    fp.states.reloadtac.transitions = structuredClone(fp.states.reload.transitions);
  }

  for (const [name, a] of Object.entries(anims)) {
    // Match the converted skeleton exactly, including inherited Joints/torso.
    if (a.bones?.Joints) { a.bones.joints = a.bones.Joints; delete a.bones.Joints; }
    if (javaId === "taurus943" && a.bones?.torso) { a.bones.body = a.bones.torso; delete a.bones.torso; }
    if (!name.includes(".fp.")) continue;
    if (a.bones?.root) a.bones.root = { rotation: [0, 180, 0] };
    if (/\.fp\.(reload|tac|bolt|pump|inspect|inspect_empty|rend)$/.test(name)) {
      a.animation_length = duration(a);
      a.loop = "hold_on_last_frame";
    }
  }
  for (const state of Object.values(fp.states)) {
    state.blend_via_shortest_path = true;
    // Blend OUT of the action to hold; blending only on hold affects entry.
    if (state === fp.states.reload || state === fp.states.reloadtac || state === fp.states.inspect || state === fp.states.rend) state.blend_transition = 0.1;
  }
  for (const role of ["reload", "tac", "bolt", "pump"]) {
    if (javaId === "spas_12" && ["reload", "tac"].includes(role)) continue;
    const a = anims[`animation.${id}.fp.${role}`];
    const b = bp.animations[`animation.${id}.${role === "tac" ? "reload.tac" : role === "pump" ? "bolt" : role}`];
    if (!a || !b) continue;
    const ratio = a.animation_length / b.animation_length;
    b.timeline = Object.fromEntries(Object.entries(b.timeline ?? {}).map(([t, v]) => [String(round(+t * ratio)), v]));
    b.animation_length = a.animation_length;
  }

  if (javaId === "m320") {
    // The launcher's sight is offset sideways and tilted; discard the RPG roll.
    const aim = anims[`animation.${id}.fp.sight`].bones.joints;
    const iron = geo.bones.find(b => b.name === "iron_view");
    const pitch = -(iron.rotation?.[0] ?? 0), rad = pitch * Math.PI / 180;
    const [x, y, z] = iron.pivot;
    const end = [-x, round(27.5 - (y * Math.cos(rad) - z * Math.sin(rad))), round(0.5 - (y * Math.sin(rad) + z * Math.cos(rad)))];
    const hold = anims[`animation.${id}.fp.hold`].bones.joints.position;
    aim.position = { "0.0": structuredClone(hold), "0.6038": end };
    aim.rotation = { "0.0": [0, 0, 0], "0.6038": [pitch, 0, 0] };
  }
  if (javaId === "taurus943") {
    // Use the working MK23 grip height as a reference, including the gun's
    // actual grip anchor rather than only its root/model height.
    const ref = parse(read("TACZ-R/animations/guns/mk23.json")).animations;
    const grip = geo.bones.find(b => b.name === "thirdperson_hand").pivot;
    const refGrip = java.json("assets/tacz/geo_models/gun/hk_mk23_geo.json")["minecraft:geometry"][0].bones.find(b => b.name === "thirdperson_hand").pivot;
    for (const role of ["hold", "sight", "sprint"]) {
      const b = anims[`animation.${id}.tp.${role}`].bones.joints;
      const r = ref[`animation.mk23.tp.${role}`].bones.joints;
      const s = typeof r.scale === "number" ? r.scale : 1;
      let delta = refGrip.map((v, i) => v - grip[i]);
      const angles = Array.isArray(r.rotation) ? r.rotation : [0, 0, 0];
      for (let axis = 0; axis < 3; axis++) {
        const angle = angles[axis] * Math.PI / 180, c = Math.cos(angle), sn = Math.sin(angle);
        const i = (axis + 1) % 3, k = (axis + 2) % 3, old = [...delta];
        delta[i] = c * old[i] - sn * old[k]; delta[k] = sn * old[i] + c * old[k];
      }
      b.position = last(r.position).map((v, i) => round(v + s * delta[i]));
    }
  }

  // Wire new SPAS sequence cues using the same valid identifiers and sound
  // deduplication as the port tool; missing Java audio stays silent.
  const defsFile = "TACZ-R/sounds/sound_definitions.json", defs = parse(read(defsFile));
  const hashes = new Map(walk(path.join(root, "TACZ-R/sounds")).filter(f => f.endsWith(".ogg")).map(f => [crypto.createHash("md5").update(fs.readFileSync(f)).digest("hex"), path.relative(path.join(root, "TACZ-R"), f).replace(/\\/g, "/").replace(/\.ogg$/, "")]));
  for (const a of Object.values(anims)) for (const [t, fx] of Object.entries(a.sound_effects ?? {})) {
    const cues = [].concat(fx).flatMap(cue => {
      if (!cue.effect.startsWith("tacz:")) return [cue];
      const source = cue.effect.slice(5), file = `assets/tacz/tacz_sounds/${source}.ogg`;
      if (!java.has(file)) return [];
      const name = `tacz.${id}.${path.basename(source).replace(/[^A-Za-z0-9_]/g, "_").replace(/^(?=\d)/, "s")}`;
      if (!defs[name]) {
        const bytes = java.read(file), hash = crypto.createHash("md5").update(bytes).digest("hex");
        let target = hashes.get(hash);
        if (!target) { target = `sounds/${id}/${path.basename(source)}`; fs.mkdirSync(path.join(root, `TACZ-R/sounds/${id}`), { recursive: true }); fs.writeFileSync(path.join(root, `TACZ-R/${target}.ogg`), bytes); hashes.set(hash, target); }
        defs[name] = { category: "hostile", sounds: [target] };
      }
      desc.sound_effects[name] = name;
      return [{ ...cue, effect: name }];
    });
    if (cues.length) a.sound_effects[t] = Array.isArray(fx) ? cues : cues[0]; else delete a.sound_effects[t];
  }
  write(animFile, file); write(bpFile, bp); write(controllerFile, controllers); write(entityFile, entity);
  // sound_definitions uses ordinary JSON formatting, not compact animation formatting.
  const oldDefs = read(defsFile), text = JSON.stringify(defs, null, 2) + "\n";
  fs.writeFileSync(path.join(root, defsFile), oldDefs.includes("\r\n") ? text.replace(/\n/g, "\r\n") : text);
  if (["kar98", "m700", "spas_12", "spr15hb"].includes(javaId)) armLayout(root, [id], "p320", () => {});
  log(`   ${id}: repaired imported poses, recovery and action timing`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  for (const [id, javaId] of Object.entries(IMPORTS)) repairImport(process.cwd(), javaId, id);
}
