import { profileCount } from "../debug/profiler.js";
import { createLogger } from "../debug/logger.js";

const log = createLogger("PhysicalFire");

const PROJECTILES = Object.freeze({
  m320: Object.freeze({ typeId: "bullet:m320", impulse: 3.0 }),
});

export function firePhysicalWeapon(shooter, weapon) {
  const projectile = PROJECTILES[weapon.id];
  if (!projectile) return false;

  const direction = shooter.getViewDirection();
  const head = shooter.getHeadLocation?.() ?? {
    x: shooter.location.x,
    y: shooter.location.y + 1.6,
    z: shooter.location.z,
  };

  const spawn = {
    x: head.x + direction.x * 0.8,
    y: head.y + direction.y * 0.8,
    z: head.z + direction.z * 0.8,
  };

  const entity = shooter.dimension.spawnEntity(projectile.typeId, spawn);
  try {
    entity.applyImpulse({
      x: direction.x * projectile.impulse,
      y: direction.y * projectile.impulse,
      z: direction.z * projectile.impulse,
    });
  } catch (error) {
    log.error(`Impulse failed for ${projectile.typeId}:`, error);
  }

  profileCount("physicalProjectiles");
  return true;
}
