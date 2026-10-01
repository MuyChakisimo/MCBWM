// Add or remove a gun across both packs.
//
//   node tools/weapons/gun.mjs clone <from> <to> [--name "Display Name"] [--dry-run]
//   node tools/weapons/gun.mjs remove <id> [--dry-run]
//
// clone copies every file of <from> (items, controllers, animations, functions, model, textures,
// sounds, first-person arms model) under the new id, and adds <to> everywhere <from> appears in
// the shared files: player.json, player.entity.json, shared controllers, sound definitions,
// lang files, item catalog/textures, and config/weapons.js (+ attachments.js / recoil.js).
// The new gun is an exact copy to start from; then replace its model, textures, sounds and
// stats. remove is the reverse. Run from the repo root, then run tools/weapons/check.mjs.
//
// How it finds a gun's mentions: a word (a run of letters and digits) belongs to gun <id> when
// it starts with <id> (the longest matching gun id, so "m16a1..." is not "m16"), and the rest is
// empty or a suffix other guns use too ("reload", "quantity", "scope" ...). So "false" is not the
// FAL's, and "rpgrocket" (an ammo item) stays shared with the clone. In shared files:
//   - an object entry whose key is the gun's, or an array item mentioning only that gun, is the
//     gun's own: clone copies it right after (renamed), remove deletes it;
//   - a condition listing several guns ("v.a || v.b", "!v.a && !v.b") gets a term added/removed;
//   - a list of per-gun transitions that skips its own gun (shared_draw.json) gets one for the
//     other gun, so the source and the clone switch to each other with a draw animation.
// Anything else that mentions the gun stops the tool with an error instead of guessing.
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { pathToFileURL } from "node:url";
const require = createRequire(import.meta.url);
const { parse } = require("./lenient.cjs");
const { format } = require("./format.cjs");
const { generateLore, LORE_FILE, LANG_FILE } = require("./lore.cjs");

const ROOT = process.cwd();
const PACKS = ["TACZ-B", "TACZ-R"];
const MAX_PROPERTIES = 32;
const TEXT = /\.(json|js|mcfunction|lang)$/;
const CONFIG_DIR = "TACZ-B/scripts/config";
const CONFIG_FILES = ["weapons.js", "attachments.js", "recoil.js"].map((f) => `${CONFIG_DIR}/${f}`);

// ---------------------------------------------------------------- files
const walk = (dir) =>
  fs.existsSync(dir)
    ? fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
        const p = `${dir}/${e.name}`;
        return e.isDirectory() ? walk(p) : [p];
      })
    : [];
const abs = (f) => path.join(ROOT, f);
const allFiles = () => PACKS.flatMap((p) => walk(`${ROOT}/${p}`.replace(/\\/g, "/"))).map((f) => path.relative(ROOT, f).split(path.sep).join("/"));

