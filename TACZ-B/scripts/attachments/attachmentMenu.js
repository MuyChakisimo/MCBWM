import { system, world, EquipmentSlot } from "@minecraft/server";
import { ActionFormData } from "@minecraft/server-ui";
import { ATTACHMENTS } from "../config/attachments.js";
import { getAttachments, setAttachments, syncAttachments } from "./attachmentState.js";
import { WEAPONS } from "../config/weapons.js";
import { GUN_ATTACHMENTS } from "../config/javaAttachments.js";
import { SLOT_LABEL, slotsOf, optionsOf, infoOf, fittedJava, fitJava } from "./javaAttachments.js";

// Attachment workbench (krep:attachmentblock). Menus are built from config/attachments.js:
// pick a gun -> pick a slot -> pick an attachment (or a sight, or Preview).
// Since v1.33.13 the gun doesn't have to be in hand: the menu lists the guns the player carries (hotbar or
// inventory, loaded or empty), and attachments are saved per player and gun type anyway (attachmentState.js).
// Only Preview needs the gun in hand: it switches to the gun's hotbar slot (a gun only in the inventory must be
// moved to the hotbar first). Using the bench with a gun in hand no longer fires it (holdFire in firing.js).

// The resource pack's UI (TACZ-R/ui/server_form.json) styles forms by their exact title;
// the preview form must keep this title.
const PREVIEW_FORM_TITLE = "Custom dial";
const PREVIEW_TAG = "preview_active";
const HOTBAR_SIZE = 9;
const playersInPreview = new Set();

function heldItemId(player) {
  return player.getComponent("minecraft:equippable").getEquipment(EquipmentSlot.Mainhand)?.typeId;
}

const isGun = (typeId, gunId) => typeId === `krep:${gunId}` || typeId === `krep:${gunId}_emp`;

/** The player's items by type: typeId -> first inventory slot (0-8 hotbar, 9-35 inventory). One pass over the
 * inventory (v1.34.3: opening the bench read the 36 slots once per gun, ~17 ms in the profile). */
function inventorySlots(player) {
  const container = player.getComponent("minecraft:inventory")?.container;
  const slots = new Map();
  const size = container?.size ?? 0;
  for (let i = 0; i < size; i++) {
    const typeId = container.getItem(i)?.typeId;
    if (typeId && !slots.has(typeId)) slots.set(typeId, i);
  }
  return slots;
}

/** Inventory slot of the player's krep:<gun> (or its empty item); -1 if none. */
function findGun(player, gunId, slots = inventorySlots(player)) {
  const found = [slots.get(`krep:${gunId}`), slots.get(`krep:${gunId}_emp`)].filter((i) => i !== undefined);
  return found.length ? Math.min(...found) : -1; // the first slot holding it, loaded or empty (as before)
}

/** The gun's name in the menus (Java-attachment guns use their weapons.js name). */
const label = (gunId) => ATTACHMENTS[gunId]?.menuLabel ?? WEAPONS[gunId]?.name ?? gunId;

function requireOwned(player, gunId) {
  if (findGun(player, gunId) >= 0) return true;
  player.sendMessage(`You need the ${label(gunId)} in your inventory to fit attachments.`);
  return false;
}

export function openAttachmentWorkbench(player) {
  // Guns with Java attachments (GUN_ATTACHMENTS) and guns still on the original pack's parts (ATTACHMENTS).
  const all = [...Object.keys(GUN_ATTACHMENTS), ...Object.keys(ATTACHMENTS).filter((g) => !GUN_ATTACHMENTS[g])];
  const slots = inventorySlots(player);
  const guns = all.filter((gunId) => findGun(player, gunId, slots) >= 0);
  if (!guns.length) {
    new ActionFormData()
      .title("Attachments")
      .body(`None of your guns take attachments yet. These do: ${all.map(label).join(", ")}.`)
      .button("Close")
      .show(player);
    return;
  }
  const form = new ActionFormData().title("Attachments").body("Select one of your guns:");
  for (const gunId of guns) form.button(label(gunId), ATTACHMENTS[gunId]?.menuIcon ?? `textures/items/${gunId}`);
  form.show(player).then((response) => {
    if (response.canceled) return;
    const gunId = guns[response.selection];
    if (!gunId) return;
    const gun = ATTACHMENTS[gunId];
    if (GUN_ATTACHMENTS[gunId]) openJavaGunMenu(player, gunId);
    else if (gun.sightsOnly) openSights(player, gunId, { title: gun.title, body: gun.body, sights: gun.sights }, false);
    else openGunMenu(player, gunId);
  });
}

function openGunMenu(player, gunId) {
  if (!requireOwned(player, gunId)) return;
  const gun = ATTACHMENTS[gunId];
  const form = new ActionFormData()
    .title(`${gun.menuLabel} Attachments`)
    .body(`Select an attachment type to customize your ${gun.menuLabel}.`);
  for (const slot of gun.slots) form.button(slot.label, slot.icon);
  form.show(player).then((response) => {
    if (response.canceled) return;
    const slot = gun.slots[response.selection];
    if (!slot) return;
    if (slot.preview) openPreview(player, gunId);
    else if (slot.sights) openSights(player, gunId, { title: `${gun.menuLabel} ${slot.label}`, sights: slot.sights }, true);
    else openSlot(player, gunId, slot);
  });
}

