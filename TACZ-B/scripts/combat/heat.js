import { system, world, EquipmentSlot } from "@minecraft/server";
import { getWeaponByItem } from "../config/weapons.js";
import { loredItem } from "../items/itemLore.js";
import { onHeldChange } from "../items/heldItem.js";
import { zoomSoon } from "./aimZoom.js";

// Heat for guns with `heat` in config/weapons.js (the minigun), called by firing.js. Until v1.33.11 the minigun's
// BP controller (animation_controllers/gun_minigun.json) did this, the same way:
//   - each shot adds `perShot` to the scoreboard `heat.score` (a percentage, shown by the HUD function <id>);
//   - while the gun is held and not firing it cools 1 every `coolEvery` ticks (not while in another slot);
//   - at `max` it overheats: the item becomes krep:<id>_emp and the overheat animation plays (q.mark_variant 1,
//     krep:reload, like a reload) for `lock` seconds; at `refill` seconds the gun comes back with `after` heat.
//     Switching away cancels it (the item stays _emp); holding the _emp item again starts it over.

const ticks = (seconds) => Math.round(seconds * 20);

/** Players whose held heat gun may need cooling: id -> player. */
const hot = new Map();
/** Last shot tick per player (no cooling while firing). */
const lastShot = new Map();
/** Overheats in progress: id -> { player, weapon, slot, refillTick, endTick, refilled }. */
const overheated = new Map();

const heldTypeId = (player) => player.getComponent("minecraft:equippable")?.getEquipment(EquipmentSlot.Mainhand)?.typeId;
const objective = (weapon) => world.scoreboard.getObjective(weapon.heat.score);
const heatOf = (player, weapon) => objective(weapon)?.getScore(player) ?? 0;

/** The gun's HUD function (rounds in the ammo box and the heat). */
export function showHeat(player, weapon) {
  player.runCommand(`function ${weapon.id}`);
}

export const isOverheated = (player) => overheated.has(player.id);

/** After a shot: adds heat. True when the gun overheated (it is now the _emp item). */
export function addHeat(player, weapon) {
  const heat = Math.min(weapon.heat.max, heatOf(player, weapon) + weapon.heat.perShot);
  objective(weapon)?.setScore(player, heat);
  hot.set(player.id, player);
  lastShot.set(player.id, system.currentTick);
  if (heat < weapon.heat.max) return false;
  player.getComponent("minecraft:equippable").setEquipment(EquipmentSlot.Mainhand, loredItem(`krep:${weapon.id}_emp`));
  startOverheat(player, weapon);
  return true;
}

function startOverheat(player, weapon) {
  if (overheated.has(player.id)) return;
  const now = system.currentTick;
  player.triggerEvent("krep:reload"); // q.mark_variant 1: the RP overheat animation; firing.js doesn't shoot
  zoomSoon(player);
  overheated.set(player.id, {
    player, weapon, slot: player.selectedSlotIndex,
    refillTick: now + ticks(weapon.heat.refill), endTick: now + ticks(weapon.heat.lock), refilled: false,
  });
}

function endOverheat(o) {
  overheated.delete(o.player.id);
  o.player.triggerEvent("krep:noreload");
  zoomSoon(o.player);
}

function tickOverheat(o, now) {
  const { player, weapon } = o;
  const held = heldTypeId(player);
  const holding = player.selectedSlotIndex === o.slot && held === `krep:${weapon.id}${o.refilled ? "" : "_emp"}`;
  if (!holding) return endOverheat(o); // switched away: the item stays as it is
  if (!o.refilled && now >= o.refillTick) {
    player.getComponent("minecraft:equippable").setEquipment(EquipmentSlot.Mainhand, loredItem(`krep:${weapon.id}`));
    objective(weapon)?.setScore(player, weapon.heat.after);
    hot.set(player.id, player);
    o.refilled = true;
    showHeat(player, weapon);
  }
  if (now >= o.endTick) endOverheat(o);
}

function tickCooling(id, player, now) {
  const weapon = getWeaponByItem(heldTypeId(player));
  if (!weapon?.heat || heldTypeId(player) !== `krep:${weapon.id}` || overheated.has(id)) return; // cools only in hand
  if (now - (lastShot.get(id) ?? -Infinity) < weapon.heat.coolEvery) return; // firing
  if (now % weapon.heat.coolEvery !== 0) return;
  const heat = heatOf(player, weapon);
  if (heat > 0) objective(weapon)?.setScore(player, heat - 1);
  if (heat <= 1) hot.delete(id);
  showHeat(player, weapon);
}

system.runInterval(() => {
  if (hot.size === 0 && overheated.size === 0) return;
  const now = system.currentTick;
  for (const [id, o] of overheated) {
    try {
      if (!o.player.isValid) overheated.delete(id);
      else tickOverheat(o, now);
    } catch (error) {
      overheated.delete(id);
      console.warn(`[TACZ heat] ${error}`);
    }
  }
  for (const [id, player] of hot) {
    try {
      if (!player.isValid) hot.delete(id);
      else tickCooling(id, player, now);
    } catch (error) {
      hot.delete(id);
      console.warn(`[TACZ heat] ${error}`);
    }
  }
}, 1);

// Taking the gun in hand: its HUD, cooling if it is warm; the empty (overheated) item starts the overheat.
onHeldChange((player) => {
  const typeId = heldTypeId(player);
  const weapon = getWeaponByItem(typeId);
  if (!weapon?.heat) return;
  // Next tick: after the spawn handler in reload.js has cleared a left-over reload view.
  if (typeId === `krep:${weapon.id}_emp`) return void system.run(() => player.isValid && heldTypeId(player) === typeId && startOverheat(player, weapon));
  if (heatOf(player, weapon) > 0) hot.set(player.id, player);
  showHeat(player, weapon);
});

const forget = (id) => {
  hot.delete(id);
  lastShot.delete(id);
  overheated.delete(id);
};
world.afterEvents.entityDie.subscribe(({ deadEntity }) => forget(deadEntity.id), { entityTypes: ["minecraft:player"] });
world.afterEvents.playerLeave.subscribe(({ playerId }) => forget(playerId));