class Tree {
  // In-memory view of the packs; changes are written only at the end.
  constructor() {
    this.files = new Set(allFiles());
    this.text = new Map();
    this.writes = new Map(); // file -> string content, or {copyFrom}
    this.deletes = new Set();
    this.crlf = new Set(); // files that use Windows line endings; kept that way
  }
  read(f) {
    if (this.writes.has(f)) {
      const w = this.writes.get(f);
      return typeof w === "string" ? w : fs.readFileSync(abs(w.copyFrom), "utf8");
    }
    if (!this.text.has(f)) {
      const raw = fs.readFileSync(abs(f), "utf8");
      if (raw.includes("\r\n")) this.crlf.add(f);
      this.text.set(f, raw.replace(/\r\n/g, "\n"));
    }
    return this.text.get(f);
  }
  exists(f) {
    return (this.files.has(f) || this.writes.has(f)) && !this.deletes.has(f);
  }
  write(f, content) {
    this.deletes.delete(f);
    if (this.files.has(f) && !this.writes.has(f) && this.read(f) === content) return;
    this.writes.set(f, content);
  }
  copy(from, to) {
    this.deletes.delete(to);
    this.writes.set(to, { copyFrom: from });
  }
  remove(f) {
    this.writes.delete(f);
    if (this.files.has(f)) this.deletes.add(f);
  }
  list() {
    return [...new Set([...this.files, ...this.writes.keys()])].filter((f) => !this.deletes.has(f)).sort();
  }
  commit(dryRun) {
    const changes = [
      ...[...this.writes.keys()].map((f) => (this.files.has(f) ? "M " : "A ") + f),
      ...[...this.deletes].map((f) => "D " + f),
    ].sort((a, b) => a.slice(2).localeCompare(b.slice(2)));
    if (dryRun) return changes;
    for (const [f, w] of this.writes) {
      fs.mkdirSync(path.dirname(abs(f)), { recursive: true });
      if (typeof w === "string") fs.writeFileSync(abs(f), this.crlf.has(f) ? w.replace(/\n/g, "\r\n") : w);
      else fs.copyFileSync(abs(w.copyFrom), abs(f));
    }
    for (const f of this.deletes) fs.rmSync(abs(f));
    for (const p of PACKS) pruneEmptyDirs(abs(p));
    return changes;
  }
}
function pruneEmptyDirs(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) if (e.isDirectory()) pruneEmptyDirs(path.join(dir, e.name));
  if (!fs.readdirSync(dir).length) fs.rmdirSync(dir);
}

// A gun's own files, by path.
function ownFilePatterns(id, armsModel) {
  const pats = [
    `TACZ-B/items/guns/${id}/`,
    `TACZ-[BR]/animation_controllers/gun_${id}\\.json$`,
    `TACZ-[BR]/animations/guns/${id}\\.json$`,
    `TACZ-B/functions/${id}((quantity|reload)\\d*)?\\.mcfunction$`,
    `TACZ-R/attachables/gun_${id}(_emp)?\\.json$`,
    `TACZ-R/models/entity/guns/${id}\\.geo\\.json$`,
    `TACZ-R/render_controllers/gun_${id}\\.json$`,
    `TACZ-R/textures/gun/${id}\\.png$`,
    `TACZ-R/textures/items/${id}(_emp)?\\.png$`,
    `TACZ-R/textures/ui/new/${id}/`,
    `TACZ-R/sounds/${id}/`,
  ];
  if (armsModel) pats.push(`TACZ-R/models/entity/shared/taczuniversal${armsModel}\\.geo\\.json$`);
  return pats.map((p) => new RegExp("^" + p));
}
const isOwn = (f, pats) => pats.some((p) => p.test(f));

// ---------------------------------------------------------------- gun words
class Words {
  constructor(tree, ids, armsModels) {
    this.ids = [...ids].sort((a, b) => b.length - a.length); // longest first
    this.aliases = new Map(); // word -> gun (per-gun arms models)
    for (const [id, n] of Object.entries(armsModels)) {
      this.aliases.set(`taczuniversal${n}`, id);
      this.aliases.set(`universal${n}`, id);
    }
    // Suffixes used by at least two guns ("reload", "quantity", "scope" ...).
    const suffixGuns = new Map();
    for (const f of tree.list().filter((f) => TEXT.test(f))) {
      for (const w of new Set(tree.read(f).match(/[A-Za-z0-9]+/g) ?? [])) {
        const g = this.split(w);
        if (!g) continue;
        if (!suffixGuns.has(g.suffix)) suffixGuns.set(g.suffix, new Set());
        suffixGuns.get(g.suffix).add(g.id);
      }
    }
    this.sharedSuffixes = new Set([...suffixGuns].filter(([, g]) => g.size >= 2).map(([s]) => s));
  }
  split(word) {
    for (const id of this.ids) if (word.startsWith(id)) return { id, suffix: word.slice(id.length) };
    return null;
  }
  // The gun a word belongs to, or undefined.
  gunOf(word) {
    if (this.aliases.has(word)) return this.aliases.get(word);
    const g = this.split(word);
    if (!g) return undefined;
    if (g.suffix === "" || this.sharedSuffixes.has(g.suffix)) return g.id;
    return undefined;
  }
  gunsIn(text) {
    const guns = new Set();
    for (const w of text.match(/[A-Za-z0-9]+/g) ?? []) {
      const g = this.gunOf(w);
      if (g) guns.add(g);
    }
    return guns;
  }
  // Rename every word of gun `from` to gun `to` (aliases: from's arms model -> to's).
  renamer(from, to, aliasMap = {}) {
    return (text) =>
      text.replace(/[A-Za-z0-9]+/g, (w) => {
        if (aliasMap[w]) return aliasMap[w];
        if (this.aliases.has(w)) return w;
        return this.gunOf(w) === from ? to + w.slice(from.length) : w;
      });
  }
}
const only = (guns, id) => guns.size === 1 && guns.has(id);
// Molang conditions list guns with || / &&; any other string (a path, an id) is just renamed.
const isCondition = (s) => /\|\||&&/.test(s);
const jsonOf = (v) => (typeof v === "string" ? v : JSON.stringify(v));

