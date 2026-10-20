'use strict';
const RUN_SAVE='after-hours-active-run-v1';
const starterDeck=[0,1,2,3,4];
let runDeck=starterDeck.slice(),tutorialMode=false,tutorialWon=false,tutorialCheckpoint=null,bonusPending=false,guaranteedMerge=false,seenStaff=new Set(),runStats=[],savedElapsed=0,dailyEnabled=false,dailyRule=0,trainingItems={grade:0,kind:0,king:0};
function ensureProgress(){if(!Array.isArray(meta.deck)||meta.deck.length>5||new Set(meta.deck).size!==meta.deck.length||meta.deck.some(id=>!kinds.some(k=>k.file===id)))meta.deck=starterDeck.map(i=>kinds[i].file);if(typeof meta.tutorialComplete!=='boolean')meta.tutorialComplete=false;if(!meta.tutorialComplete)meta.deck=starterDeck.map(i=>kinds[i].file)}
ensureProgress();
function initRunProgress(){ensureProgress();tutorialMode=!meta.tutorialComplete;tutorialWon=false;tutorialCheckpoint=null;bonusPending=false;guaranteedMerge=false;runDeck=meta.deck.map(id=>kinds.findIndex(k=>k.file===id));trainingItems={grade:0,kind:0,king:0};seenStaff=new Set();runStats=kinds.map(()=>({damage:0,kills:0,income:0,highest:0}));savedElapsed=0;dailyEnabled=!tutorialMode&&!!document.querySelector('#daily-enable').checked;const day=new Date().toLocaleDateString('en-CA',{timeZone:'Asia/Seoul'});dailyRule=[...day].reduce((n,c)=>n+c.charCodeAt(0),0)%3;renderProgress()}
function renderProgress(){document.querySelector('#mode-name').textContent=!meta.tutorialComplete?'신입 연수 · 10웨이브':'마왕성 야간 방어';document.querySelector('#mode-desc').textContent=!meta.tutorialComplete?'처음 한 번 배우고 무한 모드로':'무한 웨이브 · 싱글 플레이';const deckMarkup=meta.deck.map(id=>{const k=kinds.find(k=>k.file===id);return '<img src="'+staffImagePath(id)+'" alt="'+k.name+'">'}).join('');const deckPortraits=document.querySelector('#deck-summary');if(deckPortraits.motionMarkup!==deckMarkup){deckPortraits.motionMarkup=deckMarkup;deckPortraits.innerHTML=deckMarkup;Motion.mount(deckPortraits)}const attackers=meta.deck.filter(id=>![2,3,9,10,11].includes(kinds.findIndex(k=>k.file===id))).length;document.querySelector('#deck-label').textContent='근무 '+meta.deck.length+'/5 · 편성\n공격 '+attackers+' · 지원 '+(meta.deck.length-attackers);document.querySelector('#deck-open').disabled=playing&&!ended;document.querySelector('#daily-option').hidden=!meta.tutorialComplete;document.querySelector('#daily-label').textContent=['정예 당직 · 적 HP +15%','화력 당직 · 직원 피해 +10%','여유 당직 · 적 이동 속도 -10%'][dailyRule];document.querySelector('#tutorial-strip').hidden=!tutorialMode;document.querySelector('#tutorial-strip').textContent='신입 연수 '+Math.max(1,wave)+' / 10 · '+tutorialHint();document.querySelector('#next-boss').textContent='다음 군단장: '+nextBossText();}
function tutorialHint(){return wave<3?'소환 버튼으로 방어선을 채워보세요':wave<5?'같은 직원·같은 등급을 합치고 장비를 지급하세요':wave===5?bossForWave(wave).short+' 등장! '+bossForWave(wave).counter:wave<9?'체험 직원 스킬과 연습용 아이템을 사용해보세요':'마지막 두 공격은 직접 지휘해보세요'}
function itemCount(key){return meta.items[key]+(tutorialMode?trainingItems[key]:0)}
function consumeItem(key){if(tutorialMode&&trainingItems[key]>0){trainingItems[key]--;return true}if(meta.items[key]<1)return false;return saveChange(d=>d.items[key]--)}
function showGuide(title,text){document.querySelector('#guide-title').textContent=title;document.querySelector('#guide-text').textContent=text;paused=true;sync();document.querySelector('#guide').showModal()}
function afterWaveStart(){if(tutorialMode){if(wave===3){const empty=board.map((u,i)=>u?-1:i).filter(i=>i>=0);for(const i of empty.slice(0,2))board[i]={type:0,pip:1,cool:0,attack:0,arrival:.4,income:5};sp=Math.max(sp,150)}if(wave===6){let i=board.findIndex(u=>!u);if(i<0)i=0;board[i]={type:0,pip:5,cool:0,attack:0,arrival:.5,income:5};trainingItems={grade:2,kind:2,king:1};selected=i}noteRoster();tutorialCheckpoint=runSnapshot();if([1,3,5,6,9].includes(wave))showGuide('신입 연수 · '+wave+'번째 공격',tutorialHint()+(wave===6?' 5등급 경비원과 연습 아이템을 지급했어요. 연수 종료 시 회수됩니다.':''))}renderProgress();saveActiveRun()}
function advanceProgress(){if(tutorialMode&&wave>=10){tutorialWon=true;ended=true;settleRun();sync();clearActiveRun();return}if(wave>0&&wave%5===0){bonusPending=true;paused=true;renderPerkChoices();document.querySelector('#perk').showModal();saveActiveRun();sync();return}nextWave()}
function perkReward(){
 const tier=Math.max(1,Math.floor(wave/5)),summons=Math.min(tier,4)+1;
 return {tier,sp:Math.max(150*tier,summons*cost+5*summons*(summons-1)),life:Math.min(3,tier),merges:Math.min(3,1+Math.floor(tier/2)),equipment:Math.min(3,Math.max(1,tier-2)),pip:Math.min(5,3+Math.floor((tier-2)/2))};
}
function renderPerkChoices(){
 const r=perkReward();
 document.querySelector('#perk-intro').textContent=wave+'단계 돌파 · 보상 '+r.tier+'단계 · 하나만 선택하세요.';
 document.querySelector('#perk-targets').hidden=true;document.querySelector('#perk-options').hidden=false;
 document.querySelector('#perk-sp').textContent='운영비 +'+r.sp+' SP';
 document.querySelector('#perk-life').textContent=life>=3?'왕좌 생명 3 / 3 · 최대치':'왕좌 생명 '+life+' → '+Math.min(3,life+r.life)+' / 3';
 document.querySelector('#perk-life').disabled=life>=3;
 document.querySelector('#perk-merge').textContent='다음 합성 '+r.merges+'회 성공 보장'+(guaranteedMerge?' · 이미 '+Number(guaranteedMerge)+'회 보유':'');
 document.querySelector('#perk-merge').disabled=Number(guaranteedMerge)>=r.merges;
 document.querySelector('#perk-equipment').hidden=wave<15;
 document.querySelector('#perk-equipment').disabled=runDeck.every(i=>levels[i]>=5);
 document.querySelector('#perk-equipment').textContent='원하는 직군 장비 +'+r.equipment+'레벨 · 무료'+(runDeck.every(i=>levels[i]>=5)?' · 모두 최대치':'');
 document.querySelector('#perk-staff').hidden=wave<15;
 document.querySelector('#perk-staff').disabled=board.every(Boolean);
 document.querySelector('#perk-staff').textContent=r.pip+'등급 직원 1명 '+(wave>=20?'직접 선택':'무작위 지급')+(board.every(Boolean)?' · 빈자리 필요':'');
 document.querySelector('#perk-note').textContent=wave<15?'합성 보장은 표시된 횟수까지 충전돼요. 유효한 합성에만 사용되며, 7등급은 합성할 수 없어요.':wave<20?'무료 강화는 선택 직군 전체에 적용돼요. 직원 지급은 빈자리가 필요해요.':'원하는 직군·직원을 고르세요. 합성 보장은 표시된 횟수까지 충전돼요.';
}
function showPerkTargets(id){
 const field=document.querySelector('#perk-targets');field.replaceChildren();
 const legend=document.createElement('legend');legend.textContent=id==='equipment'?'강화할 직군을 골라주세요':'받을 직원을 골라주세요';field.append(legend);
 for(const type of runDeck){const button=document.createElement('button');button.textContent=kinds[type].name+(id==='equipment'?' · Lv.'+levels[type]+' → '+Math.min(5,levels[type]+perkReward().equipment):' · '+perkReward().pip+'등급');button.disabled=id==='equipment'&&levels[type]>=5;button.onclick=()=>choosePerk(id,type);field.append(button)}
 const back=document.createElement('button');back.textContent='← 다른 보상 보기';back.onclick=renderPerkChoices;field.append(back);
 document.querySelector('#perk-options').hidden=true;field.hidden=false;field.querySelector('button:not(:disabled)').focus();
}
function choosePerk(id,type){
 if(!bonusPending||!['sp','life','merge','equipment','staff'].includes(id))return false;
 const r=perkReward();
 if(id==='life'&&life>=3||id==='merge'&&Number(guaranteedMerge)>=r.merges)return false;
 if(id==='equipment'||id==='staff'){
  if(wave<15||id==='staff'&&board.every(Boolean)||id==='equipment'&&runDeck.every(i=>levels[i]>=5))return false;
  if(type===undefined&&(id==='equipment'||wave>=20)){showPerkTargets(id);return false}
  if(type!==undefined&&!runDeck.includes(type))return false;
 }
 if(id==='sp')sp+=r.sp;
 else if(id==='life')life=Math.min(3,life+r.life);
 else if(id==='merge')guaranteedMerge=r.merges;
 else if(id==='equipment'){if(levels[type]>=5)return false;levels[type]=Math.min(5,levels[type]+r.equipment)}
 else {const slot=board.findIndex(u=>!u);const chosen=type??runDeck[Math.floor(Math.random()*runDeck.length)];board[slot]={type:chosen,pip:r.pip,cool:0,attack:0,arrival:.5,income:5,skillCD:0};noteRoster()}
 bonusPending=false;document.querySelector('#perk').close();paused=false;nextWave();sync();saveActiveRun();return true;
}
function onProgressUpdate(dt){if(playing&&!ended&&!paused){savedElapsed+=dt;if(savedElapsed>=5){savedElapsed=0;saveActiveRun()}}renderProgress()}
function noteRoster(){for(const u of board)if(u){runStats[u.type].highest=Math.max(runStats[u.type].highest,u.pip);if(!seenStaff.has(u.type)){seenStaff.add(u.type);say(kinds[u.type].name+': “'+(staffRecords.find(r=>r.id===kinds[u.type].file)?.quote||'당직 준비 완료!')+'”')}}}
function describeStats(){const names=['damage','kills','income'];document.querySelector('#result-stats').innerHTML=names.map((key,j)=>{const top=runStats.map((s,i)=>({value:s[key],i})).sort((a,b)=>b.value-a.value)[0];return '<div><small>'+['최다 피해','최다 처치','최다 SP 생산'][j]+'</small><b>'+(top?.value>0?kinds[top.i].name:'기록 없음')+'</b><span>'+Math.floor(top?.value||0)+'</span></div>'}).join('');document.querySelector('#result-title').textContent=tutorialMode?(tutorialWon?'신입 연수 수료!':'여기서 다시 배워봐요'):'수고했어요, 고비!';document.querySelector('#result-title-badge').textContent=tutorialMode?(tutorialWon?'정식 당직자 임명':'연수 재도전'):runStats[3].income>=300?'오늘의 알뜰 당직':kills>=300?'오늘의 야근왕':'무사히 근무 종료';document.querySelector('#result-again').textContent=tutorialMode&&!tutorialWon?'실패한 공격부터 다시':'다시 당직 서기';document.querySelector('#record-highest').textContent='최고 등급 '+Math.max(0,...runStats.map(s=>s.highest));}
function runSnapshot(){return JSON.parse(JSON.stringify({version:1,bossPlans,runTraining,wardChargesUsed,runId,board,levels,sp,life,wave,cost,summonDiscount,enemies:enemies.map(e=>({...e,links:null,linkIds:(e.links||[]).map(n=>enemies.indexOf(n)).filter(i=>i>=0)})),queue,timer,intermission,playing,ended,selected:-1,speed,kills,time,kingEvent,runNormal,runBoss,activeMerc,wardUsed,mercTimer,runDeck,tutorialMode,tutorialWon,trainingItems,runStats,guaranteedMerge,bonusPending,dailyEnabled,dailyRule,seenStaff:[...seenStaff]}))}
function saveActiveRun(){if(!GameSession.canWrite()||!playing||ended)return;try{localStorage.setItem(RUN_SAVE,JSON.stringify({snapshot:runSnapshot(),checkpoint:tutorialCheckpoint}));document.querySelector('#resume-run').hidden=false}catch(e){showMetaStatus('전투 자동 저장에 실패했어요. 코인 저장과 별도로 브라우저 공간을 확인해주세요.')}}
function clearActiveRun(){if(!GameSession.canWrite()||(ended&&runReward&&!runReward.paid))return;try{localStorage.removeItem(RUN_SAVE)}catch(e){}document.querySelector('#resume-run').hidden=true}
function applySnapshot(s,allowSettled=false){if(!s||s.version!==1||!Array.isArray(s.board)||s.board.length!==15||!Array.isArray(s.levels)||s.levels.length!==kinds.length||!Array.isArray(s.enemies)||!Array.isArray(s.queue)||!Array.isArray(s.runDeck)||s.runDeck.length!==5||s.runDeck.some(i=>!Number.isInteger(i)||!kinds[i])||s.board.some(u=>u&&(!kinds[u.type]||!Number.isInteger(u.pip)||u.pip<1||u.pip>7))||s.enemies.some(e=>!legion[e.type]||(e.bossId&&!bossCatalog.some(b=>b.id===e.bossId)))||!Number.isFinite(s.sp)||s.sp<0||!Number.isInteger(s.life)||s.life<1||s.life>3||!Number.isInteger(s.wave)||s.wave<1||!Array.isArray(s.runStats)||s.runStats.length!==kinds.length||s.runStats.some(r=>!r||['damage','kills','income','highest'].some(k=>!Number.isFinite(r[k])||r[k]<0))||!s.trainingItems||['grade','kind','king'].some(k=>!Number.isSafeInteger(s.trainingItems[k])||s.trainingItems[k]<0)||s.levels.some(l=>!Number.isInteger(l)||l<1||l>5)||!s.kingEvent||!['idle','question','refuse','entrance','afterglow'].includes(s.kingEvent.state)||(s.activeMerc!==null&&!mercCatalog[s.activeMerc])||typeof s.runId!=='string'||(!allowSettled&&meta.settled.includes(s.runId)))throw Error('invalid saved run');if((s.runTraining!==undefined&&!validTraining(s.runTraining))||(s.wardChargesUsed!==undefined&&(!Number.isInteger(s.wardChargesUsed)||s.wardChargesUsed<0||s.wardChargesUsed>2)))throw Error('invalid training snapshot');if(s.guaranteedMerge!==undefined&&typeof s.guaranteedMerge!=='boolean'&&(!Number.isInteger(s.guaranteedMerge)||s.guaranteedMerge<0||s.guaranteedMerge>3))throw Error('invalid merge guarantees');if(s.summonDiscount!==undefined&&typeof s.summonDiscount!=='boolean')throw Error('invalid summon discount');if(s.speed!==undefined&&![1,2,3].includes(s.speed))throw Error('invalid speed');const restoredBossPlans=readBossPlans(s);runTraining=s.runTraining?{...s.runTraining}:{staff:1,merc:1};wardChargesUsed=s.wardChargesUsed??(s.wardUsed?1:0);({board,levels,sp,life,wave,cost,enemies,queue,timer,intermission,playing,selected,speed,kills,time,kingEvent,runNormal,runBoss,activeMerc,wardUsed,mercTimer,runDeck,tutorialMode,tutorialWon,trainingItems,runStats,guaranteedMerge,bonusPending,dailyEnabled,dailyRule,runId}=s);speed=s.speed??1;summonDiscount=s.summonDiscount??false;guaranteedMerge=Number(s.guaranteedMerge||0);bossPlans=restoredBossPlans;clearBossWarning();for(const e of enemies){e.links=e.linkIds?.length?e.linkIds.map(i=>enemies[i]).filter(Boolean):null;restoreBoss(e)}ended=false;runReward=null;fx=[];drag=null;itemMode=null;seenStaff=new Set(s.seenStaff);paused=true;setScreen('battle');if(wave%5===4||wave%5===0&&queue.includes('boss'))announceBossWave();sync()}
function resumeRun(){try{const data=JSON.parse(localStorage.getItem(RUN_SAVE));applySnapshot(data.snapshot);tutorialCheckpoint=data.checkpoint;if(bonusPending){renderPerkChoices();document.querySelector('#perk').showModal();}else showGuide('근무 이어하기','저장된 시점에서 다시 시작합니다. 접속하지 않은 시간은 진행하지 않아요.');return true}catch(e){showMetaStatus('저장된 전투를 불러오지 못했어요. 새 당직을 시작할 수 있습니다.');return false}}
function renderDeckOptions(){
 const available=staffRecords.filter(r=>r.group!=='merc'&&staffOwned(r));
 document.querySelector('#deck-tip').textContent=deckSwap===-1?'출전 중 '+meta.deck.length+' / 5 · 대기 직원을 고른 뒤 교체할 출전 직원을 누르세요. 교체 즉시 저장됩니다.':staffRecords.find(r=>r.id===deckSwap).name+' 선택됨 · 교체할 출전 직원을 누르세요. 다시 누르면 취소합니다.';
 document.querySelector('#deck-options').innerHTML=available.map(r=>{const picked=meta.deck.includes(r.id),chosen=deckSwap===r.id;return '<button class="deck-choice '+(picked?'picked ':'')+(chosen?'swap-target':'')+'" data-choice="'+r.id+'" aria-pressed="'+chosen+'"><img src="'+r.image+'" alt=""><strong>'+r.name+'</strong><span>'+r.role+'</span><small>'+(chosen?'◎ 교체 대기':picked?'✓ 출전 중':'대기 직원')+'</small></button>'}).join('');
 for(const r of available)document.querySelector('[data-choice="'+r.id+'"]').onclick=()=>swapDeckStaff(r.id);
}
function swapDeckStaff(id){
 if(!meta.tutorialComplete||playing&&!ended||board.some(Boolean)&&!ended||!meta.staff.includes(id))return false;
 if(!meta.deck.includes(id)&&meta.deck.length<5){if(!saveChange(d=>d.deck.push(id))){document.querySelector('#deck-tip').textContent='저장 실패 · 편성을 바꾸지 않았어요.';return false}deckSwap=-1;renderDeckOptions();renderStaffArchive();sync();return true}
 if(!meta.deck.includes(id)){deckSwap=deckSwap===id?-1:id;renderDeckOptions();return false}
 if(deckSwap===-1)return false;
 const incoming=deckSwap;
 if(!saveChange(d=>{d.deck=d.deck.map(old=>old===id?incoming:old)})){document.querySelector('#deck-tip').textContent='저장 실패 · 편성을 바꾸지 않았어요. 다시 시도해주세요.';return false}
 deckSwap=-1;renderDeckOptions();renderStaffArchive();sync();return true;
}
function openDeck(){if(!meta.tutorialComplete||playing&&!ended)return;if(board.some(Boolean)&&!ended){showMetaStatus('현재 판을 종료하거나 초기화한 뒤 편성할 수 있어요.');return}deckSwap=-1;renderDeckOptions();document.querySelector('#deck').showModal()}
let deckSwap=-1;
document.querySelector('#deck-open').onclick=openDeck;document.querySelector('#deck-close').onclick=()=>document.querySelector('#deck').close();document.querySelector('#guide-next').onclick=()=>{document.querySelector('#guide').close();paused=false;sync()};document.querySelector('#guide').addEventListener('cancel',e=>e.preventDefault());document.querySelector('#perk').addEventListener('cancel',e=>e.preventDefault());for(const id of ['sp','life','merge','equipment','staff'])document.querySelector('#perk-'+id).onclick=()=>choosePerk(id);document.querySelector('#resume-run').onclick=resumeRun;
const baseReset=reset;reset=function(){baseReset();if(!ended)initRunProgress()};
const baseRandomType=randomType;randomType=function(){const pool=playing?runDeck:meta.deck.map(id=>kinds.findIndex(k=>k.file===id));return pool[Math.floor(Math.random()*pool.length)]};
const baseNextWave=nextWave;nextWave=function(){baseNextWave();afterWaveStart()};
const baseSpawn=spawn;spawn=function(type){baseSpawn(type);const e=enemies.at(-1);if(tutorialMode){e.hp*=.4;e.max=e.hp;e.shield*=.4;e.speed*=.8}else if(dailyEnabled){if(dailyRule===0){e.hp*=1.15;e.max*=1.15;e.shield*=1.15}if(dailyRule===2)e.speed*=.9}};
const baseHit=hitEnemy;hitEnemy=function(e,damage,slow,shared=false,bypassShield=false){if(!shared&&dailyEnabled&&dailyRule===1)damage*=1.1;const old=Math.max(0,e.hp)+Math.max(0,e.shield||0);baseHit(e,damage,slow,shared,bypassShield);if(!e.decoy&&typeof attackOwner==='number'&&runStats[attackOwner]){runStats[attackOwner].damage+=Math.max(0,old-Math.max(0,e.hp)-Math.max(0,e.shield||0));if(e.hp<=0&&!e.lastHitType)e.lastHitType=attackOwner+1}};
let attackOwner=null;
const baseRecord=recordKill;recordKill=function(e){if(!e.decoy&&!e.rewarded&&e.lastHitType)runStats[e.lastHitType-1].kills++;baseRecord(e)};
const baseSkill=useSkill;useSkill=function(){attackOwner=board[selected]?.type??null;const old=sp;baseSkill();if(attackOwner!==null){if(attackOwner===3)runStats[3].income+=Math.max(0,sp-old);}attackOwner=null};
const baseChance=failChance;failChance=function(pip){return guaranteedMerge?0:baseChance(pip)};
const baseMerge=merge;merge=function(a,b){const valid=compatible(board[a],board[b])&&a!==b&&!paused&&!ended;const oldA=board[a];const result=baseMerge(a,b);if(valid&&oldA&&!board[a])guaranteedMerge=Math.max(0,Number(guaranteedMerge)-1);noteRoster();if(valid&&oldA&&!board[a]){sync();saveActiveRun()}return result};
const baseSummon=summon;summon=function(){const before=cost;baseSummon();noteRoster();if(cost!==before)saveActiveRun()};document.querySelector('#summon').onclick=summon;document.querySelector('#skill').onclick=useSkill;
const PENDING_REWARD_SAVE='after-hours-defense-pending-v1';
function writePendingSettlement(){
 try{localStorage.setItem(PENDING_REWARD_SAVE,JSON.stringify({version:1,snapshot:runSnapshot()}));return true}catch(e){return false}
}
function restorePendingSettlement(){
 if(!GameSession.canWrite())return;
 try{
  const raw=localStorage.getItem(PENDING_REWARD_SAVE);if(!raw)return;
  const pending=JSON.parse(raw);
  if(pending.version!==1||!pending.snapshot||pending.snapshot.ended!==true)throw Error('invalid pending result');
  const snapshot=pending.snapshot;
  // Dead runs have zero life. Restore for validation, then return to the result,
  // never to active play. Already-paid base rewards may coexist with an older
  // version's pending graduation bonus; settlement remains idempotent.
  if(snapshot.life===0)snapshot.life=1;
  applySnapshot(snapshot,true);ended=true;paused=false;settleRun();sync();
 }catch(e){showMetaStatus('미지급 보상 기록을 불러오지 못했어요. 기존 기록은 보존했습니다.')}
}
const baseSettle=settleRun;
settleRun=function(){
 if(!GameSession.canWrite()||!ended)return;
 if(tutorialMode&&!tutorialWon){runReward={paid:true,total:0};document.querySelector('#result').hidden=false;document.querySelector('#result-text').textContent='연수는 10차까지입니다. 실패한 공격부터 다시 도전할 수 있어요. 체험 아이템은 실제 보유량과 별개입니다.';document.querySelector('#retry-reward').hidden=true;clearActiveRun();describeStats();sync();return}
 const pendingSaved=writePendingSettlement();
 baseSettle(tutorialMode&&tutorialWon?30:0);
 if(!runReward.paid){
  let recovery='저장 공간을 확보한 뒤 이 화면에서 다시 시도해주세요.';
  if(pendingSaved)recovery='미지급 결과를 보관했어요. 다시 접속하면 지급을 재시도합니다.';
  else {try{if(localStorage.getItem(RUN_SAVE))recovery='미지급 결과를 새로 저장하지 못했어요. 다시 접속하면 마지막 자동 저장된 전투부터 복구할 수 있어요.'}catch(e){}}
  document.querySelector('#result-text').textContent+=' · '+recovery;
  document.querySelector('#retry-reward').hidden=false;
 }else{
  try{localStorage.removeItem(PENDING_REWARD_SAVE)}catch(e){}
  clearActiveRun();
 }
 describeStats();
};
const baseRestart=restartTo;restartTo=function(target){if(target==='battle'&&tutorialMode&&!tutorialWon&&ended&&tutorialCheckpoint){try{const checkpoint=JSON.parse(JSON.stringify(tutorialCheckpoint));checkpoint.life=3;applySnapshot(checkpoint);showGuide('연수 재도전',wave+'번째 공격부터 다시 도전해요.');return}catch(e){}}clearActiveRun();baseRestart(target)};
const startOld=document.querySelector('#start').onclick;document.querySelector('#start').onclick=()=>{runDeck=meta.deck.map(id=>kinds.findIndex(k=>k.file===id));startOld()};
const syncOld=sync;sync=function(){syncOld();if(typeof runStats!=='undefined')renderProgress()};
initRunProgress();
try{document.querySelector('#resume-run').hidden=!localStorage.getItem(RUN_SAVE)}catch(e){}
if(typeof window.addEventListener==='function'){window.addEventListener('pagehide',saveActiveRun);document.addEventListener?.('visibilitychange',()=>{if(document.hidden)saveActiveRun()})}

// Keep retry on the complete settlement path, including the one-time graduation award.
document.querySelector('#retry-reward').onclick=()=>{
 document.querySelector('#retry-reward').disabled=true;
 document.querySelector('#retry-reward').textContent='지급 재시도 중…';
 settleRun();
 document.querySelector('#retry-reward').disabled=false;
 document.querySelector('#retry-reward').textContent='보상 지급 재시도';
};
