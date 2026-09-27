# Architecture

TACZ-B is the behavior pack (server: scripts, entities, items, controllers).
TACZ-R is the resource pack (client: player renderer, models, textures,
animations, particles, sounds). Everything below is what the code actually
does today. It was traced from the files, not taken from older docs.

## Quick answers

| Question | Answer |
|---|---|
| Where does player rendering happen? | `TACZ-R/entity/player.entity.json` (overrides vanilla `minecraft:player`). Body: `controller.render.player.third_person` / `.first_person` in `render_controllers/player_base.json`. |
| Where does gun rendering happen? | Inside the same player entity. **Not** in attachables. Legacy guns: `controller.render.<gun>` + `controller.render.player.universalNN.first_person` (`render_controllers/<gun>.json`). Java imports: `controller.render.java_import_weapon` (`render_controllers/modular/weapons.render_controllers.json`). |
| What do gun attachables do? | `attachables/<gun>.json` draw an empty `texture_mesh` (`textures/nothing`) scaled to 0 in third person. They exist only to suppress the vanilla item sprite. |
| Where is a weapon registered? | `TACZ-B/scripts/config/weapons.js` (legacy entries) and `config/javaImportedWeapons.js` (Java imports), merged into `WEAPONS`. |
| Where is firing handled? | Legacy: BP animation controller → `krep:<gun>_fire` event in `entities/player.json` → `scriptevent tacz:weapon_hitscan`. Java imports: `scripts/weapons/weaponEngine.js`. Both end in `weapons/hitscan.js`. |
| Where is raycasting handled? | `scripts/weapons/raycast.js` |
| Where is damage handled? | `scripts/weapons/damage.js` (+ `armor.js`, `blockImpact.js`) |
| Where is reload handled? | Legacy: BP reload controllers (`animation_controllers/weapon_reloads.json`, `<gun>.json`) + `functions/*reload.mcfunction`. Java imports: `scripts/weapons/reload.js`. |
| Where are attachments handled? | Legacy: `scripts/attachments/state.js` (dynamic property → synced `krep:*` properties) + `events/legacyAttachmentUI.js`. Java imports: `scripts/attachments/modular.js`. |
| Where is player state stored? | `scripts/players/playerState.js` (in-memory, per player id). Magazine: scoreboard objective named after the weapon id (`weapons/ammo.js`). |
| Where is the HUD handled? | `scripts/ui/ammoHud.js` (action bar) |
| Where do I debug a missing model? | `docs/DEBUGGING.md`, then `node tools/validate.mjs`, then `/scriptevent tacz:debug state` |

## Startup

1. `TACZ-B/manifest.json` → script entry `scripts/main.js` (`@minecraft/server` 1.18.0, `@minecraft/server-ui` 1.3.0).
2. `main.js` imports each system once. Every module registers its own subscriptions at import time.
   `node --import ./tools/script-surface/register.mjs tools/script-surface/run.mjs` prints the full list.
3. `events/scoreboardInit.js` creates the per-weapon ammo objectives on the first tick.
4. Behavior-side `minecraft:player` (`entities/player.json`, the **only** player definition) adds 24 `krep:*` properties, weapon events and 89 BP animation controllers.

## Player lifecycle

- **Join:** no script work until the player interacts. Runtime state is created lazily by `getPlayerState()`.
- **Holding a gun:** BP controllers gated on `query.get_equipped_item_name` wake up. `attachments/state.js` (every 2 ticks) pushes that gun's saved attachments into synced `krep:*` properties only when they change.
- **Leave:** `playerState.js` and `attachments/modular.js` drop their per-player caches on `playerLeave`.

## Weapon families

| | Legacy Bedrock guns (41) | Java imports (16) |
|---|---|---|
| Registry | `config/weapons.js` | `config/javaImportedWeapons.js` (`modularInput: true`) |
| Input | Item use → BP animation controller state machine (`animation_controllers/<gun>.json`) | `world.afterEvents.itemStartUse/itemStopUse` → `weapons/weaponEngine.js` |
| Fire rate | Controller state timing | `rpm` in config (`nextFireDelay`) |
| Ammo | Scoreboard `<gun>` + `_emp` item swap | Scoreboard `<gun>` via `weapons/ammo.js` |
| Reload | BP reload controllers + mcfunctions | Attack/swing → `tacz_modular_reload` controller → `scriptevent tacz:modular_reload` → `weapons/reload.js` |
| First-person visuals | `/playanimation` from the fire event + client controllers `controller.animation.<gun>.fp` | `player.playAnimation(animation.tacz.<gun>.shoot/reload_*)` |
| Render | `controller.render.<gun>` + universal FP rig | `controller.render.java_import_weapon` (geometry/texture arrays indexed by `v.java_import_weapon_render_index`) |

## Shooting flow

```
legacy:  BP controller state → event krep:<gun>_fire (entities/player.json)
           → playanimation (client clip incl. krep.muzzleflash particle)
           → scriptevent recoil:hip|ads           → weapons/recoil.js (camerashake)
           → scriptevent tacz:weapon_hitscan <gun> <mode> → weapons/hitscan.js
java:    itemStartUse → weaponEngine.fireOnce → ammo.consumeRound
           → hitscan.fireConfiguredWeapon | physicalFire (M320)
           → player.playAnimation(shoot) + playSound(shoot)
```

`hitscan.js` then does: ray (`raycast.js`) → hit resolution → `damage.processGunHit` (armor, headshot) or `blockImpact` → cosmetics (`effects/shotEffects.js`: 5 tracer particles + 1 impact). Shotguns cast one entity ray per pellet, plus one centre ray for cosmetics.

