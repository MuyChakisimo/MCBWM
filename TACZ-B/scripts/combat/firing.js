import { system, world, EquipmentSlot, ItemStack } from "@minecraft/server";
import { shoot } from "./hitscan.js";
import { getWeaponByItem } from "../config/weapons.js";
import { AMMO } from "../config/ammo.js";
import { debug, recordShot } from "./debug.js";

// Script-controlled firing for guns with `scriptFiring: true` in config/weapons.js (being rolled out;
// the other guns still fire from their BP controller, animation_controllers/gun_<id>.json).
//
// Holding the use button on `krep:<id>` fires at the gun's `rpm` in its `fireMode`:
//   "auto"  while the button is held;  "semi"  one shot per press;
//   "burst" `burst.count` shots per press at `burst.rpm`, then `burst.delay` seconds before the next.
// Each shot: removes one round from the scoreboard `<id>`, updates the ammo HUD, plays the shot sound
// and the shoot animation, and runs the hitscan shot (combat/hitscan.js). The last round swaps the
// item to `krep:<id>_emp` (which starts an empty reload) and shows "No Ammunition".
// No shots during a reload (mark variant 1 or 2; reloading is combat/reload.js).
// Per-gun extras (config/weapons.js):
//   cycle         bolt / pump after each shot: `<id>:bolt` `after` s after the shot (sets krep:ammoreload to
//                 `value`, which plays the RP bolt animation), `<id>:normal` `seconds` later; no shot (and a
//                 press is ignored) until `delay` s after that.
//   roundInItem   the loaded item is the round (RPG, M320): no scoreboard, every shot empties it.
//   aimToFire     fires only while aiming (sneaking).
//   capByMagazine rounds allowed per krep:magazine value (extended magazines); the HUD is the gun's
//                 function (it shows "/20+10" ...).

const TICKS_PER_MINUTE = 1200;
const RELOADING = [1, 2]; // q.mark_variant during an empty (1) or tactical (2) reload: no shots (a press stops a shell reload)

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

/** Fires one round if there is one. Returns false when the gun can't fire (empty). */
function fireRound(player, trigger) {
  const { weaponId, weapon } = trigger;
  let left = 0;
  if (weapon.roundInItem) player.onScreenDisplay.setActionBar("No Ammunition");
  else {
    const objective = world.scoreboard.getObjective(weaponId);
    if (!objective) return false;
    // Never more than a full magazine plus one chambered round (as the BP controllers did).
    const cap = weapon.capByMagazine?.[player.getProperty("krep:magazine") ?? 0] ?? weapon.magazine + (weapon.chamber === false ? 0 : 1);
    const rounds = Math.min(objective.getScore(player) ?? 0, cap);
    if (rounds < 1) return false;
    left = rounds - 1;
    objective.setScore(player, left);
    if (weapon.capByMagazine) player.runCommand(`function ${weaponId}`);
    else showAmmo(player, weapon, left);
  }

  const aiming = player.isSneaking;
  // Only guns with a silencer (suppressedFrom): krep:muzzle is shared by all guns.
  const suppressed = weapon.suppressedFrom !== undefined && (player.getProperty("krep:muzzle") ?? 0) >= weapon.suppressedFrom;
  // The same command the BP controllers ran (plays at each nearby player, full volume). v1.24.0 used
  // dimension.playSound (a sound placed at the shooter) and some guns were silent.
  const sound = `${weapon.shootSound ?? weaponId}.${suppressed ? "suppress" : "shoot"}`;
  player.runCommand(`playsound ${sound} @a[r=30]`);
  recordShot(player, weaponId, sound);
  debug(() => `${player.name} ${weaponId} shot, ${weapon.roundInItem ? "round in item" : `${left} left`}, ${aiming ? "aiming" : "hip"}, sound ${sound}`);
  // The firing kick (and muzzle flash) every client plays: same as the fire event's playanimation.
  const animation = weapon.shootAnimation?.[aiming ? "ads" : "hip"] ?? `animation.${weaponId}.shoot.${aiming ? "sight" : "nsight"}`;
  player.playAnimation(animation, { nextState: "shoot" });
  shoot(player, weaponId, weapon, aiming ? "ads" : "hip");

  if (left === 0) {
    player.getComponent("minecraft:equippable").setEquipment(EquipmentSlot.Mainhand, new ItemStack(`krep:${weaponId}_emp`, 1));
    for (const listener of emptyListeners) listener(player, weapon);
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
    if (player.isValid() && heldTypeId(player) === `krep:${weaponId}`) player.triggerEvent(`${weaponId}:bolt`);
  }, ticks(cycle.after));
  system.runTimeout(() => {
    // Only undo our own value (a reload started meanwhile sets krep:ammoreload to something else).
    if (player.isValid() && player.getProperty("krep:ammoreload") === cycle.value) player.triggerEvent(`${weaponId}:normal`);
  }, ticks(cycle.after + cycle.seconds));
}

