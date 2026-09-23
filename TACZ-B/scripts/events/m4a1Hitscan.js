import { system, Player } from "@minecraft/server";

import { processGunHit } from "./projectileHitEntity.js";

// =====================================================
// M4A1 HITSCAN
//
// CHANGE #10E
//
// Uses a short glowing model beam for the tracer,
// based on TACZ's existing laser attachment rendering.
//
// Preserved:
// - Instant hitscan damage
// - Solid block collision
// - Existing impact flame
// - Existing recoil / ammo / reload / sounds
//
// =====================================================

const M4A1_HITSCAN_EVENT = "tacz:m4a1_hitscan";

const M4A1_MAX_DISTANCE = 128;

const M4A1_TRACER_PROPERTY = "krep:m4a1tracer";

// =====================================================
// ENTITY HIT LOCATION
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

    // Ignore remaining TACZ projectile entities.
    if (entity.typeId?.startsWith("bullet:")) {
      continue;
    }

    if (!entity.getComponent("minecraft:health")) {
      continue;
    }

    return hit;
  }

  return undefined;
}

// =====================================================
// TRACER FLASH
//
// The tracer is now geometry attached directly to the
// M4A1 model.
//
// Turning this property on makes that glowing geometry
// visible briefly.
//
// We keep it enabled for 3 ticks so the client has enough
// time to receive and render the client-synced property.
// This is intentionally a little generous for this visual test.
// =====================================================

function flashTracer(shooter) {
  try {
    shooter.setProperty(M4A1_TRACER_PROPERTY, 1);
  } catch (error) {
    console.error("[TACZ M4A1 Hitscan] Failed to enable tracer:", error);

    return;
  }

  system.runTimeout(() => {
    try {
      shooter.setProperty(M4A1_TRACER_PROPERTY, 0);
    } catch (error) {
      console.error("[TACZ M4A1 Hitscan] Failed to disable tracer:", error);
    }
  }, 3);
}

// =====================================================
// HIT FEEDBACK
//
// Existing Change #10C flame impact.
// =====================================================

function showHitFeedback(dimension, hitLocation) {
  try {
    dimension.spawnParticle("minecraft:basic_flame_particle", hitLocation);
  } catch (error) {
    console.error("[TACZ M4A1 Hitscan] Failed to spawn hit particle:", error);
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
    // Cosmetic tracer flash.
    flashTracer(shooter);

    // Existing hitscan target detection.
    const hit = getFirstTarget(shooter);

    if (!hit) {
      return;
    }

    const hitLocation = getHitLocation(shooter, hit.distance);

    // Existing TACZ damage.
    processGunHit({
      source: shooter,
      target: hit.entity,
      hitLocation,
      weaponId: "m4a1",
    });

    // Existing impact confirmation.
    showHitFeedback(shooter.dimension, hitLocation);
  } catch (error) {
    console.error("[TACZ M4A1 Hitscan] Error:", error);
  }
});
