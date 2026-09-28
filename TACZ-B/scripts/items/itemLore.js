import { system, world, TicksPerSecond } from "@minecraft/server";
import { WEAPONS } from "../config/weapons.js";
import { AMMO, OTHER_LORE } from "../config/ammo.js";

// Adds a lore line (translated text from TACZ-R/texts) to TACZ items in player inventories.
// Guns use krep:gun.<id>.lore / krep:gun.<id>_emp.lore; ammo uses AMMO[id].lore.
const LORE_BY_ITEM = {
  ...Object.fromEntries(Object.entries(AMMO).map(([id, ammo]) => [`krep:${id}`, ammo.lore])),
  ...OTHER_LORE,
  ...Object.fromEntries(
    Object.keys(WEAPONS).flatMap((id) => [
      [`krep:${id}`, `krep:gun.${id}.lore`],
      [`krep:${id}_emp`, `krep:gun.${id}_emp.lore`],
    ]),
  ),
};

class ItemLoreManager {
  constructor(player) {
    this.player = player;
    this.inventory = player.getComponent("inventory").container;
  }
  updateItemLore(item, slot) {
    if (!item) return;
    const lore = LORE_BY_ITEM[item.typeId];
    if (lore && (!item.getLore() || item.getLore().length === 0)) item.setLore([{ translate: lore }]);
    this.inventory.setItem(slot, item);
  }
  updateInventory() {
    for (let slot = 0; slot < this.inventory.size; slot++) this.updateItemLore(this.inventory.getItem(slot), slot);
  }
}

system.runInterval(() => {
  for (const player of world.getAllPlayers()) new ItemLoreManager(player).updateInventory();
}, TicksPerSecond);
