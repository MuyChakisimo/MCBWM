import { CameraShakeType } from "@minecraft/server";
import { COMBAT } from "../config/combat.js";
import { RECOIL_ATTACHMENTS } from "../config/recoil.js";
import { getAttachments } from "../attachments/attachmentState.js";
import { javaRecoilFactor } from "../attachments/javaAttachments.js";

// Recoil: a camera shake per shot, from the gun's `recoil` (config/weapons.js), reduced by fitted
// attachments (config/recoil.js) and scaled by COMBAT.recoilMultiplier. Called by hitscan.js.

function attachmentReduction(player, weaponId) {
  const table = RECOIL_ATTACHMENTS[weaponId];
  const reduction = { power: 0, duration: 0 };
  if (!table) return reduction;
  const fitted = getAttachments(player, `krep:${weaponId}`);
  for (const [slot, levels] of Object.entries(table)) {
    const [power = 0, duration = 0] = levels[fitted[slot]] ?? [];
    reduction.power += power;
    reduction.duration += duration;
  }
  return reduction;
}

export function applyRecoil(player, weaponId, weapon, mode) {
  const [basePower, baseDuration] = weapon.recoil?.[mode] ?? [];
  if (!basePower) return;
  const reduction = attachmentReduction(player, weaponId);
  const power = basePower * (1 - reduction.power) * javaRecoilFactor(player, weaponId) * COMBAT.recoilMultiplier;
  const duration = baseDuration * (1 - reduction.duration);
  if (power <= 0 || duration <= 0) return;
  try {
    // Same shake the `camerashake add @s <power> <duration> rotational` command gave, without building a command.
    player.camera.addShake({ intensity: power, duration, type: CameraShakeType.Rotational });
  } catch {
    // a failed shake must never stop the shot
  }
}
