"""Automated first-person hand audit for every TACZ gun (uses tools/fp_preview.py's math).

For each gun and each first-person animation (hold, sight, sprint, reload*, tac, inspect*) sampled at several
times, it measures for BOTH arms of the first-person arm model (taczuniversal*):
  gap   distance (model px, 16 = 1 block) from the hand (end of the arm cube) to the nearest visible gun cube.
        <= GAP_OK counts as "on the gun".
  cam   the arm passes through / behind the camera (the double-barrel bug: a giant block on screen).
  vis   the hand is on screen.
Writes a CSV + prints a per-gun summary. Usage:
    python -I tools/fp_audit.py [category|gun ...]        e.g.  python -I tools/fp_audit.py pistol
Categories come from TACZ-B/scripts/config/weapons.js (`category`). Rules: HANDOFF.md "NEXT UP" (both hands on
every gun). Notes: reloads legitimately take a hand off the gun for a moment (to the mag / shells), so look at
`hold` / `sight` / `sprint` first, and at reloads for `cam` and for hands that never come back.
"""
import csv
import functools
import importlib.util
import json
import math
import os
import re
import subprocess
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
spec = importlib.util.spec_from_file_location("fp", os.path.join(HERE, "fp_preview.py"))
fp = importlib.util.module_from_spec(spec)
spec.loader.exec_module(fp)
fp.geometry = functools.lru_cache(None)(fp.geometry)
_anim_json = functools.lru_cache(None)(lambda name: json.dumps(fp.anim_bones(name, 0)))

GAP_OK = 2.0
ANIMS = ["fp.hold", "fp.sight", "fp.sprint", "fp.reload", "fp.reload1", "fp.tac", "fp.reload_tac", "fp.inspect"]
SAMPLES = 6


def weapons_by_category():
    out = json.loads(subprocess.check_output(["node", os.path.join(HERE, "read_js_config.js"),
                                              os.path.join(HERE, "..", "addons", "TACZ-B", "scripts", "config", "weapons.js")]))
    weapons = out.get("WEAPONS") or {}
    if not weapons:  # fallback: scan the file
        text = open(os.path.join(HERE, "..", "addons", "TACZ-B", "scripts", "config", "weapons.js"), encoding="utf-8").read()
        for m in re.finditer(r"\n  ([a-z0-9_]+): \{\s*\n\s*name: \"([^\"]*)\",\s*\n\s*category: \"([a-z]+)\"", text):
            weapons[m.group(1)] = {"name": m.group(2), "category": m.group(3)}
    return {gid: w for gid, w in weapons.items() if isinstance(w, dict) and w.get("category")}


def all_animations():
    names = {}
    for root, _, files in os.walk(os.path.join(fp.RP, "animations")):
        for f in files:
            try:
                for n, a in fp.load(os.path.join(root, f)).get("animations", {}).items():
                    names[n] = a.get("animation_length", 0)
            except Exception:
                pass
    return names


all_animations_cached = functools.lru_cache(None)(lambda: all_animations())


STATE_SUFFIX = {"hold": "fp.hold", "sight": "fp.sight", "sprint": "fp.sprint", "reload": "fp.reload",
                "reloadtac": "fp.tac", "reload1": "fp.reload1", "inspect": "fp.inspect"}


@functools.lru_cache(None)
def fp_anims(gun):
    """state suffix -> animation name actually played in first person, read from the gun's fp animation controller
    (controller.animation.<gun>.fp); falls back to animation.<gun>.<suffix>. Some guns reuse others' animations
    (deagleg -> deagle) or other names (b93 -> b93r)."""
    ent = fp.load(os.path.join(fp.RP, "entity", "player.entity.json"))["minecraft:client_entity"]["description"]
    amap = ent["animations"]
    out = {}
    for root, _, files in os.walk(os.path.join(fp.RP, "animation_controllers")):
        for f in files:
            try:
                acs = fp.load(os.path.join(root, f)).get("animation_controllers", {})
            except Exception:
                continue
            c = acs.get(f"controller.animation.{gun}.fp")
            if not c:
                continue
            for state, s in c.get("states", {}).items():
                suffix = STATE_SUFFIX.get(state)
                if not suffix or suffix in out:
                    continue
                for a in s.get("animations", []):
                    key = list(a)[0] if isinstance(a, dict) else a
                    name = amap.get(key, "")
                    if name.startswith("animation.") and ".fp." in name:
                        out[suffix] = name
                        break
    names = all_animations_cached()
    for suffix in ANIMS:
        out.setdefault(suffix, f"animation.{gun}.{suffix}")
    return {k: v for k, v in out.items() if v in names}


