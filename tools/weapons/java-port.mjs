// Ports a Java TACZ gun: clone the most similar gun we have, then replace everything that makes it
// that gun with the Java version.
//
//   node tools/weapons/java-port.mjs <javaId> <newId> --from <ourGun> [--name "Name"]
//   then: node tools/weapons/check.mjs
//
// Steps (each prints what it did):
//   1. tools/weapons/gun.mjs clone <ourGun> <newId>       controllers, items, functions, sounds ...
//   2. model + first-person arms model (java-convert.mjs); optional parts removed (extended mags,
//      alternative stocks, scope mount/rails unless the gun has a built-in scope)
//   3. textures: Java gun texture and inventory icon
//   4. animations: draw, shoot, reloads, inspects replaced with Java's; hold/sprint/walk/aim moved to
//      the pose computed from the Java model; an empty inspect is added and wired if the clone lacks one
//   5. sounds: every sound the new animations and the shot use, from TACZ-JAVA
//   6. stats (config/weapons.js) from java-stats.mjs; ammo item; magazine size (HUD, reload
//      functions, reload events and thresholds are regenerated for the new size)
// The source gun must have its own first-person arms model (most do; M16/M16A1, Deagle/Golden Deagle,
// G17/G18, AKM/Saiga-12 and MP7/FAL share one).
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { execFileSync } from "node:child_process";
import { createRequire } from "node:module";
import { pathToFileURL } from "node:url";
import { convertGun, armsModel, FIXED_FP } from "./java-convert.mjs";
import { armLayout } from "./arm-layout.mjs";
import { repairImport } from "./import-repair.mjs";
const require = createRequire(import.meta.url);
const { parse } = require("./lenient.cjs");
const { format } = require("./format.cjs");
const { openJava, JAVA_TO_OURS } = require("./java.cjs");
const geometryOfJava = (j) => (j["minecraft:geometry"] ?? [])[0];

const root = process.cwd();
const abs = (f) => path.join(root, f);
const readText = (f) => fs.readFileSync(abs(f), "utf8");
const exists = (f) => fs.existsSync(abs(f));
function edit(f, fn) {
  const raw = readText(f), crlf = raw.includes("\r\n");
  const next = fn(raw.replace(/\r\n/g, "\n"));
  if (next !== undefined) fs.writeFileSync(abs(f), crlf ? next.replace(/\n/g, "\r\n") : next);
}
// Text files keep their line endings (Windows or Unix).
function writeText(f, text) {
  const crlf = exists(f) && readText(f).includes("\r\n");
  fs.writeFileSync(abs(f), crlf ? text.replace(/\n/g, "\r\n") : text);
}
const editJson =(f, fn) => edit(f, (t) => { const j = parse(t); fn(j); return format(j); });
const md5 = (b) => crypto.createHash("md5").update(b).digest("hex");
const log = (...a) => console.log(...a);

// Java ammo -> our ammo item.
const AMMO = {
  "tacz:9mm": "mm9", "tacz:556x45": "m885", "tacz:45acp": "acp45", "tacz:762x39": "m43", "tacz:12g": "gauge12", "tacz:357mag": "mag357",
  "tacz:50bmg": "bmg50", "tacz:308": "win308", "tacz:338": "lapua338", "tacz:57x28": "mm5728", "tacz:46x30": "mm4630", "tacz:58x42": "mm5842",
  "tacz:50ae": "ae50", "tacz:rpg_rocket": "rpgrocket", "tacz:792x57": "mm792", "tacz:30_06": "spr3006", "tacz:45_70": "govt4570",
  "tacz:500mag": "mag500", "tacz:22wmr": "wmr22", "tacz:40mm": "grenade40",
};
const OPTIONAL_PARTS = /^(mag_extended_\d+|mount|rail\d*|side_rail)$/;

// ---------------------------------------------------------------- arguments
const args = process.argv.slice(2);
const opt = (n) => { const i = args.indexOf(n); return i < 0 ? undefined : args.splice(i, 2)[1]; };
const from = opt("--from"), name = opt("--name");
const [javaId, id] = args;
if (!javaId || !id || !from) {
  log(readText("tools/weapons/java-port.mjs").split("\n").slice(0, 21).join("\n"));
  process.exit(1);
}
const java = openJava(root);
const javaData = java.gunData(javaId);
const javaDisplay = java.json(`assets/tacz/display/guns/${javaId}_display.json`);
const javaName = (() => {
  const en = JSON.parse(java.read("assets/tacz/lang/en_us.json").toString());
  return (en[java.gunIndex(javaId).name] ?? javaId).replace(/§./g, "").trim();
})();

// ---------------------------------------------------------------- 1. clone
if (!exists(`TACZ-B/items/guns/${id}/${id}.json`)) {
  log(`1. clone ${from} -> ${id}`);
  execFileSync(process.execPath, ["tools/weapons/gun.mjs", "clone", from, id, "--name", name ?? javaName], { stdio: ["ignore", "ignore", "inherit"] });
} else log(`1. ${id} already exists (not cloning)`);

