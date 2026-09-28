// Mechanical deobfuscator for obfuscator.io-style string-array code.
// Every replacement is the exact value the original decoder returns, so behavior is unchanged.
import { createRequire } from "module";
import fs from "fs";
import path from "path";
import vm from "vm";
const require = createRequire(import.meta.url);
// Prettier (and its Babel parser) are borrowed from the VS Code Prettier extension; override with PRETTIER_DIR.
const extDir = process.env.USERPROFILE + "/.vscode/extensions";
const P = process.env.PRETTIER_DIR ??
  path.join(extDir, fs.readdirSync(extDir).filter((d) => d.startsWith("esbenp.prettier-vscode-")).sort().at(-1), "node_modules/prettier");
const prettier = require(P + "/index.cjs");
const babel = require(P + "/plugins/babel.js");

const parse = (code) => babel.parsers.babel.parse(code, {});
function walk(node, fn, parent = null, key = null) {
  if (!node || typeof node.type !== "string") return;
  if (fn(node, parent, key) === false) return;
  for (const k of Object.keys(node)) {
    if (k === "loc" || k === "comments" || k === "leadingComments" || k === "trailingComments") continue;
    const v = node[k];
    if (Array.isArray(v)) v.forEach((c) => walk(c, fn, node, k));
    else if (v && typeof v.type === "string") walk(v, fn, node, k);
  }
}
function splice(code, edits) {
  edits.sort((a, b) => b.start - a.start);
  let last = Infinity;
  for (const e of edits) {
    if (e.end > last) throw new Error("overlapping edit at " + e.start);
    code = code.slice(0, e.start) + e.text + code.slice(e.end);
    last = e.start;
  }
  return code;
}
const isIdent = (s) => /^[A-Za-z_$][\w$]*$/.test(s) && !["default", "class", "new", "delete", "in"].includes(s);

function deobfuscate(code, report) {
  let ast = parse(code);
  const body = ast.program.body;

  // 1. Locate string-array fn, decoder fn and rotation IIFE.
  let arrayFn, decoderFn, rotation;
  for (const st of body) {
    if (st.type === "FunctionDeclaration" && st.params.length === 0 && /_0x/.test(st.id.name)) {
      const src = code.slice(st.start, st.end);
      if (new RegExp(`\\b${st.id.name}\\s*=\\s*function`).test(src)) arrayFn = st;
    }
  }
  if (!arrayFn) return { code, decoded: 0 };
  for (const st of body) {
    if (st.type === "FunctionDeclaration" && st.params.length === 2 && code.slice(st.start, st.end).includes(arrayFn.id.name + "()"))
      decoderFn = st;
    if (st.type === "ExpressionStatement" && st.expression.type === "CallExpression" &&
        st.expression.arguments[0]?.type === "Identifier" && st.expression.arguments[0].name === arrayFn.id.name)
      rotation = st;
  }
  if (!decoderFn || !rotation) throw new Error("decoder/rotation not found");

  const ctx = vm.createContext({ parseInt, String, decodeURIComponent });
  vm.runInContext(
    [arrayFn, decoderFn].map((n) => code.slice(n.start, n.end)).join("\n") +
      "\n" + code.slice(rotation.start, rotation.end) + `\nglobalThis.__dec = ${decoderFn.id.name};`,
    ctx,
    { timeout: 10000 },
  );
  const dec = ctx.__dec;

  // 2. Alias set: const x = decoder / x = alias.
  const aliases = new Set([decoderFn.id.name]);
  const aliasDecls = [];
  let grew = true;
  while (grew) {
    grew = false;
    walk(ast, (n) => {
      if (n.type === "VariableDeclarator" && n.id.type === "Identifier" && n.init?.type === "Identifier" &&
          aliases.has(n.init.name) && !aliases.has(n.id.name)) {
        aliases.add(n.id.name); grew = true;
      }
    });
  }
  // Safety: alias names must never be assigned anything else.
  walk(ast, (n) => {
    if (n.type === "VariableDeclarator" && n.id.type === "Identifier" && aliases.has(n.id.name) &&
        n.id.name !== decoderFn.id.name && !(n.init?.type === "Identifier" && aliases.has(n.init.name)))
      throw new Error("alias name reused: " + n.id.name);
    if (n.type === "AssignmentExpression" && n.left.type === "Identifier" && aliases.has(n.left.name) && n.left.name !== decoderFn.id.name)
      throw new Error("alias reassigned: " + n.left.name);
  });

  // 3. Replace decoder calls with literals.
  const edits = [];
  let decoded = 0;
  const preamble = new Set([arrayFn, decoderFn, rotation]);
  walk(ast, (n) => {
    if (preamble.has(n)) return false;
    if (n.type === "CallExpression" && n.callee.type === "Identifier" && aliases.has(n.callee.name)) {
      const args = n.arguments.map((a) => {
        if (a.type === "NumericLiteral") return a.value;
        if (a.type === "StringLiteral") return a.value;
        throw new Error("non-literal decoder arg at " + a.start);
      });
      edits.push({ start: n.start, end: n.end, text: JSON.stringify(dec(...args)) });
      decoded++;
      return false;
    }
  });
  // Drop preamble.
  for (const n of [arrayFn, decoderFn, rotation]) edits.push({ start: n.start, end: n.end, text: "" });
  code = splice(code, edits);
  // Top-level `const alias = decoder;` statements and alias declarators are removed in cleanup pass.
  for (let prev = null; prev !== code; ) { prev = code; code = removeAliasDecls(code, aliases); }
  const leftover = [...aliases].filter((a) => new RegExp(`\\b${a.replace(/\$/g, "\\$")}\\b`).test(code));
  if (leftover.length) throw new Error("alias still referenced: " + leftover.join(","));
  report.decoded = decoded;
  return { code, decoded };
}

