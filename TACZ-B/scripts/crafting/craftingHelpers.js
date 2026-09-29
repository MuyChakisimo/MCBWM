import { ActionFormData } from "@minecraft/server-ui";

// Shared recipe handling for the gunsmith and the ammo workbench.
// A recipe is a list of [item, count]; item is a vanilla id without "minecraft:" or a group below.

// Ingredient groups: one recipe entry that accepts several item types.
const ITEM_GROUPS = {
  log: {
    label: "Log (any wood)",
    matches: (typeId) => /^minecraft:([a-z_]+_log|log2?)$/.test(typeId) && !typeId.includes("stripped"),
  },
};

const matcher = (item) =>
  ITEM_GROUPS[item]?.matches ?? ((typeId) => typeId === (item.includes(":") ? item : "minecraft:" + item));

/** "gold_ingot" -> "Gold Ingot" */
export function itemLabel(item) {
  return ITEM_GROUPS[item]?.label ?? item.replace(/^.*:/, "").replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function inventory(player) {
  return player.getComponent("minecraft:inventory").container;
}

function countItem(container, item) {
  const matches = matcher(item);
  let total = 0;
  for (let slot = 0; slot < container.size; slot++) {
    const stack = container.getItem(slot);
    if (stack && matches(stack.typeId)) total += stack.amount;
  }
  return total;
}

function removeItem(container, item, count) {
  const matches = matcher(item);
  for (let slot = 0; slot < container.size && count > 0; slot++) {
    const stack = container.getItem(slot);
    if (!stack || !matches(stack.typeId)) continue;
    const taken = Math.min(count, stack.amount);
    count -= taken;
    if (taken === stack.amount) container.setItem(slot, undefined);
    else {
      stack.amount -= taken;
      container.setItem(slot, stack);
    }
  }
}

/** Takes every ingredient and gives `result` (an item id, or "id count" like "krep:bmg50 24") only if all are present. */
export function craftWithIngredients(player, ingredients, result) {
  const container = inventory(player);
  if (ingredients.some(([item, count]) => countItem(container, item) < count)) {
    player.runCommandAsync("title @s actionbar §cNot enough materials");
    return;
  }
  for (const [item, count] of ingredients) removeItem(container, item, count);
  player.runCommandAsync(`give @s ${result}`);
}

/** Confirm dialog listing the ingredients; Cancel returns to the previous menu via `back`. */
export function showCraftConfirm(player, { title, ingredients, result, back }) {
  const form = new ActionFormData()
    .title(title)
    .body("Are you sure? You need:\n\n" + ingredients.map(([item, count]) => `- ${count}x ${itemLabel(item)}`).join("\n"))
    .button("Confirm")
    .button("Cancel");
  form.show(player).then((response) => {
    if (response.canceled) return;
    if (response.selection === 0) craftWithIngredients(player, ingredients, result);
    else back(player);
  });
}

/** A list menu: entries [{ label, icon, onSelect(player) }]. */
export function showListMenu(player, { title, body, entries }) {
  const form = new ActionFormData().title(title).body(body);
  for (const entry of entries) form.button(entry.label, entry.icon);
  form.show(player).then((response) => {
    if (response.canceled) return;
    entries[response.selection]?.onSelect(player);
  });
}
