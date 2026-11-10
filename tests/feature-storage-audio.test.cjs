// Whole-game QA: independent, deterministic VM repetitions, not browser executions.
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const {createRequire}=require('node:module');
const boot=require('./runtime-boot.cjs');
const REPS=10;
function repeat(name,fn){for(let seed=1;seed<=REPS;seed++)test(`[storage-audio] ${name} | attempt ${seed}/10 | fixture ${seed} | VM`,()=>fn(seed));}
// Reuse the existing actual-module audio harnesses and tutorial assertions. Each
// callback boots a fresh sandbox; no game state is shared across attempts.
// Reused cases use their fixed deterministic fixtures (runtime Math.random=.5);
// numbered new cases vary wallet amounts, wave, speed, grade and backup values.
for(const filename of ['game-audio.test.cjs','game-sfx.test.cjs','fresh-session.test.cjs','tutorial-coach.test.cjs']){
 const full=path.resolve(__dirname,filename),req=createRequire(full),cases=[];
 vm.runInNewContext(fs.readFileSync(full,'utf8'),{require:id=>id==='node:test'?((name,fn)=>cases.push({name,fn})):req(id),console,Buffer,URLSearchParams,setImmediate,__dirname});
 for(const {name,fn}of cases)repeat(`${filename}: ${name}`,fn);
}
repeat('wallet roundtrip, rejected write atomicity, corrupt wallet protection',seed=>{
 const b=boot();b.run(`meta.coins=${seed*123};saveChange(d=>d.items.grade=${seed});var saved=JSON.stringify(meta);meta=loadMeta();`);
 assert.equal(b.run('JSON.stringify(meta)===saved'),true);
 b.run(`var write=localStorage.setItem;localStorage.setItem=()=>{throw Error('quota')};var rejected=saveChange(d=>{d.coins=0;d.items.grade=999});localStorage.setItem=write;`);
 assert.equal(b.run('rejected'),false);assert.equal(b.run('JSON.stringify(meta)===saved'),true);
 b.run(`GameStorage.setItem(META_KEY,'{broken');meta=loadMeta();`);assert(b.run('saveWarning.length>0'));assert.equal(b.run('saveChange(d=>d.coins=999)'),false);assert.equal(b.storage.get('after-hours-defense-v1'),'{broken');
});
repeat('profile and insights migration and invalid-number rejection',seed=>{
 const b=boot();assert.equal(b.run('JSON.stringify(readProfile(undefined))===JSON.stringify(freshProfile())'),true);
 b.run(`var p=freshProfile();p.pity=${seed%10};p.compactFX=${seed%2===0};p.best=${seed*5};var copy=readProfile(p);`);assert.equal(b.run('JSON.stringify(copy)===JSON.stringify(p)'),true);
 for(const mutation of ['pity=10','best=-1','presets=[]','compactFX=1'])assert.throws(()=>b.run(`readProfile({...p,${mutation.replace('=',':')}})`));
 b.run('var insight=freshInsights();delete insight.support.boost;delete insight.bosses;var migrated=readInsights(insight)');assert.equal(b.run('migrated.support.boost'),0);assert.equal(b.run('migrated.bosses.length'),0);assert.throws(()=>b.run('readInsights({...freshInsights(),seconds:Infinity})'));
});
repeat('backup export, restore, detached copies and invalid inputs do not mutate',seed=>{
 const b=boot();b.run(`meta.coins=${seed*100};saveChange(d=>d.items.kind=${seed});var exported=SaveTransfer.exportData();var copy=SaveTransfer.validate(exported);copy.wallet.coins=1;`);assert.equal(b.run('exported.wallet.coins'),seed*100);
 b.run('meta.coins=7;SaveTransfer.restore(exported)');assert.equal(b.run('meta.coins'),seed*100);assert.equal(b.run('meta.items.kind'),seed);
 b.run('var previous=JSON.stringify(meta)');for(const input of ['null','{}','{...exported,version:2}','{...exported,saves:[null]}','{...exported,wallet:{...exported.wallet,coins:-1}}'])assert.throws(()=>b.run(`SaveTransfer.restore(${input})`));assert.equal(b.run('JSON.stringify(meta)===previous'),true);
});
repeat('backup import failure rolls back all keys and interrupted journal recovers',seed=>{
 const b=boot();b.run(`meta.coins=${seed};saveChange(()=>{});var exported=SaveTransfer.exportData();exported.wallet.coins=999;var before=[META_KEY,RUN_SAVE,PENDING_REWARD_SAVE].map(k=>GameStorage.getItem(k));var write=localStorage.setItem;var failed=false;localStorage.setItem=(k,v)=>{if(k===META_KEY&&!failed){failed=true;throw Error('quota')};write(k,v)};`);
 assert.throws(()=>b.run('SaveTransfer.restore(exported)'),/복원 저장/);b.run('localStorage.setItem=write');assert.equal(b.run('JSON.stringify(before)===JSON.stringify([META_KEY,RUN_SAVE,PENDING_REWARD_SAVE].map(k=>GameStorage.getItem(k)))'),true);
 b.run(`GameStorage.setItem('after-hours-import-transaction-v1',JSON.stringify({version:1,phase:'preparing',before}));GameStorage.setItem(META_KEY,'partial');SaveTransfer.recover()`);assert.equal(b.run('JSON.stringify(before)===JSON.stringify([META_KEY,RUN_SAVE,PENDING_REWARD_SAVE].map(k=>GameStorage.getItem(k)))'),true);assert.equal(b.run('SaveTransfer.recoveryError'),false);
 b.run(`GameStorage.setItem('after-hours-import-transaction-v1','broken');SaveTransfer.recover()`);assert.equal(b.run('SaveTransfer.recoveryError'),true);
});
repeat('active run export and resume restore board, currencies, speed and paused state',seed=>{
 const b=boot();b.run(`meta.tutorialComplete=true;reset();setScreen('battle');playing=true;paused=false;wave=${seed};sp=${seed*111};speed=${1+seed%3};board[0]={type:0,pip:${1+seed%7},cool:0,attack:0,arrival:0,income:0,skillCD:0,stun:0};saveActiveRun();var exported=SaveTransfer.exportData();sp=0;board=Array(15).fill(null);var resumed=resumeRun();`);
 assert.equal(b.run('resumed'),true);assert.equal(b.run('sp'),seed*111);assert.equal(b.run('wave'),seed);assert.equal(b.run('board[0].pip'),1+seed%7);assert.equal(b.run('speed'),1+seed%3);assert.equal(b.run('paused'),true);assert.equal(b.run('exported.saves[0].snapshot.sp'),seed*111);
 assert.throws(()=>b.run('SaveTransfer.restore(exported)'),/당직/);
});
repeat('GM isolation blocks backup and never writes normal wallet or active run',seed=>{
 const old=[['after-hours-defense-v1','original'],['after-hours-active-run-v1','active']];const b=boot(`?gm=1&coins=${seed*100}`,old);b.run(`GameStorage.setItem(META_KEY,'practice');GameStorage.removeItem(RUN_SAVE)`);assert.equal(b.storage.get('after-hours-defense-v1'),'original');assert.equal(b.storage.get('after-hours-active-run-v1'),'active');assert.throws(()=>b.run('SaveTransfer.exportData()'),/GM/);
});
function sessionHarness({unavailable=false,denied=false}={}){
 const events={},docEvents={},nodes={};let held=false,releases=0,saves=0,loads=0;const el=id=>nodes[id]??={hidden:false,inert:false,disabled:false,textContent:'',setAttribute(){},focus(){},querySelector:el};
 const sb={GMTest:{enabled:false,fresh:false},navigator:{locks:unavailable?undefined:{request:async(name,opts,callback)=>callback(denied||held?null:(held=true,{}))}},window:{addEventListener:(n,f)=>events[n]=f},document:{querySelector:el,querySelectorAll:()=>[el('dialog')],createElement:()=>el('panel'),body:{append(){}},addEventListener:(n,f)=>docEvents[n]=f},meta:{},playing:true,ended:false,paused:false,SaveTransfer:{recover(){}},loadMeta(){loads++;return {coins:loads}},reset(){},sync(){},GameStorage:{getItem:()=>null},RUN_SAVE:'run',saveActiveRun(){saves++},restorePendingSettlement(){}};
 vm.createContext(sb);vm.runInContext(fs.readFileSync('session-guard.js','utf8'),sb);return {sb,events,nodes,docEvents,load:()=>events.DOMContentLoaded(),held:()=>held,loads:()=>loads,saves:()=>saves};
}
repeat('session ownership blocks input, loads once, saves on hide and reconnects',async()=>{
 const h=sessionHarness();h.load();await Promise.resolve();assert(h.sb.window.GameSession.canWrite());assert.equal(h.loads(),1);assert.equal(h.nodes['#app-shell'].inert,false);h.events.pagehide();await Promise.resolve();assert(!h.sb.window.GameSession.canWrite());assert.equal(h.saves(),1);
 // A new lock is provided by the browser on reconnect. Model that new owner with
 // a fresh request callback, not an actual multi-tab browser lock assertion.
 h.sb.navigator.locks.request=async(n,o,fn)=>fn({});h.events.pageshow({persisted:true});await Promise.resolve();assert(h.sb.window.GameSession.canWrite());assert.equal(h.loads(),2);
 h.events.storage({key:'after-hours-defense-v1'});assert(!h.sb.window.GameSession.canWrite());assert.equal(h.sb.paused,true);assert.equal(h.nodes['#app-shell'].inert,true);
 let blocked=0;h.docEvents.click({target:{closest:()=>false},preventDefault(){blocked++},stopImmediatePropagation(){blocked++}});assert.equal(blocked,2);
});
repeat('session unavailable and held locks fail closed without loading stale wallet',async()=>{
 for(const options of [{unavailable:true},{denied:true}]){const h=sessionHarness(options);h.load();await Promise.resolve();assert(!h.sb.window.GameSession.canWrite());assert.equal(h.loads(),0);assert.equal(h.nodes['#app-shell'].inert,true);assert.equal(h.nodes.panel.hidden,false);}
});
repeat('rotation blocks input and pauses without auto-resuming on portrait return',()=>{
 const nodes={},media={matches:false,addEventListener(n,f){this.change=f}};const sb={window:{},matchMedia:()=>media,document:{querySelector:id=>nodes[id]??={},querySelectorAll:()=>[]},GameSession:{canWrite:()=>true},playing:true,ended:false,paused:false,sync(){}};
 vm.runInNewContext(fs.readFileSync('orientation.js','utf8'),sb);media.matches=true;media.change();assert.equal(sb.paused,true);assert.equal(nodes['#app-shell'].inert,true);assert.equal(nodes['#rotation-notice'].hidden,false);media.matches=false;media.change();assert.equal(sb.paused,true);assert.equal(nodes['#app-shell'].inert,false);assert.equal(nodes['#rotation-notice'].hidden,true);
});
function transferUIHarness(){
 const nodes={},events={};const el=id=>nodes[id]??={value:'',hidden:false,files:[],insertBefore(){},append(){},setAttribute(){},addEventListener(n,f){this['on'+n]=f},showModal(){this.open=true},close(){this.open=false;this.onclose?.()}};
 const sb={document:{querySelector:el,createElement:()=>el('created-'+Object.keys(nodes).length),body:{append(){}}},GMTest:{enabled:false},SaveTransfer:{validate(input){if(!input.wallet)throw Error('invalid');return input},restore(input){sb.restored=input}},playing:false,ended:false,paused:false,panelResume:false,saveWarning:'',reset(){},sync(){},GameStorage:{getItem:()=>null},RUN_SAVE:'run',restorePendingSettlement(){},showMetaStatus(){}};
 vm.runInNewContext(fs.readFileSync('save-transfer-ui.js','utf8'),sb);return {nodes,sb,backup:coins=>JSON.stringify({wallet:{coins,staff:[],owned:[],training:{staff:1,merc:1}}})};
}
repeat('backup file read invalidates stale preview and latest selection wins',async seed=>{
 const h=transferUIHarness(),n=h.nodes;let resolveFirst,resolveSecond;
 n['#save-text'].value=h.backup(seed);n['#save-preview'].onclick();assert.equal(n['#save-restore'].hidden,false);
 n['#save-file'].files=[{size:50,text:()=>new Promise(r=>resolveFirst=r)}];const first=n['#save-file'].onchange();
 // A user can still preview old text while the native file read is pending.
 n['#save-preview'].onclick();resolveFirst(h.backup(seed+100));await first;assert.equal(n['#save-restore'].hidden,true,'new file must invalidate any intervening old preview');
 n['#save-file'].files=[{size:50,text:()=>new Promise(r=>resolveFirst=r)}];const older=n['#save-file'].onchange();
 n['#save-file'].files=[{size:50,text:()=>new Promise(r=>resolveSecond=r)}];const newer=n['#save-file'].onchange();
 resolveSecond(h.backup(seed+200));await newer;resolveFirst(h.backup(seed+300));await older;assert.equal(n['#save-text'].value,h.backup(seed+200),'last selection, not slowest read, must win');
});
repeat('unreadable backup file reports failure without an unhandled rejection',async()=>{
 const h=transferUIHarness();h.nodes['#save-file'].files=[{size:10,text:()=>Promise.reject(Error('file unavailable'))}];await h.nodes['#save-file'].onchange();assert.match(h.nodes['#save-transfer-status'].textContent,/실패|읽지/);assert.equal(h.nodes['#save-restore'].hidden,true);
});
repeat('typing during a backup read preserves manual text and invalidates preview',async seed=>{
 const h=transferUIHarness(),n=h.nodes;let resolve;
 n['#save-file'].files=[{size:10,text:()=>new Promise(r=>resolve=r)}];const pending=n['#save-file'].onchange();n['#save-text'].value=h.backup(seed);n['#save-text'].oninput();resolve(h.backup(seed+100));await pending;assert.equal(n['#save-text'].value,h.backup(seed));assert.equal(n['#save-restore'].hidden,true);
});
repeat('closing backup dialog cancels pending file read without altering text',async seed=>{
 const h=transferUIHarness(),n=h.nodes;let resolve;n['#save-text'].value=h.backup(seed);
 n['#save-file'].files=[{size:10,text:()=>new Promise(r=>resolve=r)}];const pending=n['#save-file'].onchange();Object.values(n).find(e=>e.id==='save-transfer-dialog').close();resolve(h.backup(seed+100));await pending;assert.equal(n['#save-text'].value,h.backup(seed));assert.equal(n['#save-restore'].hidden,true);
});