function removeAliasDecls(code, aliases) {
  const ast = parse(code);
  const edits = [];
  walk(ast, (n) => {
    if (n.type !== "VariableDeclaration") return;
    const keep = n.declarations.filter((d) => !(d.id.type === "Identifier" && aliases.has(d.id.name)));
    if (keep.length === n.declarations.length) return;
    if (keep.length === 0) {
      edits.push({ start: n.start, end: n.end, text: n.kind === "const" || n.kind === "let" || n.kind === "var" ? ";" : "" });
    } else {
      edits.push({ start: n.declarations[0].start, end: n.declarations.at(-1).end,
        text: keep.map((d) => code.slice(d.start, d.end)).join(", ") });
    }
    return false;
  });
  return splice(code, edits);
}

// Inline obfuscator "storage objects": const o = { abc: "str", def: function (a, b) { return a + b; } }
// Only when the object is const, only literal/simple-wrapper props, and only read via o["key"].
function inlineStorageObjects(code, report) {
  let changed = true, total = 0, guard = 0;
  while (changed && guard++ < 10) {
    changed = false;
    const ast = parse(code);
    const objs = new Map(); // name -> {decl, props}
    walk(ast, (n, parent) => {
      if (n.type === "VariableDeclarator" && n.id.type === "Identifier" && n.init?.type === "ObjectExpression" &&
          parent.kind === "const" && /^_0x/.test(n.id.name) && n.init.properties.length) {
        const props = {};
        for (const p of n.init.properties) {
          if (p.type !== "ObjectProperty" || p.computed) return;
          const k = p.key.type === "Identifier" ? p.key.name : p.key.type === "StringLiteral" ? p.key.value : null;
          if (k == null) return;
          const v = p.value;
          if (v.type === "StringLiteral") props[k] = { kind: "str", src: JSON.stringify(v.value) };
          else if ((v.type === "FunctionExpression" || v.type === "ArrowFunctionExpression") &&
                   v.params.every((q) => q.type === "Identifier")) {
            const b = v.body.type === "BlockStatement" ? (v.body.body.length === 1 && v.body.body[0].type === "ReturnStatement" ? v.body.body[0].argument : null) : v.body;
            if (!b) return;
            const ps = v.params.map((q) => q.name);
            if ((b.type === "BinaryExpression" || b.type === "LogicalExpression") && b.left.type === "Identifier" && b.right.type === "Identifier" &&
                b.left.name === ps[0] && b.right.name === ps[1] && ps.length === 2)
              props[k] = { kind: "bin", op: b.operator };
            else if (b.type === "CallExpression" && b.callee.type === "Identifier" && b.callee.name === ps[0] &&
                     b.arguments.length === ps.length - 1 && b.arguments.every((a, i) => a.type === "Identifier" && a.name === ps[i + 1]))
              props[k] = { kind: "call" };
            else return;
          } else return;
        }
        objs.set(n.id.name, { decl: n, props, uses: [], bad: false });
      }
    });
    if (!objs.size) break;
    // Collect uses.
    walk(ast, (n, parent, key) => {
      if (n.type === "Identifier" && objs.has(n.name)) {
        const o = objs.get(n.name);
        if (parent.type === "VariableDeclarator" && key === "id") return;
        if (parent.type === "MemberExpression" && key === "object") {
          const k = parent.computed ? (parent.property.type === "StringLiteral" ? parent.property.value : null) : parent.property.name;
          if (k == null || !o.props[k]) { o.bad = true; return; }
          o.uses.push({ member: parent, k });
          return;
        }
        o.bad = true;
      }
    });
    // Need parent of member to detect call / assignment; do a second walk.
    const parentOf = new Map();
    walk(ast, (n, parent, key) => { parentOf.set(n, { parent, key }); });
    const edits = [];
    const consumed = new Set();
    for (const [name, o] of objs) {
      if (o.bad) continue;
      const myEdits = [];
      let ok = true;
      for (const u of o.uses) {
        const pr = o.props[u.k];
        const up = parentOf.get(u.member);
        if (up.parent.type === "AssignmentExpression" && up.key === "left") { ok = false; break; }
        if (up.parent.type === "UpdateExpression") { ok = false; break; }
        if (pr.kind === "str") myEdits.push({ start: u.member.start, end: u.member.end, text: pr.src });
        else {
          if (!(up.parent.type === "CallExpression" && up.key === "callee")) { ok = false; break; }
          const call = up.parent;
          if (call.arguments.some((a) => a.type === "SpreadElement")) { ok = false; break; }
          const as = call.arguments.map((a) => code.slice(a.start, a.end));
          if (pr.kind === "bin") { if (as.length !== 2) { ok = false; break; }
            myEdits.push({ start: call.start, end: call.end, text: `((${as[0]}) ${pr.op} (${as[1]}))` }); }
          else { if (as.length < 1 || call.arguments[0].type !== "Identifier") { ok = false; break; }
            myEdits.push({ start: call.start, end: call.end, text: `(${as[0]})(${as.slice(1).join(", ")})` }); }
        }
      }
      if (!ok) continue;
      // Nested edits (a call argument containing another replaced call) would overlap: only apply outermost-free sets.
      edits.push(...myEdits.map((e) => ({ ...e, obj: name })));
      consumed.add(name);
    }
    // Resolve overlaps: drop any edit that contains another edit (inner first; outer next iteration).
    edits.sort((a, b) => a.start - b.start || b.end - a.end);
    const final = [];
    const blocked = new Set();
    for (const e of edits) {
      const containsOther = edits.some((f) => f !== e && f.start >= e.start && f.end <= e.end);
      if (containsOther) { blocked.add(e.obj); continue; }
      final.push(e);
    }
    const doneObjs = [...consumed].filter((n) => !blocked.has(n));
    // Remove fully-consumed declarators.
    const declEdits = [];
    walk(ast, (n) => {
      if (n.type !== "VariableDeclaration") return;
      const keep = n.declarations.filter((d) => !(d.id.type === "Identifier" && doneObjs.includes(d.id.name)));
      if (keep.length === n.declarations.length) return;
      declEdits.push(keep.length === 0 ? { start: n.start, end: n.end, text: ";" } :
        { start: n.declarations[0].start, end: n.declarations.at(-1).end, text: keep.map((d) => code.slice(d.start, d.end)).join(", ") });
    });
    // Declarator edits may contain use-edits (object literal props never contain uses, but other declarators in the
    // same declaration can). Apply use edits first, then reparse for declarator removal.
    if (final.length) { code = splice(code, final); total += final.length; changed = true; }
    if (!blocked.size && doneObjs.length) {
      for (let prev = null; prev !== code; ) { prev = code; code = removeAliasDecls(code, new Set(doneObjs)); }
    }
  }
  report.inlined = total;
  return code;
}

