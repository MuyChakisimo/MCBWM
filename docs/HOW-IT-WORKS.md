# How it works

What happens, step by step, for each thing a gun does, and which file does each step. Use it to find where to look
when something breaks. `<id>` is a gun's id (`m4a1`); `README.md` lists every file per gun and the config files.

- **BP** = behavior pack `TACZ-B/` (runs on the server: logic, ammo, damage).
- **RP** = resource pack `TACZ-R/` (runs on each player's game: models, animations, sounds, HUD text styling).

The two packs talk through a few values on the player:

| Value | Set by (BP) | Read by | Meaning |
|---|---|---|---|
| scoreboard `<id>` | `combat/firing.js`, `combat/reload.js` | scripts, HUD, `combat/inspect.js` (full magazine = inspect) | rounds in the magazine |
| `q.mark_variant` | events `krep:reload` (1), `krep:reloadtac` (2), `krep:noreload` (0) | RP gun controller | reloading: 1 empty reload, 2 tactical |
| `q.skin_id` | `krep:inspect` (1), `krep:noinspect` (0), `krep:view` (2) | RP gun controller | 1 inspecting, 2 attachment preview |
| property `krep:ammoreload` | `combat/reload.js`, `combat/firing.js` (bolt / pump events) | RP gun controllers | reload / bolt / shell state the RP animations follow (0 = none) |
| properties `krep:stock/grip/laser/muzzle/magazine` | `attachments/attachmentState.js` | RP render controllers | fitted attachments, shown on the model |
| property `krep:bulletcache` | `items/storedAmmoDisplay.js` | RP (Evolys, M249, M1014) | rounds shown on the gun model |
| RP variables `v.<id>`, `v.<id>b`, `v.<id>emp` | `player.entity.json` `pre_animation`, from the player property `krep:held` (`items/heldGun.js`, numbers in `config/held.js`) | RP controllers, render controllers | holding the gun (any / loaded / empty item) |

The gun is two items: `krep:<id>` (loaded) and `krep:<id>_emp` (empty). The scripts swap them when the magazine
runs out or is reloaded.

## Controls

| Input | Loaded gun (`<id>`) | Empty gun (`<id>_emp`) |
|---|---|---|
| hold use (right click) | fire | empty reload |
| attack / swing (left click) | tactical reload if the magazine isn't full; inspect if it is | empty inspect |
| sneak | aim down sights (ADS); a magnifying sight zooms (`combat/aimZoom.js`) | |

Chat commands (no cheats needed): `/tacz:hitmarker on|off` (this player; no value = server default) and, for
operators or the server console, `/tacz:hitmarkerdefault on|off` (`combat/hitMarker.js`).

## Firing a shot

`combat/firing.js` (every gun has `scriptFiring: true` in `config/weapons.js`) starts on the use
button (`itemStartUse` on `krep:<id>`) and fires at the gun's `rpm` in its `fireMode` (auto while held, semi one per
press, burst `burst.count` per press) until the button is released, the gun is switched, or the magazine is empty.
Per-gun extras (`cycle`, `roundInItem`, `aimToFire`, `capByMagazine`) are described at the top of firing.js. Each shot:

