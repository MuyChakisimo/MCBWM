// =====================================================
// TACZ MODULAR WEAPON VISUAL / AUDIO MAPPING
//
// The Java imports mostly follow a shared naming scheme, but a few guns use
// specialty reload clips (tube-fed, bolt-action, single-shot, etc.).
// Keeping those exceptions here lets the generic weapon engine stay generic.
// =====================================================

const OVERRIDES = Object.freeze({
  kar98: Object.freeze({
    animations: Object.freeze({
      reloadEmpty: "animation.tacz.kar98.reload_empty_clip",
      reloadTactical: "animation.tacz.kar98.reload_empty_clip",
    }),
  }),

  m320: Object.freeze({
    animations: Object.freeze({
      reloadTactical: "animation.tacz.m320.reload_empty",
    }),
  }),

  spas12: Object.freeze({
    animations: Object.freeze({
      reloadEmpty: "animation.tacz.spas12.reload_empty_intro",
      reloadTactical: "animation.tacz.spas12.reload_intro",
    }),
    sounds: Object.freeze({
      reloadEmpty: "tacz.java.spas12.reload",
      reloadTactical: "tacz.java.spas12.reload",
    }),
  }),

  springfield1873: Object.freeze({
    animations: Object.freeze({
      reloadTactical: "animation.tacz.springfield1873.reload_empty",
    }),
    sounds: Object.freeze({
      reloadEmpty: "tacz.java.springfield1873.reload_tactical",
    }),
  }),

  // These imports only carry a single useful reload sound in the converted
  // Bedrock pack. Reuse it for both reload states instead of asking Bedrock
  // to play a missing sound definition.
  lonetrail: Object.freeze({
    sounds: Object.freeze({
      reloadEmpty: "tacz.java.lonetrail.reload_tactical",
    }),
  }),
  m9a4: Object.freeze({
    sounds: Object.freeze({
      reloadEmpty: "tacz.java.m9a4.reload_tactical",
    }),
  }),
  mk23: Object.freeze({
    sounds: Object.freeze({
      reloadEmpty: "tacz.java.mk23.reload",
      reloadTactical: "tacz.java.mk23.reload",
    }),
  }),
  rhino357: Object.freeze({
    sounds: Object.freeze({
      reloadEmpty: "tacz.java.rhino357.reload_tactical",
    }),
  }),
  taurus500: Object.freeze({
    sounds: Object.freeze({
      reloadEmpty: "tacz.java.taurus500.reload_tactical",
    }),
  }),
  taurus943: Object.freeze({
    sounds: Object.freeze({
      reloadEmpty: "tacz.java.taurus943.reload_tactical",
    }),
  }),
});

export function getWeaponVisualConfig(weaponId) {
  const defaults = {
    animations: {
      shoot: `animation.tacz.${weaponId}.shoot`,
      reloadEmpty: `animation.tacz.${weaponId}.reload_empty`,
      reloadTactical: `animation.tacz.${weaponId}.reload_tactical`,
    },
    sounds: {
      shoot: `tacz.java.${weaponId}.shoot`,
      reloadEmpty: `tacz.java.${weaponId}.reload_empty`,
      reloadTactical: `tacz.java.${weaponId}.reload_tactical`,
    },
  };

  const override = OVERRIDES[weaponId] ?? {};

  return Object.freeze({
    animations: Object.freeze({
      ...defaults.animations,
      ...(override.animations ?? {}),
    }),
    sounds: Object.freeze({
      ...defaults.sounds,
      ...(override.sounds ?? {}),
    }),
  });
}
