import { world } from "@minecraft/server";

// Routes the two legacy workbenches into their existing UI tag bridges.
world.beforeEvents.playerInteractWithBlock.subscribe((event) => {
  const blockId = event.block?.typeId;
  if (blockId === "krep:attachmentblock") {
    event.player.runCommandAsync("tag @s add batak");
  } else if (blockId === "krep:ammoworkbench") {
    event.player.runCommandAsync("tag @s add laknatullah");
  }
});
