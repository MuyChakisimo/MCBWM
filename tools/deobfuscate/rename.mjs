// Rename obfuscator identifiers (_0x1a2b3c) to descriptive names.
// Safety: every _0x name maps to one new name; two _0x names may share a new name only if the
// source ranges in which they occur/are scoped do not overlap; new names never equal any other
// identifier already used in the file. This makes the rename a pure alpha-conversion.
import { createRequire } from "module";
import fs from "fs";
import path from "path";
const require = createRequire(import.meta.url);
// Prettier (and its Babel parser) are borrowed from the VS Code Prettier extension; override with PRETTIER_DIR.
const extDir = process.env.USERPROFILE + "/.vscode/extensions";
const P = process.env.PRETTIER_DIR ??
  path.join(extDir, fs.readdirSync(extDir).filter((d) => d.startsWith("esbenp.prettier-vscode-")).sort().at(-1), "node_modules/prettier");
const prettier = require(P + "/index.cjs");
const babel = require(P + "/plugins/babel.js");
const parse = (c) => babel.parsers.babel.parse(c, {});
const OBF = /^_0x[0-9a-f]+$/;
const RESERVED = new Set(("Math JSON Object Array String Number Boolean Promise Date console globalThis Symbol Map Set WeakMap Error " +
  "TypeError parseInt parseFloat undefined NaN Infinity eval arguments this new delete in of do if for let var const class " +
  "function return switch case default break continue throw try catch finally while with yield await enum import export super " +
  "null true false void typeof instanceof static get set async").split(" "));

function walk(node, fn, anc = []) {
  if (!node || typeof node.type !== "string") return;
  fn(node, anc);
  anc.push(node);
  for (const k of Object.keys(node)) {
    if (k === "loc" || k.endsWith("Comments") || k === "comments" || k === "extra") continue;
    const v = node[k];
    if (Array.isArray(v)) v.forEach((c) => c && walk(c, fn, anc));
    else if (v && typeof v.type === "string") walk(v, fn, anc);
  }
  anc.pop();
}
const isFn = (n) => /Function|ArrowFunction|ClassMethod|ObjectMethod/.test(n.type);
const camel = (s) => s.replace(/^minecraft:|^krep:|^[a-z]+:/, "").replace(/[^A-Za-z0-9]+(.)/g, (_, c) => c.toUpperCase()).replace(/^[^A-Za-z_$]+/, "").replace(/^./, (c) => c.toLowerCase());
const singular = (s) => (/ies$/.test(s) ? s.slice(0, -3) + "y" : /(ss|x|ch|sh)es$/.test(s) ? s.slice(0, -2) : /s$/.test(s) && s.length > 3 ? s.slice(0, -1) : null);
const PROP_NAMES = { itemStack: "item", hitEntity: "hitEntity", damagingEntity: "attacker", sourceEntity: "sourceEntity",
  hurtEntity: "hurtEntity", deadEntity: "deadEntity", formValues: "formValues", scoreboard: "scoreboard" };
const CALL_NAMES = { getItem: "item", getObjective: "objective", getScore: "score", getPlayers: "players", getAllPlayers: "players",
  getEntities: "entities", getViewDirection: "viewDirection", getHeadLocation: "headLocation", getTags: "tags", split: "parts",
  find: "found", filter: "filtered", getDimension: "dimension", spawnEntity: "spawned", getVelocity: "velocity",
  getBlockFromRay: "rayHit", getEntitiesFromViewDirection: "viewHits", getBlock: "block", getRotation: "rotation",
  getParticipants: "participants", clone: "copy", getLore: "lore", getEntityHit: "hitInfo", getBlockHit: "blockHit",
  getItemStack: "item", map: "mapped", replace: "replaced", toLowerCase: "lower", addObjective: "objective" };

