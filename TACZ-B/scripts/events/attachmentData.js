import * as mc from "@minecraft/server";
const allowedItems = [
  { normal: "krep:mp5", empty: "krep:mp5_emp", key: "krep_mp5" },
  { normal: "krep:vector", empty: "krep:vector_emp", key: "krep_vector" },
  { normal: "krep:g17", empty: "krep:g17_emp", key: "krep_g17" },
  { normal: "krep:akm", empty: "krep:akm_emp", key: "krep_akm" },
  { normal: "krep:m4a1", empty: "krep:m4a1_emp", key: "krep_m4a1" },
  { normal: "krep:hk416", empty: "krep:hk416_emp", key: "krep_hk416" },
  { normal: "krep:deagleg", empty: "krep:deagleg_emp", key: "krep_deagleg" },
  { normal: "krep:db", empty: "krep:db_emp", key: "krep_db" },
  { normal: "krep:fal", empty: "krep:fal_emp", key: "krep_fal" },
  { normal: "krep:mk14", empty: "krep:mk14_emp", key: "krep_mk14" },
  { normal: "krep:qbz191", empty: "krep:qbz191_emp", key: "krep_qbz191" },
];
export function getDynamicPropertyKey(arg) {
  const found = allowedItems.find(
    (allowedItem) => allowedItem.normal === arg || allowedItem.empty === arg,
  );
  return found ? found.key : null;
}
export function isAllowed(arg) {
  return allowedItems.some(
    (allowedItem) => allowedItem.normal === arg || allowedItem.empty === arg,
  );
}
export function setAksesoris(arg, arg2, value = {}) {
  const dynamicPropertyKey = getDynamicPropertyKey(arg2);
  if (!dynamicPropertyKey) return;
  let [value2 = 0, value3 = 0, value4 = 0, value5 = 0, value6 = 0] = (
    arg.getDynamicProperty(dynamicPropertyKey)?.split(",") || []
  ).map(Number);
  ((value2 = value.stock ?? value2 ?? 0),
    (value3 = value.grip ?? value3 ?? 0),
    (value4 = value.laser ?? value4 ?? 0),
    (value5 = value.muzzle ?? value5 ?? 0),
    (value6 = value.magazine ?? value6 ?? 0),
    arg.setDynamicProperty(
      dynamicPropertyKey,
      value2 + "," + value3 + "," + value4 + "," + value5 + "," + value6,
    ));
}
((mc.Player.prototype.setAksesoris = function (arg, arg2) {
  setAksesoris(this, arg, arg2);
}),
  mc.system.runInterval(() => {
    for (const player of mc.world.getPlayers()) {
      const equippable = player.getComponent("minecraft:equippable"),
        mainhandItem = equippable.getEquipment("Mainhand");
      if (!mainhandItem?.typeId) continue;
      const typeId = mainhandItem.typeId;
      if (!isAllowed(typeId)) continue;
      const dynamicPropertyKey = getDynamicPropertyKey(typeId);
      if (!dynamicPropertyKey) continue;
      const [value = 0, value2 = 0, value3 = 0, value4 = 0, value5 = 0] = (
        player.getDynamicProperty(dynamicPropertyKey)?.split(",") || []
      ).map(Number);
      (player.setProperty("krep:stock", value),
        player.setProperty("krep:grip", value2),
        player.setProperty("krep:laser", value3),
        player.setProperty("krep:muzzle", value4),
        player.setProperty("krep:magazine", value5));
    }
  }, 2));
