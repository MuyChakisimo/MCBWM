"""Writes the client-side player ragdoll animation (animation.tacz.ragdoll) and hooks it on the player.

Server side: TACZ-B/scripts/combat/ragdoll.js sets krep:rd_dir / krep:rd_var (see the comment there).
Here: everything is computed in Molang from those two numbers + q.anim_time, so it runs at full frame rate.
  fall      the whole body tips about the feet (root bone) toward rd_dir, accelerating like gravity, lands at
            t = FALL_SECONDS (faster for strong hits), bounces a little.
  limbs     arms fly up while falling (lag), flop on landing (fl), splay out; legs kick; head snaps back on a
            headshot; per-death randomness from the seed.
Tuning: change the constants / SIGN_* below, re-run, deploy.
    python -I tools/gen_ragdoll_anim.py
"""
import json
import os

RP = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "addons", "TACZ-R")
OUT = os.path.join(RP, "animations", "tacz_ragdoll.animation.json")
ENTITY = os.path.join(RP, "entity", "player.entity.json")

FALL_SECONDS = 0.6      # time to hit the ground at strength 0 (each strength step is 0.04 s faster)
SIGN_FORWARD = 1        # flip if a body shot from behind falls backward instead of forward
SIGN_SIDE = -1          # flip if bodies fall toward the side the shot came from
ARM_OUT = 1             # flip if arms splay into the body instead of outward

P = ("t.v = q.property('krep:rd_var'); t.hs = math.mod(t.v, 2); t.st = math.mod(math.floor(t.v / 2), 8); "
     "t.sd = math.mod(math.floor(t.v / 16), 32); t.mx = (math.floor(t.v / 512) + 1) * 11.25; "
     f"t.T = {FALL_SECONDS} - t.st * 0.04; t.t = q.anim_time; t.f = math.clamp(t.t / t.T, 0, 1); "
     "t.d = math.max(0, t.t - t.T); t.land = (t.t > t.T) ? 1 : 0; "
     "t.th = t.mx * t.f * t.f - t.land * 6 * math.exp(-7 * t.d) * math.sin(t.d * 1100); "
     "t.lag = math.sin(t.f * 180); t.fl = t.land * math.exp(-5 * t.d) * math.cos(t.d * 800); "
     "t.amp = 0.7 + t.st * 0.08; t.r = q.property('krep:rd_dir') - 1; ")


def s(k):
    """Per-death random 0..1 from the seed (k picks a different one)."""
    return f"(math.mod(t.sd * {k} + {k * 3 + 1}, 17) / 17)"


def e(body):
    return P + "return " + body + ";"


bones = {
    "root": {
        "rotation": [e(f"{SIGN_FORWARD} * t.th * math.cos(t.r)"), 0, e(f"{SIGN_SIDE} * t.th * math.sin(t.r)")],
        "position": [0, e("2 * t.f * t.mx / 90"), 0],
    },
    "body": {"rotation": [e("8 * t.lag"), e(f"({s(2)} - 0.5) * 24 * t.f"), 0]},
    "head": {
        "rotation": [
            e("(t.hs > 0) ? (-55 * math.sin(math.clamp(t.t / 0.3, 0, 1) * 180) + 15 * t.f) : (20 * t.f + 10 * t.fl)"),
            e(f"({s(1)} - 0.5) * 70 * t.f"),
            0,
        ]
    },
    "rightArm": {"rotation": [e(f"-(60 + 50 * {s(3)}) * t.lag * t.amp - 15 * t.f + 22 * t.fl"), 0,
                              e(f"{ARM_OUT} * (15 + 55 * {s(4)}) * t.f")]},
    "leftArm": {"rotation": [e(f"-(60 + 50 * {s(5)}) * t.lag * t.amp - 15 * t.f - 22 * t.fl"), 0,
                             e(f"-{ARM_OUT} * (15 + 55 * {s(6)}) * t.f")]},
    "rightLeg": {"rotation": [e(f"(20 + 25 * {s(7)}) * t.lag * t.amp - 12 * t.fl - 8 * t.f"), 0,
                              e(f"{ARM_OUT} * (4 + 14 * {s(8)}) * t.f")]},
    "leftLeg": {"rotation": [e(f"-(10 + 25 * {s(9)}) * t.lag * t.amp + 12 * t.fl + 6 * t.f"), 0,
                             e(f"-{ARM_OUT} * (4 + 14 * {s(10)}) * t.f")]},
}

anim = {
    "format_version": "1.8.0",
    "animations": {
        "animation.tacz.ragdoll": {
            "loop": "hold_on_last_frame",
            "animation_length": 30,
            "override_previous_animation": True,
            "bones": bones,
        }
    },
}
with open(OUT, "w", encoding="utf-8") as f:
    json.dump(anim, f, indent=1)

with open(ENTITY, encoding="utf-8") as f:
    entity = json.load(f)
desc = entity["minecraft:client_entity"]["description"]
desc["animations"]["tacz_ragdoll"] = "animation.tacz.ragdoll"
animate = desc["scripts"].setdefault("animate", [])
animate[:] = [a for a in animate if not (isinstance(a, dict) and "tacz_ragdoll" in a)]
# Last, so its override wins over every gun / walk animation.
animate.append({"tacz_ragdoll": "(query.is_in_ui ? 0 : q.property('krep:rd_dir')) > 0"})
with open(ENTITY, "w", encoding="utf-8") as f:
    json.dump(entity, f, ensure_ascii=False, indent=2)
print("wrote", OUT, "and hooked it on the player")
