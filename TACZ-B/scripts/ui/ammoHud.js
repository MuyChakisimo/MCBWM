import { system, world } from "@minecraft/server";
import { WEAPONS } from "../config/weapons.js";
import { getMagazineAmmo } from "../weapons/ammo.js";
import { getHeldWeaponId } from "../players/heldWeapon.js";
import { createLogger } from "../debug/logger.js";

const log = createLogger("AmmoHud");

const HUD_REFRESH_TICKS = 10;
const LEGACY_HUD_IDS = new Set(["m107"]);

function getHeldWeapon(player) {
  const id = getHeldWeaponId(player);
  const weapon = id ? WEAPONS[id] : undefined;
  return weapon ? { id, weapon } : undefined;
}

function getLegacyScore(player, objectiveId) {
  try {
    const objective = world.scoreboard.getObjective(objectiveId);
    if (!objective || !player.scoreboardIdentity) return undefined;
    return objective.getScore(player.scoreboardIdentity);
  } catch {
    return undefined;
  }
}

function getAmmo(player, id, weapon) {
  if (weapon.modularInput) return getMagazineAmmo(player, weapon);
  if (LEGACY_HUD_IDS.has(id)) return getLegacyScore(player, id);
  return undefined;
}

function showAmmoHud(player, id, weapon) {
  const ammo = getAmmo(player, id, weapon);
  if (ammo === undefined) return;

  const capacity = weapon.magazineSize ?? 0;
  const caliber = weapon.caliber ?? "Ammo";
  const firstLine = ammo > 0 ? `${ammo}/${capacity}` : "§cNo Ammo§r";
  try {
    player.onScreenDisplay.setActionBar(`${firstLine}\n${caliber}`);
  } catch (error) {
    log.error(`Action bar update failed for ${player.name}:`, error);
  }
}

system.runInterval(() => {
  for (const player of world.getAllPlayers()) {
    const held = getHeldWeapon(player);
    if (!held) continue;
    if (!held.weapon.modularInput && !LEGACY_HUD_IDS.has(held.id)) continue;
    showAmmoHud(player, held.id, held.weapon);
  }
}, HUD_REFRESH_TICKS);
