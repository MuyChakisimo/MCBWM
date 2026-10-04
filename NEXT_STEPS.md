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

- Pack version **1.32.0** (both manifests; worlds need `[1, 32, 0]` in `world_*_packs.json`).
- 58 guns (41 original + 17 Java ports: every Java gun), 21 ammo types. Every gun fires by hitscan (no bullet entities).
- Stats live in `TACZ-B/scripts/config/` (`weapons.js`, `combat.js`, `recoil.js`, `ammo.js`, `attachments.js`).
- Tools in `tools/weapons/`: `check.mjs` (config vs pack and every pack reference; `--unused` lists unused
  definitions), `gun.mjs` (clone/remove a gun), `java-stats.mjs`, `java-convert.mjs`, `java-port.mjs`, `arm-layout.mjs` (first-person arms on their own hand bones), `reload-timing.mjs` (a ported gun's reload
  timing from Java), `png.cjs` (texture atlas for built-in scopes), `test.mjs`
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

**v1.32.0 (2026-10-04): the last Java guns, and reload timing from Java.** User test of v1.31.1 (ARs, report in
chat): Phase 0 works in game (2.10.0 scripts loaded, fire rates and reloads right, silencer read); still to try:
attachment menu, crafting, and the fire-rate fix on MK23 / revolvers / CP / M1014 / M95 / DB-4. The user asked to
import the Java guns before Phase 1, and decided **only sniper scopes zoom for now** (rest during visual testing).
- **Reload timing of ported guns was wrong**: script-reload.mjs took it from the BP reload animations, which ported
  guns inherited from their clone source (Rhino ended at 2.5 s, its animation is 4.23 s; Raging Hunter, RPK, M95,
  M9A4 ... too). New `reload-timing.mjs`: rounds in at Java's `reload.feed`, end = our first-person reload
  animation's length. Applied to all 13 ported guns (SPAS-12's shell reload left alone); java-port runs it. May
  explain some of the reported reload-hand problems (Raging Hunter, Rhino): **re-check them in game**.
- java-port: category from Java's type (RPK is Java "mg": now "heavy" like the M249); launcher-only settings
  (explosion, aimToFire, tracerParticles) dropped unless a launcher; `suppressedFrom` dropped (no muzzle
  attachments; the SPR-15 bug); a source gun that was itself ported counts for third-person placement (PORTED in
  java.cjs).
- **Springfield 1873** (sniper, .45-70, 1 round, 35 damage) and **Lone Trail** (pistol, .30-06, 1 round, 21.5) from
  the M320 (round in the item: no magazine resize). **AUG** (rifle, 5.56, 30, auto 710 rpm) from the M4A1 with its
  **built-in 4.25x scope**: the Java attachment model's parts join the gun model at `scope_pos` (reticle planes
  `division*` and camera markers left out; Java hides the rail mount), its texture is stacked under the gun's
  (`png.cjs`). The scope's view line is at the iron sight's height (12.06), so the computed aim pose fits it.
- **Test in game:** the three new guns (craft them; aim, fire, reload, inspect, sounds, third person); the AUG's
  scope on top of the gun and aiming through it; reloads of the Java-ported guns now play to the end (Rhino,
  Raging Hunter, RPK, M95, M320 especially).

**v1.31.1 (2026-10-04): fire-rate fix.** The user's all-guns report (reference/Console Report.txt, profile
_00-58-54) ran on the OLD pack (log: `version: 1.30.5`, profile: runCommandAsync in recoil.js), so Phase 0 is still
untested. It showed semi guns firing faster than their rpm (MK23 8-14 ticks vs 24; Rhino, Raging Hunter,
Taurus 943, M95, CP, M1014 a tick or more under): a press while the last press still waited replaced it and skipped
the wait. Also the first shot of a press could be a tick late and the next one counted from the late tick (DB-4
barrels 1 tick apart vs 2). Both fixed in firing.js. Script time 0.72 ms/tick (was 0.76); polling scripts
(attachmentState, storedAmmoDisplay, itemLore) still 0.32 ms of it. The 166 ms watchdog spike is the report itself
(~110 lines to chat and log), only on `tacz:debug stop`.

