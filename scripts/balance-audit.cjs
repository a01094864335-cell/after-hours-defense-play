'use strict';
const fs=require('node:fs'),path=require('node:path'),boot=require('../tests/runtime-boot.cjs');
const decks=[[0,1,2,3,4],[1,2,4,5,9],[0,1,2,6,7],[1,2,12,13,15],[1,2,3,14,16],[4,5,6,9,15],[0,3,8,10,11],[12,13,14,15,16]];
const supports=[null,'ward','accountant','rescue','chikchik','banchang','coco','q'];
const seedCount=Number(process.env.SEEDS||4),outfile=process.argv[2]||'/tmp/game-balance-20261026.jsonl';
const b=boot('?gm=1&coins=1000000');
b.run(`say=()=>{};sync=()=>{};renderMeta=()=>{};renderProgress=()=>{};noteRoster=()=>{};saveActiveRun=()=>{};SkillCutin.staff=()=>{};SkillCutin.boss=()=>{};burst=()=>{};objectFlight=()=>{};objectImpact=()=>{};effectText=()=>{};animateDefeat=()=>{};Motion.start=()=>{};Motion.tick=()=>{};Motion.preload=()=>{};showGuide=()=>{};describeStats=()=>{};settleRun=()=>{};renderJourney=()=>{};renderPerkChoices=()=>{};
function auditPolicy(){
 if(bonusPending){const id=life<2?'life':wave>=20&&board.some(u=>!u)?'staff':'sp';choosePerk(id,id==='staff'?runDeck.find(i=>kinds[i].damage>0):undefined);}
 if(paused)paused=false;
 for(let i=0;i<board.length;i++)if(board[i]?.pip>=5&&(board[i].skillCD||0)<=0){selected=i;useSkill();}
 const n=board.filter(Boolean).length,upgradeable=runDeck.filter(i=>levels[i]<5&&sp>=equipmentCost(i)).sort((a,b)=>levels[a]-levels[b]||a-b);
 if(n>=9&&upgradeable.length){upgrade(upgradeable[0]);return;}
 if(n<15&&sp>=summonPrice()){summon();return;}
 const pairs=[];for(let i=0;i<15;i++)for(let j=i+1;j<15;j++)if(compatible(board[i],board[j]))pairs.push([i,j]);
 pairs.sort((a,b)=>board[a[0]].pip-board[b[0]].pip);if(pairs.length)merge(...pairs[0]);
}
function auditOne(deck,support,level,seed,king){
 let state=seed>>>0;Math.random=()=>{state=(state+0x6D2B79F5)>>>0;let t=state;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return ((t^(t>>>14))>>>0)/4294967296;};
 meta.tutorialComplete=true;meta.deck=deck.map(i=>kinds[i].file);meta.equipped=support;meta.training={staff:level,merc:level};reset();dailyEnabled=false;activeMerc=support;runTraining={...meta.training};runDeck=deck.slice();mercTimer=mercInterval();playing=true;nextWave();
 if(!king)kingEvent.timer=1e9;
 let action=0,elapsed=0;const dt=.1;
 while(!ended&&wave<101&&elapsed<1800){if(action<=0){auditPolicy();action=.7;}update(dt);action-=dt;elapsed+=dt;fx=[];}
 return {deck,support,level,seed,king,wave,elapsed:Math.round(elapsed),censored:!ended,kingKills:runInsights.king.kills,failures:runInsights.failed,supportStats:runInsights.support};
}`);
const completed=process.env.RESUME&&fs.existsSync(outfile)?fs.readFileSync(outfile,'utf8').trim().split('\n').filter(Boolean).map(JSON.parse):[];const done=new Set(completed.map(r=>JSON.stringify([r.king,r.level,r.deckIndex,r.support,r.seed])));if(!completed.length)fs.writeFileSync(outfile,'');let count=completed.length;const started=Date.now();
for(const king of [false,true])for(const level of [1,15,30])for(let d=0;d<decks.length;d++)for(const support of supports)for(let s=0;s<seedCount;s++){
 const seed=6200+s;if(done.has(JSON.stringify([king,level,d,support,seed])))continue;const row=b.run(`auditOne(${JSON.stringify(decks[d])},${JSON.stringify(support)},${level},${seed},${king})`,30000);row.deckIndex=d;
 fs.appendFileSync(outfile,JSON.stringify(row)+'\n');count++;if(count%64===0)console.log(JSON.stringify({runs:count,seconds:Math.round((Date.now()-started)/1000),level,king,deck:d}));
}
console.log(JSON.stringify({complete:true,runs:count,seconds:Math.round((Date.now()-started)/1000),output:outfile}));
