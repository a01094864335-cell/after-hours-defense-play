'use strict';
const {chromium}=require('playwright'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),out=process.env.UI_QA_DIR||path.join(root,'qa/comic-battle-20261110'),BASE=process.env.UI_BASE_URL||'http://127.0.0.1:8034/';
const geometry=require('./ui-review/geometry-audit.cjs');fs.mkdirSync(out,{recursive:true});
(async()=>{const b=await chromium.launch({executablePath:process.env.UI_CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox']});const reports=[];
for(const [width,height]of [[320,568],[390,640],[390,684],[390,844],[430,932]]){
 const p=await b.newPage({viewport:{width,height},reducedMotion:'reduce'}),errors=[],missing=[];p.on('pageerror',e=>errors.push(e.message));p.on('response',r=>{if(r.status()>=400&&!r.url().endsWith('favicon.ico'))missing.push(r.url())});
 await p.goto(BASE+'?gm=1&coins=400');await p.evaluate(async()=>{
  document.querySelector('#gm-test-panel').style.display='none';document.body.classList.remove('gm-test-active');meta.tutorialComplete=true;meta.staff=kinds.map(k=>k.file);meta.owned=Object.keys(mercCatalog);meta.equipped='';meta.items.grade=3;meta.items.kind=2;meta.items.king=1;reset();tutorialMode=false;setScreen('battle');playing=true;paused=false;wave=8;sp=240;queue=['normal'];timer=999;intermission=0;
  await Promise.all([...kinds.map(k=>k.file),...Object.values(legion).map(k=>k.file)].filter(id=>Motion.sheets[id]).map(id=>Motion.preload(id).decode()));
  await Promise.all(CharacterPortraits.ids.map(id=>CharacterPortraits.image(id).decode()));await NightWatchArt.arena().decode();
  await Promise.all([...document.querySelectorAll('.item-buttons img')].map(im=>im.decode()));
  await document.fonts.ready;
  // Freeze only this capture's simulation; all paint paths are the real runtime.
  update=()=>{};SkillCutin.clear(true);board=Array.from({length:15},(_,i)=>i<9||i===11?{type:i,pip:i<5?5:3,skillCD:0,cool:0,arrival:0,attack:.1,income:5,motionState:i%3===0?'attack':null,motionAge:.1,motionDuration:.6}:null);selected=3;
  enemies=[];const positions=[[82,465],[82,345],[82,210],[180,123],[310,123],[445,123],[518,210],[518,360]];
  positions.forEach(([x,y],i)=>{spawn(['normal','fast','knight','priest','mage','normal','fast','normal'][i]);Object.assign(enemies.at(-1),{x,y,progress:i*90,hp:enemies.at(-1).max*.7})});
  fx=[{type:0,x:148,y:220,tx:82,ty:210,life:.4,max:.8,color:'#ffdf66'},{type:2,x:300,y:225,tx:82,ty:345,life:.4,max:.8,color:'#71eeea'},{effect:'lightning',x:452,y:222,tx:518,ty:210,life:.2,max:.5,color:'#fff197'}];
  say('공격 8 · 마왕성 안뜰 방어 중');sync();draw();
 });await p.waitForTimeout(await p.locator('#battle').evaluate(e=>e.classList.contains('battle-exact'))?2550:150);await p.screenshot({path:out+`/${width}x${height}-playing.png`});
 const running=await p.evaluate(geometry);await p.locator('#item-grade').click();await p.screenshot({path:out+`/${width}x${height}-item-selected.png`});const item=await p.evaluate(geometry);await p.locator('#item-grade').click();
 await p.locator('#pause').click();await p.screenshot({path:out+`/${width}x${height}-paused.png`});const paused=await p.evaluate(geometry);await p.locator('#pause-continue').click();
 await p.evaluate(()=>{enemies=[];fx=[];board=Array.from({length:15},(_,i)=>({type:i,pip:5,skillCD:12,cool:10,arrival:0,income:5}));sync();draw()});await p.screenshot({path:out+`/${width}x${height}-dense.png`});
 for(const [type,id]of [[0,'brik'],[3,'gobi'],[4,'jjit']]){await p.evaluate(type=>{paused=false;meta.profile.compactFX=false;SkillCutin.clear(true);SkillCutin.staff(board[type]);SkillCutin.tick(.01);SkillCutin.tick(.15);SkillCutin.render()},type);await p.screenshot({path:out+`/${width}x${height}-${id}-cutin.png`});}
 reports.push({viewport:[width,height],errors,missing,running,item,paused});await p.close();
}
await b.close();fs.writeFileSync(out+'/play-report.json',JSON.stringify(reports,null,2));console.log(JSON.stringify(reports.map(r=>({viewport:r.viewport,errors:r.errors,missing:r.missing,issues:[r.running.issues.length,r.item.issues.length,r.paused.issues.length]}))));
})().catch(e=>{console.error(e);process.exit(1)});
