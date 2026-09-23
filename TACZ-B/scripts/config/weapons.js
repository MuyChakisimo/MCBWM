import { JAVA_IMPORTED_WEAPONS } from "./javaImportedWeapons.js";
import { JAVA_WEAPON_METADATA } from "./javaWeaponMetadata.js";
// =====================================================
// TACZ WEAPON CONFIGURATION
//
// Primary script-side tuning file for firearm gameplay.
//
// For hitscan guns:
// - damage / penetration / range are authoritative gameplay values.
// - pellets controls how many rays are fired per trigger.
// - spread.hip / spread.ads are cone half-angles in degrees.
// - tracerParticles is cosmetic only.
//
// RPG remains a physical projectile. Its projectile speed/power is
// still defined in entities/bullet/rpg.json; cleanupTicks is here.
// =====================================================

export const WEAPON_DEFAULTS = Object.freeze({
  hitscanRange: 128,
  tracerParticles: 5,
  tracerParticle: "minecraft:basic_smoke_particle",
  impactParticle: "minecraft:basic_smoke_particle",
  headshotMultiplier: 2,
  breakFragileBlocks: true,
});

function defineWeapon(config) {
  const javaMetadata = JAVA_WEAPON_METADATA[config.id] ?? {};
  return Object.freeze({
    hitscan: true,
    pellets: 1,
    range: WEAPON_DEFAULTS.hitscanRange,
    tracerParticles: WEAPON_DEFAULTS.tracerParticles,
    tracerParticle: WEAPON_DEFAULTS.tracerParticle,
    impactParticle: WEAPON_DEFAULTS.impactParticle,
    headshotMultiplier: WEAPON_DEFAULTS.headshotMultiplier,
    breakFragileBlocks: WEAPON_DEFAULTS.breakFragileBlocks,
    ...javaMetadata,
    spread: Object.freeze({ hip: 0, ads: 0 }),
    ...config,
    spread: Object.freeze({
      hip: config.spread?.hip ?? 0,
      ads: config.spread?.ads ?? 0,
    }),
  });
}

