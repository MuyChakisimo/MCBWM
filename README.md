# TACZ Bedrock (TACZ-B / TACZ-R)

Minecraft Bedrock weapon add-on derived from TACZ.

| Folder | What |
|---|---|
| `TACZ-B/` | Behavior pack: scripts, `minecraft:player` extension, items, BP controllers, functions |
| `TACZ-R/` | Resource pack: player renderer, models, textures, animations, particles, sounds |
| `tools/validate.mjs` | Static validator. Run after every edit |
| `tools/script-surface/` | Offline audit of every script subscription and interval |
| `docs/ARCHITECTURE.md` | How everything works; **where X happens**; adding a weapon |
| `docs/DEBUGGING.md` | Symptom → files to inspect |
| `docs/CLEANUP_REPORT.md` | What was removed and why; performance ranking |
| `docs/RUNTIME_TEST_CHECKLIST.md` | In-game test matrix |
| `*.zip` | Reference only (original Bedrock release, Java TACZ). Never shipped |

```bash
node tools/validate.mjs            # writes docs/VALIDATION_REPORT.md
node tools/validate.mjs --strict   # non-zero exit on errors (CI)
```

In game:

```text
/scriptevent tacz:debug state      # what the renderer/engine think you are holding
/scriptevent tacz:debug on|off     # transition logs to the content log
/scriptevent tacz:profile on|report|off
```

## Invisible player: root cause and fix

**Symptom:** in third person the whole player, including vanilla held items, was invisible except for the shadow. In first person all TACZ guns were invisible, the vanilla sword was visible, and firing, tracers, damage, sounds and particles all worked.

**Pipeline facts that isolate it:**
- The muzzle flash is a particle emitted by the player's own client animation. It rendered, so the player client entity loaded and animated. Only its mesh drawing failed.
- With a sword in third person, the **only** active player render controller is the body RC. In the pack it was gated on `variable.is_third_person`, a `pre_animation`-computed variable. Every gun RC is also gated on `pre_animation` variables, while the first-person arm RC (`!variable.holding_all_guns`) stays true when those are 0. A `pre_animation` evaluation failure therefore produces exactly the reported pattern.
- Structurally, `player.entity.json` is the original file plus a self-contained Java-import block (verified by a per-key diff of materials, textures, geometry, scripts, animate and render controllers, plus resolution of every referenced RC, geometry, texture and Molang key). The only **global** change affecting the original pipeline was the resource-pack `min_engine_version` bump from `[1,20,0]` to `[1,21,70]`, which changes the Molang/render semantics the whole snapshot is evaluated under.

**Fix (commit "fix: restore base player rendering"):**
1. Restored the RP `min_engine_version` to the known-good `[1,20,0]`.
2. Gated the body RC on the engine-provided `!variable.is_first_person && !variable.map_face_icon` (the vanilla condition). Even if `pre_animation` fails again, players stay visible; only gun-specific rendering fails.

**Related fixes:**
- Removed the second behavior `minecraft:player` (`plalyer.json`).
- Resolved the conflicting `controller.render.m107` definitions.
- Stopped 9 looping Java shoot/reload clips from latching on the player via `playAnimation`.
- Removed 590 duplicate or dead files (see CLEANUP_REPORT).

**Still needs runtime confirmation.** This could not be run in Minecraft here. Test `docs/RUNTIME_TEST_CHECKLIST.md` "Milestone 1" first. If the body is visible but guns are still missing, a `pre_animation` statement is failing: the content log names it, and DEBUGGING.md has the bisection steps.

## Known gaps (inherited from the original)

- **M107 has no model render path** (see ARCHITECTURE "Known structural debt"). Gameplay works.
- Java-import guns have no third-person pose and no muzzle-flash timeline.
- A few legacy poses, shell-casing particles and 16 sound files are missing upstream (CLEANUP_REPORT, bottom table).
