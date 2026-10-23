'use strict';
const gameNodes=new Map();
const $=s=>{let n=gameNodes.get(s);if(!n?.isConnected){n=document.querySelector(s);gameNodes.set(s,n)}return n},canvas=$('#game'),ctx=canvas.getContext('2d');
const kinds=[{name:'경비원',file:'goblin-guard',color:'#efca6a',damage:14,interval:.8,desc:'빠른 단일 공격'},{name:'시설기사',file:'orc-technician',color:'#ee9170',damage:20,interval:1.5,desc:'폭발 범위 공격'},{name:'청소부',file:'slime-cleaner',color:'#77d5e7',damage:5,interval:1.1,desc:'끈적한 감속 공격'},{name:'당직 서기',file:'gobi',color:'#b9db86',damage:0,interval:1,desc:'등급마다 운영비 생산'},{name:'전기기사',file:'electric-technician',color:'#ffe477',damage:16,interval:1.25,desc:'최대 3명 연쇄 번개'},{name:'유령 배달부',file:'ghost-courier',color:'#95ebd9',damage:20,interval:1.4,desc:'직선상의 적 관통 소포'}];
const extraKinds=[
 {name:'박쥐 간호사',file:'bat-nurse',color:'#dba2dc',damage:8,interval:1.4,desc:'4초간 받는 피해 +25~35%'},
 {name:'해골 요리사',file:'skeleton-chef',color:'#efb68a',damage:10,interval:1.6,desc:'4초 화상 · 등급·장비에 따라 성장'},
 {name:'미믹 창고지기',file:'mimic-storekeeper',color:'#d5a26f',damage:20,interval:1.5,desc:'체력 30% 이하 대상 피해 2배'},
 {name:'거미 재봉사',file:'spider-tailor',color:'#b9aae8',damage:10,interval:1.6,desc:'4초간 두 적 피해 35% 공유'},
 {name:'악몽 상담사',file:'nightmare-counselor',color:'#baaceb',damage:10,interval:1.6,desc:'2초마다 스킬 지연 · 보스 효과 감소'},
 {name:'코볼트 인사담당',file:'kobold-recruiter',color:'#dfbe87',damage:0,interval:1,desc:'인접 공속 +12~38% · 등급·장비로 성장'}
];kinds.push(...extraKinds);
function staffImagePath(file){return 'assets/'+(RECRUIT_STAFF.includes(file)?'staff-expansion/':'pixel/')+file+'.webp'}
ctx.imageSmoothingEnabled=false;
const images={};for(const file of [...kinds.map(k=>k.file),'novice-adventurer','rogue-scout','hero-leon','shield-knight','healing-priest','lightning-mage','lobby-background']){const im=new Image();im.addEventListener('load',()=>GamePerformance.invalidate());im.src=staffImagePath(file);images[file]=im}
const cells=Array.from({length:15},(_,i)=>({x:148+i%5*76,y:245+Math.floor(i/5)*95}));
const path=[{x:82,y:520},{x:82,y:123},{x:518,y:123},{x:518,y:493}];
let board,levels,sp,life,wave,cost,enemies,fx,queue,timer,intermission,playing,paused,ended,selected,drag,speed,summonDiscount=false,time=0,last=0,kills,teamBoost=0;
const kingPortrait=new Image();kingPortrait.addEventListener('load',()=>GamePerformance.invalidate());kingPortrait.src='assets/demon-king.webp';
let kingEvent={state:'idle',timer:35,elapsed:0};
const reduce=window.matchMedia?.('(prefers-reduced-motion: reduce)');
function uiText(e,value){const text=String(value);if(e.textContent!==text)e.textContent=text}
function uiProp(e,key,value){if(e[key]!==value)e[key]=value}
function uiAttr(e,key,value){const text=String(value);if(e.getAttribute(key)!==text)e.setAttribute(key,text)}
function requestSync(){GamePerformance.requestUI()}
function say(t){uiText($('#message'),t);GamePerformance.invalidate()}
function reset(){if(typeof ended!=='undefined'&&ended&&runReward&&!runReward.paid){say('보상 저장을 먼저 재시도해주세요.');return}resetBossPlans();board=Array(15).fill(null);levels=Array(kinds.length).fill(1);sp=150;life=3;wave=0;cost=10;summonDiscount=false;enemies=[];fx=[];queue=[];timer=0;intermission=0;playing=false;paused=false;ended=false;selected=-1;drag=null;speed=1;kills=0;teamBoost=0;mercGesture={motionState:null};kingEvent={state:'idle',timer:30+Math.random()*20,elapsed:0};$('#enemy-preview').textContent='첫 공격: 견습 용사 · 3차 질주 · 4차 방패 · 6차 치유 · 8차 번개';say('고비: 파견 명단을 확인하고 직원을 소환하세요. 같은 직원끼리 합치면 더 높은 등급의 랜덤 직원이 와요!');newRunMeta();sync()}
function randomType(){const pool=meta.deck;return kinds.findIndex(k=>k.file===pool[Math.floor(Math.random()*pool.length)])}
function summonPrice(){return summonDiscount?Math.ceil(cost*.5):cost}
function summon(){if(ended)return;if(meta.deck.length!==5){say('직원 도감에서 근무 직원 5명을 편성해주세요.');return;}const empty=board.map((u,i)=>u?-1:i).filter(i=>i>=0);if(!empty.length){say('근무 자리가 꽉 찼어요. 같은 종류·등급의 직원을 합쳐주세요.');return}if(sp<summonPrice()){say('운영비가 부족해요. 적을 처치하거나 서기의 수입을 기다리세요.');return}sp-=summonPrice();summonDiscount=false;cost+=10;const i=empty[Math.floor(Math.random()*empty.length)];board[i]={type:randomType(),pip:1,cool:0,attack:0,arrival:.4,income:5};say(kinds[board[i].type].name+' 파견 완료! 다음 파견 비용이 10 SP 올랐어요.');sync()}
function compatible(a,b){return itemMode?specialCompatible(a,b):a&&b&&a.type===b.type&&a.pip===b.pip&&a.pip<7}
function failChance(pip){return (pip-1)*.05}
function merge(a,b){if(ended||paused||a===b)return false;if(!compatible(board[a],board[b])){say('같은 종류·같은 등급끼리 합칠 수 있어요. 7등급은 최대입니다.');return false}const pip=Math.max(board[a].pip,board[b].pip)+1,chance=failChance(pip);if(itemMode){const key=itemMode;if((typeof itemCount==='function'?itemCount(key):meta.items[key])<1||!(typeof consumeItem==='function'?consumeItem(key):saveChange(d=>d.items[key]--)))return false;itemMode=null;$('#item-hint').textContent='합성권 사용 완료 · 다른 아이템을 선택할 수 있어요.'}board[a]=null;selected=-1;if(Math.random()<chance){burst('smoke',cells[a].x,cells[a].y-15,'#c7b1d9',.85);fx.push({x:cells[a].x,y:cells[a].y,life:1,max:1,text:'합성 실패',color:'#ff8d98'});summonDiscount=true;say('합성 실패! 다음 직원 소환 1회 50% 할인 · 실패 확률 '+Math.round(chance*100)+'% · 이동한 직원 1명 소멸, 대상 직원은 그대로 유지됩니다.');sync();return false}board[b]={type:randomType(),pip,cool:0,attack:0,arrival:.5,income:5,skillCD:0};fx.push({x:cells[b].x,y:cells[b].y,life:.5,max:.5,color:'#ffdc89',ring:true});say(pip+'등급 '+kinds[board[b].type].name+'! '+(pip>=5?'고유 스킬 해금!':'종류는 랜덤으로 결정됩니다.'));sync();return true}
const skillNames=['연발 석궁','공구 대폭발','대청소','긴급 예산','과부하 방전','특급 배송'];
skillNames.push('집중 진료','야식 대잔치','긴급 재고 정리','단체 수선','강제 상담 시간','긴급 채용');
const skillDescriptions=['선두 적에 강력한 화살 6발','모든 적에 광역 피해','일반 적 3초 · 군단장 1.5초 이동 정지','등급 × 40 SP 획득 · 장비당 +10%','모든 적에 번개 피해 · 일반 1초 / 군단장 0.5초 정지','선두 8명에게 방패를 무시하는 소포 폭격'];
skillDescriptions.push('최고 체력 적에게 6초간 피해 +60~72% · 평타로 연장 불가','모든 적에게 6초간 등급 × 8 화상 피해/초','체력 30% 이하 일반 적 1명 처치, 그 외 등급 × 45 피해','선두 5명을 6초간 연결 · 피해 35% 공유','일반 적 스킬 4초 · 군단장 1.5초 봉인','빈 칸에 랜덤 1등급 무료 소환 · 7등급이면 2등급 소환');
function useSkill(){const u=board[selected];if(!u||u.pip<5||(u.skillCD||0)>0||u.stun>0||!playing||paused||ended)return;if(u.type===11&&board.every(Boolean)){say('긴급 채용을 위한 빈 칸이 필요해요.');return}const p=cells[selected],power=staffPower(u.type)*gradePower(u.pip);u.skillCD=20;u.attack=.2;Motion.start(u,'skill',.7);burst('skillAura',p.x,p.y-15,kinds[u.type].color,.7);
 if(u.type===0){for(let n=0;n<6;n++){const target=enemies.filter(e=>e.hp>0).sort((a,b)=>b.progress-a.progress)[0];if(!target)break;hitEnemy(target,30*u.pip*power,false);fx.push({x:p.x+n*3,y:p.y-30,tx:target.x+n*2,ty:target.y-14,life:.42,max:.42,type:0,color:kinds[0].color})}}
 if(u.type===1){for(const e of enemies){hitEnemy(e,35*u.pip*power,false);fx.push({x:e.x,y:e.y,life:.65,max:.65,ring:true,color:'#ffb17f'})}}
 if(u.type===2){for(const e of enemies){e.freeze=Math.max(e.freeze||0,bossFreezeTime(e,e.type==='boss'?1.5:3));fx.push({x:e.x,y:e.y,life:.65,max:.65,ring:true,color:'#9ef5ec'})}}
 if(u.type===3){const income=Math.round(u.pip*40*(1+(levels[3]-1)*.1)*(1+(trainingLevel('staff')-1)*.4/29));sp+=income;fx.push({x:p.x,y:p.y,life:1,max:1,text:'+'+income+' SP',coin:true,color:'#ffdc89'})}
 if(u.type===4){for(const e of enemies){hitEnemy(e,25*u.pip*power,false);e.freeze=Math.max(e.freeze||0,bossFreezeTime(e,e.type==='boss'?.5:1));fx.push({x:p.x,y:p.y-25,tx:e.x,ty:e.y-14,life:.42,max:.42,type:5,color:kinds[4].color})}}
 if(u.type===5){for(const e of enemies.filter(e=>e.hp>0).sort((a,b)=>b.progress-a.progress).slice(0,8)){hitEnemy(e,40*u.pip*power,false,false,true);fx.push({x:p.x,y:p.y-25,tx:e.x,ty:e.y-14,life:.42,max:.42,type:6,color:kinds[5].color})}}
 if(u.type>=6)extraSkill(u,power);
 say(kinds[u.type].name+' · '+skillNames[u.type]+' 발동! '+skillDescriptions[u.type]);sync();}
