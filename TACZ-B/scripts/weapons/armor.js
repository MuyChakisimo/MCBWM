import { EquipmentSlot } from "@minecraft/server";

// =====================================================
// TACZ ARMOR MODEL
//
// Preserves the original TACZ armor-point values used by the
// projectile damage system.
// =====================================================

export const ARMOR_PROTECTION = Object.freeze({
  leather: Object.freeze({ helmet: 1, chestplate: 3, leggings: 2, boots: 1 }),
  chainmail: Object.freeze({ helmet: 2, chestplate: 5, leggings: 4, boots: 1 }),
  iron: Object.freeze({ helmet: 2, chestplate: 6, leggings: 5, boots: 2 }),
  diamond: Object.freeze({ helmet: 3, chestplate: 8, leggings: 6, boots: 3 }),
  netherite: Object.freeze({ helmet: 3, chestplate: 8, leggings: 6, boots: 3 }),
  golden: Object.freeze({ helmet: 2, chestplate: 5, leggings: 3, boots: 1 }),
});

const ARMOR_SLOTS = Object.freeze([
  Object.freeze({ slot: EquipmentSlot.Head, part: "helmet" }),
  Object.freeze({ slot: EquipmentSlot.Chest, part: "chestplate" }),
  Object.freeze({ slot: EquipmentSlot.Legs, part: "leggings" }),
  Object.freeze({ slot: EquipmentSlot.Feet, part: "boots" }),
]);

const ARMOR_MATERIALS = Object.freeze([
  "leather",
  "chainmail",
  "iron",
  "diamond",
  "netherite",
  "golden",
]);

function getArmorMaterial(typeId) {
  const itemId = typeId.replace("minecraft:", "").toLowerCase();

  for (const material of ARMOR_MATERIALS) {
    if (itemId.startsWith(`${material}_`)) {
      return material;
    }
  }

  return undefined;
}

export function getArmorProtection(entity) {
  let total = 0;
  let helmet = 0;

  const equippable = entity.getComponent("minecraft:equippable");

  if (!equippable) {
    return { total, helmet };
  }

  for (const { slot, part } of ARMOR_SLOTS) {
    const item = equippable.getEquipment(slot);

    if (!item?.typeId) {
      continue;
    }

    const material = getArmorMaterial(item.typeId);

    if (!material) {
      continue;
    }

    const protection = ARMOR_PROTECTION[material]?.[part] ?? 0;

    total += protection;

    if (part === "helmet") {
      helmet = protection;
    }
  }

  return { total, helmet };
}
