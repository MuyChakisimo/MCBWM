import { system, world } from "@minecraft/server";

import { getWeaponConfig } from "../config/weapons.js";
import { profileCount } from "../core/profiler.js";

// =====================================================
// TACZ PHYSICAL PROJECTILE CLEANUP
//
// Only RPG remains physical. Preserve the old 10-tick safety cleanup
// without subscribing/scheduling work for every firearm shot.
// =====================================================

const RPG = getWeaponConfig("rpg");
const RPG_PROJECTILE_ID = RPG?.physicalProjectile?.typeId ?? "bullet:rpg";
const RPG_CLEANUP_TICKS = RPG?.physicalProjectile?.cleanupTicks ?? 10;

world.afterEvents.entitySpawn.subscribe((event) => {
  const entity = event.entity;

  if (entity?.typeId !== RPG_PROJECTILE_ID) {
    return;
  }

  profileCount("rpgSpawns");

  system.runTimeout(() => {
    try {
      entity.remove();
    } catch {
      // Projectile already despawned, hit something, or became invalid.
    }
  }, RPG_CLEANUP_TICKS);
});
