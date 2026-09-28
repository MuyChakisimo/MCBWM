import { world, system } from "@minecraft/server";

// Kill marker: a kill adds the tag "murderEntity" to the shooter (combat/damage.js); it is
// removed again about 2 ticks later. Other packs/commands can react to the tag.
let murderTagCheckInterval = null;
function manageMurderTagRemoval() {
  const filtered = world.getAllPlayers().filter((player) => player.hasTag("murderEntity"));
  if (filtered.length > 0) {
    !murderTagCheckInterval &&
      (murderTagCheckInterval = system.runInterval(() => {
        const filtered2 = world.getAllPlayers().filter((player) => player.hasTag("murderEntity"));
        if (filtered2.length === 0) {
          (system.clearRun(murderTagCheckInterval), (murderTagCheckInterval = null));
          return;
        }
        for (const entry of filtered2) {
          const found = entry.getTags().find((tag) => tag.startsWith("murderEntityTime:"));
          if (!found) entry.addTag("murderEntityTime:" + system.currentTick);
          else {
            const value = parseInt(found.split(":")[1]);
            system.currentTick - value >= 2 &&
              (entry.removeTag("murderEntity"), entry.removeTag(found));
          }
        }
      }, 2));
  }
}
world.afterEvents.worldInitialize.subscribe(() => {
  system.runInterval(() => {
    manageMurderTagRemoval();
  }, 2);
});
