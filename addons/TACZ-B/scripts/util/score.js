// Safe scoreboard read. objective.getScore(player) THROWS ("Failed to resolve identity") for a player who has
// never had any score in this world (a brand-new player on a fresh server). Returns undefined instead, the
// same as "no score on this objective yet". setScore(player, ...) creates the identity, so writes are fine.
// (Added 2026-11-08: on a fresh BDS world no gun could fire, reload or inspect until this.)
export function scoreOf(objective, entity) {
  if (!objective) return undefined;
  const identity = entity?.scoreboardIdentity;
  if (!identity) return undefined;
  try {
    return objective.getScore(identity);
  } catch {
    return undefined;
  }
}
