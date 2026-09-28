// Entry point (manifest "entry"). Each module registers its own events/intervals on import.
// Weapon stats live in config/ (weapons.js, ammo.js, attachments.js, recoil.js).

// Combat
import "./combat/hitscan";
import "./combat/projectiles";
import "./combat/armor";
import "./combat/recoil";
import "./combat/killTracking";

// Crafting and attachment workbenches
import "./crafting/workbenchBlocks";
import "./crafting/gunsmith";
import "./crafting/ammoWorkbench";
import "./attachments/attachmentState";
import "./attachments/attachmentMenu";

// Items
import "./items/ammoScoreboards";
import "./items/itemLore";
import "./items/storedAmmoDisplay";
import "./items/ammoBox308";
