import { GameMode, Player } from "@minecraft/server";

import { profileCount } from "../core/profiler.js";
import {
  getWeaponConfig,
  WEAPON_DEFAULTS,
} from "../config/weapons.js";
import { distance } from "../utils/vector.js";
import { getArmorProtection } from "./armor.js";

// =====================================================
// TACZ AUTHORITATIVE DAMAGE
//
// This is the readable replacement for the old obfuscated
// projectileHitEntity.js damage body.
//
// Preserved behavior:
// - Creative targets are ignored.
// - Targets tagged "immune" are ignored.
// - Only player-fired gun damage is accepted.
// - Headshot radius: 0.375 blocks from getHeadLocation().
// - Headshot base multiplier: 2x.
// - Armor reduction and penetration formula are unchanged.
// - Minimum applied gun damage is 1.
// - Existing hit/headshot/kill sounds are preserved.
// =====================================================

const HEADSHOT_RADIUS = 0.375;
const MAX_ARMOR_REDUCTION = 0.8;
const ARMOR_SCALE = 20;
const DEFAULT_PENETRATION = 0.3;

function calculateArmorMultiplier(armorPoints, penetration) {
  const reduction = Math.min(
    MAX_ARMOR_REDUCTION,
    (armorPoints * (1 - penetration)) / ARMOR_SCALE,
  );

  return 1 - reduction;
}

function playHitFeedback(source, { headshot, killed }) {
  source.playSound(headshot ? "headshot_sound" : "hitmark");

  if (killed) {
    source.playSound("kill");
  }
}

export function playCombinedHitFeedback(source, {
  hit = false,
  headshot = false,
  killed = false,
}) {
  if (!hit) {
    return;
  }

  playHitFeedback(source, { headshot, killed });
}

export function processGunHit({
  source,
  target,
  hitLocation,
  weaponId,
  playFeedback = true,
  armorCache,
}) {
  if (!target || !hitLocation) {
    return { applied: false, headshot: false, killed: false, damage: 0 };
  }

  if (
    target.matches({ gameMode: GameMode.creative }) ||
    target.hasTag("immune")
  ) {
    return { applied: false, headshot: false, killed: false, damage: 0 };
  }

  if (!(source instanceof Player)) {
    return { applied: false, headshot: false, killed: false, damage: 0 };
  }

  const health = target.getComponent("minecraft:health");
  const weapon = getWeaponConfig(weaponId);

  if (!health || !weapon || typeof weapon.damage !== "number") {
    return { applied: false, headshot: false, killed: false, damage: 0 };
  }

  const headshot = distance(target.getHeadLocation(), hitLocation) <= HEADSHOT_RADIUS;

  let armor = armorCache?.get(target.id);

  if (!armor) {
    armor = getArmorProtection(target);
    armorCache?.set(target.id, armor);
  }

  const penetration =
    typeof weapon.penetration === "number"
      ? weapon.penetration
      : DEFAULT_PENETRATION;

  const relevantArmor = headshot ? armor.helmet : armor.total;
  const baseDamage = headshot
    ? weapon.damage *
      (weapon.headshotMultiplier ?? WEAPON_DEFAULTS.headshotMultiplier)
    : weapon.damage;

  const finalDamage = Math.max(
    1,
    baseDamage * calculateArmorMultiplier(relevantArmor, penetration),
  );

  health.setCurrentValue(
    Math.max(0, health.currentValue - finalDamage),
  );

  const killed = health.currentValue <= 0;
  profileCount("damageApplications");

  if (playFeedback) {
    playHitFeedback(source, { headshot, killed });
  }

  return {
    applied: true,
    headshot,
    killed,
    damage: finalDamage,
  };
}
