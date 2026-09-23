import { world } from "@minecraft/server";
const objectiveCache = new Map();
function objectiveId(weaponId) { return (`tw_${weaponId}`).slice(0,16); }
export function getAmmoObjective(weaponId) {
  const id=objectiveId(weaponId); let obj=objectiveCache.get(id); if (obj) return obj;
  obj=world.scoreboard.getObjective(id); if (!obj) { try { obj=world.scoreboard.addObjective(id, `TACZ ${weaponId}`); } catch { obj=world.scoreboard.getObjective(id); } }
  if (obj) objectiveCache.set(id,obj); return obj;
}
export function getMagazineAmmo(player, weapon) { const o=getAmmoObjective(weapon.id); if (!o) return weapon.magazineSize??0; try { const v=o.getScore(player.scoreboardIdentity); return v===undefined ? initializeMagazine(player,weapon) : v; } catch { return initializeMagazine(player,weapon); } }
export function setMagazineAmmo(player, weapon, value) { const o=getAmmoObjective(weapon.id); if (!o || !player.scoreboardIdentity) return; const v=Math.max(0,Math.min(weapon.magazineSize??value,Math.floor(value))); try{o.setScore(player.scoreboardIdentity,v);}catch{} return v; }
export function initializeMagazine(player, weapon) { return setMagazineAmmo(player,weapon,weapon.magazineSize??0) ?? 0; }
export function consumeRound(player, weapon, amount=1) { const v=getMagazineAmmo(player,weapon); if(v<amount)return false; setMagazineAmmo(player,weapon,v-amount); return true; }
export function countInventoryItem(player,typeId){const c=player.getComponent("minecraft:inventory")?.container;if(!c)return 0;let n=0;for(let i=0;i<c.size;i++){const it=c.getItem(i);if(it?.typeId===typeId)n+=it.amount;}return n;}
export function consumeInventoryItem(player,typeId,amount){const c=player.getComponent("minecraft:inventory")?.container;if(!c||amount<=0)return 0;let left=amount,taken=0;for(let i=0;i<c.size&&left>0;i++){const it=c.getItem(i);if(it?.typeId!==typeId)continue;const use=Math.min(left,it.amount);left-=use;taken+=use;if(use===it.amount)c.setItem(i,undefined);else{it.amount-=use;c.setItem(i,it);}}return taken;}
