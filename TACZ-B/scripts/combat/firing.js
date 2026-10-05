import { system, world, EquipmentSlot, GameMode } from "@minecraft/server";
import { shoot } from "./hitscan.js";
import { getWeaponByItem } from "../config/weapons.js";
import { AMMO } from "../config/ammo.js";
import { debug, recordShot } from "./debug.js";
import { zoomSoon } from "./aimZoom.js";
import { muzzleFlash } from "./muzzleLight.js";
import { loredItem } from "../items/itemLore.js";
import { updateStoredAmmo } from "../items/storedAmmoDisplay.js";
import { onHeldChange } from "../items/heldItem.js";
import { addHeat, showHeat } from "./heat.js";

// Script-controlled firing for guns with `scriptFiring: true` in config/weapons.js (every gun since v1.33.11, when
// the minigun left its BP controller).
//
// Holding the use button on `krep:<id>` fires at the gun's `rpm` in its `fireMode`:
//   "auto"  while the button is held;  "semi"  one shot per press;
//   "burst" `burst.count` shots per press at `burst.rpm`, then `burst.delay` seconds before the next.
// Each shot: removes one round from the scoreboard `<id>`, updates the ammo HUD, plays the shot sound,
// lights the muzzle flash (combat/muzzleLight.js; not with a silencer) and the shoot animation, and runs the hitscan shot (combat/hitscan.js). The last round swaps the
// item to `krep:<id>_emp` (which starts an empty reload) and shows "No Ammunition"; so does pressing fire on a
// loaded item with no rounds. A gun's first use ever starts with a full magazine (roundsOf); switching to a gun
// shows its ammo. (Until v1.33.9 each gun's BP controller did these, and refilled the magazine the first time
// the gun was held after every join.)
// No shots during a reload (mark variant 1 or 2; reloading is combat/reload.js).
// Per-gun extras (config/weapons.js):
//   cycle         bolt / pump after each shot: `<id>:bolt` `after` s after the shot (sets krep:ammoreload to
//                 `value`, which plays the RP bolt animation), `<id>:normal` `seconds` later; no shot (and a
//                 press is ignored) until `delay` s after that.
//   roundInItem   the loaded item is the round (RPG, M320): no scoreboard, every shot empties it.
//   aimToFire     fires only while aiming (sneaking).
//   capByMagazine rounds allowed per krep:magazine value (extended magazines); the HUD is the gun's
//                 function (it shows "/20+10" ...).
//   boxAmmo       no magazine (minigun): rounds come from the scoreboard `score` (an ammo box's rounds,
//                 items/ammoBox308.js); a press needs a `box` or `creativeBox` (unlimited) in the inventory.
//                 Running out shows "No Ammunition" (no empty item: that is the overheated gun).
//   spinUp        { seconds, sound }: the first shot of a press comes `seconds` later (wind-up sound).
//   heat          overheating (combat/heat.js); the HUD is the gun's function (rounds and heat).

const TICKS_PER_MINUTE = 1200;
const RELOADING = [1, 2]; // q.mark_variant during an empty (1) or tactical (2) reload: no shots (a press stops a shell reload)
const isReloading = (player) => RELOADING.includes(player.getComponent("minecraft:mark_variant")?.value);

/** Called with (player, weapon) when a shot empties the gun (combat/reload.js starts the empty reload). */
export const emptyListeners = [];

/** Per player: the gun being fired and when its next shot is due. */
const triggers = new Map();

export function heldTypeId(player) {
  return player.getComponent("minecraft:equippable")?.getEquipment(EquipmentSlot.Mainhand)?.typeId;
}

// Ammo name for the HUD, e.g. "krep:ammo.name.5_56" (same key as the ammo's lore, ".lore." -> ".name.").
export function ammoNameKey(weapon) {
  return AMMO[weapon.ammo?.replace(/^krep:/, "")]?.lore?.replace(".lore.", ".name.");
}