function startTrigger(player, weaponId, weapon) {
  const burst = weapon.fireMode === "burst" ? weapon.burst : undefined;
  triggers.set(player.id, {
    player,
    weaponId,
    weapon,
    held: true,
    // semi: one shot; burst: count shots; auto: until released.
    shotsLeft: weapon.fireMode === "semi" ? 1 : burst ? burst.count : Infinity,
    interval: TICKS_PER_MINUTE / (burst?.rpm ?? weapon.rpm),
    nextShot: Math.max(system.currentTick, triggers.get(player.id)?.readyAt ?? 0),
  });
}

world.afterEvents.itemStartUse.subscribe(({ source: player, itemStack }) => {
  const weapon = getWeaponByItem(itemStack?.typeId);
  if (!weapon?.scriptFiring || itemStack.typeId !== `krep:${weapon.id}`) return;
  if (weapon.aimToFire && !player.isSneaking) return;
  // A bolt / pump still cycling: the press is ignored (the controllers didn't queue it either).
  if (weapon.cycle && system.currentTick < (triggers.get(player.id)?.readyAt ?? 0)) return;
  startTrigger(player, weapon.id, weapon);
});

world.afterEvents.itemStopUse.subscribe(({ source: player }) => {
  const trigger = triggers.get(player.id);
  if (trigger) trigger.held = false;
});

system.runInterval(() => {
  const now = system.currentTick;
  for (const [id, trigger] of triggers) {
    const { player, weaponId, weapon } = trigger;
    const done = () => {
      // Remember when the gun may fire again so a quick re-press can't beat the fire rate.
      const burst = weapon.fireMode === "burst" ? weapon.burst : undefined;
      triggers.set(id, { readyAt: Math.max(trigger.nextShot, burst ? now + burst.delay * 20 : trigger.nextShot), done: true });
    };
    if (trigger.done) {
      if (now >= trigger.readyAt) triggers.delete(id);
      continue;
    }
    if (!player.isValid() || heldTypeId(player) !== `krep:${weaponId}`) {
      triggers.delete(id);
      continue;
    }
    // Auto stops when the button is released; semi and burst finish their shots.
    if (trigger.shotsLeft === Infinity && !trigger.held) {
      done();
      continue;
    }
    if (RELOADING.includes(player.getComponent("minecraft:mark_variant")?.value) ) continue;
    if (now < trigger.nextShot) continue;
    const fired = fireRound(player, trigger);
    trigger.shotsLeft--;
    // Keep the rhythm (810 rpm = a shot every 1.48 ticks) but never bank shots while waiting.
    trigger.nextShot = Math.max(trigger.nextShot + trigger.interval, now + 1);
    if (weapon.cycle) trigger.nextShot = Math.max(trigger.nextShot, now + cycleTicks(weapon.cycle));
    if (!fired || trigger.shotsLeft <= 0) done();
  }
}, 1);
