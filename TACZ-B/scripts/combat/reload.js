import { system, world, EquipmentSlot, GameMode } from "@minecraft/server";
import { getWeaponByItem } from "../config/weapons.js";
import { heldTypeId, showAmmo, ammoNameKey, emptyListeners } from "./firing.js";
import { debug, recordReload } from "./debug.js";
import { zoomSoon } from "./aimZoom.js";
import { loredItem } from "../items/itemLore.js";
import { updateStoredAmmo } from "../items/storedAmmoDisplay.js";

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

// scriptReload options (tools/weapons/script-reload.mjs writes them from the gun's old BP reload):
//   empty / tac      [load, end] seconds; a gun without `tac` (RPG, M320) has no tactical reload.
//   emptyOne         [load, end] for an empty reload that can load only one round (Double Barrel).
//   emptyProperty    krep:ammoreload values the RP reload watches, by rounds loaded ([one, two]: Double Barrel).
//   tacEvents        [[seconds, event]] fired during a tactical reload (Evolys / M249 belt: evolys:bulletcache).
//   reset            event fired when the reload ends (evolys:reset).
//   byMagazine       per krep:magazine value: { empty, tac, caps: [empty cap, tactical cap] } (Vector, Golden
//                    Deagle: extended magazines have their own timing and capacity).
// roundInItem guns (RPG, M320) load the one round into the item: the ammo item goes, the loaded item comes back.

//   shells           shell by shell (M870, SPAS-12, M1014): { empty: [times], tac: [times], perCue, finish,
//                    loading, ending }. While krep:ammoreload is `loading` the RP plays the reload; a shell (perCue:
//                    up to 2 on the M1014) goes in at each time until the gun is full, the ammo runs out or the
//                    player presses fire; then `ending` (the RP closing animation) for `finish` seconds.

function startShells(player, weapon, kind, auto) {
  const id = weapon.id;
  const sh = weapon.scriptReload.shells;
  if (!sh[kind]) return;
  const objective = world.scoreboard.getObjective(id);
  if (!objective) return;
  const current = kind === "empty" ? 0 : objective.getScore(player) ?? 0;
  if (weapon.cycle && player.getProperty("krep:ammoreload") === weapon.cycle.value) return;
  const cap = weapon.magazine + (kind === "tac" && weapon.chamber !== false ? 1 : 0);
  if (kind === "tac" && current > weapon.magazine - 1) return; // the controllers needed one missing
  const container = inventory(player);
  const unlimited = countItem(container, CREATIVE_BOX) > 0;
  if (!unlimited && countItem(container, weapon.ammo) < 1) {
    const ammoName = ammoNameKey(weapon);
    player.onScreenDisplay.setActionBar({ rawtext: [{ text: "No ammo: " }, ...(ammoName ? [{ translate: ammoName }] : [])] });
    recordReload(player, id, kind, "noammo");
    return;
  }
  player.setProperty("krep:ammoreload", sh.loading);
  player.triggerEvent(MARK[kind]);
  zoomSoon(player); // no scope zoom while reloading
  recordReload(player, id, kind, "start", auto);
  const now = system.currentTick;
  reloads.set(player.id, { player, weapon, kind, cap, unlimited, shell: true, times: sh[kind].map((t) => now + ticks(t)), loadedAny: false, ending: false, endTick: 0, interrupt: false, cues: [] });
  debug(() => `${player.name} ${id} ${kind} shell reload start: ${current} in gun, up to ${cap}`);
}

/** One tick of a shell reload. */
function tickShells(r, now) {
  const { player, weapon, kind, cap, unlimited } = r;
  const sh = weapon.scriptReload.shells;
  if (r.ending) {
    if (now >= r.endTick) finish(r);
    return;
  }
  const objective = world.scoreboard.getObjective(weapon.id);
  const rounds = objective.getScore(player) ?? 0;
  const container = inventory(player);
  const available = unlimited ? Infinity : countItem(container, weapon.ammo);
  const stop = rounds >= cap || available < 1 || (r.interrupt && rounds >= 1) || !r.times.length;
  if (stop) {
    // The closing animation: krep:ammoreload `ending`, still in the reload mark variant.
    r.ending = true;
    r.loaded = true;
    r.endTick = now + ticks(sh.finish);
    player.setProperty("krep:ammoreload", sh.ending);
    recordReload(player, weapon.id, kind, "load");
    debug(() => `${player.name} ${weapon.id} shell reload closing at ${rounds} rounds${r.interrupt ? " (fire pressed)" : ""}`);
    return;
  }
  if (now < r.times[0]) return;
  r.times.shift();
  const give = Math.min(r.loadedAny ? sh.perCue ?? 1 : 1, cap - rounds, available); // the first shell goes in alone
  if (!unlimited && player.getGameMode() !== GameMode.Creative) removeItem(container, weapon.ammo, give);
  objective.setScore(player, rounds + give);
  updateStoredAmmo(player);
  if (!r.loadedAny && kind === "empty") player.getComponent("minecraft:equippable").setEquipment(EquipmentSlot.Mainhand, loredItem(`krep:${weapon.id}`));
  r.loadedAny = true;
  showAmmo(player, weapon, rounds + give);
  debug(() => `${player.name} ${weapon.id} shell +${give} -> ${rounds + give}`);
}

