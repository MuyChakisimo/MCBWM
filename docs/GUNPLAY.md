# Gunplay plan: Call of Duty feel on Bedrock

Written 2026-10-04 from two research passes (CoD gunplay design; Bedrock APIs checked against the official
`@minecraft/server` type definitions 1.18.0 -> 2.11.0-beta) and the first in-game test reports / script profile.
Numbers marked *guess* are starting points to tune by playing. Target device: AYN Odin 2 (Android, controller).

## 1. Where we are (v1.30.5)

| System | Now | File |
|---|---|---|
| Firing | script, rpm from config, semi / burst / auto, bolt & pump cycles | combat/firing.js |
| Reloading | script, auto reload on empty, shell by shell, ammo from inventory | combat/reload.js |
| Hit detection | hitscan rays from the eyes, glass breaking, shotgun pellets with spread | combat/hitscan.js |
| Damage | per gun, headshot radius x multiplier, range falloff steps, armor x penetration | combat/damage.js |
| Recoil | one `camerashake` command per shot: shake only, no kick, no pattern | combat/recoil.js |
| Aiming (ADS) | aiming = sneaking; scopes zoom by a Slowness effect (also nearly stops walking) | player.json groups |
| Hip-fire | perfectly accurate except shotguns (no cone) | hitscan.js |
| Feedback | hit / headshot / kill sounds to the shooter, red hurt flash; no hit marker | damage.js |
| Cost | all TACZ scripts ~0.76 ms per tick (budget 50 ms); 3 polling scripts ~0.3 ms of it | profile 2026-10-03 |

Script API: `@minecraft/server` **1.18.0**. The test server (1.26.51) runs up to **2.10.0** stable.

## 2. What makes CoD guns feel good (research summary)

If only five things: **(1)** hit feedback (marker + tick sound; red marker + heavier sound on kill; headshot
"dink"), **(2)** punchy layered gun sounds (close shot, mechanics, tail, distant version), **(3)** a learnable
recoil pattern per gun (fixed path + small jitter, drama in the gun model and a small shake, not big camera
jumps), **(4)** smooth ADS (zoom eased over the ADS time; hip-fire is a cone, ADS is near perfect),
**(5)** fair readable damage (clear time-to-kill per class, headshot bonus, falloff; bullet magnetism on
controllers).

Reference values (*community / guess*): ADS time pistol 150-200 ms, SMG 200-260, AR 250-320, LMG 350-550,
sniper 400-650. Sprint-to-fire pistol 100-150 ms, SMG 150-220, AR 220-280, LMG / sniper 300-450. Hip cone
pistol / SMG 2-4 deg, AR 4-6, LMG 6-8, sniper 8-12; moving / jumping widens it 1.5-2x. Zoom (FOV from 70):
iron sights ~58, red dot ~50, 3-4x scope ~20-26, sniper ~10. ADS movement 50-60 % of walking. TTK at 100 HP:
best ARs / SMGs ~180-300 ms up close. MW4 (2026) dropped hip-fire bloom and made visual recoil match the bullets;
players hated visual recoil that hides the sight. Aim assist = slowdown + rotation; Black Ops 6 weakened it
point-blank.

## 3. What Bedrock gives us (module version needed)

| Need | API | Version |
|---|---|---|
| Real ADS / scope zoom, eased | `player.camera.setFov({ fov, easeOptions })` | 2.2.0 |
| Native recoil shake (no command per shot) | `player.camera.addShake({ type, intensity, duration })` | 2.10.0 |
| View kick | `player.setRotation()` (server snap; may judder at mobile ping: test small values) | 1.18.0 |
| Left click / trigger as an event (tactical reload, melee) | `world.afterEvents.playerSwingStart` | 2.5.0 |
| Item switch / inventory change events (replace polling) | `playerHotbarSelectedSlotChange`, `playerInventoryItemChange` | 2.1.0 |
| Check before raycasting far | `dimension.isChunkLoaded()` | 2.3.0 |
| Jump / sneak state, stick direction, input mode (controller?) | `player.inputInfo` | 1.18.0 |
| Lock jump / movement categories | `player.inputPermissions` | 1.18.0 |
| Hide vanilla crosshair, HUD elements | `onScreenDisplay.setHudVisibility` | 1.18.0 |
| Hit marker image | JSON UI element bound to a coded title string (no native API) | any |
| Slow while aiming | item `minecraft:use_modifiers.movement_modifier`, or movement component | - |
| Aim assist API | third-person only (draws a reticle): **not usable** for first person | 2.7.0 |

Moving 1.18.0 -> 2.10.0 (manifest + server-ui 2.2.0) changes: `isValid()` -> `isValid`; GameMode values
capitalised; `runCommandAsync` removed (recoil.js uses it); `worldInitialize` -> `system.beforeEvents.startup` /
`world.afterEvents.worldLoad`, and top-level world access must wait for worldLoad (ammoScoreboards.js does it
in `system.run`); `itemUseOn` events removed; `getComponent` throws on invalid entities; effect ids get the
`minecraft:` prefix; `applyKnockback` signature. validate.mjs can check against 2.10.0's types.

