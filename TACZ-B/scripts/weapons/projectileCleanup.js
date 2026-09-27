import { system, world } from "@minecraft/server";
import { profileCount } from "../debug/profiler.js";
const CLEANUP = Object.freeze({ "bullet:rpg": 10, "bullet:m320": 100 });
world.afterEvents.entitySpawn.subscribe((event) => {
 const entity=event.entity; const ticks=CLEANUP[entity?.typeId]; if(!ticks)return;
 profileCount(entity.typeId==="bullet:rpg"?"rpgSpawns":"m320Spawns");
 system.runTimeout(()=>{try{entity.remove();}catch{}},ticks);
});
