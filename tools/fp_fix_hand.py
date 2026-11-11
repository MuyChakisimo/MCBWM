"""Find (and optionally apply) a position offset for one first-person hand of a gun.

    python -I tools/fp_fix_hand.py <gun> <grip|fore> [--apply] [--delta dx dy dz]

A hand bone's position offset moves the whole arm by the same vector whatever its rotation, so one delta added to
every first-person keyframe of that bone keeps all animations (hold, aim, reloads, inspect) consistent.
Search goal, over fp.hold / fp.sight / fp.sprint: the hand within GAP_OK of a gun cube, no part of the arm near the
camera in view (fp_audit.near_camera), and the smallest change. --delta skips the search (e.g. to revert).
Writes the TACZ-R animation file only with --apply; then re-run tools/fp_audit.py and render to verify.
"""
import importlib.util
import itertools
import json
import math
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
spec = importlib.util.spec_from_file_location("audit", os.path.join(HERE, "fp_audit.py"))
au = importlib.util.module_from_spec(spec)
spec.loader.exec_module(au)
fp = au.fp

POSES = ["fp.hold", "fp.sight", "fp.sprint"]
EVAL_STUB = [False]  # last evaluate(): an arm ended mid-screen / went into the camera
ROT = None  # --rot rx ry rz: also set this rotation on the bone (static poses only)


def hand_bone(arm_bones, arm):
    """The bone that carries `arm` (its hand_pos parent's parent), e.g. rightArm -> lefthand / leftHand."""
    by = {b["name"]: b for b in arm_bones}
    pos = by[arm].get("parent")
    return by[pos].get("parent") if pos in by else None


def evaluate(gun, ent, arm, bone, delta):
    conds = {list(e)[0]: list(e.values())[0] for e in ent["render_controllers"] if isinstance(e, dict)}
    uni = au.arm_model(gun, conds)
    gun_bones, arm_bones = fp.geometry(ent["geometry"].get(gun, f"geometry.{gun}")), fp.geometry(uni)
    vis = fp.gun_visibility(gun)
    gby = {b["name"]: b for b in gun_bones}
    aby = {b["name"]: b for b in arm_bones}
    worst_gap, near, hold_depth = 0.0, False, None
    names = au.all_animations_cached()
    played = au.fp_anims(gun)
    stub = False
    for pose in POSES:
        suffix, _, at = pose.partition("@")
        name = played.get(suffix)
        if not name or name not in names:
            continue
        anim = json.loads(au._anim_json(name))
        t = float(at) if at else (0.0 if suffix != "fp.sight" else max(float(names[name] or 0), 0.3))
        key = next((k for k in anim if k.lower() == bone.lower()), None)
        if key and "position" in anim[key]:
            anim[key] = dict(anim[key], position=shift(anim[key]["position"], delta))
        if key and ROT is not None:
            anim[key] = dict(anim[key], rotation=ROT)
        gm = fp.world_matrices(gun_bones, anim, t)
        boxes = []
        for b in gun_bones:
            if b.get("cubes") and fp.visible_default(vis, b["name"], gby):
                for c in b["cubes"]:
                    pts = [q for face in fp.cube_faces(c, gm[b["name"]]) for q in face]
                    boxes.append(([min(q[i] for q in pts) for i in range(3)], [max(q[i] for q in pts) for i in range(3)]))
        am = fp.world_matrices(arm_bones, anim, t)
        hand_local, _ = au.hand_point(aby[arm])
        hand = fp.apply(am[arm], hand_local)
        if suffix == "fp.hold":
            hp = fp.project(hand)
            hold_depth = hp[2] if hp else 0.0
        worst_gap = max(worst_gap, min(au.aabb_dist(hand, bx) for bx in boxes))
        corners = [q for face in fp.cube_faces(aby[arm]["cubes"][0], am[arm]) for q in face]
        near = near or au.near_camera(corners)
        stub = stub or au.arm_connected(am[arm], aby[arm]) in ("stub", "camera")
    EVAL_STUB[0] = stub
    return worst_gap, near, hold_depth


def shift(v, d):
    if isinstance(v, list) and len(v) == 3 and all(isinstance(x, (int, float)) for x in v):
        return [round(v[i] + d[i], 5) for i in range(3)]
    if isinstance(v, dict):
        return {k: (x if k == "lerp_mode" else shift(x, d)) for k, x in v.items()}
    return v


def apply_rotation(gun, bone, old_rot, new_rot):
    """Sets new_rot where the bone's static rotation equals old_rot (the pose being fixed), in the gun's fp family."""
    prefixes = {n.split(".fp.")[0] + ".fp." for n in au.fp_anims(gun).values()}
    path = next(os.path.join(r, f) for r, _, fs in os.walk(os.path.join(fp.RP, "animations")) for f in fs
                if any(p in json.dumps(list(fp.load(os.path.join(r, f)).get("animations", {}).keys())) for p in prefixes))
    d = fp.load(path)
    n = 0
    for name, a in d["animations"].items():
        if any(name.startswith(p) for p in prefixes) and not name.endswith(".fp.view"):
            b = a.get("bones", {}).get(bone)
            if b and b.get("rotation") == old_rot:
                b["rotation"] = new_rot
                n += 1
    with open(path, "w", encoding="utf-8") as f:
        json.dump(d, f, ensure_ascii=False, indent=1)
    return n


