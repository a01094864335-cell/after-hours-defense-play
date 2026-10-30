const test=require('node:test'),assert=require('node:assert/strict'),boot=require('./runtime-boot.cjs');
test('fifth successful summon starts once and restore resumes without preparation',()=>{
 const {run}=boot('?gm=1');
 run('meta.tutorialComplete=true;reset();setScreen("battle");closePromo();');
 for(let i=1;i<=4;i++){run('summon()');assert.equal(run('preparationCount()'),i);assert.equal(run('playing'),false);assert.equal(run('wave'),0);}
 run('summon()');assert.equal(run('playing'),true);assert.equal(run('wave'),1);assert.equal(run('board.filter(Boolean).length'),5);
 const sp=run('sp');run('startDuty();startDuty()');assert.equal(run('wave'),1);assert.equal(run('sp'),sp);
 run('const autoSnapshot=runSnapshot();reset();applySnapshot(autoSnapshot)');assert.equal(run('wave'),1);assert.equal(run('playing'),true);assert.equal(run('paused'),true);assert.equal(run('sp'),sp);
 run('reset()');assert.equal(run('preparationCount()'),0);assert.equal(run('playing'),false);
});
test('failed summons do not count, upgrades cannot spend setup SP, merging does not reset count',()=>{
 const {run}=boot('?gm=1');run('meta.tutorialComplete=true;reset();setScreen("battle");closePromo();');
 run('upgrade(0);startDuty()');assert.equal(run('sp'),150);assert.equal(run('levels[0]'),1);assert.equal(run('wave'),0);
 run('sp=0;summon()');assert.equal(run('preparationCount()'),0);assert.equal(run('playing'),false);
 run('sp=150;Math.random=()=>.5;summon();summon();const occupied=board.map((u,i)=>u?i:-1).filter(i=>i>=0);merge(occupied[0],occupied[1]);');assert.equal(run('preparationCount()'),2);
 run('summon();summon();summon()');assert.equal(run('wave'),1);assert.equal(run('playing'),true);
});
test('all daily variants and tutorial can afford five setup summons',()=>{
 const {run}=boot('?gm=1');
 const count=run('DAILY_RULES.length');
 for(let i=0;i<count;i++){
  run(`meta.tutorialComplete=true;dailyRuleForToday=()=>${i};reset();setScreen('battle');closePromo();for(let n=0;n<5;n++)summon();`);
  assert.equal(run('playing'),true,`daily rule ${i}`);assert.equal(run('wave'),1);assert.equal(run('sp>=0'),true);
 }
 run('meta.tutorialComplete=false;reset();setScreen("battle");closePromo();for(let n=0;n<5;n++)summon()');assert.equal(run('wave'),1);assert.equal(run('playing'),true);assert.equal(run('tutorialMode'),true);
});
