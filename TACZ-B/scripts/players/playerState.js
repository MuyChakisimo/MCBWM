import { system, world } from "@minecraft/server";
const states = new Map();
export function getPlayerState(player) {
  let state = states.get(player.id);
  if (!state) { state = { weaponId: undefined, firing: false, reloading: false, fireToken: 0, nextShotTick: 0, fireModeIndex: 0 }; states.set(player.id, state); }
  return state;
}
export function clearPlayerState(playerId) { states.delete(playerId); }
try { world.afterEvents.playerLeave.subscribe(e => clearPlayerState(e.playerId)); } catch {}
