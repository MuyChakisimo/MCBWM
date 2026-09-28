import { world, system } from "@minecraft/server";
import { processGunHit } from "./damage.js";
import { getWeapon } from "../config/weapons.js";

// Physical bullets: guns with firing: "projectile" (shotguns, RPG) spawn a bullet:<id> entity.

// A bullet hitting an entity deals that gun's damage.
world.afterEvents.projectileHitEntity.subscribe((event) => {
  const { projectile, source, location } = event;
  processGunHit({
    source,
    target: event.getEntityHit().entity,
    hitLocation: location,
    weaponId: projectile.typeId.replace("bullet:", ""),
  });
});

// Bullets are removed 10 ticks after spawning so misses don't linger.
const bulletNamespace = "bullet:";
world.afterEvents.entitySpawn.subscribe((event) => {
  const bullet = event.entity;
  if (!bullet || !bullet.typeId.startsWith(bulletNamespace)) return;
  if (!getWeapon(bullet.typeId.replace(bulletNamespace, ""))) return;
  system.runTimeout(() => {
    try {
      bullet.runCommandAsync("kill @s").catch(() => {});
    } catch (error) {}
  }, 10);
});
