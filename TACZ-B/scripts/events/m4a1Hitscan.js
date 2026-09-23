import { system, Player, MolangVariableMap } from "@minecraft/server";

import { processGunHit } from "./projectileHitEntity.js";

// =====================================================
// M4A1 HITSCAN
//
// CHANGE #10E
//
// Proper visual tracer segments.
//
// Preserved:
// - Instant hitscan damage
// - Solid block collision
// - Existing hit flame
// - Existing recoil
// - Existing ammo / reload / sounds
// - ADS / hip-fire muzzle alignment
//
// Changed:
// - Temporary vanilla flame tracer path
//   replaced with custom elongated tracer segments
//
// Still NOT included:
// - Hip-fire spread
// - ADS spread
// - Glass penetration
//
// =====================================================

const M4A1_HITSCAN_EVENT = "tacz:m4a1_hitscan";

const M4A1_MAX_DISTANCE = 128;

const M4A1_TRACER_PARTICLE = "krep:m4a1_tracer";

const M4A1_TRACER_MAX_SEGMENTS = 10;

const M4A1_TRACER_SEGMENT_SPACING = 3;

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

    // Ignore projectiles from weapons that still use
    // the old entity-projectile system.
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
// Used only to determine where the cosmetic tracer
// should stop when no entity is hit.
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
// ADS alignment was confirmed visually.
//
// Hip-fire uses the mirrored horizontal offset that was
// confirmed to line up much better with the barrel.
//
// This affects ONLY the cosmetic tracer.
//
// Actual hitscan direction remains the player's view ray.
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
// VISUAL TRACER
//
// CHANGE #10E
//
// The proven tracer path is preserved.
//
// Instead of vanilla flame dots, each point now spawns
// one elongated custom particle aligned with the shot.
//
// The particle receives:
// - shot direction
// - segment length
//
// The Resource Pack particle uses a tiny velocity only
// to give Bedrock a direction for billboard alignment.
//
// It does NOT visually travel downrange.
//
// Particle count stays capped at 10, matching the prior
// diagnostic tracer cap.
//
// =====================================================

function spawnTracer(shooter, endLocation, mode) {
  const viewDirection = normalize(shooter.getViewDirection());

  const startLocation = getTracerStart(shooter, viewDirection, mode);

  const delta = subtract(endLocation, startLocation);

  const distance = vectorLength(delta);

  if (distance <= 0.05) {
    return;
  }

  const tracerDirection = normalize(delta);

  const segmentCount = Math.min(
    M4A1_TRACER_MAX_SEGMENTS,

    Math.max(
      2,

      Math.ceil(distance / M4A1_TRACER_SEGMENT_SPACING),
    ),
  );

  const distancePerSegment = distance / segmentCount;

  // Make each streak occupy most of its portion
  // of the ray while leaving a slight visual break.
  //
  // The maximum prevents long-distance misses from
  // creating enormous individual billboards.
  const segmentLength = Math.min(
    3.0,

    Math.max(0.45, distancePerSegment * 0.72),
  );

  for (let i = 0; i < segmentCount; i++) {
    // Center each tracer segment inside
    // its section of the ray.
    const t = (i + 0.5) / segmentCount;

    const location = {
      x: startLocation.x + delta.x * t,

      y: startLocation.y + delta.y * t,

      z: startLocation.z + delta.z * t,
    };

    const variables = new MolangVariableMap();

    variables.setVector3("variable.tacz_direction", tracerDirection);

    variables.setFloat("variable.tacz_segment_length", segmentLength);

    try {
      shooter.dimension.spawnParticle(
        M4A1_TRACER_PARTICLE,
        location,
        variables,
      );
    } catch (error) {
      console.error(
        "[TACZ M4A1 Hitscan] " + "Failed to spawn tracer segment:",
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
// Existing successful hit confirmation stays unchanged.
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

  // plalyer.json sends either:
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

    // Cosmetic tracer endpoint.
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
