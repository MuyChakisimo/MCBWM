import { WEAPONS } from "../config/weapons.js";
import { showCraftConfirm, showListMenu } from "./craftingHelpers.js";

// Gunsmith block (krep:gunsmith): a menu of every gun in config/weapons.js with a recipe.
export function openGunsmith(player) {
  showListMenu(player, {
    title: "Gun Crafting",
    body: "Select a gun to craft:",
    entries: Object.entries(WEAPONS)
      .filter(([, weapon]) => weapon.recipe)
      .map(([id, weapon]) => ({
        label: weapon.name,
        icon: weapon.icon ?? `textures/items/${id}`,
        onSelect: (p) =>
          showCraftConfirm(p, {
            title: `${weapon.name} Crafting`,
            ingredients: weapon.recipe,
            result: `krep:${id}`,
            back: openGunsmith,
          }),
      })),
  });
}