function syncSkill(){const u=board[selected],state=!u?'empty':u.stun>0?'stunned':u.pip<5?'locked':(u.skillCD||0)>0?'cooldown':!playing?'preparing':paused?'paused':'ready';
 uiProp($('#skill'),'disabled',!u||u.pip<5||!playing||paused||ended||(u.skillCD||0)>0||u.stun>0);
 uiText($('#skill'),!u?'직원을 선택하세요':u.stun>0?'기절 중 · 잠시 대기':u.pip<5?'고유 스킬 · 5등급 해금':(u.skillCD||0)>0?skillNames[u.type]+' · '+Math.ceil(u.skillCD)+'초':skillNames[u.type]+' 사용');uiAttr($('#skill'),'data-state',state);
 uiText($('#skill-info'),!u?'5등급 이상 직원을 선택하면 고유 스킬을 사용할 수 있습니다.':kinds[u.type].name+' · '+u.pip+'등급 / '+(u.pip<7?'다음 합성 실패 '+Math.round(failChance(u.pip+1)*100)+'%':'최대 등급')+' / '+skillDescriptions[u.type]+' · 재사용 20초');}

$('#skill').onclick=useSkill;
function upgrade(type){const c=100*levels[type];if(ended||levels[type]>=5||sp<c)return;sp-=c;levels[type]++;say(kinds[type].name+' 전체 장비 Lv.'+levels[type]+' 달성!');sync()}

