// Cosmetic shot effects for hitscan guns. These never decide whether a shot hits.

const TRACER_MIN_DISTANCE = 1.25;
const TRACER_FORWARD_OFFSET = 0.55;
const TRACER_VERTICAL_OFFSET = -0.12;
// Sideways offset of the tracer start from the eyes, tuned in game to line up with the muzzle.
const TRACER_ADS_SIDE_OFFSET = 0.16;
const TRACER_HIP_SIDE_OFFSET = -0.16;

const subtract = (a, b) => ({ x: a.x - b.x, y: a.y - b.y, z: a.z - b.z });
const length = (v) => Math.sqrt(v.x * v.x + v.y * v.y + v.z * v.z);

function normalize(v) {
  const len = length(v);
  if (len <= 0.000001) return { x: 0, y: 0, z: 1 };
  return { x: v.x / len, y: v.y / len, z: v.z / len };
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
  let right = cross({ x: 0, y: 1, z: 0 }, direction);
  right = length(right) <= 0.000001 ? { x: 1, y: 0, z: 0 } : normalize(right);
  const side = mode === "ads" ? TRACER_ADS_SIDE_OFFSET : TRACER_HIP_SIDE_OFFSET;

  return {
    x: head.x + direction.x * TRACER_FORWARD_OFFSET + right.x * side,
    y: head.y + direction.y * TRACER_FORWARD_OFFSET + TRACER_VERTICAL_OFFSET,
    z: head.z + direction.z * TRACER_FORWARD_OFFSET + right.z * side,
  };
}

// A short line of evenly spaced smoke puffs from the muzzle to the impact point.
export function spawnSmokeTracer({ shooter, endLocation, mode, particleCount = 5 }) {
  if (particleCount <= 0) return;

  const direction = normalize(shooter.getViewDirection());
  const start = getTracerStart(shooter, direction, mode);
  const delta = subtract(endLocation, start);
  if (length(delta) <= TRACER_MIN_DISTANCE) return;

  const count = Math.max(1, Math.floor(particleCount));
  for (let i = 1; i <= count; i++) {
    const t = i / (count + 1);
    const location = { x: start.x + delta.x * t, y: start.y + delta.y * t, z: start.z + delta.z * t };
    try {
      shooter.dimension.spawnParticle("minecraft:basic_smoke_particle", location);
    } catch (error) {
      console.error("[TACZ Effects] Smoke tracer particle failed:", error);
    }
  }
}

export function spawnImpactEffect({ dimension, location, particleId = "minecraft:basic_smoke_particle" }) {
  if (!location) return;
  try {
    dimension.spawnParticle(particleId, location);
  } catch (error) {
    console.error("[TACZ Effects] Impact particle failed:", error);
  }
}
