"""Registers the railgun in both packs by cloning the HK416's wiring (idempotent: safe to re-run).

Source model: tools/models/railgun.bbmodel (Blockbench) -> exported tools/models/railgun_export.geo.json + texture.
The railgun reuses the HK416's rig (bone tree, first-person arm model taczuniversal4, animations, controllers), so it
inherits the audited two-handed arms. Gameplay (charge to fire) is in TACZ-B/scripts/combat/firing.js + weapons.js.

    python -I tools/gen_railgun.py          then: python -I tools/gen_muzzle_flash.py ; deploy.ps1
"""
import base64
import copy
import json
import os
import re

HERE = os.path.dirname(os.path.abspath(__file__))
RP = os.path.join(HERE, "..", "addons", "TACZ-R")
BP = os.path.join(HERE, "..", "addons", "TACZ-B")
SRC_GEO = os.path.join(HERE, "models", "railgun_export.geo.json")
SRC_BB = os.path.join(HERE, "models", "railgun.bbmodel")
GUN, BASE = "railgun", "hk416"
MUZZLE = [0, 9.65, -28.9]            # tip of the railgun's muzzle block (model px)
GLOW_NAMES = re.compile(r"glow")     # Blockbench cube names that glow in the dark (coils, capacitor ring, indicator)


def load(p):
    with open(p, encoding="utf-8") as f:
        return json.load(f)


def save(p, d, indent=1):
    with open(p, "w", encoding="utf-8") as f:
        json.dump(d, f, ensure_ascii=False, indent=indent)


def rename(obj):
    """hk416 -> railgun in every string and key (animation names, controller names, variables)."""
    return json.loads(json.dumps(obj).replace(BASE, GUN))


def glow_flags(cubes):
    """Which exported cubes are glow cubes: match each to a Blockbench element by size and |position|
    (the export mirrors X, so compare sizes and y/z plus |x|)."""
    bb = load(SRC_BB)
    elems = [e for e in bb["elements"] if e.get("type", "cube") == "cube"]
    flags = []
    for c in cubes:
        o, s = c["origin"], c["size"]
        hit = None
        for e in elems:
            f, t = e["from"], e["to"]
            size = [t[i] - f[i] for i in range(3)]
            if all(abs(size[i] - s[i]) < 0.02 for i in range(3)) and abs(f[1] - o[1]) < 0.02 and abs(f[2] - o[2]) < 0.02 \
                    and abs(abs(f[0]) - abs(o[0])) < 0.02 or (all(abs(size[i] - s[i]) < 0.02 for i in range(3))
                                                            and abs(f[1] - o[1]) < 0.02 and abs(f[2] - o[2]) < 0.02
                                                            and abs(-t[0] - o[0]) < 0.02):
                hit = e
                break
        flags.append(bool(hit and GLOW_NAMES.search(hit["name"])))
    return flags


def build_geometry():
    exp = load(SRC_GEO)["minecraft:geometry"][0]
    cubes = exp["bones"][0]["cubes"]
    pivot = exp["bones"][0]["pivot"]
    flags = glow_flags(cubes)
    base = load(os.path.join(RP, "models", "entity", "guns", f"{BASE}.geo.json"))
    geo = copy.deepcopy(base["minecraft:geometry"][0])
    geo["description"].update(identifier=f"geometry.{GUN}", texture_width=128, texture_height=128)
    for b in geo["bones"]:
        b.pop("cubes", None)          # keep the HK416 rig (bones, pivots, locators), drop its visuals
        if b["name"] == "muzzle_flash":
            b["pivot"] = MUZZLE
    gun_parent = "416d"
    geo["bones"].append({"name": f"{GUN}_body", "parent": gun_parent, "pivot": pivot,
                         "cubes": [c for c, g in zip(cubes, flags) if not g]})
    geo["bones"].append({"name": f"{GUN}_glow", "parent": gun_parent, "pivot": pivot,
                         "cubes": [c for c, g in zip(cubes, flags) if g]})
    save(os.path.join(RP, "models", "entity", "guns", f"{GUN}.geo.json"), {"format_version": "1.12.0", "minecraft:geometry": [geo]})
    # texture
    src = load(SRC_BB)["textures"][0]["source"]
    os.makedirs(os.path.join(RP, "textures", "gun"), exist_ok=True)
    with open(os.path.join(RP, "textures", "gun", f"{GUN}.png"), "wb") as f:
        f.write(base64.b64decode(src.split(",", 1)[1]))
    return sum(flags), len(cubes) - sum(flags)