// The clone's first-person arms model.
const entityFile = "TACZ-R/entity/player.entity.json";
const entity = parse(readText(entityFile))["minecraft:client_entity"].description;
const armsNumber = entity.render_controllers.map((rc) => Object.entries(rc)[0]).find(([k, v]) => /universal\d+\.first_person/.test(k) && new RegExp(`(v|variable)\\.${id}\\b(?!_)`).test(v) && !/\|\|/.test(v))?.[0].match(/universal(\d+)/)[1];
if (!armsNumber) throw new Error(`${id} has no first-person arms model of its own (clone from a gun that has one)`);

// ---------------------------------------------------------------- 1b. no attachment system (yet)
// A clone of a gun with attachments/sights inherits its menus, scope property and events, which name parts
// the Java model doesn't have. Remove them: the new gun starts with no attachments.
stripAttachments(id);

// ---------------------------------------------------------------- 2. model and arms model
const converted = convertGun(java, javaId, id);
const builtinScope = !!javaData.builtin_attachments?.scope;
if (builtinScope)
  log(`   note: ${javaId} has a built-in scope (${javaData.builtin_attachments.scope}); its model is a separate Java attachment and is not added yet, so the gun has no scope and aims with its iron-sight position`);
{
  const g = converted.model["minecraft:geometry"][0];
  const drop = new Set();
  // Stocks: Java's standard stock is oem_stock_tactical (light/heavy/AR adapter are attachments);
  // a gun without one keeps its first oem_stock_*.
  const stocks = g.bones.filter((b) => /^oem_stock_/.test(b.name));
  const keepStock = stocks.find((b) => b.name === "oem_stock_tactical") ?? stocks[0];
  for (const b of g.bones) {
    const optional = OPTIONAL_PARTS.test(b.name) && !(builtinScope && /^(mount|rail\d*)$/.test(b.name));
    if (optional || (/^oem_stock_/.test(b.name) && b !== keepStock) || b.name === "ar_stock_adapter") drop.add(b.name);
  }
  for (let grew = true; grew; ) { grew = false; for (const b of g.bones) if (!drop.has(b.name) && drop.has(b.parent)) { drop.add(b.name); grew = true; } }
  g.bones = g.bones.filter((b) => !drop.has(b.name));
  log(`2. model: ${g.bones.length} bones (removed optional parts: ${[...drop].join(", ") || "none"})`);
  writeText(`TACZ-R/models/entity/guns/${id}.geo.json`, format(converted.model));
  const armsFile = `TACZ-R/models/entity/shared/taczuniversal${armsNumber}.geo.json`;
  writeText(armsFile, format(armsModel(converted.model, parse(readText(armsFile)), armsNumber)));
  log(`   arms model ${armsFile}`);
}

// ---------------------------------------------------------------- 3. textures
{
  const tex = (javaDisplay.texture ?? "").replace(/^tacz:/, "");
  const slot = (javaDisplay.slot ?? "").replace(/^tacz:/, "");
  fs.writeFileSync(abs(`TACZ-R/textures/gun/${id}.png`), java.read(`assets/tacz/textures/${tex}.png`));
  if (slot && java.has(`assets/tacz/textures/${slot}.png`)) fs.writeFileSync(abs(`TACZ-R/textures/items/${id}.png`), java.read(`assets/tacz/textures/${slot}.png`));
  log(`3. textures: gun ${tex}, icon ${slot}`);
}

