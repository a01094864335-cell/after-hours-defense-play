'use strict';
// Only the strongest adjacent recruiter applies; grades and equipment both matter.
function staffHaste(index){let bonus=0;board.forEach((u,i)=>{if(u&&u.type===11&&!u.stun&&Math.abs(i%5-index%5)+Math.abs(Math.floor(i/5)-Math.floor(index/5))===1)bonus=Math.max(bonus,.12+(u.pip-1)*.03+(levels[11]-1)*.02)});return 1+Math.min(.38,bonus)}
function ensureStaffEffects(e){
 if(!e.markEffects)e.markEffects=e.vulnerable>0?[{time:e.vulnerable,value:e.vulnerability||1.25}]:[];
 if(!e.burnEffects)e.burnEffects=e.burnTime>0?[{time:e.burnTime,value:e.burnDPS,owner:7}]:[];
}
function refreshStaffEffect(list,duration,value,owner){const effect=list.find(v=>v.value===value);if(effect){effect.time=Math.max(effect.time,duration);effect.owner=owner}else list.push({time:duration,value,owner})}
function syncStaffEffects(e){e.vulnerable=Math.max(0,...e.markEffects.map(v=>v.time));e.vulnerability=Math.max(1,...e.markEffects.map(v=>v.value));e.burnTime=Math.max(0,...e.burnEffects.map(v=>v.time));e.burnDPS=Math.max(0,...e.burnEffects.map(v=>v.value))}
function markEnemy(e,duration,multiplier){ensureStaffEffects(e);refreshStaffEffect(e.markEffects,duration,multiplier,6);syncStaffEffects(e);burst('heal',e.x,e.y-15,'#eda1dc',.6)}
function burnEnemy(e,duration,dps){ensureStaffEffects(e);refreshStaffEffect(e.burnEffects,duration,dps,7);syncStaffEffects(e);burst('smoke',e.x,e.y-12,'#efa16e',.45)}
let staffLinkId=0;
function linkEnemies(targets,duration,skill=false){if(!skill&&targets.some(e=>e.linkTime>0&&e.linkPriority===2))return;const group=++staffLinkId;for(const e of targets){e.linkGroup=group;e.linkTime=duration;e.linkPriority=skill?2:1;burst('shuffle',e.x,e.y-15,'#c9b2f0',.6)}}
function extraEnemyUpdate(e,dt){
 ensureStaffEffects(e);
 // Split ticks at effect expiry so a strong burn never lasts beyond its own timer.
 let remaining=dt;
 while(remaining>1e-9&&e.burnEffects.length){const step=Math.min(remaining,...e.burnEffects.map(v=>v.time));const strongest=e.burnEffects.reduce((a,b)=>a.value>=b.value?a:b);const previous=typeof attackOwner==='undefined'?null:attackOwner;if(typeof attackOwner!=='undefined')attackOwner=strongest.owner??7;hitEnemy(e,strongest.value*step,false);if(typeof attackOwner!=='undefined')attackOwner=previous;for(const effect of e.burnEffects)effect.time-=step;e.burnEffects=e.burnEffects.filter(v=>v.time>1e-9);remaining-=step}
 for(const effect of e.markEffects)effect.time-=dt;e.markEffects=e.markEffects.filter(v=>v.time>1e-9);syncStaffEffects(e);
 e.counselDelayCD=Math.max(0,(e.counselDelayCD||0)-dt);e.silence=Math.max(0,(e.silence||0)-dt);e.linkTime=Math.max(0,(e.linkTime||0)-dt);if(!e.linkTime)e.linkGroup=null;
}
function extraAttack(u,i,target,damage){
 const living=enemies.filter(e=>e.hp>0);let victim=target;
 if(u.type===8)victim=living.sort((a,b)=>a.hp/a.max-b.hp/b.max)[0];
 if(!victim)return;
 const pip=u.pip||1,power=1+(levels[u.type]-1)*.45;
 if(u.type===6)markEnemy(victim,4,Math.min(1.35,1.25+(pip-1)*.01+(levels[6]-1)*.01));
 if(u.type===7)burnEnemy(victim,4,6*(1+(pip-1)*.3)*power);
 if(u.type===9)linkEnemies([victim,...living.filter(e=>e!==victim).sort((a,b)=>Math.hypot(a.x-victim.x,a.y-victim.y)-Math.hypot(b.x-victim.x,b.y-victim.y)).slice(0,1)],4);
 if(u.type===10&&!(victim.counselDelayCD>0)){victim.skill=Math.min(victim.skill+(victim.type==='boss'?.2:.5),8);victim.counselDelayCD=2;burst('charge',victim.x,victim.y-15,'#baaceb',.4)}
 hitEnemy(victim,damage*(u.type===8&&victim.hp/victim.max<=.3?2:1),false);
 fx.push({x:cells[i].x,y:cells[i].y-25,tx:victim.x,ty:victim.y-14,life:.42,max:.42,type:u.type===7?2:u.type===8?6:4,color:kinds[u.type].color});
}
function extraSkill(u,power){
 const living=enemies.filter(e=>e.hp>0);
 if(u.type===6){const e=living.sort((a,b)=>b.hp-a.hp)[0];if(e)markEnemy(e,6,Math.min(1.72,1.6+Math.max(0,u.pip-5)*.02+(levels[6]-1)*.02))}
 if(u.type===7)for(const e of living)burnEnemy(e,6,u.pip*8*power);
 if(u.type===8){const e=living.sort((a,b)=>a.hp/a.max-b.hp/b.max)[0];if(e){if(e.type!=='boss'&&e.hp/e.max<=.3)hitEnemy(e,e.hp+(e.shield||0),false);else hitEnemy(e,u.pip*45*power,false);burst('smoke',e.x,e.y-15,'#d5a26f',.7)}}
 if(u.type===9)linkEnemies(living.sort((a,b)=>b.progress-a.progress).slice(0,5),6,true);
 if(u.type===10)for(const e of living){e.silence=Math.max(e.silence||0,e.type==='boss'?1.5:4);burst('charge',e.x,e.y-15,'#baaceb',.8)}
 if(u.type===11){const empty=board.map((v,i)=>v?-1:i).filter(i=>i>=0);if(empty.length){const i=empty[Math.floor(Math.random()*empty.length)];board[i]={type:randomType(),pip:u.pip>=7?2:1,cool:0,attack:0,arrival:.5,income:5,skillCD:0};burst('shuffle',cells[i].x,cells[i].y,'#dfbe87',.7)}}
}
