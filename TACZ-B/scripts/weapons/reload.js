import { system } from "@minecraft/server";
import { countInventoryItem, consumeInventoryItem, getMagazineAmmo, setMagazineAmmo } from "./ammo.js";
import { getPlayerState } from "../players/playerState.js";
export function startReload(player, weapon) {
 const st=getPlayerState(player); if(st.reloading)return false; const mag=getMagazineAmmo(player,weapon), cap=weapon.magazineSize??0; if(mag>=cap)return false; const reserve=countInventoryItem(player,weapon.ammoItem); if(reserve<=0)return false;
 const tactical=mag>0; const seconds=tactical?(weapon.reload?.tactical??weapon.reload?.empty??1):(weapon.reload?.empty??1); const ticks=Math.max(1,Math.round(seconds*20)); st.reloading=true; st.firing=false; st.fireToken++;
 try{ player.playAnimation(`animation.tacz.${weapon.id}.${tactical?'reload_tactical':'reload_empty'}`,{blendOutTime:0.05}); }catch{}
 try{ player.playSound?.(`tacz.java.${weapon.id}.${tactical?'reload_tactical':'reload_empty'}`); }catch{}
 system.runTimeout(()=>{ try { const now=getMagazineAmmo(player,weapon), need=Math.max(0,cap-now), take=Math.min(need,countInventoryItem(player,weapon.ammoItem)); const used=consumeInventoryItem(player,weapon.ammoItem,take); setMagazineAmmo(player,weapon,now+used); st.reloading=false; } catch { st.reloading=false; } },ticks); return true;
}
