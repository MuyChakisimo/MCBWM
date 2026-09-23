import { system, Player, MolangVariableMap } from "@minecraft/server";

import { processGunHit } from "./projectileHitEntity.js";

// =====================================================
// M4A1 HITSCAN
//
// CHANGE #10E
//
// Yellow particle tracer.
//
// Preserved:
// - Instant hitscan damage
// - Solid block collision
// - Existing impact flame
// - Existing recoil
// - Existing ammo / reload / sounds
// - ADS / hip-fire muzzle alignment
//
// Tracer:
// - Uses vanilla colored flame particles
// - Bright yellow / gold
// - Stops at entities
// - Stops at solid blocks
// - Travels toward max range on a complete miss
//
// Still NOT included:
// - Hip-fire spread
// - ADS spread
// - Glass penetration
//
// =====================================================

const M4A1_HITSCAN_EVENT = "tacz:m4a1_hitscan";

const M4A1_MAX_DISTANCE = 128;

// =====================================================
// VISUAL TRACER SETTINGS
//
// Damage is still instantaneous hitscan.
//
// This only controls the cosmetic bullet streak.
//
// One particle is created per shot and travels rapidly
// from the visual muzzle position toward the actual
// entity / block / maximum-range endpoint.
// =====================================================

// Visual travel speed in blocks per second.
//
// This is intentionally extremely fast.
// It should look like a rifle tracer, not a projectile.
const M4A1_TRACER_SPEED = 600;

// Length of the visible streak itself.
//
// This is NOT the total shot distance.
// It is the length of the tiny moving tracer.
const M4A1_TRACER_LENGTH = 0.9;

// =====================================================
// VECTOR HELPERS
// =====================================================

function add(a, b) {
  return {
    x: a.x + b.x,
    y: a.y + b.y,
    z: a.z + b.z,
  };
}

function subtract(a, b) {
  return {
    x: a.x - b.x,
    y: a.y - b.y,
    z: a.z - b.z,
  };
}

function multiply(vector, scalar) {
  return {
    x: vector.x * scalar,

    y: vector.y * scalar,

    z: vector.z * scalar,
  };
}

function vectorLength(vector) {
  return Math.sqrt(
    vector.x * vector.x + vector.y * vector.y + vector.z * vector.z,
  );
}

function normalize(vector) {
  const length = vectorLength(vector);

  if (length <= 0.000001) {
    return {
      x: 0,
      y: 0,
      z: 1,
    };
  }

  return {
    x: vector.x / length,

    y: vector.y / length,

    z: vector.z / length,
  };
}

function cross(a, b) {
  return {
    x: a.y * b.z - a.z * b.y,

    y: a.z * b.x - a.x * b.z,

    z: a.x * b.y - a.y * b.x,
  };
}

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

    // Change #10B:
    // Solid blocks stop the ray.
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

    // Never hit the shooter.
    if (entity.id === shooter.id) {
      continue;
    }

    // Ignore TACZ projectile entities from
    // weapons that still use the old system.
    if (entity.typeId?.startsWith("bullet:")) {
      continue;
    }

    // processGunHit requires an entity
    // with a health component.
    if (!entity.getComponent("minecraft:health")) {
      continue;
    }

    return hit;
  }

  return undefined;
}

// =====================================================
// BLOCK HIT LOCATION
//
// Used to make the VISUAL tracer stop on the surface
// of a solid block.
//
// Damage block collision is still handled separately
// by getEntitiesFromViewDirection().
//
// =====================================================

function getBlockHitLocation(shooter) {
  const blockHit = shooter.getBlockFromViewDirection({
    maxDistance: M4A1_MAX_DISTANCE,

    includeLiquidBlocks: false,

    includePassableBlocks: false,
  });

  if (!blockHit) {
    return undefined;
  }

  const blockLocation = blockHit.block.location;

  const faceLocation = blockHit.faceLocation;

  return {
    x: blockLocation.x + faceLocation.x,

    y: blockLocation.y + faceLocation.y,

    z: blockLocation.z + faceLocation.z,
  };
}

// =====================================================
// TRACER START
//
// Preserve the muzzle alignment that already passed
// during the flame-particle test.
//
// ADS:
// +0.16 horizontal offset
//
// HIP:
// -0.16 horizontal offset
//
// This affects ONLY the visual tracer.
//
// Actual damage still follows the player's view ray.
//
// =====================================================

