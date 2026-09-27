import { system } from "@minecraft/server";
import {
  countInventoryItem,
  consumeInventoryItem,
  getMagazineAmmo,
  setMagazineAmmo,
} from "./ammo.js";
import { getPlayerState } from "../players/playerState.js";
import { getHeldWeaponId } from "../players/heldWeapon.js";
import { createLogger } from "../debug/logger.js";

const log = createLogger("Reload");

function tryPlayAnimation(player, animationId) {
  if (!animationId) return;
  try {
    player.playAnimation(animationId, { blendOutTime: 0.05 });
  } catch (error) {
    log.error(`Reload animation "${animationId}" failed:`, error);
  }
}

function tryPlaySound(player, soundId) {
  if (!soundId) return;
  try {
    player.playSound(soundId);
  } catch (error) {
    log.error(`Reload sound "${soundId}" failed:`, error);
  }
}

export function cancelReload(player) {
  const state = getPlayerState(player);
  if (!state.reloading) return false;
  log.debug("reload cancel", player.name, state.reloadWeaponId);
  state.reloading = false;
  state.reloadWeaponId = undefined;
  state.reloadToken++;
  return true;
}

export function startReload(player, weapon) {
  const state = getPlayerState(player);
  if (state.reloading) return false;
  if (getHeldWeaponId(player) !== weapon.id) return false;

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

  state.weaponId = weapon.id;
  state.reloading = true;
  state.reloadWeaponId = weapon.id;
  state.firing = false;
  state.fireToken++;
  const reloadToken = ++state.reloadToken;
  log.debug("reload start", player.name, weapon.id, tactical ? "tactical" : "empty", `${ticks}t`);

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
    const currentState = getPlayerState(player);
    const stillValid =
      currentState.reloading &&
      currentState.reloadToken === reloadToken &&
      currentState.reloadWeaponId === weapon.id &&
      currentState.weaponId === weapon.id &&
      getHeldWeaponId(player) === weapon.id;

    if (!stillValid) {
      log.debug("reload aborted", player.name, weapon.id);
      if (currentState.reloadToken === reloadToken) {
        currentState.reloading = false;
        currentState.reloadWeaponId = undefined;
      }
      return;
    }

    try {
      const now = getMagazineAmmo(player, weapon);
      const needed = Math.max(0, magazineCapacity - now);
      const available = countInventoryItem(player, weapon.ammoItem);
      const requested = Math.min(needed, available);
      const consumed = consumeInventoryItem(player, weapon.ammoItem, requested);

      setMagazineAmmo(player, weapon, now + consumed);
      log.debug("reload end", player.name, weapon.id, `+${consumed}`);
    } catch (error) {
      log.error(`Reload completion failed for "${weapon.id}":`, error);
    } finally {
      if (currentState.reloadToken === reloadToken) {
        currentState.reloading = false;
        currentState.reloadWeaponId = undefined;
      }
    }
  }, ticks);

  return true;
}
