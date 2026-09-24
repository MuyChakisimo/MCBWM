import { system, world } from "@minecraft/server";
import { WEAPONS } from "../config/weapons.js";
import { consumeRound, getMagazineAmmo } from "./ammo.js";
import { startReload } from "./reload.js";
import { getPlayerState } from "../players/playerState.js";
import { fireConfiguredWeapon } from "./hitscan.js";
import { firePhysicalWeapon } from "./physicalFire.js";
import { getEffectiveWeapon } from "../attachments/modular.js";
function idFromItem(item){if(!item?.typeId?.startsWith("krep:"))return;return item.typeId.slice(5).replace(/_emp$/,"");}
function fireOnce(player,weapon){weapon=getEffectiveWeapon(player,weapon);const st=getPlayerState(player);if(st.reloading)return false;if(getMagazineAmmo(player,weapon)<=0){startReload(player,weapon);return false;}if(!consumeRound(player,weapon,1))return false;try{ if (weapon.hitscan) fireConfiguredWeapon(player,weapon,player.isSneaking?"ads":"hip"); else firePhysicalWeapon(player,weapon); }catch(e){console.error(`[TACZ] modular fire ${weapon.id}:`,e);}try{if(weapon.animations?.shoot)player.playAnimation(weapon.animations.shoot,{blendOutTime:0.03});}catch{}try{if(weapon.sounds?.shoot)player.playSound?.(weapon.sounds.shoot);}catch{}return true;}
function nextFireDelay(state,rpm){const interval=1200/Math.max(1,rpm??60);const total=interval+(state.fireRemainder??0);const delay=Math.max(1,Math.floor(total));state.fireRemainder=Math.max(0,total-delay);return delay;}
function scheduleAuto(player,weapon,token){const st=getPlayerState(player);if(!st.firing||st.fireToken!==token||st.reloading)return; if(!fireOnce(player,weapon)){st.firing=false;return;} const delay=nextFireDelay(st,weapon.rpm); system.runTimeout(()=>scheduleAuto(player,weapon,token),delay);}
world.afterEvents.itemStartUse.subscribe(ev=>{const id=idFromItem(ev.itemStack);const weapon=WEAPONS[id];if(!weapon?.modularInput)return;const st=getPlayerState(ev.source);st.weaponId=id;const modes=weapon.fireModes?.length?weapon.fireModes:[weapon.fireMode??"semi"];const mode=modes[st.fireModeIndex % modes.length];if(mode==="auto"){st.firing=true;st.fireRemainder=0;const t=++st.fireToken;scheduleAuto(ev.source,weapon,t);}else if(mode==="burst"){const t=++st.fireToken;let n=3;const burst=()=>{if(st.fireToken!==t||n--<=0)return;fireOnce(ev.source,weapon);if(n>0)system.runTimeout(burst,nextFireDelay(st,weapon.rpm??600));};burst();}else fireOnce(ev.source,weapon);});
world.afterEvents.itemStopUse.subscribe(ev=>{const id=idFromItem(ev.itemStack);const w=WEAPONS[id];if(!w?.modularInput)return;const st=getPlayerState(ev.source);st.firing=false;st.fireToken++;});
// Attack/swing is the legacy reload input. A tiny controller sends this event for imported guns.
system.afterEvents.scriptEventReceive.subscribe(ev=>{if(ev.id!=="tacz:modular_reload")return;const p=ev.sourceEntity;if(!p)return;const id=(ev.message||"").trim()||idFromItem(p.getComponent("minecraft:equippable")?.getEquipment("Mainhand"));const w=WEAPONS[id];if(w?.modularInput){startReload(p,w);}});
