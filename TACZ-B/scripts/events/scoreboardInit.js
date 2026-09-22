import { system, world } from "@minecraft/server";

const SCOREBOARD_OBJECTIVES = [
  ["m16a1", "m16a1"],
  ["sks", "sks"],
  ["b93", "b93"],
  ["uzi", "uzi"],
  ["ump", "ump"],
  ["m16", "m16"],
  ["m4a1", "m4a1"],
  ["g36", "g36"],
  ["g36sound", "g36sound"],
  ["mp7sound", "mp7sound"],
  ["hk416sound", "hk416sound"],
  ["m4a1sound", "m4a1sound"],
  ["vector", "vector"],
  ["g3", "g3"],
  ["hk416", "hk416"],
  ["fal", "fal"],
  ["deagle", "deagle"],
  ["t50", "t50"],
  ["deagleg", "deagleg"],
  ["m1911", "m1911"],
  ["db", "db"],
  ["awp", "awp"],
  ["m107", "m107"],
  ["m870", "m870"],
  ["m1014", "m1014"],
  ["p90", "p90"],
  ["mp7", "mp7"],
  ["scarh", "scarh"],
  ["mp5", "mp5"],
  ["scarl", "scarl"],
  ["qbz95", "qbz95"],
  ["akm", "akm"],
  ["aa12", "aa12"],
  ["g17", "g17"],
  ["g18", "g18"],
  ["saiga12", "saiga12"],
  ["win308", "win308"],
  ["minigunoverheat", "minigunoverheat"],
  ["hk416select", "hk416select"],
  ["gripselect", "gripselect"],
  ["miscselect", "miscselect"],
  ["scopeselect", "scopeselect"],
  ["stockselect", "stockselect"],
  ["cp", "cp"],
  ["qbz191", "qbz191"],
  ["p320", "p320"],
  ["mk14", "mk14"],
  ["evolys", "evolys"],
  ["m249", "m249"],
  ["type81", "type81"],
];

function initializeScoreboardObjectives() {
  for (const [objectiveId, displayName] of SCOREBOARD_OBJECTIVES) {
    if (!world.scoreboard.getObjective(objectiveId)) {
      world.scoreboard.addObjective(objectiveId, displayName);
    }
  }
}

// Run once on the next game tick, after the world is available.
system.run(initializeScoreboardObjectives);