export function showAmmo(player, weapon, rounds) {
  const ammoName = ammoNameKey(weapon);
  if (rounds > 0) player.onScreenDisplay.setActionBar({ rawtext: [{ text: `${rounds}/${weapon.magazine} \n` }, ...(ammoName ? [{ translate: ammoName }] : [])] });
  else player.onScreenDisplay.setActionBar("No Ammunition");
}

/** Rounds in the gun's magazine; the first time ever, a full magazine. Undefined if there is no scoreboard. */
export function roundsOf(player, weapon) {
  const objective = world.scoreboard.getObjective(weapon.id);
  if (!objective) return undefined;
  const rounds = objective.getScore(player);
  if (rounds !== undefined) return rounds;
  objective.setScore(player, weapon.magazine);
  return weapon.magazine;
}

/** The HUD for the gun's rounds (the gun's function for guns whose capacity depends on the magazine). */
function showHeldAmmo(player, weapon, rounds) {
  if (weapon.capByMagazine) player.runCommand(`function ${weapon.id}`);
  else showAmmo(player, weapon, rounds);
}

/** The last round is gone, or fire was pressed with none: the empty item, which starts the empty reload. */
function toEmpty(player, weapon) {
  player.getComponent("minecraft:equippable").setEquipment(EquipmentSlot.Mainhand, loredItem(`krep:${weapon.id}_emp`));
  zoomSoon(player); // no scope zoom on an empty gun
  for (const listener of emptyListeners) listener(player, weapon);
}

/** Fires one round if there is one. Returns false when the gun can't fire (empty). */
function fireRound(player, trigger) {
  const { weaponId, weapon } = trigger;
  let left = 0;
  if (weapon.roundInItem) player.onScreenDisplay.setActionBar("No Ammunition");
  else if (weapon.boxAmmo) {
    const objective = world.scoreboard.getObjective(weapon.boxAmmo.score);
    const stored = objective?.getScore(player) ?? 0;
    if (!trigger.unlimited) {
      if (!objective || stored < 1) {
        player.onScreenDisplay.setActionBar("No Ammunition");
        return false;
      }
      objective.setScore(player, stored - 1);
    }
    left = Infinity; // never swaps to the empty item (see boxAmmo above)
  } else {
    const stored = roundsOf(player, weapon);
    if (stored === undefined) return false;
    // Never more than a full magazine plus one chambered round (as the BP controllers did).
    const cap = weapon.capByMagazine?.[player.getProperty("krep:magazine") ?? 0] ?? weapon.magazine + (weapon.chamber === false ? 0 : 1);
    const rounds = Math.min(stored, cap);
    if (rounds < 1) {
      toEmpty(player, weapon);
      return false;
    }
    left = rounds - 1;
    world.scoreboard.getObjective(weaponId).setScore(player, left);
    updateStoredAmmo(player);
    showHeldAmmo(player, weapon, left);
  }

  const aiming = player.isSneaking;
  // Only guns with a silencer (suppressedFrom): krep:muzzle is shared by all guns.
  const suppressed = weapon.suppressedFrom !== undefined && (player.getProperty("krep:muzzle") ?? 0) >= weapon.suppressedFrom;
  // The same command the BP controllers ran (plays at each nearby player, full volume). v1.24.0 used
  // dimension.playSound (a sound placed at the shooter) and some guns were silent.
  const sound = `${weapon.shootSound ?? weaponId}.${suppressed ? "suppress" : "shoot"}`;
  player.runCommand(`playsound ${sound} @a[r=30]`);
  if (!suppressed) muzzleFlash(player); // lights up dark places (config/combat.js MUZZLE_LIGHT)
  recordShot(player, weaponId, sound);
  debug(() => `${player.name} ${weaponId} shot, ${weapon.roundInItem ? "round in item" : `${left} left`}, ${aiming ? "aiming" : "hip"}, sound ${sound}`);
  // The firing kick (and muzzle flash) every client plays: same as the fire event's playanimation.
  const animation = weapon.shootAnimation?.[aiming ? "ads" : "hip"] ?? `animation.${weaponId}.shoot.${aiming ? "sight" : "nsight"}`;
  player.playAnimation(animation, { nextState: "shoot" });
  shoot(player, weaponId, weapon, aiming ? "ads" : "hip");

  if (weapon.heat) {
    const overheated = addHeat(player, weapon);
    showHeat(player, weapon);
    if (overheated) return false;
  }
  if (left === 0) {
    toEmpty(player, weapon);
    return false;
  }
  if (weapon.cycle) startCycle(player, weaponId, weapon.cycle);
  return true;
}

