// =====================================================================================
// WEAPONS: every gun in the pack and its stats. Edit numbers here to rebalance.
//
// Used live by the scripts (change here, reload the world):
//   name          Label in the gunsmith menu.
//   category      rifle | smg | pistol | sniper | shotgun | heavy (informational).
//   damage        Damage per hit (per pellet for shotguns). Headshots (within 0.375 blocks
//                 of the head) deal 2x.
//   penetration   0..1. Armor reduces damage by (armor points x (1 - penetration)) / 20,
//                 capped at 80%. 1.0 ignores armor. Headshots only count the helmet.
//   pellets       Rays per shot (shotguns: 12). Default 1.
//   spread        { hip, ads }: pellet scatter in degrees (typical deviation from the aim;
//                 about 2 in 3 pellets land within it). ads = sneaking. Only with pellets.
//   tracers       How many of the pellets draw a smoke tracer. Default: all.
//   explosion     { power, breaksBlocks, splashDamage, splashRadius }: the shot explodes
//                 where it lands (RPG). power 4 = TNT. splashDamage hits every entity
//                 within splashRadius blocks, on top of the explosion itself.
//   recipe        Gunsmith ingredients, [item, count]. "log" accepts any wood log.
//   icon          Menu icon if not textures/items/<id>.
//   range, tracerParticles, breakableBlocks   Optional overrides of the HITSCAN defaults below.
//   storedAmmoDisplay        Shows stored ammo on the gun model (krep:bulletcache).
//
// Defined by the behavior pack JSON, listed here so everything is in one place.
// Changing these does nothing by itself; `tools/weapons/check.mjs` reports any gun whose
// pack files disagree with these values, and where to change them:
//   magazine      Rounds per magazine (functions/<id>*.mcfunction, animation controllers).
//   ammo          Item consumed on reload.
//   reload        "single": loads one round per reload (tube-fed shotguns).
//   overheat      Minigun: shots before it must cool down (no magazine).
//
// Adding a gun: add an entry here (the id is the item id without "krep:"), then the pack
// files it needs; see README "Adding a weapon". Removing: delete the entry and its files.
// =====================================================================================

// Every gun fires by hitscan (combat/hitscan.js): instant rays from the eyes.
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

