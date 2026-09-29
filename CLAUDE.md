# TACZ Bedrock

Minecraft Bedrock gun add-on (behavior pack `TACZ-B/`, resource pack `TACZ-R/`), ported from TACZ.

- **Read `NEXT_STEPS.md` first**: current state, what's untested, the planned work, decisions already made.
- `README.md` explains the code, config files and tools; `docs/HOW-IT-WORKS.md` traces each system (firing,
  reloading, HUD, inspect, rendering, sounds) file by file, with a troubleshooting table.
- `reference/` (Java TACZ zip, original release) is not in git; copy it by hand on a new computer.

Working rules:

- Run `node tools/weapons/check.mjs` before committing; it must print `Everything matches.`
- Bump the pack version in both manifests and the README whenever the packs change.
- One commit per step; end commit messages with the attribution line.
- Verify tool changes in a scratch copy of the repo, not by adding test guns to the packs.
- Say plainly what needs testing in game. Update `NEXT_STEPS.md` at the end of a session.
