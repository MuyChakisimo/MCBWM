// =====================================================
// HELD WEAPON RESOLUTION
//
// Single definition of "which TACZ weapon is this item / is this player
// holding". Item ids are krep:<weaponId> and krep:<weaponId>_emp (the
// empty-magazine variant used by legacy weapons).
// =====================================================
import { createLogger } from "../debug/logger.js";

const log = createLogger("HeldWeapon");
const ITEM_PREFIX = "krep:";
const EMPTY_SUFFIX = /_emp$/;

/** @returns {string|undefined} weapon id for a krep:* item stack */
export function weaponIdFromItem(item) {
  const typeId = item?.typeId;
  if (!typeId?.startsWith(ITEM_PREFIX)) return undefined;
  return typeId.slice(ITEM_PREFIX.length).replace(EMPTY_SUFFIX, "");
}

/** @returns {import("@minecraft/server").ItemStack|undefined} */
export function getMainhandItem(player) {
  try {
    return player.getComponent("minecraft:equippable")?.getEquipment("Mainhand");
  } catch (error) {
    // Invalid/unloaded players throw here; that is expected during leave.
    if (player?.isValid?.()) log.error(`Could not read mainhand of ${player.name}:`, error);
    return undefined;
  }
}

/** @returns {string|undefined} weapon id held in the main hand */
export function getHeldWeaponId(player) {
  return weaponIdFromItem(getMainhandItem(player));
}
