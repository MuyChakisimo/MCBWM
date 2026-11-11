"""Mounts the Java-style attachments (scopes, muzzles, grips, stocks, lasers) on their gun. Idempotent.

Why: each attachment model in TACZ-R/models/entity/attachments/ has a root bone `tacz_att_root` with
"binding": "'scope_pos'" (etc.). Bedrock only honors `binding` for attachables (held items), not for extra
geometries drawn on the player, so the attachment was never placed on the gun (user, 2026-11-08: M4A1 coyote sight
invisible).

What this does, per gun with Java attachments (config/javaAttachments.js GUN_ATTACHMENTS; today only the M4A1):
  geometry.tacz_att_<gun>.<attachment> = the gun's bone chain root..<slot>_pos (same names / pivots / rotations, so
  every gun animation moves it) + the attachment's bones hung under <slot>_pos and moved by that bone's pivot (the
  attachment models are built around their mount point). The player's geometry keys att_<attachment> then point at
  these, so render_controllers/tacz_attachments.json works unchanged.
If a second gun ever gets Java attachments, the att_<attachment> keys need to become per gun (see TODO below).
Run:  python -I tools/gen_java_attachments.py      (then deploy.ps1)
"""
import json
import os
import subprocess

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "addons")
RP = os.path.join(ROOT, "TACZ-R")
CONFIG = os.path.join(ROOT, "TACZ-B", "scripts", "config", "javaAttachments.js")
OUT = os.path.join(RP, "models", "entity", "tacz_att_mounted.geo.json")


def load(p):
    with open(p, encoding="utf-8") as f:
        return json.load(f)


def js_config():
    helper = os.path.join(os.path.dirname(os.path.abspath(__file__)), "read_js_config.js")
    return json.loads(subprocess.check_output(["node", helper, CONFIG]))


def add(v, p):
    return [v[0] + p[0], v[1] + p[1], v[2] + p[2]]


def main():
    cfg = js_config()
    guns = cfg["GUN_ATTACHMENTS"]
    info = cfg["ATTACHMENT_INFO"]
    if len(guns) != 1:
        raise SystemExit(f"TODO: {len(guns)} guns with Java attachments; make att_<id> geometry keys per gun first")
    att_models = {}
    for f in os.listdir(os.path.join(RP, "models", "entity", "attachments")):
        g = load(os.path.join(RP, "models", "entity", "attachments", f))["minecraft:geometry"][0]
        att_models[g["description"]["identifier"].split(".", 2)[-1]] = g

    geometries, keys = [], {}
    for gun, slots in guns.items():
        gb = {b["name"]: b for b in load(os.path.join(RP, "models", "entity", "guns", f"{gun}.geo.json"))["minecraft:geometry"][0]["bones"]}
        for slot, ids in slots.items():
            mount = f"{slot}_pos"
            chain, n = [], mount
            while n and n in gb:
                chain.append(n)
                n = gb[n].get("parent")
            P = gb[mount].get("pivot", [0, 0, 0])
            for att in ids:
                src = att_models.get(att)
                if not src or info.get(att, {}).get("type") != slot:
                    print("skip", gun, slot, att)
                    continue
                bones = []
                for name in reversed(chain):
                    b = gb[name]
                    nb = {"name": name, "pivot": b.get("pivot", [0, 0, 0])}
                    for k in ("parent", "rotation"):
                        if k in b:
                            nb[k] = b[k]
                    bones.append(nb)
                taken = {b["name"] for b in bones}
                for b in src["bones"]:
                    if b["name"] in taken:
                        raise SystemExit(f"bone name clash {gun}/{att}: {b['name']}")
                    nb = json.loads(json.dumps(b))
                    nb.pop("binding", None)
                    if not nb.get("parent"):
                        nb["parent"] = mount
                    nb["pivot"] = add(nb.get("pivot", [0, 0, 0]), P)
                    for c in nb.get("cubes", []):
                        c["origin"] = add(c["origin"], P)
                        if "pivot" in c:
                            c["pivot"] = add(c["pivot"], P)
                    loc = nb.get("locators")
                    if isinstance(loc, dict):
                        nb["locators"] = {k: (add(v, P) if isinstance(v, list) else dict(v, offset=add(v["offset"], P)))
                                          for k, v in loc.items()}
                    bones.append(nb)
                ident = f"geometry.tacz_att_{gun}.{att}"
                desc = dict(src["description"], identifier=ident, visible_bounds_width=6, visible_bounds_height=4,
                            visible_bounds_offset=[0, 1.5, 0])
                geometries.append({"description": desc, "bones": bones})
                keys[f"att_{att}"] = ident

    with open(OUT, "w", encoding="utf-8") as f:
        json.dump({"format_version": "1.12.0", "minecraft:geometry": geometries}, f, ensure_ascii=False, indent=1)
    entity_path = os.path.join(RP, "entity", "player.entity.json")
    entity = load(entity_path)
    geo_map = entity["minecraft:client_entity"]["description"]["geometry"]
    changed = 0
    for k, v in keys.items():
        if k in geo_map and geo_map[k] != v:
            geo_map[k] = v
            changed += 1
    with open(entity_path, "w", encoding="utf-8") as f:
        json.dump(entity, f, ensure_ascii=False, indent=2)
    print(f"{len(geometries)} mounted attachment geometries; {changed} player geometry keys repointed")


if __name__ == "__main__":
    main()
