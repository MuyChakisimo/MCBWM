import { profileCount } from "../debug/profiler.js";

import {
  add,
  cross,
  multiply,
  normalize,
  pointAlongRay,
} from "../utils/vector.js";

// =====================================================
// TACZ RAYCAST HELPERS
// =====================================================

function getNearestValidEntityHit(shooter, direction, maxDistance) {
  profileCount("entityRaycasts");

  const hits = shooter.dimension.getEntitiesFromRay(
    shooter.getHeadLocation(),
    direction,
    {
      maxDistance,
      ignoreBlockCollision: false,
      includeLiquidBlocks: false,
      includePassableBlocks: false,
    },
  );

  let nearest;

  for (const hit of hits ?? []) {
    const entity = hit.entity;

    if (!entity || entity.id === shooter.id) {
      continue;
    }

    if (entity.typeId?.startsWith("bullet:")) {
      continue;
    }

    if (!entity.getComponent("minecraft:health")) {
      continue;
    }

    if (!nearest || hit.distance < nearest.distance) {
      nearest = hit;
    }
  }

  return nearest;
}

function getBlockHit(shooter, direction, maxDistance) {
  profileCount("blockRaycasts");

  const blockHit = shooter.dimension.getBlockFromRay(
    shooter.getHeadLocation(),
    direction,
    {
      maxDistance,
      includeLiquidBlocks: false,
      includePassableBlocks: false,
    },
  );

  if (!blockHit) {
    return undefined;
  }

  const blockLocation = blockHit.block.location;
  const faceLocation = blockHit.faceLocation;

  return {
    block: blockHit.block,
    face: blockHit.face,
    location: {
      x: blockLocation.x + faceLocation.x,
      y: blockLocation.y + faceLocation.y,
      z: blockLocation.z + faceLocation.z,
    },
  };
}

export function castEntityRay(shooter, direction, maxDistance) {
  const normalizedDirection = normalize(direction);
  const hit = getNearestValidEntityHit(
    shooter,
    normalizedDirection,
    maxDistance,
  );

  if (!hit) {
    return undefined;
  }

  return {
    entity: hit.entity,
    distance: hit.distance,
    location: pointAlongRay(
      shooter.getHeadLocation(),
      normalizedDirection,
      hit.distance,
    ),
  };
}

export function castRay(shooter, direction, maxDistance) {
  const normalizedDirection = normalize(direction);
  const entityHit = castEntityRay(
    shooter,
    normalizedDirection,
    maxDistance,
  );

  if (entityHit) {
    return {
      entityHit,
      blockHit: undefined,
      blockHitLocation: undefined,
      endLocation: entityHit.location,
    };
  }

  const blockHit = getBlockHit(
    shooter,
    normalizedDirection,
    maxDistance,
  );

  return {
    entityHit: undefined,
    blockHit,
    blockHitLocation: blockHit?.location,
    endLocation:
      blockHit?.location ??
      add(
        shooter.getHeadLocation(),
        multiply(normalizedDirection, maxDistance),
      ),
  };
}

export function randomDirectionInCone(forwardDirection, spreadDegrees) {
  const forward = normalize(forwardDirection);

  if (!spreadDegrees || spreadDegrees <= 0) {
    return forward;
  }

  // Build an orthonormal basis around the forward vector.
  // Use a fallback axis when looking almost straight up/down.
  const referenceUp =
    Math.abs(forward.y) > 0.98
      ? { x: 1, y: 0, z: 0 }
      : { x: 0, y: 1, z: 0 };

  const right = normalize(cross(referenceUp, forward));
  const up = normalize(cross(forward, right));

  // Uniform distribution across the circular cross-section of the cone.
  const maxRadius = Math.tan((spreadDegrees * Math.PI) / 180);
  const radius = Math.sqrt(Math.random()) * maxRadius;
  const angle = Math.random() * Math.PI * 2;

  const horizontal = Math.cos(angle) * radius;
  const vertical = Math.sin(angle) * radius;

  return normalize(
    add(
      forward,
      add(
        multiply(right, horizontal),
        multiply(up, vertical),
      ),
    ),
  );
}
