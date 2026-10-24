'use strict';
// Keep type:'boss' for rewards, resistance and old saves; bossId owns the identity.
const bossCatalog = [
 {id:'leon',name:'군단장 레온',short:'레온',file:'hero-leon',badge:'지휘',color:'#ffd580',speed:35,hp:1,cooldown:8,
  trait:'노련한 지휘관',traitText:'이동 감속 효과가 일반 용사보다 약해요.',skillName:'진격 명령',skillText:'근무 배치를 뒤섞고 모든 용사를 2초간 가속해요.',counter:'핵심 직원의 스킬을 준비하고 배치가 바뀌면 인접 지원을 확인하세요.'},
 {id:'aegis',name:'철벽 단장 아이기스',short:'아이기스',file:'commander-aegis',badge:'방벽',color:'#81e0bf',speed:29,hp:.9,cooldown:9,
  trait:'중갑 방패',traitText:'최대 체력의 30%만큼 방패를 두르고 등장해요.',skillName:'방벽 전개',skillText:'자신의 방패 20%, 가까운 용사의 방패 15%를 보충해요.',counter:'유령 배달부의 특급 배송은 방패를 무시해요.'},
 {id:'ruby',name:'홍련 창기사 루비',short:'루비',file:'commander-ruby',badge:'홍련',color:'#ff967d',speed:36,hp:.9,cooldown:9,
  trait:'불굴의 돌진',traitText:'체력이 절반 이하가 되면 이동 속도가 20% 빨라져요.',skillName:'화염 돌파',skillText:'3초간 돌진하고 예고한 세로줄의 공격 속도를 4초간 30% 낮춰요.',counter:'불이 예고된 칸에서 합성해 피하고 청소부로 돌진을 늦추세요.'},
 {id:'lumen',name:'성가대장 루멘',short:'루멘',file:'commander-lumen',badge:'축복',color:'#ffe9a3',speed:32,hp:.9,cooldown:10,
  trait:'호위의 축복',traitText:'거리 130 안에 일반 용사가 있으면 받는 피해가 20% 줄어요.',skillName:'황금 성가',skillText:'자신의 체력 6%, 거리 160 안 용사의 체력 12%를 회복해요.',counter:'시설기사의 광역 공격으로 호위를 먼저 정리하세요.'},
 {id:'neve',name:'서리 마녀 네베',short:'네베',file:'commander-neve',badge:'서리',color:'#a5e5ff',speed:33,hp:1,cooldown:9,
  trait:'얼음 망토',traitText:'청소부·전기기사 스킬의 이동 정지 시간이 절반이에요.',skillName:'서리 봉인',skillText:'등급이 가장 높은 직원의 두 칸을 예고하고 1.8초간 기절시켜요.',counter:'예고된 칸의 직원을 합성해 옮기거나 상담사로 시전을 늦추세요.'},
 {id:'mira',name:'환영 단장 미라',short:'미라',file:'commander-mira',badge:'환영',color:'#d2a9ff',speed:42,hp:.8,cooldown:10,
  trait:'가벼운 발걸음',traitText:'레온보다 20% 빠르게 이동하지만 체력이 20% 낮아요.',skillName:'거울 행진',skillText:'앞쪽에 체력 8%의 분신 둘을 만들어요. 4초 후 사라져요.',counter:'분신에는 처치 보상이 없어요. 광역·연쇄 공격으로 빠르게 걷어내세요.'},
 {id:'chrono',name:'시계기사 크로노',short:'크로노',file:'commander-chrono',badge:'태엽',color:'#efc783',speed:30,hp:1,cooldown:12,
  trait:'감기는 태엽',traitText:'등장 후 10초마다 이동 속도 +10%, 최대 +30%가 돼요.',skillName:'시간 역행',skillText:'지나온 길을 110만큼 되돌아가며 체력을 4% 회복해요.',counter:'회복 전에 5등급 스킬을 집중하고 상담사로 시전을 늦추세요.'}
];
let bossPlans={},bossWarning=null;
function bossWaveKey(w){return Math.max(5,Math.ceil(w/5)*5)}
function plannedBoss(w){return bossCatalog.find(b=>b.id===bossPlans[bossWaveKey(w)])}
function bossForWave(w){
 const key=bossWaveKey(w);
 if(!bossPlans[key])bossPlans[key]=bossCatalog[Math.floor(Math.random()*bossCatalog.length)].id;
 return plannedBoss(key);
}
function clearBossWarning(){bossWarning=null;const el=document.querySelector('#boss-warning');if(el)el.hidden=true}
function resetBossPlans(){bossPlans={};clearBossWarning()}
function readBossPlans(s){
 const plans={};
 if(s.bossPlans!==undefined){
  if(!s.bossPlans||typeof s.bossPlans!=='object'||Array.isArray(s.bossPlans))throw Error('invalid boss plans');
  for(const [key,id] of Object.entries(s.bossPlans)){
   const n=Number(key);if(!Number.isSafeInteger(n)||n<5||n%5!==0||String(n)!==key||!bossCatalog.some(b=>b.id===id))throw Error('invalid boss plan');
   plans[n]=id;
  }
 }else{
  // Preserve the already announced encounter when migrating an old fixed-order run.
  const w=s.wave%5===4?s.wave+1:s.wave;
  if(w>0&&w%5===0)plans[w]=bossCatalog[(Math.floor(w/5)-1)%bossCatalog.length].id;
 }
 const current=s.enemies.find(e=>e.type==='boss'&&!e.decoy);
 if(current&&s.wave%5===0)plans[s.wave]=bossDefinition(current).id;
 return plans;
}
function showBossWarning(w){
 const b=bossForWave(w);bossWarning={wave:w,id:b.id,left:4.5};Motion.preload(b.file);
 const el=document.querySelector('#boss-warning');if(!el)return;
 document.querySelector('#boss-warning-label').textContent='WARNING · '+w+'차 공격';
 document.querySelector('#boss-warning-name').textContent=b.name+' 등장 예정';
 document.querySelector('#boss-warning-detail').textContent=b.trait+' · '+b.skillName+'에 대비하세요!';
 el.style.borderColor=b.color;el.style.animation='none';void el.offsetWidth;el.style.animation='';
 el.hidden=paused||!playing;
}
function announceBossWave(){
 if(wave%5===4)showBossWarning(wave+1);
 else if(wave>0&&wave%5===0)showBossWarning(wave);
}
function tickBossWarning(dt){
 const el=document.querySelector('#boss-warning');if(!el)return;
 const covered=!!document.querySelector('dialog[open]')?.open;
 const visible=!!bossWarning&&playing&&!ended&&!paused&&!covered&&!document.hidden&&(typeof appScreen==='undefined'||appScreen==='battle');
 el.hidden=!visible;if(!visible)return;
 bossWarning.left-=dt;if(bossWarning.left<=0)clearBossWarning();
}
function bossDefinition(e){return bossCatalog.find(b=>b.id===e.bossId)||bossCatalog[0]}
function enemyDefinition(e){return e.type==='boss'?bossDefinition(e):legion[e.type]}
function restoreBoss(e){
 if(e.type!=='boss')return;
 e.bossId=bossDefinition(e).id;
 const indices=v=>Array.isArray(v)?[...new Set(v.filter(i=>Number.isInteger(i)&&i>=0&&i<15))]:[];
 e.warningCells=indices(e.warningCells);e.scorchCells=indices(e.scorchCells);
 e.scorchLeft=Number.isFinite(e.scorchLeft)?Math.max(0,Math.min(4,e.scorchLeft)):0;
 e.bossAge=Number.isFinite(e.bossAge)?Math.max(0,e.bossAge):0;
 e.decoy=!!e.decoy&&e.bossId==='mira';if(e.decoy)e.decoyLife=Number.isFinite(e.decoyLife)?Math.max(0,Math.min(4,e.decoyLife)):0;
 Motion.preload(bossDefinition(e).file);
}
function initBoss(e){
 const b=bossForWave(wave);e.bossId=b.id;e.speed=b.speed;e.hp*=b.hp;e.max=e.hp;
 if(bossWarning?.wave===wave)clearBossWarning();
 e.shield=b.id==='aegis'?e.max*.3:0;e.skill=b.cooldown;e.bossAge=0;e.introLeft=3.5;
 Motion.preload(b.file);say(b.name+' 등장! '+b.trait+' · '+b.skillName);
 burst('bossSeal',e.x,e.y-25,b.color,.9,{kind:b.id});
}
function bossDamage(e,damage){return e.type==='boss'&&!e.decoy&&bossDefinition(e).id==='lumen'&&enemies.some(n=>n!==e&&n.type!=='boss'&&n.hp>0&&!n.escaped&&Math.hypot(n.x-e.x,n.y-e.y)<130)?damage*.8:damage}
function bossFreezeTime(e,duration){return e.type==='boss'&&bossDefinition(e).id==='neve'?duration*.5:duration}
function bossSpeed(e){
 if(e.type!=='boss')return 1;
 const id=bossDefinition(e).id;
 return id==='ruby'&&e.hp/e.max<=.5?1.2:id==='chrono'?1+Math.min(3,Math.floor((e.bossAge||0)/10))*.1:1;
}
function bossStaffRate(index){return enemies.some(e=>e.hp>0&&e.scorchLeft>0&&e.scorchCells?.includes(index))?.7:1}
function tickBoss(e,dt){
 if(e.type!=='boss')return;
 e.bossAge=(e.bossAge||0)+dt;e.introLeft=Math.max(0,(e.introLeft||0)-dt);e.scorchLeft=Math.max(0,(e.scorchLeft||0)-dt);
 if(e.decoy){e.decoyLife-=dt;if(e.decoyLife<=0){e.escaped=true;burst('bossMirror',e.x,e.y-20,bossDefinition(e).color,.5)}}
}
function placeEnemyAtProgress(e,progress){
 e.progress=Math.max(0,progress);let remaining=e.progress;e.x=path[0].x;e.y=path[0].y;e.segment=0;
 for(let i=0;i<path.length-1;i++){const a=path[i],b=path[i+1],length=Math.hypot(b.x-a.x,b.y-a.y);if(remaining<length){e.x=a.x+(b.x-a.x)*remaining/length;e.y=a.y+(b.y-a.y)*remaining/length;e.segment=i;return}remaining-=length;e.x=b.x;e.y=b.y;e.segment=i+1}
}
function warnBoss(e){
 const b=bossDefinition(e);e.warning=1;e.warningCells=[];
 if(b.id==='ruby'){const occupied=board.map((u,i)=>u?i%5:-1).filter(i=>i>=0);const col=occupied.length?occupied[Math.floor(Math.random()*occupied.length)]:2;e.warningCells=[col,col+5,col+10]}
 if(b.id==='neve')e.warningCells=board.map((u,i)=>({u,i})).filter(v=>v.u).sort((a,b)=>b.u.pip-a.u.pip||a.i-b.i).slice(0,2).map(v=>v.i);
 burst('bossSeal',e.x,e.y-25,b.color,1.2,{kind:b.id});
 enemyEffect(e,b.skillName+' 준비!',b.color);
}
function castBoss(e){
 const b=bossDefinition(e),living=enemies.filter(n=>n.hp>0&&!n.escaped&&!n.decoy);
 if(b.id==='leon'){
  for(let i=board.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[board[i],board[j]]=[board[j],board[i]]}
  for(const n of living){n.rush=2;burst('dash',n.x,n.y,b.color,.6)}selected=-1;drag=null;
  board.forEach((u,i)=>{if(u)burst('shuffle',cells[i].x,cells[i].y-15,'#ceacff',.7)});burst('command',e.x,e.y-20,b.color,1);
 }else if(b.id==='aegis'){
  for(const n of living)if(n===e||Math.hypot(n.x-e.x,n.y-e.y)<145){n.shield=Math.min(n.max*.4,(n.shield||0)+n.max*(n===e?.2:.15));burst('bossShield',n.x,n.y-20,b.color,.9)}
 }else if(b.id==='ruby'){
  e.rush=3;e.scorchLeft=4;e.scorchCells=[...(e.warningCells||[])];burst('bossFlame',e.x,e.y-20,b.color,.9);
  for(const i of e.scorchCells)burst('bossFlame',cells[i].x,cells[i].y-10,b.color,.8);
 }else if(b.id==='lumen'){
  for(const n of living)if(n===e||Math.hypot(n.x-e.x,n.y-e.y)<160){n.hp=Math.min(n.max,n.hp+n.max*(n===e?.06:.12));burst('bossPetals',n.x,n.y-20,b.color,1)}
 }else if(b.id==='neve'){
  for(const i of e.warningCells||[]){if(board[i])board[i].stun=Math.max(board[i].stun||0,1.8);burst('bossFrost',cells[i].x,cells[i].y-10,b.color,1)}
 }else if(b.id==='mira'){
  // Decoys soak attacks, but never mint currency, statistics or throne damage.
  for(const n of enemies)if(n.decoy)n.escaped=true;
  for(let i=0;i<2;i++){const d={type:'boss',bossId:b.id,decoy:true,decoyLife:4,hp:e.max*.08,max:e.max*.08,speed:e.speed,slow:0,hurt:0,skill:999,shield:0,rush:0,cast:0,warning:0,bossAge:0};placeEnemyAtProgress(d,e.progress+45+i*35);enemies.push(d);burst('bossMirror',d.x,d.y-20,b.color,.8)}
 }else if(b.id==='chrono'){
  const old={x:e.x,y:e.y};placeEnemyAtProgress(e,e.progress-110);e.hp=Math.min(e.max,e.hp+e.max*.04);burst('bossClock',old.x,old.y-20,b.color,1);burst('bossClock',e.x,e.y-20,b.color,1);
 }
 e.skill=b.cooldown;e.warning=0;e.warningCells=[];enemyEffect(e,b.skillName+'!',b.color);say(b.short+' · '+b.skillName+'! '+b.skillText);
 SkillCutin.boss(e);
}
function bossSkills(e){if(e.decoy)return;if(e.skill<=1.2&&!e.warning)warnBoss(e);if(e.skill<=0)castBoss(e)}
function nextBossText(){const next=(Math.floor(wave/5)+1)*5,b=plannedBoss(next);return b?next+'차 '+b.short+' · '+b.skillName:next+'차 · 군단장 정찰 중'}
function renderBossGuide(){
 const list=document.querySelector('#boss-guide-list');if(!list)return;
 list.innerHTML=bossCatalog.map(b=>'<article><img src="assets/ui-v2/icons/shield.svg" data-motion="'+b.file+'" alt="'+b.name+'"><div><small>매 5차에 랜덤 등장 · 각 1/7 확률</small><h3>'+b.name+'</h3><p><b>'+b.trait+'</b> · '+b.traitText+'</p><p><b>'+b.skillName+'</b> · '+b.skillText+' ('+b.cooldown+'초 주기)</p><p class="boss-counter">공략 · '+b.counter+'</p></div></article>').join('');
}
function drawBossFields(){
 for(const e of enemies){if(e.type!=='boss'||e.decoy||e.hp<=0)continue;const b=bossDefinition(e);
  const indices=e.warning?e.warningCells:e.scorchLeft>0?e.scorchCells:[];
  for(const i of indices||[]){const p=cells[i];ctx.save();ctx.fillStyle=b.color+(e.warning?'24':'40');ctx.strokeStyle=b.color;ctx.lineWidth=2;round(p.x-35,p.y-42,70,85,8);ctx.fill();ctx.stroke();ctx.font='bold 11px system-ui';ctx.fillStyle=b.color;ctx.fillText(e.warning?'! '+Math.max(.1,e.skill).toFixed(1)+'초':'공속 −30%',p.x,p.y-26);ctx.restore()}
 }
}
function drawBossHUD(){
 const e=enemies.find(e=>e.type==='boss'&&!e.decoy&&e.hp>0&&!e.escaped);if(!e)return;
 const b=bossDefinition(e);ctx.save();ctx.fillStyle='#171020ed';round(135,16,330,66,10);ctx.fill();ctx.strokeStyle=b.color;ctx.lineWidth=1;ctx.stroke();ctx.textAlign='left';ctx.font='bold 13px system-ui';ctx.fillStyle=b.color;ctx.fillText(b.name,146,34);ctx.font='10px system-ui';ctx.fillStyle='#f9eacc';ctx.fillText(b.trait+' · '+b.skillName+(e.silence>0?' · 봉인 중':e.warning?' · 시전 임박':' · '+Math.ceil(e.skill)+'초'),146,51);
 ctx.fillStyle='#48344e';ctx.fillRect(146,59,306,5);ctx.fillStyle=b.color;ctx.fillRect(146,59,306*Math.max(0,e.hp/e.max),5);
 if(e.shield>0){ctx.fillStyle='#d5fff5';ctx.fillRect(146,68,306*Math.min(1,e.shield/(e.max*.4)),3)}
 if(e.introLeft>0){ctx.fillStyle='#171020eb';round(135,84,330,33,7);ctx.fill();ctx.fillStyle='#f6e8d1';ctx.font='10px system-ui';ctx.fillText(b.traitText.slice(0,30),146,98);if(b.traitText.length>30)ctx.fillText(b.traitText.slice(30),146,111)}
 ctx.restore();
}
function drawBossEffect(f,t){
 if(!f.effect.startsWith('boss'))return false;
 const p=reduce?.matches?.5:t,x=f.x,y=f.y,r=14+p*33;ctx.globalAlpha=1-t;ctx.strokeStyle=f.color;ctx.fillStyle=f.color;ctx.lineWidth=3;
 if(f.effect==='bossShield'||f.effect==='bossSeal'){
  ctx.beginPath();for(let i=0;i<6;i++){const a=Math.PI/3*i-Math.PI/2;i?ctx.lineTo(x+Math.cos(a)*r,y+Math.sin(a)*r):ctx.moveTo(x+Math.cos(a)*r,y+Math.sin(a)*r)}ctx.closePath();ctx.stroke();if(f.effect==='bossShield'){ctx.beginPath();ctx.moveTo(x-8,y);ctx.lineTo(x,y+7);ctx.lineTo(x+10,y-9);ctx.stroke()}
 }else if(f.effect==='bossFlame'){
  for(let i=0;i<7;i++){const xx=x+(i-3)*8,yy=y+16-p*36-(i%3)*7;pixel(xx,yy,6,14,i%2?'#ffe294':f.color);pixel(xx+2,yy-6,3,7,'#fff4c5')}
 }else if(f.effect==='bossPetals'){
  for(let i=0;i<8;i++){const a=i*Math.PI/4;ctx.beginPath();ctx.ellipse(x+Math.cos(a)*r,y+Math.sin(a)*r,4,8,a,0,Math.PI*2);ctx.fill()}spark(x,y,8,f.color);
 }else if(f.effect==='bossFrost'){
  for(let i=0;i<6;i++){const a=i*Math.PI/3;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+Math.cos(a)*r,y+Math.sin(a)*r);ctx.stroke();spark(x+Math.cos(a)*r*.7,y+Math.sin(a)*r*.7,4,'#e4faff')}
 }else if(f.effect==='bossMirror'){
  for(let i=0;i<3;i++){ctx.beginPath();ctx.ellipse(x+(i-1)*r,y,10,25,0,0,Math.PI*2);ctx.stroke();spark(x+(i-1)*r,y-14,4,f.color)}
 }else if(f.effect==='bossClock'){
  ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.stroke();for(let i=0;i<12;i++){const a=i*Math.PI/6;pixel(x+Math.cos(a)*r-1,y+Math.sin(a)*r-1,3,3,f.color)}const a=-p*Math.PI*4;ctx.beginPath();ctx.moveTo(x,y-r*.55);ctx.lineTo(x,y);ctx.lineTo(x+Math.cos(a)*r*.7,y+Math.sin(a)*r*.7);ctx.stroke();
 }
 return true;
}
renderBossGuide();
