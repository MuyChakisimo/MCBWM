// =====================================================
// TACZ CENTRAL LOGGER
//
// One place for all script logging.
//
//   const log = createLogger("Reload");
//   log.debug("start", player.name, weapon.id);   // only when debug is on
//   log.warn("...");                              // always
//   log.error("...", error);                      // always, de-duplicated
//
// Debug output is OFF by default and costs one boolean check when off.
// Toggle at runtime with:  /scriptevent tacz:debug on|off
// (see debug/diagnostics.js).
//
// Rules for callers:
// - log state TRANSITIONS (weapon change, reload start/end, fire start/stop,
//   attachment change, init, errors) - never per-tick or per-particle work.
// - never swallow an exception silently; use log.error instead of catch {}.
// =====================================================

const ERROR_REPEAT_MS = 5000;

let debugEnabled = false;
const lastErrorAt = new Map();

export function isDebugEnabled() {
  return debugEnabled;
}

export function setDebugEnabled(enabled) {
  debugEnabled = Boolean(enabled);
}

function format(scope, parts) {
  return `[TACZ][${scope}] ${parts
    .map((p) => (p instanceof Error ? `${p.message}${p.stack ? `\n${p.stack}` : ""}` : typeof p === "object" ? safeJson(p) : String(p)))
    .join(" ")}`;
}

function safeJson(value) {
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

export function createLogger(scope) {
  return Object.freeze({
    debug(...parts) {
      if (!debugEnabled) return;
      console.warn(format(scope, parts));
    },
    warn(...parts) {
      console.warn(format(scope, parts));
    },
    // Errors are always reported, but an identical message is printed at
    // most once per ERROR_REPEAT_MS so a broken weapon cannot flood the log
    // on every shot.
    error(...parts) {
      const text = format(scope, parts);
      const key = text.slice(0, 200);
      const now = Date.now();
      if (now - (lastErrorAt.get(key) ?? 0) < ERROR_REPEAT_MS) return;
      lastErrorAt.set(key, now);
      console.error(text);
    },
  });
}
