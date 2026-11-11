'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),boot=require('./runtime-boot.cjs');
const setup=`meta.tutorialComplete=true;reset();tutorialMode=false;playing=true;paused=true;bonusPending=true;dailyEnabled=false;life=3;`;
function check(body){const b=boot();b.run(setup+body);return b;}
test('all milestones give three distinct atomic cards with the approved growth cadence',()=>{
 const b=check(`let result=[];for(const w of [5,10,15,20,25,30,35,40,45,50,100]){wave=w;rewardBundle=null;renderPerkChoices();result.push({wave:w,ids:rewardBundle.offers.map(o=>o.id),amount:rewardBundle.offers[1].amount});if(rewardBundle.offers.length!==3||rewardBundle.offers.some(o=>!rewardEligible(o)))throw Error('unusable offers');}`);
 const r=JSON.parse(b.run('JSON.stringify(result)'));assert.deepEqual(r.slice(0,6).map(x=>x.ids[1]),['merge','equipment','staff','keep','staff','equipment']);assert.equal(r[4].amount,4);assert.equal(r[5].amount,2);r.forEach(x=>assert.equal(new Set(x.ids).size,3));
});
test('saved cards preserve target, amount and order across restore and reposition, invalid saves are atomic',()=>{
 check(`wave=25;renderPerkChoices();const before=JSON.stringify(rewardBundle),s=runSnapshot();board[0]={type:0,pip:1};applySnapshot(s);renderPerkChoices();if(JSON.stringify(rewardBundle)!==before)throw Error('rerolled');window.TacticalDuty.startReposition();window.TacticalDuty.endReposition();if(JSON.stringify(rewardBundle)!==before)throw Error('reposition rerolled');const bad=runSnapshot();bad.rewardBundle.offers[1].type=999;const live=JSON.stringify(runSnapshot());try{applySnapshot(bad);throw Error('accepted')}catch(e){if(e.message==='accepted')throw e}if(JSON.stringify(runSnapshot())!==live)throw Error('mutated invalid save');`);
});
test('merge charges add rather than replace, cannot exceed cap, and rewards cannot be claimed twice',()=>{
 check(`wave=15;guaranteedMerge=2;renderPerkChoices();if(!choosePerk('merge')||guaranteedMerge!==3)throw Error('charge add/cap');if(choosePerk('merge'))throw Error('double award');wave=5;bonusPending=true;paused=true;rewardBundle=null;renderPerkChoices();if(rewardBundle.offers.some(o=>o.id==='merge'))throw Error('capped charge offered');`);
});
test('full board and max gear substitute useful rewards; strategies are eligible and one per run',()=>{
 check(`wave=30;board=Array.from({length:15},()=>({type:0,pip:7}));levels.fill(5);guaranteedMerge=3;renderPerkChoices();if(rewardBundle.offers.some(o=>['life','equipment','staff','merge'].includes(o.id)))throw Error('unusable reward');wave=10;rewardBundle=null;renderPerkChoices();if(!choosePerk('build')||!window.TacticalDuty.snapshot().build)throw Error('strategy');wave=25;paused=true;bonusPending=true;renderPerkChoices();if(rewardBundle.offers.some(o=>o.id==='build'))throw Error('second strategy');`);
});
test('temporary support affects real damage and movement only for the next five waves and survives reload',()=>{
 check(`wave=35;board=Array(15).fill(null);levels.fill(5);guaranteedMerge=3;renderPerkChoices();if(!choosePerk('power'))throw Error('support');dailyEnabled=false;spawn('normal');const e=enemies[0];e.hp=e.max=10000;hitEnemy(e,100,false);if(Math.abs(e.hp-9890)>1e-8)throw Error('power');const s=runSnapshot();applySnapshot(s);if(rewardSupport.until!==40)throw Error('support restore');wave=41;e.hp=10000;hitEnemy(e,100,false);if(Math.abs(e.hp-9900)>1e-8)throw Error('expired');rewardSupport={id:'slow',until:45};wave=41;paused=false;queue=['normal'];timer=999;kingEvent.timer=999;enemies=[e];e.speed=100;e.segment=0;e.x=82;e.y=520;e.progress=0;e.slow=0;e.rush=0;e.skill=999;update(.1);if(Math.abs(e.progress-9)>1e-8)throw Error('movement');rewardSupport={id:'boss',until:45};if(rewardSupportMultiplier('damage',{type:'boss'})!==1.2||rewardSupportMultiplier('damage',{type:'normal'})!==1)throw Error('boss specificity');`);
});
test('SP equals successive base summons including price growth and daily surcharge, excluding coupon',()=>{
 const b=check(`wave=20;cost=500;summonDiscount=true;dailyEnabled=false;const amount=perkReward().sp;dailyEnabled=true;dailyRule=DAILY_RULES.findIndex(r=>r.id==='austerity');const surcharge=perkReward().sp;`);assert.equal(b.run('amount'),2600);assert.equal(b.run('surcharge'),2860);
});

test('saturated endgame still has three useful buffs and no SP or unmergeable protection',()=>{check(`wave=45;board=Array.from({length:15},()=>({type:0,pip:7}));levels.fill(5);guaranteedMerge=3;window.TacticalDuty.restore({version:1,keep:1,build:'chain',guardUsed:false,chainCD:0,completed:0});renderPerkChoices();if(rewardBundle.offers.map(o=>o.id).sort().join()!=='boss,power,slow')throw Error('dead end rewards');`)});
