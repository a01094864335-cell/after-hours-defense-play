'use strict';
// Run-local choices; wallet awards use the existing atomic settlement ledger.
window.TacticalDuty=(()=>{
 const q=s=>document.querySelector(s),fresh=()=>({version:1,keep:0,build:null,guardUsed:false,chainCD:0,completed:0});
 let state=fresh(),rearranging=false,ui=false,previewNode=null,trialIndex=6,starterSignature="";
 const builds={chain:['연쇄 잔광','0.8초마다 추가 대상에 피해 25%'],economy:['정산 특근','서기·회계 수입 +25%'],guard:['비상 방벽','첫 돌파 1회 방어']};
 function read(value,snapshot){
  if(value===undefined)return fresh();const s=JSON.parse(JSON.stringify(value));
  if(!s||s.version!==1||![0,1].includes(s.keep)||!(s.build===null||Object.hasOwn(builds,s.build))||typeof s.guardUsed!=='boolean'||!Number.isFinite(s.chainCD)||s.chainCD<0||s.chainCD>1||!Number.isSafeInteger(s.completed)||s.completed<0||s.completed>100000||s.completed%15)throw Error('invalid tactical run');
  if(snapshot&&s.completed&&(snapshot.ended!==true||s.completed!==snapshot.wave))throw Error('invalid completed checkpoint');
  return s;
 }
 function snapshot(){return {...state}}
 function restore(s){state=read(s);rearranging=false;hidePreview();}
 function reset(){state=fresh();rearranging=false;hidePreview();}
 function canMove(){return !tutorialMode&&!ended&&(preparingDuty()||bonusPending&&paused&&rearranging)}
 function move(a,b){
  if(!canMove()||!Number.isInteger(a)||!Number.isInteger(b)||a<0||b<0||a>=15||b>=15||a===b||!board[a]||board[b])return false;
  board[b]=board[a];board[a]=null;selected=-1;boardFocus=b;drag=null;hidePreview();sync();saveActiveRun();return true;
 }
 function keepType(a,b){return !tutorialMode&&state.keep&&a!==b&&compatible(board[a],board[b])?board[b].type:undefined}
 function consumeKeep(){state.keep=0}
 function preview(a,b){
  if(!ui||!board[a]||a===b||b<0){hidePreview();return}
  const moving=canMove()&&!board[b],valid=compatible(board[a],board[b]);
  if(!moving&&!valid){hidePreview();return}
  const keep=keepType(a,b)!==undefined,chance=keep?100:Math.round((1-failChance(Math.max(board[a].pip,board[b]?.pip||0)+1))*100);
  previewNode.textContent=moving?'↪ 무료 재배치':`★${Math.max(board[a].pip,board[b].pip)+1} · ${chance}% · ${keep?'종류 유지':'종류 랜덤'}`;
  previewNode.hidden=false;
  const stage=q('.board-stage').getBoundingClientRect(),r=canvas.getBoundingClientRect(),c=cells[b];
  previewNode.style.left=Math.max(8,Math.min(stage.width-224,r.left-stage.left+c.x*r.width/600-108))+'px';
  previewNode.style.top=Math.max(8,Math.min(stage.height-42,r.top-stage.top+c.y*r.height/600-72))+'px';
 }
 function selectedPreview(){
  if(selected<0||!board[selected]||drag){hidePreview();return}
  const targets=board.map((u,i)=>i!==selected&&compatible(board[selected],u)?i:-1).filter(i=>i>=0);
  if(!targets.length||new Set(targets.map(i=>Math.max(board[selected].pip,board[i].pip))).size>1){hidePreview();return}
  preview(selected,targets[0]);
 }
 function hidePreview(){if(previewNode)previewNode.hidden=true}
 function finishBonus(){bonusPending=false;rearranging=false;hidePreview();q('#perk').close();paused=false;nextWave();sync();saveActiveRun()}
 function choose(id){
  if(tutorialMode||!playing||ended||!bonusPending||!paused||!GameSession.canWrite())return false;
  if(id==='keep'){if(state.keep)return false;state.keep=1;}
  else {if(state.build||!Object.hasOwn(builds,id)||id==='economy'&&!runDeck.includes(3)&&activeMerc!=='accountant')return false;state.build=id;}
  finishBonus();return true;
 }
 function startReposition(){if(tutorialMode||!playing||ended||!bonusPending||!paused)return false;rearranging=true;q('#perk').close();selected=-1;sync();return true}
 function endReposition(){if(!rearranging)return false;rearranging=false;selected=-1;hidePreview();renderPerkChoices();q('#perk').showModal();sync();saveActiveRun();return true}
 function cashOut(){
  if(tutorialMode||!playing||ended||!bonusPending||wave<15||wave%15||enemies.some(e=>e.hp>0&&!e.escaped)||queue.length||!GameSession.canWrite())return false;
  state.completed=wave;bonusPending=false;rearranging=false;ended=true;paused=false;drag=null;selected=-1;hidePreview();q('#perk').close();settleRun();sync();return !!runReward?.paid;
 }
 function money(n){return state.build==='economy'&&!tutorialMode?n*1.25:n}
 function eligibleStarter(){return meta.tutorialComplete&&!meta.profile.starterClaim&&!playing&&!saveWarning}
 function starterCandidates(){return kinds.map((k,i)=>i).filter(i=>!meta.staff.includes(kinds[i].file)).sort((a,b)=>[6,7,11].indexOf(b)-[6,7,11].indexOf(a)).slice(0,3)}
 function claimStarter(type){
  if(!eligibleStarter()||!starterCandidates().includes(type))return false;
  const id=kinds[type].file;if(!saveChange(d=>{if(d.profile.starterClaim)throw Error('starter already claimed');d.staff.push(id);d.profile.starterClaim=id}))return false;
  q('#starter-choice').close();renderStaffArchive();sync();return true;
 }
 function markStarterComplete(){if(eligibleStarter()&&!starterCandidates().length)return saveChange(d=>{d.profile.starterClaim='complete'});return false}
 function renderStarter(){
  if(!ui)return;const entry=q('#starter-choice-open');entry.hidden=!eligibleStarter()||!starterCandidates().length;
  if(!eligibleStarter())return;
  const choices=starterCandidates();entry.textContent=choices.length?'🎁 수료 선물 · 직원 선택':'🎁 수료 선물 확인';
  const signature=choices.join(',');if(starterSignature===signature)return;starterSignature=signature;
  q('#starter-options').replaceChildren();
  for(const type of choices){
   const r=staffRecords.find(r=>r.id===kinds[type].file),card=document.createElement('article'),face=document.createElement('img'),name=document.createElement('b'),role=document.createElement('small'),actions=document.createElement('div'),demo=document.createElement('button'),claim=document.createElement('button');
   face.src=staffImagePath(kinds[type].file);face.alt='';name.textContent=r?.name||kinds[type].name;role.textContent=r?.role||kinds[type].name;
   demo.textContent='능력 보기';demo.onclick=()=>showTrial(type);claim.textContent='무료 채용';claim.onclick=()=>claimStarter(type);actions.append(demo,claim);card.append(face,name,role,actions);q('#starter-options').append(card);
  }
 }
 function showTrial(type){
  trialIndex=type;const r=staffRecords.find(r=>r.id===kinds[type].file);q('#staff-trial-title').textContent=r?.name||kinds[type].name;
  q('#trial-face').src=staffImagePath(kinds[type].file);q('#trial-ability').textContent=r?.ability||'';q('#trial-skill').textContent=r?.skillText||'';
  closeTrial();q('#trial-arena').dataset.active='false';q('#trial-result').textContent='';q('#staff-trial').showModal();
 }
 function playTrial(){
  if(!ui||q('#practice-frame'))return;
  const frame=document.createElement('iframe');frame.id='practice-frame';frame.title='저장과 분리된 직원 전투 체험';
  const url=new URL(window.location.href);url.search='';url.searchParams.set('fresh','1');url.searchParams.set('practice',kinds[trialIndex].file);frame.src=url.href;
  q('#staff-trial').dataset.practicing='true';q('#trial-arena').after(frame);
 }
 function closeTrial(){q('#practice-frame')?.remove();if(ui)q('#staff-trial').dataset.practicing='false'}

 function draw(context){
  const selectedUnit=board[drag?.from??selected];
  context.save();
  if(selectedUnit&&[11,16].includes(selectedUnit.type)&&!selectedUnit.stun){
   const source=drag?.from??selected;context.strokeStyle='#91efd0';context.lineWidth=3;context.setLineDash([5,4]);
   for(const i of adjacentCells(source))if(board[i]){const c=cells[i];context.strokeRect(c.x-34,c.y-39,68,80)}
   context.setLineDash([]);
  }
  for(const healer of enemies.filter(e=>e.type==='priest'&&e.hp>0&&e.cast>0)){
   context.strokeStyle='#91efd0bb';context.lineWidth=3;context.beginPath();context.arc(healer.x,healer.y-15,130,0,Math.PI*2);context.stroke();
   for(const ally of enemies)if(ally!==healer&&ally.hp>0&&ally.hp<ally.max&&Math.hypot(ally.x-healer.x,ally.y-healer.y)<130){context.beginPath();context.moveTo(healer.x,healer.y-25);context.lineTo(ally.x,ally.y-25);context.stroke()}
  }
  if(drag?.moved){const to=cellAt(drag);if(to>=0&&to!==drag.from&&(compatible(board[drag.from],board[to])||canMove()&&!board[to])){const c=cells[to];context.strokeStyle='#ffe49b';context.lineWidth=4;context.strokeRect(c.x-36,c.y-41,72,84)}}
  context.restore();
 }
 function refresh(){
  if(!ui)return;
  q('#battle').dataset.repositioning=String(rearranging);
  q('#reposition-done').hidden=!rearranging;
  q('#tactical-prep').hidden=!(appScreen==='battle'&&!tutorialMode&&preparingDuty());
  const pane=q('#tactical-bonuses');pane.hidden=tutorialMode;
  q('#perk-keep').disabled=!!state.keep;
  q('#build-choices').hidden=!!state.build;
  for(const id of Object.keys(builds))q('#build-'+id).disabled=id==='economy'&&!runDeck.includes(3)&&activeMerc!=='accountant';
  q('#perk-cashout').hidden=tutorialMode||wave<15||wave%15!==0;
  uiText(q('#perk-cashout'),'퇴근 · '+(Math.floor(runNormal/10)+runBoss*5)+' 코인 정산');
  q('#tactical-owned').hidden=!state.build&&!state.keep;
  uiText(q('#tactical-owned'),[state.build&&builds[state.build][0],state.keep&&'종류 유지 1회'].filter(Boolean).join(' · '));
  renderStarter();
  if(ended){
   const last=runInsights.breaches.at(-1),hint=q('#result-threat');hint.hidden=!last&&!state.completed;
   const signature=state.completed?'done:'+state.completed:last?.name||'';
   if(hint.dataset.signature!==signature){
    hint.dataset.signature=signature;hint.replaceChildren();
    if(state.completed)hint.textContent='✓ '+state.completed+'웨이브 근무 완료';
    else if(last){
     const enemy=Object.values(legion).find(e=>e.name===last.name),image=document.createElement('img'),label=document.createElement('span');
     image.alt='';image.src=enemy?images[enemy.file].src:'assets/ui-v2/icons/sword.svg';label.textContent='마지막 돌파 · '+last.name;hint.append(image,label);
    }
   }
   if(state.completed)uiText(q('#result-title'),'오늘 당직 완료!');
  }
 }
 const oldPerk=renderPerkChoices;renderPerkChoices=function(){oldPerk();refresh()};
 const oldSync=sync;sync=function(){oldSync();refresh()};
 const oldChance=failChance;failChance=function(pip){return !tutorialMode&&state.keep?0:oldChance(pip)};
 const oldIncome=trainingIncome;trainingIncome=function(u){return money(oldIncome(u))};
 const oldAccount=accountantIncome;accountantIncome=function(){return money(oldAccount())};
 const oldBreach=breachDamage;breachDamage=function(amount){if(!tutorialMode&&state.build==='guard'&&!state.guardUsed){state.guardUsed=true;burst('command',518,493,'#91efd0',1);say('비상 방벽 · 돌파 방어');return}return oldBreach(amount)};
 const oldHit=hitEnemy;hitEnemy=function(e,damage,slow,shared=false,bypass=false){
  oldHit(e,damage,slow,shared,bypass);
  if(tutorialMode||state.build!=='chain'||shared||state.chainCD>0||typeof attackOwner!=='number')return;
  const next=enemies.filter(n=>n!==e&&n.hp>0&&Math.hypot(n.x-e.x,n.y-e.y)<=140).sort((a,b)=>a.progress-b.progress)[0];
  if(next){state.chainCD=.8;oldHit(next,damage*.25,false,true);objectFlight('lightning',{x:e.x,y:e.y-15},{x:next.x,y:next.y-15},'#e6c889');}
 };
 const oldUpdate=update;update=function(dt){if(playing&&!paused&&!ended)state.chainCD=Math.max(0,state.chainCD-dt);return oldUpdate(dt)};
 // Browser UI is optional in the headless runtime harness.
 if(typeof document.createElement==='function'){
  ui=true;
  const node=(tag,id,text)=>{const e=document.createElement(tag);if(id)e.id=id;if(text)e.textContent=text;return e};
  previewNode=node('div','tactical-preview');previewNode.hidden=true;previewNode.setAttribute('role','status');q('.board-stage').append(previewNode);
  const done=node('button','reposition-done','배치 완료');done.hidden=true;done.onclick=endReposition;q('.battle-controls').prepend(done);
  const prep=node('small','tactical-prep','빈 칸으로 드래그 · 무료 재배치');prep.hidden=true;q('.battle-controls').append(prep);
  const pane=node('section','tactical-bonuses'),keep=node('button','perk-keep','종류 유지 · 다음 합성 1회 성공 보장'),reposition=node('button','perk-reposition','전열 정비'),cash=node('button','perk-cashout'),owned=node('small','tactical-owned');
  keep.onclick=()=>choose('keep');reposition.onclick=startReposition;cash.onclick=cashOut;
  const choices=node('details','build-choices'),summary=node('summary',null,'이번 당직 전략');choices.append(summary);
  for(const[id,[title,description]]of Object.entries(builds)){const b=node('button','build-'+id);b.append(node('b',null,title),node('small',null,description));b.onclick=()=>choose(id);choices.append(b)}
  const rules=node('details'),rulesTitle=node('summary',null,'보상 규칙'),note=q('#perk-note');note.before(rules);rules.append(rulesTitle,note);
  pane.append(owned,keep,choices,reposition,cash);q('#perk-content-placeholder')?.remove();q('#perk .perk-content').append(pane);
  const entry=node('button','starter-choice-open');entry.onclick=()=>{if(!eligibleStarter())return;if(!starterCandidates().length){markStarterComplete();sync();return}renderStarter();q('#starter-choice').showModal()};q('#enter-battle').before(entry);
  const starter=node('dialog','starter-choice');starter.innerHTML='<header class="sheet-head"><h2>수료 선물 · 직원 1명</h2><button id="starter-close" aria-label="직원 선택 닫기">×</button></header><div id="starter-options"></div><small>한 번만 무료 채용 · 선택 전 능력 확인</small>';document.body.append(starter);q('#starter-close').onclick=()=>starter.close();
  const trial=node('dialog','staff-trial');trial.innerHTML='<header class="sheet-head"><h2 id="staff-trial-title"></h2><button id="trial-close" aria-label="능력 미리보기 닫기">×</button></header><div id="trial-body"><div id="trial-arena"><img id="trial-face" alt=""><span class="trial-target">♟</span><i class="trial-ray"></i></div><p id="trial-ability"></p><details><summary>고유 스킬</summary><p id="trial-skill"></p></details><button id="trial-play">전투 체험</button><small id="trial-result" role="status"></small><small>능력 미리보기 · 재화와 전투 기록에 영향 없음</small></div>';document.body.append(trial);for(const id of ['starter-close','trial-close']){const image=document.createElement('img');image.src='assets/ui-v2/icons/close.svg';image.alt='';q('#'+id).replaceChildren(image)}
  q('#trial-close').onclick=()=>trial.close();q('#trial-play').onclick=playTrial;trial.addEventListener('close',closeTrial);
  window.addEventListener('message',e=>{const frame=q('#practice-frame');if(frame&&e.source===frame.contentWindow&&e.origin===window.location.origin&&e.data?.type==='staff-practice-finished')trial.close()});
  const hint=node('p','result-threat');hint.hidden=true;q('#result-stats').before(hint);
  // Reposition is a paused planning state, not the normal pause dialog.
  q('#info .help-content').insertAdjacentHTML('afterbegin','<details><summary>전열 정비·합성 보호</summary><p>준비 중·보스 보상 사이에는 직원을 빈 칸으로 옮길 수 있어요. 종류 유지는 도착 직원의 종류를 유지하며 합성을 1회 성공시켜요. 15웨이브마다 보상 화면에서 퇴근 정산을 선택할 수 있어요.</p></details>');
  const oldPause=q('#pause').onclick;q('#pause').onclick=()=>{if(rearranging)endReposition();else oldPause()};
  refresh();
  const practiceId=new URLSearchParams(window.location.search).get('practice'),practiceType=kinds.findIndex(k=>k.file===practiceId);
  if(GMTest.fresh&&practiceType>=0){
   document.body.classList.add('staff-practice');document.body.classList.remove('gm-test-active');if(q('#gm-test-panel'))q('#gm-test-panel').style.display='none';
   saveChange(d=>{d.tutorialComplete=true;d.staff=kinds.map(k=>k.file);d.deck=[practiceId,...BASE_STAFF.filter(id=>id!==practiceId).slice(0,4)]});
   reset();tutorialMode=false;paused=false;setScreen('battle');board[7]={type:practiceType,pip:5,cool:0,attack:0,arrival:0,income:5,skillCD:0};
   if([3,11,16].includes(practiceType))board[6]={type:0,pip:5,cool:0,attack:0,arrival:0,income:5,skillCD:0};
   cost=60;sp=150;startDuty();selected=7;sync();
   const finish=()=>window.parent.postMessage({type:'staff-practice-finished'},window.location.origin);
   q('#battle-back').onclick=finish;q('#battle-back').setAttribute('aria-label','체험 종료');
   advanceProgress=function(){paused=true;showGuide('전투 체험 완료','재화와 근무 기록은 변경되지 않았어요.');q('#guide-next').onclick=finish;};
  }
 }
 return {read,snapshot,restore,reset,move,canMove,keepType,consumeKeep,preview,selectedPreview,hidePreview,choose,startReposition,endReposition,cashOut,money,eligibleStarter,starterCandidates,claimStarter,markStarterComplete,draw,refresh,repositioning:()=>rearranging,completedWave:()=>state.completed||undefined};
})();