// ---------------------------------------------------------------- conditions
// Splits a Molang condition into terms separated by top-level || / && at each paren level.
function parenGroups(s) {
  const groups = [{ start: 0, end: s.length }];
  const stack = [];
  let quote = null;
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (quote) {
      if (c === quote) quote = null;
    } else if (c === "'" || c === '"') quote = c;
    else if (c === "(") stack.push(i + 1);
    else if (c === ")" && stack.length) groups.push({ start: stack.pop(), end: i });
  }
  return groups;
}
function terms(s, { start, end }) {
  const out = [];
  let depth = 0, quote = null, termStart = start;
  for (let i = start; i < end; i++) {
    const c = s[i];
    if (quote) {
      if (c === quote) quote = null;
      continue;
    }
    if (c === "'" || c === '"') quote = c;
    else if (c === "(") depth++;
    else if (c === ")") depth--;
    else if (depth === 0 && (s.startsWith("||", i) || s.startsWith("&&", i))) {
      let a = i, b = i + 2;
      while (a > termStart && s[a - 1] === " ") a--;
      while (b < end && s[b] === " ") b++;
      out.push({ start: termStart, end: a, sepAfter: s.slice(a, b), op: s.slice(i, i + 2) });
      termStart = b;
      i = b - 1;
    }
  }
  let last = end;
  while (last > termStart && s[last - 1] === " ") last--; // spaces at the edges belong to no term
  out.push({ start: termStart, end: last, sepAfter: null, op: null });
  while (out[0].start < out[0].end && s[out[0].start] === " ") out[0].start++;
  for (let k = 0; k < out.length; k++) out[k].sepBefore = k > 0 ? out[k - 1].sepAfter : null;
  for (let k = 0; k < out.length; k++) out[k].opAround = out[k].op ?? out[k - 1]?.op ?? null;
  return out;
}
// The innermost term containing each word of gun `id`: [{ start, end, sepBefore, sepAfter, opAround }].
function gunTerms(s, id, words, where) {
  const found = new Map();
  const groups = parenGroups(s);
  for (const m of s.matchAll(/[A-Za-z0-9]+/g)) {
    if (words.gunOf(m[0]) !== id) continue;
    const at = m.index;
    const group = groups.filter((g) => g.start <= at && at < g.end).sort((a, b) => a.end - a.start - (b.end - b.start))[0];
    const term = terms(s, group).find((t) => t.start <= at && at < t.end);
    const text = s.slice(term.start, term.end);
    if (!only(words.gunsIn(text), id)) throw new Error(`${where}: can't separate ${id} in condition: ${s}`);
    const negated = /^\s*!/.test(text) || text.includes("!=");
    if (!term.opAround || (term.opAround === "&&" && !negated))
      throw new Error(`${where}: ${id} is not in a list of guns in: ${s}`);
    found.set(term.start, { ...term, group });
  }
  return [...found.values()].sort((a, b) => a.start - b.start);
}
function addTerms(s, from, to, words, where) {
  const rename = words.renamer(from, to);
  let out = s;
  for (const t of gunTerms(s, from, words, where).reverse()) {
    const sep = t.sepAfter ?? t.sepBefore;
    out = out.slice(0, t.end) + sep + rename(s.slice(t.start, t.end)) + out.slice(t.end);
  }
  return out;
}
// Rebuilds each list without the gun's terms, one list at a time (lists can be nested).
function removeTerms(s, id, words, where) {
  for (let found = gunTerms(s, id, words, where); found.length; found = gunTerms(s, id, words, where)) {
    const { group } = found[0];
    const drop = new Set(found.filter((t) => t.group.start === group.start && t.group.end === group.end).map((t) => t.start));
    const all = terms(s, group);
    const kept = all.filter((t) => !drop.has(t.start));
    if (!kept.length) throw new Error(`${where}: removing ${id} would empty the condition: ${s}`);
    const rebuilt = kept.map((t, i) => (i ? t.sepBefore ?? kept[i - 1].sepAfter : "") + s.slice(t.start, t.end)).join("");
    s = s.slice(0, all[0].start) + rebuilt + s.slice(all[all.length - 1].end);
  }
  return s;
}

