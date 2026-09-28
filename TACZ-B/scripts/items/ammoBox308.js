// Using .308 Winchester ammo (krep:win308) while carrying an ammo box (krep:ammobox) moves the
// rounds into the box: scoreboard "win308", up to 320.
import { world, ItemStack } from "@minecraft/server";
const objectiveName = "win308",
  ammoItem = "krep:win308",
  ammoBoxItem = "krep:ammobox",
  maxAmmoCapacity = 320;
world.afterEvents.itemUse.subscribe((event) => {
  const source = event.source,
    item = event.itemStack;
  if (item && item.typeId === ammoItem)
    try {
      const container = source.getComponent("minecraft:inventory").container;
      let value = false;
      for (let value7 = 0; value7 < container.size; value7++) {
        {
          const item2 = container.getItem(value7);
          if (item2 && item2.typeId === ammoBoxItem) {
            value = true;
            break;
          }
        }
      }
      if (!value) {
        source.runCommand("title @s actionbar §cYou must have an\nAmmo Box to store bullets!");
        return;
      }
      let objective = world.scoreboard.getObjective(objectiveName);
      !objective &&
        (source.runCommand("scoreboard objectives add " + objectiveName + " dummy"),
        (objective = world.scoreboard.getObjective(objectiveName)));
      const value2 = objective.getScore(source) || 0,
        value3 = maxAmmoCapacity - value2;
      if (value3 <= 0) {
        source.runCommand("title @s actionbar §cAmmo box is full!");
        return;
      }
      let value4 = 0;
      for (let value7 = 0; value7 < container.size; value7++) {
        const item2 = container.getItem(value7);
        item2 && item2.typeId === ammoItem && (value4 += item2.amount);
      }
      const value5 = Math.min(64, value3, value4);
      if (value5 < 1) {
        source.runCommand("title @s actionbar §cNo bullets to store!");
        return;
      }
      source.runCommand("scoreboard players add @s " + objectiveName + " " + value5);
      let value6 = value5;
      for (let value7 = 0; value7 < container.size && value6 > 0; value7++) {
        const item2 = container.getItem(value7);
        if (item2 && item2.typeId === ammoItem) {
          const amount = item2.amount;
          if (amount <= value6) {
            (container.setItem(value7, null), (value6 -= amount));
          } else
            (container.setItem(value7, new ItemStack(ammoItem, amount - value6)), (value6 = 0));
        }
      }
      (source.runCommand("title @s actionbar §a+" + value5 + " 308 Winchester"),
        source.playSound("random.orb"));
    } catch (error) {
      (source.runCommand("title @s actionbar §a+" + maxConvert + " 308 Winchester"),
        source.playSound("random.orb"));
    }
});
