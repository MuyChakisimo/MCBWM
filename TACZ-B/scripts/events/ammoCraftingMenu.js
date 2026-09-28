import { world, system } from "@minecraft/server";
import { ActionFormData } from "@minecraft/server-ui";
function craftammo(arg) {
  let form = new ActionFormData();
  (form.title("Ammo Crafting"),
    form.body("Select an ammo to craft:"),
    form.button("5.56x45mm", "textures/items/m885"),
    form.button("9x19mm", "textures/items/9mm"),
    form.button(".45 ACP", "textures/items/45acp"),
    form.button(".50 AE", "textures/items/50ae"),
    form.button("12 Gauge", "textures/items/12gauge"),
    form.button("5.7x28mm", "textures/items/5728mm"),
    form.button(".308 Winchester", "textures/items/308win"),
    form.button("RPG Rocket", "textures/items/rpgrocket"),
    form.button(".338 Lapua", "textures/items/338lapua"),
    form.button("7.62x39mm", "textures/items/m43"),
    form.button("4.6x30mm", "textures/items/4630mm"),
    form.button(".357 Magnum", "textures/items/357mag"),
    form.button("5.8x42mm", "textures/items/5842mm"),
    form.button(".308 Winchester Ammo Box", "textures/items/308winbox"),
    form.show(arg).then((response) => {
      if (response.canceled) return;
      switch (response.selection) {
        case 0:
          mm556c(arg);
          break;
        case 1:
          mm9c(arg);
          break;
        case 2:
          acp45c(arg);
          break;
        case 3:
          ae50c(arg);
          break;
        case 4:
          gauge12c(arg);
          break;
        case 5:
          mm5728c(arg);
          break;
        case 6:
          win308c(arg);
          break;
        case 7:
          rpgrocketec(arg);
          break;
        case 8:
          lapua308c(arg);
          break;
        case 9:
          m43c(arg);
          break;
        case 10:
          mm4630c(arg);
          break;
        case 11:
          mag357c(arg);
          break;
        case 12:
          mm5842c(arg);
          break;
        case 13:
          win308boxc(arg);
          break;
        default:
          break;
      }
    }));
}
function mm556c(arg) {
  let form = new ActionFormData();
  (form.title("Craft 5.56x45mm?"),
    form.body("Are you sure? You need:\n \n- 45x Copper Ingot\n- 3x Gunpowder"),
    form.button("Confirm"),
    form.button("Cancel"),
    form.show(arg).then((response) => {
      if (response.canceled) return;
      if (response.selection === 0)
        arg
          .runCommandAsync(
            "give @s[hasitem=[{item=copper_ingot,quantity=45..},{item=gunpowder,quantity=3..}]] krep:m885 45",
          )
          .then(() => {
            (arg.runCommandAsync(
              "clear @s[hasitem=[{item=copper_ingot,quantity=45..},{item=gunpowder,quantity=3..}]] copper_ingot 0 45",
            ),
              arg.runCommandAsync(
                "clear @s[hasitem=[{item=copper_ingot,quantity=45..},{item=gunpowder,quantity=3..}]] gunpowder 0 3",
              ));
          });
      else response.selection === 1 && craftammo(arg);
    }));
}
function mm5842c(arg) {
  let form = new ActionFormData();
  (form.title("Craft 5.8x42mm?"),
    form.body("Are you sure? You need:\n \n- 15x Copper Ingot\n- 3x Gunpowder"),
    form.button("Confirm"),
    form.button("Cancel"),
    form.show(arg).then((response) => {
      if (response.canceled) return;
      if (response.selection === 0)
        arg
          .runCommandAsync(
            "give @s[hasitem=[{item=copper_ingot,quantity=15..},{item=gunpowder,quantity=3..}]] krep:mm5842 40",
          )
          .then(() => {
            (arg.runCommandAsync(
              "clear @s[hasitem=[{item=copper_ingot,quantity=15..},{item=gunpowder,quantity=3..}]] copper_ingot 0 15",
            ),
              arg.runCommandAsync(
                "clear @s[hasitem=[{item=copper_ingot,quantity=15..},{item=gunpowder,quantity=3..}]] gunpowder 0 3",
              ));
          });
      else response.selection === 1 && craftammo(arg);
    }));
}
function mag357c(arg) {
  let form = new ActionFormData();
  (form.title("Craft .357 Magnum?"),
    form.body("Are you sure? You need:\n\n- 25x Copper Ingot\n- 6x Gunpowder"),
    form.button("Confirm"),
    form.button("Cancel"),
    form.show(arg).then((response) => {
      if (response.canceled) return;
      if (response.selection === 0)
        arg
          .runCommandAsync(
            "give @s[hasitem=[{item=copper_ingot,quantity=25..},{item=gunpowder,quantity=6..}]] krep:mag357 48",
          )
          .then(() => {
            (arg.runCommandAsync(
              "clear @s[hasitem=[{item=copper_ingot,quantity=25..},{item=gunpowder,quantity=6..}]] copper_ingot 0 25",
            ),
              arg.runCommandAsync(
                "clear @s[hasitem=[{item=copper_ingot,quantity=25..},{item=gunpowder,quantity=6..}]] gunpowder 0 6",
              ));
          });
      else {
        if (response.selection === 1) {
          craftammo(arg);
        }
      }
    }));
}
function mm9c(arg) {
  let form = new ActionFormData();
  (form.title("Craft 9x19mm?"),
    form.body("Are you sure? You need:\n \n- 10x Copper Ingot\n- 2x Gunpowder"),
    form.button("Confirm"),
    form.button("Cancel"),
    form.show(arg).then((response) => {
      if (response.canceled) return;
      if (response.selection === 0)
        arg
          .runCommandAsync(
            "give @s[hasitem=[{item=copper_ingot,quantity=10..},{item=gunpowder,quantity=2..}]] krep:mm9 50",
          )
          .then(() => {
            (arg.runCommandAsync(
              "clear @s[hasitem=[{item=copper_ingot,quantity=10..},{item=gunpowder,quantity=2..}]] copper_ingot 0 10",
            ),
              arg.runCommandAsync(
                "clear @s[hasitem=[{item=copper_ingot,quantity=10..},{item=gunpowder,quantity=2..}]] gunpowder 0 2",
              ));
          });
      else response.selection === 1 && craftammo(arg);
    }));
}
function acp45c(arg) {
  let form = new ActionFormData();
  (form.title("Craft .45 Acp?"),
    form.body("Are you sure? You need:\n \n- 10x Copper Ingot\n- 2x Gunpowder"),
    form.button("Confirm"),
    form.button("Cancel"),
    form.show(arg).then((response) => {
      if (response.canceled) return;
      if (response.selection === 0)
        arg
          .runCommandAsync(
            "give @s[hasitem=[{item=copper_ingot,quantity=10..},{item=gunpowder,quantity=2..}]] krep:acp45 30",
          )
          .then(() => {
            (arg.runCommandAsync(
              "clear @s[hasitem=[{item=copper_ingot,quantity=10..},{item=gunpowder,quantity=2..}]] copper_ingot 0 10",
            ),
              arg.runCommandAsync(
                "clear @s[hasitem=[{item=copper_ingot,quantity=10..},{item=gunpowder,quantity=2..}]] gunpowder 0 2",
              ));
          });
      else response.selection === 1 && craftammo(arg);
    }));
}
function ae50c(arg) {
  let form = new ActionFormData();
  (form.title("Craft .50 Action Express?"),
    form.body("Are you sure? You need:\n \n- 30x Copper Ingot\n- 5x Lapis Lazuli\n- 7x Gunpowder"),
    form.button("Confirm"),
    form.button("Cancel"),
    form.show(arg).then((response) => {
      if (response.canceled) return;
      if (response.selection === 0)
        arg
          .runCommandAsync(
            "give @s[hasitem=[{item=copper_ingot,quantity=30..},{item=gunpowder,quantity=7..},{item=lapis_lazuli,quantity=5..}]] krep:ae50 36",
          )
          .then(() => {
            (arg.runCommandAsync(
              "clear @s[hasitem=[{item=copper_ingot,quantity=30..},{item=gunpowder,quantity=7..},{item=lapis_lazuli,quantity=5..}]] copper_ingot 0 30",
            ),
              arg.runCommandAsync(
                "clear @s[hasitem=[{item=copper_ingot,quantity=30..},{item=gunpowder,quantity=7..},{item=lapis_lazuli,quantity=5..}]] gunpowder 0 7",
              ),
              arg.runCommandAsync(
                "clear @s[hasitem=[{item=copper_ingot,quantity=30..},{item=gunpowder,quantity=7..},{item=lapis_lazuli,quantity=5..}]] lapis_lazuli 0 5",
              ));
          });
      else response.selection === 1 && craftammo(arg);
    }));
}
function gauge12c(arg) {
  let form = new ActionFormData();
  (form.title("Craft 12 Gauge?"),
    form.body("Are you sure? You need:\n \n- 15x Copper Ingot\n- 18x Iron Nugget\n- 6x Gunpowder"),
    form.button("Confirm"),
    form.button("Cancel"),
    form.show(arg).then((response) => {
      if (response.canceled) return;
      if (response.selection === 0)
        arg
          .runCommandAsync(
            "give @s[hasitem=[{item=copper_ingot,quantity=15..},{item=gunpowder,quantity=6..},{item=iron_nugget,quantity=18..}]] krep:gauge12 18",
          )
          .then(() => {
            (arg.runCommandAsync(
              "clear @s[hasitem=[{item=copper_ingot,quantity=15..},{item=gunpowder,quantity=6..},{item=iron_nugget,quantity=18..}]] copper_ingot 0 15",
            ),
              arg.runCommandAsync(
                "clear @s[hasitem=[{item=copper_ingot,quantity=15..},{item=gunpowder,quantity=6..},{item=iron_nugget,quantity=18..}]] gunpowder 0 6",
              ),
              arg.runCommandAsync(
                "clear @s[hasitem=[{item=copper_ingot,quantity=15..},{item=gunpowder,quantity=6..},{item=iron_nugget,quantity=18..}]] iron_nugget 0 18",
              ));
          });
      else response.selection === 1 && craftammo(arg);
    }));
}
function m43c(arg) {
  let form = new ActionFormData();
  (form.title("Craft 7.62x39mm?"),
    form.body("Are you sure? You need:\n\n- 15x Copper Ingot\n- 3x Gunpowder"),
    form.button("Confirm"),
    form.button("Cancel"),
    form.show(arg).then((response) => {
      if (response.canceled) return;
      if (response.selection === 0)
        arg
          .runCommandAsync(
            "give @s[hasitem=[{item=copper_ingot,quantity=15..},{item=gunpowder,quantity=3..}]] krep:m43 35",
          )
          .then(() => {
            (arg.runCommandAsync(
              "clear @s[hasitem=[{item=copper_ingot,quantity=15..},{item=gunpowder,quantity=3..}]] copper_ingot 0 15",
            ),
              arg.runCommandAsync(
                "clear @s[hasitem=[{item=copper_ingot,quantity=15..},{item=gunpowder,quantity=3..}]] gunpowder 0 3",
              ));
          });
      else response.selection === 1 && craftammo(arg);
    }));
}
function mm5728c(arg) {
  let form = new ActionFormData();
  (form.title("Craft 5.7x28mm?"),
    form.body("Are you sure? You need:\n \n- 15x Copper Ingot\n- 5x Lapis Lazuli\n- 2x Gunpowder"),
    form.button("Confirm"),
    form.button("Cancel"),
    form.show(arg).then((response) => {
      if (response.canceled) return;
      if (response.selection === 0)
        arg
          .runCommandAsync(
            "give @s[hasitem=[{item=copper_ingot,quantity=15..},{item=gunpowder,quantity=2..},{item=lapis_lazuli,quantity=5..}]] krep:mm5728 48",
          )
          .then(() => {
            (arg.runCommandAsync(
              "clear @s[hasitem=[{item=copper_ingot,quantity=15..},{item=gunpowder,quantity=2..},{item=lapis_lazuli,quantity=5..}]] copper_ingot 0 15",
            ),
              arg.runCommandAsync(
                "clear @s[hasitem=[{item=copper_ingot,quantity=15..},{item=gunpowder,quantity=2..},{item=lapis_lazuli,quantity=5..}]] gunpowder 0 2",
              ),
              arg.runCommandAsync(
                "clear @s[hasitem=[{item=copper_ingot,quantity=15..},{item=gunpowder,quantity=2..},{item=lapis_lazuli,quantity=5..}]] lapis_lazuli 0 5",
              ));
          });
      else response.selection === 1 && craftammo(arg);
    }));
}
function mm4630c(arg) {
  let form = new ActionFormData();
  (form.title("Craft 4.6x30mm?"),
    form.body("Are you sure? You need:\n \n- 17x Copper Ingot\n- 6x Lapis Lazuli\n- 2x Gunpowder"),
    form.button("Confirm"),
    form.button("Cancel"),
    form.show(arg).then((response) => {
      if (response.canceled) return;
      if (response.selection === 0)
        arg
          .runCommandAsync(
            "give @s[hasitem=[{item=copper_ingot,quantity=17..},{item=gunpowder,quantity=2..},{item=lapis_lazuli,quantity=6..}]] krep:mm4630 64",
          )
          .then(() => {
            (arg.runCommandAsync(
              "clear @s[hasitem=[{item=copper_ingot,quantity=17..},{item=gunpowder,quantity=2..},{item=lapis_lazuli,quantity=6..}]] copper_ingot 0 17",
            ),
              arg.runCommandAsync(
                "clear @s[hasitem=[{item=copper_ingot,quantity=17..},{item=gunpowder,quantity=2..},{item=lapis_lazuli,quantity=6..}]] gunpowder 0 2",
              ),
              arg.runCommandAsync(
                "clear @s[hasitem=[{item=copper_ingot,quantity=17..},{item=gunpowder,quantity=2..},{item=lapis_lazuli,quantity=6..}]] lapis_lazuli 0 6",
              ));
          });
      else response.selection === 1 && craftammo(arg);
    }));
}
function win308c(arg) {
  let form = new ActionFormData();
  (form.title("Craft .308 Winchester?"),
    form.body("Are you sure? You need:\n \n- 30x Copper Ingot\n- 1x Lapis Lazuli\n- 10x Gunpowder"),
    form.button("Confirm"),
    form.button("Cancel"),
    form.show(arg).then((response) => {
      if (response.canceled) return;
      if (response.selection === 0)
        arg
          .runCommandAsync(
            "give @s[hasitem=[{item=copper_ingot,quantity=30..},{item=gunpowder,quantity=10..},{item=lapis_lazuli,quantity=1..}]] krep:win308 60",
          )
          .then(() => {
            (arg.runCommandAsync(
              "clear @s[hasitem=[{item=copper_ingot,quantity=30..},{item=gunpowder,quantity=10..},{item=lapis_lazuli,quantity=1..}]] copper_ingot 0 30",
            ),
              arg.runCommandAsync(
                "clear @s[hasitem=[{item=copper_ingot,quantity=30..},{item=gunpowder,quantity=10..},{item=lapis_lazuli,quantity=1..}]] gunpowder 0 10",
              ),
              arg.runCommandAsync(
                "clear @s[hasitem=[{item=copper_ingot,quantity=30..},{item=gunpowder,quantity=10..},{item=lapis_lazuli,quantity=1..}]] lapis_lazuli 0 1",
              ));
          });
      else response.selection === 1 && craftammo(arg);
    }));
}
function win308boxc(arg) {
  let form = new ActionFormData();
  (form.title("Craft .308 Winchester Ammo Box?"),
    form.body("Are you sure? You need:\n\n- 1x Chest"),
    form.button("Confirm"),
    form.button("Cancel"),
    form.show(arg).then((response) => {
      const data = {
        BIKzn: "clear @s[hasitem={item=chest,quantity=1..}] chest 0 1",
        tWvTJ: function (arg2, arg3) {
          return arg2 === arg3;
        },
        ZTqhm: "give @s[hasitem=[{item=chest,quantity=1..}]] krep:ammobox",
        lssgc: function (arg2, arg3) {
          return arg2 === arg3;
        },
        Qtvei: function (arg2, arg3) {
          return arg2(arg3);
        },
        JaHRo:
          "clear @s[hasitem=[{item=copper_ingot,quantity=30..},{item=gunpowder,quantity=10..},{item=lapis_lazuli,quantity=1..}]] copper_ingot 0 30",
        hyZDA:
          "clear @s[hasitem=[{item=copper_ingot,quantity=30..},{item=gunpowder,quantity=10..},{item=lapis_lazuli,quantity=1..}]] gunpowder 0 10",
        oftKG: function (arg2, arg3) {
          return arg2(arg3);
        },
      };
      if (response.canceled) return;
      if (response.selection === 0)
        arg
          .runCommandAsync("give @s[hasitem=[{item=chest,quantity=1..}]] krep:ammobox")
          .then(() => {
            arg.runCommandAsync(data.BIKzn);
          });
      else response.selection === 1 && craftammo(arg);
    }));
}
function rpgrocketec(arg) {
  let form = new ActionFormData();
  (form.title("Craft RPG Rocket?"),
    form.body("Are you sure? You need:\n \n- 30x Copper Ingot\n- 3x Iron Ingot\n- 12x Gunpowder"),
    form.button("Confirm"),
    form.button("Cancel"),
    form.show(arg).then((response) => {
      const data = {
        oRZKM: function (arg2, arg3) {
          return arg2 !== arg3;
        },
        jBTUF: "jNUpz",
        HBKBg: "NKKnf",
        EvYav:
          "clear @s[hasitem=[{item=copper_ingot,quantity=30..},{item=gunpowder,quantity=12..},{item=iron_ingot,quantity=3..}]] copper_ingot 0 30",
        xAvQO:
          "clear @s[hasitem=[{item=copper_ingot,quantity=30..},{item=gunpowder,quantity=12..},{item=iron_ingot,quantity=3..}]] gunpowder 0 12",
        ImRAf:
          "clear @s[hasitem=[{item=copper_ingot,quantity=30..},{item=gunpowder,quantity=12..},{item=iron_ingot,quantity=3..}]] iron_ingot 0 3",
      };
      if (response.canceled) return;
      if (response.selection === 0)
        arg
          .runCommandAsync(
            "give @s[hasitem=[{item=copper_ingot,quantity=30..},{item=gunpowder,quantity=12..},{item=iron_ingot,quantity=3..}]] krep:rpgrocket 3",
          )
          .then(() => {
            data.oRZKM(data.jBTUF, data.HBKBg)
              ? (arg.runCommandAsync(data.EvYav),
                arg.runCommandAsync(data.xAvQO),
                arg.runCommandAsync(data.ImRAf))
              : value(value);
          });
      else response.selection === 1 && craftammo(arg);
    }));
}
function lapua308c(arg) {
  let form = new ActionFormData();
  (form.title("Craft .338 Lapua?"),
    form.body("Are you sure? You need:\n\n- 30x Copper Ingot\n- 10x Gunpowder\n- 1x Lapis Lazuli"),
    form.button("Confirm"),
    form.button("Cancel"),
    form.show(arg).then((response) => {
      const data = {
        xTKZo: function (arg2, arg3) {
          return arg2(arg3);
        },
        dDZBl: "jKnRH",
        UzCPo:
          "clear @s[hasitem=[{item=copper_ingot,quantity=30..},{item=gunpowder,quantity=10..},{item=lapis_lazuli,quantity=1..}]] copper_ingot 0 30",
        DTjQk:
          "clear @s[hasitem=[{item=copper_ingot,quantity=30..},{item=gunpowder,quantity=10..},{item=lapis_lazuli,quantity=1..}]] gunpowder 0 10",
        mXiZU:
          "clear @s[hasitem=[{item=copper_ingot,quantity=30..},{item=gunpowder,quantity=10..},{item=lapis_lazuli,quantity=1..}]] lapis_lazuli 0 1",
        saYfW:
          "clear @s[hasitem=[{item=copper_ingot,quantity=15..},{item=gunpowder,quantity=6..},{item=iron_nugget,quantity=18..}]] copper_ingot 0 15",
        NIpmL:
          "clear @s[hasitem=[{item=copper_ingot,quantity=15..},{item=gunpowder,quantity=6..},{item=iron_nugget,quantity=18..}]] gunpowder 0 6",
        iHDhg:
          "give @s[hasitem=[{item=copper_ingot,quantity=15..},{item=gunpowder,quantity=6..},{item=iron_nugget,quantity=18..}]] krep:gauge12 18",
      };
      if (response.canceled) return;
      if (response.selection === 0)
        arg
          .runCommandAsync(
            "give @s[hasitem=[{item=copper_ingot,quantity=30..},{item=gunpowder,quantity=10..},{item=lapis_lazuli,quantity=1..}]] krep:lapua338 60",
          )
          .then(() => {
            data.dDZBl === "vmkhG"
              ? data.xTKZo(value, value)
              : (arg.runCommandAsync(data.UzCPo),
                arg.runCommandAsync(data.DTjQk),
                arg.runCommandAsync(data.mXiZU));
          });
      else response.selection === 1 && craftammo(arg);
    }));
}
system.runInterval(() => {
  for (let player of world.getPlayers()) {
    (player.hasTag("laknatullah") &&
      system.run(() => {
        (craftammo(player), player.runCommandAsync('tag @s remove "laknatullah"'));
      }),
      player.hasTag("openui2") &&
        system.run(() => {
          (wip(player), player.runCommandAsync('tag @s remove "openui2"'));
        }));
  }
}, 20);
