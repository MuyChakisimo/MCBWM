import { system, Player } from "@minecraft/server";
import { processGunHit } from "../events/projectileHitEntity.js";
import { spawnSmokeTracer, spawnImpactEffect } from "./shotEffects.js";

// Hitscan firing. Each gun's fire event in entities/plalyer.json runs
//   scriptevent tacz:weapon_hitscan <weaponId> ads|hip
// instead of spawning a physical bullet entity. The shot is resolved instantly with a ray from
// the player's eyes; damage goes through the same processGunHit() as physical bullets.
// Shotguns and the RPG still fire physical bullets.

const HITSCAN_EVENT = "tacz:weapon_hitscan";
const RANGE = 128;
const TRACER_PARTICLES = 5;
const IMPACT_PARTICLE = "minecraft:basic_smoke_particle";

// Guns converted to hitscan (must match the fire events that send HITSCAN_EVENT).
const HITSCAN_WEAPONS = new Set([
  // assault rifles
  "akm", "m4a1", "hk416", "qbz95", "qbz191", "g36", "m16", "m16a1", "scarl", "type81",
  // battle rifles / DMRs / snipers
  "scarh", "g3", "fal", "sks", "mk14", "awp", "m107",
  // SMGs
  "mp5", "mp7", "p90", "ump", "uzi", "vector", "b93", "evolys",
  // pistols
  "deagle", "deagleg", "t50", "g17", "g18", "m1911", "p320", "cp",
  // LMGs
  "m249", "minigun",
]);

// Fire-event ids whose entry in Indoarsenal.bullets (global/global.js) is spelled differently.
const DAMAGE_KEY = { b93: "g93", scarl: "scar1" };

const add = (a, b) => ({ x: a.x + b.x, y: a.y + b.y, z: a.z + b.z });
const scale = (v, s) => ({ x: v.x * s, y: v.y * s, z: v.z * s });

function normalize(v) {
  const length = Math.sqrt(v.x * v.x + v.y * v.y + v.z * v.z);
  if (length <= 0.000001) return { x: 0, y: 0, z: 1 };
  return { x: v.x / length, y: v.y / length, z: v.z / length };
}

// Nearest living entity along the view ray (the ray stops at blocks).
function getFirstTarget(shooter) {
  const hits = shooter.getEntitiesFromViewDirection({
    maxDistance: RANGE,
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

function getBlockHitLocation(shooter) {
  const blockHit = shooter.getBlockFromViewDirection({
    maxDistance: RANGE,
    includeLiquidBlocks: false,
    includePassableBlocks: false,
  });
  if (!blockHit) return undefined;
  return add(blockHit.block.location, blockHit.faceLocation);
}

system.afterEvents.scriptEventReceive.subscribe((event) => {
  if (event.id !== HITSCAN_EVENT) return;

  const [weaponId, requestedMode] = (event.message ?? "").trim().toLowerCase().split(/\s+/);
  if (!HITSCAN_WEAPONS.has(weaponId)) return;
  const mode = requestedMode === "ads" ? "ads" : "hip";

  const shooter = event.sourceEntity;
  if (!(shooter instanceof Player)) return;

  try {
    const direction = normalize(shooter.getViewDirection());
    const entityHit = getFirstTarget(shooter);
    const entityHitLocation = entityHit
      ? add(shooter.getHeadLocation(), scale(direction, entityHit.distance))
      : undefined;
    // Entity rays already stop at blocks, so only look for a block when nothing was hit.
    const blockHitLocation = entityHit ? undefined : getBlockHitLocation(shooter);
    const impactLocation = entityHitLocation ?? blockHitLocation;

    // Damage first: a failed particle must never cancel a hit.
    if (entityHit) {
      processGunHit({
        source: shooter,
        target: entityHit.entity,
        hitLocation: entityHitLocation,
        weaponId: DAMAGE_KEY[weaponId] ?? weaponId,
      });
    }

    spawnSmokeTracer({
      shooter,
      endLocation: impactLocation ?? add(shooter.getHeadLocation(), scale(direction, RANGE)),
      mode,
      particleCount: TRACER_PARTICLES,
    });
    if (impactLocation) {
      spawnImpactEffect({ dimension: shooter.dimension, location: impactLocation, particleId: IMPACT_PARTICLE });
    }
  } catch (error) {
    console.error(`[TACZ Hitscan] ${weaponId} error:`, error);
  }
});
