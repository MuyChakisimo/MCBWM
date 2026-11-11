// Cosmetic shot effects for hitscan guns. These never decide whether a shot hits.
import { MolangVariableMap } from "@minecraft/server";

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
      // Past the server's ticking area (small tick-distance): the rest of the line is out there too.
      if (/LocationInUnloadedChunk|not in a chunk currently loaded/.test(`${error?.name ?? ""} ${error}`)) break;
      console.error("[TACZ Effects] Smoke tracer particle failed:", error);
    }
  }
}

export function spawnImpactEffect({ dimension, location, particleId = "minecraft:basic_smoke_particle" }) {
  if (!location) return;
  try {
    dimension.spawnParticle(particleId, location);
  } catch (error) {
    if (/LocationInUnloadedChunk|not in a chunk currently loaded/.test(`${error?.name ?? ""} ${error}`)) return;
    console.error("[TACZ Effects] Impact particle failed:", error);
  }
}

// Glowing tracer streak (RP particle krep:tracer) flying from the muzzle to where the shot ended. Starts a little in
// front of the muzzle so the shooter doesn't get a streak across their own screen.
const TRACER_START_AHEAD = 1.5;
export function spawnTracer({ shooter, endLocation, mode, particleId = "krep:tracer" }) {
  const aim = normalize(shooter.getViewDirection());
  const muzzle = getTracerStart(shooter, aim, mode);
  const delta = subtract(endLocation, muzzle);
  const total = length(delta);
  if (total <= TRACER_START_AHEAD + TRACER_MIN_DISTANCE) return;
  const dir = normalize(delta);
  const start = { x: muzzle.x + dir.x * TRACER_START_AHEAD, y: muzzle.y + dir.y * TRACER_START_AHEAD, z: muzzle.z + dir.z * TRACER_START_AHEAD };
  const vars = new MolangVariableMap();
  vars.setFloat("variable.dx", dir.x);
  vars.setFloat("variable.dy", dir.y);
  vars.setFloat("variable.dz", dir.z);
  vars.setFloat("variable.len", total - TRACER_START_AHEAD);
  try {
    shooter.dimension.spawnParticle(particleId, start, vars);
  } catch (error) {
    if (/LocationInUnloadedChunk|not in a chunk currently loaded/.test(`${error?.name ?? ""} ${error}`)) return;
    console.error("[TACZ Effects] Tracer particle failed:", error);
  }
}

// Muzzle smoke (RP particle krep:muzzle_smoke): a few gray puffs that drift forward and up and fade (~1.5 s).
// A world particle, so it is placed near the muzzle, not exactly on it; smoke drifts, so that doesn't show.
const SMOKE_AHEAD = 0.9;
export function spawnMuzzleSmoke({ shooter, mode, particleId = "krep:muzzle_smoke" }) {
  const aim = normalize(shooter.getViewDirection());
  const muzzle = getTracerStart(shooter, aim, mode);
  const at = { x: muzzle.x + aim.x * SMOKE_AHEAD, y: muzzle.y + aim.y * SMOKE_AHEAD, z: muzzle.z + aim.z * SMOKE_AHEAD };
  const vars = new MolangVariableMap();
  vars.setFloat("variable.dx", aim.x);
  vars.setFloat("variable.dy", aim.y);
  vars.setFloat("variable.dz", aim.z);
  try {
    shooter.dimension.spawnParticle(particleId, at, vars);
  } catch {
    // cosmetic only
  }
}
