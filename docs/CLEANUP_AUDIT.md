# Cleanup / Integrity Audit

## Scope

This pass treated the combined MCBWM ZIP as the source of truth and focused on structural correctness, safe deobfuscation, dead-code removal, readable naming, and reference validation. Weapon balance was not intentionally changed.

## Static validation status

`node tools/validateProject.mjs` currently reports:

- 331 Behavior Pack JSON files parse
- 526 Resource Pack JSON files parse
- 35 JavaScript files pass syntax checks
- every active JavaScript file is reachable from `scripts/main.js`
- 57 weapons are configured
- 16 Java-only weapons are registered through the modular import path
- 101 Java attachment definitions are registered
- weapon item linkage resolves for all 57 configured weapons
- only `bullet:rpg` and `bullet:m320` remain as physical projectile entities
- Behavior Pack `.mcfunction` references resolve
- Java-import model / animation / render / texture / configured audio mappings resolve
- player geometry / render / texture aliases resolve
- item icon keys resolve through `textures/item_texture.json`
- imported Java animation bone names resolve against their converted geometry

Static validation cannot prove first-person alignment, third-person alignment, visual attachment placement, animation timing, or real multiplayer performance. Those require Bedrock runtime testing.

## Safe removals

### Superseded JavaScript

Removed old modules that were no longer imported and duplicated newer systems:

- old M4A1-only hitscan handler
- old assault-rifle hitscan handler
- old projectile hit/damage handler
- old armor helper
- old recoil handler
- old lore scanner
- old projectile cleanup handler
- old global damage registry

### Physical firearm entities

The combined ZIP had reintroduced the old firearm bullet JSON files. They were removed again after reference tracing.

Remaining physical projectiles:

- `bullet:rpg`
- `bullet:m320`

### Abandoned weapon/controller content

Removed dead controller/content paths for abandoned or incomplete legacy weapons such as CAR-15, PKM and Tabuk where no current weapon/item/config path used them.

## Important correctness repairs

### Malformed Resource Pack geometry

A universal first-person geometry file used by the M1911 contained a second corrupted/truncated fragment after an otherwise valid JSON document. The complete valid geometry was preserved and only the trailing corruption was removed.

### Missing function calls

Dead controller calls to missing CAR-15/PKM/Tabuk functions were eliminated with their dead controllers. RPG contained calls to a nonexistent `rpg.mcfunction`; tracing showed the actual RPG reload work already occurs in its animation/controller timeline, so the nonexistent no-op/error path was removed without replacing the firing/reload logic.

### Modular specialty reload animations

The generic Java-import reload engine originally assumed every gun used `reload_empty` and `reload_tactical`. Kar98k, M320, SPAS-12 and Springfield 1873 have specialty animation names. `scripts/config/weaponVisuals.js` now maps these exceptions and the reload engine reads the configuration rather than inventing an animation name.

### Java-import sound definitions

Imported Java sound events had been nested under an extra `sound_definitions` property inside `sounds/sound_definitions.json`. They were flattened to proper top-level Bedrock sound-event entries.

Missing MK23 and SPAS-12 reload assets were recovered from the user-supplied Java TACZ archive and mapped explicitly.

Java-only animation sound timelines that were never connected to Bedrock player sound aliases were removed; the modular script now plays the configured Bedrock shoot/reload sounds.

### Source-backed legacy sound corrections

Two provable path mistakes were corrected:

- M249 `m249_reload_empty_load_belt` pointed at the Evolys folder even though the supplied source contains it in `sounds/m249/`.
- QBZ191 `qbz191_cloth_move_4` pointed at a nonexistent prefixed filename while the supplied source contains `sounds/qbz1911/cloth_move_4.ogg`.

There are still 16 legacy sound definitions whose referenced `.ogg` files are absent from the supplied original Bedrock release as well. These are mostly secondary inspect/cloth/handling cues. No substitute audio was fabricated. See **Known upstream asset gaps** below.

### Missing invisible cape texture

The player resource entity referenced `textures/entity/cape_invisible`, but the file was absent. A transparent texture was added so the intended invisible material does not resolve to a missing texture.

## Renaming / organization

### Behavior Pack

- `entities/plalyer.json` -> `entities/player.json`
- old `kanjut/` template directory -> `templates/`
- weapon items organized under `items/weapons/<weapon>/`
- ammunition organized under `items/ammo/`
- utility items organized under `items/utility/`
- behavior animation files renamed from random filenames to identifiers such as `m4a1_reload.json`
- behavior animation-controller files renamed to identifiers such as `m4a1.json`, `m107.json`, `rpg.json`

### Scripts

Active obfuscated files received purpose-based filenames even when their internals remain obfuscated:

