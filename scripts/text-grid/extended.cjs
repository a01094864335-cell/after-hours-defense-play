// One longest panel per narrative and every staff identity, using live renderers.
const fs=require('fs'),{chromium}=require('playwright');
(async()=>{const b=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});const p=await b.newPage();await p.goto(process.env.UI_BASE_URL||'http://127.0.0.1:8042/');
 const extra=await p.evaluate(()=>{
 const rows=staffRecords.map(r=>({id:'staff-'+r.id,selector:'#roster',script:`document.querySelector('#roster-open').click();showStaffRecord(${JSON.stringify(r.id)})`}));
 for(const s of CastleStories){const panels=s.panels||s.pages||[];let panel=0,max=-1;panels.forEach((x,i)=>{const n=JSON.stringify(x).length;if(n>max){max=n;panel=i}});rows.push({id:'story-'+s.id,selector:'#promo',script:`castleReplay=true;currentCastleStory=CastleStories.find(s=>s.id===${JSON.stringify(s.id)});promoIndex=${panel};renderCastleStory()`});}
 for(const s of HIRING_STORIES){let panel=0,max=-1;s.panels.forEach((x,i)=>{const n=JSON.stringify(x).length;if(n>max){max=n;panel=i}});rows.push({id:'hire-'+s.id,selector:'#hiring-story',script:`HiringStories.open(${JSON.stringify(s.id)});for(let i=0;i<${panel};i++)document.querySelector('[data-hire-next]').click()`});}
 return rows;
 });fs.writeFileSync('scripts/text-grid/extended-cases.json',JSON.stringify(extra,null,2));await b.close();console.log(extra.length)})().catch(e=>{console.error(e);process.exit(1)});
