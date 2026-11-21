const fs=require('fs'),boot=require('../../tests/runtime-boot.cjs');const rows=[];
for(const mode of ['idle','merge','active'])for(let seed=1;seed<=4;seed++){
 const b=boot();b.run(`var rng=${seed};Math.random=()=>((rng=(Math.imul(rng,1664525)+1013904223)>>>0)/4294967296);meta.tutorialComplete=true;meta.training={staff:1,merc:1};meta.equipped=null;reset();dailyEnabled=false;paused=false;kingEvent.timer=99999;for(let i=0;i<5;i++)summon();var records=[],lastWave=0,blocked=0,total=0,longest=0,gap=0,actions=0,upgrades=0;sync=()=>{};say=()=>{};saveActiveRun=()=>{};`);
 b.run(`for(let tick=0;tick<18000&&!ended&&wave<=30;tick++){
  if(bonusPending){renderPerkChoices();const choice=rewardBundle.offers.find(o=>o.id==='sp')||rewardBundle.offers[0];choosePerk(choice.id)}if(paused)paused=false;
  let pairs=[];for(let i=0;i<15;i++)for(let j=i+1;j<15;j++)if(compatible(board[i],board[j]))pairs.push([i,j]);
  const locked=board.every(Boolean)&&!pairs.length;total+=.1;if(locked){blocked+=.1;gap+=.1;longest=Math.max(longest,gap)}else gap=0;
  if(tick%5===0&&'${mode}'!=='idle'){
   if('${mode}'==='active'){for(let i=0;i<15;i++)if(board[i]?.pip>=5&&!(board[i].skillCD>0)){selected=i;useSkill()}}
   const gear='${mode}'==='active'&&locked&&runDeck.find(i=>levels[i]<5&&sp>=equipmentCost(i));
   if(gear!==false&&gear!==undefined){upgrade(gear);upgrades++;actions++}
   else if(board.some(u=>!u)&&sp>=summonPrice()){summon();actions++}
   else if(pairs.length){pairs.sort((a,b)=>board[a[0]].pip-board[b[0]].pip);merge(...pairs[0]);actions++}
  }
  update(.1);fx=[];
  if(wave!==lastWave){records.push({wave,life,sp,summons:(cost-10)/10,merges:runInsights.merges,blocked:Math.round(blocked),seconds:Math.round(total)});lastWave=wave}
 }`,120000);
 rows.push({mode,seed,checkpoints:JSON.parse(b.run('JSON.stringify(records)')),end:JSON.parse(b.run('JSON.stringify({wave,life,ended,sp,summons:(cost-10)/10,merges:runInsights.merges,seconds:Math.round(total),lockedSeconds:Math.round(blocked),longestLockedSeconds:Math.round(longest),actions,upgrades})'))});console.log(mode,seed,rows.at(-1).end);
}
fs.writeFileSync(process.argv[2],JSON.stringify({method:'Deterministic VM, normal fresh stats, no daily/support/king; 0.1s combat steps, action every0.5s; idle=only initial5, merge=no gear/skills, active=skills+gear when locked. Mechanic evidence, not a human difficulty rating.',rows},null,2));
