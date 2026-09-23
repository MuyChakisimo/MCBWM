import { world } from "@minecraft/server";
import { WEAPONS, LEGACY_WEAPON_ALIASES } from "../config/weapons.js";

world.sendMessage("§a[TACZ] Global.js LOADED");
console.warn("[TACZ] Global.js initialized");

// Build the legacy Indoarsenal damage registry from the centralized
// weapon configuration. processGunHit() still reads this object, so
// legacy projectile weapons and new hitscan weapons share one source
// of damage/penetration values during the migration.
const bullets = {};

for (const [weaponId, weapon] of Object.entries(WEAPONS)) {
  if (
    typeof weapon.damage !== "number" ||
    typeof weapon.penetration !== "number"
  ) {
    continue;
  }

  bullets[weaponId] = Object.freeze({
    damage: weapon.damage,
    penetration: weapon.penetration,
  });
}

// Temporary compatibility aliases for the two original registry typos.
for (const [legacyId, normalizedId] of Object.entries(LEGACY_WEAPON_ALIASES)) {
  if (bullets[normalizedId]) {
    bullets[legacyId] = bullets[normalizedId];
  }
}

globalThis.Indoarsenal = Object.freeze({
  bullets: Object.freeze(bullets),
});
