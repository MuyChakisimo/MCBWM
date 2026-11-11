# Project: Modern Warfare Minecraft Bedrock Server

Shared instructions for every AI agent working here (Claude Code reads this through CLAUDE.md; Codex / ChatGPT read it directly).
Before doing anything, read this file and the latest entries in `HANDOFF.md`. When you stop, add a `HANDOFF.md` entry.

## Goal
A modern-warfare style Bedrock Dedicated Server (BDS) for **10+ players**, built around the TACZ firearms addon, with more addons to come.
Priority #1: guns that feel good and work reliably in multiplayer. Priority #2: controller-friendly controls.
**Feel target: Blockfront** (WW2 Minecraft shooter mod): punchy, readable gunfights, meaningful recoil, slower-paced and tactical rather than arcade.

**Controls are settled (user, 2026-11-07):** crouch = aim, R2 = reload, L2 = fire. This matches the addon's current input wiring (use = fire, swing = tactical reload, sneak = aim). Don't rewire inputs without asking.

World: current world is a **test world**; a specific seed comes later. Allowlist is on (private server); `allowlist.json` holds the friend list.

## Machines
| Role | Hardware | Notes |
|---|---|---|
| Dev laptop | ASUS Zephyrus G16, AMD Ryzen AI 9 HX, RTX 4070 laptop | Where editing happens. Path: `C:\Users\ChakaProjects\MinecraftServer` |
| Host PC (production server) | Intel i7-7700K (4C/8T), ~16 GB RAM, GTX 1050 Ti (unconfirmed) | Runs BDS 24/7. GPU irrelevant for BDS; CPU single-thread speed matters |
| Test client | AYN Odin 2 (Android, built-in controller) | Main test device. PS5 can't join (no PS+) |

Networking: no port forwarding. Friends join through a **playit.gg** UDP tunnel to port 19132. LAN testing on the same Wi-Fi works directly.

