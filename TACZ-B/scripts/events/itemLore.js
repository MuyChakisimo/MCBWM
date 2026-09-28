import * as mc from "@minecraft/server";
const itemIDs = {
  "krep:ammoboxc": () => [{ translate: "krep:box.ammoboxc.lore" }],
  "krep:rpgrocket": () => [{ translate: "krep:rocket.lore.rpgrocket" }],
  "krep:m43": () => [{ translate: "krep:ammo.lore.m43" }],
  "krep:mm5842": () => [{ translate: "krep:ammo.lore.5842mm" }],
  "krep:mm5728": () => [{ translate: "krep:ammo.lore.5728mm" }],
  "krep:mm4630": () => [{ translate: "krep:ammo.lore.4630mm" }],
  "krep:mag357": () => [{ translate: "krep:ammo.lore.357mag" }],
  "krep:win308": () => [{ translate: "krep:ammo.lore.308win" }],
  "krep:lapua338": () => [{ translate: "krep:ammo.lore.338lapua" }],
  "krep:bmg50": () => [{ translate: "krep:ammo.lore.50bmg" }],
  "krep:ae50": () => [{ translate: "krep:ammo.lore.50ae" }],
  "krep:acp45": () => [{ translate: "krep:ammo.lore.45acp" }],
  "krep:gauge12": () => [{ translate: "krep:ammo.lore.12g" }],
  "krep:mm9": () => [{ translate: "krep:ammo.lore.9mm" }],
  "krep:ammobox": () => [{ translate: "krep:box.ammobox.lore" }],
  "krep:m885": () => [{ translate: "krep:ammo.lore.5_56" }],
  "krep:hk416": () => [{ translate: "krep:gun.hk416.lore" }],
  "krep:hk416_emp": () => [{ translate: "krep:gun.hk416_emp.lore" }],
  "krep:qbz95": () => [{ translate: "krep:gun.qbz95.lore" }],
  "krep:qbz95_emp": () => [{ translate: "krep:gun.qbz95_emp.lore" }],
  "krep:qbz191": () => [{ translate: "krep:gun.qbz191.lore" }],
  "krep:qbz191_emp": () => [{ translate: "krep:gun.qbz191_emp.lore" }],
  "krep:akm": () => [{ translate: "krep:gun.akm.lore" }],
  "krep:akm_emp": () => [{ translate: "krep:gun.akm_emp.lore" }],
  "krep:type81": () => [{ translate: "krep:gun.type81.lore" }],
  "krep:type81_emp": () => [{ translate: "krep:gun.type81_emp.lore" }],
  "krep:sks": () => [{ translate: "krep:gun.sks.lore" }],
  "krep:sks_emp": () => [{ translate: "krep:gun.sks_emp.lore" }],
  "krep:scarl": () => [{ translate: "krep:gun.scarl.lore" }],
  "krep:scarl_emp": () => [{ translate: "krep:gun.scarl_emp.lore" }],
  "krep:g36": () => [{ translate: "krep:gun.g36.lore" }],
  "krep:g36_emp": () => [{ translate: "krep:gun.g36_emp.lore" }],
  "krep:m249": () => [{ translate: "krep:gun.m249.lore" }],
  "krep:m249_emp": () => [{ translate: "krep:gun.m249_emp.lore" }],
  "krep:minigun": () => [{ translate: "krep:gun.minigun.lore" }],
  "krep:minigun_emp": () => [{ translate: "krep:gun.minigun_emp.lore" }],
  "krep:m4a1": () => [{ translate: "krep:gun.m4a1.lore" }],
  "krep:mp7_emp": () => [{ translate: "krep:gun.mp7_emp.lore" }],
  "krep:mp7": () => [{ translate: "krep:gun.mp7.lore" }],
  "krep:m4a1_emp": () => [{ translate: "krep:gun.m4a1_emp.lore" }],
  "krep:awp": () => [{ translate: "krep:gun.awp.lore" }],
  "krep:awp_emp": () => [{ translate: "krep:gun.awp_emp.lore" }],
  "krep:m107": () => [{ translate: "krep:gun.m107.lore" }],
  "krep:m107_emp": () => [{ translate: "krep:gun.m107_emp.lore" }],
  "krep:g3": () => [{ translate: "krep:gun.g3.lore" }],
  "krep:g3_emp": () => [{ translate: "krep:gun.g3_emp.lore" }],
  "krep:evolys": () => [{ translate: "krep:gun.evolys.lore" }],
  "krep:evolys_emp": () => [{ translate: "krep:gun.evolys_emp.lore" }],
  "krep:fal": () => [{ translate: "krep:gun.fal.lore" }],
  "krep:fal_emp": () => [{ translate: "krep:gun.fal_emp.lore" }],
  "krep:aa12": () => [{ translate: "krep:gun.aa12.lore" }],
  "krep:aa12_emp": () => [{ translate: "krep:gun.aa12_emp.lore" }],
  "krep:saiga12": () => [{ translate: "krep:gun.saiga12.lore" }],
  "krep:saiga12_emp": () => [{ translate: "krep:gun.saiga12_emp.lore" }],
  "krep:m870": () => [{ translate: "krep:gun.m870.lore" }],
  "krep:m870_emp": () => [{ translate: "krep:gun.m870_emp.lore" }],
  "krep:m1014": () => [{ translate: "krep:gun.m1014.lore" }],
  "krep:m1014_emp": () => [{ translate: "krep:gun.m1014_emp.lore" }],
  "krep:db": () => [{ translate: "krep:gun.db.lore" }],
  "krep:db_emp": () => [{ translate: "krep:gun.db_emp.lore" }],
  "krep:m16a1": () => [{ translate: "krep:gun.m16a1.lore" }],
  "krep:m16a1_emp": () => [{ translate: "krep:gun.m16a1_emp.lore" }],
  "krep:m16": () => [{ translate: "krep:gun.m16.lore" }],
  "krep:m16_emp": () => [{ translate: "krep:gun.m16_emp.lore" }],
  "krep:p90": () => [{ translate: "krep:gun.p90.lore" }],
  "krep:p90_emp": () => [{ translate: "krep:gun.p90_emp.lore" }],
  "krep:vector": () => [{ translate: "krep:gun.vector.lore" }],
  "krep:vector_emp": () => [{ translate: "krep:gun.vector_emp.lore" }],
  "krep:m1911": () => [{ translate: "krep:gun.m1911.lore" }],
  "krep:m1911_emp": () => [{ translate: "krep:gun.m1911_emp.lore" }],
  "krep:p320": () => [{ translate: "krep:gun.p320.lore" }],
  "krep:p320_emp": () => [{ translate: "krep:gun.p320_emp.lore" }],
  "krep:deagle": () => [{ translate: "krep:gun.deagle.lore" }],
  "krep:deagle_emp": () => [{ translate: "krep:gun.deagle_emp.lore" }],
  "krep:t50": () => [{ translate: "krep:gun.t50.lore" }],
  "krep:t50_emp": () => [{ translate: "krep:gun.t50_emp.lore" }],
  "krep:deagleg_emp": () => [{ translate: "krep:gun.deagleg_emp.lore" }],
  "krep:deagleg": () => [{ translate: "krep:gun.deagleg.lore" }],
  "krep:cp_emp": () => [{ translate: "krep:gun.cp_emp.lore" }],
  "krep:cp": () => [{ translate: "krep:gun.cp.lore" }],
  "krep:mp5": () => [{ translate: "krep:gun.mp5.lore" }],
  "krep:mp5_emp": () => [{ translate: "krep:gun.mp5_emp.lore" }],
  "krep:ump": () => [{ translate: "krep:gun.ump.lore" }],
  "krep:ump_emp": () => [{ translate: "krep:gun.ump_emp.lore" }],
  "krep:uzi": () => [{ translate: "krep:gun.uzi.lore" }],
  "krep:uzi_emp": () => [{ translate: "krep:gun.uzi_emp.lore" }],
  "krep:g17": () => [{ translate: "krep:gun.g17.lore" }],
  "krep:g18_emp": () => [{ translate: "krep:gun.g18_emp.lore" }],
  "krep:g18": () => [{ translate: "krep:gun.g18.lore" }],
  "krep:b93_emp": () => [{ translate: "krep:gun.b93_emp.lore" }],
  "krep:b93": () => [{ translate: "krep:gun.b93.lore" }],
  "krep:g17_emp": () => [{ translate: "krep:gun.g17_emp.lore" }],
  "krep:scarh": () => [{ translate: "krep:gun.scarh.lore" }],
  "krep:scarh_emp": () => [{ translate: "krep:gun.scarh_emp.lore" }],
  "krep:mk14": () => [{ translate: "krep:gun.mk14.lore" }],
  "krep:mk14_emp": () => [{ translate: "krep:gun.mk14_emp.lore" }],
  "krep:rpg": () => [{ translate: "krep:gun.rpg.lore" }],
  "krep:rpg_emp": () => [{ translate: "krep:gun.rpg_emp.lore" }],
};
class ItemLoreManager {
  constructor(arg) {
    ((this.player = arg), (this.inventory = arg.getComponent("inventory").container));
  }
  updateItemLore(arg, arg2) {
    if (!arg) return;
    if (itemIDs[arg.typeId]) {
      if (!arg.getLore() || arg.getLore().length === 0) {
        arg.setLore(itemIDs[arg.typeId]());
      }
    }
    this.inventory.setItem(arg2, arg);
  }
  updateInventory() {
    for (let value = 0; value < this.inventory.size; value++) {
      {
        let item = this.inventory.getItem(value);
        this.updateItemLore(item, value);
      }
    }
  }
}
mc.system.runInterval(() => {
  for (const player of mc.world.getAllPlayers()) {
    let itemLoreManager = new ItemLoreManager(player);
    itemLoreManager.updateInventory();
  }
}, mc.TicksPerSecond);
