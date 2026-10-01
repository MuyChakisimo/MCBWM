import { system, world, EquipmentSlot } from "@minecraft/server";
import { ATTACHMENTS } from "../config/attachments.js";
import { getWeaponByItem } from "../config/weapons.js";

// Fitted attachments are stored per player and gun in the dynamic property "krep_<gunId>" as
// "stock,grip,laser,muzzle,magazine" (numbers, 0 = none). While a gun is held they are copied
// to the entity properties krep:stock, krep:grip, ... which the resource pack reads to show
// the parts on the model.

const SLOTS = ["stock", "grip", "laser", "muzzle", "magazine"];

// Guns with at least one numbered attachment slot (sight-only guns use entity events instead).
const GUNS_WITH_SLOTS = new Set(
  Object.entries(ATTACHMENTS)
    .filter(([, gun]) => gun.slots?.some((slot) => slot.property))
    .map(([id]) => id),
);

/** Dynamic property key for a held gun item ("krep:m4a1" or "krep:m4a1_emp"), or null. */
export function getAttachmentKey(typeId) {
  const weapon = getWeaponByItem(typeId);
  return weapon && GUNS_WITH_SLOTS.has(weapon.id) ? "krep_" + weapon.id : null;
}

function readAttachments(player, key) {
  const [stock = 0, grip = 0, laser = 0, muzzle = 0, magazine = 0] = (
    player.getDynamicProperty(key)?.split(",") || []
  ).map(Number);
  return { stock, grip, laser, muzzle, magazine };
}

/** All fitted attachments for the gun item, e.g. { stock: 0, grip: 3, ... }. */
export function getAttachments(player, typeId) {
  const key = getAttachmentKey(typeId);
  return key ? readAttachments(player, key) : { stock: 0, grip: 0, laser: 0, muzzle: 0, magazine: 0 };
}

/** Fit attachments: changes only the given slots, e.g. setAttachments(player, typeId, { grip: 3 }). */
export function setAttachments(player, typeId, changes = {}) {
  const key = getAttachmentKey(typeId);
  if (!key) return;
  const current = readAttachments(player, key);
  const next = SLOTS.map((slot) => changes[slot] ?? current[slot] ?? 0);
  player.setDynamicProperty(key, next.join(","));
}

// Show the held gun's attachments on the model. Properties are only written when they changed:
// every setProperty is synced to all nearby clients.
system.runInterval(() => {
  for (const player of world.getPlayers()) {
    const mainhandItem = player.getComponent("minecraft:equippable").getEquipment(EquipmentSlot.Mainhand);
    if (!mainhandItem?.typeId) continue;
    const key = getAttachmentKey(mainhandItem.typeId);
    if (!key) continue;
    const attachments = readAttachments(player, key);
    for (const slot of SLOTS) {
      if (player.getProperty("krep:" + slot) !== attachments[slot]) player.setProperty("krep:" + slot, attachments[slot]);
    }
  }
}, 2);
