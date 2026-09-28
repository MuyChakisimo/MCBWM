import { ActionFormData } from "@minecraft/server-ui";

function countItem(player, itemId) {
  const container = player.getComponent("minecraft:inventory").container;
  const typeId = itemId.includes(":") ? itemId : "minecraft:" + itemId;
  let total = 0;
  for (let slot = 0; slot < container.size; slot++) {
    const item = container.getItem(slot);
    if (item?.typeId === typeId) total += item.amount;
  }
  return total;
}

// Takes all ingredients and gives the result only if the player has every ingredient.
// ingredients: [[itemId, count], ...]; result: e.g. "krep:m107" or "krep:bmg50 40".
export function craftWithIngredients(player, ingredients, result) {
  if (ingredients.some(([item, count]) => countItem(player, item) < count)) {
    player.runCommandAsync("title @s actionbar §cNot enough materials");
    return;
  }
  for (const [item, count] of ingredients) player.runCommandAsync(`clear @s ${item} 0 ${count}`);
  player.runCommandAsync(`give @s ${result}`);
}

// Confirm dialog listing the ingredients; Cancel returns to the previous menu.
export function showCraftConfirm(player, { title, ingredients, result, back }) {
  const form = new ActionFormData()
    .title(title)
    .body(
      "Are you sure? You need:\n\n" +
        ingredients.map(([item, count]) => `- ${count}x ${item.replace(/_/g, " ")}`).join("\n"),
    )
    .button("Confirm")
    .button("Cancel");
  form.show(player).then((response) => {
    if (response.canceled) return;
    if (response.selection === 0) craftWithIngredients(player, ingredients, result);
    else back(player);
  });
}
