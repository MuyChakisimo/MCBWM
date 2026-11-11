import { system, world, EasingType, InputPermissionCategory } from "@minecraft/server";
import { RAGDOLL } from "../config/combat.js";

// Player death ragdoll (our own, 2026-11-08). damage.js calls startRagdoll() instead of setting a player's health
// to 0. The body is the player entity itself (so it keeps the player's own skin): for RAGDOLL.seconds the player is
// kept alive, frozen and unhurtable while two entity properties tell every client how to animate the fall:
//   krep:rd_dir  0 = not ragdolled; else 1 + the fall direction in degrees relative to the body
//                (0 forward, 90 to the body's right, 180 backward, 270 left)
//   krep:rd_var  packed: bit 0 headshot | bits 1-3 strength 0-7 | bits 4-8 random seed 0-31 | bits 9-11 how far the
//                body can tip (0-7, 7 = flat on the ground; less when a wall is right behind the fall)
// The client side is animation.tacz.ragdoll (TACZ-R/animations/tacz_ragdoll.animation.json): fall, bounce and
// limb swing computed in Molang from those numbers at full frame rate, so it costs the server nothing per tick.
// Then the real death lands (health 0, so the kill sound / marker already played for the shooter stay right).

/** Per player id: { player, timeout }. */
const active = new Map();

export const isRagdolled = (entity) => active.has(entity?.id);

const DIR = "krep:rd_dir";
const VAR = "krep:rd_var";

function flat(v) {
  const length = Math.hypot(v.x, v.z);
  return length < 1e-6 ? { x: 0, z: 1 } : { x: v.x / length, z: v.z / length };
}

/** 0-7: how far the body may tip toward `dir` before a block stops it (7 = all the way down). */
function tipRoom(player, dir) {
  const { dimension, location } = player;
  for (const [distance, room] of [[0.8, 1], [1.6, 4]]) {
    for (const height of [0.4, 1.4]) {
      try {
        const block = dimension.getBlock({ x: location.x + dir.x * distance, y: location.y + height, z: location.z + dir.z * distance });
        if (block && !block.isAir && !block.isLiquid) return room;
      } catch {
        return 7;
      }
    }
  }
  return 7;
}

function setPose(player, dir, packed) {
  try {
    player.setProperty(DIR, dir);
    player.setProperty(VAR, packed);
  } catch {
    // not our player definition (another pack's player.json won): no ragdoll
  }
}

function setInput(player, allowed) {
  for (const category of [InputPermissionCategory.Movement, InputPermissionCategory.Camera]) {
    try {
      player.inputPermissions.setPermissionCategory(category, allowed);
    } catch {
      // older API: the player can still look around
    }
  }
}

/**
 * Knocks a player down instead of killing them now. `direction` = the shot's direction (shooter -> hit point).
 * Returns false when the ragdoll is off or can't start (the caller then kills normally).
 */
export function startRagdoll(player, { direction, headshot = false, damage = 10, test = false }) {
  if (!RAGDOLL.enabled || active.has(player.id)) return active.has(player.id);
  try {
    const forward = flat(player.getViewDirection());
    const right = { x: -forward.z, z: forward.x };
    const fall = flat(direction);
    const relative = Math.atan2(fall.x * right.x + fall.z * right.z, fall.x * forward.x + fall.z * forward.z) * (180 / Math.PI);
    const dir = 1 + Math.round((relative + 360) % 360) % 360;
    const strength = Math.max(0, Math.min(7, Math.round(damage / 4)));
    const seed = Math.floor(Math.random() * 32);
    setPose(player, dir, (headshot ? 1 : 0) + strength * 2 + seed * 16 + tipRoom(player, fall) * 512);

    const ticks = Math.round(RAGDOLL.seconds * 20);
    player.addEffect("resistance", ticks + 10, { amplifier: 255, showParticles: false });
    setInput(player, false);

    // Camera: behind the fall and up, looking at where the body lands.
    const at = player.location;
    const { back, up, ease } = RAGDOLL.camera;
    try {
      player.camera.setCamera("minecraft:free", {
        location: { x: at.x - fall.x * back, y: at.y + up, z: at.z - fall.z * back },
        facingLocation: { x: at.x + fall.x * 1.1, y: at.y + 0.3, z: at.z + fall.z * 1.1 },
        easeOptions: { easeTime: ease, easeType: EasingType.OutQuad },
      });
    } catch {
      // camera is cosmetic
    }

    const timeout = system.runTimeout(() => finish(player.id, !test), ticks);
    active.set(player.id, { player, timeout });
    return true;
  } catch (error) {
    console.warn(`[TACZ ragdoll] start failed: ${error}`);
    finish(player.id, false);
    return false;
  }
}

/** Ends the ragdoll; `kill` = now let the death land. The pose stays until respawn (no stand-up before dying). */
function finish(playerId, kill) {
  const entry = active.get(playerId);
  active.delete(playerId);
  const player = entry?.player;
  if (!player?.isValid) return;
  try {
    player.removeEffect("resistance");
  } catch {}
  setInput(player, true);
  try {
    player.camera.clear();
  } catch {}
  if (kill) {
    try {
      player.getComponent("minecraft:health")?.setCurrentValue(0);
    } catch (error) {
      console.warn(`[TACZ ragdoll] kill failed: ${error}`);
    }
  } else {
    setPose(player, 0, 0);
  }
}

// Respawn / join: standing again, controls and camera back (also cleans up after a server stop mid-ragdoll).
world.afterEvents.playerSpawn.subscribe(({ player }) => {
  setPose(player, 0, 0);
  setInput(player, true);
  try {
    player.camera.clear();
  } catch {}
});

// Died some other way while down (/kill, void): forget it.
world.afterEvents.entityDie.subscribe(({ deadEntity }) => {
  const entry = active.get(deadEntity.id);
  if (!entry) return;
  system.clearRun(entry.timeout);
  active.delete(deadEntity.id);
}, { entityTypes: ["minecraft:player"] });

world.afterEvents.playerLeave.subscribe(({ playerId }) => {
  const entry = active.get(playerId);
  if (entry) system.clearRun(entry.timeout);
  active.delete(playerId);
});

// Test without a second player (works in creative): "/scriptevent tacz:ragdoll" knocks you down in a random
// direction and you get back up; "/scriptevent tacz:ragdoll head" = headshot, "... strong" = a big hit.
system.afterEvents.scriptEventReceive.subscribe(({ id, message, sourceEntity }) => {
  if (id !== "tacz:ragdoll" || sourceEntity?.typeId !== "minecraft:player") return;
  const angle = Math.random() * Math.PI * 2;
  startRagdoll(sourceEntity, {
    direction: { x: Math.cos(angle), y: 0, z: Math.sin(angle) },
    headshot: message.includes("head"),
    damage: message.includes("strong") ? 28 : 10,
    test: true,
  });
});
