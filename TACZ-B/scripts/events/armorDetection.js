import { system, world } from "@minecraft/server";
export const armorProtection = {
  leather: { helmet: 1, chestplate: 3, leggings: 2, boots: 1 },
  chainmail: { helmet: 2, chestplate: 5, leggings: 4, boots: 1 },
  iron: { helmet: 2, chestplate: 6, leggings: 5, boots: 2 },
  diamond: { helmet: 3, chestplate: 8, leggings: 6, boots: 3 },
  netherite: { helmet: 3, chestplate: 8, leggings: 6, boots: 3 },
  golden: { helmet: 2, chestplate: 5, leggings: 3, boots: 1 },
};
const armorTags = [
  { item: "netherite_helmet", tag: "netherite_helmet", slot: "slot.armor.head" },
  { item: "netherite_chestplate", tag: "netherite_chestplate", slot: "slot.armor.chest" },
  { item: "netherite_leggings", tag: "netherite_leggings", slot: "slot.armor.legs" },
  { item: "netherite_boots", tag: "netherite_boots", slot: "slot.armor.feet" },
  { item: "diamond_helmet", tag: "diamond_helmet", slot: "slot.armor.head" },
  { item: "diamond_chestplate", tag: "diamond_chestplate", slot: "slot.armor.chest" },
  { item: "diamond_leggings", tag: "diamond_leggings", slot: "slot.armor.legs" },
  { item: "diamond_boots", tag: "diamond_boots", slot: "slot.armor.feet" },
  { item: "iron_helmet", tag: "iron_helmet", slot: "slot.armor.head" },
  { item: "iron_chestplate", tag: "iron_chestplate", slot: "slot.armor.chest" },
  { item: "iron_leggings", tag: "iron_leggings", slot: "slot.armor.legs" },
  { item: "iron_boots", tag: "iron_boots", slot: "slot.armor.feet" },
  { item: "chainmail_helmet", tag: "chainmail_helmet", slot: "slot.armor.head" },
  { item: "chainmail_chestplate", tag: "chainmail_chestplate", slot: "slot.armor.chest" },
  { item: "chainmail_leggings", tag: "chainmail_leggings", slot: "slot.armor.legs" },
  { item: "chainmail_boots", tag: "chainmail_boots", slot: "slot.armor.feet" },
  { item: "leather_helmet", tag: "leather_helmet", slot: "slot.armor.head" },
  { item: "leather_chestplate", tag: "leather_chestplate", slot: "slot.armor.chest" },
  { item: "leather_leggings", tag: "leather_leggings", slot: "slot.armor.legs" },
  { item: "leather_boots", tag: "leather_boots", slot: "slot.armor.feet" },
  { item: "golden_helmet", tag: "golden_helmet", slot: "slot.armor.head" },
  { item: "golden_chestplate", tag: "golden_chestplate", slot: "slot.armor.chest" },
  { item: "golden_leggings", tag: "golden_leggings", slot: "slot.armor.legs" },
  { item: "golden_boots", tag: "golden_boots", slot: "slot.armor.feet" },
];
system.runInterval(() => {
  for (const armorTag of armorTags) {
    world.getDimension("overworld").runCommand("tag @e[type=!player] remove " + armorTag.tag);
  }
  for (const armorTag of armorTags) {
    try {
      world
        .getDimension("overworld")
        .runCommand(
          "tag @e[type=!player,hasitem={item=minecraft:" +
            armorTag.item +
            ",location=" +
            armorTag.slot +
            ",quantity=1}] add " +
            armorTag.tag,
        );
    } catch (error) {}
  }
}, 20);
