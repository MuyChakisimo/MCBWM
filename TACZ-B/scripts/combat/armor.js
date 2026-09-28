import { system, EquipmentSlot } from "@minecraft/server";
import { ARMOR } from "../config/combat.js";

// Armor points of a hit target, for damage.js: { total, helmet }.
// Read from the target's equippable component (players, and mobs where the game provides it);
// otherwise from `hasitem` tests on the mob itself, cached for CACHE_TICKS so a burst of shots
// doesn't repeat them. Looked up only when something is hit, in any dimension.
const CACHE_TICKS = 40;
const SLOTS = [
  [EquipmentSlot.Head, "helmet", "slot.armor.head"],
  [EquipmentSlot.Chest, "chestplate", "slot.armor.chest"],
  [EquipmentSlot.Legs, "leggings", "slot.armor.legs"],
  [EquipmentSlot.Feet, "boots", "slot.armor.feet"],
];
const MATERIALS = Object.keys(ARMOR);
const mobCache = new Map(); // entity id -> { tick, armor }

function sumArmor(materialFor) {
  const armor = { total: 0, helmet: 0 };
  for (const [slot, piece, location] of SLOTS) {
    const material = materialFor(slot, piece, location);
    const points = material ? ARMOR[material][piece] : 0;
    armor.total += points;
    if (piece === "helmet") armor.helmet = points;
  }
  return armor;
}

function fromEquipment(entity) {
  try {
    const equippable = entity.getComponent("minecraft:equippable");
    if (!equippable) return undefined;
    return sumArmor((slot, piece) => {
      const id = equippable.getEquipment(slot)?.typeId.replace("minecraft:", "");
      return id && MATERIALS.find((m) => id === `${m}_${piece}`);
    });
  } catch (error) {
    return undefined; // equippable not supported for this entity
  }
}

function fromHasItem(entity) {
  return sumArmor((slot, piece, location) =>
    MATERIALS.find((m) => {
      try {
        return entity.runCommand(`testfor @s[hasitem={item=${m}_${piece},location=${location}}]`).successCount > 0;
      } catch (error) {
        return false;
      }
    }),
  );
}

export function getArmor(entity) {
  const equipped = fromEquipment(entity);
  if (equipped) return equipped;
  const cached = mobCache.get(entity.id);
  if (cached && system.currentTick - cached.tick < CACHE_TICKS) return cached.armor;
  const armor = fromHasItem(entity);
  if (mobCache.size > 500) mobCache.clear();
  mobCache.set(entity.id, { tick: system.currentTick, armor });
  return armor;
}
