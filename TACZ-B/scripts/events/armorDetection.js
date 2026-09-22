import { EquipmentSlot } from "@minecraft/server";

export const armorProtection = {
  leather: { helmet: 1, chestplate: 3, leggings: 2, boots: 1 },
  chainmail: { helmet: 2, chestplate: 5, leggings: 4, boots: 1 },
  iron: { helmet: 2, chestplate: 6, leggings: 5, boots: 2 },
  diamond: { helmet: 3, chestplate: 8, leggings: 6, boots: 3 },
  netherite: { helmet: 3, chestplate: 8, leggings: 6, boots: 3 },
  golden: { helmet: 2, chestplate: 5, leggings: 3, boots: 1 },
};

const armorSlots = [
  { slot: EquipmentSlot.Head, part: "helmet" },
  { slot: EquipmentSlot.Chest, part: "chestplate" },
  { slot: EquipmentSlot.Legs, part: "leggings" },
  { slot: EquipmentSlot.Feet, part: "boots" },
];

const armorMaterials = [
  "leather",
  "chainmail",
  "iron",
  "diamond",
  "netherite",
  "golden",
];

function getArmorMaterial(typeId) {
  const itemId = typeId.replace("minecraft:", "").toLowerCase();

  for (const material of armorMaterials) {
    if (itemId.startsWith(material + "_")) {
      return material;
    }
  }

  return null;
}

export function getEntityArmorProtection(entity) {
  let total = 0;
  let helmet = 0;

  const equippable = entity.getComponent("minecraft:equippable");

  if (!equippable) {
    return { total, helmet };
  }

  for (const { slot, part } of armorSlots) {
    const item = equippable.getEquipment(slot);

    if (!item?.typeId) continue;

    const material = getArmorMaterial(item.typeId);

    if (!material) continue;

    const protection = armorProtection[material]?.[part] ?? 0;

    total += protection;

    if (part === "helmet") {
      helmet = protection;
    }
  }

  return { total, helmet };
}