// Cosmetic: obj["name"] -> obj.name, 0x1f -> 31, !![] -> true, ![] -> false.
function cosmetics(code) {
  const ast = parse(code);
  const edits = [];
  walk(ast, (n) => {
    if (n.type === "MemberExpression" && n.computed && n.property.type === "StringLiteral" && isIdent(n.property.value)) {
      // Replace `[ "x" ]` segment: from end of object to end of member.
      // Replace from the opening bracket (object may be parenthesized, so object.end is not the bracket).
      let lb = code.lastIndexOf("[", n.property.start);
      if (n.optional && code.slice(lb - 2, lb) === "?.") lb -= 2;
      if (code.slice(n.property.end, n.end).trim() !== "]") return;
      edits.push({ start: lb, end: n.end, text: (n.optional ? "?." : ".") + n.property.value });
    } else if (n.type === "NumericLiteral" && /^0x/i.test(n.extra?.raw ?? "")) {
      edits.push({ start: n.start, end: n.end, text: String(n.value) });
    } else if (n.type === "UnaryExpression" && n.operator === "!" && n.argument.type === "UnaryExpression" &&
               n.argument.operator === "!" && n.argument.argument.type === "ArrayExpression" && !n.argument.argument.elements.length) {
      edits.push({ start: n.start, end: n.end, text: "true" }); return false;
    } else if (n.type === "UnaryExpression" && n.operator === "!" && n.argument.type === "ArrayExpression" && !n.argument.elements.length) {
      edits.push({ start: n.start, end: n.end, text: "false" }); return false;
    } else if ((n.type === "ObjectProperty" || n.type === "ClassMethod" || n.type === "ObjectMethod") && n.computed &&
               n.key.type === "StringLiteral" && isIdent(n.key.value)) {
      // [ "name" ]() {}  ->  name() {}   (find bracket range)
      const lb = code.lastIndexOf("[", n.key.start), rb = code.indexOf("]", n.key.end);
      edits.push({ start: lb, end: rb + 1, text: n.key.value });
    }
  });
  // Member edits span object.end..member.end which contains the property literal only; hex edits inside computed
  // props won't overlap string props. Filter any overlaps defensively (keep the smaller one; rerun later).
  edits.sort((a, b) => a.start - b.start);
  const out = [];
  let lastEnd = -1;
  for (const e of edits) { if (e.start < lastEnd) continue; out.push(e); lastEnd = e.end; }
  return { code: splice(code, out), n: out.length, skipped: edits.length - out.length };
}

