// =====================================================================================
// AMMO: every ammo item and its ammo-workbench recipe. Order = order in the workbench menu.
//   name     Menu label.         icon    Menu icon.
//   lore     Lore text key (TACZ-R/texts/*.lang).
//   recipe   [item, count] ingredients.   count   How many one craft gives.
// Which gun uses which ammo is WEAPONS[id].ammo in config/weapons.js.
// =====================================================================================

export const AMMO = Object.freeze({
  m885: { name: "5.56x45mm", icon: "textures/items/m885", lore: "krep:ammo.lore.5_56", count: 45, recipe: [["copper_ingot", 45], ["gunpowder", 3]] },
  mm9: { name: "9x19mm", icon: "textures/items/9mm", lore: "krep:ammo.lore.9mm", count: 50, recipe: [["copper_ingot", 10], ["gunpowder", 2]] },
  acp45: { name: ".45 ACP", icon: "textures/items/45acp", lore: "krep:ammo.lore.45acp", count: 30, recipe: [["copper_ingot", 10], ["gunpowder", 2]] },
  ae50: { name: ".50 AE", icon: "textures/items/50ae", lore: "krep:ammo.lore.50ae", count: 36, recipe: [["copper_ingot", 30], ["lapis_lazuli", 5], ["gunpowder", 7]] },
  gauge12: { name: "12 Gauge", icon: "textures/items/12gauge", lore: "krep:ammo.lore.12g", count: 18, recipe: [["copper_ingot", 15], ["iron_nugget", 18], ["gunpowder", 6]] },
  mm5728: { name: "5.7x28mm", icon: "textures/items/5728mm", lore: "krep:ammo.lore.5728mm", count: 48, recipe: [["copper_ingot", 15], ["lapis_lazuli", 5], ["gunpowder", 2]] },
  win308: { name: ".308 Winchester", icon: "textures/items/308win", lore: "krep:ammo.lore.308win", count: 60, recipe: [["copper_ingot", 30], ["lapis_lazuli", 1], ["gunpowder", 10]] },
  rpgrocket: { name: "RPG Rocket", icon: "textures/items/rpgrocket", lore: "krep:rocket.lore.rpgrocket", count: 3, recipe: [["copper_ingot", 30], ["iron_ingot", 3], ["gunpowder", 12]] },
  lapua338: { name: ".338 Lapua", icon: "textures/items/338lapua", lore: "krep:ammo.lore.338lapua", count: 60, recipe: [["copper_ingot", 30], ["gunpowder", 10], ["lapis_lazuli", 1]] },
  m43: { name: "7.62x39mm", icon: "textures/items/m43", lore: "krep:ammo.lore.m43", count: 35, recipe: [["copper_ingot", 15], ["gunpowder", 3]] },
  mm4630: { name: "4.6x30mm", icon: "textures/items/4630mm", lore: "krep:ammo.lore.4630mm", count: 64, recipe: [["copper_ingot", 17], ["lapis_lazuli", 6], ["gunpowder", 2]] },
  mag357: { name: ".357 Magnum", icon: "textures/items/357mag", lore: "krep:ammo.lore.357mag", count: 48, recipe: [["copper_ingot", 25], ["gunpowder", 6]] },
  mm5842: { name: "5.8x42mm", icon: "textures/items/5842mm", lore: "krep:ammo.lore.5842mm", count: 40, recipe: [["copper_ingot", 15], ["gunpowder", 3]] },
  // Ammo box: refills the minigun; also stores .308 (items/ammoBox308.js).
  ammobox: { name: ".308 Winchester Ammo Box", icon: "textures/items/308winbox", lore: "krep:box.ammobox.lore", count: 1, recipe: [["chest", 1]] },
  bmg50: { name: ".50 BMG", icon: "textures/items/50bmg", lore: "krep:ammo.lore.50bmg", count: 24, recipe: [["copper_ingot", 110], ["gunpowder", 20], ["lapis_lazuli", 12], ["blaze_rod", 1]] },
  mm792: { name: "7.92x57mm Mauser", icon: "textures/items/792x57", lore: "krep:ammo.lore.792x57", count: 60, recipe: [["copper_ingot", 30], ["lapis_lazuli", 1], ["gunpowder", 10]] },
  spr3006: { name: ".30-06 Springfield", icon: "textures/items/30_06", lore: "krep:ammo.lore.30_06", count: 60, recipe: [["copper_ingot", 30], ["lapis_lazuli", 1], ["gunpowder", 10]] },
  govt4570: { name: ".45-70 Government", icon: "textures/items/45_70", lore: "krep:ammo.lore.45_70", count: 40, recipe: [["copper_ingot", 30], ["lapis_lazuli", 2], ["gunpowder", 12]] },
  mag500: { name: ".500 S&W Magnum", icon: "textures/items/500mag", lore: "krep:ammo.lore.500mag", count: 30, recipe: [["copper_ingot", 30], ["lapis_lazuli", 2], ["gunpowder", 10]] },
  wmr22: { name: ".22 WMR", icon: "textures/items/22wmr", lore: "krep:ammo.lore.22wmr", count: 64, recipe: [["copper_ingot", 10], ["gunpowder", 2]] },
  grenade40: { name: "40mm Grenade", icon: "textures/items/40mm", lore: "krep:ammo.lore.40mm", count: 4, recipe: [["copper_ingot", 20], ["iron_ingot", 2], ["gunpowder", 8]] },
});

// Items that get lore but are not craftable ammo.
export const OTHER_LORE = Object.freeze({
  "krep:ammoboxc": "krep:box.ammoboxc.lore",
});
