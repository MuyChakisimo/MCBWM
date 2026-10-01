# Next steps (handoff)

Where the project stands and what to do next. Written at the end of a work session on another computer; update it
at the end of each session. How the code works is in `README.md`.

## Before starting on a new computer

1. `git pull`.
2. **Copy `reference/` by hand.** It is not in git (`.gitignore`). It holds `TACZ-JAVA.zip` (the Java TACZ mod: every
   porting tool reads it) and the original Bedrock release zip. Without `reference/TACZ-JAVA.zip`, `java-stats.mjs`,
   `java-convert.mjs` and `java-port.mjs` stop with "not found".
3. Node: any Node 20+ works, or VS Code's bundled one (see README "Tools").
4. `node tools/weapons/check.mjs` should print `Everything matches.`

## Current state

- Pack version **1.15.0** (both manifests; worlds need `[1, 15, 0]` in `world_*_packs.json`).
- 41 guns, 21 ammo types. Every gun fires by hitscan (no bullet entities).
- Stats live in `TACZ-B/scripts/config/` (`weapons.js`, `combat.js`, `recoil.js`, `ammo.js`, `attachments.js`).
- Tools in `tools/weapons/`: `check.mjs` (config vs pack and every pack reference; `--unused` lists unused
  definitions), `gun.mjs` (clone/remove a gun), `java-stats.mjs`, `java-convert.mjs`, `java-port.mjs`, `test.mjs`
  (tests the tools on a scratch copy; run it after changing any tool).
- `docs/HOW-IT-WORKS.md`: each system step by step and a troubleshooting table.

## Not tested in game yet (ask the user how these went)

The user last tested around v1.9.0 ("everything's working great"). Since then:

- v1.10.0: workbench menus open instantly like a chest (sneak to place blocks against them); kill tag and per-shot
  sound counters removed; MP7 looping fire sound should still work.
- v1.11.0: gun tool cleanup (should look the same in game).
- v1.12.0: sounds that never played now play (M107 reload/inspect, AA-12/G17/G18/SKS/Uzi/UMP draw), SKS suppressed
  shot, pistol walk sway (G17, G18, Deagle, Golden Deagle, M1911), empty-magazine inspect for AA-12, AWM, Deagle, G3,
  HK416, M16, M16A1, MP5, SCAR-H, Vector.
- v1.13.0: per-gun headshot multipliers from Java (1.25x SMGs to 2x snipers, was 2x for all) and damage falloff by
  distance (e.g. M16 does 75% past 70 blocks).
- v1.14.0: six new ammo types in the ammo workbench (7.92x57, .30-06, .45-70, .500 Magnum, .22 WMR, 40mm grenade);
  no gun uses them yet.

## Next, in order

1. **First Java gun port: M9A4** (the user agreed to test one port first). Cleanest case: full Java sounds, no
   attachments. `node tools/weapons/java-port.mjs m9a4 m9a4 --from p320 --name "M9A4"`, then `check.mjs`, bump the
   pack version, commit. The user tests: crafting, aim (sight lines up?), reload empty/tactical, inspect, sounds.
   If the aim is off, adjust `EYE_HEIGHT` / `EYE_DEPTH` / `HOLD_OFFSET` in `java-convert.mjs` (measured on 34 guns).
2. **Ammo counter in the hitscan script** (the user wants it; needs in-game testing, so do it when they can test).
   Move "remove one round, update HUD, swap to `<id>_emp` at 0, 'No Ammunition' title" from each gun's BP controller
   into `combat/hitscan.js`. Then fire timing can use `fireMode` / `rpm` / `burst` from `weapons.js` (one fixed mode
   per gun, no switching; the user chose: M16 and B93R burst, Double Barrel bursts both barrels, SCAR-H auto, G3/FAL/
   MK14 semi, CZ75 auto). Do the M4A1 first, have the user test, then roll out. Special cases: minigun overheat,
   tube-fed shotguns (`reload: "single"`), Golden Deagle and Vector per-magazine reloads, `storedAmmoDisplay` guns.