1. Scoreboard `<id>` minus one (capped at magazine + 1 chambered; a gun's first use ever starts full: `roundsOf`),
   the ammo HUD, the rounds on the model (`items/storedAmmoDisplay.js`).
2. `playsound <shootSound or id>.shoot` (`.suppress` with `krep:muzzle` >= `suppressedFrom`), the muzzle flash light
   (`combat/muzzleLight.js`, not when silenced), the shoot animation (`shootAnimation.ads` / `.hip`, default
   `animation.<id>.shoot.sight` when sneaking, else `.nsight`).
3. `shoot()` in `combat/hitscan.js`:
   - `combat/recoil.js` `applyRecoil()`: `camera.addShake` from the gun's `recoil`, reduced by fitted attachments
     (`config/recoil.js`), scaled by `COMBAT.recoilMultiplier`.
   - One ray per pellet (`pellets`, scattered by `spread`): breaks glass/panes/wheat on the way
     (`HITSCAN.breakableBlocks`), stops at the first other block, hits the nearest living entity before it
     (`HITSCAN.range`).
   - `combat/damage.js` `applyGunHits()`: per pellet, `damage` x `falloff` at that distance x `headshot` (within
     `COMBAT.headshotRadius` of the head) x armor reduction (`combat/armor.js`, `penetration`); a target takes the
     sum at once, with one hurt flash, one hit/kill sound and the hit marker (`combat/hitMarker.js`).
   - Guns with `explosion` (RPG, M320): an explosion and splash damage where the shot lands.
   - `combat/shotEffects.js`: smoke tracer and impact puff.

The last round, or pressing fire with none left, swaps to `krep:<id>_emp` ("No Ammunition") and starts the empty
reload. No shots during a reload (`mark_variant` 1 or 2).

**The minigun** (script-fired since v1.33.11; options `boxAmmo`, `spinUp`, `heat` in weapons.js): a press needs an
ammo box (`krep:ammobox`; `krep:ammoboxc` or creative mode = unlimited), plays `minigun.windup` and fires 0.3 s
later, 20 shots a second, each taking one round from the scoreboard `win308` (the box's rounds, filled by using
.308 rounds: `items/ammoBox308.js`). `combat/heat.js`: each shot adds 1 to `minigunoverheat` (%); held and not
firing it cools 1 every 2 ticks; at 100 the item becomes `krep:minigun_emp` and the overheat animation plays
(`krep:reload`, mark variant 1) for 2.5 s; at 2.4 s it is `krep:minigun` again at 75. HUD: `functions/minigun`
(rounds - heat%). Until v1.33.9 every gun had a BP controller (`setup1` refilled the magazine the first time the gun
was held after each join, `setup` ran the HUD function, `<id>.31` swapped a 0-round gun to `_emp`); the minigun's
(`animation_controllers/gun_minigun.json`) went in v1.33.11. firing.js, reload.js and heat.js do those now.

## Reloading

`combat/reload.js` (guns with `scriptReload`: all but the minigun, which overheats instead; per-gun options are described in reload.js).
Empty reload: starts by itself 0.25 s after the last round, or use with `krep:<id>_emp`. Tactical: a left click (the
`playerSwingStart` event, attack or mine swings only; until v1.33.12 a BP controller watched the arm swing) with at
least 2 rounds missing. It sets the mark variant the RP reload animations watch, takes the ammo item from the inventory at
`scriptReload.<kind>[0]` seconds (an ammo box: unlimited; creative: free), fills the scoreboard (magazine; tactical
+ 1 chambered), swaps the empty gun back, and ends at `[1]` seconds. Switching guns before the rounds go in cancels
it. Shell-by-shell reloads (`shells`) load one round per cue. Per-magazine reloads (Golden Deagle, Vector) use
`byMagazine`, chosen by `krep:magazine`. A player who left mid-reload comes back with the reload state cleared.

## Ammo HUD

`showAmmo()` in firing.js: actionbar "rounds/magazine + ammo name", or "No Ammunition"; shown on each shot and
reload step and when a gun is taken in hand (`items/heldItem.js`). Guns whose capacity depends on the magazine
(`capByMagazine`: Golden Deagle, Vector) use their `functions/<id>.mcfunction` ("/20+10" ...).
`scripts/items/ammoScoreboards.js` creates the scoreboard objectives once when the world loads.

## Inspect

1. **Script** `combat/inspect.js` (`playerSwingStart`, left click: attack / mine): with a full magazine (per fitted
   magazine for the Vector / Golden Deagle; any swing for the RPG-type guns and the minigun), or with the empty
   item on guns with `emptyInspect`, not while reloading or in the attachment preview: `krep:inspect` (skin_id 1),
   `krep:noinspect` 2 ticks later. (Until v1.33.12: the BP controller `controller.animation.akm.inspect`, checked
   every tick.)
2. **RP** `animation_controllers/gun_<id>.json`, controller `controller.animation.<id>.fp`, state `inspect`: plays
   `<id>_fp_inspect` (loaded) or `<id>_fp_inspect_emp` (empty; not every gun has one yet, see `NEXT_STEPS.md`).

## What the player sees (first person)

- **RP** `entity/player.entity.json` is the player's client entity: it registers every gun's model (`geometry`),
  texture, animations, sounds (`sound_effects`), particles and render controllers.
- Two models are drawn, moved by the same animations (same bone names):
  - the gun: `models/entity/guns/<id>.geo.json`, drawn by `render_controllers/gun_<id>.json` with
    `textures/gun/<id>.png`;
  - the player's arms: `models/entity/shared/taczuniversal<N>.geo.json` (the gun's bone layout with only the player's
    body cubes), drawn by `render_controllers/shared_player.json` with the player's skin.
- `animation_controllers/gun_<id>.json` (RP) picks the animation: `hold`, `sprint`, `sight` (ADS), `reload`,
  `reloadtac`, `inspect`, `view` (attachment preview); `animation_controllers/shared_draw.json` plays the draw
  when switching guns.
- In every first-person animation, bone `joints` places the gun in view: its position in `fp.hold` is the hold pose,
  the end of `fp.sight` is the aim pose (sight lined up with the camera).
- The arms hang off the gun's hand bones, in one of two layouts (in the gun model and its `taczuniversal<N>`):
  mirrored (`rightArm` under `lefthand_pos`, `leftArm` under `righthand_pos`, arm offsets about ±2; most rifles) or
  own hand (each arm under its own `*_pos` bone, offsets about ±10; P320, AA-12, and since v1.20.0 the M9A4, G17,
  G18, Deagle, Golden Deagle, B93R, Timeless 50). Pistols need the own-hand layout: mirrored, the right arm sits in
  front of the camera and isn't drawn. The arm offsets (`rightArm` / `leftArm` in every `fp` animation) must match
  the layout; `tools/weapons/arm-layout.mjs` switches a gun to own hand with the P320's offsets.
