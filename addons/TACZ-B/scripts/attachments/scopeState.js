import { system, EquipmentSlot } from "@minecraft/server";
import { getWeaponByItem } from "../config/weapons.js";
import { GUN_ATTACHMENTS } from "../config/javaAttachments.js";
import { onHeldChange } from "../items/heldItem.js";

// One shared sight property (2026-11-08). Until v1.36 every gun with sight choices had its own entity property
// (krep:akmscope, krep:m4a1scope, ... 10 of them), which used up the player's 32-property limit. Now there is one,
// `krep:scope`, which shows the HELD gun's sight; each gun's choice is kept in a dynamic property
// "krep_scope_<gun>" and copied into krep:scope when that gun is taken in hand.
// The sight menu still fires the gun's entity event (e.g. "akm:acog", player.json), which sets krep:scope;
// rememberScope() then saves it for that gun.

/** Guns with sight choices (had their own krep:<gun>scope property). */
export const SCOPE_GUNS = new Set(["akm", "fal", "qbz191", "mk14", "mp5", "vector", "m4a1", "hk416", "awp", "m107", "railgun"]); // railgun: no sights, pinned to "nothing"

const PROPERTY = "krep:scope";
const keyOf = (gunId) => `krep_scope_${gunId}`;

/** The held gun's sight ("nothing" = iron sights), or undefined for guns without sight choices. */
export function heldScope(player, gunId) {
  if (!SCOPE_GUNS.has(gunId)) return undefined;
  try {
    return player.getProperty(PROPERTY);
  } catch {
    return undefined;
  }
}

/** After a sight event: save what krep:scope now says for this gun (the event applies by the next tick). */
export function rememberScope(player, gunId) {
  if (!SCOPE_GUNS.has(gunId)) return;
  system.run(() => {
    if (!player.isValid) return;
    try {
      player.setDynamicProperty(keyOf(gunId), String(player.getProperty(PROPERTY) ?? "nothing"));
    } catch {}
  });
}

/** Show the held gun's saved sight. Guns with Java attachments use those instead, so their old sight is hidden. */
export function applyHeldScope(player) {
  const typeId = player.getComponent("minecraft:equippable")?.getEquipment(EquipmentSlot.Mainhand)?.typeId;
  const gunId = getWeaponByItem(typeId)?.id;
  if (!SCOPE_GUNS.has(gunId)) return;
  const wanted = GUN_ATTACHMENTS[gunId] ? "nothing" : (player.getDynamicProperty(keyOf(gunId)) ?? "nothing");
  try {
    if (player.getProperty(PROPERTY) !== wanted) player.setProperty(PROPERTY, wanted);
  } catch {}
}
onHeldChange(applyHeldScope);
