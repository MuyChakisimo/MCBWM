import { system } from "@minecraft/server";
import { getDynamicPropertyKey } from "./attachmentData.js";
const recoilProfiles = {
  krep_mp5: {
    base: { hip: { power: 0.042, duration: 0.21 }, ads: { power: 0.032, duration: 0.2 } },
    modifier: {
      grip: {
        0: { power: 0, duration: 0 },
        1: { power: 0.03, duration: 0.05 },
        2: { power: 0.1, duration: 0.07 },
        3: { power: 0.08, duration: 0.08 },
        4: { power: 0.05, duration: 0.03 },
        5: { power: 0.04, duration: 0.06 },
        6: { power: 0.2, duration: -0.02 },
        7: { power: 0.03, duration: 0.04 },
        8: { power: 0.05, duration: 0.05 },
        9: { power: 0.09, duration: 0.03 },
        10: { power: 0.08, duration: 0.07 },
        11: { power: 0.05, duration: 0.06 },
      },
      stock: {
        0: { power: 0, duration: 0 },
        1: { power: 0.03, duration: 0.05 },
        2: { power: 0.05, duration: 0.08 },
        3: { power: 0.12, duration: -0.03 },
        4: { power: 0.06, duration: 0.04 },
        5: { power: 0.04, duration: 0.09 },
        6: { power: 0.05, duration: 0.05 },
        7: { power: 0.03, duration: 0.08 },
        8: { power: 0.06, duration: 0.09 },
        9: { power: 0.09, duration: 0.1 },
        10: { power: 0.02, duration: 0.1 },
        11: { power: 0.04, duration: 0.09 },
      },
      muzzle: {
        0: { power: 0, duration: 0 },
        1: { power: 0.05, duration: 0.02 },
        2: { power: 0.05, duration: 0.02 },
        3: { power: 0.1, duration: 0.04 },
        4: { power: 0, duration: 0 },
        5: { power: 0, duration: 0 },
        6: { power: 0, duration: 0 },
        7: { power: 0, duration: 0 },
        8: { power: 0, duration: 0 },
        9: { power: 0, duration: 0 },
        10: { power: 0, duration: 0 },
        11: { power: 0, duration: 0 },
      },
    },
  },
  krep_akm: {
    base: { hip: { power: 0.042, duration: 0.3 }, ads: { power: 0.032, duration: 0.28 } },
    modifier: {
      grip: {
        0: { power: 0, duration: 0 },
        1: { power: 0, duration: 0 },
        2: { power: 0, duration: 0 },
        3: { power: 0, duration: 0 },
        4: { power: 0, duration: 0 },
        5: { power: 0, duration: 0 },
        6: { power: 0, duration: 0 },
        7: { power: 0, duration: 0 },
        8: { power: 0, duration: 0 },
        9: { power: 0, duration: 0 },
        10: { power: 0, duration: 0 },
        11: { power: 0, duration: 0 },
      },
      stock: {
        0: { power: 0, duration: 0 },
        1: { power: 0.05, duration: 0.05 },
        2: { power: 0.09, duration: 0.11 },
        3: { power: 0.17, duration: 0.01 },
        4: { power: 0.06, duration: 0.04 },
        5: { power: 0.04, duration: 0.09 },
        6: { power: 0.05, duration: 0.1 },
        7: { power: 0.07, duration: 0.08 },
        8: { power: 0.06, duration: 0.09 },
        9: { power: 0.09, duration: 0.12 },
        10: { power: 0.02, duration: 0.13 },
        11: { power: 0.04, duration: 0.11 },
      },
      muzzle: {
        0: { power: 0, duration: 0 },
        1: { power: 0.08, duration: 0.05 },
        2: { power: 0.075, duration: 0.04 },
        3: { power: 0.13, duration: 0.05 },
        4: { power: 0, duration: 0 },
        5: { power: 0, duration: 0 },
        6: { power: 0, duration: 0 },
        7: { power: 0, duration: 0 },
        8: { power: 0, duration: 0 },
        9: { power: 0, duration: 0 },
        10: { power: 0, duration: 0 },
        11: { power: 0, duration: 0 },
      },
    },
  },
  krep_fal: {
    base: { hip: { power: 0.042, duration: 0.36 }, ads: { power: 0.038, duration: 0.32 } },
    modifier: {
      grip: {
        0: { power: 0, duration: 0 },
        1: { power: 0.03, duration: 0.05 },
        2: { power: 0.1, duration: 0.07 },
        3: { power: 0.08, duration: 0.08 },
        4: { power: 0.05, duration: 0.03 },
        5: { power: 0.04, duration: 0.06 },
        6: { power: 0.12, duration: -0.02 },
        7: { power: 0.03, duration: 0.04 },
        8: { power: 0.05, duration: 0.05 },
        9: { power: 0.09, duration: 0.03 },
        10: { power: 0.08, duration: 0.07 },
        11: { power: 0.05, duration: 0.06 },
      },
      stock: {
        0: { power: 0, duration: 0 },
        1: { power: 0.05, duration: 0.05 },
        2: { power: 0.09, duration: 0.11 },
        3: { power: 0.17, duration: 0.01 },
        4: { power: 0.06, duration: 0.04 },
        5: { power: 0.04, duration: 0.09 },
        6: { power: 0.05, duration: 0.1 },
        7: { power: 0.07, duration: 0.08 },
        8: { power: 0.06, duration: 0.09 },
        9: { power: 0.09, duration: 0.12 },
        10: { power: 0.02, duration: 0.13 },
        11: { power: 0.04, duration: 0.11 },
      },
      muzzle: {
        0: { power: 0, duration: 0 },
        1: { power: 0, duration: 0 },
        2: { power: 0, duration: 0 },
        3: { power: 0, duration: 0 },
        4: { power: 0, duration: 0 },
        5: { power: 0, duration: 0 },
        6: { power: 0, duration: 0 },
        7: { power: 0, duration: 0 },
        8: { power: 0, duration: 0 },
        9: { power: 0, duration: 0 },
        10: { power: 0, duration: 0 },
        11: { power: 0, duration: 0 },
      },
    },
  },
  krep_m4a1: {
    base: { hip: { power: 0.035, duration: 0.25 }, ads: { power: 0.025, duration: 0.23 } },
    modifier: {
      grip: {
        0: { power: 0, duration: 0 },
        1: { power: 0.03, duration: 0.05 },
        2: { power: 0.1, duration: 0.07 },
        3: { power: 0.08, duration: 0.08 },
        4: { power: 0.05, duration: 0.03 },
        5: { power: 0.04, duration: 0.06 },
        6: { power: 0.12, duration: -0.02 },
        7: { power: 0.03, duration: 0.04 },
        8: { power: 0.05, duration: 0.05 },
        9: { power: 0.09, duration: 0.03 },
        10: { power: 0.08, duration: 0.07 },
        11: { power: 0.05, duration: 0.06 },
      },
      stock: {
        0: { power: 0, duration: 0 },
        1: { power: 0.06, duration: 0.04 },
        2: { power: 0.04, duration: 0.09 },
        3: { power: 0.05, duration: 0.05 },
        4: { power: 0.03, duration: 0.08 },
        5: { power: 0.06, duration: 0.09 },
        6: { power: 0.09, duration: 0.1 },
        7: { power: 0.02, duration: 0.1 },
        8: { power: 0.04, duration: 0.09 },
      },
      muzzle: {
        0: { power: 0, duration: 0 },
        1: { power: 0.07, duration: 0.02 },
        2: { power: 0.05, duration: 0.07 },
        3: { power: 0.1, duration: 0.04 },
        4: { power: 0, duration: 0 },
        5: { power: 0, duration: 0 },
        6: { power: 0, duration: 0 },
        7: { power: 0, duration: 0 },
        8: { power: 0, duration: 0 },
        9: { power: 0, duration: 0 },
        10: { power: 0, duration: 0 },
        11: { power: 0, duration: 0 },
      },
    },
  },
  krep_hk416: {
    base: { hip: { power: 0.045, duration: 0.25 }, ads: { power: 0.035, duration: 0.23 } },
    modifier: {
      grip: {
        0: { power: 0, duration: 0 },
        1: { power: 0.03, duration: 0.05 },
        2: { power: 0.1, duration: 0.07 },
        3: { power: 0.08, duration: 0.08 },
        4: { power: 0.05, duration: 0.03 },
        5: { power: 0.04, duration: 0.06 },
        6: { power: 0.12, duration: -0.02 },
        7: { power: 0.03, duration: 0.04 },
        8: { power: 0.05, duration: 0.05 },
        9: { power: 0.09, duration: 0.03 },
        10: { power: 0.08, duration: 0.07 },
        11: { power: 0.05, duration: 0.06 },
      },
      stock: {
        0: { power: 0, duration: 0 },
        1: { power: 0.06, duration: 0.04 },
        2: { power: 0.04, duration: 0.09 },
        3: { power: 0.05, duration: 0.05 },
        4: { power: 0.03, duration: 0.08 },
        5: { power: 0.06, duration: 0.09 },
        6: { power: 0.09, duration: 0.1 },
        7: { power: 0.02, duration: 0.1 },
        8: { power: 0.04, duration: 0.09 },
      },
      muzzle: {
        0: { power: 0, duration: 0 },
        1: { power: 0.07, duration: 0.02 },
        2: { power: 0.05, duration: 0.07 },
        3: { power: 0.1, duration: 0.04 },
        4: { power: 0, duration: 0 },
        5: { power: 0, duration: 0 },
        6: { power: 0, duration: 0 },
        7: { power: 0, duration: 0 },
        8: { power: 0, duration: 0 },
        9: { power: 0, duration: 0 },
        10: { power: 0, duration: 0 },
        11: { power: 0, duration: 0 },
      },
    },
  },
  krep_vector: {
    base: { hip: { power: 0.026, duration: 0.17 }, ads: { power: 0.022, duration: 0.15 } },
    modifier: {
      grip: {
        0: { power: 0, duration: 0 },
        1: { power: 0.05, duration: 0.03 },
        2: { power: 0.04, duration: 0.06 },
        3: { power: 0.2, duration: -0.02 },
        4: { power: 0.03, duration: 0.04 },
        5: { power: 0.05, duration: 0.05 },
        6: { power: 0.09, duration: 0.03 },
        7: { power: 0.08, duration: 0.04 },
        8: { power: 0.05, duration: 0.06 },
      },
      stock: {
        0: { power: 0, duration: 0 },
        1: { power: 0.03, duration: 0.05 },
        2: { power: 0.05, duration: 0.08 },
        3: { power: 0.12, duration: -0.03 },
        4: { power: 0.06, duration: 0.04 },
        5: { power: 0.04, duration: 0.07 },
        6: { power: 0.05, duration: 0.05 },
        7: { power: 0.03, duration: 0.07 },
        8: { power: 0.06, duration: 0.05 },
        9: { power: 0.09, duration: 0.05 },
        10: { power: 0.02, duration: 0.06 },
        11: { power: 0.04, duration: 0.06 },
      },
      muzzle: {
        0: { power: 0, duration: 0 },
        1: { power: 0.05, duration: 0 },
        2: { power: 0.05, duration: 0 },
        3: { power: 0.1, duration: 0 },
        4: { power: 0, duration: 0 },
        5: { power: 0, duration: 0 },
        6: { power: 0, duration: 0 },
        7: { power: 0, duration: 0 },
        8: { power: 0, duration: 0 },
        9: { power: 0, duration: 0 },
        10: { power: 0, duration: 0 },
        11: { power: 0, duration: 0 },
      },
    },
  },
};
function clamp(arg, arg2, arg3) {
  return Math.max(arg2, Math.min(arg3, arg));
}
function parseAttachmentData(arg) {
  if (!arg) return [0, 0, 0, 0, 0];
  return arg.split(",").map((part) => parseInt(part) || 0);
}
function calculateRecoil(arg, value = {}) {
  let value2 = 0,
    value3 = 0;
  for (const key in value) {
    const value4 = clamp(value[key], 0, 11),
      value5 = arg.modifier?.[key]?.[value4] ?? { power: 0, duration: 0 };
    ((value2 += value5.power), (value3 += value5.duration));
  }
  return {
    hip: {
      power: arg.base.hip.power * (1 - value2),
      duration: arg.base.hip.duration * (1 - value3),
    },
    ads: {
      power: arg.base.ads.power * (1 - value2),
      duration: arg.base.ads.duration * (1 - value3),
    },
  };
}
function applyRecoil(arg, value = false) {
  const mainhandItem = arg.getComponent("minecraft:equippable")?.getEquipment("Mainhand"),
    typeId = mainhandItem?.typeId;
  if (!typeId) return;
  const dynamicPropertyKey = getDynamicPropertyKey(typeId);
  if (!dynamicPropertyKey || !recoilProfiles[dynamicPropertyKey]) return;
  const dynamicProperty = arg.getDynamicProperty(dynamicPropertyKey),
    [value2 = 0, value3 = 0, value4 = 0, value5 = 0, value6 = 0] =
      parseAttachmentData(dynamicProperty),
    data = { stock: value2, grip: value3, muzzle: value5 },
    value7 = calculateRecoil(recoilProfiles[dynamicPropertyKey], data),
    value8 = value ? value7.ads : value7.hip,
    value9 =
      "camerashake add @s[r=0.5] " +
      value8.power.toFixed(3) +
      " " +
      value8.duration.toFixed(2) +
      " rotational";
  arg.runCommandAsync(value9).catch(() => {
    arg.sendMessage("Gagal apply recoil shake.");
  });
}
system.afterEvents.scriptEventReceive.subscribe((event) => {
  const sourceEntity = event.sourceEntity ?? event.initiator;
  if (!sourceEntity || typeof sourceEntity.getComponent !== "function") return;
  if (event.id === "recoil:hip") applyRecoil(sourceEntity, false);
  else {
    if (event.id === "recoil:ads") applyRecoil(sourceEntity, true);
  }
});
