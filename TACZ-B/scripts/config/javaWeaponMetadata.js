// Metadata imported from TACZ Java. Does not override existing Bedrock damage/penetration balance.
export const JAVA_WEAPON_METADATA = Object.freeze({
  "akm": {
    "javaSourceId": "ak47",
    "caliber": "7.62×39mm",
    "ammoId": "762x39",
    "ammoItem": "krep:m43",
    "magazineSize": 30,
    "extendedMagSizes": [
      34,
      37,
      40
    ],
    "rpm": 600,
    "fireModes": [
      "auto",
      "semi"
    ],
    "fireMode": "auto",
    "reload": {
      "empty": 2.25,
      "tactical": 1.55
    },
    "drawTime": 0.35,
    "aimTime": 0.2,
    "weight": 3.5,
    "projectileSpeed": 250,
    "projectileLife": 0.8,
    "allowedAttachmentTypes": [
      "scope",
      "stock",
      "muzzle",
      "extended_mag"
    ],
    "builtinAttachments": {},
    "javaRecoil": {
      "pitch": [
        {
          "time": 0,
          "value": [
            0.66,
            0.66
          ]
        },
        {
          "time": 0.1,
          "value": [
            0.66,
            0.66
          ]
        },
        {
          "time": 0.45,
          "value": [
            -0.175,
            -0.175
          ]
        },
        {
          "time": 0.6,
          "value": [
            0,
            0
          ]
        }
      ],
      "yaw": [
        {
          "time": 0,
          "value": [
            -0.23,
            0.18
          ]
        },
        {
          "time": 0.35,
          "value": [
            0,
            0
          ]
        }
      ]
    },
    "javaInaccuracy": {
      "stand": 4.5,
      "move": 5,
      "sneak": 2.5,
      "lie": 1.5,
      "aim": 0.15
    },
    "javaHeadshotMultiplier": 1.5,
    "javaArmorIgnore": 0.25
  },
  "awp": {
    "javaSourceId": "ai_awp",
    "caliber": ".338 Lapua",
    "ammoId": "338",
    "ammoItem": "krep:lapua338",
    "magazineSize": 5,
    "extendedMagSizes": [
      6,
      7,
      8
    ],
    "rpm": 171,
    "fireModes": [
      "semi"
    ],
    "fireMode": "semi",
    "reload": {
      "empty": 2.85,
      "tactical": 2.05
    },
    "drawTime": 0.35,
    "aimTime": 0.25,
    "weight": 6.9,
    "projectileSpeed": 575,
    "projectileLife": 0.9,
    "allowedAttachmentTypes": [
      "extended_mag",
      "scope",
      "muzzle"
    ],
    "builtinAttachments": {},
    "javaRecoil": {
      "pitch": [
        {
          "time": 0,
          "value": [
            3.5,
            3.5
          ]
        },
        {
          "time": 0.07,
          "value": [
            2.5,
            2.5
          ]
        },
        {
          "time": 0.16,
          "value": [
            3.25,
            3.25
          ]
        },
        {
          "time": 0.24,
          "value": [
            2,
            2
          ]
        },
        {
          "time": 0.6,
          "value": [
            -0.5,
            -0.5
          ]
        },
        {
          "time": 0.71,
          "value": [
            0.25,
            0.25
          ]
        },
        {
          "time": 0.83,
          "value": [
            0,
            0
          ]
        },
        {
          "time": 0.88,
          "value": [
            0,
            0
          ]
        }
      ],
      "yaw": [
        {
          "time": 0,
          "value": [
            -0.75,
            -0.75
          ]
        },
        {
          "time": 0.08,
          "value": [
            0.6,
            0.6
          ]
        },
        {
          "time": 0.17,
          "value": [
            -0.35,
            -0.35
          ]
        },
        {
          "time": 0.28,
          "value": [
            0.25,
            0.25
          ]
        },
        {
          "time": 0.5,
          "value": [
            0,
            0
          ]
        },
        {
          "time": 0.8,
          "value": [
            0,
            0
          ]
        }
      ]
    },
    "javaInaccuracy": {
      "stand": 5,
      "move": 5.5,
      "sneak": 3,
      "lie": 2.5,
      "aim": 0.05
    },
    "javaHeadshotMultiplier": 2,
    "javaArmorIgnore": 0.6
  },
  "b93": {
    "javaSourceId": "b93r",
    "caliber": "9mm",
    "ammoId": "9mm",
    "ammoItem": "krep:mm9",
    "magazineSize": 20,
    "extendedMagSizes": [
      23,
      26,
      32
    ],
    "rpm": 900,
    "fireModes": [
      "burst",
      "semi"
    ],
    "fireMode": "burst",
    "reload": {
      "empty": 1.53,
      "tactical": 1.2
    },
    "drawTime": 0.33,
    "aimTime": 0.13,
    "weight": 1.5,
    "projectileSpeed": 190,
    "projectileLife": 0.6,
    "allowedAttachmentTypes": [
      "muzzle",
      "scope",
      "extended_mag"
    ],
    "builtinAttachments": {},
    "javaRecoil": {
      "pitch": [
        {
          "time": 0,
          "value": [
            0.65,
            0.65
          ]
        },
        {
          "time": 0.11,
          "value": [
            0.575,
            0.575
          ]
        },
        {
          "time": 0.27,
          "value": [
            -0.1,
            -0.1
          ]
        },
        {
          "time": 0.35,
          "value": [
            0.05,
            0.05
          ]
        },
        {
          "time": 0.42,
          "value": [
            0,
            0
          ]
        }
      ],
      "yaw": [
        {
          "time": 0,
          "value": [
            -0.25,
            -0.1
          ]
        },
        {
          "time": 0.18,
          "value": [
            0,
            0
          ]
        }
      ]
    },
    "javaInaccuracy": {
      "stand": 2.65,
      "move": 2.95,
      "sneak": 1.5,
      "lie": 1,
      "aim": 0.17
    },
    "javaHeadshotMultiplier": 1.25,
    "javaArmorIgnore": 0.2
  },
  "db": {
    "javaSourceId": "db_long",
    "caliber": "12 Gauge",
    "ammoId": "12g",
    "ammoItem": "krep:gauge12",
    "magazineSize": 2,
    "extendedMagSizes": [],
    "rpm": 100,
    "fireModes": [
      "semi"
    ],
    "fireMode": "semi",
    "reload": {
      "empty": 1.83,
      "tactical": 1.23
    },
    "drawTime": 0.27,
    "aimTime": 0.18,
    "weight": 3.2,
    "projectileSpeed": 150,
    "projectileLife": 0.5,
    "allowedAttachmentTypes": [
      "extended_mag"
    ],
    "builtinAttachments": {},
    "javaRecoil": {
      "pitch": [
        {
          "time": 0,
          "value": [
            3.25,
            3.25
          ]
        },
        {
          "time": 0.125,
          "value": [
            3.25,
            3.25
          ]
        },
        {
          "time": 0.4,
          "value": [
            -0.25,
            -0.25
          ]
        },
        {
          "time": 0.55,
          "value": [
            0,
            0
          ]
        }
      ],
      "yaw": [
        {
          "time": 0,
          "value": [
            -1.5,
            -1.5
          ]
        },
        {
          "time": 0.1,
          "value": [
            -1.5,
            -1.5
          ]
        },
        {
          "time": 0.2,
          "value": [
            0.15,
            0.15
          ]
        },
        {
          "time": 0.4,
          "value": [
            0,
            0
          ]
        }
      ]
    },
    "javaInaccuracy": {
      "stand": 3.25,
      "move": 3.75,
      "sneak": 3,
      "lie": 3,
      "aim": 2.25
    },
    "javaHeadshotMultiplier": 1.2,
    "javaArmorIgnore": 0.33
  },
  "deagle": {
    "javaSourceId": "deagle",
    "caliber": ".50 AE",
    "ammoId": "50ae",
    "ammoItem": "krep:ae50",
    "magazineSize": 7,
    "extendedMagSizes": [
      8,
      10,
      12
    ],
    "rpm": 300,
    "fireModes": [
      "semi"
    ],
    "fireMode": "semi",
    "reload": {
      "empty": 1.67,
      "tactical": 1.2
    },
    "drawTime": 0.33,
    "aimTime": 0.2,
    "weight": 2,
    "projectileSpeed": 170,
    "projectileLife": 0.7,
    "allowedAttachmentTypes": [
      "scope",
      "muzzle",
      "extended_mag",
      "laser"
    ],
    "builtinAttachments": {},
    "javaRecoil": {
      "pitch": [
        {
          "time": 0,
          "value": [
            0.95,
            0.95
          ]
        },
        {
          "time": 0.4,
          "value": [
            0.95,
            0.95
          ]
        },
        {
          "time": 0.65,
          "value": [
            -0.225,
            -0.225
          ]
        },
        {
          "time": 0.85,
          "value": [
            0.125,
            0.125
          ]
        },
        {
          "time": 1.1,
          "value": [
            0,
            0
          ]
        },
        {
          "time": 1.2,
          "value": [
            0,
            0
          ]
        }
      ],
      "yaw": [
        {
          "time": 0,
          "value": [
            -0.3,
            0.3
          ]
        },
        {
          "time": 0.5,
          "value": [
            0,
            0
          ]
        }
      ]
    },
    "javaInaccuracy": {
      "stand": 4,
      "move": 4.5,
      "sneak": 2.25,
      "lie": 1.5,
      "aim": 0.1
    },
    "javaHeadshotMultiplier": 1.75,
    "javaArmorIgnore": 0.25
  },
  "deagleg": {
    "javaSourceId": "deagle_golden",
    "caliber": ".357 Magnum",
    "ammoId": "357mag",
    "ammoItem": "krep:mag357",
    "magazineSize": 9,
    "extendedMagSizes": [
      12,
      15,
      17
    ],
    "rpm": 350,
    "fireModes": [
      "semi"
    ],
    "fireMode": "semi",
    "reload": {
      "empty": 1.67,
      "tactical": 1.2
    },
    "drawTime": 0.35,
    "aimTime": 0.2,
    "weight": 2,
    "projectileSpeed": 200,
    "projectileLife": 0.7,
    "allowedAttachmentTypes": [
      "scope",
      "muzzle",
      "extended_mag",
      "laser"
    ],
    "builtinAttachments": {},
    "javaRecoil": {
      "pitch": [
        {
          "time": 0,
          "value": [
            0.75,
            0.75
          ]
        },
        {
          "time": 0.4,
          "value": [
            0.75,
            0.75
          ]
        },
        {
          "time": 0.65,
          "value": [
            -0.225,
            -0.225
          ]
        },
        {
          "time": 0.85,
          "value": [
            0.125,
            0.125
          ]
        },
        {
          "time": 1.1,
          "value": [
            0,
            0
          ]
        },
        {
          "time": 1.2,
          "value": [
            0,
            0
          ]
        }
      ],
      "yaw": [
        {
          "time": 0,
          "value": [
            -0.3,
            0.3
          ]
        },
        {
          "time": 0.5,
          "value": [
            0,
            0
          ]
        }
      ]
    },
    "javaInaccuracy": {
      "stand": 3,
      "move": 3.5,
      "sneak": 2,
      "lie": 1.2,
      "aim": 0.1
    },
    "javaHeadshotMultiplier": 1.8,
    "javaArmorIgnore": 0.2
  },
  "evolys": {
    "javaSourceId": "fn_evolys",
    "caliber": ".308 Winchester",
    "ammoId": "308",
    "ammoItem": "krep:win308",
    "magazineSize": 75,
    "extendedMagSizes": [
      100,
      125,
      150
    ],
    "rpm": 750,
    "fireModes": [
      "auto"
    ],
    "fireMode": "auto",
    "reload": {
      "empty": 6,
      "tactical": 4.82
    },
    "drawTime": 1,
    "aimTime": 0.25,
    "weight": 5.5,
    "projectileSpeed": 280,
    "projectileLife": 1.0,
    "allowedAttachmentTypes": [
      "scope",
      "grip",
      "muzzle",
      "extended_mag",
      "stock"
    ],
    "builtinAttachments": {},
    "javaRecoil": {
      "pitch": [
        {
          "time": 0,
          "value": [
            0.65,
            0.75
          ]
        },
        {
          "time": 0.05,
          "value": [
            0.7,
            0.8
          ]
        },
        {
          "time": 0.18,
          "value": [
            0.6,
            0.7
          ]
        },
        {
          "time": 0.5,
          "value": [
            -0.15,
            -0.15
          ]
        },
        {
          "time": 0.65,
          "value": [
            0,
            0
          ]
        }
      ],
      "yaw": [
        {
          "time": 0,
          "value": [
            -0.5,
            0.3
          ]
        },
        {
          "time": 0.3,
          "value": [
            -0.5,
            0.3
          ]
        },
        {
          "time": 0.5,
          "value": [
            0,
            0
          ]
        }
      ]
    },
    "javaInaccuracy": {
      "stand": 5.75,
      "move": 5.5,
      "sneak": 3,
      "lie": 2,
      "aim": 0.175
    },
    "javaHeadshotMultiplier": 1.6,
    "javaArmorIgnore": 0.4
  },
  "fal": {
    "javaSourceId": "fn_fal",
    "caliber": ".308 Winchester",
    "ammoId": "308",
    "ammoItem": "krep:win308",
    "magazineSize": 20,
    "extendedMagSizes": [
      25,
      30,
      35
    ],
    "rpm": 350,
    "fireModes": [
      "semi",
      "auto"
    ],
    "fireMode": "semi",
    "reload": {
      "empty": 2.53,
      "tactical": 1.43
    },
    "drawTime": 0.42,
    "aimTime": 0.2,
    "weight": 4.7,
    "projectileSpeed": 330,
    "projectileLife": 0.8,
    "allowedAttachmentTypes": [
      "scope",
      "laser",
      "grip",
      "muzzle",
      "extended_mag"
    ],
    "builtinAttachments": {},
    "javaRecoil": {
      "pitch": [
        {
          "time": 0,
          "value": [
            1.55,
            1.75
          ]
        },
        {
          "time": 0.05,
          "value": [
            1.75,
            1.8
          ]
        },
        {
          "time": 0.12,
          "value": [
            1.4,
            1.5
          ]
        },
        {
          "time": 0.25,
          "value": [
            -0.1,
            -0.05
          ]
        },
        {
          "time": 0.5,
          "value": [
            0,
            0
          ]
        },
        {
          "time": 0.7,
          "value": [
            0.15,
            0.25
          ]
        },
        {
          "time": 0.9,
          "value": [
            0,
            0
          ]
        }
      ],
      "yaw": [
        {
          "time": 0,
          "value": [
            -0.5,
            0.5
          ]
        },
        {
          "time": 0.25,
          "value": [
            0,
            0
          ]
        }
      ]
    },
    "javaInaccuracy": {
      "stand": 6,
      "move": 6.5,
      "sneak": 2.5,
      "lie": 1.5,
      "aim": 0.1
    },
    "javaHeadshotMultiplier": 1.8,
    "javaArmorIgnore": 0.4
  },
  "g36": {
    "javaSourceId": "g36k",
    "caliber": "5.56×45mm",
    "ammoId": "556x45",
    "ammoItem": "krep:m885",
    "magazineSize": 30,
    "extendedMagSizes": [
      50,
      75,
      100
    ],
    "rpm": 780,
    "fireModes": [
      "auto",
      "semi"
    ],
    "fireMode": "auto",
    "reload": {
      "empty": 2.4,
      "tactical": 1.8
    },
    "drawTime": 0.6,
    "aimTime": 0.16,
    "weight": 3.3,
    "projectileSpeed": 310,
    "projectileLife": 0.9,
    "allowedAttachmentTypes": [
      "scope",
      "stock",
      "grip",
      "muzzle",
      "extended_mag",
      "laser"
    ],
    "builtinAttachments": {},
    "javaRecoil": {
      "pitch": [
        {
          "time": 0,
          "value": [
            0.525,
            0.525
          ]
        },
        {
          "time": 0.35,
          "value": [
            -0.125,
            -0.125
          ]
        },
        {
          "time": 0.45,
          "value": [
            0,
            0
          ]
        }
      ],
      "yaw": [
        {
          "time": 0,
          "value": [
            -0.3,
            0.2
          ]
        },
        {
          "time": 0.15,
          "value": [
            -0.3,
            0.2
          ]
        },
        {
          "time": 0.3,
          "value": [
            0,
            0
          ]
        }
      ]
    },
    "javaInaccuracy": {
      "stand": 3.75,
      "move": 4.25,
      "sneak": 2.5,
      "lie": 1.5,
      "aim": 0.11
    },
    "javaHeadshotMultiplier": 1.5,
    "javaArmorIgnore": 0.2
  },
  "g17": {
    "javaSourceId": "glock_17",
    "caliber": "9mm",
    "ammoId": "9mm",
    "ammoItem": "krep:mm9",
    "magazineSize": 17,
    "extendedMagSizes": [
      20,
      25,
      30
    ],
    "rpm": 400,
    "fireModes": [
      "semi"
    ],
    "fireMode": "semi",
    "reload": {
      "empty": 1.63,
      "tactical": 1.05
    },
    "drawTime": 0.32,
    "aimTime": 0.13,
    "weight": 1,
    "projectileSpeed": 150,
    "projectileLife": 0.8,
    "allowedAttachmentTypes": [
      "scope",
      "muzzle",
      "extended_mag",
      "laser"
    ],
    "builtinAttachments": {},
    "javaRecoil": {
      "pitch": [
        {
          "time": 0,
          "value": [
            1,
            1
          ]
        },
        {
          "time": 0.08,
          "value": [
            0.9,
            0.9
          ]
        },
        {
          "time": 0.26,
          "value": [
            0.1,
            0.1
          ]
        },
        {
          "time": 0.3,
          "value": [
            0.05,
            0.05
          ]
        },
        {
          "time": 0.35,
          "value": [
            0,
            0
          ]
        }
      ],
      "yaw": [
        {
          "time": 0,
          "value": [
            -0.75,
            0.5
          ]
        },
        {
          "time": 0.2,
          "value": [
            0,
            0
          ]
        }
      ]
    },
    "javaInaccuracy": {
      "stand": 2,
      "move": 2.5,
      "sneak": 1.5,
      "lie": 0.75,
      "aim": 0.2
    },
    "javaHeadshotMultiplier": 1.5,
    "javaArmorIgnore": 0
  },
  "hk416": {
    "javaSourceId": "hk416d",
    "caliber": "5.56×45mm",
    "ammoId": "556x45",
    "ammoItem": "krep:m885",
    "magazineSize": 30,
    "extendedMagSizes": [
      40,
      50,
      100
    ],
    "rpm": 943,
    "fireModes": [
      "auto",
      "semi"
    ],
    "fireMode": "auto",
    "reload": {
      "empty": 1.86,
      "tactical": 1.3
    },
    "drawTime": 0.47,
    "aimTime": 0.15,
    "weight": 3.4,
    "projectileSpeed": 290,
    "projectileLife": 0.9,
    "allowedAttachmentTypes": [
      "scope",
      "stock",
      "grip",
      "muzzle",
      "extended_mag",
      "laser"
    ],
    "builtinAttachments": {},
    "javaRecoil": {
      "pitch": [
        {
          "time": 0,
          "value": [
            0.625,
            0.625
          ]
        },
        {
          "time": 0.15,
          "value": [
            0.625,
            0.625
          ]
        },
        {
          "time": 0.5,
          "value": [
            -0.125,
            -0.125
          ]
        },
        {
          "time": 0.65,
          "value": [
            0,
            0
          ]
        }
      ],
      "yaw": [
        {
          "time": 0,
          "value": [
            -0.3,
            0.2
          ]
        },
        {
          "time": 0.15,
          "value": [
            -0.3,
            0.2
          ]
        },
        {
          "time": 0.5,
          "value": [
            0,
            0
          ]
        }
      ]
    },
    "javaInaccuracy": {
      "stand": 4.75,
      "move": 5,
      "sneak": 2.25,
      "lie": 1.5,
      "aim": 0.1
    },
    "javaHeadshotMultiplier": 1.5,
    "javaArmorIgnore": 0.2
  },
  "g3": {
    "javaSourceId": "hk_g3",
    "caliber": ".308 Winchester",
    "ammoId": "308",
    "ammoItem": "krep:win308",
    "magazineSize": 20,
    "extendedMagSizes": [
      30,
      35,
      40
    ],
    "rpm": 350,
    "fireModes": [
      "semi",
      "auto"
    ],
    "fireMode": "semi",
    "reload": {
      "empty": 2.7,
      "tactical": 1.55
    },
    "drawTime": 0.65,
    "aimTime": 0.24,
    "weight": 4.3,
    "projectileSpeed": 270,
    "projectileLife": 0.8,
    "allowedAttachmentTypes": [
      "scope",
      "stock",
      "grip",
      "muzzle",
      "extended_mag",
      "laser"
    ],
    "builtinAttachments": {},
    "javaRecoil": {
      "pitch": [
        {
          "time": 0,
          "value": [
            1,
            1
          ]
        },
        {
          "time": 0.15,
          "value": [
            1,
            1
          ]
        },
        {
          "time": 0.55,
          "value": [
            -0.225,
            -0.225
          ]
        },
        {
          "time": 0.7,
          "value": [
            0,
            0
          ]
        },
        {
          "time": 0.8,
          "value": [
            0,
            0
          ]
        }
      ],
      "yaw": [
        {
          "time": 0,
          "value": [
            -0.3,
            0.15
          ]
        },
        {
          "time": 0.25,
          "value": [
            -0.3,
            0.15
          ]
        },
        {
          "time": 0.7,
          "value": [
            0,
            0
          ]
        }
      ]
    },
    "javaInaccuracy": {
      "stand": 5,
      "move": 5.5,
      "sneak": 3,
      "lie": 2,
      "aim": 0.1
    },
    "javaHeadshotMultiplier": 1.5,
    "javaArmorIgnore": 0.5
  },
  "mp5": {
    "javaSourceId": "hk_mp5a5",
    "caliber": "9mm",
    "ammoId": "9mm",
    "ammoItem": "krep:mm9",
    "magazineSize": 30,
    "extendedMagSizes": [
      40,
      50,
      60
    ],
    "rpm": 820,
    "fireModes": [
      "auto",
      "burst",
      "semi"
    ],
    "fireMode": "auto",
    "reload": {
      "empty": 2.7,
      "tactical": 1.33
    },
    "drawTime": 0.32,
    "aimTime": 0.17,
    "weight": 2.5,
    "projectileSpeed": 180,
    "projectileLife": 0.75,
    "allowedAttachmentTypes": [
      "scope",
      "stock",
      "grip",
      "muzzle",
      "extended_mag",
      "laser"
    ],
    "builtinAttachments": {},
    "javaRecoil": {
      "pitch": [
        {
          "time": 0,
          "value": [
            0.45,
            0.45
          ]
        },
        {
          "time": 0.3,
          "value": [
            0.45,
            0.45
          ]
        },
        {
          "time": 0.5,
          "value": [
            -0.125,
            -0.125
          ]
        },
        {
          "time": 0.65,
          "value": [
            0,
            0
          ]
        }
      ],
      "yaw": [
        {
          "time": 0,
          "value": [
            -0.275,
            0.275
          ]
        },
        {
          "time": 0.3,
          "value": [
            -0.275,
            0.275
          ]
        },
        {
          "time": 0.5,
          "value": [
            0,
            0
          ]
        }
      ]
    },
    "javaInaccuracy": {
      "stand": 3.5,
      "move": 4.5,
      "sneak": 2.25,
      "lie": 1.5,
      "aim": 0.175
    },
    "javaHeadshotMultiplier": 1.25,
    "javaArmorIgnore": 0.15
  },
  "m16": {
    "javaSourceId": "m16a4",
    "caliber": "5.56×45mm",
    "ammoId": "556x45",
    "ammoItem": "krep:m885",
    "magazineSize": 30,
    "extendedMagSizes": [
      33,
      39,
      45
    ],
    "rpm": 400,
    "fireModes": [
      "burst",
      "semi"
    ],
    "fireMode": "burst",
    "reload": {
      "empty": 2.17,
      "tactical": 1.33
    },
    "drawTime": 0.43,
    "aimTime": 0.17,
    "weight": 3.6,
    "projectileSpeed": 310,
    "projectileLife": 0.75,
    "allowedAttachmentTypes": [
      "muzzle",
      "extended_mag",
      "scope",
      "grip",
      "stock",
      "laser"
    ],
    "builtinAttachments": {},
    "javaRecoil": {
      "pitch": [
        {
          "time": 0,
          "value": [
            0.35,
            0.35
          ]
        },
        {
          "time": 0.35,
          "value": [
            0.35,
            0.35
          ]
        },
        {
          "time": 0.55,
          "value": [
            -0.125,
            -0.125
          ]
        },
        {
          "time": 0.7,
          "value": [
            0,
            0
          ]
        }
      ],
      "yaw": [
        {
          "time": 0,
          "value": [
            -0.3,
            0.1
          ]
        },
        {
          "time": 0.3,
          "value": [
            -0.3,
            0.1
          ]
        },
        {
          "time": 0.5,
          "value": [
            0,
            0
          ]
        }
      ]
    },
    "javaInaccuracy": {
      "stand": 3.75,
      "move": 4.5,
      "sneak": 2,
      "lie": 1.5,
      "aim": 0.12
    },
    "javaHeadshotMultiplier": 1.35,
    "javaArmorIgnore": 0.25
  },
  "qbz191": {
    "javaSourceId": "qbz_191",
    "caliber": "5.8×42mm",
    "ammoId": "58x42",
    "ammoItem": "krep:mm5842",
    "magazineSize": 30,
    "extendedMagSizes": [
      40,
      50,
      75
    ],
    "rpm": 750,
    "fireModes": [
      "auto",
      "semi"
    ],
    "fireMode": "auto",
    "reload": {
      "empty": 1.73,
      "tactical": 1.23
    },
    "drawTime": 0.73,
    "aimTime": 0.15,
    "weight": 3.1,
    "projectileSpeed": 290,
    "projectileLife": 0.75,
    "allowedAttachmentTypes": [
      "muzzle",
      "extended_mag",
      "scope",
      "grip",
      "laser",
      "stock"
    ],
    "builtinAttachments": {},
    "javaRecoil": {
      "pitch": [
        {
          "time": 0,
          "value": [
            0.4,
            0.4
          ]
        },
        {
          "time": 0.25,
          "value": [
            -0.125,
            -0.125
          ]
        },
        {
          "time": 0.33,
          "value": [
            0,
            0
          ]
        }
      ],
      "yaw": [
        {
          "time": 0,
          "value": [
            -0.25,
            0.25
          ]
        },
        {
          "time": 0.33,
          "value": [
            0,
            0
          ]
        }
      ]
    },
    "javaInaccuracy": {
      "stand": 4,
      "move": 5,
      "sneak": 2,
      "lie": 1.5,
      "aim": 0.1
    },
    "javaHeadshotMultiplier": 1.5,
    "javaArmorIgnore": 0.4
  },
  "qbz95": {
    "javaSourceId": "qbz_95",
    "caliber": "5.8×42mm",
    "ammoId": "58x42",
    "ammoItem": "krep:mm5842",
    "magazineSize": 30,
    "extendedMagSizes": [
      33,
      36,
      75
    ],
    "rpm": 660,
    "fireModes": [
      "auto",
      "semi",
      "burst"
    ],
    "fireMode": "auto",
    "reload": {
      "empty": 2.22,
      "tactical": 1.3
    },
    "drawTime": 0.77,
    "aimTime": 0.15,
    "weight": 3.5,
    "projectileSpeed": 265,
    "projectileLife": 0.75,
    "allowedAttachmentTypes": [
      "muzzle",
      "extended_mag",
      "scope",
      "grip",
      "laser"
    ],
    "builtinAttachments": {},
    "javaRecoil": {
      "pitch": [
        {
          "time": 0,
          "value": [
            0.35,
            0.35
          ]
        },
        {
          "time": 0.25,
          "value": [
            -0.125,
            -0.125
          ]
        },
        {
          "time": 0.33,
          "value": [
            0,
            0
          ]
        }
      ],
      "yaw": [
        {
          "time": 0,
          "value": [
            -0.25,
            0.25
          ]
        },
        {
          "time": 0.33,
          "value": [
            0,
            0
          ]
        }
      ]
    },
    "javaInaccuracy": {
      "stand": 4.25,
      "move": 5,
      "sneak": 2.5,
      "lie": 1.75,
      "aim": 0.15
    },
    "javaHeadshotMultiplier": 1.5,
    "javaArmorIgnore": 0.4
  },
  "scarh": {
    "javaSourceId": "scar_h",
    "caliber": ".308 Winchester",
    "ammoId": "308",
    "ammoItem": "krep:win308",
    "magazineSize": 20,
    "extendedMagSizes": [
      25,
      30,
      40
    ],
    "rpm": 570,
    "fireModes": [
      "semi",
      "auto"
    ],
    "fireMode": "semi",
    "reload": {
      "empty": 2.05,
      "tactical": 1.2
    },
    "drawTime": 0.43,
    "aimTime": 0.21,
    "weight": 4.6,
    "projectileSpeed": 320,
    "projectileLife": 0.8,
    "allowedAttachmentTypes": [
      "scope",
      "stock",
      "grip",
      "muzzle",
      "extended_mag",
      "laser"
    ],
    "builtinAttachments": {},
    "javaRecoil": {
      "pitch": [
        {
          "time": 0,
          "value": [
            1.0,
            1.0
          ]
        },
        {
          "time": 0.2,
          "value": [
            1.0,
            1.0
          ]
        },
        {
          "time": 0.45,
          "value": [
            -0.2,
            -0.2
          ]
        },
        {
          "time": 0.6,
          "value": [
            0,
            0
          ]
        },
        {
          "time": 0.7,
          "value": [
            0,
            0
          ]
        }
      ],
      "yaw": [
        {
          "time": 0,
          "value": [
            -0.3,
            0.15
          ]
        },
        {
          "time": 0.35,
          "value": [
            -0.3,
            0.15
          ]
        },
        {
          "time": 0.5,
          "value": [
            0,
            0
          ]
        }
      ]
    },
    "javaInaccuracy": {
      "stand": 5.5,
      "move": 6,
      "sneak": 2.75,
      "lie": 1.6,
      "aim": 0.075
    },
    "javaHeadshotMultiplier": 1.5,
    "javaArmorIgnore": 0.5
  },
  "scarl": {
    "javaSourceId": "scar_l",
    "caliber": "5.56×45mm",
    "ammoId": "556x45",
    "ammoItem": "krep:m885",
    "magazineSize": 30,
    "extendedMagSizes": [
      40,
      55,
      70
    ],
    "rpm": 650,
    "fireModes": [
      "auto",
      "burst",
      "semi"
    ],
    "fireMode": "auto",
    "reload": {
      "empty": 1.83,
      "tactical": 1.13
    },
    "drawTime": 0.43,
    "aimTime": 0.17,
    "weight": 3.5,
    "projectileSpeed": 290,
    "projectileLife": 0.8,
    "allowedAttachmentTypes": [
      "scope",
      "stock",
      "grip",
      "muzzle",
      "extended_mag",
      "laser"
    ],
    "builtinAttachments": {},
    "javaRecoil": {
      "pitch": [
        {
          "time": 0,
          "value": [
            0.5,
            0.5
          ]
        },
        {
          "time": 0.25,
          "value": [
            0.5,
            0.5
          ]
        },
        {
          "time": 0.45,
          "value": [
            -0.2,
            -0.2
          ]
        },
        {
          "time": 0.6,
          "value": [
            0,
            0
          ]
        },
        {
          "time": 0.7,
          "value": [
            0,
            0
          ]
        }
      ],
      "yaw": [
        {
          "time": 0,
          "value": [
            -0.2,
            0.15
          ]
        },
        {
          "time": 0.35,
          "value": [
            -0.2,
            0.15
          ]
        },
        {
          "time": 0.5,
          "value": [
            0,
            0
          ]
        }
      ]
    },
    "javaInaccuracy": {
      "stand": 5,
      "move": 5.5,
      "sneak": 2.5,
      "lie": 1.5,
      "aim": 0.125
    },
    "javaHeadshotMultiplier": 1.75,
    "javaArmorIgnore": 0.25
  },
  "sks": {
    "javaSourceId": "sks_tactical",
    "caliber": "7.62×39mm",
    "ammoId": "762x39",
    "ammoItem": "krep:m43",
    "magazineSize": 10,
    "extendedMagSizes": [
      15,
      20,
      25
    ],
    "rpm": 510,
    "fireModes": [
      "semi"
    ],
    "fireMode": "semi",
    "reload": {
      "empty": 2.17,
      "tactical": 1.6
    },
    "drawTime": 0.48,
    "aimTime": 0.2,
    "weight": 3.85,
    "projectileSpeed": 300,
    "projectileLife": 0.8,
    "allowedAttachmentTypes": [
      "scope",
      "stock",
      "grip",
      "muzzle",
      "extended_mag"
    ],
    "builtinAttachments": {},
    "javaRecoil": {
      "pitch": [
        {
          "time": 0,
          "value": [
            1.25,
            1.25
          ]
        },
        {
          "time": 0.25,
          "value": [
            1.25,
            1.25
          ]
        },
        {
          "time": 0.5,
          "value": [
            -0.225,
            -0.225
          ]
        },
        {
          "time": 0.6,
          "value": [
            0,
            0
          ]
        },
        {
          "time": 0.8,
          "value": [
            0,
            0
          ]
        }
      ],
      "yaw": [
        {
          "time": 0,
          "value": [
            -0.5,
            -0.5
          ]
        },
        {
          "time": 0.06,
          "value": [
            0.5,
            0.5
          ]
        },
        {
          "time": 0.13,
          "value": [
            -0.25,
            -0.25
          ]
        },
        {
          "time": 0.21,
          "value": [
            0.1,
            0.1
          ]
        },
        {
          "time": 0.33,
          "value": [
            0,
            0
          ]
        },
        {
          "time": 0.7,
          "value": [
            0,
            0
          ]
        }
      ]
    },
    "javaInaccuracy": {
      "stand": 7,
      "move": 8.5,
      "sneak": 6.5,
      "lie": 6,
      "aim": 0.075
    },
    "javaHeadshotMultiplier": 2,
    "javaArmorIgnore": 0.25
  },
  "t50": {
    "javaSourceId": "timeless50",
    "caliber": ".50 AE",
    "ammoId": "50ae",
    "ammoItem": "krep:ae50",
    "magazineSize": 8,
    "extendedMagSizes": [
      9,
      11,
      13
    ],
    "rpm": 300,
    "fireModes": [
      "semi"
    ],
    "fireMode": "semi",
    "reload": {
      "empty": 1.96,
      "tactical": 1.16
    },
    "drawTime": 0.46,
    "aimTime": 0.16,
    "weight": 1.65,
    "projectileSpeed": 160,
    "projectileLife": 1,
    "allowedAttachmentTypes": [
      "scope",
      "muzzle",
      "extended_mag",
      "laser"
    ],
    "builtinAttachments": {},
    "javaRecoil": {
      "pitch": [
        {
          "time": 0,
          "value": [
            1.5,
            1.5
          ]
        },
        {
          "time": 0.15,
          "value": [
            1.25,
            1.25
          ]
        },
        {
          "time": 0.4,
          "value": [
            -0.25,
            -0.15
          ]
        },
        {
          "time": 0.6,
          "value": [
            0.15,
            0.2
          ]
        },
        {
          "time": 0.65,
          "value": [
            0.05,
            0.05
          ]
        },
        {
          "time": 0.7,
          "value": [
            0,
            0
          ]
        }
      ],
      "yaw": [
        {
          "time": 0,
          "value": [
            -0.3,
            0.3
          ]
        },
        {
          "time": 0.45,
          "value": [
            0,
            0
          ]
        }
      ]
    },
    "javaInaccuracy": {
      "stand": 3,
      "move": 4,
      "sneak": 2,
      "lie": 1.5,
      "aim": 0.1
    },
    "javaHeadshotMultiplier": 1.5,
    "javaArmorIgnore": 0.25
  },
  "type81": {
    "javaSourceId": "type_81",
    "caliber": "7.62×39mm",
    "ammoId": "762x39",
    "ammoItem": "krep:m43",
    "magazineSize": 30,
    "extendedMagSizes": [
      33,
      36,
      40
    ],
    "rpm": 630,
    "fireModes": [
      "auto",
      "semi"
    ],
    "fireMode": "auto",
    "reload": {
      "empty": 2.25,
      "tactical": 1.4
    },
    "drawTime": 0.71,
    "aimTime": 0.15,
    "weight": 3.5,
    "projectileSpeed": 245,
    "projectileLife": 0.75,
    "allowedAttachmentTypes": [
      "muzzle",
      "extended_mag"
    ],
    "builtinAttachments": {},
    "javaRecoil": {
      "pitch": [
        {
          "time": 0,
          "value": [
            0.45,
            0.45
          ]
        },
        {
          "time": 0.25,
          "value": [
            0.45,
            0.45
          ]
        },
        {
          "time": 0.6,
          "value": [
            -0.125,
            -0.125
          ]
        },
        {
          "time": 0.7,
          "value": [
            0,
            0
          ]
        }
      ],
      "yaw": [
        {
          "time": 0,
          "value": [
            -0.25,
            0.25
          ]
        },
        {
          "time": 0.25,
          "value": [
            -0.25,
            0.25
          ]
        },
        {
          "time": 0.6,
          "value": [
            0,
            0
          ]
        }
      ]
    },
    "javaInaccuracy": {
      "stand": 5,
      "move": 5.5,
      "sneak": 2.5,
      "lie": 1.5,
      "aim": 0.125
    },
    "javaHeadshotMultiplier": 1.5,
    "javaArmorIgnore": 0.2
  },
  "vector": {
    "javaSourceId": "vector45",
    "caliber": ".45 ACP",
    "ammoId": "45acp",
    "ammoItem": "krep:acp45",
    "magazineSize": 20,
    "extendedMagSizes": [
      30,
      40,
      50
    ],
    "rpm": 1200,
    "fireModes": [
      "auto",
      "burst",
      "semi"
    ],
    "fireMode": "auto",
    "reload": {
      "empty": 2.03,
      "tactical": 1.67
    },
    "drawTime": 0.37,
    "aimTime": 0.08,
    "weight": 3.0,
    "projectileSpeed": 180,
    "projectileLife": 0.8,
    "allowedAttachmentTypes": [
      "scope",
      "stock",
      "grip",
      "muzzle",
      "laser",
      "extended_mag"
    ],
    "builtinAttachments": {},
    "javaRecoil": {
      "pitch": [
        {
          "time": 0,
          "value": [
            0.2,
            0.2
          ]
        },
        {
          "time": 0.1,
          "value": [
            0.2,
            0.2
          ]
        },
        {
          "time": 0.3,
          "value": [
            -0.2,
            -0.2
          ]
        },
        {
          "time": 0.45,
          "value": [
            0,
            0
          ]
        }
      ],
      "yaw": [
        {
          "time": 0,
          "value": [
            -0.65,
            0.5
          ]
        },
        {
          "time": 0.12,
          "value": [
            -0.65,
            0.5
          ]
        },
        {
          "time": 0.3,
          "value": [
            0,
            0
          ]
        }
      ]
    },
    "javaInaccuracy": {
      "stand": 3.5,
      "move": 4.5,
      "sneak": 2,
      "lie": 1,
      "aim": 0.175
    },
    "javaHeadshotMultiplier": 1.25,
    "javaArmorIgnore": 0.2
  },
  "rpg": {
    "javaSourceId": "rpg7",
    "caliber": "RPG Rocket",
    "ammoId": "rpg_rocket",
    "ammoItem": "krep:rpgrocket",
    "magazineSize": 1,
    "extendedMagSizes": [],
    "rpm": 150,
    "fireModes": [
      "semi"
    ],
    "fireMode": "semi",
    "reload": {
      "empty": 2.63,
      "tactical": 2.63
    },
    "drawTime": 0.75,
    "aimTime": 0.2,
    "weight": 6.3,
    "projectileSpeed": 80,
    "projectileLife": 3,
    "allowedAttachmentTypes": [],
    "builtinAttachments": {},
    "javaRecoil": {
      "pitch": [
        {
          "time": 0,
          "value": [
            2.5,
            2.5
          ]
        },
        {
          "time": 0.3,
          "value": [
            2.5,
            2.5
          ]
        },
        {
          "time": 0.55,
          "value": [
            -0.75,
            -0.75
          ]
        },
        {
          "time": 0.8,
          "value": [
            0.25,
            0.25
          ]
        },
        {
          "time": 1.2,
          "value": [
            0,
            0
          ]
        },
        {
          "time": 1.4,
          "value": [
            0,
            0
          ]
        }
      ],
      "yaw": [
        {
          "time": 0,
          "value": [
            -0.4,
            0.4
          ]
        },
        {
          "time": 0.55,
          "value": [
            0,
            0
          ]
        }
      ]
    },
    "javaInaccuracy": {
      "stand": 3,
      "move": 4,
      "sneak": 2,
      "lie": 1.5,
      "aim": 0.25
    },
    "javaHeadshotMultiplier": 1,
    "javaArmorIgnore": 0.0
  },
  "ump": {
    "javaSourceId": "ump45",
    "caliber": ".45 ACP",
    "ammoId": "45acp",
    "ammoItem": "krep:acp45",
    "magazineSize": 25,
    "extendedMagSizes": [
      32,
      40,
      48
    ],
    "rpm": 660,
    "fireModes": [
      "auto",
      "burst"
    ],
    "fireMode": "auto",
    "reload": {
      "empty": 2.37,
      "tactical": 1.57
    },
    "drawTime": 0.53,
    "aimTime": 0.12,
    "weight": 2.65,
    "projectileSpeed": 190,
    "projectileLife": 0.55,
    "allowedAttachmentTypes": [
      "scope",
      "muzzle",
      "grip",
      "extended_mag",
      "laser"
    ],
    "builtinAttachments": {},
    "javaRecoil": {
      "pitch": [
        {
          "time": 0,
          "value": [
            0.5,
            0.5
          ]
        },
        {
          "time": 0.2,
          "value": [
            0.5,
            0.5
          ]
        },
        {
          "time": 0.55,
          "value": [
            -0.15,
            -0.15
          ]
        },
        {
          "time": 0.7,
          "value": [
            0,
            0
          ]
        }
      ],
      "yaw": [
        {
          "time": 0,
          "value": [
            -0.2,
            0.15
          ]
        },
        {
          "time": 0.3,
          "value": [
            -0.2,
            0.15
          ]
        },
        {
          "time": 0.55,
          "value": [
            0,
            0
          ]
        }
      ]
    },
    "javaInaccuracy": {
      "stand": 3.25,
      "move": 4,
      "sneak": 2,
      "lie": 1.25,
      "aim": 0.2
    },
    "javaHeadshotMultiplier": 1.5,
    "javaArmorIgnore": 0.2
  },
  "m107": {
    "javaSourceId": "m107",
    "caliber": ".50 BMG",
    "ammoId": "50bmg",
    "ammoItem": "krep:50bmg",
    "magazineSize": 10,
    "extendedMagSizes": [
      12,
      14,
      20
    ],
    "rpm": 400,
    "fireModes": [
      "semi"
    ],
    "fireMode": "semi",
    "reload": {
      "empty": 4.3,
      "tactical": 3.28
    },
    "drawTime": 1.3,
    "aimTime": 0.23,
    "weight": 10.5,
    "projectileSpeed": 400,
    "projectileLife": 1.1,
    "allowedAttachmentTypes": [
      "scope",
      "extended_mag",
      "muzzle"
    ],
    "builtinAttachments": {},
    "javaRecoil": {
      "pitch": [
        {
          "time": 0,
          "value": [
            6.25,
            6.25
          ]
        },
        {
          "time": 0.1,
          "value": [
            4.5,
            4.5
          ]
        },
        {
          "time": 0.21,
          "value": [
            5.85,
            5.85
          ]
        },
        {
          "time": 0.33,
          "value": [
            4.5,
            4.5
          ]
        },
        {
          "time": 0.53,
          "value": [
            -0.5,
            -0.5
          ]
        },
        {
          "time": 0.72,
          "value": [
            0.25,
            0.25
          ]
        },
        {
          "time": 0.88,
          "value": [
            0,
            0
          ]
        },
        {
          "time": 1.1,
          "value": [
            0,
            0
          ]
        }
      ],
      "yaw": [
        {
          "time": 0,
          "value": [
            -3.75,
            -3.75
          ]
        },
        {
          "time": 0.12,
          "value": [
            2.75,
            2.75
          ]
        },
        {
          "time": 0.23,
          "value": [
            -0.75,
            -0.5
          ]
        },
        {
          "time": 0.33,
          "value": [
            0.25,
            0.5
          ]
        },
        {
          "time": 0.61,
          "value": [
            0,
            0
          ]
        }
      ]
    },
    "javaInaccuracy": {
      "stand": 5,
      "move": 5.5,
      "sneak": 3.5,
      "lie": 2.5,
      "aim": 0.05
    },
    "javaHeadshotMultiplier": 1.5,
    "javaArmorIgnore": 0.5
  },
  "m1911": {
    "javaSourceId": "m1911",
    "caliber": ".45 ACP",
    "ammoId": "45acp",
    "ammoItem": "krep:acp45",
    "magazineSize": 7,
    "extendedMagSizes": [
      9,
      12,
      14
    ],
    "rpm": 350,
    "fireModes": [
      "semi"
    ],
    "fireMode": "semi",
    "reload": {
      "empty": 1.5,
      "tactical": 1.16
    },
    "drawTime": 0.49,
    "aimTime": 0.08,
    "weight": 1.2,
    "projectileSpeed": 180,
    "projectileLife": 1,
    "allowedAttachmentTypes": [
      "muzzle",
      "extended_mag"
    ],
    "builtinAttachments": {},
    "javaRecoil": {
      "pitch": [
        {
          "time": 0,
          "value": [
            1.5,
            1.5
          ]
        },
        {
          "time": 0.2,
          "value": [
            0.1,
            0.1
          ]
        },
        {
          "time": 0.3,
          "value": [
            0.08,
            0.08
          ]
        },
        {
          "time": 0.4,
          "value": [
            0,
            0
          ]
        }
      ],
      "yaw": [
        {
          "time": 0,
          "value": [
            -0.65,
            -0.65
          ]
        },
        {
          "time": 0.05,
          "value": [
            0.35,
            0.35
          ]
        },
        {
          "time": 0.11,
          "value": [
            0.1,
            0.1
          ]
        },
        {
          "time": 0.28,
          "value": [
            0,
            0
          ]
        }
      ]
    },
    "javaInaccuracy": {
      "stand": 1.5,
      "move": 1.75,
      "sneak": 0.95,
      "lie": 0.75,
      "aim": 0.16
    },
    "javaHeadshotMultiplier": 1.5,
    "javaArmorIgnore": 0.2
  },
  "m249": {
    "javaSourceId": "m249",
    "caliber": "5.56×45mm",
    "ammoId": "556x45",
    "ammoItem": "krep:m885",
    "magazineSize": 75,
    "extendedMagSizes": [
      100,
      150,
      200
    ],
    "rpm": 750,
    "fireModes": [
      "auto"
    ],
    "fireMode": "auto",
    "reload": {
      "empty": 6.4,
      "tactical": 4.7
    },
    "drawTime": 1,
    "aimTime": 0.3,
    "weight": 8,
    "projectileSpeed": 280,
    "projectileLife": 1.0,
    "allowedAttachmentTypes": [
      "scope",
      "grip",
      "muzzle",
      "extended_mag"
    ],
    "builtinAttachments": {},
    "javaRecoil": {
      "pitch": [
        {
          "time": 0,
          "value": [
            0.4,
            0.4
          ]
        },
        {
          "time": 0.3,
          "value": [
            0.4,
            0.4
          ]
        },
        {
          "time": 0.5,
          "value": [
            -0.15,
            -0.15
          ]
        },
        {
          "time": 0.65,
          "value": [
            0,
            0
          ]
        }
      ],
      "yaw": [
        {
          "time": 0,
          "value": [
            -0.3,
            0.2
          ]
        },
        {
          "time": 0.3,
          "value": [
            -0.3,
            0.2
          ]
        },
        {
          "time": 0.5,
          "value": [
            0,
            0
          ]
        }
      ]
    },
    "javaInaccuracy": {
      "stand": 5.25,
      "move": 5.5,
      "sneak": 3,
      "lie": 2,
      "aim": 0.175
    },
    "javaHeadshotMultiplier": 1.5,
    "javaArmorIgnore": 0.3
  },
  "m4a1": {
    "javaSourceId": "m4a1",
    "caliber": "5.56×45mm",
    "ammoId": "556x45",
    "ammoItem": "krep:m885",
    "magazineSize": 30,
    "extendedMagSizes": [
      40,
      50,
      60
    ],
    "rpm": 810,
    "fireModes": [
      "auto",
      "semi"
    ],
    "fireMode": "auto",
    "reload": {
      "empty": 1.87,
      "tactical": 1.4
    },
    "drawTime": 0.3,
    "aimTime": 0.16,
    "weight": 3.5,
    "projectileSpeed": 270,
    "projectileLife": 0.75,
    "allowedAttachmentTypes": [
      "scope",
      "stock",
      "laser",
      "grip",
      "muzzle",
      "extended_mag"
    ],
    "builtinAttachments": {},
    "javaRecoil": {
      "pitch": [
        {
          "time": 0,
          "value": [
            0.55,
            0.55
          ]
        },
        {
          "time": 0.3,
          "value": [
            0.55,
            0.55
          ]
        },
        {
          "time": 0.5,
          "value": [
            -0.125,
            -0.125
          ]
        },
        {
          "time": 0.65,
          "value": [
            0,
            0
          ]
        }
      ],
      "yaw": [
        {
          "time": 0,
          "value": [
            -0.35,
            0.25
          ]
        },
        {
          "time": 0.3,
          "value": [
            -0.35,
            0.25
          ]
        },
        {
          "time": 0.5,
          "value": [
            0,
            0
          ]
        }
      ]
    },
    "javaInaccuracy": {
      "stand": 5,
      "move": 5.5,
      "sneak": 2.75,
      "lie": 1.5,
      "aim": 0.1
    },
    "javaHeadshotMultiplier": 1.5,
    "javaArmorIgnore": 0.2
  },
  "m16a1": {
    "javaSourceId": "m16a1",
    "caliber": "5.56×45mm",
    "ammoId": "556x45",
    "ammoItem": "krep:m885",
    "magazineSize": 20,
    "extendedMagSizes": [
      24,
      27,
      30
    ],
    "rpm": 750,
    "fireModes": [
      "auto",
      "semi"
    ],
    "fireMode": "auto",
    "reload": {
      "empty": 2.17,
      "tactical": 1.33
    },
    "drawTime": 0.43,
    "aimTime": 0.17,
    "weight": 3.6,
    "projectileSpeed": 310,
    "projectileLife": 0.75,
    "allowedAttachmentTypes": [
      "muzzle",
      "extended_mag",
      "scope"
    ],
    "builtinAttachments": {},
    "javaRecoil": {
      "pitch": [
        {
          "time": 0,
          "value": [
            0.375,
            0.375
          ]
        },
        {
          "time": 0.35,
          "value": [
            0.375,
            0.375
          ]
        },
        {
          "time": 0.55,
          "value": [
            -0.125,
            -0.125
          ]
        },
        {
          "time": 0.7,
          "value": [
            0,
            0
          ]
        }
      ],
      "yaw": [
        {
          "time": 0,
          "value": [
            -0.2,
            0.25
          ]
        },
        {
          "time": 0.3,
          "value": [
            -0.2,
            0.25
          ]
        },
        {
          "time": 0.5,
          "value": [
            0,
            0
          ]
        }
      ]
    },
    "javaInaccuracy": {
      "stand": 3.75,
      "move": 4.5,
      "sneak": 2.5,
      "lie": 1.75,
      "aim": 0.1
    },
    "javaHeadshotMultiplier": 1.5,
    "javaArmorIgnore": 0.25
  },
  "mk14": {
    "javaSourceId": "mk14",
    "caliber": ".308 Winchester",
    "ammoId": "308",
    "ammoItem": "krep:win308",
    "magazineSize": 10,
    "extendedMagSizes": [
      15,
      18,
      20
    ],
    "rpm": 300,
    "fireModes": [
      "semi",
      "auto"
    ],
    "fireMode": "semi",
    "reload": {
      "empty": 1.97,
      "tactical": 1.53
    },
    "drawTime": 0.47,
    "aimTime": 0.21,
    "weight": 5.1,
    "projectileSpeed": 310,
    "projectileLife": 0.8,
    "allowedAttachmentTypes": [
      "scope",
      "stock",
      "grip",
      "muzzle",
      "extended_mag",
      "laser"
    ],
    "builtinAttachments": {},
    "javaRecoil": {
      "pitch": [
        {
          "time": 0,
          "value": [
            1.75,
            1.85
          ]
        },
        {
          "time": 0.05,
          "value": [
            1.25,
            1.25
          ]
        },
        {
          "time": 0.12,
          "value": [
            1.5,
            1.5
          ]
        },
        {
          "time": 0.25,
          "value": [
            -0.15,
            -0.1
          ]
        },
        {
          "time": 0.5,
          "value": [
            0,
            0
          ]
        },
        {
          "time": 0.7,
          "value": [
            0.15,
            0.25
          ]
        },
        {
          "time": 0.9,
          "value": [
            0,
            0
          ]
        }
      ],
      "yaw": [
        {
          "time": 0,
          "value": [
            -0.5,
            0.35
          ]
        },
        {
          "time": 0.05,
          "value": [
            -0.5,
            0.35
          ]
        },
        {
          "time": 0.25,
          "value": [
            0,
            0
          ]
        }
      ]
    },
    "javaInaccuracy": {
      "stand": 5.5,
      "move": 6,
      "sneak": 3,
      "lie": 2,
      "aim": 0.05
    },
    "javaHeadshotMultiplier": 1.75,
    "javaArmorIgnore": 0.5
  },
  "p320": {
    "javaSourceId": "p320",
    "caliber": ".45 ACP",
    "ammoId": "45acp",
    "ammoItem": "krep:acp45",
    "magazineSize": 12,
    "extendedMagSizes": [
      14,
      16,
      18
    ],
    "rpm": 450,
    "fireModes": [
      "semi"
    ],
    "fireMode": "semi",
    "reload": {
      "empty": 1.96,
      "tactical": 1.16
    },
    "drawTime": 0.63,
    "aimTime": 0.16,
    "weight": 1.2,
    "projectileSpeed": 170,
    "projectileLife": 1,
    "allowedAttachmentTypes": [
      "scope",
      "muzzle",
      "extended_mag",
      "laser"
    ],
    "builtinAttachments": {},
    "javaRecoil": {
      "pitch": [
        {
          "time": 0,
          "value": [
            1,
            1
          ]
        },
        {
          "time": 0.15,
          "value": [
            1,
            1
          ]
        },
        {
          "time": 0.4,
          "value": [
            -0.15,
            -0.05
          ]
        },
        {
          "time": 0.6,
          "value": [
            0.15,
            0.2
          ]
        },
        {
          "time": 1.0,
          "value": [
            0,
            0
          ]
        }
      ],
      "yaw": [
        {
          "time": 0,
          "value": [
            -0.25,
            0.25
          ]
        },
        {
          "time": 0.45,
          "value": [
            0,
            0
          ]
        }
      ]
    },
    "javaInaccuracy": {
      "stand": 1.8,
      "move": 2,
      "sneak": 1.25,
      "lie": 0.75,
      "aim": 0.175
    },
    "javaHeadshotMultiplier": 1.75,
    "javaArmorIgnore": 0.2
  },
  "p90": {
    "javaSourceId": "p90",
    "caliber": "5.7×28mm",
    "ammoId": "57x28",
    "ammoItem": "krep:mm5728",
    "magazineSize": 50,
    "extendedMagSizes": [
      35,
      45,
      50
    ],
    "rpm": 810,
    "fireModes": [
      "auto",
      "burst"
    ],
    "fireMode": "auto",
    "reload": {
      "empty": 2.45,
      "tactical": 2.01
    },
    "drawTime": 0.75,
    "aimTime": 0.12,
    "weight": 2.5,
    "projectileSpeed": 310,
    "projectileLife": 0.8,
    "allowedAttachmentTypes": [
      "scope",
      "muzzle",
      "laser"
    ],
    "builtinAttachments": {
      "scope": "tacz:sight_p90"
    },
    "javaRecoil": {
      "pitch": [
        {
          "time": 0,
          "value": [
            0.65,
            0.65
          ]
        },
        {
          "time": 0.11,
          "value": [
            0.6,
            0.6
          ]
        },
        {
          "time": 0.21,
          "value": [
            0.5,
            0.5
          ]
        },
        {
          "time": 0.36,
          "value": [
            -0.1,
            -0.1
          ]
        },
        {
          "time": 0.55,
          "value": [
            0,
            0
          ]
        }
      ],
      "yaw": [
        {
          "time": 0,
          "value": [
            -0.25,
            0.25
          ]
        },
        {
          "time": 0.12,
          "value": [
            -0.1,
            0.1
          ]
        },
        {
          "time": 0.25,
          "value": [
            0,
            0
          ]
        },
        {
          "time": 0.45,
          "value": [
            0,
            0
          ]
        }
      ]
    },
    "javaInaccuracy": {
      "stand": 3.5,
      "move": 4,
      "sneak": 1.75,
      "lie": 1,
      "aim": 0.14
    },
    "javaHeadshotMultiplier": 1.25,
    "javaArmorIgnore": 0.7
  },
  "m870": {
    "javaSourceId": "m870",
    "caliber": "12 Gauge",
    "ammoId": "12g",
    "ammoItem": "krep:gauge12",
    "magazineSize": 5,
    "extendedMagSizes": [
      6,
      7,
      8
    ],
    "rpm": 180,
    "fireModes": [
      "semi"
    ],
    "fireMode": "semi",
    "reload": {
      "empty": 2.13,
      "tactical": 0.67
    },
    "drawTime": 0.25,
    "aimTime": 0.15,
    "weight": 3.2,
    "projectileSpeed": 150,
    "projectileLife": 0.6,
    "allowedAttachmentTypes": [
      "extended_mag",
      "muzzle"
    ],
    "builtinAttachments": {},
    "javaRecoil": {
      "pitch": [
        {
          "time": 0,
          "value": [
            5.5,
            5.5
          ]
        },
        {
          "time": 0.1,
          "value": [
            4.5,
            4.5
          ]
        },
        {
          "time": 0.13,
          "value": [
            5,
            5
          ]
        },
        {
          "time": 0.4,
          "value": [
            -0.5,
            -0.5
          ]
        },
        {
          "time": 0.53,
          "value": [
            0.25,
            0.25
          ]
        },
        {
          "time": 0.65,
          "value": [
            0,
            0
          ]
        },
        {
          "time": 0.7,
          "value": [
            0,
            0
          ]
        }
      ],
      "yaw": [
        {
          "time": 0,
          "value": [
            -1.75,
            -1.75
          ]
        },
        {
          "time": 0.1,
          "value": [
            -1.5,
            -1.5
          ]
        },
        {
          "time": 0.5,
          "value": [
            0.15,
            0.15
          ]
        },
        {
          "time": 0.65,
          "value": [
            0,
            0
          ]
        }
      ]
    },
    "javaInaccuracy": {
      "stand": 3.65,
      "move": 3.7,
      "sneak": 3.65,
      "lie": 3.5,
      "aim": 3.5
    },
    "javaHeadshotMultiplier": 1.33,
    "javaArmorIgnore": 0.25
  },
  "m1014": {
    "javaSourceId": "m1014",
    "caliber": "12 Gauge",
    "ammoId": "12g",
    "ammoItem": "krep:gauge12",
    "magazineSize": 6,
    "extendedMagSizes": [
      8,
      10,
      12
    ],
    "rpm": 200,
    "fireModes": [
      "semi"
    ],
    "fireMode": "semi",
    "reload": {
      "empty": 2.13,
      "tactical": 0.67
    },
    "drawTime": 0.4,
    "aimTime": 0.18,
    "weight": 3.8,
    "projectileSpeed": 150,
    "projectileLife": 0.6,
    "allowedAttachmentTypes": [
      "muzzle",
      "scope",
      "extended_mag"
    ],
    "builtinAttachments": {},
    "javaRecoil": {
      "pitch": [
        {
          "time": 0,
          "value": [
            4.5,
            4.5
          ]
        },
        {
          "time": 0.04,
          "value": [
            2.5,
            2.5
          ]
        },
        {
          "time": 0.08,
          "value": [
            4.6,
            4.6
          ]
        },
        {
          "time": 0.1,
          "value": [
            4.8,
            4.8
          ]
        },
        {
          "time": 0.13,
          "value": [
            4.5,
            4.5
          ]
        },
        {
          "time": 0.6,
          "value": [
            -0.5,
            -0.5
          ]
        },
        {
          "time": 0.73,
          "value": [
            0.25,
            0.25
          ]
        },
        {
          "time": 0.85,
          "value": [
            0,
            0
          ]
        },
        {
          "time": 0.9,
          "value": [
            0,
            0
          ]
        }
      ],
      "yaw": [
        {
          "time": 0,
          "value": [
            1.3,
            1.3
          ]
        },
        {
          "time": 0.04,
          "value": [
            -0.3,
            -0.3
          ]
        },
        {
          "time": 0.08,
          "value": [
            1.2,
            1.2
          ]
        },
        {
          "time": 0.12,
          "value": [
            0.8,
            0.8
          ]
        },
        {
          "time": 0.3,
          "value": [
            0.55,
            0.55
          ]
        },
        {
          "time": 0.45,
          "value": [
            0.2,
            0.2
          ]
        },
        {
          "time": 0.6,
          "value": [
            0,
            0
          ]
        },
        {
          "time": 0.75,
          "value": [
            0,
            0
          ]
        }
      ]
    },
    "javaInaccuracy": {
      "stand": 4.1,
      "move": 4.1,
      "sneak": 4,
      "lie": 3.95,
      "aim": 3.9
    },
    "javaHeadshotMultiplier": 1.33,
    "javaArmorIgnore": 0.25
  },
  "aa12": {
    "javaSourceId": "aa12",
    "caliber": "12 Gauge",
    "ammoId": "12g",
    "ammoItem": "krep:gauge12",
    "magazineSize": 8,
    "extendedMagSizes": [
      16,
      24,
      32
    ],
    "rpm": 350,
    "fireModes": [
      "semi",
      "auto"
    ],
    "fireMode": "semi",
    "reload": {
      "empty": 3,
      "tactical": 2.3
    },
    "drawTime": 0.55,
    "aimTime": 0.2,
    "weight": 5.2,
    "projectileSpeed": 130,
    "projectileLife": 0.6,
    "allowedAttachmentTypes": [
      "scope",
      "extended_mag",
      "grip",
      "muzzle"
    ],
    "builtinAttachments": {},
    "javaRecoil": {
      "pitch": [
        {
          "time": 0,
          "value": [
            0.25,
            0.25
          ]
        },
        {
          "time": 0.125,
          "value": [
            0.25,
            0.25
          ]
        },
        {
          "time": 0.4,
          "value": [
            -0.25,
            -0.25
          ]
        },
        {
          "time": 0.55,
          "value": [
            0,
            0
          ]
        }
      ],
      "yaw": [
        {
          "time": 0,
          "value": [
            -0.5,
            0.5
          ]
        },
        {
          "time": 0.1,
          "value": [
            -0.5,
            0.5
          ]
        },
        {
          "time": 0.2,
          "value": [
            0.15,
            0.15
          ]
        },
        {
          "time": 0.4,
          "value": [
            0,
            0
          ]
        }
      ]
    },
    "javaInaccuracy": {
      "stand": 4.5,
      "move": 4.75,
      "sneak": 4,
      "lie": 4,
      "aim": 4
    },
    "javaHeadshotMultiplier": 1.33,
    "javaArmorIgnore": 0.0
  },
  "minigun": {
    "javaSourceId": "minigun",
    "caliber": ".308 Winchester",
    "ammoId": "308",
    "ammoItem": "krep:win308",
    "magazineSize": null,
    "extendedMagSizes": [],
    "rpm": 1200,
    "fireModes": [
      "auto",
      "burst"
    ],
    "fireMode": "auto",
    "reload": {
      "empty": 2.25,
      "tactical": 1.55
    },
    "drawTime": 1.4,
    "aimTime": 0.25,
    "weight": 15.5,
    "projectileSpeed": 340,
    "projectileLife": 0.8,
    "allowedAttachmentTypes": [],
    "builtinAttachments": {},
    "javaRecoil": {
      "pitch": [
        {
          "time": 0,
          "value": [
            0.6,
            0.6
          ]
        },
        {
          "time": 0.25,
          "value": [
            0.6,
            0.6
          ]
        },
        {
          "time": 0.45,
          "value": [
            -0.15,
            -0.15
          ]
        },
        {
          "time": 0.6,
          "value": [
            0,
            0
          ]
        }
      ],
      "yaw": [
        {
          "time": 0,
          "value": [
            -0.3,
            0.2
          ]
        },
        {
          "time": 0.2,
          "value": [
            -0.3,
            0.2
          ]
        },
        {
          "time": 0.4,
          "value": [
            0,
            0
          ]
        }
      ]
    },
    "javaInaccuracy": {
      "stand": 2.25,
      "move": 3,
      "sneak": 2.25,
      "lie": 2.25,
      "aim": 0.8
    },
    "javaHeadshotMultiplier": 1.5,
    "javaArmorIgnore": 0.5
  },
  "uzi": {
    "javaSourceId": "uzi",
    "caliber": "9mm",
    "ammoId": "9mm",
    "ammoItem": "krep:mm9",
    "magazineSize": 20,
    "extendedMagSizes": [
      32,
      40,
      50
    ],
    "rpm": 600,
    "fireModes": [
      "auto"
    ],
    "fireMode": "auto",
    "reload": {
      "empty": 1.97,
      "tactical": 1.17
    },
    "drawTime": 0.42,
    "aimTime": 0.12,
    "weight": 4,
    "projectileSpeed": 180,
    "projectileLife": 0.65,
    "allowedAttachmentTypes": [
      "scope",
      "muzzle",
      "extended_mag"
    ],
    "builtinAttachments": {},
    "javaRecoil": {
      "pitch": [
        {
          "time": 0,
          "value": [
            0.35,
            0.35
          ]
        },
        {
          "time": 0.3,
          "value": [
            0.35,
            0.35
          ]
        },
        {
          "time": 0.55,
          "value": [
            -0.15,
            -0.15
          ]
        },
        {
          "time": 0.7,
          "value": [
            0,
            0
          ]
        }
      ],
      "yaw": [
        {
          "time": 0,
          "value": [
            -0.15,
            0.15
          ]
        },
        {
          "time": 0.3,
          "value": [
            -0.15,
            0.15
          ]
        },
        {
          "time": 0.55,
          "value": [
            0,
            0
          ]
        }
      ]
    },
    "javaInaccuracy": {
      "stand": 3.5,
      "move": 4,
      "sneak": 2,
      "lie": 1,
      "aim": 0.22
    },
    "javaHeadshotMultiplier": 1.25,
    "javaArmorIgnore": 0.15
  }
});