3. **Port the other Java guns** with `java-port.mjs` (templates must have their own arms model):

   | Java gun | from | notes |
   |---|---|---|
   | rpk | type81 | Java has no reload sounds; the tool keeps the Type 81's |
   | kar98, m700, springfield1873, lonetrail | awp | bolt/lever action; `lonetrail` is Java type "pistol" |
   | m95 | m107 | |
   | spas_12 | m870 | |
   | db_long (as `dblong`) | db | Java has no sounds; the tool keeps the Double Barrel's |
   | cz75, hk_mk23 | p320 or m1911 | |
   | rhino357, taurus500, taurus943 | cp (Colt Python) | revolvers |
   | spr15hb | m4a1 | tested in `test.mjs`; starts with no attachments |
   | aug | m4a1 | **built-in scope** (Java `scope_aug_default` attachment model) not handled yet |
   | m320 | rpg | grenade launcher: give it an `explosion` in `weapons.js` like the RPG; 40mm ammo |

   Ported guns start with no attachments (`java-port.mjs` strips what the clone inherited). Still to build: merging a
   built-in scope model (AUG), and Java attachments for ported guns (Java has 100+ attachment models).
4. **Lag: gate the 47 always-running BP controllers.** In `entities/player.json` `scripts.animate`, the 40
   `<id>reloading` controllers, 5 scope controllers, `minigun` and `mp7sound` run every tick for every player
   regardless of the held gun (about 80 Molang checks per player per tick). Gate them on the held item like the main
   gun controllers, but a gated controller freezes mid-state: switching guns mid-reload would skip its cleanup, so the
   gate needs a "reload in progress" exception. Needs in-game testing (switch guns mid-reload).
5. **Unfinished features** (animations exist, nothing plays them; `check.mjs --unused`): M16/M16A1 walk, minigun
   barrel spin (`animation.minigun.spin`, `controller.animation.minigun.tp`), M870 shell-by-shell reload intros
   (`m870_fp_rintroemp` / `m870_fp_rintrotac`, `fp.reload11`).
6. Empty-magazine inspect for the 22 guns that have none (Java has them; `java-convert.mjs` converts `inspect_empty`).

## Decisions the user already made (don't re-ask)

- Stats: headshot multipliers and damage falloff come from Java; new guns use `java-stats.mjs`'s proposals for now
  ("we'll modify later"). Fire modes as listed in step 2. MP7 950 auto, G18 1100 auto, Saiga-12 300 semi, Colt Python
  150 semi (real-world values; not in Java).
- Keep: glass breaking for all guns; per-pellet shotgun damage; 12 pellets with 6 tracers; RPG as hitscan with an
  explosion.
- Workbench menus open like a chest. No kill tag. Barrier icon for "No Extension" magazines.
- `reference/` zips stay out of git.

## How the user works

- Explain in plain words; the user is building the mod, not a programmer by trade. Ask before big or visible changes.
- One commit per step. The user pushes to GitHub; they like a ready-to-paste title and description.
- Bump the pack version (both manifests + README) whenever the packs change; run `check.mjs` before committing.
- Say clearly what needs in-game testing. Tool changes are verified in a scratch copy of the repo (clone/port, check,
  remove, compare byte for byte), never by adding test guns to the real packs.

## Gotchas learned

- **Names in the player client entity's tables** (`sound_effects`, `animations`, ...) may only use letters, digits, `_`
  and `.`. v1.12.0-1.14.0 added sound names like `tacz:m107/m107_reload_up`; at home (2026-10-01) the guns were
  invisible and the third-person arms didn't move (the game fell back to the vanilla player). v1.15.0 renamed them
  to `tacz.m107.m107_reload_up`; `check.mjs` now rejects such names. If the guns disappear again, check the content
  log for player.entity.json errors first.

- Animation sound effects play only if the name is in `player.entity.json`'s `sound_effects` table (and in
  `sound_definitions.json`); `check.mjs` checks both.
- Functions in `tick.json` run without `@s`, so per-player commands there do nothing.
- Git Bash mangles `/paths` inside `node -e '...'` and backslashes in heredocs: put scripts in a file instead.
- Stopping a background shell task can leave its child processes running; check for leftovers before rerunning.
- Some pack files use Windows line endings; the tools keep each file's endings. Compare with
  `git -c core.autocrlf=false` when verifying round trips.
