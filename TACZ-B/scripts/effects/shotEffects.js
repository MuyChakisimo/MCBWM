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

function subtract(a, b) {
  return { x: a.x - b.x, y: a.y - b.y, z: a.z - b.z };
}

function vectorLength(vector) {
  return Math.sqrt(
    vector.x * vector.x +
    vector.y * vector.y +
    vector.z * vector.z
  );
}

function normalize(vector) {
  const length = vectorLength(vector);

  if (length <= 0.000001) {
    return { x: 0, y: 0, z: 1 };
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

function getTracerStart(shooter, direction, mode) {
  const head = shooter.getHeadLocation();
  const up = { x: 0, y: 1, z: 0 };

  let right = cross(up, direction);

  if (vectorLength(right) <= 0.000001) {
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

export function spawnSmokeTracer({
  shooter,
  endLocation,
  mode,
  particleCount = 5,
}) {
  if (particleCount <= 0) {
    return;
  }

  const direction = normalize(shooter.getViewDirection());
  const startLocation = getTracerStart(shooter, direction, mode);
  const delta = subtract(endLocation, startLocation);
  const distance = vectorLength(delta);

  if (distance <= TRACER_MIN_DISTANCE) {
    return;
  }

  // Fixed count per visible tracer. Five puffs gives the line-like
  // smoke trail that tested well without returning to the old 24
  // particles-per-shot flame chain.
  const count = Math.max(1, Math.floor(particleCount));

  for (let i = 1; i <= count; i++) {
    const t = i / (count + 1);

    const location = {
      x: startLocation.x + delta.x * t,
      y: startLocation.y + delta.y * t,
      z: startLocation.z + delta.z * t,
    };

    try {
      shooter.dimension.spawnParticle(
        "minecraft:basic_smoke_particle",
        location,
      );
    } catch (error) {
      console.error(
        "[TACZ Effects] Smoke tracer particle failed:",
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

  try {
    dimension.spawnParticle(particleId, location);
  } catch (error) {
    console.error(
      "[TACZ Effects] Impact particle failed:",
      error,
    );
  }
}
