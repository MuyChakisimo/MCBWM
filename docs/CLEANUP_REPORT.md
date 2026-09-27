# Cleanup Report

Baseline: commit `26f7987` ("undated Render Controller"). Reference: the original
Bedrock release `TACZ mod V1.0.2 TRANSLATED EDITION [Original].zip`.
Every removal is in git history and can be restored with `git checkout 26f7987 -- <path>`.

**590 files removed, 0 identifiers lost.** Validator: 238 → 19 errors, 685 → 21 warnings.
The remaining errors are listed at the bottom; all but M107's are also present in the original.

## Why there was so much duplication

An earlier "rename obfuscated files" pass **copied** each file to a readable
name and left the original. Bedrock loads every JSON in a definition
folder, so most identifiers were defined 2–4 times. Where the copies
differed, the winner depended on load order. That is how
`controller.render.m107`, `controller.animation.m107`, `controller.animation.rpg*`
and 18 BP items ended up with nondeterministic behaviour.

## Removal rule

A file was deleted only if **every** identifier it defines has an
**identical** definition in another file that is kept, and the asset type
resolves by identifier rather than by path (render controllers, animation
controllers, animations, attachables, particles, items, entities). This was
verified mechanically, file by file. Differing duplicates were resolved
individually (below).

## Removed

| Path / group | Category | Referenced by | Reason | Replacement |
|---|---|---|---|---|
| `TACZ-B/entities/plalyer.json` | DUPLICATE | Bedrock loads it as a 2nd `minecraft:player` | Identical to `player.json` except 13 animation refs to BP animations that exist nowhere | `entities/player.json` |
| `TACZ-R/render_controllers/R45pDZIigAcBTAGq.json` | DUPLICATE (conflicting) | `controller.render.m107` | 2nd definition of the id | `render_controllers/m107.json`, restored to the original pack's content |
| 53 RC files, 45 RP animation-controller files, 96 attachables (obfuscated names) | DUPLICATE | by identifier only | Identical copies exist under readable names | `render_controllers/<gun>.json`, `animation_controllers/*`, `attachables/<gun>.json` |
| 13 obfuscated RC bundles (`universalNN` + `controller.render.<gun>`) | DUPLICATE (split) | by identifier | The rename pass copied only half of each bundle | Full bundle merged into `render_controllers/<gun>.json` |
| 9 particle files (`*.particle.json`, `* (1).json`) | DUPLICATE / packaging junk | by identifier | Byte-identical to `particles/<name>.json` | `particles/<name>.json` |
| 141 BP animation files, 47 BP animation-controller files, 15 BP item files (obfuscated names) | DUPLICATE | by identifier | Identical copies under readable names | readable-named files |
| 109 BP items under obfuscated folders, `items/java_import/`, `items/m107/`, `items/modular_ammo/` | DUPLICATE | by identifier | 91 identical; 18 differ only in `minecraft:display_name` | `items/weapons/<gun>/`, `items/ammo/` (the copies edited in "upgrade version") |
| `animation_controllers/U8JikdMopJaApVnt.json` | DUPLICATE (conflicting) | `controller.animation.m107` | Older 5-round version | `animation_controllers/m107.json` (10-round) |
| `animation_controllers/EYecdOCDUnkTYl4P.json`, `Z8AdvFAD9jH9FWDT.json` | DUPLICATE (conflicting) | `controller.animation.rpg`, `.rpg.reload` + 32 identical reload controllers | Called nonexistent `functions/rpg.mcfunction` | `rpg.json`, `weapon_reloads.json` (renamed from the misleading `m16a1_reload.json`) |
| `animation_controllers/aep8…`, `ZL5M…`, `iqxU…` (CAR-15, PKM, Tabuk-SR) | CONFIRMED UNUSED | nothing: not in any entity's `animations` | Abandoned guns; called missing functions | none |
| 39 `TACZ-B/entities/bullet/*.json` (incl. 6 Finder `* copy.json`) | CONFIRMED UNUSED | no command, shooter component, script, RP entity | Firearms are hitscan | `weapons/hitscan.js`. `rpg.json`, `m320.json` kept |
| 15 scripts in `scripts/events/`, `scripts/global/` | CONFIRMED UNUSED | not reachable from `scripts/main.js` (no static or dynamic import) | 3 byte-identical to live modules; the rest superseded hitscan/damage/armor/attachment handlers | `weapons/*`, `attachments/*` |

`__MACOSX/`, `.DS_Store` and `._*` are **not present** in the repository tree; they exist only inside the reference ZIPs. The validator fails on them (`packaging-junk`) if they ever appear.

## Behavior-side `minecraft:player`: property-by-property

`player.json` vs `plalyer.json`: identical `format_version` (1.21.0), 24 properties, 21 component groups, 1186 events, 23 components and 89 `animate` entries. `plalyer.json` additionally declared `m16a1/t50/sks/b93/qbz95/ump` `gl*shoot`/`gl*reload` and `hk416attachment`, which point at BP animations that do not exist in either the updated or the original pack. After removing those, the two files are JSON-equal. **`entities/player.json` is now the single source of truth.**

