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

- Pack version **1.34.2** (both manifests; worlds need `[1, 34, 2]` in `world_*_packs.json`).
- 58 guns (41 original + 17 Java ports: every Java gun), 21 ammo types. Every gun fires by hitscan (no bullet entities).
- Stats live in `TACZ-B/scripts/config/` (`weapons.js`, `combat.js`, `recoil.js`, `ammo.js`, `attachments.js`).
- Tools in `tools/weapons/`: `check.mjs` (config vs pack and every pack reference; `--unused` lists unused
  definitions), `gun.mjs` (clone/remove a gun), `java-stats.mjs`, `java-convert.mjs`, `java-port.mjs`, `java-attach.mjs` (Java attachments onto a gun), `held.cjs` (held-gun numbers), `arm-layout.mjs` (first-person arms on their own hand bones), `reload-timing.mjs` (a ported gun's reload
  timing from Java), `config-sync.mjs` (lore Group / Caliber / Damage and creative groups from the config), `png.cjs` (texture atlas for built-in scopes), `test.mjs`
  (tests the tools on a scratch copy; run it after changing any tool).
- `docs/HOW-IT-WORKS.md`: each system step by step and a troubleshooting table. `docs/NAMING.md`: Minecraft's
  naming/format rules and what every name means. `tools/weapons/validate.mjs`: checks scripts against Mojang's API
  definitions and pack files against the Bedrock JSON schemas.

## Known-good states (tags)

- **v1.33.9, tag `stable-v1.33.9`** (commit 7c2260a): the user tested it in game on 2026-10-05, "everything seems to
  work just fine". 58 guns, all script-fired and script-reloaded except the minigun. Return with
  `git checkout stable-v1.33.9`. Checks at tagging: check.mjs, validate.mjs (API 2.10.0, 605 files) and test.mjs
  (38/38) all pass.
- **v1.16.0, tag `stable-v1.16.0`** (commit f381f30; the tag was only created on 2026-10-05, earlier notes said it
  existed): before the Java ports.

Tags are pushed separately: `git push origin --tags`.

### v1.16.0

Tested in game by the user on 2026-10-01: guns visible in first and third person, damage, animations and sounds all
work. Everything listed as untested in earlier handoffs (v1.10.0 to v1.14.0: instant workbench menus, sounds that
never played, SKS suppressed shot, pistol walk sway, empty-magazine inspects, per-gun headshot multipliers and damage
falloff, the six new ammo types) is part of this tested state. Return to it with `git checkout stable-v1.16.0`.

The invisible-guns bug at v1.12.0 to v1.14.0 was the game rejecting `player.entity.json` (fallback to the vanilla
player) because 96 `sound_effects` names contained `:` and `/`; fixed in v1.15.0, and `check.mjs` now rejects such
names. Symptom to remember: guns invisible and third-person arms not posed, but firing, sounds, tracers and damage
work.

## Next, in order

