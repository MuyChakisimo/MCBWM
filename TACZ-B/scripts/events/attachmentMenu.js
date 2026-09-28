import { ActionFormData } from "@minecraft/server-ui";
import {
  getDynamicPropertyKey,
  setAksesoris,
  isAllowed,
} from "./attachmentData.js";
import { world, system } from "@minecraft/server";
function getCurrentAttachment(arg, arg2, arg3) {
  const dynamicPropertyKey = getDynamicPropertyKey(arg2);
  if (!dynamicPropertyKey) return 0;
  const [value = 0, value2 = 0, value3 = 0, value4 = 0, value5 = 0] = (
    arg.getDynamicProperty(dynamicPropertyKey)?.split(",") || []
  ).map(Number);
  switch (arg3) {
    case "stock":
      return value;
    case "grip":
      return value2;
    case "laser":
      return value3;
    case "muzzle":
      return value4;
    case "magazine":
      return value5;
    default:
      return 0;
  }
}
function attachmentnew(arg) {
  let form = new ActionFormData();
  (form.title("Attachment WIP"),
    form.body(
      "Not sure this mechanic still relevant, but ya, i dont have any time to made this mechanic more advance",
    ),
    form.button("MP5", "textures/items/mp5"),
    form.button("Vector", "textures/items/vector"),
    form.button("Glock 17", "textures/items/g17"),
    form.button("AKM", "textures/items/akm"),
    form.button("M4A1", "textures/items/m4a1"),
    form.button("HK416", "textures/items/hk416"),
    form.button("AWM", "textures/items/awp"),
    form.button("Golden Deagle", "textures/items/deagleg"),
    form.button("Double Barrel", "textures/items/db"),
    form.button("FAL", "textures/items/fal"),
    form.button("MK14", "textures/items/mk14"),
    form.button("QBZ-191", "textures/items/qbz191"),
    form.show(arg).then((response) => {
      if (response.canceled) return;
      switch (response.selection) {
        case 0:
          mp5att(arg);
          break;
        case 1:
          vectoratt(arg);
          break;
        case 2:
          g17att(arg);
          break;
        case 3:
          akmatt(arg);
          break;
        case 4:
          m4a1att(arg);
          break;
        case 5:
          hk416att(arg);
          break;
        case 6:
          awpatt(arg);
          break;
        case 7:
          deaglegatt(arg);
          break;
        case 8:
          dbatt(arg);
          break;
        case 9:
          falatt(arg);
          break;
        case 10:
          mk14att(arg);
          break;
        case 11:
          qbz191att(arg);
          break;
        default:
          break;
      }
    }));
}
const playersInPreview = new Set();
function g17attpreview(arg) {
  const equippable = arg.getComponent("minecraft:equippable"),
    mainhandItem = equippable.getEquipment("Mainhand"),
    typeId = mainhandItem?.typeId;
  if (!typeId || !isAllowed(typeId) || (typeId !== "krep:g17" && typeId !== "krep:g17_emp")) {
    arg.sendMessage("You must be holding an Glock 17 to use this form!");
    return;
  }
  (arg.addTag("preview_active"),
    arg.runCommandAsync("event entity @s krep:view"),
    playersInPreview.add(arg.id));
  const form = new ActionFormData();
  (form.title("Custom dial"),
    form.body("Preview your current attachments or confirm your selection."),
    form.button("Back", "textures/ui/blank"),
    form.button("Finish", "textures/ui/blank"),
    form.show(arg).then((response) => {
      const parts = "4|0|1|3|2".split("|");
      let value = 0;
      while (true) {
        switch (parts[value++]) {
          case "0":
            playersInPreview["delete"](arg.id);
            continue;
          case "1":
            arg.runCommandAsync("event entity @s krep:noview");
            continue;
          case "2":
            response.selection === 0 && g17att(arg);
            continue;
          case "3":
            if (response.canceled) return;
            continue;
          case "4":
            arg.removeTag("preview_active");
            continue;
        }
        break;
      }
    }));
}
function qbz191attscope(arg) {
  const form = new ActionFormData();
  (form.title("qbz191 Sight"),
    form.button("Iron Sight", "textures/ui/nothing"),
    form.button("Coyote", "textures/ui/coyote"),
    form.show(arg).then((response) => {
      if (response.canceled) return;
      switch (response.selection) {
        case 0:
          arg.runCommandAsync("event entity @s qbz191:ironsight");
          break;
        case 1:
          arg.runCommandAsync("event entity @s qbz191:coyote");
          break;
      }
      qbz191att(arg);
    }));
}
function qbz191att(arg) {
  const equippable = arg.getComponent("minecraft:equippable"),
    mainhandItem = equippable.getEquipment("Mainhand"),
    typeId = mainhandItem?.typeId;
  if (!typeId || !isAllowed(typeId) || (typeId !== "krep:qbz191" && typeId !== "krep:qbz191_emp")) {
    arg.sendMessage("You must be holding an qbz191 to use this form!");
    return;
  }
  const form = new ActionFormData();
  (form.title("qbz191 Attachments"),
    form.body("Select an attachment type to customize your qbz191."),
    form.button("Grip", "textures/ui/new/grip1"),
    form.button("Laser", "textures/ui/new/laser1"),
    form.button("Sight", "textures/ui/coyote"),
    form.button("Preview", "textures/ui/blank"),
    form.show(arg).then((response) => {
      if (response.canceled) return;
      switch (response.selection) {
        case 0:
          qbz191attgrip(arg);
          break;
        case 1:
          qbz191attlaser(arg);
          break;
        case 2:
          qbz191attscope(arg);
          break;
        case 3:
          qbz191attpreview(arg);
          break;
        default:
          break;
      }
    }));
}
function qbz191attpreview(arg) {
  const equippable = arg.getComponent("minecraft:equippable"),
    mainhandItem = equippable.getEquipment("Mainhand"),
    typeId = mainhandItem?.typeId;
  if (!typeId || !isAllowed(typeId) || (typeId !== "krep:qbz191" && typeId !== "krep:qbz191_emp")) {
    arg.sendMessage("You must be holding an qbz191 to use this form!");
    return;
  }
  (arg.addTag("preview_active"),
    arg.runCommandAsync("event entity @s krep:view"),
    playersInPreview.add(arg.id));
  const form = new ActionFormData();
  (form.title("Custom dial"),
    form.body("Preview your current attachments or confirm your selection."),
    form.button("Back", "textures/ui/blank"),
    form.button("Finish", "textures/ui/blank"),
    form.show(arg).then((response) => {
      {
        const parts = "2|0|3|4|1".split("|");
        let value = 0;
        while (true) {
          switch (parts[value++]) {
            case "0":
              playersInPreview["delete"](arg.id);
              continue;
            case "1":
              response.selection === 0 && qbz191att(arg);
              continue;
            case "2":
              arg.removeTag("preview_active");
              continue;
            case "3":
              arg.runCommandAsync("event entity @s krep:noview");
              continue;
            case "4":
              if (response.canceled) return;
              continue;
          }
          break;
        }
      }
    }));
}
function qbz191attgrip(arg) {
  const equippable = arg.getComponent("minecraft:equippable"),
    mainhandItem = equippable.getEquipment("Mainhand"),
    typeId = mainhandItem?.typeId;
  if (!typeId || !isAllowed(typeId) || (typeId !== "krep:qbz191" && typeId !== "krep:qbz191_emp")) {
    arg.sendMessage("You must be holding an qbz191 to use this form!");
    return;
  }
  const currentAttachment = getCurrentAttachment(arg, typeId, "grip"),
    form = new ActionFormData();
  (form.title("qbz191 Grip"), form.body("Select a grip for your qbz191."));
  const list = [
    "No Grip",
    "Grip 1",
    "Grip 2",
    "Grip 3",
    "Grip 4",
    "Grip 5",
    "Grip 6",
    "Grip 7",
    "Grip 8",
    "Grip 9",
    "Grip 10",
    "Grip 11",
  ];
  (list.forEach((entry, arg2) => {
    const value = arg2 === 0 ? "textures/ui/zero/zero_grip" : "textures/ui/new/grip" + arg2;
    form.button("" + entry + (currentAttachment === arg2 ? " (Selected)" : ""), "" + value);
  }),
    form.button("Preview", "textures/ui/blank"),
    form.show(arg).then((response) => {
      {
        if (response.canceled) return;
        const list2 = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
        if (response.selection < list2.length) {
          {
            const value = list2[response.selection];
            (setAksesoris(arg, typeId, { grip: value }), qbz191att(arg));
          }
        } else response.selection === list2.length && qbz191attpreview(arg);
      }
    }));
}
function qbz191attlaser(arg) {
  const equippable = arg.getComponent("minecraft:equippable"),
    mainhandItem = equippable.getEquipment("Mainhand"),
    typeId = mainhandItem?.typeId;
  if (!typeId || !isAllowed(typeId) || (typeId !== "krep:qbz191" && typeId !== "krep:qbz191_emp")) {
    arg.sendMessage("You must be holding an qbz191 to use this form!");
    return;
  }
  const currentAttachment = getCurrentAttachment(arg, typeId, "laser"),
    form = new ActionFormData();
  (form.title("qbz191 Laser"), form.body("Select a laser for your qbz191."));
  const list = ["No Laser", "Laser 1"];
  (list.forEach((entry, arg2) => {
    const value = arg2 === 0 ? "textures/ui/zero/zero_laser" : "textures/ui/new/laser" + arg2;
    form.button("" + entry + (currentAttachment === arg2 ? " (Selected)" : ""), "" + value);
  }),
    form.button("Preview", "textures/ui/blank"),
    form.show(arg).then((response) => {
      if (response.canceled) return;
      const list2 = [0, 1];
      if (response.selection < list2.length) {
        {
          const value = list2[response.selection];
          (setAksesoris(arg, typeId, { laser: value }), qbz191att(arg));
        }
      } else response.selection === list2.length && qbz191attpreview(arg);
    }));
}
function awpatt(arg) {
  const form = new ActionFormData();
  (form.title("AWM Scope"),
    form.body("Im still not done with this gun, just wait for another update"),
    form.button("Iron Sight", "textures/ui/nothing"),
    form.button("Coyote", "textures/ui/coyote"),
    form.button("Acog", "textures/ui/acog"),
    form.button("Elcan", "textures/ui/elcan"),
    form.button("Standard 8", "textures/ui/standard_8"),
    form.show(arg).then((response) => {
      if (response.canceled) return;
      switch (response.selection) {
        case 0:
          arg.runCommandAsync("event entity @s awp:ironsight");
          break;
        case 1:
          arg.runCommandAsync("event entity @s awp:coyote");
          break;
        case 2:
          arg.runCommandAsync("event entity @s awp:acog");
          break;
        case 3:
          arg.runCommandAsync("event entity @s awp:elcan");
          break;
        case 4:
          arg.runCommandAsync("event entity @s awp:standard_8");
          break;
      }
    }));
}
function g17attlaser(arg) {
  const equippable = arg.getComponent("minecraft:equippable"),
    mainhandItem = equippable.getEquipment("Mainhand"),
    typeId = mainhandItem?.typeId;
  if (!typeId || !isAllowed(typeId) || (typeId !== "krep:g17" && typeId !== "krep:g17_emp")) {
    arg.sendMessage("You must be holding an Glock 17 to use this form!");
    return;
  }
  const currentAttachment = getCurrentAttachment(arg, typeId, "laser"),
    form = new ActionFormData();
  (form.title("Glock 17 Laser"), form.body("Select a laser for your Glock 17."));
  const list = ["No Laser", "Laser 1"];
  (list.forEach((entry, arg2) => {
    {
      const value = arg2 === 0 ? "textures/ui/zero/zero_laser" : "textures/ui/new/g17/laser" + arg2;
      form.button("" + entry + (currentAttachment === arg2 ? " (Selected)" : ""), "" + value);
    }
  }),
    form.button("Preview", "textures/ui/blank"),
    form.show(arg).then((response) => {
      {
        if (response.canceled) return;
        const list2 = [0, 1];
        if (response.selection < list2.length) {
          {
            const value = list2[response.selection];
            (setAksesoris(arg, typeId, { laser: value }), g17att(arg));
          }
        } else response.selection === list2.length && g17attpreview(arg);
      }
    }));
}
function dbattmuzzle(arg) {
  const equippable = arg.getComponent("minecraft:equippable"),
    mainhandItem = equippable.getEquipment("Mainhand"),
    typeId = mainhandItem?.typeId;
  if (!typeId || !isAllowed(typeId) || (typeId !== "krep:db" && typeId !== "krep:db_emp")) {
    arg.sendMessage("You must be holding an Double Barrel to use this form!");
    return;
  }
  const currentAttachment = getCurrentAttachment(arg, typeId, "muzzle"),
    form = new ActionFormData();
  (form.title("Double Barrel"), form.body("Select a Barrel for your Double Barrel."));
  const list = ["Short Barrel", "Long Barrel"];
  (list.forEach((entry, arg2) => {
    const value = arg2 === 0 ? "textures/ui/new/db/barrel0" : "textures/ui/new/db/barrel" + arg2;
    form.button("" + entry + (currentAttachment === arg2 ? " (Selected)" : ""), "" + value);
  }),
    form.button("Preview", "textures/ui/blank"),
    form.show(arg).then((response) => {
      if (response.canceled) return;
      const list2 = [0, 1, 2];
      if (response.selection < list2.length) {
        const value = list2[response.selection];
        (setAksesoris(arg, typeId, { muzzle: value }), dbatt(arg));
      } else response.selection === list2.length && dbattpreview(arg);
    }));
}
function g17attmuzzle(arg) {
  const equippable = arg.getComponent("minecraft:equippable"),
    mainhandItem = equippable.getEquipment("Mainhand"),
    typeId = mainhandItem?.typeId;
  if (!typeId || !isAllowed(typeId) || (typeId !== "krep:g17" && typeId !== "krep:g17_emp")) {
    arg.sendMessage("You must be holding an Glock 17 to use this form!");
    return;
  }
  const currentAttachment = getCurrentAttachment(arg, typeId, "muzzle"),
    form = new ActionFormData();
  (form.title("Glock 17 Muzzle"), form.body("Select a muzzle for your Glock 17."));
  const list = ["No Muzzle", "Muzzle 1", "Muzzle 2"];
  (list.forEach((entry, arg2) => {
    const value = arg2 === 0 ? "textures/ui/zero/zero_muzzle" : "textures/ui/new/g17/muzzle" + arg2;
    form.button("" + entry + (currentAttachment === arg2 ? " (Selected)" : ""), "" + value);
  }),
    form.button("Preview", "textures/ui/blank"),
    form.show(arg).then((response) => {
      if (response.canceled) return;
      const list2 = [0, 1, 2];
      if (response.selection < list2.length) {
        const value = list2[response.selection];
        (setAksesoris(arg, typeId, { muzzle: value }), g17att(arg));
      } else {
        if (response.selection === list2.length) {
          g17attpreview(arg);
        }
      }
    }));
}
function g17att(arg) {
  const equippable = arg.getComponent("minecraft:equippable"),
    mainhandItem = equippable.getEquipment("Mainhand"),
    typeId = mainhandItem?.typeId;
  if (!typeId || !isAllowed(typeId) || (typeId !== "krep:g17" && typeId !== "krep:g17_emp")) {
    arg.sendMessage("You must be holding an Glock 17 to use this form!");
    return;
  }
  const form = new ActionFormData();
  (form.title("Glock 17 Attachments"),
    form.body("Select an attachment type to customize your Glock 17."),
    form.button("Laser", "textures/ui/new/g17/laser1"),
    form.button("Muzzle", "textures/ui/new/muzzle1"),
    form.button("Preview", "textures/ui/blank"),
    form.show(arg).then((response) => {
      if (response.canceled) return;
      switch (response.selection) {
        case 0:
          g17attlaser(arg);
          break;
        case 1:
          g17attmuzzle(arg);
          break;
        case 2:
          g17attpreview(arg);
          break;
        default:
          break;
      }
    }));
}
function dbatt(arg) {
  const equippable = arg.getComponent("minecraft:equippable"),
    mainhandItem = equippable.getEquipment("Mainhand"),
    typeId = mainhandItem?.typeId;
  if (!typeId || !isAllowed(typeId) || (typeId !== "krep:db" && typeId !== "krep:db_emp")) {
    arg.sendMessage("You must be holding an Double Barrel to use this form!");
    return;
  }
  const form = new ActionFormData();
  (form.title("Double Barrel Attachments"),
    form.body("Select an attachment type to customize your Double Barrel."),
    form.button("Stock", "textures/ui/new/stock3"),
    form.button("Barrel", "textures/ui/new/db/barrel1"),
    form.button("Preview", "textures/ui/blank"),
    form.show(arg).then((response) => {
      if (response.canceled) return;
      switch (response.selection) {
        case 0:
          dbattstock(arg);
          break;
        case 1:
          dbattmuzzle(arg);
          break;
        case 2:
          dbattpreview(arg);
          break;
        default:
          break;
      }
    }));
}
function dbattstock(arg) {
  const equippable = arg.getComponent("minecraft:equippable"),
    mainhandItem = equippable.getEquipment("Mainhand"),
    typeId = mainhandItem?.typeId;
  if (!typeId || !isAllowed(typeId) || (typeId !== "krep:db" && typeId !== "krep:db_emp")) {
    arg.sendMessage("You must be holding an Double Barrel to use this form!");
    return;
  }
  const currentAttachment = getCurrentAttachment(arg, typeId, "stock"),
    form = new ActionFormData();
  (form.title("Double Barrel Stock"), form.body("Select a stock for your Double Barrel."));
  const list = ["No Stock", "Stock 1"];
  (list.forEach((entry, arg2) => {
    {
      const value = arg2 === 0 ? "textures/ui/zero/zero_stock" : "textures/ui/new/stock" + arg2;
      form.button("" + entry + (currentAttachment === arg2 ? " (Selected)" : ""), "" + value);
    }
  }),
    form.button("Preview", "textures/ui/blank"),
    form.show(arg).then((response) => {
      if (response.canceled) return;
      const list2 = [0, 1];
      if (response.selection < list2.length) {
        const value = list2[response.selection];
        (setAksesoris(arg, typeId, { stock: value }), dbatt(arg));
      } else response.selection === list2.length && dbattpreview(arg);
    }));
}
function dbattpreview(arg) {
  const equippable = arg.getComponent("minecraft:equippable"),
    mainhandItem = equippable.getEquipment("Mainhand"),
    typeId = mainhandItem?.typeId;
  if (!typeId || !isAllowed(typeId) || (typeId !== "krep:db" && typeId !== "krep:db_emp")) {
    arg.sendMessage("You must be holding an Double Barrel to use this form!");
    return;
  }
  (arg.addTag("preview_active"),
    arg.runCommandAsync("event entity @s krep:view"),
    playersInPreview.add(arg.id));
  const form = new ActionFormData();
  (form.title("Custom dial"),
    form.body("Preview your current attachments or confirm your selection."),
    form.button("Back", "textures/ui/blank"),
    form.button("Finish", "textures/ui/blank"),
    form.show(arg).then((response) => {
      const parts = "4|2|3|1|0".split("|");
      let value = 0;
      while (true) {
        switch (parts[value++]) {
          case "0":
            response.selection === 0 && dbatt(arg);
            continue;
          case "1":
            if (response.canceled) return;
            continue;
          case "2":
            playersInPreview["delete"](arg.id);
            continue;
          case "3":
            arg.runCommandAsync("event entity @s krep:noview");
            continue;
          case "4":
            arg.removeTag("preview_active");
            continue;
        }
        break;
      }
    }));
}
function m4a1attpreview(arg) {
  const equippable = arg.getComponent("minecraft:equippable"),
    mainhandItem = equippable.getEquipment("Mainhand"),
    typeId = mainhandItem?.typeId;
  if (!typeId || !isAllowed(typeId) || (typeId !== "krep:m4a1" && typeId !== "krep:m4a1_emp")) {
    arg.sendMessage("You must be holding an M4A1 to use this form!");
    return;
  }
  (arg.addTag("preview_active"),
    arg.runCommandAsync("event entity @s krep:view"),
    playersInPreview.add(arg.id));
  const form = new ActionFormData();
  (form.title("Custom dial"),
    form.body("Preview your current attachments or confirm your selection."),
    form.button("Back", "textures/ui/blank"),
    form.button("Finish", "textures/ui/blank"),
    form.show(arg).then((response) => {
      (arg.removeTag("preview_active"),
        playersInPreview["delete"](arg.id),
        arg.runCommandAsync("event entity @s krep:noview"));
      if (response.canceled) return;
      response.selection === 0 && m4a1att(arg);
    }));
}
function m4a1attgrip(arg) {
  const equippable = arg.getComponent("minecraft:equippable"),
    mainhandItem = equippable.getEquipment("Mainhand"),
    typeId = mainhandItem?.typeId;
  if (!typeId || !isAllowed(typeId) || (typeId !== "krep:m4a1" && typeId !== "krep:m4a1_emp")) {
    arg.sendMessage("You must be holding an M4A1 to use this form!");
    return;
  }
  const currentAttachment = getCurrentAttachment(arg, typeId, "grip"),
    form = new ActionFormData();
  (form.title("M4A1 Grip"), form.body("Select a grip for your M4A1."));
  const list = [
    "No Grip",
    "Grip 1",
    "Grip 2",
    "Grip 3",
    "Grip 4",
    "Grip 5",
    "Grip 6",
    "Grip 7",
    "Grip 8",
    "Grip 9",
    "Grip 10",
    "Grip 11",
  ];
  (list.forEach((entry, arg2) => {
    {
      const value = arg2 === 0 ? "textures/ui/zero/zero_grip" : "textures/ui/new/grip" + arg2;
      form.button("" + entry + (currentAttachment === arg2 ? " (Selected)" : ""), "" + value);
    }
  }),
    form.button("Preview", "textures/ui/blank"),
    form.show(arg).then((response) => {
      if (response.canceled) return;
      const list2 = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
      if (response.selection < list2.length) {
        {
          const value = list2[response.selection];
          (setAksesoris(arg, typeId, { grip: value }), m4a1att(arg));
        }
      } else response.selection === list2.length && m4a1attpreview(arg);
    }));
}
function hk416attpreview(arg) {
  const equippable = arg.getComponent("minecraft:equippable"),
    mainhandItem = equippable.getEquipment("Mainhand"),
    typeId = mainhandItem?.typeId;
  if (!typeId || !isAllowed(typeId) || (typeId !== "krep:hk416" && typeId !== "krep:hk416_emp")) {
    arg.sendMessage("You must be holding an HK416 to use this form!");
    return;
  }
  (arg.addTag("preview_active"),
    arg.runCommandAsync("event entity @s krep:view"),
    playersInPreview.add(arg.id));
  const form = new ActionFormData();
  (form.title("Custom dial"),
    form.body("Preview your current attachments or confirm your selection."),
    form.button("Back", "textures/ui/blank"),
    form.button("Finish", "textures/ui/blank"),
    form.show(arg).then((response) => {
      (arg.removeTag("preview_active"),
        playersInPreview["delete"](arg.id),
        arg.runCommandAsync("event entity @s krep:noview"));
      if (response.canceled) return;
      response.selection === 0 && hk416att(arg);
    }));
}
function hk416attgrip(arg) {
  const equippable = arg.getComponent("minecraft:equippable"),
    mainhandItem = equippable.getEquipment("Mainhand"),
    typeId = mainhandItem?.typeId;
  if (!typeId || !isAllowed(typeId) || (typeId !== "krep:hk416" && typeId !== "krep:hk416_emp")) {
    arg.sendMessage("You must be holding an HK416 to use this form!");
    return;
  }
  const currentAttachment = getCurrentAttachment(arg, typeId, "grip"),
    form = new ActionFormData();
  (form.title("HK416 Grip"), form.body("Select a grip for your HK416."));
  const list = [
    "No Grip",
    "Grip 1",
    "Grip 2",
    "Grip 3",
    "Grip 4",
    "Grip 5",
    "Grip 6",
    "Grip 7",
    "Grip 8",
    "Grip 9",
    "Grip 10",
    "Grip 11",
  ];
  (list.forEach((entry, arg2) => {
    {
      const value = arg2 === 0 ? "textures/ui/zero/zero_grip" : "textures/ui/new/grip" + arg2;
      form.button("" + entry + (currentAttachment === arg2 ? " (Selected)" : ""), "" + value);
    }
  }),
    form.button("Preview", "textures/ui/blank"),
    form.show(arg).then((response) => {
      if (response.canceled) return;
      const list2 = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
      if (response.selection < list2.length) {
        {
          const value = list2[response.selection];
          (setAksesoris(arg, typeId, { grip: value }), hk416att(arg));
        }
      } else response.selection === list2.length && hk416attpreview(arg);
    }));
}
function hk416attstock(arg) {
  const equippable = arg.getComponent("minecraft:equippable"),
    mainhandItem = equippable.getEquipment("Mainhand"),
    typeId = mainhandItem?.typeId;
  if (!typeId || !isAllowed(typeId) || (typeId !== "krep:hk416" && typeId !== "krep:hk416_emp")) {
    arg.sendMessage("You must be holding an HK416 to use this form!");
    return;
  }
  const currentAttachment = getCurrentAttachment(arg, typeId, "stock"),
    form = new ActionFormData();
  (form.title("HK416 Stock"), form.body("Select a stock for your HK416."));
  const list = [
    "No Stock",
    "Stock 1",
    "Stock 2",
    "Stock 3",
    "Stock 4",
    "Stock 5",
    "Stock 6",
    "Stock 7",
    "Stock 8",
  ];
  (list.forEach((entry, arg2) => {
    const value = arg2 === 0 ? "textures/ui/zero/zero_stock" : "textures/ui/new/m4a1/stock" + arg2;
    form.button("" + entry + (currentAttachment === arg2 ? " (Selected)" : ""), "" + value);
  }),
    form.button("Preview", "textures/ui/blank"),
    form.show(arg).then((response) => {
      {
        if (response.canceled) return;
        const list2 = [0, 1, 2, 3, 4, 5, 6, 7, 8];
        if (response.selection < list2.length) {
          {
            const value = list2[response.selection];
            (setAksesoris(arg, typeId, { stock: value }), hk416att(arg));
          }
        } else response.selection === list2.length && hk416attpreview(arg);
      }
    }));
}
function hk416attlaser(arg) {
  const equippable = arg.getComponent("minecraft:equippable"),
    mainhandItem = equippable.getEquipment("Mainhand"),
    typeId = mainhandItem?.typeId;
  if (!typeId || !isAllowed(typeId) || (typeId !== "krep:hk416" && typeId !== "krep:hk416_emp")) {
    arg.sendMessage("You must be holding an HK416 to use this form!");
    return;
  }
  const currentAttachment = getCurrentAttachment(arg, typeId, "laser"),
    form = new ActionFormData();
  (form.title("HK416 Laser"), form.body("Select a laser for your HK416."));
  const list = ["No Laser", "Laser 1"];
  (list.forEach((entry, arg2) => {
    {
      const value = arg2 === 0 ? "textures/ui/zero/zero_laser" : "textures/ui/new/laser" + arg2;
      form.button("" + entry + (currentAttachment === arg2 ? " (Selected)" : ""), "" + value);
    }
  }),
    form.button("Preview", "textures/ui/blank"),
    form.show(arg).then((response) => {
      if (response.canceled) return;
      const list2 = [0, 1];
      if (response.selection < list2.length) {
        const value = list2[response.selection];
        (setAksesoris(arg, typeId, { laser: value }), hk416att(arg));
      } else response.selection === list2.length && hk416attpreview(arg);
    }));
}
function hk416attmuzzle(arg) {
  const equippable = arg.getComponent("minecraft:equippable"),
    mainhandItem = equippable.getEquipment("Mainhand"),
    typeId = mainhandItem?.typeId;
  if (!typeId || !isAllowed(typeId) || (typeId !== "krep:hk416" && typeId !== "krep:hk416_emp")) {
    arg.sendMessage("You must be holding an HK416 to use this form!");
    return;
  }
  const currentAttachment = getCurrentAttachment(arg, typeId, "muzzle"),
    form = new ActionFormData();
  (form.title("HK416 Muzzle"), form.body("Select a muzzle for your HK416."));
  const list = [
    "No Muzzle",
    "Muzzle 1",
    "Muzzle 2",
    "Muzzle 3",
    "Muzzle 4",
    "Muzzle 5",
    "Muzzle 6",
  ];
  (list.forEach((entry, arg2) => {
    {
      const value = arg2 === 0 ? "textures/ui/zero/zero_muzzle" : "textures/ui/new/muzzle" + arg2;
      form.button("" + entry + (currentAttachment === arg2 ? " (Selected)" : ""), "" + value);
    }
  }),
    form.button("Preview", "textures/ui/blank"),
    form.show(arg).then((response) => {
      {
        if (response.canceled) return;
        const list2 = [0, 1, 2, 3, 4, 5, 6];
        if (response.selection < list2.length) {
          {
            const value = list2[response.selection];
            (setAksesoris(arg, typeId, { muzzle: value }), hk416att(arg));
          }
        } else response.selection === list2.length && hk416attpreview(arg);
      }
    }));
}
function hk416attscope(arg) {
  const form = new ActionFormData();
  (form.title("HK416 Sight"),
    form.button("Iron Sight", "textures/ui/nothing"),
    form.button("Coyote", "textures/ui/coyote"),
    form.button("Holo 552", "textures/ui/holo"),
    form.button("T2", "textures/ui/t2"),
    form.button("Acog", "textures/ui/acog"),
    form.button("Elcan", "textures/ui/elcan"),
    form.show(arg).then((response) => {
      if (response.canceled) return;
      switch (response.selection) {
        case 0:
          arg.runCommandAsync("event entity @s hk416:ironsight");
          break;
        case 1:
          arg.runCommandAsync("event entity @s hk416:coyote");
          break;
        case 2:
          arg.runCommandAsync("event entity @s hk416:holo");
          break;
        case 3:
          arg.runCommandAsync("event entity @s hk416:t2");
          break;
        case 4:
          arg.runCommandAsync("event entity @s hk416:acog");
          break;
        case 5:
          arg.runCommandAsync("event entity @s hk416:elcan");
          break;
      }
      hk416att(arg);
    }));
}
function hk416att(arg) {
  const equippable = arg.getComponent("minecraft:equippable"),
    mainhandItem = equippable.getEquipment("Mainhand"),
    typeId = mainhandItem?.typeId;
  if (!typeId || !isAllowed(typeId) || (typeId !== "krep:hk416" && typeId !== "krep:hk416_emp")) {
    arg.sendMessage("You must be holding an HK416 to use this form!");
    return;
  }
  const form = new ActionFormData();
  (form.title("HK416 Attachments"),
    form.body("Select an attachment type to customize your HK416."),
    form.button("Grip", "textures/ui/new/grip1"),
    form.button("Stock", "textures/ui/new/stock8"),
    form.button("Laser", "textures/ui/new/laser1"),
    form.button("Muzzle", "textures/ui/new/muzzle1"),
    form.button("Sight", "textures/ui/coyote"),
    form.button("Preview", "textures/ui/blank"),
    form.show(arg).then((response) => {
      if (response.canceled) return;
      switch (response.selection) {
        case 0:
          hk416attgrip(arg);
          break;
        case 1:
          hk416attstock(arg);
          break;
        case 2:
          hk416attlaser(arg);
          break;
        case 3:
          hk416attmuzzle(arg);
          break;
        case 4:
          hk416attscope(arg);
          break;
        case 5:
          hk416attpreview(arg);
          break;
        default:
          break;
      }
    }));
}
function m4a1attstock(arg) {
  const equippable = arg.getComponent("minecraft:equippable"),
    mainhandItem = equippable.getEquipment("Mainhand"),
    typeId = mainhandItem?.typeId;
  if (!typeId || !isAllowed(typeId) || (typeId !== "krep:m4a1" && typeId !== "krep:m4a1_emp")) {
    arg.sendMessage("You must be holding an M4A1 to use this form!");
    return;
  }
  const currentAttachment = getCurrentAttachment(arg, typeId, "stock"),
    form = new ActionFormData();
  (form.title("M4A1 Stock"), form.body("Select a stock for your M4A1."));
  const list = [
    "No Stock",
    "Stock 1",
    "Stock 2",
    "Stock 3",
    "Stock 4",
    "Stock 5",
    "Stock 6",
    "Stock 7",
    "Stock 8",
  ];
  (list.forEach((entry, arg2) => {
    const value = arg2 === 0 ? "textures/ui/zero/zero_stock" : "textures/ui/new/m4a1/stock" + arg2;
    form.button("" + entry + (currentAttachment === arg2 ? " (Selected)" : ""), "" + value);
  }),
    form.button("Preview", "textures/ui/blank"),
    form.show(arg).then((response) => {
      if (response.canceled) return;
      const list2 = [0, 1, 2, 3, 4, 5, 6, 7, 8];
      if (response.selection < list2.length) {
        {
          const value = list2[response.selection];
          (setAksesoris(arg, typeId, { stock: value }), m4a1att(arg));
        }
      } else {
        if (response.selection === list2.length) {
          m4a1attpreview(arg);
        }
      }
    }));
}
function m4a1attlaser(arg) {
  const equippable = arg.getComponent("minecraft:equippable"),
    mainhandItem = equippable.getEquipment("Mainhand"),
    typeId = mainhandItem?.typeId;
  if (!typeId || !isAllowed(typeId) || (typeId !== "krep:m4a1" && typeId !== "krep:m4a1_emp")) {
    arg.sendMessage("You must be holding an M4A1 to use this form!");
    return;
  }
  const currentAttachment = getCurrentAttachment(arg, typeId, "laser"),
    form = new ActionFormData();
  (form.title("M4A1 Laser"), form.body("Select a laser for your M4A1."));
  const list = ["No Laser", "Laser 1"];
  (list.forEach((entry, arg2) => {
    {
      const value = arg2 === 0 ? "textures/ui/zero/zero_laser" : "textures/ui/new/laser" + arg2;
      form.button("" + entry + (currentAttachment === arg2 ? " (Selected)" : ""), "" + value);
    }
  }),
    form.button("Preview", "textures/ui/blank"),
    form.show(arg).then((response) => {
      if (response.canceled) return;
      const list2 = [0, 1];
      if (response.selection < list2.length) {
        const value = list2[response.selection];
        (setAksesoris(arg, typeId, { laser: value }), m4a1att(arg));
      } else {
        if (response.selection === list2.length) {
          m4a1attpreview(arg);
        }
      }
    }));
}
function m4a1attmuzzle(arg) {
  const equippable = arg.getComponent("minecraft:equippable"),
    mainhandItem = equippable.getEquipment("Mainhand"),
    typeId = mainhandItem?.typeId;
  if (!typeId || !isAllowed(typeId) || (typeId !== "krep:m4a1" && typeId !== "krep:m4a1_emp")) {
    arg.sendMessage("You must be holding an M4A1 to use this form!");
    return;
  }
  const currentAttachment = getCurrentAttachment(arg, typeId, "muzzle"),
    form = new ActionFormData();
  (form.title("M4A1 Muzzle"), form.body("Select a muzzle for your M4A1."));
  const list = [
    "No Muzzle",
    "Muzzle 1",
    "Muzzle 2",
    "Muzzle 3",
    "Muzzle 4",
    "Muzzle 5",
    "Muzzle 6",
  ];
  (list.forEach((entry, arg2) => {
    {
      const value = arg2 === 0 ? "textures/ui/zero/zero_muzzle" : "textures/ui/new/muzzle" + arg2;
      form.button("" + entry + (currentAttachment === arg2 ? " (Selected)" : ""), "" + value);
    }
  }),
    form.button("Preview", "textures/ui/blank"),
    form.show(arg).then((response) => {
      if (response.canceled) return;
      const list2 = [0, 1, 2, 3, 4, 5, 6];
      if (response.selection < list2.length) {
        {
          const value = list2[response.selection];
          (setAksesoris(arg, typeId, { muzzle: value }), m4a1att(arg));
        }
      } else response.selection === list2.length && m4a1attpreview(arg);
    }));
}
function m4a1attscope(arg) {
  const form = new ActionFormData();
  (form.title("M4A1 Sight"),
    form.button("Iron Sight", "textures/ui/nothing"),
    form.button("Coyote", "textures/ui/coyote"),
    form.button("Holo 552", "textures/ui/holo"),
    form.button("T2", "textures/ui/t2"),
    form.button("Acog", "textures/ui/acog"),
    form.button("Elcan", "textures/ui/elcan"),
    form.show(arg).then((response) => {
      if (response.canceled) return;
      switch (response.selection) {
        case 0:
          arg.runCommandAsync("event entity @s m4a1:ironsight");
          break;
        case 1:
          arg.runCommandAsync("event entity @s m4a1:coyote");
          break;
        case 2:
          arg.runCommandAsync("event entity @s m4a1:holo");
          break;
        case 3:
          arg.runCommandAsync("event entity @s m4a1:t2");
          break;
        case 4:
          arg.runCommandAsync("event entity @s m4a1:acog");
          break;
        case 5:
          arg.runCommandAsync("event entity @s m4a1:elcan");
          break;
      }
      m4a1att(arg);
    }));
}
function m4a1att(arg) {
  const equippable = arg.getComponent("minecraft:equippable"),
    mainhandItem = equippable.getEquipment("Mainhand"),
    typeId = mainhandItem?.typeId;
  if (!typeId || !isAllowed(typeId) || (typeId !== "krep:m4a1" && typeId !== "krep:m4a1_emp")) {
    arg.sendMessage("You must be holding an M4A1 to use this form!");
    return;
  }
  const form = new ActionFormData();
  (form.title("M4A1 Attachments"),
    form.body("Select an attachment type to customize your M4A1."),
    form.button("Grip", "textures/ui/new/grip1"),
    form.button("Stock", "textures/ui/new/stock8"),
    form.button("Laser", "textures/ui/new/laser1"),
    form.button("Muzzle", "textures/ui/new/muzzle1"),
    form.button("Sight", "textures/ui/coyote"),
    form.button("Preview", "textures/ui/blank"),
    form.show(arg).then((response) => {
      if (response.canceled) return;
      switch (response.selection) {
        case 0:
          m4a1attgrip(arg);
          break;
        case 1:
          m4a1attstock(arg);
          break;
        case 2:
          m4a1attlaser(arg);
          break;
        case 3:
          m4a1attmuzzle(arg);
          break;
        case 4:
          m4a1attscope(arg);
          break;
        case 5:
          m4a1attpreview(arg);
          break;
        default:
          break;
      }
    }));
}
function mp5attpreview(arg) {
  const equippable = arg.getComponent("minecraft:equippable"),
    mainhandItem = equippable.getEquipment("Mainhand"),
    typeId = mainhandItem?.typeId;
  if (!typeId || !isAllowed(typeId) || (typeId !== "krep:mp5" && typeId !== "krep:mp5_emp")) {
    arg.sendMessage("You must be holding an MP5 to use this form!");
    return;
  }
  (arg.addTag("preview_active"),
    arg.runCommandAsync("event entity @s krep:view"),
    playersInPreview.add(arg.id));
  const form = new ActionFormData();
  (form.title("Custom dial"),
    form.body("Preview your current attachments or confirm your selection."),
    form.button("Back", "textures/ui/blank"),
    form.button("Finish", "textures/ui/blank"),
    form.show(arg).then((response) => {
      (arg.removeTag("preview_active"),
        playersInPreview["delete"](arg.id),
        arg.runCommandAsync("event entity @s krep:noview"));
      if (response.canceled) return;
      if (response.selection === 0) {
        mp5att(arg);
      }
    }));
}
function mp5attgrip(arg) {
  const equippable = arg.getComponent("minecraft:equippable"),
    mainhandItem = equippable.getEquipment("Mainhand"),
    typeId = mainhandItem?.typeId;
  if (!typeId || !isAllowed(typeId) || (typeId !== "krep:mp5" && typeId !== "krep:mp5_emp")) {
    arg.sendMessage("You must be holding an MP5 to use this form!");
    return;
  }
  const currentAttachment = getCurrentAttachment(arg, typeId, "grip"),
    form = new ActionFormData();
  (form.title("MP5 Grip"), form.body("Select a grip for your MP5."));
  const list = [
    "No Grip",
    "Grip 1",
    "Grip 2",
    "Grip 3",
    "Grip 4",
    "Grip 5",
    "Grip 6",
    "Grip 7",
    "Grip 8",
    "Grip 9",
    "Grip 10",
    "Grip 11",
  ];
  (list.forEach((entry, arg2) => {
    const value = arg2 === 0 ? "textures/ui/zero/zero_grip" : "textures/ui/new/grip" + arg2;
    form.button("" + entry + (currentAttachment === arg2 ? " (Selected)" : ""), "" + value);
  }),
    form.button("Preview", "textures/ui/blank"),
    form.show(arg).then((response) => {
      if (response.canceled) return;
      const list2 = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
      if (response.selection < list2.length) {
        {
          const value = list2[response.selection];
          (setAksesoris(arg, typeId, { grip: value }), mp5att(arg));
        }
      } else {
        if (response.selection === list2.length) {
          mp5attpreview(arg);
        }
      }
    }));
}
function mp5attstock(arg) {
  const equippable = arg.getComponent("minecraft:equippable"),
    mainhandItem = equippable.getEquipment("Mainhand"),
    typeId = mainhandItem?.typeId;
  if (!typeId || !isAllowed(typeId) || (typeId !== "krep:mp5" && typeId !== "krep:mp5_emp")) {
    arg.sendMessage("You must be holding an MP5 to use this form!");
    return;
  }
  const currentAttachment = getCurrentAttachment(arg, typeId, "stock"),
    form = new ActionFormData();
  (form.title("MP5 Stock"), form.body("Select a stock for your MP5."));
  const list = [
    "No Stock",
    "Stock 1",
    "Stock 2",
    "Stock 3",
    "Stock 4",
    "Stock 5",
    "Stock 6",
    "Stock 7",
    "Stock 8",
    "Stock 9",
    "Stock 10",
    "Stock 11",
  ];
  (list.forEach((entry, arg2) => {
    const value = arg2 === 0 ? "textures/ui/zero/zero_stock" : "textures/ui/new/stock" + arg2;
    form.button("" + entry + (currentAttachment === arg2 ? " (Selected)" : ""), "" + value);
  }),
    form.button("Preview", "textures/ui/blank"),
    form.show(arg).then((response) => {
      if (response.canceled) return;
      const list2 = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
      if (response.selection < list2.length) {
        const value = list2[response.selection];
        (setAksesoris(arg, typeId, { stock: value }), mp5att(arg));
      } else {
        if (response.selection === list2.length) {
          mp5attpreview(arg);
        }
      }
    }));
}
function mp5attlaser(arg) {
  const equippable = arg.getComponent("minecraft:equippable"),
    mainhandItem = equippable.getEquipment("Mainhand"),
    typeId = mainhandItem?.typeId;
  if (!typeId || !isAllowed(typeId) || (typeId !== "krep:mp5" && typeId !== "krep:mp5_emp")) {
    arg.sendMessage("You must be holding an MP5 to use this form!");
    return;
  }
  const currentAttachment = getCurrentAttachment(arg, typeId, "laser"),
    form = new ActionFormData();
  (form.title("MP5 Laser"), form.body("Select a laser for your MP5."));
  const list = ["No Laser", "Laser 1"];
  (list.forEach((entry, arg2) => {
    const value = arg2 === 0 ? "textures/ui/zero/zero_laser" : "textures/ui/new/laser" + arg2;
    form.button("" + entry + (currentAttachment === arg2 ? " (Selected)" : ""), "" + value);
  }),
    form.button("Preview", "textures/ui/blank"),
    form.show(arg).then((response) => {
      if (response.canceled) return;
      const list2 = [0, 1];
      if (response.selection < list2.length) {
        {
          const value = list2[response.selection];
          (setAksesoris(arg, typeId, { laser: value }), mp5att(arg));
        }
      } else response.selection === list2.length && mp5attpreview(arg);
    }));
}
function mp5attmuzzle(arg) {
  const equippable = arg.getComponent("minecraft:equippable"),
    mainhandItem = equippable.getEquipment("Mainhand"),
    typeId = mainhandItem?.typeId;
  if (!typeId || !isAllowed(typeId) || (typeId !== "krep:mp5" && typeId !== "krep:mp5_emp")) {
    arg.sendMessage("You must be holding an MP5 to use this form!");
    return;
  }
  const currentAttachment = getCurrentAttachment(arg, typeId, "muzzle"),
    form = new ActionFormData();
  (form.title("MP5 Muzzle"), form.body("Select a muzzle for your MP5."));
  const list = [
    "No Muzzle",
    "Muzzle 1",
    "Muzzle 2",
    "Muzzle 3",
    "Muzzle 4",
    "Muzzle 5",
    "Muzzle 6",
  ];
  (list.forEach((entry, arg2) => {
    const value = arg2 === 0 ? "textures/ui/zero/zero_muzzle" : "textures/ui/new/muzzle" + arg2;
    form.button("" + entry + (currentAttachment === arg2 ? " (Selected)" : ""), "" + value);
  }),
    form.button("Preview", "textures/ui/blank"),
    form.show(arg).then((response) => {
      if (response.canceled) return;
      const list2 = [0, 1, 2, 3, 4, 5, 6];
      if (response.selection < list2.length) {
        const value = list2[response.selection];
        (setAksesoris(arg, typeId, { muzzle: value }), mp5att(arg));
      } else response.selection === list2.length && mp5attpreview(arg);
    }));
}
function mp5attscope(arg) {
  const form = new ActionFormData();
  (form.title("MP5 Sight"),
    form.button("Iron Sight", "textures/ui/nothing"),
    form.button("Coyote", "textures/ui/coyote"),
    form.button("Holo 552", "textures/ui/holo"),
    form.button("T2", "textures/ui/t2"),
    form.show(arg).then((response) => {
      if (response.canceled) return;
      switch (response.selection) {
        case 0:
          arg.runCommandAsync("event entity @s mp5:ironsight");
          break;
        case 1:
          arg.runCommandAsync("event entity @s mp5:coyote");
          break;
        case 2:
          arg.runCommandAsync("event entity @s mp5:holo");
          break;
        case 3:
          arg.runCommandAsync("event entity @s mp5:t2");
          break;
      }
      mp5att(arg);
    }));
}
function mp5att(arg) {
  const equippable = arg.getComponent("minecraft:equippable"),
    mainhandItem = equippable.getEquipment("Mainhand"),
    typeId = mainhandItem?.typeId;
  if (!typeId || !isAllowed(typeId) || (typeId !== "krep:mp5" && typeId !== "krep:mp5_emp")) {
    arg.sendMessage("You must be holding an MP5 to use this form!");
    return;
  }
  const form = new ActionFormData();
  (form.title("MP5 Attachments"),
    form.body("Select an attachment type to customize your MP5."),
    form.button("Grip", "textures/ui/new/grip1"),
    form.button("Stock", "textures/ui/new/stock8"),
    form.button("Laser", "textures/ui/new/laser1"),
    form.button("Muzzle", "textures/ui/new/muzzle1"),
    form.button("Sight", "textures/ui/coyote"),
    form.button("Preview", "textures/ui/blank"),
    form.show(arg).then((response) => {
      if (response.canceled) return;
      switch (response.selection) {
        case 0:
          mp5attgrip(arg);
          break;
        case 1:
          mp5attstock(arg);
          break;
        case 2:
          mp5attlaser(arg);
          break;
        case 3:
          mp5attmuzzle(arg);
          break;
        case 4:
          mp5attscope(arg);
          break;
        case 5:
          mp5attpreview(arg);
          break;
        default:
          break;
      }
    }));
}
function falattscope(arg) {
  const form = new ActionFormData();
  (form.title("fal Sight"),
    form.button("Iron Sight", "textures/ui/nothing"),
    form.button("Coyote", "textures/ui/coyote"),
    form.show(arg).then((response) => {
      if (response.canceled) return;
      switch (response.selection) {
        case 0:
          arg.runCommandAsync("event entity @s fal:ironsight");
          break;
        case 1:
          arg.runCommandAsync("event entity @s fal:coyote");
          break;
      }
      falatt(arg);
    }));
}
function falatt(arg) {
  const equippable = arg.getComponent("minecraft:equippable"),
    mainhandItem = equippable.getEquipment("Mainhand"),
    typeId = mainhandItem?.typeId;
  if (!typeId || !isAllowed(typeId) || (typeId !== "krep:fal" && typeId !== "krep:fal_emp")) {
    arg.sendMessage("You must be holding an fal to use this form!");
    return;
  }
  const form = new ActionFormData();
  (form.title("fal Attachments"),
    form.body("Select an attachment type to customize your fal."),
    form.button("Grip", "textures/ui/new/grip1"),
    form.button("Stock", "textures/ui/new/stock8"),
    form.button("Laser", "textures/ui/new/laser1"),
    form.button("Sight", "textures/ui/coyote"),
    form.button("Preview", "textures/ui/blank"),
    form.show(arg).then((response) => {
      if (response.canceled) return;
      switch (response.selection) {
        case 0:
          falattgrip(arg);
          break;
        case 1:
          falattstock(arg);
          break;
        case 2:
          falattlaser(arg);
          break;
        case 3:
          falattscope(arg);
          break;
        case 4:
          falattpreview(arg);
          break;
        default:
          break;
      }
    }));
}
function falattpreview(arg) {
  const equippable = arg.getComponent("minecraft:equippable"),
    mainhandItem = equippable.getEquipment("Mainhand"),
    typeId = mainhandItem?.typeId;
  if (!typeId || !isAllowed(typeId) || (typeId !== "krep:fal" && typeId !== "krep:fal_emp")) {
    arg.sendMessage("You must be holding an fal to use this form!");
    return;
  }
  (arg.addTag("preview_active"),
    arg.runCommandAsync("event entity @s krep:view"),
    playersInPreview.add(arg.id));
  const form = new ActionFormData();
  (form.title("Custom dial"),
    form.body("Preview your current attachments or confirm your selection."),
    form.button("Back", "textures/ui/blank"),
    form.button("Finish", "textures/ui/blank"),
    form.show(arg).then((response) => {
      {
        const parts = "1|0|3|4|2".split("|");
        let value = 0;
        while (true) {
          switch (parts[value++]) {
            case "0":
              playersInPreview["delete"](arg.id);
              continue;
            case "1":
              arg.removeTag("preview_active");
              continue;
            case "2":
              response.selection === 0 && falatt(arg);
              continue;
            case "3":
              arg.runCommandAsync("event entity @s krep:noview");
              continue;
            case "4":
              if (response.canceled) return;
              continue;
          }
          break;
        }
      }
    }));
}
function falattgrip(arg) {
  const equippable = arg.getComponent("minecraft:equippable"),
    mainhandItem = equippable.getEquipment("Mainhand"),
    typeId = mainhandItem?.typeId;
  if (!typeId || !isAllowed(typeId) || (typeId !== "krep:fal" && typeId !== "krep:fal_emp")) {
    arg.sendMessage("You must be holding an fal to use this form!");
    return;
  }
  const currentAttachment = getCurrentAttachment(arg, typeId, "grip"),
    form = new ActionFormData();
  (form.title("fal Grip"), form.body("Select a grip for your fal."));
  const list = [
    "No Grip",
    "Grip 1",
    "Grip 2",
    "Grip 3",
    "Grip 4",
    "Grip 5",
    "Grip 6",
    "Grip 7",
    "Grip 8",
    "Grip 9",
    "Grip 10",
    "Grip 11",
  ];
  (list.forEach((entry, arg2) => {
    {
      const value = arg2 === 0 ? "textures/ui/zero/zero_grip" : "textures/ui/new/grip" + arg2;
      form.button("" + entry + (currentAttachment === arg2 ? " (Selected)" : ""), "" + value);
    }
  }),
    form.button("Preview", "textures/ui/blank"),
    form.show(arg).then((response) => {
      {
        if (response.canceled) return;
        const list2 = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
        if (response.selection < list2.length) {
          {
            const value = list2[response.selection];
            (setAksesoris(arg, typeId, { grip: value }), falatt(arg));
          }
        } else response.selection === list2.length && falattpreview(arg);
      }
    }));
}
function falattstock(arg) {
  const equippable = arg.getComponent("minecraft:equippable"),
    mainhandItem = equippable.getEquipment("Mainhand"),
    typeId = mainhandItem?.typeId;
  if (!typeId || !isAllowed(typeId) || (typeId !== "krep:fal" && typeId !== "krep:fal_emp")) {
    arg.sendMessage("You must be holding an fal to use this form!");
    return;
  }
  const currentAttachment = getCurrentAttachment(arg, typeId, "stock"),
    form = new ActionFormData();
  (form.title("fal Stock"), form.body("Select a stock for your fal."));
  const list = [
    "No Stock",
    "Stock 1",
    "Stock 2",
    "Stock 3",
    "Stock 4",
    "Stock 5",
    "Stock 6",
    "Stock 7",
    "Stock 8",
    "Stock 9",
    "Stock 10",
    "Stock 11",
  ];
  (list.forEach((entry, arg2) => {
    const value = arg2 === 0 ? "textures/ui/zero/zero_stock" : "textures/ui/new/stock" + arg2;
    form.button("" + entry + (currentAttachment === arg2 ? " (Selected)" : ""), "" + value);
  }),
    form.button("Preview", "textures/ui/blank"),
    form.show(arg).then((response) => {
      if (response.canceled) return;
      const list2 = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
      if (response.selection < list2.length) {
        {
          const value = list2[response.selection];
          (setAksesoris(arg, typeId, { stock: value }), falatt(arg));
        }
      } else response.selection === list2.length && falattpreview(arg);
    }));
}
function falattlaser(arg) {
  const equippable = arg.getComponent("minecraft:equippable"),
    mainhandItem = equippable.getEquipment("Mainhand"),
    typeId = mainhandItem?.typeId;
  if (!typeId || !isAllowed(typeId) || (typeId !== "krep:fal" && typeId !== "krep:fal_emp")) {
    arg.sendMessage("You must be holding an fal to use this form!");
    return;
  }
  const currentAttachment = getCurrentAttachment(arg, typeId, "laser"),
    form = new ActionFormData();
  (form.title("fal Laser"), form.body("Select a laser for your fal."));
  const list = ["No Laser", "Laser 1"];
  (list.forEach((entry, arg2) => {
    const value = arg2 === 0 ? "textures/ui/zero/zero_laser" : "textures/ui/new/laser" + arg2;
    form.button("" + entry + (currentAttachment === arg2 ? " (Selected)" : ""), "" + value);
  }),
    form.button("Preview", "textures/ui/blank"),
    form.show(arg).then((response) => {
      if (response.canceled) return;
      const list2 = [0, 1];
      if (response.selection < list2.length) {
        const value = list2[response.selection];
        (setAksesoris(arg, typeId, { laser: value }), falatt(arg));
      } else response.selection === list2.length && falattpreview(arg);
    }));
}
function mk14attscope(arg) {
  const form = new ActionFormData();
  (form.title("mk14 Sight"),
    form.button("Iron Sight", "textures/ui/nothing"),
    form.button("Coyote", "textures/ui/coyote"),
    form.show(arg).then((response) => {
      if (response.canceled) return;
      switch (response.selection) {
        case 0:
          arg.runCommandAsync("event entity @s mk14:ironsight");
          break;
        case 1:
          arg.runCommandAsync("event entity @s mk14:coyote");
          break;
      }
      mk14att(arg);
    }));
}
function mk14att(arg) {
  const equippable = arg.getComponent("minecraft:equippable"),
    mainhandItem = equippable.getEquipment("Mainhand"),
    typeId = mainhandItem?.typeId;
  if (!typeId || !isAllowed(typeId) || (typeId !== "krep:mk14" && typeId !== "krep:mk14_emp")) {
    arg.sendMessage("You must be holding an mk14 to use this form!");
    return;
  }
  const form = new ActionFormData();
  (form.title("mk14 Attachments"),
    form.body("Select an attachment type to customize your mk14."),
    form.button("Grip", "textures/ui/new/grip1"),
    form.button("Stock", "textures/ui/new/stock8"),
    form.button("Laser", "textures/ui/new/laser1"),
    form.button("Sight", "textures/ui/coyote"),
    form.button("Preview", "textures/ui/blank"),
    form.show(arg).then((response) => {
      if (response.canceled) return;
      switch (response.selection) {
        case 0:
          mk14attgrip(arg);
          break;
        case 1:
          mk14attstock(arg);
          break;
        case 2:
          mk14attlaser(arg);
          break;
        case 3:
          mk14attscope(arg);
          break;
        case 4:
          mk14attpreview(arg);
          break;
        default:
          break;
      }
    }));
}
function mk14attpreview(arg) {
  const equippable = arg.getComponent("minecraft:equippable"),
    mainhandItem = equippable.getEquipment("Mainhand"),
    typeId = mainhandItem?.typeId;
  if (!typeId || !isAllowed(typeId) || (typeId !== "krep:mk14" && typeId !== "krep:mk14_emp")) {
    arg.sendMessage("You must be holding an mk14 to use this form!");
    return;
  }
  (arg.addTag("preview_active"),
    arg.runCommandAsync("event entity @s krep:view"),
    playersInPreview.add(arg.id));
  const form = new ActionFormData();
  (form.title("Custom dial"),
    form.body("Preview your current attachments or confirm your selection."),
    form.button("Back", "textures/ui/blank"),
    form.button("Finish", "textures/ui/blank"),
    form.show(arg).then((response) => {
      (arg.removeTag("preview_active"),
        playersInPreview["delete"](arg.id),
        arg.runCommandAsync("event entity @s krep:noview"));
      if (response.canceled) return;
      if (response.selection === 0) {
        mk14att(arg);
      }
    }));
}
function mk14attgrip(arg) {
  const equippable = arg.getComponent("minecraft:equippable"),
    mainhandItem = equippable.getEquipment("Mainhand"),
    typeId = mainhandItem?.typeId;
  if (!typeId || !isAllowed(typeId) || (typeId !== "krep:mk14" && typeId !== "krep:mk14_emp")) {
    arg.sendMessage("You must be holding an mk14 to use this form!");
    return;
  }
  const currentAttachment = getCurrentAttachment(arg, typeId, "grip"),
    form = new ActionFormData();
  (form.title("mk14 Grip"), form.body("Select a grip for your mk14."));
  const list = [
    "No Grip",
    "Grip 1",
    "Grip 2",
    "Grip 3",
    "Grip 4",
    "Grip 5",
    "Grip 6",
    "Grip 7",
    "Grip 8",
    "Grip 9",
    "Grip 10",
    "Grip 11",
  ];
  (list.forEach((entry, arg2) => {
    const value = arg2 === 0 ? "textures/ui/zero/zero_grip" : "textures/ui/new/grip" + arg2;
    form.button("" + entry + (currentAttachment === arg2 ? " (Selected)" : ""), "" + value);
  }),
    form.button("Preview", "textures/ui/blank"),
    form.show(arg).then((response) => {
      {
        if (response.canceled) return;
        const list2 = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
        if (response.selection < list2.length) {
          const value = list2[response.selection];
          (setAksesoris(arg, typeId, { grip: value }), mk14att(arg));
        } else response.selection === list2.length && mk14attpreview(arg);
      }
    }));
}
function mk14attstock(arg) {
  const equippable = arg.getComponent("minecraft:equippable"),
    mainhandItem = equippable.getEquipment("Mainhand"),
    typeId = mainhandItem?.typeId;
  if (!typeId || !isAllowed(typeId) || (typeId !== "krep:mk14" && typeId !== "krep:mk14_emp")) {
    arg.sendMessage("You must be holding an mk14 to use this form!");
    return;
  }
  const currentAttachment = getCurrentAttachment(arg, typeId, "stock"),
    form = new ActionFormData();
  (form.title("mk14 Stock"), form.body("Select a stock for your mk14."));
  const list = [
    "No Stock",
    "Stock 1",
    "Stock 2",
    "Stock 3",
    "Stock 4",
    "Stock 5",
    "Stock 6",
    "Stock 7",
    "Stock 8",
  ];
  (list.forEach((entry, arg2) => {
    const value = arg2 === 0 ? "textures/ui/zero/zero_stock" : "textures/ui/new/m4a1/stock" + arg2;
    form.button("" + entry + (currentAttachment === arg2 ? " (Selected)" : ""), "" + value);
  }),
    form.button("Preview", "textures/ui/blank"),
    form.show(arg).then((response) => {
      if (response.canceled) return;
      const list2 = [0, 1, 2, 3, 4, 5, 6, 7, 8];
      if (response.selection < list2.length) {
        const value = list2[response.selection];
        (setAksesoris(arg, typeId, { stock: value }), mk14att(arg));
      } else {
        if (response.selection === list2.length) {
          mk14attpreview(arg);
        }
      }
    }));
}
function mk14attlaser(arg) {
  const equippable = arg.getComponent("minecraft:equippable"),
    mainhandItem = equippable.getEquipment("Mainhand"),
    typeId = mainhandItem?.typeId;
  if (!typeId || !isAllowed(typeId) || (typeId !== "krep:mk14" && typeId !== "krep:mk14_emp")) {
    arg.sendMessage("You must be holding an mk14 to use this form!");
    return;
  }
  const currentAttachment = getCurrentAttachment(arg, typeId, "laser"),
    form = new ActionFormData();
  (form.title("mk14 Laser"), form.body("Select a laser for your mk14."));
  const list = ["No Laser", "Laser 1"];
  (list.forEach((entry, arg2) => {
    {
      const value = arg2 === 0 ? "textures/ui/zero/zero_laser" : "textures/ui/new/laser" + arg2;
      form.button("" + entry + (currentAttachment === arg2 ? " (Selected)" : ""), "" + value);
    }
  }),
    form.button("Preview", "textures/ui/blank"),
    form.show(arg).then((response) => {
      {
        if (response.canceled) return;
        const list2 = [0, 1];
        if (response.selection < list2.length) {
          {
            const value = list2[response.selection];
            (setAksesoris(arg, typeId, { laser: value }), mk14att(arg));
          }
        } else {
          if (response.selection === list2.length) {
            mk14attpreview(arg);
          }
        }
      }
    }));
}
function vectorattpreview(arg) {
  const equippable = arg.getComponent("minecraft:equippable"),
    mainhandItem = equippable.getEquipment("Mainhand"),
    typeId = mainhandItem?.typeId;
  if (!typeId || !isAllowed(typeId) || (typeId !== "krep:vector" && typeId !== "krep:vector_emp")) {
    arg.sendMessage("You must be holding an Vector to use this form!");
    return;
  }
  (arg.addTag("preview_active"),
    arg.runCommandAsync("event entity @s krep:view"),
    playersInPreview.add(arg.id));
  const form = new ActionFormData();
  (form.title("Custom dial"),
    form.body("Preview your current attachments or confirm your selection."),
    form.button("Back", "textures/ui/blank"),
    form.button("Finish", "textures/ui/blank"),
    form.show(arg).then((response) => {
      (arg.removeTag("preview_active"),
        playersInPreview["delete"](arg.id),
        arg.runCommandAsync("event entity @s krep:noview"));
      if (response.canceled) return;
      if (response.selection === 0) {
        vectoratt(arg);
      }
    }));
}
function vectorattgrip(arg) {
  const equippable = arg.getComponent("minecraft:equippable"),
    mainhandItem = equippable.getEquipment("Mainhand"),
    typeId = mainhandItem?.typeId;
  if (!typeId || !isAllowed(typeId) || (typeId !== "krep:vector" && typeId !== "krep:vector_emp")) {
    arg.sendMessage("You must be holding an Vector to use this form!");
    return;
  }
  const currentAttachment = getCurrentAttachment(arg, typeId, "grip"),
    form = new ActionFormData();
  (form.title("Vector Grip"), form.body("Select a grip for your Vector."));
  const list = [
    "No Grip",
    "Grip 1",
    "Grip 2",
    "Grip 3",
    "Grip 4",
    "Grip 5",
    "Grip 6",
    "Grip 7",
    "Grip 8",
  ];
  (list.forEach((entry, arg2) => {
    {
      const value =
        arg2 === 0 ? "textures/ui/zero/zero_grip" : "textures/ui/new/vector/grip" + arg2;
      form.button("" + entry + (currentAttachment === arg2 ? " (Selected)" : ""), "" + value);
    }
  }),
    form.button("Preview", "textures/ui/blank"),
    form.show(arg).then((response) => {
      if (response.canceled) return;
      const list2 = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
      if (response.selection < list2.length) {
        const value = list2[response.selection];
        (setAksesoris(arg, typeId, { grip: value }), vectoratt(arg));
      } else response.selection === list2.length && vectorattpreview(arg);
    }));
}
function vectorattstock(arg) {
  const equippable = arg.getComponent("minecraft:equippable"),
    mainhandItem = equippable.getEquipment("Mainhand"),
    typeId = mainhandItem?.typeId;
  if (!typeId || !isAllowed(typeId) || (typeId !== "krep:vector" && typeId !== "krep:vector_emp")) {
    arg.sendMessage("You must be holding an Vector to use this form!");
    return;
  }
  const currentAttachment = getCurrentAttachment(arg, typeId, "stock"),
    form = new ActionFormData();
  (form.title("Vector Stock"), form.body("Select a stock for your Vector."));
  const list = [
    "No Stock",
    "Stock 1",
    "Stock 2",
    "Stock 3",
    "Stock 4",
    "Stock 5",
    "Stock 6",
    "Stock 7",
    "Stock 8",
    "Stock 9",
    "Stock 10",
    "Stock 11",
  ];
  (list.forEach((entry, arg2) => {
    const value = arg2 === 0 ? "textures/ui/zero/zero_stock" : "textures/ui/new/stock" + arg2;
    form.button("" + entry + (currentAttachment === arg2 ? " (Selected)" : ""), "" + value);
  }),
    form.button("Preview", "textures/ui/blank"),
    form.show(arg).then((response) => {
      if (response.canceled) return;
      const list2 = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
      if (response.selection < list2.length) {
        const value = list2[response.selection];
        (setAksesoris(arg, typeId, { stock: value }), vectoratt(arg));
      } else response.selection === list2.length && vectorattpreview(arg);
    }));
}
function vectorattlaser(arg) {
  const equippable = arg.getComponent("minecraft:equippable"),
    mainhandItem = equippable.getEquipment("Mainhand"),
    typeId = mainhandItem?.typeId;
  if (!typeId || !isAllowed(typeId) || (typeId !== "krep:vector" && typeId !== "krep:vector_emp")) {
    arg.sendMessage("You must be holding an Vector to use this form!");
    return;
  }
  const currentAttachment = getCurrentAttachment(arg, typeId, "laser"),
    form = new ActionFormData();
  (form.title("Vector Laser"), form.body("Select a laser for your Golden Deagle."));
  const list = ["No Laser", "Laser 1"];
  (list.forEach((entry, arg2) => {
    {
      const value = arg2 === 0 ? "textures/ui/zero/zero_laser" : "textures/ui/new/laser" + arg2;
      form.button("" + entry + (currentAttachment === arg2 ? " (Selected)" : ""), "" + value);
    }
  }),
    form.button("Preview", "textures/ui/blank"),
    form.show(arg).then((response) => {
      if (response.canceled) return;
      const list2 = [0, 1];
      if (response.selection < list2.length) {
        {
          const value = list2[response.selection];
          (setAksesoris(arg, typeId, { laser: value }), vectoratt(arg));
        }
      } else response.selection === list2.length && vectorattpreview(arg);
    }));
}
function vectorattmuzzle(arg) {
  const equippable = arg.getComponent("minecraft:equippable"),
    mainhandItem = equippable.getEquipment("Mainhand"),
    typeId = mainhandItem?.typeId;
  if (!typeId || !isAllowed(typeId) || (typeId !== "krep:vector" && typeId !== "krep:vector_emp")) {
    arg.sendMessage("You must be holding an Vector to use this form!");
    return;
  }
  const currentAttachment = getCurrentAttachment(arg, typeId, "muzzle"),
    form = new ActionFormData();
  (form.title("Vector Muzzle"), form.body("Select a muzzle for your Vector."));
  const list = [
    "No Muzzle",
    "Muzzle 1",
    "Muzzle 2",
    "Muzzle 3",
    "Muzzle 4",
    "Muzzle 5",
    "Muzzle 6",
  ];
  (list.forEach((entry, arg2) => {
    const value = arg2 === 0 ? "textures/ui/zero/zero_muzzle" : "textures/ui/new/muzzle" + arg2;
    form.button("" + entry + (currentAttachment === arg2 ? " (Selected)" : ""), "" + value);
  }),
    form.button("Preview", "textures/ui/blank"),
    form.show(arg).then((response) => {
      {
        if (response.canceled) return;
        const list2 = [0, 1, 2, 3, 4, 5, 6];
        if (response.selection < list2.length) {
          const value = list2[response.selection];
          (setAksesoris(arg, typeId, { muzzle: value }), vectoratt(arg));
        } else response.selection === list2.length && vectorattpreview(arg);
      }
    }));
}
function vectorattscope(arg) {
  const form = new ActionFormData();
  (form.title("Vector Sight"),
    form.button("Iron Sight", "textures/ui/nothing"),
    form.button("Coyote", "textures/ui/coyote"),
    form.button("Holo 552", "textures/ui/holo"),
    form.button("T2", "textures/ui/t2"),
    form.show(arg).then((response) => {
      if (response.canceled) return;
      switch (response.selection) {
        case 0:
          arg.runCommandAsync("event entity @s vector:ironsight");
          break;
        case 1:
          arg.runCommandAsync("event entity @s vector:coyote");
          break;
        case 2:
          arg.runCommandAsync("event entity @s vector:holo");
          break;
        case 3:
          arg.runCommandAsync("event entity @s vector:t2");
          break;
      }
      vectoratt(arg);
    }));
}
function vectorattmagazine(arg) {
  const equippable = arg.getComponent("minecraft:equippable"),
    mainhandItem = equippable.getEquipment("Mainhand"),
    typeId = mainhandItem?.typeId;
  if (!typeId || !isAllowed(typeId) || (typeId !== "krep:vector" && typeId !== "krep:vector_emp")) {
    arg.sendMessage("You must be holding a Vector to use this form!");
    return;
  }
  const currentAttachment = getCurrentAttachment(arg, typeId, "magazine"),
    form = new ActionFormData();
  (form.title("Vector Magazine"),
    form.body("Select an extended magazine range for your Vector (0-3)."));
  const list = ["No Extension", "Extended 1", "Extended 2", "Extended 3"];
  (list.forEach((entry, arg2) => {
    form.button(
      "" + entry + (currentAttachment === arg2 ? " (Selected)" : ""),
      "textures/ui/new/magazine" + (arg2 || "none"),
    );
  }),
    form.button("Back", "textures/ui/blank"),
    form.show(arg).then((response) => {
      {
        if (response.canceled) return;
        const list2 = [0, 1, 2, 3];
        if (response.selection < list2.length) {
          const value = list2[response.selection];
          (setAksesoris(arg, typeId, { magazine: value }), vectoratt(arg));
        } else {
          if (response.selection === list2.length) {
            vectorattpreview(arg);
          }
        }
      }
    }));
}
function vectoratt(arg) {
  const equippable = arg.getComponent("minecraft:equippable"),
    mainhandItem = equippable.getEquipment("Mainhand"),
    typeId = mainhandItem?.typeId;
  if (!typeId || !isAllowed(typeId) || (typeId !== "krep:vector" && typeId !== "krep:vector_emp")) {
    arg.sendMessage("You must be holding an Vector to use this form!");
    return;
  }
  const form = new ActionFormData();
  (form.title("Vector Attachments"),
    form.body("Select an attachment type to customize your Vector."),
    form.button("Grip", "textures/ui/new/grip1"),
    form.button("Stock", "textures/ui/new/stock8"),
    form.button("Laser", "textures/ui/new/laser1"),
    form.button("Muzzle", "textures/ui/new/muzzle1"),
    form.button("Sight", "textures/ui/coyote"),
    form.button("Magazine", "textures/ui/new/magazine1"),
    form.button("Preview", "textures/ui/blank"),
    form.show(arg).then((response) => {
      if (response.canceled) return;
      switch (response.selection) {
        case 0:
          vectorattgrip(arg);
          break;
        case 1:
          vectorattstock(arg);
          break;
        case 2:
          vectorattlaser(arg);
          break;
        case 3:
          vectorattmuzzle(arg);
          break;
        case 4:
          vectorattscope(arg);
          break;
        case 5:
          vectorattmagazine(arg);
          break;
        case 6:
          vectorattpreview(arg);
          break;
        default:
          break;
      }
    }));
}
function deaglegattpreview(arg) {
  const equippable = arg.getComponent("minecraft:equippable"),
    mainhandItem = equippable.getEquipment("Mainhand"),
    typeId = mainhandItem?.typeId;
  if (
    !typeId ||
    !isAllowed(typeId) ||
    (typeId !== "krep:deagleg" && typeId !== "krep:deagleg_emp")
  ) {
    arg.sendMessage("You must be holding an Golden Deagle to use this form!");
    return;
  }
  (arg.addTag("preview_active"),
    arg.runCommandAsync("event entity @s krep:view"),
    playersInPreview.add(arg.id));
  const form = new ActionFormData();
  (form.title("Custom dial"),
    form.body("Preview your current attachments or confirm your selection."),
    form.button("Back", "textures/ui/blank"),
    form.button("Finish", "textures/ui/blank"),
    form.show(arg).then((response) => {
      (arg.removeTag("preview_active"),
        playersInPreview["delete"](arg.id),
        arg.runCommandAsync("event entity @s krep:noview"));
      if (response.canceled) return;
      if (response.selection === 0) {
        deaglegatt(arg);
      }
    }));
}
function deaglegattlaser(arg) {
  const equippable = arg.getComponent("minecraft:equippable"),
    mainhandItem = equippable.getEquipment("Mainhand"),
    typeId = mainhandItem?.typeId;
  if (
    !typeId ||
    !isAllowed(typeId) ||
    (typeId !== "krep:deagleg" && typeId !== "krep:deagleg_emp")
  ) {
    arg.sendMessage("You must be holding an Vector to use this form!");
    return;
  }
  const currentAttachment = getCurrentAttachment(arg, typeId, "laser"),
    form = new ActionFormData();
  (form.title("Vector Laser"), form.body("Select a laser for your Golden Deagle."));
  const list = ["No Laser", "Laser 1"];
  (list.forEach((entry, arg2) => {
    const value = arg2 === 0 ? "textures/ui/zero/zero_laser" : "textures/ui/new/g17/laser" + arg2;
    form.button("" + entry + (currentAttachment === arg2 ? " (Selected)" : ""), "" + value);
  }),
    form.button("Preview", "textures/ui/blank"),
    form.show(arg).then((response) => {
      {
        if (response.canceled) return;
        const list2 = [0, 1];
        if (response.selection < list2.length) {
          {
            const value = list2[response.selection];
            (setAksesoris(arg, typeId, { laser: value }), deaglegatt(arg));
          }
        } else response.selection === list2.length && deaglegattpreview(arg);
      }
    }));
}
function deaglegattmuzzle(arg) {
  const equippable = arg.getComponent("minecraft:equippable"),
    mainhandItem = equippable.getEquipment("Mainhand"),
    typeId = mainhandItem?.typeId;
  if (
    !typeId ||
    !isAllowed(typeId) ||
    (typeId !== "krep:deagleg" && typeId !== "krep:deagleg_emp")
  ) {
    arg.sendMessage("You must be holding an Golden Deagle to use this form!");
    return;
  }
  const currentAttachment = getCurrentAttachment(arg, typeId, "muzzle"),
    form = new ActionFormData();
  (form.title("Golden Deagle Muzzle"), form.body("Select a muzzle for your Golden Deagle."));
  const list = ["No Muzzle", "Muzzle 1"];
  (list.forEach((entry, arg2) => {
    {
      const value =
        arg2 === 0 ? "textures/ui/zero/zero_muzzle" : "textures/ui/new/deagleg/muzzle" + arg2;
      form.button("" + entry + (currentAttachment === arg2 ? " (Selected)" : ""), "" + value);
    }
  }),
    form.button("Preview", "textures/ui/blank"),
    form.show(arg).then((response) => {
      if (response.canceled) return;
      const list2 = [0, 1];
      if (response.selection < list2.length) {
        {
          const value = list2[response.selection];
          (setAksesoris(arg, typeId, { muzzle: value }), deaglegatt(arg));
        }
      } else response.selection === list2.length && deaglegattpreview(arg);
    }));
}
function deaglegattmagazine(arg) {
  const equippable = arg.getComponent("minecraft:equippable"),
    mainhandItem = equippable.getEquipment("Mainhand"),
    typeId = mainhandItem?.typeId;
  if (
    !typeId ||
    !isAllowed(typeId) ||
    (typeId !== "krep:deagleg" && typeId !== "krep:deagleg_emp")
  ) {
    arg.sendMessage("You must be holding a Golden Deagle to use this form!");
    return;
  }
  const currentAttachment = getCurrentAttachment(arg, typeId, "magazine"),
    form = new ActionFormData();
  (form.title("Golden Deagle Magazine"),
    form.body("Select an extended magazine range for your Golden Deagle (0-3)."));
  const list = ["No Extension", "Extended 1", "Extended 2", "Extended 3"];
  (list.forEach((entry, arg2) => {
    form.button(
      "" + entry + (currentAttachment === arg2 ? " (Selected)" : ""),
      "textures/ui/new/magazine" + (arg2 || "none"),
    );
  }),
    form.button("Back", "textures/ui/blank"),
    form.show(arg).then((response) => {
      {
        if (response.canceled) return;
        const list2 = [0, 1, 2, 3];
        if (response.selection < list2.length) {
          {
            const value = list2[response.selection];
            (setAksesoris(arg, typeId, { magazine: value }), deaglegatt(arg));
          }
        } else response.selection === list2.length && deaglegattpreview(arg);
      }
    }));
}
function deaglegatt(arg) {
  const equippable = arg.getComponent("minecraft:equippable"),
    mainhandItem = equippable.getEquipment("Mainhand"),
    typeId = mainhandItem?.typeId;
  if (
    !typeId ||
    !isAllowed(typeId) ||
    (typeId !== "krep:deagleg" && typeId !== "krep:deagleg_emp")
  ) {
    arg.sendMessage("You must be holding an Golden Deagle to use this form!");
    return;
  }
  const form = new ActionFormData();
  (form.title("Golden Deagle Attachments"),
    form.body("Select an attachment type to customize your Golden Deagle."),
    form.button("Laser", "textures/ui/new/laser1"),
    form.button("Muzzle", "textures/ui/new/deagleg/muzzle1"),
    form.button("Magazine", "textures/ui/new/magazine1"),
    form.button("Preview", "textures/ui/blank"),
    form.show(arg).then((response) => {
      if (response.canceled) return;
      switch (response.selection) {
        case 0:
          deaglegattlaser(arg);
          break;
        case 1:
          deaglegattmuzzle(arg);
          break;
        case 2:
          deaglegattmagazine(arg);
          break;
        case 3:
          deaglegattpreview(arg);
          break;
        default:
          break;
      }
    }));
}
function akmattpreview(arg) {
  const equippable = arg.getComponent("minecraft:equippable"),
    mainhandItem = equippable.getEquipment("Mainhand"),
    typeId = mainhandItem?.typeId;
  if (!typeId || !isAllowed(typeId) || (typeId !== "krep:akm" && typeId !== "krep:akm_emp")) {
    arg.sendMessage("You must be holding an Vector to use this form!");
    return;
  }
  (arg.addTag("preview_active"),
    arg.runCommandAsync("event entity @s krep:view"),
    playersInPreview.add(arg.id));
  const form = new ActionFormData();
  (form.title("Custom dial"),
    form.body("Preview your current attachments or confirm your selection."),
    form.button("Back", "textures/ui/blank"),
    form.button("Finish", "textures/ui/blank"),
    form.show(arg).then((response) => {
      const parts = "3|4|0|2|1".split("|");
      let value = 0;
      while (true) {
        switch (parts[value++]) {
          case "0":
            arg.runCommandAsync("event entity @s krep:noview");
            continue;
          case "1":
            response.selection === 0 && akmatt(arg);
            continue;
          case "2":
            if (response.canceled) return;
            continue;
          case "3":
            arg.removeTag("preview_active");
            continue;
          case "4":
            playersInPreview["delete"](arg.id);
            continue;
        }
        break;
      }
    }));
}
function akmattstock(arg) {
  const equippable = arg.getComponent("minecraft:equippable"),
    mainhandItem = equippable.getEquipment("Mainhand"),
    typeId = mainhandItem?.typeId;
  if (!typeId || !isAllowed(typeId) || (typeId !== "krep:akm" && typeId !== "krep:akm_emp")) {
    arg.sendMessage("You must be holding an Vector to use this form!");
    return;
  }
  const currentAttachment = getCurrentAttachment(arg, typeId, "stock"),
    form = new ActionFormData();
  (form.title("Vector Stock"), form.body("Select a stock for your Vector."));
  const list = [
    "No Stock",
    "Stock 1",
    "Stock 2",
    "Stock 3",
    "Stock 4",
    "Stock 5",
    "Stock 6",
    "Stock 7",
    "Stock 8",
    "Stock 9",
    "Stock 10",
    "Stock 11",
  ];
  (list.forEach((entry, arg2) => {
    const value = arg2 === 0 ? "textures/ui/zero/zero_stock" : "textures/ui/new/stock" + arg2;
    form.button("" + entry + (currentAttachment === arg2 ? " (Selected)" : ""), "" + value);
  }),
    form.button("Preview", "textures/ui/blank"),
    form.show(arg).then((response) => {
      {
        if (response.canceled) return;
        const list2 = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
        if (response.selection < list2.length) {
          const value = list2[response.selection];
          (setAksesoris(arg, typeId, { stock: value }), akmatt(arg));
        } else {
          if (response.selection === list2.length) {
            akmattpreview(arg);
          }
        }
      }
    }));
}
function akmattmuzzle(arg) {
  const equippable = arg.getComponent("minecraft:equippable"),
    mainhandItem = equippable.getEquipment("Mainhand"),
    typeId = mainhandItem?.typeId;
  if (!typeId || !isAllowed(typeId) || (typeId !== "krep:akm" && typeId !== "krep:akm_emp")) {
    arg.sendMessage("You must be holding an AKM to use this form!");
    return;
  }
  const currentAttachment = getCurrentAttachment(arg, typeId, "muzzle"),
    form = new ActionFormData();
  (form.title("AKM Muzzle"), form.body("Select a muzzle for your Vector."));
  const list = [
    "No Muzzle",
    "Muzzle 1",
    "Muzzle 2",
    "Muzzle 3",
    "Muzzle 4",
    "Muzzle 5",
    "Muzzle 6",
  ];
  (list.forEach((entry, arg2) => {
    const value = arg2 === 0 ? "textures/ui/zero/zero_muzzle" : "textures/ui/new/muzzle" + arg2;
    form.button("" + entry + (currentAttachment === arg2 ? " (Selected)" : ""), "" + value);
  }),
    form.button("Preview", "textures/ui/blank"),
    form.show(arg).then((response) => {
      if (response.canceled) return;
      const list2 = [0, 1, 2, 3, 4, 5, 6];
      if (response.selection < list2.length) {
        {
          const value = list2[response.selection];
          (setAksesoris(arg, typeId, { muzzle: value }), akmatt(arg));
        }
      } else response.selection === list2.length && akmattpreview(arg);
    }));
}
function akmattscope(arg) {
  const form = new ActionFormData();
  (form.title("AKM Sight"),
    form.button("Iron Sight", "textures/ui/nothing"),
    form.button("Coyote", "textures/ui/coyote"),
    form.button("Holo 552", "textures/ui/holo"),
    form.button("OKP-7", "textures/ui/okp7"),
    form.button("Acog", "textures/ui/acog"),
    form.button("Elcan", "textures/ui/elcan"),
    form.show(arg).then((response) => {
      if (response.canceled) return;
      switch (response.selection) {
        case 0:
          arg.runCommandAsync("event entity @s akm:ironsight");
          break;
        case 1:
          arg.runCommandAsync("event entity @s akm:coyote");
          break;
        case 2:
          arg.runCommandAsync("event entity @s akm:holo");
          break;
        case 3:
          arg.runCommandAsync("event entity @s akm:okp7");
          break;
        case 4:
          arg.runCommandAsync("event entity @s akm:acog");
          break;
        case 5:
          arg.runCommandAsync("event entity @s akm:elcan");
          break;
      }
      akmatt(arg);
    }));
}
function akmatt(arg) {
  const equippable = arg.getComponent("minecraft:equippable"),
    mainhandItem = equippable.getEquipment("Mainhand"),
    typeId = mainhandItem?.typeId;
  if (!typeId || !isAllowed(typeId) || (typeId !== "krep:akm" && typeId !== "krep:akm_emp")) {
    arg.sendMessage("You must be holding an AKM to use this form!");
    return;
  }
  const form = new ActionFormData();
  (form.title("AKM Attachments"),
    form.body("Select an attachment type to customize your Golden Deagle."),
    form.button("Stock", "textures/ui/new/stock8"),
    form.button("Muzzle", "textures/ui/new/muzzle1"),
    form.button("Sight", "textures/ui/coyote"),
    form.button("Preview", "textures/ui/blank"),
    form.show(arg).then((response) => {
      if (response.canceled) return;
      switch (response.selection) {
        case 0:
          akmattstock(arg);
          break;
        case 1:
          akmattmuzzle(arg);
          break;
        case 2:
          akmattscope(arg);
          break;
        case 3:
          akmattpreview(arg);
          break;
        default:
          break;
      }
    }));
}
(system.runInterval(() => {
  for (let player of world.getPlayers()) {
    player.hasTag("batak") &&
      system.run(() => {
        (attachmentnew(player), player.runCommandAsync('tag @s remove "batak"'));
      });
  }
}, 20),
  system.runInterval(() => {
    for (let player of world.getPlayers()) {
      player.hasTag("preview_active") &&
        !playersInPreview.has(player.id) &&
        (player.removeTag("preview_active"), player.runCommandAsync("event entity @s krep:noview"));
    }
  }, 20));
