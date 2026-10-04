import { system, Player } from "@minecraft/server";

// Debug log for testing: /scriptevent tacz:debug on (or off). While on, firing.js and reload.js write one line
// per shot and per reload step to the content log (Settings > Creator > Content Log; also the server log), e.g.
//   [TACZ debug] tick 4512 Steve mp7 shot 39 left, sound mp7.shoot
// Nothing is logged (and nothing is built) while it's off. It stays on until the world is reloaded.

let enabled = false;

/** Log a line if debug mode is on. `make` builds the text only when needed. */
export function debug(make) {
  if (enabled) console.warn(`[TACZ debug] tick ${system.currentTick} ${make()}`);
}

system.afterEvents.scriptEventReceive.subscribe(({ id, message, sourceEntity }) => {
  if (id !== "tacz:debug") return;
  enabled = message.trim() !== "off";
  console.warn(`[TACZ debug] ${enabled ? "on" : "off"}`);
  if (sourceEntity instanceof Player) sourceEntity.sendMessage(`TACZ debug log ${enabled ? "on: shots and reloads go to the content log" : "off"}`);
});
