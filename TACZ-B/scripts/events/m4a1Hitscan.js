import { system, Player } from "@minecraft/server";
import { processGunHit } from "./projectileHitEntity.js";

const M4A1_HITSCAN_EVENT = "tacz:m4a1_hitscan";

const M4A1_MAX_DISTANCE = 128;

// Based on the original M4A1 projectile accuracy values.
// These are our starting values for the prototype and can be tuned later.
const M4A1_ADS_SPREAD_DEGREES = 0.5;
const M4A1_HIP_SPREAD_DEGREES = 5.2;

const TRACER_PARTICLE = "krep:hitscan_tracer";

const MAX_TRACER_POINTS = 6;
const MAX_BREAKABLE_BLOCKS = 4;

// The original bullet:m4a1 entity was allowed to break these.
const BREAKABLE_BLOCKS = new Set([
  "minecraft:glass",
  "minecraft:glass_pane",
  "minecraft:stained_glass",
  "minecraft:stained_glass_pane",
  "minecraft:wheat",
]);

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

function multiply(v, scalar) {
  return {
    x: v.x * scalar,
    y: v.y * scalar,
    z: v.z * scalar,
  };
}

function length(v) {
  return Math.sqrt(v.x * v.x + v.y * v.y + v.z * v.z);
}

function normalize(v) {
  const magnitude = length(v);

  if (magnitude <= 0.000001) {
    return {
      x: 0,
      y: 0,
      z: 1,
    };
  }

  return {
    x: v.x / magnitude,
    y: v.y / magnitude,
    z: v.z / magnitude,
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
// M4A1 SPREAD
// =====================================================

function applySpread(direction, spreadDegrees) {
  if (spreadDegrees <= 0) {
    return normalize(direction);
  }

  const forward = normalize(direction);

  // Avoid problems when looking almost perfectly vertical.
  const referenceUp =
    Math.abs(forward.y) > 0.98 ? { x: 1, y: 0, z: 0 } : { x: 0, y: 1, z: 0 };

  const right = normalize(cross(forward, referenceUp));

  const up = normalize(cross(right, forward));

  // Random point inside a circular accuracy cone.
  const radius =
    Math.tan((spreadDegrees * Math.PI) / 180) * Math.sqrt(Math.random());

  const angle = Math.random() * Math.PI * 2;

  const horizontal = Math.cos(angle) * radius;

  const vertical = Math.sin(angle) * radius;

  return normalize({
    x: forward.x + right.x * horizontal + up.x * vertical,

    y: forward.y + right.y * horizontal + up.y * vertical,

    z: forward.z + right.z * horizontal + up.z * vertical,
  });
}

// =====================================================
// BLOCK HIT LOCATION
// =====================================================

function getBlockHitLocation(blockHit) {
  const blockLocation = blockHit.block.location;

  const faceLocation = blockHit.faceLocation;

  return {
    x: blockLocation.x + faceLocation.x,

    y: blockLocation.y + faceLocation.y,

    z: blockLocation.z + faceLocation.z,
  };
}

// =====================================================
// ENTITY RAYCAST
// =====================================================

function getFirstDamageableEntityHit(
  dimension,
  origin,
  direction,
  maxDistance,
  shooter,
) {
  const hits = dimension.getEntitiesFromRay(origin, direction, {
    maxDistance,

    // Solid blocks stop the shot.
    ignoreBlockCollision: false,

    // The old projectile effectively lost nearly all
    // velocity in liquids, so treat liquid as blocking.
    includeLiquidBlocks: true,

    // Needed so wheat and similar blocks can be detected.
    includePassableBlocks: true,
  });

  // Do not rely on returned array order.
  hits.sort((a, b) => a.distance - b.distance);

  for (const hit of hits) {
    const entity = hit.entity;

    if (!entity) {
      continue;
    }

    // Never shoot ourselves.
    if (entity.id === shooter.id) {
      continue;
    }

    // Ignore old TACZ projectile entities from other weapons.
    if (entity.typeId?.startsWith("bullet:")) {
      continue;
    }

    // Ignore entities that cannot actually take TACZ health damage.
    if (!entity.getComponent("minecraft:health")) {
      continue;
    }

    return hit;
  }

  return undefined;
}

// =====================================================
// TRACE THE SHOT
// =====================================================

function traceShot(shooter, direction) {
  const dimension = shooter.dimension;

  const originalOrigin = shooter.getHeadLocation();

  // Move slightly forward so the ray does not begin
  // directly inside the player's own body.
  let origin = add(originalOrigin, multiply(direction, 0.15));

  let remainingDistance = M4A1_MAX_DISTANCE;

  let traveledDistance = 0.15;

  let finalLocation = add(
    originalOrigin,
    multiply(direction, M4A1_MAX_DISTANCE),
  );

  let entityHit;

  // ===================================================
  // GLASS / WHEAT PENETRATION
  //
  // The original M4A1 projectile had minecraft:break_blocks
  // for glass, panes, stained glass, and wheat.
  //
  // We preserve that here without spawning a bullet entity.
  // ===================================================

  for (
    let brokenBlocks = 0;
    brokenBlocks <= MAX_BREAKABLE_BLOCKS;
    brokenBlocks++
  ) {
    const blockHit = dimension.getBlockFromRay(origin, direction, {
      maxDistance: remainingDistance,

      includeLiquidBlocks: true,

      includePassableBlocks: true,
    });

    const entityRayHit = getFirstDamageableEntityHit(
      dimension,
      origin,
      direction,
      remainingDistance,
      shooter,
    );

    const blockLocation = blockHit ? getBlockHitLocation(blockHit) : undefined;

    const blockDistance = blockLocation
      ? length(subtract(blockLocation, origin))
      : Infinity;

    const entityDistance = entityRayHit?.distance ?? Infinity;

    // =================================================
    // ENTITY IS FIRST
    // =================================================

    if (entityRayHit && entityDistance <= blockDistance) {
      entityHit = entityRayHit;

      traveledDistance += entityDistance;

      finalLocation = add(origin, multiply(direction, entityDistance));

      break;
    }

    // =================================================
    // NOTHING WAS HIT
    // =================================================

    if (!blockHit || !blockLocation) {
      finalLocation = add(origin, multiply(direction, remainingDistance));

      traveledDistance += remainingDistance;

      break;
    }

    // =================================================
    // BLOCK WAS HIT
    // =================================================

    traveledDistance += blockDistance;

    finalLocation = blockLocation;

    // Normal solid block:
    // stop the shot.
    if (!BREAKABLE_BLOCKS.has(blockHit.block.typeId)) {
      break;
    }

    // Break glass / wheat like the original projectile.
    try {
      blockHit.block.setType("minecraft:air");
    } catch {}

    // Continue the ray just beyond the broken block.
    const stepForward = 0.05;

    origin = add(blockLocation, multiply(direction, stepForward));

    remainingDistance = M4A1_MAX_DISTANCE - traveledDistance - stepForward;

    if (remainingDistance <= 0) {
      break;
    }
  }

  return {
    entityHit,

    hitLocation: finalLocation,

    distance: Math.min(traveledDistance, M4A1_MAX_DISTANCE),

    // Start tracer slightly in front of the camera.
    tracerStart: add(originalOrigin, multiply(direction, 0.7)),
  };
}

// =====================================================
// TRACER
// =====================================================

function spawnTracer(dimension, start, end) {
  const delta = subtract(end, start);

  const distance = length(delta);

  if (distance <= 0.1) {
    return;
  }

  // Long shots do NOT produce hundreds of particles.
  //
  // Maximum:
  // 6 tracer particles per shot.
  const pointCount = Math.min(
    MAX_TRACER_POINTS,
    Math.max(1, Math.ceil(distance / 12)),
  );

  for (let i = 1; i <= pointCount; i++) {
    const t = i / (pointCount + 1);

    const location = {
      x: start.x + delta.x * t,

      y: start.y + delta.y * t,

      z: start.z + delta.z * t,
    };

    try {
      dimension.spawnParticle(TRACER_PARTICLE, location);
    } catch {}
  }
}

// =====================================================
// M4A1 HITSCAN EVENT
// =====================================================

system.afterEvents.scriptEventReceive.subscribe((event) => {
  if (event.id !== M4A1_HITSCAN_EVENT) {
    return;
  }

  const shooter = event.sourceEntity;

  if (!(shooter instanceof Player)) {
    return;
  }

  // The player entity tells us which firing mode triggered:
  //
  // ads
  // hip
  const mode = event.message.trim().toLowerCase();

  const spreadDegrees =
    mode === "ads" ? M4A1_ADS_SPREAD_DEGREES : M4A1_HIP_SPREAD_DEGREES;

  const direction = applySpread(shooter.getViewDirection(), spreadDegrees);

  const result = traceShot(shooter, direction);

  // Visual only.
  // Damage is already hitscan.
  spawnTracer(shooter.dimension, result.tracerStart, result.hitLocation);

  if (!result.entityHit) {
    return;
  }

  // Reuse Change #9's shared damage system.
  processGunHit({
    source: shooter,

    target: result.entityHit.entity,

    hitLocation: result.hitLocation,

    weaponId: "m4a1",
  });
});
