// Deterministic tracing stub for @minecraft/server(-ui). Records every API call (path + args)
// and captures every callback so the harness can fire it. Used to diff original vs deobfuscated.
export const trace = [];
export const probe = { str: "", num: 1, bool: true };
const STRPROPS = new Set(["typeId","id","nameTag","message","name","sourceType","cause","damagingProjectile_typeId","selection_s","displayName"]);
const NUMPROPS = new Set(["selection","amount","damage","currentTick","maxDurability","amount"]);
const NUMCALLS = new Set(["getScore","getProperty","getDynamicProperty","getAmount","getTicks"]);
export const callbacks = [];
const PATH = Symbol("path");
const ser = (v, d = 0) => {
  if (v === null || v === undefined) return String(v);
  if (typeof v === "function") return v[PATH] ?? "fn";
  if (typeof v !== "object") return JSON.stringify(v);
  if (d > 3) return "…";
  if (Array.isArray(v)) return "[" + v.map((x) => ser(x, d + 1)).join(",") + "]";
  return "{" + Object.keys(v).sort().map((k) => k + ":" + ser(v[k], d + 1)).join(",") + "}";
};
function make(p) {
  const fn = function () {};
  fn[PATH] = p;
  return new Proxy(fn, {
    get(t, prop) {
      if (prop === PATH) return p;
      if (prop === Symbol.toPrimitive) return (hint) => (hint === "number" ? 1 : p);
      if (prop === "then") return undefined;
      if (prop === Symbol.iterator) return function* () { yield make(p + "[0]"); };
      if (typeof prop === "symbol") return undefined;
      if (prop === "length") return 1;
      if (STRPROPS.has(prop)) return probe.str;
      if (NUMPROPS.has(prop)) return probe.num;
      return make(`${p}.${prop}`);
    },
    set(t, prop, v) { trace.push(`SET ${p}.${String(prop)} = ${ser(v)}`); return true; },
    apply(t, _this, args) {
      const leaf = p.split(".").pop();
      trace.push(`CALL ${p}(${args.map((a) => ser(a)).join(", ")})`);
      args.forEach((a, i) => { if (typeof a === "function" && !a[PATH]) callbacks.push({ label: `${p}#arg${i}`, fn: a }); });
      if (NUMCALLS.has(leaf)) return probe.num;
      if (leaf === "hasTag") return probe.bool;
      if (leaf === "runCommandAsync") return Promise.resolve(make(`${p}()`));
      if (leaf === "show") return Promise.resolve(make(`${p}()`));
      return make(`${p}()`);
    },
    construct(t, args) { trace.push(`NEW ${p}(${args.map((a) => ser(a)).join(", ")})`); return make(`new ${p}`); },
  });
}
const root = make("mc");
export const world = root.world, system = root.system;
const enumProxy = (n) => new Proxy({}, { get: (_, k) => (typeof k === "symbol" ? undefined : `${n}.${String(k)}`) });
export const EquipmentSlot = enumProxy("EquipmentSlot"), EntityComponentTypes = enumProxy("ECT"),
  ItemComponentTypes = enumProxy("ICT"), GameMode = enumProxy("GameMode"), Direction = enumProxy("Direction"),
  EntityDamageCause = enumProxy("EntityDamageCause"), ItemLockMode = enumProxy("ItemLockMode"),
  DisplaySlotId = enumProxy("DisplaySlotId"), ObjectiveSortOrder = enumProxy("ObjectiveSortOrder");
class Traced { constructor(...a) { trace.push(`NEW ${this.constructor.name}(${a.map((x) => ser(x)).join(",")})`); return make(`new ${this.constructor.name}`); } }
export class ItemStack extends Traced {} export class ActionFormData extends Traced {} export class ModalFormData extends Traced {}
export class MessageFormData extends Traced {} export class MolangVariableMap extends Traced {} export class Player {} export class Entity {}
export const BlockPermutation = root.BlockPermutation;
export default root;
