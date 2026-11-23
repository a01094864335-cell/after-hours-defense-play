'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),boot=require('./runtime-boot.cjs');
const prepare="meta.tutorialComplete=true;reset();playing=true;wave=4;paused=false;board[0]={type:0,pip:2};board[1]={type:0,pip:2};";
test('merge preview describes actual risk, slot and random-kind tradeoff without mutating the run',()=>{
 const b=boot();b.run(prepare+'var before=JSON.stringify(runSnapshot());var info=window.TacticalDuty.mergeDetails(0,1)');
 assert.equal(b.run('info.failure'),10);assert.match(b.run('info.lines.join()'),/빈자리 \+1.*종류 랜덤.*총화력.*이동 직원 소멸/);assert.equal(b.run('JSON.stringify(runSnapshot())===before'),true);
 b.run('board[0].pip=board[1].pip=4');assert.match(b.run('window.TacticalDuty.mergeDetails(0,1).lines[2]'),/스킬 해금/);
 b.run('board[1].pip=7');assert.equal(b.run('window.TacticalDuty.mergeDetails(0,1)'),null);
});
test('success guarantee and kind protection previews match consumption and failure behavior',()=>{
 const b=boot();b.run(prepare+'guaranteedMerge=1');assert.equal(b.run('window.TacticalDuty.mergeDetails(0,1).failure'),0);assert.equal(b.run('window.TacticalDuty.mergeDetails(0,1).keep'),false);
 b.run("window.TacticalDuty.restore({version:1,keep:1,build:null,guardUsed:false,chainCD:0,completed:0});var i=window.TacticalDuty.mergeDetails(0,1)");assert.equal(b.run('i.keep'),true);b.run('merge(0,1)');assert.equal(b.run('board[1].type'),0);assert.equal(b.run('guaranteedMerge'),1);
});
test('planning highlights only eligible orthogonal recipients and never invents an unrevealed boss',()=>{
 const b=boot();b.run(prepare+"board=Array(15).fill(null);board[6]={type:16,pip:5};board[1]={type:0,pip:5};board[5]={type:0,pip:4};board[7]={type:16,pip:5};board[11]={type:3,pip:5};bossPlans={};var before=JSON.stringify(runSnapshot());var plan=window.TacticalDuty.planningDetails(6)");
 assert.deepEqual(JSON.parse(b.run('JSON.stringify(plan.neighbors)')),[1,11]);assert.equal(b.run('JSON.stringify(runSnapshot())===before'),true);assert.match(b.run('plan.lines.join()'),/정찰 중/);
 b.run("board[6].type=11;plan=window.TacticalDuty.planningDetails(6)");assert.deepEqual(JSON.parse(b.run('JSON.stringify(plan.neighbors)')),[1,5]);
 b.run('board[6].stun=1');assert.equal(b.run('window.TacticalDuty.planningDetails(6).neighbors.length'),0);
});
test('planning uses live boss identity, existing mine radius and actual leading target',()=>{
 const b=boot();b.run(prepare+"bossPlans[5]='aegis';wave=5;enemies=[];spawn('boss');board[6]={type:5,pip:5};var plan=window.TacticalDuty.planningDetails(6)");assert.match(b.run('plan.lines.join()'),/現在|현재/);assert.match(b.run('plan.lines.join()'),/방패.*무시/);assert.equal(b.run('plan.beam===leadingEnemy()'),true);
 b.run('board[6]={type:14,pip:5};plantMine(board[6],6,100,20);plantMine(board[6],6,200,20,true)');assert.deepEqual(JSON.parse(b.run('JSON.stringify(window.TacticalDuty.planningDetails(6).mines.map(m=>m.radius))')),[52,70]);
});
test('first boss bonus offers an early strategy without changing SP or merge amounts',()=>{
 const b=boot();b.run(prepare+'wave=5;paused=true;bonusPending=true;renderPerkChoices()');assert.equal(b.run("rewardBundle.offers.some(o=>o.id==='build')"),true);assert.equal(b.run("rewardBundle.offers.some(o=>o.id==='merge')"),true);
 b.run("rewardBundle.winner=rewardBundle.offers.findIndex(o=>o.id==='build');rewardBundle.offers[rewardBundle.winner].build='chain'");const before=b.run('sp');assert.equal(b.run("choosePerk('build')"),true);assert.equal(b.run('sp'),before);assert.equal(b.run('wave'),6);assert.equal(b.run("window.TacticalDuty.chooseBuild('guard')"),false);b.run('var snapshot=runSnapshot();applySnapshot(snapshot)');assert.equal(b.run('window.TacticalDuty.snapshot().build'),'chain');
});
test('strategy eligibility and reward presence are enforced before any state change',()=>{
 const b=boot();b.run(prepare+"runDeck=[0,1,2,4,5];activeMerc=null;wave=5;paused=true;bonusPending=true;renderPerkChoices();var before=JSON.stringify(runSnapshot())");assert.equal(b.run("window.TacticalDuty.chooseBuild('economy')"),false);assert.equal(b.run('JSON.stringify(runSnapshot())===before'),true);
 b.run("rewardBundle.offers=rewardBundle.offers.filter(o=>o.id!=='build')");assert.equal(b.run("window.TacticalDuty.chooseBuild('guard')"),false);
});
test('all three early strategies retain their existing real combat effects',()=>{
 for(const id of ['chain','economy','guard']){
  const b=boot();b.run(prepare+`wave=5;paused=true;bonusPending=true;renderPerkChoices();rewardBundle.winner=rewardBundle.offers.findIndex(o=>o.id==='build');rewardBundle.offers[rewardBundle.winner].build='${id}';choosePerk('build');dailyEnabled=false;`);
  if(id==='economy'){b.run('var amount=trainingIncome({pip:1,paydays:0})');assert.equal(b.run('amount'),8.75)}
  if(id==='guard'){b.run('var before=life;breachDamage(1);var once=life;breachDamage(1)');assert.equal(b.run('once'),b.run('before'));assert.equal(b.run('life'),b.run('before')-1)}
  if(id==='chain'){b.run("enemies=[];spawn('normal');spawn('normal');enemies.forEach((e,i)=>{e.hp=e.max=1000;e.x=100+i*10;e.y=200;e.progress=i});attackOwner=0;hitEnemy(enemies[0],100,false)");assert.equal(b.run('enemies[1].hp'),975)}
 }
});
test('early strategy remains a choice beside repair when hurt and does not reroll legacy saved offers',()=>{
 const b=boot();b.run(prepare+'wave=5;paused=true;bonusPending=true;life=2;renderPerkChoices()');assert.equal(b.run("rewardBundle.offers.some(o=>o.id==='build')&&rewardBundle.offers.some(o=>o.id==='life')"),true);
 b.run("rewardBundle={wave:5,offers:[{id:'sp',amount:130},{id:'merge',amount:1},{id:'life',amount:1}]};var legacy=runSnapshot();applySnapshot(legacy);renderPerkChoices()");assert.equal(b.run("rewardBundle.offers.some(o=>o.id==='build')"),false);assert.equal(b.run("window.TacticalDuty.chooseBuild('guard')"),false);
});
