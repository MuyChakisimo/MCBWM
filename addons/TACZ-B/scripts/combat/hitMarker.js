import { system, world, CommandPermissionLevel, CustomCommandParamType, CustomCommandStatus } from "@minecraft/server";

// Hit marker: a white X on the crosshair when a shot hits, red when it kills (damage.js calls showHitMarker).
// It is a title ("tacz:hit" / "tacz:kill") that TACZ-R/ui/hud_screen.json shows as the image instead of text,
// so it fades out by itself. Optional (user, 2026-10-04): on unless the server default is off, and each player
// can choose for themselves:
//   /tacz:hitmarker on | off      this player (no value: back to the server default)
//   /tacz:hitmarkerdefault on | off   the server default (operators and the server console)

const DEFAULT_KEY = "tacz:hitmarker_default"; // world: false = off for players who haven't chosen
const PLAYER_KEY = "tacz:hitmarker"; // player: true / false; unset = the server default
// Ticks: shown at once, held, then faded.
const TIMING = { fadeInDuration: 0, stayDuration: 3, fadeOutDuration: 4 };

function enabledFor(player) {
  const own = player.getDynamicProperty(PLAYER_KEY);
  return typeof own === "boolean" ? own : world.getDynamicProperty(DEFAULT_KEY) !== false;
}

export function showHitMarker(player, kill) {
  try {
    if (enabledFor(player)) player.onScreenDisplay.setTitle(kill ? "tacz:kill" : "tacz:hit", TIMING);
  } catch {
    // a failed marker must never stop the damage
  }
}

const ON_OFF = { name: "tacz:onoff", type: CustomCommandParamType.Enum };

system.beforeEvents.startup.subscribe(({ customCommandRegistry: commands }) => {
  commands.registerEnum("tacz:onoff", ["on", "off"]);
  commands.registerCommand(
    {
      name: "tacz:hitmarker",
      description: "Hit marker on / off for you (no value: the server default)",
      permissionLevel: CommandPermissionLevel.Any,
      cheatsRequired: false,
      optionalParameters: [ON_OFF],
    },
    (origin, value) => {
      const player = origin.sourceEntity;
      if (player?.typeId !== "minecraft:player") return { status: CustomCommandStatus.Failure, message: "Only a player can use this." };
      // Commands run read-only: the change is made right after.
      system.run(() => player.setDynamicProperty(PLAYER_KEY, value === undefined ? undefined : value === "on"));
      return { status: CustomCommandStatus.Success, message: value === undefined ? "Hit marker: server default." : `Hit marker ${value}.` };
    },
  );
  commands.registerCommand(
    {
      name: "tacz:hitmarkerdefault",
      description: "Hit marker on / off for players who haven't chosen",
      permissionLevel: CommandPermissionLevel.GameDirectors,
      cheatsRequired: false,
      mandatoryParameters: [ON_OFF],
    },
    (origin, value) => {
      system.run(() => world.setDynamicProperty(DEFAULT_KEY, value === "on"));
      return { status: CustomCommandStatus.Success, message: `Hit marker server default: ${value}.` };
    },
  );
});
