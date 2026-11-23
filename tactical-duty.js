'use strict';
// Run-local choices; wallet awards use the existing atomic settlement ledger.
window.TacticalDuty=(()=>{
 const q=s=>document.querySelector(s),fresh=()=>({version:1,keep:0,build:null,guardUsed:false,chainCD:0,completed:0});
 let state=fresh(),rearranging=false,choosingBuild=false,ui=false,previewNode=null,trialIndex=6,starterSignature="";
 const builds={chain:['연쇄 잔광','0.8초마다 추가 대상에 피해 25%'],economy:['정산 특근','서기·회계 수입 +25%'],guard:['비상 방벽','첫 돌파 1회 방어']};
 function read(value,snapshot){
  if(value===undefined)return fresh();const s=JSON.parse(JSON.stringify(value));
  if(!s||s.version!==1||![0,1].includes(s.keep)||!(s.build===null||Object.hasOwn(builds,s.build))||typeof s.guardUsed!=='boolean'||!Number.isFinite(s.chainCD)||s.chainCD<0||s.chainCD>1||!Number.isSafeInteger(s.completed)||s.completed<0||s.completed>100000||s.completed%15)throw Error('invalid tactical run');
  if(snapshot&&s.completed&&(snapshot.ended!==true||s.completed!==snapshot.wave))throw Error('invalid completed checkpoint');
  return s;
 }
 function snapshot(){return {...state}}
 function restore(s){state=read(s);rearranging=false;choosingBuild=false;hidePreview();}
 function reset(){state=fresh();rearranging=false;choosingBuild=false;hidePreview();}
 function canMove(){return !tutorialMode&&!ended&&(preparingDuty()||bonusPending&&paused&&rearranging)}
 function move(a,b){
  if(!canMove()||!Number.isInteger(a)||!Number.isInteger(b)||a<0||b<0||a>=15||b>=15||a===b||!board[a]||board[b])return false;
  board[b]=board[a];board[a]=null;selected=-1;boardFocus=b;drag=null;hidePreview();sync();saveActiveRun();return true;
 }
 function keepType(a,b){return !tutorialMode&&state.keep&&a!==b&&compatible(board[a],board[b])?board[b].type:undefined}
 function consumeKeep(){state.keep=0}
 function mergeDetails(a,b){
  if(a===b||!compatible(board[a],board[b]))return null;
  const pip=Math.max(board[a].pip,board[b].pip)+1,keep=keepType(a,b)!==undefined;
  const failure=keep?0:Math.round(failChance(pip)*100),en=document.documentElement?.lang?.startsWith('en');
  const ratio=mergeBasicRatio(board[a],board[b]),change=ratio===null?null:Math.round((ratio-1)*100),basic=en?(change===null?'Role effects differ by staff kind':`Same kind: combined basic DPS ${change>=0?'+':''}${change}%`):(change===null?'운영·지원 효과는 직군별로 달라요':`동일 직군이면 평타 총화력 ${change>=0?'+':''}${change}%`);
  const lines=en?[
   `★${pip} · ${100-failure}% success / ${failure}% failure`,
   `Success: +1 empty cell · ${keep?'target kind stays':'random kind'}`,
   basic+(pip===5?' · ★5 skill unlock':''),
   failure?'Failure: moving staff lost; SP refunded on either outcome':'No failure loss · one protection charge used'
  ]:[
   `★${pip} · 성공 ${100-failure}% / 실패 ${failure}%`,
   `성공: 빈자리 +1 · ${keep?'도착 종류 유지':'종류 랜덤'}`,
   basic+(pip===5?' · ★5 스킬 해금':''),
   failure?'실패: 이동 직원 소멸 · 성공/실패 모두 SP 일부 회수':'실패 손실 없음 · 보장 1회 사용'
  ];
  return {pip,failure,keep,lines};
 }
 function preview(a,b){
  if(!ui||!board[a]||a===b||b<0){hidePreview();return}
  const moving=canMove()&&!board[b],details=mergeDetails(a,b);
  if(!moving&&!details){hidePreview();return}
  if(!moving&&paused){hidePreview();return}
  uiText(previewNode,moving?'↪ 무료 재배치 · 등급·스킬 대기시간 유지':details.lines.join('\n'));
  previewNode.hidden=false;canvas.setAttribute('aria-describedby','tactical-preview');
  positionPreview(b);
 }
 function positionPreview(index){
  const stage=q('.board-stage').getBoundingClientRect(),r=canvas.getBoundingClientRect(),c=cells[index];
  const p=window.BattlePresentation?.enabled?window.BattlePresentation.project(c,stage.width,stage.height):{x:r.left-stage.left+c.x*r.width/600,y:r.top-stage.top+c.y*r.height/600};
  const box=previewNode.getBoundingClientRect();
  previewNode.style.left=Math.max(8,Math.min(stage.width-box.width-8,p.x-box.width/2))+'px';
  const warning=q('#boss-warning')?.getBoundingClientRect();
  const floor=warning&&warning.height>0&&warning.bottom>stage.top?Math.max(8,warning.bottom-stage.top+6):8;
  previewNode.style.top=Math.max(8,Math.min(stage.height-box.height-8,Math.max(floor,p.y-box.height-46)))+'px';
 }
 function planningDetails(index){
  const u=board[index];if(!u)return null;
  const neighbors=u.stun>0?[]:adjacentCells(index).filter(i=>board[i]&&(u.type===16?board[i].type!==16&&board[i].pip>=5:![3,11,16].includes(board[i].type)));
  const liveBoss=enemies.find(e=>e.hp>0&&e.type==='boss'&&!e.decoy),boss=liveBoss?bossDefinition(liveBoss):plannedBoss(wave>0&&wave%5===0?wave:(Math.floor(wave/5)+1)*5);
  const lines=[kinds[u.type].name+' · '+kinds[u.type].desc];
  if(!tutorialMode&&(u.type===2||u.type===4))lines.push(document.documentElement?.lang?.startsWith('en')?'Cleaner wets enemies · Electrician damage +20% while wet':'청소부가 젖게 한 적 · 전기기사 피해 +20%');
  if(rearranging)lines.push('전열 정비: 빈 칸으로 이동 · 합성은 전투 재개 후');
  if(u.type===11)lines.push(u.stun>0?'기절 중 · 인접 공속 지원 중단':'상하좌우 공격 직원 '+neighbors.length+'명 지원 · 가장 강한 공속 지원만 적용');
  else if(u.type===16)lines.push(u.stun>0?'기절 중 · 스킬 충전 지원 중단':'상하좌우 ★5 이상 '+neighbors.length+'명 충전 · 봉투끼리 지원 불가');
  else if(u.type===5)lines.push('점선: 선두를 향한 평타 관통 방향 · ★5 스킬은 방패 무시');
  else if(u.type===14)lines.push('원: 설치된 지뢰 폭발 범위 · 설치 0.45초 뒤 작동');
  else if(u.type===13)lines.push('밀어내기는 일반 적에게만 적용 · 군단장은 밀기 면역');
  else if(u.type===2||u.type===4)lines.push('군단장은 일반 적보다 이동 방해에 강해요 · 예고에 맞춰 스킬 사용');
  else if(u.pip<5)lines.push('★5부터 고유 스킬 · 합성 전 현재 역할을 확인하세요');
  else lines.push('고유 스킬: '+skillDescriptions[u.type]);
  lines.push(boss?(liveBoss?'현재 ':'예고 · ')+boss.short+': '+boss.counter:nextBossText()+' · 확인된 예고에 맞춰 준비하세요');
  const mines=u.type===14&&u.expansionID?expansionState.mines.filter(m=>m.owner===u.expansionID&&m.life>0):[];
  return {lines,neighbors:[11,16].includes(u.type)?neighbors:[],beam:u.type===5?leadingEnemy():null,mines};
 }
 function showPlanning(index){
  if(!ui)return;const plan=planningDetails(index);if(!plan){hidePreview();return;}
  uiText(previewNode,plan.lines.join('\n'));previewNode.hidden=false;canvas.setAttribute('aria-describedby','tactical-preview');positionPreview(index);
 }
 function selectedPreview(){hidePreview();}

 function hidePreview(){if(previewNode)previewNode.hidden=true;if(canvas.getAttribute?.('aria-describedby')==='tactical-preview')canvas.removeAttribute?.('aria-describedby')}
 function finishBonus(id){window.PlayObservations?.noteReward(rewardBundle?.offers.find(o=>o.id===id));choosingBuild=false;rewardBundle=null;bonusPending=false;rearranging=false;hidePreview();q('#perk').close();paused=false;nextWave();sync();saveActiveRun()}
 function choose(id){
  if(tutorialMode||!playing||ended||!bonusPending||!paused||!GameSession.canWrite())return false;
  if(id==='keep'){if(state.keep)return false;state.keep=1;}
  else {if(state.build||!Object.hasOwn(builds,id)||id==='economy'&&!runDeck.includes(3)&&activeMerc!=='accountant')return false;state.build=id;}
  finishBonus(id==='keep'?'keep':'build');return true;
 }
 function buildOptions(){
  const en=document.documentElement?.lang?.startsWith('en');
  return [
   {id:'chain',title:en?'Chain lightning':'연쇄 잔광',effect:en?'Extra hit · 25%':'추가 대상 피해 25%',plan:en?'Group enemies to spread your attacks.':'적이 몰리는 순간 공격 · 밀집 적에게 추가타',eligible:true},
   {id:'economy',title:en?'Overtime accounting':'정산 특근',effect:en?'Income +25%':'서기·회계 수입 +25%',plan:en?'Invest in income before adding damage.':'서기·회계 수입에 투자 · 화력 투자 시점 판단',eligible:runDeck.includes(3)||activeMerc==='accountant'},
   {id:'guard',title:en?'Emergency ward':'비상 방벽',effect:en?'Block 1 breach':'첫 돌파 1회 방어',plan:en?'One safety net; prepare for later breaches.':'위험한 성장 선택의 안전망 · 두 번째 돌파는 주의',eligible:true}
  ];
 }
 function chooseBuild(id){
  if(rewardBundle?.mode!=='choice')return false;
  if(tutorialMode||!playing||ended||!bonusPending||!paused||!GameSession.canWrite()||state.build)return false;
  const option=buildOptions().find(o=>o.id===id&&o.eligible),offer=rewardBundle?.wave===wave&&rewardBundle.offers.find(o=>o.id==='build');
  if(!option||!offer)return false;
  const old=offer.build;offer.build=id;const result=choosePerk('build');if(!result)offer.build=old;return result;
 }
 function showBuildChoices(){
  if(rewardBundle?.mode!=='choice')return false;
  if(!ui||tutorialMode||!playing||ended||!bonusPending||!paused||!GameSession.canWrite()||state.build||!rewardBundle?.offers.some(o=>o.id==='build'))return false;
  choosingBuild=true;const targets=q('#perk-targets'),en=document.documentElement?.lang?.startsWith('en');targets.replaceChildren();
  q('#perk h2').textContent=en?'Choose your strategy':'당직 전략 선택';q('#perk-intro').textContent=en?'One strategy for this shift':'이번 당직에 적용할 전략 1개';q('#perk-back').textContent=en?'Back':'뒤로';
  const legend=document.createElement('legend');legend.textContent=en?'One strategy for this shift':'이번 당직 전략 · 1종만 선택';targets.append(legend);
  for(const option of buildOptions()){
   const button=document.createElement('button');button.type='button';button.dataset.strategy=option.id;button.disabled=!option.eligible;
   for(const[tag,text]of [['strong',option.title],['b',option.effect],['small',option.eligible?option.plan:en?'Requires the clerk in your roster or an equipped accountant.':'근무 명단에 서기 또는 장착한 회계사가 필요해요']]){const node=document.createElement(tag);node.textContent=text;button.append(node)}
   button.onclick=()=>chooseBuild(option.id);targets.append(button);
  }
  q('#perk-options').hidden=true;targets.hidden=false;q('#tactical-bonuses').hidden=true;
  const back=q('#perk-back');back.hidden=false;back.onclick=()=>{choosingBuild=false;renderPerkChoices();q('#perk-build')?.focus()};
  targets.querySelector('button:not(:disabled)')?.focus();return true;
 }
 function startReposition(){if(tutorialMode||!playing||ended||!bonusPending||!paused)return false;rearranging=true;q('#perk').close();selected=-1;sync();return true}
 function endReposition(){if(!rearranging)return false;rearranging=false;selected=-1;hidePreview();renderPerkChoices();q('#perk').showModal();sync();saveActiveRun();return true}
 function cashOut(){
  if(tutorialMode||!playing||ended||!bonusPending||wave<15||wave%15||enemies.some(e=>e.hp>0&&!e.escaped)||queue.length||!GameSession.canWrite())return false;
  state.completed=wave;rewardBundle=null;bonusPending=false;rearranging=false;ended=true;paused=false;drag=null;selected=-1;hidePreview();q('#perk').close();settleRun();sync();return !!runReward?.paid;
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
   face.src=staffPortraitPath(kinds[type].file);face.alt='';name.textContent=r?.name||kinds[type].name;role.textContent=r?.role||kinds[type].name;
   demo.textContent='능력 보기';demo.onclick=()=>showTrial(type);claim.textContent='무료 채용';claim.onclick=()=>claimStarter(type);actions.append(demo,claim);card.append(face,name,role,actions);q('#starter-options').append(card);
  }
 }
 function showTrial(type){
  trialIndex=type;const r=staffRecords.find(r=>r.id===kinds[type].file);q('#staff-trial-title').textContent=r?.name||kinds[type].name;
  q('#trial-face').src=staffPortraitPath(kinds[type].file);q('#trial-ability').textContent=r?.ability||'';q('#trial-skill').textContent=r?.skillText||'';
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
  if(selectedUnit){
   const index=drag?.from??selected,plan=planningDetails(index),source=cells[index];
   context.strokeStyle='#91efd0';context.lineWidth=3;context.setLineDash([5,4]);
   for(const i of plan.neighbors){const c=cells[i];context.strokeRect(c.x-34,c.y-39,68,80)}
   if(plan.beam){const dx=plan.beam.x-source.x,dy=plan.beam.y-source.y,len=Math.hypot(dx,dy)||1,nx=dx/len,ny=dy/len,half=24+trainingTier()*2;
    context.strokeStyle='#fff3a3';for(const side of [-1,1]){context.beginPath();context.moveTo(source.x-ny*half*side,source.y+nx*half*side);context.lineTo(source.x+nx*700-ny*half*side,source.y+ny*700+nx*half*side);context.stroke();}
   }
   context.strokeStyle='#ffce7c';for(const m of plan.mines){context.beginPath();context.arc(m.x,m.y,m.radius,0,Math.PI*2);context.stroke();}
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
  const pane=q('#tactical-bonuses');pane.hidden=tutorialMode||choosingBuild;
  q('#legacy-perk-keep').disabled=!!state.keep;q('#legacy-perk-keep').hidden=true;
  q('#build-choices').hidden=true;
  for(const id of Object.keys(builds))q('#build-'+id).disabled=id==='economy'&&!runDeck.includes(3)&&activeMerc!=='accountant';
  q('#perk-cashout').hidden=tutorialMode||wave<15||wave%15!==0;
  const en=document.documentElement?.lang?.startsWith('en');
  uiText(q('#perk-reposition'),en?'Reposition':'전열 정비');
  uiText(q('#perk-cashout'),en?'Clock out · '+(Math.floor(runNormal/10)+runBoss*5)+' coins':'퇴근 · '+(Math.floor(runNormal/10)+runBoss*5)+' 코인 정산');
  if(typeof document.createElement==='function')uiText(q('#perk-note').closest('details')?.querySelector('summary'),en?'Reward rules':'보상 규칙');
  q('#tactical-owned').hidden=!state.build&&!state.keep;
  uiText(q('#tactical-owned'),[state.build&&builds[state.build][0],state.keep&&'종류 유지 1회'].filter(Boolean).join(' · '));
  if(!drag)selectedPreview();
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
 const oldPerk=renderPerkChoices;renderPerkChoices=function(){choosingBuild=false;oldPerk();refresh()};
 const oldSync=sync;sync=function(){oldSync();refresh()};
 const oldChance=failChance;failChance=function(pip){return !tutorialMode&&state.keep?0:oldChance(pip)};
 const oldIncome=trainingIncome;trainingIncome=function(u){return money(oldIncome(u))};
 const oldAccount=accountantIncome;accountantIncome=function(){return money(oldAccount())};
 const oldBreach=breachDamage;breachDamage=function(amount){if(!tutorialMode&&state.build==='guard'&&!state.guardUsed){state.guardUsed=true;burst('command',518,493,'#91efd0',1);say('비상 방벽 · 돌파 방어');return}return oldBreach(amount)};
 const oldHit=hitEnemy;hitEnemy=function(e,damage,slow,shared=false,bypass=false){
  oldHit(e,damage,slow,shared,bypass);
  if(tutorialMode||state.build!=='chain'||shared||state.chainCD>0||typeof attackOwner!=='number')return;
  const next=enemies.filter(n=>n!==e&&n.hp>0&&Math.hypot(n.x-e.x,n.y-e.y)<=140).sort((a,b)=>a.progress-b.progress)[0];
  if(next){state.chainCD=.8;oldHit(next,damage*.25*rewardSupportMultiplier('damage',next),false,true);objectFlight('lightning',{x:e.x,y:e.y-15},{x:next.x,y:next.y-15},'#e6c889');}
 };
 const oldUpdate=update;update=function(dt){if(playing&&!paused&&!ended)state.chainCD=Math.max(0,state.chainCD-dt);return oldUpdate(dt)};
 // Browser UI is optional in the headless runtime harness.
 if(typeof document.createElement==='function'){
  ui=true;
  const node=(tag,id,text)=>{const e=document.createElement(tag);if(id)e.id=id;if(text)e.textContent=text;return e};
  previewNode=node('div','tactical-preview');previewNode.hidden=true;previewNode.setAttribute('role','status');q('.board-stage').append(previewNode);
  const done=node('button','reposition-done','배치 완료');done.hidden=true;done.onclick=endReposition;q('.battle-controls').prepend(done);
  const prep=node('small','tactical-prep','빈 칸으로 드래그 · 무료 재배치');prep.hidden=true;q('.battle-controls').append(prep);
  const pane=node('section','tactical-bonuses'),keep=node('button','legacy-perk-keep','종류 유지 · 다음 합성 1회 성공 보장'),reposition=node('button','perk-reposition','전열 정비'),cash=node('button','perk-cashout'),owned=node('small','tactical-owned');
  keep.onclick=()=>choose('keep');reposition.onclick=startReposition;cash.onclick=cashOut;
  const choices=node('details','build-choices'),summary=node('summary',null,'이번 당직 전략');choices.append(summary);
  for(const[id,[title,description]]of Object.entries(builds)){const b=node('button','build-'+id);b.append(node('b',null,title),node('small',null,description));b.onclick=()=>choose(id);choices.append(b)}
  const rules=node('details'),rulesTitle=node('summary',null,'보상 규칙'),note=q('#perk-note');note.before(rules);rules.append(rulesTitle,note);
  pane.append(owned,keep,choices,reposition,cash);q('#perk-content-placeholder')?.remove();q('#perk .perk-content').append(pane);pane.after(rules);
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
 return {read,snapshot,restore,reset,move,canMove,keepType,consumeKeep,mergeDetails,planningDetails,preview,selectedPreview,hidePreview,choose,buildOptions,chooseBuild,showBuildChoices,startReposition,endReposition,cashOut,money,eligibleStarter,starterCandidates,claimStarter,markStarterComplete,draw,refresh,repositioning:()=>rearranging,choosingBuild:()=>choosingBuild,completedWave:()=>state.completed||undefined};
})();
