import { system } from "@minecraft/server";

// =====================================================
// TACZ LIGHTWEIGHT PROFILER
//
// Disabled by default.
//
// /scriptevent tacz:profile on
// /scriptevent tacz:profile off
// /scriptevent tacz:profile reset
// /scriptevent tacz:profile report
// =====================================================

let enabled = false;
let startedAt = 0;
const counters = Object.create(null);

function resetCounters() {
  for (const key of Object.keys(counters)) delete counters[key];
  startedAt = Date.now();
}

export function isProfilerEnabled() {
  return enabled;
}

export function profileCount(name, amount = 1) {
  if (!enabled) return;
  counters[name] = (counters[name] ?? 0) + amount;
}

function buildReport() {
  const elapsedSeconds = startedAt
    ? Math.max(0.001, (Date.now() - startedAt) / 1000)
    : 0;

  const lines = [
    `TACZ profiler: ${enabled ? "ON" : "OFF"}`,
    `Window: ${elapsedSeconds.toFixed(1)}s`,
  ];

  for (const key of Object.keys(counters).sort()) {
    const value = counters[key];
    const rate = elapsedSeconds > 0 ? value / elapsedSeconds : 0;
    lines.push(`${key}: ${value} (${rate.toFixed(2)}/s)`);
  }

  if (Object.keys(counters).length === 0) {
    lines.push("No counters recorded.");
  }

  return lines.join("\n");
}

function outputReport(event, text) {
  const source = event.sourceEntity;
  if (source && typeof source.sendMessage === "function") {
    source.sendMessage(text);
  } else {
    console.warn(text);
  }
}

system.afterEvents.scriptEventReceive.subscribe((event) => {
  if (event.id !== "tacz:profile") return;

  const command = (event.message ?? "report").trim().toLowerCase();

  switch (command) {
    case "on":
      enabled = true;
      resetCounters();
      outputReport(event, "TACZ profiler enabled and reset.");
      break;

    case "off":
      outputReport(event, buildReport());
      enabled = false;
      break;

    case "reset":
      resetCounters();
      outputReport(event, "TACZ profiler counters reset.");
      break;

    case "report":
    default:
      outputReport(event, buildReport());
      break;
  }
});
