// =====================================================
// TACZ RUNTIME DIAGNOSTICS
//
//   /scriptevent tacz:debug on      enable debug logging + weapon-change watch
//   /scriptevent tacz:debug off     disable
//   /scriptevent tacz:debug state   print the caller's weapon / render state
//
// Everything here is inert until "on": no interval exists while debug is
// off, so release builds pay nothing for it. Output goes to the content log
// (console) and, for "state", to the caller's chat.
//
// "state" shows exactly what the client renderer keys on: the held item
// name (what query.get_equipped_item_name sees), the registry entry, the
// script-side player state and every synchronised krep:* property the
// resource pack reads.
// =====================================================
import { system, world } from "@minecraft/server";
import { WEAPONS } from "../config/weapons.js";
import { getPlayerState } from "../players/playerState.js";
import { getMainhandItem, weaponIdFromItem } from "../players/heldWeapon.js";
import { getWeaponAttachments } from "../attachments/modular.js";
import { createLogger, isDebugEnabled, setDebugEnabled } from "./logger.js";

const log = createLogger("Diagnostics");
const WATCH_INTERVAL_TICKS = 5;

// Properties the resource pack reads via q.property (see player.entity.json,
// render controllers and animations). Keep in sync with entities/player.json.
const RENDER_PROPERTIES = Object.freeze([
  "krep:stock", "krep:grip", "krep:laser", "krep:muzzle", "krep:magazine",
  "krep:bulletcache", "krep:bulletcachemk2", "krep:ammoreload",
  "krep:akmscope", "krep:m4a1scope", "krep:hk416scope", "krep:awpscope",
  "krep:m107scope", "krep:mp5scope", "krep:vectorscope", "krep:falscope",
  "krep:qbz191scope", "krep:mk14scope",
]);

let watchHandle;
const lastHeld = new Map();

function describeHeld(player) {
  const item = getMainhandItem(player);
  const weaponId = weaponIdFromItem(item);
  const weapon = weaponId ? WEAPONS[weaponId] : undefined;
  return { item: item?.typeId ?? "(empty)", weaponId, weapon };
}

function buildStateReport(player) {
  const { item, weaponId, weapon } = describeHeld(player);
  const state = getPlayerState(player);
  const props = [];
  for (const name of RENDER_PROPERTIES) {
    try {
      const value = player.getProperty(name);
      if (value !== undefined && value !== 0 && value !== "nothing") props.push(`${name}=${value}`);
    } catch (error) {
      props.push(`${name}=<ERROR ${error?.message ?? error}>`);
    }
  }
  const lines = [
    `§e[TACZ debug] ${player.name}`,
    `held item: ${item}  (Molang get_equipped_item_name = '${item.replace(/^[^:]*:/, "")}')`,
    `registry: ${weapon ? `${weapon.id} fireMode=${weapon.fireMode} modularInput=${Boolean(weapon.modularInput)} hitscan=${Boolean(weapon.hitscan)}` : weaponId ? `NOT REGISTERED (${weaponId})` : "-"}`,
    `render path: ${weapon?.modularInput ? "controller.render.java_import_weapon (Java import)" : weapon ? `controller.render.${weaponId} + universal first-person RC (legacy)` : "vanilla item renderer"}`,
    `state: weaponId=${state.weaponId ?? "-"} firing=${state.firing} reloading=${state.reloading}${state.reloadWeaponId ? `(${state.reloadWeaponId})` : ""}`,
    `attachments: ${weapon?.modularInput ? JSON.stringify(getWeaponAttachments(player, weapon.id)) : "(legacy: see krep:* properties)"}`,
    `properties: ${props.length ? props.join(" ") : "(all default)"}`,
  ];
  return lines.join("\n");
}

function watchHeldWeapons() {
  for (const player of world.getPlayers()) {
    const item = getMainhandItem(player)?.typeId ?? "";
    if (lastHeld.get(player.id) === item) continue;
    lastHeld.set(player.id, item);
    log.debug("held item", player.name, item || "(empty)");
  }
}

function setEnabled(enabled) {
  setDebugEnabled(enabled);
  if (enabled && watchHandle === undefined) {
    watchHandle = system.runInterval(watchHeldWeapons, WATCH_INTERVAL_TICKS);
  } else if (!enabled && watchHandle !== undefined) {
    system.clearRun(watchHandle);
    watchHandle = undefined;
    lastHeld.clear();
  }
  log.warn(`debug ${enabled ? "enabled" : "disabled"}`);
}

system.afterEvents.scriptEventReceive.subscribe((event) => {
  if (event.id !== "tacz:debug") return;
  const command = (event.message ?? "").trim().toLowerCase() || "state";
  const source = event.sourceEntity;

  if (command === "on" || command === "off") {
    setEnabled(command === "on");
    source?.sendMessage?.(`TACZ debug ${command}`);
    return;
  }

  if (command === "state") {
    const players = source?.typeId === "minecraft:player" ? [source] : world.getPlayers();
    for (const player of players) {
      const report = buildStateReport(player);
      console.warn(report.replace(/§./g, ""));
      if (source?.sendMessage) source.sendMessage(report);
    }
    return;
  }

  source?.sendMessage?.("usage: /scriptevent tacz:debug on|off|state");
});

log.debug("diagnostics loaded", `debug=${isDebugEnabled()}`);
