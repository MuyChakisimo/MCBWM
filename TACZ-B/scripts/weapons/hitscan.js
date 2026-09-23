import { system, Player } from "@minecraft/server";

import { processGunHit } from "../events/projectileHitEntity.js";
import {
  getWeaponConfig,
  WEAPON_DEFAULTS,
} from "../config/weapons.js";
import {
  spawnSmokeTracer,
  spawnImpactEffect,
} from "../effects/shotEffects.js";

// =====================================================
// TACZ GENERIC HITSCAN
//
// Current migration scope:
// - Assault rifles
// - Pistols
// - SMGs
// - DMRs / sniper rifle
// - LMGs / minigun
//
// Intentionally still physical:
// - Shotguns (need calibrated multi-ray pellet spread)
// - RPG (travel time is gameplay)
// =====================================================

const HITSCAN_EVENT = "tacz:weapon_hitscan";
const LEGACY_ASSAULT_RIFLE_EVENT = "tacz:assault_rifle_hitscan";
const LEGACY_M4A1_EVENT = "tacz:m4a1_hitscan";

function add(a, b) {
  return { x: a.x + b.x, y: a.y + b.y, z: a.z + b.z };
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

function parseShotEvent(event) {
  const message = (event.message ?? "").trim().toLowerCase();

  if (event.id === LEGACY_M4A1_EVENT) {
    return {
      weaponId: "m4a1",
      mode: message === "ads" ? "ads" : "hip",
    };
  }

  if (
    event.id !== HITSCAN_EVENT &&
    event.id !== LEGACY_ASSAULT_RIFLE_EVENT
  ) {
    return undefined;
  }

  const [weaponId, requestedMode] = message.split(/\s+/);
  const weapon = getWeaponConfig(weaponId);

  if (!weapon || !weapon.hitscan) {
    return undefined;
  }

  return {
    weaponId,
    mode: requestedMode === "ads" ? "ads" : "hip",
  };
}

function getHitLocation(shooter, direction, distance) {
  return add(
    shooter.getHeadLocation(),
    multiply(direction, distance),
  );
}

function getFirstTarget(shooter, maxDistance) {
  const hits = shooter.getEntitiesFromViewDirection({
    maxDistance,
    ignoreBlockCollision: false,
  });

  if (!hits || hits.length === 0) {
    return undefined;
  }

  // Preserve correctness without assuming API result ordering.
  // This can later be changed to an O(n) nearest-valid scan if
  // profiling shows sorting matters.
  hits.sort((a, b) => a.distance - b.distance);

  for (const hit of hits) {
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

    return hit;
  }

  return undefined;
}

function getBlockHitLocation(shooter, maxDistance) {
  const blockHit = shooter.getBlockFromViewDirection({
    maxDistance,
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

system.afterEvents.scriptEventReceive.subscribe((event) => {
  const shot = parseShotEvent(event);

  if (!shot) {
    return;
  }

  const shooter = event.sourceEntity;

  if (!(shooter instanceof Player)) {
    return;
  }

  const weapon = getWeaponConfig(shot.weaponId);

  if (!weapon || !weapon.hitscan) {
    return;
  }

  const maxDistance =
    weapon.range ?? WEAPON_DEFAULTS.hitscanRange;

  try {
    const direction = normalize(shooter.getViewDirection());
    const entityHit = getFirstTarget(shooter, maxDistance);

    const entityHitLocation = entityHit
      ? getHitLocation(shooter, direction, entityHit.distance)
      : undefined;

    // Only perform the block ray when an entity was not already
    // resolved. getEntitiesFromViewDirection already respects block
    // collision for entity targeting.
    const blockHitLocation = entityHit
      ? undefined
      : getBlockHitLocation(shooter, maxDistance);

    const tracerEnd =
      entityHitLocation ??
      blockHitLocation ??
      add(
        shooter.getHeadLocation(),
        multiply(direction, maxDistance),
      );

    // Authoritative gameplay resolves BEFORE cosmetic effects.
    // A particle failure must never make a valid hit disappear.
    if (entityHit && entityHitLocation) {
      processGunHit({
        source: shooter,
        target: entityHit.entity,
        hitLocation: entityHitLocation,
        weaponId: shot.weaponId,
      });
    }

    // Cosmetics are best-effort only.
    spawnSmokeTracer({
      shooter,
      endLocation: tracerEnd,
      mode: shot.mode,
      particleCount:
        weapon.tracerParticles ??
        WEAPON_DEFAULTS.tracerParticles,
    });

    // Small neutral impact puff replaces the old flame hit effect.
    if (entityHitLocation || blockHitLocation) {
      spawnImpactEffect({
        dimension: shooter.dimension,
        location: entityHitLocation ?? blockHitLocation,
        particleId: WEAPON_DEFAULTS.impactParticle,
      });
    }
  } catch (error) {
    console.error(
      `[TACZ Hitscan] ${shot.weaponId} error:`,
      error,
    );
  }
});
