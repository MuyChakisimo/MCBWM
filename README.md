# TACZ-B / TACZ-R Cleaned Modular Build

This project contains the cleaned Behavior Pack (`TACZ-B`) and Resource Pack (`TACZ-R`).

## Main weapon configuration

Edit:

`TACZ-B/scripts/config/weapons.js`

This is the main weapon registry used by the modular combat systems and hover/lore data. Existing Bedrock weapon balance values were preserved during this cleanup unless a previously missing value had already been restored from the supplied Java TACZ source.

Supporting registries:

- `TACZ-B/scripts/config/calibers.js` - caliber -> Bedrock ammo item mapping
- `TACZ-B/scripts/config/weaponVisuals.js` - animation/sound exceptions
- `TACZ-B/scripts/config/javaImportedWeapons.js` - Java-only imported weapon data
- `TACZ-B/scripts/config/javaAttachments.js` - imported attachment definitions

## Current combat architecture

- 57 configured weapons
- 55 hitscan firearms
- RPG and M320 remain physical projectiles
- Shotguns use multi-ray hitscan
- Damage / armor / raycast / effects are shared modules
- Java-import weapons use the modular player-state / ammo / reload engine
- Existing Bedrock weapons still retain some legacy controller/reload compatibility paths pending staged migration

## Validate after edits

From the project root, run:

```bash
node tools/validateProject.mjs
```

See `docs/CLEANUP_AUDIT.md` and `docs/RUNTIME_TEST_CHECKLIST.md` before major releases.
