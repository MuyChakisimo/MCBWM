"""Builds model-based muzzle flashes for every gun in addons/TACZ-R (idempotent: safe to re-run).

Why: particles attached to a first-person gun never line up on screen (the held gun is drawn with its own
first-person camera, particles with the world camera). A flash that is part of the gun's own bone tree is
drawn with the gun, so it sits exactly on the barrel when aiming, at hip and in third person.

For each gun geometry with a `muzzle_flash` bone (every TACZ gun has one at the barrel tip):
  * geometry.tacz_flash_<gun>: a copy of the bone chain root..muzzle_flash (same names and pivots, so every gun
    animation moves it too) plus flat flame quads: a star facing back down the barrel, and two crossed side jets
    pointing forward (-z). Texture: textures/particle/tacz_flash_model.png (left half star, right half jet).
  * controller.render.tacz_flash_<gun>, shown only while (q.life_time - v.tacz_flash) < FLASH_SECONDS and not
    silenced (krep:muzzle >= the gun's suppressedFrom in TACZ-B/scripts/config/weapons.js).
  * the gun's shoot animations set v.tacz_flash (timeline) and spin the muzzle_flash bone randomly around the barrel,
    and no longer play the old krep.muzzleflash / krep.muzzlejet particles.
Run:  python -I tools/gen_muzzle_flash.py      (then deploy.ps1)
"""
import glob
import json
import os
import re

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "addons")
RP = os.path.join(ROOT, "TACZ-R")
WEAPONS_JS = os.path.join(ROOT, "TACZ-B", "scripts", "config", "weapons.js")

FLASH_SECONDS = 0.07
STAR = 20      # front star size (px; 16 px = 1 block)
JET_LEN = 26   # side jet length forward from the muzzle
JET_H = 16     # side jet height
FRAMES = 8     # frames stacked vertically in tacz_flash_model.png (tools/make_flash_atlas.ps1), 128 px each
CMD = ("v.tacz_flash = q.life_time; v.tacz_flash_rot = math.random(0, 360); "
       f"v.tacz_flash_frame = math.random_integer(0, {FRAMES - 1});")


def with_flash_cmd(cur):
    """Timeline entry with our command, dropping any older version of it."""
    items = [] if cur is None else (cur if isinstance(cur, list) else [cur])
    items = [s for s in items if "v.tacz_flash =" not in s]
    return CMD if not items else items + [CMD]
OUT_GEO = os.path.join(RP, "models", "entity", "tacz_flash.geo.json")
OUT_RC = os.path.join(RP, "render_controllers", "tacz_flash.json")


def load(p):
    with open(p, encoding="utf-8") as f:
        return json.load(f)


def save(p, d, indent=1):
    with open(p, "w", encoding="utf-8") as f:
        json.dump(d, f, ensure_ascii=False, indent=indent)


def suppressed_from():
    text = open(WEAPONS_JS, encoding="utf-8").read()
    out = {}
    for m in re.finditer(r"\n  ([a-z0-9_]+): \{(.*?)\n  \},", text, re.S):
        s = re.search(r"suppressedFrom:\s*(\d+)", m.group(2))
        if s:
            out[m.group(1)] = int(s.group(1))
    return out


def flash_bones(geo):
    bones = {b["name"]: b for b in geo["bones"]}
    if "muzzle_flash" not in bones:
        return None
    chain, n = [], "muzzle_flash"
    while n:
        chain.append(n)
        n = bones[n].get("parent") if n in bones else None
    out = []
    for name in reversed(chain):
        b = bones[name]
        nb = {"name": name, "pivot": b.get("pivot", [0, 0, 0])}
        for k in ("parent", "rotation", "bind_pose_rotation"):
            if k in b:
                nb[k] = b[k]
        out.append(nb)
    px, py, pz = bones["muzzle_flash"].get("pivot", [0, 0, 0])
    star_uv = {"uv": [0, 0], "uv_size": [128, 128]}
    jet_uv = {"uv": [0, 0], "uv_size": [128, 128]}  # same frame, stretched along the barrel
    star = {"origin": [px - STAR / 2, py - STAR / 2, pz], "size": [STAR, STAR, 0],
            "uv": {"north": star_uv, "south": star_uv}}
    jet = {"origin": [px, py - JET_H / 2, pz - JET_LEN], "size": [0, JET_H, JET_LEN],
           "uv": {"east": jet_uv, "west": jet_uv}}
    out.append({"name": "tacz_flash", "parent": "muzzle_flash", "pivot": [px, py, pz], "cubes": [star, jet]})
    out.append({"name": "tacz_flash_h", "parent": "muzzle_flash", "pivot": [px, py, pz], "rotation": [0, 0, 90],
                "cubes": [dict(jet)]})
    return out


