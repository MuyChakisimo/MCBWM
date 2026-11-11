// Entry point (manifest "entry"). Each module registers its own events/intervals on import.
// Weapon stats live in config/ (weapons.js, combat.js, recoil.js, ammo.js, attachments.js).

// Server: friends-only access (needed behind the playit/WaterdogPE proxy)
import "./server/access";

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
import "./attachments/javaAttachments";
import "./attachments/scopeState";
import "./items/ammoBox308";
