# TACZ Bedrock (TACZ-B / TACZ-R)

Minecraft Bedrock weapon add-on (port of TACZ by Akang Krep, v1.0.2 Translated Edition).

| Folder | What |
|---|---|
| `TACZ-B/` | Behavior pack (scripts, items, entities, controllers, functions) |
| `TACZ-R/` | Resource pack (player renderer, models, textures, animations, sounds) |
| `docs/HOW-IT-WORKS.md` | What happens when you fire, reload, inspect, aim; which file does each step; where to look when something breaks |
| `docs/NAMING.md` | Minecraft's naming/format rules (and which tool checks each) and what every name in the packs means |
| `NEXT_STEPS.md` | Current state, what's untested, planned work |
| `tools/weapons/` | `gun.mjs` (clone / remove a gun), `check.mjs` (config vs pack consistency), `java-attach.mjs` (Java attachments onto a gun; see docs/HOW-IT-WORKS.md), `verify-pack.cjs` (proves two pack trees are equivalent) |
| `tools/trace/` | Behavior trace: proves two versions of the scripts make the same Minecraft API calls |
| `reference/` | Not in git (see `.gitignore`): `TACZ-JAVA.zip` (Java TACZ, source for porting guns) and the original Bedrock release. Keep a local copy |

**Pack version is `1.34.3`** for both packs. On a dedicated server set `"version": [1, 34, 3]` for both packs in the
world's `world_behavior_packs.json` / `world_resource_packs.json`. Bump the version whenever you change a pack, or
players and worlds keep using their cached copy.

## Changing weapon stats

Everything the scripts know about a gun is in **`TACZ-B/scripts/config/`**:

