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

// Checked once a second; an item is only written back when it had no lore yet (every setItem
// is synced to the client).
system.runInterval(() => {
  for (const player of world.getAllPlayers()) {
    const inventory = player.getComponent("inventory")?.container;
    if (!inventory) continue;
    for (let slot = 0; slot < inventory.size; slot++) {
      const item = inventory.getItem(slot);
      const lore = item && LORE_BY_ITEM[item.typeId];
      if (!lore || item.getLore().length > 0) continue;
      item.setLore([{ translate: lore }]);
      inventory.setItem(slot, item);
    }
  }
}, TicksPerSecond);
