// Entry point (manifest "entry"). Each module registers its own events/intervals on import.
// Weapon stats live in config/ (weapons.js, combat.js, recoil.js, ammo.js, attachments.js).

// Combat
import "./combat/hitscan";
import "./combat/firing";
import "./combat/reload";
import "./combat/inspect";
import "./combat/debug";
import "./combat/aimZoom";
import "./combat/hitMarker";

// Crafting and attachment workbenches
import "./crafting/workbenchBlocks";
import "./attachments/attachmentState";
import "./attachments/attachmentMenu";

// Items
import "./items/ammoScoreboards";
import "./items/itemLore";
import "./items/storedAmmoDisplay";
import "./items/heldGun";
import "./items/ammoBox308";
