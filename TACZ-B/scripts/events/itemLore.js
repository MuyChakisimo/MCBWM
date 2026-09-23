import { system, world } from "@minecraft/server";
import { WEAPONS } from "../config/weapons.js";

// =====================================================
// TACZ ITEM LORE
//
// Weapon tooltips are generated from config/weapons.js.
// Change damage / penetration / range / pellets / spread there and the
// same values drive both gameplay and the inventory hover description.
// Existing inventory items refresh automatically on the periodic pass.
// =====================================================

const CATEGORY_LABELS = Object.freeze({
  assault_rifle: "Assault Rifle",
  pistol: "Pistol",
  smg: "SMG",
  dmr: "DMR",
  sniper: "Sniper Rifle",
  lmg: "Light Machine Gun",
  machine_gun: "Machine Gun",
  shotgun: "Shotgun",
  launcher: "Launcher",
});

const STATIC_LORE = Object.freeze({
  "krep:ammoboxc": [{ translate: "krep:box.ammoboxc.lore" }],
  "krep:rpgrocket": [{ translate: "krep:rocket.lore.rpgrocket" }],
  "krep:m43": [{ translate: "krep:ammo.lore.m43" }],
  "krep:mm5842": [{ translate: "krep:ammo.lore.5842mm" }],
  "krep:mm5728": [{ translate: "krep:ammo.lore.5728mm" }],
  "krep:mm4630": [{ translate: "krep:ammo.lore.4630mm" }],
  "krep:mag357": [{ translate: "krep:ammo.lore.357mag" }],
  "krep:win308": [{ translate: "krep:ammo.lore.308win" }],
  "krep:lapua338": [{ translate: "krep:ammo.lore.338lapua" }],
  "krep:ae50": [{ translate: "krep:ammo.lore.50ae" }],
  "krep:acp45": [{ translate: "krep:ammo.lore.45acp" }],
  "krep:gauge12": [{ translate: "krep:ammo.lore.12g" }],
  "krep:mm9": [{ translate: "krep:ammo.lore.9mm" }],
  "krep:ammobox": [{ translate: "krep:box.ammobox.lore" }],
  "krep:m885": [{ translate: "krep:ammo.lore.5_56" }],
});

function formatNumber(value) {
  return Number.isInteger(value) ? String(value) : String(Number(value.toFixed(2)));
}

function getWeaponFromTypeId(typeId) {
  if (!typeId?.startsWith("krep:")) return undefined;

  const rawId = typeId.slice("krep:".length);
  const empty = rawId.endsWith("_emp");
  const weaponId = empty ? rawId.slice(0, -4) : rawId;
  const weapon = WEAPONS[weaponId];

  if (!weapon) return undefined;
  return { weaponId, weapon, empty };
}

function buildWeaponLore(typeId) {
  const resolved = getWeaponFromTypeId(typeId);
  if (!resolved) return undefined;

  const { weapon, empty } = resolved;
  const pellets = Math.max(1, Math.floor(weapon.pellets ?? 1));
  const perShot = weapon.damage * pellets;
  const headshot = weapon.damage * (weapon.headshotMultiplier ?? 2);
  const category = CATEGORY_LABELS[weapon.category] ?? weapon.category;

  const lore = [
    `§fType: ${category}`,
    `§fWeapon: ${weapon.name}`,
  ];

  if (empty) lore.push("§cStatus: Empty§r");
  if (weapon.caliber) lore.push(`§fCaliber: ${weapon.caliber}`);
  if (weapon.magazineSize) lore.push(`§fMagazine: ${weapon.magazineSize}`);

  lore.push("");

  if (pellets > 1) {
    lore.push(`§fDamage: ${formatNumber(weapon.damage)} × ${pellets} pellets`);
    lore.push(`§fMaximum pellet damage: ${formatNumber(perShot)}`);
  } else {
    lore.push(`§fDamage: ${formatNumber(weapon.damage)}`);
    lore.push(`§fHeadshot: ${formatNumber(headshot)}`);
  }

  lore.push(`§fPenetration: ${Math.round((weapon.penetration ?? 0) * 100)}%`);

  if (weapon.hitscan) {
    lore.push(`§fRange: ${formatNumber(weapon.range)} blocks`);
  } else {
    lore.push("§fProjectile: Physical");
  }

  if (pellets > 1) {
    lore.push(
      `§fSpread: ${formatNumber(weapon.spread?.hip ?? 0)}° hip / ` +
      `${formatNumber(weapon.spread?.ads ?? 0)}° ADS`,
    );
  }

  if (weapon.fireMode) {
    lore.push(`§fFire Mode: ${weapon.fireMode}`);
  }

  return lore;
}

function sameLore(current, desired) {
  if (!Array.isArray(current) || current.length !== desired.length) return false;
  for (let i = 0; i < desired.length; i++) {
    if (current[i] !== desired[i]) return false;
  }
  return true;
}

function updateInventory(player) {
  const inventory = player.getComponent("minecraft:inventory")?.container;
  if (!inventory) return;

  for (let slot = 0; slot < inventory.size; slot++) {
    const item = inventory.getItem(slot);
    if (!item) continue;

    const weaponLore = buildWeaponLore(item.typeId);
    if (weaponLore) {
      if (!sameLore(item.getLore(), weaponLore)) {
        item.setLore(weaponLore);
        inventory.setItem(slot, item);
      }
      continue;
    }

    // Preserve translated lore for non-weapon ammunition/box items.
    const staticLore = STATIC_LORE[item.typeId];
    if (staticLore && item.getLore().length === 0) {
      item.setLore(staticLore);
      inventory.setItem(slot, item);
    }
  }
}

system.runInterval(() => {
  for (const player of world.getAllPlayers()) {
    updateInventory(player);
  }
}, 20);
