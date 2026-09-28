// Shared by tools/weapons/reorganize.cjs and verify-pack.cjs: every definition in both packs.
// A "definition" is one identifier-bearing object: an animation, an animation controller, a
// render controller, a geometry, an item, an attachable, an entity or a client entity.
const fs = require("fs");
const path = require("path");
const { loadAll } = require("./lenient.cjs");

const MAP_KINDS = ["animations", "animation_controllers", "render_controllers"];
const SINGLE_KINDS = ["minecraft:item", "minecraft:attachable", "minecraft:entity", "minecraft:client_entity", "minecraft:block"];

/** [{ file, kind, id, formatVersion, json, fileInfo }] for every definition under root/<pack>. */
function collectDefinitions(root) {
  const defs = [], files = [];
  for (const pack of ["TACZ-B", "TACZ-R"]) {
    for (const x of loadAll(path.join(root, pack))) {
      const rel = path.relative(root, x.file).split(path.sep).join("/");
      const info = { file: rel, error: x.error, kinds: new Set(), otherKeys: [], legacyInherit: false, count: 0 };
      files.push(info);
      if (!x.json) continue;
      const j = x.json;
      for (const k of Object.keys(j)) {
        if (k === "format_version") continue;
        if (MAP_KINDS.includes(k)) {
          for (const [id, def] of Object.entries(j[k])) { defs.push({ file: rel, pack, kind: k, id, formatVersion: j.format_version, json: def }); info.count++; }
          info.kinds.add(k);
        } else if (k === "minecraft:geometry") {
          for (const g of j[k]) { defs.push({ file: rel, pack, kind: "geometry", id: g.description.identifier, formatVersion: j.format_version, json: g }); info.count++; }
          info.kinds.add("geometry");
        } else if (k.startsWith("geometry.")) {
          if (k.includes(":")) info.legacyInherit = true;
          defs.push({ file: rel, pack, kind: "geometry_legacy", id: k, formatVersion: j.format_version, json: j[k] }); info.count++;
          info.kinds.add("geometry_legacy");
        } else if (SINGLE_KINDS.includes(k)) {
          defs.push({ file: rel, pack, kind: k, id: j[k].description?.identifier, formatVersion: j.format_version, json: j[k] }); info.count++;
          info.kinds.add(k);
        } else info.otherKeys.push(k);
      }
    }
  }
  return { defs, files };
}

// Canonical form: key-sorted JSON, so formatting/key order differences don't matter.
const canon = (v) => (Array.isArray(v) ? v.map(canon) : v && typeof v === "object" ? Object.fromEntries(Object.keys(v).sort().map((k) => [k, canon(v[k])])) : v);
const defKey = (d) => `${d.pack}|${d.kind}|${d.id}`;
const defValue = (d) => JSON.stringify({ fv: d.formatVersion ?? null, def: canon(d.json) });

module.exports = { collectDefinitions, defKey, defValue, canon };