const ticks = (seconds) => Math.round(seconds * 20);
const cycleTicks = (cycle) => ticks(cycle.after + cycle.seconds + cycle.delay);

/** Bolt / pump: the property the RP bolt animation and the reload controllers watch, as the BP states set it. */
function startCycle(player, weaponId, cycle) {
  system.runTimeout(() => {
    if (!player.isValid || heldTypeId(player) !== `krep:${weaponId}`) return;
    // A reload started right after the shot: no bolt (it would overwrite the reload's krep:ammoreload).
    if (isReloading(player)) return;
    player.triggerEvent(`${weaponId}:bolt`);
    zoomSoon(player); // scope out while the bolt is worked
  }, ticks(cycle.after));
  system.runTimeout(() => {
    // Only undo our own value (a reload started meanwhile sets krep:ammoreload to something else).
    if (!player.isValid || player.getProperty("krep:ammoreload") !== cycle.value) return;
    player.triggerEvent(`${weaponId}:normal`);
    zoomSoon(player);
  }, ticks(cycle.after + cycle.seconds));
}

/** boxAmmo: which box the player carries (undefined: none), as the minigun's BP controller checked on a press. */
function carriedBox(player, box) {
  const container = player.getComponent("minecraft:inventory")?.container;
  let found;
  for (let i = 0; container && i < container.size; i++) {
    const typeId = container.getItem(i)?.typeId;
    if (typeId === box.creativeBox) return "creative";
    if (typeId === box.box) found = "box";
  }
  return found;
}

function startTrigger(player, weaponId, weapon) {
  const burst = weapon.fireMode === "burst" ? weapon.burst : undefined;
  let unlimited = false;
  if (weapon.boxAmmo) {
    const box = carriedBox(player, weapon.boxAmmo);
    if (!box) {
      player.onScreenDisplay.setActionBar({ rawtext: [{ text: "No " }, { translate: `krep:box.${weapon.boxAmmo.box.replace(/^krep:/, "")}.name` }] });
      return;
    }
    // A creative ammo box or creative mode: no rounds needed or taken.
    unlimited = box === "creative" || player.getGameMode() === GameMode.Creative;
  }
  // A press while the last one still waits keeps its wait (v1.31.0: a second click skipped it, MK23 fired
  // every 8-14 ticks instead of 24).
  // Only the same gun's wait counts (v1.33.9: the AWP's bolt delayed a pistol switched to right after).
  const previous = triggers.get(player.id)?.weaponId === weaponId ? triggers.get(player.id) : undefined;
  let nextShot = Math.max(system.currentTick, previous?.readyAt ?? (previous?.weaponId === weaponId ? previous.nextShot : 0));
  if (weapon.spinUp) {
    // Wind-up: every press, as the BP controller's "start" state did.
    player.runCommand(`playsound ${weapon.spinUp.sound} @a[r=15]`);
    nextShot = Math.max(nextShot, system.currentTick + ticks(weapon.spinUp.seconds));
  }
  triggers.set(player.id, {
    player,
    weaponId,
    weapon,
    held: true,
    unlimited,
    // semi: one shot; burst: count shots; auto: until released.
    shotsLeft: weapon.fireMode === "semi" ? 1 : burst ? burst.count : Infinity,
    interval: TICKS_PER_MINUTE / (burst?.rpm ?? weapon.rpm),
    nextShot,
  });
}