def arm_model(gun, conds):
    for k, c in conds.items():
        mm = re.match(r"controller\.render\.player\.universal(\d*)\.first_person", k)
        if mm and re.search(r"\bv(ariable)?\." + re.escape(gun) + r"\b", c):
            return "geometry.taczuniversal" + mm.group(1)
    return None


def hand_point(bone):
    """Hand end of an arm: the bottom-center of its first cube (arms hang down at rest)."""
    c = bone["cubes"][0]
    o, s = c["origin"], c["size"]
    return [o[0] + s[0] / 2, o[1], o[2] + s[2] / 2], [o[0] + s[0] / 2, o[1] + s[1], o[2] + s[2] / 2]


NEAR = 6.0  # px: closer than this to the eye and on screen = a giant block in view (the double-barrel bug)


def near_camera(corners):
    """True if part of the arm is within NEAR px of the eye inside the view (sampled along the cube edges).
    An arm whose shoulder is simply behind the camera (normal for the grip arm) does not count."""
    w, h = fp.CAMERA["w"], fp.CAMERA["h"]
    f = (h / 2) / math.tan(math.radians(fp.CAMERA["fov"] / 2))
    ex, ey, ez = fp.CAMERA["eye"]
    pts = []
    for i in range(len(corners)):
        for j in range(i + 1, len(corners)):
            a, b = corners[i], corners[j]
            pts += [[a[k] + (b[k] - a[k]) * s / 8 for k in range(3)] for s in range(9)]
    for x, y, z in pts:
        if fp.CAMERA["yaw180"]:
            x, z = -x, -z
        x, y, z = x - ex, y - ey, z - ez
        depth = -z
        if 0.5 < depth < NEAR:
            sx, sy = w / 2 + (-x) * f / depth, h / 2 - y * f / depth
            if 0 <= sx <= w and 0 <= sy <= h:
                return True
    return False


def arm_connected(m, bone):
    """Follow the arm from the hand to the shoulder on screen. A proper first-person arm runs off a screen edge.
    Returns 'ok', 'hand-offscreen' (not visible, fine), 'stub' (ends mid-screen: floating arm) or
    'camera' (reaches the camera while still on screen: the giant block)."""
    w, h = fp.CAMERA["w"], fp.CAMERA["h"]
    hand_local, shoulder_local = hand_point(bone)
    hp = fp.project(fp.apply(m, hand_local))
    if not hp or not (0 <= hp[0] <= w and 0 <= hp[1] <= h):
        return "hand-offscreen"
    for s in range(1, 41):
        k = s / 40
        p = fp.apply(m, [hand_local[i] + (shoulder_local[i] - hand_local[i]) * k for i in range(3)])
        q = fp.project(p)
        if q is None:
            return "camera"
        if not (0 <= q[0] <= w and 0 <= q[1] <= h):
            return "ok"
    return "stub"


def aabb_dist(p, box):
    lo, hi = box
    return math.sqrt(sum(max(lo[i] - p[i], 0, p[i] - hi[i]) ** 2 for i in range(3)))


