# Project Structure

## Behavior Pack

```text
TACZ-B/
  entities/
    player.json
    bullet/
      rpg.json
      m320.json
  items/
    weapons/<weapon>/
    ammo/
    utility/
  scripts/
    main.js
    attachments/
    config/
    core/
    effects/
    events/
    players/
    utils/
    weapons/
  animations/
  animation_controllers/
  functions/
  templates/
```

## Script responsibilities

### `scripts/config/`
Data/registries. Weapon values should be changed here instead of copied into combat handlers.

### `scripts/weapons/`
Authoritative combat systems: hitscan, raycast, damage, armor, ammo, reload, recoil, launcher bridge/cleanup.

### `scripts/players/`
Per-player modular runtime state.

### `scripts/attachments/`
Attachment state/persistence and modular attachment support.

### `scripts/effects/`
Cosmetic tracer/impact effects separated from authoritative damage.

### `scripts/events/`
Bootstrap-facing world/UI/inventory compatibility systems. Several legacy UI modules remain obfuscated and are explicitly named as such.

### `scripts/core/`
Profiler/diagnostics.

## Resource Pack

Root controller/attachable/particle filenames have been renamed to their actual identifiers. Large nested legacy animation/model bundles remain in their original nested layout until they can be split with verified reference maps.
