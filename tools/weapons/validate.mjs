// Checks the packs against Minecraft's own definitions (needs internet the first time):
//
//   node tools/weapons/validate.mjs            scripts + pack files
//   node tools/weapons/validate.mjs --update   re-download the schemas first
//
//   1. Scripts: type-checked (TypeScript) against Mojang's published API definitions for the exact
//      versions in TACZ-B/manifest.json (@minecraft/server, @minecraft/server-ui). Catches calls to
//      functions/events that don't exist in that API version, wrong argument types, undefined names.
//   2. Pack JSON: validated against the community Bedrock JSON schemas
//      (github.com/Blockception/Minecraft-bedrock-json-schemas, the ones VS Code's Minecraft
//      extension uses). ACCEPTED below lists older formats the game still loads (they were all in
//      v1.9.0, which worked in game); anything else is printed.
// check.mjs (offline) covers references, names and structure; run both after big changes.
// Downloads go to <temp>/tacz-validate (npm packages + schemas), not into the repo.
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execSync, spawnSync } from "node:child_process";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const { parse } = require("./lenient.cjs");

const repo = process.cwd();
const cache = path.join(os.tmpdir(), "tacz-validate");
const manifest = parse(fs.readFileSync(path.join(repo, "TACZ-B/manifest.json"), "utf8"));
const modules = Object.fromEntries((manifest.dependencies ?? []).filter((d) => d.module_name).map((d) => [d.module_name, d.version]));

// Older formats the game accepts: [schema message pattern, why].
const ACCEPTED = [
  [/items\.json \| .*minecraft:icon/, "item icon as {texture} (pre-1.20.30 form, used by every item)"],
  [/model_entity\.json \| .*(minecraft:geometry|geometry\.)/, "legacy model format (\"geometry.x\": {...}, format 1.10)"],
  [/sound_definitions\.json \|  must NOT have additional properties/, "flat sound_definitions.json (no format_version wrapper)"],
  [/animations\.json \| .*loop must be boolean/, "BP animation loop \"hold_on_last_frame\""],
  [/manifest\.json \| .*(uuid|dependencies)/, "manifest UUID form and pack dependency by uuid+version"],
  [/blocks\.json \| .*description must NOT have additional properties \(properties\)/, "block properties in description (pre-states form)"],
  [/entities\.json \| .*(minecraft:pushable|queue_command\/command)/, "vanilla player components; queue_command with a command list"],
];

// ---------------------------------------------------------------- setup
function setup() {
  fs.mkdirSync(cache, { recursive: true });
  const want = { "@minecraft/server": modules["@minecraft/server"], "@minecraft/server-ui": modules["@minecraft/server-ui"], typescript: "5", ajv: "8", "ajv-formats": "3" };
  const pkgFile = path.join(cache, "package.json");
  const have = fs.existsSync(pkgFile) ? JSON.parse(fs.readFileSync(pkgFile, "utf8")).wanted : null;
  if (JSON.stringify(have) !== JSON.stringify(want)) {
    console.log(`installing ${Object.entries(want).map(([k, v]) => `${k}@${v}`).join(", ")} into ${cache} ...`);
    fs.writeFileSync(pkgFile, JSON.stringify({ name: "tacz-validate", private: true, wanted: want }, null, 2));
    execSync(`npm install --no-audit --no-fund --legacy-peer-deps ${Object.entries(want).map(([k, v]) => `${k}@${v}`).join(" ")}`, { cwd: cache, stdio: "inherit" });
  }
  const schemas = path.join(cache, "schemas");
  if (!fs.existsSync(schemas)) execSync(`git clone -q --depth 1 https://github.com/Blockception/Minecraft-bedrock-json-schemas.git schemas`, { cwd: cache, stdio: "inherit" });
  else if (process.argv.includes("--update")) execSync("git pull -q", { cwd: schemas, stdio: "inherit" });
}