function getTracerStart(shooter, direction, mode) {
  const head = shooter.getHeadLocation();

  const up = {
    x: 0,
    y: 1,
    z: 0,
  };

  let right = cross(up, direction);

  if (vectorLength(right) <= 0.000001) {
    right = {
      x: 1,
      y: 0,
      z: 0,
    };
  } else {
    right = normalize(right);
  }

  const sideOffset = mode === "hip" ? -0.16 : 0.16;

  return {
    x: head.x + direction.x * 0.55 + right.x * sideOffset,

    y: head.y + direction.y * 0.55 - 0.12,

    z: head.z + direction.z * 0.55 + right.z * sideOffset,
  };
}

// =====================================================
// TRACER END
//
// Entity hit:
//   muzzle -> entity
//
// Block hit:
//   muzzle -> block surface
//
// Complete miss:
//   muzzle -> max range
//
// =====================================================

function getTracerEnd(shooter, direction, entityHitLocation) {
  // Entity was hit.
  if (entityHitLocation) {
    return entityHitLocation;
  }

  // No entity hit.
  // Check whether a block stopped the shot.
  const blockHitLocation = getBlockHitLocation(shooter);

  if (blockHitLocation) {
    return blockHitLocation;
  }

  // Complete miss.
  const head = shooter.getHeadLocation();

  return add(head, multiply(direction, M4A1_MAX_DISTANCE));
}

// =====================================================
// YELLOW TRACER
//
// Uses Minecraft's colored flame particle.
//
// Several closely spaced particles are spawned along
// the already-proven tracer path.
//
// This is cosmetic only.
// Damage remains instantaneous.
//
// =====================================================

function spawnTracer(shooter, endLocation, mode) {
  const viewDirection = normalize(shooter.getViewDirection());

  const startLocation = getTracerStart(shooter, viewDirection, mode);

  // Travel from the VISUAL muzzle position directly
  // toward the actual hit / block / miss endpoint.
  //
  // This is slightly different from simply using the
  // player's view direction because the visual muzzle
  // is intentionally offset for ADS / hip fire.
  const delta = subtract(endLocation, startLocation);

  const distance = vectorLength(delta);

  if (distance <= 0.05) {
    return;
  }

  const tracerDirection = normalize(delta);

  // Particle lifetime is calculated from:
  //
  // distance / visual speed
  //
  // so the cosmetic tracer expires approximately when
  // it reaches the endpoint instead of continuing
  // through a wall or target.
  const tracerLifetime = distance / M4A1_TRACER_SPEED;

  const variables = new MolangVariableMap();

  variables.setVector3("variable.tacz_direction", tracerDirection);

  variables.setFloat("variable.tacz_speed", M4A1_TRACER_SPEED);

  variables.setFloat("variable.tacz_lifetime", tracerLifetime);

  variables.setFloat("variable.tacz_length", M4A1_TRACER_LENGTH);

  try {
    shooter.dimension.spawnParticle(
      "krep:m4a1_tracer",
      startLocation,
      variables,
    );
  } catch (error) {
    console.error("[TACZ M4A1 Hitscan] Failed to spawn tracer:", error);
  }
}

// =====================================================
// HIT FEEDBACK
//
// Change #10C.
//
// Keep the existing regular flame particle only at the
// actual entity impact location.
//
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

  // plalyer.json sends:
  //
  // tacz:m4a1_hitscan ads
  //
  // or:
  //
  // tacz:m4a1_hitscan hip
  const mode = (event.message ?? "").trim().toLowerCase();

  try {
    const direction = normalize(shooter.getViewDirection());

    // =================================================
    // ENTITY HIT
    // =================================================

    const hit = getFirstTarget(shooter);

    const hitLocation = hit ? getHitLocation(shooter, hit.distance) : undefined;

    // =================================================
    // VISUAL TRACER
    //
    // Entity:
    // stops at entity.
    //
    // Wall:
    // stops at wall.
    //
    // Miss:
    // travels toward max distance.
    // =================================================

    const tracerEnd = getTracerEnd(shooter, direction, hitLocation);

    spawnTracer(shooter, tracerEnd, mode);

    // Nothing with health was hit.
    if (!hit || !hitLocation) {
      return;
    }

    // =================================================
    // EXISTING TACZ DAMAGE
    // =================================================

    processGunHit({
      source: shooter,

      target: hit.entity,

      hitLocation: hitLocation,

      weaponId: "m4a1",
    });

    // =================================================
    // EXISTING IMPACT FEEDBACK
    // =================================================

    showHitFeedback(shooter.dimension, hitLocation);
  } catch (error) {
    console.error("[TACZ M4A1 Hitscan] Error:", error);
  }
});