// ---------------------------------------------------------------- JSON transforms
const notes = []; // mentions clone leaves pointing at the source gun
function ownerOfEntry(key, value, words) {
  const keyGuns = words.gunsIn(key);
  if (keyGuns.size === 1) return [...keyGuns][0];
  return undefined;
}
function ownerOfItem(item, words) {
  const guns = words.gunsIn(jsonOf(item));
  return guns.size === 1 ? [...guns][0] : undefined;
}

// Deep rename of a node that belongs to `from`: single-gun strings/keys are renamed; conditions
// that list several guns are kept (addGun then adds the new gun to them).
function renameNode(node, from, to, words, aliasMap) {
  const rename = words.renamer(from, to, aliasMap);
  const visit = (v) => {
    if (typeof v === "string") {
      return words.gunsIn(v).size <= 1 || !isCondition(v) ? rename(v) : v;
    }
    if (Array.isArray(v)) return v.map(visit);
    if (v && typeof v === "object") return Object.fromEntries(Object.entries(v).map(([k, x]) => [words.gunsIn(k).size <= 1 ? rename(k) : k, visit(x)]));
    return v;
  };
  return visit(node);
}

// A per-gun transition list (shared_draw.json) inside `owner`'s own node skips `owner`; give it an
// entry for `missing`, made from a sibling entry.
function isGunList(arr, words) {
  const owners = new Set(arr.map((x) => ownerOfItem(x, words)).filter(Boolean));
  return owners.size >= 2 && arr.every((x) => ownerOfItem(x, words) || words.gunsIn(jsonOf(x)).size !== 1);
}
function templateFor(arr, missing, words) {
  const sample = arr.find((x) => ownerOfItem(x, words));
  const g = ownerOfItem(sample, words);
  return renameNode(sample, g, missing, words, {});
}

// Clone: add gun `to` wherever gun `from` is.
function addGun(node, from, to, words, aliasMap, where, ctx = {}) {
  const recur = (v, c = ctx) => addGun(v, from, to, words, aliasMap, where, c);
  if (typeof node === "string") {
    const guns = words.gunsIn(node);
    if (!guns.has(from)) return node;
    // A plain reference to the source gun (not a condition), e.g. an item group's icon: keep it.
    if (!isCondition(node)) {
      if (!ctx.own) notes.push(`${where}: still points at ${from}: "${node}"`);
      return node;
    }
    // Inside a gun's own node, only conditions that list several guns get the new gun.
    if (ctx.own && guns.size < 2) return node;
    return addTerms(node, from, to, words, where);
  }
  if (Array.isArray(node)) {
    const out = [];
    for (const item of node) {
      const owner = ownerOfItem(item, words);
      if (owner === from && !ctx.own) {
        out.push(item, renameNode(item, from, to, words, aliasMap));
      } else out.push(recur(item));
    }
    if (ctx.own && isGunList(node, words)) {
      const has = (g) => node.some((x) => ownerOfItem(x, words) === g);
      if (!has(ctx.missing) && !has(ctx.self)) out.push(templateFor(node, ctx.missing, words));
    }
    return out;
  }
  if (node && typeof node === "object") {
    const out = {};
    for (const [k, v] of Object.entries(node)) {
      const owner = ctx.own ? undefined : ownerOfEntry(k, v, words);
      if (owner === from) {
        const k2 = words.renamer(from, to, aliasMap)(k);
        if (k2 === k) throw new Error(`${where}: can't rename entry "${k}"`);
        if (k2 in node) throw new Error(`${where}: "${k2}" already exists`);
        out[k] = recur(v, { own: true, self: from, missing: to });
        out[k2] = recur(renameNode(v, from, to, words, aliasMap), { own: true, self: to, missing: from });
      } else out[k] = recur(v);
    }
    return out;
  }
  return node;
}

