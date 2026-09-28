import { world } from "@minecraft/server";
world.beforeEvents.playerInteractWithBlock.subscribe((event) => {
  const block = event.block,
    player = event.player;
  block.typeId === "krep:gunsmith" && player.runCommandAsync("tag @s add jawir");
});
