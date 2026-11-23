'use strict';
// Paired fixed-policy mechanics audit, not a human win-rate or enjoyment score.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const source=path.resolve(process.env.SOURCE_ROOT||path.join(__dirname,'..')),out=path.resolve(process.argv[2]||'/tmp/fun-balance.json');process.chdir(source);
const boot=require(path.join(source,'tests/runtime-boot.cjs')),decks=[[0,1,2,3,4],[0,3,8,10,11],[1,2,4,5,9]],rows=[];
const b=boot();
b.run(`say=()=>{};sync=()=>{};renderMeta=()=>{};renderProgress=()=>{};saveActiveRun=()=>{};burst=()=>{};objectFlight=()=>{};objectImpact=()=>{};effectText=()=>{};animateDefeat=()=>{};Motion.start=()=>{};Motion.tick=()=>{};Motion.preload=()=>{};SkillCutin.staff=()=>{};SkillCutin.boss=()=>{};describeStats=()=>{};settleRun=()=>{};
function funAudit(deck,level,seed,strategy){
 let rng=seed>>>0;Math.random=()=>((rng=(Math.imul(rng,1664525)+1013904223)>>>0)/4294967296);
 meta.tutorialComplete=true;meta.deck=deck.map(i=>kinds[i].file);meta.training={staff:level,merc:level};meta.equipped=null;reset();dailyEnabled=false;paused=false;for(let w=5;w<=60;w+=5)bossPlans[w]=bossCatalog[(seed+Math.floor(w/5)-1)%bossCatalog.length].id;for(let i=0;i<5;i++)summon();kingEvent.timer=1e9;
 let clock=0,actions=0,lastAction=-1,locked=0;const dt=.1;
 while(!ended&&wave<60&&clock<1800){
  if(Math.floor(clock*2)!==lastAction){lastAction=Math.floor(clock*2);
   if(bonusPending){
    renderPerkChoices();const offers=rewardBundle.offers;
    let offer=rewardBundle.mode==='choice'?(offers.find(o=>o.id==='life'&&life===1)||offers.find(o=>o.id==='build'&&window.TacticalDuty.buildOptions().some(b=>b.id===strategy&&b.eligible))||offers.find(o=>o.id==='staff')||offers.find(o=>o.id==='equipment')||offers[0]):offers[rewardBundle.winner];
    if(rewardBundle.mode==='choice'&&offer.id==='build')window.TacticalDuty.chooseBuild(strategy);else choosePerk(offer.id);
    if(bonusPending)throw Error('Bot failed to claim actual saved offer');
   }
   if(!paused){
    for(let i=0;i<15;i++)if(board[i]?.pip>=5&&!(board[i].skillCD>0)){selected=i;useSkill()}
    const occupied=board.filter(Boolean).length,gear=runDeck.filter(i=>deployedType(i)&&levels[i]<5&&sp>=equipmentCost(i)).sort((a,b)=>levels[a]-levels[b]||a-b),pairs=[];
    for(let i=0;i<15;i++)for(let j=i+1;j<15;j++)if(compatible(board[i],board[j]))pairs.push([i,j]);
    if(occupied>=9&&gear.length)upgrade(gear[0]);
    else if(occupied<15&&sp>=summonPrice())summon();
    else if(pairs.length){pairs.sort((a,b)=>board[a[0]].pip-board[b[0]].pip);merge(...pairs[0])}
    else if(occupied===15&&sp>=summonPrice()){const i=board.map((u,i)=>({i,pip:u.pip})).sort((a,b)=>a.pip-b.pip||a.i-b.i)[0].i;window.BoardRecycle.discard(i,true);if(board[i])window.BoardRecycle.discard(i,true)}
    actions++;
   }
  }
  if(board.every(Boolean))locked+=dt;update(dt);clock+=dt;fx=[];
  if(!Number.isFinite(sp)||sp<0||enemies.some(e=>!Number.isFinite(e.hp)))throw Error('Non-finite combat state');
 }
 return {deck,level,seed,preferredStrategy:strategy,strategy:window.TacticalDuty.snapshot().build,wave,ended,censored:!ended,seconds:Math.round(clock),actions,fullBoardSeconds:Math.round(locked),summons:runInsights.summons,merges:runInsights.merges,failed:runInsights.failed,cooperationHits:runInsights.observations?.cooperation.hits||0,checkpoints:runInsights.observations?.waves||[]};
}`);
for(const level of [1,10,30])for(const deck of decks)for(let n=0;n<3;n++){
 const row=b.run(`funAudit(${JSON.stringify(deck)},${level},${4201+n},${JSON.stringify(['chain','economy','guard'][n])})`,120000);rows.push(row);console.log(JSON.stringify({level,deck,seed:row.seed,wave:row.wave,censored:row.censored}));
}
const runtime=Array.from(fs.readFileSync('index.html','utf8').matchAll(/<script src="([^"?]+)(?:\?[^\"]*)?"/g),m=>m[1]);const hashes=Object.fromEntries(runtime.map(f=>[f,crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex')]));
const result={method:'27 runs: 3 decks × training 1/10/30 × 3 seeds; shared seed-derived boss schedule, one action every0.5 simulated seconds; no daily/support/king/items; actual saved roulette winners, manual choice rounds prefer eligible strategy then staff/equipment. 60-wave/1800s caps are censored, not wins. No human skill/retention claims.',runtimeHashes:hashes,rows,summary:[1,10,30].map(level=>{const rs=rows.filter(r=>r.level===level);return {level,runs:rs.length,meanWave:rs.reduce((s,r)=>s+r.wave,0)/rs.length,minWave:Math.min(...rs.map(r=>r.wave)),maxWave:Math.max(...rs.map(r=>r.wave)),censored:rs.filter(r=>r.censored).length}})};
fs.mkdirSync(path.dirname(out),{recursive:true});fs.writeFileSync(out,JSON.stringify(result,null,2));console.log(JSON.stringify(result.summary));
