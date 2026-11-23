'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),boot=require('./runtime-boot.cjs');
test('all seventeen rank5 forms preserve base identity and fit their packed two-pose atlases',()=>{
 const m=JSON.parse(fs.readFileSync('assets/rank5/manifest.json'));assert.equal(Object.keys(m).length,17);
 const b=boot('');for(let type=0;type<17;type++){const base=b.run(`kinds[${type}].file`),d=m['rank5-'+base];assert.equal(d.baseKey,base);assert.equal(d.frames.length,6);for(const f of d.frames){assert.ok(f.x>=0&&f.y>=0&&f.x+f.w<=d.width&&f.y+f.h<=d.sheetHeight);assert.ok(f.pivotX>=0&&f.pivotX<=f.w&&f.pivotY===f.h)}assert.equal(b.run(`window.BattleImpact.formKey({type:${type},pip:4})`),base);assert.equal(b.run(`window.BattleImpact.staffKey({type:${type},pip:5})`),'rank5-'+base);assert.equal(b.run(`window.BattleImpact.formKey({type:${type},pip:7})`),'rank5-'+base);}
});
test('boss cues start only on exact five-wave boundaries and retain the saved boss identity',()=>{
 const b=boot('');b.run("meta.tutorialComplete=true;reset();setScreen('battle');playing=true;ended=false;wave=3;nextWave()");assert.equal(b.run('bossWarning'),null);
 for(const w of [5,10,15,20,25,30]){b.run(`clearBossWarning();wave=${w-1};nextWave()`);assert.equal(b.run('bossWarning.wave'),w);assert.equal(b.run('bossWarning.id===bossPlans[wave]'),true);assert.equal(b.run('bossWarning.left'),3.2);b.run('paused=true;tickBossWarning(1)');assert.equal(b.run('bossWarning.left'),3.2);b.run('paused=false;tickBossWarning(4)');assert.equal(b.run('bossWarning'),null);}
});
test('failed merges and intentional exits carry the departing appearance without changing loss or refund rules',()=>{
 const b=boot('');b.run("meta.tutorialComplete=true;reset();playing=true;paused=false;board[0]={type:0,pip:5};board[1]={type:0,pip:5};sp=100;Math.random=()=>0;var refund=mergeRefund();merge(0,1)");assert.equal(b.run('board[0]'),null);assert.equal(b.run('board[1].pip'),5);assert.equal(b.run('sp'),b.run('100+refund'));assert.equal(b.run("fx.find(f=>f.effect==='mergeFail').staffType"),0);b.run('window.BoardRecycle.discard(1);window.BoardRecycle.discard(1,true)');assert.equal(b.run('board[1]'),null);assert.equal(b.run('sp'),b.run('100+refund'));assert.equal(b.run("fx.find(f=>f.effect==='staffExit').pip"),5);
});
test('enemy hop affects only drawing and stops under freeze or reduced motion',()=>{
 const b=boot('');b.run("reset();wave=3;spawn('normal');var e=enemies[0];e.progress=17;e.x=82;e.y=400;var calls=[];Motion.draw=(c,k,x,y,h,p,o)=>{calls.push({x,y,o});return true};drawEnemyMotion(e,43)");assert.equal(b.run('e.x'),82);assert.equal(b.run('e.y'),400);assert.equal(b.run('e.progress'),17);assert.ok(b.run('calls.at(-1).y')<412);b.run('e.freeze=1;calls=[];drawEnemyMotion(e,43)');assert.equal(b.run('calls.at(-1).y'),412);assert.equal(b.run('calls.at(-1).o.scaleY'),1);b.run('e.freeze=0;reduce.matches=true;calls=[];drawEnemyMotion(e,43)');assert.equal(b.run('calls.at(-1).y'),412);
});
test('visual form lookup consumes no gameplay RNG, mutates no unit and effect bursts are bounded',()=>{
 const b=boot('');b.run("var u={type:4,pip:5,skillCD:7},before=JSON.stringify(u);Math.random=()=>{throw Error('visual RNG')};for(let i=0;i<50;i++)window.BattleImpact.staffKey(u)");assert.equal(b.run('JSON.stringify(u)===before'),true);b.run("fx=[];for(let i=0;i<1000;i++)burst('arrival',cells[0].x,cells[0].y,'#ffe688')");assert.equal(b.run('fx.length'),480);
});
