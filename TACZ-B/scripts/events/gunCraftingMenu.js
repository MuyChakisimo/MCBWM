import { world, system } from "@minecraft/server";
import { ActionFormData } from "@minecraft/server-ui";
function craft(arg) {
  let form = new ActionFormData();
  (form.title("Gun Crafting"),
    form.body("Select a gun to craft:"),
    form.button("Desert Eagle", "textures/items/deagle"),
    form.button("MP5", "textures/items/mp5"),
    form.button("Vector 45", "textures/items/vector"),
    form.button("P90", "textures/items/p90"),
    form.button("M16A1", "textures/items/m16a1"),
    form.button("M16A4", "textures/items/m16"),
    form.button("HK416", "textures/items/hk416"),
    form.button("SCAR-H", "textures/items/scarh"),
    form.button("G3", "textures/items/g3"),
    form.button("AA-12", "textures/items/aa12"),
    form.button("RPG-7", "textures/items/rpg"),
    form.button("M870", "textures/items/m870"),
    form.button("AWM", "textures/items/awp"),
    form.button("Glock-17", "textures/items/g17"),
    form.button("M1911", "textures/items/m1911"),
    form.button("AKM", "textures/items/akm"),
    form.button("M4A1", "textures/items/m4a1"),
    form.button("SCAR-L", "textures/items/scarl"),
    form.button("G36K", "textures/items/g36"),
    form.button("MP7", "textures/items/mp7"),
    form.button("M134 Minigun", "textures/items/minigun"),
    form.button("Uzi", "textures/items/uzi"),
    form.button("Glock 18", "textures/items/g18"),
    form.button("Double Barrel", "textures/items/db"),
    form.button("Golden Desert Eagle", "textures/items/deagleg"),
    form.button("Saiga 12", "textures/items/saiga12"),
    form.button("FAL", "textures/items/fal"),
    form.button("QBZ-95", "textures/items/qbz95"),
    form.button("UMP-45", "textures/items/ump45"),
    form.button("B93R", "textures/items/b93"),
    form.button("SKS", "textures/items/sks"),
    form.button("MK14", "textures/items/mk14"),
    form.button("QBZ-191", "textures/items/qbz191"),
    form.button("Type-81", "textures/items/type81"),
    form.button("Evolys", "textures/items/evolys"),
    form.button("M249", "textures/items/m249"),
    form.button("Timeless 50", "textures/items/t50"),
    form.button("Colt Python", "textures/items/cp"),
    form.button("M1014", "textures/items/m1014"),
    form.button("P320", "textures/items/p320"),
    form.show(arg).then((response) => {
      if (response.canceled) return;
      switch (response.selection) {
        case 0:
          deaglec(arg);
          break;
        case 1:
          mp5c(arg);
          break;
        case 2:
          vectorc(arg);
          break;
        case 3:
          p90c(arg);
          break;
        case 4:
          m16a1c(arg);
          break;
        case 5:
          m16c(arg);
          break;
        case 6:
          hk416c(arg);
          break;
        case 7:
          scarhc(arg);
          break;
        case 8:
          g3c(arg);
          break;
        case 9:
          aa12c(arg);
          break;
        case 10:
          rpgc(arg);
          break;
        case 11:
          m870c(arg);
          break;
        case 12:
          awpc(arg);
          break;
        case 13:
          g17c(arg);
          break;
        case 14:
          m1911c(arg);
          break;
        case 15:
          akmc(arg);
          break;
        case 16:
          m4a1c(arg);
          break;
        case 17:
          scarlc(arg);
          break;
        case 18:
          g36c(arg);
          break;
        case 19:
          mp7c(arg);
          break;
        case 20:
          minigunc(arg);
          break;
        case 21:
          uzic(arg);
          break;
        case 22:
          g18c(arg);
          break;
        case 23:
          dbc(arg);
          break;
        case 24:
          deaglegc(arg);
          break;
        case 25:
          saiga12c(arg);
          break;
        case 26:
          falc(arg);
          break;
        case 27:
          qbz95c(arg);
          break;
        case 28:
          umpc(arg);
          break;
        case 29:
          b93c(arg);
          break;
        case 30:
          sksc(arg);
          break;
        case 31:
          mk14c(arg);
          break;
        case 32:
          qbz191c(arg);
          break;
        case 33:
          type81c(arg);
          break;
        case 34:
          evolysc(arg);
          break;
        case 35:
          m249c(arg);
          break;
        case 36:
          t50c(arg);
          break;
        case 37:
          cpc(arg);
          break;
        case 38:
          m1014c(arg);
          break;
        case 39:
          p320c(arg);
          break;
        default:
          break;
      }
    }));
}
function scarlc(arg) {
  let form = new ActionFormData();
  (form.title("SCAR-L Crafting"),
    form.body("Are you sure? You need:\n\n- 6x Gold Ingot\n- 48x Iron Ingot\n- 3x Quartz"),
    form.button("Confirm"),
    form.button("Cancel"),
    form.show(arg).then((response) => {
      const data = {
        sWsHK:
          "clear @s[hasitem=[{item=lapis_lazuli,quantity=6..},{item=iron_ingot,quantity=32..},{item=log,quantity=6..}]] lapis_lazuli 0 6",
        WnSVx:
          "clear @s[hasitem=[{item=lapis_lazuli,quantity=6..},{item=iron_ingot,quantity=32..},{item=log,quantity=6..}]] iron_ingot 0 32",
        SgEEG:
          "clear @s[hasitem=[{item=lapis_lazuli,quantity=6..},{item=iron_ingot,quantity=32..},{item=log,quantity=6..}]] log 0 6",
        qGbax:
          "clear @s[hasitem=[{item=iron_ingot,quantity=16..},{item=blaze_rod,quantity=1..},{item=gold_ingot,quantity=32..},{item=diamond,quantity=1..}]] iron_ingot 0 16",
        WMMgb:
          "clear @s[hasitem=[{item=iron_ingot,quantity=16..},{item=blaze_rod,quantity=1..},{item=gold_ingot,quantity=32..},{item=diamond,quantity=1..}]] blaze_rod 0 1",
        fyWBR:
          "clear @s[hasitem=[{item=iron_ingot,quantity=16..},{item=blaze_rod,quantity=1..},{item=gold_ingot,quantity=32..},{item=diamond,quantity=1..}]] gold_ingot 0 32",
        mKvrv:
          "clear @s[hasitem=[{item=iron_ingot,quantity=16..},{item=blaze_rod,quantity=1..},{item=gold_ingot,quantity=32..},{item=diamond,quantity=1..}]] diamond 0 1",
        pkKSt:
          "clear @s[hasitem=[{item=diamond,quantity=2..},{item=gold_ingot,quantity=6..},{item=iron_ingot,quantity=42..},{item=blaze_rod,quantity=1..}]] diamond 0 2",
        DMFQq:
          "clear @s[hasitem=[{item=diamond,quantity=2..},{item=gold_ingot,quantity=6..},{item=iron_ingot,quantity=42..},{item=blaze_rod,quantity=1..}]] gold_ingot 0 6",
        GrgKv:
          "clear @s[hasitem=[{item=diamond,quantity=2..},{item=gold_ingot,quantity=6..},{item=iron_ingot,quantity=42..},{item=blaze_rod,quantity=1..}]] blaze_rod 0 1",
        HDMdW: function (arg2, arg3) {
          return arg2 !== arg3;
        },
        CyBNa: "UHrgI",
        CLUHs: "bTnEa",
        hZsrp:
          "clear @s[hasitem=[{item=gold_ingot,quantity=6..},{item=iron_ingot,quantity=48..},{item=quartz,quantity=3..}]] gold_ingot 0 6",
        aBRqH:
          "clear @s[hasitem=[{item=gold_ingot,quantity=6..},{item=iron_ingot,quantity=48..},{item=quartz,quantity=3..}]] quartz 0 3",
      };
      if (response.canceled) return;
      if (response.selection === 0)
        arg
          .runCommandAsync(
            "give @s[hasitem=[{item=gold_ingot,quantity=6..},{item=iron_ingot,quantity=48..},{item=quartz,quantity=3..}]] krep:scarl",
          )
          .then(() => {
            const data2 = {
              kXqSm: data.pkKSt,
              AUuCp: data.DMFQq,
              hNuSQ: data.GrgKv,
            };
            data.HDMdW(data.CyBNa, data.CLUHs)
              ? (arg.runCommandAsync(data.hZsrp),
                arg.runCommandAsync(
                  "clear @s[hasitem=[{item=gold_ingot,quantity=6..},{item=iron_ingot,quantity=48..},{item=quartz,quantity=3..}]] iron_ingot 0 48",
                ),
                arg.runCommandAsync(data.aBRqH))
              : (value.runCommandAsync(data2.kXqSm),
                value.runCommandAsync(data2.AUuCp),
                value.runCommandAsync(
                  "clear @s[hasitem=[{item=diamond,quantity=2..},{item=gold_ingot,quantity=6..},{item=iron_ingot,quantity=42..},{item=blaze_rod,quantity=1..}]] iron_ingot 0 42",
                ),
                value.runCommandAsync(data2.hNuSQ));
          });
      else response.selection === 1 && craft(arg);
    }));
}
function awpc(arg) {
  let form = new ActionFormData();
  (form.title("AWM Crafting"),
    form.body(
      "Are you sure? You need:\n\n- 10x Diamond\n- 50x Gold Ingot\n- 250x Iron Ingot\n- 5x Blaze Rod",
    ),
    form.button("Confirm"),
    form.button("Cancel"),
    form.show(arg).then((response) => {
      const data = {
        Foqpm:
          "clear @s[hasitem=[{item=iron_ingot,quantity=8..},{item=log,quantity=8..}]] iron_ingot 0 8",
        AgbAc: "clear @s[hasitem=[{item=iron_ingot,quantity=8..},{item=log,quantity=8..}]] log 0 8",
        ksbTh:
          "clear @s[hasitem=[{item=gold_ingot,quantity=6..},{item=iron_ingot,quantity=48..},{item=quartz,quantity=3..}]] iron_ingot 0 48",
        PQcge: function (arg2, arg3) {
          return arg2 === arg3;
        },
        WIzNl:
          "give @s[hasitem=[{item=gold_ingot,quantity=6..},{item=iron_ingot,quantity=48..},{item=quartz,quantity=3..}]] krep:scarl",
        mxLRG: function (arg2, arg3) {
          return arg2 === arg3;
        },
        ImifK: function (arg2, arg3) {
          return arg2(arg3);
        },
        uAnqz: "CPILX",
        JpPcx: "ZaQHN",
        ByPnj:
          "clear @s[hasitem=[{item=diamond,quantity=10..},{item=gold_ingot,quantity=50..},{item=iron_ingot,quantity=250..},{item=blaze_rod,quantity=5..}]] diamond 0 10",
        mFzar:
          "clear @s[hasitem=[{item=diamond,quantity=10..},{item=gold_ingot,quantity=50..},{item=iron_ingot,quantity=250..},{item=blaze_rod,quantity=5..}]] gold_ingot 0 50",
        FNvey:
          "clear @s[hasitem=[{item=diamond,quantity=10..},{item=gold_ingot,quantity=50..},{item=iron_ingot,quantity=250..},{item=blaze_rod,quantity=5..}]] iron_ingot 0 250",
        KHoIu:
          "clear @s[hasitem=[{item=diamond,quantity=10..},{item=gold_ingot,quantity=50..},{item=iron_ingot,quantity=250..},{item=blaze_rod,quantity=5..}]] blaze_rod 0 5",
      };
      if (response.canceled) return;
      if (response.selection === 0)
        arg
          .runCommandAsync(
            "give @s[hasitem=[{item=diamond,quantity=10..},{item=gold_ingot,quantity=50..},{item=iron_ingot,quantity=250..},{item=blaze_rod,quantity=5..}]] krep:awp",
          )
          .then(() => {
            if (data.PQcge(data.uAnqz, data.JpPcx)) {
              const data2 = {
                XjbOQ:
                  "clear @s[hasitem=[{item=gold_ingot,quantity=6..},{item=iron_ingot,quantity=48..},{item=quartz,quantity=3..}]] gold_ingot 0 6",
                XGDpo: data.ksbTh,
                nXlRI:
                  "clear @s[hasitem=[{item=gold_ingot,quantity=6..},{item=iron_ingot,quantity=48..},{item=quartz,quantity=3..}]] quartz 0 3",
              };
              if (value.canceled) return;
              if (data.PQcge(value.selection, 0))
                value.runCommandAsync(data.WIzNl).then(() => {
                  (value.runCommandAsync(data2.XjbOQ),
                    value.runCommandAsync(data2.XGDpo),
                    value.runCommandAsync(data2.nXlRI));
                });
              else data.mxLRG(value.selection, 1) && data.ImifK(value, value);
            } else
              (arg.runCommandAsync(data.ByPnj),
                arg.runCommandAsync(data.mFzar),
                arg.runCommandAsync(data.FNvey),
                arg.runCommandAsync(data.KHoIu));
          });
      else response.selection === 1 && craft(arg);
    }));
}
function type81c(arg) {
  let form = new ActionFormData();
  (form.title("Type 18 Crafting"),
    form.body("Are you sure? You need:\n\n- 28x Iron Ingot\n- 10x Log"),
    form.button("Confirm"),
    form.button("Cancel"),
    form.show(arg).then((response) => {
      const data = {
        wvlXh: function (arg2, arg3) {
          return arg2(arg3);
        },
        bysRf: function (arg2, arg3) {
          return arg2 === arg3;
        },
        ULKOV: "yCxuw",
        brSNm:
          "clear @s[hasitem=[{item=iron_ingot,quantity=28..},{item=log,quantity=10..}]] iron_ingot 0 28",
        AvbUz:
          "clear @s[hasitem=[{item=iron_ingot,quantity=28..},{item=log,quantity=10..}]] log 0 10",
        jwpur:
          "clear @s[hasitem=[{item=iron_ingot,quantity=62..},{item=gold_ingot,quantity=5..},{item=quartz,quantity=3..}]] iron_ingot 0 62",
        ODKlq:
          "clear @s[hasitem=[{item=iron_ingot,quantity=62..},{item=gold_ingot,quantity=5..},{item=quartz,quantity=3..}]] gold_ingot 0 5",
        lBReJ:
          "clear @s[hasitem=[{item=iron_ingot,quantity=62..},{item=gold_ingot,quantity=5..},{item=quartz,quantity=3..}]] quartz 0 3",
        IxYAm:
          "give @s[hasitem=[{item=iron_ingot,quantity=62..},{item=gold_ingot,quantity=5..},{item=quartz,quantity=3..}]] krep:ump",
      };
      if (response.canceled) return;
      if (response.selection === 0)
        arg
          .runCommandAsync(
            "give @s[hasitem=[{item=iron_ingot,quantity=28..},{item=log,quantity=10..}]] krep:type81",
          )
          .then(() => {
            if (data.bysRf("nmyvj", data.ULKOV)) {
              const data2 = {
                mvcCc: function (arg2, arg3) {
                  return data.wvlXh(arg2, arg3);
                },
              };
              value.run(() => {
                (data2.mvcCc(value, value), value.runCommandAsync('tag @s remove "jawir"'));
              });
            } else (arg.runCommandAsync(data.brSNm), arg.runCommandAsync(data.AvbUz));
          });
      else response.selection === 1 && craft(arg);
    }));
}
function evolysc(arg) {
  let form = new ActionFormData();
  (form.title("Evolys Crafting"),
    form.body(
      "Are you sure? You need:\n\n- 128x Iron Ingot\n- 30x Gold Ingot\n- 6x Diamond\n- 5x Blaze Rod",
    ),
    form.button("Confirm"),
    form.button("Cancel"),
    form.show(arg).then((response) => {
      if (response.canceled) return;
      if (response.selection === 0)
        arg
          .runCommandAsync(
            "give @s[hasitem=[{item=iron_ingot,quantity=128..},{item=gold_ingot,quantity=30..},{item=diamond,quantity=6..},{item=blaze_rod,quantity=5..}]] krep:evolys",
          )
          .then(() => {
            (arg.runCommandAsync(
              "clear @s[hasitem=[{item=iron_ingot,quantity=128..},{item=gold_ingot,quantity=30..},{item=diamond,quantity=6..},{item=blaze_rod,quantity=5..}]] iron_ingot 0 128",
            ),
              arg.runCommandAsync(
                "clear @s[hasitem=[{item=iron_ingot,quantity=128..},{item=gold_ingot,quantity=30..},{item=diamond,quantity=6..},{item=blaze_rod,quantity=5..}]] gold_ingot 0 30",
              ),
              arg.runCommandAsync(
                "clear @s[hasitem=[{item=iron_ingot,quantity=128..},{item=gold_ingot,quantity=30..},{item=diamond,quantity=6..},{item=blaze_rod,quantity=5..}]] diamond 0 6",
              ),
              arg.runCommandAsync(
                "clear @s[hasitem=[{item=iron_ingot,quantity=128..},{item=gold_ingot,quantity=30..},{item=diamond,quantity=6..},{item=blaze_rod,quantity=5..}]] blaze_rod 0 5",
              ));
          });
      else {
        if (response.selection === 1) {
          craft(arg);
        }
      }
    }));
}
function m249c(arg) {
  let form = new ActionFormData();
  (form.title("M249 Crafting"),
    form.body(
      "Are you sure? You need:\n\n- 110x Iron Ingot\n- 16x Gold Ingot\n- 4x Diamond\n- 2x Blaze Rod",
    ),
    form.button("Confirm"),
    form.button("Cancel"),
    form.show(arg).then((response) => {
      const data = {
        MOiAn:
          "clear @s[hasitem=[{item=iron_ingot,quantity=110..},{item=gold_ingot,quantity=16..},{item=diamond,quantity=4..},{item=blaze_rod,quantity=2..}]] gold_ingot 0 16",
        KESzK:
          "clear @s[hasitem=[{item=iron_ingot,quantity=110..},{item=gold_ingot,quantity=16..},{item=diamond,quantity=4..},{item=blaze_rod,quantity=2..}]] diamond 0 4",
        SRvZv:
          "clear @s[hasitem=[{item=iron_ingot,quantity=110..},{item=gold_ingot,quantity=16..},{item=diamond,quantity=4..},{item=blaze_rod,quantity=2..}]] blaze_rod 0 2",
        cyzEm:
          "clear @s[hasitem=[{item=iron_ingot,quantity=16..},{item=blaze_rod,quantity=1..},{item=gold_ingot,quantity=32..},{item=diamond,quantity=1..}]] iron_ingot 0 16",
        NAmzC:
          "clear @s[hasitem=[{item=iron_ingot,quantity=16..},{item=blaze_rod,quantity=1..},{item=gold_ingot,quantity=32..},{item=diamond,quantity=1..}]] blaze_rod 0 1",
        ABkLU:
          "clear @s[hasitem=[{item=iron_ingot,quantity=16..},{item=blaze_rod,quantity=1..},{item=gold_ingot,quantity=32..},{item=diamond,quantity=1..}]] diamond 0 1",
        BNuEB:
          "clear @s[hasitem=[{item=lapis_lazuli,quantity=6..},{item=iron_ingot,quantity=38..},{item=log,quantity=8..}]] lapis_lazuli 0 6",
        aGPso:
          "clear @s[hasitem=[{item=lapis_lazuli,quantity=6..},{item=iron_ingot,quantity=38..},{item=log,quantity=8..}]] log 0 8",
        ZQYpG: function (arg2, arg3) {
          return arg2 === arg3;
        },
        LBujd: function (arg2, arg3) {
          return arg2 === arg3;
        },
        cExPd: function (arg2, arg3) {
          return arg2(arg3);
        },
      };
      if (response.canceled) return;
      if (response.selection === 0) {
        arg
          .runCommandAsync(
            "give @s[hasitem=[{item=iron_ingot,quantity=110..},{item=gold_ingot,quantity=16..},{item=diamond,quantity=4..},{item=blaze_rod,quantity=2..}]] krep:m249",
          )
          .then(() => {
            (arg.runCommandAsync(
              "clear @s[hasitem=[{item=iron_ingot,quantity=110..},{item=gold_ingot,quantity=16..},{item=diamond,quantity=4..},{item=blaze_rod,quantity=2..}]] iron_ingot 0 110",
            ),
              arg.runCommandAsync(data.MOiAn),
              arg.runCommandAsync(data.KESzK),
              arg.runCommandAsync(data.SRvZv));
          });
      } else {
        if (response.selection === 1) {
          craft(arg);
        }
      }
    }));
}
function mk14c(arg) {
  let form = new ActionFormData();
  (form.title("MK14 Crafting"),
    form.body(
      "Are you sure? You need:\n\n- 62x Iron Ingot\n- 20x Gold Ingot\n- 4x Diamond\n- 2x Blaze Rod",
    ),
    form.button("Confirm"),
    form.button("Cancel"),
    form.show(arg).then((response) => {
      if (response.canceled) return;
      if (response.selection === 0)
        arg
          .runCommandAsync(
            "give @s[hasitem=[{item=iron_ingot,quantity=62..},{item=gold_ingot,quantity=20..},{item=diamond,quantity=4..},{item=blaze_rod,quantity=2..}]] krep:mk14",
          )
          .then(() => {
            (arg.runCommandAsync(
              "clear @s[hasitem=[{item=iron_ingot,quantity=62..},{item=gold_ingot,quantity=20..},{item=diamond,quantity=4..},{item=blaze_rod,quantity=2..}]] iron_ingot 0 62",
            ),
              arg.runCommandAsync(
                "clear @s[hasitem=[{item=iron_ingot,quantity=62..},{item=gold_ingot,quantity=20..},{item=diamond,quantity=4..},{item=blaze_rod,quantity=2..}]] gold_ingot 0 20",
              ),
              arg.runCommandAsync(
                "clear @s[hasitem=[{item=iron_ingot,quantity=62..},{item=gold_ingot,quantity=20..},{item=diamond,quantity=4..},{item=blaze_rod,quantity=2..}]] diamond 0 4",
              ),
              arg.runCommandAsync(
                "clear @s[hasitem=[{item=iron_ingot,quantity=62..},{item=gold_ingot,quantity=20..},{item=diamond,quantity=4..},{item=blaze_rod,quantity=2..}]] blaze_rod 0 2",
              ));
          });
      else response.selection === 1 && craft(arg);
    }));
}
function p320c(arg) {
  let form = new ActionFormData();
  (form.title("P320 Crafting"),
    form.body("Are you sure? You need:\n\n- 28x Iron Ingot\n- 4x Gold Ingot\n- 2x Lapis Lazuli"),
    form.button("Confirm"),
    form.button("Cancel"),
    form.show(arg).then((response) => {
      if (response.canceled) return;
      if (response.selection === 0)
        arg
          .runCommandAsync(
            "give @s[hasitem=[{item=iron_ingot,quantity=28..},{item=gold_ingot,quantity=4..},{item=lapis_lazuli,quantity=2..}]] krep:p320",
          )
          .then(() => {
            (arg.runCommandAsync(
              "clear @s[hasitem=[{item=iron_ingot,quantity=28..},{item=gold_ingot,quantity=4..},{item=lapis_lazuli,quantity=2..}]] iron_ingot 0 28",
            ),
              arg.runCommandAsync(
                "clear @s[hasitem=[{item=iron_ingot,quantity=28..},{item=gold_ingot,quantity=4..},{item=lapis_lazuli,quantity=2..}]] gold_ingot 0 4",
              ),
              arg.runCommandAsync(
                "clear @s[hasitem=[{item=iron_ingot,quantity=28..},{item=gold_ingot,quantity=4..},{item=lapis_lazuli,quantity=2..}]] lapis_lazuli 0 2",
              ));
          });
      else response.selection === 1 && craft(arg);
    }));
}
function cpc(arg) {
  let form = new ActionFormData();
  (form.title("Colt Python Crafting"),
    form.body("Are you sure? You need:\n\n- 28x Iron Ingot\n- 4x Gold Ingot\n- 2x Lapis Lazuli"),
    form.button("Confirm"),
    form.button("Cancel"),
    form.show(arg).then((response) => {
      const data = {
        SwzuS:
          "clear @s[hasitem=[{item=iron_ingot,quantity=320..},{item=blaze_rod,quantity=10..},{item=gold_ingot,quantity=80..},{item=netherite_ingot,quantity=10..},{item=diamond,quantity=40..}]] iron_ingot 0 320",
        bxxNt:
          "clear @s[hasitem=[{item=iron_ingot,quantity=320..},{item=blaze_rod,quantity=10..},{item=gold_ingot,quantity=80..},{item=netherite_ingot,quantity=10..},{item=diamond,quantity=40..}]] blaze_rod 0 10",
        CImLQ:
          "clear @s[hasitem=[{item=iron_ingot,quantity=320..},{item=blaze_rod,quantity=10..},{item=gold_ingot,quantity=80..},{item=netherite_ingot,quantity=10..},{item=diamond,quantity=40..}]] gold_ingot 0 80",
        kFGLz:
          "clear @s[hasitem=[{item=iron_ingot,quantity=320..},{item=blaze_rod,quantity=10..},{item=gold_ingot,quantity=80..},{item=netherite_ingot,quantity=10..},{item=diamond,quantity=40..}]] netherite_ingot 0 10",
        wpJEZ:
          "clear @s[hasitem=[{item=iron_ingot,quantity=320..},{item=blaze_rod,quantity=10..},{item=gold_ingot,quantity=80..},{item=netherite_ingot,quantity=10..},{item=diamond,quantity=40..}]] diamond 0 40",
        EgZlr: function (arg2, arg3) {
          return arg2 !== arg3;
        },
        eraGh: "asSDc",
        xQjYN:
          "clear @s[hasitem=[{item=iron_ingot,quantity=28..},{item=gold_ingot,quantity=4..},{item=lapis_lazuli,quantity=2..}]] iron_ingot 0 28",
        hMaAh:
          "clear @s[hasitem=[{item=iron_ingot,quantity=28..},{item=gold_ingot,quantity=4..},{item=lapis_lazuli,quantity=2..}]] gold_ingot 0 4",
        yMIaF:
          "clear @s[hasitem=[{item=iron_ingot,quantity=28..},{item=gold_ingot,quantity=4..},{item=lapis_lazuli,quantity=2..}]] lapis_lazuli 0 2",
        vGjai: "give @s[hasitem=[{item=iron_ingot,quantity=32..}]] krep:uzi",
      };
      if (response.canceled) return;
      if (response.selection === 0)
        arg
          .runCommandAsync(
            "give @s[hasitem=[{item=iron_ingot,quantity=28..},{item=gold_ingot,quantity=4..},{item=lapis_lazuli,quantity=2..}]] krep:cp",
          )
          .then(() => {
            const data2 = {
              xhjsU: data.SwzuS,
              QDTCs: data.bxxNt,
              cbgYh: data.CImLQ,
              ycQme: data.kFGLz,
              xfCFm: data.wpJEZ,
            };
            data.EgZlr(data.eraGh, data.eraGh)
              ? (value.runCommandAsync(data2.xhjsU),
                value.runCommandAsync(data2.QDTCs),
                value.runCommandAsync(data2.cbgYh),
                value.runCommandAsync(data2.ycQme),
                value.runCommandAsync(data2.xfCFm))
              : (arg.runCommandAsync(data.xQjYN),
                arg.runCommandAsync(data.hMaAh),
                arg.runCommandAsync(data.yMIaF));
          });
      else {
        if (response.selection === 1) {
          craft(arg);
        }
      }
    }));
}
function m1014c(arg) {
  let form = new ActionFormData();
  (form.title("M1014 Crafting"),
    form.body(
      "Are you sure? You need:\n\n- 62x Iron Ingot\n- 12x Gold Ingot\n- 1x Diamond\n- 2x Lapis Lazuli",
    ),
    form.button("Confirm"),
    form.button("Cancel"),
    form.show(arg).then((response) => {
      if (response.canceled) return;
      if (response.selection === 0)
        arg
          .runCommandAsync(
            "give @s[hasitem=[{item=iron_ingot,quantity=62..},{item=gold_ingot,quantity=12..},{item=diamond,quantity=1..},{item=lapis_lazuli,quantity=2..}]] krep:m1014",
          )
          .then(() => {
            (arg.runCommandAsync(
              "clear @s[hasitem=[{item=iron_ingot,quantity=62..},{item=gold_ingot,quantity=12..},{item=diamond,quantity=1..},{item=lapis_lazuli,quantity=2..}]] iron_ingot 0 62",
            ),
              arg.runCommandAsync(
                "clear @s[hasitem=[{item=iron_ingot,quantity=62..},{item=gold_ingot,quantity=12..},{item=diamond,quantity=1..},{item=lapis_lazuli,quantity=2..}]] gold_ingot 0 12",
              ),
              arg.runCommandAsync(
                "clear @s[hasitem=[{item=iron_ingot,quantity=62..},{item=gold_ingot,quantity=12..},{item=diamond,quantity=1..},{item=lapis_lazuli,quantity=2..}]] diamond 0 1",
              ),
              arg.runCommandAsync(
                "clear @s[hasitem=[{item=iron_ingot,quantity=62..},{item=gold_ingot,quantity=12..},{item=diamond,quantity=1..},{item=lapis_lazuli,quantity=2..}]] lapis_lazuli 0 2",
              ));
          });
      else response.selection === 1 && craft(arg);
    }));
}
function qbz191c(arg) {
  let form = new ActionFormData();
  (form.title("QBZ-191 Crafting"),
    form.body(
      "Are you sure? You need:\n\n- 64x Iron Ingot\n- 16x Lapis Lazuli\n- 8x Gold Ingot\n- 8x Quartz",
    ),
    form.button("Confirm"),
    form.button("Cancel"),
    form.show(arg).then((response) => {
      if (response.canceled) return;
      if (response.selection === 0)
        arg
          .runCommandAsync(
            "give @s[hasitem=[{item=iron_ingot,quantity=64..},{item=lapis_lazuli,quantity=16..},{item=gold_ingot,quantity=8..},{item=quartz,quantity=8..}]] krep:qbz191",
          )
          .then(() => {
            (arg.runCommandAsync(
              "clear @s[hasitem=[{item=iron_ingot,quantity=64..},{item=lapis_lazuli,quantity=16..},{item=gold_ingot,quantity=8..},{item=quartz,quantity=8..}]] iron_ingot 0 64",
            ),
              arg.runCommandAsync(
                "clear @s[hasitem=[{item=iron_ingot,quantity=64..},{item=lapis_lazuli,quantity=16..},{item=gold_ingot,quantity=8..},{item=quartz,quantity=8..}]] lapis_lazuli 0 16",
              ),
              arg.runCommandAsync(
                "clear @s[hasitem=[{item=iron_ingot,quantity=64..},{item=lapis_lazuli,quantity=16..},{item=gold_ingot,quantity=8..},{item=quartz,quantity=8..}]] gold_ingot 0 8",
              ),
              arg.runCommandAsync(
                "clear @s[hasitem=[{item=iron_ingot,quantity=64..},{item=lapis_lazuli,quantity=16..},{item=gold_ingot,quantity=8..},{item=quartz,quantity=8..}]] quartz 0 8",
              ));
          });
      else response.selection === 1 && craft(arg);
    }));
}
function t50c(arg) {
  let form = new ActionFormData();
  (form.title("Timeless 50 Crafting"),
    form.body("Are you sure? You need:\n\n- 48x Iron Ingot\n- 6x Gold Ingot\n- 1x Diamond"),
    form.button("Confirm"),
    form.button("Cancel"),
    form.show(arg).then((response) => {
      if (response.canceled) return;
      if (response.selection === 0)
        arg
          .runCommandAsync(
            "give @s[hasitem=[{item=iron_ingot,quantity=48..},{item=gold_ingot,quantity=6..},{item=diamond,quantity=1..}]] krep:t50",
          )
          .then(() => {
            (arg.runCommandAsync(
              "clear @s[hasitem=[{item=iron_ingot,quantity=48..},{item=gold_ingot,quantity=6..},{item=diamond,quantity=1..}]] iron_ingot 0 48",
            ),
              arg.runCommandAsync(
                "clear @s[hasitem=[{item=iron_ingot,quantity=48..},{item=gold_ingot,quantity=6..},{item=diamond,quantity=1..}]] gold_ingot 0 6",
              ),
              arg.runCommandAsync(
                "clear @s[hasitem=[{item=iron_ingot,quantity=48..},{item=gold_ingot,quantity=6..},{item=diamond,quantity=1..}]] diamond 0 1",
              ));
          });
      else response.selection === 1 && craft(arg);
    }));
}
function dbc(arg) {
  let form = new ActionFormData();
  (form.title("Double Barrel Crafting"),
    form.body("Are you sure? You need:\n\n- 8x Iron Ingot\n- 8x Log"),
    form.button("Confirm"),
    form.button("Cancel"),
    form.show(arg).then((response) => {
      if (response.canceled) return;
      if (response.selection === 0)
        arg
          .runCommandAsync(
            "give @s[hasitem=[{item=iron_ingot,quantity=8..},{item=log,quantity=8..}]] krep:db",
          )
          .then(() => {
            (arg.runCommandAsync(
              "clear @s[hasitem=[{item=iron_ingot,quantity=8..},{item=log,quantity=8..}]] iron_ingot 0 8",
            ),
              arg.runCommandAsync(
                "clear @s[hasitem=[{item=iron_ingot,quantity=8..},{item=log,quantity=8..}]] log 0 8",
              ));
          });
      else response.selection === 1 && craft(arg);
    }));
}
function deaglegc(arg) {
  let form = new ActionFormData();
  (form.title("Golden Desert Eagle Crafting"),
    form.body(
      "Are you sure? You need:\n\n- 16x Iron Ingot\n- 1x Blaze Rod\n- 32x Gold Ingot\n- 1x Diamond",
    ),
    form.button("Confirm"),
    form.button("Cancel"),
    form.show(arg).then((response) => {
      const data = {
        VueJh: function (arg2, arg3) {
          return arg2 === arg3;
        },
        sQdUs:
          "give @s[hasitem=[{item=gold_ingot,quantity=26..},{item=iron_ingot,quantity=64..},{item=diamond,quantity=2..}]] krep:fal",
        fobWs: function (arg2, arg3) {
          return arg2 === arg3;
        },
        NhEon:
          "clear @s[hasitem=[{item=gold_ingot,quantity=9..},{item=iron_ingot,quantity=72..},{item=quartz,quantity=5..}]] quartz 0 5",
        aSxnD: function (arg2, arg3) {
          return arg2 === arg3;
        },
        yfBqN: "QYKRy",
        GFQLT:
          "clear @s[hasitem=[{item=iron_ingot,quantity=16..},{item=blaze_rod,quantity=1..},{item=gold_ingot,quantity=32..},{item=diamond,quantity=1..}]] iron_ingot 0 16",
        MRqAg:
          "clear @s[hasitem=[{item=iron_ingot,quantity=16..},{item=blaze_rod,quantity=1..},{item=gold_ingot,quantity=32..},{item=diamond,quantity=1..}]] blaze_rod 0 1",
        WfdGC:
          "clear @s[hasitem=[{item=iron_ingot,quantity=16..},{item=blaze_rod,quantity=1..},{item=gold_ingot,quantity=32..},{item=diamond,quantity=1..}]] gold_ingot 0 32",
        llxmv:
          "clear @s[hasitem=[{item=iron_ingot,quantity=16..},{item=blaze_rod,quantity=1..},{item=gold_ingot,quantity=32..},{item=diamond,quantity=1..}]] diamond 0 1",
      };
      if (response.canceled) return;
      if (response.selection === 0)
        arg
          .runCommandAsync(
            "give @s[hasitem=[{item=iron_ingot,quantity=16..},{item=blaze_rod,quantity=1..},{item=gold_ingot,quantity=32..},{item=diamond,quantity=1..}]] krep:deagleg",
          )
          .then(() => {
            const data2 = { Pykfb: data.NhEon };
            data.aSxnD("NZiLi", data.yfBqN)
              ? value
                  .runCommandAsync(
                    "give @s[hasitem=[{item=gold_ingot,quantity=9..},{item=iron_ingot,quantity=72..},{item=quartz,quantity=5..}]] krep:g3",
                  )
                  .then(() => {
                    (value.runCommandAsync(
                      "clear @s[hasitem=[{item=gold_ingot,quantity=9..},{item=iron_ingot,quantity=72..},{item=quartz,quantity=5..}]] gold_ingot 0 9",
                    ),
                      value.runCommandAsync(
                        "clear @s[hasitem=[{item=gold_ingot,quantity=9..},{item=iron_ingot,quantity=72..},{item=quartz,quantity=5..}]] iron_ingot 0 72",
                      ),
                      value.runCommandAsync(data2.Pykfb));
                  })
              : (arg.runCommandAsync(data.GFQLT),
                arg.runCommandAsync(data.MRqAg),
                arg.runCommandAsync(data.WfdGC),
                arg.runCommandAsync(data.llxmv));
          });
      else response.selection === 1 && craft(arg);
    }));
}
function uzic(arg) {
  let form = new ActionFormData();
  (form.title("UZI Crafting"),
    form.body("Are you sure? You need:\n\n- 32x Iron Ingot"),
    form.button("Confirm"),
    form.button("Cancel"),
    form.show(arg).then((response) => {
      if (response.canceled) return;
      if (response.selection === 0)
        arg
          .runCommandAsync("give @s[hasitem=[{item=iron_ingot,quantity=32..}]] krep:uzi")
          .then(() => {
            arg.runCommandAsync(
              "clear @s[hasitem=[{item=iron_ingot,quantity=32..}]] iron_ingot 0 32",
            );
          });
      else response.selection === 1 && craft(arg);
    }));
}
function saiga12c(arg) {
  let form = new ActionFormData();
  (form.title("Saiga 12 Crafting"),
    form.body("Are you sure? You need:\n\n- 23x Iron Ingot\n- 4x Quartz"),
    form.button("Confirm"),
    form.button("Cancel"),
    form.show(arg).then((response) => {
      if (response.canceled) return;
      if (response.selection === 0)
        arg
          .runCommandAsync(
            "give @s[hasitem=[{item=iron_ingot,quantity=23..},{item=quartz,quantity=4..}]] krep:saiga12",
          )
          .then(() => {
            (arg.runCommandAsync(
              "clear @s[{item=iron_ingot,quantity=23..},{item=quartz,quantity=4..}]] iron_ingot 0 23",
            ),
              arg.runCommandAsync(
                "clear @s[{item=iron_ingot,quantity=23..},{item=quartz,quantity=4..}]] quartz 0 4",
              ));
          });
      else response.selection === 1 && craft(arg);
    }));
}
function g18c(arg) {
  let form = new ActionFormData();
  (form.title("Glock 18 Crafting"),
    form.body("Are you sure? You need:\n\n- 32x Iron Ingot"),
    form.button("Confirm"),
    form.button("Cancel"),
    form.show(arg).then((response) => {
      if (response.canceled) return;
      if (response.selection === 0)
        arg
          .runCommandAsync("give @s[hasitem=[{item=iron_ingot,quantity=32..}]] krep:g18")
          .then(() => {
            arg.runCommandAsync(
              "clear @s[hasitem=[{item=iron_ingot,quantity=32..}]] iron_ingot 0 32",
            );
          });
      else response.selection === 1 && craft(arg);
    }));
}
function m870c(arg) {
  let form = new ActionFormData();
  (form.title("M870 Crafting"),
    form.body("Are you sure? You need:\n\n- 25x Iron Ingot\n- 12x Log"),
    form.button("Confirm"),
    form.button("Cancel"),
    form.show(arg).then((response) => {
      if (response.canceled) return;
      if (response.selection === 0) {
        arg
          .runCommandAsync(
            "give @s[hasitem=[{item=iron_ingot,quantity=25..},{item=log,quantity=12..}]] krep:m870",
          )
          .then(() => {
            (arg.runCommandAsync(
              "clear @s[hasitem=[{item=iron_ingot,quantity=25..},{item=log,quantity=12..}]] iron_ingot 0 25",
            ),
              arg.runCommandAsync(
                "clear @s[hasitem=[{item=iron_ingot,quantity=25..},{item=log,quantity=12..}]] log 0 12",
              ));
          });
      } else response.selection === 1 && craft(arg);
    }));
}
function m1911c(arg) {
  let form = new ActionFormData();
  (form.title("M1911 Crafting"),
    form.body("Are you sure? You need:\n\n- 16x Iron Ingot\n- 5x Log"),
    form.button("Confirm"),
    form.button("Cancel"),
    form.show(arg).then((response) => {
      const data = {
        cShNB: function (arg2, arg3) {
          return arg2 === arg3;
        },
        PAxoj: "give @s[hasitem=[{item=iron_ingot,quantity=16..}]] krep:g17",
        MTYeK: function (arg2, arg3) {
          return arg2 === arg3;
        },
        Mbcqv: function (arg2, arg3) {
          return arg2(arg3);
        },
        TOhkM: "jCwhI",
        zyfzc: "DmMZd",
        kDlwv:
          "clear @s[hasitem=[{item=iron_ingot,quantity=16..},{item=log,quantity=5..}]] iron_ingot 0 16",
        OkhMc:
          "clear @s[hasitem=[{item=iron_ingot,quantity=16..},{item=log,quantity=5..}]] log 0 5",
      };
      if (response.canceled) return;
      if (response.selection === 0)
        arg
          .runCommandAsync(
            "give @s[hasitem=[{item=iron_ingot,quantity=16..},{item=log,quantity=5..}]] krep:m1911",
          )
          .then(() => {
            if (data.TOhkM !== data.zyfzc)
              (arg.runCommandAsync(data.kDlwv), arg.runCommandAsync(data.OkhMc));
            else {
              if (value.canceled) return;
              if (data.cShNB(value.selection, 0))
                value.runCommandAsync(data.PAxoj).then(() => {
                  value.runCommandAsync(
                    "clear @s[hasitem=[{item=iron_ingot,quantity=16..}]] iron_ingot 0 16",
                  );
                });
              else data.MTYeK(value.selection, 1) && data.Mbcqv(value, value);
            }
          });
      else response.selection === 1 && craft(arg);
    }));
}
function akmc(arg) {
  let form = new ActionFormData();
  (form.title("AKM Crafting"),
    form.body("Are you sure? You need:\n\n- 6x Lapis Lazuli\n- 38x Iron Ingot\n- 8x Log"),
    form.button("Confirm"),
    form.button("Cancel"),
    form.show(arg).then((response) => {
      const data = {
        gSzHv: "clear @s[hasitem=[{item=iron_ingot,quantity=32..}]] iron_ingot 0 32",
        uKFHJ: function (arg2, arg3) {
          return arg2 === arg3;
        },
        IRxug: "give @s[hasitem=[{item=iron_ingot,quantity=32..}]] krep:uzi",
        xkYxj:
          "clear @s[hasitem=[{item=iron_ingot,quantity=62..},{item=gold_ingot,quantity=20..},{item=diamond,quantity=4..},{item=blaze_rod,quantity=2..}]] iron_ingot 0 62",
        sXBiV:
          "clear @s[hasitem=[{item=iron_ingot,quantity=62..},{item=gold_ingot,quantity=20..},{item=diamond,quantity=4..},{item=blaze_rod,quantity=2..}]] gold_ingot 0 20",
        lDndP: "FZeeI",
      };
      if (response.canceled) return;
      if (response.selection === 0) {
        arg
          .runCommandAsync(
            "give @s[hasitem=[{item=lapis_lazuli,quantity=6..},{item=iron_ingot,quantity=38..},{item=log,quantity=8..}]] krep:akm",
          )
          .then(() => {
            const data2 = {
              PMCdy: data.xkYxj,
              hHIef: data.sXBiV,
              SCAHq:
                "clear @s[hasitem=[{item=iron_ingot,quantity=62..},{item=gold_ingot,quantity=20..},{item=diamond,quantity=4..},{item=blaze_rod,quantity=2..}]] diamond 0 4",
            };
            data.uKFHJ(data.lDndP, "UpaIs")
              ? (value.runCommandAsync(data2.PMCdy),
                value.runCommandAsync(data2.hHIef),
                value.runCommandAsync(data2.SCAHq),
                value.runCommandAsync(
                  "clear @s[hasitem=[{item=iron_ingot,quantity=62..},{item=gold_ingot,quantity=20..},{item=diamond,quantity=4..},{item=blaze_rod,quantity=2..}]] blaze_rod 0 2",
                ))
              : (arg.runCommandAsync(
                  "clear @s[hasitem=[{item=lapis_lazuli,quantity=6..},{item=iron_ingot,quantity=38..},{item=log,quantity=8..}]] lapis_lazuli 0 6",
                ),
                arg.runCommandAsync(
                  "clear @s[hasitem=[{item=lapis_lazuli,quantity=6..},{item=iron_ingot,quantity=38..},{item=log,quantity=8..}]] iron_ingot 0 38",
                ),
                arg.runCommandAsync(
                  "clear @s[hasitem=[{item=lapis_lazuli,quantity=6..},{item=iron_ingot,quantity=38..},{item=log,quantity=8..}]] log 0 8",
                ));
          });
      } else {
        if (response.selection === 1) {
          craft(arg);
        }
      }
    }));
}
function m4a1c(arg) {
  let form = new ActionFormData();
  (form.title("M4A1 Crafting"),
    form.body("Are you sure? You need:\n\n- 6x Lapis Lazuli\n- 38x Iron Ingot\n- 8x Log"),
    form.button("Confirm"),
    form.button("Cancel"),
    form.show(arg).then((response) => {
      if (response.canceled) return;
      if (response.selection === 0) {
        arg
          .runCommandAsync(
            "give @s[hasitem=[{item=lapis_lazuli,quantity=6..},{item=iron_ingot,quantity=38..},{item=log,quantity=8..}]] krep:m4a1",
          )
          .then(() => {
            (arg.runCommandAsync(
              "clear @s[hasitem=[{item=lapis_lazuli,quantity=6..},{item=iron_ingot,quantity=38..},{item=log,quantity=8..}]] lapis_lazuli 0 6",
            ),
              arg.runCommandAsync(
                "clear @s[hasitem=[{item=lapis_lazuli,quantity=6..},{item=iron_ingot,quantity=38..},{item=log,quantity=8..}]] iron_ingot 0 38",
              ),
              arg.runCommandAsync(
                "clear @s[hasitem=[{item=lapis_lazuli,quantity=6..},{item=iron_ingot,quantity=38..},{item=log,quantity=8..}]] log 0 8",
              ));
          });
      } else response.selection === 1 && craft(arg);
    }));
}
function g17c(arg) {
  let form = new ActionFormData();
  (form.title("G17 Crafting"),
    form.body("Are you sure? You need:\n\n- 16x Iron Ingot"),
    form.button("Confirm"),
    form.button("Cancel"),
    form.show(arg).then((response) => {
      if (response.canceled) return;
      if (response.selection === 0)
        arg
          .runCommandAsync("give @s[hasitem=[{item=iron_ingot,quantity=16..}]] krep:g17")
          .then(() => {
            arg.runCommandAsync(
              "clear @s[hasitem=[{item=iron_ingot,quantity=16..}]] iron_ingot 0 16",
            );
          });
      else response.selection === 1 && craft(arg);
    }));
}
function deaglec(arg) {
  let form = new ActionFormData();
  (form.title("Desert Eagle Crafting"),
    form.body(
      "Are you sure? You need:\n \n- 2x Diamond\n- 6x Gold Ingot\n- 42x Iron Ingot\n- 1x Blaze Rod",
    ),
    form.button("Confirm"),
    form.button("Cancel"),
    form.show(arg).then((response) => {
      const data = {
        YLcJA:
          "clear @s[hasitem=[{item=iron_ingot,quantity=16..},{item=log,quantity=5..}]] iron_ingot 0 16",
        XXXLQ:
          "clear @s[hasitem=[{item=iron_ingot,quantity=16..},{item=log,quantity=5..}]] log 0 5",
        Gqbnr:
          "give @s[hasitem=[{item=iron_ingot,quantity=16..},{item=log,quantity=5..}]] krep:m1911",
        lCFAk: function (arg2, arg3) {
          return arg2 === arg3;
        },
        tXmox: "clear @s[hasitem=[{item=iron_ingot,quantity=16..}]] iron_ingot 0 16",
        aWUqz: function (arg2, arg3) {
          return arg2 !== arg3;
        },
        QtMbB: "vMfIE",
        CYvGo:
          "clear @s[hasitem=[{item=diamond,quantity=2..},{item=gold_ingot,quantity=6..},{item=iron_ingot,quantity=42..},{item=blaze_rod,quantity=1..}]] diamond 0 2",
        XLiXD:
          "clear @s[hasitem=[{item=diamond,quantity=2..},{item=gold_ingot,quantity=6..},{item=iron_ingot,quantity=42..},{item=blaze_rod,quantity=1..}]] gold_ingot 0 6",
        JcCrm:
          "clear @s[hasitem=[{item=diamond,quantity=2..},{item=gold_ingot,quantity=6..},{item=iron_ingot,quantity=42..},{item=blaze_rod,quantity=1..}]] iron_ingot 0 42",
        aQDCH:
          "clear @s[hasitem=[{item=diamond,quantity=2..},{item=gold_ingot,quantity=6..},{item=iron_ingot,quantity=42..},{item=blaze_rod,quantity=1..}]] blaze_rod 0 1",
      };
      if (response.canceled) return;
      if (response.selection === 0) {
        arg
          .runCommandAsync(
            "give @s[hasitem=[{item=diamond,quantity=2..},{item=gold_ingot,quantity=6..},{item=iron_ingot,quantity=42..},{item=blaze_rod,quantity=1..}]] krep:deagle",
          )
          .then(() => {
            data.aWUqz(data.QtMbB, data.QtMbB)
              ? value.runCommandAsync(data.tXmox)
              : (arg.runCommandAsync(data.CYvGo),
                arg.runCommandAsync(data.XLiXD),
                arg.runCommandAsync(data.JcCrm),
                arg.runCommandAsync(data.aQDCH));
          });
      } else response.selection === 1 && craft(arg);
    }));
}
function mp5c(arg) {
  let form = new ActionFormData();
  (form.title("MP5 Crafting"),
    form.body("Are you sure? You need:\n \n- 4x Lapis Lazuli\n- 32x Iron Ingot"),
    form.button("Confirm"),
    form.button("Cancel"),
    form.show(arg).then((response) => {
      if (response.canceled) return;
      if (response.selection === 0)
        arg
          .runCommandAsync(
            "give @s[hasitem=[{item=iron_ingot,quantity=32..},{item=lapis_lazuli,quantity=4..}]] krep:mp5",
          )
          .then(() => {
            (arg.runCommandAsync(
              "clear @s[{item=iron_ingot,quantity=32..},{item=lapis_lazuli,quantity=4..}]] iron_ingot 0 32",
            ),
              arg.runCommandAsync(
                "clear @s[{item=iron_ingot,quantity=32..},{item=lapis_lazuli,quantity=4..}]] lapis_lazuli 0 4",
              ));
          });
      else response.selection === 1 && craft(arg);
    }));
}
function vectorc(arg) {
  let form = new ActionFormData();
  (form.title("Vector 45 Crafting"),
    form.body(
      "Are you sure? You need:\n \n- 10x Diamond\n- 12x Gold Ingot\n- 60x Iron Ingot\n- 8x Lapis Lazuli",
    ),
    form.button("Confirm"),
    form.button("Cancel"),
    form.show(arg).then((response) => {
      if (response.canceled) return;
      if (response.selection === 0)
        arg
          .runCommandAsync(
            "give @s[hasitem=[{item=diamond,quantity=10..},{item=gold_ingot,quantity=12..},{item=iron_ingot,quantity=60..},{item=lapis_lazuli,quantity=8..}]] krep:vector",
          )
          .then(() => {
            (arg.runCommandAsync(
              "clear @s[hasitem=[{item=diamond,quantity=10..},{item=gold_ingot,quantity=12..},{item=iron_ingot,quantity=60..},{item=lapis_lazuli,quantity=8..}]] diamond 0 10",
            ),
              arg.runCommandAsync(
                "clear @s[hasitem=[{item=diamond,quantity=10..},{item=gold_ingot,quantity=12..},{item=iron_ingot,quantity=60..},{item=lapis_lazuli,quantity=8..}]] gold_ingot 0 12",
              ),
              arg.runCommandAsync(
                "clear @s[hasitem=[{item=diamond,quantity=10..},{item=gold_ingot,quantity=12..},{item=iron_ingot,quantity=60..},{item=lapis_lazuli,quantity=8..}]] iron_ingot 0 60",
              ),
              arg.runCommandAsync(
                "clear @s[hasitem=[{item=diamond,quantity=10..},{item=gold_ingot,quantity=12..},{item=iron_ingot,quantity=60..},{item=lapis_lazuli,quantity=8..}]] lapis_lazuli 0 8",
              ));
          });
      else response.selection === 1 && craft(arg);
    }));
}
function p90c(arg) {
  let form = new ActionFormData();
  (form.title("P90 Crafting"),
    form.body(
      "Are you sure? You need:\n \n- 2x Diamond\n- 8x Gold Ingot\n- 72x Iron Ingot\n- 3x Quartz",
    ),
    form.button("Confirm"),
    form.button("Cancel"),
    form.show(arg).then((response) => {
      const data = {
        oAwMl:
          "clear @s[hasitem=[{item=iron_ingot,quantity=64..},{item=lapis_lazuli,quantity=16..},{item=gold_ingot,quantity=8..},{item=quartz,quantity=8..}]] lapis_lazuli 0 16",
        PsjtC:
          "clear @s[hasitem=[{item=iron_ingot,quantity=64..},{item=lapis_lazuli,quantity=16..},{item=gold_ingot,quantity=8..},{item=quartz,quantity=8..}]] gold_ingot 0 8",
        iwtNZ: function (arg2, arg3) {
          return arg2 === arg3;
        },
        hKPLU: function (arg2, arg3) {
          return arg2 === arg3;
        },
        WUBan: function (arg2, arg3) {
          return arg2(arg3);
        },
        fAKqR:
          "clear @s[hasitem=[{item=lapis_lazuli,quantity=8..},{item=iron_ingot,quantity=36..},{item=log,quantity=6..}]] iron_ingot 0 36",
        fRkOW:
          "clear @s[hasitem=[{item=lapis_lazuli,quantity=8..},{item=iron_ingot,quantity=36..},{item=log,quantity=6..}]] log 0 6",
        Uwadf:
          "give @s[hasitem=[{item=lapis_lazuli,quantity=8..},{item=iron_ingot,quantity=36..},{item=log,quantity=6..}]] krep:m16",
        kcXEP: function (arg2, arg3) {
          return arg2 !== arg3;
        },
        Gaoyq: "vaqtH",
        cngLY:
          "clear @s[hasitem=[{item=diamond,quantity=2..},{item=gold_ingot,quantity=8..},{item=iron_ingot,quantity=72..},{item=quartz,quantity=3..}]] diamond 0 2",
        UkWio:
          "clear @s[hasitem=[{item=diamond,quantity=2..},{item=gold_ingot,quantity=8..},{item=iron_ingot,quantity=72..},{item=quartz,quantity=3..}]] gold_ingot 0 8",
        YVBjN:
          "clear @s[hasitem=[{item=diamond,quantity=2..},{item=gold_ingot,quantity=8..},{item=iron_ingot,quantity=72..},{item=quartz,quantity=3..}]] iron_ingot 0 72",
        GLRTq:
          "clear @s[hasitem=[{item=diamond,quantity=2..},{item=gold_ingot,quantity=8..},{item=iron_ingot,quantity=72..},{item=quartz,quantity=3..}]] quartz 0 3",
      };
      if (response.canceled) return;
      if (response.selection === 0) {
        arg
          .runCommandAsync(
            "give @s[hasitem=[{item=diamond,quantity=2..},{item=gold_ingot,quantity=8..},{item=iron_ingot,quantity=72..},{item=quartz,quantity=3..}]] krep:p90",
          )
          .then(() => {
            if (data.kcXEP(data.Gaoyq, data.Gaoyq)) {
              const data2 = {
                qMNaJ:
                  "clear @s[hasitem=[{item=lapis_lazuli,quantity=8..},{item=iron_ingot,quantity=36..},{item=log,quantity=6..}]] lapis_lazuli 0 8",
                sOOSW: data.fAKqR,
                TWtIr: data.fRkOW,
              };
              if (value.canceled) return;
              if (data.iwtNZ(value.selection, 0))
                value.runCommandAsync(data.Uwadf).then(() => {
                  (value.runCommandAsync(data2.qMNaJ),
                    value.runCommandAsync(data2.sOOSW),
                    value.runCommandAsync(data2.TWtIr));
                });
              else data.iwtNZ(value.selection, 1) && data.WUBan(value, value);
            } else
              (arg.runCommandAsync(data.cngLY),
                arg.runCommandAsync(data.UkWio),
                arg.runCommandAsync(data.YVBjN),
                arg.runCommandAsync(data.GLRTq));
          });
      } else response.selection === 1 && craft(arg);
    }));
}
function m16a1c(arg) {
  let form = new ActionFormData();
  (form.title("M16A1 Crafting"),
    form.body("Are you sure? You need:\n \n- 6x Lapis Lazuli\n- 32x Iron Ingot\n- 6x Oak Log"),
    form.button("Confirm"),
    form.button("Cancel"),
    form.show(arg).then((response) => {
      if (response.canceled) return;
      if (response.selection === 0) {
        arg
          .runCommandAsync(
            "give @s[hasitem=[{item=lapis_lazuli,quantity=6..},{item=iron_ingot,quantity=32..},{item=log,quantity=6..}]] krep:m16a1",
          )
          .then(() => {
            (arg.runCommandAsync(
              "clear @s[hasitem=[{item=lapis_lazuli,quantity=6..},{item=iron_ingot,quantity=32..},{item=log,quantity=6..}]] lapis_lazuli 0 6",
            ),
              arg.runCommandAsync(
                "clear @s[hasitem=[{item=lapis_lazuli,quantity=6..},{item=iron_ingot,quantity=32..},{item=log,quantity=6..}]] iron_ingot 0 32",
              ),
              arg.runCommandAsync(
                "clear @s[hasitem=[{item=lapis_lazuli,quantity=6..},{item=iron_ingot,quantity=32..},{item=log,quantity=6..}]] log 0 6",
              ));
          });
      } else response.selection === 1 && craft(arg);
    }));
}
function m16c(arg) {
  let form = new ActionFormData();
  (form.title("M16A4 Crafting"),
    form.body("Are you sure? You need:\n \n- 8x Lapis Lazuli\n- 36x Iron Ingot\n- 6x Oak Log"),
    form.button("Confirm"),
    form.button("Cancel"),
    form.show(arg).then((response) => {
      const data = {
        xkDJB:
          "clear @s[hasitem=[{item=lapis_lazuli,quantity=8..},{item=iron_ingot,quantity=36..},{item=log,quantity=6..}]] iron_ingot 0 36",
        iNMkx:
          "clear @s[hasitem=[{item=lapis_lazuli,quantity=8..},{item=iron_ingot,quantity=36..},{item=log,quantity=6..}]] log 0 6",
        GKevT: function (arg2, arg3) {
          return arg2(arg3);
        },
      };
      if (response.canceled) return;
      if (response.selection === 0)
        arg
          .runCommandAsync(
            "give @s[hasitem=[{item=lapis_lazuli,quantity=8..},{item=iron_ingot,quantity=36..},{item=log,quantity=6..}]] krep:m16",
          )
          .then(() => {
            (arg.runCommandAsync(
              "clear @s[hasitem=[{item=lapis_lazuli,quantity=8..},{item=iron_ingot,quantity=36..},{item=log,quantity=6..}]] lapis_lazuli 0 8",
            ),
              arg.runCommandAsync(data.xkDJB),
              arg.runCommandAsync(data.iNMkx));
          });
      else response.selection === 1 && craft(arg);
    }));
}
function hk416c(arg) {
  let form = new ActionFormData();
  (form.title("HK416 Crafting"),
    form.body("Are you sure? You need:\n \n- 16x Gold Ingot\n- 64x Iron Ingot\n- 8x Quartz"),
    form.button("Confirm"),
    form.button("Cancel"),
    form.show(arg).then((response) => {
      if (response.canceled) return;
      if (response.selection === 0)
        arg
          .runCommandAsync(
            "give @s[hasitem=[{item=gold_ingot,quantity=16..},{item=iron_ingot,quantity=64..},{item=quartz,quantity=8..}]] krep:hk416",
          )
          .then(() => {
            (arg.runCommandAsync(
              "clear @s[hasitem=[{item=gold_ingot,quantity=16..},{item=iron_ingot,quantity=64..},{item=quartz,quantity=8..}]] gold_ingot 0 16",
            ),
              arg.runCommandAsync(
                "clear @s[hasitem=[{item=gold_ingot,quantity=16..},{item=iron_ingot,quantity=64..},{item=quartz,quantity=8..}]] iron_ingot 0 64",
              ),
              arg.runCommandAsync(
                "clear @s[hasitem=[{item=gold_ingot,quantity=16..},{item=iron_ingot,quantity=64..},{item=quartz,quantity=8..}]] quartz 0 8",
              ));
          });
      else response.selection === 1 && craft(arg);
    }));
}
function g36c(arg) {
  let form = new ActionFormData();
  (form.title("G36K Crafting"),
    form.body("Are you sure? You need:\n\n- 16x Gold Ingot\n- 64x Iron Ingot\n- 8x Quartz"),
    form.button("Confirm"),
    form.button("Cancel"),
    form.show(arg).then((response) => {
      if (response.canceled) return;
      if (response.selection === 0) {
        arg
          .runCommandAsync(
            "give @s[hasitem=[{item=gold_ingot,quantity=16..},{item=iron_ingot,quantity=64..},{item=quartz,quantity=8..}]] krep:g36",
          )
          .then(() => {
            (arg.runCommandAsync(
              "clear @s[hasitem=[{item=gold_ingot,quantity=16..},{item=iron_ingot,quantity=64..},{item=quartz,quantity=8..}]] gold_ingot 0 16",
            ),
              arg.runCommandAsync(
                "clear @s[hasitem=[{item=gold_ingot,quantity=16..},{item=iron_ingot,quantity=64..},{item=quartz,quantity=8..}]] iron_ingot 0 64",
              ),
              arg.runCommandAsync(
                "clear @s[hasitem=[{item=gold_ingot,quantity=16..},{item=iron_ingot,quantity=64..},{item=quartz,quantity=8..}]] quartz 0 8",
              ));
          });
      } else response.selection === 1 && craft(arg);
    }));
}
function minigunc(arg) {
  let form = new ActionFormData();
  (form.title("M134 Minigun Crafting"),
    form.body(
      "Are you sure? You need:\n\n- 320x Iron Ingot\n- 10x Blaze Rod\n- 80x Gold Ingot\n- 10x Netherite Ingot\n- 40x Diamond",
    ),
    form.button("Confirm"),
    form.button("Cancel"),
    form.show(arg).then((response) => {
      if (response.canceled) return;
      if (response.selection === 0)
        arg
          .runCommandAsync(
            "give @s[hasitem=[{item=iron_ingot,quantity=320..},{item=blaze_rod,quantity=10..},{item=gold_ingot,quantity=80..},{item=netherite_ingot,quantity=10..},{item=diamond,quantity=40..}]] krep:minigun",
          )
          .then(() => {
            {
              const parts = "0|1|4|3|2".split("|");
              let value = 0;
              while (true) {
                switch (parts[value++]) {
                  case "0":
                    arg.runCommandAsync(
                      "clear @s[hasitem=[{item=iron_ingot,quantity=320..},{item=blaze_rod,quantity=10..},{item=gold_ingot,quantity=80..},{item=netherite_ingot,quantity=10..},{item=diamond,quantity=40..}]] iron_ingot 0 320",
                    );
                    continue;
                  case "1":
                    arg.runCommandAsync(
                      "clear @s[hasitem=[{item=iron_ingot,quantity=320..},{item=blaze_rod,quantity=10..},{item=gold_ingot,quantity=80..},{item=netherite_ingot,quantity=10..},{item=diamond,quantity=40..}]] blaze_rod 0 10",
                    );
                    continue;
                  case "2":
                    arg.runCommandAsync(
                      "clear @s[hasitem=[{item=iron_ingot,quantity=320..},{item=blaze_rod,quantity=10..},{item=gold_ingot,quantity=80..},{item=netherite_ingot,quantity=10..},{item=diamond,quantity=40..}]] diamond 0 40",
                    );
                    continue;
                  case "3":
                    arg.runCommandAsync(
                      "clear @s[hasitem=[{item=iron_ingot,quantity=320..},{item=blaze_rod,quantity=10..},{item=gold_ingot,quantity=80..},{item=netherite_ingot,quantity=10..},{item=diamond,quantity=40..}]] netherite_ingot 0 10",
                    );
                    continue;
                  case "4":
                    arg.runCommandAsync(
                      "clear @s[hasitem=[{item=iron_ingot,quantity=320..},{item=blaze_rod,quantity=10..},{item=gold_ingot,quantity=80..},{item=netherite_ingot,quantity=10..},{item=diamond,quantity=40..}]] gold_ingot 0 80",
                    );
                    continue;
                }
                break;
              }
            }
          });
      else response.selection === 1 && craft(arg);
    }));
}
function mp7c(arg) {
  let form = new ActionFormData();
  (form.title("MP7 Crafting"),
    form.body(
      "Are you sure? You need:\n\n- 50x Iron Ingot\n- 10x Gold Ingot\n- 3x Quartz\n- 1x Diamond",
    ),
    form.button("Confirm"),
    form.button("Cancel"),
    form.show(arg).then((response) => {
      if (response.canceled) return;
      if (response.selection === 0)
        arg
          .runCommandAsync(
            "give @s[hasitem=[{item=iron_ingot,quantity=50..},{item=gold_ingot,quantity=10..},{item=quartz,quantity=3..},{item=diamond,quantity=1..}]] krep:mp7",
          )
          .then(() => {
            (arg.runCommandAsync(
              "clear @s[hasitem=[{item=iron_ingot,quantity=50..},{item=gold_ingot,quantity=10..},{item=quartz,quantity=3..},{item=diamond,quantity=1..}]] iron_ingot 0 50",
            ),
              arg.runCommandAsync(
                "clear @s[hasitem=[{item=iron_ingot,quantity=50..},{item=gold_ingot,quantity=10..},{item=quartz,quantity=3..},{item=diamond,quantity=1..}]] gold_ingot 0 10",
              ),
              arg.runCommandAsync(
                "clear @s[hasitem=[{item=iron_ingot,quantity=50..},{item=gold_ingot,quantity=10..},{item=quartz,quantity=3..},{item=diamond,quantity=1..}]] quartz 0 3",
              ),
              arg.runCommandAsync(
                "clear @s[hasitem=[{item=iron_ingot,quantity=50..},{item=gold_ingot,quantity=10..},{item=quartz,quantity=3..},{item=diamond,quantity=1..}]] diamond 0 1",
              ));
          });
      else response.selection === 1 && craft(arg);
    }));
}
function scarhc(arg) {
  let form = new ActionFormData();
  (form.title("SCAR-H Crafting"),
    form.body(
      "Are you sure? You need:\n \n- 2x Diamond\n- 16x Gold Ingot\n- 96x Iron Ingot\n- 4x Blaze Rod",
    ),
    form.button("Confirm"),
    form.button("Cancel"),
    form.show(arg).then((response) => {
      const data = {
        VemlK:
          "clear @s[hasitem=[{item=iron_ingot,quantity=128..},{item=gold_ingot,quantity=30..},{item=diamond,quantity=6..},{item=blaze_rod,quantity=5..}]] gold_ingot 0 30",
        qRrkm:
          "clear @s[hasitem=[{item=iron_ingot,quantity=128..},{item=gold_ingot,quantity=30..},{item=diamond,quantity=6..},{item=blaze_rod,quantity=5..}]] blaze_rod 0 5",
        niBtr: function (arg2, arg3) {
          return arg2 === arg3;
        },
        ODGbg: function (arg2, arg3) {
          return arg2(arg3);
        },
        PBGeG: "pxENM",
        AfRnK: "GnCNc",
        GqsMp:
          "clear @s[hasitem=[{item=diamond,quantity=2..},{item=gold_ingot,quantity=16..},{item=iron_ingot,quantity=96..},{item=blaze_rod,quantity=4..}]] diamond 0 2",
        HhWeJ:
          "clear @s[hasitem=[{item=diamond,quantity=2..},{item=gold_ingot,quantity=16..},{item=iron_ingot,quantity=96..},{item=blaze_rod,quantity=4..}]] iron_ingot 0 96",
        UHoWz:
          "clear @s[hasitem=[{item=diamond,quantity=2..},{item=gold_ingot,quantity=16..},{item=iron_ingot,quantity=96..},{item=blaze_rod,quantity=4..}]] blaze_rod 0 4",
        EmotK:
          "clear @s[hasitem=[{item=lapis_lazuli,quantity=6..},{item=iron_ingot,quantity=38..},{item=log,quantity=8..}]] lapis_lazuli 0 6",
        MdJXl:
          "clear @s[hasitem=[{item=lapis_lazuli,quantity=6..},{item=iron_ingot,quantity=38..},{item=log,quantity=8..}]] iron_ingot 0 38",
        wKavU:
          "clear @s[hasitem=[{item=lapis_lazuli,quantity=6..},{item=iron_ingot,quantity=38..},{item=log,quantity=8..}]] log 0 8",
        hZpdo:
          "give @s[hasitem=[{item=lapis_lazuli,quantity=6..},{item=iron_ingot,quantity=38..},{item=log,quantity=8..}]] krep:m4a1",
      };
      if (response.canceled) return;
      if (response.selection === 0)
        arg
          .runCommandAsync(
            "give @s[hasitem=[{item=diamond,quantity=2..},{item=gold_ingot,quantity=16..},{item=iron_ingot,quantity=96..},{item=blaze_rod,quantity=4..}]] krep:scarh",
          )
          .then(() => {
            const data2 = {
              UdGxg: data.VemlK,
              QhTuY:
                "clear @s[hasitem=[{item=iron_ingot,quantity=128..},{item=gold_ingot,quantity=30..},{item=diamond,quantity=6..},{item=blaze_rod,quantity=5..}]] diamond 0 6",
              OFYwa: data.qRrkm,
              VQfto: function (arg2, arg3) {
                return data.niBtr(arg2, arg3);
              },
              BojXa: function (arg2, arg3) {
                return data.ODGbg(arg2, arg3);
              },
            };
            if (data.PBGeG === data.AfRnK) {
              const data3 = {
                AGDsO: data2.UdGxg,
                Pbrxq: data2.QhTuY,
                HwCOh: data2.OFYwa,
              };
              if (value.canceled) return;
              if (data2.VQfto(value.selection, 0))
                value
                  .runCommandAsync(
                    "give @s[hasitem=[{item=iron_ingot,quantity=128..},{item=gold_ingot,quantity=30..},{item=diamond,quantity=6..},{item=blaze_rod,quantity=5..}]] krep:evolys",
                  )
                  .then(() => {
                    (value.runCommandAsync(
                      "clear @s[hasitem=[{item=iron_ingot,quantity=128..},{item=gold_ingot,quantity=30..},{item=diamond,quantity=6..},{item=blaze_rod,quantity=5..}]] iron_ingot 0 128",
                    ),
                      value.runCommandAsync(data3.AGDsO),
                      value.runCommandAsync(data3.Pbrxq),
                      value.runCommandAsync(data3.HwCOh));
                  });
              else data2.VQfto(value.selection, 1) && data2.BojXa(value, value);
            } else
              (arg.runCommandAsync(data.GqsMp),
                arg.runCommandAsync(
                  "clear @s[hasitem=[{item=diamond,quantity=2..},{item=gold_ingot,quantity=16..},{item=iron_ingot,quantity=96..},{item=blaze_rod,quantity=4..}]] gold_ingot 0 16",
                ),
                arg.runCommandAsync(data.HhWeJ),
                arg.runCommandAsync(data.UHoWz));
          });
      else {
        if (response.selection === 1) {
          craft(arg);
        }
      }
    }));
}
function g3c(arg) {
  let form = new ActionFormData();
  (form.title("G3 Crafting"),
    form.body("Are you sure? You need:\n \n- 9x Gold Ingot\n- 72x Iron Ingot\n- 5x Quartz"),
    form.button("Confirm"),
    form.button("Cancel"),
    form.show(arg).then((response) => {
      if (response.canceled) return;
      if (response.selection === 0)
        arg
          .runCommandAsync(
            "give @s[hasitem=[{item=gold_ingot,quantity=9..},{item=iron_ingot,quantity=72..},{item=quartz,quantity=5..}]] krep:g3",
          )
          .then(() => {
            (arg.runCommandAsync(
              "clear @s[hasitem=[{item=gold_ingot,quantity=9..},{item=iron_ingot,quantity=72..},{item=quartz,quantity=5..}]] gold_ingot 0 9",
            ),
              arg.runCommandAsync(
                "clear @s[hasitem=[{item=gold_ingot,quantity=9..},{item=iron_ingot,quantity=72..},{item=quartz,quantity=5..}]] iron_ingot 0 72",
              ),
              arg.runCommandAsync(
                "clear @s[hasitem=[{item=gold_ingot,quantity=9..},{item=iron_ingot,quantity=72..},{item=quartz,quantity=5..}]] quartz 0 5",
              ));
          });
      else {
        if (response.selection === 1) {
          craft(arg);
        }
      }
    }));
}
function aa12c(arg) {
  let form = new ActionFormData();
  (form.title("AA-12 Crafting"),
    form.body(
      "Are you sure? You need:\n \n- 2x Diamond\n- 16x Gold Ingot\n- 80x Iron Ingot\n- 4x Blaze Rod",
    ),
    form.button("Confirm"),
    form.button("Cancel"),
    form.show(arg).then((response) => {
      if (response.canceled) return;
      if (response.selection === 0)
        arg
          .runCommandAsync(
            "give @s[hasitem=[{item=diamond,quantity=2..},{item=gold_ingot,quantity=16..},{item=iron_ingot,quantity=80..},{item=blaze_rod,quantity=4..}]] krep:aa12",
          )
          .then(() => {
            (arg.runCommandAsync(
              "clear @s[hasitem=[{item=diamond,quantity=2..},{item=gold_ingot,quantity=16..},{item=iron_ingot,quantity=80..},{item=blaze_rod,quantity=4..}]] diamond 0 2",
            ),
              arg.runCommandAsync(
                "clear @s[hasitem=[{item=diamond,quantity=2..},{item=gold_ingot,quantity=16..},{item=iron_ingot,quantity=80..},{item=blaze_rod,quantity=4..}]] gold_ingot 0 16",
              ),
              arg.runCommandAsync(
                "clear @s[hasitem=[{item=diamond,quantity=2..},{item=gold_ingot,quantity=16..},{item=iron_ingot,quantity=80..},{item=blaze_rod,quantity=4..}]] iron_ingot 0 80",
              ),
              arg.runCommandAsync(
                "clear @s[hasitem=[{item=diamond,quantity=2..},{item=gold_ingot,quantity=16..},{item=iron_ingot,quantity=80..},{item=blaze_rod,quantity=4..}]] blaze_rod 0 4",
              ));
          });
      else response.selection === 1 && craft(arg);
    }));
}
function falc(arg) {
  let form = new ActionFormData();
  (form.title("FAL Crafting"),
    form.body("Are you sure? You need:\n\n- 26x Gold Ingot\n- 64x Iron Ingot\n- 2x Diamond"),
    form.button("Confirm"),
    form.button("Cancel"),
    form.show(arg).then((response) => {
      if (response.canceled) return;
      if (response.selection === 0)
        arg
          .runCommandAsync(
            "give @s[hasitem=[{item=gold_ingot,quantity=26..},{item=iron_ingot,quantity=64..},{item=diamond,quantity=2..}]] krep:fal",
          )
          .then(() => {
            (arg.runCommandAsync(
              "clear @s[hasitem=[{item=gold_ingot,quantity=26..},{item=iron_ingot,quantity=64..},{item=diamond,quantity=2..}]] gold_ingot 0 26",
            ),
              arg.runCommandAsync(
                "clear @s[hasitem=[{item=gold_ingot,quantity=26..},{item=iron_ingot,quantity=64..},{item=diamond,quantity=2..}]] iron_ingot 0 64",
              ),
              arg.runCommandAsync(
                "clear @s[hasitem=[{item=gold_ingot,quantity=26..},{item=iron_ingot,quantity=64..},{item=diamond,quantity=2..}]] diamond 0 2",
              ));
          });
      else {
        if (response.selection === 1) {
          craft(arg);
        }
      }
    }));
}
function b93c(arg) {
  let form = new ActionFormData();
  (form.title("Beretta 93R Crafting"),
    form.body("Are you sure? You need:\n\n- 21x Iron Ingot\n- 5x Log\n- 2x Lapis Lazuli"),
    form.button("Confirm"),
    form.button("Cancel"),
    form.show(arg).then((response) => {
      if (response.canceled) return;
      if (response.selection === 0)
        arg
          .runCommandAsync(
            "give @s[hasitem=[{item=iron_ingot,quantity=21..},{item=log,quantity=5..},{item=lapis_lazuli,quantity=2..}]] krep:b93",
          )
          .then(() => {
            (arg.runCommandAsync(
              "clear @s[hasitem=[{item=iron_ingot,quantity=21..},{item=log,quantity=5..},{item=lapis_lazuli,quantity=2..}]] iron_ingot 0 21",
            ),
              arg.runCommandAsync(
                "clear @s[hasitem=[{item=iron_ingot,quantity=21..},{item=log,quantity=5..},{item=lapis_lazuli,quantity=2..}]] log 0 5",
              ),
              arg.runCommandAsync(
                "clear @s[hasitem=[{item=iron_ingot,quantity=21..},{item=log,quantity=5..},{item=lapis_lazuli,quantity=2..}]] lapis_lazuli 0 2",
              ));
          });
      else response.selection === 1 && craft(arg);
    }));
}
function umpc(arg) {
  let form = new ActionFormData();
  (form.title("UMP-45 Crafting"),
    form.body("Are you sure? You need:\n\n- 62x Iron Ingot\n- 5x Gold Ingot\n- 3x Quartz"),
    form.button("Confirm"),
    form.button("Cancel"),
    form.show(arg).then((response) => {
      if (response.canceled) return;
      if (response.selection === 0)
        arg
          .runCommandAsync(
            "give @s[hasitem=[{item=iron_ingot,quantity=62..},{item=gold_ingot,quantity=5..},{item=quartz,quantity=3..}]] krep:ump",
          )
          .then(() => {
            (arg.runCommandAsync(
              "clear @s[hasitem=[{item=iron_ingot,quantity=62..},{item=gold_ingot,quantity=5..},{item=quartz,quantity=3..}]] iron_ingot 0 62",
            ),
              arg.runCommandAsync(
                "clear @s[hasitem=[{item=iron_ingot,quantity=62..},{item=gold_ingot,quantity=5..},{item=quartz,quantity=3..}]] gold_ingot 0 5",
              ),
              arg.runCommandAsync(
                "clear @s[hasitem=[{item=iron_ingot,quantity=62..},{item=gold_ingot,quantity=5..},{item=quartz,quantity=3..}]] quartz 0 3",
              ));
          });
      else response.selection === 1 && craft(arg);
    }));
}
function qbz95c(arg) {
  let form = new ActionFormData();
  (form.title("Beretta 93R Crafting"),
    form.body(
      "Are you sure? You need:\n\n- 40x Iron Ingot\n- 6x Log\n- 8x Lapis Lazuli\n- 3x Gold Ingot",
    ),
    form.button("Confirm"),
    form.button("Cancel"),
    form.show(arg).then((response) => {
      if (response.canceled) return;
      if (response.selection === 0)
        arg
          .runCommandAsync(
            "give @s[hasitem=[{item=iron_ingot,quantity=40..},{item=log,quantity=6..},{item=lapis_lazuli,quantity=8..},{item=gold_ingot,quantity=3..}]] krep:b93",
          )
          .then(() => {
            (arg.runCommandAsync(
              "clear @s[hasitem=[{item=iron_ingot,quantity=40..},{item=log,quantity=6..},{item=lapis_lazuli,quantity=8..},{item=gold_ingot,quantity=3..}]] iron_ingot 0 40",
            ),
              arg.runCommandAsync(
                "clear @s[hasitem=[{item=iron_ingot,quantity=40..},{item=log,quantity=6..},{item=lapis_lazuli,quantity=8..},{item=gold_ingot,quantity=3..}]] log 0 6",
              ),
              arg.runCommandAsync(
                "clear @s[hasitem=[{item=iron_ingot,quantity=40..},{item=log,quantity=6..},{item=lapis_lazuli,quantity=8..},{item=gold_ingot,quantity=3..}]] lapis_lazuli 0 8",
              ),
              arg.runCommandAsync(
                "clear @s[hasitem=[{item=iron_ingot,quantity=40..},{item=log,quantity=6..},{item=lapis_lazuli,quantity=8..},{item=gold_ingot,quantity=3..}]] gold_ingot 0 3",
              ));
          });
      else response.selection === 1 && craft(arg);
    }));
}
function sksc(arg) {
  let form = new ActionFormData();
  (form.title("SKS Crafting"),
    form.body("Are you sure? You need:\n\n- 40x Iron Ingot\n- 8x Lapis Lazuli\n- 12x Log"),
    form.button("Confirm"),
    form.button("Cancel"),
    form.show(arg).then((response) => {
      const data = {
        ZGlUd:
          "clear @s[{item=iron_ingot,quantity=32..},{item=lapis_lazuli,quantity=4..}]] lapis_lazuli 0 4",
        Txlev: function (arg2, arg3) {
          return arg2 === arg3;
        },
        bUjhO:
          "give @s[hasitem=[{item=iron_ingot,quantity=32..},{item=lapis_lazuli,quantity=4..}]] krep:mp5",
        rrkci: function (arg2, arg3) {
          return arg2 === arg3;
        },
        ZlUWJ: function (arg2, arg3) {
          return arg2(arg3);
        },
        qLwzH:
          "clear @s[hasitem=[{item=iron_ingot,quantity=40..},{item=lapis_lazuli,quantity=8..},{item=log,quantity=12..}]] iron_ingot 0 40",
        HTuJE:
          "clear @s[hasitem=[{item=iron_ingot,quantity=40..},{item=lapis_lazuli,quantity=8..},{item=log,quantity=12..}]] lapis_lazuli 0 8",
      };
      if (response.canceled) return;
      if (response.selection === 0) {
        arg
          .runCommandAsync(
            "give @s[hasitem=[{item=iron_ingot,quantity=40..},{item=lapis_lazuli,quantity=8..},{item=log,quantity=12..}]] krep:ump",
          )
          .then(() => {
            (arg.runCommandAsync(data.qLwzH),
              arg.runCommandAsync(data.HTuJE),
              arg.runCommandAsync(
                "clear @s[hasitem=[{item=iron_ingot,quantity=40..},{item=lapis_lazuli,quantity=8..},{item=log,quantity=12..}]] log 0 12",
              ));
          });
      } else response.selection === 1 && craft(arg);
    }));
}
function rpgc(arg) {
  let form = new ActionFormData();
  (form.title("RPG-7 Crafting"),
    form.body("Are you sure? You need:\n \n- 24x Log\n- 16x Lapis Lazuli\n- 38x Iron Ingot"),
    form.button("Confirm"),
    form.button("Cancel"),
    form.show(arg).then((response) => {
      if (response.canceled) return;
      if (response.selection === 0)
        arg
          .runCommandAsync(
            "give @s[hasitem=[{item=log,quantity=24..},{item=lapis_lazuli,quantity=16..},{item=iron_ingot,quantity=38..}]] krep:rpg",
          )
          .then(() => {
            (arg.runCommandAsync(
              "clear @s[hasitem=[{item=log,quantity=24..},{item=lapis_lazuli,quantity=16..},{item=iron_ingot,quantity=38..}]] log 0 24",
            ),
              arg.runCommandAsync(
                "clear @s[hasitem=[{item=log,quantity=24..},{item=lapis_lazuli,quantity=16..},{item=iron_ingot,quantity=38..}]] lapis_lazuli 0 16",
              ),
              arg.runCommandAsync(
                "clear @s[hasitem=[{item=log,quantity=24..},{item=lapis_lazuli,quantity=16..},{item=iron_ingot,quantity=38..}]] iron_ingot 0 38",
              ));
          });
      else response.selection === 1 && craft(arg);
    }));
}
system.runInterval(() => {
  for (let player of world.getPlayers()) {
    (player.hasTag("jawir") &&
      system.run(() => {
        (craft(player), player.runCommandAsync('tag @s remove "jawir"'));
      }),
      player.hasTag("openui2") &&
        system.run(() => {
          (wip(player), player.runCommandAsync('tag @s remove "openui2"'));
        }));
  }
}, 20);
