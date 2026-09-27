import { system } from "@minecraft/server";

import { getAttachmentState, getDynamicPropertyKey } from "../attachments/state.js";
import { RECOIL_PROFILES } from "../config/recoilProfiles.js";

// =====================================================
// TACZ RECOIL
//
// Preserves the original attachment-aware camera-shake behavior while
// removing the old obfuscated hot-path script.
// =====================================================

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function calculateRecoil(profile, attachments = {}) {
  let powerReduction = 0;
  let durationReduction = 0;

  for (const [type, rawIndex] of Object.entries(attachments)) {
    const index = clamp(rawIndex, 0, 11);
    const modifier = profile.modifier?.[type]?.[index] ?? {
      power: 0,
      duration: 0,
    };

    powerReduction += modifier.power;
    durationReduction += modifier.duration;
  }

  return {
    hip: {
      power: profile.base.hip.power * (1 - powerReduction),
      duration: profile.base.hip.duration * (1 - durationReduction),
    },
    ads: {
      power: profile.base.ads.power * (1 - powerReduction),
      duration: profile.base.ads.duration * (1 - durationReduction),
    },
  };
}

function applyRecoil(player, ads = false) {
  const item = player
    .getComponent("minecraft:equippable")
    ?.getEquipment("Mainhand");
  const itemTypeId = item?.typeId;

  if (!itemTypeId) return;

  const key = getDynamicPropertyKey(itemTypeId);
  const profile = key ? RECOIL_PROFILES[key] : undefined;

  if (!key || !profile) return;

  const attachmentState = getAttachmentState(player, itemTypeId) ?? {};
  const recoil = calculateRecoil(profile, {
    stock: attachmentState.stock ?? 0,
    grip: attachmentState.grip ?? 0,
    muzzle: attachmentState.muzzle ?? 0,
  });

  const selected = ads ? recoil.ads : recoil.hip;
  const command =
    `camerashake add @s[r=0.5] ` +
    `${selected.power.toFixed(3)} ` +
    `${selected.duration.toFixed(2)} rotational`;

  player.runCommandAsync(command).catch(() => {
    // Preserve gameplay if camera shake fails; recoil is cosmetic feedback.
  });
}

system.afterEvents.scriptEventReceive.subscribe((event) => {
  const player = event.sourceEntity ?? event.initiator;

  if (!player || typeof player.getComponent !== "function") {
    return;
  }

  if (event.id === "recoil:hip") {
    applyRecoil(player, false);
  } else if (event.id === "recoil:ads") {
    applyRecoil(player, true);
  }
});