| File | What |
|---|---|
| `weapons.js` | Every gun: name, category (`CATEGORIES`: ARs, LMGs, SMGs ... the lore's "Group"), damage, penetration, headshot multiplier, damage falloff by distance, fire mode and rpm (from Java TACZ), recoil (hip/ADS camera shake), shotgun pellets/spread/tracers, RPG explosion, gunsmith recipe, and (for reference) magazine size and ammo. Order = gunsmith menu order. The header explains every field |
| `combat.js` | Rules for all guns: `damageMultiplier` / `recoilMultiplier` (rebalance everything at once), headshot multiplier and radius, armor cap and minimum damage, armor points per material, hitscan range, tracers and breakable blocks |
| `recoil.js` | How much fitted grips, stocks and muzzles reduce recoil (MP5, AKM, FAL, M4A1, HK416, Vector) |
| `ammo.js` | Every ammo item: ammo-workbench recipe, output count, lore text key |
| `attachments.js` | Attachment workbench: which guns take which grips, stocks, lasers, muzzles, magazines and sights |

Damage, penetration, recoil, pellets, recipes, hitscan settings and attachments take effect as soon as the world
reloads. `tools/weapons/check.mjs` also checks that every gun has valid damage, penetration and recoil.
**Magazine size and ammo item** are defined by the behavior pack's JSON; the values in `weapons.js` are there so all
stats are in one place, and `tools/weapons/check.mjs` reports any gun whose pack files disagree (and which file to
edit).

## Script layout (`TACZ-B/scripts/`)

| File | What it does |
|---|---|
| `main.js` | Imports every module below |
| `combat/hitscan.js` | Every gun: `combat/firing.js` calls `shoot()` per shot; applies recoil, then rays from the eyes (one per pellet) find the target, break glass, and explode for the RPG |
| `combat/damage.js` | `applyGunHits()`: headshot, armor reduction, damage summed per target, red hurt flash, hit/kill sounds (`config/combat.js`), hit marker |
| `combat/hitMarker.js` | Hit marker (white X, red on a kill): a `tacz:hit` / `tacz:kill` title that `TACZ-R/ui/hud_screen.json` shows as an image; `/tacz:hitmarker on|off` per player, `/tacz:hitmarkerdefault on|off` (operators) |
| `combat/aimZoom.js` | Scope zoom while aiming: `camera.setFov` to `SIGHT_ZOOM` (`config/attachments.js`); hides the crosshair while aiming (not for `keepCrosshair` guns); event-driven |
| `combat/inspect.js` | Inspect on a left click with a full magazine (or the empty item, `emptyInspect` guns): `krep:inspect` / `krep:noinspect` |
| `combat/heat.js` | Minigun heat: per shot, cooling while held, overheat (`heat` in `config/weapons.js`) |
| `combat/muzzleLight.js` | Muzzle flash light: a light block at the shooter's head for 2 ticks (`MUZZLE_LIGHT` in `config/combat.js`) |
| `combat/shotEffects.js` | Hitscan smoke tracer and impact puff |
| `combat/armor.js` | `getArmor()`: armor a hit target wears (equipment, or `hasitem` tests on mobs, cached 2 s) |
| `combat/recoil.js` | `applyRecoil()`: the gun's camera shake (`camera.addShake`), reduced by fitted attachments (`config/recoil.js`) |
| `crafting/gunsmith.js`, `crafting/ammoWorkbench.js` | Crafting menus built from `config/weapons.js` / `config/ammo.js` |
| `crafting/craftingHelpers.js` | Takes ingredients (only if all are present) and gives the result; `log` accepts any wood |
| `crafting/workbenchBlocks.js` | Using a workbench block opens its menu at once, like a chest (sneak to place blocks against it) |
| `attachments/attachmentMenu.js` | Attachment workbench menus built from `config/attachments.js`: lists the guns the player carries (hotbar or inventory; no need to hold it); Preview takes the gun from the hotbar |
| `attachments/javaAttachments.js` | Java attachments: fitted per player and gun, model numbers to `krep:att_<slot>`, zoom / silencer / recoil (from the generated `config/javaAttachments.js`) |
| `attachments/attachmentState.js` | Per-player attachment storage; syncs the held gun's attachments to the model |
| `items/ammoScoreboards.js` | Creates the scoreboard objectives (loaded rounds per gun, etc.) once on world load |
| `items/itemLore.js` | Lore text on guns and ammo (event-driven; `loredItem()` for items the scripts make) |
| `items/storedAmmoDisplay.js` | Loaded rounds on the Evolys / M249 / M1014 models (`storedAmmoDisplay`) |
| `items/heldGun.js` | The held gun as a number (`krep:held`, from the generated `config/held.js`) for the resource pack |
| `items/heldItem.js` | `onHeldChange()`: tells modules when what a player holds may have changed (no polling) |
| `items/ammoBox308.js` | Storing .308 rounds in an ammo box |

## Pack layout (per weapon)

Every gun `<id>` (the item id without `krep:`) has its own files:

| Pack file | What |
|---|---|
| `TACZ-B/items/guns/<id>/<id>.json`, `<id>_emp.json` | The gun item and its empty-magazine variant |
| (BP) nothing per gun but its items | Since v1.33.9 firing, reloading and the HUD are scripts (`combat/firing.js`, `combat/reload.js`; the minigun's heat `combat/heat.js` since v1.33.11); the minigun keeps its HUD function; Golden Deagle and Vector keep `functions/<id>.mcfunction` (HUD per magazine) |
| `TACZ-B/entities/player.json` | Shared player entity: reload / scope / bolt events |
| `TACZ-R/models/entity/guns/<id>.geo.json` | Gun model |
| `TACZ-R/render_controllers/gun_<id>.json` | Which gun parts/attachments are visible |
| `TACZ-R/animation_controllers/gun_<id>.json` | First-/third-person animation state machines |
| `TACZ-R/animations/guns/<id>.json` | First-/third-person animations |
| `TACZ-R/attachables/gun_<id>.json`, `gun_<id>_emp.json` | Hides the vanilla item sprite (the gun is drawn by the player renderer) |
| `TACZ-R/entity/player.entity.json` | Shared player renderer: registers each gun's model, animations and render controllers |
| `TACZ-R/textures/gun/<id>.png`, `textures/items/<id>.png`, `sounds/<id>/` | Textures and sounds |

Shared files are named `shared_*` / `shared/` (player arms `taczuniversal*`, scopes, walk cycles). Ammo is under
`items/ammo/` and `attachables/ammo_*`.

The ammo HUD is `showAmmo()` in `combat/firing.js` (Golden Deagle / Vector: `functions/<id>.mcfunction`).
There is no `tick.json`: functions run from it have no `@s`, so they did nothing.

### Adding a weapon

Start from the most similar existing gun (same kind, same attachments) and copy it with `tools/weapons/gun.mjs`:

```bash
"$NODE" tools/weapons/gun.mjs clone m4a1 aug --name "AUG" --dry-run   # list what would change
"$NODE" tools/weapons/gun.mjs clone m4a1 aug --name "AUG"
"$NODE" tools/weapons/check.mjs
```

This copies every file of the source gun under the new id (items, both packs' controllers and animations,
functions, model, render controller, attachables, textures, sounds, attachment icons and, if the source has its own,
its first-person arms model `taczuniversal<N>`), and adds the new gun everywhere the source appears in the shared
files: `player.json`, `player.entity.json`, the shared draw/inspect/scope controllers, `shared_player.json`, sound
definitions, lang files, the item catalog and item textures, and its entries in `config/weapons.js`,
`attachments.js` and `recoil.js`. The new gun is an exact working copy (same stats, recipe, sounds and model). Then
replace its model, textures, animations and sounds, and edit its stats and lore. After changing a gun's category, ammo
or damage run `"$NODE" tools/weapons/config-sync.mjs`: it rewrites the lore's Group / Caliber / Damage from the config
(and, for guns ported from Java, their name and description from Java) and puts the gun in its class's creative
inventory group (`CATEGORIES[...].group`; a new group gets a lang key in every lang file). `check.mjs` refuses lore or
groups that disagree. `gun.mjs` also regenerates the held-gun numbers (`tools/weapons/held.cjs`: `config/held.js` and
the `variable.<id>b / emp` lines of `player.entity.json`); run it by hand after adding a gun some other way.

`"$NODE" tools/weapons/gun.mjs remove <id>` removes a gun the same way, and refuses if another gun still uses its
files (for example an animation it borrows); `--force` removes it anyway.

A few things stay shared with the source gun and are listed as "Not copied" when the clone runs: single references
such as the item group's icon (`krep:mp5`), or an animation the source borrows from another gun. Names only one gun
uses, like the RPG's ammo `krep:rpgrocket` or `minigunoverheat`, also stay shared.

The tool stops with an error instead of guessing when it finds a mention of the gun it doesn't understand. It
only renames words that belong to the gun: `fal` in `false` or `m16` in `m16a1` are left alone. Tested by cloning
every gun and removing the clone again (the packs come back byte for byte) and by removing every gun.

Bedrock allows 32 player properties; guns with scopes add one (`krep:<id>scope`), and the tool refuses to go over.

### Porting a gun from Java TACZ

The tested import corrections are applied by `tools/weapons/import-repair.mjs` at the end of the port.
It repairs action timing/recovery, the affected hand layouts, SPAS-12 staged shell reloads, Taurus 943 grip
placement and M320 ADS. Run `node tools/weapons/import-repair.mjs` to apply them to the existing imports
without replacing weapon stats. Run `node tools/weapons/import-repair.test.mjs` for the focused regressions;
visual poses still need testing in Minecraft.

`reference/TACZ-JAVA.zip` must be present. Pick the most similar gun we have as the starting point (same kind of
action and reload), one with its own first-person arms model (not M16/M16A1, Deagle/Golden Deagle, G17/G18,
AKM/Saiga-12 or MP7/FAL, which share one):

```bash
"$NODE" tools/weapons/java-stats.mjs                              # Java stats vs ours, proposed stats for new guns
"$NODE" tools/weapons/java-port.mjs m9a4 m9a4 --from p320 --name "M9A4"
"$NODE" tools/weapons/check.mjs
```

`java-port.mjs` clones the starting gun (`gun.mjs`), removes the attachment system it inherited (menu entries in
`attachments.js` / `recoil.js`, `krep:<id>scope` and the sight events, scope-specific aim animations; all model parts
shown), then replaces:

- the model and first-person arms model with Java's (`java-convert.mjs`): Java's bones under our player skeleton;
  optional parts removed (extended mags, light/heavy stocks and the AR stock adapter, scope mounts and rails)
- the gun texture and inventory icon
- draw, shoot, reload and inspect animations with Java's; an empty inspect is added and wired if the starting gun
  has none. The hold, sprint and aim animations are moved to the pose computed from the Java model's `iron_view`
  bone (`java-convert.mjs --compare` on the SKS: 0.02 blocks from our hand-tuned aim). The draw plays on top of
  the hold, so its hand motion is kept relative to Java's `static_idle`
- the sounds of those animations and the shot, from TACZ-JAVA (named `tacz.<id>.<file>`). Cues TACZ-JAVA has no
  file for are dropped; when an animation has none left, the starting gun's cues are kept, timed to the new length
- stats (damage, penetration, headshot, falloff, fire mode, rpm, pellets) as proposed by `java-stats.mjs`, the ammo
  item, and the magazine size (HUD, reload functions and events, and thresholds are regenerated; 3+ rounds), and the
  gunsmith recipe from Java's (forge tags mapped to our item names)
- when the starting gun hangs each arm off its own hand (P320, AA-12), the first-person arm layout, with
  `arm-layout.mjs` (also usable alone: `"$NODE" tools/weapons/arm-layout.mjs <gun> [--like p320]` puts a gun's arms
  on their own hand bones with the P320's offsets; pistols need it, or the right hand isn't seen)

`tools/weapons/test.mjs` ports the CZ75 (from the P320), SPR-15 (M4A1), RPK (Type 81), Kar98k (AWM), SPAS-12 (M870) and
long Double Barrel into a scratch copy: `check.mjs` passes for each, and `gun.mjs remove` restores the packs byte for
byte; it also ports the AUG both ways (built-in scope: the Java attachment model joins the gun model at its
`scope_pos` bone and its texture goes under the gun's, `png.cjs`; `--no-scope`, as the packs have it since v1.33.4:
the rail mount instead) and the Springfield 1873 (a one-round gun from the M320). Not
handled yet: attachments for ported guns (they start with none). Reload timing of a ported gun comes from Java
(`reload-timing.mjs <ourId> <javaId>`: rounds in at Java's `reload.feed`, end when our reload animation ends).
Each ported gun still needs an in-game check: aim, reloads, sounds.

## Hitscan, tracers and hit flash

Every gun hits instantly; there are no bullet entities. `combat/firing.js` calls `shoot()` for each shot,
and `combat/hitscan.js` resolves it (settings: `HITSCAN` and
the gun's entry in `config/weapons.js`):

- One ray from the eyes, or `pellets` rays for shotguns (12), each scattered by `spread` (degrees, hip or ADS).
- A ray breaks glass, panes and wheat (`HITSCAN.breakableBlocks`, as the old bullets did) and keeps going, stops at
  any other block, and hits the nearest living entity before that (128 blocks).
- Damage goes through `applyGunHits()`. Each pellet deals the gun's `damage`; a target hit by several pellets takes
  the sum at once, with one hit sound and one hurt flash.
- `combat/shotEffects.js` draws a smoke tracer (5 puffs) per ray, or for only the first `tracers` pellets.
- The RPG has an `explosion`: a power-4 explosion that breaks blocks where the shot lands, plus 10 splash damage
  within 5 blocks (as the old rocket did), now at hitscan range instead of ~30 blocks.

Script damage does not play the red hurt flash, so each non-lethal hit also applies 1 point of real damage first;
health is then set to the exact result, so the damage dealt is unchanged.

## M107

Completed from the original's unused assets, with stats and recipes from the Java TACZ data (`reference/TACZ-JAVA.zip`):
55 damage, 0.8 penetration, 10-round magazine, `.50 BMG` ammo (`krep:bmg50`). The attachment workbench has no M107
entry yet; set scopes with `/event entity @s m107:acog` (also `elcan`, `coyote`, `standard_8`, `ironsight`).
Its reload, tactical reload and inspect sounds use the Java TACZ names (`tacz:m107/...`) in `sound_definitions.json`.

## Original bugs fixed during the reorganization

- Gunsmith: the QBZ-95 recipe gave a B93R and the SKS recipe gave a UMP-45. Crafting
  re-checked the whole recipe before taking each ingredient, so once one was taken the rest could be skipped;
  recipes now check everything once, then take everything. `log` recipes accept any wood.
- Ammo workbench: the ammo box recipe never took the chest.
- Attachment workbench: the Vector's grip menu "Preview" equipped grip 9; the Double Barrel's "Preview" selected a
  nonexistent barrel; the Vector/Golden Deagle magazine "Back" opened the preview. Menu texts were inconsistent.
- The damage table used `g93` / `scar1`, so B93R / SCAR-L bullets did no damage (moot now that both are hitscan).
- The M1911's first-person arms model (`geometry.taczuniversal16`) had a stray copy of its leg bones after the
  closing brace, so it never loaded. Fixed and moved to `models/entity/shared/taczuniversal16.geo.json`.
- 11 sounds pointed at files that didn't exist (and 5 sound names were defined twice, some copies pointing at missing
  files). They now use the matching file from `reference/TACZ-JAVA.zip` or the existing copy in the pack.
- Mob armor was detected by 48 `/tag @e` commands every second, in the Overworld only (mobs in the Nether and End
  had no armor). It is now looked up on the target when it is hit.
- The HK416's hip fire used its ADS recoil.
- Vector with an extended magazine (30/40/50): reloading used the 20-round ammo removal, so reloading from 20 or
  more rounds took no ammo. The reload now plays a per-magazine animation (`animation.vector.reload1-3`,
  `reload.tac1-3`) that calls `vectorreload1-3`, as the Golden Deagle does.
- The UMP-45 and MP7 played the MP5's draw animation instead of their own.
- Sounds that never played because their name had no sound definition: M107 reload/inspect (27), the AA-12, G17/G18,
  SKS, Uzi and UMP draw, the RPG inspect, a T50 reload sound and the Vector's empty shake. Wired to the matching
  pack file or TACZ-JAVA sound. Two RPG keyframes with no sound in either pack were removed.
- Workbench menus were opened by a once-a-second check for a tag (up to a second of delay); the kill marker tag
  `murderEntity` was checked every 2 ticks but nothing read it (removed); the `m4a1sound`/`hk416sound`/`g36sound`/
  `mp7sound` counters were written on every shot but never read (removed).
- Inspecting with an empty magazine played the loaded inspect for the AA-12, AWM, Desert Eagle, G3, HK416, M16,
  M16A1, MP5, SCAR-H and Vector (their empty inspect animations were never connected). Now wired like the SKS, with
  the Java TACZ sounds.
- Sounds that never played because the player's `sound_effects` table lacked them (M107 reload/inspect, several draw
  sounds), the SKS suppressed shot, and the pistols' walk animation. Found by `check.mjs`'s pack-wide reference check.
- Removed: dead player events/component groups (old attachment modes, old recoil events, reload steps past the
  magazine size, bullet spawns for hitscan guns), 34 unused bullet entities, uncalled functions, `tick.json` /
  `testis.mcfunction`, animations/controllers/sounds for guns not in the pack (CAR-15, M9, L85, PKM, Tabuk), the
  unused `acog.new`/`elcan.new` copies, unused sounds (124 of them are also in `reference/TACZ-JAVA.zip`), particles and
  textures, and ~10,000 empty folders.
- Removed: the `openui2` menu tag (called an undefined function), the `Indoarsenal` global, the chat message on
  every world load, and the dead `TACZ-B/kanjut/` folder (not a Bedrock folder).

## Not wired up yet

Animations that exist but no controller plays (`check.mjs --unused` lists them):

- M16 / M16A1 walk (`fp.walk`, `fp.walk.delay`): these guns have no walk state.
- Minigun barrel spin (`animation.minigun.spin`) and its third-person controller `controller.animation.minigun.tp`.
- M870 shell-by-shell reload pieces: the reload intros `m870_fp_rintroemp` / `m870_fp_rintrotac` are registered but no
  state plays them, nor `fp.reload11`.

## Performance (what runs repeatedly)

Since v1.33.6 nothing polls: everything runs on events, and only writes when something differs (every write is sent
to clients). `items/heldItem.js` tells the others when what a player holds may have changed (hotbar slot switch,
anything changed in the hotbar, spawn / join and again a second later):

| What | Runs when | Writes only when |
|---|---|---|
| `items/itemLore.js` | a TACZ item enters a player's inventory (not count changes), join; items the scripts make get lore at once (`loredItem`) | an item has no lore yet |
| `items/storedAmmoDisplay.js` | held item changed; rounds fired or loaded (firing.js / reload.js) | the loaded-round count changed |
| `attachments/attachmentState.js` | held item changed; attachments fitted | a fitted attachment changed |
| `combat/aimZoom.js` | crouch, held item changed, reload / bolt | the zoom or crosshair changed |
| `combat/inspect.js`, tactical reload in `combat/reload.js` | a left click (`playerSwingStart`) with a gun | |
| `combat/firing.js`, `combat/reload.js`, `combat/heat.js` | every tick, but only while someone fires / reloads / has a warm minigun | |
| `items/heldGun.js` | held item changed | the held gun changed (`krep:held`: the RP compares this number instead of 116 item names per player per frame, since v1.33.14) |
| BP animation controllers | none since v1.33.12 (inspect, crosshair and the reload swing were per-player, per-tick controllers) | |

Before v1.33.6 the first three polled (every second, every tick, every 2 ticks): about 0.31 of 0.59 ms of script time
per tick (profile 2026-10-04).

Nothing runs from `tick.json`, and nothing polls for menus: workbench menus open from the block-use event. Per shot: recoil + hitscan called directly by firing.js; mob armor is looked up on hit and
cached for 2 seconds. When adding timers, keep this rule: compare with the current value before calling
`setProperty` / `setItem` / `setDynamicProperty`.

## Tools

Node isn't required; VS Code's bundled runtime works. From Git Bash in the repo root:

```bash
export ELECTRON_RUN_AS_NODE=1
NODE="$LOCALAPPDATA/Programs/Microsoft VS Code/Code.exe"

# Config vs pack files for every gun and ammo type (run after editing weapons or pack files):
"$NODE" tools/weapons/check.mjs

# Compatibility with Minecraft's own definitions (script API types + Bedrock JSON schemas; internet once):
"$NODE" tools/weapons/validate.mjs

# After changing a tool (gun.mjs, java-port.mjs, check.mjs ...): test them on a scratch copy of the packs
"$NODE" tools/weapons/test.mjs            # a representative set of guns, ~10 minutes; --full: every gun

# Did a script change alter behavior? Trace the last commit and the working tree, then compare:
T=$(mktemp -d); git archive HEAD TACZ-B/scripts | tar -x -C "$T"
cd tools/trace
"$NODE" --import ./register.mjs run.mjs "$T/TACZ-B/scripts" "$T/a.txt" "$T/TACZ-B/scripts"
"$NODE" --import ./register.mjs run.mjs ../../TACZ-B/scripts "$T/b.txt" "$T/TACZ-B/scripts"
"$NODE" compare.mjs "$T/a.txt" "$T/b.txt"     # lists handler runs that differ
cd ../..

# Did a pack-file reshuffle change anything the game loads? (A and B are two checkouts)
"$NODE" tools/weapons/verify-pack.cjs <treeA> <treeB>
```

The trace can't see rendering, animation controllers or mcfunctions; test those in game.
