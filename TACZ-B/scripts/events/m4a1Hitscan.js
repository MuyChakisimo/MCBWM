import { system, Player, MolangVariableMap } from "@minecraft/server";

import { processGunHit } from "./projectileHitEntity.js";

// =====================================================
// M4A1 HITSCAN
//
// CHANGE #10D
//
// Added:
// - Moving visual tracer
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
// =====================================================

const M4A1_HITSCAN_EVENT = "tacz:m4a1_hitscan";

const M4A1_MAX_DISTANCE = 128;

const TRACER_PARTICLE = "krep:m4a1_tracer";

const TRACER_BASE_SPEED = 160;

// Ensures very close shots are still visible.
const TRACER_MIN_LIFETIME = 0.04;

// Prevents very long shots from looking slow.
const TRACER_MAX_LIFETIME = 0.16;

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
    // blocks stop the ray.
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

    // Ignore projectiles from guns
    // that still use the old system.
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
// BLOCK HIT LOCATION
//
// Used only for tracer visuals.
//
// Damage block collision is still handled by
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
// We don't currently have the actual animated gun muzzle
// position available to server script.
//
// This starts the tracer slightly:
// - forward
// - down
// - to the player's right
//
// so it appears much closer to the weapon barrel than
// spawning directly from the player's eyes.
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
// TRACER
// =====================================================

function spawnTracer(shooter, endLocation) {
  const direction = normalize(shooter.getViewDirection());

  const startLocation = getTracerStart(shooter, direction);

  const delta = subtract(endLocation, startLocation);

  const distance = vectorLength(delta);

  if (distance <= 0.05) {
    return;
  }

  const travelDirection = normalize(delta);

  // Normally this uses the configured tracer speed.
  //
  // Close shots are given a minimum lifetime so the
  // tracer remains visible for at least a short moment.
  //
  // Long shots are capped so the tracer never looks
  // unusually slow.
  const naturalLifetime = distance / TRACER_BASE_SPEED;

  const lifetime = Math.min(
    TRACER_MAX_LIFETIME,

    Math.max(TRACER_MIN_LIFETIME, naturalLifetime),
  );

  // Adjust speed so the particle reaches the actual
  // endpoint exactly when its lifetime expires.
  const speed = distance / lifetime;

  const variables = new MolangVariableMap();

  variables.setSpeedAndDirection(
    "variable.tacz_tracer",
    speed,
    travelDirection,
  );

  variables.setFloat("variable.tacz_lifetime", lifetime);

  try {
    shooter.dimension.spawnParticle(TRACER_PARTICLE, startLocation, variables);
  } catch (error) {
    console.error("[TACZ M4A1 Hitscan] " + "Failed to spawn tracer:", error);
  }
}

// =====================================================
// HIT FEEDBACK
//
// Change #10C.
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
    // CHANGE #10D
    //
    // Spawn tracer for EVERY shot:
    //
    // entity hit  -> tracer stops at entity
    // block hit   -> tracer stops at block
    // miss        -> tracer travels to max range
    //
    // Damage remains immediate.
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

    // Change #10C impact feedback.
    showHitFeedback(shooter.dimension, hitLocation);
  } catch (error) {
    console.error("[TACZ M4A1 Hitscan] Error:", error);
  }
});
