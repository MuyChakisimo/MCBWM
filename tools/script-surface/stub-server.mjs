// Recording stub of @minecraft/server / @minecraft/server-ui used by
// tools/script-surface/run.mjs. Every property access returns a callable
// proxy; subscribe/runInterval/runTimeout/runCommand calls are recorded
// together with the calling module so the script surface can be audited
// without running Minecraft.
export const records = [];
export const probe = { players: 1, counting: false, calls: {} };
function caller() {
  const line = new Error().stack.split("\n").find((l) => l.includes("/TACZ-B/scripts/"));
  return line ? line.replace(/.*\/TACZ-B\/scripts\//, "").replace(/:\d+\)?$/, "").replace(/:\d+$/, "") : "?";
}
function make(pathName) {
  const fn = function () {};
  return new Proxy(fn, {
    get(_, prop) {
      if (prop === Symbol.toPrimitive) return () => 0;
      if (prop === "then") return undefined;
      if (prop === Symbol.iterator) return function* () {};
      return make(`${pathName}.${String(prop)}`);
    },
    apply(_, __, args) {
      const leaf = pathName.split(".").pop();
      if (probe.counting) probe.calls[leaf] = (probe.calls[leaf] ?? 0) + 1;
      if (probe.counting && /^(runCommand|runCommandAsync|hasTag|removeTag|addTag)$/.test(leaf)) (probe.args ??= new Set()).add(`${leaf}(${args.map(String).join(", ").slice(0, 80)})`);
      if (leaf === "getPlayers" || leaf === "getAllPlayers") {
        if (probe.counting) return Array.from({ length: probe.players }, (_, i) => make(`player${i}`));
        return [];
      }
      if (["subscribe", "runInterval", "runTimeout", "runJob", "run", "runCommand", "runCommandAsync", "getPlayers", "getAllPlayers", "getEntities"].includes(leaf))
        records.push({ api: pathName.replace(/^root\./, ""), module: caller(), interval: leaf === "runInterval" ? args[1] ?? 1 : undefined, cb: leaf === "runInterval" ? args[0] : undefined });
      return make(`${pathName}()`);
    },
    construct() {
      return make(`${pathName}#new`);
    },
  });
}
const root = make("root");
export const world = root.world, system = root.system;
export const Player = class {};
export const ItemStack = class { constructor() { return make("ItemStack#new"); } };
export const EquipmentSlot = new Proxy({}, { get: (_, p) => String(p) });
export const EntityComponentTypes = new Proxy({}, { get: (_, p) => String(p) });
export const ItemComponentTypes = EntityComponentTypes, GameMode = EquipmentSlot, Direction = EquipmentSlot;
export const ActionFormData = class { constructor() { return make("ActionFormData#new"); } };
export const ModalFormData = ActionFormData, MessageFormData = ActionFormData;
export const BlockPermutation = root.BlockPermutation, MolangVariableMap = class { setFloat() {} setVector3() {} setColorRGB() {} setColorRGBA() {} setSpeedAndDirection() {} };
export default root;
