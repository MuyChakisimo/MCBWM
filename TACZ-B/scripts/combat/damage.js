import { Player, GameMode, EntityDamageCause } from "@minecraft/server";
import { getArmor } from "./armor.js";
import { COMBAT } from "../config/combat.js";

// Gun damage: headshot check, armor reduction, damage, hit/kill sounds. Used by hitscan.js.
// damage / penetration come from the gun's entry in config/weapons.js, the rules from
// COMBAT (config/combat.js).

// Damage multiplier at `distance` blocks: the first falloff step [upTo, multiplier] that reaches
// that far (upTo null = any distance). No falloff: full damage.
function falloffAt(weapon, distance) {
  for (const [upTo, multiplier] of weapon.falloff ?? []) if (upTo === null || distance <= upTo) return multiplier;
  return 1;
}

function isHeadshot(entity, location) {
  const head = entity.getHeadLocation();
  return Math.hypot(head.x - location.x, head.y - location.y, head.z - location.z) <= COMBAT.headshotRadius;
}

// Applies one shot's hits: [{ entity, location }], one per pellet that hit (a shotgun can hit the
// same target several times). Each pellet deals the gun's damage; each target then takes the sum
// in one go, so it gets one hurt flash and one hit/kill sound per shot.
export function applyGunHits(source, weapon, hits) {
  if (!(source instanceof Player)) return;
  const penetration = weapon.penetration ?? 0;
  const baseDamage = weapon.damage * COMBAT.damageMultiplier;
  const headshotMultiplier = weapon.headshot ?? COMBAT.headshotMultiplier;
  const origin = source.getHeadLocation();
  const targets = new Map();
  for (const { entity, location } of hits) {
    let target = targets.get(entity.id);
    if (!target) {
      if (entity.matches({ gameMode: GameMode.Creative }) || entity.hasTag("immune")) continue;
      const health = entity.getComponent("minecraft:health");
      if (!health || health.currentValue <= 0) continue;
      target = { entity, health, armor: getArmor(entity), damage: 0, headshot: false };
      targets.set(entity.id, target);
    }
    const headshot = isHeadshot(entity, location);
    const armorPoints = headshot ? target.armor.helmet : target.armor.total;
    const reduction = Math.min(COMBAT.maxArmorReduction, (armorPoints * (1 - penetration)) / 20);
    const distance = Math.hypot(location.x - origin.x, location.y - origin.y, location.z - origin.z);
    const damage = baseDamage * falloffAt(weapon, distance) * (headshot ? headshotMultiplier : 1) * (1 - reduction);
    target.damage += Math.max(COMBAT.minDamage, damage);
    target.headshot ||= headshot;
  }

  for (const { entity, health, damage, headshot } of targets.values()) {
    source.playSound(headshot ? "headshot_sound" : "hitmark");
    const healthBefore = health.currentValue;
    if (healthBefore - damage > 0) showHurtEffect(entity);
    health.setCurrentValue(Math.max(0, healthBefore - damage));
    if (health.currentValue <= 0) source.playSound("kill");
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
