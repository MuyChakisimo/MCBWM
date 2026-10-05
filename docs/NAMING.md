# Names: Minecraft's rules and ours

What every name in the packs means, and the rules Minecraft enforces. Breaking a Minecraft rule can make the game
reject a whole file without an obvious error (v1.12.0-1.14.0: one bad sound name made the player's resource-pack
file fail, so every gun was invisible). `<id>` is a gun's id (`m4a1`).

## Minecraft's rules (the game rejects or ignores what breaks them)

| What | Rule | Checked by |
|---|---|---|
| Short names in a client entity's tables (`animations`, `sound_effects`, `particle_effects`, `geometry`, `textures`, `materials` in `player.entity.json`, attachables) | letters, digits, `_` and `.` only | `check.mjs` |
| Sound names (`sound_definitions.json`) | same (we keep them lowercase: `m4a1.shoot`, `tacz.m107.m107_reload_up`) | `check.mjs` |
| Item, block, entity ids | `namespace:name`, lowercase (`krep:m4a1`) | `validate.mjs` |
| Animation / controller / render controller / model ids | `animation.…`, `controller.animation.…`, `controller.render.…`, `geometry.…` | `check.mjs` (must exist) |
| BP animation controller `on_entry` / `on_exit` lines | `@s <event>` (no selector), `/command`, or Molang ending in `;`. For a selector use `/event entity @s[...] <event>` | `check.mjs` |
| Animation controller transitions | must name a state of the same controller; `initial_state` must exist | `check.mjs` |
| Model bones | unique names; a bone's `parent` must exist | `check.mjs` |
| JSON keys | no duplicates (the game silently keeps one) | `check.mjs` |
| Molang conditions | balanced `( )` and `' '` | `check.mjs` |
| Event `queue_command` commands | no leading `/` | `validate.mjs` |
| Scripts | only what the API version in `TACZ-B/manifest.json` has (`@minecraft/server` 2.10.0 since v1.31.0): e.g. `ItemStack.setLore`: 1.18.0 took plain text only (2.x also takes translated RawMessage), at most 20 lines of 50 characters | `validate.mjs` |
| JSON comments | the game tolerates some, but we don't use any (notes live in `docs/` and scripts) | |

`check.mjs` runs offline in seconds; `validate.mjs` needs internet once (downloads Mojang's script API definitions and
the Bedrock JSON schemas) and is worth running after big changes.

## Our names, per gun

| Name | Where | Meaning |
|---|---|---|
| `krep:<id>`, `krep:<id>_emp` | items | the gun loaded / with an empty magazine (commands swap them) |
| scoreboard `<id>` | BP | rounds in the magazine (created by `scripts/items/ammoScoreboards.js`) |
| scoreboards `win308`, `minigunoverheat` | BP | the ammo box's rounds (the minigun fires from it), the minigun's heat in % (`combat/heat.js`) |
| `<id>:acog`, `<id>:elcan` ... | `player.json` events | sight choices: set `krep:<id>scope` |
| `<id>:bolt`, `<id>:normal`, `<id>:end` | `player.json` events | bolt/pump action states (AWM, M870 ...) |
| `krep:<id>scope` | player property | fitted sight (`'acog'`, `'nothing'` ...) |
| `functions/<id>.mcfunction` | BP | ammo HUD of guns with `capByMagazine` (Golden Deagle, Vector) and the minigun |
| `v.<id>`, `v.<id>b`, `v.<id>emp` | RP Molang variables (`player.entity.json` `pre_animation`) | holding the gun: any / loaded item / empty item |
| `controller.animation.<id>.fp`, `.tp`, `.walk` | RP `animation_controllers/gun_<id>.json` | first-person, third-person, walk animation state machines |
| `animation.<id>.fp.hold`, `.fp.sprint`, `.fp.sight`, `.fp.tac`, `.fp.reload`, `.fp.inspect`, `.fp.inspect_empty`, `.fp.view` | RP `animations/guns/<id>.json` | first person: idle, sprint, aim (ADS), tactical reload, empty reload, inspect, empty inspect, attachment preview |
| `animation.<id>.draw`, `.shoot`, `.shoot.sight`, `.shoot.nsight`, `.tp.*` | same | draw, firing kick (ADS / hip), third person |
| `<id>_fp_hold`, `<id>_fp_inspect_emp` ... | `player.entity.json` `animations` | short names the RP controllers use for those animations |
| `geometry.<id>` | RP `models/entity/guns/<id>.geo.json` | the gun model |
| `geometry.taczuniversal<N>`, `controller.render.player.universal<N>.first_person` | RP `models/entity/shared/`, `render_controllers/shared_player.json` | the player's first-person arms for that gun (a few guns share one) |
| `controller.render.<id>` | RP `render_controllers/gun_<id>.json` | draws the gun model and shows its attachment parts |
| `<id>.shoot`, `<id>.suppress`, `<id>.<part>` | `sound_definitions.json` | our sound names; files in `sounds/<id>/` |
| `tacz.<folder>.<file>` | `sound_definitions.json`, `player.entity.json` | sounds taken from Java TACZ (`tacz_sounds/<folder>/<file>.ogg`) |
| `krep:gun.<id>.name`, `.lore`, `krep:gun.<id>_emp.*` | `TACZ-R/texts/*.lang` | item name and lore (lore is shown in English: `config/lore.js`, generated) |
| `textures/gun/<id>.png`, `textures/items/<id>.png`, `textures/ui/new/<id>/` | RP | gun texture, inventory icon, attachment menu icons |

## Shared values

| Value | Values |
|---|---|
| `q.mark_variant` | 0 not reloading, 1 empty reload, 2 tactical reload, 3 grenade launcher (unused) |
| `q.skin_id` | 0 normal, 1 inspecting, 2 attachment preview |
| `krep:ammoreload` | per gun base number + rounds this reload loads (each gun has its own base, e.g. M4A1 460) |
| `krep:stock`, `krep:grip`, `krep:laser`, `krep:muzzle`, `krep:magazine` | fitted attachment numbers of the held gun (0 = none) |
| scriptevent `tacz:weapon_hitscan <id> ads\|hip` | fire event -> `scripts/combat/hitscan.js` |

## Ammo

| Name | Meaning |
|---|---|
| `krep:<ammo>` (`krep:m885`, `krep:mm9` ...) | ammo item; recipe and lore key in `scripts/config/ammo.js` |
| `krep:ammo.name.<key>`, `krep:ammo.lore.<key>` | lang keys (`5_56`, `9mm`, `792x57` ...; the item's `minecraft:display_name` and `ammo.js` `lore` say which) |
| `krep:ammoboxc` | creative ammo box: reloads take no ammo |
