import { system, Player } from "@minecraft/server";

import { profileCount } from "../debug/profiler.js";

import {
  getWeaponConfig,
  WEAPON_DEFAULTS,
} from "../config/weapons.js";
import {
  spawnImpactEffect,
  spawnTracer,
} from "../effects/shotEffects.js";
import { normalize } from "../utils/vector.js";
import { applyBulletBlockImpact } from "./blockImpact.js";
import {
  playCombinedHitFeedback,
  processGunHit,
} from "./damage.js";
import {
  castEntityRay,
  castRay,
  randomDirectionInCone,
} from "./raycast.js";

// =====================================================
// TACZ GENERIC HITSCAN ENGINE
//
// All conventional firearms now enter through this module.
// RPG remains physical because projectile travel is gameplay.
// =====================================================

const HITSCAN_EVENT = "tacz:weapon_hitscan";

function parseShotEvent(event) {
  const message = (event.message ?? "").trim().toLowerCase();

  if (event.id !== HITSCAN_EVENT) {
    return undefined;
  }

  const [weaponId, requestedMode] = message.split(/\s+/);
  const weapon = getWeaponConfig(weaponId);

  if (!weapon?.hitscan) {
    return undefined;
  }

  return {
    weaponId,
    mode: requestedMode === "ads" ? "ads" : "hip",
  };
}

function spawnShotCosmetics({
  shooter,
  weapon,
  mode,
  tracerEnd,
  impactLocation,
}) {
  spawnTracer({
    shooter,
    endLocation: tracerEnd,
    mode,
    particleCount:
      weapon.tracerParticles ??
      WEAPON_DEFAULTS.tracerParticles,
    particleId:
      weapon.tracerParticle ??
      WEAPON_DEFAULTS.tracerParticle,
  });

  if (impactLocation) {
    spawnImpactEffect({
      dimension: shooter.dimension,
      location: impactLocation,
      particleId:
        weapon.impactParticle ??
        WEAPON_DEFAULTS.impactParticle,
    });
  }
}

function fireSingleHitscan({ shooter, weaponId, weapon, mode }) {
  const direction = normalize(shooter.getViewDirection());
  const maxDistance =
    weapon.range ?? WEAPON_DEFAULTS.hitscanRange;

  const ray = castRay(shooter, direction, maxDistance);

  if (ray.entityHit) {
    processGunHit({
      source: shooter,
      target: ray.entityHit.entity,
      hitLocation: ray.entityHit.location,
      weaponId,
    });
  } else if (ray.blockHit) {
    applyBulletBlockImpact(ray.blockHit, weapon);
  }

  spawnShotCosmetics({
    shooter,
    weapon,
    mode,
    tracerEnd: ray.endLocation,
    impactLocation:
      ray.entityHit?.location ?? ray.blockHitLocation,
  });
}

function fireShotgunHitscan({ shooter, weaponId, weapon, mode }) {
  const forward = normalize(shooter.getViewDirection());
  const maxDistance =
    weapon.range ?? WEAPON_DEFAULTS.hitscanRange;
  const pelletCount = Math.max(1, Math.floor(weapon.pellets ?? 12));
  const spreadDegrees = weapon.spread?.[mode] ?? 0;

  // Armor cannot change meaningfully between pellets of the same blast.
  // Cache it once per target for this shot instead of re-reading equipment
  // for every pellet that hits the same entity.
  const armorCache = new Map();

  let anyHit = false;
  let anyHeadshot = false;
  let anyKill = false;
  let firstEntityImpact;

  profileCount("pelletRays", pelletCount);

  for (let pellet = 0; pellet < pelletCount; pellet++) {
    const pelletDirection = randomDirectionInCone(
      forward,
      spreadDegrees,
    );

    // EntityRaycastOptions ignoreBlockCollision=false means blocks stop
    // each pellet ray. We do not need a second block ray for every pellet.
    const entityHit = castEntityRay(
      shooter,
      pelletDirection,
      maxDistance,
    );

    if (!entityHit) {
      continue;
    }

    const result = processGunHit({
      source: shooter,
      target: entityHit.entity,
      hitLocation: entityHit.location,
      weaponId,
      playFeedback: false,
      armorCache,
    });

    if (!result.applied) {
      continue;
    }

    anyHit = true;
    anyHeadshot ||= result.headshot;
    anyKill ||= result.killed;
    firstEntityImpact ??= entityHit.location;
  }

  // One combined feedback set per shotgun trigger rather than allowing
  // up to 12 overlapping hit/headshot/kill sounds.
  playCombinedHitFeedback(shooter, {
    hit: anyHit,
    headshot: anyHeadshot,
    killed: anyKill,
  });

  // Cosmetics deliberately use one center ray per blast. Gameplay still
  // uses all randomized pellet rays, but visual work stays fixed at five
  // tracer smoke puffs + one impact puff maximum.
  const visualRay = castRay(shooter, forward, maxDistance);

  if (!visualRay.entityHit && visualRay.blockHit) {
    applyBulletBlockImpact(visualRay.blockHit, weapon);
  }

  spawnShotCosmetics({
    shooter,
    weapon,
    mode,
    tracerEnd: visualRay.endLocation,
    impactLocation:
      firstEntityImpact ??
      visualRay.entityHit?.location ??
      visualRay.blockHitLocation,
  });
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

  if (!weapon?.hitscan) {
    return;
  }

  profileCount("shots");

  try {
    if ((weapon.pellets ?? 1) > 1) {
      fireShotgunHitscan({
        shooter,
        weaponId: shot.weaponId,
        weapon,
        mode: shot.mode,
      });
      return;
    }

    fireSingleHitscan({
      shooter,
      weaponId: shot.weaponId,
      weapon,
      mode: shot.mode,
    });
  } catch (error) {
    console.error(
      `[TACZ Hitscan] ${shot.weaponId} error:`,
      error,
    );
  }
});


// Direct modular entry point used by newly imported Java weapons.
export function fireConfiguredWeapon(shooter, weapon, mode = "hip") {
  const weaponId = weapon.id ?? weapon.javaSourceId;
  if (!weapon?.hitscan) return false;
  profileCount("shots");
  if ((weapon.pellets ?? 1) > 1) {
    fireShotgunHitscan({ shooter, weaponId, weapon, mode });
  } else {
    fireSingleHitscan({ shooter, weaponId, weapon, mode });
  }
  return true;
}
