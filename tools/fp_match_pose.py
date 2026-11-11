"""Solve a gun's static first-person arm poses so they look like a reference gun's (pose matching).

    python -I tools/fp_match_pose.py <gun> <reference_gun> [--apply]

For guns whose arms are placed directly on the arm bones (rightArm / leftArm rotation + position, e.g. the M1911),
not through the hand bones. For each arm it searches rotation + position so that, seen from the first-person camera:
  * the hand lands where the reference gun's hand is, shifted by the offset between the two guns' grips
    (anchor = the reference's and the target's current RIGHT hand, i.e. the shooting hand on the grip),
  * the arm points the same way as the reference arm (hand -> shoulder direction),
  * the hand stays on the gun (gap to the nearest gun cube).
--apply writes the new rotation/position into every fp animation of the gun where the arm bone has the same static
pose as in fp.hold (the attachment preview .fp.view keeps its hidden arms).
"""
import importlib.util
import json
import math
import os
import random
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
spec = importlib.util.spec_from_file_location("audit", os.path.join(HERE, "fp_audit.py"))
au = importlib.util.module_from_spec(spec)
spec.loader.exec_module(au)
fp = au.fp
ENT = fp.load(os.path.join(fp.RP, "entity", "player.entity.json"))["minecraft:client_entity"]["description"]
CONDS = {list(e)[0]: list(e.values())[0] for e in ENT["render_controllers"] if isinstance(e, dict)}


def cam(p):
    x, y, z = p
    if fp.CAMERA["yaw180"]:
        x, z = -x, -z
    ex, ey, ez = fp.CAMERA["eye"]
    return [x - ex, y - ey, z - ez]


def setup(gun):
    arm_bones = fp.geometry(au.arm_model(gun, CONDS))
    gun_bones = fp.geometry(ENT["geometry"].get(gun, f"geometry.{gun}"))
    anim = json.loads(au._anim_json(au.fp_anims(gun)["fp.hold"]))
    return arm_bones, gun_bones, anim


def arm_points(arm_bones, anim, arm):
    aby = {b["name"]: b for b in arm_bones}
    m = fp.world_matrices(arm_bones, anim, 0)[arm]
    h, s = au.hand_point(aby[arm])
    return cam(fp.apply(m, h)), cam(fp.apply(m, s))


def gun_boxes(gun, gun_bones, anim):
    vis = fp.gun_visibility(gun)
    gby = {b["name"]: b for b in gun_bones}
    gm = fp.world_matrices(gun_bones, anim, 0)
    boxes = []
    for b in gun_bones:
        if b.get("cubes") and fp.visible_default(vis, b["name"], gby):
            for c in b["cubes"]:
                pts = [cam(q) for face in fp.cube_faces(c, gm[b["name"]]) for q in face]
                boxes.append(([min(q[i] for q in pts) for i in range(3)], [max(q[i] for q in pts) for i in range(3)]))
    return boxes


def unit(v):
    n = math.sqrt(sum(x * x for x in v)) or 1
    return [x / n for x in v]


def main():
    gun, ref = sys.argv[1], sys.argv[2]
    a_bones, g_bones, anim = setup(gun)
    ra_bones, _, ranim = setup(ref)
    boxes = gun_boxes(gun, g_bones, anim)
    anchor_t, _ = arm_points(a_bones, anim, "rightArm")
    anchor_r, _ = arm_points(ra_bones, ranim, "rightArm")
    shift = [anchor_t[i] - anchor_r[i] for i in range(3)]
    result = {}
    for arm in ("rightArm", "leftArm"):
        rh, rs = arm_points(ra_bones, ranim, arm)
        target_hand = [rh[i] + shift[i] for i in range(3)]
        target_dir = unit([rs[i] - rh[i] for i in range(3)])
        base = anim[arm]
        rot0, pos0 = list(base["rotation"]), list(base["position"])

        def cost(x):
            trial = dict(anim)
            trial[arm] = dict(base, rotation=x[:3], position=x[3:])
            h, s = arm_points(a_bones, trial, arm)
            gap = min(au.aabb_dist(h, bx) for bx in boxes)
            d = unit([s[i] - h[i] for i in range(3)])
            return (math.dist(h, target_hand) + 12 * math.dist(d, target_dir) + 8 * max(0, gap - 0.5)), gap

        best_x, best_c = rot0 + pos0, cost(rot0 + pos0)[0]
        random.seed(1)
        for restart in range(24):  # random restarts + shrinking coordinate search
            x = list(best_x) if restart == 0 else [random.uniform(-180, 180) for _ in range(3)] + [pos0[i] + random.uniform(-30, 30) for i in range(3)]
            c = cost(x)[0]
            step = [40, 40, 40, 8, 8, 8]
            while max(step) > 0.05:
                improved = False
                for i in range(6):
                    for sgn in (1, -1):
                        y = list(x)
                        y[i] += sgn * step[i]
                        cy = cost(y)[0]
                        if cy < c:
                            x, c, improved = y, cy, True
                if not improved:
                    step = [s / 2 for s in step]
            if c < best_c:
                best_x, best_c = x, c
        final_cost, gap = cost(best_x)
        rot = [round(v % 360 if v % 360 <= 180 else v % 360 - 360, 2) for v in best_x[:3]]
        pos = [round(v, 2) for v in best_x[3:]]
        result[arm] = {"rotation": rot, "position": pos, "old_rotation": rot0, "old_position": pos0}
        print(f"{arm}: rotation {rot0}->{rot}  position {pos0}->{pos}  cost {final_cost:.2f}  gap {gap:.2f}")
    if "--apply" in sys.argv:
        prefixes = {n.split(".fp.")[0] + ".fp." for n in au.fp_anims(gun).values()}
        path = os.path.join(fp.RP, "animations", "guns", f"{gun}.json")
        d = fp.load(path)
        n = 0
        for name, a in d["animations"].items():
            if not any(name.startswith(p) for p in prefixes) or name.endswith(".fp.view"):
                continue
            for arm, r in result.items():
                b = a.get("bones", {}).get(arm)
                if b and b.get("rotation") == r["old_rotation"] and b.get("position") == r["old_position"]:
                    b["rotation"], b["position"] = r["rotation"], r["position"]
                    n += 1
        with open(path, "w", encoding="utf-8") as f:
            json.dump(d, f, ensure_ascii=False, indent=1)
        print("applied to", n, "arm channels")


if __name__ == "__main__":
    main()
