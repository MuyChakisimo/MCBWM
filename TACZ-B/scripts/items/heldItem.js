import { system, world, PlayerInventoryType } from "@minecraft/server";

// Tells the modules that show something about the held item (attachments on the model, rounds on the model,
// scope zoom) when what a player holds may have changed, instead of each checking every tick (v1.33.6):
//   - the selected hotbar slot changed;
//   - anything in the hotbar changed (the held gun swapped to its empty item, an item moved into the slot);
//   - the player spawned or joined (again a second later, in case the inventory or properties weren't ready at
//     spawn; it was for the old BP setup controllers, gone since v1.33.12, and costs nothing), and the players
//     online when the scripts start.
// Listeners must be cheap and only write when something differs. The event's slot number isn't used (Microsoft's
// docs don't say how it counts for each inventory type): listeners read what the player holds.

const listeners = [];

/** fn(player) runs whenever what the player holds may have changed. */
export function onHeldChange(fn) {
  listeners.push(fn);
}

export function heldChanged(player) {
  if (!player?.isValid) return;
  for (const fn of listeners) {
    try {
      fn(player);
    } catch (error) {
      console.warn(`[TACZ held item] ${error}`);
    }
  }
}

world.afterEvents.playerHotbarSelectedSlotChange.subscribe(({ player }) => heldChanged(player));
world.afterEvents.playerInventoryItemChange.subscribe(({ player }) => heldChanged(player), {
  inventoryType: PlayerInventoryType.Hotbar,
  ignoreQuantityChange: true,
});
world.afterEvents.playerSpawn.subscribe(({ player }) => {
  heldChanged(player);
  system.runTimeout(() => heldChanged(player), 20);
});
world.afterEvents.worldLoad.subscribe(() => world.getPlayers().forEach(heldChanged));
