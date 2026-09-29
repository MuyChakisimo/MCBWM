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
export const HITSCAN = Object.freeze({
  range: 128,
  tracerParticles: 5,
  impactParticle: "minecraft:basic_smoke_particle",
  breakableBlocks: [
    "minecraft:glass",
    "minecraft:glass_pane",
    "minecraft:*_stained_glass",
    "minecraft:*_stained_glass_pane",
    "minecraft:wheat",
  ],
  maxBlocksBroken: 4,
});