function equipmentPreview(i){
 const lv=levels[i],next=Math.min(5,lv+1),power=n=>Math.round((1+(n-1)*.45)*100);
 const effect=i===3?'1등급 수입 '+(5+lv*2)+' → '+(5+next*2)+' SP / 5초':i===11?'인접 공속 '+(12+(lv-1)*2)+' → '+(12+(next-1)*2)+'% (1등급)':'공격 배수 '+power(lv)+' → '+power(next)+'%';
 return 'Lv.'+lv+(lv<5?' → '+next:' · 최대')+' · '+effect;
}
function sync(){
 if(typeof appRender==='function')appRender();renderMeta();syncSkill();
 uiText($('#sp'),Math.floor(sp));uiText($('#life'),'♥'.repeat(life)+'♡'.repeat(3-life));uiText($('#wave'),wave);
 uiText($('#summon'),(summonDiscount?'반값 소환 · ':'직원 소환 · ')+summonPrice()+' SP');uiAttr($('#summon'),'data-discount',summonDiscount);
 uiAttr($('#summon'),'aria-label',summonDiscount?'다음 직원 소환 50% 할인 · 기본 '+cost+' SP에서 '+summonPrice()+' SP':'직원 소환 '+cost+' SP');
 uiProp($('#summon'),'disabled',ended||sp<summonPrice()||board.every(Boolean));uiProp($('#start'),'disabled',playing||ended);
 uiText($('#start'),playing?'자동 웨이브 진행 중':'당직 시작');uiProp($('#pause'),'disabled',!playing||ended);uiText($('#pause'),paused?'▶':'Ⅱ');
 uiText($('#speed'),'×'+speed);uiAttr($('#speed'),'aria-label','현재 '+speed+'배속 · 누르면 '+(speed%3+1)+'배속');
 kinds.forEach((k,i)=>{const button=$('#up'+i);uiProp(button,'hidden',!meta.deck.includes(k.file));uiProp(button,'disabled',ended||levels[i]>=5||sp<100*levels[i]);const label=levels[i]>=5?'최대 레벨':'강화 · '+100*levels[i]+' SP'+(sp<100*levels[i]?' · '+Math.ceil(100*levels[i]-sp)+' 부족':'');uiText(button.querySelector('b'),label);const preview=equipmentPreview(i);uiText(button.querySelector('small'),preview);uiAttr(button,'aria-label',k.name+' '+preview+' '+label)})
}

