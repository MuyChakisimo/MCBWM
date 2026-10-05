import { world, system, EasingType, EquipmentSlot } from "@minecraft/server";
import { getWeaponByItem } from "../config/weapons.js";
import { SIGHT_ZOOM, ZOOM_EASE, javaScopeFov } from "../config/attachments.js";
import { javaZoom } from "../attachments/javaAttachments.js";
import { onHeldChange } from "../items/heldItem.js";

// Scope zoom and crosshair (below). Zoom: while a player aims (crouches) with a gun whose fitted sight magnifies (SIGHT_ZOOM in
// config/attachments.js), the camera eases to that field of view; otherwise back to the player's own.
// Not during a reload (q.mark_variant 1 / 2) or while a bolt is being worked (the gun's cycle value in
// krep:ammoreload), as the BP scope controllers did. Replaces their Slowness effect (v1.33.1): aiming walks at
// crouch speed instead of crawling.
// Checked only when something changes (crouch; held item via items/heldItem.js; reload / bolt via zoomSoon), never
// per tick.

/** Per player: the field of view we set (undefined = the player's own). */
const applied = new Map();

function wantedFov(player) {
  if (!player.isSneaking) return undefined;
  const typeId = player.getComponent("minecraft:equippable")?.getEquipment(EquipmentSlot.Mainhand)?.typeId;
  const weapon = getWeaponByItem(typeId);
  if (!weapon || typeId === `krep:${weapon.id}_emp`) return undefined; // empty gun: no zoom
  const reload = player.getComponent("minecraft:mark_variant")?.value;
  if (reload === 1 || reload === 2) return undefined;
  if (weapon.cycle && player.getProperty("krep:ammoreload") === weapon.cycle.value) return undefined;
  const zoom = javaZoom(player, weapon.id); // a Java magnified scope
  if (zoom) return javaScopeFov(zoom);
  let sight;
  try {
    sight = player.getProperty(`krep:${weapon.id}scope`); // only guns with sight choices have it
  } catch {
    return undefined;
  }
  return SIGHT_ZOOM[sight];
}

// Crosshair: hidden while aiming (crouching) with a gun, not during a reload; kept for guns with keepCrosshair
// (minigun, M107, M95). Until v1.33.12 a BP controller (controller.animation.universalscope) checked ~110 item
// names for every player every tick.
/** Per player: true while we have the crosshair hidden. */
const hidden = new Map();

function wantsHidden(player) {
  if (!player.isSneaking) return false;
  const weapon = getWeaponByItem(player.getComponent("minecraft:equippable")?.getEquipment(EquipmentSlot.Mainhand)?.typeId);
  if (!weapon || weapon.keepCrosshair) return false;
  const reload = player.getComponent("minecraft:mark_variant")?.value;
  return reload !== 1 && reload !== 2;
}

function updateCrosshair(player) {
  const hide = wantsHidden(player);
  if (hide === (hidden.get(player.id) ?? false)) return;
  try {
    player.runCommand(`hud @s ${hide ? "hide" : "reset"} crosshair`);
    hidden.set(player.id, hide);
  } catch {
    // never break aiming
  }
}

export function updateZoom(player) {
  if (!player?.isValid) return;
  updateCrosshair(player);
  const fov = wantedFov(player);
  if (fov === applied.get(player.id)) return;
  try {
    if (fov !== undefined) player.camera.setFov({ fov, easeOptions: { easeTime: ZOOM_EASE.in, easeType: EasingType.OutQuad } });
    // No script call returns to the player's own field of view; the command does.
    else player.runCommand(`camera @s fov_clear ${ZOOM_EASE.out} out_quad`);
    applied.set(player.id, fov);
  } catch {
    // a failed zoom must never break aiming or firing
  }
}

/** After an entity event (reload, bolt): its new state is read next tick. */
export function zoomSoon(player) {
  system.run(() => updateZoom(player));
}

world.afterEvents.entityStartSneaking.subscribe(({ entity }) => {
  if (entity.typeId === "minecraft:player") updateZoom(entity);
});
world.afterEvents.entityStopSneaking.subscribe(({ entity }) => {
  if (entity.typeId === "minecraft:player") updateZoom(entity);
});
onHeldChange(updateZoom); // also on spawn: a respawned / rejoined player starts with their own field of view

world.afterEvents.playerSpawn.subscribe(({ player, initialSpawn }) => {
  // Joining: start from the player's own field of view (in case they left while zoomed; applied was cleared).
  if (initialSpawn) {
    try {
      player.runCommand(`camera @s fov_clear ${ZOOM_EASE.out} out_quad`);
      player.runCommand("hud @s reset crosshair"); // the BP controller did this on load too
    } catch {
      // never block joining
    }
  }
  // Versions before 1.33.1 zoomed with an endless Slowness (amplifier 6 or 14); clear one left over.
  const slow = player.getEffect("minecraft:slowness");
  if (slow && (slow.amplifier === 6 || slow.amplifier === 14) && slow.duration > 1000000) player.removeEffect("minecraft:slowness");
});
world.afterEvents.playerLeave.subscribe(({ playerId }) => {
  applied.delete(playerId);
  hidden.delete(playerId);
});