// Order = order in the gunsmith menu.
export const WEAPONS = Object.freeze({
  deagle: {
    name: "Desert Eagle",
    category: "pistol",
    damage: 16,
    penetration: 0.5,
    magazine: 7,
    ammo: "krep:ae50",
    recipe: [
      ["diamond", 2],
      ["gold_ingot", 6],
      ["iron_ingot", 42],
      ["blaze_rod", 1],
    ],
  },
  mp5: {
    name: "MP5",
    category: "smg",
    damage: 6.5,
    penetration: 0.45,
    magazine: 30,
    ammo: "krep:mm9",
    recipe: [
      ["iron_ingot", 32],
      ["lapis_lazuli", 4],
    ],
  },
  vector: {
    name: "Vector 45",
    category: "smg",
    damage: 6,
    penetration: 0.4,
    magazine: 20,
    ammo: "krep:acp45",
    recipe: [
      ["diamond", 10],
      ["gold_ingot", 12],
      ["iron_ingot", 60],
      ["lapis_lazuli", 8],
    ],
  },
  p90: {
    name: "P90",
    category: "smg",
    damage: 4,
    penetration: 0.7,
    magazine: 50,
    ammo: "krep:mm5728",
    recipe: [
      ["diamond", 2],
      ["gold_ingot", 8],
      ["iron_ingot", 72],
      ["quartz", 3],
    ],
  },
  m16a1: {
    name: "M16A1",
    category: "rifle",
    damage: 6,
    penetration: 0.6,
    magazine: 20,
    ammo: "krep:m885",
    recipe: [
      ["lapis_lazuli", 6],
      ["iron_ingot", 32],
      ["log", 6],
    ],
  },
  m16: {
    name: "M16A4",
    category: "rifle",
    damage: 6,
    penetration: 0.6,
    magazine: 30,
    ammo: "krep:m885",
    recipe: [
      ["lapis_lazuli", 8],
      ["iron_ingot", 36],
      ["log", 6],
    ],
  },
  hk416: {
    name: "HK416",
    category: "rifle",
    damage: 5,
    penetration: 0.6,
    magazine: 30,
    ammo: "krep:m885",
    recipe: [
      ["gold_ingot", 16],
      ["iron_ingot", 64],
      ["quartz", 8],
    ],
  },
  scarh: {
    name: "SCAR-H",
    category: "rifle",
    damage: 9,
    penetration: 0.7,
    magazine: 20,
    ammo: "krep:win308",
    recipe: [
      ["diamond", 2],
      ["gold_ingot", 16],
      ["iron_ingot", 96],
      ["blaze_rod", 4],
    ],
  },
  g3: {
    name: "G3",
    category: "rifle",
    damage: 9,
    penetration: 0.7,
    magazine: 20,
    ammo: "krep:win308",
    recipe: [
      ["gold_ingot", 9],
      ["iron_ingot", 72],
      ["quartz", 5],
    ],
  },
  aa12: {
    name: "AA-12",
    category: "shotgun",
    damage: 2,
    penetration: 0.1,
    pellets: 12,
    spread: { hip: 7.4, ads: 3.9 },
    tracers: 6,
    magazine: 10,
    ammo: "krep:gauge12",
    recipe: [
      ["diamond", 2],
      ["gold_ingot", 16],
      ["iron_ingot", 80],
      ["blaze_rod", 4],
    ],
  },
  rpg: {
    name: "RPG-7",
    category: "heavy",
    damage: 100,
    penetration: 1,
    explosion: { power: 4, breaksBlocks: true, splashDamage: 10, splashRadius: 5 },
    tracerParticles: 12,
    magazine: 1,
    ammo: "krep:rpgrocket",
    recipe: [
      ["log", 24],
      ["lapis_lazuli", 16],
      ["iron_ingot", 38],
    ],
  },
  m870: {
    name: "M870",
    category: "shotgun",
    damage: 3,
    penetration: 0.5,
    pellets: 12,
    spread: { hip: 6.1, ads: 2.2 },
    tracers: 6,
    magazine: 5,
    ammo: "krep:gauge12",
    reload: "single",
    recipe: [
      ["iron_ingot", 25],
      ["log", 12],
    ],
  },
  awp: {
    name: "AWM",
    category: "sniper",
    damage: 42,
    penetration: 0.9,
    magazine: 5,
    ammo: "krep:lapua338",
    recipe: [
      ["diamond", 10],
      ["gold_ingot", 50],
      ["iron_ingot", 250],
      ["blaze_rod", 5],
    ],
  },
  g17: {
    name: "Glock-17",
    category: "pistol",
    damage: 6,
    penetration: 0.5,
    magazine: 17,
    ammo: "krep:mm9",
    recipe: [["iron_ingot", 16]],
  },
  m1911: {
    name: "M1911",
    category: "pistol",
    damage: 11,
    penetration: 0.3,
    magazine: 7,
    ammo: "krep:acp45",
    recipe: [
      ["iron_ingot", 16],
      ["log", 5],
    ],
  },
  akm: {
    name: "AKM",
    category: "rifle",
    damage: 9,
    penetration: 0.65,
    magazine: 30,
    ammo: "krep:m43",
    recipe: [
      ["lapis_lazuli", 6],
      ["iron_ingot", 38],
      ["log", 8],
    ],
  },
  m4a1: {
    name: "M4A1",
    category: "rifle",
    damage: 8,
    penetration: 0.65,
    magazine: 30,
    ammo: "krep:m885",
    recipe: [
      ["lapis_lazuli", 6],
      ["iron_ingot", 38],
      ["log", 8],
    ],
  },
  scarl: {
    name: "SCAR-L",
    category: "rifle",
    damage: 7,
    penetration: 0.65,
    magazine: 30,
    ammo: "krep:m885",
    recipe: [
      ["gold_ingot", 6],
      ["iron_ingot", 48],
      ["quartz", 3],
    ],
  },
  g36: {
    name: "G36K",
    category: "rifle",
    damage: 7,
    penetration: 0.65,
    magazine: 30,
    ammo: "krep:m885",
    recipe: [
      ["gold_ingot", 16],
      ["iron_ingot", 64],
      ["quartz", 8],
    ],
  },
  mp7: {
    name: "MP7",
    category: "smg",
    damage: 4,
    penetration: 0.7,
    magazine: 40,
    ammo: "krep:mm4630",
    recipe: [
      ["iron_ingot", 50],
      ["gold_ingot", 10],
      ["quartz", 3],
      ["diamond", 1],
    ],
  },
  minigun: {
    name: "M134 Minigun",
    category: "heavy",
    damage: 8,
    penetration: 0.5,
    magazine: null,
    ammo: "krep:ammobox",
    overheat: 100,
    recipe: [
      ["iron_ingot", 320],
      ["blaze_rod", 10],
      ["gold_ingot", 80],
      ["netherite_ingot", 10],
      ["diamond", 40],
    ],
  },
  uzi: {
    name: "Uzi",
    category: "smg",
    damage: 5,
    penetration: 0.3,
    magazine: 20,
    ammo: "krep:mm9",
    recipe: [["iron_ingot", 32]],
  },
  g18: {
    name: "Glock 18",
    category: "pistol",
    damage: 3,
    penetration: 0.3,
    magazine: 17,
    ammo: "krep:mm9",
    recipe: [["iron_ingot", 32]],
  },
  db: {
    name: "Double Barrel",
    category: "shotgun",
    damage: 3,
    penetration: 0.3,
    pellets: 12,
    spread: { hip: 6.1, ads: 2.2 },
    tracers: 6,
    magazine: 2,
    ammo: "krep:gauge12",
    recipe: [
      ["iron_ingot", 8],
      ["log", 8],
    ],
  },
  deagleg: {
    name: "Golden Desert Eagle",
    category: "pistol",
    damage: 12,
    penetration: 0.7,
    magazine: 9,
    ammo: "krep:mag357",
    recipe: [
      ["iron_ingot", 16],
      ["blaze_rod", 1],
      ["gold_ingot", 32],
      ["diamond", 1],
    ],
  },
  saiga12: {
    name: "Saiga 12",
    category: "shotgun",
    damage: 2,
    penetration: 0.3,
    pellets: 12,
    spread: { hip: 6.1, ads: 2.2 },
    tracers: 6,
    magazine: 5,
    ammo: "krep:gauge12",
    recipe: [
      ["iron_ingot", 23],
      ["quartz", 4],
    ],
  },
  fal: {
    name: "FAL",
    category: "rifle",
    damage: 9,
    penetration: 0.7,
    magazine: 20,
    ammo: "krep:win308",
    recipe: [
      ["gold_ingot", 26],
      ["iron_ingot", 64],
      ["diamond", 2],
    ],
  },
  qbz95: {
    name: "QBZ-95",
    category: "rifle",
    damage: 7,
    penetration: 0.7,
    magazine: 30,
    ammo: "krep:mm5842",
    recipe: [
      ["iron_ingot", 40],
      ["log", 6],
      ["lapis_lazuli", 8],
      ["gold_ingot", 3],
    ],
  },
  ump: {
    name: "UMP-45",
    category: "smg",
    damage: 6.7,
    penetration: 0.4,
    magazine: 25,
    ammo: "krep:acp45",
    icon: "textures/items/ump45",
    recipe: [
      ["iron_ingot", 62],
      ["gold_ingot", 5],
      ["quartz", 3],
    ],
  },
  b93: {
    name: "B93R",
    category: "pistol",
    damage: 4,
    penetration: 0.4,
    magazine: 20,
    ammo: "krep:mm9",
    recipe: [
      ["iron_ingot", 21],
      ["log", 5],
      ["lapis_lazuli", 2],
    ],
  },
  sks: {
    name: "SKS",
    category: "sniper",
    damage: 11,
    penetration: 0.65,
    magazine: 10,
    ammo: "krep:m43",
    recipe: [
      ["iron_ingot", 40],
      ["lapis_lazuli", 8],
      ["log", 12],
    ],
  },
  mk14: {
    name: "MK14",
    category: "sniper",
    damage: 13,
    penetration: 0.7,
    magazine: 20,
    ammo: "krep:win308",
    recipe: [
      ["iron_ingot", 62],
      ["gold_ingot", 20],
      ["diamond", 4],
      ["blaze_rod", 2],
    ],
  },
  qbz191: {
    name: "QBZ-191",
    category: "rifle",
    damage: 7,
    penetration: 0.7,
    magazine: 30,
    ammo: "krep:mm5842",
    recipe: [
      ["iron_ingot", 64],
      ["lapis_lazuli", 16],
      ["gold_ingot", 8],
      ["quartz", 8],
    ],
  },
  type81: {
    name: "Type-81",
    category: "rifle",
    damage: 9,
    penetration: 0.65,
    magazine: 30,
    ammo: "krep:m43",
    recipe: [
      ["iron_ingot", 28],
      ["log", 10],
    ],
  },
  evolys: {
    name: "Evolys",
    category: "heavy",
    damage: 10,
    penetration: 0.6,
    magazine: 75,
    ammo: "krep:win308",
    storedAmmoDisplay: true,
    recipe: [
      ["iron_ingot", 128],
      ["gold_ingot", 30],
      ["diamond", 6],
      ["blaze_rod", 5],
    ],
  },
  m249: {
    name: "M249",
    category: "heavy",
    damage: 7,
    penetration: 0.65,
    magazine: 100,
    ammo: "krep:m885",
    storedAmmoDisplay: true,
    recipe: [
      ["iron_ingot", 110],
      ["gold_ingot", 16],
      ["diamond", 4],
      ["blaze_rod", 2],
    ],
  },
  t50: {
    name: "Timeless 50",
    category: "pistol",
    damage: 16,
    penetration: 0.5,
    magazine: 8,
    ammo: "krep:ae50",
    recipe: [
      ["iron_ingot", 48],
      ["gold_ingot", 6],
      ["diamond", 1],
    ],
  },
  cp: {
    name: "Colt Python",
    category: "pistol",
    damage: 12,
    penetration: 0.7,
    magazine: 6,
    ammo: "krep:mag357",
    recipe: [
      ["iron_ingot", 28],
      ["gold_ingot", 4],
      ["lapis_lazuli", 2],
    ],
  },
  m1014: {
    name: "M1014",
    category: "shotgun",
    damage: 3,
    penetration: 0.4,
    pellets: 12,
    spread: { hip: 6.1, ads: 2.2 },
    tracers: 6,
    magazine: 7,
    ammo: "krep:gauge12",
    storedAmmoDisplay: true,
    reload: "single",
    recipe: [
      ["iron_ingot", 62],
      ["gold_ingot", 12],
      ["diamond", 1],
      ["lapis_lazuli", 2],
    ],
  },
  p320: {
    name: "P320",
    category: "pistol",
    damage: 10,
    penetration: 0.3,
    magazine: 12,
    ammo: "krep:acp45",
    recipe: [
      ["iron_ingot", 28],
      ["gold_ingot", 4],
      ["lapis_lazuli", 2],
    ],
  },
  m107: {
    name: "M107",
    category: "sniper",
    damage: 55,
    penetration: 0.8,
    magazine: 10,
    ammo: "krep:bmg50",
    recipe: [
      ["diamond", 18],
      ["gold_ingot", 64],
      ["netherite_ingot", 3],
      ["iron_ingot", 320],
      ["blaze_rod", 5],
    ],
  },
});

/** The gun for an item id ("krep:m4a1" or the empty variant "krep:m4a1_emp"), or undefined. */
export function getWeaponByItem(typeId) {
  if (!typeId?.startsWith("krep:")) return undefined;
  const id = typeId.slice(5).replace(/_emp$/, "");
  return WEAPONS[id] ? { id, ...WEAPONS[id] } : undefined;
}

export function getWeapon(id) {
  return WEAPONS[id] ? { id, ...WEAPONS[id] } : undefined;
}
