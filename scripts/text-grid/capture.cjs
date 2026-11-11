const {chromium}=require('playwright'),fs=require('fs'),path=require('path');
const cases=require(process.env.GRID_CASES||'./cases.json'),measure=require('./measure.cjs');
const out=process.env.UI_QA_DIR||'qa/text-grid-20261111/before',base=process.env.UI_BASE_URL||'http://127.0.0.1:8041/';
fs.mkdirSync(out,{recursive:true});
(async()=>{const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});const report=[];
 for(const size of (process.env.GRID_SIZES||'390x844').split(','))for(const lang of (process.env.GRID_LANGS||'ko').split(',')){
 const [width,height]=size.split('x').map(Number);const page=await browser.newPage({viewport:{width,height},reducedMotion:'reduce'});page.setDefaultTimeout(3500);await page.addInitScript(()=>{const Native=MutationObserver;window.__gridObservers=[];window.MutationObserver=class extends Native{constructor(fn){super(fn);window.__gridObservers.push(this)}}});
 for(const c of cases.filter(c=>!process.env.GRID_FILTER||new RegExp(process.env.GRID_FILTER).test(c.id))){const row={id:c.id,size,lang,englishStatus:lang==='ko'?null:'layout-copy-proposal-not-release-localization'};const errors=[];page.on('pageerror',e=>errors.push(e.message));
 try{await page.goto(base,{waitUntil:'networkidle'});await page.evaluate(()=>{const gm=document.querySelector('#gm-test-panel');if(gm)gm.style.display='none';document.body.classList.remove('gm-test-active');saveChange(d=>{d.coins=400;d.tutorialComplete=true;d.staff=[...BASE_STAFF,...RECRUIT_STAFF];d.owned=[...MERC_IDS];d.profile.starterClaim=null});meta.tutorialComplete=true;restartTo('lobby');playing=false;ended=false;tutorialMode=false;renderMeta()});
 await page.evaluate(script=>Function(script)(),c.script);
 if(c.id==='shop-items')await page.locator('#asset-shop-host .tabs [data-tab="items"]').click();
 await page.locator(c.selector).waitFor({state:'visible'});await page.evaluate(()=>document.fonts.ready);
 await page.locator('img').evaluateAll(xs=>Promise.all(xs.filter(x=>{const r=x.getBoundingClientRect();return r.width>0&&r.top<innerHeight&&r.bottom>0}).map(x=>Promise.race([x.decode().catch(()=>{}),new Promise(r=>setTimeout(r,3000))]))));await page.waitForTimeout(150);
 if(lang!=='ko'){const translate=require('./english-fixture.cjs');row.translation=await page.evaluate(translate,{mode:lang,extra:require('./english-extra.json')});}
 await page.waitForTimeout(80);row.top=await page.evaluate(measure);
 row.screenshot=`${size}-${lang}-${c.id}.png`;await page.screenshot({path:path.join(out,row.screenshot),type:'png'});
 if(process.env.GRID_ALL_SCROLLS==='1'){
 const scrollers=await page.evaluate(()=>{const a=[];function walk(r){for(const e of r.children||[]){const s=getComputedStyle(e),b=e.getBoundingClientRect();if(b.width>20&&b.height>50&&e.scrollHeight>e.clientHeight+35&&/auto|scroll/.test(s.overflowY)){e.dataset.gridScroller=String(a.length);a.push({id:a.length,height:e.clientHeight,max:e.scrollHeight-e.clientHeight})}walk(e);if(e.shadowRoot)walk(e.shadowRoot)}}walk(document.body);return a});
 row.scrolls=[];for(const sc of scrollers){for(let at=Math.max(30,Math.floor(sc.height*.8));at<sc.max;at+=Math.max(30,Math.floor(sc.height*.8))){await page.evaluate(({id,at})=>{function walk(r){for(const e of r.querySelectorAll('[data-grid-scroller]'))if(e.dataset.gridScroller===String(id))e.scrollTop=at;for(const e of r.querySelectorAll('*'))if(e.shadowRoot)walk(e.shadowRoot)}walk(document)},{id:sc.id,at});const data=await page.evaluate(measure),file=`${size}-${lang}-${c.id}-scroll-${sc.id}-${at}.png`;await page.screenshot({path:path.join(out,file),type:'png'});row.scrolls.push({at,scroller:sc.id,screenshot:file,...data});}}
 }
 const scroll=await page.evaluate(()=>{const a=[];function walk(r){for(const e of r.children||[]){const s=getComputedStyle(e);if(e.getBoundingClientRect().width>0&&e.scrollHeight>e.clientHeight+35&&/auto|scroll/.test(s.overflowY)){e.scrollTop=e.scrollHeight;a.push(e)}walk(e);if(e.shadowRoot)walk(e.shadowRoot)}}walk(document.body);return a.length});
 if(scroll){row.bottom=await page.evaluate(measure);row.bottomScreenshot=row.screenshot.replace('.png','-bottom.png');await page.screenshot({path:path.join(out,row.bottomScreenshot),type:'png'});}
 row.errors=errors;
 }catch(e){row.error=e.message;}report.push(row);page.removeAllListeners('pageerror');fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2));if(report.length%10===0)console.log(JSON.stringify({done:report.length,last:c.id,failures:report.filter(r=>r.error).map(r=>r.id)}));
 }
 await page.close();}
 await browser.close();console.log(JSON.stringify({total:report.length,failures:report.filter(r=>r.error).map(r=>({id:r.id,error:r.error}))}));
})().catch(e=>{console.error(e);process.exit(1)});