// Remove: delete gun `id` everywhere.
function removeGun(node, id, words, where) {
  const recur = (v) => removeGun(v, id, words, where);
  if (typeof node === "string") {
    const guns = words.gunsIn(node);
    if (!guns.has(id)) return node;
    // A plain reference (not a condition) can't be removed; the leftover check reports it.
    if (!isCondition(node)) return node;
    return removeTerms(node, id, words, where);
  }
  if (Array.isArray(node)) return node.filter((x) => ownerOfItem(x, words) !== id).map(recur);
  if (node && typeof node === "object")
    return Object.fromEntries(Object.entries(node).filter(([k, v]) => ownerOfEntry(k, v, words) !== id).map(([k, v]) => [k, recur(v)]));
  return node;
}

// Keep each file's current JSON style (compact, or 2-space JSON.stringify).
function writeJson(tree, f, before, value) {
  const text = tree.read(f);
  const indented = JSON.stringify(before, null, 2) + "\n" === text;
  tree.write(f, indented ? JSON.stringify(value, null, 2) + "\n" : format(value));
}

// ---------------------------------------------------------------- lang + config
function editLang(tree, f, fn) {
  const lines = tree.read(f).split("\n");
  tree.write(f, lines.flatMap(fn).join("\n"));
}
// A top-level entry `  <id>: { ... },` of a config object.
function configBlock(text, id) {
  const re = new RegExp(`\\n  ${id}: \\{\\n[\\s\\S]*?\\n  \\},\\n`);
  const m = re.exec(text);
  return m && { start: m.index + 1, end: m.index + m[0].length, text: m[0].slice(1) };
}

// ---------------------------------------------------------------- setup
async function loadIds() {
  const url = pathToFileURL(abs(`${CONFIG_DIR}/weapons.js`)).href + "?t=" + Date.now();
  return Object.keys((await import(url)).WEAPONS);
}
function armsModels(tree, words0) {
  // Per-gun first-person arms: render controller "universal<N>.first_person" used for one gun only.
  const e = parse(tree.read("TACZ-R/entity/player.entity.json"))["minecraft:client_entity"].description;
  const out = {};
  for (const rc of e.render_controllers) {
    const [key, cond] = Object.entries(rc)[0];
    const m = /universal(\d+)\.first_person/.exec(key);
    const guns = words0.gunsIn(cond);
    if (m && guns.size === 1) out[[...guns][0]] = m[1];
  }
  return out;
}
async function setup() {
  const tree = new Tree();
  const ids = await loadIds();
  const plain = new Words(tree, ids, {});
  const arms = armsModels(tree, plain);
  return { tree, ids, arms, words: new Words(tree, ids, arms) };
}
function sharedFiles(tree, ids, arms) {
  const pats = ids.flatMap((id) => ownFilePatterns(id, arms[id]));
  return tree.list().filter((f) => TEXT.test(f) && !isOwn(f, pats));
}
const assetRefs = (text) => new Set(text.match(/\b(?:sounds|textures)\/[A-Za-z0-9_./-]+/g) ?? []);
const assetFiles = (tree, ref) => ["", ".png", ".tga", ".ogg", ".wav", ".fsb"].map((x) => `TACZ-R/${ref}${x}`).filter((f) => tree.exists(f));

