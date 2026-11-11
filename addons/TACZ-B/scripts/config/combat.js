// =====================================================================================
// COMBAT: rules shared by every gun. Per-gun stats are in weapons.js. Reload the world
// after editing.
// =====================================================================================

export const COMBAT = Object.freeze({
  // Scale every gun's damage / recoil at once (1 = as in weapons.js), for quick balancing.
  damageMultiplier: 1,
  recoilMultiplier: 1,

  // A hit within headshotRadius blocks of the target's head is a headshot: it deals the gun's
  // `headshot` multiplier (headshotMultiplier if the gun has none) and only the helmet counts as armor.
  headshotMultiplier: 2,
  headshotRadius: 0.375,

  // Armor: damage is reduced by (armor points x (1 - penetration)) / 20, at most
  // maxArmorReduction (0.8 = 80%). Every hit deals at least minDamage.
  maxArmorReduction: 0.8,
  minDamage: 1,
});

// Muzzle flash light (combat/muzzleLight.js): every shot without a silencer lights the air at the shooter's head
// for `ticks` ticks (20 = 1 s) with a light block of `level` (0-15), so caves light up (user, 2026-10-04).
// enabled: false turns it off.
export const MUZZLE_LIGHT = Object.freeze({ enabled: true, level: 15, ticks: 2 });

// Recoil kick (combat/recoil.js). Each gun's `recoil` [power, duration] in weapons.js is turned into a short,
// sharp camera punch instead of a long wobble: power x intensityScale, duration x durationScale capped at
// maxDuration seconds. Heavier guns already have bigger `recoil` power, so they still kick harder.
// To go back to the original wobble: intensityScale 1, durationScale 1, maxDuration 10.
export const KICK = Object.freeze({ intensityScale: 2.5, durationScale: 0.4, maxDuration: 0.12 });

// Player death ragdoll (combat/ragdoll.js + RP animation.tacz.ragdoll). A gun shot that would kill a player
// instead knocks them down: they fall away from the shot (harder for bigger hits, head snaps back on a headshot),
// the camera pulls back so they watch their body drop, and after `seconds` the death lands (kill credit kept).
// While down they can't move, shoot or be hurt. enabled: false = normal Minecraft deaths.
//   camera: back / up = camera distance behind the fall and height (blocks), ease = seconds to swing out.
export const RAGDOLL = Object.freeze({ enabled: true, seconds: 4, camera: { back: 2.8, up: 1.8, ease: 0.6 } });

// Gunshot sound (combat/firing.js). The shot is placed at the shooter, so nearby players hear it loud and
// fading with distance; players out to `range` blocks still hear at least `minimumVolume` (0-1), so a firefight
// is audible across the area. `volume` above 1 widens the loud zone (roughly 16 blocks per 1.0).
// Silenced guns use `suppressedRange` and no minimum. (Until 2026-11-08: only players within 30 blocks heard shots.)
export const SOUND = Object.freeze({ range: 120, volume: 2, minimumVolume: 0.3, suppressedRange: 24 });

// Armor points per piece (vanilla values), used for players and mobs.
export const ARMOR = Object.freeze({
  leather: { helmet: 1, chestplate: 3, leggings: 2, boots: 1 },
  chainmail: { helmet: 2, chestplate: 5, leggings: 4, boots: 1 },
  iron: { helmet: 2, chestplate: 6, leggings: 5, boots: 2 },
  golden: { helmet: 2, chestplate: 5, leggings: 3, boots: 1 },
  diamond: { helmet: 3, chestplate: 8, leggings: 6, boots: 3 },
  netherite: { helmet: 3, chestplate: 8, leggings: 6, boots: 3 },
});

// Every gun fires by hitscan (combat/hitscan.js): instant rays from the eyes. A gun's entry in
// weapons.js can override range, tracerParticles and breakableBlocks.
//   range            Blocks a shot reaches.
//   tracerParticles  Smoke puffs per tracer line.
//   breakableBlocks  Blocks a shot breaks and passes through ("*" = any text), at most
//                    maxBlocksBroken per ray.
//   tracer             RP particle for the glowing tracer streak (undefined = none). 2026-11-08 gunfeel pass.
//   impactParticle     dust where a shot hits a block; entityHitParticle where it hits a player/mob.
export const HITSCAN = Object.freeze({
  range: 128,
  tracerParticles: 5, // only used by guns that set their own `tracerParticles` (old smoke-puff line)
  tracer: "krep:tracer",
  muzzleSmoke: "krep:muzzle_smoke", // smoke puff at the muzzle every shot (undefined = none)
  impactParticle: "krep:impact",
  entityHitParticle: "krep:hit_entity",
  breakableBlocks: [
    "minecraft:glass",
    "minecraft:glass_pane",
    "minecraft:*_stained_glass",
    "minecraft:*_stained_glass_pane",
    "minecraft:wheat",
  ],
  maxBlocksBroken: 4,
});