- `gunCraftingUI.js`
- `ammoCraftingUI.js`
- `legacyAttachmentUI.js`
- `win308AmmoBox.js`

Small interaction routers were fully rewritten into readable files:

- `gunsmithInteraction.js`
- `workbenchInteraction.js`

`main.js` is now a readable grouped bootstrap rather than a list of misleading filenames.

### Resource Pack

- 96 attachable JSON filenames renamed to their actual identifiers
- root animation-controller filenames renamed by controller identifier
- root render-controller filenames renamed by render-controller identifier
- particle JSON filenames renamed by particle identifier

Large nested legacy geometry/animation asset files were intentionally not all renamed in one pass. Many are shared bundles and should be split only after reference mapping, not by filename guessing.

## Size / file-count effect

Combined input:

- 2,413 files
- ~87.1 MB uncompressed
- 43 JS files
- 41 physical bullet entity JSON files
- 137 `.mcfunction` files

Cleaned tree:

- 2,362 files before documentation/package metadata
- ~86.0 MB uncompressed before documentation
- 35 JS files
- 2 physical projectile entity JSON files
- 136 `.mcfunction` files

The largest performance gain is not disk size; it is eliminating the accidental return of 39 server-simulated firearm bullet entities and preventing duplicate/superseded event modules from being re-enabled accidentally.

## Remaining active obfuscation

These are still active and should be deobfuscated in later focused passes rather than rewritten blindly:

- `scripts/events/gunCraftingUI.js` (~214 KB)
- `scripts/events/ammoCraftingUI.js` (~67 KB)
- `scripts/events/legacyAttachmentUI.js` (~295 KB)
- `scripts/events/win308AmmoBox.js` (~10 KB)

Known behavior has been documented by reverse engineering, but their implementation is still obfuscated.

## Remaining performance work

### High-value next targets

1. Migrate existing Bedrock guns onto the modular ammo/reload/player-state engine.
2. Retire per-weapon quantity/reload `.mcfunction` duplication after each category is verified.
3. Remove `bulletCache.js` every-tick compatibility polling once ammo changes can push updates directly.
4. Make attachment-property synchronization state-change-driven instead of polling every 2 ticks.
5. Rewrite crafting/attachment UIs so the interaction event directly opens the form for the interacting player instead of tag + one-second global player polling.
6. Convert `.308` ammo-box logic to readable direct inventory API code.
7. Profile whether five smoke tracer particle calls per shot remain acceptable with 10 simultaneous automatic-fire players before changing the visual effect.

### Current explicit polling still present

- `events/bulletCache.js`: every tick; compatibility bridge for Evolys/M249/M1014
- `attachments/state.js`: every 2 ticks; cached to avoid repeated parsing/writes when state is unchanged
- `events/itemLore.js`: every 100 ticks (5 seconds) fallback inventory refresh
- legacy crafting/attachment UI scripts: decompiled behavior shows one-second player/tag polling that should be replaced later

## Known upstream asset gaps

The supplied original Bedrock pack also lacks the actual audio files for these 16 legacy sound definitions:

- `bruenmk9_raise`
- `cloth_move_3` (M1014 path)
- `qbz_191_inspect_mid`
- `qbz_191_reload_empty_fast_rotate`
- `g36.magoutins`
- `minigun.rotate2ins`
- `akm.overins`
- `akm.raisegrabins`
- `akm.raiseshouldertac`
- `awp.rechamberin`
- `awp.rechamberout`
- `p90.raisetac`
- `scarh.draw`
- `mp5.clothtac`
- `mp5.drop`
- `g3.magdrop`

These are retained as known legacy gaps rather than mapping unrelated audio to them. They can be repaired later if the authentic source sound files become available.

## Intentional compatibility no-op

The legacy `krep.muzzlesmoke` particle alias remains mapped to the old nonexistent `krep:nothin` target. Existing legacy animations invoke it frequently. Treating it as a no-op prevents those animations from adding a second server/client smoke layer on top of the current five-puff hitscan tracer. Do not point it at a real particle unless additional muzzle smoke is intentionally desired and profiled.

## Current modular-engine limitations that require runtime/design follow-up

- specialty tube-fed / bolt-action Java-import reloads currently use generic gameplay magazine refilling even though their visual clips are mapped correctly
- imported multi-mode weapons have fire-mode data, but a user-facing fire-mode switch input is not yet exposed; the default mode is used
- 101 Java attachment definitions/stat modifiers are registered, but every separate Java attachment model has not yet been visually aligned/mounted in Bedrock
- existing legacy Bedrock guns still use their tested controller/reload compatibility path rather than the full modular reload/input engine
