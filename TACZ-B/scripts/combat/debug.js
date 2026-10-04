import { system, Player } from "@minecraft/server";
import { WEAPONS } from "../config/weapons.js";

// Test tools, typed in the server console (or by an operator in chat):
//   scriptevent tacz:debug start   record every shot and reload, from all players, quietly
//   scriptevent tacz:debug stop    print a report per gun (server console / content log) and stop recording
//   scriptevent tacz:debug on|off  log one line per shot and reload step as it happens
// The report shows, per gun: shots and the time between shots while the trigger is held (flagged when slower
// than the gun's rpm), the sounds played, and per reload kind: count, time to load and to end, cancels,
// "no ammo" and auto reloads. Nothing is recorded or built while it's all off.

let live = false;
let session = null; // { startTick, guns: Map<id, stats> }

const out = (text) => console.warn(`[TACZ debug] ${text}`);

/** Live log line (built only when the live log is on). */
export function debug(make) {
  if (live) out(`tick ${system.currentTick} ${make()}`);
}

function stats(id) {
  let s = session.guns.get(id);
  if (!s) session.guns.set(id, (s = { shots: 0, gaps: [], last: new Map(), sounds: new Set(), reloads: {} }));
  return s;
}

/** A shot (firing.js). */
export function recordShot(player, id, sound) {
  if (!session) return;
  const s = stats(id);
  const now = system.currentTick;
  const last = s.last.get(player.id);
  if (last !== undefined && now - last <= 20) s.gaps.push(now - last); // longer gaps are separate trigger presses
  s.last.set(player.id, now);
  s.shots++;
  s.sounds.add(sound);
}

/** A reload step (reload.js): phase "start" | "load" | "end" | "cancel" | "noammo"; auto = started by itself. */
export function recordReload(player, id, kind, phase, auto = false) {
  if (!session) return;
  const r = (stats(id).reloads[kind] ??= { count: 0, auto: 0, load: [], end: [], cancel: 0, noammo: 0, started: new Map() });
  const now = system.currentTick;
  if (phase === "noammo") r.noammo++;
  else if (phase === "start") {
    r.count++;
    if (auto) r.auto++;
    r.started.set(player.id, now);
  } else if (phase === "cancel") r.cancel++;
  else {
    const t0 = r.started.get(player.id);
    if (t0 !== undefined) r[phase].push(now - t0);
  }
}

const avg = (a) => (a.length ? (a.reduce((x, y) => x + y, 0) / a.length).toFixed(1) : "-");
const range = (a) => (a.length ? `${avg(a)} (${Math.min(...a)}-${Math.max(...a)})` : "-");

function report() {
  const ticks = system.currentTick - session.startTick;
  out(`report: ${(ticks / 20).toFixed(0)} s recorded, ${session.guns.size} gun(s); times in ticks (20 per second)`);
  for (const [id, s] of [...session.guns].sort()) {
    const w = WEAPONS[id];
    const expected = w?.rpm ? 1200 / (w.fireMode === "burst" ? w.burst?.rpm ?? w.rpm : w.rpm) : undefined;
    const mean = s.gaps.reduce((x, y) => x + y, 0) / (s.gaps.length || 1);
    const slow = expected && s.gaps.length >= 3 && mean > Math.max(expected * 1.5, expected + 1);
    out(`${id}: ${s.shots} shot(s); held-trigger gap ${range(s.gaps)}${expected ? `, rpm ${w.rpm} = ${expected.toFixed(1)}` : ""}${slow ? "  << SLOWER THAN ITS RPM" : ""}; sound ${[...s.sounds].join(", ") || "-"}`);
    for (const [kind, r] of Object.entries(s.reloads))
      out(`   ${kind} reload: ${r.count}x (${r.auto} auto), load at ${range(r.load)}, end at ${range(r.end)}${r.cancel ? `, ${r.cancel} cancelled` : ""}${r.noammo ? `, ${r.noammo}x no ammo` : ""}`);
  }
  if (!session.guns.size) out("nothing was fired or reloaded");
}

system.afterEvents.scriptEventReceive.subscribe(({ id, message, sourceEntity }) => {
  if (id !== "tacz:debug") return;
  const cmd = message.trim() || "on";
  let reply;
  if (cmd === "start") {
    session = { startTick: system.currentTick, guns: new Map() };
    reply = "recording shots and reloads; 'scriptevent tacz:debug stop' prints the report";
  } else if (cmd === "stop") {
    if (session) report();
    reply = session ? "report printed to the server console / content log" : "nothing was being recorded";
    session = null;
  } else {
    live = cmd !== "off";
    reply = `live log ${live ? "on" : "off"}`;
  }
  out(reply);
  if (sourceEntity instanceof Player) sourceEntity.sendMessage(`TACZ debug: ${reply}`);
});