// Constant-fold obfuscator opaque predicates: "abc" === "xyz", then prune the dead branch.
const isLit = (n) => n.type === "StringLiteral" || n.type === "NumericLiteral";
const boolOf = (n) => (n.type === "BooleanLiteral" ? n.value : null);
const hasLexical = (block) =>
  block.body.some((s) => (s.type === "VariableDeclaration" && s.kind !== "var") || s.type === "ClassDeclaration" || s.type === "FunctionDeclaration");
function fold(code) {
  const ast = parse(code);
  const edits = [];
  walk(ast, (n, parent, key) => {
    if (n.type === "BinaryExpression" && ["===", "!==", "==", "!="].includes(n.operator) && isLit(n.left) && isLit(n.right)) {
      const eq = n.left.value === n.right.value;
      edits.push({ start: n.start, end: n.end, text: String(n.operator.startsWith("!") ? !eq : eq) });
      return false;
    }
    if (n.type === "IfStatement" && boolOf(n.test) !== null) {
      const branch = n.test.value ? n.consequent : n.alternate;
      let text = branch ? code.slice(branch.start, branch.end) : ";";
      const inList = Array.isArray(parent?.[key]);
      if (branch?.type === "BlockStatement" && inList && !hasLexical(branch))
        text = branch.body.map((s) => code.slice(s.start, s.end)).join("\n");
      else if (branch && branch.type !== "BlockStatement" && !inList) text = `{ ${text} }`;
      edits.push({ start: n.start, end: n.end, text });
      return false;
    }
    if (n.type === "ConditionalExpression" && boolOf(n.test) !== null) {
      const b = n.test.value ? n.consequent : n.alternate;
      edits.push({ start: n.start, end: n.end, text: `(${code.slice(b.start, b.end)})` });
      return false;
    }
    if (n.type === "LogicalExpression" && boolOf(n.left) !== null && (n.operator === "&&" || n.operator === "||")) {
      const v = n.left.value, pass = n.operator === "&&" ? v : !v;
      edits.push({ start: n.start, end: n.end, text: pass ? `(${code.slice(n.right.start, n.right.end)})` : String(v) });
      return false;
    }
    if (n.type === "ExpressionStatement" && n.expression.type === "BooleanLiteral" && Array.isArray(parent?.[key])) {
      edits.push({ start: n.start, end: n.end, text: "" });
      return false;
    }
  });
  return { code: edits.length ? splice(code, edits) : code, n: edits.length };
}

const [, , src, dst] = process.argv;
const files = fs.readdirSync(src, { recursive: true }).filter((f) => f.endsWith(".js"));
for (const rel of files) {
  const report = { file: rel };
  let code = fs.readFileSync(path.join(src, rel), "utf8");
  try {
    code = deobfuscate(code, report).code;
    code = inlineStorageObjects(code, report);
    for (let i = 0; i < 5; i++) { const r = cosmetics(code); code = r.code; if (!r.skipped) break; }
    report.folded = 0;
    for (let i = 0; i < 20; i++) { const r = fold(code); code = r.code; report.folded += r.n; if (!r.n) break; }
    // Folding can expose more storage-object uses / decoded strings in new positions.
    code = inlineStorageObjects(code, {});
    for (let i = 0; i < 5; i++) { const r = cosmetics(code); code = r.code; if (!r.skipped) break; }
    code = await prettier.format(code, { parser: "babel", printWidth: 100 });
  } catch (e) {
    report.error = e.message.split("\n")[0];
  }
  const out = path.join(dst, rel);
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, code);
  report.remaining0x = (code.match(/_0x[0-9a-f]+\(/g) || []).length;
  console.log(JSON.stringify(report));
}
