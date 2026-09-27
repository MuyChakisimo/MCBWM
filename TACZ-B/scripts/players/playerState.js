import { world } from "@minecraft/server";

const states = new Map();

function createState() {
  return {
    weaponId: undefined,
    firing: false,
    reloading: false,
    reloadWeaponId: undefined,
    fireToken: 0,
    reloadToken: 0,
    fireRemainder: 0,
  };
}

export function getPlayerState(player) {
  let state = states.get(player.id);
  if (!state) {
    state = createState();
    states.set(player.id, state);
  }
  return state;
}

export function clearPlayerState(playerId) {
  states.delete(playerId);
}

try {
  world.afterEvents.playerLeave.subscribe((event) => clearPlayerState(event.playerId));
} catch {}
