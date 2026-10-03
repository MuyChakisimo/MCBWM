import { system, world, EquipmentSlot, ItemStack, GameMode } from "@minecraft/server";
import { getWeaponByItem } from "../config/weapons.js";
import { heldTypeId, showAmmo, ammoNameKey, emptyListeners } from "./firing.js";

// Script-controlled reloading for guns with `scriptReload` in config/weapons.js (being rolled out; the other
// guns still reload from their BP controller `controller.animation.<id>.reload`, the <id>quantity / <id>reload
// functions and the <id>reloadN events). tools/weapons/script-reload.mjs converts a gun.
//
//   Empty reload     starts by itself when the last round is fired (if there is ammo), or use (right click)
//                    with krep:<id>_emp in hand.
//   Tactical reload  swing (left click) with krep:<id> in hand and at least 2 rounds missing. The swing comes
//                    from the shared BP controller controller.animation.reload_input (/scriptevent tacz:reload).
// The reload plays the gun's first-person reload animation (the RP controller watches q.mark_variant: 1 empty,
// 2 tactical, set by the krep:reload / krep:reloadtac events). At `scriptReload.<kind>[0]` seconds the rounds
// are taken from the inventory (none in creative mode; a creative ammo box krep:ammoboxc means unlimited)
// and loaded: up to the magazine (empty) or magazine + 1 chambered (tactical), the empty gun swapped back to
// krep:<id>. At `[1]` seconds the reload ends (krep:noreload). Switching guns before the rounds go in cancels.

const CREATIVE_BOX = "krep:ammoboxc";
const MARK = { empty: "krep:reload", tac: "krep:reloadtac" };

/** Per player: the reload in progress. */
const reloads = new Map();

const ticks = (seconds) => Math.round(seconds * 20);
const inventory = (player) => player.getComponent("minecraft:inventory").container;

function countItem(container, typeId) {
  let n = 0;
  for (let i = 0; i < container.size; i++) {
    const s = container.getItem(i);
    if (s?.typeId === typeId) n += s.amount;
  }
  return n;
}

function removeItem(container, typeId, count) {
  for (let i = 0; i < container.size && count > 0; i++) {
    const s = container.getItem(i);
    if (s?.typeId !== typeId) continue;
    const take = Math.min(count, s.amount);
    count -= take;
    if (take === s.amount) container.setItem(i);
    else {
      s.amount -= take;
      container.setItem(i, s);
    }
  }
}

function startReload(player, weapon, kind) {
  if (reloads.has(player.id)) return;
  const id = weapon.id;
  const objective = world.scoreboard.getObjective(id);
  if (!objective) return;
  const current = kind === "empty" ? 0 : objective.getScore(player) ?? 0;
  // Not while the bolt / pump is cycling (the controllers checked krep:ammoreload too).
  if (weapon.cycle && player.getProperty("krep:ammoreload") === weapon.cycle.value) return;
  const chambered = kind === "tac" && weapon.chamber !== false ? 1 : 0;
  const cap = weapon.capByMagazine?.[player.getProperty("krep:magazine") ?? 0] ?? weapon.magazine + chambered;
  if (kind === "tac" && current > weapon.magazine - 2) return; // the controllers needed at least 2 missing
  const container = inventory(player);
  const unlimited = countItem(container, CREATIVE_BOX) > 0;
  const available = unlimited ? Infinity : countItem(container, weapon.ammo);
  if (available < 1) {
    const ammoName = ammoNameKey(weapon);
    player.onScreenDisplay.setActionBar({ rawtext: [{ text: "No ammo: " }, ...(ammoName ? [{ translate: ammoName }] : [])] });
    return;
  }
  const [loadAt, endAt] = weapon.scriptReload[kind];
  player.triggerEvent(MARK[kind]);
  reloads.set(player.id, { player, weapon, kind, current, cap, unlimited, item: heldTypeId(player), loadTick: system.currentTick + ticks(loadAt), endTick: system.currentTick + ticks(endAt), loaded: false });
}

function load(r) {
  const { player, weapon, kind, cap, unlimited } = r;
  const objective = world.scoreboard.getObjective(weapon.id);
  const current = kind === "empty" ? 0 : objective.getScore(player) ?? 0; // shots can't happen meanwhile, but be exact
  const container = inventory(player);
  const give = Math.min(cap - current, unlimited ? Infinity : countItem(container, weapon.ammo));
  if (give > 0 && !unlimited && player.getGameMode() !== GameMode.creative) removeItem(container, weapon.ammo, give);
  const rounds = current + Math.max(give, 0);
  objective.setScore(player, rounds);
  if (kind === "empty" && rounds > 0) player.getComponent("minecraft:equippable").setEquipment(EquipmentSlot.Mainhand, new ItemStack(`krep:${weapon.id}`, 1));
  if (weapon.capByMagazine) player.runCommand(`function ${weapon.id}`);
  else showAmmo(player, weapon, rounds);
  r.loaded = true;
}

// Auto reload: when the last round is fired, the empty reload starts by itself shortly after (the controllers
// needed a new press, since swapping to the empty gun ends the held trigger; awkward on a controller / touch).
const AUTO_RELOAD_DELAY = 0.25;
emptyListeners.push((player, weapon) => {
  if (!weapon.scriptReload) return;
  system.runTimeout(() => {
    if (player.isValid() && heldTypeId(player) === `krep:${weapon.id}_emp`) startReload(player, weapon, "empty");
  }, ticks(AUTO_RELOAD_DELAY));
});

world.afterEvents.itemStartUse.subscribe(({ source: player, itemStack }) => {
  const weapon = getWeaponByItem(itemStack?.typeId);
  if (weapon?.scriptReload && itemStack.typeId === `krep:${weapon.id}_emp`) startReload(player, weapon, "empty");
});

system.afterEvents.scriptEventReceive.subscribe(({ id, sourceEntity: player }) => {
  if (id !== "tacz:reload" || player?.typeId !== "minecraft:player") return;
  const held = heldTypeId(player);
  const weapon = getWeaponByItem(held);
  if (weapon?.scriptReload && held === `krep:${weapon.id}`) startReload(player, weapon, "tac");
});

system.runInterval(() => {
  const now = system.currentTick;
  for (const [pid, r] of reloads) {
    const { player } = r;
    if (!player.isValid()) {
      reloads.delete(pid);
      continue;
    }
    const held = heldTypeId(player);
    const stillHolding = held === `krep:${r.weapon.id}` || held === `krep:${r.weapon.id}_emp`;
    if (!r.loaded && !stillHolding) {
      // Switched away before the rounds went in: nothing loaded, nothing taken.
      player.triggerEvent("krep:noreload");
      reloads.delete(pid);
      continue;
    }
    if (!r.loaded && now >= r.loadTick) load(r);
    if (r.loaded && (now >= r.endTick || !stillHolding)) {
      player.triggerEvent("krep:noreload");
      reloads.delete(pid);
    }
  }
}, 1);
