import { system, Player } from "@minecraft/server";

import { processGunHit } from "./projectileHitEntity.js";

// =====================================================
// TACZ ASSAULT-RIFLE HITSCAN
//
// This is the shared hitscan path for the assault-rifle
// group that previously spawned physical bullet entities.
//
// IMPORTANT:
// - Ammo / reload / fire-rate logic remains in the existing
//   animation controllers and functions.
// - Existing recoil / camerashake commands remain unchanged.
// - Damage still uses processGunHit(), so the existing TACZ
//   armor, headshot, hitmarker and kill behavior is preserved.
// - Old bullet entities/component groups are intentionally
//   left in the pack for rollback while this is tested.
// - Hitscan spread is NOT added here yet because the tested
//   M4A1 hitscan also fires a straight view-direction ray.
//
// Cosmetic tracer:
// - Uses the vanilla minecraft:basic_smoke_particle.
// - No custom tracer PNG is required.
// - Uses only a few smoke puffs per shot, capped globally per
//   shot, rather than the previous long colored-flame chain.
// =====================================================

const ASSAULT_RIFLE_HITSCAN_EVENT = "tacz:assault_rifle_hitscan";
const LEGACY_M4A1_HITSCAN_EVENT = "tacz:m4a1_hitscan";

const DEFAULT_MAX_DISTANCE = 128;

// Keep this intentionally small. Vanilla smoke lives longer
// than the old flame dots, so a few puffs are enough to make
// the shot path visible without building a large smoke cloud.
const SMOKE_TRAIL_MAX_PARTICLES = 3;
const SMOKE_TRAIL_MIN_DISTANCE = 1.25;

// These are VISUAL offsets only. Actual hit detection starts
// from the player's normal view ray.
const TRACER_FORWARD_OFFSET = 0.55;
const TRACER_VERTICAL_OFFSET = -0.12;
const TRACER_ADS_SIDE_OFFSET = 0.16;
const TRACER_HIP_SIDE_OFFSET = -0.16;

// damageWeaponId exists because the current shared damage
// registry contains "scar1" while the actual weapon/entity is
// named "scarl". Do not silently rewrite that legacy registry
// during this migration.
const ASSAULT_RIFLES = Object.freeze({
  akm: {
    damageWeaponId: "akm",
    maxDistance: DEFAULT_MAX_DISTANCE,
  },

  m4a1: {
    damageWeaponId: "m4a1",
    maxDistance: DEFAULT_MAX_DISTANCE,
  },

  hk416: {
    damageWeaponId: "hk416",
    maxDistance: DEFAULT_MAX_DISTANCE,
  },

  qbz95: {
    damageWeaponId: "qbz95",
    maxDistance: DEFAULT_MAX_DISTANCE,
  },

  fal: {
    damageWeaponId: "fal",
    maxDistance: DEFAULT_MAX_DISTANCE,
  },

  scarl: {
    damageWeaponId: "scar1",
    maxDistance: DEFAULT_MAX_DISTANCE,
  },

  scarh: {
    damageWeaponId: "scarh",
    maxDistance: DEFAULT_MAX_DISTANCE,
  },

  g36: {
    damageWeaponId: "g36",
    maxDistance: DEFAULT_MAX_DISTANCE,
  },

  m16: {
    damageWeaponId: "m16",
    maxDistance: DEFAULT_MAX_DISTANCE,
  },

  m16a1: {
    damageWeaponId: "m16a1",
    maxDistance: DEFAULT_MAX_DISTANCE,
  },

  g3: {
    damageWeaponId: "g3",
    maxDistance: DEFAULT_MAX_DISTANCE,
  },

  qbz191: {
    damageWeaponId: "qbz191",
    maxDistance: DEFAULT_MAX_DISTANCE,
  },

  type81: {
    damageWeaponId: "type81",
    maxDistance: DEFAULT_MAX_DISTANCE,
  },
});

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
      vector.z * vector.z,
  );
}