// ---------------------------------------------------------------- 4. animations and pose
const animFile = `TACZ-R/animations/guns/${id}.json`;
const soundNames = new Map(); // our cue name -> Java sound path
{
  const file = parse(readText(animFile));
  const anims = file.animations;
  // Animations in use: the player's table, plus shots started by playanimation in player.json.
  const used = new Set([...Object.values(entity.animations), ...(readText("TACZ-B/entities/player.json").match(/animation\.[\w.]+/g) ?? [])]);
  const byRole = (re) => Object.keys(anims).filter((k) => re.test(k) && used.has(k));
  const ROLES = {
    draw: [/\.(fp\.)?draw$/], shoot: [/\.(fp\.)?shoot(\.(n?sight))?$/], "fp.tac": [/\.fp\.tac$/], "fp.reload": [/\.fp\.reload$/],
    "fp.inspect": [/\.fp\.inspect$/], "fp.inspect_empty": [/\.fp\.inspect_?emp(ty)?$/],
    // Bolt / pump cycle after each shot (AWM-based guns' fp.bolt, M870-based fp.pump).
    "fp.bolt": [/\.fp\.(bolt|pump)$/],
  };
  const replaced = [];
  const before = {}; // the clone's animations, for their sounds if Java has none
  for (const [role, [re]] of Object.entries(ROLES)) {
    const src = converted.animations[`animation.${id}.${role}`];
    if (!src) continue;
    for (const k of byRole(re)) {
      before[k] = anims[k];
      anims[k] = structuredClone(src);
      // Some Java files mark these "loop": true; ours must end (controllers wait for all_animations_finished),
      // or the draw / reload / inspect repeats forever (v1.22.0: Kar98k, SPR-15 and Rhino draws).
      if (anims[k].loop === true) delete anims[k].loop;
      replaced.push(k.replace(`animation.${id}.`, ""));
    }
  }
  // Empty inspect the clone lacks: add and wire it.
  const emptyInspect = converted.animations[`animation.${id}.fp.inspect_empty`];
  if (emptyInspect && !byRole(ROLES["fp.inspect_empty"][0]).length) {
    anims[`animation.${id}.fp.inspect_empty`] = structuredClone(emptyInspect);
    if (anims[`animation.${id}.fp.inspect_empty`].loop === true) delete anims[`animation.${id}.fp.inspect_empty`].loop;
    wireEmptyInspect(id);
    replaced.push("fp.inspect_empty");
    log("   the starting gun had no empty inspect: added and wired Java's");
  }
  // Pose: move the clone's first-person joints so its hold matches the Java model; the aim ends on the sight.
  const J = (a) => a?.bones && Object.keys(a.bones).find((k) => k.toLowerCase() === "joints");
  const firstVal = (v) => (Array.isArray(v) ? v : Object.values(v)[0]).map((x) => (typeof x === "object" ? x.post ?? x : x));
  const holdAnim = anims[`animation.${id}.fp.hold`];
  let shifted = [];
  if (converted.pose && holdAnim && J(holdAnim)) {
    const oldHold = firstVal(holdAnim.bones[J(holdAnim)].position);
    const delta = converted.pose.hold.map((v, i) => v - oldHold[i]);
    const shift = (v) => (Array.isArray(v) && typeof v[0] === "number" ? v.map((x, i) => +(x + delta[i]).toFixed(3)) : v?.post ? { ...v, post: shift(v.post) } : v);
    for (const [k, a] of Object.entries(anims)) {
      if (!/\.fp\./.test(k) || replaced.some((r) => k.endsWith("." + r))) continue;
      const jk = J(a);
      if (!jk || !a.bones[jk].position) continue;
      const pos = a.bones[jk].position;
      if (Array.isArray(pos)) a.bones[jk].position = shift(pos);
      else for (const t of Object.keys(pos)) pos[t] = shift(pos[t]);
      if (/\.fp\.sight$/.test(k) && !Array.isArray(pos)) { const last = Object.keys(pos).at(-1); pos[last] = converted.pose.aim; }
      shifted.push(k.replace(`animation.${id}.`, ""));
    }
  }
  // The moved poses (hold, aim, sprint ...) still place the arms and hands for the source gun's model.
  // Keep their body motion (root, rot, joints) and take the rest from the Java gun: hands and parts from
  // its static_idle (what our original guns' fp.hold uses), arms at the fixed first-person offsets of the
  // converted animations. Without this a source gun with a different arm layout (P320, M1911, AA-12 hang
  // the right arm off the right hand; the converted model mirrors them) leaves the hands off the grip.
  if (converted.idle) {
    const KEEP = new Set(["root", "rot", "joints"]);
    for (const k of shifted) {
      const bones = anims[`animation.${id}.${k}`].bones;
      for (const bone of Object.keys(bones)) if (!KEEP.has(bone.toLowerCase())) delete bones[bone];
      for (const [bone, v] of Object.entries(converted.idle)) if (!KEEP.has(bone.toLowerCase())) bones[bone] = structuredClone(v);
      bones.rightArm = structuredClone(FIXED_FP.rightArm);
      bones.leftArm = structuredClone(FIXED_FP.leftArm);
    }
    log(`   hands from Java static_idle in ${shifted.join(", ")}`);
  }
  // The draw plays on top of the hold (its own controller), and Bedrock adds the two. Java's draw gives the
  // whole hand pose, so on top of the hold it doubled (the M9A4's right arm swung up while drawing). Keep only
  // what the draw changes from static_idle: positions and rotations minus idle's, scales divided by it.
  if (converted.idle) {
    const idle = Object.fromEntries(Object.entries(converted.idle).map(([k, v]) => [k.toLowerCase(), v]));
    const num = (v) => Array.isArray(v) && v.every((x) => typeof x === "number");
    for (const k of replaced.filter((r) => /(^|\.)draw$/.test(r))) {
      const bones = anims[`animation.${id}.${k}`].bones ?? {};
      for (const [bone, ch] of Object.entries(bones)) {
        const base = idle[bone.toLowerCase()];
        if (!base || ["root", "rot", "joints"].includes(bone.toLowerCase())) continue;
        for (const c of ["rotation", "position", "scale"]) {
          if (!ch[c] || !num(base[c])) continue;
          const rel = (v) => (num(v) ? v.map((x, i) => +(c === "scale" ? x / base[c][i] : x - base[c][i]).toFixed(4)) : v);
          if (num(ch[c])) ch[c] = rel(ch[c]);
          else for (const [t, key] of Object.entries(ch[c])) ch[c][t] = num(key) ? rel(key) : { ...key, ...(key.pre && { pre: rel(key.pre) }), ...(key.post && { post: rel(key.post) }) };
          const none = c === "scale" ? 1 : 0;
          const vals = num(ch[c]) ? [ch[c]] : Object.values(ch[c]).flatMap((key) => (num(key) ? [key] : [key.pre, key.post].filter(Boolean)));
          if (vals.every((v) => num(v) && v.every((x) => Math.abs(x - none) < 1e-3))) delete ch[c];
        }
        if (!Object.keys(ch).length) delete bones[bone];
      }
      log(`   ${k}: hands relative to static_idle (it plays on top of the hold)`);
    }
  }
  // Sound cues: name them after our gun (tacz.<id>.<file>: letters, digits, _ and . only, or the game rejects the player entity;
  // the <id> lets gun.mjs remove find them) and drop
  // cues whose sound TACZ-JAVA doesn't have (Java plays nothing for them either).
  const dropped = new Set(), keptSounds = [];
  for (const k of replaced) {
    const a = anims[`animation.${id}.${k.split(" ")[0]}`];
    if (!a?.sound_effects) continue;
    for (const [t, fx] of Object.entries(a.sound_effects)) {
      const cues = [].concat(fx).flatMap((x) => {
        const javaPath = x.effect.replace(/^tacz:/, "");
        if (!java.has(`assets/tacz/tacz_sounds/${javaPath}.ogg`)) { dropped.add(x.effect); return []; }
        const ours = `tacz.${id}.${path.basename(javaPath).replace(/[^A-Za-z0-9_]/g, "_").replace(/^(?=\d)/, "s")}`; // no part may start with a digit
        soundNames.set(ours, javaPath);
        return [{ ...x, effect: ours }];
      });
      if (!cues.length) delete a.sound_effects[t];
      else a.sound_effects[t] = Array.isArray(fx) ? cues : cues[0];
    }
    // No Java sound at all: keep the clone's cues, timed to the new animation's length.
    const old = before[`animation.${id}.${k.split(" ")[0]}`];
    if (!Object.keys(a.sound_effects).length && old?.sound_effects && old.animation_length && a.animation_length) {
      const scale = a.animation_length / old.animation_length;
      a.sound_effects = Object.fromEntries(Object.entries(old.sound_effects).map(([t, fx]) => [String(+(+t * scale).toFixed(4)), fx]));
      keptSounds.push(k);
    }
  }
  if (dropped.size) log(`   sound cues not in TACZ-JAVA (dropped): ${[...dropped].join(", ")}`);
  if (keptSounds.length) log(`   no Java sounds for ${keptSounds.join(", ")}: kept ${from}'s, timed to the new animations`);
  // Third person: the clone's tp animations put its Java model's thirdperson_hand bone in the hand. Move
  // their joints so the new model's thirdperson_hand lands there instead (scaled like joints). Needs the
  // source gun's Java model (not the Type 81 or Colt Python). Tested: CZ75 3.25 lower than the P320 looked
  // too low, M320 4.4 higher than the RPG too high.
  const fromJava = Object.entries(JAVA_TO_OURS).find(([, ours]) => ours === from)?.[0];
  const tpHand = (jid) => {
    const d = java.json(`assets/tacz/display/guns/${java.gunIndex(jid).display.split(":")[1]}.json`);
    return geometryOfJava(java.json(d.model.replace("tacz:", "assets/tacz/geo_models/") + ".json"))?.bones.find((b) => b.name === "thirdperson_hand")?.pivot;
  };
  const hNew = tpHand(javaId), hRef = fromJava && tpHand(fromJava);
  if (hNew && hRef) {
    // Height only: guns whose thirdperson_hand differs a lot front-to-back looked right unmoved (M95 -12,
    // SPR-15 and SPAS-12 +9 in z).
    const d = [0, hRef[1] - hNew[1], 0];
    const moved = [];
    for (const [k, a] of Object.entries(anims)) {
      if (!/\.tp\./.test(k)) continue;
      const jk = J(a);
      const ch = jk && a.bones[jk];
      if (!ch?.position) continue;
      const s = typeof ch.scale === "number" ? ch.scale : Array.isArray(ch.scale) ? ch.scale[1] : 1;
      const add = (p) => (Array.isArray(p) && typeof p[0] === "number" ? p.map((x, i) => +(x + s * d[i]).toFixed(3)) : p?.post ? { ...p, post: add(p.post), ...(p.pre && { pre: add(p.pre) }) } : p);
      if (Array.isArray(ch.position)) ch.position = add(ch.position);
      else for (const t of Object.keys(ch.position)) ch.position[t] = add(ch.position[t]);
      moved.push(k.replace(`animation.${id}.`, ""));
    }
    log(`   third person: thirdperson_hand ${JSON.stringify(hNew)} vs ${from}'s ${JSON.stringify(hRef)}; moved ${moved.join(", ") || "-"}`);
  } else log(`   third person: kept ${from}'s placement (${fromJava ? "no thirdperson_hand" : `${from} is not a Java gun`})`);
  writeText(animFile, format(file));
  log(`4. animations from Java: ${replaced.join(", ")}`);
  log(`   pose: hold ${JSON.stringify(converted.pose?.hold)}, aim ${JSON.stringify(converted.pose?.aim)}; moved ${shifted.join(", ") || "-"}`);
}

