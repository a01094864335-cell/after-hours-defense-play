'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),boot=require('./runtime-boot.cjs');
const setup=`meta.tutorialComplete=true;reset();tutorialMode=false;playing=true;wave=5;paused=true;bonusPending=true;dailyEnabled=false;cost=60;board[0]={type:0,pip:1,cool:0};`;
function ready(){const b=boot();b.run(setup);return b}
test('every five-wave milestone generates a saved roulette, including waves five and fifteen',()=>{
 for(const w of [5,10,15,20,25,30,50,100]){const b=ready();b.run(`wave=${w};renderPerkChoices()`);assert.equal(b.run('rewardBundle.mode'),'roulette');assert.equal(b.run('rewardBundle.offers.length'),3);assert.equal(b.run('Number.isInteger(rewardBundle.winner)'),true);assert.equal(b.run('selectRewardOffer(0)'),false)}
});
test('legacy choice saves convert once without changing offers, money or ownership',()=>{
 for(const wave of [5,15]){const b=ready();b.run(`wave=${wave};renderPerkChoices();rewardBundle.mode='choice';delete rewardBundle.winner;rewardBundle.selection=1;var saved=runSnapshot(),cards=JSON.stringify(rewardBundle.offers),before=JSON.stringify(meta);applySnapshot(saved);renderPerkChoices();var fixed=JSON.stringify(rewardBundle);saveActiveRun();`);assert.equal(b.run('rewardBundle.mode'),'roulette');assert.equal(b.run('rewardBundle.selection'),undefined);assert.equal(b.run('JSON.stringify(rewardBundle.offers)'),b.run('cards'));assert.equal(b.run('JSON.stringify(meta)'),b.run('before'));b.run('applySnapshot(runSnapshot());renderPerkChoices()');assert.equal(b.run('JSON.stringify(rewardBundle)'),b.run('fixed'));assert.equal(b.run('choosePerk(rewardBundle.offers[(rewardBundle.winner+1)%3].id)'),false);assert.equal(b.run('choosePerk(rewardBundle.offers[rewardBundle.winner].id)'),true);assert.equal(b.run('bonusPending'),false);}
});
test('invalid reward modes remain rejected atomically',()=>{
 const b=ready();b.run('renderPerkChoices();var before=JSON.stringify(runSnapshot())');
 for(const code of ["s.rewardBundle.mode='other'",'s.rewardBundle.selection=3',"s.rewardBundle.mode='choice';s.rewardBundle.wave=10"]){b.run('var s=runSnapshot()');assert.throws(()=>b.run(code+';applySnapshot(s)'),/reward/);assert.equal(b.run('JSON.stringify(runSnapshot())'),b.run('before'))}
});
test('previously saved roulette winners remain unchanged',()=>{
 const b=ready();b.run('renderPerkChoices();delete rewardBundle.mode;rewardBundle.winner=0;var saved=runSnapshot(),fixed=JSON.stringify(rewardBundle);applySnapshot(saved);renderPerkChoices()');assert.equal(b.run('JSON.stringify(rewardBundle)'),b.run('fixed'));assert.equal(b.run('selectRewardOffer(1)'),false);assert.equal(b.run('choosePerk(rewardBundle.offers[1].id)'),false);assert.equal(b.run('choosePerk(rewardBundle.offers[0].id)'),true);
});
test('winning strategies apply exactly their saved type; manual strategy switching cannot bypass the draw',()=>{
 for(const strategy of ['chain','economy','guard']){const b=ready();b.run(`renderPerkChoices();var offer=rewardBundle.offers.find(o=>o.id==='build');offer.build='${strategy}';rewardBundle.winner=rewardBundle.offers.indexOf(offer)`);assert.equal(b.run("window.TacticalDuty.chooseBuild('guard')"),false);assert.equal(b.run("choosePerk('build')"),true);assert.equal(b.run('window.TacticalDuty.snapshot().build'),strategy);assert.equal(b.run("choosePerk('build')"),false)}
});
test('roulette strategy offers can include guard without bypassing the saved winning card',()=>{const found=new Set();for(const rng of [0,.4,.9]){const b=ready();b.run(`wave=10;Math.random=()=>${rng};renderPerkChoices()`);found.add(b.run("rewardBundle.offers.find(o=>o.id==='build').build"))}assert.deepEqual([...found].sort(),['chain','economy','guard'])});
test('same-kind low-grade direct DPS is preserved; higher ranks retain a bounded space/skill tradeoff',()=>{
 const b=ready();b.run('paused=false');for(let pip=2;pip<=7;pip++){const ratio=b.run(`mergeBasicRatio({type:0,pip:${pip-1}},{type:0,pip:${pip-1}})`);if(pip<=4)assert(ratio>=1-1e-12);else assert(ratio>.92&&ratio<1)}assert.equal(b.run('gradePower(7)'),3.8);b.run('tutorialMode=true');assert.equal(b.run('basicGradePower(7)'),3.8);assert.equal(b.run('mergeBasicRatio({type:3,pip:2},{type:3,pip:2})'),null);
});
test('the new basic curve reaches actual combat hits rather than only preview text',()=>{
 const b=ready();b.run("paused=false;bonusPending=false;wave=2;kingEvent.timer=999;timer=999;queue=['normal'];board[0]={type:0,pip:4,cool:0};spawn('normal');enemies[0].hp=enemies[0].max=1000;update(.01)");assert(Math.abs(b.run('enemies[0].hp')-(1000-14*2.1))<1e-8);
});
test('cleaner wet plus electrician grants exactly twenty percent and no extra stack from repeated wetting',()=>{
 const b=ready();b.run("spawn('normal');var e=enemies[0];e.hp=e.max=10000;attackOwner=2;hitEnemy(e,5,true);hitEnemy(e,5,true);var before=e.hp;attackOwner=4;hitEnemy(e,100,false)");assert.equal(b.run('before-e.hp'),120);assert.equal(b.run('runInsights.observations.cooperation.hits'),1);assert.equal(b.run('runInsights.observations.cooperation.bonusDamage'),20);
 b.run('before=e.hp;attackOwner=0;hitEnemy(e,100,false)');assert.equal(b.run('before-e.hp'),100);b.run('before=e.hp;attackOwner=4;hitEnemy(e,100,false,true)');assert.equal(b.run('before-e.hp'),100);b.run('e.wet=0;e.slow=2;before=e.hp;hitEnemy(e,100,false)');assert.equal(b.run('before-e.hp'),100);
});
test('wet expiry and save/resume keep the exact duration; invalid status cannot mutate the run',()=>{
 const b=ready();b.run("spawn('normal');var e=enemies[0];e.hp=e.max=10000;wetEnemy(e,2);var saved=runSnapshot();applySnapshot(saved)");assert.equal(b.run('enemies[0].wet'),2);b.run("paused=false;bonusPending=false;kingEvent.timer=999;queue=['normal'];timer=999;board=[];update(2.1)");assert.equal(b.run('enemies[0].wet'),0);b.run('var s=runSnapshot(),before=JSON.stringify(s);s.enemies[0].wet=4');assert.throws(()=>b.run('applySnapshot(s)'),/invalid/);assert.equal(b.run('JSON.stringify(runSnapshot())'),b.run('before'));
});
test('tutorial and shared hits cannot acquire cooperative bonuses',()=>{const b=ready();b.run("tutorialMode=true;spawn('normal');var e=enemies[0];e.hp=e.max=1000;wetEnemy(e,2);e.wet=2;attackOwner=4;hitEnemy(e,100,false)");assert.equal(b.run('e.hp'),900);assert.equal(b.run('runInsights.observations.cooperation.hits'),0)});
test('midgame checkpoints deduplicate and observations survive valid restores and reject invalid imports',()=>{
 const b=ready();b.run('bonusPending=false;paused=false;wave=10;afterWaveStart();afterWaveStart();var before=JSON.stringify(runInsights.observations),s=runSnapshot();applySnapshot(s)');assert.equal(b.run('runInsights.observations.waves.length'),1);assert.equal(b.run('JSON.stringify(runInsights.observations)'),b.run('before'));b.run('s.insights.observations.cooperation.hits=-1;var live=JSON.stringify(runSnapshot())');assert.throws(()=>b.run('applySnapshot(s)'),/observations/);assert.equal(b.run('JSON.stringify(runSnapshot())'),b.run('live'));b.run('delete s.insights.observations;applySnapshot(s)');assert.equal(b.run('runInsights.observations.incomplete'),true);
});
test('fatal breaches shortly after a merge are recorded before the paid result is saved',()=>{
 const b=ready();b.run("bonusPending=false;paused=false;wave=12;life=1;board[0]={type:0,pip:1};board[1]={type:0,pip:1};Math.random=()=>.99;merge(0,1);queue=[];kingEvent.timer=999;spawn('normal');var e=enemies[0];e.segment=2;e.x=518;e.y=493;update(.1)");assert.equal(b.run('ended'),true);assert.equal(b.run('profile().records[0].observations.postMergeBreaches'),1);assert.equal(b.run('profile().records[0].observations.breaches[0].boss'),false);assert.equal(b.run('profile().records[0].observations.outcome'),'defeat');b.run('var before=JSON.stringify(meta),report=window.PlayObservations.report()');assert.equal(b.run('JSON.stringify(meta)'),b.run('before'));assert.equal(b.run('report.records.length'),1);b.run('var p=JSON.parse(JSON.stringify(profile()));p.records[0].observations.postMergeBreaches=-1');assert.throws(()=>b.run('readProfile(p)'),/observations/);
});
