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

- Pack version **1.21.0** (both manifests; worlds need `[1, 21, 0]` in `world_*_packs.json`).
- 42 guns (41 original + the M9A4, the first Java port), 21 ammo types. Every gun fires by hitscan (no bullet entities).
- Stats live in `TACZ-B/scripts/config/` (`weapons.js`, `combat.js`, `recoil.js`, `ammo.js`, `attachments.js`).
- Tools in `tools/weapons/`: `check.mjs` (config vs pack and every pack reference; `--unused` lists unused
  definitions), `gun.mjs` (clone/remove a gun), `java-stats.mjs`, `java-convert.mjs`, `java-port.mjs`, `arm-layout.mjs` (first-person arms on their own hand bones), `test.mjs`
  (tests the tools on a scratch copy; run it after changing any tool).
- `docs/HOW-IT-WORKS.md`: each system step by step and a troubleshooting table. `docs/NAMING.md`: Minecraft's
  naming/format rules and what every name means. `tools/weapons/validate.mjs`: checks scripts against Mojang's API
  definitions and pack files against the Bedrock JSON schemas.

## Known-good state: v1.16.0 (tag `stable-v1.16.0`)

Tested in game by the user on 2026-10-01: guns visible in first and third person, damage, animations and sounds all
work. Everything listed as untested in earlier handoffs (v1.10.0 to v1.14.0: instant workbench menus, sounds that
never played, SKS suppressed shot, pistol walk sway, empty-magazine inspects, per-gun headshot multipliers and damage
falloff, the six new ammo types) is part of this tested state. Return to it with `git checkout stable-v1.16.0`.

The invisible-guns bug at v1.12.0 to v1.14.0 was the game rejecting `player.entity.json` (fallback to the vanilla
player) because 96 `sound_effects` names contained `:` and `/`; fixed in v1.15.0, and `check.mjs` now rejects such
names. Symptom to remember: guns invisible and third-person arms not posed, but firing, sounds, tracers and damage
work.

## Next, in order

