// Reads the Java TACZ gun pack straight from reference/TACZ-JAVA.zip (no extracting).
//   const java = openJava(root);  java.list(prefix) -> paths;  java.read(path) -> Buffer;
//   java.json(path) -> parsed (Java files have // comments);  java.gunData(javaId), java.gunIds()
// Paths are relative to the gun pack: "data/tacz/data/guns/aug_data.json",
// "assets/tacz/geo_models/gun/aug_geo.json", "assets/tacz/tacz_sounds/aug/aug_shoot.ogg" ...
const fs = require("fs");
const path = require("path");
const zlib = require("zlib");
const { parse } = require("./lenient.cjs");

const PACK = "assets/tacz/custom/tacz_default_gun/";

function openJava(root, zipPath = path.join(root, "reference", "TACZ-JAVA.zip")) {
  if (!fs.existsSync(zipPath)) throw new Error(`${zipPath} not found (the Java TACZ download goes in reference/)`);
  const buf = fs.readFileSync(zipPath);
  // Central directory: every entry's name, compression and offset.
  let end = buf.length - 22;
  while (end >= 0 && buf.readUInt32LE(end) !== 0x06054b50) end--;
  const count = buf.readUInt16LE(end + 10);
  let at = buf.readUInt32LE(end + 16);
  const entries = new Map();
  for (let i = 0; i < count; i++) {
    const method = buf.readUInt16LE(at + 10), size = buf.readUInt32LE(at + 20);
    const nameLen = buf.readUInt16LE(at + 28), extraLen = buf.readUInt16LE(at + 30), commentLen = buf.readUInt16LE(at + 32);
    const local = buf.readUInt32LE(at + 42);
    const name = buf.toString("utf8", at + 46, at + 46 + nameLen);
    at += 46 + nameLen + extraLen + commentLen;
    if (name.startsWith(PACK) && !name.endsWith("/")) entries.set(name.slice(PACK.length), { method, size, local });
  }
  const read = (p) => {
    const e = entries.get(p);
    if (!e) throw new Error(`not in the Java pack: ${p}`);
    const start = e.local + 30 + buf.readUInt16LE(e.local + 26) + buf.readUInt16LE(e.local + 28);
    const data = buf.subarray(start, start + e.size);
    return e.method === 0 ? Buffer.from(data) : zlib.inflateRawSync(data);
  };
  const json = (p) => parse(read(p).toString("utf8"));
  return {
    has: (p) => entries.has(p),
    list: (prefix = "") => [...entries.keys()].filter((p) => p.startsWith(prefix)).sort(),
    read,
    json,
    gunIds: () => [...entries.keys()].filter((p) => p.startsWith("data/tacz/data/guns/")).map((p) => path.basename(p, "_data.json")).sort(),
    gunData: (id) => json(`data/tacz/data/guns/${id}_data.json`),
    gunIndex: (id) => json(`data/tacz/index/guns/${id}.json`),
  };
}

// Java gun id -> our id, for the guns both versions have.
const JAVA_TO_OURS = {
  aa12: "aa12", ai_awp: "awp", ak47: "akm", b93r: "b93", deagle: "deagle", deagle_golden: "deagleg", fn_evolys: "evolys",
  fn_fal: "fal", g36k: "g36", glock_17: "g17", hk416d: "hk416", hk_g3: "g3", hk_mp5a5: "mp5", m1014: "m1014", m107: "m107",
  m16a1: "m16a1", m16a4: "m16", m1911: "m1911", m249: "m249", m4a1: "m4a1", m870: "m870", minigun: "minigun", mk14: "mk14",
  p320: "p320", p90: "p90", qbz_191: "qbz191", qbz_95: "qbz95", rpg7: "rpg", scar_h: "scarh", scar_l: "scarl",
  sks_tactical: "sks", timeless50: "t50", type_81: "type81", ump45: "ump", uzi: "uzi", vector45: "vector", db_short: "db",
};

// Java gun id -> our id, for the guns ported from Java (java-port.mjs); add each new port here.
const PORTED = {
  cz75: "cz75", db_long: "dblong", hk_mk23: "mk23", kar98: "kar98", m320: "m320", m700: "m700", m95: "m95b", m9a4: "m9a4",
  rhino357: "rhino357", rpk: "rpk", spas_12: "spas12", spr15hb: "spr15", taurus500: "taurus500", taurus943: "taurus943",
  aug: "aug", lonetrail: "lonetrail", springfield1873: "springfield1873",
};

module.exports = { openJava, JAVA_TO_OURS, PORTED };
