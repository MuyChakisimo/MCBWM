import { system, world, EntitySwingSource, HeldItemOption } from "@minecraft/server";
import { getWeaponByItem } from "../config/weapons.js";

// Inspect: a swing (left click) with a gun whose magazine is full plays its inspect animation; with the empty
// item, the empty inspect (guns with `emptyInspect` in config/weapons.js). Not while reloading or in the
// attachment preview. "Full": the magazine without a chambered round (per fitted magazine for the Vector and
// Golden Deagle); a gun whose round is the item (RPG ...) or the minigun inspects on any swing when loaded.
// The RP controllers play it when q.skin_id turns 1 (krep:inspect) and go back to hold by themselves; we turn it
// back to 0 (krep:noinspect) right after, as the old BP controller did.
// Until v1.33.12 a BP controller (controller.animation.akm.inspect, ~110 conditions) checked this for every
// player every tick; now it runs only on a swing.

const SWINGS = new Set([EntitySwingSource.Attack, EntitySwingSource.Mine, EntitySwingSource.None]);
const PULSE_TICKS = 2;

function canInspect(player, weapon, typeId) {
  const mark = player.getComponent("minecraft:mark_variant")?.value;
  if (mark === 1 || mark === 2) return false; // reloading (or overheating)
  if (player.getComponent("minecraft:skin_id")?.value === 2) return false; // attachment preview
  const rounds = world.scoreboard.getObjective(weapon.id)?.getScore(player) ?? 0;
  if (typeId === `krep:${weapon.id}_emp`) return !!weapon.emptyInspect && (weapon.roundInItem || rounds === 0);
  if (weapon.roundInItem || weapon.heat) return true;
  const full = weapon.scriptReload?.byMagazine?.[player.getProperty("krep:magazine") ?? 0]?.caps?.[0] ?? weapon.magazine;
  return rounds >= full;
}

world.afterEvents.playerSwingStart.subscribe(
  ({ player, heldItemStack, swingSource }) => {
    const weapon = getWeaponByItem(heldItemStack?.typeId);
    if (!weapon || !SWINGS.has(swingSource) || !canInspect(player, weapon, heldItemStack.typeId)) return;
    player.triggerEvent("krep:inspect");
    system.runTimeout(() => {
      if (player.isValid && player.getComponent("minecraft:skin_id")?.value === 1) player.triggerEvent("krep:noinspect");
    }, PULSE_TICKS);
  },
  { heldItemOption: HeldItemOption.AnyItem }
);

// Joining: no inspect left over (the BP controller sent krep:noinspect for its first second).
world.afterEvents.playerSpawn.subscribe(({ player, initialSpawn }) => {
  if (initialSpawn && player.getComponent("minecraft:skin_id")?.value === 1) player.triggerEvent("krep:noinspect");
});
