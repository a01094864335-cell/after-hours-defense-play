'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),boot=require('./runtime-boot.cjs');
test('new normal and tutorial shifts use base rules on every former calendar variant',()=>{
 const b=boot();for(let i=0;i<b.run('DAILY_RULES.length');i++){
  b.run(`meta.tutorialComplete=true;dailyRuleForToday=()=>${i};reset();for(let j=0;j<5;j++)summon()`);
  assert.equal(b.run('dailyEnabled'),false);assert.equal(b.run('sp'),100);assert.equal(b.run("dailyModifier('startSP',0)"),0);
  assert.equal(b.run('summonPrice()'),40);assert.equal(b.run('equipmentCost(0)'),100);assert.equal(b.run('skillCooldown()'),20);
 }
});
test('old enabled saves lose baked enemy and skill modifiers once without losing SP, board, or source data',()=>{
 const b=boot();for(let i=0;i<b.run('DAILY_RULES.length');i++){
  b.run(`meta.tutorialComplete=true;reset();playing=true;wave=10;board[0]={type:0,pip:5,skillCD:10};enemies=[];spawn('normal');spawn('boss');var original=JSON.stringify(enemies),saved=runSnapshot();saved.dailyEnabled=true;saved.dailyRule=${i};saved.dailyEventId=DAILY_RULES[${i}].id;var r=DAILY_RULES[${i}];for(const e of saved.enemies){var m=(r.enemyHP??1)*(e.type==='boss'?(r.bossHP??1):1);e.hp*=m;e.max*=m;e.shield*=m;e.speed*=r.enemySpeed??1;}saved.board[0].skillCD*=r.skillCooldown??1;var raw=JSON.stringify(saved);applySnapshot(saved);`);
  assert.equal(b.run('dailyEnabled'),false);assert.equal(b.run('sp'),150);assert.equal(b.run('JSON.stringify(saved)'),b.run('raw'));
  assert(b.run('enemies.every((e,i)=>Math.abs(e.max-JSON.parse(original)[i].max)<1e-7&&Math.abs(e.speed-JSON.parse(original)[i].speed)<1e-7)'));
  assert.equal(b.run('board[0].skillCD'),10);b.run('var restored=runSnapshot();applySnapshot(restored)');assert.equal(b.run('runSnapshot().dailyEnabled'),false);
  assert(b.run('enemies.every((e,i)=>Math.abs(e.max-JSON.parse(original)[i].max)<1e-7)'));
 }
});