function startReload(player, weapon, kind, auto = false) {
  if (reloads.has(player.id)) return;
  if (weapon.scriptReload.shells) return startShells(player, weapon, kind, auto);
  const id = weapon.id;
  const sr = weapon.scriptReload;
  const spec = sr.byMagazine?.[player.getProperty("krep:magazine") ?? 0] ?? sr;
  if (!spec[kind]) return;
  const objective = weapon.roundInItem ? null : world.scoreboard.getObjective(id);
  if (!weapon.roundInItem && !objective) return;
  const current = kind === "empty" || weapon.roundInItem ? 0 : objective.getScore(player) ?? 0;
  // Not while the bolt / pump is cycling (the controllers checked krep:ammoreload too).
  if (weapon.cycle && player.getProperty("krep:ammoreload") === weapon.cycle.value) return;
  const chambered = kind === "tac" && weapon.chamber !== false ? 1 : 0;
  const full = spec.caps?.[0] ?? weapon.magazine; // a full magazine, without a chambered round
  const cap = weapon.roundInItem ? 1 : spec.caps?.[kind === "tac" ? 1 : 0] ?? weapon.magazine + chambered;
  // The controllers needed at least 2 missing (1 for a two-shell Double Barrel).
  if (kind === "tac" && current > full - (full <= 2 ? 1 : 2)) return;
  const container = inventory(player);
  const unlimited = countItem(container, CREATIVE_BOX) > 0;
  const available = unlimited ? Infinity : countItem(container, weapon.ammo);
  if (available < 1) {
    const ammoName = ammoNameKey(weapon);
    player.onScreenDisplay.setActionBar({ rawtext: [{ text: "No ammo: " }, ...(ammoName ? [{ translate: ammoName }] : [])] });
    recordReload(player, id, kind, "noammo");
    return;
  }
  const toLoad = Math.min(cap - current, available);
  const timing = kind === "empty" && toLoad === 1 && spec.emptyOne ? spec.emptyOne : spec[kind];
  const [loadAt, endAt] = timing;
  const property = kind === "empty" ? sr.emptyProperty?.[Math.min(toLoad, sr.emptyProperty.length) - 1] : undefined;
  if (property !== undefined) player.setProperty("krep:ammoreload", property);
  player.triggerEvent(MARK[kind]);
  zoomSoon(player); // no scope zoom while reloading
  recordReload(player, id, kind, "start", auto);
  debug(() => `${player.name} ${id} ${kind} reload start: ${current} in gun, ${unlimited ? "unlimited" : available} ammo, loads ${toLoad} at ${loadAt} s, ends ${endAt} s`);
  const now = system.currentTick;
  reloads.set(player.id, {
    player, weapon, kind, cap, unlimited, property,
    cues: kind === "tac" ? (sr.tacEvents ?? []).map(([t, event]) => ({ tick: now + ticks(t), event })) : [],
    loadTick: now + ticks(loadAt), endTick: now + ticks(endAt), loaded: false,
  });
}