def clone_rp():
    # animations: rename, and no shell casings (a railgun has none)
    d = rename(load(os.path.join(RP, "animations", "guns", f"{BASE}.json")))
    for a in d["animations"].values():
        fx = a.get("particle_effects")
        if fx:
            for k in list(fx):
                lst = fx[k] if isinstance(fx[k], list) else [fx[k]]
                keep = [e for e in lst if "shell" not in e.get("effect", "")]
                if keep:
                    fx[k] = keep
                else:
                    del fx[k]
            if not fx:
                del a["particle_effects"]
    # aiming: the HK416 pose brings its sights to the eye; the railgun is taller, so lower it 3 px so the eye looks
    # along the top rail instead of sitting inside the stock (searched + rendered 2026-11-08)
    for name, a in d["animations"].items():
        kf = a.get("bones", {}).get("Joints", {}).get("position") if ".fp.sight" in name else None
        if isinstance(kf, dict):
            last = sorted(kf, key=float)[-1]
            kf[last] = [kf[last][0], kf[last][1] - 3, kf[last][2]]
    save(os.path.join(RP, "animations", "guns", f"{GUN}.json"), d)
    save(os.path.join(RP, "animation_controllers", f"gun_{GUN}.json"),
         rename(load(os.path.join(RP, "animation_controllers", f"gun_{BASE}.json"))))
    save(os.path.join(RP, "render_controllers", f"gun_{GUN}.json"), {"format_version": "1.8.0", "render_controllers": {
        f"controller.render.{GUN}": {"geometry": f"Geometry.{GUN}", "textures": [f"Texture.{GUN}"],
                                     "materials": [{"*": "Material.guns"}, {f"{GUN}_glow": "Material.glow"}]}}})
    for suffix in ("", "_emp"):
        att = load(os.path.join(RP, "attachables", f"gun_{BASE}{suffix}.json"))
        save(os.path.join(RP, "attachables", f"gun_{GUN}{suffix}.json"), rename(att))
    # player client entity
    path = os.path.join(RP, "entity", "player.entity.json")
    ent = load(path)
    desc = ent["minecraft:client_entity"]["description"]
    desc["geometry"][GUN] = f"geometry.{GUN}"
    desc["textures"][GUN] = f"textures/gun/{GUN}"
    for k, v in list(desc["animations"].items()):
        if BASE in k:
            desc["animations"][k.replace(BASE, GUN)] = v.replace(BASE, GUN)
    animate = desc["scripts"]["animate"]
    have = {json.dumps(a) for a in animate}
    for a in list(animate):
        if BASE in json.dumps(a):
            n = rename(a)
            if json.dumps(n) not in have:
                animate.append(n)
    pre = desc["scripts"]["pre_animation"]
    held = held_numbers()
    pre[:] = [s for s in pre if not re.match(rf"\s*variable\.{GUN}(b|emp)?\s*=", s)]
    pre_idx = next(i for i, s in enumerate(pre) if s.startswith(f"variable.{BASE} ="))
    pre[pre_idx + 1:pre_idx + 1] = [f"variable.{GUN}b = variable.held == {held[0]};",
                                    f"variable.{GUN}emp = variable.held == {held[1]};",
                                    f"variable.{GUN} = variable.{GUN}b || variable.{GUN}emp;"]
    for i, s in enumerate(pre):
        if s.startswith("variable.holding_all_guns =") and f"variable.{GUN}" not in s:
            pre[i] = s.rstrip(";") + f" || variable.{GUN};"
    rcs = desc["render_controllers"]
    for e in rcs:
        if isinstance(e, dict) and "controller.render.player.universal4.first_person" in e:
            e["controller.render.player.universal4.first_person"] = f"variable.is_first_person && (variable.{BASE} || variable.{GUN})"
    if not any(isinstance(e, dict) and f"controller.render.{GUN}" in e for e in rcs):
        at = next(i for i, e in enumerate(rcs) if isinstance(e, dict) and f"controller.render.{BASE}" in e)
        rcs.insert(at + 1, {f"controller.render.{GUN}": f"variable.{GUN}"})
    save(path, ent, indent=2)
    # icon, names, sounds
    it = load(os.path.join(RP, "textures", "item_texture.json"))
    it["texture_data"][GUN] = {"textures": f"textures/items/{GUN}"}
    save(os.path.join(RP, "textures", "item_texture.json"), it, indent=2)
    for lang in os.listdir(os.path.join(RP, "texts")):
        if not lang.endswith(".lang"):
            continue
        p = os.path.join(RP, "texts", lang)
        text = open(p, encoding="utf-8").read()
        text = "\n".join(l for l in text.splitlines() if not l.startswith(f"krep:gun.{GUN}")) + "\n"
        text += (f"krep:gun.{GUN}.name=Railgun\nkrep:gun.{GUN}_emp.name=Railgun (Empty)\n"
                 f"krep:gun.{GUN}.lore={LORE_TEXT}\nkrep:gun.{GUN}_emp.lore={LORE_TEXT_EMP}\n")
        open(p, "w", encoding="utf-8").write(text)
    sd_path = os.path.join(RP, "sounds", "sound_definitions.json")
    sd = load(sd_path)
    defs = sd.get("sound_definitions", sd)
    shoot = defs["m107.shoot"]["sounds"][0]
    windup = defs["minigun.windup"]["sounds"][0]
    file_of = lambda s: s["name"] if isinstance(s, dict) else s
    defs[f"{GUN}.shoot"] = {"category": "hostile", "max_distance": 160,
                            "sounds": [{"name": file_of(shoot), "pitch": 0.7, "volume": 1.0}]}
    defs[f"{GUN}.charge"] = {"category": "hostile", "max_distance": 48,
                             "sounds": [{"name": file_of(windup), "pitch": 0.55, "volume": 0.9}]}
    save(sd_path, sd, indent=2)