export const WEAPONS = Object.freeze({
  akm: defineWeapon({
    id: "akm",
    name: "AKM",
    category: "assault_rifle",
    damage: 9,
    penetration: 0.65,
  }),

  m4a1: defineWeapon({
    id: "m4a1",
    name: "M4A1",
    category: "assault_rifle",
    damage: 8,
    penetration: 0.65,
  }),

  hk416: defineWeapon({
    id: "hk416",
    name: "HK416",
    category: "assault_rifle",
    damage: 5,
    penetration: 0.6,
  }),

  qbz95: defineWeapon({
    id: "qbz95",
    name: "QBZ95",
    category: "assault_rifle",
    damage: 7,
    penetration: 0.7,
  }),

  qbz191: defineWeapon({
    id: "qbz191",
    name: "QBZ191",
    category: "assault_rifle",
    damage: 7,
    penetration: 0.7,
  }),

  fal: defineWeapon({
    id: "fal",
    name: "FAL",
    category: "assault_rifle",
    damage: 9,
    penetration: 0.7,
  }),

  scarl: defineWeapon({
    id: "scarl",
    name: "SCAR-L",
    category: "assault_rifle",
    damage: 7,
    penetration: 0.65,
  }),

  scarh: defineWeapon({
    id: "scarh",
    name: "SCAR-H",
    category: "assault_rifle",
    damage: 9,
    penetration: 0.7,
  }),

  g36: defineWeapon({
    id: "g36",
    name: "G36",
    category: "assault_rifle",
    damage: 7,
    penetration: 0.65,
  }),

  m16: defineWeapon({
    id: "m16",
    name: "M16",
    category: "assault_rifle",
    damage: 6,
    penetration: 0.6,
  }),

  m16a1: defineWeapon({
    id: "m16a1",
    name: "M16A1",
    category: "assault_rifle",
    damage: 6,
    penetration: 0.6,
  }),

  g3: defineWeapon({
    id: "g3",
    name: "G3",
    category: "assault_rifle",
    damage: 9,
    penetration: 0.7,
  }),

  type81: defineWeapon({
    id: "type81",
    name: "Type 81",
    category: "assault_rifle",
    damage: 9,
    penetration: 0.65,
  }),

  g17: defineWeapon({
    id: "g17",
    name: "G17",
    category: "pistol",
    damage: 6,
    penetration: 0.5,
  }),

  g18: defineWeapon({
    id: "g18",
    name: "G18",
    category: "pistol",
    damage: 3,
    penetration: 0.3,
  }),

  b93: defineWeapon({
    id: "b93",
    name: "B93",
    category: "pistol",
    damage: 4,
    penetration: 0.4,
  }),

  m1911: defineWeapon({
    id: "m1911",
    name: "M1911",
    category: "pistol",
    damage: 11,
    penetration: 0.3,
  }),

  p320: defineWeapon({
    id: "p320",
    name: "P320",
    category: "pistol",
    damage: 10,
    penetration: 0.3,
  }),

  deagle: defineWeapon({
    id: "deagle",
    name: "Desert Eagle",
    category: "pistol",
    damage: 16,
    penetration: 0.5,
  }),

  deagleg: defineWeapon({
    id: "deagleg",
    name: "Desert Eagle Gold",
    category: "pistol",
    damage: 12,
    penetration: 0.7,
  }),

  t50: defineWeapon({
    id: "t50",
    name: "T50",
    category: "pistol",
    damage: 16,
    penetration: 0.5,
  }),

  cp: defineWeapon({
    id: "cp",
    name: "CP",
    category: "pistol",
    damage: 12,
    penetration: 0.7,
  }),

  mp5: defineWeapon({
    id: "mp5",
    name: "MP5",
    category: "smg",
    damage: 6.5,
    penetration: 0.45,
  }),

  mp7: defineWeapon({
    id: "mp7",
    name: "MP7",
    category: "smg",
    damage: 4,
    penetration: 0.7,
  }),

  p90: defineWeapon({
    id: "p90",
    name: "P90",
    category: "smg",
    damage: 4,
    penetration: 0.7,
  }),

  vector: defineWeapon({
    id: "vector",
    name: "Vector",
    category: "smg",
    damage: 6,
    penetration: 0.4,
  }),

  ump: defineWeapon({
    id: "ump",
    name: "UMP",
    category: "smg",
    damage: 6.7,
    penetration: 0.4,
  }),

  uzi: defineWeapon({
    id: "uzi",
    name: "Uzi",
    category: "smg",
    damage: 5,
    penetration: 0.3,
  }),

  sks: defineWeapon({
    id: "sks",
    name: "SKS",
    category: "dmr",
    damage: 11,
    penetration: 0.65,
  }),

  mk14: defineWeapon({
    id: "mk14",
    name: "MK14",
    category: "dmr",
    damage: 13,
    penetration: 0.7,
  }),

  awp: defineWeapon({
    id: "awp",
    name: "AWP",
    category: "sniper",
    damage: 42,
    penetration: 0.9,
  }),

  // Reconstructed from original M107 assets/controllers.
  // The original fork had a 5-round .50 BMG HUD/reload system but no
  // bullet entity or damage-table entry, so these combat values are new
  // balance defaults and are meant to be tuned here.
  m107: defineWeapon({
    id: "m107",
    name: "M107",
    category: "sniper",
    caliber: ".50 BMG",
    ammoId: "50bmg",
    ammoItem: "krep:50bmg",
    damage: 55,
    penetration: 0.5,
    headshotMultiplier: 1.5,
    range: 256,
    magazineSize: 10,
    rpm: 400,
    fireModes: ["semi"],
    fireMode: "semi",
    reload: Object.freeze({ empty: 4.3, tactical: 3.28 }),
    projectileSpeed: 400,
    allowedAttachmentTypes: ["scope", "extended_mag", "muzzle"],
  }),

  m249: defineWeapon({
    id: "m249",
    name: "M249",
    category: "lmg",
    damage: 7,
    penetration: 0.65,
  }),

  evolys: defineWeapon({
    id: "evolys",
    name: "Evolys",
    category: "lmg",
    damage: 10,
    penetration: 0.6,
  }),

  minigun: defineWeapon({
    id: "minigun",
    name: "Minigun",
    category: "machine_gun",
    damage: 8,
    penetration: 0.5,
  }),

  // Shotgun spread values start from the legacy projectile uncertainty
  // numbers. They are now treated as cone half-angles in degrees and are
  // intentionally centralized here so they can be calibrated in-game.
  aa12: defineWeapon({
    id: "aa12",
    name: "AA-12",
    category: "shotgun",
    damage: 2,
    penetration: 0.1,
    pellets: 12,
    spread: {
      hip: 17.3,
      ads: 9.1,
    },
  }),

  saiga12: defineWeapon({
    id: "saiga12",
    name: "Saiga-12",
    category: "shotgun",
    damage: 2,
    penetration: 0.3,
    pellets: 12,
    spread: {
      hip: 14.3,
      ads: 5.1,
    },
  }),

  m870: defineWeapon({
    id: "m870",
    name: "M870",
    category: "shotgun",
    damage: 3,
    penetration: 0.5,
    pellets: 12,
    spread: {
      hip: 14.3,
      ads: 5.1,
    },
  }),

  m1014: defineWeapon({
    id: "m1014",
    name: "M1014",
    category: "shotgun",
    damage: 3,
    penetration: 0.4,
    pellets: 12,
    spread: {
      hip: 14.3,
      ads: 5.1,
    },
  }),

  db: defineWeapon({
    id: "db",
    name: "Double Barrel",
    category: "shotgun",
    damage: 3,
    penetration: 0.3,
    pellets: 12,
    spread: {
      hip: 14.3,
      ads: 5.1,
    },
  }),

  rpg: defineWeapon({
    id: "rpg",
    name: "RPG",
    category: "launcher",
    damage: 100,
    penetration: 1,
    hitscan: false,
    physicalProjectile: Object.freeze({
      typeId: "bullet:rpg",
      cleanupTicks: 10,
    }),
  }),

  ...JAVA_IMPORTED_WEAPONS,

});

export function getWeaponConfig(weaponId) {
  return WEAPONS[weaponId];
}
