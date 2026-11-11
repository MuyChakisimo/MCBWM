// Kicks anyone whose gamertag is not in config/access.js (see the reason there).
import { world, system } from "@minecraft/server";
import { ACCESS } from "../config/access";

const allowed = new Set(ACCESS.friends.map((n) => n.toLowerCase()));

world.afterEvents.playerSpawn.subscribe(({ player, initialSpawn }) => {
  if (!ACCESS.enabled || !initialSpawn) return;
  if (allowed.has(player.name.toLowerCase())) return;
  const name = player.name.replace(/"/g, "");
  console.warn(`[access] kicking "${name}": not on the friends list`);
  system.run(() => {
    try {
      world.getDimension("overworld").runCommand(`kick "${name}" ${ACCESS.kickMessage}`);
    } catch (e) {
      console.warn(`[access] kick failed for "${name}": ${e}`);
    }
  });
});
