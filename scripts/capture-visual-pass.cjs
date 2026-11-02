const{chromium}=require('playwright');const fs=require('fs');
const root=require('path').resolve(__dirname,'../qa/visual-pass'),phase=process.env.AUDIT_PHASE||'after';
(async()=>{const b=await chromium.launch({executablePath:process.env.UI_CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox']});let all=[];
for(const[w,h]of[[390,844],[320,568],[430,932]]){const dir=`${root}/${phase}/${w}`;fs.mkdirSync(dir,{recursive:true});const p=await b.newPage({viewport:{width:w,height:h},deviceScaleFactor:1,isMobile:true,hasTouch:true,reducedMotion:'reduce'});let errors=[];p.on('pageerror',e=>errors.push(e.message));await p.goto((process.env.UI_BASE_URL||'http://127.0.0.1:8766/')+'?gm=1&coins=999999');await p.waitForTimeout(350);if(phase==='before')await p.evaluate(()=>{const link=document.querySelector('link[href^="visual-pass.css"]');if(link)link.disabled=true});await p.evaluate(()=>{document.body.classList.remove('gm-test-active');document.querySelector('#gm-test-panel').style.display='none';saveChange(d=>{d.tutorialComplete=true;d.equipped='rescue';});restartTo('lobby');});let counter=0;
const close=()=>p.evaluate(()=>{for(const d of document.querySelectorAll('dialog[open]'))d.close();});
const action=async(code)=>{await close();await p.evaluate(code);await p.waitForTimeout(80);await p.evaluate(()=>{for(const e of document.querySelectorAll('dialog[open],dialog[open] *'))if(/auto|scroll/.test(getComputedStyle(e).overflowY))e.scrollTop=0;});};
const snap=async(name,scroll=true)=>{await p.waitForTimeout(70);await p.evaluate(()=>document.activeElement?.blur());const file=`${String(++counter).padStart(2,'0')}-${name}`;await p.screenshot({path:`${dir}/${file}.png`});const checks=await p.evaluate(()=>{const visible=e=>{const r=e.getBoundingClientRect(),s=getComputedStyle(e);return r.width>0&&r.height>0&&s.display!=='none'&&s.visibility!=='hidden'&&!e.closest('[hidden]')&&(!e.closest('dialog')||e.closest('dialog').open)};let bad=[];const scope=document.querySelector('dialog[open]')||document.querySelector('#app-shell');for(const e of scope.querySelectorAll('button')){if(!visible(e))continue;const r=e.getBoundingClientRect();if(e.scrollWidth>e.clientWidth+2)bad.push({id:e.id,problem:'horizontal-overflow',text:e.textContent.trim(),width:e.clientWidth,scroll:e.scrollWidth});if(r.x<-1||r.right>innerWidth+1)bad.push({id:e.id,problem:'outside-viewport',text:e.textContent.trim(),rect:[r.x,r.y,r.width,r.height]});}return{bad,dialogs:[...document.querySelectorAll('dialog[open]')].map(d=>d.id),body:[document.documentElement.scrollWidth,document.documentElement.scrollHeight]}});all.push({size:[w,h],screen:file,...checks});if(scroll){const moved=await p.evaluate(()=>{const d=document.querySelector('dialog[open]');if(!d)return false;let moved=false;for(const e of [d,...d.querySelectorAll('*')]){const s=getComputedStyle(e);if(/auto|scroll/.test(s.overflowY)&&e.scrollHeight>e.clientHeight+30){e.scrollTop=e.scrollHeight;moved=true}}return moved});if(moved){await p.waitForTimeout(50);await p.screenshot({path:`${dir}/${file}-bottom.png`})}}};
await snap('lobby');
for(const[id,name]of[['menu-open','menu'],['journey-summary','records'],['training-entry','training-staff'],['roster-open','roster-staff'],['shop-open','shop-pack'],['lobby-story-collection','story-archive'],['daily-events-open','daily-events'],['help-open','help']]){await action(`document.getElementById('${id}').click()`);await snap(name);}
const scenarios=[
 ['training-merc',"openTraining();document.querySelector('#training-tab-merc').click()"],
 ['roster-merc',"document.querySelector('#roster-open').click();document.querySelector('#roster-tab-merc').click()"],
 ['staff-detail',"document.querySelector('#roster-open').click();showStaffRecord('goblin-guard')"],
 ['merc-detail',"document.querySelector('#roster-open').click();showStaffRecord('merc-rescue')"],
 ['roster-locked',"meta.staff=BASE_STAFF.slice();document.querySelector('#roster-open').click();document.querySelector('#roster-tab-incoming').click()"],
 ['locked-detail',"document.querySelector('#roster-open').click();showStaffRecord('bat-nurse')"],
 ['shop-items',"document.querySelector('#shop-open').click();shopTab('items')"],
 ['recruit-reveal',"revealRecruit('bat-nurse',false)"],
 ['deck',"openDeck()"],
 ['save-transfer',"document.querySelector('#menu-open').click();document.querySelector('#save-transfer-open').click()"],
 ['story-opening',"promoIndex=0;showPromo()"],
 ['battle-preparation',"document.querySelector('#enter-battle').click();document.querySelector('#promo-skip').click()"],
 ['equipment',"document.querySelector('#upgrade-open').click()"],
 ['battle-running',"summon();playing=true;paused=false;wave=8;sync()"],
 ['pause',"playing=true;paused=true;sync()"],
 ['leave',"document.querySelector('#battle-back').click()"],
 ['guide',"showGuide('당직 안내','같은 종류와 같은 등급의 직원을 합쳐 더 강한 동료를 만드세요. 합성 실패 시 출발 직원이 사라져요.')"],
 ['bonus',"wave=20;renderPerkChoices();document.querySelector('#perk').showModal()"],
 ['bonus-target',"renderPerkChoices();document.querySelector('#perk').showModal();showPerkTargets('staff')"],
 ['boss-warning',"playing=true;paused=false;sync();showBossWarning(20)"],
 ['story-daily',"saveChange(d=>d.stories=CastleStories.map(s=>s.id));replayCastleStory(CastleStories.find(s=>!s.original).id)"],
 ['story-opening-last',"saveChange(d=>d.stories=CastleStories.map(s=>s.id));replayCastleStory('first-shift');promoIndex=3;renderCastleStory()"],
 ['result',"ended=true;playing=false;paused=false;wave=18;settleRun();sync()"],
];for(const[name,code]of scenarios){try{await action(code);await snap(name)}catch(e){all.push({size:[w,h],screen:name,scenarioError:e.message})}}
all.push({size:[w,h],runtimeErrors:errors});await p.close();}
fs.writeFileSync(`${root}/${phase}/checks.json`,JSON.stringify(all,null,2));await b.close();if(phase==='after'&&all.some(x=>x.bad?.length||x.scenarioError||x.runtimeErrors?.length))process.exitCode=1;console.log(JSON.stringify({captures:all.filter(x=>x.screen).length,issues:all.filter(x=>x.bad?.length||x.scenarioError||x.runtimeErrors?.length)},null,2));})()
