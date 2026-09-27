# Debugging

## Tools

| Tool | Use |
|---|---|
| `node tools/validate.mjs` | Static cross-reference check. Writes `docs/VALIDATION_REPORT.md`. Run after **every** content edit. `--strict` exits non-zero on errors. |
| `node --import ./tools/script-surface/register.mjs tools/script-surface/run.mjs` | Loads `main.js` offline and lists every subscription and interval per module, with per-interval API call counts for 1 vs 10 players. |
| `/scriptevent tacz:debug state` | In game: held item as Molang sees it, registry entry, which render path should draw it, runtime state, attachments, non-default `krep:*` properties. |
| `/scriptevent tacz:debug on` / `off` | Transition logging (weapon change, fire start/stop, reload start/end/cancel, attachment change) to the content log. No cost while off. |
| `/scriptevent tacz:profile on` / `report` / `off` | Counters: shots, entity/block raycasts, pellet rays, tracer/impact particles, projectiles. |
| Content log (Settings → Creator → Enable Content Log GUI) | Missing geometry/animation/texture, Molang errors, script exceptions. Script errors are always logged, de-duplicated per 5 s. |

## First rule

When anything renders wrong, check **one** item from each row of this matrix before changing files:

| Item | 1st person idle / fire / reload | 3rd person front / back / fire / reload |
|---|---|---|
| empty hand | | |
| vanilla sword | | |
| legacy gun (e.g. M4A1) | | |
| M107 | | |
| Java import (e.g. AUG) | | |

If the empty hand or the sword is broken, the fault is in the **player pipeline**, not in any gun.

## Symptoms

### Player disappears in third person (only the shadow is visible)
The body RC is not running, or the whole player render is failing.
1. `TACZ-R/entity/player.entity.json` → `render_controllers` → `controller.render.player.third_person` must be gated on `!variable.is_first_person && !variable.map_face_icon`, not on a `pre_animation` variable. (The validator warns about `fragile-visibility`.)
2. `TACZ-R/manifest.json` `min_engine_version` must be `[1,20,0]`. Molang semantics for the entire pack follow this value.
3. Content log: any Molang parse error in `scripts.pre_animation` voids **all** of it. Every weapon variable is then 0, and anything gated on those variables disappears.
4. Validator: `duplicate-client-entity`, `unresolved-rc-key`, `missing-geometry` on `minecraft:player`.
5. A/B test: temporarily replace `player.entity.json` with the original pack's copy. If the player returns, bisect the differences (Java-import block first).

### Vanilla item visible in first person but not in third person
Same as above. Third-person held items are drawn as part of the player body render.

### Weapon fires but is invisible
1. `/scriptevent tacz:debug state` → "render path".
2. **Legacy gun:** `player.entity.json` needs `geometry.<gun>`, `textures.<gun>`, `pre_animation` `variable.<gun>`, and `controller.render.<gun>` + `controller.render.player.universalNN.first_person` in `render_controllers`. The validator's `weapon-incomplete` check covers this. Check the RC's materials too: `"*": "material.invisible"` hides everything except the parts listed after it.
3. **Java import:** the index in `v.java_import_weapon_render_index` must match the position of `Geometry.<id>` / `Texture.<id>` in `controller.render.java_import_weapon` arrays.
4. **M107:** known gap. It has never had a render path (see ARCHITECTURE "Known structural debt").

### Weapon icon appears but the model does not
The icon comes from the BP item `minecraft:icon` → `textures/item_texture.json`, which is unrelated to the 3D model. Continue with "Weapon fires but is invisible".

### Muzzle flash appears but the gun does not
The flash is particle `krep:taczmuzzleflash`, emitted by the shoot animation's `particle_effects` timeline on the player. It does not use gun geometry, so a visible flash proves the client animation pipeline works. The fault is in geometry/RC mapping (previous section).

### Muzzle flash missing in first person
The flash is emitted at a locator on the first-person rig. Check the gun's shoot animation (`animation.<gun>.shoot*`) has `particle_effects` with `effect: "krep.muzzleflash"` and a locator that exists in the active geometry. Java imports have no muzzle-flash timeline yet.

### Animation not triggering
- Legacy: client controller `controller.animation.<gun>.fp` must be in `player.entity.json` `animations` **and** `scripts.animate`. Reload/inspect states key on `q.mark_variant` / `q.skin_id` set by BP events.
- Java imports: `player.playAnimation(id)` needs `id` to exist in the RP (the validator checks this). Shoot/reload clips must not loop, or they stay latched on the player forever.
- `/scriptevent tacz:debug on`, then fire. "Shoot animation … failed" means the API threw.

### Ammo HUD missing
Only Java imports and M107 use `ui/ammoHud.js`. Needs a `WEAPONS[<id>]` entry and the scoreboard objective `<id>` (created by `events/scoreboardInit.js`). Other legacy guns show ammo through their own animations (`krep:bulletcache`).

### New weapon shows a pink/missing texture
- `textures.<id>` path in `player.entity.json` must exist (validator: `missing-texture`, `case-mismatch`; paths are case-sensitive on mobile and Linux).
- `texture_width/height` in the `.geo.json` must match the PNG's real size, or the UVs sample the wrong area.

### New weapon works server-side but not client-side
Server-side (damage, ammo, HUD) needs only the BP item and the registry entry. Client-side needs every resource step in ARCHITECTURE "Adding a weapon". Run the validator and read the `weapon-incomplete` section.

### Attachment does not show
`/scriptevent tacz:debug state` → properties. Legacy parts are hidden or shown by `part_visibility` reading `krep:stock/grip/laser/muzzle/magazine/<gun>scope`. If the property is right but the part is wrong, the fault is in that gun's RC `part_visibility`.

### Lag with many players
`/scriptevent tacz:profile on`, reproduce, `report`. Script work is linear in the player count; see CLEANUP_REPORT "Performance". The heaviest remaining costs are the client `pre_animation` block and the 89 server-side BP controllers per player.
