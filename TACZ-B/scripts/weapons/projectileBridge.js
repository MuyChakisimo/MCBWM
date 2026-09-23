import { world } from "@minecraft/server";

import { processGunHit } from "./damage.js";

// =====================================================
// TACZ PHYSICAL PROJECTILE BRIDGE
//
// Conventional firearms are hitscan. RPG is intentionally physical.
// This bridge preserves the original direct-hit TACZ damage behavior
// for the RPG in addition to its entity-defined explosion behavior.
// =====================================================

const RPG_PROJECTILE_ID = "bullet:rpg";

world.afterEvents.projectileHitEntity.subscribe((event) => {
  const { projectile, source, location } = event;

  if (projectile?.typeId !== RPG_PROJECTILE_ID) {
    return;
  }

  const target = event.getEntityHit()?.entity;

  if (!target) {
    return;
  }

  processGunHit({
    source,
    target,
    hitLocation: location,
    weaponId: "rpg",
  });
});
