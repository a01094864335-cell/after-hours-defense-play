const {chromium}=require('playwright');
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
(async()=>{
 const out=path.resolve('qa/shop-stage');fs.mkdirSync(out,{recursive:true});
 const browser=await chromium.launch({executablePath:process.env.UI_CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox']});
 const errors=[],missing=[],checks=[];
 for(const [width,height]of [[320,568],[375,667],[390,724],[390,844],[430,932]]){
  const page=await browser.newPage({viewport:{width,height},isMobile:true,hasTouch:true,reducedMotion:'reduce'});
  page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400&&!r.url().endsWith('favicon.ico'))missing.push(r.url())});
  await page.goto(process.env.UI_BASE_URL||'http://127.0.0.1:8002/');
  await page.evaluate(()=>{for(const d of document.querySelectorAll('dialog[open]'))d.close();saveChange(d=>{d.coins=11;d.recruitPoints=2;d.profile.pity=1});renderMeta()});
  await page.locator('#shop-open').click();
  assert(await page.locator('#buy-staff-pack').isDisabled());assert.equal(await page.locator('.pack-pity-track .lit').count(),1);
  assert(await page.locator('#shop .sheet-head .shop-wallet').isVisible());
  assert(await page.locator('#shop').evaluate(e=>e.scrollWidth<=e.clientWidth+1));
  assert(await page.locator('#shop .panel-scroll-body').evaluate(e=>e.scrollWidth<=e.clientWidth+1));
  await page.screenshot({path:path.join(out,`${width}-pack.png`)});
  await page.locator('.recruit-rules summary').click();assert(await page.locator('.recruit-rules').evaluate(e=>e.open));assert((await page.locator('.recruit-rules').innerText()).includes('일반'));await page.locator('.recruit-rules summary').click();
  await page.locator('#shop-tab-items').click();assert(await page.locator('#shop-items').isVisible());assert(!(await page.locator('.recruit-shop').isVisible()));
  await page.evaluate(()=>{saveChange(d=>d.coins=240);renderMeta()});const before=await page.evaluate(()=>meta.coins);await page.locator('#buy-grade').click();assert((await page.evaluate(()=>meta.coins))<before);
  await page.screenshot({path:path.join(out,`${width}-items.png`)});
  await page.locator('#shop-tab-mercs').click();
  await page.evaluate(()=>{saveChange(d=>{d.coins=240;d.profile.pity=9});renderMeta()});assert.equal(await page.locator('.pack-pity-track .lit').count(),9);
  const owned=await page.evaluate(()=>meta.owned.length);await page.locator('#buy-staff-pack').click();assert(await page.locator('#recruit-dialog').isVisible());assert.equal(await page.evaluate(()=>meta.coins),120);assert.equal(await page.evaluate(()=>meta.owned.length),owned+1);assert.equal(await page.evaluate(()=>meta.profile.pity),0);
  await page.evaluate(()=>{document.querySelector('#recruit-dialog').close();renderMeta()});assert.equal(await page.locator('.pack-pity-track .lit').count(),0);assert.equal((await page.locator('#shop-coins').textContent()).trim(),'120');
  await page.waitForTimeout(100);if(await page.locator('#hiring-story').isVisible())await page.locator('[data-hire-close]').click();
  await page.locator('#shop-to-roster').click();assert(await page.locator('#roster').isVisible());
  checks.push({width,height,underfunded:true,details:true,itemPurchase:true,packPurchase:true,guaranteeProgress:true,archive:true});await page.close();
 }
 assert.deepEqual(errors,[]);assert.deepEqual(missing,[]);fs.writeFileSync(path.join(out,'checks.json'),JSON.stringify({checks,errors,missing},null,2)+'\n');console.log('PASS: A stage, live wallet, shortage, 10-step guarantee, real purchases, rules and archive across 5 mobile sizes');await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
