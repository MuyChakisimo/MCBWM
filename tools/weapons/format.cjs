// The pack's JSON style: anything that fits in 100 characters stays on one line, so model
// cubes and keyframes don't explode into one number per line. Same as reorganize.cjs.
function stringify(value, indent = "") {
  const flat = JSON.stringify(value);
  if (value === null || typeof value !== "object" || indent.length + flat.length <= 100) return spaced(value);
  const inner = indent + "  ";
  if (Array.isArray(value)) return `[\n${value.map((x) => inner + stringify(x, inner)).join(",\n")}\n${indent}]`;
  const entries = Object.entries(value).map(([k, x]) => `${inner}${JSON.stringify(k)}: ${stringify(x, inner)}`);
  return `{\n${entries.join(",\n")}\n${indent}}`;
}
// One-line JSON with a space after "," and ":" (outside strings).
function spaced(value) {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(spaced).join(", ")}]`;
  return `{${Object.entries(value).map(([k, x]) => `${JSON.stringify(k)}: ${spaced(x)}`).join(", ")}}`;
}
module.exports = { stringify, format: (value) => stringify(value) + "\n" };
