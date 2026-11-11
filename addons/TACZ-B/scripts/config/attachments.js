// =====================================================================================
// ATTACHMENTS: what the attachment workbench offers for each gun. Order = workbench menu order.
//
// A gun has a list of slots (the buttons in its menu):
//   { label, icon, property, options, last }  Numbered attachment stored per player and
//       synced to the entity property krep:<property> (stock | grip | laser | muzzle |
//       magazine), which the resource pack reads to show the part. options[i] = [label, icon]
//       and option i sets the value i. last = "preview" (default) or "back" for the extra
//       button after the options.
//   { label, icon, sights }  Sight choices: [label, icon, entity event], e.g. "m4a1:acog".
//   { label, icon, preview: true }  Shows the gun with its attachments.
// sightsOnly: the gun's menu is just a sight list (no hold check).
// =====================================================================================

// Aiming (crouching) with a magnifying sight zooms the camera to this field of view (degrees; the game allows
// 30-110, so 30 is the strongest zoom). User, 2026-10-04: the sniper scope zooms most, ACOG / ELCAN a little;
// red dots and iron sights don't zoom. combat/aimZoom.js.
export const SIGHT_ZOOM = Object.freeze({ standard_8: 30, acog: 50, elcan: 50 });
// Seconds to ease into / out of the zoom.
export const ZOOM_EASE = Object.freeze({ in: 0.2, out: 0.15 });
// Java magnified scopes (javaAttachments.js): field of view for Java's zoom value, kept mild like the ACOG / ELCAN
// above: 2.5x ACOG 55, 3x 50, 4.25x ELCAN 38, 8x 30 (the game's minimum).
export const javaScopeFov = (zoom) => Math.max(30, Math.round(70 - 10 * (zoom - 1)));

