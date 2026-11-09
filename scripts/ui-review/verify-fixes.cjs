'use strict';
const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs');
const base=process.env.UI_BASE_URL||'http://127.0.0.1:8004/',out=process.env.UI_QA_DIR||'qa/ui-review-latest';
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.UI_CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox']});const results=[];
 for(const [width,height]of [[320,568],[390,640],[390,844],[430,932]]){
  const page=await browser.newPage({viewport:{width,height},isMobile:true,reducedMotion:'reduce'}),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(base+'?gm=1&coins=400');await page.evaluate(()=>{document.querySelector('#gm-test-panel').style.display='none';document.body.classList.remove('gm-test-active');meta.tutorialComplete=true;renderMeta();});
  const checks=[];
  async function visibleControl(selector){const r=await page.locator(selector).boundingBox();assert(r&&r.y>=0&&r.y+r.height<=height+1,`${width}×${height}: ${selector} clipped ${JSON.stringify(r)}`);checks.push(selector+' visible');}
  for(const s of ['#menu-open','#enter-battle','#roster-open','#shop-open'])await visibleControl(s);
  await page.click('#shop-open');await visibleControl('#buy-staff-pack');
  const shop=await page.evaluate(()=>{const e=document.querySelector('#shop .panel-scroll-body');return {client:e.clientWidth,scroll:e.scrollWidth};});assert(shop.scroll<=shop.client+1,'shop horizontal scroll');checks.push('shop no horizontal scroll');
  await page.click('#shop-tab-items');
  const contrast=await page.locator('#buy-grade').evaluate(e=>{const c=getComputedStyle(e);function luminance(v){const a=v.match(/[\d.]+/g).slice(0,3).map(Number).map(x=>{x/=255;return x<=.04045?x/12.92:((x+.055)/1.055)**2.4});return a[0]*.2126+a[1]*.7152+a[2]*.0722;}const a=luminance(c.color),b=luminance(c.backgroundColor);return (Math.max(a,b)+.05)/(Math.min(a,b)+.05);});assert(contrast>=4.5,'price contrast '+contrast);checks.push('price contrast '+contrast.toFixed(2));
  await page.evaluate(()=>document.querySelector('#shop').close());await page.click('#roster-open');
  assert(await page.locator('.archive-tabs').evaluate(e=>!document.querySelector('#roster-overview').contains(e)),'roster tabs inside scroller');checks.push('roster tabs outside scroller');
  await page.evaluate(()=>document.querySelector('#roster').close());await page.click('#training-entry');await visibleControl('#training-upgrade');
  const first=await page.locator('.training-character-title').first().boundingBox(),footer=await page.locator('.training-footer').boundingBox();assert(first.y+first.height<=footer.y+1,'training first row hidden');checks.push('first training row visible');
  await page.click('#training-tab-merc');assert.equal(await page.locator('#training-dialog').getAttribute('data-training-group'),'merc');checks.push('support training context');
  assert.deepEqual(errors,[]);results.push({viewport:[width,height],checks});await page.close();
 }
 fs.mkdirSync(out,{recursive:true});fs.writeFileSync(out+'/acceptance.json',JSON.stringify(results,null,2));console.log(JSON.stringify(results));await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
