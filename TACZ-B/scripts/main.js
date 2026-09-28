// =====================================================
// TACZ SCRIPT BOOTSTRAP
// =====================================================

// Diagnostics (inert until enabled: /scriptevent tacz:debug on, tacz:profile on)
import "./debug/profiler.js";
import "./debug/diagnostics.js";

// Core combat / weapon engine
import "./weapons/hitscan.js";
import "./weapons/projectileBridge.js";
import "./weapons/projectileCleanup.js";
import "./weapons/recoil.js";

// Player / attachment state
import "./attachments/state.js";
<<<<<<< HEAD
import "./attachments/modular.js";

// Inventory / ammo presentation
import "./ui/ammoHud.js";
import "./events/itemLore.js";
=======
import "./events/kodePembesarPensilSejawirTimur.js";
import "./weapons/recoil.js";
import "./events/horegJatimKocak.js";
>>>>>>> parent of ad75d8b (Integrated Java Weapons)
import "./events/bulletCache.js";
import "./events/scoreboardInit.js";
import "./events/win308AmmoBox.js";

// Legacy crafting UIs retained during gradual deobfuscation
import "./events/gunsmithInteraction.js";
import "./events/workbenchInteraction.js";
import "./events/gunCraftingUI.js";
import "./events/ammoCraftingUI.js";
import "./events/legacyAttachmentUI.js";
