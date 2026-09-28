import { system, Player } from "@minecraft/server";
import { processGunHit } from "./damage.js";
import { HITSCAN, getWeapon } from "../config/weapons.js";
import { spawnSmokeTracer, spawnImpactEffect } from "./shotEffects.js";

// Hitscan firing for guns with firing: "hitscan" (config/weapons.js). Each gun's fire event in
// entities/player.json runs
//   scriptevent tacz:weapon_hitscan <weaponId> ads|hip
// instead of spawning a physical bullet entity. The shot is resolved instantly with a ray from
// the player's eyes; damage goes through the same processGunHit() as physical bullets.
// Range and tracer puffs: HITSCAN defaults, or a gun's own range / tracerParticles.

const HITSCAN_EVENT = "tacz:weapon_hitscan";

const add = (a, b) => ({ x: a.x + b.x, y: a.y + b.y, z: a.z + b.z });
const scale = (v, s) => ({ x: v.x * s, y: v.y * s, z: v.z * s });

function normalize(v) {
  const length = Math.sqrt(v.x * v.x + v.y * v.y + v.z * v.z);
  if (length <= 0.000001) return { x: 0, y: 0, z: 1 };
  return { x: v.x / length, y: v.y / length, z: v.z / length };
}

// Nearest living entity along the view ray (the ray stops at blocks).
function getFirstTarget(shooter, range) {
  const hits = shooter.getEntitiesFromViewDirection({
    maxDistance: range,
    ignoreBlockCollision: false,
  });
  if (!hits || hits.length === 0) return undefined;

  hits.sort((a, b) => a.distance - b.distance);
  for (const hit of hits) {
    const entity = hit.entity;
    if (!entity || entity.id === shooter.id) continue;
    if (entity.typeId?.startsWith("bullet:")) continue;
    if (!entity.getComponent("minecraft:health")) continue;
    return hit;
  }
  return undefined;
}

function getBlockHitLocation(shooter, range) {
  const blockHit = shooter.getBlockFromViewDirection({
    maxDistance: range,
    includeLiquidBlocks: false,
    includePassableBlocks: false,
  });
  if (!blockHit) return undefined;
  return add(blockHit.block.location, blockHit.faceLocation);
}

system.afterEvents.scriptEventReceive.subscribe((event) => {
  if (event.id !== HITSCAN_EVENT) return;

  const [weaponId, requestedMode] = (event.message ?? "").trim().toLowerCase().split(/\s+/);
  const weapon = getWeapon(weaponId);
  if (weapon?.firing !== "hitscan") return;
  const range = weapon.range ?? HITSCAN.range;
  const mode = requestedMode === "ads" ? "ads" : "hip";

  const shooter = event.sourceEntity;
  if (!(shooter instanceof Player)) return;

  try {
    const direction = normalize(shooter.getViewDirection());
    const entityHit = getFirstTarget(shooter, range);
    const entityHitLocation = entityHit
      ? add(shooter.getHeadLocation(), scale(direction, entityHit.distance))
      : undefined;
    // Entity rays already stop at blocks, so only look for a block when nothing was hit.
    const blockHitLocation = entityHit ? undefined : getBlockHitLocation(shooter, range);
    const impactLocation = entityHitLocation ?? blockHitLocation;

    // Damage first: a failed particle must never cancel a hit.
    if (entityHit) {
      processGunHit({
        source: shooter,
        target: entityHit.entity,
        hitLocation: entityHitLocation,
        weaponId,
      });
    }

    spawnSmokeTracer({
      shooter,
      endLocation: impactLocation ?? add(shooter.getHeadLocation(), scale(direction, range)),
      mode,
      particleCount: weapon.tracerParticles ?? HITSCAN.tracerParticles,
    });
    if (impactLocation) {
      spawnImpactEffect({ dimension: shooter.dimension, location: impactLocation, particleId: HITSCAN.impactParticle });
    }
  } catch (error) {
    console.error(`[TACZ Hitscan] ${weaponId} error:`, error);
  }
});
