const {chromium}=require('playwright');
const fs=require('fs'),path=require('path'),cp=require('child_process'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),rev=process.env.UI_BEFORE_REV||'b996b814a2d49e417403a01ce7d2535e5ddd3a5e';
const files=['index.html','ui.css','approved-ui.js','development.js','game.js','live-ui-audit-fixes.js','lobby-duo.js','progression.js','recruitment.js','reference-ui.js','shop-system.js','staff-codex.js','training-ui.js','usability.js'];
const old=new Map(files.map(f=>[f,cp.execFileSync('git',['show',`${rev}:${f}`],{cwd:root})]));
const scenarios={lobby:()=>{},roster:()=>document.querySelector('#roster-open').click(),training:()=>openTraining(),shop:()=>document.querySelector('#shop-open').click(),daily:()=>document.querySelector('#daily-events-open').click(),records:()=>document.querySelector('#journey-summary').click(),stories:()=>document.querySelector('#lobby-story-collection').click(),battle:()=>{document.querySelector('#enter-battle').click();document.querySelector('#promo-skip').click()},result:()=>{ended=true;playing=false;wave=18;settleRun();sync()}};
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.UI_CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox']});
 const report={beforeRevision:rev,screens:{},checks:[]},out=process.env.UI_QA_DIR||path.join(root,'qa/less-ui-text');fs.mkdirSync(out,{recursive:true});
 try{
 for(const phase of ['before','after']){
  const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,reducedMotion:'reduce'});
  if(phase==='before')await context.route('**/*',route=>{const pathname=new URL(route.request().url()).pathname,file=pathname.endsWith('/')?'index.html':pathname.split('/').pop();return old.has(file)?route.fulfill({body:old.get(file),contentType:file.endsWith('.html')?'text/html':file.endsWith('.css')?'text/css':'application/javascript'}):route.continue()});
  for(const [name,action]of Object.entries(scenarios)){
   const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
   await page.goto((process.env.UI_BASE_URL||'http://127.0.0.1:8840/')+'?gm=1&coins=400');
   await page.evaluate(()=>{document.querySelector('#gm-test-panel').style.display='none';document.body.classList.remove('gm-test-active');saveChange(d=>{d.tutorialComplete=true;d.equipped='rescue'});restartTo('lobby')});
   await page.evaluate(action);await page.waitForTimeout(100);
   const chars=await page.evaluate(()=>{
    const scope=document.querySelector('dialog[open]')||document.querySelector('.app-screen:not([hidden])');
    const walk=document.createTreeWalker(scope,NodeFilter.SHOW_TEXT);let n,count=0;
    while(n=walk.nextNode()){
     if(!n.textContent.trim()||n.parentElement.closest('script,style,[aria-hidden="true"]'))continue;
     if(!n.parentElement.checkVisibility({checkVisibilityCSS:true,contentVisibilityAuto:true}))continue;
     const range=document.createRange();range.selectNodeContents(n);
     if([...range.getClientRects()].some(r=>r.width>0&&r.height>0))count+=n.textContent.replace(/\s/g,'').length;
    }return count;
   });
   report.screens[name]??={};report.screens[name][phase]=chars;
   if(phase==='after'){
    if(name==='training'){
     const summary=page.locator('.training-character summary').first();await summary.focus();await page.keyboard.press('Enter');
     assert.equal(await page.locator('.training-character').first().getAttribute('open'),'');
     assert.ok(await page.locator('.training-character[open] li').count()>=4);
     await page.screenshot({path:path.join(out,'training-expanded.png')});report.checks.push('training keyboard disclosure');
    }
    if(name==='shop'){
     await page.locator('.recruit-rules summary').tap();assert.ok(await page.locator('.recruit-rules').evaluate(e=>e.open));
     assert.match(await page.locator('.recruit-rules p').innerText(),/10.*ポイント|10.*포인트/);
     await page.screenshot({path:path.join(out,'shop-rules-expanded.png')});report.checks.push('purchase rates and guarantee rules');
    }
    if(name==='battle'){
     assert.ok(await page.locator('#approved-battle-support').evaluate(e=>!!e.closest('#info')));
     await page.locator('#skill-help').tap();assert.ok(await page.locator('#approved-battle-support').isVisible());
     await page.locator('#approved-battle-support').scrollIntoViewIfNeeded();
     await page.screenshot({path:path.join(out,'support-in-help.png')});report.checks.push('support details available in help');
     await page.locator('#info-close').tap();
     const long='운영비가 부족해요. 전투 알림의 상세 내용이 생략되어도 전체 안내를 읽을 수 있어야 합니다.';
     await page.evaluate(t=>{playing=true;wave=1;sync();say(t)},long);await page.locator('.battle-notice').tap();
     assert.equal(await page.locator('.notice-dialog p').innerText(),long);
     await page.locator('.notice-dialog button').tap();report.checks.push('full battle notice available');
    }
    if(name==='result'){await page.locator('#run-analysis > details > summary').tap();assert.ok(await page.locator('#run-analysis > details').evaluate(e=>e.open));report.checks.push('result analysis disclosure')}
   }
   assert.deepEqual(errors,[],`${phase} ${name}`);await page.close();
  }
  await context.close();
 }
 for(const s of Object.values(report.screens))s.reductionPercent=Math.round((1-s.after/s.before)*100);
 fs.writeFileSync(path.join(out,'text-density.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