// ---------------------------------------------------------------- 1. scripts
function checkScripts() {
  const tsconfig = path.join(cache, "tsconfig.json");
  fs.writeFileSync(tsconfig, JSON.stringify({
    compilerOptions: {
      allowJs: true, checkJs: true, noEmit: true, target: "es2022", module: "es2022", moduleResolution: "bundler", skipLibCheck: true, strict: false,
      baseUrl: ".", paths: { "@minecraft/server": ["./node_modules/@minecraft/server"], "@minecraft/server-ui": ["./node_modules/@minecraft/server-ui"] },
    },
    include: [path.join(repo, "TACZ-B/scripts/**/*.js").split(path.sep).join("/")],
  }, null, 2));
  const tsc = path.join(cache, "node_modules", "typescript", "bin", "tsc");
  const r = spawnSync(process.execPath, [tsc, "-p", tsconfig], { encoding: "utf8" });
  const errors = (r.stdout + r.stderr).split("\n").filter((l) => /error TS\d+/.test(l)).map((l) => l.replace(/^.*?TACZ-B\//, "TACZ-B/"));
  // Calls on untyped values (function parameters) escape the type check: refuse what 2.x removed or renamed by name.
  if (+String(modules["@minecraft/server"]).split(".")[0] >= 2) {
    const REMOVED = [
      [/\.runCommandAsync\(/, "runCommandAsync was removed in 2.0.0: use runCommand"],
      [/\.isValid\(\)/, "isValid is a property since 2.0.0, not a function"],
      [/\bGameMode\.(survival|creative|adventure|spectator)\b/, "GameMode values are capitalised since 2.0.0 (GameMode.Creative)"],
      [/\bworldInitialize\b/, "worldInitialize was replaced by system.beforeEvents.startup / world.afterEvents.worldLoad"],
      [/\bitemUseOn\b/, "itemUseOn events were removed in 2.0.0"],
    ];
    const walkJs = (d) => fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walkJs(path.join(d, e.name)) : e.name.endsWith(".js") ? [path.join(d, e.name)] : []));
    for (const f of walkJs(path.join(repo, "TACZ-B/scripts")))
      fs.readFileSync(f, "utf8").split(/\r?\n/).forEach((line, i) => {
        for (const [re, why] of REMOVED) if (re.test(line)) errors.push(`${path.relative(repo, f).split(path.sep).join("/")}(${i + 1}): ${why}`);
      });
  }
  console.log(`\n1. Scripts vs @minecraft/server ${modules["@minecraft/server"]}, server-ui ${modules["@minecraft/server-ui"]}: ${errors.length ? errors.length + " problem(s)" : "OK"}`);
  for (const e of errors) console.log("   " + e);
  return errors.length;
}

// ---------------------------------------------------------------- 2. pack JSON
function checkJson() {
  const Ajv = require(path.join(cache, "node_modules", "ajv"));
  const addFormats = require(path.join(cache, "node_modules", "ajv-formats"));
  const regExp = (p, f) => new RegExp(p, (f ?? "").replace("u", ""));
  regExp.code = 'new RegExp';
  const ajv = new (Ajv.default ?? Ajv)({ strict: false, allErrors: true, validateSchema: false, logger: false, code: { regExp } });
  (addFormats.default ?? addFormats)(ajv);
  for (const f of ["molang", "color-hex", "colox-hex"]) ajv.addFormat(f, true);
  const RULES = [
    [/^TACZ-[BR]\/manifest\.json$/, "general/manifest.json"], [/^TACZ-B\/entities\//, "behavior/entities/entities.json"],
    [/^TACZ-B\/items\//, "behavior/items/items.json"], [/^TACZ-B\/blocks\//, "behavior/blocks/blocks.json"],
    [/^TACZ-B\/recipes\//, "behavior/recipes/recipes.json"], [/^TACZ-B\/animation_controllers\//, "behavior/animation_controllers/animation_controller.json"],
    [/^TACZ-B\/animations\//, "behavior/animations/animations.json"], [/^TACZ-B\/item_catalog\//, "behavior/item_catalog/crafting_item_catalog.json"],
    [/^TACZ-R\/entity\//, "resource/entity/entity.json"], [/^TACZ-R\/attachables\//, "resource/attachables/attachables.json"],
    [/^TACZ-R\/animation_controllers\//, "resource/animation_controllers/animation_controller.json"], [/^TACZ-R\/animations\//, "resource/animations/actor_animation.json"],
    [/^TACZ-R\/render_controllers\//, "resource/render_controllers/render_controllers.json"], [/^TACZ-R\/models\//, "resource/models/entity/model_entity.json"],
    [/^TACZ-R\/particles\//, "resource/particles/particles.json"], [/^TACZ-R\/sounds\/sound_definitions\.json$/, "resource/sounds/sound_definitions.json"],
    [/^TACZ-R\/textures\/item_texture\.json$/, "resource/textures/item_texture.json"], [/^TACZ-R\/textures\/terrain_texture\.json$/, "resource/textures/terrain_texture.json"],
    [/^TACZ-R\/blocks\.json$/, "resource/blocks.json"],
  ];
  const compiled = new Map();
  const validatorFor = (s) => {
    if (!compiled.has(s)) { const p = path.join(cache, "schemas", s); compiled.set(s, fs.existsSync(p) ? ajv.compile({ ...JSON.parse(fs.readFileSync(p, "utf8")), $id: s }) : null); }
    return compiled.get(s);
  };
  const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)]));
  const files = ["TACZ-B", "TACZ-R"].flatMap((d) => walk(path.join(repo, d))).map((f) => path.relative(repo, f).split(path.sep).join("/")).filter((f) => f.endsWith(".json"));
  const findings = new Map(), accepted = new Map();
  let checked = 0;
  for (const f of files) {
    const rule = RULES.find(([re]) => re.test(f));
    const v = rule && validatorFor(rule[1]);
    if (!v) continue;
    checked++;
    if (v(parse(fs.readFileSync(path.join(repo, f), "utf8")))) continue;
    for (const e of v.errors.filter((e) => !["anyOf", "oneOf", "if"].includes(e.keyword))) {
      const where = e.instancePath.replace(/\/[^/]*\d[^/]*/g, "/*").replace(/\/(animation|controller)\.[^/]*/g, "/<id>");
      const msg = `${rule[1]} | ${where} ${e.message}${e.params?.additionalProperty ? " (" + e.params.additionalProperty + ")" : ""}`;
      const ok = ACCEPTED.find(([re]) => re.test(msg));
      const map = ok ? accepted : findings;
      const key = ok ? ok[1] : msg;
      if (!map.has(key)) map.set(key, new Set());
      map.get(key).add(f);
    }
  }
  console.log(`\n2. Pack JSON vs Bedrock schemas: ${checked} files, ${findings.size ? findings.size + " kind(s) of problem" : "OK"}`);
  for (const [k, fs_] of findings) console.log(`   ${k}\n      ${fs_.size} file(s), e.g. ${[...fs_].slice(0, 3).join(", ")}`);
  if (accepted.size) {
    console.log("   accepted older formats (the game loads them):");
    for (const [why, fs_] of accepted) console.log(`     - ${why}: ${fs_.size} file(s)`);
  }
  return findings.size;
}

setup();
const problems = checkScripts() + checkJson();
console.log(problems ? "\nProblems found (see above)." : "\nEverything is compatible.");
process.exit(problems ? 1 : 0);