**START HERE (updated 2026-10-05, packs at v1.34.2, not pushed; last stable tag `stable-v1.33.9`).** Order agreed with the user:
audit -> stable tag -> script review fixes -> minigun -> last BP controllers -> attachment bench -> held-gun number -> Java attachments pilot (all tested by the user: "works great") -> **attachment rollout (now: shared models done in v1.34.2, then Java's part rules, then gun by gun; plan below)**
-> visual pass gun by gun, with **Phase 2 accuracy** tuned per gun during it. User's focus (2026-10-05):
stability, especially with several players; everything on the script build; then visual bugs, each gun passing
every test.

**Attachment rollout, plan (2026-10-05, user: "let's start"):** the user tested v1.34.1 on the Odin ("works great")
and the binding test passed (the shared ACOG sat correctly on the AKM). So **one shared model per attachment**.
Steps: **1. shared models (v1.34.2, done: the M4A1's 49)** -> 2. the gun's own parts by Java's rules, generated
instead of hand-written (Java TACZ's code builds `<type>_pos` / `<type>_default` from the slot type and names
`sight_folded`, `handguard_default` / `handguard_tactical`, `attachment_adapter`; attachments' `adapter` (13: the
OEM stocks have no model, they show the gun's own adapter bone) and `show_mount` / `show_muzzle` say the rest) ->
3. roll out gun by gun, by class; guns missing a mount bone (FAL, G18, MP7, CP, DB, DB-4, Taurus 943, M320,
minigun, RPG; others miss some slots) handled separately (the original pack's models share Java's coordinates:
checked for the M4A1's sights). 82 different attachments over 1,404 gun / attachment pairs (Java allow lists; the
tool's count counts only slots whose mount bone the gun has).

**v1.34.2 (2026-10-05): one shared model per attachment.** `java-attach.mjs` rewritten: each attachment is
`TACZ-R/models/entity/attachments/<att>.geo.json` (`geometry.tacz_att.<att>`), Java's bones in Java's coordinates
under `tacz_att_root` bound to the mount bone (`"binding": "'scope_pos'"` ...); for the ACOG it is bone for bone the
model the user tested on the AKM. The guns with attachments are GUN_ATTACHMENTS' keys; every run rebuilds all files
from that list (`--sync`, `<gun>` adds, `--remove <gun>`). MODEL_INDEX is per slot and attachment (was per gun and
attachment); javaAttachments.js reads it so. Removed: the M4A1's 49 per-gun copies, the binding test (model, render
controller, `krep:att_test`, `/scriptevent tacz:atttest`). check.mjs compares the flat model list (refuses a leftover
per-gun folder); gun.mjs refuses to remove a gun listed in GUN_ATTACHMENTS. Size stays ~40 KB per attachment
whatever the number of guns (82 attachments: ~3 MB; per-gun copies would have been ~68 MB).
**Test in game (M4A1, should look exactly as in v1.34.0):** fit one attachment of each kind at the bench: it shows in
the right place in first and third person and follows the gun (aim, reload, inspect, sprint); reticles glow; the
ACOG zooms a little; a silencer quiets the shot; another player sees them; other guns show nothing extra.

**v1.34.1 (2026-10-05): far shots check the loaded chunks first.** User: "we definitely want the system to be
cleaner". hitscan.js `loadedRange`: before casting, `dimension.isChunkLoaded` every 8 blocks along the aim; all the
shot's rays (and its tracers) stop at the last loaded point. The old throw-and-retry in blockRay / entityRay stays as
a safety net (a pellet drifting sideways into an unloaded chunk). Tested offline with a fake world loaded up to
5 / 64 / 70 / 150 / 1000 blocks: the rays always stay inside. **Test in game:** shots at long range on a server with
a small tick-distance still hit what's within reach; no `[TACZ Hitscan]` errors in the console.

**v1.34.0 (2026-10-05): Java attachments, pilot on the M4A1. Needs the user's test.** User decisions: attachments
are **free at the bench**; Java's **replace** the original pack's numbered parts gun by gun; magnified scopes: **scope
overlay** while aiming (not built yet: first see whether Java's own scope models, which keep their reticle planes and
lenses like the original pack's built-in ACOG / ELCAN that the user liked on the AKM, already look right; the AUG
looked solid because its port left the reticle out). How it works: docs/HOW-IT-WORKS.md "Crafting and attachments".
The M4A1 now has 49 Java attachments (15 sights / scopes, 9 muzzles incl. the M9 bayonet as a muzzle, 12 grips, 9
stocks, 4 lasers); its old menu and parts are off (config/attachments.js and recoil.js entries removed, render
controller: old parts false, iron sight / muzzle / handguard follow the Java slots). Placement checked offline:
Java's sights + the mount pivot land where the original pack's built-in ones are (Coyote, T2 within 0.1 px).
Simulated: fitting, model numbers, switch guns (0), ACOG FOV 55, Ursus silencer sound, recoil product, red dot no
zoom, removing, a stored attachment that doesn't fit ignored. Also: attachmentState.js sets krep:stock ... to 0 when
the held gun has no numbered parts (before: the previous gun's values stayed, e.g. the SKS could play its silenced
sound after holding a silenced gun). Tools: gun.mjs leaves the Java attachment files alone (a clone starts without
them; removing a gun with them is refused: `java-attach.mjs --remove <gun>` first); check.mjs refuses a stale list.
**Size decision pending:** per gun copies are ~40 KB per model (2 MB for the M4A1); all 1,662 Java pairs ~68 MB (the
gun models are 22 MB) — too much for phones. Test for the alternative: `/scriptevent tacz:atttest on`, hold the AKM:
a shared ACOG (raw Java coordinates, root bone bound to `'scope_pos'` with Bedrock's bone `binding`) is drawn. If it
sits on the AKM's rail and follows reloads / inspects, every attachment becomes one shared model (~4 MB for 99);
if it floats elsewhere or doesn't show, per-gun copies with fewer attachments per gun, or another approach.
**Test in game:** attachment bench with the M4A1: every slot lists Java's attachments with icons; fit one of each:
it shows on the gun in first and third person, in the right place, and moves with the gun (hold, aim, reload,
inspect, sprint); sights: is the reticle visible through red dots / holo sights and the ACOG / ELCAN / HAMR /
QMK-152 (if a scope looks solid when aiming, that's where the overlay comes in); the ACOG zooms a little, red dots
don't; a silencer quiets the shot and no muzzle flash light; recoil feels lighter with grips / stocks / brakes;
iron sight / default muzzle / handguard hide when replaced; another gun (AKM) still has its old menu and parts. Then
the binding test above. Report anything floating or misplaced (which attachment, which view).

**v1.33.14 (2026-10-05): the held gun as a number for the resource pack. Needs the user's test.** User agreed to
the remaining performance idea (mobile hosting / playing). New `items/heldGun.js` writes the player property
`krep:held` (int 0..255, client_sync) when the held item changes: `config/held.js` (generated by
`tools/weapons/held.cjs`, stable numbers: 2n loaded, 2n+1 empty, 0 no gun). `player.entity.json` pre_animation now
has `variable.<id>b = q.property('krep:held') == 2n;` / `emp == 2n+1` instead of 118
`query.get_equipped_item_name` text lookups per player per frame (2 were duplicates: db / dblong, removed). gun.mjs
clone / remove regenerate both (a clone that copied its source's number gets a new one); check.mjs refuses a stale
held.js or a gun line that doesn't compare krep:held. Cost: a client learns about a gun switch about a tick later
(the property is synced), so the draw starts that much later. test.mjs 37/37.
**Test in game:** every gun shows in first and third person when switched to (loaded and empty), draws, reloads
(the empty item's reload animation), inspects; switching quickly between guns; another player sees your gun
change. If a gun is invisible: content log, and `node tools/weapons/check.mjs`.

**v1.33.13 (2026-10-05): attachment bench without holding the gun. Needs the user's test.** User: "we have to be
holding the item ... but that makes our counter go down"; wanted to use the bench with any (or no) item and apply
attachments only if the gun is in the hotbar or inventory. attachmentMenu.js lists only the guns the player carries
(loaded or empty, anywhere in the 36 slots; a message lists which guns take attachments if none); every step checks
the gun is still carried (was: held). Attachments were always stored per player and gun type, so nothing else
changes. Preview needs the gun in hand: it switches to the gun's hotbar slot; a gun only in the inventory gets "move
it to your hotbar". The click that opens any workbench no longer fires the held gun: workbenchBlocks.js calls
`holdFire` (firing.js ignores presses for 5 ticks and stops a shot in progress). Simulated (bench click: no shot,
rounds kept; a press afterwards fires).
**Test in game:** use the attachment bench with an empty hand, with a sword, with a gun: the menu lists only the
guns you carry; fit a grip on a gun that is in the inventory (not hotbar), then take it out: the grip shows; Preview
with the gun in the hotbar switches to it; with it only in the inventory, the message; using any bench with a loaded
gun in hand doesn't take a round.

**Performance comparison with the original v1.0.2 (2026-10-05, scratch script on the reference zip):** server side
per player per tick: original 88 BP animate entries (93 controllers, 1350 item-name queries), 39 tick.json
functions, 40 bullet entity types, 1186 player.json events; ours 0, 0, 0, 0, 68 (scripts run on events and only
while someone fires / reloads). Client side per player per frame (every viewer, for every player it sees): original
245 `query.get_equipped_item_name` in pre_animation, 123 animate entries, 80 render controllers; ours 118, 177, 116
(more guns: 58). **Remaining idea (not done, user's call):** a script-set int property `krep:held` (on held change)
and `v.<id>b = q.property('krep:held') == N;` in pre_animation instead of 116 item-name string queries per frame;
cost: the client sees a gun change a tick later (draw animation starts one tick later). The 29 item-name queries in
`shared_player.json` are vanilla (crossbow, map, shield).
**Java attachments (question 2026-10-05): not ported.** Ours are the original Bedrock pack's: parts built into 12
guns' models (mp5 vector g17 akm m4a1 hk416 awp deagleg db fal mk14 qbz191), picked by number at the bench. Java has
99 attachment items (19 sights, 16 muzzles, 13 scopes, 12 grips, 11 stocks, 5 lasers, extended mags ...) as
separate models mounted on each gun. Ported Java guns have none (java-port strips the clone's).

**v1.33.12 (2026-10-05): no BP animation controllers left; old-system leftovers removed. Needs the user's test.**
User: "anything that improves performance & not need to make a lot of unnecessary calls is better", then review that
nothing of the old system is left. The last three per-player, per-tick BP controllers are scripts now, so the
player runs **no** BP animations at all (4 this morning):
- Tactical reload: `playerSwingStart` in reload.js (was `reload_input`: watched every player's arm swing, sent
  `/scriptevent tacz:reload`). **Only attack / mine swings** (and `None`): opening a chest / workbench, placing,
  dropping or throwing with a gun in hand no longer reload (the controller reacted to any swing). The debug log
  (`tacz:debug on`) prints each swing's source: if left click ever stops reloading, check which source it reports.
- Inspect: new `combat/inspect.js` on the same event (was `controller.animation.akm.inspect`: ~110 Molang
  conditions per player per tick). Same rules: full magazine (Vector / Golden Deagle per fitted magazine), any
  swing for the RPG / M320 / Springfield / Lone Trail / minigun, the empty item for the 40 guns the controller listed
  (`emptyInspect: true` in weapons.js; 16 of them have no empty-inspect animation: hk416 g3 cp aa12 m16 m16a1 m249
  type81 b93 vector awp m700 kar98 deagle mp5 scarh, visual pass). `krep:inspect`, then `krep:noinspect` 2 ticks later.
- Crosshair: in aimZoom.js (was `controller.animation.universalscope`: ~110 item names per player per tick):
  hidden while aiming with a gun, not while reloading; `keepCrosshair: true` for the minigun, M107, M95.
- Leftovers removed: hitscan.js's `scriptevent tacz:weapon_hitscan` listener (nothing sent it), `player.json`
  `krep:deagleg_range` / `krep:vector_range` / `m1014:normal` / `krep:glreload` (+ group, mark variant 3) and the 5
  attachment-tag removals in `krep:noinspect`; `tools/weapons/script-firing.mjs` (nothing left to convert);
  java-port's edits of the deleted inspect controller (an empty inspect now sets `emptyInspect`); outdated comments
  and docs. check.mjs now requires `scriptFiring` (and `scriptReload` unless `heat`) on every gun and refuses the
  old per-gun BP files coming back. Kept on purpose: the HUD functions of the Vector, Golden Deagle and minigun
  (`capByMagazine` / heat HUD), the `<id>:bolt`/`:normal` events (firing.js cycle), sight events, `script-reload.mjs`
  (its timing code is used by the port tools), the one-time pack tools reorganize / packmap / verify-pack.
- Simulated (scratch harness): swing reload (attack, mine; not interact / use / drop), inspect (full, 1 missing,
  Vector magazine 1, empty P320 yes, empty AKM no), crosshair (hide, show, M107 keeps it, during / after a reload).
**Test in game:** tactical reload with left click (in the air and on a block); opening a workbench / chest with a
gun in hand doesn't reload; inspect with a full magazine and with an empty P320; aiming hides the crosshair (not with
the minigun / M107 / M95) and it comes back while reloading; everything else unchanged.

**v1.33.11 (2026-10-05): the minigun is script-fired; every gun now is. Needs the user's test.** Same behaviour as its
BP controller, now in `combat/firing.js` (`boxAmmo`, `spinUp`) and the new `combat/heat.js` (`heat` in weapons.js):
a press needs an ammo box, plays the wind-up and fires 0.3 s later, 20 shots/s from the box's `win308` rounds;
+1% heat per shot, cools 1% every 2 ticks while held and not firing (not in another slot, as before); at 100% the
item becomes `minigun_emp` and the overheat animation plays (2.5 s), back at 2.4 s with 75%. Changes on purpose:
the creative ammo box or creative mode fire with an empty box (before: needed at least 1 round in it); the no-box
message is "No .308 Winchester Ammo Box" (translated item name); it gets the muzzle light now. Removed: the BP
controller `gun_minigun.json`, `animations/guns/minigun.json`, the `minigun` animate entry (player.json now runs 3
BP animate entries per player per tick: akminspect, universalscope, reload_input), `krep:minigun_fire`,
`minigunreload0/1`. script-reload.mjs refuses heat guns cleanly; test.mjs updated. Simulated outside the game
(scratch harness: fake @minecraft/server running the real firing / reload / heat scripts tick by tick): wind-up 6
ticks, 1 shot per tick, overheat at 100 shots, refill at +48 ticks to 75, end at +50, cooling, no box / empty box /
30 rounds / creative box, death stops firing, two players at once; plus v1.33.10 fixes: AWP -> pistol switch, a
press during a tactical reload doesn't fire afterwards. Still unused: `animation.minigun.spin` (barrel spin) and
`controller.animation.minigun.tp`: visual pass.
**Test in game:** minigun with an ammo box holding .308: hold fire (wind-up sound, then fast fire, HUD "rounds -
heat%"), keep firing to 100%: overheat animation, comes back at 75% after 2.5 s; release: heat drops; without a box:
the message, no shots; empty box: "No Ammunition"; creative ammo box: unlimited; third person: still posed and
firing animation plays for other players; inspect (swing) still works.

**v1.33.10 (2026-10-05): the script review's findings fixed; needs the user's test.** User decision for #3: a press
during a reload is ignored (a gun never fires by itself). Fixes, in the order of the list below:
1. firing.js drops a player's trigger on death and on leave; reload.js cancels a reload on death.
2. The wait after a shot only counts for the same gun (the done entry keeps its weaponId).
3. itemStartUse ignores a press while reloading; a semi / burst trigger still waiting when a reload starts is
   dropped. A held auto trigger still resumes after the reload (the button is still down).
4. startCycle skips `<id>:bolt` if a reload has started by then.
5. Per-player try/catch in both loops (`[TACZ firing]` / `[TACZ reload]` warnings in the content log).
6. muzzleLight.js remembers every light it places in the world property `tacz:muzzle_lights` (saved at most
   every 10 ticks) and removes left-over ones once their chunk is loaded (every 100 ticks).
7. A reload follows the hotbar slot it started in; aimZoom: no zoom on an `_emp` gun, `fov_clear` on joining.
**Test in game (ideally with 2 players):** with `/gamerule keepinventory true`, hold fire on an auto gun and die
(`/kill`): it stops, and doesn't fire after respawning; die mid-reload: no reload after respawning, the gun reloads
normally afterwards. Fire the AWP and switch straight to a pistol: the pistol fires at once on a press, never by
itself. Press fire during a tactical reload (semi gun): no shot when the reload ends. M870 / SPAS-12 shell reload,
press fire: the reload stops after the current shell and no shot follows; press again to shoot. Fire a bolt gun
and reload at once: reload animation plays cleanly. Two of the same gun in the hotbar: start an empty reload on
one, switch to the other: the reload is cancelled. Aiming with a scope when the last round goes and no ammo left:
the zoom goes back. Everything else as in v1.33.9 (firing, reloads, bolts, muzzle light still goes out).

**Script review of v1.33.9 (2026-10-05)** (fixed in v1.33.10, above). Found by reading the code; none seen in game:
1. firing.js: a held trigger isn't dropped on death. With keepInventory, an auto gun may keep firing through the
   death screen if `itemStopUse` doesn't arrive (unverified).
2. firing.js `startTrigger`: the wait after a shot (`readyAt`) carries over to a *different* gun. Fire the AWP,
   switch to a pistol and press: the pistol waits out the bolt (~1.5 s), then fires by itself.
3. firing.js: a press during a reload waits and fires when the reload ends. Includes the press that stops a shell
   reload (M870 / SPAS-12 / M1014): one shot after the closing animation. **User's call: intended or not.**
4. firing.js `startCycle`: the `<id>:bolt` timer (2-5 ticks after a shot) isn't cancelled by a reload started in
   that window; it overwrites `krep:ammoreload` mid-reload (animation glitch on bolt / pump guns).
5. firing.js / reload.js loops have no per-player try/catch: one player's error stops that tick for everyone after
   them and repeats every tick.
6. muzzleLight.js: a light block stays forever if the player leaves, changes dimension or the server stops in the
   2 ticks it is lit (putOut fails on an unloaded chunk).
7. Minor: two copies of the same gun share one scoreboard (switching mid-reload between them); zoom stays on while
   aiming after the gun swaps to `_emp` with no ammo for the auto reload.


1. **Optimize the always-running scripts** (no gameplay change). **Done in v1.33.6; profile confirmed (v1.33.7 entry);
   still to hear: attachments / rounds on the model / tooltips / zoom look right in game.** The profile `_02-40-42` (0.59 ms/tick total) shows
   three polling scripts are over half of it: `attachments/attachmentState.js` 0.12 (every 2 ticks),
   `items/storedAmmoDisplay.js` 0.10 (every tick), `items/itemLore.js` 0.09 (every second). Make them event-driven
   with the 2.10.0 events already used by `combat/aimZoom.js` (`playerHotbarSelectedSlotChange`,
   `playerInventoryItemChange`) plus calls from firing.js / reload.js where rounds change. Then a profile to compare.
2. **Phase 2: accuracy** (docs/GUNPLAY.md): GTA IV-style spread that grows while the trigger is held (hip and
   ADS; tapping stays accurate), hip cone per class, moving / jumping penalties, ADS time, sprint-to-fire delay.
3. **Minigun conversion:** the last gun fired and reloaded by its BP controllers -> script firing / reloading
   (it also gets the muzzle light then). With it: `playerSwingStart` in place of the shared `reload_input`
   controller (docs/GUNPLAY.md phase 6).

Still waiting for the user's in-game test: scope zoom (ACOG / ELCAN mild, AWP Standard 8 strong; walking at
crouch speed while aiming), the new creative groups (LMGs, Springfield with snipers, Lone Trail with pistols), the
AUG with its rail (no scope), reload hands of the Java guns now that their reloads play to the end, crafting and
the attachment menu. Confirmed working: fire-rate fix, Java reload timings, the 3 new guns, muzzle light, hit
markers, no [UI] errors.

How the user works: not a programmer, tests on an AYN Odin 2 (Android) against their own BDS 1.26.51 (Script API
2.10.0 stable); wants plain explanations, factual decisions (ask when it's their call), ready-to-paste commit
titles / descriptions, and what to test in game. Test reports: `scriptevent tacz:debug start|stop` +
`script profiler start|stop` in the server console; they put the `.cpuprofile` in `reference/`.

**v1.33.8-1.33.9 (2026-10-05): audit for the next stable tag.** User: ACOG on the AKM, the zoom looks great.
Agreed order now: **audit -> user test -> stable tag -> minigun conversion -> Phase 2 accuracy** (accuracy will live in
firing.js, so the minigun should be script-fired first). Audit: a file-level scan (textures, sounds, models,
functions, particles, entities, items, lang keys, script exports) found nothing unreferenced (two `.nomedia` files
kept: they stop Android galleries indexing the pack). v1.33.8 removed the check.mjs --unused leftovers (m16 / m16a1
walk anims, m870 / spas12 fp.reload11, aug / spr15 `.suppress` sounds + 320 KB of files); kept for the minigun
step: `animation.minigun.spin`, its unused tp controller, the "No Rocket" / "Need Ammo Box" HUD texts.
**v1.33.9: the 57 per-gun BP controllers are gone** (all guns but the minigun), with 46 BP animation files, 51 HUD
functions and 104 `player.json` entries (61 -> 4 `animate` entries evaluated per player per tick). What they still
did moved to the scripts: a gun's first use ever starts with a full magazine (`roundsOf` in firing.js; **user
decision: no more refill the first time each gun is held after every join**), fire on a 0-round loaded gun swaps
to `_emp` (before: nothing happened), taking a gun in hand shows its ammo HUD (before: only the first time),
reload / bolt state is cleared on spawn (reload.js). `shared_inspect.json` borrowed `animation.akm.shoot` as a
zero-length timer: now `animation.instant` (`animations/shared/instant.json`). Golden Deagle and Vector keep their
HUD functions (`capByMagazine`). Tools: java-port / import-repair test tolerate guns without BP files.
**Test before tagging stable:** every gun fires, reloads (empty + tactical), inspects (swing with a full magazine);
the HUD shows when switching guns; a brand-new gun (gunsmith / creative) starts full; after rejoining, the magazine
is what you left (not refilled); bolt guns (AWP, Kar98k, M700) and pump shotguns cycle; the minigun works as before.

**v1.33.7 (2026-10-05): v1.33.6 profile, attachment menu UI warning, quieter report.** User test (all 56 guns,
1024 s, profile `_18-28-54`): every gun at or under its fire rate, every reload on time. Script time **0.42 ms/tick**
(was 0.59) with much more shooting; the three ex-polling scripts went from 0.31 to 0.033 (attachmentState 0.004,
storedAmmoDisplay 0.018, itemLore 0.011). The rest is per shot (firing 0.15, hitscan 0.07, reload 0.04). Fixed:
`TACZ-R/ui/server_form.json` gave the form buttons (`common_buttons.light_text_button`) `"color": "$button_color"`,
a property buttons don't have and a variable defined nowhere ("Unknown property [color]" in the content log when the
attachment menu opens): removed (4x), nothing visible changes. The debug report printed ~170 lines in one tick
(Watchdog: 207 ms spike, then "Slowdown 5ms average" lines): `system.runJob` now spreads them over the next ticks.

**v1.33.6 (2026-10-05): no more polling scripts.** New `items/heldItem.js` (`onHeldChange`): hotbar slot switch,
any change in the hotbar (not count changes; the event's slot number isn't used, Microsoft's docs don't define it per
inventory type), spawn / join (again 20 ticks later: the LMG / M1014 BP setup controllers set the magazine score on
load), players online at world load. `attachmentState.js` (was every 2 ticks), `storedAmmoDisplay.js` (every
tick; now also called by firing.js / reload.js when rounds change) and `aimZoom.js` listen to it. `itemLore.js`
(was a scan of every inventory every second): on `playerInventoryItemChange` for the 118 TACZ items with lore
(ignoring count changes) and on join; items the scripts put in the hand (empty / reloaded gun) are made with lore
(`loredItem`). The firing / reload loops return at once when nobody fires / reloads. Expected: about half the
script time (the three were 0.31 of 0.59 ms/tick). **Test:** attachments still show (fit one at the workbench,
switch guns back and forth), the M249 / Evolys / M1014 rounds on the model count down and refill, new guns from the
gunsmith / creative and the empty / reloaded gun have their tooltip, zoom still works; then a profile.
Found, not changed: ammo items never had a tooltip (lore.cjs only takes keys ending in `.lore`; ammo keys are
`krep:ammo.lore.<key>`).

**v1.33.5 (2026-10-04): creative inventory groups follow the gun classes.** User (v1.33.4 test): the muzzle
light looks good in a dark room, the hit markers are a nice addition, no [UI] errors any more; zoom not tried yet.
They wanted the classes to organise the creative menu: the RPK, M249 and Evolys in their own LMGs group, the
Springfield 1873 with the snipers, the Lone Trail with the pistols (clones had stayed in their source's group:
the M320's Heavy Weapons). `lore-sync.mjs` is now `config-sync.mjs`: it also puts each gun in its class's creative
group (`CATEGORIES[...].group`; LMGs added after ARs, its name in every lang file: pl / ru / uk translated by
hand); check.mjs refuses a gun outside its group; java-port runs it. English group names follow CATEGORIES ("ARs";
"Submachine Guns (SMGs)" became "Submachine Guns"). gun.mjs remove re-points a group icon that was the removed gun.

**v1.33.4 (2026-10-04): AUG without its built-in scope; Phase 1 profile.** User test of v1.33.3 (report in chat,
profile `_02-40-42`): the fire-rate fix works (MK23 never under its 24 ticks; Raging Hunter 10.0 / 10, Taurus 943
6.7 / 6.7); every Java reload timing is exact (AUG 2.63 / 3.3 s, Springfield 2.1 / 2.95, Lone Trail 1.5 / 2.5, MK23,
SPR-15, Raging Hunter); the three new guns fire and reload. Script time 0.59 ms/tick; the Phase 1 parts are tiny
(zoom 0.0014, muzzle light 0.013, recoil 0.015, hit marker < 0.001 ms/tick). The user asked to remove the AUG's
scope (Bedrock can't draw Java's see-through scope: a solid tube): `java-port.mjs --no-scope` leaves it out and
keeps the rail mount; the AUG was re-ported with it (aims along the rail, no zoom). test.mjs ports the AUG both ways.
Still to hear from the user: zoom feel, cave light, hit marker, any [UI] content-log lines.

**Phase 1 done, v1.33.0-1.33.3 (2026-10-04): untested in game.** User decisions: sniper scope zooms most, ACOG /
ELCAN a little ("mild"); hit marker on by default.
- v1.33.0 recoil: `camera.addShake` instead of a `camerashake` command per shot (same values).
- v1.33.1 zoom: `combat/aimZoom.js`, `SIGHT_ZOOM` (`config/attachments.js`: standard_8 30, acog / elcan 50; the
  game allows FOV 30-110, so a true 8x isn't possible: 30 is about 2.6x at FOV 70, 5.4x at the user's 110).
  Event-driven (entityStart/StopSneaking, hotbar, held item, reload / bolt via zoomSoon). Back with
  `camera @s fov_clear` (no script call for that). Removed the Slowness zoom (krep:scope4x/8x/normal groups and
  events, the AKM / AWP / HK416 / M4A1 BP `.scope` controllers); leftover endless Slowness 6 / 14 cleared on spawn.
  The M107 has scope parts and sight events but no workbench entry (README "M107": `/event entity @s m107:standard_8`).
- v1.33.2 muzzle light: `combat/muzzleLight.js`, `minecraft:light_block_15` (id since 1.21.40, checked at first
  use) at the head for 2 ticks, air only; auto fire extends it. Minigun (BP-fired) has none yet.
- v1.33.3 hit marker: `combat/hitMarker.js` + `TACZ-R/ui/hud_screen.json`. A `tacz:hit` / `tacz:kill` title (0 / 3 /
  4 ticks) shown as `textures/ui/tacz_hit_marker` / `tacz_kill_marker` at the screen centre; Mojang's title is
  copied into `tacz_vanilla_title` (from bedrock-samples, 2026-09-16) and hidden for those two strings. Custom
  commands (2.x `customCommandRegistry`): `/tacz:hitmarker [on|off]` (any player, no cheats; dynamic property
  `tacz:hitmarker`), `/tacz:hitmarkerdefault on|off` (GameDirectors = operators; world property).
- **Test in game:** recoil feels as before; aiming with ACOG / ELCAN (AKM, M4A1, HK416, AWP) zooms a little and
  the AWP's Standard 8 a lot, smoothly in and out, not during reloads or the AWP bolt; aiming now walks at crouch
  speed; firing in a dark cave lights it briefly (not with a silencer); hitting a mob shows the white X, a kill the
  red X; `/tacz:hitmarker off` hides it for you, `/tacz:hitmarker` returns to the default; vanilla `/title` text
  still shows normally; **the content log has no new [UI] errors**.

**v1.32.1 (2026-10-04): weapon classes renamed, lore facts from the config.** User: assault rifles are "ARs";
the RPK, M249 and Evolys are "LMGs" (category ids `ar`, `lmg`; names and colours in `CATEGORIES`, weapons.js). The
lore (the in-game tooltip) is where players see the class ("Group"). Found: every ported gun's lore was its clone
source's (Springfield 1873 "RPG-7 Rocket, Damage 100", Raging Hunter ".45 ACP, Damage 10" for 40 / .500 S&W,
M1911 9 for 11). New `lore-sync.mjs` writes Group / Caliber / Damage from the config (en_US + en_UK, then lore.js),
ported guns get Java's full name and description; check.mjs refuses a mismatch; java-port runs it.
java-stats keeps its scaling groups (LMGs count with heavy weapons), so ported stats are unchanged (proposals
compared before / after: identical). Other languages' lore (ru, uk, pl) isn't shown in game (lore.js is English).

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
- **Hand edits to `player.json` (and other tool-written JSON) must keep the tools' format** (`format.cjs`: anything
  that fits in 100 characters on one line). Otherwise test.mjs's clone / port round trips fail with "left behind:
  M TACZ-B/entities/player.json" (v1.33.11: the animate list fit on one line after removing the minigun). Fix: parse
  and re-`format` the file once (lenient.cjs + format.cjs), keeping its line endings.
- Git Bash mangles `/paths` inside `node -e '...'` and backslashes in heredocs: put scripts in a file instead.
- Stopping a background shell task can leave its child processes running; check for leftovers before rerunning.
- Some pack files use Windows line endings; the tools keep each file's endings. Compare with
  `git -c core.autocrlf=false` when verifying round trips.