$('#cards').innerHTML=kinds.map((k,i)=>'<button class="card" id="up'+i+'"><img src="'+staffImagePath(k.file)+'" alt=""><span>'+k.name+'<br><small></small></span><b></b></button>').join('');kinds.forEach((_,i)=>$('#up'+i).onclick=()=>upgrade(i));$('#summon').onclick=summon;$('#reset').onclick=reset;$('#start').onclick=()=>{if(playing||ended)return;if(meta.deck.length!==5){say('근무 명단은 정확히 5명이 필요해요.');return}if(!board.some(Boolean)){say('먼저 직원을 소환해주세요.');return}activeMerc=meta.equipped;runTraining={...meta.training};mercTimer=mercInterval();playing=true;nextWave();sync()};$('#pause').onclick=()=>{paused=!paused;sync()};$('#speed').onclick=()=>{speed=speed%3+1;sync();if(typeof saveActiveRun==='function')saveActiveRun()};
function point(e){const r=canvas.getBoundingClientRect();return{x:(e.clientX-r.left)*600/r.width,y:(e.clientY-r.top)*600/r.height}}
function cellAt(p){return cells.findIndex(c=>Math.abs(c.x-p.x)<39&&Math.abs(c.y-p.y)<43)}
canvas.onpointerdown=e=>{if(ended)return;const p=point(e),i=cellAt(p);if(i<0||!board[i]){selected=-1;return}drag={from:i,x:p.x,y:p.y,start:p,moved:false};canvas.setPointerCapture(e.pointerId)};
canvas.onpointermove=e=>{if(!drag)return;const p=point(e);drag.x=p.x;drag.y=p.y;if(Math.hypot(p.x-drag.start.x,p.y-drag.start.y)>8)drag.moved=true};
canvas.onpointerup=e=>{if(!drag)return;const from=drag.from,to=cellAt(point(e)),moved=drag.moved;drag=null;if(moved){if(to>=0&&to!==from)merge(from,to);selected=-1}else if(selected>=0&&selected!==from){merge(selected,from);selected=-1}else selected=selected===from?-1:from;syncSkill()};canvas.onpointercancel=()=>{drag=null};
const legion={normal:{name:'견습 용사',file:'novice-adventurer',badge:'검',color:'#ffd18b',speed:52,hp:1},fast:{name:'도적 정찰병',file:'rogue-scout',badge:'질주',color:'#f7a6bc',speed:70,hp:.7},knight:{name:'방패 기사',file:'shield-knight',badge:'방패',color:'#a9c9f0',speed:38,hp:1.7},priest:{name:'치유 사제',file:'healing-priest',badge:'치유',color:'#9febbc',speed:45,hp:1.1},mage:{name:'번개 마법사',file:'lightning-mage',badge:'번개',color:'#d6b4ff',speed:43,hp:1.2},boss:{name:'군단장 레온',file:'hero-leon',badge:'군단장',color:'#ffd580',speed:35,hp:1}};
function nextWave(){wave++;announceBossWave();queue=[];const boss=wave%5===0;for(let i=0;i<8+Math.min(wave,25);i++){let type='normal';if(wave>=3&&i%4===0)type='fast';if(wave>=4&&i%5===1)type='knight';if(wave>=6&&i%6===2)type='priest';if(wave>=8&&i%7===3)type='mage';queue.push(type)}if(boss){queue.push('boss');Motion.preload(bossForWave(wave).file)}timer=.3;const names=[...new Set(queue)].map(t=>t==='boss'?bossForWave(wave).name:legion[t].name).join(' · ');$('#enemy-preview').textContent='공격 '+wave+' : '+names;say(boss?bossForWave(wave).name+' 출현 예정 · '+bossForWave(wave).trait+' / '+bossForWave(wave).skillName:'공격 '+wave+' · '+names)}
function spawn(type){const k=legion[type],hp=type==='boss'?enemyGrowth(600,1.2,1.15,wave):enemyGrowth(35,1.16,1.145,wave)*k.hp;enemies.push({type,hp,max:hp,x:82,y:520,segment:0,progress:0,speed:k.speed,slow:0,hurt:0,skill:type==='boss'?8:type==='mage'?6:type==='priest'?4:3,shield:type==='knight'?hp*.4:0,rush:0,cast:0,warning:0});if(type==='boss')initBoss(enemies.at(-1))}
function burst(effect,x,y,color,duration=.65,extra={}){fx.push({effect,x,y,color,life:duration,max:duration,...extra})}
function enemyEffect(e,text,color){fx.push({x:e.x,y:e.y,life:1,max:1,text,color});e.cast=.6}
function enemySkills(e,dt){e.cast=Math.max(0,e.cast-dt);e.rush=Math.max(0,e.rush-dt);if(e.silence>0)return;e.skill-=dt;if(e.type==='boss'){bossSkills(e);return}
 if(e.type==='mage'&&e.skill<=1&&e.warning===0){const targets=board.map((u,i)=>u?i:-1).filter(i=>i>=0);if(targets.length){e.target=targets[Math.floor(Math.random()*targets.length)];e.warning=1;burst('charge',cells[e.target].x,cells[e.target].y-20,'#d6b4ff',1);enemyEffect(e,'시전!','#d6b4ff')}}
 if(e.skill>0)return;
 if(e.type==='fast'){e.rush=1.5;e.skill=5;burst('dash',e.x,e.y,'#f7a6bc',.7);enemyEffect(e,'질주!','#f7a6bc')}
 if(e.type==='priest'){let healed=false;for(const n of enemies){if(n.hp>0&&n.hp<n.max&&Math.hypot(n.x-e.x,n.y-e.y)<130){n.hp=Math.min(n.max,n.hp+n.max*.12);healed=true;burst('heal',n.x,n.y-15,'#9febbc',.8);enemyEffect(n,'+회복','#9febbc')}}e.skill=4;if(healed)enemyEffect(e,'치유','#9febbc')}
 if(e.type==='mage'){if(e.target!==undefined&&board[e.target]){board[e.target].stun=1.8;const p=cells[e.target];burst('lightning',e.x,e.y-20,'#d6b4ff',.55,{tx:p.x,ty:p.y-20});burst('shock',p.x,p.y-20,'#d6b4ff',.7);fx.push({x:e.x,y:e.y-20,tx:p.x,ty:p.y-20,type:4,life:.42,max:.42,color:'#d6b4ff'});enemyEffect(e,'낙뢰!','#d6b4ff')}e.target=undefined;e.warning=0;e.skill=6}
}
function hitEnemy(e,damage,slow,shared=false,bypassShield=false){if(e.hp<=0)return;damage=bossDamage(e,damage);if(!shared)damage*=e.vulnerable>0?e.vulnerability||1.25:1;const blocked=bypassShield?0:Math.min(e.shield||0,damage);e.shield=Math.max(0,(e.shield||0)-blocked);if(blocked>0){burst(e.shield===0?'shieldBreak':'shieldHit',e.x,e.y-15,'#a9c9f0',e.shield===0?.65:.25)}e.hp-=damage-blocked;e.hurt=.15;if(slow){e.slowTrainingTier=trainingTier();e.slowTrainingLevel=trainingLevel('staff');e.slow=2+e.slowTrainingTier*.1;}if(!shared&&e.linkTime>0)for(const peer of enemies)if(peer!==e&&peer.hp>0&&peer.linkTime>0&&peer.linkGroup===e.linkGroup)hitEnemy(peer,damage*(.35+trainingTier()*.01),false,true)}
// The king is outside the summon pool. Each visit rolls an independent decision.
function updateKing(dt){
 if(kingEvent.state==='idle'){kingEvent.timer-=dt;if(kingEvent.timer<=0&&enemies.length){kingEvent.state='question';kingEvent.elapsed=0;say('마왕: 밖이 왜 이렇게 시끄러워… 나가 볼까?')}return false}
 kingEvent.elapsed+=dt;
 if(kingEvent.state==='question'&&kingEvent.elapsed>=2.5){kingEvent.elapsed=0;if(Math.random()<.5){kingEvent.state='entrance';say('마왕: 잠깐 나왔는데… 전부 조용히 해라.')}else{kingEvent.state='refuse';say('마왕: 아… 귀찮다. 고비가 알아서 하겠지.')}}
 if(kingEvent.state==='entrance'&&kingEvent.elapsed>=1.2){const count=enemies.filter(e=>e.hp>0).length;for(const e of enemies)recordKill(e);enemies=[];fx=[];kingEvent.state='afterglow';kingEvent.elapsed=0;say('마왕의 위압! 용사 군단 '+count+'명 전멸. / 마왕: 이제 좀 조용하군.');}
 if((kingEvent.state==='refuse'&&kingEvent.elapsed>=3)||(kingEvent.state==='afterglow'&&kingEvent.elapsed>=1.8)){kingEvent={state:'idle',timer:35+Math.random()*25,elapsed:0}}
 return kingEvent.state==='entrance'||kingEvent.state==='afterglow';
}
function drawKing(){
 const state=kingEvent.state,t=kingEvent.elapsed,visualTime=reduce?.matches?0:t;if(state==='idle')return;Motion.preload('demon-king');
 if(state==='question'||state==='refuse'){
 ctx.save();ctx.fillStyle='#fff2d8';ctx.strokeStyle='#6e456c';ctx.lineWidth=2;round(230,458,330,54,10);ctx.fill();ctx.stroke();ctx.beginPath();ctx.moveTo(503,512);ctx.lineTo(517,532);ctx.lineTo(531,512);ctx.fill();ctx.fillStyle='#4b2b4b';ctx.textAlign='center';ctx.font='bold 14px system-ui';ctx.fillText(state==='question'?'밖이 왜 이렇게 시끄러워… 나가 볼까?':'아… 귀찮다. 알아서 하겠지.',395,490);ctx.restore();return;
 }
 ctx.save();ctx.fillStyle='#170c2edc';ctx.fillRect(0,0,600,600);
 const bright=state==='entrance'?Math.min(1,t/.5):Math.max(0,1-t/1.8);
 ctx.globalAlpha=bright;const glow=ctx.createRadialGradient(300,280,20,300,280,320);glow.addColorStop(0,'#ffe8a9');glow.addColorStop(.45,'#a969d0aa');glow.addColorStop(1,'#44234a00');ctx.fillStyle=glow;ctx.fillRect(0,0,600,600);
 for(let n=0;n<12;n++){const a=n*Math.PI/6+visualTime*.15;ctx.strokeStyle=n%2?'#fbd89455':'#dec0ff55';ctx.lineWidth=8;ctx.beginPath();ctx.moveTo(300+Math.cos(a)*60,280+Math.sin(a)*60);ctx.lineTo(300+Math.cos(a)*420,280+Math.sin(a)*420);ctx.stroke()}
 const kingPose=reduce?.matches?0:state==='entrance'?(t<.3?0:t<.65?2:3):(t<.5?4:5);const kingHeight=390+Math.min(visualTime,1)*15;if(!Motion.draw(ctx,'demon-king',300,480,kingHeight,kingPose)&&kingPortrait.complete&&kingPortrait.naturalWidth){ctx.imageSmoothingEnabled=true;const w=kingHeight*kingPortrait.naturalWidth/kingPortrait.naturalHeight;ctx.drawImage(kingPortrait,300-w/2,85,w,kingHeight)}
 for(let n=0;n<10;n++){const a=n*2.399,r=130+(n%3)*45; spark(300+Math.cos(a+visualTime*.3)*r,270+Math.sin(a+visualTime*.3)*r,5+Math.sin(visualTime*4+n)*2,'#fff3bc')}
 if(!reduce?.matches){ctx.globalAlpha=state==='afterglow'?Math.max(0,.65-t*2):Math.max(0,.28-t*.4);ctx.fillStyle='#fff2cf';ctx.fillRect(0,0,600,600)}ctx.globalAlpha=1;ctx.textAlign='center';ctx.fillStyle='#fff0b7';ctx.font='bold 28px system-ui';ctx.fillText(state==='entrance'?'마왕님이 직접 나섰다!':'용사 군단 전멸',300,535);ctx.font='14px system-ui';ctx.fillStyle='#ebd8f8';ctx.fillText('“조용히 해라. 퇴근한 사람 앞에서.”',300,564);ctx.restore();ctx.imageSmoothingEnabled=false;
}
function update(dt){if(paused||ended)return;time+=dt;if(playing)teamBoost=Math.max(0,teamBoost-dt);fx.forEach(f=>f.life-=dt);fx=fx.filter(f=>f.life>0);board.forEach(u=>{if(u){if(playing)u.skillCD=Math.max(0,(u.skillCD||0)-dt);Motion.tick(u,dt);u.attack=Math.max(0,u.attack-dt);u.arrival=Math.max(0,u.arrival-dt);u.stun=Math.max(0,(u.stun||0)-dt)}});if(!playing)return;
 if(typeof onProgressUpdate==='function')onProgressUpdate(dt);
 if(updateKing(dt)){requestSync();return}
 Motion.tick(mercGesture,dt);mercUpdate(dt);enemies=enemies.filter(e=>{if(e.hp<=0){recordKill(e);return false}return true});timer-=dt;if(queue.length&&timer<=0){spawn(queue.shift());timer=.65}
 for(const e of enemies){e.slow=Math.max(0,e.slow-dt);e.hurt=Math.max(0,e.hurt-dt);e.freeze=Math.max(0,(e.freeze||0)-dt);extraEnemyUpdate(e,dt);tickBoss(e,dt);if(e.hp<=0||e.escaped)continue;enemySkills(e,dt);let move=(e.freeze>0?0:1)*e.speed*bossSpeed(e)*(e.slow?trainingSlow(e):1)*(e.rush>0?1.65:1)*dt;e.progress+=move;while(move>0&&e.segment<3){const p=path[e.segment+1],d=Math.hypot(p.x-e.x,p.y-e.y);if(move>=d){e.x=p.x;e.y=p.y;e.segment++;move-=d}else{e.x+=(p.x-e.x)/d*move;e.y+=(p.y-e.y)/d*move;move=0}}if(e.segment===3){if(!e.decoy)breachDamage(e.type==='boss'?2:1);e.escaped=true}}

 enemies=enemies.filter(e=>!e.escaped);if(!life){ended=true;for(const e of enemies)if(e.hp<=0)recordKill(e);settleRun();say('고비: 혹시… 성도 수리해주시나요? '+wave+'차 공격까지 버텼어요.');requestSync();return}
 board.forEach((u,i)=>{if(!u||u.stun>0||u.type===11)return;if(typeof runStats!=='undefined')attackOwner=u.type;const k=kinds[u.type];if(u.type===3){u.income-=dt;if(u.income<=0){const income=trainingIncome(u);sp+=income;if(typeof runStats!=='undefined')runStats[3].income+=income;u.income=5;Motion.start(u,'skill',.6);fx.push({x:cells[i].x,y:cells[i].y,life:1,max:1,text:'+'+income+' SP',coin:true,color:k.color})}return}u.cool-=dt*staffHaste(i)*bossStaffRate(i);if(u.cool>0)return;while(u.cool<=0){const target=enemies.filter(e=>e.hp>0).sort((a,b)=>b.progress-a.progress)[0];if(!target){u.cool=0;return}u.cool+=k.interval/u.pip;u.attack=.2;u.aimX=target.x;Motion.start(u,'attack',Math.min(.38,Math.max(.24,k.interval/u.pip*.8)));const damage=trainingAttack(u,k.damage*staffPower(u.type)*gradePower(u.pip));if(u.type>=6){extraAttack(u,i,target,damage);continue}let victims=[target];
if(u.type===1)victims=enemies.filter(e=>e.hp>0&&Math.hypot(e.x-target.x,e.y-target.y)<65+trainingTier()*5);
if(u.type===4){let lastTarget=target;while(victims.length<(trainingLevel('staff')>=20?4:3)){const next=enemies.filter(e=>e.hp>0&&!victims.includes(e)&&Math.hypot(e.x-lastTarget.x,e.y-lastTarget.y)<=130+(trainingTier()?10:0)).sort((a,b)=>Math.hypot(a.x-lastTarget.x,a.y-lastTarget.y)-Math.hypot(b.x-lastTarget.x,b.y-lastTarget.y))[0];if(!next)break;victims.push(next);lastTarget=next}}
let endX=target.x,endY=target.y;
if(u.type===5){const origin=cells[i],vx=target.x-origin.x,vy=target.y-origin.y,len=Math.hypot(vx,vy)||1,nx=vx/len,ny=vy/len;endX=origin.x+nx*700;endY=origin.y+ny*700;victims=enemies.filter(e=>{const dx=e.x-origin.x,dy=e.y-origin.y,along=dx*nx+dy*ny;return e.hp>0&&along>=0&&along<=700&&Math.abs(dx*ny-dy*nx)<24+trainingTier()*2})}
victims.forEach((e,n)=>{hitEnemy(e,damage*(u.type===4?Math.pow(trainingLevel('staff')>=30?.9:trainingLevel('staff')>=10?.85:.8,n):1),u.type===2);if(u.type===4){const from=n? victims[n-1]:cells[i];fx.push({x:from.x,y:from.y-20,tx:e.x,ty:e.y-14,life:.42,max:.42,type:5,color:k.color})}});
if(u.type!==4)fx.push({x:cells[i].x,y:cells[i].y-25,tx:u.type===5?endX:target.x,ty:u.type===5?endY:target.y-14,life:.42,max:.42,type:u.type>=4?u.type+1:u.type,pip:u.pip,color:k.color})}});
 if(typeof runStats!=='undefined')attackOwner=null;enemies=enemies.filter(e=>{if(e.hp<=0){recordKill(e);return false}return true});if(!queue.length&&!enemies.length){intermission+=dt;if(intermission>=3){sp+=30;intermission=0;if(typeof advanceProgress==='function')advanceProgress();else nextWave()}}requestSync()}