def audit_gun(gun, ent, anims_len):
    conds = {list(e)[0]: list(e.values())[0] for e in ent["render_controllers"] if isinstance(e, dict)}
    uni = arm_model(gun, conds)
    gun_ident = ent["geometry"].get(gun, f"geometry.{gun}")
    rows = []
    if not uni:
        return [{"gun": gun, "anim": "-", "t": "", "arm": "-", "issue": "NO first-person arm model"}]
    try:
        gun_bones = fp.geometry(gun_ident)
        arm_bones = fp.geometry(uni)
    except SystemExit as e:
        return [{"gun": gun, "anim": "-", "t": "", "arm": "-", "issue": str(e)}]
    vis = fp.gun_visibility(gun)
    gby = {b["name"]: b for b in gun_bones}
    aby = {b["name"]: b for b in arm_bones}
    arms = [a for a in ("rightArm", "leftArm") if a in aby and aby[a].get("cubes")]
    for suffix, name in fp_anims(gun).items():
        if name not in anims_len:
            continue
        length = float(anims_len[name] or 0)
        times = [0.0] if suffix in ("fp.hold", "fp.sprint") or length <= 0 else [round(length * i / (SAMPLES - 1), 3) for i in range(SAMPLES)]
        if suffix == "fp.sight":
            times = [round(max(length, 0.3), 3)]
        anim = json.loads(_anim_json(name))
        for t in times:
            gm = fp.world_matrices(gun_bones, anim, t)
            boxes = []
            for b in gun_bones:
                if not b.get("cubes") or not fp.visible_default(vis, b["name"], gby):
                    continue
                for c in b["cubes"]:
                    pts = [p for face in fp.cube_faces(c, gm[b["name"]]) for p in face]
                    boxes.append(([min(p[i] for p in pts) for i in range(3)], [max(p[i] for p in pts) for i in range(3)]))
            am = fp.world_matrices(arm_bones, anim, t)
            for arm in arms:
                hand_local, shoulder_local = hand_point(aby[arm])
                hand = fp.apply(am[arm], hand_local)
                gap = min((aabb_dist(hand, bx) for bx in boxes), default=999)
                corners = [p for face in fp.cube_faces(aby[arm]["cubes"][0], am[arm]) for p in face]
                cam = near_camera(corners)
                conn = arm_connected(am[arm], aby[arm])
                hp = fp.project(hand)
                onscreen = bool(hp and 0 <= hp[0] <= fp.CAMERA["w"] and 0 <= hp[1] <= fp.CAMERA["h"])
                scale = (anim.get(arm) or {}).get("scale")
                hidden = scale == 0 or scale == [0, 0, 0]
                rows.append({"gun": gun, "anim": suffix, "t": t, "arm": "fore-end(R)" if arm == "rightArm" else "grip(L)",
                             "gap": round(gap, 1), "cam": cam, "conn": conn, "onscreen": onscreen, "hidden": hidden})
    return rows


def main():
    want = sys.argv[1:]
    weapons = weapons_by_category()
    ent = fp.load(os.path.join(fp.RP, "entity", "player.entity.json"))["minecraft:client_entity"]["description"]
    anims_len = all_animations()
    guns = [g for g, w in weapons.items() if not want or g in want or w["category"] in want]
    out_rows = []
    print(f"{'gun':16}{'cat':8}{'anim':14}{'fore-end(R) gap':>16}{'grip(L) gap':>13}  flags")
    for g in guns:
        rows = audit_gun(g, ent, anims_len)
        out_rows += rows
        by_anim = {}
        for r in rows:
            by_anim.setdefault(r["anim"], []).append(r)
        for a, rs in by_anim.items():
            if a == "-":
                print(f"{g:16}{weapons[g]['category']:8}{rs[0]['issue']}")
                continue
            def worst(arm):
                v = [r["gap"] for r in rs if r["arm"] == arm and not r["hidden"]]
                return f"{min(v):.1f}-{max(v):.1f}" if v else "hidden"
            flags = []
            for arm in ("fore-end(R)", "grip(L)"):
                if any(r["cam"] and not r["hidden"] for r in rs if r["arm"] == arm):
                    flags.append(f"{arm} NEAR-CAMERA")
                bad = sorted({r["conn"] for r in rs if r["arm"] == arm and not r["hidden"] and r["conn"] in ("stub", "camera")})
                if bad:
                    flags.append(f"{arm} {'/'.join(bad).upper()}")
            if a in ("fp.hold", "fp.sight", "fp.sprint"):
                for arm in ("fore-end(R)", "grip(L)"):
                    v = [r["gap"] for r in rs if r["arm"] == arm and not r["hidden"]]
                    if v and min(v) > GAP_OK:
                        flags.append(f"{arm} OFF GUN")
            print(f"{g:16}{weapons[g]['category']:8}{a:14}{worst('fore-end(R)'):>16}{worst('grip(L)'):>13}  {' '.join(flags)}")
    path = os.path.join(HERE, "fp_audit.csv")
    with open(path, "w", newline="") as f:
        w = csv.DictWriter(f, fieldnames=["gun", "anim", "t", "arm", "gap", "cam", "conn", "onscreen", "hidden", "issue"])
        w.writeheader()
        w.writerows(out_rows)
    print("csv:", path)


if __name__ == "__main__":
    main()
