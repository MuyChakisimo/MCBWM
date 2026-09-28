import { system } from "@minecraft/server";
import { RECOIL } from "../config/recoil.js";
import { getWeaponByItem } from "../config/weapons.js";
import { getAttachmentKey } from "../attachments/attachmentState.js";

// Attachment-dependent recoil for guns listed in config/recoil.js. Their fire events in
// entities/player.json run `scriptevent recoil:hip` or `recoil:ads`; this turns that into a
// camera shake reduced by the fitted grip / stock / muzzle.
const NO_MODIFIER = { power: 0, duration: 0 };

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

// "stock,grip,laser,muzzle,magazine" -> [stock, grip, laser, muzzle, magazine]
function parseAttachmentData(data) {
  if (!data) return [0, 0, 0, 0, 0];
  return data.split(",").map((part) => parseInt(part) || 0);
}

function calculateRecoil(profile, attachments = {}) {
  let powerReduction = 0,
    durationReduction = 0;
  for (const slot in attachments) {
    const level = clamp(attachments[slot], 0, 11),
      modifier = profile.modifier?.[slot]?.[level] ?? NO_MODIFIER;
    powerReduction += modifier.power;
    durationReduction += modifier.duration;
  }
  const scale = (base) => ({
    power: base.power * (1 - powerReduction),
    duration: base.duration * (1 - durationReduction),
  });
  return { hip: scale(profile.base.hip), ads: scale(profile.base.ads) };
}

function applyRecoil(player, aiming = false) {
  const typeId = player.getComponent("minecraft:equippable")?.getEquipment("Mainhand")?.typeId;
  if (!typeId) return;
  const dynamicPropertyKey = getAttachmentKey(typeId);
  const profile = RECOIL[getWeaponByItem(typeId)?.id];
  if (!dynamicPropertyKey || !profile) return;
  const [stock = 0, grip = 0, , muzzle = 0] = parseAttachmentData(player.getDynamicProperty(dynamicPropertyKey));
  const recoil = calculateRecoil(profile, { stock, grip, muzzle });
  const shake = aiming ? recoil.ads : recoil.hip;
  const command = `camerashake add @s[r=0.5] ${shake.power.toFixed(3)} ${shake.duration.toFixed(2)} rotational`;
  player.runCommandAsync(command).catch(() => {
    player.sendMessage("Failed to apply recoil shake.");
  });
}

system.afterEvents.scriptEventReceive.subscribe((event) => {
  const source = event.sourceEntity ?? event.initiator;
  if (!source || typeof source.getComponent !== "function") return;
  if (event.id === "recoil:hip") applyRecoil(source, false);
  else if (event.id === "recoil:ads") applyRecoil(source, true);
});
