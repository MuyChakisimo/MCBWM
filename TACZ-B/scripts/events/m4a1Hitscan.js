import { system, Player } from "@minecraft/server";
import { processGunHit } from "./projectileHitEntity.js";

// =====================================================
// M4A1 HITSCAN TEST
//
// CHANGE #10B
//
// PURPOSE:
//
// Continue the basic M4A1 hitscan test from Change #10A,
// but now solid blocks stop the shot.
//
// This version intentionally still has:
//
// - No tracer
// - No spread
// - No glass breaking
// - No penetration through blocks
//
// =====================================================

const M4A1_HITSCAN_EVENT = "tacz:m4a1_hitscan";

const M4A1_MAX_DISTANCE = 128;

// =====================================================
// GET HIT LOCATION
// =====================================================

function getHitLocation(shooter, distance) {
  const origin = shooter.getHeadLocation();

  const direction = shooter.getViewDirection();

  return {
    x: origin.x + direction.x * distance,

    y: origin.y + direction.y * distance,

    z: origin.z + direction.z * distance,
  };
}

// =====================================================
// FIND FIRST VALID TARGET
// =====================================================

function getFirstTarget(shooter) {
  const hits = shooter.getEntitiesFromViewDirection({
    maxDistance: M4A1_MAX_DISTANCE,

    // CHANGE #10B:
    //
    // Solid blocks now stop the raycast.
    ignoreBlockCollision: false,
  });

  if (!hits || hits.length === 0) {
    return undefined;
  }

  // Do not assume Bedrock returns the array sorted.
  hits.sort((a, b) => a.distance - b.distance);

  for (const hit of hits) {
    const entity = hit.entity;

    if (!entity) {
      continue;
    }

    // Never hit the shooter.
    if (entity.id === shooter.id) {
      continue;
    }

    // Ignore TACZ projectile entities
    // from weapons that still use projectiles.
    if (entity.typeId && entity.typeId.startsWith("bullet:")) {
      continue;
    }

    // processGunHit requires an entity
    // with a health component.
    const health = entity.getComponent("minecraft:health");

    if (!health) {
      continue;
    }

    return hit;
  }

  return undefined;
}

// =====================================================
// SCRIPT EVENT
// =====================================================

system.afterEvents.scriptEventReceive.subscribe((event) => {
  if (event.id !== M4A1_HITSCAN_EVENT) {
    return;
  }

  const shooter = event.sourceEntity;

  if (!(shooter instanceof Player)) {
    console.warn(
      "[TACZ M4A1 Hitscan] " +
        "Received hitscan event without a Player source.",
    );

    return;
  }

  try {
    const hit = getFirstTarget(shooter);

    // Crosshair did not intersect
    // a valid entity.
    if (!hit) {
      return;
    }

    const hitLocation = getHitLocation(shooter, hit.distance);

    processGunHit({
      source: shooter,

      target: hit.entity,

      hitLocation: hitLocation,

      weaponId: "m4a1",
    });
  } catch (error) {
    console.error("[TACZ M4A1 Hitscan] Error:", error);
  }
});
