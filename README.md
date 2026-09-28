# TACZ Bedrock (TACZ-B / TACZ-R)

Minecraft Bedrock weapon add-on (port of TACZ by Akang Krep, v1.0.2 Translated Edition).

| Folder | What |
|---|---|
| `TACZ-B/` | Behavior pack (scripts, items, entities, controllers, functions) |
| `TACZ-R/` | Resource pack (player renderer, models, textures, animations, sounds) |
| `tools/weapons/` | `check.mjs` (config vs pack consistency), `verify-pack.cjs` (proves two pack trees are equivalent) |
| `tools/trace/` | Behavior trace: proves two versions of the scripts make the same Minecraft API calls |
| `tools/deobfuscate/` | How the obfuscated original scripts were made readable (history) |
| `*.zip` | Reference only (original release, Java TACZ, earlier attempt). Never shipped |

**Pack version is `1.5.0`** for both packs. On a dedicated server set `"version": [1, 5, 0]` for both packs in the
world's `world_behavior_packs.json` / `world_resource_packs.json`. Bump the version whenever you change a pack, or
players and worlds keep using their cached copy.

## Changing weapon stats

Everything the scripts know about a gun is in **`TACZ-B/scripts/config/`**:

| File | What |
|---|---|
| `weapons.js` | Every gun: name, category, damage, penetration, hitscan or projectile, gunsmith recipe, and (for reference) magazine size and ammo. Order = gunsmith menu order. The header explains every field and the damage formula |
| `ammo.js` | Every ammo item: ammo-workbench recipe, output count, lore text key |
| `attachments.js` | Attachment workbench: which guns take which grips, stocks, lasers, muzzles, magazines and sights |
| `recoil.js` | Attachment-dependent recoil for the MP5, AKM, FAL, M4A1, HK416 and Vector |

Damage, penetration, recipes, hitscan range/tracers, attachments and recoil take effect as soon as the world reloads.
**Magazine size and ammo item** are defined by the behavior pack's JSON; the values in `weapons.js` are there so all
stats are in one place, and `tools/weapons/check.mjs` reports any gun whose pack files disagree (and which file to
edit).

## Script layout (`TACZ-B/scripts/`)

| File | What it does |
|---|---|
| `main.js` | Imports every module below |
| `combat/hitscan.js` | Guns with `firing: "hitscan"`: the fire event runs `scriptevent tacz:weapon_hitscan <gun> ads\|hip`; a ray from the eyes finds the target |
| `combat/damage.js` | `processGunHit()`: headshot (2x), armor reduction, damage, red hurt flash, hit/kill sounds |
| `combat/projectiles.js` | Guns with `firing: "projectile"` (shotguns, RPG): bullet hits, bullet cleanup after 10 ticks |
| `combat/shotEffects.js` | Hitscan smoke tracer and impact puff |
| `combat/armor.js` | Armor points per material; tags mobs by the armor they wear |
| `combat/recoil.js` | `scriptevent recoil:hip\|ads` → camera shake reduced by fitted attachments (`config/recoil.js`) |
| `combat/killTracking.js` | Kill marker tag `murderEntity` on the shooter for ~2 ticks |
| `crafting/gunsmith.js`, `crafting/ammoWorkbench.js` | Crafting menus built from `config/weapons.js` / `config/ammo.js` |
| `crafting/craftingHelpers.js` | Takes ingredients (only if all are present) and gives the result; `log` accepts any wood |
| `crafting/workbenchBlocks.js` | Using a workbench block opens its menu |
| `attachments/attachmentMenu.js` | Attachment workbench menus built from `config/attachments.js` |
| `attachments/attachmentState.js` | Per-player attachment storage; syncs the held gun's attachments to the model |
| `items/ammoScoreboards.js` | Creates the scoreboard objectives (loaded rounds per gun, etc.) once on world load |
| `items/itemLore.js` | Lore text on guns and ammo |
| `items/storedAmmoDisplay.js` | Loaded rounds on the Evolys / M249 / M1014 models (`storedAmmoDisplay`) |
| `items/ammoBox308.js` | Storing .308 rounds in an ammo box |

## Pack layout (per weapon)

Every gun `<id>` (the item id without `krep:`) has its own files:

