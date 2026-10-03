import { system, world, EquipmentSlot, ItemStack } from "@minecraft/server";
import { shoot } from "./hitscan.js";
import { getWeaponByItem } from "../config/weapons.js";
import { AMMO } from "../config/ammo.js";

// Script-controlled firing for guns with `scriptFiring: true` in config/weapons.js (being rolled out;
// the other guns still fire from their BP controller, animation_controllers/gun_<id>.json).
//
// Holding the use button on `krep:<id>` fires at the gun's `rpm` in its `fireMode`:
//   "auto"  while the button is held;  "semi"  one shot per press;
//   "burst" `burst.count` shots per press at `burst.rpm`, then `burst.delay` seconds before the next.
// Each shot: removes one round from the scoreboard `<id>`, updates the ammo HUD, plays the shot sound
// and the shoot animation, and runs the hitscan shot (combat/hitscan.js). The last round swaps the
// item to `krep:<id>_emp` (which starts an empty reload) and shows "No Ammunition".
// No shots during a tactical reload (mark variant 2). Reloading itself is still in the BP controllers.

const TICKS_PER_MINUTE = 1200;
const TACTICAL_RELOAD = 2; // q.mark_variant while a tactical reload plays
const SUPPRESSED_MUZZLE = 4; // krep:muzzle values from this up are silencers (`<id>.suppress` sound)

/** Per player: the gun being fired and when its next shot is due. */
const triggers = new Map();

function heldTypeId(player) {
  return player.getComponent("minecraft:equippable")?.getEquipment(EquipmentSlot.Mainhand)?.typeId;
}

// Ammo name for the HUD, e.g. "krep:ammo.name.5_56" (same key as the ammo's lore, ".lore." -> ".name.").
function ammoNameKey(weapon) {
  return AMMO[weapon.ammo?.replace(/^krep:/, "")]?.lore?.replace(".lore.", ".name.");
}

function showAmmo(player, weapon, rounds) {
  const ammoName = ammoNameKey(weapon);
  if (rounds > 0) player.onScreenDisplay.setActionBar({ rawtext: [{ text: `${rounds}/${weapon.magazine} \n` }, ...(ammoName ? [{ translate: ammoName }] : [])] });
  else player.onScreenDisplay.setActionBar("No Ammunition");
}

/** Fires one round if there is one. Returns false when the gun can't fire (empty). */
function fireRound(player, trigger) {
  const { weaponId, weapon } = trigger;
  const objective = world.scoreboard.getObjective(weaponId);
  if (!objective) return false;
  // Never more than a full magazine plus one chambered round (as the BP controllers did).
  const rounds = Math.min(objective.getScore(player) ?? 0, weapon.magazine + 1);
  if (rounds < 1) return false;
  const left = rounds - 1;
  objective.setScore(player, left);
  showAmmo(player, weapon, left);

  const aiming = player.isSneaking;
  const suppressed = (player.getProperty("krep:muzzle") ?? 0) >= (weapon.suppressedFrom ?? SUPPRESSED_MUZZLE);
  // The same command the BP controllers ran (plays at each nearby player, full volume). v1.24.0 used
  // dimension.playSound (a sound placed at the shooter) and some guns were silent.
  player.runCommand(`playsound ${weapon.shootSound ?? weaponId}.${suppressed ? "suppress" : "shoot"} @a[r=30]`);
  // The firing kick (and muzzle flash) every client plays: same as the fire event's playanimation.
  const animation = weapon.shootAnimation?.[aiming ? "ads" : "hip"] ?? `animation.${weaponId}.shoot.${aiming ? "sight" : "nsight"}`;
  player.playAnimation(animation, { nextState: "shoot" });
  shoot(player, weaponId, weapon, aiming ? "ads" : "hip");

  if (left === 0) {
    player.getComponent("minecraft:equippable").setEquipment(EquipmentSlot.Mainhand, new ItemStack(`krep:${weaponId}_emp`, 1));
    return false;
  }
  return true;
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
    if (player.getComponent("minecraft:mark_variant")?.value === TACTICAL_RELOAD) continue;
    if (now < trigger.nextShot) continue;
    const fired = fireRound(player, trigger);
    trigger.shotsLeft--;
    // Keep the rhythm (810 rpm = a shot every 1.48 ticks) but never bank shots while waiting.
    trigger.nextShot = Math.max(trigger.nextShot + trigger.interval, now + 1);
    if (!fired || trigger.shotsLeft <= 0) done();
  }
}, 1);
