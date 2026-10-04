// Keeps the facts in each gun's item lore true to config/weapons.js:
//
//   node tools/weapons/lore-sync.mjs        rewrite the lore in en_US.lang / en_UK.lang, then config/lore.js
//
// Per gun (krep:gun.<id>.lore and krep:gun.<id>_emp.lore):
//   Group    from its category (CATEGORIES in weapons.js; the empty item says "Empty Guns")
//   Caliber  its ammo's name (krep:ammo.name.<key> in en_US.lang, without " Ammo")
//   Damage   its damage (x pellets for shotguns: "3×12")
// Guns ported from Java (PORTED in java.cjs) also get Java's full name as "Type" (or the class, e.g. "Assault
// Rifle", when the full name is just the item's name) and Java's description as the flavour line: before this they
// showed the lore of the gun they were cloned from (v1.32.0: the Springfield 1873 said "RPG-7 Rocket, Damage 100").
// check.mjs refuses lore whose Group / Caliber / Damage disagree with the config. java-port.mjs runs this.
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { pathToFileURL } from "node:url";
const require = createRequire(import.meta.url);

const LANGS = ["TACZ-R/texts/en_US.lang", "TACZ-R/texts/en_UK.lang"];
const TYPE = { ar: "Assault Rifle", lmg: "Light Machine Gun", smg: "Submachine Gun", pistol: "Pistol", sniper: "Sniper Rifle", shotgun: "Shotgun", heavy: "Heavy Weapon" };

/** Group, Caliber and Damage text for a gun, from the config (and the English ammo names). */
export function loreFacts(id, WEAPONS, CATEGORIES, AMMO, langText) {
  const w = WEAPONS[id];
  const cat = CATEGORIES[w.category];
  if (!cat) throw new Error(`${id}: category "${w.category}" is not in CATEGORIES (config/weapons.js)`);
  const ammo = AMMO[w.ammo?.replace(/^krep:/, "")];
  // krep:ammo.lore.<key> -> krep:ammo.name.<key>; the minigun's ammo box has no name key (ammo.js name).
  const nameKey = ammo?.lore?.includes(".lore.") ? ammo.lore.replace(".lore.", ".name.") : null;
  const langName = nameKey && new RegExp(`^${nameKey.replace(/\./g, "\\.")}=(.*)$`, "m").exec(langText)?.[1]?.trim();
  return {
    group: `${cat.colour}${cat.name}`,
    caliber: (langName ?? ammo?.name ?? "-").replace(/ Ammo$/, ""),
    damage: (w.pellets ?? 1) > 1 ? `${w.damage}×${w.pellets}` : `${w.damage}`,
  };
}

/** The Group / Caliber / Damage written in a lore line ("" when missing). */
export function loreFactsOf(line) {
  return {
    group: /Group: (§.[^§\\]*)/.exec(line)?.[1]?.trim() ?? "",
    caliber: /Caliber: ([^\\§]*)/.exec(line)?.[1]?.trim() ?? "",
    damage: /Damage: ([^\\§]*)/.exec(line)?.[1]?.trim() ?? "",
  };
}

export async function syncLore(root, log = console.log) {
  const abs = (f) => path.join(root, f);
  const { WEAPONS, CATEGORIES } = await import(pathToFileURL(abs("TACZ-B/scripts/config/weapons.js")).href + "?t=" + Date.now());
  const { AMMO } = await import(pathToFileURL(abs("TACZ-B/scripts/config/ammo.js")).href + "?t=" + Date.now());
  const { openJava, PORTED } = require("./java.cjs");
  const java = fs.existsSync(abs("reference/TACZ-JAVA.zip")) ? openJava(root) : null;
  const javaText = java ? JSON.parse(java.read("assets/tacz/lang/en_us.json").toString("utf8")) : {};
  const javaOf = Object.fromEntries(Object.entries(PORTED).map(([j, ours]) => [ours, j]));
  const en = fs.readFileSync(abs(LANGS[0]), "utf8");
  const changed = new Set();
  for (const file of LANGS) {
    const raw = fs.readFileSync(abs(file), "utf8"), crlf = raw.includes("\r\n");
    const lines = raw.replace(/\r\n/g, "\n").split("\n");
    for (const [id, w] of Object.entries(WEAPONS)) {
      const f = loreFacts(id, WEAPONS, CATEGORIES, AMMO, en);
      const jid = javaOf[id], jName = jid && javaText[`tacz.gun.${jid}.name`], jDesc = jid && javaText[`tacz.gun.${jid}.desc`];
      const norm = (s) => s.toLowerCase().replace(/[^a-z0-9]/g, "");
      const type = jName && norm(jName) !== norm(w.name) ? jName : TYPE[w.category];
      for (const [key, group] of [[`krep:gun.${id}.lore=`, f.group], [`krep:gun.${id}_emp.lore=`, "§7Empty Guns"]]) {
        const i = lines.findIndex((l) => l.startsWith(key));
        if (i < 0) continue;
        let text = lines[i].slice(key.length);
        if (jName && jDesc) text = `§fType: ${type} \\n§fGroup: ${group}§r \\n§f${jDesc} \\n\\n§fCaliber: ${f.caliber} \\nDamage: ${f.damage}§r \\n\\n§1Translated TACZ pack`;
        else text = text
          .replace(/Group: §.(?:§.)?[^§\\]*/, `Group: ${group}`)
          .replace(/Caliber: [^\\§]*/, `Caliber: ${f.caliber} `)
          .replace(/Damage: [^\\§]*/, `Damage: ${f.damage}`);
        if (lines[i] !== key + text) { lines[i] = key + text; changed.add(id); }
      }
    }
    const out = lines.join("\n");
    fs.writeFileSync(abs(file), crlf ? out.replace(/\n/g, "\r\n") : out);
  }
  // config/lore.js from the English lang file (as lore.cjs does).
  const { generateLore, LORE_FILE, LANG_FILE } = require("./lore.cjs");
  const loreOut = abs(LORE_FILE), text = generateLore(fs.readFileSync(abs(LANG_FILE), "utf8"));
  const crlf = fs.existsSync(loreOut) && fs.readFileSync(loreOut, "utf8").includes("\r\n");
  fs.writeFileSync(loreOut, crlf ? text.split("\n").join("\r\n") : text);
  log(`   lore: ${changed.size ? `updated ${[...changed].join(", ")}` : "already right"}${java ? "" : " (no Java zip: ported guns' Type / description not refreshed)"}`);
  return [...changed];
}

if (process.argv[1]?.endsWith("lore-sync.mjs")) await syncLore(process.cwd());
