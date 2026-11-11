# Handoff log

Newest entry on top. Every agent (Claude, Codex/ChatGPT) adds an entry when it stops: date, agent, what changed, what's next, what to test.

## 2026-11-11 — Claude (Opus 5.5) — railgun auto-fire (v1.37.1); old world + transfer
- Railgun now FIRES BY ITSELF the moment the charge is full (user); releasing early cancels (no shot). firing.js charge loop runs every tick.
- User shared their previous world `Downloads/IslandSurvivor.zip` (185 MB) + old `Downloads/server.properties`. level.dat: seed -5981624730078081782, creative, normal difficulty, last played 2026-11-05 on 1.26.60, ~7,100 in-game days, no experiments, cheats off, no packs. Old properties worth keeping: difficulty normal, max-players 15, server-port 41993 (playit tunnel probably points here!), transport raknet, view-distance 6, compression snappy. Our test server: port 19132, nethernet, view 12.
- DONE (user's choices): **IslandSurvivor is the server world** (unpacked to worlds/IslandSurvivor, TACZ v1.37.1 deployed into it, server loads it). server.properties: port 41993 / 41194, udp 41993, transport raknet, view 6, snappy, normal, max 10, level-name IslandSurvivor, level-seed set; creative + force-gamemode kept for now; allow-cheats still on for testing. Backup of the previous properties in Claude's scratchpad only. deploy.ps1 now reads level-name.
- CORRECTION: transport=raknet was wrong (server log: NetherNet is the only supported transport; players can't connect). Back to nethernet; server listens TCP 41993. playit tunnel will need TCP+UDP and maybe a public:local `server-udp-ports` mapping: set up and test on the host PC.
- Still open: transfer to the host PC (asked: same network / shared folders? else USB). Plan: one-time package zip, then sync only addons/ + deploy.

## >>> NEXT UP (set by the user, 2026-11-08) <<<
0. **Rule (user, 2026-11-08): EVERY gun uses BOTH hands/arms**, pistols included: one hand on the grip, the other on the fore-end / handguard / support grip. No one-handed holds. Audit per weapon category (ar, smg, lmg, pistol, sniper, shotgun, heavy).
1. **Full weapon audit: every single gun (all 58).** STATUS 2026-11-08: all categories audited and fixed (table below); remaining = in-game confirmation by the user of the fixed guns (DB-4, DB-long, MP5, Kar98, M700, Springfield, M1911). For each gun, in first person:
   - Both hands are ON the weapon (fore-end/handguard + grip) at hold, sprint and aim (sight). No floating, detached or camera-filling arms.
   - Reload animations (empty `fp.reload`, tactical `fp.tac` / `fp.reload1`, shell reloads) move like they should: hands stay on the gun or go to the mag/shells and back, nothing pops or flies off-screen. Also check `fp.inspect`.
   - The muzzle flash sits on the barrel; attachments show and line up.
   - Everything matches and looks good. Compare against guns already confirmed good (AKM, M870, M4A1).
   How: verify before editing (AGENTS.md rule 10). Render with Blockbench MCP (`load_project`, `preview_animation`, `set_camera_angle`, `screenshot`) or `tools/fp_preview.py` + `tools/fp_render.ps1` (keyframes over time: run several times per animation). Diff against the original `Mods/TACZ.zip` to see if a problem was there from the start. Fix hand offsets the way the double barrels were fixed (entries 15-16: a hand bone's position offset moves the whole arm, so apply the same delta to every keyframe of that bone). Keep a checklist table here: gun / hold / aim / reload / tac / inspect / notes.
   - Still to confirm in game: double-barrel reload arms (v1.36.8).
### Audit status (2026-11-08, tools/fp_audit.py v1 + renders)
Tools: `tools/fp_audit.py [cat|gun...]` (gap = hand to gun in px, NEAR-CAMERA, STUB = arm ends mid-screen),
`tools/fp_fix_hand.py <gun> <rightArm|leftArm> [--min-depth N] [--delta dx dy dz] [--apply]` (searches a hand
offset; applies it to every fp keyframe of that hand bone), `tools/fp_preview.py` + `tools/fp_render.ps1` (now clips
faces at the camera like the game). Arm roles differ per gun (on M4A1/HK416/G36/SPAS-12 rightArm is the grip), so
read results by arm name. Good fore-end hand distance from the camera at hold: ~20-24 (AKM, M870, M1014).
Known tool limits: NEAR-CAMERA over-flags pistols at hold and most guns at ADS (sight) - checked G17 hold and AUG
sight renders, both look normal. Trust: off-gun gap, STUB, one-handed.
| Category | Pose OK (hold/aim/sprint) | Real problems found | To look at |
|---|---|---|---|
| pistol (16, DONE 2026-11-08) | 15 of 16 two-handed at hold/aim/sprint; all reloads clean (no stub/camera). deagleg uses deagle's animations, b93 uses animation.b93r.* (audit now reads each gun's fp animation controller) | **M1911 one-handed by design**: its support arm is posed 39.5 down and its shooting arm sweeps in one-handed from the far right (rig: universal16, arms parented to the magazine bone). Offset fixes can't make it look right (tried, rendered, reverted). Needs a real re-pose of BOTH arms (hold/aim/sprint; reloads follow the magazine), ideally in Blockbench with the G17 as the target look. Minor: Taurus 500 inspect ~7.5 s support arm floats with the speedloader. | user to confirm in game that pistol two-hand holds look right (tool's near-camera flags on pistols judged false alarms from G17 render) |
| smg (6, DONE 2026-11-08, v1.36.10) | P90, MP7, Uzi, UMP, Vector clean (Vector ADS / P90 reload near-camera flags = tool over-sensitivity, no stub/camera) | **MP5 FIXED**: fore-end hand (`lefthand`, carries rightArm) floated above the gun (gap 12.8, depth 32.8). Delta [0,-10,8.5] on all 13 fp channels -> gap 0.0, depth 24.3; renders match AKM. (The double barrels' original broken pose was a copy of the MP5's.) | user: check MP5 in game |
| M1911 re-pose (DONE 2026-11-08, v1.36.13) | two-handed now at hold / aim / reloads / inspect; sprint keeps the support arm out of view (one-handed pistol sprint; a matched support arm became a giant block when the gun swings in sprint) | New tool `tools/fp_match_pose.py <gun> <ref> [--apply]`: solves static arm rotation+position so hands land where the reference's do (shifted by the grip offset) with the same arm direction, hands on the gun. M1911 vs G17: rightArm rot [-116.69,84.2,62.32] pos [3.73,-29.03,1.15]; leftArm rot [10.68,-135.71,-170.58] pos [6.99,-34.66,-1.96] (backup of the original: Mods/TACZ.zip). Arm twist (roll along the arm) isn't constrained by the solve: check the skin looks right in game. | user: check M1911 in game |
| ar (15, DONE 2026-11-08, no changes needed) | all 15 clean: both hands on at hold/aim/sprint, no stub/camera in any reload. Rendered and judged: QBZ-191 inspect end frame (arm returning to hold; stub flag = wide-arm edge case), AKM reload 1.22 s (hand bringing the mag; near-camera = false alarm) | none | |
| lmg (3, DONE 2026-11-08, no changes) | RPK, Evolys, M249 all clean (hold/aim/sprint/reloads) | none | |
| shotgun (7, DONE 2026-11-08, v1.36.11) | AA-12, M870, SPAS-12, M1014, Saiga-12 clean | DB / DB-long holds fixed v1.36.9. DB-long empty reload: fore-end arm's shoulder end showed mid-screen (floating) at 1-2 s; `fp_fix_hand.py dblong rightArm --poses fp.reload@... --only fp.reload` -> delta [0,-4,0] on that animation only; renders now match the DB-4 | user: check DB-4 / DB-long in game |
| sniper (8, DONE 2026-11-08, v1.36.12) | AWP, SKS, MK14, M107, M95B clean; no stub/camera in any reload | Grip arm was a giant slab in front of the camera at hold (rendered): Kar98 `righthand` +[1,-2,2], M700 `righthand` +[0,-2,3], Springfield `righthand` +[0,-2,2] (all fp channels). Now not near the camera, hands still on the grip (gap <= 0.5). Springfield's grip arm is still fairly large: its grip sits close to the camera; moving further takes the hand off the grip (searched, gap 3.4), so left as is. Minor: Springfield inspect end-frame stub flag. | user: check Kar98 / M700 / Springfield in game |
| heavy (3, DONE 2026-11-08, no changes) | M320, Minigun clean; RPG arms sit low under the tube at hold: judged plausible for a shoulder launcher (rendered) | none | user: say if the RPG arms look wrong in game |
2 pistols missing from the audit (16 in weapons.js, 14 audited): find which and why.

2. **New gun: railgun / coil gun** (after the audit). User's concept art 2026-11-08: long white/light-gray body, black stock and grip, a black top rail, a blue three-diamond emblem on the receiver, an open side window, a row of ~8 glowing orange coils along the barrel, an orange indicator light above the trigger, and a black muzzle block. **Rules (user, 2026-11-08, final):** special / heavy weapon, charged like the BOW: hold fire to charge; ONLY a full charge fires (releasing early = no shot); **reload after every shot** (magazine 1); damage so high that **3 headshots kill a wither** ("pretty much one-shots anything").
Spec derived from that (not yet built): Bedrock wither = 600 HP (wiki; the BDS vanilla pack here has no entity files to confirm) -> 200 per headshot; headshot multiplier 2 (COMBAT.headshotMultiplier) -> **damage 100**, `penetration: 1` (ignores armor), no falloff. One-shots players and normal mobs; ender dragon (200) dies to 1 headshot; warden (500) 3 headshots. Gun damage is applied via health.setCurrentValue (combat/damage.js), so the wither's arrow shield / damage sensors don't block it.
Implementation plan: charge = itemStartUse tick -> fire on itemStopUse only if held >= chargeSeconds (fully charged); show a charge bar on the action bar + charging sound; coils glow brighter while charging (client: property or q.is_using_item). Categories: "heavy". **Charge time: 2 seconds** (user, 2026-11-08).
Progress: first-pass model built in Blockbench (45 cubes, HK416 scale/position, gun bone `railgun` pivot [0,7,6.85] = HK416's `416d`), textured from the concept palette, saved as `tools/models/railgun.bbmodel`. User feedback: stock needed work; references Arc Raiders "Jupiter" + Helldivers 2 railgun (inspiration only, don't copy them). Pass 2: thumbhole stock (comb, rear post, lower bar, hole), capacitor + orange glow ring, cheek panel, taller butt pad, emblem as 3 blue diamond cubes per side (painted pixels didn't show). 54 cubes, check_model 0 issues. Pass 3 (user: "a little short", scale photo of a full-size prop): front extended 6 units (muzzle now z -28.6, total ~45 = ~1.55x HK416), 11 coils + 12 fins (coil section ~half the gun, like the reference). 60 cubes, 0 issues. User approved the length.
**IN GAME v1.37.0 (2026-11-08):** `tools/gen_railgun.py` (idempotent) clones the HK416 wiring as `railgun`: geometry = HK416 rig without its cubes + `railgun_body` / `railgun_glow` bones (13 coil/capacitor/indicator cubes, Material.glow) under `416d`, muzzle_flash bone moved to [0,9.65,-28.9]; animations/controllers renamed (no shell casings); first-person arms = taczuniversal4 (shared with HK416); held numbers 118/119; items krep:railgun(_emp); attachables; icon (`tools/make_gun_icon.ps1`); names + lore in all langs; sounds railgun.shoot (M107 shot, pitch 0.7) + railgun.charge (minigun wind-up, pitch 0.55); crafting catalog next to the HK416. No draw (switch-in) animation: shared_draw.json not touched.
weapons.js `railgun`: heavy, damage 100, penetration 1, headshot 2, no falloff, range 200, fireMode "charge" { seconds 2 }, magazine 1 + chamber false (auto empty reload after each shot, reload timing = HK416 empty), ammo krep:bmg50, recipe 8 diamond + 2 netherite ingot + 32 redstone + 64 iron. firing.js charge mode: press starts charge (+ sound), action bar bar, "CHARGED" + ping at 2 s; release fires only when charged; gun swap / reload / ragdoll cancels. Pinned krep:scope "nothing" (scopeState SCOPE_GUNS).
Aim pose: HK416's put the eye inside the railgun stock (render: all gray); searched -> final Joints keyframe of every .fp.sight lowered 3 px (top rail 1 px under the eye). Audit: both hands on at hold/aim/sprint.
**Test:** `/give @s krep:railgun`, `/give @s krep:bmg50 16`; hold L2 2 s -> CHARGED -> release; early release = no shot; 1 shot then reload; check aiming view, glow at night, flash on the muzzle. Build it in Blockbench (MCP), in the same rig layout as the other TACZ guns (root/waist/body/Joints/rot/... + lefthand/righthand + muzzle_flash bone) so the arms, flash and animations work.
3. **Then: performance work** for 10 players on the host PC (i7-7700K): server tick cost of firing/hitscan/particles/muzzle light per player, script runInterval loops, view/tick distance, client frame rate on the Odin 2.

**Confirmed working by the user:** held L2 keeps firing after a reload (v1.36.4); gun visuals pass 1 (v1.35.4); M4A1 Java sights (v1.36.3); no arms in previews.

---

## 2026-11-08 (16) — Claude (Opus 5.5) — double-barrel reload arms (v1.36.8); Blockbench MCP not set up yet
- User: hold pose better, reloads still off. A hand bone's position offset moves the whole arm by the same vector whatever its rotation, so the hold-fix deltas were applied to every keyframed position of the same bones: db leftHand +[0,-2,-10] (reload, inspect); dblong leftHand +[-6,-6,-10] and rightHand +[1,-9,0] (tac, reload, inspect, inspect_empty). Verified with fp_preview renders at t=0.3/0.9/1.5/2.1 of fp.reload; the DB-long's grip hand isn't visible at t=1.5 in the ORIGINAL either.
- Blockbench MCP: the file `%APPDATA%\Blockbench\plugins\blockbench-mcp.js` is a saved GitHub HTML page of sosadly/blockbench-mcp, not the plugin, so nothing listens. Real setup (README): clone, `npm install && npm run build`, load `plugin/blockbench_mcp.js` in Blockbench (bridge on 127.0.0.1:8787), register `node <repo>/dist/index.js` (stdio). The user's pasted `mcp-remote http://localhost:3000/bb-mcp` config belongs to a different project. `claude` CLI isn't on PATH: use a project `.mcp.json`. Waiting for the user's OK to download/build.
- UPDATE: user approved. Cloned to `C:\Users\ChakaProjects\Projects\blockbench-mcp` (commit b024728), reviewed (MIT; bridge binds 127.0.0.1 only; no shell exec), `npm install && npm run build` OK. Broken file renamed to `blockbench-mcp.saved-github-page.html.bak`. `.mcp.json` registers `node .../dist/index.js`. Pending: user loads `plugin/blockbench_mcp.js` in Blockbench; then a new Claude session to get the tools.
- DONE: plugin loaded, bridge answers on 127.0.0.1:8787 (Blockbench 5.2.1); `node dist/index.js` starts and lists 86 tools (incl. load_project, preview_animation, set_camera_angle, screenshot). Tools appear in the next Claude session. Still to check in game: v1.36.8 double-barrel reload arms; held-L2 resume after reload (v1.36.4).

---

## 2026-11-08 (15) — Claude (Opus 5.5) — double-barrel arms fixed with the renderer (v1.36.7)
- **New user rule: no guessing** (AGENTS.md rule 10). Verify before deploying.
- **New tool:** `tools/fp_preview.py <gun> [anim suffix] [time] [out.json]` + `tools/fp_render.ps1 <in.json> <out.png>` render the first-person gun + arm model (blue = model rightArm on the fore-end, screen left; orange = model leftArm on the grip). `FP_RP=<path>` renders another pack (e.g. the original from Mods/TACZ.zip). Reproduced the AKM/M870 (good) and the DB-4 bug.
- Root cause: in the original mod the double barrels' fore-end arm (bone `leftHand` -> `rightArm`) passes through the camera (giant block). Entries 11-14 edited the wrong arm; all reverted to original.
- Fix (positions found by a search that matches the M870's arm placement, verified in renders at hold + aim): db `leftHand` pos [8.4,-15.02,-21.32]; dblong `leftHand` pos [2.4,-19.02,-21.32]; dblong `rightHand` (grip arm, floated above the view in the original too) pos [-5.725,-22.3,-0.775]. Rotations unchanged.

---

## 2026-11-08 (14) — Claude (Opus 5.5) — double-barrel left arm: bone location (v1.36.6)
- v1.36.5 pose change made no visible difference. User suspected bone location. Hand-bone pivots differ by gun: most arm models (taczuniversal*) put hands at z=0, the double barrels (and mp5, p90, g3, awp, minigun, m107, aug, spr15) at z=8.
- Now: db/dblong `rightHand` [6,19,0] and `righthand_pos` [0,8,0] (was z=8), matching the M870 layout whose pose they now use; in taczuniversal21/62 and the db/dblong gun geos. `leftHand`/`lefthand_pos` (right arm) left at z=8.
- If still wrong: revert both (pivots z=8, poses from entry 13) and try a different reference gun.

---

## 2026-11-08 (13) — Claude (Opus 5.5) — double-barrel left arm experiment (v1.36.5)
- User: DB-4 AND DB-long both show a giant left arm (screen bottom-left) all the time. Pre-existing (original db files unchanged except my locator/arm edits). In the TACZ arm models the bone named `righthand`/`rightHand` (pivot x=+6) carries the player's LEFT arm, `lefthand` (x=-6) the right arm, for every gun.
- Experiment: db/dblong `rightHand` pose (rot [89.3,14.8,-180.3] pos [-6.725,-13.3,-0.775]) replaced by the M870's `righthand` pose (rot [84.3,15.3,-175.6] pos [-6.55,-12.9,7]) in 9 animations (hold/sprint/sight/view, dblong reload1). If worse, revert those 9 and try moving pos z the other way.

---

## 2026-11-08 (12) — Claude (Opus 5.5) — keep firing after reload (v1.36.4); DB-4 arm still open
- Held L2 didn't resume after a reload: swapping the gun item (empty swap / reloaded swap) ends Bedrock's "use", so no new itemStartUse comes. firing.js now tracks fire held (`fireHeld`, start .. real stop; stops within 3 ticks of our own swap, `markSwap`, are ignored); reload.js `finish` calls `resumeHeldFire` (auto guns only). Untested: if Bedrock sends no stop when L2 is released during a reload, the gun would resume by itself.
- DB-4 Ursus arm: user says the v1.36.3 arm change made no difference. db and dblong fp hold/sight/sprint animations are now identical except Joints height; arm models taczuniversal21/62 (1.10 format in models/entity/shared) are near-identical. Cause still unknown; asked the user when it happens. (Note: the 1.10-format files use `"geometry.<id>": {...}`, not `minecraft:geometry`; scan both.)

---

## 2026-11-08 (11) — Claude (Opus 5.5) — previews, Java sight glass, DB-4 arms (v1.36.3)
- **User preference: NO arms in any gun's attachment preview.** All 14 `*.fp.view` animations: rightArm/leftArm scale 0 (this also undoes entry 10's AKM arm change).
- Java sights (M4A1): the lens panes (`a_ocular`, `a_oculars`, `a_ocular_sight`, `a_ocular_scope_2`, `a_lens`) are opaque in the textures (Java draws them as see-through windows), so they're hidden in `render_controllers/tacz_attachments.json`. The reticle (`a_division*`) still shows only when aiming in first person, as in Java.
- DB-4 Ursus (`db`): its fp arm poses used rotation [180,0,0] at z 8 (left arm across the screen); 14 poses now use DB-long's [0,0,180] at (±2,-12,0).

---

## 2026-11-08 (10) — Claude (Opus 5.5) — Java attachments mounted, preview pose (v1.36.2)
- User: coyote sight showed on AKM but not M4A1; AK preview had no arm; preview gun too far forward.
- Cause (pre-existing): Java-style attachment models (`models/entity/attachments/`, only the M4A1 uses them, 49 attachments) relied on bone `"binding": "'scope_pos'"`, which Bedrock only honors for attachables, so they were never placed on the gun. `tools/gen_java_attachments.py` (+ `tools/read_js_config.js`) builds `models/entity/tacz_att_mounted.geo.json`: M4A1 bone chain root..<slot>_pos + the attachment bones under it, shifted by the mount pivot; player geometry keys att_<id> repointed. Stops with a TODO if a 2nd gun gets Java attachments.
- AKM preview (`animation.akm.fp.view`) had its arms moved off-screen on purpose by the original author; now uses the hold pose's arms (like the M4A1).
- All 10 `*.fp.view` animations: Joints z pushed 4 px further from the camera. Direction is a reading (hold z -14, ADS z -10), not confirmed.

---

## 2026-11-08 (9) — Claude (Opus 5.5) — player property cleanup (v1.36.1): 28 -> 18 of 32
- 10 per-gun scope properties (krep:akmscope ... krep:m107scope) merged into one enum `krep:scope` (values: nothing elcan acog coyote okp7 holo t2 standard_8). 42 sight events in player.json now set krep:scope; 204 RP reads switched.
- `scripts/attachments/scopeState.js`: each gun's sight saved in dynamic property `krep_scope_<gun>` after the menu fires the event (`rememberScope`), restored on held change (`applyHeldScope`); Java-attachment guns forced to "nothing" (moved from javaAttachments.js). aimZoom reads via `heldScope`.
- Removed unused property `krep:view` (the `krep:view` EVENT still exists and is used).
- Sight choices made before v1.36.1 are lost once (they lived in the removed properties).
**Test:** pick an ACOG on the AKM and a holo on the M4A1 in the attachment menu, switch between them: each keeps its own sight, aiming zooms right.

---

## 2026-11-08 (8) — Claude (Opus 5.5) — our own player death ragdoll (v1.36.0)
- User wants ragdoll for PLAYERS. Looked at `Mods/RealRagdoll-1.4.0.zip` (Yebbs69): physics ragdolls, but its license is All Rights Reserved (no modifying/reusing parts), it overrides player.json and needs 20 player properties (TACZ had 26; Bedrock caps an entity type at 32). User chose to build our own. Real Ragdoll is NOT installed.
- Server: `TACZ-B/scripts/combat/ragdoll.js`. damage.js: a lethal gun hit on a player calls `startRagdoll` (no health change); player kept alive `RAGDOLL.seconds` (config/combat.js) with resistance 255, movement/camera input locked, free camera behind the fall; then health 0 (kill sound/marker already played). Downed players can't fire (firing.js) or be hit again. Reset on playerSpawn. Test: `/scriptevent tacz:ragdoll [head] [strong]` (gets back up, works in creative).
- Properties (now 28/32 on the player): `krep:rd_dir` (0 off / 1+fall dir relative to body), `krep:rd_var` (packed headshot, strength, seed, tip room from a wall check).
- Client: `tools/gen_ragdoll_anim.py` writes `TACZ-R/animations/tacz_ragdoll.animation.json` (Molang-only: gravity fall about the feet, bounce, limb lag/flop/splay, headshot snap; override_previous_animation; last in animate list) and hooks it on player.entity.json. **Signs are guesses**: SIGN_FORWARD / SIGN_SIDE / ARM_OUT in the tool.
- Not covered: non-gun deaths (fall, mobs, vanilla explosions) die normally. Possible cleanup to free properties later: merge 10 per-gun scope properties into one (saves 9), drop unused krep:view property (saves 1).

---

## 2026-11-08 (7) — Claude (Opus 5.5) — realistic flash, smoke, thin tracers (v1.35.4) — USER APPROVED ("looks good")
- User on v1.35.3: flash now ALIGNED (model approach works) but too small and cartoony; wants realistic + smoke. Tracers barely visible: too fast, too thick; Blockfront tracers are thin lines. Reference: Blockfront MG flash (big, bright).
- `tools/make_flash_atlas.ps1`: builds `tacz_flash_model.png` (128x1024, 8 frames) from the user's free pack (`Textures/free_muzzle_flash.zip`), radial heat coloring (white core, yellow body, orange tips). Note: in Windows PowerShell 5 `[math]::Min(1, 0.5)` picks the int overload and returns 1; use 1.0.
- `tools/gen_muzzle_flash.py`: random frame per shot (`v.tacz_flash_frame`, render controller `uv_anim`), sizes STAR 20 / JET 26x16 px.
- `krep:muzzle_smoke` (3 gray puffs, ~1.5 s, drift up) spawned by firing.js each shot (`HITSCAN.muzzleSmoke`).
- Tracer: 60 blocks/s, thin line (0.012 half-width, 2.2 half-length), solid.
- User asked for **death ragdoll** (not started). Bedrock has no physics ragdoll; plan = custom death collapse animations on the player (random fall forward/back/side, limbs go loose), played while `!q.is_alive`.

---

## 2026-11-08 (6) — Claude (Opus 5.5) — model-based muzzle flash (v1.35.3)
- Test of v1.35.2 (AKM screenshots): particle flash was huge, soft and offset up-right at BOTH hip and ADS. Cause: first-person held items render with their own camera/FOV, particles with the world camera, so locator particles never line up in 1P. Jet pointed the wrong way.
- Replaced with a **model flash**: `tools/gen_muzzle_flash.py` (idempotent; re-run after changing guns, then deploy). Every gun geo has an empty `muzzle_flash` bone at the barrel tip. The tool builds `models/entity/tacz_flash.geo.json` (per gun: the bone chain root..muzzle_flash + quads: front star + 2 crossed forward jets), `render_controllers/tacz_flash.json`, entity entries (shown while `q.life_time - v.tacz_flash < 0.07`, hidden when silenced via krep:muzzle >= suppressedFrom), and hooks the shoot animations: timeline sets `v.tacz_flash`, random spin of `muzzle_flash` bone; old krep.muzzleflash/krep.muzzlejet particles removed from those guns. 52 guns.
- Texture `textures/particle/tacz_flash_model.png` drawn by script (crisp star + jet, user's GTA 4 reference style; user's shutterstock reference NOT used, it's watermarked).
- Tracer: solid (`particles_blend`), 2x thicker, half speed.
- Old locator reparenting (entry 5) kept; it still helps shells.
**Untested.** Unknowns: quad face orientation/culling (if flash invisible from some angle), size (STAR/JET_LEN/JET_H in the tool).

---

## 2026-11-08 (5) — Claude (Opus 5.5) — flash fixes (v1.35.2)
- User: flash looked faded, and sat up-right of the barrel when aiming. Reference: GTA 4 flash = long forward flame jet + side petals + sparks.
- ADS offset cause: muzzle locator bones hung off `Joints`, but the gun hangs off `Joints > rot`, which the sight + shoot animations move. Reparented the locator's top bone to `rot` in 19 geos (akm awp cp db deagleg g17 g18 g3 g36 m107 m16 m1911 m4a1 m870 minigun p320 saiga12 scarl uzi). Safe because no `.tp.` animation moves `rot`. Not done: aa12, fal, mp7, rpg, ump (different structure).
- Flash: `particles_blend` (solid in daylight) instead of additive, a bit bigger.
- New `krep:taczmuzzlejet` (`particles/tacz_muzzlejet.particle.json`): 2 stretched flame particles pointing along the barrel; added next to every `krep.muzzleflash` in 43 animation files (62 keyframes), registered on player.entity.json. **Barrel direction is a guess** (`v.fwd = -1`): if the jet shoots backwards, set `v.fwd = 1`.

---

## 2026-11-08 (4) — Claude (Opus 5.5) — gunfeel pass 1 (GTA 4 style: loud, big flash, dangerous)
User direction: keep all 58 guns, free-for-all (no teams), focus on gunplay feel. Reference: GTA 4 gunplay.
**Did (packs now v1.35.0):**
- Muzzle flash `krep:taczmuzzleflash` (all guns use it via their shoot animations): user's flash textures (`Textures/free_muzzle_flash.zip`, 12 x 2048px) packed to `TACZ-R/textures/particle/tacz_muzzleflash_atlas.png` (4x4 grid, 128px cells, 80 KB). Random frame + spin, ~0.06-0.09 s, bigger, additive, hot orange tint. Old silencer check kept.
- Tracers: new `krep:tracer` (glowing streak, 220 blocks/s) via `spawnTracer` in shotEffects.js; old smoke-puff line only for guns with `tracerParticles` (RPG, M320).
- Impacts: `krep:impact` (dust) on blocks, `krep:hit_entity` (red) on players/mobs.
- Sound: `playsound ... ~ ~ ~ vol 1 minVol` placed at shooter, range 120 (config `SOUND` in combat.js); all `.shoot` sounds max_distance 128.
- Kick: camera shake now short and sharp (config `KICK` in combat.js: intensity x2.5, duration x0.4 capped 0.12 s).
**Not tested in game yet.** All values are first guesses; tune in combat.js / particle JSONs.
**Open:** arm animations look wrong (user to describe which gun/when). Molang `query.property does not have an actor` on join: harmless (persona render in UI), parked.

---

## 2026-11-08 (3) — Claude (Opus 5.5)
**Verified:** start-server.bat + stop-server.ps1 work (typed console commands and clean remote stop both OK).
**Choppiness test (tacz:debug, 209 s, AKM):** 340 shots, every held-trigger gap exactly 2.0 ticks (= 600 rpm); empty reload 56/60 ticks, tac 42/46, all exact. Server timing is perfect, so the "choppy" feel is delivery (Wi-Fi to Odin) or client-side, not server load.
**Note:** BDS writes no ContentLog file for a run with nothing logged. Commands typed in the server window bypass chat permissions.
**Idea (not started):** play shot sound/animation client-side (RP controller while using the item) so feel doesn't depend on network timing; server keeps damage/ammo.

---

## 2026-11-08 (2) — Claude (Opus 5.5)
**Did:** Added `start-server.bat`/`start-server.ps1` (runs BDS, forwards typed commands, watches for `stop.request`) and `stop-server.ps1` (clean remote stop). Deployed the scoreOf fix to the server.
**Not verified:** the wrapper hasn't been run live yet (parse-checked only). If typed commands or output act weird in its window, fall back to running bedrock_server.exe directly.

---

## 2026-11-08 — Claude (Opus 5.5)
**Bug:** On the fresh world the AKM wouldn't fire, reload or inspect. Server log: `Failed to resolve identity for 'MuyChakisimo'` from `objective.getScore(player)` (new players have no scoreboard identity, so getScore throws).
**Fix:** added `scripts/util/score.js` `scoreOf()` and replaced all 7 raw getScore reads (firing, heat, inspect, reload, storedAmmoDisplay, ammoBox308). Behavior pack only, so no version bump needed for clients.
**Also:** server set to `gamemode=creative` + `force-gamemode=true` for testing (switch to survival later). Added cheap `addon-scout` subagent.
**Open:** a Molang error shows on the Odin 2 at join; need its exact text (client-side, not in the server log).
**Test:** stop server, run deploy.ps1, start, fire/reload AKM on Odin.

---

## 2026-11-07 (3) — Claude (Opus 5.5)
**Did:** First boot done by user (test world `Bedrock level` created; Odin 2 connects over LAN). Unpacked TACZ.zip to `addons/`, wrote `deploy.ps1`, deployed TACZ v1.34.4 into the world. Made MuyChakisimo operator. server.properties: texturepack-required, allow-cheats (test only), content logs on, view-distance 12.
**Not verified yet:** whether BDS 1.26.63 accepts `@minecraft/server` 2.10.0 / `server-ui` 2.2.0. Check the server console on next boot.
**Test on Odin:** accept the resource pack download, get a gun (creative inventory or `/give`), fire (L2), aim (crouch), reload (R2).

---

## 2026-11-07 (2) — Claude (Opus 5.5)
**Did:** Filled `allowlist.json` with the 8 friends (incl. MuyChakisimo). Recorded Blockfront feel target and settled controls in AGENTS.md.
**Next:** User boots the server once to generate the test world, stops it, then we inspect `worlds/` and install TACZ into the world.

---

## 2026-11-07 — Claude (Opus 5.5)
**Did:** First look at the project. Wrote AGENTS.md, CLAUDE.md, this file. No game/server files changed.

**Findings:**
- Server: BDS 1.26.63.1, never started, no world yet.
- `Mods/TACZ.zip` (v1.34.4) is a clean rewrite of the original obfuscated port: 58 guns, script hitscan, config-driven, error-isolated per player. Good base.
- Original port relied on ~41 bullet entities + 138 mcfunctions + 53 animation controllers; the rewrite dropped nearly all of that (big multiplayer win).

**Next steps (proposed):**
1. Unpack TACZ.zip into `addons/` as the editable source; write a deploy script that copies into the server and registers packs in the world.
2. First server boot on the laptop, install the addon, test on Odin 2 over LAN.
3. Tune `view-distance` for the 7700K, decide on controller scheme.
4. Set up laptop -> PC transfer (sync script or git).

## 2026-11-11 (Claude) — Sakura Katana pack added + client log triage
- Added `addons/SakuraKatana` (resource-only, from Downloads/sakura-katana.zip, uuid f66907ec-…, v1.0.0). It reskins the **trident** as a katana: trident textures (same paths, intentional override), `geometry.trident`, `animation.trident.*`, and `animation.humanoid.brandish_spear` (trident throw pose). No scripts, no behavior pack. TACZ defines none of these IDs.
- Renamed its `humanoid.animation.json` / `trident.animation.json` / `trident.geo.json` to `sakura_katana.*` so they override by identifier only and can't shadow the whole vanilla file by path. Deployed; server restarted, no new content-log errors.
- Test on Odin: hold/throw a trident (looks like katana, 1st + 3rd person); TACZ guns unaffected.
- Client log after joining IslandSurvivor: "Material armor/elytra/entity_alphatest... referenced but not defined" for VANILLA attachables (armor, elytra, shield, crossbow, trident). Verified TACZ ships no material files and overrides no vanilla attachable; its own 139 attachables use entity_alphatest without error. Likely a client-side vanilla log quirk; ignore unless armor actually renders wrong. Berserker Molang line = known harmless.

## 2026-11-11 (Claude) — transfer package for the host PC
- User clarified: Sakura Katana = keep ONLY the mod's own animations (hold, throw charge with petal Aura spin, Riptide). Do NOT add custom katana animations. A katana slash prototype was started by mistake and fully deleted (never deployed).
- Built `C:\Users\ChakaProjects\MinecraftServer_for_PC.zip` (341 MB, server stopped first): whole MinecraftServer folder incl. BDS, IslandSurvivor (115 files verified), configs, addons, deploy/start/stop scripts, docs, tools. Excluded: Mods/, Textures/ (laptop reference material), .claude/, .mcp.json (laptop paths).
- Host PC steps: unzip to `C:\Users\<user>\MinecraftServer` (keep the folder layout), run start-server.bat, allow Windows Firewall on Private networks. LAN join = PC's IP + 41993. Then playit.gg tunnel (TCP + UDP 41993, nethernet).
- IMPORTANT: once the PC hosts, don't keep playing IslandSurvivor on the laptop server — two copies of the world diverge. Laptop = edit + test (use the old "Bedrock level" world or a copy for tests); updates go to the PC as addons/ + deploy.ps1.

## 2026-11-11 (Claude) — GitHub sync set up (commit/push pending user approval)
- Project folder is now a git repo on the user's existing private repo MuyChakisimo/MCBWM (history copied from the old clone at C:\MCBWM, which the user will delete). `.gitignore` keeps the BDS program, worlds, Mods/, Textures/, *.zip out; tracks the 3 shared server settings files.
- Everything is STAGED (old TACZ-B/TACZ-R detected as moves into addons/). The commit + push were blocked by the agent permission check; the user runs/approves them.
- `update-server.ps1` (host PC): stop server -> git pull --ff-only -> deploy -> start; first run connects a folder unzipped from MinecraftServer_for_PC.zip (no .git) via fetch + `git reset origin/main`. NOT yet tested end-to-end (needs the push first).
- MinecraftServer_for_PC.zip predates update-server.ps1/.gitignore; copy update-server.ps1 next to it on the PC (or it arrives with the first pull).
