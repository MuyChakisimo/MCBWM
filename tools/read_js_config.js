// Prints the frozen object exports of a TACZ config .js file as JSON (used by tools/gen_*.py).
// node tools/read_js_config.js addons/TACZ-B/scripts/config/javaAttachments.js
const text = require("fs").readFileSync(process.argv[2], "utf8");
const out = {};
const re = /export const (\w+) = Object\.freeze\((\{[\s\S]*?\n\}|\[[\s\S]*?\])\);/g;
let m;
while ((m = re.exec(text))) {
  try {
    out[m[1]] = eval("(" + m[2] + ")");
  } catch (e) {
    // not a plain literal: skip
  }
}
process.stdout.write(JSON.stringify(out));
