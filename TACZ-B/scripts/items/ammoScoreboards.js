import { system, world } from "@minecraft/server";
import { WEAPONS } from "../config/weapons.js";

// Scoreboard objectives the pack's commands use: loaded rounds per gun (objective = gun id),
// the .308 ammo box, the minigun heat and the per-shot sound counters. Created once when the
// world loads (this used to be re-added every tick by functions/testis.mcfunction).
const OBJECTIVES = [
  ...Object.keys(WEAPONS),
  "win308",
  "minigunoverheat",
  "g36sound",
  "mp7sound",
  "hk416sound",
  "m4a1sound",
];

system.run(() => {
  for (const id of OBJECTIVES) {
    if (!world.scoreboard.getObjective(id)) world.scoreboard.addObjective(id, id);
  }
});