function image(file,x,y,h,angle=0,sx=1,sy=1){const im=images[file];if(!im?.complete||!im.naturalWidth)return;const w=h*im.naturalWidth/im.naturalHeight;ctx.save();ctx.translate(x,y);ctx.rotate(angle);ctx.scale(sx,sy);ctx.drawImage(im,-w/2,-h,w,h);ctx.restore()}
function round(x,y,w,h,r){ctx.beginPath();ctx.roundRect(x,y,w,h,r)}
function drawUnit(u,i,x=cells[i].x,y=cells[i].y,ghost=false){const k=kinds[u.type];drawStaffMotion(u,i,x,y,ghost);ctx.save();if(ghost)ctx.globalAlpha=.8;ctx.fillStyle='#171122ee';round(x-29,y+20,58,15,6);ctx.fill();ctx.fillStyle=k.color;for(let n=0;n<u.pip;n++){ctx.beginPath();ctx.arc(x+(n-(u.pip-1)/2)*7,y+27,2.2,0,Math.PI*2);ctx.fill()}if(u.pip>=5){ctx.fillStyle='#ffdd93';ctx.font='bold 10px system-ui';ctx.fillText((u.skillCD||0)>0?'스킬 '+Math.ceil(u.skillCD)+'s':'★ 스킬',x,y-64)}if(u.stun>0){spark(x,y-68,7,'#d6b4ff');ctx.font='bold 10px system-ui';ctx.fillStyle='#e8d1ff';ctx.fillText('기절',x,y-80)}ctx.restore()}
// Pixel-sized primitives keep effects in the same style as the sprites.
function pixel(x,y,w,h,color){ctx.fillStyle=color;ctx.fillRect(Math.round(x),Math.round(y),w,h)}
function spark(x,y,r,color){pixel(x-2,y-r,4,r*2,color);pixel(x-r,y-2,r*2,4,color)}
function drawBurst(f,t){
 ctx.globalAlpha=1-t;const x=f.x,y=f.y,r=8+t*40;
 if(f.effect==='smoke'){
 // Chunky overlapping puffs, with a bright initial pop and little debris.
 if(t<.2)spark(x,y,10+t*55,'#fff0bf');
 for(let n=0;n<9;n++){const a=n*2.4,px=x+Math.cos(a)*r*.65,py=y+Math.sin(a)*r*.45-t*28,size=Math.max(4,18+Math.sin(n)*5-t*9);pixel(px-size/2,py-size/2,size,size,n%3===0?'#efe2f2':n%3===1?'#bda7d1':'#897791');pixel(px-size/2+3,py-size/2-3,size-6,6,'#d9c8e5')}
 for(let n=0;n<5;n++)pixel(x+Math.cos(n*1.3)*r,y+Math.sin(n*1.3)*r-t*15,3,3,'#ffd1a8');
 }else if(f.effect==='dash'){
 for(let n=0;n<6;n++){const offset=n*8+t*30;pixel(x-offset,y-12+n*4,14-n,3,f.color)}
 }else if(f.effect==='heal'){
 for(let n=0;n<5;n++){const a=n*1.8; spark(x+Math.cos(a)*20,y+Math.sin(a)*10-t*35,4,f.color)}ctx.strokeStyle=f.color;ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(x,y+12,12+t*18,5+t*5,0,0,Math.PI*2);ctx.stroke();
 }else if(f.effect==='lightning'){
 ctx.strokeStyle='#f4e4ff';ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(x,y);for(let n=1;n<=8;n++)ctx.lineTo(x+(f.tx-x)*n/8+(n===8?0:(n%2?10:-10)),y+(f.ty-y)*n/8);ctx.stroke();spark(f.tx,f.ty,12*(1-t)+3,f.color);
 }else if(f.effect==='charge'||f.effect==='shock'){
 for(let n=0;n<8;n++){const a=n*Math.PI/4+t*2,rad=f.effect==='charge'?28*(1-t):r;pixel(x+Math.cos(a)*rad,y+Math.sin(a)*rad,4,4,f.color)}if(f.effect==='shock')spark(x,y,12*(1-t),f.color);
 }else if(f.effect==='shieldHit'||f.effect==='shieldBreak'){
 const shattered=f.effect==='shieldBreak';for(let n=0;n<8;n++){const a=n*Math.PI/4,rad=shattered?r:15;pixel(x+Math.cos(a)*rad-2,y+Math.sin(a)*rad+(shattered?t*t*22:0)-2,shattered?6:3,shattered?8:3,f.color)}
 }else if(f.effect==='command'){
 ctx.strokeStyle=f.color;ctx.lineWidth=4;ctx.beginPath();ctx.arc(x,y,15+t*210,0,Math.PI*2);ctx.stroke();for(let n=0;n<12;n++){const a=n*Math.PI/6;spark(x+Math.cos(a)*r*2,y+Math.sin(a)*r*2,4,f.color)}
 }else if(f.effect==='shuffle'){
 for(let n=0;n<6;n++){const a=n*Math.PI/3+t*5;spark(x+Math.cos(a)*25,y+Math.sin(a)*18-t*8,3,f.color)}
 }
}
function drawEffect(f){
 if(GamePerformance.lowPower&&['smoke','shuffle','defeat'].includes(f.effect))return;
 const progress=Math.min(1,Math.max(0,1-f.life/f.max));ctx.save();
 if(f.effect){if(!drawBossEffect(f,progress)&&!drawMotionEffect(f,progress))drawBurst(f,reduce?.matches ? .5 : progress);ctx.restore();return}
 if(f.text){const y=f.y-35-progress*28;ctx.globalAlpha=1-progress;ctx.font='bold 14px system-ui';ctx.fillStyle=f.color;ctx.fillText(f.text,f.x,y-12);if(f.coin){pixel(f.x-5,y,10,12,'#c1843d');pixel(f.x-3,y+1,6,9,'#ffda7d');pixel(f.x-1,y+3,2,5,'#fff1b1');spark(f.x+11,y-4,3,'#ffe5a0')}ctx.restore();return}
 if(f.ring&&GamePerformance.lowPower){ctx.globalAlpha=1-progress;ctx.strokeStyle=f.color;ctx.beginPath();ctx.arc(f.x,f.y,progress*32,0,Math.PI*2);ctx.stroke();ctx.restore();return}
 if(f.ring){ctx.globalAlpha=1-progress;for(let n=0;n<12;n++){const a=n*Math.PI/6; spark(f.x+Math.cos(a)*progress*45,f.y+Math.sin(a)*progress*32,3,f.color)}ctx.restore();return}
 if(f.type===5){ctx.globalAlpha=1-progress;const dx=f.tx-f.x,dy=f.ty-f.y;ctx.strokeStyle='#b5fcff';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(f.x,f.y);for(let n=1;n<=8;n++){const t=n/8,offset=n===8?0:((n%2?1:-1)*7);ctx.lineTo(Math.round(f.x+dx*t+offset),Math.round(f.y+dy*t-offset))}ctx.stroke();spark(f.tx,f.ty,5,'#ffe477');ctx.restore();return}
 const travel=Math.min(1,progress/.72),dx=f.tx-f.x,dy=f.ty-f.y;
 const arc=f.type===1?Math.sin(travel*Math.PI)*45:f.type===2?Math.sin(travel*Math.PI)*18:0;
 const x=Math.round(f.x+dx*travel),y=Math.round(f.y+dy*travel-arc);
 if(progress<.72){
 for(let n=1;n<=(GamePerformance.lowPower?1:3);n++){const t=Math.max(0,travel-n*.04),ax=f.x+dx*t,ay=f.y+dy*t-(f.type===1?Math.sin(t*Math.PI)*45:f.type===2?Math.sin(t*Math.PI)*18:0);ctx.globalAlpha=.4/n;pixel(ax-2,ay-2,4,4,f.color)}ctx.globalAlpha=1;
 ctx.translate(x,y);ctx.rotate(f.type===1?travel*Math.PI*5:Math.atan2(dy,dx));
 if(f.type===0){pixel(-13,-1,20,3,'#c69054');pixel(6,-3,5,7,'#fff2b0');pixel(11,-1,3,3,'#ffe295');pixel(-13,-4,6,3,'#ecbc6a');pixel(-13,2,6,3,'#ecbc6a')}
 else if(f.type===1){pixel(-10,-2,18,5,'#bdc9df');pixel(-11,-4,5,9,'#f19c52');pixel(5,-6,4,13,'#e9edf6');pixel(9,-6,5,4,'#b7c5de');pixel(9,3,5,4,'#b7c5de');pixel(-7,-1,12,2,'#f8f4df')}
 else if(f.type===2){pixel(-6,-5,12,10,'#45b5d6');pixel(-4,-7,8,14,'#79edec');pixel(-7,-3,14,6,'#79edec');pixel(-3,-5,4,3,'#e5ffff');pixel(5,-9,3,3,'#a2f4f4')}
 else if(f.type===6){pixel(-9,-6,18,12,'#b88252');pixel(-7,-5,14,10,'#e5b684');pixel(-1,-6,3,12,'#f3a9ce');pixel(-9,-1,18,3,'#f3a9ce');pixel(-6,-4,4,2,'#fff1ca')}
 else if(f.type===4){pixel(-7,-4,14,8,'#8050b3');pixel(-4,-7,8,14,'#b889ed');pixel(-3,-3,6,6,'#fff0fd');spark(0,0,9,'#d8b4ff');pixel(-2,-2,4,4,'#ffffff')}
 }else{
 const hit=(progress-.72)/.28,r=5+hit*(f.type===1?35:19);ctx.globalAlpha=1-hit;
 if(f.type===1){for(let n=0;n<8;n++){const a=n*Math.PI/4;pixel(f.tx+Math.cos(a)*r-3,f.ty+Math.sin(a)*r-3,6,6,n%2?'#ffd081':'#e87c59')}spark(f.tx,f.ty,Math.max(2,11*(1-hit)),'#fff1b2')}
 else if(f.type===2){for(let n=0;n<7;n++){const a=n*Math.PI*2/7;pixel(f.tx+Math.cos(a)*r-2,f.ty+Math.sin(a)*r*.6-2,5,5,'#9ef5ec')}pixel(f.tx-r/2,f.ty+5,r,3,'#70d9df')}
 else if(f.type===6){for(let n=0;n<4;n++)spark(f.tx+Math.cos(n*Math.PI/2)*r,f.ty+Math.sin(n*Math.PI/2)*r,3,'#a7f6dd')}
 else if(f.type===4){for(let n=0;n<4;n++)spark(f.tx+Math.cos(n*Math.PI/2)*r,f.ty+Math.sin(n*Math.PI/2)*r,4,'#dfb9ff')}
 else{spark(f.tx,f.ty,8*(1-hit)+2,'#ffe49b');pixel(f.tx+6,f.ty-r,3,3,'#fff5d0')}
 }
 ctx.restore();
}
let staticBoardLayer=null,staticBoardReady=false;
function drawBoardBase(){
 const bg=images['lobby-background'],ready=bg.complete&&bg.naturalWidth>0;
 if(!staticBoardLayer||ready!==staticBoardReady){
  staticBoardLayer=document.createElement('canvas');staticBoardLayer.width=staticBoardLayer.height=600;
  const base=staticBoardLayer.getContext('2d');if(ready){base.drawImage(bg,0,0,600,600);base.fillStyle='#211b3538';base.fillRect(0,0,600,600)}
  base.lineJoin='round';base.lineCap='round';base.beginPath();path.forEach((p,i)=>i?base.lineTo(p.x,p.y):base.moveTo(p.x,p.y));base.lineWidth=2;base.strokeStyle='#d9bbec40';base.stroke();
  base.textAlign='center';base.font='12px system-ui';base.fillStyle='#e6c9a0';base.fillText('침입',82,562);base.fillText('왕좌',518,562);base.font='bold 14px system-ui';base.fillText('야간 근무 보드',300,181);
  staticBoardReady=ready;GamePerformance.stats.backgroundBuilds++;
 }
 ctx.drawImage(staticBoardLayer,0,0);
}
function draw(){ctx.clearRect(0,0,600,600);drawBoardBase();drawAmbient();ctx.textAlign='center';ctx.lineJoin='round';ctx.lineCap='round';

 cells.forEach((c,i)=>{const u=board[i],source=drag?board[drag.from]:board[selected];const match=source&&i!==(drag?drag.from:selected)&&compatible(source,u);ctx.fillStyle=match?'#4f513dcc':u?'#352a40ee':'#221c2bdc';round(c.x-38,c.y-43,76,88,10);ctx.fill();ctx.strokeStyle=match?'#b4f4c9':selected===i?'#ffe1a0':u?'#8b6d9c':'#65506f';ctx.lineWidth=match?3:1;ctx.stroke();if((selected===i||match)&&typeof GameSkin!=='undefined')GameSkin.frame(ctx,selected===i||match?'tab-active':'slot-square',c.x-38,c.y-43,76,88,10);if(!u){ctx.font='22px system-ui';ctx.fillStyle='#68556f';ctx.fillText('·',c.x,c.y)}else if(!(drag?.moved&&drag.from===i))drawUnit(u,i)});
 drawBossFields();for(const e of enemies){const h=e.type==='boss'?75:43;drawEnemyMotion(e,h);ctx.fillStyle='#110c17';ctx.fillRect(e.x-18,e.y-h+8,36,4);ctx.fillStyle=e.slow||e.freeze>0?'#7ee0f2':'#ffb187';ctx.fillRect(e.x-18,e.y-h+8,36*Math.max(0,e.hp/e.max),4);if(e.type!=='normal'){ctx.font='bold 9px system-ui';ctx.fillStyle=enemyDefinition(e).color;ctx.fillText(e.decoy?'분신':enemyDefinition(e).badge,e.x,e.y-h+3)}if(e.shield>0){ctx.strokeStyle='#a9c9f0';ctx.lineWidth=2;ctx.strokeRect(e.x-20,e.y-h+15,40,h-7);ctx.fillStyle='#a9c9f0';ctx.fillRect(e.x-18,e.y-h+13,36*Math.min(1,e.shield/(e.max*.4)),3)}if(e.rush>0){pixel(e.x-24,e.y+5,8,3,'#ffb3b3');pixel(e.x-30,e.y+10,10,3,'#ffd09f')}if(e.type==='priest')spark(e.x,e.y-h+22,5,'#9febbc');if(e.warning&&e.target!==undefined){const c=cells[e.target];ctx.strokeStyle='#d6b4ff';ctx.lineWidth=3;ctx.strokeRect(c.x-35,c.y-42,70,85);spark(c.x,c.y-55,6,'#d6b4ff')}}
 for(const f of fx)drawEffect(f);ctx.globalAlpha=1;if(drag?.moved)drawUnit(board[drag.from],drag.from,drag.x,drag.y,true);
 drawMercenary();drawBossHUD();drawKing();
 if(paused||ended){ctx.fillStyle='#100b18dc';ctx.fillRect(0,0,600,600);ctx.font='bold 28px system-ui';ctx.fillStyle='#ffdaa0';ctx.fillText(ended?'왕좌가 무너졌습니다':'잠깐 휴식 중',300,270);ctx.font='16px system-ui';ctx.fillText(ended?wave+'차 공격 · '+kills+'명 저지':'계속하기 버튼을 눌러주세요',300,309)}}