world.afterEvents.itemStartUse.subscribe(({ source: player, itemStack }) => {
  const weapon = getWeaponByItem(itemStack?.typeId);
  if (!weapon?.scriptFiring || itemStack.typeId !== `krep:${weapon.id}`) return;
  if (weapon.aimToFire && !player.isSneaking) return;
  // A press during a reload is ignored, not saved for later (v1.33.9 fired it when the reload ended; the press
  // that stops a shell reload is handled by reload.js).
  if (isReloading(player)) return;
  // A bolt / pump still cycling: the press is ignored (the controllers didn't queue it either).
  const previous = triggers.get(player.id);
  if (weapon.cycle && previous?.weaponId === weapon.id && system.currentTick < (previous.readyAt ?? 0)) return;
  startTrigger(player, weapon.id, weapon);
});

world.afterEvents.itemStopUse.subscribe(({ source: player }) => {
  const trigger = triggers.get(player.id);
  if (trigger) trigger.held = false;
});

// Dying drops the trigger (with keepInventory the gun stays in hand, and the release may never arrive).
world.afterEvents.entityDie.subscribe(({ deadEntity }) => triggers.delete(deadEntity.id), { entityTypes: ["minecraft:player"] });
world.afterEvents.playerLeave.subscribe(({ playerId }) => triggers.delete(playerId));

system.runInterval(() => {
  if (triggers.size === 0) return; // nobody firing: nothing to do this tick
  const now = system.currentTick;
  for (const [id, trigger] of triggers) {
    const { player, weaponId, weapon } = trigger;
    const done = () => {
      // Remember when the gun may fire again so a quick re-press can't beat the fire rate.
      const burst = weapon.fireMode === "burst" ? weapon.burst : undefined;
      triggers.set(id, { weaponId, readyAt: Math.max(trigger.nextShot, burst ? now + burst.delay * 20 : trigger.nextShot), done: true });
    };
    if (trigger.done) {
      if (now >= trigger.readyAt) triggers.delete(id);
      continue;
    }
    // One player's error must not stop everyone else's firing (and must not repeat every tick).
    try {
      if (!player.isValid || heldTypeId(player) !== `krep:${weaponId}`) {
        triggers.delete(id);
        continue;
      }
      // Auto stops when the button is released; semi and burst finish their shots.
      if (trigger.shotsLeft === Infinity && !trigger.held) {
        done();
        continue;
      }
      if (isReloading(player)) {
        // A held auto trigger fires again after the reload; semi / burst shots left are dropped (no shot by itself).
        if (trigger.shotsLeft !== Infinity) done();
        continue;
      }
      if (now < trigger.nextShot) continue;
      const fired = fireRound(player, trigger);
      trigger.shotsLeft--;
      // Keep the rhythm (810 rpm = a shot every 1.48 ticks) but never bank shots while waiting: a shot a tick
      // or more late (the first one, or one held back by a reload) counts from now (DB-4 fired its 2nd barrel
      // 1 tick after the 1st instead of 2).
      const from = now - trigger.nextShot >= 1 ? now : trigger.nextShot;
      trigger.nextShot = Math.max(from + trigger.interval, now + 1);
      if (weapon.cycle) trigger.nextShot = Math.max(trigger.nextShot, now + cycleTicks(weapon.cycle));
      if (!fired || trigger.shotsLeft <= 0) done();
    } catch (error) {
      triggers.delete(id);
      console.warn(`[TACZ firing] ${weaponId}: ${error}`);
    }
  }
}, 1);

// Taking a gun in hand shows its ammo (loaded: rounds; empty item: "No Ammunition").
onHeldChange((player) => {
  const typeId = heldTypeId(player);
  const weapon = getWeaponByItem(typeId);
  if (!weapon?.scriptFiring || weapon.roundInItem || weapon.boxAmmo) return; // boxAmmo: heat.js shows its HUD
  const rounds = typeId === `krep:${weapon.id}_emp` ? 0 : roundsOf(player, weapon);
  if (rounds === undefined) return;
  updateStoredAmmo(player);
  showHeldAmmo(player, weapon, rounds);
});