## Layout
```
MinecraftServer/
  AGENTS.md / CLAUDE.md / HANDOFF.md   agent docs (keep up to date)
  bedrock-server-1.26.63.1/            BDS install (never started yet as of 2026-11-07)
  Mods/
    TACZ mod V1.0.2 TRANSLATED EDITION.zip  ORIGINAL Bedrock port (obfuscated, bullet entities). Reference only.
    TACZ-JAVA.zip                           Java (Forge) TACZ mod jar contents. Reference for stats/models/sounds.
    TACZ.zip                                OUR WORKING VERSION (TACZ-B behavior + TACZ-R resource), v1.34.4
```
  addons/TACZ-B, addons/TACZ-R         EDITABLE SOURCE of the addon (unpacked from Mods/TACZ.zip)
  deploy.ps1                           copies addons/* into the server's development_*_packs and enables them in the world
```
**Git (private repo `MuyChakisimo/MCBWM`, branch main):** the project folder IS the repo. Tracked: addons/, tools/, docs, scripts, and only `server.properties` / `allowlist.json` / `permissions.json` from the BDS folder. NOT tracked (`.gitignore`): the BDS program, worlds (the live world lives only on the host PC), Mods/, Textures/, *.zip. Flow: edit + test on the laptop, commit + push (ask the user before pushing); on the host PC run `update-server.ps1` (stops server, `git pull --ff-only`, deploy, restart; first run connects an unzipped folder to the repo).
Treat the zips as archives. Edit `addons/`, then with the server stopped run `powershell -ExecutionPolicy Bypass -File .\deploy.ps1` (optional `-WorldName "..."`). Any new folder in `addons/` with a manifest gets deployed too.
Operator: MuyChakisimo (the user) via `permissions.json`. Test world has `allow-cheats=true`; turn it off for the real world.

## TACZ working version (TACZ.zip) — key facts
- Pack UUIDs: behavior `4f2a831e-9d12-4c6b-96e5-22a83b9f1a01`, resource `9d8e7f6a-5b4c-3d2e-1f0a-9b8c7d6e5f4a`, version `[1, 34, 4]`. **Bump the version in both manifests on every release** or clients keep their cached copy.
- Script API: `@minecraft/server` 2.10.0, `@minecraft/server-ui` 2.2.0. Entry `scripts/main.js`.
- All 58 guns fire by **script hitscan** (`combat/hitscan.js`), no bullet entities. Good for multiplayer.
- Tunables live in `scripts/config/`: `weapons.js` (per-gun stats), `combat.js` (global damage/recoil multipliers, headshots, armor, range, breakable blocks), `recoil.js`, `ammo.js`, `attachments.js`.
- Code comments mention internal tools (`tools/weapons/*.mjs`) that are **not** in the zip.

### Current controls (Bedrock gives scripts very few inputs)
| Action | Input | Controller (default Bedrock layout) |
|---|---|---|
| Fire | Use item (hold) | LT |
| Aim down sights | Sneak | Right-stick click / B (depends on layout) |
| Tactical reload | Swing / attack | RT |
| Empty reload | Use with empty gun | LT |
The user is happy with this layout (L2 fire, R2 reload, crouch aim). Scripts can't add new buttons anyway.

## Server settings worth knowing (`server.properties`)
- **World: `IslandSurvivor`** (the user's long-running world, seed -5981624730078081782; source `Downloads/IslandSurvivor.zip`). The old test world `Bedrock level` is still in `worlds/` but unused. `deploy.ps1` targets the world named by `level-name`.
- **Port 41993, `transport=nethernet` (REQUIRED: BDS 1.26.63 only supports NetherNet; with raknet it logs "TRANSPORT TYPE ERROR" and nobody can connect).** NetherNet = handshake over **TCP** server-port + gameplay over **UDP** `server-udp-ports` (41993; public:local mapping possible, see bedrock_server_how_to.html "UDP port configuration"). server-portv6 is ignored. playit.gg: BDS can't use the tunnel directly; it goes through the WaterdogPE proxy (see `proxy/README.md`), with BDS on 19142 + online-mode=false and friends-only enforced by `scripts/config/access.js`. Cox router port forwarding is not available (no account login). LAN join from the Odin: laptop IP + port 41993.
- `max-players=10`, `tick-distance=4`, `view-distance=6`, `compression-algorithm=snappy`, `difficulty=normal`, creative for now (user will switch to survival later), `allow-list=true`, `online-mode=true`, `texturepack-required=true`.
- Content log on (console + file) for debugging the addon; script errors show in the server window.
- `transport=nethernet` is a new BDS option; verify playit.gg tunnels work with it.

## Rules for agents
1. Don't modify `bedrock-server-*/` vanilla packs or the original zips.
2. Keep config values in `scripts/config/`; don't scatter magic numbers in combat code.
3. Every change to weapon behavior: note it in `HANDOFF.md` with what to test on the Odin 2.
4. Performance budget: assume 10 players firing automatic weapons on a 7700K. Avoid per-tick work for every player; prefer events. Watch `system.runInterval` loops (firing, heat, muzzleLight, reload).
5. Never put playit.gg secrets, Xbox gamertags/XUIDs beyond the allowlist, or passwords in these docs.
6. Server workflow: the user starts the server with `start-server.bat` (wraps BDS so it can be stopped remotely). Agents may stop it with `powershell -ExecutionPolicy Bypass -File .\stop-server.ps1` (clean save via a `stop.request` file), then edit + run `deploy.ps1`, then start it again in its own visible window: `Start-Process start-server.bat` from the project root (user approved, 2026-11-08). Never run bedrock_server.exe directly or hidden in a background shell (the user must be able to see and type in the console). Use `-Force` (kill) only if the user agrees. To run a console command (e.g. `op <name>`, `scriptevent ...`), write it to a `command.request` file in the project root; the wrapper sends each line to the server and deletes the file.
10. **No guessing (user rule, 2026-11-08).** Edit on facts or very well-educated guesses only. Reproduce a problem and verify the fix yourself before deploying: diff against the original `Mods/TACZ.zip`, read the real data, and for first-person visuals render with `tools/fp_preview.py <gun> [anim] [time]` + `tools/fp_render.ps1` (calibrated against in-game AKM/M870). If something can't be verified, say so plainly instead of shipping trial-and-error for the user to test.
11. Blockbench MCP (Claude only): repo `C:\Users\ChakaProjects\Projects\blockbench-mcp` (sosadly/blockbench-mcp, built), registered in `.mcp.json`. Needs Blockbench open with `plugin/blockbench_mcp.js` loaded (bridge 127.0.0.1:8787). Use it to open the TACZ .geo.json / animation files and screenshot poses to verify visual changes.
7. Subagents use cheap models (haiku for reading/searching, sonnet for code). `.claude/agents/addon-scout.md` is a haiku helper.
8. Server content logs (script errors) are in `%APPDATA%\Minecraft Bedrock Server\logs\ContentLog*.txt`, not in the server folder. Client-side errors (Molang, rendering) only show on the player's device.
9. Scoreboard reads must go through `scripts/util/score.js` `scoreOf()`; raw `objective.getScore(player)` throws for brand-new players.
