import { profileCount } from "../debug/profiler.js";

// =====================================================
// TACZ BULLET BLOCK IMPACT
//
// Legacy physical bullets could break fragile blocks such as glass.
// Hitscan preserves that behavior without spawning projectile entities.
//
// Shotguns intentionally apply this rule to the center/visual ray only.
// Their 12 gameplay pellet rays remain entity-only for performance.
// =====================================================

function isFragileBulletBlock(typeId) {
  if (!typeId) return false;

  return (
    typeId === "minecraft:glass" ||
    typeId === "minecraft:glass_pane" ||
    typeId === "minecraft:wheat" ||
    typeId.endsWith("_stained_glass") ||
    typeId.endsWith("_stained_glass_pane")
  );
}

export function applyBulletBlockImpact(blockHit, weapon) {
  if (!weapon?.breakFragileBlocks || !blockHit?.block) {
    return false;
  }

  try {
    if (!isFragileBulletBlock(blockHit.block.typeId)) {
      return false;
    }

    blockHit.block.setType("minecraft:air");
    profileCount("fragileBlocksBroken");
    return true;
  } catch (error) {
    console.error("[TACZ Block Impact] Failed to break fragile block:", error);
    return false;
  }
}
