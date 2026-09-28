import { system, world } from "@minecraft/server";
const bulletNamespace = "bullet:";
world.afterEvents.entitySpawn.subscribe((event) => {
  const entity = event.entity;
  if (!entity || !entity.typeId.startsWith(bulletNamespace)) return;
  const replaced = entity.typeId.replace(bulletNamespace, ""),
    bullet = Indoarsenal.bullets[replaced];
  if (!bullet) return;
  system.runTimeout(() => {
    try {
      entity.runCommandAsync("kill @s").catch(() => {});
    } catch (error) {}
  }, 10);
});