## Other changes (not deletions)

| Change | Why |
|---|---|
| RP `min_engine_version` 1.21.70 → 1.20.0 | Known-good value for the player renderer snapshot (see ROOT CAUSE in README) |
| `controller.render.player.third_person` gated on engine variables | The body no longer depends on `pre_animation` |
| 9 Java shoot/reload clips no longer `loop: true` | They latched on the player via `playAnimation` |
| `client_sync: false` for `krep:movement, view, hk416recoil, join, akmrecoil, m4a1recoil` | No client file reads them; each change was broadcast to every player |
| Parsed attachment cache in `attachments/modular.js` | Was `getDynamicProperty` + `JSON.parse` on every shot |
| `debug/logger.js`, `debug/diagnostics.js`, `players/heldWeapon.js` | Central logging, runtime state dump, one held-weapon lookup |

## JavaScript call graph (after cleanup)

`main.js` → 19 top-level imports. Subscriptions and intervals (from `tools/script-surface`):

| Module | Registers | Work per run (10 players) |
|---|---|---|
| weapons/weaponEngine.js | itemStartUse, itemStopUse, scriptEvent `tacz:modular_reload` | per shot |
| weapons/hitscan.js | scriptEvent `tacz:weapon_hitscan` | per shot: 2 rays (13 for shotguns), 6 particles |
| weapons/recoil.js | scriptEvent `recoil:*` | per shot: 1 `runCommandAsync(camerashake)` (no Script API equivalent) |
| weapons/projectileBridge.js / projectileCleanup.js | projectileHitEntity / entitySpawn | RPG/M320 only |
| attachments/modular.js | playerInteractWithBlock, scriptEvent, playerLeave | on interaction |
| attachments/state.js | runInterval 2t | 21 API calls; property writes only on change |
| events/bulletCache.js | runInterval 1t | 21 API calls; only evolys/m249/m1014 holders write |
| ui/ammoHud.js | runInterval 10t | 51 calls |
| events/itemLore.js | runInterval 100t | 11 calls + inventory scan |
| events/gunCraftingUI.js, ammoCraftingUI.js, legacyAttachmentUI.js (×2) | runInterval 20t each | tag checks; act only on tagged players |
| events/gunsmithInteraction.js, workbenchInteraction.js, win308AmmoBox.js | block interact / itemUse | on interaction (2 `runCommandAsync` for UI) |
| debug/diagnostics.js, debug/profiler.js | scriptEvent | none unless enabled |

No players × players, players × entities, or players × all-weapons loops exist. All intervals are O(players).

## Performance: ranked by estimated runtime impact

1. **Client, per rendered player per frame:** `player.entity.json` `pre_animation` performs ~280 `query.get_equipped_item_name` string comparisons (`holding_all_guns` alone is ~100), plus 140 `animate` conditions. With 10 players in view that happens 10× per frame on every client. *Proposed (needs in-game test):* derive one weapon index per frame and gate on it. That wasn't done here because correctness comes first.
2. **Server, per player per tick:** 89 BP animation controllers; 48 (`*reloading`, `*scope`) are not gated on the held item and evaluate ~100 transitions per player per tick even with an empty hand. *Proposed (needs in-game test):* gate them like the fire controllers. Risk: controllers reset when their gate turns false, which could affect reload cancellation.
3. **Per shot (legacy guns):** the fire event runs `playanimation`, `playsound @a[r=120]`, scoreboard commands and two `scriptevent`s. That's acceptable but command-heavy; migrating legacy guns to `weaponEngine.js` removes it.
4. Script intervals: small and linear (table above).

## Remaining validator findings (not changed)

| Finding | In original? | Note |
|---|---|---|
| M107 `weapon-incomplete` (no render path) | yes | Needs authoring: geometry key, FP arm rig, `controller.animation.m107.fp/.tp/.walk`, `animation.m107.tp.*` |
| `animation.acog.new` / `animation.elcan.new` defined 4× differently | yes | Shared scope bundles; choosing one changes some gun's scope pose, so resolve in game |
| player animations `animation.delay.shoot`, `*.fp.dredet`, `controller.animation.hk416.recoil`, `animation.m107.tp.*`, `animation.m107.fp.acog` missing | yes | Those poses silently do nothing |
| particles `krep:shell`, `krep:g3shell`, `krep:nothin` missing | yes | No shell-casing particle for those guns |
| `animation.ammobox.rotate`, item icon `127mm` missing | yes | Cosmetic |
| 16 sound events without audio files | yes | Upstream asset gaps; nothing fabricated |
| 218 animations, 86 geometries, 201 textures not referenced (158 unreachable audio files were removed) | mostly | **PROBABLY UNUSED**, not deleted: string-built references and UI JSON cannot all be proven statically |