function nameHint(n, anc) {
  // n: Identifier at a binding site. Returns base name or null.
  const parent = anc.at(-1), gp = anc.at(-2);
  if (parent.type === "ImportNamespaceSpecifier" || parent.type === "ImportDefaultSpecifier") {
    const src = gp.source.value;
    return src === "@minecraft/server" ? "mc" : src === "@minecraft/server-ui" ? "ui" : camel(src.split("/").pop());
  }
  if (parent.type === "CatchClause") return "error";
  if (parent.type === "VariableDeclarator" && parent.id === n && parent.init) return hintFromExpr(parent.init, anc.at(-3));
  if (isFn(parent) && parent.params.includes(n)) {
    const idx = parent.params.indexOf(n);
    const call = gp?.type === "CallExpression" && gp.arguments.includes(parent) ? gp : null;
    const m = call?.callee.type === "MemberExpression" && !call.callee.computed ? call.callee.property.name : null;
    if (m === "subscribe") return idx === 0 ? "event" : null;
    if (m === "then") {
      const inner = call.callee.object;
      const im = inner.type === "CallExpression" && inner.callee.type === "MemberExpression" ? inner.callee.property.name : null;
      return im === "show" ? "response" : "result";
    }
    if (["find", "filter", "some", "every", "map", "forEach", "findIndex"].includes(m) && idx === 0) {
      const h = hintFromExpr(call.callee.object);
      const s = h && singular(h);
      return s ?? "entry";
    }
    if ((m === "sort") ) return idx === 0 ? "a" : "b";
    if ((m === "reduce")) return idx === 0 ? "acc" : idx === 1 ? "entry" : null;
    return null;
  }
  if (parent.type === "VariableDeclarator" && gp?.type === "VariableDeclaration") {
    const ff = anc.at(-3);
    if ((ff?.type === "ForOfStatement") && ff.left === gp) {
      const h = hintFromExpr(ff.right);
      if (h === "players") return "player";
      if (h === "entities") return "entity";
      return (h && singular(h)) ?? "entry";
    }
    if (ff?.type === "ForInStatement" && ff.left === gp) return "key";
  }
  if (parent.type === "FunctionDeclaration" && parent.id === n) return null;
  return null;
}
function hintFromExpr(e) {
  if (!e) return null;
  if (e.type === "AwaitExpression") return hintFromExpr(e.argument);
  if (e.type === "LogicalExpression" && e.operator === "??") return hintFromExpr(e.left);
  if (e.type === "Identifier" && !OBF.test(e.name)) return e.name;
  if ((e.type === "MemberExpression" || e.type === "OptionalMemberExpression") && !e.computed && e.property.type === "Identifier")
    return PROP_NAMES[e.property.name] ?? e.property.name;
  if ((e.type === "MemberExpression" || e.type === "OptionalMemberExpression") && e.computed) {
    const h = hintFromExpr(e.object);
    return (h && singular(h)) ?? null;
  }
  if (e.type === "CallExpression" || e.type === "OptionalCallExpression") {
    const c = e.callee;
    const m = (c.type === "MemberExpression" || c.type === "OptionalMemberExpression") && !c.computed ? c.property.name : c.type === "Identifier" && !OBF.test(c.name) ? c.name : null;
    const a0 = e.arguments[0];
    const s0 = a0?.type === "StringLiteral" ? a0.value : null;
    if (m === "getComponent" && s0) return camel(s0);
    if (m === "getEquipment") {
      const slot = s0 ?? (a0?.type === "MemberExpression" && !a0.computed ? a0.property.name : "");
      return slot ? camel(slot) + "Item" : "equipment";
    }
    if ((m === "getDynamicProperty" || m === "getProperty") && s0) return camel(s0);
    if (m && CALL_NAMES[m]) return CALL_NAMES[m];
    if (m && /^get[A-Z]/.test(m)) return m[3].toLowerCase() + m.slice(4);
    if (m && /^(is|has)[A-Z]/.test(m)) return m;
    return null;
  }
  if (e.type === "NewExpression" && e.callee.type === "Identifier") {
    if (/FormData$/.test(e.callee.name)) return "form";
    return camel(e.callee.name);
  }
  if (e.type === "ArrowFunctionExpression" || e.type === "FunctionExpression") return "fn";
  if (e.type === "ObjectExpression") return "data";
  if (e.type === "ArrayExpression") return "list";
  if (e.type === "TemplateLiteral" || e.type === "StringLiteral") return "text";
  if (e.type === "BinaryExpression" && /[<>=!]=?|instanceof|in/.test(e.operator) && !/^[-+*/%]$/.test(e.operator)) return "flag";
  return null;
}

