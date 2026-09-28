import { world } from "@minecraft/server";
world.beforeEvents.playerInteractWithBlock.subscribe((event) => {
  const block = event.block,
    player = event.player;
  (block.typeId === "krep:attachmentblock" && player.runCommandAsync("tag @s add batak"),
    block.typeId === "krep:ammoworkbench" && player.runCommandAsync("tag @s add laknatullah"));
});
