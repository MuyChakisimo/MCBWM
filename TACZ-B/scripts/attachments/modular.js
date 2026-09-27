import { system, world } from "@minecraft/server";
import { ActionFormData } from "@minecraft/server-ui";
import { JAVA_ATTACHMENTS } from "../config/javaAttachments.js";
import { WEAPONS } from "../config/weapons.js";
import { createLogger } from "../debug/logger.js";

const log = createLogger("Attachments");
const PROPERTY = "tacz:modular_attachments";

// Parsed attachment selections keyed by player id. This module is the only
// writer of PROPERTY, so the cache is filled on first read, replaced on every
// write and dropped when the player leaves. Firing reads it on every shot,
// which previously cost a dynamic-property read + JSON.parse per shot.
const cache = new Map();

function readAll(player) {
  const cached = cache.get(player.id);
  if (cached) return cached;
  let all = {};
  try {
    const raw = player.getDynamicProperty(PROPERTY);
    if (typeof raw === "string" && raw.length) all = JSON.parse(raw);
  } catch (error) {
    log.error(`Could not read ${PROPERTY} for ${player.name}; using empty selection.`, error);
  }
  cache.set(player.id, all);
  return all;
}
function writeAll(player, all) {
  cache.set(player.id, all);
  try {
    player.setDynamicProperty(PROPERTY, JSON.stringify(all));
  } catch (error) {
    log.error(`Could not persist ${PROPERTY} for ${player.name}.`, error);
  }
  log.debug("attachments changed", player.name, all);
}

world.afterEvents.playerLeave.subscribe((event) => cache.delete(event.playerId));
export function getWeaponAttachments(player, weaponId) {
  return readAll(player)[weaponId] ?? {};
}
export function setWeaponAttachment(player, weaponId, type, attachmentId) {
  const all=readAll(player); const slots={...(all[weaponId]??{})};
  if (attachmentId) slots[type]=attachmentId; else delete slots[type];
  all[weaponId]=slots; writeAll(player,all); return slots;
}
function applyScalar(value, rule) {
  if (!rule || typeof rule !== "object") return value;
  if (typeof rule.multiplier === "number") value *= rule.multiplier;
  if (typeof rule.addend === "number") value += rule.addend;
  return value;
}
export function getEffectiveWeapon(player, base) {
  const selected=getWeaponAttachments(player,base.id); const w={...base, spread:{...(base.spread??{})}};
  let magLevel=0;
  for (const attachmentId of Object.values(selected)) {
    const a=JAVA_ATTACHMENTS[attachmentId]; if(!a)continue; const d=a.data??{};
    w.damage=applyScalar(w.damage,d.damage);
    w.penetration=applyScalar(w.penetration,d.armor_ignore);
    w.headshotMultiplier=applyScalar(w.headshotMultiplier,d.head_shot);
    w.range=applyScalar(w.range,d.effective_range);
    w.rpm=applyScalar(w.rpm,d.rpm);
    w.spread.hip=applyScalar(w.spread.hip,d.inaccuracy);
    w.spread.ads=applyScalar(w.spread.ads,d.aim_inaccuracy);
    if (typeof d.extended_mag_level === "number") magLevel=Math.max(magLevel,d.extended_mag_level);
  }
  if (magLevel>0 && Array.isArray(base.extendedMagSizes) && base.extendedMagSizes.length) {
    w.magazineSize=base.extendedMagSizes[Math.min(base.extendedMagSizes.length,magLevel)-1] ?? base.magazineSize;
  }
  return w;
}
function heldWeapon(player) {
  const item=player.getComponent("minecraft:equippable")?.getEquipment("Mainhand");
  const id=item?.typeId?.startsWith("krep:")?item.typeId.slice(5).replace(/_emp$/,""):undefined;
  const weapon=id?WEAPONS[id]:undefined; return weapon?.modularInput?{id,weapon}:undefined;
}
function compatibleAttachments(weapon,type) {
  return Object.values(JAVA_ATTACHMENTS).filter(a=>a.type===type);
}
async function openType(player,id,weapon,type) {
  const current=getWeaponAttachments(player,id)[type]; const list=compatibleAttachments(weapon,type);
  const form=new ActionFormData().title(`${weapon.name} — ${type.replace('_',' ')}`).body("Java TACZ attachment data is active. Visual mounting is converted separately.").button(current?`Remove current\n${JAVA_ATTACHMENTS[current]?.name??current}`:"None / remove");
  for(const a of list) form.button(a.name);
  const r=await form.show(player); if(r.canceled)return;
  if(r.selection===0)setWeaponAttachment(player,id,type,undefined); else setWeaponAttachment(player,id,type,list[r.selection-1].id);
}
async function openMain(player) {
  const h=heldWeapon(player); if(!h)return; const {id,weapon}=h;
  const types=[...new Set((weapon.allowedAttachmentTypes??[]).map(t=>t==='sight'?'scope':t))].filter(t=>['scope','grip','stock','muzzle','laser','extended_mag','ammo','bayonet','barrel'].includes(t));
  const selected=getWeaponAttachments(player,id); const form=new ActionFormData().title(`${weapon.name} Attachments`).body("Select an attachment slot. Imported Java stat modifiers are applied immediately.");
  for(const type of types) form.button(`${type.replace('_',' ')}\n${selected[type]?JAVA_ATTACHMENTS[selected[type]]?.name??selected[type]:'None'}`);
  const r=await form.show(player); if(r.canceled||r.selection===undefined)return; await openType(player,id,weapon,types[r.selection]);
}
const signal=world.beforeEvents.playerInteractWithBlock;
if(signal?.subscribe){signal.subscribe(ev=>{if(ev.block?.typeId!=="krep:attachmentblock"||!ev.isFirstEvent)return; const h=heldWeapon(ev.player); if(!h)return; ev.cancel=true; system.run(()=>openMain(ev.player).catch(()=>{}));});}
system.afterEvents.scriptEventReceive.subscribe(ev=>{if(ev.id!=="tacz:attachments")return;const p=ev.sourceEntity;if(p)system.run(()=>openMain(p).catch(()=>{}));});
