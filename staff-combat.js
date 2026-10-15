'use strict';
function staffHaste(index){return board.some((u,i)=>u&&u.type===11&&!u.stun&&Math.abs(i%5-index%5)+Math.abs(Math.floor(i/5)-Math.floor(index/5))===1)?1.2:1}
function markEnemy(e,duration,multiplier){e.vulnerable=Math.max(e.vulnerable||0,duration);e.vulnerability=Math.max(e.vulnerability||1,multiplier);burst('heal',e.x,e.y-15,'#eda1dc',.6)}
function burnEnemy(e,duration,dps){e.burnTime=Math.max(e.burnTime||0,duration);e.burnDPS=Math.max(e.burnDPS||0,dps);burst('smoke',e.x,e.y-12,'#efa16e',.45)}
let staffLinkId=0;
function linkEnemies(targets,duration){const group=++staffLinkId;for(const e of targets){e.linkGroup=group;e.linkTime=duration;burst('shuffle',e.x,e.y-15,'#c9b2f0',.6)}}
function extraEnemyUpdate(e,dt){
 e.vulnerable=Math.max(0,(e.vulnerable||0)-dt);if(!e.vulnerable)e.vulnerability=1;
 e.silence=Math.max(0,(e.silence||0)-dt);e.linkTime=Math.max(0,(e.linkTime||0)-dt);if(!e.linkTime)e.linkGroup=null;
 if(e.burnTime>0){const elapsed=Math.min(e.burnTime,dt);e.burnTime=Math.max(0,e.burnTime-dt);hitEnemy(e,e.burnDPS*elapsed,false);if(!e.burnTime)e.burnDPS=0}
}
function extraAttack(u,i,target,damage){
 const living=enemies.filter(e=>e.hp>0);let victim=target;
 if(u.type===8)victim=living.sort((a,b)=>a.hp/a.max-b.hp/b.max)[0];
 if(!victim)return;
 if(u.type===6)markEnemy(victim,4,1.25);
 if(u.type===7)burnEnemy(victim,4,6*(1+(levels[u.type]-1)*.45));
 if(u.type===9)linkEnemies([victim,...living.filter(e=>e!==victim).sort((a,b)=>Math.hypot(a.x-victim.x,a.y-victim.y)-Math.hypot(b.x-victim.x,b.y-victim.y)).slice(0,1)],4);
 if(u.type===10){victim.skill=Math.min(victim.skill+.5,8);burst('charge',victim.x,victim.y-15,'#baaceb',.4)}
 hitEnemy(victim,damage*(u.type===8&&victim.hp/victim.max<=.3?2:1),false);
 fx.push({x:cells[i].x,y:cells[i].y-25,tx:victim.x,ty:victim.y-14,life:.42,max:.42,type:u.type===7?2:u.type===8?6:4,color:kinds[u.type].color});
}
function extraSkill(u,power){
 const living=enemies.filter(e=>e.hp>0);
 if(u.type===6){const e=living.sort((a,b)=>b.hp-a.hp)[0];if(e)markEnemy(e,6,1.6)}
 if(u.type===7)for(const e of living)burnEnemy(e,6,u.pip*8*power);
 if(u.type===8){const e=living.sort((a,b)=>a.hp/a.max-b.hp/b.max)[0];if(e){if(e.type!=='boss'&&e.hp/e.max<=.3)e.hp=0;else hitEnemy(e,u.pip*45*power,false);burst('smoke',e.x,e.y-15,'#d5a26f',.7)}}
 if(u.type===9)linkEnemies(living.sort((a,b)=>b.progress-a.progress).slice(0,5),6);
 if(u.type===10)for(const e of living){e.silence=4;burst('charge',e.x,e.y-15,'#baaceb',.8)}
 if(u.type===11){const empty=board.map((v,i)=>v?-1:i).filter(i=>i>=0);if(empty.length){const i=empty[Math.floor(Math.random()*empty.length)];board[i]={type:randomType(),pip:1,cool:0,attack:0,arrival:.5,income:5,skillCD:0};burst('shuffle',cells[i].x,cells[i].y,'#dfbe87',.7)}}
}