1. **Ammo counter in the hitscan script.** **M4A1 done in v1.17.0 and tested by the user (2026-10-01): tap fire,
   full auto, empty and tactical reload, with and without silencer all work; feels more responsive than the guns
   still on controllers (they react a tick or more later).** What was tested: hold to
   fire (auto, about 800 rpm, same as before), the ammo HUD counts down per shot, last round shows "No Ammunition" and
   swaps to the empty gun, empty and tactical reloads, no shots during a tactical reload, ADS kick/recoil, silencer
   sound, switching guns stops fire. How it works: `combat/firing.js`, `scriptFiring: true` in `weapons.js`, the
   M4A1's BP controller keeps only `setup1`/`setup`/`m4a1.31` (docs/HOW-IT-WORKS.md "Firing a shot"). Simulated
   outside the game (fire rate, empty swap, reload block, semi and burst). Guns cloned/ported from the M4A1 inherit
   `scriptFiring`. The rollout to every gun comes after the Java imports (user's order, see Decisions): per gun,
   add `scriptFiring: true` and delete its controller's shoot states; do it with a tool so ported guns are included.
   Move "remove one round, update HUD, swap to `<id>_emp` at 0, 'No Ammunition' title" from each gun's BP controller
   into `combat/hitscan.js`. Then fire timing can use `fireMode` / `rpm` / `burst` from `weapons.js` (one fixed mode
   per gun, no switching; the user chose: M16 and B93R burst, Double Barrel bursts both barrels, SCAR-H auto, G3/FAL/
   MK14 semi, CZ75 auto). Do the M4A1 first, have the user test, then roll out. Special cases: minigun overheat,
   tube-fed shotguns (`reload: "single"`), Golden Deagle and Vector per-magazine reloads, `storedAmmoDisplay` guns.
2. **First Java gun port: M9A4.** Ported in v1.18.0; the user tested: sounds, reloads and ammo count work, third
   person correct, but in first person the hand was off the grip. Cause: the P320 template hangs the right arm off
   the right hand (only P320, M1911, AA-12 do; the converted Java model mirrors them like the other 33 guns), and its
   hold/aim/sprint poses (kept by the port) placed the arms for that layout. Fixed in v1.19.0 in java-port.mjs:
   moved poses take the hands from Java `static_idle` (what every original gun's fp.hold uses) and the fixed arm
   offsets; the M9A4 was removed and re-ported. User re-test of v1.19.0: left hand right, **right hand missing, gun
   floats in inspect**, the same as the G17, G18, Golden Deagle, B93R and Timeless 50 (M1911, P320, Colt Python fine).
   Cause: those use the mirrored arm layout (right arm under `lefthand_pos`), which on a pistol puts the right arm in
   front of the camera. Fixed in v1.20.0: new `tools/weapons/arm-layout.mjs` puts each arm under its own hand bone
   with the P320's offsets (shifted when the hand bones sit elsewhere), applied to m9a4, g17, g18, deagle, deagleg,
   b93, t50; java-port.mjs runs it when the template has that layout (step 7). Checked outside the game: each arm now
   ends on its hand exactly as on the P320. **User tested v1.20.0 (2026-10-01): right hand holds the gun on all of
   M1911, B93R, G17, G18, Deagle, Golden Deagle, Timeless 50, Colt Python, P320, M9A4; M9A4 crafting (16 iron) and
   ammo correct.** One problem left: the M9A4's right arm swung up ("saying hi") while drawing. Cause: the draw plays
   on top of the hold and Bedrock adds them, and Java's draw gives the full hand pose (the right hand doubled).
   Fixed in v1.21.0: java-port.mjs makes the draw's hands relative to static_idle; the M9A4 was re-ported.
   java-port.mjs also takes the gunsmith recipe from Java now (no hand fix after each port). **Waiting for the user's
   test of the M9A4 draw** (switch to it: hands go straight to the grip). Fires from its controller (template P320),
   not by script yet. Java falloff gives 117% damage within 18 blocks. If the aim of a port is off, adjust
   `EYE_HEIGHT` / `EYE_DEPTH` / `HOLD_OFFSET` in `java-convert.mjs` (measured on 34 guns).
   **Fire modes:** the user noticed semi pistols (G17, P320) keep firing while the trigger is held. Every gun not on
   script firing repeats while held (its BP controller loops); `fireMode: "semi"` (one shot per press) only applies
   with `scriptFiring` (step 4).
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

- Order (user, 2026-10-01): M4A1 on script firing -> user tests -> import one Java gun (M9A4) -> import all Java
  guns -> convert all guns (including the imported ones) to script firing.
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

- The local zips folder must be named `reference/` (singular). Only that name is in `.gitignore` and read by the
  tools; a `references/` folder would be committed to GitHub.
- **Names in the player client entity's tables** (`sound_effects`, `animations`, ...) may only use letters, digits, `_`
  and `.`. v1.12.0-1.14.0 added sound names like `tacz:m107/m107_reload_up`; at home (2026-10-01) the guns were
  invisible and the third-person arms didn't move (the game fell back to the vanilla player). v1.15.0 renamed them
  to `tacz.m107.m107_reload_up`; `check.mjs` now rejects such names. If the guns disappear again, check the content
  log for player.entity.json errors first.
- **Pistol arms**: a pistol with the mirrored arm layout (right arm under `lefthand_pos`) shows no right hand in
  first person; third person looks fine. Fix with `tools/weapons/arm-layout.mjs <id>`. Copying arm offsets between
  guns only works within one layout (that was the v1.18.0 M9A4 bug). docs/HOW-IT-WORKS.md "What the player sees".

- Animation sound effects play only if the name is in `player.entity.json`'s `sound_effects` table (and in
  `sound_definitions.json`); `check.mjs` checks both.
- Functions in `tick.json` run without `@s`, so per-player commands there do nothing.
- Git Bash mangles `/paths` inside `node -e '...'` and backslashes in heredocs: put scripts in a file instead.
- Stopping a background shell task can leave its child processes running; check for leftovers before rerunning.
- Some pack files use Windows line endings; the tools keep each file's endings. Compare with
  `git -c core.autocrlf=false` when verifying round trips.