**Phase 0 done in v1.31.0 (2026-10-04): scripts on @minecraft/server 2.10.0, server-ui 2.2.0** (the 1.26.51 test
server's newest stable). Changes: runCommandAsync -> runCommand (attachment menu, crafting, recoil camerashake),
isValid() -> isValid, GameMode.Creative, startup world access waits for world.afterEvents.worldLoad (ammo
scoreboards, stale attachment preview). validate.mjs now also refuses those removed / renamed APIs by name (calls on
untyped parameters escape the type check). Nothing should change in game: **waiting for the user's regression test**
(fire, reload, attachments menu, gunsmith / ammo crafting, first world load creates the ammo scoreboards).
**Gunplay plan (2026-10-04): docs/GUNPLAY.md** (CoD-style feel; Bedrock APIs by version; phases 0-6, starting
with moving the scripts to @minecraft/server 2.10.0). User test of v1.30.4 (ARs): fire rates right; far-shot errors
came from reading `hit.block.typeId` past the ticking area (fixed v1.30.5); the action bar UI warning fixed v1.30.5.

1. **Ammo counter in the hitscan script (script firing).** **v1.24.0 (2026-10-02): 41 more guns converted with the
   new `tools/weapons/script-firing.mjs`** (removes the BP firing states, sets `scriptFiring`, and `shootSound` /
   `shootAnimation` / `suppressedFrom` when a gun differs from the defaults; refuses guns whose shot does more).
   Not converted yet (Batch 2, need firing.js support): AWM, M700, Kar98k (bolt: `krep:ammoreload` 1 + the BP
   `bolt`/`jawir` states), M870, SPAS-12 (pump, ammoreload 3), RPG and M320 (aim-only, no scoreboard), minigun
   (heat, wind-up), Vector and Golden Deagle (`krep:<id>_range`: cap by magazine attachment), MP7 (`mp7sound`),
   M1014 (item swap in the shot). **Waiting for the user's test** of the 41: semi = one shot per click, bursts
   (M16, B93R, Double Barrel), auto, ammo HUD, empty swap and reloads, silencer sounds (G17/SKS any muzzle).
   **User (2026-10-02): some guns silent when firing in v1.24.0** (which ones not said yet). All their `.shoot`
   definitions and files exist (checked). v1.24.1: firing.js plays the shot with the exact command the controllers
   ran (`playsound <sound> @a[r=30]` via runCommand) instead of `dimension.playSound`. If still silent: get the
   list of guns. The Blockception VS Code extension's ~18k "problems" are mostly deprecation notices for
   `query.get_equipped_item_name` (still works in game) and false "cannot find" items/functions/objectives (the
   files exist; objectives are created by script at world load); validate.mjs (Mojang's schemas and API) is clean.
   **v1.26.0 (2026-10-02): Batch 2 converted, 54 of 55 guns script-fired** (all but the minigun: heat, wind-up,
   ammo-box ammo). New firing.js options (script-firing.mjs fills them in): `cycle` (AWM, M700, Kar98k bolt;
   M870, SPAS-12 pump: `<id>:bolt` after the shoot animation, `<id>:normal` after the bolt animation, presses
   ignored until the old delay ends), `roundInItem` + `aimToFire` (RPG, M320), `capByMagazine` (Vector, Golden
   Deagle; HUD from their own function). MP7: its per-shot sound only played if a never-created `mp7sound`
   score was 0, so only the late loop sound was heard; now the shot sound plays every shot and the loop
   controller is removed. AA-12 set to auto (Java: auto, 350 rpm; it was semi). User's test of v1.25.1: AKM no
   reload animation the first time it ran empty (second time fine), P320 "a bit slow" (Java's 450 rpm), MP7 late
   sound, DB-4 left hand high/left. **Waiting for the user's test** of Batch 2: bolt and pump after each shot,
   RPG/M320 only while aiming, Vector/Golden Deagle with extended mags, MP7 sound, AA-12 auto.
   **User (2026-10-02): tested some guns on v1.26.0, "so far so good".** v1.26.1 cleanup: the 54 script-fired
   guns' `krep:<id>_fire` events, 21 BP animations only the removed firing states played (bolt/pump/delay/shoot
   timers) and the MP7 loop sound are removed (player.json about 1200 lines shorter); check.mjs now refuses a fire
   event on a script-fired gun and counts the default shoot animations firing.js plays.
   Earlier notes: **M4A1 done in v1.17.0 and tested by the user (2026-10-01): tap fire,
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
3. **Port the other Java guns.** 13 more ported in v1.22.0 (2026-10-01), short names given with `--name`:

   | ours | Java | from | notes |
   |---|---|---|---|
   | rpk "RPK" | rpk | type81 | Java has no reload/inspect sounds; kept the Type 81's |
   | kar98 "Kar98k", m700 "M700" | kar98, m700 | awp | |
   | m95b "M95" | m95 | m107 | id `m95` is taken (the M107 animation has a bone `m95_barrel`) |
   | spas12 "SPAS-12" | spas_12 | m870 | tube-fed (`reload: "single"`); inherited the M870's unused `fp.reload11` |
   | dblong "DB-4 Ursus" | db_long | db | Java has no sounds; kept the Double Barrel's |
   | cz75 "CZ75", mk23 "MK23" | cz75, hk_mk23 | p320 | CZ75 auto 900 (user's choice); MK23 is Java's 50 rpm |
   | rhino357 "Rhino 357", taurus500 "Raging Hunter", taurus943 "Taurus 943" | same | p320 (v1.22.3; cp before) | own-hand arms; Taurus 943 has no Java recipe (P320 recipe) |
   | spr15 "SPR-15" | spr15hb | m4a1 | inherits `scriptFiring` from the M4A1 |
   | m320 "M320" | m320 | rpg | inherits the RPG's `explosion`; 40mm ammo |

   Checked outside the game: `check.mjs`, `validate.mjs`; the arms of the 5 new pistols end on their hands as on the
   P320. **User test of v1.22.0 (2026-10-02): every gun invisible again (icons, firing and damage work; third-person
   arms at the sides)**, so the game rejected `player.entity.json` again. Cause: cloning the RPK from the Type 81 (the
   first gun in `variable.holding_all_guns`) copied that first term together with its assignment, making
   `... =='type81' || variable.holding_all_guns = ...=='rpk' || ...` (invalid Molang). Fixed in v1.22.1: the line,
   `gun.mjs` (an assignment's left side is no longer part of its first term), and `check.mjs` refuses a
   pre_animation entry with two assignments. Precautions in the same version: the expression (4632 characters) is
   split into `holding_guns_a` / `holding_guns_b`, and 19 Taurus 943 sound names with a part starting with a digit
   (`943_reload...`) are now `s943_...`; `check.mjs` refuses both. If still invisible: the content log names the
   error (v1.21.0 = `de7c9d2` rendered fine). **v1.22.1 still invisible (user, 2026-10-02).** Second break, same
   bug at the other end: cloning the M95 from the M107 (the last gun in that line) copied the closing `;` with the
   last term: `=='m107_emp'; || ...=='m95b_emp';`. Fixed in v1.22.2 (the gun.mjs fix already stops before the `;`);
   `check.mjs` refuses a `;` mid-expression. A Molang syntax pass over all 9000 Molang strings in both packs
   finds nothing new since v1.21.0. M320: wired exactly like the RPG (fires only while aiming/sneaking; reload =
   use the empty launcher with 40mm grenades); re-test once guns render.
   **User review of v1.22.2 (2026-10-02): all guns render again.** Per gun (fp = first person, tp = third person):
   - RPK: no ammo count; after inspect the gun disappears until firing; unlimited ammo; tp too high (by the ear);
     stock flashes toward the screen when starting to aim.
   - SPR-15: draw animation loops; left hand far left and up (on the barrel?); reload and ammo count work; tp good.
   - Kar98k: draw animation loops; otherwise good.
   - M700: bolt not animated after each shot (sound plays); empty reload fine.
   - M95: pass (ammo counter a bit late: old controller firing).
   - SPAS-12: reload: left hand stuck on the pump, arm visible on screen.
   - DB-4 Ursus: fp left hand far left/up (middle of the screen), right arm missing; tp good.
   - CZ75: reload: left hand doesn't bring the mag, reload restarts then stops; tp gun too low (inside the hand);
     jumps up then back when shooting.
   - MK23: left hand missing in reload; one-frame glitch in reload.
   - Rhino 357: draw loops; fp too low, reload too close to the screen; tp small and too close to the neck.
   - Raging Hunter: fp gun and arm shrunk; tp too high, too small.
   - Taurus 943: invisible in fp; tp between the legs; no reload animation or sound.
   - M320: ADS goes far left (sight not lined up); tp slightly too high.
   **Fixed in v1.22.3 (re-ported spr15, kar98, dblong, cz75, mk23 and the 3 revolvers), needs the user's re-test:**
   - Draw / reload / inspect / shoot loops: some Java animations are `"loop": true`, so the controller never got
     `all_animations_finished`; java-port.mjs drops it on the animations it replaces. Likely fixes the SPR-15,
     Kar98k and Rhino draw loops, the CZ75 reload restarting and the CZ75 jump when shooting.
   - Revolvers now port from the P320, not the Colt Python: the Colt Python's poses scale `joints` to 0.6 and tilt
     it (its own model is oversized), which shrank and misplaced the Java revolvers (Raging Hunter small, Rhino low,
     reload closer to the screen, probably the Taurus 943 invisible).
   **User re-test of v1.22.3 (2026-10-02):** draws fixed; revolvers right size. Reported: SPR-15 left hand too high and
   left; Kar98k reload not playing; DB-4 left hand too close and high; CZ75 glitch after reload, left hand missing in
   reload, tp needs to go up; Taurus 943 tp still by the legs; Raging Hunter and Rhino fire too fast (arm floats a bit
   in the Raging Hunter's animation); M700 bolt after a shot not animated.
   **Fixed in v1.22.4 (re-ported all but the RPK):**
   - Java `bolt` -> our `fp.bolt` / `fp.pump` (java-convert ANIMATIONS, java-port ROLES): the AWM's / M870's own
     bolt and pump animations were left in, moving bones the Java models don't have (M700, Kar98k, SPAS-12).
   - Kar98k reload: Java has `reload_empty_clip` (and round-by-round intro/loop/end), no `reload_empty`; it is
     now used for fp.reload and fp.tac (FALLBACKS in java-convert.mjs).
   - Fire rate of controller-fired semi guns without a bolt: BP `animation.<id>.shoot` length = 60 / rpm (the
     P320's 0.15 s made the revolvers fire about 400 rpm). Rhino 0.3 s, Raging Hunter 0.5, Taurus 943 0.333,
     MK23 1.2 (Java's 50 rpm), M95 0.397, DB-4 0.6, M320 0.4.
   - Third person: tp `joints` moved up/down by (source's thirdperson_hand - new) x joints scale, height only
     (z left alone: M95 -12, SPR-15/SPAS-12 +9 looked right). CZ75 +2.8, MK23 +2.3, Taurus 943 +3.2, M320 -3.3.
   - SPAS-12 shell reload still the M870's (Java's reload_intro / reload_loop / reload_end not mapped to our
     reload / reloadtac / rend states yet): left hand on the pump during reload.
   **Latest user re-test, following v1.22.4 (2026-10-02):**
   - Kar98k: empty and tactical reloads now play, but the gun jumps slightly up and back when a reload ends.
     Right hand missing during reload and inspect. The bolt cycle was part of the test request, but this report
     did not explicitly confirm its result; do not mark it passed yet.
   - M700: right hand missing during reload; the same small jump after reload as the Kar98k. After each shot,
     the weapon disappears for about two frames and returns. Bolt motion itself not explicitly confirmed.
   - Revolver fire rates: improved (user confirmed).
   - SPR-15: left hand still far out of position in first person.
   - Taurus 943: still near the floor, between the legs, in third person.
   - CZ75: left hand missing during reload. This report did not explicitly confirm third-person height or the
     earlier after-reload glitch; keep those open until confirmed.
   - MK23: placement now looks good. User's wording about the reload left arm was ambiguous ("except left arm
     now spawning on reload"); clarification requested before marking the missing-hand issue fixed.
   - M320: still far to the left when aiming/crouching. Third-person height not explicitly confirmed.
   - SPAS-12: reload left hand stays on the pump/barrel handle; gun briefly disappears after each shot;
     right hand missing during inspect. Pump motion itself not explicitly confirmed.
   - RPK and DB-4 Ursus: no new result in this report; earlier issues remain open.
   **Rifles, one hand missing (user, 2026-10-02):** most ARs show no right (grip) hand; FAL, Type 81 and SPR-15 show
   no left (support) hand. Not a regression: the rifles' arm files are unchanged since v1.16.0 (original pack).
   Test at FOV 110, M4A1 aiming: left arm visible, still no right arm right under the sight, so not off-screen.
   Reading: the mirrored layout puts each arm ~12 units to the other side of its hand bone compared with the
   own-hand (P320) layout; at the grip that buries the arm inside the receiver. The support arm sits on the same
   side in both layouts (why it shows). **v1.23.0: arm-layout.mjs (P320 own-hand) applied to the 11 mirrored
   rifles** (g3 g36 hk416 m16 m16a1 m4a1 qbz191 qbz95 rpk scarh scarl); arm-layout.mjs now also finds the M16s'
   unnumbered `taczuniversal` arms model. **Waiting for the user's test.** Still open: FAL / Type 81 (arms
   under rhand/lhand, an older rig; arm-layout doesn't handle it) and SPR-15 (own-hand since v1.22.5, left arm
   missing: its Java hand bones sit 9 units further forward, maybe inside the handguard).
   RPK "jump" on switching = Java's draw (swings in tilted, small overshoot); can be smoothed if wanted.
   **v1.22.5 import repair implemented (2026-10-02; awaiting in-game confirmation):**
   - Kar98k/M700: BP reload and bolt durations now match RP recovery, and BP ammo timelines are rescaled with
     the reloads. Preserve late Java recovery keys (Kar98k clip reload 3.55 s; bolt 1.4667 s), rather than cutting
     them off at the exported animation_length. RP actions hold their final pose until the controller releases;
     outgoing reload/inspect blends return to hold smoothly. M700 bolt 0.85 s, tactical reload 2.6 s.
   - Kar98k, M700, SPAS-12 and SPR-15: gun and skin-arm geometries now attach each arm to its own Java hand
     chain, with P320 arm offsets adjusted for each model's hand pivots. This is intended to restore missing
     right hands and correct the SPR-15 support hand; visual confirmation is still required.
   - CZ75/MK23: hold/reload root orientations now use the same 180-degree value, with shortest-path action
     blends and held recovery poses. Their own-hand layout is retained. Re-test the missing reload left hand;
     its visibility is not proven by the offline checks. MK23 third-person joint placement is retained.
   - SPAS-12: replace inherited M870 static reload hands with Java reload_empty_intro/reload_intro, repeated
     reload_loop stages and reload_end. Empty reload awards five shells (one chamber + four tube); tactical
     can add five up to the existing six-round limit. Ammo commands and Java sound cues follow the stages.
     The BP finish states now wait for the 0.8667 s closing animation; RP enters rend before returning to hold.
     The pump is 0.6 s in both packs and holds its final pose during delayed property cleanup.
   - Taurus 943: align its third-person grip to the working MK23 grip in hold, aim and sprint (including the
     rotated/scaled sprint offset), and target body instead of the nonexistent torso bone. This is a placement
     correction to test, not confirmation that the between-the-legs rendering issue is resolved.
   - M320 first-person ADS: account for iron_view's sideways offset and 7.5-degree pitch, removing the inherited
     RPG aim roll. Re-test crouching/aiming in both camera views; third-person launcher aim is not verified.
   - Normalize inherited Joints channels to the converted joints bone. No damage, recoil, recipes, attachment
     rollout or script-firing rollout in this step. Previously improved revolver fire rates remain unchanged.
   - Added tools/weapons/import-repair.mjs, invoked by java-port.mjs for these source guns, so re-porting retains
     the repairs. It can also repair existing imports without replacing their weapon configs. Re-running it
     was byte-for-byte idempotent across pack files. import-repair.test.mjs checks recovery gaps, reload shell
     counts, moving SPAS hands, sight alignment, arm parents and the confirmed MK23 joint position.
   - Validation: check.mjs passed (55 guns, 21 ammo types); validate.mjs passed scripts and 684 schema-checked
     JSON files. Final scratch clone/remove/port suite passed 33/33, including fresh ports of all eight repaired
     guns (plus RPK, Rhino and DB-4) and byte-for-byte pack restoration after removing each port. git diff
     --check passed. No commit or push made; user commits the changes.
   **Pre-repair code leads (historical evidence):**
   - M700 BP bolt state lasts 1.25 s, while RP fp.bolt lasts 0.85 s without hold_on_last_frame. SPAS-12 BP bolt
     lasts 0.75 s, while RP fp.pump lasts 0.60 s without hold_on_last_frame. Their RP bolt states exit on the
     BP ammoreload property, so a completed animation may leave a pose gap before the state exits.
   - Kar98k BP tactical/empty reloads last 3.0/3.7 s; both RP reload animations last 3.45 s. M700 tactical reload
     is 3.0 s in BP vs 2.6 s in RP. Check these timings and blends when investigating the end-of-reload jump.
   - Kar98k, M700 and SPAS-12 still use mirrored arms (rightArm under lefthand_pos). Trace both hand chains
     through reload/inspect poses before changing their layout or offsets; do not apply a pistol fix blindly.
   - M320 Java iron_view has pivot [2,16.54788,7.95971] and rotation [7.5,0,0]. java-convert.pose() currently
     uses only pivot y/z, sets aim x to zero, and ignores rotation; the port also keeps the RPG's aim roll.
     Check the sight's full transform when aligning ADS.
   **Still open, with leads:**
   - Third person: every Java model has a `thirdperson_hand` bone (Java display scale 0.6). Same as the template's
     (M9A4 = P320: [0,8,1.75]) looks right; CZ75 is 3.25 lower (looks too low), M320 4.4 higher than the RPG (too
     high). Shift the tp animations by the difference (which bone: the tp anims move torso/arms; find what carries
     the gun). Type 81 and Colt Python aren't Java models (no reference); RPK too high needs its own offset.
   - Left hand off: SPR-15 (from M4A1), DB-4 Ursus (the Double Barrel's arms hang off rightHand/leftHand, not *_pos:
     right arm missing). Reload left hand: CZ75/MK23 missing, SPAS-12 stuck on the pump. Check the Java reload's
     `lefthand` / `mag_and_lefthand` keyframes against our arm layout (fk.cjs / rel.cjs in a scratch dir).
   - RPK: no ammo HUD, unlimited ammo, gun gone after inspect until firing (Type 81 template; objective exists).
   - M700: Java fp.bolt is now mapped in v1.22.4; latest report is a brief disappearance after each shot and
     missing reload right hand (see re-test and timing leads above). Do not keep treating it as an unmapped bolt.
   - M320 ADS far left: its aim pose (Java `iron_view`) is probably wrong for a launcher.
   The M320's description said RPG-7 rockets (copied from the RPG); it already reloaded 40mm grenades. Fixed text.
   **Next:** focused v1.22.5 in-game re-test: Kar98k/M700 empty + tactical reload and each-shot bolt; SPAS-12
   empty + partial + interrupted reload, limited loose ammo/ammo box/creative, pump and inspect; SPR-15 hands;
   CZ75/MK23 reload hands; Taurus 943 third person; M320 crouched ADS in first and third person. Also test the
   last shot before empty, switching weapons mid-action, and listen for reload sounds. No new in-game test
   has been performed by the agent. User confirmed (2026-10-02) that the missing/misplaced hands, including
   CZ75/MK23 reloads and SPR-15, were seen in first person. MK23 wording clarification remains pending.
   Other guns still need confirmation of first person hold/aim/draw, reloads, inspect, sounds,
   crafting, ammo. Recipes are Java's (the M95 is 300 iron, 60 gold, 15 diamonds, 3 netherite, 5 blaze rods).
   **All Java guns ported (v1.32.0):** springfield1873 and lonetrail from the M320 (one round in the item, no resize
   needed), aug from the M4A1 with its built-in scope merged in.

   Ported guns start with no attachments (`java-port.mjs` strips what the clone inherited). Still to build: Java
   attachments for ported guns (Java has 100+ attachment models). Each port adds
   an always-running `<id>reloading` controller (step 4).
3b. **Reloading in the script.** **v1.27.0 (2026-10-02): M4A1 converted as the test gun.** New `combat/reload.js`
   (empty reload = use with `krep:<id>_emp`; tactical = swing with at least 2 rounds missing, from the shared BP
   controller `controller.animation.reload_input` in `shared_reload.json` that sends `/scriptevent tacz:reload`).
   It counts the ammo item in the inventory (`krep:ammoboxc` = unlimited; creative mode takes nothing), sets the
   mark variant the RP reload animations watch (krep:reload / krep:reloadtac), loads at the old timing (empty 2.3
   of 2.5 s, tactical 2.0 of 2.2 s: `scriptReload` in weapons.js), swaps the empty gun back, shows the HUD, and
   cancels if the gun is switched before the rounds go in. New `tools/weapons/script-reload.mjs` reads the timing
   from the BP reload animations and removes the gun's reload controller, BP reload animations, `<id>reloadN` /
   `krep:<id>_reload` events (32 for the M4A1) and its quantity / reload functions; it refuses shell-by-shell
   reloads. java-port's magazine resize skips the reload files when a gun has none. **Waiting for the user's
   test** (M4A1: empty and tactical reloads, partial ammo, no ammo, creative ammo box, switching mid-reload); then
   convert the rest in batches (shell-by-shell shotguns/revolvers and the minigun need reload.js support).
   **User test of v1.27.0 (2026-10-02, M4A1): all good** (empty and tactical reloads, inspect, 30 -> 31 with a
   chambered round, partial ammo in survival, "No ammo", switching mid-reload loads nothing, creative ammo box).
   One wish: after emptying the magazine the reload needed a new press (also seen on the AKM).
   **v1.28.0:** auto reload: when the last round is fired the empty reload starts by itself 0.25 s later
   (firing.js emptyListeners -> reload.js). 42 more guns converted with script-reload.mjs (every gun but the 10
   below). New option `chamber: false` (AA-12, Colt Python, Rhino, Raging Hunter, Taurus 943): never more than
   the magazine (the AA-12's and Colt Python's old caps had no +1; revolvers have no chamber). reload.js also
   refuses a tactical reload while a bolt / pump cycles (the controllers checked krep:ammoreload). **Not converted
   yet** (refused by the tool, each needs reload.js support): Vector, Golden Deagle (one reload state per
   magazine attachment), RPG, M320 (one round, item swap), M870, SPAS-12, M1014 (shell by shell), Double Barrel,
   DB-4 (extra reload state), Evolys, M249 (`evolys:bulletcache` in the tactical reload), minigun.
   **Waiting for the user's test** of the 42 (reload timing per gun, auto reload).
   **v1.29.0 (2026-10-03): 8 more** (reload.js options written by script-reload.mjs): Evolys, M249 (`tacEvents`
   evolys:bulletcache at 2.28 s, `reset` evolys:reset), Double Barrel, DB-4 (`emptyOne`: the shorter one-shell
   reload; `emptyProperty` [641, 642] because their RP reload states wait for krep:ammoreload == 641 / 642),
   Vector, Golden Deagle (`byMagazine`: timing and caps per magazine attachment; Golden Deagle firing cap for
   magazine 1 corrected 12 -> 13 to match its reload), RPG, M320 (round into the item; no tactical reload).
   `chamber: false` added for Evolys, M249 and both double barrels (old caps had no +1); a 2-shell gun can
   tactical-reload with 1 missing. **Left on the old reload:** M870, SPAS-12, M1014 (shell by shell; their RP
   reload / rend states watch krep:ammoreload 411 / 412 / 420) and the minigun (ammo box). **Waiting for the user's
   test** of the 8.
   **v1.30.0 (2026-10-03): shell by shell, 54 of 55 guns now reload from the script** (all but the minigun). M870,
   SPAS-12, M1014: `scriptReload.shells` { empty / tac: shell times, perCue (M1014: 2 after the first), finish,
   loading 411, ending 412 }: reload.js sets krep:ammoreload to `loading` (the RP reload plays), loads a shell at
   each time until full / out of ammo / fire pressed, then `ending` (RP closing animation) for `finish` s.
   firing.js no longer shoots during any reload (mark variant 1 or 2), so a press stops a shell reload instead.
   Tactical shell reloads need only one round missing. User report 2026-10-03: MP7 sound late / quiet the first
   time, fine the second (not re-tested). **Waiting for the user's test** of the shotguns.
4. **Lag: gate the always-running BP controllers.** **v1.25.0 (2026-10-02):** the 54 `<id>reloading` controllers
   in `entities/player.json` `scripts.animate` now run only while their gun is held or any reload is in progress
   (`... || q.mark_variant != 0`, so a reload interrupted by switching guns still cleans up). Left ungated on purpose:
   `mp7sound` (would leave its loop sound playing), `minigun`, and the 5 scope controllers (could leave the zoom on).
   Same version, client side: `player.entity.json` pre_animation asked `query.get_equipped_item_name` 332 times per
   frame per player; now 112 (`variable.<id> = variable.<id>b || variable.<id>emp` and `holding_all_guns` an OR of
   the gun variables, both at the end of pre_animation). Simulated for all 112 held items: same values as before.
   Storing the item name in a variable was avoided (string variables are not reliably supported). **Waiting for the
   user's test**: all guns render; switch guns mid-reload (empty and tactical), then reload both guns.
5. **Unfinished features** (animations exist, nothing plays them; `check.mjs --unused`): M16/M16A1 walk, minigun
   barrel spin (`animation.minigun.spin`, `controller.animation.minigun.tp`), M870 shell-by-shell reload intros
   (`m870_fp_rintroemp` / `m870_fp_rintrotac`, `fp.reload11`).
6. Empty-magazine inspect for the 22 guns that have none (Java has them; `java-convert.mjs` converts `inspect_empty`).

## Future ideas (user)

- **Muzzle flash lighting** (2026-10-02): each shot lights up dark places (caves) for a split second. Bedrock has no
  dynamic light from entities; the usual way: in firing.js, place `minecraft:light_block` (level ~12-15) in the air
  block at the shooter's head for 1-2 ticks, then set it back to air (only if that block was air; skip if a light is
  already there). Costs two block changes per shot, so maybe only every few shots on full-auto guns.

## Decisions the user already made (don't re-ask)

- Order (user, 2026-10-01): M4A1 on script firing -> user tests -> import one Java gun (M9A4) -> import all Java
  guns -> convert all guns (including the imported ones) to script firing.
- Order (user, 2026-10-02): test the performance work (v1.24.0 script firing, v1.24.1 shot sound, v1.25.0 gating
  and fewer item queries) -> visual and sound fixes by category -> then Batch 2 script firing / reloading in script.
- Platform (user, 2026-10-02): plays on an AYN Odin 2 (Android handheld, built-in controller): the mod must run
  well on mobile; prefer controller-friendly behaviour (e.g. auto reload when the magazine runs dry).
- Gunplay (user, 2026-10-04): see docs/GUNPLAY.md "Decisions" (no aim assist; optional hit marker with server
  default + per-player toggle; GTA IV-style spread growth while holding the trigger, hip and ADS; recoil = shake
  only; muzzle flash light except silenced; crouch-to-aim stays).
- Pistols (user, 2026-10-01): semi-auto, one shot per click, except the B93R (burst) and G18 (auto). Already so in
  `weapons.js`; takes effect with script firing. The user tested that the M1911 now fires while held and is OK
  with it becoming one shot per click.
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

- **User test of v1.25.1 (2026-10-02): content log empty at world load.** Mostly looks great; some guns fixed;
  open: some guns' shot sounds are late (which ones not said yet), arms and animations sometimes off.
- **Test report** (v1.29.2, combat/debug.js): in the server console `scriptevent tacz:debug start`, play, then
  `scriptevent tacz:debug stop` prints a report per gun to chat and the server console (console only with
  content-log-console-output-enabled=true; shots, time between held-trigger shots vs its rpm,
  sounds, reload counts and load / end times, cancels, no-ammo, auto reloads). `on` / `off`: a live line per shot
  and reload step. Ask the user for that log
  when timing or sound problems are reported (e.g. 2026-10-03: MP7 sound late or quiet the first time, fine
  the second; maybe the first play of a sound loading from disk).
- **The test server's console** (content-log-console-output-enabled=true) found, 2026-10-03: 11 BP animation files
  left with `"animations": {}` after reloading moved to the script (cz75 g36 m9a4 mk14 mk23 p320 rhino357 rpk
  taurus500 taurus943 type81): Minecraft rejects an empty animation file. Deleted in v1.30.2; the tools delete such a
  file instead of emptying it, and check.mjs refuses empty animation / controller files.
- **First test report** (user, 2026-10-03, v1.30.1, 15 min, 54 guns): auto fire rates match rpm (AKM 1.9 ticks
  vs 2.0, M4A1 1.5 vs 1.5, Vector 1.0 vs 1.0 ...); every gun played its shot sound (MP7 too); every reload kind
  timed as configured (auto reloads seen). Found and fixed in v1.30.3: (1) LocationInUnloadedChunkError from
  getBlockFromRay when a ray reached chunks the server doesn't tick (tick-distance=4) cancelled the whole shot,
  damage included (SCAR-L/H, M16, QBZ-191, RPK, M870, Saiga, AA-12); hitscan.js now shortens the ray, tracers and
  impact puffs stop silently there. (2) The SPR-15 played its silenced sound because another gun's silencer set the
  shared krep:muzzle property; only guns with `suppressedFrom` (MP5, Vector, HK416, G17, AKM, M4A1, Golden Deagle,
  SKS) are silenced now. (3) The report flagged semi guns as slow (that's click pace); it now judges only auto and
  within-burst gaps. Watchdog spike 163 ms at "stop" = printing the report (fine).
- **First script profile** (user, 2026-10-03, v1.30.3, 15 min on the test server, `script profiler start/stop`;
  file in reference/, analysed with a scratch script): all TACZ scripts together ~0.76 ms per tick on average (budget
  50 ms). By file: firing.js 26% (incl. hitscan while shooting), items/storedAmmoDisplay.js 19%, items/itemLore.js
  12%, attachments/attachmentState.js 11% (these three poll every 1-20 ticks even when nobody shoots: ~0.3 ms/tick,
  could become event-driven), hitscan 13%, reload.js 8%. Note: the .cpuprofile credits the idle time between
  ticks to the first function of each tick (System::currentTick in firing.js, World::getPlayers in
  attachmentState.js: 18,098 samples each = one per tick); count gaps > 1 ms as one sample to get real time.
  The far-shot fix of v1.30.3 only covered getBlockFromRay; getEntitiesFromRay threw the same error (shots still
  lost: SPR-15, HK416, M16, M16A1, minigun ...). v1.30.4 shortens that ray too; hitscan errors now log a stack.
- **Turn on the in-game content log** (Settings > Creator > Content Log GUI): it names errors our checks missed.
  First run (user, 2026-10-02, v1.25.0) found, fixed in v1.25.1: Taurus 943 animation bone "release button" (a space:
  the game rejected its whole animation file, why it was invisible in first person / between the legs in third;
  java-convert now strips such characters, check.mjs refuses them); `textures/nothing` missing (all 110
  attachables; now a 1x1 transparent PNG); muzzle smoke particle `krep:nothin` never existed (25 cues in 16 shot
  animations removed); G36 third-person `animation.humanoid.slide` doesn't exist (removed; check.mjs's vanilla
  rule accepts any animation.humanoid.* so it can't catch this kind); blocks.json format_version. Left: UI warning
  "Unknown property texture in hud_actionbar_text" (the original pack turned the vanilla image into a panel): v1.30.5
  keeps it an image with textures/nothing (transparent).

- **Player entity rejected = every gun invisible** (icons, firing and damage still work; third-person arms at the
  sides). Causes so far: names with `:` or `/` (v1.12.0-1.14.0); an invalid Molang line from `gun.mjs clone`
  (v1.22.0: an assignment and a `;` copied into the middle of `holding_all_guns`). `check.mjs` also refuses, as precautions, sound names with a part starting with a digit and Molang
  expressions over 4000 characters. The in-game content log (Settings > Creator) names the exact error.

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
