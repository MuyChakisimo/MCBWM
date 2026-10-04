// Pack-wide reference check, run by check.mjs: everything the packs refer to must exist, and
// (as warnings) everything they define should be used.
//
// Errors:
//   - JSON files that don't parse
//   - client entity / attachable: animations, geometry, textures, render controllers, particles and
//     sound effects it names must exist; the short names its controllers and animations use
//     (animations, sound_effects, particle_effects) must be in its own tables; render controllers
//     it uses may only name its own Geometry./Texture./Material. entries
//   - sound definitions must point at existing files; item/terrain textures must exist
//   - behavior pack: player.json animations must exist, controllers may only use its short names,
//     events and component groups named in events/controllers/functions must exist, /function
//     targets must exist, playanimation / playsound / script playSound names must exist
// Warnings: RP/BP animations, sound definitions and player events that nothing uses.
const fs = require("fs");
const path = require("path");
const { parse, walk } = require("./lenient.cjs");

// Vanilla Minecraft names the packs may use (not defined in the packs).
const VANILLA = {
  animations: /^(animation|controller\.animation)\.(player|humanoid|bow|crossbow|trident|shield|holding|skeleton|persona)\b/,
  geometry: /^geometry\.(humanoid|cape|player)\b/,
  renderControllers: /^controller\.render\.(player\.(first_person|third_person|map|cape|body_first_person|first_person_spectator|third_person_spectator)|item_default|armor)\b/,
  textures: /^textures\/(misc|entity|items|blocks)\//,
  sounds: /^(random|mob|step|dig|note|ambient|block|item|game|use|damage|fire|liquid)\./,
  particles: /^minecraft:/,
};
// Events meant to be triggered by hand (/event entity @s m107:acog, see README).
const MANUAL_EVENT = /^m107:/;

