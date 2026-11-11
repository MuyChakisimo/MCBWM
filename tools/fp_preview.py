"""First-person preview renderer for TACZ guns (no game needed).

Computes the pose of the gun model + the first-person arm model (taczuniversal*) for one animation at time t,
projects every cube face into a first-person camera and writes a list of polygons; tools/fp_render.ps1 draws them
to a PNG. Gun cubes gray, arm cubes skin-colored (left arm orange, right arm blue, so you can tell them apart).

    python -I tools/fp_preview.py <gun> [animation suffix=fp.hold] [time=0] [out=scratch json]

Bedrock conventions used (calibrated against an in-game AKM screenshot, see HANDOFF):
  bone local transform = T(anim position) * T(pivot) * R(rest + anim rotation) * S(anim scale) * T(-pivot)
  R = Rz(-z) * Ry(y) * Rx(-x)  (degrees, Bedrock values)   [CONV flags below]
"""
import json
import math
import os
import re
import sys

RP = os.environ.get("FP_RP") or os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "addons", "TACZ-R")
CONV = {"sx": -1, "sy": 1, "sz": -1}  # sign applied to each rotation axis (Bedrock -> math)
CAMERA = {"eye": [0, 26.5, 0], "fov": 70, "yaw180": True, "w": 960, "h": 540}


def load(p):
    with open(p, encoding="utf-8") as f:
        return json.load(f)


def geometry(identifier):
    for root, _, files in os.walk(os.path.join(RP, "models")):
        for f in files:
            if not f.endswith(".json"):
                continue
            try:
                d = load(os.path.join(root, f))
            except Exception:
                continue
            if identifier in d:
                return d[identifier]["bones"]
            for g in d.get("minecraft:geometry", []):
                if g["description"]["identifier"] == identifier:
                    return g["bones"]
    raise SystemExit(f"geometry {identifier} not found")


def mat_mul(a, b):
    return [[sum(a[i][k] * b[k][j] for k in range(4)) for j in range(4)] for i in range(4)]


def T(v):
    return [[1, 0, 0, v[0]], [0, 1, 0, v[1]], [0, 0, 1, v[2]], [0, 0, 0, 1]]


def S(s):
    return [[s[0], 0, 0, 0], [0, s[1], 0, 0], [0, 0, s[2], 0], [0, 0, 0, 1]]


def R(rot):
    x, y, z = (math.radians(rot[0] * CONV["sx"]), math.radians(rot[1] * CONV["sy"]), math.radians(rot[2] * CONV["sz"]))
    cx, sx, cy, sy, cz, sz = math.cos(x), math.sin(x), math.cos(y), math.sin(y), math.cos(z), math.sin(z)
    rx = [[1, 0, 0, 0], [0, cx, -sx, 0], [0, sx, cx, 0], [0, 0, 0, 1]]
    ry = [[cy, 0, sy, 0], [0, 1, 0, 0], [-sy, 0, cy, 0], [0, 0, 0, 1]]
    rz = [[cz, -sz, 0, 0], [sz, cz, 0, 0], [0, 0, 1, 0], [0, 0, 0, 1]]
    return mat_mul(rz, mat_mul(ry, rx))


def apply(m, p):
    return [m[0][0] * p[0] + m[0][1] * p[1] + m[0][2] * p[2] + m[0][3],
            m[1][0] * p[0] + m[1][1] * p[1] + m[1][2] * p[2] + m[1][3],
            m[2][0] * p[0] + m[2][1] * p[1] + m[2][2] * p[2] + m[2][3]]


def value(v, t):
    """A channel value: number / list / keyframes {"time": [..]}; Molang strings -> 0."""
    if isinstance(v, dict):
        frames = sorted((float(k), val) for k, val in v.items() if re.match(r"^[0-9.]+$", k))
        if not frames:
            return None
        prev = frames[0]
        for ft, fv in frames:
            if ft > t:
                break
            prev = (ft, fv)
        fv = prev[1]
        if isinstance(fv, dict):
            fv = fv.get("post") or fv.get("pre")
        return value(fv, t)
    if isinstance(v, (int, float)):
        return [v, v, v]
    if isinstance(v, list):
        return [x if isinstance(x, (int, float)) else 0 for x in v]
    return None


def anim_bones(name, t):
    for root, _, files in os.walk(os.path.join(RP, "animations")):
        for f in files:
            try:
                a = load(os.path.join(root, f)).get("animations", {})
            except Exception:
                continue
            if name in a:
                return a[name].get("bones", {})
    raise SystemExit(f"animation {name} not found")


def world_matrices(bones, anim, t):
    by = {b["name"]: b for b in bones}
    lower = {k.lower(): v for k, v in anim.items()}
    cache = {}

    def get(n):
        if n in cache:
            return cache[n]
        b = by[n]
        a = lower.get(n.lower(), {})
        pivot = b.get("pivot", [0, 0, 0])
        rot = [r + (value(a.get("rotation"), t) or [0, 0, 0])[i] for i, r in enumerate(b.get("rotation", [0, 0, 0]))]
        pos = value(a.get("position"), t) or [0, 0, 0]
        scl = value(a.get("scale"), t) or [1, 1, 1]
        local = mat_mul(T(pos), mat_mul(T(pivot), mat_mul(R(rot), mat_mul(S(scl), T([-p for p in pivot])))))
        parent = b.get("parent")
        m = mat_mul(get(parent), local) if parent in by else local
        cache[n] = m
        return m

    return {n: get(n) for n in by}


