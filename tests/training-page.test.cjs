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

for(let attempt=1;attempt<=10;attempt++)test(`training page / independent ${attempt} / result home starts a fresh duty`,()=>{
 const b=boot();b.run("ended=true;playing=false;wave=12;runReward={paid:true,total:0};setScreen('result');openTraining();trainingNavigate('home');");
 assert.equal(b.run('appScreen'),'lobby');assert.equal(b.run('ended'),false);assert.equal(b.run('wave'),0);assert.equal(b.run('runReward'),null);
 b.run("document.querySelector('#enter-battle').onclick();sync()");assert.equal(b.run('appScreen'),'battle');assert.equal(b.run('wave'),0);assert.equal(b.run('ended'),false);
});
test('training home retains unpaid reward if settlement cannot persist',()=>{
 const b=boot();b.run("ended=true;playing=false;wave=12;runReward={paid:false,total:123};setScreen('result');openTraining();settleRun=()=>{};var left=trainingNavigate('home');");
 assert.equal(b.run('left'),false);assert.equal(b.run('appScreen'),'training');assert.equal(b.run('ended'),true);assert.equal(b.run('wave'),12);assert.equal(b.run('runReward.paid'),false);
});

for(let attempt=1;attempt<=10;attempt++)test(`training page / independent ${attempt} / active home requires leave confirmation`,()=>{
 const b=boot();b.run("playing=true;ended=false;paused=false;wave=7;setScreen('battle');openTraining();trainingNavigate('home');");
 assert.equal(b.run('appScreen'),'training');assert.equal(b.run('paused'),true);assert.equal(b.nodes['#leave'].open,true);assert.equal(b.run('wave'),7);
 b.run("document.querySelector('#leave-cancel').onclick()");assert.equal(b.run('appScreen'),'training');assert.equal(b.run('paused'),true);assert.equal(b.run('wave'),7);assert.equal(b.nodes['#leave'].open,false);
 b.run("trainingNavigate('home');document.querySelector('#leave-confirm').onclick()");assert.equal(b.run('appScreen'),'lobby');assert.equal(b.run('playing'),false);assert.equal(b.run('wave'),0);assert.equal(b.nodes['#training-dialog'].hidden,true);assert.equal(b.nodes['#leave'].open,false);
 b.run("document.querySelector('#enter-battle').onclick();sync()");assert.equal(b.run('appScreen'),'battle');assert.equal(b.run('wave'),0);
});

test('reopening after reload reuses the existing training history entry',()=>{
 const b=boot();b.run("var routePushes=0;window.history={state:{afterHoursPage:'training'},pushState(){routePushes++},back(){}};setScreen('lobby');openTraining();");
 assert.equal(b.run('appScreen'),'training');assert.equal(b.run('routePushes'),0);assert.equal(b.run('trainingHistory'),true);
 b.run('closeTraining()');assert.equal(b.run('appScreen'),'lobby');assert.equal(b.run('trainingHistoryPending'),true);
});
