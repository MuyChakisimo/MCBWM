import * as mc from "@minecraft/server";
const registBulletCache = [
  { normal: "krep:evolys", empty: "krep:evolys_emp", key: "evolys" },
  { normal: "krep:m249", empty: "krep:m249_emp", key: "m249" },
  { normal: "krep:m1014", empty: "krep:m1014_emp", key: "m1014" },
];
export function getScoreboardKey(arg) {
  const found = registBulletCache.find((entry) => entry.normal === arg || entry.empty === arg);
  return found ? found.key : null;
}
export function isBulletCacheItem(arg) {
  return registBulletCache.some((entry) => entry.normal === arg || entry.empty === arg);
}
mc.system.runInterval(() => {
  for (const player of mc.world.getPlayers()) {
    const equippable = player.getComponent("minecraft:equippable"),
      mainhandItem = equippable.getEquipment("Mainhand");
    if (!mainhandItem?.typeId) continue;
    const typeId = mainhandItem.typeId;
    if (!isBulletCacheItem(typeId)) continue;
    const scoreboardKey = getScoreboardKey(typeId);
    if (!scoreboardKey) continue;
    const objective = mc.world.scoreboard.getObjective(scoreboardKey);
    if (!objective) continue;
    const score = objective.getScore(player) ?? 0;
    player.setProperty("krep:bulletcache", score);
  }
}, 1);