## Decisions (user, 2026-10-04)

- **First person first.** No aim assist and no bullet magnetism. Third-person camera polish: near the end.
- **Hit marker: optional.** Server default + each player can override it; the red hurt flash stays for everyone.
- **Aiming stays "crouch to aim"**, walking slower (as now). Scopes get real eased zoom (`setFov`).
- **Accuracy, GTA IV style:** holding the trigger makes shots spread more, both hip-fire and aiming (aiming
  starts tighter and grows less); tapping stays accurate. (Not CoD MW4's no-bloom.)
- **Recoil: shake only.** Bullets go where the crosshair is; recoil is camera shake + the gun animation, with a
  per-gun profile. (No view kick with setRotation.)
- **Muzzle flash light** lights up dark areas on every shot, except with a silencer; big muzzle flashes, cool
  tracers and "thump" in the sounds (GTA IV is the user's favourite gun feel). Damage tuning by gun class; sounds
  by area (indoor / outdoor, distant).
- Keep files small (cleanup), and import the last Java guns (Springfield 1873, Lone Trail, AUG).
- Make factual decisions (measure / check the APIs, ask), not guesses.

## 4. Gap list

| Mechanic | CoD | Ours | Plan |
|---|---|---|---|
| ADS zoom | eased FOV per optic | Slowness effect | `setFov` eased over the gun's ADS time; zoom per optic |
| ADS movement | 50-60 % speed | Slowness amp 6 / 14 (crawl) | movement modifier ~0.6 |
| Hip-fire | cone per class + movement | perfect aim | cone per class, x1.5-2 moving / airborne; spread grows while the trigger is held (hip and ADS, GTA IV) |
| Recoil | pattern + kick + recovery | random shake | shake only (user): per-gun `addShake` profile + gun animation kick |
| Hit marker | X image + sounds | sounds only | optional JSON UI hit marker (server default + per-player toggle) |
| Sprint-to-fire | 100-450 ms | none | block shots for N ticks after sprinting stops |
| ADS time | 150-650 ms | instant (animation only) | no ADS accuracy until the ease ends |
| Flinch | view kick when hit | none | small rotation kick on players hit by guns |
| Distant shots | far sound with delay | one sound to 30 blocks | `<id>.far` to players 30-128 blocks, delayed distance / 343 s |
| Muzzle flash light | flash per shot | none | light block at the shooter for 1-2 ticks (not with a silencer) |
| Bullet magnetism | controller assist | none | not wanted (user: no aim assist) |
| Penetration | thin materials | glass / wheat only | wood / leaves etc. with damage x0.5-0.75 per block (*guess*) |

## 5. Plan, in order

Each phase is its own version(s), tested in game with `scriptevent tacz:debug` and `script profiler`.

0. **Script API 2.10.0** (foundation). Migrate the code (list in section 3), update validate.mjs. Nothing
   should change in game: a full regression test.
1. **Feel, quick wins.** Optional hit marker UI. Recoil via `addShake` (drops the command per shot). Real ADS zoom
   with `setFov` replacing the Slowness hack (scopes keep their zoom levels; walking slower, not crawling).
   Muzzle flash light.
2. **Accuracy.** Hip cone per class, movement / jump penalties, spread growth while the trigger is held (hip and
   ADS), ADS time and sprint-to-fire delays (config per class with per-gun overrides).
3. **Recoil feel.** Per-gun shake profile (strength, length, growth over a burst); attachments scale it
   (config/recoil.js already has the reductions).
4. **Damage tuning.** Time-to-kill targets per class.
5. **Sound + flash.** Distant versions with delay, indoor / outdoor tails (needs audio assets), more "thump";
   bigger muzzle flashes and tracers; check reload cue sync.
6. **Performance leftovers.** Event-driven attachment / stored-ammo / lore (2.1.0 events), `playerSwingStart`
   replaces the shared `reload_input` controller, `isChunkLoaded` before far rays, minigun to script, final
   cleanup of per-gun leftovers.
7. **Last Java guns** (Springfield 1873, Lone Trail, AUG) and third-person camera polish.

Not planned: native aim assist (third person only), hip-fire bloom (dropped by MW4 as unfair randomness).

## 6. Risks to test early

- `setFov` vs the player's own FOV setting; whether it holds on the Odin.
- `setRotation` kick smoothness at mobile ping (if it judders: shake + model kick only).
- Movement modifier reliability on players (sprint and effects recompute speed).
- 2.10.0 needs a client on 1.26.5x (the server already requires the same version).

The original Bedrock release is in `reference/TACZ mod V1.0.2 TRANSLATED EDITION.zip` if a file needs recovering.
