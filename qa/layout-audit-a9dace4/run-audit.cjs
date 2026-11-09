'use strict';
const {chromium}=require('playwright');
const fs=require('node:fs'),path=require('node:path');
const audit=require('./geometry-audit.cjs'),fixture=require('./presentation-fixtures.cjs');
const ROOT=process.env.UI_QA_DIR||__dirname,BASE=process.env.UI_BASE_URL||'http://127.0.0.1:8016/';
const results=[],failures=[],candidates=new Map();
fs.mkdirSync(path.join(ROOT,'screens'),{recursive:true});
const cases=[];
function add(id,family,script,arg=null,fullOnly=false){cases.push({id,family,script,arg,fullOnly});}
const reset=`window.__restoreGeometryFixture?.();for(const d of [...document.querySelectorAll('dialog[open]')].reverse())d.close();SkillCutin.clear(true);for(const d of document.querySelectorAll('details'))if(d.id!=='gm-test-panel')d.open=false;if(TutorialCoach.speaking())while(TutorialCoach.speaking())document.querySelector('#coach-next').click();meta.tutorialComplete=true;meta.staff=[...BASE_STAFF,...RECRUIT_STAFF];meta.owned=[...MERC_IDS];meta.equipped=null;meta.coins=400;meta.training={staff:1,merc:1};meta.profile.starterClaim=null;meta.deck=BASE_STAFF.slice(0,5);saveWarning='';restartTo('lobby');renderMeta();`;
const battle=`reset();tutorialMode=false;meta.tutorialComplete=true;setScreen('battle');board=Array.from({length:15},(_,i)=>i<5?{type:i,pip:1,cool:100,attack:0,arrival:0,income:5}:null);runDeck=meta.deck.map(id=>kinds.findIndex(k=>k.file===id));playing=true;paused=false;wave=8;life=3;sp=240;enemies=[];queue=[];timer=999;intermission=0;sync();`;
const partial=`meta.staff=[...BASE_STAFF,...RECRUIT_STAFF.slice(0,3)];meta.owned=MERC_IDS.slice(0,3);meta.equipped=MERC_IDS[0];renderMeta();`;
add('lobby-returning','lobby','renderProgress();');
add('lobby-fresh','lobby','meta.tutorialComplete=false;reset();setScreen("lobby");sync();');
add('lobby-partial-support','lobby',partial);
add('lobby-large-wallet','lobby','meta.coins=999999999;renderMeta();');
for(let i=0;i<15;i++)for(const resume of [false,true])add(`lobby-daily-${i}-${resume?'resume':'new'}`,'lobby',`dailyEnabled=true;tutorialMode=false;dailyRule=arg.i;renderProgress();document.querySelector('#resume-run').hidden=!arg.resume;`,{i,resume},true);
for(let i=0;i<7;i++)add('lobby-support-'+i,'lobby','meta.equipped=MERC_IDS[arg];renderMeta();',i,true);
add('daily-list','daily',`document.querySelector('#daily-events-open').click();`);
add('deck-all','deck',`document.querySelector('#deck-open').click();`);
add('deck-partial','deck',partial+`document.querySelector('#deck-open').click();`);
add('roster-hired','roster',`document.querySelector('#roster-open').click();document.querySelector('#roster-tab-staff').click();`);
add('roster-incoming','roster',partial+`document.querySelector('#roster-open').click();document.querySelector('#roster-tab-incoming').click();`);
add('roster-supports','roster',partial+`document.querySelector('#roster-open').click();document.querySelector('#roster-tab-merc').click();`);
add('shop-pack','shop',partial+`document.querySelector('#shop-open').click();shopTab('pack');`);
add('shop-items','shop',`document.querySelector('#shop-open').click();shopTab('items');`);
add('shop-no-money','shop',partial+`meta.coins=11;document.querySelector('#shop-open').click();renderMeta();renderRecruitShop();shopTab('pack');`);
add('shop-guarantee','shop',partial+`meta.profile.pity=9;meta.recruitPoints=10;document.querySelector('#shop-open').click();renderRecruitShop();shopTab('pack');`);
add('shop-complete','shop',`document.querySelector('#shop-open').click();shopTab('pack');`);
add('settings','settings',`document.querySelector('#menu-open').click();`);
add('save-transfer','backup',`document.querySelector('#menu-open').click();document.querySelector('#save-transfer-open').click();`);
add('records-empty','records',`document.querySelector('#journey-summary').click();`);
add('records-full','records',`meta.profile.records=Array.from({length:20},(_,i)=>({wave:40+i,coins:123+i,rule:'마왕성 장기 당직 · 복합 변주',training:{staff:30,merc:30},king:{appearances:3}}));document.querySelector('#journey-summary').click();renderJourney();`);
add('story-archive-owned','stories',`document.querySelector('#lobby-story-collection').click();`);
add('story-archive-locked','stories',`meta.stories=[];document.querySelector('#lobby-story-collection').click();`);
add('starter-selection','starter',partial+`TacticalDuty.refresh();document.querySelector('#starter-choice-open').click();`);
add('trial-preview','trial',partial+`TacticalDuty.refresh();document.querySelector('#starter-choice-open').click();document.querySelector('#starter-options button').click();`);
add('recruit-duplicate','recruit',`revealRecruit('goblin-guard',true);`);
add('recruit-new-staff','recruit',`revealRecruit('ghost-courier',false);HiringStories.close();`);
add('recruit-new-support','recruit',`revealRecruit('merc-'+MERC_IDS[0],false);HiringStories.close();`);
add('battle-idle','battle',battle);
add('battle-selected','battle',battle+`board[7]={type:4,pip:5,cool:100,attack:0,arrival:0,income:5};selected=7;sync();`);
add('battle-full','battle',battle+`board=Array.from({length:15},(_,i)=>({type:i%kinds.length,pip:i%7+1,cool:100,attack:0,arrival:0,income:5}));selected=7;sync();`);
add('battle-skill-cooldown','battle',battle+`board[7]={type:4,pip:5,cool:100,attack:0,arrival:0,income:5,skillCD:20};selected=7;sync();`);
add('battle-item-target','battle',battle+`itemMode='grade';document.querySelector('#item-hint').textContent='같은 등급 직원을 차례로 선택하세요. 종류가 달라도 합성할 수 있어요.';sync();`);
add('battle-pause','pause',battle+`paused=true;sync();`);
add('battle-leave','leave',battle+`document.querySelector('#battle-back').click();`);
add('battle-info','help',battle+`document.querySelector('#skill-help').click();`);
for(let i=0;i<4;i++)add('equipment-'+i,'equipment',battle+`meta.deck=Array.from({length:5},(_,n)=>kinds[(arg*5+n)%kinds.length].file);runDeck=meta.deck.map(id=>kinds.findIndex(k=>k.file===id));sync();document.querySelector('#upgrade-open').click();`,i,i>0);
for(const wave of [5,15,20])add('bonus-wave-'+wave,'bonus',battle+`wave=arg;life=1;bonusPending=true;paused=true;renderPerkChoices();document.querySelector('#perk').showModal();sync();`,wave);
for(const target of ['equipment','staff'])add('bonus-target-'+target,'bonus',battle+`wave=20;life=1;bonusPending=true;paused=true;renderPerkChoices();document.querySelector('#perk').showModal();showPerkTargets(arg);sync();`,target);
add('battle-reposition','battle',battle+`wave=5;bonusPending=true;paused=true;renderPerkChoices();document.querySelector('#perk').showModal();TacticalDuty.startReposition();sync();`);
add('guide-long-copy','guide',battle+`showGuide('신입 연수 · 근무 안내','직원 소환 후 같은 종류와 등급을 선택해 합성하세요. 합성 실패 시에는 이동한 직원이 사라지고 다음 유료 소환에 할인이 적용됩니다. 5등급부터 고유 스킬을 사용할 수 있어요. 보드의 빈자리와 근무 명단을 확인하세요.');`);
add('coach-intro','tutorial',`meta.tutorialComplete=false;reset();setScreen('battle');TutorialCoach.speak('첫 전투를 앞두고','마왕님, 첫 전투인데… 제가 어떻게 해야 할까요?','마왕의 대답 듣기',()=>{},'gobi');sync();`);
add('coach-long-copy','tutorial',battle+`TutorialCoach.speak('같은 종류·등급을 합성하거라','직원 소환을 완료했구나. 같은 종류와 같은 등급의 직원 두 명을 선택하면 더 높은 등급의 직원으로 합성할 수 있다. 실패하면 이동한 직원만 사라지고 대상은 유지된다.','알겠습니다 · 계속하기',()=>{},'king');sync();`);
add('result-paid','result',battle+`wave=18;kills=126;runNormal=125;runBoss=1;ended=true;settleRun();sync();`);
add('result-pending','result',battle+`wave=18;kills=126;runNormal=125;runBoss=1;ended=true;settleRun();runReward.paid=false;describeStats();sync();document.querySelector('#retry-reward').hidden=false;`);
add('result-training-failed','result',`meta.tutorialComplete=false;reset();setScreen('battle');tutorialMode=true;tutorialWon=false;wave=6;ended=true;settleRun();sync();`);
for(const group of ['staff','merc'])for(const level of [1,5,10,20,30])add(`training-${group}-${level}`,'training',`meta.training[arg.group]=arg.level;trainingGroup=arg.group;trainingRenderKey='';openTraining();`,{group,level},level!==1&&level!==30);
// Catalog-dependent cases are appended after reading the deployed runtime.
async function main(){
 const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});
 const catalogPage=await browser.newPage();await catalogPage.goto(BASE+'?gm=1&coins=400');await catalogPage.waitForTimeout(150);
 const catalog=await catalogPage.evaluate(()=>({staff:staffRecords.map(r=>({id:r.id,locked:RECRUIT_STAFF.includes(r.id)||r.id.startsWith('merc-')})),stories:CastleStories.map(s=>({id:s.id,original:!!s.original,panels:4})),hiring:HIRING_STORIES.map(s=>({id:s.id,panels:s.panels.length})),dialogs:[...document.querySelectorAll('dialog')].map(d=>d.id)}));
 await catalogPage.close();fs.writeFileSync(path.join(ROOT,'catalog.json'),JSON.stringify(catalog,null,2));
 for(const record of catalog.staff){
  add('staff-owned-'+record.id,'staff-detail',`document.querySelector('#roster-open').click();showStaffRecord(arg);`,record.id);
  if(record.locked)add('staff-locked-'+record.id,'staff-detail',partial+`if(arg.startsWith('merc-'))meta.owned=meta.owned.filter(id=>id!==arg.slice(5));else meta.staff=meta.staff.filter(id=>id!==arg);document.querySelector('#roster-open').click();showStaffRecord(arg);`,record.id);
 }
 for(const story of catalog.stories)for(let panel=0;panel<4;panel++)add(`story-${story.id}-${panel}`,'story-reader',`castleReplay=true;currentCastleStory=CastleStories.find(s=>s.id===arg.id);promoIndex=arg.panel;renderCastleStory();`,{id:story.id,panel},true);
 for(const story of catalog.hiring)for(let panel=0;panel<story.panels;panel++)add(`hiring-${story.id}-${panel}`,'hiring-reader',`HiringStories.open(arg.id);for(let i=0;i<arg.panel;i++)document.querySelector('[data-hire-next]').click();`,{id:story.id,panel},true);
 // Longest story text per shared layout is also covered in every stress matrix.
 const storySamples=catalog.stories.filter(s=>s.original||['midnight-soup','first-shift'].includes(s.id)).slice(0,2);
 for(const story of storySamples)for(let panel=0;panel<4;panel++)add(`stress-story-${story.id}-${panel}`,'story-reader',`castleReplay=true;currentCastleStory=CastleStories.find(s=>s.id===arg.id);promoIndex=arg.panel;renderCastleStory();`,{id:story.id,panel});
 for(const group of ['staff','merc'])for(let index=0;index<(group==='staff'?17:7);index++)add(`training-single-${group}-${index}`,'training-detail',`trainingGroup=arg.group;trainingRenderKey='';openTraining();document.querySelectorAll('.training-character')[arg.index].open=true;document.querySelectorAll('.training-character')[arg.index].scrollIntoView({block:'start'});`,{group,index},true);
 fs.writeFileSync(path.join(ROOT,'cases.json'),JSON.stringify(cases,null,2));
 const viewports=[[320,568],[390,640],[390,844],[430,932]];
 const modes=process.env.AUDIT_MODES?process.env.AUDIT_MODES.split(','):['ko100','ko130','en130'];
 let completed=0;
 for(const [width,height]of viewports)for(const mode of modes){
  const key=`${width}x${height}-${mode}`;
  const p=await browser.newPage({viewport:{width,height},isMobile:true,hasTouch:true,reducedMotion:'reduce'});
  const pageErrors=[];p.on('pageerror',e=>pageErrors.push(e.message));
  await p.goto(BASE+'?gm=1&coins=400');await p.waitForTimeout(150);
  await p.evaluate(()=>{document.querySelector('#gm-test-panel').style.display='none';document.body.classList.remove('gm-test-active');});
  const selected=cases.filter(c=>(mode==='ko100'||!c.fullOnly)&&(!process.env.AUDIT_CASE_FILTER||new RegExp(process.env.AUDIT_CASE_FILTER).test(c.id)));
  for(let i=0;i<selected.length;i++){
   const state=selected[i];
   try{
    await p.evaluate(({reset,script,arg})=>{Function(reset)();Function('arg',script)(arg);},{reset,script:state.script,arg:state.arg});
    await p.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));
    // Decode current foreground assets; lazy offscreen assets are decoded during each scroll check.
    await p.locator('img').evaluateAll(imgs=>Promise.all(imgs.filter(i=>i.getClientRects().length&&i.complete).map(i=>i.decode().catch(()=>{}))));
    await check(p,key,state,'closed',mode,width===390&&height===844);
    if(!['story-reader','hiring-reader','tutorial','pause'].includes(state.family)){
     const has=await p.evaluate(()=>{const scope=[...document.querySelectorAll('dialog[open]')].at(-1)||document.querySelector('#app-shell');const details=[...scope.querySelectorAll('details')].filter(e=>e.id!=='gm-test-panel'&&e.getClientRects().length&&!e.closest('[hidden]'));for(const d of details)d.open=true;return details.length;});
     if(has){await p.evaluate(()=>new Promise(r=>requestAnimationFrame(r)));await check(p,key,state,'expanded',mode,false);}
    }
   }catch(error){failures.push({matrix:key,case:state.id,error:error.message});}
   completed++;
   if(i%40===0){save();console.log(JSON.stringify({matrix:key,case:i,total:selected.length,completed,failures:failures.length,patterns:candidates.size}));}
  }
  if(pageErrors.length)failures.push({matrix:key,type:'page-errors',errors:[...new Set(pageErrors)]});
  await p.close();save();
  console.log(JSON.stringify({finished:key,completed,failures:failures.length,patterns:candidates.size}));
 }
 await browser.close();save();
 function save(){fs.writeFileSync(path.join(ROOT,'results.json'),JSON.stringify({results,failures,candidates:[...candidates.values()]},null,2));}
}
async function check(p,matrix,state,variant,mode,captureBase){
 await p.evaluate(fixture,mode);
 const restore=await p.evaluate(()=>{
  const scope=[...document.querySelectorAll('dialog[open]')].at(-1)||document.querySelector('#app-shell');
  const els=[...scope.querySelectorAll('*')].filter(e=>{const s=getComputedStyle(e);return e.clientHeight>40&&e.scrollHeight>e.clientHeight+4&&/auto|scroll/.test(s.overflowY)&&e.getClientRects().length&&!e.closest('[hidden]');});
  return els.map((e,i)=>{e.dataset.geometryScroll=String(i);return {index:i,top:e.scrollTop,total:e.scrollHeight,height:e.clientHeight};});
 });
 // Include every scroll window (not just top/bottom), preserving original positions.
 const positions=[{label:'top',offsets:restore.map(x=>({index:x.index,top:0}))}];
 for(const s of restore){const step=Math.max(30,s.height*.85);for(let offset=step;offset<s.total-s.height;offset+=step)positions.push({label:`scroll-${s.index}-${Math.round(offset)}`,offsets:[{index:s.index,top:offset}]});positions.push({label:`bottom-${s.index}`,offsets:[{index:s.index,top:s.total-s.height}]});}
 const originalDetails=await p.evaluate(()=>[...([...document.querySelectorAll('dialog[open]')].at(-1)||document.querySelector('#app-shell')).querySelectorAll('details[open]')].map(e=>e.id||e.querySelector('summary')?.textContent?.trim().slice(0,70)));
 for(const pos of positions){
  await p.evaluate(offsets=>{for(const s of offsets){const e=document.querySelector('[data-geometry-scroll="'+s.index+'"]');if(e)e.scrollTop=s.top;}},pos.offsets);
  await p.evaluate(()=>new Promise(r=>requestAnimationFrame(r)));
  const found=await p.evaluate(audit);
  const row={matrix,case:state.id,family:state.family,variant,position:pos.label,openDetails:originalDetails,...found};
  // Stable signature across content variations. Raw occurrences remain available in results.json.
  const signatures=[];
  for(const issue of found.issues){
   const signature=[matrix,issue.type,issue.a,issue.b].join('|');signatures.push(signature);
   let group=candidates.get(signature);
   if(!group){group={signature,matrix,type:issue.type,a:issue.a,b:issue.b,count:0,examples:[],screenshot:null};candidates.set(signature,group);}
   group.count++;
   if(group.examples.length<5)group.examples.push({case:state.id,variant,position:pos.label,issue});
  }
  const newGroups=signatures.map(s=>candidates.get(s)).filter(g=>!g.screenshot);
  let shot=null;
  if((captureBase&&variant==='closed'&&pos.label==='top'&&!['story-reader','hiring-reader'].includes(state.family))||newGroups.length){
   // One image per new geometry pattern, shared by all candidate issues in that image.
   shot=`screens/${matrix}-${state.id}-${variant}-${pos.label}.png`.replace(/[^a-zA-Z0-9/_\-.]/g,'_');
   await p.screenshot({path:path.join(ROOT,shot)});
   for(const group of newGroups)group.screenshot=shot;
  }
  row.screenshot=shot;results.push(row);
 }
 await p.evaluate(list=>{for(const s of list){const e=document.querySelector('[data-geometry-scroll="'+s.index+'"]');if(e)e.scrollTop=s.top;}for(const e of document.querySelectorAll('[data-geometry-scroll]'))delete e.dataset.geometryScroll;},restore);
 await p.evaluate(()=>window.__restoreGeometryFixture?.());
}
main().catch(e=>{console.error(e);fs.writeFileSync(path.join(ROOT,'fatal.json'),JSON.stringify({error:e.stack}));process.exit(1)});
