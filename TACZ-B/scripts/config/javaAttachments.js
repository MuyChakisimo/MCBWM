// Imported TACZ Java attachment registry.
export const JAVA_ATTACHMENTS = Object.freeze({
  "ammo_mod_fmj": {
    "id": "ammo_mod_fmj",
    "name": "§eFull Metal Jacket Ammo",
    "type": "ammo",
    "data": {
      "weight": 0.6,
      "ads": {
        "addend": 0.02
      },
      "pierce": {
        "function": "if (x > 2) then y = x + 2 else y = x end"
      },
      "armor_ignore": {
        "function": "if (x > 0.5) then y = x*1.5 else y = x*1.75 end"
      },
      "damage": {
        "multiplier": 0.9
      },
      "ammo_speed": {
        "multiplier": 1.1
      },
      "extended_mag_level": 3
    }
  },
  "ammo_mod_he": {
    "id": "ammo_mod_he",
    "name": "§eHigh Explosive Ammo",
    "type": "ammo",
    "data": {
      "weight": 0.6,
      "explosion": {
        "explode": true
      },
      "armor_ignore": {
        "multiplier": 0.5
      },
      "head_shot": {
        "function": "y = 1"
      },
      "pierce": {
        "function": "y = 1"
      },
      "rpm": {
        "multiplier": 0.85
      },
      "extended_mag_level": 1,
      "inaccuracy": {
        "multiplier": 1
      },
      "aim_inaccuracy": {
        "multiplier": 0.25
      }
    }
  },
  "ammo_mod_hp": {
    "id": "ammo_mod_hp",
    "name": "§eHollow-Point Ammo",
    "type": "ammo",
    "data": {
      "weight": 0.6,
      "ads": {
        "addend": 0.02
      },
      "armor_ignore": {
        "multiplier": 0.5
      },
      "damage": {
        "multiplier": 1.3
      },
      "ammo_speed": {
        "multiplier": 0.9
      },
      "pierce": {
        "multiplier": 0
      },
      "extended_mag_level": 3
    }
  },
  "ammo_mod_i": {
    "id": "ammo_mod_i",
    "name": "§eIncendiary Ammo",
    "type": "ammo",
    "data": {
      "weight": 0.6,
      "ads": {
        "addend": 0.02
      },
      "ignite": {
        "entity": true
      },
      "armor_ignore": {
        "multiplier": 0.8
      },
      "damage": {
        "multiplier": 1.1
      },
      "ammo_speed": {
        "multiplier": 1.0
      },
      "extended_mag_level": 3
    }
  },
  "ammo_mod_slug": {
    "id": "ammo_mod_slug",
    "name": "§eShotgun Slug",
    "type": "ammo",
    "data": {
      "weight": 0.6,
      "inaccuracy": {
        "multiplier": 1
      },
      "aim_inaccuracy": {
        "multiplier": 0.04
      },
      "armor_ignore": {
        "function": "if (x > 0.5) then y = x*1.5 else y = x*1.75 end"
      },
      "damage": {
        "multiplier": 0.9
      },
      "ammo_speed": {
        "multiplier": 1.1
      },
      "extended_mag_level": 3
    }
  },
  "bayonet_6h3": {
    "id": "bayonet_6h3",
    "name": "6H3 Bayonet",
    "type": "bayonet",
    "data": {
      "weight": 0.34,
      "ads": {
        "addend": 0.03
      },
      "melee": {
        "distance": 2,
        "range_angle": 45,
        "damage": 5,
        "knockback": 0.4,
        "prep": 0.1
      }
    }
  },
  "bayonet_m9": {
    "id": "bayonet_m9",
    "name": "M9 Bayonet",
    "type": "bayonet",
    "data": {
      "weight": 0.34,
      "ads": {
        "addend": 0.03
      },
      "melee": {
        "distance": 2,
        "range_angle": 45,
        "cooldown": 0,
        "damage": 6,
        "knockback": 0.4,
        "prep": 0.1
      }
    }
  },
  "deagle_golden_long_barrel": {
    "id": "deagle_golden_long_barrel",
    "name": ".357 Golden Deagle Long Barrel",
    "type": "barrel",
    "data": {
      "weight": 0.4,
      "ads": {
        "addend": 0.04
      },
      "inaccuracy": {
        "multiplier": 0.9
      },
      "aim_inaccuracy": {
        "multiplier": 0.85
      },
      "recoil": {
        "pitch": {
          "multiplier": 0.8
        },
        "yaw": {
          "multiplier": 0.8
        }
      },
      "effective_range": {
        "addend": 5
      },
      "silence": {
        "distance_addend": -12,
        "use_silence_sound": true
      }
    }
  },
  "extended_mag_1": {
    "id": "extended_mag_1",
    "name": "Heavy Ammo Extended Mag",
    "type": "extended_mag",
    "data": {
      "weight": 0.4,
      "ads": {
        "addend": 0.01
      },
      "extended_mag_level": 1
    }
  },
  "extended_mag_2": {
    "id": "extended_mag_2",
    "name": "§9Heavy Ammo Extended Mag",
    "type": "extended_mag",
    "data": {
      "weight": 0.6,
      "ads": {
        "addend": 0.025
      },
      "extended_mag_level": 2
    }
  },
  "extended_mag_3": {
    "id": "extended_mag_3",
    "name": "§dHeavy Ammo Extended Mag",
    "type": "extended_mag",
    "data": {
      "weight": 0.8,
      "ads": {
        "addend": 0.045
      },
      "extended_mag_level": 3
    }
  },
  "grip_cobra": {
    "id": "grip_cobra",
    "name": "SI Grip",
    "type": "grip",
    "data": {
      "weight": 0.08,
      "ads": {
        "multiplier": 0.85
      }
    }
  },
  "grip_cqr": {
    "id": "grip_cqr",
    "name": "Grip Cqr",
    "type": "grip",
    "data": {
      "weight": 0.167,
      "ads": {
        "multiplier": 0.85
      },
      "recoil": {
        "pitch": {
          "multiplier": 0.92
        },
        "yaw": {
          "multiplier": 0.92
        }
      }
    }
  },
  "grip_magpul_afg_2": {
    "id": "grip_magpul_afg_2",
    "name": "Talon AFG1 Handstop",
    "type": "grip",
    "data": {
      "weight": 0.2,
      "ads": {
        "multiplier": 0.95
      },
      "inaccuracy": {
        "multiplier": 1.1
      },
      "recoil": {
        "pitch": {
          "multiplier": 0.85
        }
      }
    }
  },
  "grip_osovets_black": {
    "id": "grip_osovets_black",
    "name": "P-2 Grip",
    "type": "grip",
    "data": {
      "weight": 0.125,
      "recoil": {
        "yaw": {
          "multiplier": 0.75
        }
      }
    }
  },
  "grip_rk0": {
    "id": "grip_rk0",
    "name": "RK-0 Grip",
    "type": "grip",
    "data": {
      "weight": 0.138,
      "recoil": {
        "pitch": {
          "multiplier": 0.8
        }
      }
    }
  },
  "grip_rk1_b25u": {
    "id": "grip_rk1_b25u",
    "name": "RK-1 B25U Grip",
    "type": "grip",
    "data": {
      "weight": 0.18,
      "ads": {
        "addend": 0.18
      },
      "recoil": {
        "yaw": {
          "multiplier": 0.66
        }
      },
      "inaccuracy": {
        "multiplier": 0.48
      },
      "aim_inaccuracy": {
        "multiplier": 1.25
      }
    }
  },
  "grip_rk6": {
    "id": "grip_rk6",
    "name": "RK-6 Grip",
    "type": "grip",
    "data": {
      "weight": 0.1,
      "ads": {
        "multiplier": 0.85
      },
      "inaccuracy": {
        "multiplier": 0.88
      }
    }
  },
  "grip_se_5": {
    "id": "grip_se_5",
    "name": "Grip Se 5",
    "type": "grip",
    "data": {
      "weight": 0.09,
      "ads": {
        "multiplier": 0.85
      },
      "recoil": {
        "pitch": {
          "multiplier": 0.93
        },
        "yaw": {
          "multiplier": 0.92
        }
      }
    }
  },
  "grip_td": {
    "id": "grip_td",
    "name": "Grip Td",
    "type": "grip",
    "data": {
      "weight": 0.133,
      "aim_inaccuracy": {
        "multiplier": 0.88
      },
      "inaccuracy": {
        "multiplier": 0.88
      }
    }
  },
  "grip_vertical_military": {
    "id": "grip_vertical_military",
    "name": "Nagoma Military Standard Grip",
    "type": "grip",
    "data": {
      "weight": 0.25,
      "ads": {
        "multiplier": 1.02
      },
      "aim_inaccuracy": {
        "multiplier": 0.85
      },
      "recoil": {
        "pitch": {
          "multiplier": 0.8
        },
        "yaw": {
          "multiplier": 0.8
        }
      }
    }
  },
  "grip_vertical_ranger": {
    "id": "grip_vertical_ranger",
    "name": "Koch Ranger Heavy Grip",
    "type": "grip",
    "data": {
      "weight": 0.8,
      "ads": {
        "multiplier": 1.05
      },
      "inaccuracy": {
        "multiplier": 0.7
      },
      "sneak_inaccuracy": {
        "multiplier": 0.75
      },
      "recoil": {
        "pitch": {
          "multiplier": 0.8
        },
        "yaw": {
          "multiplier": 0.7
        }
      }
    }
  },
  "grip_vertical_talon": {
    "id": "grip_vertical_talon",
    "name": "Talon SG2 Grip",
    "type": "grip",
    "data": {
      "weight": 0.2,
      "ads": {
        "multiplier": 1.01
      },
      "aim_inaccuracy": {
        "multiplier": 0.8
      },
      "recoil": {
        "pitch": {
          "multiplier": 0.85
        }
      }
    }
  },
  "laser_compact": {
    "id": "laser_compact",
    "name": "Laser Compact",
    "type": "laser",
    "data": {
      "weight": 0.13,
      "aim_inaccuracy": {
        "multiplier": 0.6
      },
      "inaccuracy": {
        "multiplier": 0.7
      },
      "sneak_inaccuracy": {
        "multiplier": 0.7
      }
    }
  },
  "laser_lopro": {
    "id": "laser_lopro",
    "name": "Laser Lopro",
    "type": "laser",
    "data": {
      "weight": 1,
      "ads": {
        "addend": 0.12
      },
      "aim_inaccuracy": {
        "multiplier": 0.25
      },
      "inaccuracy": {
        "multiplier": 0.75
      },
      "sneak_inaccuracy": {
        "multiplier": 0.5
      }
    }
  },
  "laser_nightstick": {
    "id": "laser_nightstick",
    "name": "Laser Nightstick",
    "type": "laser",
    "data": {
      "weight": 0.2,
      "ads": {
        "addend": 0.06
      },
      "sneak_inaccuracy": {
        "multiplier": 0.75
      },
      "inaccuracy": {
        "multiplier": 0.6
      }
    }
  },
  "laser_peq15": {
    "id": "laser_peq15",
    "name": "Laser Peq15",
    "type": "laser",
    "data": {
      "weight": 0.133,
      "ads": {
        "addend": -0.03
      },
      "aim_inaccuracy": {
        "multiplier": 0.88
      },
      "sneak_inaccuracy": {
        "multiplier": 0.5
      }
    }
  },
  "laser_peq6": {
    "id": "laser_peq6",
    "name": "Laser Peq6",
    "type": "laser",
    "data": {
      "weight": 0.25,
      "ads": {
        "addend": 0.07
      },
      "head_shot": {
        "addend": 0.25
      },
      "sneak_inaccuracy": {
        "multiplier": 0.35
      },
      "inaccuracy": {
        "multiplier": 0.5
      },
      "lie_inaccuracy": {
        "multiplier": 0.75
      },
      "aim_inaccuracy": {
        "multiplier": 0.5
      }
    }
  },
  "light_extended_mag_1": {
    "id": "light_extended_mag_1",
    "name": "Light Ammo Extended mag",
    "type": "extended_mag",
    "data": {
      "weight": 0.2,
      "ads": {
        "addend": 0.01
      },
      "extended_mag_level": 1
    }
  },
  "light_extended_mag_2": {
    "id": "light_extended_mag_2",
    "name": "§9Light Ammo Extended mag",
    "type": "extended_mag",
    "data": {
      "weight": 0.3,
      "ads": {
        "addend": 0.02
      },
      "extended_mag_level": 2
    }
  },
  "light_extended_mag_3": {
    "id": "light_extended_mag_3",
    "name": "§dLight Ammo Extended mag",
    "type": "extended_mag",
    "data": {
      "weight": 0.4,
      "ads": {
        "addend": 0.03
      },
      "extended_mag_level": 3
    }
  },
  "muzzle_brake_cthulhu": {
    "id": "muzzle_brake_cthulhu",
    "name": "Cthulhu K7 Brake",
    "type": "muzzle",
    "data": {
      "ads": {
        "addend": 0.02
      },
      "inaccuracy": {
        "multiplier": 1.1
      },
      "aim_inaccuracy": {
        "multiplier": 0.9
      },
      "recoil": {
        "pitch": {
          "multiplier": 0.85
        },
        "yaw": {
          "multiplier": 0.8
        }
      }
    }
  },
  "muzzle_brake_cyclone_d2": {
    "id": "muzzle_brake_cyclone_d2",
    "name": "Cyclone D2 Brake",
    "type": "muzzle",
    "data": {
      "ads": {
        "addend": 0.02
      },
      "inaccuracy": {
        "multiplier": 1.1
      },
      "recoil": {
        "pitch": {
          "multiplier": 0.8
        },
        "yaw": {
          "multiplier": 0.7
        }
      }
    }
  },
  "muzzle_brake_mastiff_sg": {
    "id": "muzzle_brake_mastiff_sg",
    "name": "Mastiff Shotgun Muzzle Brake",
    "type": "muzzle",
    "data": {
      "weight": 0.25,
      "ads": {
        "addend": 0.08
      },
      "inaccuracy": {
        "multiplier": 1.25
      },
      "aim_inaccuracy": {
        "multiplier": 1.1
      },
      "recoil": {
        "pitch": {
          "multiplier": 0.65
        },
        "yaw": {
          "multiplier": 0.7
        }
      }
    }
  },
  "muzzle_brake_pioneer": {
    "id": "muzzle_brake_pioneer",
    "name": "Pioneer A3 Brake",
    "type": "muzzle",
    "data": {
      "ads": {
        "addend": 0.02
      },
      "inaccuracy": {
        "multiplier": 1.15
      },
      "recoil": {
        "pitch": {
          "multiplier": 0.33
        },
        "yaw": {
          "multiplier": 1.33
        }
      }
    }
  },
  "muzzle_brake_timeless50": {
    "id": "muzzle_brake_timeless50",
    "name": "§6Timeless .50 Cal Brake",
    "type": "muzzle",
    "data": {
      "ads": {
        "addend": 0.03
      },
      "recoil": {
        "pitch": {
          "multiplier": 0.35
        },
        "yaw": {
          "multiplier": 0.75
        }
      },
      "inaccuracy": {
        "multiplier": 0.6
      },
      "sneak_inaccuracy": {
        "multiplier": 0.5
      }
    }
  },
  "muzzle_brake_trex": {
    "id": "muzzle_brake_trex",
    "name": "T-Rex Heavy Brake",
    "type": "muzzle",
    "data": {
      "weight": 0.5,
      "ads": {
        "addend": 0.03
      },
      "recoil": {
        "pitch": {
          "multiplier": 0.66
        },
        "yaw": {
          "multiplier": 0.95
        }
      }
    }
  },
  "muzzle_choke_sg": {
    "id": "muzzle_choke_sg",
    "name": "Shotgun Choke",
    "type": "muzzle",
    "data": {
      "ads": {
        "addend": 0.05
      },
      "inaccuracy": {
        "multiplier": 0.65
      },
      "aim_inaccuracy": {
        "multiplier": 0.65
      },
      "sneak_inaccuracy": {
        "multiplier": 0.65
      },
      "lie_inaccuracy": {
        "multiplier": 0.65
      },
      "recoil": {
        "pitch": {
          "multiplier": 1.45
        },
        "yaw": {
          "multiplier": 1.45
        }
      }
    }
  },
  "muzzle_compensator_trident": {
    "id": "muzzle_compensator_trident",
    "name": "Tempest Trident Compensator",
    "type": "muzzle",
    "data": {
      "ads": {
        "addend": 0.01
      },
      "inaccuracy": {
        "multiplier": 0.85
      },
      "recoil": {
        "yaw": {
          "multiplier": 0.6
        }
      }
    }
  },
  "muzzle_duckbill_sg": {
    "id": "muzzle_duckbill_sg",
    "name": "Shotgun Duckbill Muzzle",
    "type": "muzzle",
    "data": {
      "ads": {
        "addend": 0.02
      },
      "inaccuracy": {
        "multiplier": 0.85
      },
      "aim_inaccuracy": {
        "multiplier": 0.85
      },
      "sneak_inaccuracy": {
        "multiplier": 0.85
      },
      "lie_inaccuracy": {
        "multiplier": 0.85
      },
      "recoil": {
        "pitch": {
          "multiplier": 0.6
        }
      }
    }
  },
  "muzzle_silencer_knight_qd": {
    "id": "muzzle_silencer_knight_qd",
    "name": "Knight QD Silencer",
    "type": "muzzle",
    "data": {
      "weight": 0.35,
      "ads": {
        "addend": 0.02
      },
      "aim_inaccuracy": {
        "multiplier": 0.75
      },
      "recoil": {
        "pitch": {
          "multiplier": 0.8
        }
      },
      "silence": {
        "distance_addend": -20,
        "use_silence_sound": true
      }
    }
  },
  "muzzle_silencer_mirage": {
    "id": "muzzle_silencer_mirage",
    "name": "Mirage Silencer",
    "type": "muzzle",
    "data": {
      "weight": 0.15,
      "head_shot": {
        "multiplier": 1.25
      },
      "inaccuracy": {
        "multiplier": 1.1
      },
      "effective_range": {
        "multiplier": 0.8
      },
      "silence": {
        "distance_addend": -24,
        "use_silence_sound": true
      }
    }
  },
  "muzzle_silencer_phantom_s1": {
    "id": "muzzle_silencer_phantom_s1",
    "name": "Phantom S1 Silencer",
    "type": "muzzle",
    "data": {
      "weight": 0.25,
      "ads": {
        "addend": 0.02
      },
      "inaccuracy": {
        "multiplier": 1.1
      },
      "effective_range": {
        "multiplier": 1.5
      },
      "rpm": {
        "multiplier": 0.95
      },
      "silence": {
        "distance_addend": -20,
        "use_silence_sound": true
      }
    }
  },
  "muzzle_silencer_ptilopsis": {
    "id": "muzzle_silencer_ptilopsis",
    "name": "PO-2 \"Ptilopsis\" Silencer",
    "type": "muzzle",
    "data": {
      "weight": 0.4,
      "ads": {
        "addend": 0.06
      },
      "inaccuracy": {
        "multiplier": 0.8
      },
      "effective_range": {
        "multiplier": 1.25
      },
      "silence": {
        "distance_addend": -24,
        "use_silence_sound": true
      }
    }
  },
  "muzzle_silencer_sg": {
    "id": "muzzle_silencer_sg",
    "name": "12 Gauge Silencer",
    "type": "muzzle",
    "data": {
      "weight": 0.4,
      "ads": {
        "addend": 0.1
      },
      "inaccuracy": {
        "multiplier": 0.95
      },
      "aim_inaccuracy": {
        "multiplier": 0.9
      },
      "effective_range": {
        "multiplier": 1.5
      },
      "rpm": {
        "multiplier": 0.95
      },
      "recoil": {
        "pitch": {
          "multiplier": 0.9
        }
      },
      "silence": {
        "distance_addend": -20,
        "use_silence_sound": true
      }
    }
  },
  "muzzle_silencer_ursus": {
    "id": "muzzle_silencer_ursus",
    "name": "Ursus Military Standard Silencer",
    "type": "muzzle",
    "data": {
      "weight": 0.35,
      "ads": {
        "addend": 0.035
      },
      "inaccuracy": {
        "multiplier": 1.15
      },
      "recoil": {
        "pitch": {
          "multiplier": 0.75
        },
        "yaw": {
          "multiplier": 0.8
        }
      },
      "effective_range": {
        "multiplier": 1.2
      },
      "silence": {
        "distance_addend": -18,
        "use_silence_sound": true
      }
    }
  },
  "muzzle_silencer_vulture": {
    "id": "muzzle_silencer_vulture",
    "name": "Vulture .50 Cal Suppressor",
    "type": "muzzle",
    "data": {
      "weight": 1.55,
      "ads": {
        "addend": 0.09
      },
      "inaccuracy": {
        "multiplier": 1.1
      },
      "effective_range": {
        "multiplier": 1.25
      },
      "head_shot": {
        "addend": 0.25
      },
      "recoil": {
        "pitch": {
          "multiplier": 0.66
        },
        "yaw": {
          "multiplier": 0.75
        }
      },
      "silence": {
        "distance_addend": -25,
        "use_silence_sound": true
      }
    }
  },
  "muzzle_silencer_wraith": {
    "id": "muzzle_silencer_wraith",
    "name": "§6Wraith Silencer",
    "type": "muzzle",
    "data": {
      "weight": 0.35,
      "ads": {
        "addend": 0.04
      },
      "head_shot": {
        "addend": 0.25
      },
      "effective_range": {
        "multiplier": 1.15
      },
      "aim_inaccuracy": {
        "multiplier": 0.75
      },
      "ammo_speed": {
        "multiplier": 1.2
      },
      "silence": {
        "distance_addend": -20,
        "use_silence_sound": true
      }
    }
  },
  "oem_stock_heavy": {
    "id": "oem_stock_heavy",
    "name": "Factory Issued Heavy Stock",
    "type": "stock",
    "data": {
      "weight": 0.5,
      "ads": {
        "addend": 0.05
      },
      "aim_inaccuracy": {
        "multiplier": 0.9
      },
      "recoil": {
        "pitch": {
          "multiplier": 0.75
        },
        "yaw": {
          "multiplier": 0.6
        }
      },
      "melee": {
        "distance": 2,
        "range_angle": 40,
        "cooldown": 0.4,
        "damage": 5,
        "knockback": 0.8,
        "prep": 0.1
      }
    }
  },
  "oem_stock_light": {
    "id": "oem_stock_light",
    "name": "Factory Issued light Stock",
    "type": "stock",
    "data": {
      "weight": 0.3,
      "ads": {
        "addend": -0.02
      },
      "aim_inaccuracy": {
        "multiplier": 1.1
      },
      "recoil": {
        "pitch": {
          "multiplier": 0.85
        },
        "yaw": {
          "multiplier": 0.8
        }
      },
      "melee": {
        "distance": 2,
        "range_angle": 40,
        "cooldown": 0.1,
        "damage": 3,
        "knockback": 0.4,
        "prep": 0.1
      }
    }
  },
  "oem_stock_tactical": {
    "id": "oem_stock_tactical",
    "name": "Factory Issued Tactical Stock",
    "type": "stock",
    "data": {
      "weight": 0.4,
      "ads": {
        "addend": 0.035
      },
      "inaccuracy": {
        "multiplier": 0.9
      },
      "recoil": {
        "pitch": {
          "multiplier": 0.8
        },
        "yaw": {
          "multiplier": 0.7
        }
      },
      "melee": {
        "distance": 2,
        "range_angle": 40,
        "cooldown": 0.2,
        "damage": 4,
        "knockback": 0.6,
        "prep": 0.1
      }
    }
  },
  "scope_1873_6x": {
    "id": "scope_1873_6x",
    "name": "§5Vintage Springfield Scope",
    "type": "scope",
    "data": {
      "weight": 1,
      "ads_addend": 0.15,
      "aim_inaccuracy": {
        "multiplier": 0.66
      }
    }
  },
  "scope_98k": {
    "id": "scope_98k",
    "name": "§5Mauser 4x Light Sight",
    "type": "scope",
    "data": {
      "weight": 1.3,
      "ads_addend": 0.03
    }
  },
  "scope_acog_ta31": {
    "id": "scope_acog_ta31",
    "name": "§9TA31 2x ACOG",
    "type": "scope",
    "data": {
      "weight": 1.2,
      "ads_addend": 0.015
    }
  },
  "scope_aug_default": {
    "id": "scope_aug_default",
    "name": "AUG Builtin Scope",
    "type": "scope",
    "data": {
      "weight": 0.1,
      "ads_addend": 0.1
    }
  },
  "scope_contender": {
    "id": "scope_contender",
    "name": "§9Contender 4x Scope",
    "type": "scope",
    "data": {
      "weight": 1.6,
      "ads_addend": 0.05,
      "aim_inaccuracy": {
        "multiplier": 0.85
      }
    }
  },
  "scope_elcan_4x": {
    "id": "scope_elcan_4x",
    "name": "§5Elcan 4x Scope",
    "type": "scope",
    "data": {
      "weight": 1.6,
      "ads_addend": 0.05
    }
  },
  "scope_hamr": {
    "id": "scope_hamr",
    "name": "§5HAMR 3x Scope",
    "type": "scope",
    "data": {
      "weight": 0.85,
      "ads": {
        "addend": 0.015
      },
      "aim_inaccuracy": {
        "multiplier": 0.85
      }
    }
  },
  "scope_lpvo_1_6": {
    "id": "scope_lpvo_1_6",
    "name": "§5LPVO 1-6x Scope ",
    "type": "scope",
    "data": {
      "weight": 1.3,
      "ads_addend": 0.03
    }
  },
  "scope_mk5hd": {
    "id": "scope_mk5hd",
    "name": "§6Mark 5 HD 5-25x Scope",
    "type": "scope",
    "data": {
      "weight": 0.85,
      "ads": {
        "addend": 0.13
      },
      "aim_inaccuracy": {
        "multiplier": 0.66
      }
    }
  },
  "scope_qmk152": {
    "id": "scope_qmk152",
    "name": "§5QMK-152 3x White Light Sight",
    "type": "scope",
    "data": {
      "weight": 1,
      "ads_addend": 0.02
    }
  },
  "scope_retro_2x": {
    "id": "scope_retro_2x",
    "name": "§9Retro 3x Scope",
    "type": "scope",
    "data": {
      "weight": 1.6,
      "ads_addend": 0.02
    }
  },
  "scope_scout": {
    "id": "scope_scout",
    "name": "Scope Scout",
    "type": "scope",
    "data": {
      "weight": 2.0,
      "ads_addend": 0.09,
      "aim_inaccuracy": {
        "multiplier": 0.75
      }
    }
  },
  "scope_standard_8x": {
    "id": "scope_standard_8x",
    "name": "§6Scout 4-10x Scope",
    "type": "scope",
    "data": {
      "weight": 2.0,
      "ads_addend": 0.09
    }
  },
  "scope_vudu": {
    "id": "scope_vudu",
    "name": "§6Vudu 1-6x Scope",
    "type": "scope",
    "data": {
      "weight": 0.85,
      "ads": {
        "addend": 0.015
      },
      "aim_inaccuracy": {
        "multiplier": 0.9
      }
    }
  },
  "shotgun_extended_mag_1": {
    "id": "shotgun_extended_mag_1",
    "name": "Shotgun Ammo Extended Mag",
    "type": "extended_mag",
    "data": {
      "weight": 0.4,
      "ads": {
        "addend": 0.01
      },
      "extended_mag_level": 1
    }
  },
  "shotgun_extended_mag_2": {
    "id": "shotgun_extended_mag_2",
    "name": "§9Shotgun Ammo Extended Mag",
    "type": "extended_mag",
    "data": {
      "weight": 0.4,
      "ads": {
        "addend": 0.01
      },
      "extended_mag_level": 2
    }
  },
  "shotgun_extended_mag_3": {
    "id": "shotgun_extended_mag_3",
    "name": "§dShotgun Ammo Extended Mag",
    "type": "extended_mag",
    "data": {
      "weight": 0.4,
      "ads": {
        "addend": 0.01
      },
      "extended_mag_level": 3
    }
  },
  "sight_552": {
    "id": "sight_552",
    "name": "§9Militech 552 HCOG",
    "type": "scope",
    "data": {
      "weight": 0.4,
      "ads": {
        "addend": -0.015
      }
    }
  },
  "sight_acro_pistol": {
    "id": "sight_acro_pistol",
    "name": "§9Aimpoint ACRO P-1 Sight",
    "type": "scope",
    "data": {
      "weight": 0.4,
      "aim_inaccuracy": {
        "multiplier": 0.95
      },
      "ads": {
        "addend": -0.02
      }
    }
  },
  "sight_acro_rifle": {
    "id": "sight_acro_rifle",
    "name": "§9Aimpoint ACRO P-1 Sight Rised",
    "type": "scope",
    "data": {
      "weight": 0.5,
      "aim_inaccuracy": {
        "multiplier": 0.9
      },
      "ads": {
        "addend": -0.02
      }
    }
  },
  "sight_coyote": {
    "id": "sight_coyote",
    "name": "Coyote Sight",
    "type": "scope",
    "data": {
      "weight": 0.25,
      "ads": {
        "addend": -0.03
      }
    }
  },
  "sight_deltapoint_pistol": {
    "id": "sight_deltapoint_pistol",
    "name": "DeltaPoint Sight",
    "type": "scope",
    "data": {
      "weight": 0.4,
      "aim_inaccuracy": {
        "multiplier": 0.95
      },
      "ads": {
        "addend": -0.02
      }
    }
  },
  "sight_deltapoint_rifle": {
    "id": "sight_deltapoint_rifle",
    "name": "DeltaPoint Sight Rised",
    "type": "scope",
    "data": {
      "weight": 0.5,
      "aim_inaccuracy": {
        "multiplier": 0.95
      },
      "ads": {
        "addend": -0.02
      }
    }
  },
  "sight_exp3": {
    "id": "sight_exp3",
    "name": "§9EXP3 HCOG",
    "type": "scope",
    "data": {
      "weight": 0.35,
      "ads": {
        "addend": -0.02
      }
    }
  },
  "sight_fastfire_pistol": {
    "id": "sight_fastfire_pistol",
    "name": "FastFire Sight",
    "type": "scope",
    "data": {
      "weight": 0.4,
      "aim_inaccuracy": {
        "multiplier": 0.95
      },
      "ads": {
        "addend": -0.02
      }
    }
  },
  "sight_fastfire_rifle": {
    "id": "sight_fastfire_rifle",
    "name": "FastFire Sight Rised",
    "type": "scope",
    "data": {
      "weight": 0.5,
      "aim_inaccuracy": {
        "multiplier": 0.95
      },
      "ads": {
        "addend": -0.02
      }
    }
  },
  "sight_okp7": {
    "id": "sight_okp7",
    "name": "OKP-7 Sight",
    "type": "scope",
    "data": {
      "weight": 0.4,
      "ads": {
        "addend": -0.01
      }
    }
  },
  "sight_p90": {
    "id": "sight_p90",
    "name": "Sight P90",
    "type": "scope",
    "data": {
      "weight": 0.35,
      "ads": {
        "addend": -0.02
      }
    }
  },
  "sight_pk06_pistol": {
    "id": "sight_pk06_pistol",
    "name": "§9PK06 Sight",
    "type": "scope",
    "data": {
      "weight": 0.4,
      "aim_inaccuracy": {
        "multiplier": 0.95
      },
      "ads": {
        "addend": -0.02
      }
    }
  },
  "sight_pk06_rifle": {
    "id": "sight_pk06_rifle",
    "name": "§9PK06 Sight Rised",
    "type": "scope",
    "data": {
      "weight": 0.5,
      "aim_inaccuracy": {
        "multiplier": 0.95
      },
      "ads": {
        "addend": -0.02
      }
    }
  },
  "sight_rmr_dot": {
    "id": "sight_rmr_dot",
    "name": "RMR Mini Red Dot",
    "type": "scope",
    "data": {
      "weight": 0.1,
      "ads": {
        "addend": -0.05
      }
    }
  },
  "sight_sro_dot": {
    "id": "sight_sro_dot",
    "name": "SRO Mini Red Dot",
    "type": "scope",
    "data": {
      "weight": 0.1,
      "ads": {
        "addend": -0.04
      }
    }
  },
  "sight_srs_02": {
    "id": "sight_srs_02",
    "name": "Trijicon SRS-02 Reflex Sight",
    "type": "scope",
    "data": {
      "weight": 0.8,
      "ads": {
        "addend": -0.025
      }
    }
  },
  "sight_t1": {
    "id": "sight_t1",
    "name": "T1 red dot",
    "type": "scope",
    "data": {
      "weight": 0.2,
      "ads": {
        "addend": -0.02
      }
    }
  },
  "sight_t2": {
    "id": "sight_t2",
    "name": "T2 red dot",
    "type": "scope",
    "data": {
      "weight": 0.25,
      "ads": {
        "addend": -0.015
      }
    }
  },
  "sight_uh1": {
    "id": "sight_uh1",
    "name": "§9UH-1 HCOG",
    "type": "scope",
    "data": {
      "weight": 0.3,
      "ads": {
        "addend": -0.01
      }
    }
  },
  "sniper_extended_mag_1": {
    "id": "sniper_extended_mag_1",
    "name": "Sniper Ammo Extended mag",
    "type": "extended_mag",
    "data": {
      "weight": 0.5,
      "ads": {
        "addend": 0.03
      },
      "extended_mag_level": 1
    }
  },
  "sniper_extended_mag_2": {
    "id": "sniper_extended_mag_2",
    "name": "§9Sniper Ammo Extended mag",
    "type": "extended_mag",
    "data": {
      "weight": 0.8,
      "ads": {
        "addend": 0.05
      },
      "extended_mag_level": 2
    }
  },
  "sniper_extended_mag_3": {
    "id": "sniper_extended_mag_3",
    "name": "§dSniper Ammo Extended Mag",
    "type": "extended_mag",
    "data": {
      "weight": 1.2,
      "ads": {
        "addend": 0.08
      },
      "extended_mag_level": 3
    }
  },
  "stock_ak12": {
    "id": "stock_ak12",
    "name": "AK-12 Regular Stock",
    "type": "stock",
    "data": {
      "weight": 0.148,
      "ads": {
        "addend": 0.01
      },
      "aim_inaccuracy": {
        "multiplier": 0.9
      },
      "recoil": {
        "pitch": {
          "multiplier": 0.8
        },
        "yaw": {
          "multiplier": 0.8
        }
      }
    }
  },
  "stock_carbon_bone_c5": {
    "id": "stock_carbon_bone_c5",
    "name": "Carbon bone C5 Stock",
    "type": "stock",
    "data": {
      "weight": 0.3,
      "ads": {
        "addend": -0.02
      },
      "aim_inaccuracy": {
        "multiplier": 1.1
      },
      "recoil": {
        "pitch": {
          "multiplier": 0.85
        },
        "yaw": {
          "multiplier": 0.8
        }
      },
      "melee": {
        "distance": 2,
        "range_angle": 40,
        "cooldown": 0.1,
        "damage": 3,
        "knockback": 0.4,
        "prep": 0.1
      }
    }
  },
  "stock_heavy_spas_12": {
    "id": "stock_heavy_spas_12",
    "name": "Franchi Heavy Stock",
    "type": "stock",
    "data": {
      "weight": 0.5,
      "ads": {
        "addend": 0.02
      },
      "inaccuracy": {
        "multiplier": 0.9
      },
      "aim_inaccuracy": {
        "multiplier": 0.7
      },
      "recoil": {
        "pitch": {
          "multiplier": 0.72
        },
        "yaw": {
          "multiplier": 0.72
        }
      }
    }
  },
  "stock_hk_slim_line": {
    "id": "stock_hk_slim_line",
    "name": "HK Slim Line Stock",
    "type": "stock",
    "data": {
      "weight": 0.695,
      "ads": {
        "addend": 0.01
      },
      "recoil": {
        "pitch": {
          "multiplier": 0.75
        },
        "yaw": {
          "multiplier": 0.72
        }
      }
    }
  },
  "stock_m4ss": {
    "id": "stock_m4ss",
    "name": "M4SS Stock",
    "type": "stock",
    "data": {
      "weight": 0.695,
      "ads": {
        "addend": 0.012
      },
      "recoil": {
        "pitch": {
          "multiplier": 0.85
        },
        "yaw": {
          "multiplier": 0.9
        }
      }
    }
  },
  "stock_militech_b5": {
    "id": "stock_militech_b5",
    "name": "Militech B5 Stock",
    "type": "stock",
    "data": {
      "weight": 0.5,
      "ads": {
        "multiplier": 1.1
      },
      "aim_inaccuracy": {
        "multiplier": 0.87
      },
      "recoil": {
        "pitch": {
          "multiplier": 0.68
        },
        "yaw": {
          "multiplier": 0.6
        }
      },
      "melee": {
        "distance": 2,
        "range_angle": 40,
        "cooldown": 0.4,
        "damage": 5,
        "knockback": 0.8,
        "prep": 0.1
      }
    }
  },
  "stock_moe": {
    "id": "stock_moe",
    "name": "Magpul MOE Stock",
    "type": "stock",
    "data": {
      "weight": 0.15,
      "ads": {
        "addend": -0.03
      },
      "recoil": {
        "pitch": {
          "multiplier": 0.85
        }
      }
    }
  },
  "stock_ripstock": {
    "id": "stock_ripstock",
    "name": "CMMG RipStock Stock",
    "type": "stock",
    "data": {
      "weight": 0.12,
      "ads": {
        "multiplier": 0.82
      },
      "aim_inaccuracy": {
        "multiplier": 1.05
      }
    }
  },
  "stock_sba3": {
    "id": "stock_sba3",
    "name": "SBA3 Stock",
    "type": "stock",
    "data": {
      "weight": 0.1,
      "recoil": {
        "yaw": {
          "multiplier": 0.8
        }
      },
      "inaccuracy": {
        "multiplier": 0.78
      }
    }
  },
  "stock_tactical_ar": {
    "id": "stock_tactical_ar",
    "name": "Magpul CTR stock",
    "type": "stock",
    "data": {
      "weight": 0.4,
      "recoil": {
        "pitch": {
          "multiplier": 0.75
        },
        "yaw": {
          "multiplier": 0.75
        }
      },
      "melee": {
        "distance": 2,
        "range_angle": 40,
        "cooldown": 0.2,
        "damage": 4,
        "knockback": 0.6,
        "prep": 0.1
      }
    }
  },
  "stock_tactical_spas_12": {
    "id": "stock_tactical_spas_12",
    "name": "Franchi Tactical Stock",
    "type": "stock",
    "data": {
      "weight": 0.3,
      "recoil": {
        "pitch": {
          "multiplier": 0.8
        },
        "yaw": {
          "multiplier": 0.8
        }
      },
      "inaccuracy": {
        "multiplier": 0.7
      }
    }
  }
});
export function getJavaAttachment(id){ return JAVA_ATTACHMENTS[id]; }
