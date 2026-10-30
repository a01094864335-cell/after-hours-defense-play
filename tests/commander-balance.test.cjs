const test=require('node:test'),assert=require('node:assert/strict'),boot=require('./runtime-boot.cjs');
test('Aegis keeps opening shield and replenishes 15 percent',()=>{
 const {run}=boot();assert.equal(run(`wave=5;tutorialMode=false;dailyEnabled=false;bossPlans={5:'aegis'};enemies=[];spawn('boss');enemies[0].shield/enemies[0].max`),.3);
 assert.equal(run(`enemies[0].shield=0;castBoss(enemies[0]);enemies[0].shield/enemies[0].max`),.15);
});
test('Chrono warns, accelerates without teleport or healing, and restores its timer',()=>{
 const {run}=boot();run(`wave=5;tutorialMode=false;dailyEnabled=false;bossPlans={5:'chrono'};enemies=[];spawn('boss');var c=enemies[0];c.hp=100;c.progress=200;c.skill=1.5;bossSkills(c)`);
 assert.equal(run('c.warning'),1);run('castBoss(c)');assert.equal(run('c.hp'),100);assert.equal(run('c.progress'),200);
 assert.equal(run('bossSpeed(c)'),2);assert.equal(run('c.fastForwardLeft'),2);
 assert.equal(run('c.rush=2;bossSpeed(c)*1.65'),2);run('c.rush=0;c.bossAge=35;tickBoss(c,2)');assert.equal(run('bossSpeed(c)'),1.3);
 assert.equal(run(`c.fastForwardLeft=1.25;var restored=JSON.parse(JSON.stringify(c));restoreBoss(restored);restored.fastForwardLeft`),1.25);
 assert.equal(run(`delete restored.fastForwardLeft;restoreBoss(restored);restored.fastForwardLeft`),0);
 assert.equal(run(`c.fastForwardLeft=2;c.slow=2;bossSpeed(c)*trainingSlow(c)<2`),true);
});
