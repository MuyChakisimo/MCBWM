import { system, world } from "@minecraft/server";
import { WEAPONS } from "../config/weapons.js";
import { showCraftConfirm, showListMenu } from "./craftingHelpers.js";

// Gunsmith block (krep:gunsmith): a menu of every gun in config/weapons.js with a recipe.
export const OPEN_GUNSMITH_TAG = "tacz_open_gunsmith";

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

// crafting/workbenchBlocks.js tags the player when they use the block; open the menu once.
system.runInterval(() => {
  for (const player of world.getPlayers()) {
    if (!player.hasTag(OPEN_GUNSMITH_TAG)) continue;
    player.removeTag(OPEN_GUNSMITH_TAG);
    openGunsmith(player);
  }
}, 20);