// Numbered attachments (stock, grip, laser, muzzle, magazine).
function openSlot(player, gunId, slot) {
  if (!requireOwned(player, gunId)) return;
  const gun = ATTACHMENTS[gunId];
  const typeId = `krep:${gunId}`; // attachments are per gun type: the item itself doesn't matter
  const current = getAttachments(player, typeId)[slot.property];
  const form = new ActionFormData()
    .title(`${gun.menuLabel} ${slot.label}`)
    .body(`Select a ${slot.label.toLowerCase()} for your ${gun.menuLabel}.`);
  slot.options.forEach(([label, icon], value) => form.button(label + (current === value ? " (Selected)" : ""), icon));
  const last = slot.last ?? "preview";
  form.button(last === "back" ? "Back" : "Preview", "textures/ui/blank");
  form.show(player).then((response) => {
    if (response.canceled) return;
    if (response.selection < slot.options.length) {
      setAttachments(player, typeId, { [slot.property]: response.selection });
      openGunMenu(player, gunId);
    } else if (last === "back") openGunMenu(player, gunId);
    else openPreview(player, gunId);
  });
}

// Sights are entity events (e.g. "m4a1:acog") that set the gun's scope property.
function openSights(player, gunId, { title, body = "", sights }, returnToGunMenu) {
  const form = new ActionFormData().title(title);
  if (body) form.body(body);
  for (const [label, icon] of sights) form.button(label, icon);
  form.show(player).then((response) => {
    if (response.canceled) return;
    const sight = sights[response.selection];
    if (sight) player.runCommand(`event entity @s ${sight[2]}`);
    if (returnToGunMenu) openGunMenu(player, gunId);
  });
}

// ---- Java attachments (javaAttachments.js): a slot list showing what is fitted, then that slot's options.
const NONE_ICON = { scope: "textures/ui/nothing", muzzle: "textures/ui/zero/zero_muzzle", grip: "textures/ui/zero/zero_grip", stock: "textures/ui/zero/zero_stock", laser: "textures/ui/zero/zero_laser" };

function openJavaGunMenu(player, gunId) {
  if (!requireOwned(player, gunId)) return;
  const slots = slotsOf(gunId);
  const fitted = fittedJava(player, gunId);
  const form = new ActionFormData().title(`${label(gunId)} Attachments`).body("Choose a slot to change.");
  for (const s of slots) {
    const info = infoOf(fitted[s]);
    form.button(`${SLOT_LABEL[s]}: ${info ? info.name : "None"}`, info?.icon ?? NONE_ICON[s]);
  }
  form.button("Preview", "textures/ui/blank");
  form.button("Done", "textures/ui/blank");
  form.show(player).then((response) => {
    if (response.canceled) return;
    if (response.selection < slots.length) openJavaSlot(player, gunId, slots[response.selection]);
    else if (response.selection === slots.length) openPreview(player, gunId);
  });
}

function openJavaSlot(player, gunId, slot) {
  if (!requireOwned(player, gunId)) return;
  const options = optionsOf(gunId, slot);
  const current = fittedJava(player, gunId)[slot];
  const form = new ActionFormData().title(`${label(gunId)} ${SLOT_LABEL[slot]}`).body(`Select a ${SLOT_LABEL[slot].toLowerCase()} for your ${label(gunId)}.`);
  form.button(`None${current ? "" : " (Fitted)"}`, NONE_ICON[slot]);
  for (const id of options) form.button(infoOf(id).name + (current === id ? " (Fitted)" : ""), infoOf(id).icon);
  form.show(player).then((response) => {
    if (response.canceled) return openJavaGunMenu(player, gunId);
    fitJava(player, gunId, slot, response.selection === 0 ? null : options[response.selection - 1]);
    openJavaGunMenu(player, gunId);
  });
}

// Shows the gun with its attachments (krep:view) until Back or Finish.
function openPreview(player, gunId) {
  if (!requireOwned(player, gunId)) return;
  // The preview shows the held gun: take it in hand from the hotbar.
  if (!isGun(heldItemId(player), gunId)) {
    const slot = findGun(player, gunId);
    if (slot >= HOTBAR_SIZE) {
      player.sendMessage(`Move the ${label(gunId)} to your hotbar to preview it.`);
      (GUN_ATTACHMENTS[gunId] ? openJavaGunMenu : openGunMenu)(player, gunId);
      return;
    }
    player.selectedSlotIndex = slot;
    syncAttachments(player); // show its parts now (the slot-change event comes a tick later)
  }
  player.addTag(PREVIEW_TAG);
  player.runCommand("event entity @s krep:view");
  playersInPreview.add(player.id);
  const form = new ActionFormData()
    .title(PREVIEW_FORM_TITLE)
    .body("Preview your current attachments or confirm your selection.")
    .button("Back", "textures/ui/blank")
    .button("Finish", "textures/ui/blank");
  form.show(player).then((response) => {
    player.removeTag(PREVIEW_TAG);
    playersInPreview.delete(player.id);
    player.runCommand("event entity @s krep:noview");
    if (response.canceled) return;
    if (response.selection === 0) (GUN_ATTACHMENTS[gunId] ? openJavaGunMenu : openGunMenu)(player, gunId);
  });
}

// A preview left open by a disconnect or script reload keeps the tag; end it when the player
// joins, and for everyone online when the scripts (re)load.
function endStalePreview(player) {
  if (!player.hasTag(PREVIEW_TAG) || playersInPreview.has(player.id)) return;
  player.removeTag(PREVIEW_TAG);
  player.runCommand("event entity @s krep:noview");
}
world.afterEvents.playerSpawn.subscribe(({ player, initialSpawn }) => {
  if (initialSpawn) endStalePreview(player);
});
world.afterEvents.worldLoad.subscribe(() => world.getPlayers().forEach(endStalePreview)); // 2.x: world access waits for worldLoad
