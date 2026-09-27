import { world } from "@minecraft/server";

// Opens the legacy gun-crafting UI through its existing tag bridge.
world.beforeEvents.playerInteractWithBlock.subscribe((event) => {
  if (event.block?.typeId !== "krep:gunsmith") return;
  event.player.runCommandAsync("tag @s add jawir");
});