// Pre-pass: remove unreferenced obfuscator storage objects (const _0x = { k: "str", f: function () {...} })
// — building such a literal has no side effects. Also a?.["x"] -> a?.x and "\x20"-style escapes -> plain text.
function tidy(code) {
  for (let round = 0; round < 10; round++) {
    const ast = parse(code);
    const count = new Map();
    walk(ast, (n) => { if (n.type === "Identifier" && OBF.test(n.name)) count.set(n.name, (count.get(n.name) ?? 0) + 1); });
    const pure = (v) => ["StringLiteral", "NumericLiteral", "BooleanLiteral", "FunctionExpression", "ArrowFunctionExpression"].includes(v.type);
    const edits = [];
    walk(ast, (n) => {
      if (n.type !== "VariableDeclaration") return;
      const keep = n.declarations.filter((d) => !(d.id.type === "Identifier" && OBF.test(d.id.name) && count.get(d.id.name) === 1 &&
        d.init?.type === "ObjectExpression" && d.init.properties.every((p) => p.type === "ObjectProperty" && !p.computed && pure(p.value))));
      if (keep.length === n.declarations.length) return;
      edits.push(keep.length ? { start: n.declarations[0].start, end: n.declarations.at(-1).end, text: keep.map((d) => code.slice(d.start, d.end)).join(", ") }
        : { start: n.start, end: n.end, text: ";" });
    });
    walk(ast, (n) => {
      if (n.type === "OptionalMemberExpression" && n.computed && n.property.type === "StringLiteral" && /^[A-Za-z_$][\w$]*$/.test(n.property.value)) {
        const lb = code.lastIndexOf("?.[", n.property.start);
        if (lb > n.object.end - 1 && code.slice(n.property.end, n.end).trim() === "]") edits.push({ start: lb, end: n.end, text: "?." + n.property.value });
      }
      if (n.type === "StringLiteral" && /\\x[0-7][0-9a-f]/i.test(n.extra?.raw ?? "") && !/[\x00-\x09\x0b-\x1f\x7f]/.test(n.value))
        edits.push({ start: n.start, end: n.end, text: JSON.stringify(n.value) });
    });
    if (!edits.length) break;
    edits.sort((a, b) => b.start - a.start);
    let last = Infinity;
    for (const e of edits) { if (e.end > last) continue; code = code.slice(0, e.start) + e.text + code.slice(e.end); last = e.start; }
  }
  return code;
}

