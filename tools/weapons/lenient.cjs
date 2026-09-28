// Bedrock-style lenient JSON (comments, trailing commas, BOM) + recursive file loading.
function stripJson(text) {
  text = text.replace(/^﻿/, "");
  let out = "", i = 0, inStr = false;
  while (i < text.length) {
    const c = text[i], n = text[i + 1];
    if (inStr) {
      out += c;
      if (c === "\\") { out += n; i += 2; continue; }
      if (c === '"') inStr = false;
      i++; continue;
    }
    if (c === '"') { inStr = true; out += c; i++; continue; }
    if (c === "/" && n === "/") { while (i < text.length && text[i] !== "\n") i++; continue; }
    if (c === "/" && n === "*") { i += 2; while (i < text.length && !(text[i] === "*" && text[i + 1] === "/")) i++; i += 2; continue; }
    out += c; i++;
  }
  return out.replace(/,(\s*[}\]])/g, "$1");
}
const parse = (text) => JSON.parse(stripJson(text));
const fs = require("fs"), path = require("path");
const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)]));
function loadAll(root) {
  const out = [];
  for (const f of walk(root).filter((f) => f.endsWith(".json"))) {
    try { out.push({ file: f.split(path.sep).join("/"), json: parse(fs.readFileSync(f, "utf8")) }); }
    catch (e) { out.push({ file: f.split(path.sep).join("/"), error: e.message }); }
  }
  return out;
}
module.exports = { parse, stripJson, loadAll, walk };