// ---------------------------------------------------------------- 5. sounds
{
  const SD = "TACZ-R/sounds/sound_definitions.json";
  const defs = JSON.parse(readText(SD));
  const ent = parse(readText(entityFile));
  const sfx = ent["minecraft:client_entity"].description.sound_effects;
  const ours = new Map();
  const walk = (d) => fs.readdirSync(abs(d), { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(`${d}/${e.name}`) : [`${d}/${e.name}`]));
  for (const f of walk("TACZ-R/sounds").filter((f) => f.endsWith(".ogg"))) ours.set(md5(fs.readFileSync(abs(f))), f.replace(/^TACZ-R\//, "").replace(/\.ogg$/, ""));
  const fileFor = (javaPath) => {
    const src = `assets/tacz/tacz_sounds/${javaPath}.ogg`;
    if (!java.has(src)) return null;
    const data = java.read(src), h = md5(data);
    if (ours.has(h)) return ours.get(h);
    const file = `sounds/${id}/${path.basename(javaPath)}`;
    fs.mkdirSync(path.dirname(abs(`TACZ-R/${file}`)), { recursive: true });
    fs.writeFileSync(abs(`TACZ-R/${file}.ogg`), data);
    ours.set(h, file);
    return file;
  };
  let wired = 0;
  const missing = [];
  for (const [n, javaPath] of soundNames) {
    const file = defs[n]?.sounds ? null : fileFor(javaPath);
    if (!defs[n] && !file) { missing.push(n); continue; }
    if (file) defs[n] = { category: "hostile", sounds: [file] };
    sfx[n] = n;
    wired++;
  }
  // The shot (and suppressed shot) the gun's controller plays.
  for (const [ours, java] of [[`${id}.shoot`, javaDisplay.sounds?.shoot], [`${id}.suppress`, javaDisplay.sounds?.silence]]) {
    if (!defs[ours] || !java) continue;
    const file = fileFor(java.replace(/^tacz:/, ""));
    if (file) defs[ours] = { ...defs[ours], sounds: [file] };
  }
  writeText(SD, JSON.stringify(defs, null, 2) + "\n");
  writeText(entityFile, format(ent));
  log(`5. sounds: ${wired} animation sounds wired${missing.length ? `; not in TACZ-JAVA (silent): ${missing.join(", ")}` : ""}; shot ${javaDisplay.sounds?.shoot}`);
  // Sound files from the source gun that nothing uses any more.
  const refs = JSON.stringify(defs);
  let removed = 0;
  if (exists(`TACZ-R/sounds/${id}`)) for (const f of walk(`TACZ-R/sounds/${id}`)) { const p = f.replace(/^TACZ-R\//, "").replace(/\.\w+$/, ""); if (!refs.includes(`"${p}"`)) { fs.rmSync(abs(f)); removed++; } }
  if (removed) log(`   removed ${removed} of the source gun's sound files nothing uses now`);
}

// ---------------------------------------------------------------- 6. stats, ammo, magazine
{
  const stats = JSON.parse(execFileSync(process.execPath, ["tools/weapons/java-stats.mjs", "--json"], { encoding: "utf8", maxBuffer: 1 << 26 }));
  const p = stats.proposed.find((x) => x.javaId === javaId) ?? stats.shared.find((x) => x.java.javaId === javaId);
  const s = p.java ? { ...p.java, damage: p.ours.damage, penetration: p.ours.penetration } : p;
  const { WEAPONS } = await import(pathToFileURL(abs("TACZ-B/scripts/config/weapons.js")).href + "?t=" + Date.now());
  const oldMag = WEAPONS[id].magazine, oldAmmo = WEAPONS[id].ammo.replace(/^krep:/, "");
  const newMag = javaData.ammo_amount ?? oldMag, newAmmo = AMMO[javaData.ammo];
  if (!newAmmo) throw new Error(`no ammo item for ${javaData.ammo}; add it to AMMO in java-port.mjs`);
  const b = javaData.bullet ?? {}, x = b.extra_damage ?? {};
  const falloff = Array.isArray(x.damage_adjust) ? x.damage_adjust.map((a) => [a.distance === "infinite" ? null : a.distance, +(a.damage / b.damage).toFixed(2)]) : null;
  const fireMode = javaData.fire_mode?.[0] ?? "semi";
  const bd = javaData.burst_data;
  // Gunsmith recipe from Java's (forge tags -> our item names, crafting/craftingHelpers.js).
  const TAGS = {
    "forge:ingots/iron": "iron_ingot", "forge:ingots/gold": "gold_ingot", "forge:ingots/netherite": "netherite_ingot",
    "forge:gems/lapis": "lapis_lazuli", "forge:gems/diamond": "diamond", "forge:gems/quartz": "quartz",
    "forge:gems/amethyst": "amethyst_shard", "forge:rods/blaze": "blaze_rod", "minecraft:logs": "log",
  };
  const recipeFile = `data/tacz/recipes/gun/${javaId}.json`;
  const recipe = java.has(recipeFile) ? java.json(recipeFile).materials.map((m) => {
    const item = m.item.tag ? TAGS[m.item.tag] : m.item.item?.replace(/^minecraft:/, "");
    if (!item) throw new Error(`${recipeFile}: no item name for ${JSON.stringify(m.item)}; add it to TAGS in java-port.mjs`);
    return [item, m.count ?? 1];
  }) : null;
  edit("TACZ-B/scripts/config/weapons.js", (t) => {
    const re = new RegExp(`(\\n  ${id}: \\{\\n)([\\s\\S]*?)(\\n  \\},\\n)`);
    const m = re.exec(t);
    let body = m[2];
    const set = (k, v) => { const r = new RegExp(`^    ${k}: .*$`, "m"); body = r.test(body) ? body.replace(r, `    ${k}: ${v},`) : body.replace(/^(    recoil: .*)$/m, `$1\n    ${k}: ${v},`); };
    const del = (k) => { body = body.replace(new RegExp(`^    ${k}: .*\\n?`, "m"), ""); };
    set("damage", s.damage); set("penetration", s.penetration);
    set("headshot", x.head_shot_multiplier ?? 1);
    falloff ? set("falloff", `[${falloff.map(([d, v]) => `[${d}, ${v}]`).join(", ")}]`) : del("falloff");
    set("fireMode", JSON.stringify(fireMode)); set("rpm", javaData.rpm);
    fireMode === "burst" && bd ? set("burst", `{ count: ${bd.count ?? 3}, rpm: ${bd.bpm ?? javaData.rpm}, delay: ${bd.min_interval ?? 0.3} }`) : del("burst");
    if ((b.bullet_amount ?? 1) > 1) set("pellets", b.bullet_amount); else { del("pellets"); del("spread"); del("tracers"); }
    set("magazine", newMag); set("ammo", JSON.stringify(`krep:${newAmmo}`));
    if (recipe) {
      const r = /^(    \/\/ Java TACZ recipe\.\n)?    recipe: (\[\[.*\]\]|\[\n[\s\S]*?\n    \]),?$/m;
      if (!r.test(body)) throw new Error(`${id}: no recipe line in weapons.js`);
      body = body.replace(r, `    // Java TACZ recipe.\n    recipe: [${recipe.map(([i, n]) => `["${i}", ${n}]`).join(", ")}],`);
    }
    return t.slice(0, m.index) + m[1] + body + m[3] + t.slice(m.index + m[0].length);
  });
  log(`6. stats: damage ${s.damage}, penetration ${s.penetration}, headshot ${x.head_shot_multiplier}, ${fireMode} ${javaData.rpm} rpm, falloff ${falloff ? "yes" : "no"}`);
  // Fire rate of controller-fired semi guns: the BP shoot animation's length is the time between shots
  // (the P320's 0.15 s fired the Java revolvers at about 400 rpm). Bolt / pump guns are paced by their
  // cycle, auto guns fire every tick, script-fired guns use rpm directly.
  {
    const bpAnim = `TACZ-B/animations/guns/${id}.json`;
    const bp = exists(bpAnim) ? parse(readText(bpAnim)).animations : {};
    const shoot = bp[`animation.${id}.shoot`];
    if (fireMode === "semi" && shoot && !bp[`animation.${id}.bolt`] && !bp[`animation.${id}.pump`] && !WEAPONS[id].scriptFiring && javaData.rpm) {
      const len = +(60 / javaData.rpm).toFixed(3);
      editJson(bpAnim, (j) => { j.animations[`animation.${id}.shoot`].animation_length = len; });
      log(`   fire rate: ${javaData.rpm} rpm = ${len} s between shots (BP shoot animation)`);
    }
  }
  log(recipe ? `   recipe from Java: ${recipe.map(([i, n]) => `${n} ${i}`).join(", ")}` : `   no Java recipe: kept ${from}'s`);
  if (newAmmo !== oldAmmo) { swapAmmo(id, oldAmmo, newAmmo); log(`   ammo: krep:${oldAmmo} -> krep:${newAmmo}`); }
  if (newMag !== oldMag) { resizeMagazine(id, oldMag, newMag); log(`   magazine: ${oldMag} -> ${newMag}`); }
}
// ---------------------------------------------------------------- 7. arm layout
// The converted model mirrors the arms (right arm on lefthand_pos), which holds rifles fine but hides the
// right hand on pistols. If the source gun puts each arm on its own hand (P320, AA-12), do the same with
// its offsets (arm-layout.mjs); Java pistols get it with the P320's offsets whatever the source (the Colt
// Python hangs its arms off its own rhand/lhand bones, which a converted model doesn't have).
{
  const src = parse(readText(`TACZ-R/models/entity/guns/${from}.geo.json`));
  const srcGeo = (src["minecraft:geometry"] ?? [])[0] ?? Object.values(src).find((v) => v?.bones);
  const ownHand = srcGeo?.bones.find((b) => b.name === "rightArm")?.parent === "righthand_pos";
  const like = ownHand ? from : java.gunIndex(javaId).type === "pistol" ? "p320" : null;
  if (like) {
    log(`7. arm layout: arms on their own hands, offsets from ${like}`);
    armLayout(root, [id], like, log);
  }
}
repairImport(root, javaId, id, log);
log(`\nDone. Run tools/weapons/check.mjs, then test ${id} in game (aim, reloads, sounds).`);

// ---------------------------------------------------------------- helpers
function ownBpFiles(id) {
  const fn = fs.readdirSync(abs("TACZ-B/functions")).filter((f) => new RegExp(`^${id}((quantity|reload)\\d*)?\\.mcfunction$`).test(f)).map((f) => `TACZ-B/functions/${f}`);
  return [...fn, `TACZ-B/animation_controllers/gun_${id}.json`, `TACZ-B/animations/guns/${id}.json`];
}

function swapAmmo(id, oldAmmo, newAmmo) {
  // HUD shows the ammo's name: use the lang key a gun with the new ammo already shows, else the item's.
  const hudKey = (ammo) => {
    for (const f of fs.readdirSync(abs("TACZ-B/functions")).filter((f) => /^[a-z0-9]+quantity\.mcfunction$/.test(f))) {
      if (!readText(`TACZ-B/functions/${f}`).includes(`item=krep:${ammo},`)) continue;
      const hud = `TACZ-B/functions/${f.replace("quantity", "")}`;
      const m = exists(hud) && /"translate":"(krep:ammo\.name\.[^"]+)"/.exec(readText(hud));
      if (m) return m[1];
    }
    const item = parse(readText(`TACZ-B/items/ammo/${ammo}.json`));
    return item["minecraft:item"].components["minecraft:display_name"].value;
  };
  const oldKey = hudKey(oldAmmo), newKey = hudKey(newAmmo);
  for (const f of ownBpFiles(id)) edit(f, (t) => t.split(`krep:${oldAmmo}`).join(`krep:${newAmmo}`).split(oldKey).join(newKey));
}

function resizeMagazine(id, M, N) {
  if (M < 3 || N < 3) throw new Error(`magazine ${M} -> ${N}: only magazines of 3+ rounds are resized automatically`);
  const d = N - M;
  const near = (n) => n >= M - 1 && n <= M + 2; // numbers tied to the magazine size
  const shiftNum = (n) => (near(n) ? n + d : n);
  // HUD, controllers, animations: counts and caps tied to the size.
  const shiftText = (t) => t
    .replace(/"\/(\d+)( ?\\n)/g, (m, n, rest) => `"/${shiftNum(+n)}${rest}`)
    .replace(new RegExp(`(${id}=)(\\d+)(\\.\\.)(\\d*)`, "g"), (m, a, lo, dots, hi) => a + shiftNum(+lo) + dots + (hi === "" ? "" : shiftNum(+hi)))
    .replace(new RegExp(`(scoreboard\\('${id}'\\) *[<>=]+ *)(\\d+)`, "g"), (m, a, n) => a + shiftNum(+n))
    .replace(new RegExp(`(@s(?:\\[[^\\]]*\\])? ${id} )(\\d+)`, "g"), (m, a, n) => a + shiftNum(+n));
  edit(`TACZ-B/functions/${id}.mcfunction`, (t) => t.replace(/"\/(\d+)(?=[ \\])/g, (m, n) => `"/${shiftNum(+n)}`).replace(new RegExp(`(${id}=1\\.\\.)(\\d+)`, "g"), (m, a, n) => a + shiftNum(+n)));
  for (const f of [`TACZ-B/animation_controllers/gun_${id}.json`, `TACZ-B/animations/guns/${id}.json`]) edit(f, shiftText);
  edit("TACZ-B/animation_controllers/shared_inspect.json", (t) => t.replace(new RegExp(`(scoreboard\\('${id}'\\) *[<>=]+ *)(\\d+)`, "g"), (m, a, n) => a + shiftNum(+n)));
  // Reload count function: one event per round in the inventory, then "N or more".
  edit(`TACZ-B/functions/${id}quantity.mcfunction`, (t) => {
    const lines = t.split("\n");
    const tpl = lines.find((l) => /quantity=0\}/.test(l));
    const box = lines.find((l) => /hasitem=\{item=krep:ammoboxc,quantity=1\.\.\}/.test(l));
    const out = [];
    for (let q = 0; q < N; q++) out.push(tpl.replace("quantity=0}", `quantity=${q}}`).replace(/reload0$/, `reload${q}`));
    out.push(tpl.replace("quantity=0}", `quantity=${N}..}`).replace(/reload0$/, `reload${N}`));
    if (box) out.push(box.replace(/reload\d+$/, `reload${N}`));
    return out.join("\n");
  });
  // Ammo removal: "score s -> clear C - s rounds".
  edit(`TACZ-B/functions/${id}reload.mcfunction`, (t) => {
    const lines = t.split("\n").filter(Boolean);
    const m = /scores=\{[a-z0-9]+=(\d+)\}.* (\d+)$/.exec(lines[0]);
    const C = +m[1] + +m[2] + d;
    const top = +m[1] + d;
    const out = [];
    for (let s = top; s >= 0; s--) out.push(lines[0].replace(/scores=\{([a-z0-9]+)=\d+\}/, `scores={$1=${s}}`).replace(/ \d+$/, ` ${C - s}`));
    return out.join("\n");
  });
  // Reload events: <id>reload0..N set krep:ammoreload base + k; krep:<id>_reload adds k.
  editJson("TACZ-B/entities/player.json", (j) => {
    const ev = j["minecraft:entity"].events;
    const base = ev[`${id}reload1`].set_property["krep:ammoreload"] - 1;
    for (const k of Object.keys(ev)) if (new RegExp(`^${id}reload\\d+$`).test(k) && +k.slice(id.length + 6) > 0) delete ev[k];
    const rebuilt = {};
    for (const [k, v] of Object.entries(ev)) {
      rebuilt[k] = v;
      if (k === `${id}reload0`) for (let q = 1; q <= N; q++) rebuilt[`${id}reload${q}`] = { set_property: { "krep:ammoreload": base + q } };
    }
    const seq = rebuilt[`krep:${id}_reload`].sequence;
    const have = new Set(seq.map((s) => s.filters?.value));
    for (let q = 1; q <= N + 1; q++) if (!have.has(base + q)) {
      const tpl = structuredClone(seq[0]);
      tpl.filters.value = base + q;
      tpl.queue_command.command = [`scoreboard players add @s ${id} ${q}`];
      seq.push(tpl);
    }
    j["minecraft:entity"].events = rebuilt;
  });
}

function stripAttachments(id) {
  const removed = [];
  // Config: menu entries and attachment recoil.
  for (const f of ["TACZ-B/scripts/config/attachments.js", "TACZ-B/scripts/config/recoil.js"])
    edit(f, (t) => {
      const m = new RegExp(`\\n  ${id}: \\{\\n[\\s\\S]*?\\n  \\},\\n`).exec(t);
      if (!m) return undefined;
      removed.push(path.basename(f));
      return t.slice(0, m.index + 1) + t.slice(m.index + m[0].length);
    });
  const scopeProp = `krep:${id}scope`;
  // BP: scope property, sight events, scope controller.
  editJson("TACZ-B/entities/player.json", (j) => {
    const e = j["minecraft:entity"], d = e.description;
    if (d.properties[scopeProp]) { delete d.properties[scopeProp]; removed.push(scopeProp); }
    // Sight events set the scope property (other <id>:... events, e.g. bolt/pump actions, stay).
    for (const [k, v] of Object.entries(e.events)) if (JSON.stringify(v).includes(`"${scopeProp}"`)) { delete e.events[k]; removed.push(`event ${k}`); }
    if (d.animations[`${id}scope`]) {
      delete d.animations[`${id}scope`];
      d.scripts.animate = d.scripts.animate.filter((a) => a !== `${id}scope`);
      removed.push(`${id}scope controller`);
    }
  });
  editJson(`TACZ-B/animation_controllers/gun_${id}.json`, (j) => { delete j.animation_controllers[`controller.animation.${id}.scope`]; });
  // RP: aim state keeps only the plain sight; the gun's parts are all shown.
  const dropAnims = new Set();
  editJson(`TACZ-R/animation_controllers/gun_${id}.json`, (j) => {
    for (const c of Object.values(j.animation_controllers))
      for (const st of Object.values(c.states)) {
        if (!Array.isArray(st.animations)) continue;
        st.animations = st.animations.flatMap((a) => {
          if (typeof a === "string") return [a];
          const [k, cond] = Object.entries(a)[0];
          if (!cond.includes(scopeProp)) return [a];
          if (new RegExp(`q\\.property\\('${scopeProp}'\\) *== *'nothing'`).test(cond))
            return [{ [k]: cond.replace(new RegExp(` *&& *q\\.property\\('${scopeProp}'\\) *== *'nothing'`), "") }];
          dropAnims.add(k);
          return [];
        });
      }
  });
  editJson(`TACZ-R/render_controllers/gun_${id}.json`, (j) => { for (const rc of Object.values(j.render_controllers)) rc.part_visibility = [{ "*": true }]; });
  if (dropAnims.size) {
    let ids = [];
    editJson("TACZ-R/entity/player.entity.json", (j) => {
      const a = j["minecraft:client_entity"].description.animations;
      for (const k of dropAnims) { if (a[k]) ids.push(a[k]); delete a[k]; }
    });
    editJson(`TACZ-R/animations/guns/${id}.json`, (j) => { for (const k of ids) delete j.animations[k]; });
    removed.push(`scope aim animations ${[...dropAnims].join(", ")}`);
  }
  const icons = `TACZ-R/textures/ui/new/${id}`;
  if (exists(icons)) { fs.rmSync(abs(icons), { recursive: true }); removed.push("attachment icons"); }
  // Nothing may still use the scope property.
  const left = ["TACZ-B", "TACZ-R"].flatMap(function all(d) { return fs.readdirSync(abs(d), { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? all(`${d}/${e.name}`) : [`${d}/${e.name}`])); })
    .filter((f) => /\.json$/.test(f) && readText(f).includes(scopeProp));
  if (left.length) throw new Error(`${scopeProp} is still used in: ${left.join(", ")}`);
  log(`1b. attachments: ${removed.length ? "removed " + removed.join(", ") : "none"}`);
}

function wireEmptyInspect(id) {
  editJson(`TACZ-R/animation_controllers/gun_${id}.json`, (j) => {
    const c = j.animation_controllers[`controller.animation.${id}.fp`];
    for (const st of Object.values(c.states)) for (const t of st.transitions ?? []) if (t.inspect === `v.${id}b && q.skin_id == 1 && !q.is_sneaking`) t.inspect = `v.${id} && q.skin_id == 1 && !q.is_sneaking`;
    c.states.inspect.animations = [{ [`${id}_fp_inspect`]: `v.${id}b` }, { [`${id}_fp_inspect_emp`]: `v.${id}emp` }];
  });
  editJson("TACZ-R/entity/player.entity.json", (j) => {
    const a = j["minecraft:client_entity"].description.animations, out = {};
    for (const [k, v] of Object.entries(a)) { out[k] = v; if (k === `${id}_fp_inspect`) out[`${id}_fp_inspect_emp`] = `animation.${id}.fp.inspect_empty`; }
    j["minecraft:client_entity"].description.animations = out;
  });
  editJson("TACZ-B/animation_controllers/shared_inspect.json", (j) => {
    const st = Object.values(j.animation_controllers)[0].states.setup;
    if (st.transitions.some((t) => (t["trigger.inspect.emp"] ?? "").includes(`=='${id}_emp'`))) return;
    const i = st.transitions.findLastIndex((t) => (t["trigger.inspect"] ?? "").startsWith(`(query.get_equipped_item_name=='${id}' &&`));
    st.transitions.splice(i + 1, 0, { "trigger.inspect.emp": `(query.get_equipped_item_name=='${id}_emp' && variable.attack_time > 0.0f && query.scoreboard('${id}') == 0 && q.mark_variant != 1)` });
  });
}
