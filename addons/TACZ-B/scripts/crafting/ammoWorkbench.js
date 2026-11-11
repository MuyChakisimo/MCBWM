import { AMMO } from "../config/ammo.js";
import { showCraftConfirm, showListMenu } from "./craftingHelpers.js";

// Ammo workbench block (krep:ammoworkbench): a menu of every ammo type in config/ammo.js.
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
