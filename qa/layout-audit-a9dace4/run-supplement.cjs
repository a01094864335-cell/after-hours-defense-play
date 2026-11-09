const {chromium}=require('playwright'),fs=require('fs'),path=require('path');
const audit=require('./geometry-audit.cjs'),canvasAudit=require('./canvas-audit.cjs'),fixture=require('./presentation-fixtures.cjs');
const out=path.join(__dirname,'supplement');fs.mkdirSync(out+'/screens',{recursive:true});const rows=[],errors=[];
const setup=`for(const d of [...document.querySelectorAll('dialog[open]')].reverse())d.close();window.__restoreGeometryFixture?.();window.__geometryScopeOverride=null;SkillCutin.clear(true);meta.tutorialComplete=true;reset();tutorialMode=false;setScreen('battle');board=Array.from({length:15},(_,i)=>({type:i%kinds.length,pip:5,cool:100,attack:0,arrival:0,income:5}));runDeck=meta.deck.map(id=>kinds.findIndex(k=>k.file===id));playing=true;paused=false;wave=8;sp=240;enemies=[];queue=[];timer=999;intermission=0;sync();`;
(async()=>{const b=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});
 for(const [w,h]of [[320,568],[390,640],[390,844],[430,932]]){
  const p=await b.newPage({viewport:{width:w,height:h},isMobile:true,hasTouch:true,reducedMotion:'reduce'});await p.goto('http://127.0.0.1:8016/?gm=1&coins=400');await p.waitForTimeout(150);await p.evaluate(()=>{document.querySelector('#gm-test-panel').style.display='none';document.body.classList.remove('gm-test-active')});
  async function record(id,canvas=false){await p.evaluate(()=>new Promise(r=>requestAnimationFrame(r)));const result=await p.evaluate(audit),c=canvas?await p.evaluate(canvasAudit):null;let shot=null;if(result.issues.length||c?.issues.length||['notice','shop-horizontal','practice-frame','orientation','session'].includes(id)){shot=`screens/${w}x${h}-${id}.png`;await p.screenshot({path:out+'/'+shot});}rows.push({viewport:[w,h],case:id,geometry:result,canvas:c,screenshot:shot});}
  const types=await p.evaluate(()=>kinds.length);
  for(let type=0;type<types;type++)for(const pip of [1,5,7]){
   try{await p.evaluate(({setup,type,pip})=>{Function(setup)();board[7]={type,pip,cool:100,attack:0,arrival:0,income:5,skillCD:pip===7?9:0};selected=7;sync();},{setup,type,pip});await record('selected-'+type+'-'+pip,true);}catch(e){errors.push({viewport:[w,h],case:'selected-'+type+'-'+pip,error:e.message});}
  }
  for(const compact of [false,true])for(let type=0;type<types;type++){
   await p.evaluate(({setup,compact,type})=>{Function(setup)();meta.profile.compactFX=compact;SkillCutin.staff({type});SkillCutin.tick(.01);SkillCutin.render();},{setup,compact,type});await record('cutin-staff-'+type+'-'+compact);
  }
  const bosses=await p.evaluate(()=>bossCatalog.map(b=>b.id));
  for(const id of bosses){await p.evaluate(({setup,id})=>{Function(setup)();const def=bossCatalog.find(b=>b.id===id);SkillCutin.boss({type:'boss',bossId:id,hp:100,max:100,x:300,y:100});SkillCutin.tick(.01);SkillCutin.render();},{setup,id});await record('cutin-boss-'+id);await p.evaluate(({setup,id})=>{Function(setup)();wave=10;bossPlans[10]=id;showBossWarning(10);sync();},{setup,id});await record('boss-warning-'+id,true);}
  await p.evaluate(({setup})=>{Function(setup)();document.querySelector('.battle-notice').click();},{setup});await record('notice');
  await p.evaluate(()=>{for(const d of [...document.querySelectorAll('dialog[open]')].reverse())d.close();restartTo('lobby');meta.staff=[...BASE_STAFF,...RECRUIT_STAFF.slice(0,3)];meta.owned=[];document.querySelector('#shop-open').click();shopTab('pack');const body=document.querySelector('#shop>.panel-scroll-body');body.scrollLeft=body.scrollWidth;});await record('shop-horizontal');
  await p.evaluate(()=>{for(const d of [...document.querySelectorAll('dialog[open]')].reverse())d.close();restartTo('lobby');meta.profile.starterClaim=null;TacticalDuty.refresh();document.querySelector('#starter-choice-open').click();document.querySelector('#starter-options button').click();document.querySelector('#trial-play').click();});
  await p.locator('#practice-frame').waitFor();const frame=await p.locator('#practice-frame').elementHandle().then(e=>e.contentFrame());await frame.waitForFunction(()=>typeof BattlePresentation!=='undefined');await record('practice-frame');rows.push({viewport:[w,h],case:'practice-frame-inner',geometry:await frame.evaluate(audit)});
  await p.evaluate(()=>{for(const d of [...document.querySelectorAll('dialog[open]')].reverse())d.close();window.__geometryScopeOverride='#rotation-notice';document.querySelector('#rotation-notice').hidden=false;});await record('orientation');
  await p.close();fs.writeFileSync(out+'/results.json',JSON.stringify({rows,errors},null,2));console.log(JSON.stringify({viewport:[w,h],rows:rows.length,errors:errors.length}));
 }
 await b.close();fs.writeFileSync(out+'/results.json',JSON.stringify({rows,errors},null,2));
})().catch(e=>{console.error(e);fs.writeFileSync(out+'/fatal.json',JSON.stringify({error:e.stack}));process.exit(1)});
