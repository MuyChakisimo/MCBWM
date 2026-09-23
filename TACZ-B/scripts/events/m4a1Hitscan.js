import { system, Player } from "@minecraft/server";

import { processGunHit } from "./projectileHitEntity.js";

// =====================================================
// M4A1 HITSCAN
//
// CHANGE #10D.3
//
// Diagnostic flame tracer with separate ADS / hip-fire
// visual origin alignment.
//
// Preserved:
// - Instant hitscan damage
// - Solid block collision
// - Existing hit flame
// - Existing recoil
// - Existing ammo / reload / sounds
//
// Added:
// - ADS / hip-fire tracer origin distinction
//
// Still NOT included:
// - Hip-fire spread
// - ADS spread
// - Glass penetration
// - Final bullet-line tracer appearance
//
// =====================================================

const M4A1_HITSCAN_EVENT = "tacz:m4a1_hitscan";

const M4A1_MAX_DISTANCE = 128;

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

    // Ignore projectiles from guns
    // that still use the old projectile system.
    if (entity.typeId?.startsWith("bullet:")) {
      continue;
    }

    // processGunHit requires
    // an entity with health.
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
// Used only to determine where the tracer should stop
// when no entity is hit.
//
// Actual damage block collision is still handled by
// getEntitiesFromViewDirection().
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
// APPROXIMATE MUZZLE LOCATION
//
// ADS is already visually aligned correctly.
//
// Hip fire uses a mirrored horizontal offset because
// the first-person barrel appears on the opposite side
// from the previous tracer origin.
//
// This affects ONLY the cosmetic tracer.
//
// Actual hitscan still fires from the player's
// view direction.
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

  // ADS:
  // Keep the alignment that already looked correct.
  //
  // HIP:
  // Mirror the horizontal offset.
  const sideOffset = mode === "hip" ? -0.16 : 0.16;

  return {
    x: head.x + direction.x * 0.55 + right.x * sideOffset,

    y: head.y + direction.y * 0.55 - 0.12,

    z: head.z + direction.z * 0.55 + right.z * sideOffset,
  };
}

// =====================================================
// TRACER END LOCATION
// =====================================================

function getTracerEnd(shooter, direction, entityHitLocation) {
  // Entity was hit.
  if (entityHitLocation) {
    return entityHitLocation;
  }

  // No entity hit, but a block
  // stopped the shot.
  const blockHitLocation = getBlockHitLocation(shooter);

  if (blockHitLocation) {
    return blockHitLocation;
  }

  // Complete miss.
  const head = shooter.getHeadLocation();

  return add(head, multiply(direction, M4A1_MAX_DISTANCE));
}

// =====================================================
// DIAGNOSTIC TRACER
//
// Uses vanilla flame particles because these have
// already been confirmed to render correctly.
//
// This is still temporary.
//
// Once ADS and hip-fire alignment are confirmed,
// these flame particles can be replaced with the
// proper bullet-line tracer.
//
// =====================================================

function spawnTracer(shooter, endLocation, mode) {
  const direction = normalize(shooter.getViewDirection());

  const startLocation = getTracerStart(shooter, direction, mode);

  const delta = subtract(endLocation, startLocation);

  const distance = vectorLength(delta);

  if (distance <= 0.05) {
    return;
  }

  // Approximately one particle every 3 blocks.
  //
  // Minimum:
  // 2 particles
  //
  // Maximum:
  // 10 particles
  //
  // This cap prevents automatic fire from producing
  // excessive particle counts.
  const particleCount = Math.min(10, Math.max(2, Math.ceil(distance / 3)));

  for (let i = 1; i <= particleCount; i++) {
    const t = i / (particleCount + 1);

    const location = {
      x: startLocation.x + delta.x * t,

      y: startLocation.y + delta.y * t,

      z: startLocation.z + delta.z * t,
    };

    try {
      shooter.dimension.spawnParticle(
        "minecraft:basic_flame_particle",
        location,
      );
    } catch (error) {
      console.error(
        "[TACZ M4A1 Hitscan] " + "Failed to spawn tracer particle:",
        error,
      );
    }
  }
}

// =====================================================
// HIT FEEDBACK
//
// Change #10C.
//
// Existing successful hit confirmation.
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

    const hit = getFirstTarget(shooter);

    const hitLocation = hit ? getHitLocation(shooter, hit.distance) : undefined;

    // =================================================
    // TRACER
    //
    // Entity hit:
    // muzzle -> entity
    //
    // Block hit:
    // muzzle -> block
    //
    // Complete miss:
    // muzzle -> maximum range
    //
    // This is cosmetic only.
    //
    // Damage remains instantaneous.
    // =================================================

    const tracerEnd = getTracerEnd(shooter, direction, hitLocation);

    spawnTracer(shooter, tracerEnd, mode);

    // No entity was hit.
    if (!hit || !hitLocation) {
      return;
    }

    // Existing TACZ damage.
    processGunHit({
      source: shooter,

      target: hit.entity,

      hitLocation: hitLocation,

      weaponId: "m4a1",
    });

    // Existing Change #10C
    // impact confirmation.
    showHitFeedback(shooter.dimension, hitLocation);
  } catch (error) {
    console.error("[TACZ M4A1 Hitscan] Error:", error);
  }
});
