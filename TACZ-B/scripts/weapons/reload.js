import { system } from "@minecraft/server";
import {
  countInventoryItem,
  consumeInventoryItem,
  getMagazineAmmo,
  setMagazineAmmo,
} from "./ammo.js";
import { getPlayerState } from "../players/playerState.js";

function tryPlayAnimation(player, animationId) {
  if (!animationId) return;
  try {
    player.playAnimation(animationId, { blendOutTime: 0.05 });
  } catch {}
}

function tryPlaySound(player, soundId) {
  if (!soundId) return;
  try {
    player.playSound?.(soundId);
  } catch {}
}

export function startReload(player, weapon) {
  const state = getPlayerState(player);
  if (state.reloading) return false;

  const currentMagazine = getMagazineAmmo(player, weapon);
  const magazineCapacity = weapon.magazineSize ?? 0;

  if (currentMagazine >= magazineCapacity) return false;
  if (!weapon.ammoItem) return false;

  const reserveAmmo = countInventoryItem(player, weapon.ammoItem);
  if (reserveAmmo <= 0) return false;

  const tactical = currentMagazine > 0;
  const seconds = tactical
    ? (weapon.reload?.tactical ?? weapon.reload?.empty ?? 1)
    : (weapon.reload?.empty ?? 1);
  const ticks = Math.max(1, Math.round(seconds * 20));

  state.reloading = true;
  state.firing = false;
  state.fireToken++;

  tryPlayAnimation(
    player,
    tactical
      ? weapon.animations?.reloadTactical
      : weapon.animations?.reloadEmpty,
  );

  tryPlaySound(
    player,
    tactical
      ? weapon.sounds?.reloadTactical
      : weapon.sounds?.reloadEmpty,
  );

  system.runTimeout(() => {
    try {
      const now = getMagazineAmmo(player, weapon);
      const needed = Math.max(0, magazineCapacity - now);
      const available = countInventoryItem(player, weapon.ammoItem);
      const requested = Math.min(needed, available);
      const consumed = consumeInventoryItem(player, weapon.ammoItem, requested);

      setMagazineAmmo(player, weapon, now + consumed);
    } finally {
      state.reloading = false;
    }
  }, ticks);

  return true;
}
