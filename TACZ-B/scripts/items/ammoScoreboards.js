import { world } from "@minecraft/server";
import { WEAPONS } from "../config/weapons.js";

// Scoreboard objectives the pack's commands use: loaded rounds per gun (objective = gun id),
// the .308 ammo box and the minigun heat. Created once when the world loads (this used to be
// re-added every tick by functions/testis.mcfunction).
const OBJECTIVES = [...Object.keys(WEAPONS), "win308", "minigunoverheat"];

// 2.x: scripts start before the world is loaded; the scoreboard is ready at worldLoad.
world.afterEvents.worldLoad.subscribe(() => {
  for (const id of OBJECTIVES) {
    if (!world.scoreboard.getObjective(id)) world.scoreboard.addObjective(id, id);
  }
});
