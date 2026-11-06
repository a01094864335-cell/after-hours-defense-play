const {chromium}=require('playwright');
const fs=require('fs'),path=require('path'),assert=require('node:assert/strict');
const out=process.env.UI_QA_DIR||path.resolve(__dirname,'../qa/board-space');
(async()=>{
 fs.mkdirSync(out,{recursive:true});
 const browser=await chromium.launch({executablePath:process.env.UI_CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox']});
 const results=[];
 try {
 for(const [width,height] of [[320,568],[360,640],[375,667],[390,740],[390,844],[430,932]]){
  const page=await browser.newPage({viewport:{width,height},isMobile:true,hasTouch:true,reducedMotion:'reduce'});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto((process.env.UI_BASE_URL||'http://127.0.0.1:8840/')+'?gm=1&coins=400');
  await page.evaluate(()=>{
   document.querySelector('#gm-test-panel').style.display='none';document.body.classList.remove('gm-test-active');
   saveChange(d=>{d.tutorialComplete=true;if(!d.owned.includes('rescue'))d.owned.push('rescue');d.equipped='rescue'});
   restartTo('lobby');document.querySelector('#enter-battle').click();document.querySelector('#promo-skip').click();
  });
  await page.waitForTimeout(150);
  const metrics=await page.evaluate(()=>{
   const data={viewport:[innerWidth,innerHeight]};
   for(const s of ['.battle-top','#next-boss','.board-stage','#game','#approved-battle-support','.battle-controls','.summon-row','.skill-row','.item-buttons','.battle-notice']){
    const r=document.querySelector(s).getBoundingClientRect();data[s]={x:r.x,y:r.y,w:r.width,h:r.height};
   }
   const c=data['#game'],stage=data['.board-stage'];
   data.visibleWorld={left:Math.max(0,-c.x)*600/c.w,right:600-Math.max(0,c.x+c.w-innerWidth)*600/c.w,top:Math.max(0,stage.y-c.y)*600/c.h,bottom:600-Math.max(0,c.y+c.h-stage.y-stage.h)*600/c.h};
   data.controls=[...document.querySelectorAll('.battle-controls button')].map(e=>{const r=e.getBoundingClientRect();return{id:e.id,x:r.x,y:r.y,w:r.width,h:r.height,overflow:e.scrollWidth>e.clientWidth+1}});
   return data;
  });
  if(!await page.evaluate(()=>window.BattlePresentation?.enabled))assert.ok(Math.abs(metrics['#game'].w-metrics['#game'].h)<.01);
  const visible=metrics.visibleWorld;
  assert.ok(visible.left<=12.01&&visible.right>=587.99);
  // Boss badge at y=51, HP bar at 56; bottom entrance/throne labels at 562.
  assert.ok(visible.top<=40.01&&visible.bottom>=587.99);
  for(const c of metrics.controls){assert.ok(!c.overflow,c.id+' text overflow');assert.ok(c.x>=0&&c.x+c.w<=width&&c.y+c.h<=height,c.id+' outside screen')}
  await page.screenshot({path:path.join(out,`after-${width}x${height}.png`)});
  await page.evaluate(()=>{board=Array.from({length:15},()=>({type:0,pip:1,cool:0,attack:0,arrival:0,income:5,skillCD:0}));sync()});
  const box=await page.locator('#game').boundingBox();
  const cells=await page.evaluate(()=>globalThis.eval('cells'));
  const mapped=await page.evaluate(()=>cells.map(c=>window.BattlePresentation?.enabled?BattlePresentation.screenPoint(c):null));
  const screenPoint=i=>mapped[i]||({x:box.x+cells[i].x*box.width/600,y:box.y+cells[i].y*box.height/600});
  for(let i=0;i<15;i++){
   await page.evaluate(()=>{selected=-1;syncSkill()});const p=screenPoint(i);await page.touchscreen.tap(p.x,p.y);
   assert.equal(await page.evaluate(()=>selected),i,`touch cell ${i} at ${width}×${height}`);
  }
  await page.evaluate(()=>{selected=-1;syncSkill()});
  const cdp=await page.context().newCDPSession(page),from=screenPoint(0),to=screenPoint(1);
  await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{...from,id:1}]});
  await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{...to,id:1}]});
  await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
  assert.equal(await page.evaluate(()=>board[0]),null,'drag source consumed');
  assert.ok([1,2].includes(await page.evaluate(()=>board[1].pip)),'touch drag resolved game outcome');
  console.log(`${width} touch selection and drag passed`);
  // Reload between raw CDP drag and Playwright taps to reset the input session.
  await page.reload();
  await page.evaluate(()=>{
   document.querySelector('#gm-test-panel').style.display='none';document.body.classList.remove('gm-test-active');
   for(const d of document.querySelectorAll('dialog[open]'))d.close();
   restartTo('lobby');document.querySelector('#enter-battle').click();document.querySelector('#promo-skip').click();
  });
  for(let i=0;i<5;i++){await page.locator('#summon').tap();await page.waitForTimeout(150)}
  await page.waitForFunction(()=>playing&&wave===1);
  await page.waitForTimeout(900);
  await page.screenshot({path:path.join(out,`playing-${width}x${height}.png`)});
  await page.locator('#pause').tap();await page.locator('#pause-continue').tap();
  assert.equal(await page.evaluate(()=>paused),false);
  await page.evaluate(()=>{playing=false;paused=false;wave=5;enemies=[];for(const x of [82,518]){spawn('boss');Object.assign(enemies.at(-1),{x,y:123,introLeft:3})}sync();GamePerformance.invalidate()});
  await page.waitForTimeout(150);
  await page.screenshot({path:path.join(out,`boss-${width}x${height}.png`)});
  assert.deepEqual(errors,[]);
  results.push({...metrics,touchedCells:15,touchDrag:'passed',startPauseResume:'passed',errors});
  await page.close();
 }
 fs.writeFileSync(path.join(out,'after.json'),JSON.stringify(results,null,2));
 console.log(JSON.stringify(results.map(r=>({viewport:r.viewport,canvas:Math.round(r['#game'].w),touchCells:r.touchedCells,drag:r.touchDrag})),null,2));
 } finally {await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
