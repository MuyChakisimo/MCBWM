import { world, Player, GameMode, EquipmentSlot, system } from "@minecraft/server";
import { armorProtection } from "./armorDetection.js";
world.afterEvents.projectileHitEntity.subscribe((event) => {
  const { projectile: projectile, source: source, location: location } = event,
    entity = event.getEntityHit().entity;
  if (!entity || entity.matches({ gameMode: GameMode.creative }) || entity.hasTag("immune")) return;
  if (!(source instanceof Player)) {
    return;
  }
  const health = entity.getComponent("minecraft:health");
  if (!health) {
    return;
  }
  const replaced = projectile.typeId.replace("bullet:", ""),
    bullet = Indoarsenal.bullets[replaced];
  if (!bullet) return;
  let value = false;
  const headLocation = entity.getHeadLocation(),
    value2 = Math.sqrt(
      (headLocation.x - location.x) ** 2 +
        (headLocation.y - location.y) ** 2 +
        (headLocation.z - location.z) ** 2,
    );
  value2 <= 0.375 && (value = true);
  let value3 = 0,
    value4 = 0;
  if (entity instanceof Player) {
    const equippable = entity.getComponent("minecraft:equippable");
    if (equippable) {
      const list = [
        EquipmentSlot.Head,
        EquipmentSlot.Chest,
        EquipmentSlot.Legs,
        EquipmentSlot.Feet,
      ];
      for (const entry of list) {
        {
          const equipment = equippable.getEquipment(entry);
          if (equipment) {
            const lower = equipment.typeId.replace("minecraft:", "").toLowerCase();
            let value6 = null;
            if (lower.includes("leather_")) value6 = "leather";
            else {
              if (lower.includes("chainmail_")) value6 = "chainmail";
              else {
                if (lower.includes("iron_")) value6 = "iron";
                else {
                  if (lower.includes("diamond_")) value6 = "diamond";
                  else {
                    if (lower.includes("netherite_")) value6 = "netherite";
                    else {
                      if (lower.includes("golden_")) value6 = "golden";
                    }
                  }
                }
              }
            }
            if (value6) {
              const value7 =
                  entry === EquipmentSlot.Head
                    ? "helmet"
                    : entry === EquipmentSlot.Chest
                      ? "chestplate"
                      : entry === EquipmentSlot.Legs
                        ? "leggings"
                        : "boots",
                value8 = armorProtection[value6][value7] || 0;
              ((value3 += value8), entry === EquipmentSlot.Head && (value4 = value8));
            }
          }
        }
      }
    }
  } else {
    {
      const list = [
        "leather_helmet",
        "leather_chestplate",
        "leather_leggings",
        "leather_boots",
        "chainmail_helmet",
        "chainmail_chestplate",
        "chainmail_leggings",
        "chainmail_boots",
        "iron_helmet",
        "iron_chestplate",
        "iron_leggings",
        "iron_boots",
        "diamond_helmet",
        "diamond_chestplate",
        "diamond_leggings",
        "diamond_boots",
        "netherite_helmet",
        "netherite_chestplate",
        "netherite_leggings",
        "netherite_boots",
        "golden_helmet",
        "golden_chestplate",
        "golden_leggings",
        "golden_boots",
      ];
      for (const entry of list) {
        if (entity.hasTag(entry)) {
          const [value6, value7] = entry.split("_"),
            value8 = armorProtection[value6][value7] || 0;
          ((value3 += value8), value7 === "helmet" && (value4 = value8));
        }
      }
    }
  }
  const value5 = bullet.penetration || 0.3;
  let damage = bullet.damage;
  if (value) {
    ((damage = Math.max(1, bullet.damage * 2 * (1 - Math.min(0.8, (value4 * (1 - value5)) / 20)))),
      source.playSound("headshot_sound"));
  } else
    ((damage = Math.max(1, bullet.damage * (1 - Math.min(0.8, (value3 * (1 - value5)) / 20)))),
      source.playSound("hitmark"));
  (health.setCurrentValue(Math.max(0, health.currentValue - damage)),
    health.currentValue <= 0 && (source.playSound("kill"), source.addTag("murderEntity")));
});
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
