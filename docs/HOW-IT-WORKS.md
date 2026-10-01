# How it works

What happens, step by step, for each thing a gun does, and which file does each step. Use it to find where to look
when something breaks. `<id>` is a gun's id (`m4a1`); `README.md` lists every file per gun and the config files.

- **BP** = behavior pack `TACZ-B/` (runs on the server: logic, ammo, damage).
- **RP** = resource pack `TACZ-R/` (runs on each player's game: models, animations, sounds, HUD text styling).

The two packs talk through a few values on the player:

| Value | Set by (BP) | Read by | Meaning |
|---|---|---|---|
| scoreboard `<id>` | fire / reload commands | BP controllers (`query.scoreboard('<id>')`), HUD | rounds in the magazine |
| `q.mark_variant` | events `krep:reload` (1), `krep:reloadtac` (2), `krep:noreload` (0) | RP gun controller | reloading: 1 empty reload, 2 tactical |
| `q.skin_id` | `krep:inspect` (1), `krep:noinspect` (0), `krep:view` (2) | RP gun controller | 1 inspecting, 2 attachment preview |
| property `krep:ammoreload` | events `<id>reload0..N` | BP reload controller | how many rounds this reload loads (base + N) |
| properties `krep:stock/grip/laser/muzzle/magazine` | `attachments/attachmentState.js` | RP render controllers | fitted attachments, shown on the model |
| property `krep:bulletcache` | `items/storedAmmoDisplay.js` | RP (Evolys, M249, M1014) | rounds shown on the gun model |
| RP variables `v.<id>`, `v.<id>b`, `v.<id>emp` | `player.entity.json` `pre_animation` | RP controllers, render controllers | holding the gun (any / loaded / empty item) |

The gun is two items: `krep:<id>` (loaded) and `krep:<id>_emp` (empty). Commands swap them when the magazine runs
out or is reloaded.

## Controls

| Input | Loaded gun (`<id>`) | Empty gun (`<id>_emp`) |
|---|---|---|
| hold use (right click) | fire | empty reload |
| attack / swing (left click) | tactical reload if the magazine isn't full; inspect if it is | empty inspect |
| sneak | aim down sights (ADS) | |

## Firing a shot

1. **BP** `animation_controllers/gun_<id>.json`, controller `controller.animation.<id>`: while the gun is held, the
   use button is down and the scoreboard `<id>` is at least 1, it enters a shoot state (`<id>.30`, `delay.30` ...).
   On entry: event `@s krep:<id>_fire`, `/function <id>` (HUD), `playsound <id>.shoot`, remove one round,
   `replaceitem ... krep:<id>_emp` and "No Ammunition" when it hits 0. The time until the next shot is the shoot
   state's animation length (this is the fire rate today; `rpm` in `weapons.js` is not applied yet).
2. **BP** `entities/player.json`, event `krep:<id>_fire`: `playanimation ... animation.<id>.shoot...` (the kick
   animation on each client) and `scriptevent tacz:weapon_hitscan <id> ads|hip` (ads = sneaking).
3. **Script** `combat/hitscan.js` receives the scriptevent:
   - `combat/recoil.js` `applyRecoil()`: camera shake from the gun's `recoil`, reduced by fitted attachments
     (`config/recoil.js`), scaled by `COMBAT.recoilMultiplier`.
   - One ray per pellet (`pellets`, scattered by `spread`): breaks glass/panes/wheat on the way
     (`HITSCAN.breakableBlocks`), stops at the first other block, hits the nearest living entity before it
     (`HITSCAN.range`).
   - `combat/damage.js` `applyGunHits()`: per pellet, `damage` x `falloff` at that distance x `headshot` (within
     `COMBAT.headshotRadius` of the head) x armor reduction (`combat/armor.js`, `penetration`); a target takes the
     sum at once, with one hurt flash and one hit/kill sound.
   - Guns with `explosion` (RPG): an explosion and splash damage where the shot lands.
   - `combat/shotEffects.js`: smoke tracer and impact puff.

## Reloading

1. **BP** `animation_controllers/gun_<id>.json`, controller `controller.animation.<id>.reload`, state `setup`:
   - `trigger.reload`: holding `<id>_emp` and using it (empty reload);
   - `trigger.tac`: holding `<id>` and swinging with the magazine below full (tactical reload).
2. On entry: `/function <id>quantity` (`functions/<id>quantity.mcfunction`) counts the ammo item in the inventory
   (`hasitem` checks) and runs event `<id>reload<N>` (`player.json`), which sets `krep:ammoreload` to base + N
   (base alone = no ammo: the controller goes back to `setup` and the HUD says "No ...").
3. States `reload` / `reload.tac` play the BP animation `animations/guns/<id>.json` (`animation.<id>.reload`,
   `.reload.tac`) and send `@s krep:reload` / `krep:reloadtac`, so the RP plays the reload animation. Its
   timeline, near the end:
   - `/function <id>reload` (`functions/<id>reload.mcfunction`): `clear` the right number of rounds from the
     inventory (skipped with an ammo box);
   - event `krep:<id>_reload` (`player.json`): adds N to the scoreboard;
   - `replaceitem ... krep:<id>` (back to the loaded item) and `/function <id>` (HUD).
4. `reloadfinish` -> `krep:noreload`.

Per-magazine reloads (Golden Deagle, Vector) have one reload animation per magazine size, chosen by
`q.property('krep:magazine')`. Tube-fed shotguns (`reload: "single"`) load one shell per cycle.

## Ammo HUD

`functions/<id>.mcfunction`: `titleraw` actionbar "rounds/magazine + ammo name", or "No Ammunition". Run by the
fire and reload controllers (not every tick). `scripts/items/ammoScoreboards.js` creates the scoreboard objectives
once when the world loads.

## Inspect

1. **BP** `animation_controllers/shared_inspect.json`: swinging with a full magazine (`trigger.inspect`) or with the
   empty item (`trigger.inspect.emp`) sends `krep:inspect` (skin_id 1); `animations/shared/inspectdelay.json`
   sends `krep:noinspect` afterwards.
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

## Something's wrong: where to look

Run `node tools/weapons/check.mjs` first: it catches missing files, sounds, animations, events and mismatched
magazine sizes.

| Symptom | Look at |
|---|---|
| Gun doesn't fire | BP `gun_<id>.json` shoot transitions (scoreboard `<id>` >= 1?); `/scoreboard players list @s` |
| Fires but no damage | `player.json` `krep:<id>_fire` has `scriptevent tacz:weapon_hitscan <id>`; `config/weapons.js` entry; content log for `[TACZ Hitscan]` errors |
| Damage feels off | `weapons.js` `damage`, `falloff`, `headshot`, `penetration`; `combat.js` multipliers |
| Wrong ammo count / reload loads wrong amount | `functions/<id>quantity.mcfunction`, `<id>reload.mcfunction`, `player.json` `<id>reload<N>` and `krep:<id>_reload`; `check.mjs` compares them to `magazine` |
| Reload takes no ammo | `<id>reload.mcfunction` covers every score (per-magazine guns: the right reload animation plays for the fitted magazine) |
| HUD shows wrong numbers | `functions/<id>.mcfunction` |
| A sound doesn't play | `check.mjs`; then the effect name in `player.entity.json` `sound_effects` and `sound_definitions.json` |
| All guns invisible, third-person arms stiff | `TACZ-R/entity/player.entity.json` was rejected: content log; names in its tables must use only letters, digits, `_`, `.` (`check.mjs` checks) |
| Gun invisible / arms missing in first person | model files parse (`check.mjs`); `player.entity.json` render controllers for `<id>` and `universal<N>` |
| Sight doesn't line up | `joints` position at the end of `animation.<id>.fp.sight` (RP `animations/guns/<id>.json`) |
| Animation doesn't play | RP `gun_<id>.json` state and its condition; the short name in `player.entity.json` `animations` |
| Menu doesn't open | `crafting/workbenchBlocks.js` (block id), content log |
| Changes don't show up | bump the pack version (both manifests) and update `world_*_packs.json` |

Script errors appear in the content log (Settings > Creator > Content Log, or the server console on a dedicated
server).
