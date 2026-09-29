// Java TACZ stats vs ours (reads reference/TACZ-JAVA.zip).
//
//   node tools/weapons/java-stats.mjs            report: shared guns side by side, proposed stats for the rest
//   node tools/weapons/java-stats.mjs --json     the same data as JSON (used by the porting tools)
//
// How Java numbers map onto ours (measured on the 37 guns both versions have, see the report):
//   damage      Java `bullet.damage` is per shot; with pellets it is split across them. Ours is per
//               pellet. Most single-bullet guns match Java or were tuned down; a new gun gets Java's
//               damage x the median ours/Java ratio of its category.
//   penetration Java `armor_ignore` is a different system (ours: armor x (1 - pen) / 20). A new gun
//               gets the median of its category, moved by how far its armor_ignore is from that
//               category's median.
//   rpm, fireMode, headshot  taken from Java (fireMode = Java's first fire mode).
import { createRequire } from "node:module";
import { pathToFileURL } from "node:url";
import path from "node:path";
const require = createRequire(import.meta.url);
const { openJava, JAVA_TO_OURS } = require("./java.cjs");

const root = process.cwd();
const { WEAPONS } = await import(pathToFileURL(path.join(root, "TACZ-B/scripts/config/weapons.js")).href);
const java = openJava(root);

const median = (xs) => {
  const s = xs.filter((x) => Number.isFinite(x)).sort((a, b) => a - b);
  return s.length ? (s.length % 2 ? s[(s.length - 1) / 2] : (s[s.length / 2 - 1] + s[s.length / 2]) / 2) : NaN;
};
const round = (x, step = 0.05) => +(Math.round(x / step) * step).toFixed(2);
const CATEGORY = { rifle: "rifle", smg: "smg", pistol: "pistol", sniper: "sniper", shotgun: "shotgun", mg: "rifle", rpg: "heavy" };

function javaStats(jid) {
  const d = java.gunData(jid), b = d.bullet ?? {}, x = b.extra_damage ?? {};
  const pellets = b.bullet_amount ?? 1;
  return {
    javaId: jid,
    type: java.gunIndex(jid).type,
    ammo: d.ammo,
    damage: b.damage,
    damagePerPellet: b.damage / pellets,
    pellets,
    armorIgnore: x.armor_ignore ?? 0,
    headshot: x.head_shot_multiplier ?? 1,
    falloff: x.damage_adjust ?? null,
    magazine: d.ammo_amount ?? null,
    extendedMags: d.extended_mag_ammo_amount ?? null,
    rpm: d.rpm,
    fireModes: d.fire_mode ?? [],
    bolt: d.bolt,
    inaccuracy: d.inaccuracy ?? null,
  };
}

// Shared guns: ours vs Java, per category.
const shared = [];
for (const [jid, id] of Object.entries(JAVA_TO_OURS)) {
  const w = WEAPONS[id];
  if (!w) continue;
  const j = javaStats(jid);
  shared.push({ id, category: w.category, ours: { damage: w.damage, pellets: w.pellets ?? 1, penetration: w.penetration, magazine: w.magazine }, java: j, ratio: w.damage / j.damagePerPellet });
}
const byCategory = {};
for (const s of shared) (byCategory[s.category] ??= []).push(s);
const scale = {};
for (const [c, list] of Object.entries(byCategory))
  scale[c] = { damage: median(list.map((s) => s.ratio)), penetration: median(list.map((s) => s.ours.penetration)), armorIgnore: median(list.map((s) => s.java.armorIgnore)) };

// Java-only guns: proposed stats.
const ours = new Set(Object.values(JAVA_TO_OURS));
const proposed = [];
for (const jid of java.gunIds().filter((j) => !JAVA_TO_OURS[j])) {
  const j = javaStats(jid);
  const category = CATEGORY[j.type] ?? "rifle";
  const s = scale[category] ?? scale.rifle;
  proposed.push({
    javaId: jid,
    category,
    damage: round(j.damagePerPellet * s.damage, 0.5),
    pellets: j.pellets,
    penetration: Math.min(1, Math.max(0, round(s.penetration + (j.armorIgnore - s.armorIgnore)))),
    magazine: j.magazine,
    ammo: j.ammo,
    rpm: j.rpm,
    fireMode: j.fireModes[0] ?? "semi",
    headshot: j.headshot,
    bolt: j.bolt,
  });
}
void ours;

if (process.argv.includes("--json")) {
  console.log(JSON.stringify({ shared, scale, proposed }, null, 2));
} else {
  const pad = (v, n) => String(v ?? "-").padEnd(n);
  console.log("Shared guns (ours vs Java; damage per pellet):\n");
  console.log(pad("gun", 9) + pad("cat", 8) + pad("dmg o/j", 11) + pad("x", 6) + pad("pellets", 9) + pad("pen/armorIgn", 14) + pad("mag o/j", 9) + pad("rpm", 6) + pad("hs", 6) + "modes");
  for (const s of shared)
    console.log(pad(s.id, 9) + pad(s.category, 8) + pad(`${s.ours.damage}/${+s.java.damagePerPellet.toFixed(2)}`, 11) + pad(s.ratio.toFixed(2), 6) + pad(`${s.ours.pellets}/${s.java.pellets}`, 9) +
      pad(`${s.ours.penetration}/${s.java.armorIgnore}`, 14) + pad(`${s.ours.magazine}/${s.java.magazine}`, 9) + pad(s.java.rpm, 6) + pad(s.java.headshot, 6) + s.java.fireModes.join(","));
  console.log("\nPer category (median): damage ours/Java, penetration, Java armor_ignore");
  for (const [c, v] of Object.entries(scale)) console.log(`  ${pad(c, 8)} x${v.damage.toFixed(2)}  pen ${v.penetration}  armorIgnore ${v.armorIgnore}`);
  console.log("\nJava-only guns (proposed):\n");
  console.log(pad("java id", 17) + pad("cat", 8) + pad("dmg", 6) + pad("pellets", 8) + pad("pen", 6) + pad("mag", 5) + pad("rpm", 6) + pad("mode", 7) + pad("hs", 6) + "ammo");
  for (const p of proposed)
    console.log(pad(p.javaId, 17) + pad(p.category, 8) + pad(p.damage, 6) + pad(p.pellets, 8) + pad(p.penetration, 6) + pad(p.magazine, 5) + pad(p.rpm, 6) + pad(p.fireMode, 7) + pad(p.headshot, 6) + p.ammo);
}