// ---------------------------------------------------------------- clone
async function clone(from, to, name) {
  const { tree, ids, arms, words } = await setup();
  if (!ids.includes(from)) throw new Error(`no gun "${from}" in config/weapons.js`);
  if (!/^[a-z][a-z0-9]*$/.test(to)) throw new Error(`id must be lowercase letters and digits: "${to}"`);
  if (ids.includes(to)) throw new Error(`"${to}" already exists`);
  // Words that would start to count as the new gun's.
  const clash = tree.list().filter((f) => TEXT.test(f)).flatMap((f) =>
    (tree.read(f).match(/[A-Za-z0-9]+/g) ?? []).filter((w) => w.startsWith(to) && (words.split(w)?.id.length ?? 0) < to.length));
  if (clash.length) throw new Error(`"${to}" would match existing words: ${[...new Set(clash)].slice(0, 5).join(", ")}`);

  // New arms model number, if the source has its own.
  const aliasMap = {};
  if (arms[from]) {
    const used = tree.list().map((f) => /taczuniversal(\d+)\.geo\.json$/.exec(f)?.[1]).filter(Boolean).map(Number);
    const n = Math.max(...used, ...Object.values(arms).map(Number)) + 1;
    aliasMap[`taczuniversal${arms[from]}`] = `taczuniversal${n}`;
    aliasMap[`universal${arms[from]}`] = `universal${n}`;
  }
  const rename = words.renamer(from, to, aliasMap);

  // 1. Own files.
  const pats = ownFilePatterns(from, arms[from]);
  for (const f of tree.list().filter((f) => isOwn(f, pats))) {
    const target = rename(f);
    if (tree.exists(target)) throw new Error(`${target} already exists`);
    if (TEXT.test(f)) {
      tree.write(target, rename(tree.read(f)));
      if (tree.crlf.has(f)) tree.crlf.add(target);
    } else tree.copy(f, target);
  }

  // 2. Shared JSON.
  const shared = sharedFiles(tree, ids, arms);
  for (const f of shared.filter((f) => f.endsWith(".json"))) {
    const text = tree.read(f);
    if (!words.gunsIn(text).has(from)) continue;
    const before = parse(text);
    writeJson(tree, f, before, addGun(before, from, to, words, aliasMap, f));
  }

  // 3. Lang: copy the gun's lines; the name lines get the new name.
  for (const f of shared.filter((f) => f.endsWith(".lang"))) {
    const lines = tree.read(f).split("\n");
    const oldName = lines.find((l) => l.startsWith(`krep:gun.${from}.name=`))?.split("=").slice(1).join("=");
    editLang(tree, f, (line) => {
      const key = line.split("=")[0];
      if (!key || !only(words.gunsIn(key), from)) return [line];
      let copy = rename(line);
      if (/\.name$/.test(key) && oldName) copy = copy.replace(oldName, name);
      return [line, copy];
    });
  }

  // 4. Config: copy the gun's entries.
  for (const f of CONFIG_FILES) {
    const text = tree.read(f);
    const block = configBlock(text, from);
    if (!block) continue;
    let copy = rename(block.text).replace(/^(    (?:name|menuLabel): )"[^"]*"/m, `$1${JSON.stringify(name)}`);
    tree.write(f, text.slice(0, block.end) + copy + text.slice(block.end));
  }

  // Item lore (generated from the English lang file).
  tree.read(LORE_FILE); // (keeps its line endings)
  tree.write(LORE_FILE, generateLore(tree.read(LANG_FILE)));

  // 5. Files that new names point at (sounds, textures outside the gun's folders).
  for (const f of tree.writes.keys()) {
    if (!TEXT.test(f)) continue;
    for (const ref of assetRefs(tree.read(f))) {
      if (assetFiles(tree, ref).length) continue;
      const back = Object.fromEntries(Object.entries(aliasMap).map(([a, b]) => [b, a]));
      const src = ref.replace(/[A-Za-z0-9]+/g, (w) => back[w] ?? (w.startsWith(to) ? from + w.slice(to.length) : w));
      for (const file of assetFiles(tree, src)) tree.copy(file, file.replace(`TACZ-R/${src}`, `TACZ-R/${ref}`));
    }
  }

  // Checks.
  const props = parse(tree.read("TACZ-B/entities/player.json"))["minecraft:entity"].description.properties;
  if (Object.keys(props).length > MAX_PROPERTIES)
    throw new Error(`player.json would have ${Object.keys(props).length} properties (Bedrock allows ${MAX_PROPERTIES})`);
  return tree;
}