function checkPack(root) {
  const problems = [], warnings = [];
  const err = (file, msg) => problems.push({ file, msg });
  const warn = (file, msg) => warnings.push({ file, msg });
  const rel = (f) => path.relative(root, f).split(path.sep).join("/");
  const files = (dir) => walk(path.join(root, dir)).map(rel);
  const json = new Map();
  for (const f of [...files("TACZ-B"), ...files("TACZ-R")].filter((f) => f.endsWith(".json"))) {
    try {
      json.set(f, parse(fs.readFileSync(path.join(root, f), "utf8")));
    } catch (e) {
      err(f, `does not parse: ${e.message}`);
    }
  }
  const under = (dir) => [...json].filter(([f]) => f.startsWith(dir + "/"));
  // A path with or without its extension ("textures/gunsmith.png" or "textures/items/m4a1").
  const exists = (p, exts) => [/\.\w+$/.test(p) ? "" : null, ...exts].some((x) => x !== null && fs.existsSync(path.join(root, "TACZ-R", p + x)));

  // ---- Definitions
  const rpAnims = new Map(); // id -> { file, anim }
  for (const [f, j] of under("TACZ-R/animations")) for (const [id, a] of Object.entries(j.animations ?? {})) rpAnims.set(id, { file: f, anim: a });
  // Bone names: a space (Java's "release button") makes the game reject the whole animation file.
  const BONE = /^[A-Za-z0-9_.\-]+$/;
  // Minecraft rejects an animation / animation controller file with nothing in it ("Required child ... not found";
  // v1.30: 11 BP animation files left empty when reloading moved to the script).
  for (const pack of ["TACZ-B", "TACZ-R"]) {
    for (const [f, j] of under(`${pack}/animations`)) if (!Object.keys(j.animations ?? {}).length) err(f, "has no animations (delete the file)");
    for (const [f, j] of under(`${pack}/animation_controllers`)) if (!Object.keys(j.animation_controllers ?? {}).length) err(f, "has no animation controllers (delete the file)");
  }
  for (const [f, j] of under("TACZ-R/animations")) for (const [id, a] of Object.entries(j.animations ?? {})) for (const b of Object.keys(a.bones ?? {})) if (!BONE.test(b)) err(f, `${id}: bone "${b}" may only use letters, digits, _ . -`);
  for (const [f, j] of under("TACZ-R/models")) for (const g of [...(j["minecraft:geometry"] ?? []), ...Object.entries(j).filter(([k]) => k.startsWith("geometry.")).map(([, v]) => v)]) for (const b of g.bones ?? []) if (!BONE.test(b.name)) err(f, `bone "${b.name}" may only use letters, digits, _ . -`);
  const rpControllers = new Map();
  for (const [f, j] of under("TACZ-R/animation_controllers")) for (const [id, c] of Object.entries(j.animation_controllers ?? {})) rpControllers.set(id, { file: f, ctrl: c });
  const renderControllers = new Map();
  for (const [f, j] of under("TACZ-R/render_controllers")) for (const [id, rc] of Object.entries(j.render_controllers ?? {})) renderControllers.set(id, { file: f, rc });
  const geometry = new Set();
  for (const [, j] of under("TACZ-R/models")) {
    for (const g of j["minecraft:geometry"] ?? []) geometry.add(g.description?.identifier);
    for (const k of Object.keys(j)) if (k.startsWith("geometry.")) geometry.add(k.split(":")[0]);
  }
  const particles = new Set(under("TACZ-R/particles").map(([, j]) => j.particle_effect?.description?.identifier));
  const soundDefs = json.get("TACZ-R/sounds/sound_definitions.json") ?? {};
  const bpAnims = new Map();
  for (const [f, j] of under("TACZ-B/animations")) for (const id of Object.keys(j.animations ?? {})) bpAnims.set(id, f);
  const bpControllers = new Map();
  for (const [f, j] of under("TACZ-B/animation_controllers")) for (const [id, c] of Object.entries(j.animation_controllers ?? {})) bpControllers.set(id, { file: f, ctrl: c });
  const functions = new Set(files("TACZ-B/functions").filter((f) => f.endsWith(".mcfunction")).map((f) => f.slice("TACZ-B/functions/".length, -".mcfunction".length)));

  const usedRpAnims = new Set(), usedSounds = new Set(), usedBpAnims = new Set();
  const useSound = (name, file, where) => {
    usedSounds.add(name);
    if (!soundDefs[name] && !VANILLA.sounds.test(name)) err(file, `${where}: sound "${name}" has no sound definition`);
  };

  // ---- Client entities and attachables
  const clients = [...under("TACZ-R/entity"), ...under("TACZ-R/attachables")]
    .map(([f, j]) => [f, (j["minecraft:client_entity"] ?? j["minecraft:attachable"])?.description])
    .filter(([, d]) => d);
  // Short names in a client entity's tables may only use letters, digits, "_" and "." (a name like
  // "tacz:m107/reload" makes the game reject the whole entity: invisible guns, default arms). Sound names
  // also keep every part between dots starting with a letter or _ (v1.22.0 broke rendering with
  // "tacz.taurus943.943_reload" and a 4632-character Molang expression; which one did it is untested,
  // so both are refused). Particle names like "krep.556shell" are known to work.
  const SAFE_NAME = /^[A-Za-z0-9_.]+$/;
  const SAFE_SOUND = /^[A-Za-z_][A-Za-z0-9_]*(\.[A-Za-z_][A-Za-z0-9_]*)*$/;
  const MAX_MOLANG = 4000;
  for (const [f, d] of clients) {
    for (const table of ["animations", "sound_effects", "particle_effects", "geometry", "textures", "materials"])
      for (const k of Object.keys(d[table] ?? {})) {
        if (!SAFE_NAME.test(k)) err(f, `${table} name "${k}" may only use letters, digits, _ and .`);
        else if (table === "sound_effects" && !SAFE_SOUND.test(k)) err(f, `sound_effects name "${k}": no part between dots may start with a digit`);
      }
    const exprs = [...(d.scripts?.pre_animation ?? []), ...[d.render_controllers ?? [], d.scripts?.animate ?? []].flat().flatMap((r) => (typeof r === "string" ? [] : Object.values(r)))];
    // One assignment per pre_animation entry ("v.a = x || v.b = y" is invalid and rejects the entity).
    for (const e of d.scripts?.pre_animation ?? []) if ((e.replace(/'[^']*'/g, "").match(/(^|[^=!<>])=(?!=)/g) ?? []).length > 1) err(f, `pre_animation entry with more than one assignment: ${e.slice(0, 80)}...`);
    // A ";" only at the end ("=='m107_emp'; || ..." from v1.22.0's M95 clone also rejected the entity).
    for (const e of exprs) if (/;\s*\S/.test(e.replace(/'[^']*'/g, ""))) err(f, `";" in the middle of a Molang expression: ${e.slice(0, 80)}...`);
    for (const e of exprs) if (e.length > MAX_MOLANG) err(f, `Molang expression of ${e.length} characters (keep under ${MAX_MOLANG}; split it): ${e.slice(0, 60)}...`);
  }
  for (const k of Object.keys(soundDefs)) if (!SAFE_SOUND.test(k)) err("TACZ-R/sounds/sound_definitions.json", `sound name "${k}" may only use letters, digits, _ and . (no part starting with a digit)`);

  for (const [f, d] of clients) {
    const anims = d.animations ?? {}, sfx = d.sound_effects ?? {}, pfx = d.particle_effects ?? {};
    for (const [short, id] of Object.entries(anims)) {
      if (rpAnims.has(id) || rpControllers.has(id)) usedRpAnims.add(id);
      else if (!VANILLA.animations.test(id)) err(f, `animation "${short}": ${id} is not defined`);
    }
    for (const [short, id] of Object.entries(d.geometry ?? {})) if (!geometry.has(id) && !VANILLA.geometry.test(id)) err(f, `geometry "${short}": ${id} is not defined`);
    for (const [short, p] of Object.entries(d.textures ?? {}))
      if (!exists(p, [".png", ".tga"]) && !VANILLA.textures.test(p)) err(f, `texture "${short}": ${p} not found`);
    for (const [short, id] of Object.entries(pfx)) if (!particles.has(id) && !VANILLA.particles.test(id)) err(f, `particle "${short}": ${id} is not defined`);
    for (const [short, name] of Object.entries(sfx)) useSound(name, f, `sound effect "${short}"`);

    // Short names used by this entity's animations/controllers must be in its own tables.
    const shorts = new Set(Object.keys(anims));
    const checkShort = (list, where) => {
      for (const a of list ?? []) {
        const name = typeof a === "string" ? a : Object.keys(a)[0];
        if (!shorts.has(name)) err(f, `${where}: "${name}" is not in this entity's animations`);
      }
    };
    checkShort(d.scripts?.animate, "scripts.animate");
    for (const id of Object.values(anims)) {
      const c = rpControllers.get(id);
      if (c) for (const [state, s] of Object.entries(c.ctrl.states ?? {})) {
        checkShort(s.animations, `${id} state ${state}`);
        for (const x of s.sound_effects ?? []) if (!sfx[x.effect]) err(c.file, `${id} state ${state}: sound effect "${x.effect}" is not in ${f}'s sound_effects`);
        for (const x of s.particle_effects ?? []) if (!pfx[x.effect]) err(c.file, `${id} state ${state}: particle "${x.effect}" is not in ${f}'s particle_effects`);
      }
      const a = rpAnims.get(id);
      if (a) {
        for (const fx of Object.values(a.anim.sound_effects ?? {}))
          for (const x of [].concat(fx)) if (!sfx[x.effect]) err(a.file, `${id}: sound effect "${x.effect}" is not in ${f}'s sound_effects`);
        for (const fx of Object.values(a.anim.particle_effects ?? {}))
          for (const x of [].concat(fx)) if (!pfx[x.effect]) err(a.file, `${id}: particle "${x.effect}" is not in ${f}'s particle_effects`);
      }
    }
    for (const rc of d.render_controllers ?? []) {
      const id = typeof rc === "string" ? rc : Object.keys(rc)[0];
      const def = renderControllers.get(id);
      if (!def) {
        if (!VANILLA.renderControllers.test(id)) err(f, `render controller ${id} is not defined`);
        continue;
      }
      const text = JSON.stringify(def.rc);
      for (const [, kind, name] of text.matchAll(/\b(Geometry|Texture|Material)\.([\w.]+)/gi)) {
        const table = { geometry: d.geometry, texture: d.textures, material: d.materials }[kind.toLowerCase()] ?? {};
        if (!(name in table) && !(def.rc.arrays && JSON.stringify(def.rc.arrays).includes(`${kind}.${name}`)))
          err(def.file, `${id}: ${kind}.${name} is not in ${f}'s ${kind.toLowerCase()} table`);
      }
    }
  }

  // ---- Sounds and textures
  for (const [name, def] of Object.entries(soundDefs))
    for (const s of def.sounds ?? []) {
      const p = typeof s === "string" ? s : s.name;
      if (!exists(p, [".ogg", ".wav", ".fsb"])) err("TACZ-R/sounds/sound_definitions.json", `"${name}": file ${p} not found`);
    }
  for (const f of ["TACZ-R/textures/item_texture.json", "TACZ-R/textures/terrain_texture.json"]) {
    for (const [name, t] of Object.entries(json.get(f)?.texture_data ?? {}))
      for (const p of [].concat(t.textures)) if (!exists(typeof p === "string" ? p : p.path, [".png", ".tga"])) err(f, `"${name}": ${JSON.stringify(p)} not found`);
  }

  // ---- Behavior pack
  const PJ = "TACZ-B/entities/player.json";
  const player = json.get(PJ)?.["minecraft:entity"];
  const events = new Set(Object.keys(player?.events ?? {})), groups = new Set(Object.keys(player?.component_groups ?? {}));
  const bpMap = player?.description?.animations ?? {};
  for (const [short, id] of Object.entries(bpMap)) {
    if (bpAnims.has(id)) usedBpAnims.add(id);
    else if (!bpControllers.has(id)) err(PJ, `animation "${short}": ${id} is not defined`);
  }
  for (const a of player?.description?.scripts?.animate ?? []) {
    const name = typeof a === "string" ? a : Object.keys(a)[0];
    if (!(name in bpMap)) err(PJ, `scripts.animate: "${name}" is not in animations`);
  }
  for (const id of Object.values(bpMap)) {
    const c = bpControllers.get(id);
    if (c) for (const [state, s] of Object.entries(c.ctrl.states ?? {})) for (const a of s.animations ?? []) {
      const name = typeof a === "string" ? a : Object.keys(a)[0];
      if (!(name in bpMap)) err(c.file, `${id} state ${state}: "${name}" is not in player.json animations`);
    }
  }
  for (const [ev, body] of Object.entries(player?.events ?? {})) {
    if (ev.startsWith("minecraft:")) continue; // vanilla player events
    const text = JSON.stringify(body);
    for (const m of text.matchAll(/"(?:add|remove)":\{"component_groups":\[([^\]]*)\]/g))
      for (const g of m[1].match(/"[^"]+"/g) ?? []) if (!groups.has(JSON.parse(g))) err(PJ, `event ${ev}: component group ${g} does not exist`);
  }
  // Commands anywhere in the behavior pack.
  const triggered = new Set();
  const commandSources = [
    ...[...json].filter(([f]) => f.startsWith("TACZ-B/")).map(([f, j]) => [f, JSON.stringify(j)]),
    ...files("TACZ-B/functions").filter((f) => f.endsWith(".mcfunction")).map((f) => [f, fs.readFileSync(path.join(root, f), "utf8")]),
  ];
  for (const [f, text] of commandSources) {
    for (const m of text.matchAll(/(?:^|["\s/])function ([\w/]+)/gm)) if (!functions.has(m[1])) err(f, `function ${m[1]} does not exist`);
    for (const m of text.matchAll(/"@s ([\w:.]+)"|event entity @\w(?:\[[^\]]*\])? ([\w:.]+)/g)) {
      const ev = m[1] ?? m[2];
      triggered.add(ev);
      if (!events.has(ev)) err(f, `event ${ev} does not exist in player.json`);
    }
    for (const m of text.matchAll(/playanimation @\S+ (animation\.[\w.]+)/g)) {
      usedRpAnims.add(m[1]);
      if (!rpAnims.has(m[1])) err(f, `playanimation ${m[1]} is not defined in the resource pack`);
    }
    for (const m of text.matchAll(/playsound ([\w.:/-]+)/g)) useSound(m[1], f, "playsound");
    for (const m of text.matchAll(/stopsound @\S+ ([\w.:/-]+)/g)) usedSounds.add(m[1]);
  }
  for (const f of files("TACZ-B/scripts").filter((f) => f.endsWith(".js"))) {
    const text = fs.readFileSync(path.join(root, f), "utf8");
    for (const m of text.matchAll(/playSound\("([^"]+)"/g)) useSound(m[1], f, "playSound");
    // Sounds chosen in code (playSound(headshot ? "a" : "b")): a string naming a sound counts as played.
    for (const m of text.matchAll(/"([\w.:/-]+)"/g)) if (soundDefs[m[1]]) usedSounds.add(m[1]);
    for (const m of text.matchAll(/event entity @s ([\w:.]+)/g)) triggered.add(m[1]);
    for (const m of text.matchAll(/"([a-z0-9_]+:[a-z0-9_]+)"/g)) triggered.add(m[1]); // sight events in config
  }
  // Guns with scriptFiring: combat/firing.js plays `<id>.shoot` (and `<id>.suppress` with a silencer).
  const weaponsSrc = fs.existsSync(path.join(root, "TACZ-B/scripts/config/weapons.js")) ? fs.readFileSync(path.join(root, "TACZ-B/scripts/config/weapons.js"), "utf8") : "";
  for (const m of weaponsSrc.matchAll(/^ {2}([a-z0-9_]+): \{[\s\S]*?^ {2}\},?$/gm)) {
    if (!/^ {4}scriptFiring: true,/m.test(m[0])) continue;
    const prefix = /^ {4}shootSound: "([\w.]+)",/m.exec(m[0])?.[1] ?? m[1];
    useSound(`${prefix}.shoot`, "TACZ-B/scripts/combat/firing.js", "playSound");
    if (/^ {4}suppressedFrom: /m.test(m[0])) useSound(`${prefix}.suppress`, "TACZ-B/scripts/combat/firing.js", "playSound");
    // Without shootAnimation, firing.js plays animation.<id>.shoot.sight / .nsight.
    if (!/^ {4}shootAnimation: /m.test(m[0])) for (const a of [`animation.${m[1]}.shoot.sight`, `animation.${m[1]}.shoot.nsight`]) {
      if (!rpAnims.has(a)) err("TACZ-B/scripts/config/weapons.js", `${m[1]}: firing.js plays ${a}, which doesn't exist`);
      usedRpAnims.add(a);
    }
    // shootAnimation names must exist (the BP shoot states that played them are gone).
    for (const a of m[0].matchAll(/"(animation\.[\w.]+)"/g)) { if (!rpAnims.has(a[1])) err("TACZ-B/scripts/config/weapons.js", `${m[1]}: shootAnimation ${a[1]} doesn't exist`); usedRpAnims.add(a[1]); }
  }
  const eventText = JSON.stringify(player?.events ?? {}) + JSON.stringify(player?.components ?? {}) + JSON.stringify(player?.component_groups ?? {});
  for (const ev of events)
    if (!ev.startsWith("minecraft:") && !MANUAL_EVENT.test(ev) && !triggered.has(ev) && !eventText.includes(`"${ev}"`)) warn(PJ, `event ${ev} is never triggered`);

  // ---- Structure the game expects (things JSON schemas don't check)
  const balanced = (s) => {
    let depth = 0, quote = null;
    for (const c of s) {
      if (quote) { if (c === quote) quote = null; continue; }
      if (c === "'") quote = c;
      else if (c === "(") depth++;
      else if (c === ")" && --depth < 0) return false;
    }
    return depth === 0 && !quote;
  };
  for (const [f, j] of json) {
    for (const [id, c] of Object.entries(j.animation_controllers ?? {})) {
      const states = c.states ?? {}, init = c.initial_state ?? "default";
      if (!states[init]) err(f, `${id}: initial_state "${init}" is not one of its states`);
      for (const [sn, st] of Object.entries(states)) {
        for (const t of st.transitions ?? []) {
          const [to, cond] = Object.entries(t)[0];
          if (!states[to]) err(f, `${id} state ${sn}: transition to "${to}", which is not a state`);
          if (typeof cond === "string" && !balanced(cond)) err(f, `${id} state ${sn} -> ${to}: unbalanced ( ) or ' ' in condition`);
        }
        // Entry/exit lines: "@s <event>" (no selector), "/command", or Molang ending in ";".
        if (f.startsWith("TACZ-B/"))
          for (const k of ["on_entry", "on_exit"]) for (const x of st[k] ?? [])
            if (!(/^@s [\w:.]+$/.test(x) || x.startsWith("/") || x.trim().endsWith(";")))
              err(f, `${id} state ${sn} ${k}: "${x}" is not "@s <event>", a "/command" or Molang (use "/event entity @s[...] <event>" for a selector)`);
      }
    }
    const geos = [...(j["minecraft:geometry"] ?? []), ...Object.entries(j).filter(([k]) => k.startsWith("geometry.")).map(([k, v]) => ({ description: { identifier: k }, ...v }))];
    for (const g of geos) {
      const names = new Set();
      for (const b of g.bones ?? []) { if (names.has(b.name)) err(f, `${g.description?.identifier}: bone "${b.name}" defined twice`); names.add(b.name); }
      for (const b of g.bones ?? []) if (b.parent && !names.has(b.parent)) err(f, `${g.description?.identifier}: bone "${b.name}" has parent "${b.parent}", which doesn't exist`);
    }
  }
  // Duplicate keys: the game keeps only one of them, silently.
  const { stripJson } = require("./lenient.cjs");
  for (const f of json.keys()) {
    const s = stripJson(fs.readFileSync(path.join(root, f), "utf8")), stack = [], re = /"(?:[^"\\]|\\.)*"\s*:|[{}\[\]]/g;
    let m;
    while ((m = re.exec(s))) {
      const t = m[0];
      if (t === "{") stack.push(new Set());
      else if (t === "[") stack.push(null);
      else if (t === "}" || t === "]") stack.pop();
      else {
        const k = t.slice(0, t.lastIndexOf(":")).trim(), top = stack[stack.length - 1];
        if (top) { if (top.has(k)) err(f, `key ${k} appears twice in the same object (only one is used)`); top.add(k); }
      }
    }
  }

  // ---- Unused (warnings)
  for (const [id, { file }] of rpAnims) if (!usedRpAnims.has(id)) warn(file, `${id} is never used`);
  for (const [id, { file }] of rpControllers) if (!usedRpAnims.has(id)) warn(file, `${id} is never used`);
  for (const [id, file] of bpAnims) if (!usedBpAnims.has(id)) warn(file, `${id} is never used`);
  for (const name of Object.keys(soundDefs)) if (!usedSounds.has(name)) warn("TACZ-R/sounds/sound_definitions.json", `sound "${name}" is never played`);
  return { problems, warnings };
}
module.exports = { checkPack };