def cube_faces(c, m):
    o, s = c["origin"], c["size"]
    inf = c.get("inflate", 0)
    o = [o[i] - inf for i in range(3)]
    s = [s[i] + 2 * inf for i in range(3)]
    corners = [[o[0] + dx * s[0], o[1] + dy * s[1], o[2] + dz * s[2]] for dx in (0, 1) for dy in (0, 1) for dz in (0, 1)]
    if "rotation" in c:
        cp = c.get("pivot", [0, 0, 0])
        cm = mat_mul(T(cp), mat_mul(R(c["rotation"]), T([-p for p in cp])))
        corners = [apply(cm, p) for p in corners]
    corners = [apply(m, p) for p in corners]
    idx = [(0, 1, 3, 2), (4, 5, 7, 6), (0, 1, 5, 4), (2, 3, 7, 6), (0, 2, 6, 4), (1, 3, 7, 5)]
    return [[corners[i] for i in f] for f in idx]


def project(p):
    x, y, z = p
    if CAMERA["yaw180"]:
        x, z = -x, -z
    ex, ey, ez = CAMERA["eye"]
    x, y, z = x - ex, y - ey, z - ez
    # camera looks toward -z, screen right = -x (player's right side), up = +y
    depth = -z
    if depth <= 0.5:
        return None
    f = (CAMERA["h"] / 2) / math.tan(math.radians(CAMERA["fov"] / 2))
    return [CAMERA["w"] / 2 + (-x) * f / depth, CAMERA["h"] / 2 - y * f / depth, depth]


NEAR_PLANE = 0.6


def _depth(p):
    x, z = p[0], p[2]
    if CAMERA["yaw180"]:
        z = -z
    return -(z - CAMERA["eye"][2])


def clip_near(face):
    """Clip a polygon to the part in front of the camera (depth >= NEAR_PLANE), like the game does; faces that
    cross the camera plane are trimmed instead of dropped (an arm reaching past the camera is still drawn)."""
    out = []
    n = len(face)
    for i in range(n):
        a, b = face[i], face[(i + 1) % n]
        da, db = _depth(a) - NEAR_PLANE, _depth(b) - NEAR_PLANE
        if da >= 0:
            out.append(a)
        if (da >= 0) != (db >= 0):
            t = da / (da - db)
            out.append([a[k] + (b[k] - a[k]) * t for k in range(3)])
    return out


def gun_visibility(gun):
    """The gun render controller's part_visibility, evaluated for a default loadout (all attachment values 0 /
    'nothing'): bone -> True/False. Rough: a condition counts as true if it tests for 0 or 'nothing'."""
    out = {}
    path = os.path.join(RP, "render_controllers", f"gun_{gun}.json")
    if not os.path.exists(path):
        return out
    rc = load(path)["render_controllers"].get(f"controller.render.{gun}", {})
    for entry in rc.get("part_visibility", []):
        for bone, cond in entry.items():
            if isinstance(cond, bool):
                out[bone] = cond
            else:
                out[bone] = bool(re.search(r"==\s*0(?![.\d])|==\s*'nothing'|<\s*[1-9]", str(cond)))
    return out


def visible_default(vis, name, by):
    """A bone is drawn unless it or an ancestor is switched off."""
    n = name
    while n:
        if n in vis:
            return vis[n]
        n = by.get(n, {}).get("parent")
    return vis.get("*", True)


def main():
    gun = sys.argv[1]
    suffix = sys.argv[2] if len(sys.argv) > 2 else "fp.hold"
    t = float(sys.argv[3]) if len(sys.argv) > 3 else 0.0
    out = sys.argv[4] if len(sys.argv) > 4 else os.path.join(os.environ.get("TEMP", "."), f"fp_{gun}.json")
    ent = load(os.path.join(RP, "entity", "player.entity.json"))["minecraft:client_entity"]["description"]
    conds = {list(e)[0]: list(e.values())[0] for e in ent["render_controllers"] if isinstance(e, dict)}
    uni = None
    for k, c in conds.items():
        mm = re.match(r"controller\.render\.player\.universal(\d*)\.first_person", k)
        if mm and re.search(r"\bv(ariable)?\." + re.escape(gun) + r"\b", c):
            uni = "geometry.taczuniversal" + mm.group(1)
    gun_geo = ent["geometry"].get(gun, f"geometry.{gun}")
    vis = gun_visibility(gun)
    anim = anim_bones(f"animation.{gun}.{suffix}", t)
    polys = []
    for ident, kind in ((gun_geo, "gun"), (uni, "arm")):
        if not ident:
            continue
        bones = geometry(ident)
        mats = world_matrices(bones, anim, t)
        by = {b["name"]: b for b in bones}
        for b in bones:
            if kind == "arm" and b["name"] not in ("rightArm", "leftArm", "rightSleeve", "leftSleeve"):
                continue
            if kind == "gun" and not visible_default(vis, b["name"], by):
                continue
            color = {"rightArm": "#4a7bd0", "rightSleeve": "#3a62a8", "leftArm": "#e08a3a", "leftSleeve": "#b86a2a"}.get(b["name"], "#8a8f96")
            for c in b.get("cubes", []):
                for face in cube_faces(c, mats[b["name"]]):
                    pts = [project(p) for p in clip_near(face)]
                    if len(pts) < 3 or any(p is None for p in pts):
                        continue
                    polys.append({"d": sum(p[2] for p in pts) / len(pts), "c": color, "p": [[round(p[0], 1), round(p[1], 1)] for p in pts]})
    polys.sort(key=lambda p: -p["d"])
    with open(out, "w") as f:
        json.dump({"w": CAMERA["w"], "h": CAMERA["h"], "title": f"{gun} {suffix} t={t}", "polys": polys}, f)
    print(out, len(polys), "faces; arm model", uni)


if __name__ == "__main__":
    main()
