export const CALIBERS = Object.freeze({
  "12g": Object.freeze({ id: "12g", name: "12 Gauge", itemId: "krep:gauge12" }),
  "22wmr": Object.freeze({ id: "22wmr", name: ".22 WMR", itemId: "krep:ammo_22wmr" }),
  "30_06": Object.freeze({ id: "30_06", name: ".30-06 Springfield", itemId: "krep:ammo_30_06" }),
  "357mag": Object.freeze({ id: "357mag", name: ".357 Magnum", itemId: "krep:mag357" }),
  "40mm": Object.freeze({ id: "40mm", name: "40mm Grenade", itemId: "krep:ammo_40mm" }),
  "45_70": Object.freeze({ id: "45_70", name: ".45-70 Government", itemId: "krep:ammo_45_70" }),
  "45acp": Object.freeze({ id: "45acp", name: ".45 ACP", itemId: "krep:acp45" }),
  "500mag": Object.freeze({ id: "500mag", name: ".500 Magnum", itemId: "krep:ammo_500mag" }),
  "50bmg": Object.freeze({ id: "50bmg", name: ".50 BMG", itemId: "krep:50bmg" }),
  "556x45": Object.freeze({ id: "556x45", name: "5.56\u00d745mm", itemId: "krep:m885" }),
  "762x39": Object.freeze({ id: "762x39", name: "7.62\u00d739mm", itemId: "krep:m43" }),
  "792x57": Object.freeze({ id: "792x57", name: "7.92\u00d757mm", itemId: "krep:ammo_792x57" }),
  "9mm": Object.freeze({ id: "9mm", name: "9mm", itemId: "krep:mm9" }),
});
export function getCaliber(id) { return CALIBERS[id]; }
