import { world } from "@minecraft/server";
import { OPEN_GUNSMITH_TAG } from "./gunsmith.js";
import { OPEN_AMMO_WORKBENCH_TAG } from "./ammoWorkbench.js";
import { OPEN_ATTACHMENTS_TAG } from "../attachments/attachmentMenu.js";

// Using a workbench block tags the player; each menu module opens its menu for tagged players.
// (Before-events are read-only, so the tag is added with a command.)
const TAG_BY_BLOCK = {
  "krep:gunsmith": OPEN_GUNSMITH_TAG,
  "krep:ammoworkbench": OPEN_AMMO_WORKBENCH_TAG,
  "krep:attachmentblock": OPEN_ATTACHMENTS_TAG,
};

world.beforeEvents.playerInteractWithBlock.subscribe((event) => {
  const tag = TAG_BY_BLOCK[event.block.typeId];
  if (tag) event.player.runCommandAsync(`tag @s add ${tag}`);
});
