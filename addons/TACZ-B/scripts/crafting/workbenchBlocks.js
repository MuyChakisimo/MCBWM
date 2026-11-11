import { system, world } from "@minecraft/server";
import { openGunsmith } from "./gunsmith.js";
import { openAmmoWorkbench } from "./ammoWorkbench.js";
import { openAttachmentWorkbench } from "../attachments/attachmentMenu.js";
import { holdFire } from "../combat/firing.js";

// Using a workbench block opens its menu right away, like a chest: the use is cancelled (so the
// held item isn't placed or used), and sneaking uses the block normally instead.
const MENU_BY_BLOCK = {
  "krep:gunsmith": openGunsmith,
  "krep:ammoworkbench": openAmmoWorkbench,
  "krep:attachmentblock": openAttachmentWorkbench,
};

world.beforeEvents.playerInteractWithBlock.subscribe((event) => {
  const openMenu = MENU_BY_BLOCK[event.block.typeId];
  const { player } = event;
  if (!openMenu || player.isSneaking) return;
  event.cancel = true;
  holdFire(player); // the same click must not fire the gun in hand (it took a round before v1.33.13)
  // Holding the use button repeats the event; open the menu only for the first one.
  if (event.isFirstEvent === false) return;
  // Before-events can't show forms; open it in the next tick.
  system.run(() => openMenu(player));
});
