import { system, world } from "@minecraft/server";
import { getWeaponByItem } from "../config/weapons.js";

// Guns with storedAmmoDisplay: true (config/weapons.js) show their loaded rounds on the model:
// the gun's ammo scoreboard (objective = gun id) is copied to the entity property
// krep:bulletcache every tick while the gun is held (only written when it changed: every
// setProperty is synced to all nearby clients).
system.runInterval(() => {
  for (const player of world.getPlayers()) {
    const mainhandItem = player.getComponent("minecraft:equippable").getEquipment("Mainhand");
    if (!mainhandItem?.typeId) continue;
    const weapon = getWeaponByItem(mainhandItem.typeId);
    if (!weapon?.storedAmmoDisplay) continue;
    const objective = world.scoreboard.getObjective(weapon.id);
    if (!objective) continue;
    const rounds = objective.getScore(player) ?? 0;
    if (player.getProperty("krep:bulletcache") !== rounds) player.setProperty("krep:bulletcache", rounds);
  }
}, 1);
