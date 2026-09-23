import { system, Player } from "@minecraft/server";

import { processGunHit } from "./projectileHitEntity.js";

// =====================================================
// M4A1 HITSCAN
//
// CHANGE #10D.2
//
// Diagnostic tracer test.
//
// Added:
// - Vanilla flame particles drawn along the shot path
//
// Preserved:
// - Instant hitscan damage
// - Block collision
// - Existing impact flame
// - Existing recoil
// - Existing ammo / reload / sounds
//
// Still NOT included:
// - Hip-fire spread
// - ADS spread
// - Glass penetration
//
// Custom tracer particle is NOT used in this test.
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

    // processGunHit requires a health component.
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
// Used only to determine where the diagnostic tracer
// should stop when no entity is hit.
//
// Actual hitscan block collision is still handled by
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
// Server script does not currently know the exact
// animated gun-barrel position.
//
// Start slightly:
// - forward
// - downward
// - toward the player's right
//
// This gives us an approximate first-person muzzle
// location for the diagnostic tracer.
//
// =====================================================

function getTracerStart(shooter, direction) {
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

  return {
    x: head.x + direction.x * 0.55 + right.x * 0.16,

    y: head.y + direction.y * 0.55 - 0.12,

    z: head.z + direction.z * 0.55 + right.z * 0.16,
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

  // No entity hit, but a block stopped the shot.
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
// CHANGE #10D.2
//
// Instead of using the custom krep:m4a1_tracer
// particle, draw several known-working vanilla flame
// particles along the shot path.
//
// This is intentionally temporary.
//
// If these appear correctly, then we know:
//
// - tracer start is correct
// - tracer end is correct
// - shot path calculation is correct
// - particle spawning works
//
// and the old custom particle definition was the issue.
//
// =====================================================

function spawnTracer(shooter, endLocation) {
  const direction = normalize(shooter.getViewDirection());

  const startLocation = getTracerStart(shooter, direction);

  const delta = subtract(endLocation, startLocation);

  const distance = vectorLength(delta);

  if (distance <= 0.05) {
    return;
  }

  // Approximately one particle every 3 blocks.
  //
  // Minimum: 2
  // Maximum: 10
  //
  // The cap keeps automatic fire from producing
  // excessive numbers of particles.
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
// Keep exactly as tested.
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

  try {
    const direction = normalize(shooter.getViewDirection());

    const hit = getFirstTarget(shooter);

    const hitLocation = hit ? getHitLocation(shooter, hit.distance) : undefined;

    // =================================================
    // CHANGE #10D.2
    //
    // Draw diagnostic particles for every shot:
    //
    // Entity hit:
    // muzzle -> entity
    //
    // Block hit:
    // muzzle -> block
    //
    // Complete miss:
    // muzzle -> max range
    //
    // Damage is still instantaneous.
    // =================================================

    const tracerEnd = getTracerEnd(shooter, direction, hitLocation);

    spawnTracer(shooter, tracerEnd);

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

    // Change #10C:
    // Existing impact confirmation.
    showHitFeedback(shooter.dimension, hitLocation);
  } catch (error) {
    console.error("[TACZ M4A1 Hitscan] Error:", error);
  }
});
