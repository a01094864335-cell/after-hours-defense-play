const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),boot=require('./runtime-boot.cjs');
for(let attempt=1;attempt<=10;attempt++){
 test(`training page / independent ${attempt} / navigation preserves wallet and formation`,()=>{
  const b=boot();b.run(`meta.tutorialComplete=true;meta.coins=${100+attempt};var qaData=JSON.stringify(meta);setScreen('lobby');openTraining();`);
  assert.equal(b.run('appScreen'),'training');assert.equal(b.nodes['#training-dialog'].hidden,false);assert.equal(b.nodes['#training-dialog'].open,false);assert.equal(b.run('JSON.stringify(meta)===qaData'),true);
  b.run('closeTraining()');assert.equal(b.run('appScreen'),'lobby');assert.equal(b.nodes['#training-dialog'].hidden,true);assert.equal(b.run('JSON.stringify(meta)===qaData'),true);
 });
 test(`training page / independent ${attempt} / battle pause handoff and result access`,()=>{
  const b=boot();b.run("playing=true;ended=false;paused=false;setScreen('battle');panelResume=true;paused=true;openTraining();");assert.equal(b.run('paused'),true);assert.equal(b.run('panelResume'),false);assert.equal(b.run('trainingResume'),true);assert.equal(b.run('appScreen'),'training');
  b.run('closeTraining()');assert.equal(b.run('paused'),false);assert.equal(b.run('appScreen'),'battle');
  b.run("paused=true;openTraining();closeTraining()");assert.equal(b.run('paused'),true);
  b.run("ended=true;playing=false;runReward={paid:true,total:0};setScreen('result');openTraining();appRender()");assert.equal(b.run('appScreen'),'training');b.run('closeTraining()');assert.equal(b.run('appScreen'),'result');
 });
 test(`training page / independent ${attempt} / ownership blocks navigation and upgrades still atomic`,()=>{
  const b=boot();b.run("meta.coins=100;setScreen('lobby');var oldSession=GameSession;GameSession={canWrite:()=>false};var opened=openTraining();");assert.equal(b.run('opened'),false);assert.equal(b.run('appScreen'),'lobby');
  b.run("GameSession=oldSession;openTraining();var costBefore=trainingCost(meta.training.staff);document.querySelector('#training-upgrade').onclick();");assert.equal(b.run('meta.training.staff'),2);assert.equal(b.run('meta.coins'),100-b.run('costBefore'));
 });
}
test('training markup is a real hidden section inside the guarded app shell',()=>{
 const html=fs.readFileSync('index.html','utf8'),pos=html.indexOf('<section id="training-dialog"');assert(pos>html.indexOf('id="app-shell"')&&pos<html.indexOf('</main>'));assert(!html.includes('<dialog id="training-dialog"'));
 const js=fs.readFileSync('training-ui.js','utf8');assert(!js.includes("document.querySelector('#training-dialog').showModal()"));assert(js.includes("window.history.pushState"));assert(js.includes("'popstate'"));
});
