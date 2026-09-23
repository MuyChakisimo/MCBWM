// =====================================================
// TACZ WEAPON CONFIGURATION
//
// This is the source of truth for script-side weapon
// damage / penetration and hitscan tuning.
//
// IMPORTANT:
// - Hitscan weapons have no gameplay travel velocity.
// - tracerParticles controls the cosmetic smoke trail.
// - legacyProjectile values are reference values copied
//   from the old physical bullet entities. They are NOT
//   currently used to calculate hitscan spread/velocity.
// - Shotguns and RPG remain physical in this build.
// =====================================================

export const WEAPON_DEFAULTS = Object.freeze({
  hitscanRange: 128,
  tracerParticles: 5,
  impactParticle: "minecraft:basic_smoke_particle",
});

export const WEAPONS = Object.freeze({
  akm: Object.freeze({
    name: "AKM",
    category: "assault_rifle",
    damage: 9,
    penetration: 0.65,
    hitscan: true,
    pellets: 1,
    range: WEAPON_DEFAULTS.hitscanRange,
    tracerParticles: WEAPON_DEFAULTS.tracerParticles,
    legacyProjectile: Object.freeze({
      hip: Object.freeze({
        power: 19.1,
        uncertainty: 7.7,
        gravity: 0.01,
      }),
      ads: Object.freeze({
        power: 19.1,
        uncertainty: 1.4,
        gravity: 0.01,
      }),
    }),
  }),

  m4a1: Object.freeze({
    name: "M4A1",
    category: "assault_rifle",
    damage: 8,
    penetration: 0.65,
    hitscan: true,
    pellets: 1,
    range: WEAPON_DEFAULTS.hitscanRange,
    tracerParticles: WEAPON_DEFAULTS.tracerParticles,
    legacyProjectile: Object.freeze({
      hip: Object.freeze({
        power: 18.1,
        uncertainty: 5.2,
        gravity: 0.1,
      }),
      ads: Object.freeze({
        power: 16.1,
        uncertainty: 0.5,
        gravity: 0.1,
      }),
    }),
  }),

  hk416: Object.freeze({
    name: "HK416",
    category: "assault_rifle",
    damage: 5,
    penetration: 0.6,
    hitscan: true,
    pellets: 1,
    range: WEAPON_DEFAULTS.hitscanRange,
    tracerParticles: WEAPON_DEFAULTS.tracerParticles,
    legacyProjectile: Object.freeze({
      hip: Object.freeze({
        power: 16.1,
        uncertainty: 6.7,
        gravity: 0.03,
      }),
      ads: Object.freeze({
        power: 14.1,
        uncertainty: 1.3,
        gravity: 0.02,
      }),
    }),
  }),

  qbz95: Object.freeze({
    name: "QBZ95",
    category: "assault_rifle",
    damage: 7,
    penetration: 0.7,
    hitscan: true,
    pellets: 1,
    range: WEAPON_DEFAULTS.hitscanRange,
    tracerParticles: WEAPON_DEFAULTS.tracerParticles,
    legacyProjectile: Object.freeze({
      hip: Object.freeze({
        power: 18.1,
        uncertainty: 5.2,
        gravity: 0.1,
      }),
      ads: Object.freeze({
        power: 16.1,
        uncertainty: 0.5,
        gravity: 0.1,
      }),
    }),
  }),

  qbz191: Object.freeze({
    name: "QBZ191",
    category: "assault_rifle",
    damage: 7,
    penetration: 0.7,
    hitscan: true,
    pellets: 1,
    range: WEAPON_DEFAULTS.hitscanRange,
    tracerParticles: WEAPON_DEFAULTS.tracerParticles,
    legacyProjectile: Object.freeze({
      hip: Object.freeze({
        power: 18.1,
        uncertainty: 6.2,
        gravity: 0.1,
      }),
      ads: Object.freeze({
        power: 16.1,
        uncertainty: 0.2,
        gravity: 0.1,
      }),
    }),
  }),

  fal: Object.freeze({
    name: "FAL",
    category: "assault_rifle",
    damage: 9,
    penetration: 0.7,
    hitscan: true,
    pellets: 1,
    range: WEAPON_DEFAULTS.hitscanRange,
    tracerParticles: WEAPON_DEFAULTS.tracerParticles,
    legacyProjectile: Object.freeze({
      hip: Object.freeze({
        power: 20.1,
        uncertainty: 7.7,
        gravity: 0.01,
      }),
      ads: Object.freeze({
        power: 15.1,
        uncertainty: 2.4,
        gravity: 0.01,
      }),
    }),
  }),

  scarl: Object.freeze({
    name: "SCAR-L",
    category: "assault_rifle",
    damage: 7,
    penetration: 0.65,
    hitscan: true,
    pellets: 1,
    range: WEAPON_DEFAULTS.hitscanRange,
    tracerParticles: WEAPON_DEFAULTS.tracerParticles,
    legacyProjectile: Object.freeze({
      hip: Object.freeze({
        power: 20.1,
        uncertainty: 6.9,
        gravity: 0.01,
      }),
      ads: Object.freeze({
        power: 18.1,
        uncertainty: 0.2,
        gravity: 0.01,
      }),
    }),
  }),

  scarh: Object.freeze({
    name: "SCAR-H",
    category: "assault_rifle",
    damage: 9,
    penetration: 0.7,
    hitscan: true,
    pellets: 1,
    range: WEAPON_DEFAULTS.hitscanRange,
    tracerParticles: WEAPON_DEFAULTS.tracerParticles,
    legacyProjectile: Object.freeze({
      hip: Object.freeze({
        power: 23.1,
        uncertainty: 5.2,
        gravity: 0.01,
      }),
      ads: Object.freeze({
        power: 18.1,
        uncertainty: 0.3,
        gravity: 0.01,
      }),
    }),
  }),

  g36: Object.freeze({
    name: "G36",
    category: "assault_rifle",
    damage: 7,
    penetration: 0.65,
    hitscan: true,
    pellets: 1,
    range: WEAPON_DEFAULTS.hitscanRange,
    tracerParticles: WEAPON_DEFAULTS.tracerParticles,
    legacyProjectile: Object.freeze({
      hip: Object.freeze({
        power: 20.1,
        uncertainty: 6.9,
        gravity: 0.01,
      }),
      ads: Object.freeze({
        power: 16.1,
        uncertainty: 0.7,
        gravity: 0.01,
      }),
    }),
  }),

  m16: Object.freeze({
    name: "M16",
    category: "assault_rifle",
    damage: 6,
    penetration: 0.6,
    hitscan: true,
    pellets: 1,
    range: WEAPON_DEFAULTS.hitscanRange,
    tracerParticles: WEAPON_DEFAULTS.tracerParticles,
    legacyProjectile: Object.freeze({
      hip: Object.freeze({
        power: 19.1,
        uncertainty: 6.8,
        gravity: 0.02,
      }),
      ads: Object.freeze({
        power: 15.1,
        uncertainty: 0.2,
        gravity: 0.02,
      }),
    }),
  }),

  m16a1: Object.freeze({
    name: "M16A1",
    category: "assault_rifle",
    damage: 6,
    penetration: 0.6,
    hitscan: true,
    pellets: 1,
    range: WEAPON_DEFAULTS.hitscanRange,
    tracerParticles: WEAPON_DEFAULTS.tracerParticles,
    legacyProjectile: Object.freeze({
      hip: Object.freeze({
        power: 15.1,
        uncertainty: 5.2,
        gravity: 0.1,
      }),
      ads: Object.freeze({
        power: 13.1,
        uncertainty: 1.5,
        gravity: 0.1,
      }),
    }),
  }),

  g3: Object.freeze({
    name: "G3",
    category: "assault_rifle",
    damage: 9,
    penetration: 0.7,
    hitscan: true,
    pellets: 1,
    range: WEAPON_DEFAULTS.hitscanRange,
    tracerParticles: WEAPON_DEFAULTS.tracerParticles,
    legacyProjectile: Object.freeze({
      hip: Object.freeze({
        power: 20.1,
        uncertainty: 7.7,
        gravity: 0.01,
      }),
      ads: Object.freeze({
        power: 15.1,
        uncertainty: 2.4,
        gravity: 0.01,
      }),
    }),
  }),

  type81: Object.freeze({
    name: "Type 81",
    category: "assault_rifle",
    damage: 9,
    penetration: 0.65,
    hitscan: true,
    pellets: 1,
    range: WEAPON_DEFAULTS.hitscanRange,
    tracerParticles: WEAPON_DEFAULTS.tracerParticles,
    legacyProjectile: Object.freeze({
      hip: Object.freeze({
        power: 19.1,
        uncertainty: 7.7,
        gravity: 0.01,
      }),
      ads: Object.freeze({
        power: 19.1,
        uncertainty: 1.4,
        gravity: 0.01,
      }),
    }),
  }),

  g17: Object.freeze({
    name: "G17",
    category: "pistol",
    damage: 6,
    penetration: 0.5,
    hitscan: true,
    pellets: 1,
    range: WEAPON_DEFAULTS.hitscanRange,
    tracerParticles: WEAPON_DEFAULTS.tracerParticles,
    legacyProjectile: Object.freeze({
      hip: Object.freeze({
        power: 9.1,
        uncertainty: 3.2,
        gravity: 0.1,
      }),
      ads: Object.freeze({
        power: 8.1,
        uncertainty: 1.2,
        gravity: 0.1,
      }),
    }),
  }),

  g18: Object.freeze({
    name: "G18",
    category: "pistol",
    damage: 3,
    penetration: 0.3,
    hitscan: true,
    pellets: 1,
    range: WEAPON_DEFAULTS.hitscanRange,
    tracerParticles: WEAPON_DEFAULTS.tracerParticles,
    legacyProjectile: Object.freeze({
      hip: Object.freeze({
        power: 5.1,
        uncertainty: 6.2,
        gravity: 0.1,
      }),
      ads: Object.freeze({
        power: 6.1,
        uncertainty: 2.2,
        gravity: 0.1,
      }),
    }),
  }),

  b93: Object.freeze({
    name: "B93",
    category: "pistol",
    damage: 4,
    penetration: 0.4,
    hitscan: true,
    pellets: 1,
    range: WEAPON_DEFAULTS.hitscanRange,
    tracerParticles: WEAPON_DEFAULTS.tracerParticles,
    legacyProjectile: Object.freeze({
      hip: Object.freeze({
        power: 9.1,
        uncertainty: 6.2,
        gravity: 0.1,
      }),
      ads: Object.freeze({
        power: 8.1,
        uncertainty: 3.2,
        gravity: 0.1,
      }),
    }),
  }),

  m1911: Object.freeze({
    name: "M1911",
    category: "pistol",
    damage: 11,
    penetration: 0.3,
    hitscan: true,
    pellets: 1,
    range: WEAPON_DEFAULTS.hitscanRange,
    tracerParticles: WEAPON_DEFAULTS.tracerParticles,
    legacyProjectile: Object.freeze({
      hip: Object.freeze({
        power: 13.1,
        uncertainty: 5.3,
        gravity: 0.09,
      }),
      ads: Object.freeze({
        power: 13.1,
        uncertainty: 1.0,
        gravity: 0.02,
      }),
    }),
  }),

  p320: Object.freeze({
    name: "P320",
    category: "pistol",
    damage: 10,
    penetration: 0.3,
    hitscan: true,
    pellets: 1,
    range: WEAPON_DEFAULTS.hitscanRange,
    tracerParticles: WEAPON_DEFAULTS.tracerParticles,
    legacyProjectile: Object.freeze({
      hip: Object.freeze({
        power: 13.1,
        uncertainty: 4.3,
        gravity: 0.09,
      }),
      ads: Object.freeze({
        power: 13.1,
        uncertainty: 1.0,
        gravity: 0.02,
      }),
    }),
  }),

  deagle: Object.freeze({
    name: "Desert Eagle",
    category: "pistol",
    damage: 16,
    penetration: 0.5,
    hitscan: true,
    pellets: 1,
    range: WEAPON_DEFAULTS.hitscanRange,
    tracerParticles: WEAPON_DEFAULTS.tracerParticles,
    legacyProjectile: Object.freeze({
      hip: Object.freeze({
        power: 13.1,
        uncertainty: 5.3,
        gravity: 0.09,
      }),
      ads: Object.freeze({
        power: 13.1,
        uncertainty: 1.2,
        gravity: 0.02,
      }),
    }),
  }),

  deagleg: Object.freeze({
    name: "Desert Eagle Gold",
    category: "pistol",
    damage: 12,
    penetration: 0.7,
    hitscan: true,
    pellets: 1,
    range: WEAPON_DEFAULTS.hitscanRange,
    tracerParticles: WEAPON_DEFAULTS.tracerParticles,
    legacyProjectile: Object.freeze({
      hip: Object.freeze({
        power: 13.1,
        uncertainty: 3.4,
        gravity: 0.09,
      }),
      ads: Object.freeze({
        power: 13.1,
        uncertainty: 0.2,
        gravity: 0.02,
      }),
    }),
  }),

  t50: Object.freeze({
    name: "T50",
    category: "pistol",
    damage: 16,
    penetration: 0.5,
    hitscan: true,
    pellets: 1,
    range: WEAPON_DEFAULTS.hitscanRange,
    tracerParticles: WEAPON_DEFAULTS.tracerParticles,
    legacyProjectile: Object.freeze({
      hip: Object.freeze({
        power: 13.1,
        uncertainty: 5.3,
        gravity: 0.09,
      }),
      ads: Object.freeze({
        power: 13.1,
        uncertainty: 0.5,
        gravity: 0.02,
      }),
    }),
  }),

  cp: Object.freeze({
    name: "CP",
    category: "pistol",
    damage: 12,
    penetration: 0.7,
    hitscan: true,
    pellets: 1,
    range: WEAPON_DEFAULTS.hitscanRange,
    tracerParticles: WEAPON_DEFAULTS.tracerParticles,
    legacyProjectile: Object.freeze({
      hip: Object.freeze({
        power: 13.1,
        uncertainty: 6.4,
        gravity: 0.09,
      }),
      ads: Object.freeze({
        power: 13.1,
        uncertainty: 0.2,
        gravity: 0.02,
      }),
    }),
  }),

  mp5: Object.freeze({
    name: "MP5",
    category: "smg",
    damage: 6.5,
    penetration: 0.45,
    hitscan: true,
    pellets: 1,
    range: WEAPON_DEFAULTS.hitscanRange,
    tracerParticles: WEAPON_DEFAULTS.tracerParticles,
    legacyProjectile: Object.freeze({
      hip: Object.freeze({
        power: 12.1,
        uncertainty: 3.2,
        gravity: 0.1,
      }),
      ads: Object.freeze({
        power: 10.1,
        uncertainty: 0.2,
        gravity: 0.1,
      }),
    }),
  }),

  mp7: Object.freeze({
    name: "MP7",
    category: "smg",
    damage: 4,
    penetration: 0.7,
    hitscan: true,
    pellets: 1,
    range: WEAPON_DEFAULTS.hitscanRange,
    tracerParticles: WEAPON_DEFAULTS.tracerParticles,
    legacyProjectile: Object.freeze({
      hip: Object.freeze({
        power: 13.1,
        uncertainty: 3.2,
        gravity: 0.1,
      }),
      ads: Object.freeze({
        power: 10.1,
        uncertainty: 0.2,
        gravity: 0.1,
      }),
    }),
  }),

  p90: Object.freeze({
    name: "P90",
    category: "smg",
    damage: 4,
    penetration: 0.7,
    hitscan: true,
    pellets: 1,
    range: WEAPON_DEFAULTS.hitscanRange,
    tracerParticles: WEAPON_DEFAULTS.tracerParticles,
    legacyProjectile: Object.freeze({
      hip: Object.freeze({
        power: 16.1,
        uncertainty: 4.2,
        gravity: 0.2,
      }),
      ads: Object.freeze({
        power: 11.1,
        uncertainty: 1.2,
        gravity: 0.2,
      }),
    }),
  }),

  vector: Object.freeze({
    name: "Vector",
    category: "smg",
    damage: 6,
    penetration: 0.4,
    hitscan: true,
    pellets: 1,
    range: WEAPON_DEFAULTS.hitscanRange,
    tracerParticles: WEAPON_DEFAULTS.tracerParticles,
    legacyProjectile: Object.freeze({
      hip: Object.freeze({
        power: 12.1,
        uncertainty: 4.2,
        gravity: 0.2,
      }),
      ads: Object.freeze({
        power: 10.1,
        uncertainty: 1.2,
        gravity: 0.2,
      }),
    }),
  }),

  ump: Object.freeze({
    name: "UMP",
    category: "smg",
    damage: 6.7,
    penetration: 0.4,
    hitscan: true,
    pellets: 1,
    range: WEAPON_DEFAULTS.hitscanRange,
    tracerParticles: WEAPON_DEFAULTS.tracerParticles,
    legacyProjectile: Object.freeze({
      hip: Object.freeze({
        power: 10.1,
        uncertainty: 4.2,
        gravity: 0.1,
      }),
      ads: Object.freeze({
        power: 10.1,
        uncertainty: 0.8,
        gravity: 0.1,
      }),
    }),
  }),

  uzi: Object.freeze({
    name: "Uzi",
    category: "smg",
    damage: 5,
    penetration: 0.3,
    hitscan: true,
    pellets: 1,
    range: WEAPON_DEFAULTS.hitscanRange,
    tracerParticles: WEAPON_DEFAULTS.tracerParticles,
    legacyProjectile: Object.freeze({
      hip: Object.freeze({
        power: 16.1,
        uncertainty: 4.2,
        gravity: 0.2,
      }),
      ads: Object.freeze({
        power: 12.1,
        uncertainty: 0.6,
        gravity: 0.2,
      }),
    }),
  }),

  sks: Object.freeze({
    name: "SKS",
    category: "dmr",
    damage: 11,
    penetration: 0.65,
    hitscan: true,
    pellets: 1,
    range: WEAPON_DEFAULTS.hitscanRange,
    tracerParticles: WEAPON_DEFAULTS.tracerParticles,
    legacyProjectile: Object.freeze({
      hip: Object.freeze({
        power: 21.1,
        uncertainty: 12.7,
        gravity: 0.01,
      }),
      ads: Object.freeze({
        power: 22.1,
        uncertainty: 1.1,
        gravity: 0.01,
      }),
    }),
  }),

  mk14: Object.freeze({
    name: "MK14",
    category: "dmr",
    damage: 13,
    penetration: 0.7,
    hitscan: true,
    pellets: 1,
    range: WEAPON_DEFAULTS.hitscanRange,
    tracerParticles: WEAPON_DEFAULTS.tracerParticles,
    legacyProjectile: Object.freeze({
      hip: Object.freeze({
        power: 21.1,
        uncertainty: 12.7,
        gravity: 0.01,
      }),
      ads: Object.freeze({
        power: 22.1,
        uncertainty: 0.3,
        gravity: 0.01,
      }),
    }),
  }),

  awp: Object.freeze({
    name: "AWP",
    category: "sniper",
    damage: 42,
    penetration: 0.9,
    hitscan: true,
    pellets: 1,
    range: WEAPON_DEFAULTS.hitscanRange,
    tracerParticles: WEAPON_DEFAULTS.tracerParticles,
    legacyProjectile: Object.freeze({
      hip: Object.freeze({
        power: 70.1,
        uncertainty: 8.7,
        gravity: 0.01,
      }),
      ads: Object.freeze({
        power: 80.1,
        uncertainty: 0.1,
        gravity: 0.01,
      }),
    }),
  }),

  m249: Object.freeze({
    name: "M249",
    category: "lmg",
    damage: 7,
    penetration: 0.65,
    hitscan: true,
    pellets: 1,
    range: WEAPON_DEFAULTS.hitscanRange,
    tracerParticles: WEAPON_DEFAULTS.tracerParticles,
    legacyProjectile: Object.freeze({
      hip: Object.freeze({
        power: 20.1,
        uncertainty: 9.9,
        gravity: 0.01,
      }),
      ads: Object.freeze({
        power: 18.1,
        uncertainty: 0.2,
        gravity: 0.01,
      }),
    }),
  }),

  evolys: Object.freeze({
    name: "Evolys",
    category: "lmg",
    damage: 10,
    penetration: 0.6,
    hitscan: true,
    pellets: 1,
    range: WEAPON_DEFAULTS.hitscanRange,
    tracerParticles: WEAPON_DEFAULTS.tracerParticles,
    legacyProjectile: Object.freeze({
      hip: Object.freeze({
        power: 23.1,
        uncertainty: 8.2,
        gravity: 0.01,
      }),
      ads: Object.freeze({
        power: 18.1,
        uncertainty: 0.3,
        gravity: 0.01,
      }),
    }),
  }),

  minigun: Object.freeze({
    name: "Minigun",
    category: "machine_gun",
    damage: 8,
    penetration: 0.5,
    hitscan: true,
    pellets: 1,
    range: WEAPON_DEFAULTS.hitscanRange,
    tracerParticles: WEAPON_DEFAULTS.tracerParticles,
    legacyProjectile: Object.freeze({
      hip: Object.freeze({
        power: 14.1,
        uncertainty: 5.2,
        gravity: 0.1,
      }),
      ads: Object.freeze({
        power: 13.1,
        uncertainty: 0.5,
        gravity: 0.1,
      }),
    }),
  }),

  aa12: Object.freeze({
    name: "AA-12",
    category: "shotgun",
    damage: 2,
    penetration: 0.1,
    hitscan: false,
    pellets: 12,
    range: WEAPON_DEFAULTS.hitscanRange,
    tracerParticles: WEAPON_DEFAULTS.tracerParticles,
    legacyProjectile: Object.freeze({
      hip: Object.freeze({
        power: 10.1,
        uncertainty: 17.3,
        gravity: 0.07,
      }),
      ads: Object.freeze({
        power: 10,
        uncertainty: 9.1,
        gravity: 0.08,
      }),
    }),
  }),

  saiga12: Object.freeze({
    name: "Saiga-12",
    category: "shotgun",
    damage: 2,
    penetration: 0.3,
    hitscan: false,
    pellets: 12,
    range: WEAPON_DEFAULTS.hitscanRange,
    tracerParticles: WEAPON_DEFAULTS.tracerParticles,
    legacyProjectile: Object.freeze({
      hip: Object.freeze({
        power: 10.1,
        uncertainty: 14.3,
        gravity: 0.07,
      }),
      ads: Object.freeze({
        power: 15,
        uncertainty: 5.1,
        gravity: 0.08,
      }),
    }),
  }),

  m870: Object.freeze({
    name: "M870",
    category: "shotgun",
    damage: 3,
    penetration: 0.5,
    hitscan: false,
    pellets: 12,
    range: WEAPON_DEFAULTS.hitscanRange,
    tracerParticles: WEAPON_DEFAULTS.tracerParticles,
    legacyProjectile: Object.freeze({
      hip: Object.freeze({
        power: 10.1,
        uncertainty: 14.3,
        gravity: 0.07,
      }),
      ads: Object.freeze({
        power: 15,
        uncertainty: 5.1,
        gravity: 0.08,
      }),
    }),
  }),

  m1014: Object.freeze({
    name: "M1014",
    category: "shotgun",
    damage: 3,
    penetration: 0.4,
    hitscan: false,
    pellets: 12,
    range: WEAPON_DEFAULTS.hitscanRange,
    tracerParticles: WEAPON_DEFAULTS.tracerParticles,
    legacyProjectile: Object.freeze({
      hip: Object.freeze({
        power: 10.1,
        uncertainty: 14.3,
        gravity: 0.07,
      }),
      ads: Object.freeze({
        power: 15,
        uncertainty: 5.1,
        gravity: 0.08,
      }),
    }),
  }),

  db: Object.freeze({
    name: "Double Barrel",
    category: "shotgun",
    damage: 3,
    penetration: 0.3,
    hitscan: false,
    pellets: 12,
    range: WEAPON_DEFAULTS.hitscanRange,
    tracerParticles: WEAPON_DEFAULTS.tracerParticles,
    legacyProjectile: Object.freeze({
      hip: Object.freeze({
        power: 10.1,
        uncertainty: 14.3,
        gravity: 0.07,
      }),
      ads: Object.freeze({
        power: 9,
        uncertainty: 5.1,
        gravity: 0.08,
      }),
    }),
  }),

  rpg: Object.freeze({
    name: "RPG",
    category: "launcher",
    damage: 100,
    penetration: 1.0,
    hitscan: false,
    pellets: 1,
    range: WEAPON_DEFAULTS.hitscanRange,
    tracerParticles: WEAPON_DEFAULTS.tracerParticles,
    legacyProjectile: Object.freeze({
      base: Object.freeze({
        power: 3.0,
        uncertainty: null,
        gravity: 0.0,
      }),
    }),
  }),

  m107: Object.freeze({
    name: "M107",
    category: "sniper",
    damage: undefined,
    penetration: undefined,
    hitscan: false,
    pellets: 1,
    range: WEAPON_DEFAULTS.hitscanRange,
    tracerParticles: WEAPON_DEFAULTS.tracerParticles,
    status: "incomplete_legacy_definition",
  }),

});

export const LEGACY_WEAPON_ALIASES = Object.freeze({
  g93: "b93",
  scar1: "scarl",
});

export function getWeaponConfig(weaponId) {
  const normalizedId = LEGACY_WEAPON_ALIASES[weaponId] ?? weaponId;
  return WEAPONS[normalizedId];
}
