import { Player, system, world } from "@minecraft/server";

// =====================================================
// TACZ ATTACHMENT STATE
//
// Persistent attachment format per supported gun:
// stock,grip,laser,muzzle,magazine
//
// The dynamic-property string remains unchanged for compatibility with
// the existing attachment UI. This module provides readable access and
// avoids reparsing/reapplying the same state every 2 ticks.
// =====================================================

export const ATTACHMENT_WEAPONS = Object.freeze([
  { normal: "krep:mp5", empty: "krep:mp5_emp", key: "krep_mp5" },
  { normal: "krep:vector", empty: "krep:vector_emp", key: "krep_vector" },
  { normal: "krep:g17", empty: "krep:g17_emp", key: "krep_g17" },
  { normal: "krep:akm", empty: "krep:akm_emp", key: "krep_akm" },
  { normal: "krep:m4a1", empty: "krep:m4a1_emp", key: "krep_m4a1" },
  { normal: "krep:hk416", empty: "krep:hk416_emp", key: "krep_hk416" },
  { normal: "krep:deagleg", empty: "krep:deagleg_emp", key: "krep_deagleg" },
  { normal: "krep:db", empty: "krep:db_emp", key: "krep_db" },
  { normal: "krep:fal", empty: "krep:fal_emp", key: "krep_fal" },
  { normal: "krep:mk14", empty: "krep:mk14_emp", key: "krep_mk14" },
  { normal: "krep:qbz191", empty: "krep:qbz191_emp", key: "krep_qbz191" },
]);

const BY_ITEM = new Map();
for (const entry of ATTACHMENT_WEAPONS) {
  BY_ITEM.set(entry.normal, entry);
  BY_ITEM.set(entry.empty, entry);
}

// WeakMap avoids holding disconnected/respawned Player objects in memory.
const appliedStateCache = new WeakMap();

function toAttachmentNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

export function parseAttachmentData(serialized) {
  const values = String(serialized ?? "")
    .split(",")
    .map(toAttachmentNumber);

  return {
    stock: values[0] ?? 0,
    grip: values[1] ?? 0,
    laser: values[2] ?? 0,
    muzzle: values[3] ?? 0,
    magazine: values[4] ?? 0,
  };
}

export function serializeAttachmentData(state) {
  return [
    state.stock ?? 0,
    state.grip ?? 0,
    state.laser ?? 0,
    state.muzzle ?? 0,
    state.magazine ?? 0,
  ].join(",");
}

export function getDynamicPropertyKey(itemTypeId) {
  return BY_ITEM.get(itemTypeId)?.key ?? null;
}

export function isAllowed(itemTypeId) {
  return BY_ITEM.has(itemTypeId);
}

export function getAttachmentState(player, itemTypeId) {
  const key = getDynamicPropertyKey(itemTypeId);
  if (!key) return undefined;

  return parseAttachmentData(player.getDynamicProperty(key));
}

export function setAksesoris(player, itemTypeId, changes = {}) {
  const key = getDynamicPropertyKey(itemTypeId);
  if (!key) return;

  const current = parseAttachmentData(player.getDynamicProperty(key));
  const next = {
    stock: changes.stock ?? current.stock,
    grip: changes.grip ?? current.grip,
    laser: changes.laser ?? current.laser,
    muzzle: changes.muzzle ?? current.muzzle,
    magazine: changes.magazine ?? current.magazine,
  };

  player.setDynamicProperty(key, serializeAttachmentData(next));

  // Force the visual sync loop to apply the new state on its next pass.
  appliedStateCache.delete(player);
}

// Preserve the original convenience method used by existing code.
Player.prototype.setAksesoris = function (itemTypeId, changes) {
  setAksesoris(this, itemTypeId, changes);
};

function applyVisualProperties(player, state) {
  if (player.getProperty("krep:stock") !== state.stock) {
    player.setProperty("krep:stock", state.stock);
  }
  if (player.getProperty("krep:grip") !== state.grip) {
    player.setProperty("krep:grip", state.grip);
  }
  if (player.getProperty("krep:laser") !== state.laser) {
    player.setProperty("krep:laser", state.laser);
  }
  if (player.getProperty("krep:muzzle") !== state.muzzle) {
    player.setProperty("krep:muzzle", state.muzzle);
  }
  if (player.getProperty("krep:magazine") !== state.magazine) {
    player.setProperty("krep:magazine", state.magazine);
  }
}

system.runInterval(() => {
  for (const player of world.getPlayers()) {
    const equippable = player.getComponent("minecraft:equippable");
    const mainhand = equippable?.getEquipment("Mainhand");
    const itemTypeId = mainhand?.typeId;
    const key = itemTypeId ? getDynamicPropertyKey(itemTypeId) : null;

    if (!key) {
      appliedStateCache.delete(player);
      continue;
    }

    const serialized = String(player.getDynamicProperty(key) ?? "");
    const cached = appliedStateCache.get(player);

    if (
      cached?.itemTypeId === itemTypeId &&
      cached?.key === key &&
      cached?.serialized === serialized
    ) {
      continue;
    }

    const state = parseAttachmentData(serialized);
    applyVisualProperties(player, state);
    appliedStateCache.set(player, { itemTypeId, key, serialized });
  }
}, 2);
