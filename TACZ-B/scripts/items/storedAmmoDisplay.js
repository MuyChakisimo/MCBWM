import { world, EquipmentSlot } from "@minecraft/server";
import { getWeaponByItem } from "../config/weapons.js";
import { onHeldChange } from "./heldItem.js";

// Guns with storedAmmoDisplay: true (config/weapons.js) show their loaded rounds on the model: the gun's ammo
// scoreboard (objective = gun id) is copied to the entity property krep:bulletcache (only written when it
// changed: every setProperty is synced to all nearby clients). Updated when the held item may have changed
// (heldItem.js) and when rounds change (firing.js, reload.js call updateStoredAmmo); it ran every tick before
// v1.33.6.

export function updateStoredAmmo(player) {
  const typeId = player.getComponent("minecraft:equippable")?.getEquipment(EquipmentSlot.Mainhand)?.typeId;
  const weapon = getWeaponByItem(typeId);
  if (!weapon?.storedAmmoDisplay) return;
  const rounds = world.scoreboard.getObjective(weapon.id)?.getScore(player) ?? 0;
  if (player.getProperty("krep:bulletcache") !== rounds) player.setProperty("krep:bulletcache", rounds);
}

onHeldChange(updateStoredAmmo);
