import { profileCount } from "../debug/profiler.js";

import {
  cross,
  length,
  normalize,
  subtract,
} from "../utils/vector.js";

// =====================================================
// TACZ SHOT EFFECTS
//
// Cosmetic only. These effects never determine whether a shot
// hits or how much damage it deals.
// =====================================================

const TRACER_MIN_DISTANCE = 1.25;
const TRACER_FORWARD_OFFSET = 0.55;
const TRACER_VERTICAL_OFFSET = -0.12;
const TRACER_ADS_SIDE_OFFSET = 0.16;
const TRACER_HIP_SIDE_OFFSET = -0.16;

function getTracerStart(shooter, direction, mode) {
  const head = shooter.getHeadLocation();
  const up = { x: 0, y: 1, z: 0 };

  let right = cross(up, direction);

  if (length(right) <= 0.000001) {
    right = { x: 1, y: 0, z: 0 };
  } else {
    right = normalize(right);
  }

  const sideOffset =
    mode === "ads"
      ? TRACER_ADS_SIDE_OFFSET
      : TRACER_HIP_SIDE_OFFSET;

  return {
    x:
      head.x +
      direction.x * TRACER_FORWARD_OFFSET +
      right.x * sideOffset,
    y:
      head.y +
      direction.y * TRACER_FORWARD_OFFSET +
      TRACER_VERTICAL_OFFSET,
    z:
      head.z +
      direction.z * TRACER_FORWARD_OFFSET +
      right.z * sideOffset,
  };
}

export function spawnTracer({
  shooter,
  endLocation,
  mode,
  particleCount = 5,
  particleId = "minecraft:basic_smoke_particle",
}) {
  if (!endLocation || particleCount <= 0) {
    return;
  }

  const direction = normalize(shooter.getViewDirection());
  const startLocation = getTracerStart(shooter, direction, mode);
  const delta = subtract(endLocation, startLocation);
  const tracerDistance = length(delta);

  if (tracerDistance <= TRACER_MIN_DISTANCE) {
    return;
  }

  const count = Math.max(1, Math.floor(particleCount));
  profileCount("tracerParticles", count);

  for (let i = 1; i <= count; i++) {
    const t = i / (count + 1);

    const location = {
      x: startLocation.x + delta.x * t,
      y: startLocation.y + delta.y * t,
      z: startLocation.z + delta.z * t,
    };

    try {
      shooter.dimension.spawnParticle(
        particleId,
        location,
      );
    } catch (error) {
      console.error(
        "[TACZ Effects] Tracer particle failed:",
        error,
      );
    }
  }
}

export function spawnImpactEffect({
  dimension,
  location,
  particleId = "minecraft:basic_smoke_particle",
}) {
  if (!location) {
    return;
  }

  profileCount("impactParticles");

  try {
    dimension.spawnParticle(particleId, location);
  } catch (error) {
    console.error(
      "[TACZ Effects] Impact particle failed:",
      error,
    );
  }
}
