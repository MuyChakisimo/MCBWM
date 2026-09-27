import { system, world } from "@minecraft/server";

// =====================================================
// TACZ BULLET-CACHE PROPERTY BRIDGE
//
// A few existing weapon animations still read krep:bulletcache.
// Keep that legacy visual bridge synchronized with the weapon's ammo
// scoreboard while avoiding the old obfuscated lookup code.
// =====================================================

const BULLET_CACHE_ITEMS = new Map([
  ["krep:evolys", "evolys"],
  ["krep:evolys_emp", "evolys"],
  ["krep:m249", "m249"],
  ["krep:m249_emp", "m249"],
  ["krep:m1014", "m1014"],
  ["krep:m1014_emp", "m1014"],
]);

const objectiveCache = new Map();

export function getScoreboardKey(itemTypeId) {
  return BULLET_CACHE_ITEMS.get(itemTypeId) ?? null;
}

export function isBulletCacheItem(itemTypeId) {
  return BULLET_CACHE_ITEMS.has(itemTypeId);
}

function getObjective(objectiveId) {
  let objective = objectiveCache.get(objectiveId);

  if (!objective) {
    objective = world.scoreboard.getObjective(objectiveId);
    if (objective) objectiveCache.set(objectiveId, objective);
  }

  return objective;
}

system.runInterval(() => {
  for (const player of world.getPlayers()) {
    const item = player
      .getComponent("minecraft:equippable")
      ?.getEquipment("Mainhand");
    const objectiveId = item?.typeId
      ? getScoreboardKey(item.typeId)
      : null;

    if (!objectiveId) continue;

    const objective = getObjective(objectiveId);
    if (!objective) continue;

    const ammo = objective.getScore(player) ?? 0;

    if (player.getProperty("krep:bulletcache") !== ammo) {
      player.setProperty("krep:bulletcache", ammo);
    }
  }
}, 1);