function normalize(vector) {
  const length = vectorLength(vector);

  if (length <= 0.000001) {
    return {
      x: 0,
      y: 0,
      z: 1,
    };
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

// =====================================================
// EVENT MESSAGE
//
// New events use:
//   scriptevent tacz:assault_rifle_hitscan akm ads
//   scriptevent tacz:assault_rifle_hitscan akm hip
//
// The old M4A1 event is still accepted temporarily so a
// partially-updated behavior pack does not make the M4A1 stop
// dealing damage during development.
// =====================================================

function parseShotEvent(event) {
  const message = (event.message ?? "").trim().toLowerCase();

  if (event.id === LEGACY_M4A1_HITSCAN_EVENT) {
    const mode = message === "ads" ? "ads" : "hip";

    return {
      weaponId: "m4a1",
      mode,
    };
  }

  if (event.id !== ASSAULT_RIFLE_HITSCAN_EVENT) {
    return undefined;
  }

  const [weaponId, requestedMode] = message.split(/\s+/);

  if (!weaponId || !ASSAULT_RIFLES[weaponId]) {
    return undefined;
  }

  return {
    weaponId,
    mode: requestedMode === "ads" ? "ads" : "hip",
  };
}

// =====================================================
// HIT LOCATION
// =====================================================

function getHitLocation(shooter, direction, distance) {
  const origin = shooter.getHeadLocation();

  return add(origin, multiply(direction, distance));
}

// =====================================================
// FIRST VALID ENTITY TARGET
// =====================================================

function getFirstTarget(shooter, maxDistance) {
  const hits = shooter.getEntitiesFromViewDirection({
    maxDistance,
    ignoreBlockCollision: false,
  });

  if (!hits || hits.length === 0) {
    return undefined;
  }

  // The Script API does not guarantee that callers should rely
  // on the returned array already being nearest-first.
  hits.sort((a, b) => a.distance - b.distance);

  for (const hit of hits) {
    const entity = hit.entity;

    if (!entity) {
      continue;
    }

    if (entity.id === shooter.id) {
      continue;
    }

    // Other weapon categories still use the old projectile
    // system, so their bullet entities must not absorb hitscan.
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

// =====================================================
// BLOCK HIT LOCATION
// =====================================================

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

// =====================================================
// COSMETIC MUZZLE START
// =====================================================

function getTracerStart(shooter, direction, mode) {
  const head = shooter.getHeadLocation();

  const up = {
    x: 0,
    y: 1,
    z: 0,
  };

  let right = cross(up, direction);

  if (vectorLength(right) <= 0.000001) {
    right = {
      x: 1,
      y: 0,
      z: 0,
    };
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

function getTracerEnd(
  shooter,
  direction,
  entityHitLocation,
  maxDistance,
) {
  if (entityHitLocation) {
    return entityHitLocation;
  }

  const blockHitLocation = getBlockHitLocation(
    shooter,
    maxDistance,
  );

  if (blockHitLocation) {
    return blockHitLocation;
  }

  return add(
    shooter.getHeadLocation(),
    multiply(direction, maxDistance),
  );
}

// =====================================================
// SMALL VANILLA SMOKE TRAIL
//
// This is cosmetic only.
//
// We intentionally do NOT spawn a smoke particle every block.
// At long range that would be worse than the old flame tracer.
// Instead a maximum of three visible smoke puffs are distributed
// along the already-resolved shot path.
// =====================================================

function spawnSmokeTrail(shooter, endLocation, mode) {
  const direction = normalize(shooter.getViewDirection());
  const startLocation = getTracerStart(shooter, direction, mode);
  const delta = subtract(endLocation, startLocation);
  const distance = vectorLength(delta);

  if (distance <= SMOKE_TRAIL_MIN_DISTANCE) {
    return;
  }

  const particleCount = Math.min(
    SMOKE_TRAIL_MAX_PARTICLES,
    Math.max(1, Math.ceil(distance / 12)),
  );

  for (let i = 1; i <= particleCount; i++) {
    const t = i / (particleCount + 1);

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
        "[TACZ Assault Rifle Hitscan] Failed to spawn smoke tracer:",
        error,
      );
    }
  }
}

// =====================================================
// EXISTING ENTITY-HIT FEEDBACK
// =====================================================

function showHitFeedback(dimension, hitLocation) {
  try {
    dimension.spawnParticle(
      "minecraft:basic_flame_particle",
      hitLocation,
    );
  } catch (error) {
    console.error(
      "[TACZ Assault Rifle Hitscan] Failed to spawn hit particle:",
      error,
    );
  }
}

// =====================================================
// SCRIPT EVENT
// =====================================================

system.afterEvents.scriptEventReceive.subscribe((event) => {
  const shot = parseShotEvent(event);

  if (!shot) {
    return;
  }

  const shooter = event.sourceEntity;

  if (!(shooter instanceof Player)) {
    console.warn(
      "[TACZ Assault Rifle Hitscan] Received hitscan event without a Player source.",
    );

    return;
  }

  const weapon = ASSAULT_RIFLES[shot.weaponId];

  if (!weapon) {
    return;
  }

  try {
    const direction = normalize(shooter.getViewDirection());

    const hit = getFirstTarget(
      shooter,
      weapon.maxDistance,
    );

    const hitLocation = hit
      ? getHitLocation(shooter, direction, hit.distance)
      : undefined;

    const tracerEnd = getTracerEnd(
      shooter,
      direction,
      hitLocation,
      weapon.maxDistance,
    );

    spawnSmokeTrail(
      shooter,
      tracerEnd,
      shot.mode,
    );

    if (!hit || !hitLocation) {
      return;
    }

    processGunHit({
      source: shooter,
      target: hit.entity,
      hitLocation,
      weaponId: weapon.damageWeaponId,
    });

    showHitFeedback(
      shooter.dimension,
      hitLocation,
    );
  } catch (error) {
    console.error(
      `[TACZ Assault Rifle Hitscan] ${shot.weaponId} error:`,
      error,
    );
  }
});
