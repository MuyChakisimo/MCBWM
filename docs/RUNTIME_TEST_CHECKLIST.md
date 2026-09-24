# Runtime Test Checklist

Static validation cannot replace Bedrock runtime testing. Use this after installing both packs on the test server.

## Startup / content log

- server starts without script exceptions
- no duplicate event-listener symptoms
- inspect content log for new missing animation/model/texture/sound errors
- run `node tools/validateProject.mjs` after any file/config edits before launching the server

## Existing Bedrock weapons

Test at least one from each category:

- assault rifle: M4A1 / AKM
- SMG: MP5
- pistol: G17 / G18
- sniper/DMR: AWP / SKS
- LMG: M249
- shotgun: AA-12 / M870
- heavy sniper: M107
- physical launcher: RPG

For each verify:

- first-person model
- third-person model
- ADS
- shoot animation/sound
- reload and tactical reload
- ammo decrement / empty state
- headshots and armor
- walls block hitscan
- five-puff tracer
- impact effect
- fragile glass behavior where applicable

## Java-import modular weapons

Prioritize:

- AUG - automatic rifle
- CZ75 - semi pistol
- RPK - sustained automatic
- SPAS-12 - multi-ray shotgun + specialty reload animation
- Kar98k - specialty/bolt-action animation mapping
- M700 - sniper
- M95 - heavy sniper
- M320 - physical grenade
- Springfield 1873 - specialty reload animation mapping

Verify:

- inventory icon and hover stats
- first/third-person model visibility
- geometry alignment
- shoot/reload animation names resolve in game
- configured shoot/reload audio
- caliber item consumption
- RPM/cadence
- hitscan or physical projectile path as configured
- reload cancellation/weapon switching edge cases

## M107 focused test

- visible first-person model
- visible third-person model
- 10-round magazine
- `.50 BMG` ammo consumption
- semi-auto behavior
- 55 base damage unless intentionally changed in `weapons.js`
- configured reload timing
- ADS / scope animation
- no `bullet:m107` entity

## Attachments

- legacy Bedrock attachment workbench still opens
- legacy attachments persist after weapon switching
- imported modular attachment selection changes configured stats
- verify visual placement individually before declaring an imported Java attachment model supported

## Multiplayer stress

Repeat with 1 / 5 / 10 players:

- idle
- simultaneous automatic fire
- simultaneous shotgun fire
- reload together
- switch weapons rapidly
- several players shoot one target
- several players shoot different targets
- RPG / M320 while hitscan fire is occurring

Use profiler commands where useful:

```text
/scriptevent tacz:profile on
/scriptevent tacz:profile report
/scriptevent tacz:profile off
```

Watch:

- hitscan calls/sec
- pellet rays/sec
- tracer particles/sec
- damage applications/sec
- RPG/M320 projectile spawns
- script watchdog warnings
- visible server tick spikes

## Regression rules

If a refactor changes gameplay, compare it against the last known-working category before deleting the old compatibility path. Keep migrations category-sized and reversible.