function rename(code) {
  code = tidy(code);
  const ast = parse(code);
  const used = new Set();
  const occ = new Map(); // name -> {first,last,hints[],kind,scopes:[]}
  walk(ast, (n, anc) => {
    if (n.type !== "Identifier") return;
    if (!OBF.test(n.name)) {
      // Property names (a.b, { b: 1 }) are not variables and cannot collide with a new variable name.
      const p = anc.at(-1);
      const isProp = ((p.type === "MemberExpression" || p.type === "OptionalMemberExpression") && p.property === n && !p.computed) ||
        ((p.type === "ObjectProperty" || p.type === "ObjectMethod" || p.type === "ClassMethod" || p.type === "ClassProperty") && p.key === n && !p.computed && !p.shorthand);
      if (!isProp) used.add(n.name);
      return;
    }
    const o = occ.get(n.name) ?? { first: n.start, last: n.end, hints: [], kind: "v", scopes: [] };
    o.first = Math.min(o.first, n.start); o.last = Math.max(o.last, n.end);
    const parent = anc.at(-1);
    // binding sites
    let scope = null;
    if (isFn(parent) && parent.params.includes(n)) { o.kind = "p"; scope = parent; }
    else if (parent.type === "FunctionDeclaration" && parent.id === n) { o.kind = "fn"; scope = anc.findLast((a, i) => i < anc.length - 1 && (isFn(a) || a.type === "Program")) ?? parent; }
    else if (parent.type === "VariableDeclarator" && parent.id === n) { scope = anc.findLast((a, i) => i < anc.length - 2 && (isFn(a) || a.type === "Program" || a.type === "BlockStatement" || /^For/.test(a.type))); }
    else if (parent.type === "CatchClause") { scope = parent; o.kind = "e"; }
    else if (/Import/.test(parent.type)) { scope = ast; }
    if (scope) { o.scopes.push([scope.start, scope.end]); const h = nameHint(n, anc); if (h) o.hints.push(h); }
    else if (/Pattern|ArrayPattern|ObjectPattern|AssignmentPattern|RestElement/.test(parent.type) || (parent.type === "ObjectProperty" && anc.at(-2)?.type === "ObjectPattern")) {
      // destructuring binding: scope = nearest block/function
      const s = anc.findLast((a) => isFn(a) || a.type === "Program" || a.type === "BlockStatement" || /^For/.test(a.type));
      if (s) o.scopes.push([s.start, s.end]);
      if (parent.type === "ObjectProperty" && parent.key.type === "Identifier" && parent.value === n && !OBF.test(parent.key.name)) o.hints.push(parent.key.name);
    }
    occ.set(n.name, o);
  });
  // interval per name
  const items = [...occ.entries()].map(([name, o]) => {
    let lo = o.first, hi = o.last;
    for (const [a, b] of o.scopes) { lo = Math.min(lo, a); hi = Math.max(hi, b); }
    const base = sanitize(o.hints[0]) ?? { p: "arg", v: "value", fn: "func", e: "error" }[o.kind];
    return { name, lo, hi, base };
  });
  items.sort((a, b) => a.lo - b.lo);
  const taken = new Map(); // newName -> [[lo,hi]...]
  const map = new Map();
  for (const it of items) {
    for (let i = 1; ; i++) {
      const cand = i === 1 ? it.base : it.base + i;
      if (used.has(cand) || RESERVED.has(cand)) continue;
      const ivs = taken.get(cand) ?? [];
      if (ivs.some(([a, b]) => it.lo < b && a < it.hi)) continue;
      ivs.push([it.lo, it.hi]); taken.set(cand, ivs); map.set(it.name, cand); break;
    }
  }
  // apply
  const edits = [];
  walk(ast, (n, anc) => {
    if (n.type !== "Identifier" || !map.has(n.name)) return;
    const parent = anc.at(-1);
    if ((parent.type === "MemberExpression" || parent.type === "OptionalMemberExpression") && parent.property === n && !parent.computed) return;
    if ((parent.type === "ObjectProperty" || parent.type === "ObjectMethod" || parent.type === "ClassMethod" || parent.type === "ClassProperty") && parent.key === n && !parent.computed) {
      if (parent.shorthand) return; // value node handles it
      return;
    }
    if (parent.type === "ObjectProperty" && parent.shorthand && parent.value === n) {
      edits.push({ start: n.start, end: n.end, text: `${n.name}: ${map.get(n.name)}` }); return;
    }
    if (parent.type === "ExportSpecifier") throw new Error("export specifier of obfuscated name");
    edits.push({ start: n.start, end: n.end, text: map.get(n.name) });
  });
  // shorthand with AssignmentPattern ({ a = 1 }) - value is AssignmentPattern whose left is n; handled as normal ident but key lost:
  walk(ast, (n) => {
    if (n.type === "ObjectProperty" && n.shorthand && n.value.type === "AssignmentPattern" && map.has(n.key.name))
      throw new Error("shorthand default pattern not supported");
  });
  edits.sort((a, b) => b.start - a.start);
  // dedupe identical ranges (shorthand key/value share position)
  let out = code, last = Infinity;
  for (const e of edits) { if (e.start >= last) continue; out = out.slice(0, e.start) + e.text + out.slice(e.end); last = e.start; }
  return { code: out, count: map.size };
}
function sanitize(h) {
  if (!h) return null;
  let s = camel(String(h));
  if (!/^[A-Za-z_$][\w$]*$/.test(s) || s.length > 30) return null;
  return s;
}

const [, , src, dst] = process.argv;
for (const rel of fs.readdirSync(src, { recursive: true }).filter((f) => f.endsWith(".js"))) {
  const code = fs.readFileSync(path.join(src, rel), "utf8");
  const r = rename(code);
  const formatted = await prettier.format(r.code, { parser: "babel", printWidth: 100 });
  const out = path.join(dst, rel);
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, formatted);
  console.log(rel, "renamed", r.count, "left _0x:", (formatted.match(/_0x[0-9a-f]+/g) || []).length);
}
