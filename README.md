# TACZ Bedrock (TACZ-B / TACZ-R)

Minecraft Bedrock weapon add-on (port of TACZ by Akang Krep, v1.0.2 Translated Edition).

| Folder | What |
|---|---|
| `TACZ-B/` | Behavior pack (scripts, items, entities, controllers, functions) |
| `TACZ-R/` | Resource pack (player renderer, models, textures, animations, sounds) |
| `tools/deobfuscate/` | Tool that turned the obfuscated original scripts into the readable ones |
| `tools/trace/` | Behavior trace checker: proves two versions of the scripts make the same API calls |
| `*.zip` | Reference only (original release, Java TACZ, earlier attempt). Never shipped |

## Current state: original baseline + hitscan

- **Resource pack (`TACZ-R/`) has identical content to the original** `TACZ mod V1.0.2 TRANSLATED EDITION [Original].zip`
  (git commit `20cdafc`) apart from the manifest version. Player and gun rendering is exactly the original's.
- **Behavior pack** is the original except:
  - **Scripts** (`TACZ-B/scripts/`) are the original obfuscated scripts, deobfuscated mechanically:
    encrypted strings replaced by the exact values the original decoder produced, obfuscator wrapper objects and
    always-true/false junk branches removed, variables renamed. `tools/trace` confirms they make the identical
    sequence of ~426k Minecraft API calls as the original across ~48k fired handlers.
  - **Hitscan** (see below): `weapons/hitscan.js`, `weapons/shotEffects.js`, `processGunHit()` in
    `events/projectileHitEntity.js`, and 34 fire events in `entities/plalyer.json`.
- **Pack version is `1.2.0`** for both packs (original `1.0.2`; `1.1.0` was the plain-original baseline; `2.0.x`
  during the rewrite). **On a dedicated server, set `"version": [1, 2, 0]` for both packs in the world's
  `world_behavior_packs.json` / `world_resource_packs.json`.** Bump the version again whenever you change a pack,
  or players and worlds keep using their cached copy.

The previous rewrite (Java weapon import, modular scripts, its docs and validator) lives in git history at
commit `d7cf6f3` if you want to salvage pieces of it.

## Hitscan and tracers

Ported from commit `8f227e0` ("hitscan convertion"). 34 guns hit instantly instead of firing a bullet entity:
assault rifles, battle rifles/DMRs, AWP, SMGs, pistols, M249 and minigun. **Shotguns, RPG and M107 still fire
physical bullets.**

1. The gun's fire event in `entities/plalyer.json` (`krep:<gun>_fire`) no longer adds the `krep:<gun>_fires` /
   `_firest` component group (which spawned `bullet:<gun>`); it runs `scriptevent tacz:weapon_hitscan <gun> ads|hip`
   instead (ads when sneaking). Animation, recoil and camera shake commands are unchanged.
2. `weapons/hitscan.js` casts a 128-block ray from the eyes: nearest living entity (the ray stops at blocks),
   otherwise the block hit.
3. Damage goes through `processGunHit()`, the same headshot/armor/damage code physical bullets use, with the
   gun's values from `global/global.js`.
4. `weapons/shotEffects.js` draws the tracer: 5 vanilla smoke puffs from beside the muzzle to the impact, plus one
   puff at the impact. No resource-pack assets are involved.

To make another gun hitscan: add `"scriptevent tacz:weapon_hitscan <gun> ads"` / `"... hip"` to both entries of its
fire event, remove the `add` of its `_fires`/`_firest` group, and add its id to `HITSCAN_WEAPONS` in `hitscan.js`.
The line-tracer model bone, `krep:m4a1tracer` property, and `m4a1_tracer` particle from the tracer experiments were
never used by `8f227e0` and were left out.

## Script map

Imported in this order by `TACZ-B/scripts/main.js` (`global.js` must stay before anything that reads `Indoarsenal`):

| File | What it does |
|---|---|
| `global/global.js` | `globalThis.Indoarsenal.bullets`: damage and penetration per gun |
| `events/projectileHitEntity.js` | `processGunHit()`: headshots, armor reduction, damage, hit/kill sounds, `murderEntity` tag. Used by physical bullets and hitscan |
| `weapons/hitscan.js` | Hitscan shots for 34 guns (`scriptevent tacz:weapon_hitscan`) |
| `weapons/shotEffects.js` | Hitscan smoke tracer and impact puff |
| `events/armorDetection.js` | Armor values; tags mobs by worn armor (every 20 ticks) |
| `events/bulletCleanup.js` | Kills bullet entities 10 ticks after spawn |
| `events/recoil.js` | Recoil profiles per gun and attachment (`scriptevent` driven) |
| `events/attachmentData.js` | Syncs the held gun's attachment dynamic property to `krep:stock/grip/laser/muzzle/magazine` |
| `events/attachmentMenu.js` | Attachment workbench UI, per-gun attachment menus and preview |
| `events/gunCraftingMenu.js` | Gunsmith crafting UI (`jawir` tag) |
| `events/ammoCraftingMenu.js` | Ammo workbench crafting UI (`laknatullah` tag) |
| `events/gunsmithInteract.js`, `events/workbenchInteract.js` | Clicking a workbench block tags the player to open its UI |
| `events/itemLore.js` | Adds lore text to TACZ items |
| `events/bulletCache.js` | Shows stored ammo for evolys / m249 / m1014 via `krep:bulletcache` |
| `events/win308AmmoBox.js` | Using `.308` ammo stores it in an ammo box |

Original bugs that were intentionally kept as-is: the `openui2` tag calls an undefined `wip()` (throws, harmless),
and `itemLore.js` re-writes every inventory slot even when nothing changed.

## Where the multiplayer lag most likely comes from (next steps)

These all scale with players or entities. Change one at a time and test with several players:

1. `functions/tick.json` runs 40 functions **every tick**. `testis.mcfunction` alone is 100 commands
   (re-adds ~50 scoreboard objectives each tick); the 39 per-gun functions redraw the ammo actionbar every tick.
2. `events/itemLore.js`: every second, `setItem` on **every slot of every player's inventory**. Each write
   re-syncs the slot to the client. Only write when lore was actually missing.
3. `events/armorDetection.js`: every second, 48 `/tag @e[...]` commands scanning all entities.
4. `events/bulletCache.js` (every tick) and `events/attachmentData.js` (every 2 ticks): `setProperty` on every
   player holding a gun, even when the value hasn't changed. Cache the last value.

## Checking a change doesn't alter behavior

Node isn't required; VS Code's bundled runtime works. From Git Bash in the repo root:

```bash
export ELECTRON_RUN_AS_NODE=1
NODE="$LOCALAPPDATA/Programs/Microsoft VS Code/Code.exe"
T=$(mktemp -d); git archive HEAD TACZ-B/scripts | tar -x -C "$T"   # last committed scripts (use 20cdafc for the pure original)
cd tools/trace
"$NODE" --import ./register.mjs run.mjs "$T/TACZ-B/scripts" "$T/a.txt" ../../TACZ-B/scripts
"$NODE" --import ./register.mjs run.mjs ../../TACZ-B/scripts "$T/b.txt" ../../TACZ-B/scripts
cmp "$T/a.txt" "$T/b.txt" && echo "same behavior"
```

For a deliberate behavior change (like the lag fixes above), `diff` the two traces and check the only
differences are the ones you intended. The trace can't see rendering, animation controllers, or mcfunctions;
test those in game.
