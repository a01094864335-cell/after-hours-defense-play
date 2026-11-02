'use strict';
const {chromium}=require('playwright'),fs=require('node:fs'),path=require('node:path');
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.UI_CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox']});
 const output=path.resolve(__dirname,'../qa/detail-ui');fs.mkdirSync(output,{recursive:true});const results=[];
 try{for(const [width,height]of[[320,568],[390,844],[430,932]]){
  const page=await browser.newPage({viewport:{width,height},isMobile:true,hasTouch:true,reducedMotion:'reduce'}),errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  await page.goto((process.env.UI_BASE_URL||'http://127.0.0.1:8766/')+'?gm=1&coins=400');await page.waitForTimeout(300);
  await page.evaluate(()=>{document.querySelector('#gm-test-panel').style.display='none';document.body.classList.remove('gm-test-active');saveChange(d=>{d.tutorialComplete=true;d.staff=BASE_STAFF.slice();d.owned=[];d.equipped=''});restartTo('lobby')});
  await page.click('#shop-open');await page.click('#shop-tab-items');
  const separate=await page.locator('.item-product').evaluateAll(rows=>rows.every(e=>{const button=e.querySelector('button').getBoundingClientRect(),art=e.querySelector('img,canvas').getBoundingClientRect(),text=e.querySelector(':scope>span').getBoundingClientRect(),card=e.getBoundingClientRect();return button.top>=Math.max(art.bottom,text.bottom)+5&&button.left>=card.left&&button.right<=card.right}));
  if(!separate)throw Error('Product image / text / purchase overlap at '+width);
  const coins=await page.evaluate(()=>meta.coins);await page.click('#buy-grade');if(await page.evaluate(()=>meta.coins)!==coins-20)throw Error('Purchase failed');
  await page.click('#shop-close');await page.click('#training-entry');const level=await page.evaluate(()=>meta.training.staff);await page.click('#training-upgrade');if(await page.evaluate(()=>meta.training.staff)!==level+1)throw Error('Training failed');await page.click('#training-close');
  await page.click('#roster-open');await page.locator('[data-staff="goblin-guard"]').click();await page.click('#roster-back');await page.click('#roster-tab-incoming');await page.locator('#roster-list .staff-pass').first().click();await page.click('#roster-close');
  await page.click('#shop-open');await page.click('#buy-staff-pack');if(!await page.locator('#recruit-dialog').evaluate(e=>e.open))throw Error('Recruit result did not open');
  const dir=path.join(output,'after',String(width));fs.mkdirSync(dir,{recursive:true});await page.screenshot({path:path.join(dir,'33-recruit-active.png')});
  if(errors.length)throw Error(errors.join('\n'));results.push({size:[width,height],productZonesSeparate:separate,purchase:true,training:true,rosterNavigation:true,recruit:true,runtimeErrors:errors});await page.close();
 }}finally{await browser.close()}
 fs.writeFileSync(path.join(output,'interactions.json'),JSON.stringify(results,null,2)+'\n');console.log(JSON.stringify(results));
})().catch(error=>{console.error(error);process.exitCode=1});
