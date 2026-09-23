import { system, Player } from "@minecraft/server";
import { processGunHit } from "./projectileHitEntity.js";

// =====================================================
// M4A1 HITSCAN TEST
//
// CHANGE #10A
//
// PURPOSE:
//
// Test ONLY whether the M4A1 can reliably damage the
// entity directly under the player's crosshair without
// spawning bullet:m4a1.
//
// This version intentionally has:
//
// - No tracer
// - No spread
// - No glass breaking
// - No penetration
// - No custom block processing
//
// Block collision is intentionally ignored during this
// test so we can isolate entity hit registration first.
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

    // IMPORTANT:
    //
    // Change #10A is testing entity registration only.
    //
    // We will turn block collision back on after this
    // test succeeds.
    ignoreBlockCollision: true,
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

    // Ignore TACZ projectile entities from other guns.
    if (entity.typeId && entity.typeId.startsWith("bullet:")) {
      continue;
    }

    // processGunHit requires something with health.
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

  // We expect this event to come directly from the
  // player entity through plalyer.json.
  if (!(shooter instanceof Player)) {
    console.warn(
      "[TACZ M4A1 Hitscan] " +
        "Received hitscan event without a Player source.",
    );

    return;
  }

  try {
    const hit = getFirstTarget(shooter);

    // Crosshair did not intersect an entity.
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