LORE_LINES = ["§fType: Electromagnetic Railgun", "§fGroup: §5Heavy Weapons§r", "§fHold to charge for 2 seconds.",
              "§fOnly a full charge fires. Reload after every shot.", "", "§fAmmo: .50 BMG", "Damage: 100§r"]
LORE_TEXT = " \\n".join(LORE_LINES)
LORE_TEXT_EMP = LORE_TEXT.replace("§5Heavy Weapons§r", "§7Empty Guns§r")


def held_numbers():
    text = open(os.path.join(BP, "scripts", "config", "held.js"), encoding="utf-8").read()
    mine = re.findall(rf'"krep:{GUN}(?:_emp)?": (\d+)', text)
    if len(mine) == 2:
        return [int(mine[0]), int(mine[1])]
    top = max(int(n) for n in re.findall(r'": (\d+),', text))
    return [top + 1, top + 2]


def clone_bp():
    for suffix in ("", "_emp"):
        item = load(os.path.join(BP, "items", "guns", BASE, f"{BASE}{suffix}.json"))
        os.makedirs(os.path.join(BP, "items", "guns", GUN), exist_ok=True)
        save(os.path.join(BP, "items", "guns", GUN, f"{GUN}{suffix}.json"), rename(item))
    held = held_numbers()
    p = os.path.join(BP, "scripts", "config", "held.js")
    text = open(p, encoding="utf-8").read()
    if f'"krep:{GUN}"' not in text:
        text = text.replace("\n});", f'\n  "krep:{GUN}": {held[0]},\n  "krep:{GUN}_emp": {held[1]},\n}});', 1)
        open(p, "w", encoding="utf-8").write(text)
    p = os.path.join(BP, "scripts", "config", "lore.js")
    text = open(p, encoding="utf-8").read()
    if f'"krep:gun.{GUN}.lore"' not in text:
        lines = json.dumps(LORE_LINES + ["", "§1Custom (MuyChakisimo server)"], ensure_ascii=False)
        emp = lines.replace("§5Heavy Weapons§r", "§7Empty Guns§r")
        text = text.replace("export const LORE = Object.freeze({",
                            f'export const LORE = Object.freeze({{\n  "krep:gun.{GUN}.lore": {lines},\n  "krep:gun.{GUN}_emp.lore": {emp},', 1)
        open(p, "w", encoding="utf-8").write(text)
    p = os.path.join(BP, "item_catalog", "crafting_item_catalog.json")
    text = open(p, encoding="utf-8").read()
    if f'"krep:{GUN}"' not in text:
        text = re.sub(rf'(\s*)"krep:{BASE}",', rf'\1"krep:{BASE}",\1"krep:{GUN}",', text, count=1)
        text = re.sub(rf'(\s*)"krep:{BASE}_emp",', rf'\1"krep:{BASE}_emp",\1"krep:{GUN}_emp",', text, count=1)
        open(p, "w", encoding="utf-8").write(text)
    return held


if __name__ == "__main__":
    glow, body = build_geometry()
    clone_rp()
    held = clone_bp()
    print(f"geometry: {body} body cubes + {glow} glow cubes; krep:held = {held}")