RPG and M320 are the only physical projectiles (`entities/bullet/rpg.json`, `m320.json`, `weapons/projectileBridge.js`, `projectileCleanup.js`).

## Rendering flow

```
held item (krep:<gun>)
  → query.get_equipped_item_name   (pre_animation: variable.<gun> = … == '<gun>')
  → animate[]      controller.animation.<gun>.fp / .tp / .walk  (poses bones)
  → render_controllers[]
       controller.render.player.first_person   variable.is_first_person && !variable.holding_all_guns
       controller.render.player.third_person   !variable.is_first_person && !variable.map_face_icon   ← body
       controller.render.player.universalNN.first_person   is_first_person && variable.<gun>  (arms rig)
       controller.render.<gun>                variable.<gun>                 (gun geometry, both views)
       controller.render.java_import_weapon   variable.java_import_weapon
  → Geometry.<key> / Texture.<key> / Material.guns (entity_alphatest)
attachable krep:<gun> → empty texture_mesh (suppresses the vanilla item sprite)
muzzle flash → particle krep:taczmuzzleflash emitted by the shoot animation timeline
```

**Invariant:** the base body RC must depend only on engine-provided variables. If it depends on anything `pre_animation` computes, one bad statement hides every player. The validator warns if that regresses.

**Resource-pack `min_engine_version` must stay `[1,20,0]`.** `player.entity.json` is a vanilla snapshot plus about 200 lines of TACZ Molang, validated under that version. Molang semantics are version-gated, and bumping it (to 1.21.70) coincided with the invisible-player failure.

## Reload flow (Java imports)

`startReload`: validate held weapon → magazine not full → reserve ammo > 0 → tactical/empty timing from config → play the reload clip + sound → `system.runTimeout(ticks)` → re-validate (same weapon, same token) → move ammo from inventory into the scoreboard. Switching weapons or firing invalidates the token, so a stale timeout does nothing.

## Attachment flow

- **Legacy:** workbench UI (`events/legacyAttachmentUI.js`, obfuscated) writes one dynamic property per gun. `attachments/state.js` parses it and sets `krep:stock/grip/laser/muzzle/magazine` + `krep:<gun>scope`, which render-controller `part_visibility` reads.
- **Java imports:** `attachments/modular.js` stores `{weaponId: {slot: attachmentId}}` in `tacz:modular_attachments` (parsed once per player and cached). `getEffectiveWeapon()` applies stat modifiers per shot.

## HUD flow

`ui/ammoHud.js` every 10 ticks: for players holding a Java import (or M107), write `ammo/capacity` + caliber to the action bar. Legacy guns keep their own animation-driven ammo display (`krep:bulletcache`, bridged by `events/bulletCache.js`).

## Adding a weapon

Java-import style (preferred: no new controllers needed):

1. BP item `TACZ-B/items/weapons/<id>/<id>.json` (`krep:<id>`, `minecraft:icon` = key in `TACZ-R/textures/item_texture.json`).
2. Registry entry in `config/javaImportedWeapons.js` (`modularInput: true`, fireMode, rpm, magazineSize, ammoId, reload times, damage, spread, range).
3. Model `TACZ-R/models/java_import/guns/<id>.geo.json` (`geometry.<id>`; `texture_width/height` must match the PNG).
4. Texture `TACZ-R/textures/java_import/guns/<id>.png`.
5. Player entity: `geometry.<id>`, `textures.<id>`, `pre_animation` `variable.<id> = query.get_equipped_item_name=='<id>';`, add `v.<id>` to `variable.java_import_weapon` and the next index to `v.java_import_weapon_render_index`, then append `Geometry.<id>` / `Texture.<id>` **at that same index** in `controller.render.java_import_weapon`.
6. Attachable `TACZ-R/attachables/java_import/<id>.json` (copy an existing one, change the identifier).
7. Animations `animation.tacz.<id>.static_idle/shoot/reload_empty/reload_tactical`. Shoot/reload clips must **not** be `loop: true`, or `playAnimation` never stops. Exceptions go in `config/weaponVisuals.js`.
8. Sounds `tacz.java.<id>.shoot/reload_*` in `sounds/sound_definitions.json`.
9. `node tools/validate.mjs`. Its "weapon-incomplete" section lists any step you missed.
10. In game: `/scriptevent tacz:debug state`, then test first and third person (docs/RUNTIME_TEST_CHECKLIST.md).

## Known structural debt (intentionally not changed blind)

- **M107 has no render path** (it had none in the original either): no geometry key, RC or `animate` entry in `player.entity.json`; `controller.animation.m107.fp/.tp/.walk` and `animation.m107.tp.*` do not exist; no universal FP arm rig matches `geometry.m107`. Gameplay works; the model will not appear until this is authored and aligned in game.
- **Java imports in third person** draw their first-person rig geometry via `controller.render.java_import_weapon` (the condition is not camera-gated) and have no third-person pose. Needs runtime evaluation.
- Four large UI modules are still obfuscated (`events/gunCraftingUI.js`, `ammoCraftingUI.js`, `legacyAttachmentUI.js`, `win308AmmoBox.js`). Their runtime surface is small and audited (see CLEANUP_REPORT).
- Resource-pack model/animation bundles still live under obfuscated folder names. Assets resolve by identifier, so the names are cosmetic. Renaming is safe, but it is a large diff with no runtime benefit.
