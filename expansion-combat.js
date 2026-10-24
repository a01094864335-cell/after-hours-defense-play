'use strict';
function freshExpansionState(){return {serial:1,mines:[],supportClock:0,lastSupplyWave:0,freeSummon:0,qWaves:[]};}
let expansionState=freshExpansionState();
function expansionID(entity){if(!entity.expansionID)entity.expansionID=expansionState.serial++;return entity.expansionID;}
function expansionType(type){return type>=12&&type<17;}
function adjacentCells(index){return cells.map((_,i)=>i).filter(i=>Math.abs(i%5-index%5)+Math.abs(Math.floor(i/5)-Math.floor(index/5))===1);}
function expansionObject(type){return ['arrow','wrench','bubble','coin','bolt','parcel','syringe','soup','fang','needle','moon','stamp',...NightExpansion.staff.map(k=>k.object)][type];}
function objectFlight(object,from,to,color,skill=false){
 if(fx.length>600)return;
 burst('objectFlight',from.x,from.y,color,skill?.65:.42,{object,tx:to.x,ty:to.y,skill});
}
function objectImpact(object,x,y,color,skill=false){if(fx.length<600)burst('objectImpact',x,y,color,skill?.8:.4,{object,skill});}
function effectText(x,y,text,color){fx.push({x,y,life:.9,max:.9,text,color});}
function pathPosition(progress){
 let d=Math.max(0,progress),segment=0;
 for(let i=0;i<path.length-1;i++){const a=path[i],b=path[i+1],length=Math.hypot(b.x-a.x,b.y-a.y);if(d<=length||i===path.length-2){const t=Math.min(1,d/length);return {x:a.x+(b.x-a.x)*t,y:a.y+(b.y-a.y)*t,segment:i};}d-=length;segment++;}
 return {...path.at(-1),segment};
}
function pushEnemy(e,distance){
 if(e.type==='boss'||e.pushCooldown>0)return false;
 e.progress=Math.max(0,e.progress-distance);Object.assign(e,pathPosition(e.progress));e.pushCooldown=4;
 objectImpact('magnet',e.x,e.y-14,'#f1ac75');return true;
}
function staffCooldownRate(index){
 let bonus=0;
 for(const i of adjacentCells(index)){const u=board[i];if(u&&u.type===16&&!u.stun)bonus=Math.max(bonus,Math.min(.3,.12+(u.pip-1)*.025+trainingTier()*.005));}
 return 1+bonus;
}
function expansionStaffUpdate(dt){
 board.forEach((u,i)=>{
  if(!u||u.stun>0)return;
  if(u.pip>=5&&u.type!==16)u.skillCD=Math.max(0,(u.skillCD||0)-dt*(staffCooldownRate(i)-1));
  if(u.type!==16)return;
  u.mailClock=Math.max(0,(u.mailClock||0)-dt);
  const recipient=adjacentCells(i).find(j=>board[j]&&board[j].type!==16&&board[j].pip>=5&&board[j].skillCD>0);
  if(recipient!==undefined&&u.mailClock===0){u.mailClock=2;Motion.start(u,'attack',.65);objectFlight('letter',{x:cells[i].x,y:cells[i].y-25},{x:cells[recipient].x,y:cells[recipient].y-25},'#f6a9bf');}
 });
}
function plantMine(u,index,progress,damage,skill=false){
 const owner=expansionID(u),owned=expansionState.mines.filter(m=>m.owner===owner);
 if(owned.length>=(skill?3:2)||expansionState.mines.length>=45)return false;
 const p=pathPosition(progress);
 expansionState.mines.push({owner,x:p.x,y:p.y,progress,age:0,life:12,damage,radius:skill?70:52,skill});
 objectFlight('mine',{x:cells[index].x,y:cells[index].y-25},{x:p.x,y:p.y},'#e9bc64');return true;
}
function expansionAttack(u,index,target,damage){
 const live=enemies.filter(e=>e.hp>0&&!e.escaped),k=kinds[u.type],tier=trainingTier();
 if(!live.length)return;
 if(u.type===12){target=live.filter(e=>e.shield>0).sort((a,b)=>b.progress-a.progress)[0]||target;const bonus=Math.min(target.shield||0,damage*(1.5+tier*.1));hitEnemy(target,damage+bonus,false);}
 if(u.type===13){hitEnemy(target,damage,false);pushEnemy(target,20+tier*2);}
 if(u.type===14){plantMine(u,index,target.progress+35,damage*(1+(u.pip-1)*.12));return;}
 if(u.type===15){const id=expansionID(target);u.focus=u.focusTarget===id?Math.min(5,(u.focus||0)+1):0;u.focusTarget=id;hitEnemy(target,damage*(1+u.focus*(.12+tier*.01)),false);objectImpact('camera',target.x,target.y-14,k.color);}
 if(u.type!==16)objectFlight(k.object,{x:cells[index].x,y:cells[index].y-25},{x:target.x,y:target.y-14},k.color);
}
function expansionSkill(u,power){
 const index=board.indexOf(u),p=cells[index];if(!p)return;
 const living=enemies.filter(e=>e.hp>0&&!e.escaped).sort((a,b)=>b.progress-a.progress),tier=trainingTier(),k=kinds[u.type];
 if(u.type===12)for(const e of living.slice(0,5)){const base=u.pip*18*power;hitEnemy(e,base+Math.min(e.shield||0,base*(2+tier*.1)),false);objectFlight('scroll',{x:p.x,y:p.y-25},{x:e.x,y:e.y-14},k.color,true);}
 if(u.type===13)for(const e of living){hitEnemy(e,u.pip*12*power,false);if(e.type!=='boss'){pushEnemy(e,45+tier*3);e.slow=Math.max(e.slow||0,2);}objectImpact('magnet',e.x,e.y-14,k.color,true);}
 if(u.type===14){const owner=expansionID(u);expansionState.mines=expansionState.mines.filter(m=>m.owner!==owner);const origin=living[0]?.progress||0;for(let n=0;n<3;n++)plantMine(u,index,origin+25+n*65,u.pip*20*power*(1+tier*.05),true);}
 if(u.type===15){const e=living[0];if(e){u.focusTarget=expansionID(e);for(let n=0;n<6&&e.hp>0;n++){u.focus=Math.min(5,(u.focus||0)+1);hitEnemy(e,u.pip*18*power*(1+u.focus*(.12+tier*.01)),false);}objectFlight('camera',{x:p.x,y:p.y-25},{x:e.x,y:e.y-14},k.color,true);}}
 if(u.type===16)for(const i of adjacentCells(index)){const other=board[i];if(!other||other.type===16||other.pip<5||!other.skillCD)continue;const amount=Math.min(6+tier*.25,other.skillCD*.3);other.skillCD-=amount;objectFlight('letter',{x:p.x,y:p.y-25},{x:cells[i].x,y:cells[i].y-25},k.color,true);effectText(cells[i].x,cells[i].y,'결재 완료!','#f6a9bf');}
}
function expansionUpdate(dt){
 expansionStaffUpdate(dt);
 for(const e of enemies){e.pushCooldown=Math.max(0,(e.pushCooldown||0)-dt);e.qMark=Math.max(0,(e.qMark||0)-dt);}
 for(const mine of expansionState.mines){
  mine.age+=dt;mine.life-=dt;if(mine.life<=0||mine.age<.45)continue;
  if(!enemies.some(e=>e.hp>0&&!e.escaped&&Math.abs(e.progress-mine.progress)<32))continue;
  mine.life=0;const previous=typeof attackOwner==='undefined'?null:attackOwner;if(typeof attackOwner!=='undefined')attackOwner=14;
  for(const e of enemies)if(e.hp>0&&!e.escaped&&Math.hypot(e.x-mine.x,e.y-mine.y)<=mine.radius)hitEnemy(e,mine.damage,false);
  if(typeof attackOwner!=='undefined')attackOwner=previous;objectImpact('mine',mine.x,mine.y,'#ffc875',true);effectText(mine.x,mine.y,'펑!','#ffd485');
 }
 expansionState.mines=expansionState.mines.filter(m=>m.life>0);
 if(!['chikchik','banchang','coco','q'].includes(activeMerc))return;
 const tier=trainingTier('merc'),k=NightExpansion.mercs.find(m=>m.id===activeMerc),origin={x:300,y:535};
 if(activeMerc==='chikchik'&&wave>0&&wave%5===0&&expansionState.lastSupplyWave!==wave){expansionState.lastSupplyWave=wave;expansionState.freeSummon=1;cueMercenary();objectImpact('train',300,535,k.color,true);say('칙칙: 보급 도착! 다음 직원 소환은 무료예요.');}
 if(activeMerc==='q')for(const e of enemies){if(e.type!=='boss'||e.decoy||e.hp<=0||expansionState.qWaves.includes(wave))continue;expansionState.qWaves.push(wave);e.qMark=6+tier*.5;e.qBonus=.2+tier*.025;cueMercenary();objectFlight('horn',origin,{x:e.x,y:e.y-15},k.color,true);effectText(e.x,e.y,'집중 사격!','#d9bbff');}
 expansionState.supportClock=Math.max(0,expansionState.supportClock-dt);
 if(expansionState.supportClock>0)return;
 if(activeMerc==='banchang'){
  const targets=board.map((u,i)=>({u,i})).filter(v=>v.u?.stun>0).sort((a,b)=>b.u.stun-a.u.stun).slice(0,trainingLevel('merc')>=20?2:1);
  if(targets.length){for(const {u,i} of targets){u.stun=0;Motion.start(u,'skill',.45);objectFlight('potion',origin,{x:cells[i].x,y:cells[i].y-25},k.color,true);effectText(cells[i].x,cells[i].y,'괜찮아요!','#9de5c7');}cueMercenary();expansionState.supportClock=8-tier*.5;}
 }
 if(activeMerc==='coco'){
  const targets=enemies.filter(e=>e.hp>0&&e.type!=='boss'&&!e.escaped).sort((a,b)=>b.progress-a.progress).slice(0,3+(trainingLevel('merc')>=20?1:0));
  if(targets.length){for(const e of targets){e.freeze=Math.max(e.freeze||0,1+tier*.1);objectFlight('sonar',origin,{x:e.x,y:e.y-14},k.color,true);}cueMercenary();expansionState.supportClock=10-tier*.5;effectText(300,535,'멍!','#e9c88b');}
 }
}
function expansionMercDescription(key,battle=false){
 const level=trainingLevel('merc',battle),tier=trainingTier('merc',level);
 if(key==='chikchik')return '5웨이브마다 소환 1회 무료 · 상한 1회'+(tier?' · 사용 시 +'+tier*3+' SP':'')+(battle?' · 보유 '+expansionState.freeSummon+'회':'');
 if(key==='banchang')return (8-tier*.5)+'초마다 기절한 직원 '+(level>=20?2:1)+'명 정화 · 대상 없으면 대기';
 if(key==='coco')return (10-tier*.5)+'초마다 선두 일반 적 '+(level>=20?4:3)+'명 '+(1+tier*.1).toFixed(1)+'초 정지';
 if(key==='q')return '군단장 등장 후 '+(6+tier*.5)+'초간 직원 피해 +'+Math.round((.2+tier*.025)*100)+'% · 분신 제외';
 return null;
}
function restoreExpansionState(value){
 if(value===undefined)return freshExpansionState();
 const s=JSON.parse(JSON.stringify(value));
 if(!s||!Number.isSafeInteger(s.serial)||s.serial<1||!Array.isArray(s.mines)||s.mines.length>45||!Number.isFinite(s.supportClock)||s.supportClock<0||s.supportClock>15||![0,1].includes(s.freeSummon)||!Number.isInteger(s.lastSupplyWave)||s.lastSupplyWave<0||!Array.isArray(s.qWaves)||s.qWaves.some(n=>!Number.isInteger(n)||n<1))throw Error('invalid expansion state');
 for(const m of s.mines)if(!['owner','x','y','progress','age','life','damage','radius'].every(k=>Number.isFinite(m[k])&&m[k]>=0)||m.life>12||m.radius>70||m.x>600||m.y>600)throw Error('invalid mine');
 return s;
}
// Object glyphs are drawn with canvas primitives, keeping projectiles legible at phone size.
function drawObject(object,x,y,color,scale=1,angle=0,surface=ctx){
 const ctx=surface;
 const pixel=(x,y,w,h,color)=>{ctx.fillStyle=color;ctx.fillRect(Math.round(x),Math.round(y),w,h)};
 const spark=(x,y,r,color)=>{pixel(x-2,y-r,4,r*2,color);pixel(x-r,y-2,r*2,4,color)};
 ctx.save();ctx.translate(Math.round(x),Math.round(y));ctx.rotate(angle);ctx.scale(scale,scale);ctx.lineWidth=2;ctx.strokeStyle='#32253f';ctx.fillStyle=color;
 const block=(x,y,w,h,c)=>pixel(x,y,w,h,c||color);
 if(object==='arrow'){
  block(-14,-2,23,4,'#b98957');block(10,-4,4,8,'#e4d8b6');block(14,-2,4,4,'#fff4d8');block(-13,-6,5,12,color);
 }else if(object==='wrench'){
  block(-3,-7,6,20,'#b2c0d3');block(-8,-13,5,10,'#d9e1ed');block(3,-13,5,10,'#d9e1ed');block(-8,-6,16,5,'#b2c0d3');block(-1,8,2,3,'#5a647b');
 }else if(object==='bubble'){
  ctx.strokeStyle=color;ctx.beginPath();ctx.arc(0,0,11,0,Math.PI*2);ctx.stroke();block(-5,-6,4,3,'#e6ffff');ctx.beginPath();ctx.arc(11,-10,4,0,Math.PI*2);ctx.stroke();
 }else if(object==='bolt'){
  ctx.beginPath();ctx.moveTo(1,-15);ctx.lineTo(-10,2);ctx.lineTo(-1,2);ctx.lineTo(-4,15);ctx.lineTo(11,-4);ctx.lineTo(3,-4);ctx.closePath();ctx.fill();
 }else if(object==='parcel'){
  block(-11,-9,22,19,'#bc936b');block(-11,-9,22,5,'#e0ba85');block(-2,-9,4,19,color);block(4,0,5,5,'#fff0c9');
 }else if(object==='letter'||object==='scroll'){
  block(-10,-7,20,14,'#fff0cd');block(-11,-8,22,2,'#b98458');block(-11,6,22,2,'#b98458');
  ctx.strokeStyle='#c99b75';ctx.beginPath();ctx.moveTo(-8,-5);ctx.lineTo(0,1);ctx.lineTo(8,-5);ctx.stroke();block(-2,-1,5,5,object==='scroll'?'#be405d':'#e9ae58');
 }else if(object==='magnet'){
  block(-9,-9,6,15,'#db667b');block(3,-9,6,15,'#78bce1');block(-9,4,18,6,'#b9bdd5');block(-9,-10,6,4,'#f4edee');block(3,-10,6,4,'#f4edee');
 }else if(object==='mine'){
  block(-10,-4,20,10,'#826446');block(-8,-7,16,11,'#dca650');block(-4,-10,8,4,'#f1d88c');block(-2,-8,4,3,'#f4746d');block(-6,4,3,4,'#423c4b');block(3,4,3,4,'#423c4b');
 }else if(object==='camera'){
  ctx.strokeStyle='#b8eeff';ctx.strokeRect(-12,-10,24,20);block(-4,-4,8,8,'#fff0bd');spark(0,0,11,'#effbff');
 }else if(object==='potion'||object==='syringe'){
  block(-3,-12,6,5,'#f3d994');block(-5,-7,10,4,'#eafbf6');block(-8,-3,16,13,object==='potion'?'#78dfbd':'#cd96df');block(-4,0,3,3,'#fff4d8');block(1,0,3,3,'#fff4d8');block(-2,3,5,3,'#fff4d8');block(0,6,1,2,'#fff4d8');
 }else if(object==='soup'){
  block(-10,-3,20,10,'#ae6b45');block(-8,-5,16,4,'#f48657');block(-5,-10,3,4,'#fff1bf');block(3,-13,3,6,'#fff1bf');
 }else if(object==='fang'){
  block(-11,-8,22,16,'#b58754');block(-9,-2,18,8,'#39243e');for(let i=-7;i<8;i+=5)block(i,-3,3,4,'#fff3ce');block(-11,-2,22,2,'#edc86c');
 }else if(object==='needle'){
  ctx.strokeStyle='#e7d8ff';ctx.beginPath();ctx.moveTo(-13,5);ctx.lineTo(12,-5);ctx.stroke();block(8,-6,5,3,'#f9edff');ctx.strokeStyle=color;ctx.beginPath();ctx.arc(-10,7,7,0,Math.PI);ctx.stroke();
 }else if(object==='moon'){
  ctx.fillStyle='#e4ccff';ctx.beginPath();ctx.arc(0,0,9,0,Math.PI*2);ctx.fill();ctx.fillStyle='#68508f';ctx.beginPath();ctx.arc(5,-3,7,0,Math.PI*2);ctx.fill();spark(12,-7,3,'#ffe8a7');
 }else if(object==='train'){
  block(-17,-5,31,12,'#69b7df');block(-15,-14,10,12,'#4567a0');block(6,-13,5,8,'#d9ac61');block(-15,-12,7,5,'#fff0b0');for(let i=-12;i<=12;i+=8){ctx.fillStyle='#dfb36b';ctx.beginPath();ctx.arc(i,9,4,0,Math.PI*2);ctx.fill();}
 }else if(object==='horn'||object==='sonar'){
  ctx.strokeStyle=color;for(let i=0;i<3;i++){ctx.beginPath();ctx.arc(-8,0,8+i*5,-.8,.8);ctx.stroke();}if(object==='horn'){block(-12,-3,12,6,'#eac47b');block(-2,-7,6,14,'#f9db91');}
 }else if(object==='stamp'){
  block(-4,-12,8,10,'#ae4563');block(-9,-2,18,8,'#d7ad69');block(-11,6,22,2,'#ec7c8c');
 }else if(object==='coin'){
  block(-7,-9,14,18,'#ca9147');block(-5,-7,10,14,'#ffdc84');block(-1,-4,2,8,'#fff1bf');
 }else {spark(0,0,8,color);}
 ctx.restore();
}
function drawObjectImpact(object,x,y,color,t,skill=false){
 const calm=reduce?.matches,r=8+(calm?12:t*28)*(skill?1.4:1);ctx.globalAlpha*=1-t;
 if(object==='camera'){
  ctx.strokeStyle='#d7f7ff';ctx.lineWidth=2;for(const dx of [-1,1])for(const dy of [-1,1]){ctx.beginPath();ctx.moveTo(x+dx*r,y+dy*(r-7));ctx.lineTo(x+dx*r,y+dy*r);ctx.lineTo(x+dx*(r-7),y+dy*r);ctx.stroke();}
  if(t<.22&&!calm){ctx.fillStyle='#fff5ce';ctx.globalAlpha*=.65;ctx.fillRect(x-13,y-13,26,26);}
 }else if(object==='scroll'||object==='stamp'){
  ctx.strokeStyle='#ef8d99';ctx.lineWidth=3;ctx.strokeRect(x-r/2,y-r/2,r,r);ctx.font='bold 10px system-ui';ctx.fillStyle='#ffe3d2';ctx.fillText('반려',x,y+3);
 }else if(object==='needle'){
  ctx.strokeStyle='#d8c7f1';ctx.lineWidth=1;for(let n=0;n<6;n++){const a=n*Math.PI/3;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+Math.cos(a)*r,y+Math.sin(a)*r);ctx.stroke();}ctx.beginPath();ctx.arc(x,y,r*.65,0,Math.PI*2);ctx.stroke();
 }else if(['magnet','sonar','horn'].includes(object)){
  ctx.strokeStyle=color;ctx.lineWidth=2;for(let i=0;i<3;i++){ctx.beginPath();ctx.arc(x,y,r+i*5,0,Math.PI*2);ctx.stroke();}
 }else if(object==='mine'||object==='soup'){
  for(let n=0;n<8;n++){const a=n*Math.PI/4;pixel(x+Math.cos(a)*r-3,y+Math.sin(a)*r-3,6,6,n%2?'#ffdd8a':color);}spark(x,y,12*(1-t)+2,'#fff0be');
 }else if(object==='potion'||object==='syringe'||object==='letter'){
  for(let n=0;n<4;n++){const a=n*Math.PI/2;drawObject(object,x+Math.cos(a)*r,y+Math.sin(a)*r-t*15,color,.35);}
 }else{for(let n=0;n<5;n++){const a=n*1.256;spark(x+Math.cos(a)*r,y+Math.sin(a)*r,3,color);}}
}
function drawExpansionEffect(f,t){
 if(f.effect==='objectImpact'){drawObjectImpact(f.object,f.x,f.y,f.color,t,f.skill);return true;}
 if(f.effect!=='objectFlight')return false;
 const travel=Math.min(1,t/.66),calm=reduce?.matches;
 if(t<.66){const arc=calm?0:Math.sin(travel*Math.PI)*(['mine','soup','potion'].includes(f.object)?38:12),x=f.x+(f.tx-f.x)*travel,y=f.y+(f.ty-f.y)*travel-arc;
  if(!calm){ctx.globalAlpha=.3;ctx.strokeStyle=f.color;ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(x-(f.tx-f.x)*.07,y-(f.ty-f.y)*.07);ctx.lineTo(x,y);ctx.stroke();ctx.globalAlpha=1;}
  drawObject(f.object,x,y,f.color,f.skill?1.1:.8,calm?0:['mine','magnet','needle'].includes(f.object)?travel*3:0);
 }else drawObjectImpact(f.object,f.tx,f.ty,f.color,(t-.66)/.34,f.skill);
 return true;
}
function drawExpansionFields(){
 for(const m of expansionState.mines){ctx.save();ctx.globalAlpha=m.age<.45?.45:Math.min(1,m.life);drawObject('mine',m.x,m.y,'#e9bc64',.7);if(!reduce?.matches&&Math.floor(time*4)%2===0)pixel(m.x-1,m.y-7,3,3,'#ff8a75');ctx.restore();}
 const linked=new Set();
 for(const e of enemies){if(e.hp<=0)continue;if(e.qMark>0)drawObjectImpact('camera',e.x,e.y-18,'#d5b0ee',.35,true);
  if(e.linkTime>0)for(const peer of enemies){const pair=[expansionID(e),expansionID(peer)].sort((a,b)=>a-b).join(':');if(peer===e||peer.hp<=0||peer.linkTime<=0||peer.linkGroup!==e.linkGroup||linked.has(pair))continue;linked.add(pair);ctx.save();ctx.strokeStyle='#d4bafa88';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(e.x,e.y-15);ctx.lineTo(peer.x,peer.y-15);ctx.stroke();ctx.restore();}
 }
 ctx.globalAlpha=1;
}
