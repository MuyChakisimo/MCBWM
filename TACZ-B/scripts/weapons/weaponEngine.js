import { system, world } from "@minecraft/server";
import { WEAPONS } from "../config/weapons.js";
import { consumeRound, getMagazineAmmo } from "./ammo.js";
import { cancelReload, startReload } from "./reload.js";
import { getPlayerState } from "../players/playerState.js";
import { fireConfiguredWeapon } from "./hitscan.js";
import { firePhysicalWeapon } from "./physicalFire.js";
import { getEffectiveWeapon } from "../attachments/modular.js";
import { getHeldWeaponId, weaponIdFromItem } from "../players/heldWeapon.js";
import { createLogger } from "../debug/logger.js";

const log = createLogger("WeaponEngine");

const FIXED_SHOT_COUNTS = Object.freeze({
  single: 1,
  double: 2,
  triple: 3,
});

function invalidateFire(state) {
  state.firing = false;
  state.fireRemainder = 0;
  state.fireToken++;
}

function prepareWeaponInput(player, weaponId) {
  const state = getPlayerState(player);

  if (state.reloading && state.reloadWeaponId !== weaponId) {
    cancelReload(player);
  }

  invalidateFire(state);
  if (state.weaponId !== weaponId) log.debug("weapon", player.name, `${state.weaponId} -> ${weaponId}`);
  state.weaponId = weaponId;
  return state;
}

function isCurrentFireOperation(player, weapon, token) {
  const state = getPlayerState(player);
  return (
    state.firing &&
    !state.reloading &&
    state.fireToken === token &&
    state.weaponId === weapon.id &&
    getHeldWeaponId(player) === weapon.id
  );
}

function fireOnce(player, baseWeapon) {
  const state = getPlayerState(player);

  if (state.reloading) return false;
  if (state.weaponId !== baseWeapon.id) return false;
  if (getHeldWeaponId(player) !== baseWeapon.id) return false;

  const weapon = getEffectiveWeapon(player, baseWeapon);

  if (getMagazineAmmo(player, weapon) <= 0) {
    startReload(player, weapon);
    return false;
  }

  if (!consumeRound(player, weapon, 1)) return false;

  try {
    if (weapon.hitscan) {
      fireConfiguredWeapon(player, weapon, player.isSneaking ? "ads" : "hip");
    } else {
      firePhysicalWeapon(player, weapon);
    }
  } catch (error) {
    log.error(`Fire failed for "${weapon.id}":`, error);
  }

  try {
    if (weapon.animations?.shoot) {
      player.playAnimation(weapon.animations.shoot, { blendOutTime: 0.03 });
    }
  } catch (error) {
    log.error(`Shoot animation "${weapon.animations.shoot}" failed:`, error);
  }

  try {
    if (weapon.sounds?.shoot) player.playSound(weapon.sounds.shoot);
  } catch (error) {
    log.error(`Shoot sound "${weapon.sounds.shoot}" failed:`, error);
  }

  return true;
}

function nextFireDelay(state, rpm) {
  const intervalTicks = 1200 / Math.max(1, rpm ?? 60);
  const total = intervalTicks + (state.fireRemainder ?? 0);
  const delay = Math.max(1, Math.floor(total));
  state.fireRemainder = Math.max(0, total - delay);
  return delay;
}

function scheduleAutomatic(player, weapon, token) {
  if (!isCurrentFireOperation(player, weapon, token)) return;

  const state = getPlayerState(player);
  if (!fireOnce(player, weapon)) {
    invalidateFire(state);
    return;
  }

  const delay = nextFireDelay(state, weapon.rpm);
  system.runTimeout(() => scheduleAutomatic(player, weapon, token), delay);
}

function scheduleFixedSequence(player, weapon, token, remainingShots) {
  if (remainingShots <= 0) {
    const state = getPlayerState(player);
    if (state.fireToken === token) state.firing = false;
    return;
  }

  if (!isCurrentFireOperation(player, weapon, token)) return;

  const state = getPlayerState(player);
  if (!fireOnce(player, weapon)) {
    invalidateFire(state);
    return;
  }

  if (remainingShots === 1) {
    if (state.fireToken === token) state.firing = false;
    return;
  }

  const delay = nextFireDelay(state, weapon.rpm ?? 600);
  system.runTimeout(
    () => scheduleFixedSequence(player, weapon, token, remainingShots - 1),
    delay,
  );
}

world.afterEvents.itemStartUse.subscribe((event) => {
  const weaponId = weaponIdFromItem(event.itemStack);
  const weapon = WEAPONS[weaponId];
  if (!weapon?.modularInput) return;

  const state = prepareWeaponInput(event.source, weaponId);
  state.fireRemainder = 0;

  log.debug("fire start", event.source.name, weapon.id, weapon.fireMode);

  if (weapon.fireMode === "auto") {
    state.firing = true;
    const token = state.fireToken;
    scheduleAutomatic(event.source, weapon, token);
    return;
  }

  const shotCount = FIXED_SHOT_COUNTS[weapon.fireMode];
  if (!shotCount) {
    log.error(`Invalid runtime fire mode "${weapon.fireMode}" for "${weapon.id}".`);
    return;
  }

  if (shotCount === 1) {
    fireOnce(event.source, weapon);
    return;
  }

  state.firing = true;
  const token = state.fireToken;
  scheduleFixedSequence(event.source, weapon, token, shotCount);
});

world.afterEvents.itemStopUse.subscribe((event) => {
  const state = getPlayerState(event.source);
  const weaponId = weaponIdFromItem(event.itemStack) ?? state.weaponId;
  const weapon = WEAPONS[weaponId];
  if (!weapon?.modularInput) return;

  if (state.firing) log.debug("fire stop", event.source.name, weapon.id);
  invalidateFire(state);
});

// Attack/swing is the retained Bedrock reload input. A small controller sends
// this event for imported modular guns; it no longer changes firing modes.
system.afterEvents.scriptEventReceive.subscribe((event) => {
  if (event.id !== "tacz:modular_reload") return;

  const player = event.sourceEntity;
  if (!player) return;

  const equippedId = getHeldWeaponId(player);
  const requestedId = (event.message || "").trim() || equippedId;
  if (!requestedId || requestedId !== equippedId) return;

  const weapon = WEAPONS[requestedId];
  if (!weapon?.modularInput) return;

  const state = getPlayerState(player);
  if (state.weaponId !== requestedId) {
    invalidateFire(state);
    state.weaponId = requestedId;
  }

  startReload(player, getEffectiveWeapon(player, weapon));
});