def apply(gun, bone, delta, only=None):
    """Adds delta to the hand bone in every first-person animation of the gun's animation family (the prefix of
    the animations its fp controller plays, e.g. animation.b93r.fp.*), except the attachment preview (.fp.view)."""
    prefixes = {n.split(".fp.")[0] + ".fp." for n in au.fp_anims(gun).values()}
    path = next(os.path.join(r, f) for r, _, fs in os.walk(os.path.join(fp.RP, "animations")) for f in fs
                if any(p in json.dumps(list(fp.load(os.path.join(r, f)).get("animations", {}).keys())) for p in prefixes))
    d = fp.load(path)
    n = 0
    for name, a in d["animations"].items():
        if not any(name.startswith(p) for p in prefixes) or name.endswith(".fp.view"):
            continue
        if only and name != au.fp_anims(gun).get(only):
            continue
        for k, b in a.get("bones", {}).items():
            if k.lower() == bone.lower() and "position" in b:
                b["position"] = shift(b["position"], delta)
                n += 1
    with open(path, "w", encoding="utf-8") as f:
        json.dump(d, f, ensure_ascii=False, indent=1)
    return n


def main():
    gun, which = sys.argv[1], sys.argv[2]
    arm = {"grip": "leftArm", "fore": "rightArm"}.get(which, which)  # or pass the arm name: rightArm / leftArm
    ent = fp.load(os.path.join(fp.RP, "entity", "player.entity.json"))["minecraft:client_entity"]["description"]
    conds = {list(e)[0]: list(e.values())[0] for e in ent["render_controllers"] if isinstance(e, dict)}
    bone = hand_bone(fp.geometry(au.arm_model(gun, conds)), arm)
    if "--bone" in sys.argv:  # move another bone of the chain instead (e.g. the arm itself when it carries the pose)
        bone = sys.argv[sys.argv.index("--bone") + 1]
    global ROT, POSES
    if "--poses" in sys.argv:
        POSES = sys.argv[sys.argv.index("--poses") + 1].split(",")
    only = sys.argv[sys.argv.index("--only") + 1] if "--only" in sys.argv else None
    if "--rot" in sys.argv:
        i = sys.argv.index("--rot")
        ROT = [float(x) for x in sys.argv[i + 1:i + 4]]
    big = "--wide" in sys.argv  # search a 3x wider box (for poses that are far off)
    allow_near = "--allow-near" in sys.argv  # pistols sit close to the face: near-camera is normal there
    min_depth = float(sys.argv[sys.argv.index("--min-depth") + 1]) if "--min-depth" in sys.argv else 0.0
    before = evaluate(gun, ent, arm, bone, [0, 0, 0])
    print(f"{gun} {which} hand bone {bone}: now gap {before[0]:.1f} near-camera {before[1]} hold depth {before[2]}")

    def cost_of(d):
        gap, near, depth = evaluate(gun, ent, arm, bone, d)
        return ((500 if EVAL_STUB[0] else 0) + max(0, gap - 0.5) * 10 + (0 if allow_near else (1000 if near else 0)) + max(0, min_depth - (depth or 0)) * 20
                + math.sqrt(d[0] ** 2 + d[1] ** 2 + d[2] ** 2) * 0.2)
    if "--delta" in sys.argv:
        i = sys.argv.index("--delta")
        best = (0, [float(x) for x in sys.argv[i + 1:i + 4]])
    else:
        best = None
        sx, sy, sz = (range(-30, 31, 3), range(-6, 46, 3), range(-30, 31, 3)) if big else (range(-10, 11, 2), range(-12, 13, 2), range(-14, 15, 2))
        for dx, dy, dz in itertools.product(sx, sy, sz):
            cost = cost_of([dx, dy, dz])
            if best is None or cost < best[0]:
                best = (cost, [dx, dy, dz])
        # refine around the best in 1 px steps
        bx, by_, bz = best[1]
        for dx, dy, dz in itertools.product(range(bx - 2, bx + 3), range(by_ - 2, by_ + 3), range(bz - 2, bz + 3)):
            cost = cost_of([dx, dy, dz])
            if cost < best[0]:
                best = (cost, [dx, dy, dz])
    after = evaluate(gun, ent, arm, bone, best[1])
    print(f"delta {best[1]} -> gap {after[0]:.1f} near-camera {after[1]} hold depth {after[2]}")
    if "--apply" in sys.argv:
        if ROT is not None:
            hold = json.loads(au._anim_json(au.fp_anims(gun)["fp.hold"]))
            old_rot = next(v.get("rotation") for k, v in hold.items() if k.lower() == bone.lower())
            print("rotation set in", apply_rotation(gun, bone, old_rot, ROT), "animations")
        print("applied to", apply(gun, bone, best[1], only), "channels")


if __name__ == "__main__":
    main()
