import { system, world } from "@minecraft/server";
import { AMMO } from "../config/ammo.js";
import { showCraftConfirm, showListMenu } from "./craftingHelpers.js";

// Ammo workbench block (krep:ammoworkbench): a menu of every ammo type in config/ammo.js.
export const OPEN_AMMO_WORKBENCH_TAG = "tacz_open_ammo_workbench";

export function openAmmoWorkbench(player) {
  showListMenu(player, {
    title: "Ammo Crafting",
    body: "Select an ammo to craft:",
    entries: Object.entries(AMMO).map(([id, ammo]) => ({
      label: ammo.name,
      icon: ammo.icon,
      onSelect: (p) =>
        showCraftConfirm(p, {
          title: `Craft ${ammo.name}?`,
          ingredients: ammo.recipe,
          result: ammo.count > 1 ? `krep:${id} ${ammo.count}` : `krep:${id}`,
          back: openAmmoWorkbench,
        }),
    })),
  });
}

// crafting/workbenchBlocks.js tags the player when they use the block; open the menu once.
system.runInterval(() => {
  for (const player of world.getPlayers()) {
    if (!player.hasTag(OPEN_AMMO_WORKBENCH_TAG)) continue;
    player.removeTag(OPEN_AMMO_WORKBENCH_TAG);
    openAmmoWorkbench(player);
  }
}, 20);
