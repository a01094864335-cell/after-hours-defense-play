'use strict';
// Public-site runs use isolated browser contexts; fixtures touch only their local save.
const {chromium}=require('playwright');
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const base=process.env.UI_BASE_URL||'https://a01094864335-cell.github.io/after-hours-defense-play/';
const out=path.resolve(process.env.QA_OUT||'qa/public-e2e-20261116/public');fs.mkdirSync(out,{recursive:true});
const sizes=[[320,568],[390,844],[430,932],[1440,1000],[390,640]];
const report={base,started:new Date().toISOString(),rounds:[],findings:[],errors:[]};
(async()=>{const browser=await chromium.launch({executablePath:process.env.UI_CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox']});
try{for(let round=0;round<10;round++){
 const [width,height]=sizes[round%5],context=await browser.newContext({viewport:{width,height},hasTouch:true,reducedMotion:round%2?'reduce':'no-preference'}),page=await context.newPage();page.setDefaultTimeout(12000);
 const entry={round:round+1,width,height,checks:[],errors:[],requests:[],cancelledRequests:[]};report.rounds.push(entry);
 page.on('pageerror',e=>entry.errors.push(String(e)));page.on('requestfailed',r=>(r.failure()?.errorText==='net::ERR_ABORTED'?entry.cancelledRequests:entry.requests).push({url:r.url(),error:r.failure()}));page.on('response',r=>{if(r.status()>=400)entry.requests.push({status:r.status(),url:r.url()})});
 const check=async(name,fn)=>{try{const details=await fn();entry.checks.push({name,pass:true,details});}catch(e){entry.checks.push({name,pass:false,error:String(e)});console.log('FAIL',round+1,name,String(e));await page.screenshot({path:path.join(out,`${round+1}-failure-${entry.checks.length}.png`)}).catch(()=>{});}fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2));};
 await page.goto(base,{waitUntil:'networkidle',timeout:60000});await page.waitForFunction(()=>typeof GameSession!=='undefined'&&GameSession.canWrite());
 await check('isolated fresh lobby and actual five-summon start',async()=>{
  await page.evaluate(()=>{saveChange(d=>{d.tutorialComplete=true;d.profile.starterClaim='complete'});restartTo('lobby');renderMeta()});
  await page.locator('#asset-lobby-host [data-proxy="#enter-battle"]').tap();await page.locator('#promo-skip').tap();
  while(await page.evaluate(()=>TutorialCoach.speaking()))await page.locator('#coach-next').tap();
  for(let i=0;i<5;i++)await page.locator('#summon').tap();
  await page.waitForFunction(()=>playing&&wave===1);while(await page.evaluate(()=>TutorialCoach.speaking()))await page.locator('#coach-next').tap();assert.equal(await page.evaluate(()=>board.filter(Boolean).length),5);
  await page.locator('#battle-back').tap();await page.locator('#leave-cancel').tap();await page.waitForTimeout(50);assert.equal(await page.evaluate(()=>paused),false);
  await page.locator('#battle-back').tap();await page.locator('#leave-confirm').tap();
 });
 await page.evaluate(()=>{restartTo('lobby');saveChange(d=>{d.staff=kinds.map(k=>k.file);d.owned=MERC_IDS.slice();d.coins=100000;d.tutorialComplete=true;d.profile.starterClaim='complete'});renderMeta()});
 await check('all 24 character dossiers reachable',async()=>{
  await page.locator('#asset-lobby-host [data-proxy="#roster-open"]').tap();
  for(const group of ['staff','merc']){
   await page.locator(`#asset-roster-host [data-group="${group}"]`).tap();
   const ids=await page.locator('#asset-roster-host .r-card').evaluateAll(es=>es.map(e=>e.dataset.record));assert.equal(ids.length,group==='staff'?17:7);
   for(const id of ids){await page.locator(`#asset-roster-host .r-card[data-record="${id}"]`).tap();assert.equal(await page.locator('#roster-detail').isVisible(),true);assert.ok((await page.locator('#roster-detail').innerText()).length>80);await page.locator('#roster-back').tap();}
  }
  await page.locator('#asset-roster-host .r-back').tap();return {staff:17,support:7};
 });
 await check('six training states and exact purchases across both groups',async()=>{
  await page.locator('#asset-lobby-host [data-proxy="#training-entry"]').tap();
  const levels=[round*3+1,round*3+2,round*3+3];
  for(const level of levels)for(const group of ['staff','merc']){
   await page.evaluate(({level,group})=>{saveChange(d=>{d.training[group]=level;d.coins=100000});renderMeta();renderTraining()},{level,group});
   await page.locator(`#asset-training-host [data-group="${group}"]`).tap();
   assert.match(await page.locator('#asset-training-host #level').innerText(),new RegExp('Lv\\.'+level+'(?:\\s|$)'));
   assert.equal(await page.locator('#asset-training-host #effects details').count(),group==='staff'?17:7);
   const before=await page.evaluate(group=>({coins:meta.coins,cost:trainingCost(meta.training[group])}),group);
   if(level<30){await page.locator('#asset-training-host #upgrade').tap();assert.equal(await page.evaluate(group=>meta.training[group],group),level+1);assert.equal(await page.evaluate(()=>meta.coins),before.coins-before.cost);}else assert.equal(await page.locator('#asset-training-host #upgrade').isDisabled(),true);
   await page.locator('#asset-training-host [data-ss-label="effects"]').tap();await page.locator('#asset-training-host #effects summary').first().tap();
   if([5,10,20,30].includes(level)||level===1){await page.screenshot({path:path.join(out,`${round+1}-training-${group}-${level}.png`)});}
   await page.locator('#asset-training-host #effects summary').first().tap();await page.locator('#asset-training-host [data-ss-label="train"]').tap();
  }
  await page.screenshot({path:path.join(out,`${round+1}-training.png`)});
  await page.locator('#asset-training-host .back').tap();await page.waitForFunction(()=>!trainingHistoryPending);
  await page.reload({waitUntil:'networkidle'});await page.waitForFunction(()=>typeof GameSession!=='undefined'&&GameSession.canWrite());return {levels,groups:['staff','merc']};
 });
 await check('every staff real skill and board touch at varied ranks',async()=>{
  await page.evaluate(round=>{saveChange(d=>{d.deck=kinds.slice(round%13,round%13+5).map(k=>k.file);d.training={staff:round*3+1,merc:30-round*3}});reset();setScreen('battle');playing=true;paused=false;wave=8;sp=9999;queue=['normal'];timer=9999;kingEvent.timer=9999;sync()},round);
  const ids=await page.evaluate(()=>kinds.map(k=>k.file));
  for(let type=0;type<ids.length;type++){
   await page.evaluate(({type,round})=>{paused=false;enemies=[];spawn('normal');spawn('knight');spawn('boss');for(const e of enemies){e.hp=e.max=1e8;e.speed=0;e.skill=9999}board=Array(15).fill(null);board[7]={type,pip:5+(round%3),cool:0,attack:0,income:5};selected=-1;sync()},{type,round});
   const p=await page.evaluate(()=>window.BattlePresentation?.enabled?BattlePresentation.screenPoint(cells[7]):{x:document.querySelector('#game').getBoundingClientRect().x+cells[7].x*document.querySelector('#game').getBoundingClientRect().width/600,y:document.querySelector('#game').getBoundingClientRect().y+cells[7].y*document.querySelector('#game').getBoundingClientRect().height/600});
   await page.touchscreen.tap(p.x,p.y);assert.equal(await page.evaluate(()=>selected),7,ids[type]);await page.locator('#skill').tap();assert.ok(await page.evaluate(()=>board[7].skillCD>0),ids[type]);
   assert.equal(await page.evaluate(()=>Number.isFinite(sp)&&enemies.every(e=>Number.isFinite(e.hp))),true);
  }
  await page.screenshot({path:path.join(out,`${round+1}-battle.png`)});return {characters:ids,ranks:5+round%3};
 });
 await check('all seven support abilities and training battle snapshot',async()=>{
  const result=await page.evaluate(()=>{const results=[];for(const id of MERC_IDS){activeMerc=id;mercTimer=0;mercGesture={motionState:null};wardChargesUsed=0;enemies=[];spawn('normal');enemies[0].hp=enemies[0].max=1e8;board[0]={type:0,pip:1,cool:0,attack:0,income:5,stun:1};mercUpdate(20);if(id==='ward')breachDamage(1);if(id==='accountant'){kills++;sp+=accountantIncome()}results.push({id,finite:Number.isFinite(sp)&&enemies.every(e=>Number.isFinite(e.hp))})}sync();return results});assert.ok(result.every(r=>r.finite));return result;
 });
 await check('reward settlement pays once across reload',async()=>{
  await page.evaluate(()=>{for(const d of document.querySelectorAll('dialog[open]'))d.close();reset();setScreen('battle');playing=true;wave=15;bonusPending=true;paused=true;enemies=[];queue=[];runNormal=100;runBoss=3;renderPerkChoices();document.querySelector('#perk').showModal();sync()});
  const coins=await page.evaluate(()=>meta.coins);await page.locator('#perk-cashout').tap();assert.equal(await page.evaluate(()=>meta.coins),coins+25);await page.screenshot({path:path.join(out,`${round+1}-result.png`)});await page.reload({waitUntil:'networkidle'});await page.waitForFunction(()=>typeof GameSession!=='undefined'&&GameSession.canWrite());assert.equal(await page.evaluate(()=>meta.coins),coins+25);assert.equal(await page.evaluate(()=>meta.profile.records.length),1);
 });
 assert.deepEqual(entry.errors,[]);entry.pass=entry.checks.every(c=>c.pass)&&entry.requests.length===0;console.log(`ROUND ${round+1} ${entry.pass?'PASS':'FAIL'} ${width}x${height}: ${entry.checks.filter(c=>c.pass).length}/${entry.checks.length}`);await context.close();fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2));
}}catch(e){report.errors.push(String(e));console.error(e);process.exitCode=1}finally{report.finished=new Date().toISOString();report.pass=report.rounds.length===10&&report.rounds.every(r=>r.pass)&&!report.errors.length;fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2));await browser.close();if(!report.pass)process.exitCode=1}
})();