let frameWasActive=false;
function frame(now){
 const performancePolicy=GamePerformance;performancePolicy.begin();
 const elapsed=last&&frameWasActive?Math.min((now-last)/1000,.1):0;last=now;
 const battle=typeof appScreen==='undefined'||appScreen==='battle',active=battle&&!paused&&!ended;
 if(!document.hidden){
  if(active)performancePolicy.advance(elapsed,speed,dt=>{update(dt);return !paused&&!ended&&(typeof appScreen==='undefined'||appScreen==='battle')});else performancePolicy.resetSimulation();
  if(battle&&!paused&&!ended)tickBossWarning(elapsed);
  performancePolicy.flushUI(now,()=>sync());
  if(battle&&(active||performancePolicy.dirty)&&performancePolicy.shouldDraw(now)){draw();performancePolicy.drawn(now)}
  if(!battle)performancePolicy.settled();
  Motion.drawUI(now,performancePolicy.lowPower||battle&&(paused||ended));
  const frozen=battle&&(paused||ended);if(document.documentElement.classList.contains('motion-paused')!==frozen)document.documentElement.classList.toggle('motion-paused',frozen);
 }
 const stillActive=battle&&!paused&&!ended;frameWasActive=stillActive;
 performancePolicy.finish(frame,now,stillActive,!battle&&!performancePolicy.lowPower&&!Motion.reduced?.matches&&Motion.hasAnimated());
}
initMetaUI();reset();Motion.mount();GamePerformance.schedule(frame);
