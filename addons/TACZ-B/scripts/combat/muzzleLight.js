import { system, world, BlockTypes } from "@minecraft/server";
import { MUZZLE_LIGHT } from "../config/combat.js";

// Muzzle flash light: a shot without a silencer puts a light block (minecraft:light_block_<level>, the id since
// Bedrock 1.21.40) in the air at the shooter's head for MUZZLE_LIGHT.ticks, then takes it away. Firing again
// while it is lit only extends it (no new block per shot); moving to another block moves it. Only air is
// replaced and only our own light is removed. Called by firing.js.
// Every light placed is remembered in the world property STORE until it is removed: a light whose chunk unloaded
// before it went out (the player left or changed dimension, the server stopped) is removed when the chunk is
// loaded again (checked every RETRY ticks), so no permanent invisible lights are left (v1.33.9 could leave them).

const LIGHT = `minecraft:light_block_${MUZZLE_LIGHT.level}`;
const STORE = "tacz:muzzle_lights";
const RETRY = 100;
let available; // checked on the first shot (scripts start before the world; block types come with it)

/** Per player: the lit block's key and the tick it goes out. */
const lights = new Map();
/** Every light we placed and haven't removed yet, by key "<dimension> x y z": { dimension, location }. */
const placed = new Map();
let loaded = false; // STORE read (worldLoad)
let dirty = false; // placed changed since the last save

const keyOf = (dimension, l) => `${dimension} ${l.x} ${l.y} ${l.z}`;
const sameBlock = (a, b) => a.x === b.x && a.y === b.y && a.z === b.z;

/** Removes our light. False when its chunk isn't loaded: kept in `placed` and tried again later. */
function putOut(key) {
  const p = placed.get(key);
  if (!p) return true;
  try {
    const block = world.getDimension(p.dimension).getBlock(p.location);
    if (!block) return false; // unloaded
    if (block.typeId === LIGHT) block.setType("minecraft:air");
  } catch {
    return false; // unloaded
  }
  placed.delete(key);
  dirty = true;
  return true;
}

function scheduleOut(playerId, light) {
  system.runTimeout(() => {
    if (lights.get(playerId) !== light) return; // moved or replaced
    if (system.currentTick < light.until) return scheduleOut(playerId, light); // extended by later shots
    putOut(light.key);
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
    const dimension = player.dimension;
    const until = system.currentTick + MUZZLE_LIGHT.ticks;
    const lit = lights.get(player.id);
    if (lit && lit.dimension === dimension.id && sameBlock(lit.location, location)) {
      lit.until = until;
      return;
    }
    if (lit) {
      putOut(lit.key);
      lights.delete(player.id);
    }
    const block = dimension.getBlock(location);
    if (block?.typeId !== "minecraft:air") return; // water, glass, leaves ... stay as they are
    block.setType(LIGHT);
    const key = keyOf(dimension.id, location);
    placed.set(key, { dimension: dimension.id, location });
    dirty = true;
    const light = { key, dimension: dimension.id, location, until };
    lights.set(player.id, light);
    scheduleOut(player.id, light);
  } catch {
    // a failed flash must never stop the shot
  }
}

function save() {
  dirty = false;
  try {
    const list = JSON.stringify([...placed.values()].slice(0, 300)); // well under the 32767-character limit
    world.setDynamicProperty(STORE, placed.size ? list : undefined);
  } catch (error) {
    console.warn(`[TACZ muzzle light] ${error}`);
  }
}

world.afterEvents.worldLoad.subscribe(() => {
  try {
    const stored = world.getDynamicProperty(STORE);
    for (const p of typeof stored === "string" ? JSON.parse(stored) : []) placed.set(keyOf(p.dimension, p.location), p);
  } catch {
    // a broken list is dropped
  }
  loaded = true;
});

// Save changes (not every shot: at most twice a second).
system.runInterval(() => {
  if (loaded && dirty) save();
}, 10);

// Lights no player is holding lit (left over): remove them once their chunk is loaded.
system.runInterval(() => {
  if (!loaded || placed.size === 0) return;
  const held = new Set([...lights.values()].map((l) => l.key));
  for (const key of [...placed.keys()]) if (!held.has(key)) putOut(key);
}, RETRY);