// (Loosely typed for editors and type checks: entries have different optional fields.)
export const ATTACHMENTS = /** @type {Record<string, any>} */ (Object.freeze({
  mp5: {
    menuLabel: "MP5",
    menuIcon: "textures/items/mp5",
    slots: [
      {
        label: "Grip",
        icon: "textures/ui/new/grip1",
        property: "grip",
        options: [
          ["No Grip", "textures/ui/zero/zero_grip"],
          ["Grip 1", "textures/ui/new/grip1"],
          ["Grip 2", "textures/ui/new/grip2"],
          ["Grip 3", "textures/ui/new/grip3"],
          ["Grip 4", "textures/ui/new/grip4"],
          ["Grip 5", "textures/ui/new/grip5"],
          ["Grip 6", "textures/ui/new/grip6"],
          ["Grip 7", "textures/ui/new/grip7"],
          ["Grip 8", "textures/ui/new/grip8"],
          ["Grip 9", "textures/ui/new/grip9"],
          ["Grip 10", "textures/ui/new/grip10"],
          ["Grip 11", "textures/ui/new/grip11"],
        ],
      },
      {
        label: "Stock",
        icon: "textures/ui/new/stock8",
        property: "stock",
        options: [
          ["No Stock", "textures/ui/zero/zero_stock"],
          ["Stock 1", "textures/ui/new/stock1"],
          ["Stock 2", "textures/ui/new/stock2"],
          ["Stock 3", "textures/ui/new/stock3"],
          ["Stock 4", "textures/ui/new/stock4"],
          ["Stock 5", "textures/ui/new/stock5"],
          ["Stock 6", "textures/ui/new/stock6"],
          ["Stock 7", "textures/ui/new/stock7"],
          ["Stock 8", "textures/ui/new/stock8"],
          ["Stock 9", "textures/ui/new/stock9"],
          ["Stock 10", "textures/ui/new/stock10"],
          ["Stock 11", "textures/ui/new/stock11"],
        ],
      },
      {
        label: "Laser",
        icon: "textures/ui/new/laser1",
        property: "laser",
        options: [
          ["No Laser", "textures/ui/zero/zero_laser"],
          ["Laser 1", "textures/ui/new/laser1"],
        ],
      },
      {
        label: "Muzzle",
        icon: "textures/ui/new/muzzle1",
        property: "muzzle",
        options: [
          ["No Muzzle", "textures/ui/zero/zero_muzzle"],
          ["Muzzle 1", "textures/ui/new/muzzle1"],
          ["Muzzle 2", "textures/ui/new/muzzle2"],
          ["Muzzle 3", "textures/ui/new/muzzle3"],
          ["Muzzle 4", "textures/ui/new/muzzle4"],
          ["Muzzle 5", "textures/ui/new/muzzle5"],
          ["Muzzle 6", "textures/ui/new/muzzle6"],
        ],
      },
      {
        label: "Sight",
        icon: "textures/ui/coyote",
        sights: [
          ["Iron Sight", "textures/ui/nothing", "mp5:ironsight"],
          ["Coyote", "textures/ui/coyote", "mp5:coyote"],
          ["Holo 552", "textures/ui/holo", "mp5:holo"],
          ["T2", "textures/ui/t2", "mp5:t2"],
        ],
      },
      { label: "Preview", icon: "textures/ui/blank", preview: true },
    ],
  },
  vector: {
    menuLabel: "Vector",
    menuIcon: "textures/items/vector",
    slots: [
      {
        label: "Grip",
        icon: "textures/ui/new/grip1",
        property: "grip",
        options: [
          ["No Grip", "textures/ui/zero/zero_grip"],
          ["Grip 1", "textures/ui/new/vector/grip1"],
          ["Grip 2", "textures/ui/new/vector/grip2"],
          ["Grip 3", "textures/ui/new/vector/grip3"],
          ["Grip 4", "textures/ui/new/vector/grip4"],
          ["Grip 5", "textures/ui/new/vector/grip5"],
          ["Grip 6", "textures/ui/new/vector/grip6"],
          ["Grip 7", "textures/ui/new/vector/grip7"],
          ["Grip 8", "textures/ui/new/vector/grip8"],
        ],
      },
      {
        label: "Stock",
        icon: "textures/ui/new/stock8",
        property: "stock",
        options: [
          ["No Stock", "textures/ui/zero/zero_stock"],
          ["Stock 1", "textures/ui/new/stock1"],
          ["Stock 2", "textures/ui/new/stock2"],
          ["Stock 3", "textures/ui/new/stock3"],
          ["Stock 4", "textures/ui/new/stock4"],
          ["Stock 5", "textures/ui/new/stock5"],
          ["Stock 6", "textures/ui/new/stock6"],
          ["Stock 7", "textures/ui/new/stock7"],
          ["Stock 8", "textures/ui/new/stock8"],
          ["Stock 9", "textures/ui/new/stock9"],
          ["Stock 10", "textures/ui/new/stock10"],
          ["Stock 11", "textures/ui/new/stock11"],
        ],
      },
      {
        label: "Laser",
        icon: "textures/ui/new/laser1",
        property: "laser",
        options: [
          ["No Laser", "textures/ui/zero/zero_laser"],
          ["Laser 1", "textures/ui/new/laser1"],
        ],
      },
      {
        label: "Muzzle",
        icon: "textures/ui/new/muzzle1",
        property: "muzzle",
        options: [
          ["No Muzzle", "textures/ui/zero/zero_muzzle"],
          ["Muzzle 1", "textures/ui/new/muzzle1"],
          ["Muzzle 2", "textures/ui/new/muzzle2"],
          ["Muzzle 3", "textures/ui/new/muzzle3"],
          ["Muzzle 4", "textures/ui/new/muzzle4"],
          ["Muzzle 5", "textures/ui/new/muzzle5"],
          ["Muzzle 6", "textures/ui/new/muzzle6"],
        ],
      },
      {
        label: "Sight",
        icon: "textures/ui/coyote",
        sights: [
          ["Iron Sight", "textures/ui/nothing", "vector:ironsight"],
          ["Coyote", "textures/ui/coyote", "vector:coyote"],
          ["Holo 552", "textures/ui/holo", "vector:holo"],
          ["T2", "textures/ui/t2", "vector:t2"],
        ],
      },
      {
        label: "Magazine",
        icon: "textures/ui/new/magazine1",
        property: "magazine",
        last: "back",
        options: [
          ["No Extension", "textures/blocks/barrier"],
          ["Extended 1", "textures/ui/new/magazine1"],
          ["Extended 2", "textures/ui/new/magazine2"],
          ["Extended 3", "textures/ui/new/magazine3"],
        ],
      },
      { label: "Preview", icon: "textures/ui/blank", preview: true },
    ],
  },
  g17: {
    menuLabel: "Glock 17",
    menuIcon: "textures/items/g17",
    slots: [
      {
        label: "Laser",
        icon: "textures/ui/new/g17/laser1",
        property: "laser",
        options: [
          ["No Laser", "textures/ui/zero/zero_laser"],
          ["Laser 1", "textures/ui/new/g17/laser1"],
        ],
      },
      {
        label: "Muzzle",
        icon: "textures/ui/new/muzzle1",
        property: "muzzle",
        options: [
          ["No Muzzle", "textures/ui/zero/zero_muzzle"],
          ["Muzzle 1", "textures/ui/new/g17/muzzle1"],
          ["Muzzle 2", "textures/ui/new/g17/muzzle2"],
        ],
      },
      { label: "Preview", icon: "textures/ui/blank", preview: true },
    ],
  },
  akm: {
    menuLabel: "AKM",
    menuIcon: "textures/items/akm",
    slots: [
      {
        label: "Stock",
        icon: "textures/ui/new/stock8",
        property: "stock",
        options: [
          ["No Stock", "textures/ui/zero/zero_stock"],
          ["Stock 1", "textures/ui/new/stock1"],
          ["Stock 2", "textures/ui/new/stock2"],
          ["Stock 3", "textures/ui/new/stock3"],
          ["Stock 4", "textures/ui/new/stock4"],
          ["Stock 5", "textures/ui/new/stock5"],
          ["Stock 6", "textures/ui/new/stock6"],
          ["Stock 7", "textures/ui/new/stock7"],
          ["Stock 8", "textures/ui/new/stock8"],
          ["Stock 9", "textures/ui/new/stock9"],
          ["Stock 10", "textures/ui/new/stock10"],
          ["Stock 11", "textures/ui/new/stock11"],
        ],
      },
      {
        label: "Muzzle",
        icon: "textures/ui/new/muzzle1",
        property: "muzzle",
        options: [
          ["No Muzzle", "textures/ui/zero/zero_muzzle"],
          ["Muzzle 1", "textures/ui/new/muzzle1"],
          ["Muzzle 2", "textures/ui/new/muzzle2"],
          ["Muzzle 3", "textures/ui/new/muzzle3"],
          ["Muzzle 4", "textures/ui/new/muzzle4"],
          ["Muzzle 5", "textures/ui/new/muzzle5"],
          ["Muzzle 6", "textures/ui/new/muzzle6"],
        ],
      },
      {
        label: "Sight",
        icon: "textures/ui/coyote",
        sights: [
          ["Iron Sight", "textures/ui/nothing", "akm:ironsight"],
          ["Coyote", "textures/ui/coyote", "akm:coyote"],
          ["Holo 552", "textures/ui/holo", "akm:holo"],
          ["OKP-7", "textures/ui/okp7", "akm:okp7"],
          ["Acog", "textures/ui/acog", "akm:acog"],
          ["Elcan", "textures/ui/elcan", "akm:elcan"],
        ],
      },
      { label: "Preview", icon: "textures/ui/blank", preview: true },
    ],
  },
  hk416: {
    menuLabel: "HK416",
    menuIcon: "textures/items/hk416",
    slots: [
      {
        label: "Grip",
        icon: "textures/ui/new/grip1",
        property: "grip",
        options: [
          ["No Grip", "textures/ui/zero/zero_grip"],
          ["Grip 1", "textures/ui/new/grip1"],
          ["Grip 2", "textures/ui/new/grip2"],
          ["Grip 3", "textures/ui/new/grip3"],
          ["Grip 4", "textures/ui/new/grip4"],
          ["Grip 5", "textures/ui/new/grip5"],
          ["Grip 6", "textures/ui/new/grip6"],
          ["Grip 7", "textures/ui/new/grip7"],
          ["Grip 8", "textures/ui/new/grip8"],
          ["Grip 9", "textures/ui/new/grip9"],
          ["Grip 10", "textures/ui/new/grip10"],
          ["Grip 11", "textures/ui/new/grip11"],
        ],
      },
      {
        label: "Stock",
        icon: "textures/ui/new/stock8",
        property: "stock",
        options: [
          ["No Stock", "textures/ui/zero/zero_stock"],
          ["Stock 1", "textures/ui/new/m4a1/stock1"],
          ["Stock 2", "textures/ui/new/m4a1/stock2"],
          ["Stock 3", "textures/ui/new/m4a1/stock3"],
          ["Stock 4", "textures/ui/new/m4a1/stock4"],
          ["Stock 5", "textures/ui/new/m4a1/stock5"],
          ["Stock 6", "textures/ui/new/m4a1/stock6"],
          ["Stock 7", "textures/ui/new/m4a1/stock7"],
          ["Stock 8", "textures/ui/new/m4a1/stock8"],
        ],
      },
      {
        label: "Laser",
        icon: "textures/ui/new/laser1",
        property: "laser",
        options: [
          ["No Laser", "textures/ui/zero/zero_laser"],
          ["Laser 1", "textures/ui/new/laser1"],
        ],
      },
      {
        label: "Muzzle",
        icon: "textures/ui/new/muzzle1",
        property: "muzzle",
        options: [
          ["No Muzzle", "textures/ui/zero/zero_muzzle"],
          ["Muzzle 1", "textures/ui/new/muzzle1"],
          ["Muzzle 2", "textures/ui/new/muzzle2"],
          ["Muzzle 3", "textures/ui/new/muzzle3"],
          ["Muzzle 4", "textures/ui/new/muzzle4"],
          ["Muzzle 5", "textures/ui/new/muzzle5"],
          ["Muzzle 6", "textures/ui/new/muzzle6"],
        ],
      },
      {
        label: "Sight",
        icon: "textures/ui/coyote",
        sights: [
          ["Iron Sight", "textures/ui/nothing", "hk416:ironsight"],
          ["Coyote", "textures/ui/coyote", "hk416:coyote"],
          ["Holo 552", "textures/ui/holo", "hk416:holo"],
          ["T2", "textures/ui/t2", "hk416:t2"],
          ["Acog", "textures/ui/acog", "hk416:acog"],
          ["Elcan", "textures/ui/elcan", "hk416:elcan"],
        ],
      },
      { label: "Preview", icon: "textures/ui/blank", preview: true },
    ],
  },
  awp: {
    menuLabel: "AWM",
    menuIcon: "textures/items/awp",
    sightsOnly: true,
    title: "AWM Scope",
    body: "Im still not done with this gun, just wait for another update",
    sights: [
      ["Iron Sight", "textures/ui/nothing", "awp:ironsight"],
      ["Coyote", "textures/ui/coyote", "awp:coyote"],
      ["Acog", "textures/ui/acog", "awp:acog"],
      ["Elcan", "textures/ui/elcan", "awp:elcan"],
      ["Standard 8", "textures/ui/standard_8", "awp:standard_8"],
    ],
  },
  deagleg: {
    menuLabel: "Golden Deagle",
    menuIcon: "textures/items/deagleg",
    slots: [
      {
        label: "Laser",
        icon: "textures/ui/new/laser1",
        property: "laser",
        options: [
          ["No Laser", "textures/ui/zero/zero_laser"],
          ["Laser 1", "textures/ui/new/g17/laser1"],
        ],
      },
      {
        label: "Muzzle",
        icon: "textures/ui/new/deagleg/muzzle1",
        property: "muzzle",
        options: [
          ["No Muzzle", "textures/ui/zero/zero_muzzle"],
          ["Muzzle 1", "textures/ui/new/deagleg/muzzle1"],
        ],
      },
      {
        label: "Magazine",
        icon: "textures/ui/new/magazine1",
        property: "magazine",
        last: "back",
        options: [
          ["No Extension", "textures/blocks/barrier"],
          ["Extended 1", "textures/ui/new/magazine1"],
          ["Extended 2", "textures/ui/new/magazine2"],
          ["Extended 3", "textures/ui/new/magazine3"],
        ],
      },
      { label: "Preview", icon: "textures/ui/blank", preview: true },
    ],
  },
  db: {
    menuLabel: "Double Barrel",
    menuIcon: "textures/items/db",
    slots: [
      {
        label: "Stock",
        icon: "textures/ui/new/stock3",
        property: "stock",
        options: [
          ["No Stock", "textures/ui/zero/zero_stock"],
          ["Stock 1", "textures/ui/new/stock1"],
        ],
      },
      {
        label: "Barrel",
        icon: "textures/ui/new/db/barrel1",
        property: "muzzle",
        options: [
          ["Short Barrel", "textures/ui/new/db/barrel0"],
          ["Long Barrel", "textures/ui/new/db/barrel1"],
        ],
      },
      { label: "Preview", icon: "textures/ui/blank", preview: true },
    ],
  },
  fal: {
    menuLabel: "FAL",
    menuIcon: "textures/items/fal",
    slots: [
      {
        label: "Grip",
        icon: "textures/ui/new/grip1",
        property: "grip",
        options: [
          ["No Grip", "textures/ui/zero/zero_grip"],
          ["Grip 1", "textures/ui/new/grip1"],
          ["Grip 2", "textures/ui/new/grip2"],
          ["Grip 3", "textures/ui/new/grip3"],
          ["Grip 4", "textures/ui/new/grip4"],
          ["Grip 5", "textures/ui/new/grip5"],
          ["Grip 6", "textures/ui/new/grip6"],
          ["Grip 7", "textures/ui/new/grip7"],
          ["Grip 8", "textures/ui/new/grip8"],
          ["Grip 9", "textures/ui/new/grip9"],
          ["Grip 10", "textures/ui/new/grip10"],
          ["Grip 11", "textures/ui/new/grip11"],
        ],
      },
      {
        label: "Stock",
        icon: "textures/ui/new/stock8",
        property: "stock",
        options: [
          ["No Stock", "textures/ui/zero/zero_stock"],
          ["Stock 1", "textures/ui/new/stock1"],
          ["Stock 2", "textures/ui/new/stock2"],
          ["Stock 3", "textures/ui/new/stock3"],
          ["Stock 4", "textures/ui/new/stock4"],
          ["Stock 5", "textures/ui/new/stock5"],
          ["Stock 6", "textures/ui/new/stock6"],
          ["Stock 7", "textures/ui/new/stock7"],
          ["Stock 8", "textures/ui/new/stock8"],
          ["Stock 9", "textures/ui/new/stock9"],
          ["Stock 10", "textures/ui/new/stock10"],
          ["Stock 11", "textures/ui/new/stock11"],
        ],
      },
      {
        label: "Laser",
        icon: "textures/ui/new/laser1",
        property: "laser",
        options: [
          ["No Laser", "textures/ui/zero/zero_laser"],
          ["Laser 1", "textures/ui/new/laser1"],
        ],
      },
      {
        label: "Sight",
        icon: "textures/ui/coyote",
        sights: [
          ["Iron Sight", "textures/ui/nothing", "fal:ironsight"],
          ["Coyote", "textures/ui/coyote", "fal:coyote"],
        ],
      },
      { label: "Preview", icon: "textures/ui/blank", preview: true },
    ],
  },
  mk14: {
    menuLabel: "MK14",
    menuIcon: "textures/items/mk14",
    slots: [
      {
        label: "Grip",
        icon: "textures/ui/new/grip1",
        property: "grip",
        options: [
          ["No Grip", "textures/ui/zero/zero_grip"],
          ["Grip 1", "textures/ui/new/grip1"],
          ["Grip 2", "textures/ui/new/grip2"],
          ["Grip 3", "textures/ui/new/grip3"],
          ["Grip 4", "textures/ui/new/grip4"],
          ["Grip 5", "textures/ui/new/grip5"],
          ["Grip 6", "textures/ui/new/grip6"],
          ["Grip 7", "textures/ui/new/grip7"],
          ["Grip 8", "textures/ui/new/grip8"],
          ["Grip 9", "textures/ui/new/grip9"],
          ["Grip 10", "textures/ui/new/grip10"],
          ["Grip 11", "textures/ui/new/grip11"],
        ],
      },
      {
        label: "Stock",
        icon: "textures/ui/new/stock8",
        property: "stock",
        options: [
          ["No Stock", "textures/ui/zero/zero_stock"],
          ["Stock 1", "textures/ui/new/m4a1/stock1"],
          ["Stock 2", "textures/ui/new/m4a1/stock2"],
          ["Stock 3", "textures/ui/new/m4a1/stock3"],
          ["Stock 4", "textures/ui/new/m4a1/stock4"],
          ["Stock 5", "textures/ui/new/m4a1/stock5"],
          ["Stock 6", "textures/ui/new/m4a1/stock6"],
          ["Stock 7", "textures/ui/new/m4a1/stock7"],
          ["Stock 8", "textures/ui/new/m4a1/stock8"],
        ],
      },
      {
        label: "Laser",
        icon: "textures/ui/new/laser1",
        property: "laser",
        options: [
          ["No Laser", "textures/ui/zero/zero_laser"],
          ["Laser 1", "textures/ui/new/laser1"],
        ],
      },
      {
        label: "Sight",
        icon: "textures/ui/coyote",
        sights: [
          ["Iron Sight", "textures/ui/nothing", "mk14:ironsight"],
          ["Coyote", "textures/ui/coyote", "mk14:coyote"],
        ],
      },
      { label: "Preview", icon: "textures/ui/blank", preview: true },
    ],
  },
  qbz191: {
    menuLabel: "QBZ-191",
    menuIcon: "textures/items/qbz191",
    slots: [
      {
        label: "Grip",
        icon: "textures/ui/new/grip1",
        property: "grip",
        options: [
          ["No Grip", "textures/ui/zero/zero_grip"],
          ["Grip 1", "textures/ui/new/grip1"],
          ["Grip 2", "textures/ui/new/grip2"],
          ["Grip 3", "textures/ui/new/grip3"],
          ["Grip 4", "textures/ui/new/grip4"],
          ["Grip 5", "textures/ui/new/grip5"],
          ["Grip 6", "textures/ui/new/grip6"],
          ["Grip 7", "textures/ui/new/grip7"],
          ["Grip 8", "textures/ui/new/grip8"],
          ["Grip 9", "textures/ui/new/grip9"],
          ["Grip 10", "textures/ui/new/grip10"],
          ["Grip 11", "textures/ui/new/grip11"],
        ],
      },
      {
        label: "Laser",
        icon: "textures/ui/new/laser1",
        property: "laser",
        options: [
          ["No Laser", "textures/ui/zero/zero_laser"],
          ["Laser 1", "textures/ui/new/laser1"],
        ],
      },
      {
        label: "Sight",
        icon: "textures/ui/coyote",
        sights: [
          ["Iron Sight", "textures/ui/nothing", "qbz191:ironsight"],
          ["Coyote", "textures/ui/coyote", "qbz191:coyote"],
        ],
      },
      { label: "Preview", icon: "textures/ui/blank", preview: true },
    ],
  },
}));
