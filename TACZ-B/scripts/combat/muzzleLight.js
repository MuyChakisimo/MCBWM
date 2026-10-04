import { system, BlockTypes } from "@minecraft/server";
import { MUZZLE_LIGHT } from "../config/combat.js";

// Muzzle flash light: a shot without a silencer puts a light block (minecraft:light_block_<level>, the id since
// Bedrock 1.21.40) in the air at the shooter's head for MUZZLE_LIGHT.ticks, then takes it away. Firing again
// while it is lit only extends it (no new block per shot); moving to another block moves it. Only air is
// replaced and only our own light is removed. Called by firing.js.

const LIGHT = `minecraft:light_block_${MUZZLE_LIGHT.level}`;
let available; // checked on the first shot (scripts start before the world; block types come with it)

/** Per player: the lit block and the tick it goes out. */
const lights = new Map();

const sameBlock = (a, b) => a.x === b.x && a.y === b.y && a.z === b.z;

function putOut(light) {
  try {
    const block = light.dimension.getBlock(light.location);
    if (block?.typeId === LIGHT) block.setType("minecraft:air");
  } catch {
    // unloaded or invalid: nothing to remove
  }
}

function scheduleOut(playerId, light) {
  system.runTimeout(() => {
    if (lights.get(playerId) !== light) return; // moved or replaced
    if (system.currentTick < light.until) return scheduleOut(playerId, light); // extended by later shots
    putOut(light);
    lights.delete(playerId);
  }, Math.max(1, light.until - system.currentTick));
}

export function muzzleFlash(player) {
  if (!MUZZLE_LIGHT.enabled) return;
  available ??= !!BlockTypes.get(LIGHT);
  if (!available) return;
  try {
    const head = player.getHeadLocation();
    const location = { x: Math.floor(head.x), y: Math.floor(head.y), z: Math.floor(head.z) };
    const until = system.currentTick + MUZZLE_LIGHT.ticks;
    const lit = lights.get(player.id);
    if (lit && lit.dimension.id === player.dimension.id && sameBlock(lit.location, location)) {
      lit.until = until;
      return;
    }
    if (lit) {
      putOut(lit);
      lights.delete(player.id);
    }
    const block = player.dimension.getBlock(location);
    if (block?.typeId !== "minecraft:air") return; // water, glass, leaves ... stay as they are
    block.setType(LIGHT);
    const light = { dimension: player.dimension, location, until };
    lights.set(player.id, light);
    scheduleOut(player.id, light);
  } catch {
    // a failed flash must never stop the shot
  }
}