function load(r) {
  const { player, weapon, kind, cap, unlimited } = r;
  const container = inventory(player);
  const takes = !unlimited && player.getGameMode() !== GameMode.Creative;
  if (weapon.roundInItem) {
    if (countItem(container, weapon.ammo) < 1 && !unlimited) return void (r.loaded = true);
    if (takes) removeItem(container, weapon.ammo, 1);
    player.getComponent("minecraft:equippable").setEquipment(EquipmentSlot.Mainhand, loredItem(`krep:${weapon.id}`));
    r.loaded = true;
    recordReload(player, weapon.id, kind, "load");
    return;
  }
  const objective = world.scoreboard.getObjective(weapon.id);
  const current = kind === "empty" ? 0 : objective.getScore(player) ?? 0; // shots can't happen meanwhile, but be exact
  const give = Math.min(cap - current, unlimited ? Infinity : countItem(container, weapon.ammo));
  if (give > 0 && takes) removeItem(container, weapon.ammo, give);
  const rounds = current + Math.max(give, 0);
  objective.setScore(player, rounds);
  updateStoredAmmo(player);
  if (kind === "empty" && rounds > 0) player.getComponent("minecraft:equippable").setEquipment(EquipmentSlot.Mainhand, loredItem(`krep:${weapon.id}`));
  if (weapon.capByMagazine) player.runCommand(`function ${weapon.id}`);
  else showAmmo(player, weapon, rounds);
  r.loaded = true;
  recordReload(player, weapon.id, kind, "load");
  debug(() => `${player.name} ${weapon.id} ${kind} reload loaded ${give} -> ${rounds} rounds`);
}

/** End (or cancel) a reload: the mark variant, and whatever else the gun's old reload reset. */
function finish(r) {
  const { player, weapon, property } = r;
  player.triggerEvent("krep:noreload");
  zoomSoon(player);
  const sh = weapon.scriptReload.shells;
  if (sh && [sh.loading, sh.ending].includes(player.getProperty("krep:ammoreload"))) player.setProperty("krep:ammoreload", 0);
  if (weapon.scriptReload.reset) player.triggerEvent(weapon.scriptReload.reset);
  if (property !== undefined && player.getProperty("krep:ammoreload") === property) player.setProperty("krep:ammoreload", 0);
  reloads.delete(player.id);
  recordReload(player, weapon.id, r.kind, r.loaded ? "end" : "cancel");
  debug(() => `${player.name} ${weapon.id} ${r.kind} reload ${r.loaded ? "end" : "cancelled (gun switched)"}`);
}

// Auto reload: when the last round is fired, the empty reload starts by itself shortly after (the controllers
// needed a new press, since swapping to the empty gun ends the held trigger; awkward on a controller / touch).
const AUTO_RELOAD_DELAY = 0.25;
emptyListeners.push((player, weapon) => {
  if (!weapon.scriptReload) return;
  system.runTimeout(() => {
    if (player.isValid && heldTypeId(player) === `krep:${weapon.id}_emp`) startReload(player, weapon, "empty", true);
  }, ticks(AUTO_RELOAD_DELAY));
});

world.afterEvents.itemStartUse.subscribe(({ source: player, itemStack }) => {
  const weapon = getWeaponByItem(itemStack?.typeId);
  if (weapon?.scriptReload && itemStack.typeId === `krep:${weapon.id}_emp`) startReload(player, weapon, "empty");
  // Pressing fire during a shell reload stops it after the current shell (firing.js doesn't shoot meanwhile).
  const r = reloads.get(player.id);
  if (r?.shell && itemStack?.typeId === `krep:${r.weapon.id}`) r.interrupt = true;
});

system.afterEvents.scriptEventReceive.subscribe(({ id, sourceEntity: player }) => {
  if (id !== "tacz:reload" || player?.typeId !== "minecraft:player") return;
  const held = heldTypeId(player);
  const weapon = getWeaponByItem(held);
  if (weapon?.scriptReload && held === `krep:${weapon.id}`) startReload(player, weapon, "tac");
});

system.runInterval(() => {
  if (reloads.size === 0) return; // nobody reloading: nothing to do this tick
  const now = system.currentTick;
  for (const [pid, r] of reloads) {
    const { player } = r;
    if (!player.isValid) {
      reloads.delete(pid);
      continue;
    }
    const held = heldTypeId(player);
    const stillHolding = held === `krep:${r.weapon.id}` || held === `krep:${r.weapon.id}_emp`;
    if (r.shell) {
      // Shells already in stay in; switching away just ends the reload.
      if (!stillHolding) finish(r);
      else tickShells(r, now);
      continue;
    }
    if (!r.loaded && !stillHolding) {
      // Switched away before the rounds went in: nothing loaded, nothing taken.
      finish(r);
      continue;
    }
    while (r.cues.length && now >= r.cues[0].tick) player.triggerEvent(r.cues.shift().event);
    if (!r.loaded && now >= r.loadTick) load(r);
    if (r.loaded && (now >= r.endTick || !stillHolding)) finish(r);
  }
}, 1);