// ---------------------------------------------------------------- remove
async function remove(id, force) {
  const { tree, ids, arms, words } = await setup();
  if (!ids.includes(id)) throw new Error(`no gun "${id}" in config/weapons.js`);
  const pats = ownFilePatterns(id, arms[id]);
  const refsBefore = new Set();

  for (const f of tree.list().filter((f) => isOwn(f, pats))) {
    if (TEXT.test(f)) for (const r of assetRefs(tree.read(f))) refsBefore.add(r);
    tree.remove(f);
  }
  const shared = sharedFiles(tree, ids, arms);
  for (const f of shared.filter((f) => f.endsWith(".json"))) {
    const text = tree.read(f);
    if (!words.gunsIn(text).has(id)) continue;
    for (const r of assetRefs(text)) refsBefore.add(r);
    const before = parse(text);
    writeJson(tree, f, before, removeGun(before, id, words, f));
  }
  for (const f of shared.filter((f) => f.endsWith(".lang")))
    editLang(tree, f, (line) => (only(words.gunsIn(line.split("=")[0]), id) ? [] : [line]));
  for (const f of CONFIG_FILES) {
    const text = tree.read(f);
    const block = configBlock(text, id);
    if (block) tree.write(f, text.slice(0, block.start) + text.slice(block.end));
  }

  tree.read(LORE_FILE); // (keeps its line endings)
  tree.write(LORE_FILE, generateLore(tree.read(LANG_FILE)));

  // Assets only the removed parts used.
  const remaining = tree.list().filter((f) => TEXT.test(f)).map((f) => tree.read(f)).join("\n");
  for (const ref of refsBefore) if (!remaining.includes(ref)) for (const f of assetFiles(tree, ref)) tree.remove(f);

  // Anything still mentioning the gun (e.g. another gun borrowing its animation) is a problem.
  const left = [];
  for (const f of tree.list().filter((f) => TEXT.test(f))) {
    const hits = (tree.read(f).match(/[A-Za-z0-9]+/g) ?? []).filter((w) => words.gunOf(w) === id);
    if (hits.length) left.push(`${f}: ${[...new Set(hits)].slice(0, 5).join(", ")}`);
  }
  if (left.length && !force) throw new Error(`other files still use ${id} (--force removes it anyway):\n  ${left.join("\n  ")}`);
  return tree;
}

// ---------------------------------------------------------------- main
const args = process.argv.slice(2);
const flag = (n) => {
  const i = args.indexOf(n);
  if (i < 0) return undefined;
  const [v] = args.splice(i, n === "--name" ? 2 : 1).slice(1);
  return v ?? true;
};
const dryRun = !!flag("--dry-run");
const force = !!flag("--force");
const name = flag("--name");
const [cmd, a, b] = args;
try {
  let tree;
  if (cmd === "clone" && a && b) tree = await clone(a, b, name ?? b.toUpperCase());
  else if (cmd === "remove" && a) tree = await remove(a, force);
  else {
    console.log(fs.readFileSync(new URL(import.meta.url), "utf8").split("\n").slice(0, 12).join("\n"));
    process.exit(1);
  }
  const changes = tree.commit(dryRun);
  console.log(changes.join("\n"));
  if (notes.length) console.log("\nNot copied (a single reference to the source gun; edit by hand if needed):\n  " + notes.join("\n  "));
  console.log(`\n${changes.length} file(s) ${dryRun ? "would change (dry run)" : "changed"}. Now run tools/weapons/check.mjs.`);
} catch (error) {
  console.error("error:", error.message);
  process.exit(1);
}
