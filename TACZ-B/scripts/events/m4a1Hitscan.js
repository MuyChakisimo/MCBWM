import { system, Player } from "@minecraft/server";
import { processGunHit } from "./projectileHitEntity.js";

// =====================================================
// M4A1 HITSCAN
//
// CHANGE #10C
//
// Added:
// - Visible hit confirmation particle
//
// Still intentionally NOT included:
// - Tracer
// - Hip-fire spread
// - ADS spread
// - Glass penetration
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

    // Change #10B:
    // Solid blocks stop the shot.
    ignoreBlockCollision: false,
  });

  if (!hits || hits.length === 0) {
    return undefined;
  }

  hits.sort((a, b) => a.distance - b.distance);

  for (const hit of hits) {
    const entity = hit.entity;

    if (!entity) {
      continue;
    }

    if (entity.id === shooter.id) {
      continue;
    }

    if (entity.typeId && entity.typeId.startsWith("bullet:")) {
      continue;
    }

    const health = entity.getComponent("minecraft:health");

    if (!health) {
      continue;
    }

    return hit;
  }

  return undefined;
}

// =====================================================
// HIT FEEDBACK
// =====================================================

function showHitFeedback(dimension, hitLocation) {
  try {
    dimension.spawnParticle("minecraft:basic_flame_particle", hitLocation);
  } catch (error) {
    console.error(
      "[TACZ M4A1 Hitscan] " + "Failed to spawn hit particle:",
      error,
    );
  }
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

    if (!hit) {
      return;
    }

    const hitLocation = getHitLocation(shooter, hit.distance);

    // Existing TACZ damage system.
    processGunHit({
      source: shooter,

      target: hit.entity,

      hitLocation: hitLocation,

      weaponId: "m4a1",
    });

    // Change #10C:
    // Visual confirmation only.
    showHitFeedback(shooter.dimension, hitLocation);
  } catch (error) {
    console.error("[TACZ M4A1 Hitscan] Error:", error);
  }
});