| Pack file | What |
|---|---|
| `TACZ-B/items/guns/<id>/<id>.json`, `<id>_emp.json` | The gun item and its empty-magazine variant |
| `TACZ-B/animation_controllers/gun_<id>.json` | Firing (ammo count, fire event, sound) and reload state machines |
| `TACZ-B/animations/guns/<id>.json` | Shoot / reload timelines (reload functions, ammo scoreboard) |
| `TACZ-B/functions/<id>.mcfunction`, `<id>quantity`, `<id>reload` | Ammo HUD, reload ammo check, ammo removal |
| `TACZ-B/entities/bullet/<id>.json` | Bullet entity (only used by projectile guns) |
| `TACZ-B/entities/player.json` | Shared player entity: every gun's `krep:<id>_fire` / reload / scope events |
| `TACZ-R/models/entity/guns/<id>.geo.json` | Gun model |
| `TACZ-R/render_controllers/gun_<id>.json` | Which gun parts/attachments are visible |
| `TACZ-R/animation_controllers/gun_<id>.json` | First-/third-person animation state machines |
| `TACZ-R/animations/guns/<id>.json` | First-/third-person animations |
| `TACZ-R/attachables/gun_<id>.json`, `gun_<id>_emp.json` | Hides the vanilla item sprite (the gun is drawn by the player renderer) |
| `TACZ-R/entity/player.entity.json` | Shared player renderer: registers each gun's model, animations and render controllers |
| `TACZ-R/textures/gun/<id>.png`, `textures/items/<id>.png`, `sounds/<id>/` | Textures and sounds |

Shared files are named `shared_*` / `shared/` (player arms `taczuniversal*`, scopes, walk cycles). Ammo is under
`items/ammo/` and `attachables/ammo_*`.

The ammo HUD (`functions/<id>.mcfunction`) is drawn by each gun's animation controller, which runs it as the player.
There is no `tick.json`: functions run from it have no `@s`, so they did nothing.

### Adding a weapon

1. Copy a similar gun's files from the table above (for example `m4a1` for a rifle) and rename `m4a1` inside them.
2. Add its events to `entities/player.json` and its model/animations/render controllers to `player.entity.json`
   (search for the gun you copied to find every spot; also add it to `variable.holding_all_guns`).
3. Add its entry to `config/weapons.js` (and `attachments.js` / `recoil.js` if it has attachments).
4. Add names and lore to `TACZ-R/texts/*.lang`, and the items to `item_catalog/crafting_item_catalog.json`.
5. Run `tools/weapons/check.mjs` (below) and fix what it reports.

Removing a weapon is the reverse: delete its entry and its files, and its spots in the two player files.

## Hitscan, tracers and hit flash

34 guns (plus the M107) hit instantly; shotguns and the RPG fire bullet entities. Each hitscan gun's fire event in
`entities/player.json` runs `scriptevent tacz:weapon_hitscan <id> ads|hip` instead of spawning `bullet:<id>`.
`combat/hitscan.js` finds the nearest living entity along the view ray (128 blocks, stopping at blocks), damage goes
through `processGunHit()`, and `combat/shotEffects.js` draws 5 smoke puffs as a tracer. Script damage does not play the
red hurt flash, so each non-lethal hit also applies 1 point of real damage first; health is then set to the exact
result, so the damage dealt is unchanged.

## M107

Completed from the original's unused assets, with stats and recipes from the Java TACZ data (`TACZ-JAVA.zip`):
55 damage, 0.8 penetration, 10-round magazine, `.50 BMG` ammo (`krep:bmg50`). The attachment workbench has no M107
entry yet; set scopes with `/event entity @s m107:acog` (also `elcan`, `coyote`, `standard_8`, `ironsight`).
Reload sound effects are not wired up yet.

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
  files). They now use the matching file from `TACZ-JAVA.zip` or the existing copy in the pack.
- Removed: dead player events/component groups (old attachment modes, old recoil events, reload steps past the
  magazine size, bullet spawns for hitscan guns), 34 unused bullet entities, uncalled functions, `tick.json` /
  `testis.mcfunction`, animations/controllers/sounds for guns not in the pack (CAR-15, M9, L85, PKM, Tabuk), the
  unused `acog.new`/`elcan.new` copies, unused sounds (124 of them are also in `TACZ-JAVA.zip`), particles and
  textures, and ~10,000 empty folders.
- Removed: the `openui2` menu tag (called an undefined function), the `Indoarsenal` global, the chat message on
  every world load, and the dead `TACZ-B/kanjut/` folder (not a Bedrock folder).

## Where the multiplayer lag most likely comes from (next steps)

These all scale with players or entities. Change one at a time and test with several players:

1. `items/itemLore.js`: every second, `setItem` on **every slot of every player's inventory**. Only write when lore
   was actually missing.
2. `combat/armor.js`: every second, 48 `/tag @e[...]` commands scanning all entities.
3. `items/storedAmmoDisplay.js` (every tick) and `attachments/attachmentState.js` (every 2 ticks): `setProperty` on
   every player holding a gun, even when the value hasn't changed. Cache the last value.

## Tools

Node isn't required; VS Code's bundled runtime works. From Git Bash in the repo root:

```bash
export ELECTRON_RUN_AS_NODE=1
NODE="$LOCALAPPDATA/Programs/Microsoft VS Code/Code.exe"

# Config vs pack files for every gun and ammo type (run after editing weapons or pack files):
"$NODE" tools/weapons/check.mjs

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
