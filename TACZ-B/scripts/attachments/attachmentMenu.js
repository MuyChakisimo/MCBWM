import { system, world, EquipmentSlot } from "@minecraft/server";
import { ActionFormData } from "@minecraft/server-ui";
import { ATTACHMENTS } from "../config/attachments.js";
import { getAttachments, setAttachments } from "./attachmentState.js";

// Attachment workbench (krep:attachmentblock). Menus are built from config/attachments.js:
// pick a gun -> pick a slot -> pick an attachment (or a sight, or Preview).

// The resource pack's UI (TACZ-R/ui/server_form.json) styles forms by their exact title;
// the preview form must keep this title.
const PREVIEW_FORM_TITLE = "Custom dial";
const PREVIEW_TAG = "preview_active";
const playersInPreview = new Set();

function heldItemId(player) {
  return player.getComponent("minecraft:equippable").getEquipment(EquipmentSlot.Mainhand)?.typeId;
}

function isHolding(player, gunId) {
  const typeId = heldItemId(player);
  return typeId === `krep:${gunId}` || typeId === `krep:${gunId}_emp`;
}

function requireHolding(player, gunId) {
  if (isHolding(player, gunId)) return true;
  player.sendMessage(`You must be holding the ${ATTACHMENTS[gunId].menuLabel} to use this form!`);
  return false;
}

export function openAttachmentWorkbench(player) {
  const guns = Object.entries(ATTACHMENTS);
  const form = new ActionFormData().title("Attachments").body("Select the gun you are holding:");
  for (const [, gun] of guns) form.button(gun.menuLabel, gun.menuIcon);
  form.show(player).then((response) => {
    if (response.canceled) return;
    const [gunId, gun] = guns[response.selection] ?? [];
    if (!gun) return;
    if (gun.sightsOnly) openSights(player, gunId, { title: gun.title, body: gun.body, sights: gun.sights }, false);
    else openGunMenu(player, gunId);
  });
}

function openGunMenu(player, gunId) {
  if (!requireHolding(player, gunId)) return;
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
  if (!requireHolding(player, gunId)) return;
  const gun = ATTACHMENTS[gunId];
  const typeId = heldItemId(player);
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
    if (sight) player.runCommandAsync(`event entity @s ${sight[2]}`);
    if (returnToGunMenu) openGunMenu(player, gunId);
  });
}

// Shows the gun with its attachments (krep:view) until Back or Finish.
function openPreview(player, gunId) {
  if (!requireHolding(player, gunId)) return;
  player.addTag(PREVIEW_TAG);
  player.runCommandAsync("event entity @s krep:view");
  playersInPreview.add(player.id);
  const form = new ActionFormData()
    .title(PREVIEW_FORM_TITLE)
    .body("Preview your current attachments or confirm your selection.")
    .button("Back", "textures/ui/blank")
    .button("Finish", "textures/ui/blank");
  form.show(player).then((response) => {
    player.removeTag(PREVIEW_TAG);
    playersInPreview.delete(player.id);
    player.runCommandAsync("event entity @s krep:noview");
    if (response.canceled) return;
    if (response.selection === 0) openGunMenu(player, gunId);
  });
}

// A preview left open by a disconnect or script reload keeps the tag; end it when the player
// joins, and for everyone online when the scripts (re)load.
function endStalePreview(player) {
  if (!player.hasTag(PREVIEW_TAG) || playersInPreview.has(player.id)) return;
  player.removeTag(PREVIEW_TAG);
  player.runCommandAsync("event entity @s krep:noview");
}
world.afterEvents.playerSpawn.subscribe(({ player, initialSpawn }) => {
  if (initialSpawn) endStalePreview(player);
});
system.run(() => world.getPlayers().forEach(endStalePreview));