- `attachables/gun_<id>.json` hides the vanilla item sprite (the gun is drawn by the player renderer).

## Sounds

- A shot: BP `playsound <id>.shoot` -> `sounds/sound_definitions.json` -> `sounds/<id>/...ogg`.
- Animation sounds: an animation's `sound_effects` names an effect; it plays only if that name is in
  `player.entity.json` `sound_effects` **and** in `sound_definitions.json`, and the file exists. `check.mjs` checks
  all three.

## Crafting and attachments

- Using a workbench block (`crafting/workbenchBlocks.js`) opens its menu at once: gunsmith (`crafting/gunsmith.js`,
  recipes in `config/weapons.js`), ammo workbench (`crafting/ammoWorkbench.js`, `config/ammo.js`), attachment
  workbench (`attachments/attachmentMenu.js`, `config/attachments.js`). Sneak to place blocks against them.
- Fitted attachments are stored per player and gun (dynamic property `krep_<id>`) and copied to the `krep:stock` ...
  properties while the gun is held (`attachments/attachmentState.js`); the RP render controllers show the parts.
- Sights are entity events (`<id>:acog` ...) that set `krep:<id>scope`.
- Muzzle flash light (`combat/muzzleLight.js`, since v1.33.2): each shot without a silencer puts a
  `minecraft:light_block_15` in the air at the shooter's head for 2 ticks (`MUZZLE_LIGHT` in `config/combat.js`);
  automatic fire extends it instead of placing a new block each shot. Only air is replaced, only its own light
  removed. Lights whose chunk unloaded first (leave, dimension change, server stop) are kept in the world property
  `tacz:muzzle_lights` and removed once their chunk is loaded (v1.33.10).
- Scope zoom (`combat/aimZoom.js`, since v1.33.1): crouching with a magnifying sight eases the camera to
  `SIGHT_ZOOM` in `config/attachments.js` (sniper scope 30, ACOG / ELCAN 50; the game allows 30-110) with
  `camera.setFov`, and back with `camera @s fov_clear`. Not while reloading or working a bolt. It reacts to crouch,
  hotbar and held-item events and to reload / bolt changes (`zoomSoon`), not every tick. Before v1.33.1 zoom was
  an endless Slowness effect from per-gun BP `.scope` controllers (aiming nearly stopped walking).

## Something's wrong: where to look

Run `node tools/weapons/check.mjs` first: it catches missing files, sounds, animations, events and mismatched
magazine sizes.

| Symptom | Look at |
|---|---|
| Gun doesn't fire | `config/weapons.js` `scriptFiring`, `fireMode`, `rpm`; `/scoreboard players list @s` (rounds); `scriptevent tacz:debug on` logs each shot |
| Fires but no damage | script-fired: content log `[TACZ Hitscan]`, `config/weapons.js` entry; content log for `[TACZ firing]` errors |
| Gun fires twice / too fast | `config/weapons.js` `fireMode`/`rpm`/`burst`; `scriptevent tacz:debug start` then `stop` reports the gaps; content log for `combat/firing.js` errors |
| Damage feels off | `weapons.js` `damage`, `falloff`, `headshot`, `penetration`; `combat.js` multipliers |
| Wrong ammo count / reload loads wrong amount | `config/weapons.js` `magazine`, `chamber`, `scriptReload` (`byMagazine` caps); `scriptevent tacz:debug on` logs each reload step |
| Reload takes no ammo | creative mode and the creative ammo box (`krep:ammoboxc`) take none, by design; otherwise `combat/reload.js` `removeItem` |
| HUD shows wrong numbers | `showAmmo()` in `combat/firing.js` (`magazine`); Golden Deagle / Vector: `functions/<id>.mcfunction` |
| A sound doesn't play | `check.mjs`; then the effect name in `player.entity.json` `sound_effects` and `sound_definitions.json` |
| All guns invisible, third-person arms stiff | `TACZ-R/entity/player.entity.json` was rejected: content log; names in its tables must use only letters, digits, `_`, `.` (`check.mjs` checks) |
| Gun invisible / arms missing in first person | model files parse (`check.mjs`); `player.entity.json` render controllers for `<id>` and `universal<N>` |
| Pistol: one hand missing in first person, gun floats | mirrored arm layout (see "What the player sees"); `node tools/weapons/arm-layout.mjs <id>` |
| Sight doesn't line up | `joints` position at the end of `animation.<id>.fp.sight` (RP `animations/guns/<id>.json`) |
| Animation doesn't play | RP `gun_<id>.json` state and its condition; the short name in `player.entity.json` `animations` |
| Menu doesn't open | `crafting/workbenchBlocks.js` (block id), content log |
| Changes don't show up | bump the pack version (both manifests) and update `world_*_packs.json` |

Script errors appear in the content log (Settings > Creator > Content Log, or the server console on a dedicated
server).
