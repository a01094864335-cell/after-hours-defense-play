const fs=require('fs'),path=require('path'),boot=require('../tests/runtime-boot.cjs'),assert=require('assert/strict');
const b=boot('?gm=1&coins=1000000'),out=process.argv[2]||path.resolve(__dirname,'../qa/tactical-duty/balance.json');
b.run(`say=()=>{};sync=()=>{};renderMeta=()=>{};renderProgress=()=>{};noteRoster=()=>{};saveActiveRun=()=>{};SkillCutin.staff=()=>{};SkillCutin.boss=()=>{};burst=()=>{};objectFlight=()=>{};objectImpact=()=>{};animateDefeat=()=>{};Motion.start=()=>{};Motion.tick=()=>{};Motion.preload=()=>{};showGuide=()=>{};describeStats=()=>{};settleRun=()=>{};renderPerkChoices=()=>{};
function tacticalAudit(deck,build,seed){
 let state=seed>>>0;Math.random=()=>{state=(state+0x6D2B79F5)>>>0;let t=state;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return ((t^(t>>>14))>>>0)/4294967296;};
 meta.tutorialComplete=true;meta.deck=deck.map(i=>kinds[i].file);meta.equipped=null;meta.training={staff:1,merc:1};reset();dailyEnabled=false;paused=false;
 for(let i=0;i<5;i++)summon();kingEvent.timer=1e9;let elapsed=0,action=0;
 while(!ended&&wave<80&&elapsed<1800){
  if(action<=0){
   if(bonusPending){if(wave===5&&build)window.TacticalDuty.choose(build);else choosePerk(life<2?'life':'sp')}
   if(paused)paused=false;
   for(let i=0;i<15;i++)if(board[i]?.pip>=5&&!(board[i].skillCD>0)){selected=i;useSkill()}
   const up=runDeck.filter(i=>levels[i]<5&&sp>=equipmentCost(i)).sort((a,b)=>levels[a]-levels[b]);
   if(board.filter(Boolean).length>=9&&up.length)upgrade(up[0]);else if(board.some(u=>!u)&&sp>=summonPrice())summon();else {let pair;for(let i=0;i<15&&!pair;i++)for(let j=i+1;j<15;j++)if(compatible(board[i],board[j])){pair=[i,j];break}if(pair)merge(...pair)}action=.7;
  }
  update(.1);elapsed+=.1;action-=.1;fx=[];if(!Number.isFinite(sp)||sp<0||enemies.some(e=>!Number.isFinite(e.hp)))throw Error('invalid simulation');
 }
 return {deck,build:build||'baseline',seed,wave,chosenBuild:window.TacticalDuty.snapshot().build,seconds:Math.round(elapsed),ended,failures:runInsights.failed};
}`);
const rows=[];for(const deck of[[0,1,2,3,4],[0,3,8,10,11],[1,2,3,14,16]])for(const build of[null,'chain','economy','guard'])for(const seed of[1201,1202,1203,1204]){const row=b.run(`tacticalAudit(${JSON.stringify(deck)},${JSON.stringify(build)},${seed})`,30000);assert.ok(row.ended,'simulation cap reached');rows.push(row)}
fs.mkdirSync(path.dirname(out),{recursive:true});fs.writeFileSync(out,JSON.stringify({conditions:'3 decks × 4 strategy choices × 4 seeds; Lv.1, no king/items/daily modifiers; one fixed bot policy, not human outcomes',rows},null,2));
console.log(JSON.stringify(Object.fromEntries(['baseline','chain','economy','guard'].map(id=>{const a=rows.filter(r=>r.build===id);return[id,{runs:a.length,adopted:a.filter(r=>r.chosenBuild).length,meanWave:Math.round(a.reduce((s,r)=>s+r.wave,0)/a.length*100)/100,min:Math.min(...a.map(r=>r.wave)),max:Math.max(...a.map(r=>r.wave))}]})),null,2));
