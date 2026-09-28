import { system, Player, EntityDamageCause } from "@minecraft/server";
import { applyGunHits } from "./damage.js";
import { HITSCAN, getWeapon } from "../config/weapons.js";
import { spawnSmokeTracer, spawnImpactEffect } from "./shotEffects.js";

// Every gun fires by hitscan. Each gun's fire event in entities/player.json runs
//   scriptevent tacz:weapon_hitscan <weaponId> ads|hip
// and the shot is resolved instantly with rays from the player's eyes: one ray, or one per
// pellet for shotguns (`pellets`, scattered by `spread`). Rays break glass on the way
// (HITSCAN.breakableBlocks), stop at the first other block and hit the nearest living entity
// before it. Guns with `explosion` (RPG) explode where the shot lands.
// Range, tracers and breakable blocks: HITSCAN defaults, or the gun's own values (config/weapons.js).

const HITSCAN_EVENT = "tacz:weapon_hitscan";

const add = (a, b) => ({ x: a.x + b.x, y: a.y + b.y, z: a.z + b.z });
const scale = (v, s) => ({ x: v.x * s, y: v.y * s, z: v.z * s });
const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);

function normalize(v) {
  const length = Math.hypot(v.x, v.y, v.z);
  if (length <= 0.000001) return { x: 0, y: 0, z: 1 };
  return { x: v.x / length, y: v.y / length, z: v.z / length };
}

// Standard normal random number (Box-Muller).
function gaussian() {
  return Math.sqrt(-2 * Math.log(1 - Math.random())) * Math.cos(2 * Math.PI * Math.random());
}

// Aim direction nudged randomly; `degrees` is the typical deviation (the same scatter the
// old bullet entities had from their projectile uncertainty).
function scatter(direction, degrees) {
  const s = Math.tan((degrees * Math.PI) / 180);
  return normalize({ x: direction.x + gaussian() * s, y: direction.y + gaussian() * s, z: direction.z + gaussian() * s });
}

const breakablePatterns = (ids) => ids.map((id) => new RegExp("^" + id.replace(/[.]/g, "\\.").replace(/\*/g, ".*") + "$"));

// The first block the ray stops at, breaking breakable ones on the way (at most HITSCAN.maxBlocksBroken
// per ray, and only in front of `limit`, the nearest entity). Returns { location, distance } or undefined.
function traceBlocks(dimension, origin, direction, range, limit, breakable) {
  for (let broken = 0; ; broken++) {
    const hit = dimension.getBlockFromRay(origin, direction, {
      maxDistance: range,
      includeLiquidBlocks: false,
      includePassableBlocks: false,
    });
    if (!hit) return undefined;
    const location = add(hit.block.location, hit.faceLocation);
    const hitDistance = distance(origin, location);
    const canBreak = broken < HITSCAN.maxBlocksBroken && hitDistance < limit && breakable.some((p) => p.test(hit.block.typeId));
    if (!canBreak) return { location, distance: hitDistance };
    const { x, y, z } = hit.block.location;
    dimension.runCommand(`setblock ${x} ${y} ${z} air destroy`);
  }
}

// Passable breakable blocks (wheat) are not seen by the block ray above; break the first one in reach.
function breakPassable(dimension, origin, direction, reach, breakable) {
  const hit = dimension.getBlockFromRay(origin, direction, {
    maxDistance: reach,
    includeLiquidBlocks: false,
    includePassableBlocks: true,
  });
  if (!hit || !breakable.some((p) => p.test(hit.block.typeId))) return;
  const { x, y, z } = hit.block.location;
  dimension.runCommand(`setblock ${x} ${y} ${z} air destroy`);
}

// One ray: { entity, location } of what it hit (entity may be undefined) and where it ended.
function traceRay(shooter, origin, direction, range, breakable) {
  const dimension = shooter.dimension;
  const entities = dimension
    .getEntitiesFromRay(origin, direction, { maxDistance: range, ignoreBlockCollision: true })
    .filter(({ entity }) => entity && entity.id !== shooter.id && entity.getComponent("minecraft:health"))
    .sort((a, b) => a.distance - b.distance);
  const nearest = entities[0]?.distance ?? Infinity;
  const block = traceBlocks(dimension, origin, direction, range, nearest, breakable);
  const stop = Math.min(block?.distance ?? range, range);
  breakPassable(dimension, origin, direction, Math.min(stop, nearest), breakable);

  const target = entities[0] && nearest < stop ? entities[0] : undefined;
  if (target) return { entity: target.entity, location: add(origin, scale(direction, target.distance)) };
  return { location: block?.location ?? add(origin, scale(direction, range)), landed: !!block };
}

function fire(shooter, weaponId, weapon, mode) {
  const range = weapon.range ?? HITSCAN.range;
  const pellets = weapon.pellets ?? 1;
  const spread = pellets > 1 ? weapon.spread?.[mode] ?? 0 : 0;
  const tracers = weapon.tracers ?? pellets;
  const particleCount = weapon.tracerParticles ?? HITSCAN.tracerParticles;
  const breakable = breakablePatterns(weapon.breakableBlocks ?? HITSCAN.breakableBlocks);
  const origin = shooter.getHeadLocation();
  const aim = normalize(shooter.getViewDirection());

  const hits = [];
  const impacts = [];
  for (let i = 0; i < pellets; i++) {
    const ray = traceRay(shooter, origin, spread ? scatter(aim, spread) : aim, range, breakable);
    if (ray.entity) hits.push(ray);
    if (ray.entity || ray.landed) impacts.push(ray.location);
    if (i < tracers) spawnSmokeTracer({ shooter, endLocation: ray.location, mode, particleCount });
  }

  // Damage first: a failed particle must never cancel a hit.
  try {
    applyGunHits(shooter, weapon, hits);
  } catch (error) {
    console.error(`[TACZ Hitscan] ${weaponId} damage error:`, error);
  }
  if (weapon.explosion && impacts.length) explode(shooter, impacts[0], weapon.explosion);
  for (const location of impacts) {
    spawnImpactEffect({ dimension: shooter.dimension, location, particleId: HITSCAN.impactParticle });
  }
}

// RPG warhead: a vanilla explosion plus splash damage around the impact.
function explode(shooter, location, { power, breaksBlocks, splashDamage, splashRadius }) {
  const dimension = shooter.dimension;
  dimension.createExplosion(location, power, { breaksBlocks, causesFire: false, source: shooter });
  if (splashDamage > 0) {
    for (const entity of dimension.getEntities({ location, maxDistance: splashRadius })) {
      if (!entity.getComponent("minecraft:health")) continue;
      entity.applyDamage(splashDamage, { cause: EntityDamageCause.entityExplosion, damagingEntity: shooter });
    }
  }
}

system.afterEvents.scriptEventReceive.subscribe((event) => {
  if (event.id !== HITSCAN_EVENT) return;

  const [weaponId, requestedMode] = (event.message ?? "").trim().toLowerCase().split(/\s+/);
  const weapon = getWeapon(weaponId);
  if (!weapon) return;
  const shooter = event.sourceEntity;
  if (!(shooter instanceof Player)) return;

  try {
    fire(shooter, weaponId, weapon, requestedMode === "ads" ? "ads" : "hip");
  } catch (error) {
    console.error(`[TACZ Hitscan] ${weaponId} error:`, error);
  }
});
