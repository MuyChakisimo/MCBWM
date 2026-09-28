import { Player, GameMode, EquipmentSlot, EntityDamageCause } from "@minecraft/server";
import { armorProtection } from "./armor.js";

// Gun damage: headshot check, armor reduction, damage, hit/kill sounds. Used by hitscan.js.
// damage / penetration come from the gun's entry in config/weapons.js.
const HEADSHOT_RADIUS = 0.375;
const HEADSHOT_MULTIPLIER = 2;
const MAX_ARMOR_REDUCTION = 0.8;
const DEFAULT_PENETRATION = 0.3;

const ARMOR_SLOTS = [
  [EquipmentSlot.Head, "helmet"],
  [EquipmentSlot.Chest, "chestplate"],
  [EquipmentSlot.Legs, "leggings"],
  [EquipmentSlot.Feet, "boots"],
];
const MATERIALS = Object.keys(armorProtection);

// { total, helmet } armor points. Players: worn equipment. Mobs: tags set by armor.js.
function getArmor(entity) {
  const armor = { total: 0, helmet: 0 };
  const add = (material, piece) => {
    const points = armorProtection[material]?.[piece] || 0;
    armor.total += points;
    if (piece === "helmet") armor.helmet = points;
  };
  if (entity instanceof Player) {
    const equippable = entity.getComponent("minecraft:equippable");
    for (const [slot, piece] of ARMOR_SLOTS) {
      const id = equippable?.getEquipment(slot)?.typeId.replace("minecraft:", "");
      const material = id && MATERIALS.find((m) => id.startsWith(m + "_"));
      if (material) add(material, piece);
    }
  } else {
    for (const material of MATERIALS)
      for (const [, piece] of ARMOR_SLOTS) if (entity.hasTag(`${material}_${piece}`)) add(material, piece);
  }
  return armor;
}

function isHeadshot(entity, location) {
  const head = entity.getHeadLocation();
  return Math.hypot(head.x - location.x, head.y - location.y, head.z - location.z) <= HEADSHOT_RADIUS;
}

// Applies one shot's hits: [{ entity, location }], one per pellet that hit (a shotgun can hit the
// same target several times). Each pellet deals the gun's damage; each target then takes the sum
// in one go, so it gets one hurt flash and one hit/kill sound per shot.
export function applyGunHits(source, weapon, hits) {
  if (!(source instanceof Player)) return;
  const penetration = weapon.penetration || DEFAULT_PENETRATION;
  const targets = new Map();
  for (const { entity, location } of hits) {
    let target = targets.get(entity.id);
    if (!target) {
      if (entity.matches({ gameMode: GameMode.creative }) || entity.hasTag("immune")) continue;
      const health = entity.getComponent("minecraft:health");
      if (!health || health.currentValue <= 0) continue;
      target = { entity, health, armor: getArmor(entity), damage: 0, headshot: false };
      targets.set(entity.id, target);
    }
    const headshot = isHeadshot(entity, location);
    const armorPoints = headshot ? target.armor.helmet : target.armor.total;
    const reduction = Math.min(MAX_ARMOR_REDUCTION, (armorPoints * (1 - penetration)) / 20);
    target.damage += Math.max(1, weapon.damage * (headshot ? HEADSHOT_MULTIPLIER : 1) * (1 - reduction));
    target.headshot ||= headshot;
  }

  for (const { entity, health, damage, headshot } of targets.values()) {
    source.playSound(headshot ? "headshot_sound" : "hitmark");
    const healthBefore = health.currentValue;
    if (healthBefore - damage > 0) showHurtEffect(entity);
    health.setCurrentValue(Math.max(0, healthBefore - damage));
    if (health.currentValue <= 0) {
      source.playSound("kill");
      source.addTag("murderEntity");
    }
  }
}

// Setting health directly does not play the red hurt flash (only real damage does), so hits
// register a 1-point hit first; the health is then set to the exact result above, so this
// does not change the damage dealt. The game may skip the flash during a target's brief
// invulnerability after a hit; the damage still applies.
// Lethal hits skip it: the death animation already flashes.
function showHurtEffect(entity) {
  try {
    entity.applyDamage(1, { cause: EntityDamageCause.override });
  } catch (error) {}
}