def main():
    entity_path = os.path.join(RP, "entity", "player.entity.json")
    entity = load(entity_path)
    desc = entity["minecraft:client_entity"]["description"]
    geo_map = desc["geometry"]
    rc_list = desc["render_controllers"]
    rc_cond = {list(e)[0]: list(e.values())[0] for e in rc_list if isinstance(e, dict)}

    # gun render controllers: geometry identifier -> [(controller name, entity condition)]
    by_geo = {}
    for f in glob.glob(os.path.join(RP, "render_controllers", "*.json")):
        if os.path.abspath(f) == os.path.abspath(OUT_RC):
            continue
        for name, rc in load(f).get("render_controllers", {}).items():
            g = rc.get("geometry", "")
            key = g.split(".", 1)[1] if g.lower().startswith("geometry.") else None
            if key in geo_map and name in rc_cond:
                by_geo.setdefault(geo_map[key], []).append((name, rc_cond[name]))

    supp = suppressed_from()
    geometries, controllers, entries, done = [], {}, [], []
    for f in sorted(glob.glob(os.path.join(RP, "models", "entity", "guns", "*.geo.json"))):
        gid = os.path.basename(f)[: -len(".geo.json")]
        geo = load(f)["minecraft:geometry"][0]
        bones = flash_bones(geo)
        ident = geo["description"]["identifier"]
        if not bones or ident not in by_geo:
            continue
        fid = f"tacz_flash_{gid}"
        geometries.append({"description": {"identifier": f"geometry.{fid}", "texture_width": 128, "texture_height": 128 * FRAMES,
                                           "visible_bounds_width": 6, "visible_bounds_height": 4,
                                           "visible_bounds_offset": [0, 1.5, 0]}, "bones": bones})
        geo_map[fid] = f"geometry.{fid}"
        controllers[f"controller.render.{fid}"] = {"geometry": f"Geometry.{fid}", "materials": [{"*": "Material.semi"}],
                                                   "textures": ["Texture.tacz_flash"],
                                                   "uv_anim": {"offset": [0.0, f"math.floor(v.tacz_flash_frame) / {FRAMES}"],
                                                               "scale": [1.0, 1.0]}}
        base = by_geo[ident][0][1]
        cond = f"({base}) && (q.life_time - v.tacz_flash) < {FLASH_SECONDS}"
        if gid in supp:
            cond += f" && (query.is_in_ui ? 0 : q.property('krep:muzzle')) < {supp[gid]}"
        entries.append({f"controller.render.{fid}": cond})
        done.append(gid)

    save(OUT_GEO, {"format_version": "1.12.0", "minecraft:geometry": geometries})
    save(OUT_RC, {"format_version": "1.8.0", "render_controllers": controllers})

    desc["textures"]["tacz_flash"] = "textures/particle/tacz_flash_model"
    desc["render_controllers"] = [e for e in rc_list if not (isinstance(e, dict) and list(e)[0].startswith("controller.render.tacz_flash_"))] + entries
    init = desc["scripts"].setdefault("initialize", [])
    init[:] = [s for s in init if "v.tacz_flash" not in s]
    init.append("v.tacz_flash = -10; v.tacz_flash_rot = 0; v.tacz_flash_frame = 0;")
    save(entity_path, entity, indent=2)

    # shoot animations of guns with a model flash: timeline + random spin, no flash particles
    anims_changed = 0
    for f in glob.glob(os.path.join(RP, "animations", "guns", "*.json")):
        gid = os.path.basename(f)[:-5]
        if gid not in done:
            continue
        d = load(f)
        changed = False
        for a in d["animations"].values():
            fx = a.get("particle_effects") or {}
            for key, lst in list(fx.items()):
                lst = lst if isinstance(lst, list) else [lst]
                if not any(e.get("effect") in ("krep.muzzleflash", "krep.muzzlejet") for e in lst):
                    continue
                keep = [e for e in lst if e.get("effect") not in ("krep.muzzleflash", "krep.muzzlejet")]
                if keep:
                    fx[key] = keep
                else:
                    del fx[key]
                tl = a.setdefault("timeline", {})
                tl[key] = with_flash_cmd(tl.get(key))
                a.setdefault("bones", {}).setdefault("muzzle_flash", {"rotation": [0, 0, "v.tacz_flash_rot"]})
                changed = True
            if "particle_effects" in a and not a["particle_effects"]:
                del a["particle_effects"]
        if changed:
            save(f, d)
            anims_changed += 1
    # Second pass: the animations the server actually plays on a shot (weapons.js shootAnimation, default
    # animation.<id>.shoot.sight / .nsight) get the flash timeline too, for guns that never had a flash particle.
    wtext = open(WEAPONS_JS, encoding="utf-8").read()
    played = {}
    for m in re.finditer(r"\n  ([a-z0-9_]+): \{(.*?)\n  \},", wtext, re.S):
        gid, body = m.group(1), m.group(2)
        s = re.search(r'shootAnimation:\s*\{\s*ads:\s*"([^"]+)",\s*hip:\s*"([^"]+)"', body)
        played[gid] = set(s.groups()) if s else {f"animation.{gid}.shoot.sight", f"animation.{gid}.shoot.nsight"}
    wanted = {name for gid, names in played.items() if gid in done for name in names}
    found, hooked = set(), 0
    for f in glob.glob(os.path.join(RP, "animations", "**", "*.json"), recursive=True):
        try:
            d = load(f)
        except Exception:
            continue
        changed = False
        for name, a in (d.get("animations") or {}).items():
            # refresh older versions of our command wherever they are
            for key, cur in list((a.get("timeline") or {}).items()):
                if "v.tacz_flash =" in json.dumps(cur) and CMD not in json.dumps(cur):
                    a["timeline"][key] = with_flash_cmd(cur)
                    changed = True
            if name not in wanted:
                continue
            found.add(name)
            tl = a.setdefault("timeline", {})
            if CMD in json.dumps(tl):
                continue
            tl["0.0"] = with_flash_cmd(tl.get("0.0"))
            a.setdefault("bones", {}).setdefault("muzzle_flash", {"rotation": [0, 0, "v.tacz_flash_rot"]})
            changed = True
            hooked += 1
        if changed:
            save(f, d)
    missing = sorted(wanted - found)
    print(f"played shoot animations hooked in this pass: {hooked}; not found: {missing}")
    print(f"model flash for {len(done)} guns; {anims_changed} animation files updated")
    print("guns:", " ".join(done))


if __name__ == "__main__":
    main()
