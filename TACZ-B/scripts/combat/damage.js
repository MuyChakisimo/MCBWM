import { Player, GameMode, EquipmentSlot, EntityDamageCause } from "@minecraft/server";
import { armorProtection } from "./armor.js";
import { getWeapon } from "../config/weapons.js";

// Applies one gun hit: headshot check, armor reduction, damage, hit/kill sounds.
// Used by hitscan shots (hitscan.js) and physical bullets (projectiles.js).
// weaponId is a key of WEAPONS (config/weapons.js); damage/penetration come from there.
export function processGunHit({ source, target: entity, hitLocation: location, weaponId }) {
  if (!entity || entity.matches({ gameMode: GameMode.creative }) || entity.hasTag("immune")) return;
  if (!(source instanceof Player)) {
    return;
  }
  const health = entity.getComponent("minecraft:health");
  if (!health) {
    return;
  }
  const bullet = getWeapon(weaponId);
  if (!bullet) return;
  let isHeadshot = false;
  const headLocation = entity.getHeadLocation(),
    distanceToHead = Math.sqrt(
      (headLocation.x - location.x) ** 2 +
        (headLocation.y - location.y) ** 2 +
        (headLocation.z - location.z) ** 2,
    );
  distanceToHead <= 0.375 && (isHeadshot = true);
  let totalArmor = 0,
    helmetArmor = 0;
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
            let material = null;
            if (lower.includes("leather_")) material = "leather";
            else {
              if (lower.includes("chainmail_")) material = "chainmail";
              else {
                if (lower.includes("iron_")) material = "iron";
                else {
                  if (lower.includes("diamond_")) material = "diamond";
                  else {
                    if (lower.includes("netherite_")) material = "netherite";
                    else {
                      if (lower.includes("golden_")) material = "golden";
                    }
                  }
                }
              }
            }
            if (material) {
              const piece =
                  entry === EquipmentSlot.Head
                    ? "helmet"
                    : entry === EquipmentSlot.Chest
                      ? "chestplate"
                      : entry === EquipmentSlot.Legs
                        ? "leggings"
                        : "boots",
                protection = armorProtection[material][piece] || 0;
              ((totalArmor += protection),
                entry === EquipmentSlot.Head && (helmetArmor = protection));
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
          const [material, piece] = entry.split("_"),
            protection = armorProtection[material][piece] || 0;
          ((totalArmor += protection), piece === "helmet" && (helmetArmor = protection));
        }
      }
    }
  }
  const penetration = bullet.penetration || 0.3;
  let damage = bullet.damage;
  if (isHeadshot) {
    ((damage = Math.max(
      1,
      bullet.damage * 2 * (1 - Math.min(0.8, (helmetArmor * (1 - penetration)) / 20)),
    )),
      source.playSound("headshot_sound"));
  } else
    ((damage = Math.max(
      1,
      bullet.damage * (1 - Math.min(0.8, (totalArmor * (1 - penetration)) / 20)),
    )),
      source.playSound("hitmark"));
  const healthBefore = health.currentValue;
  if (healthBefore - damage > 0) showHurtEffect(entity);
  health.setCurrentValue(Math.max(0, healthBefore - damage));
  if (health.currentValue <= 0) {
    source.playSound("kill");
    source.addTag("murderEntity");
  }
}

// Setting health directly does not play the red hurt flash (only real damage does), so hitscan
// hits register a 1-point hit first; the health is then set to the exact result above, so this
// does not change the damage dealt. The game may skip the flash during a target's brief
// invulnerability after a hit; the damage still applies.
// Lethal hits skip it: the death animation already flashes.
function showHurtEffect(entity) {
  try {
    entity.applyDamage(1, { cause: EntityDamageCause.override });
  } catch (error) {}
}
