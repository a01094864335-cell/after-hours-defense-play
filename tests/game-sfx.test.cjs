const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
function boot(saved, options={}){
 const nodes={},events={},sources=[],buffers=[],storage=new Map(saved?[['night-duty-sfx',JSON.stringify(saved)]]:[]);
 const gain={gain:{setTargetAtTime(){}},connect(){}};
 const engine={currentTime:1,state:'running',destination:{},createGain:()=>gain,createBuffer(ch,n,rate){const data=new Float32Array(n);buffers.push(data);return {getChannelData:()=>data,duration:n/rate}},createBufferSource(){const s={connect(){},disconnect(){},start(){this.started=true},stop(){this.stopped=true;this.onended?.()}};sources.push(s);return s},resume(){this.state='running';return Promise.resolve()},suspend(){this.state='suspended';return Promise.resolve()}};
 const sb={window:{AudioContext:options.unsupported?undefined:function(){if(options.broken)throw Error('no device');return engine},addEventListener(n,f){events[n]=f}},document:{hidden:false,querySelector:id=>nodes[id]??={setAttribute(k,v){this[k]=v},addEventListener(n,f){this[n]=f}},querySelectorAll:()=>[button],addEventListener(n,f){events[n]=f}},localStorage:{getItem:k=>storage.get(k),setItem:(k,v)=>storage.set(k,v)},board:[],levels:[1],wave:0,life:3,selected:0,paused:false,ended:false,kingEvent:{state:'idle'},Motion:{start(){}},summon(){if(this?.reject)return;sb.board.push({type:0,pip:1,skillCD:0})},merge(){if(sb.board.length<2)return false;sb.board.pop();return !sb.fail},useSkill(){const u=sb.board[sb.selected];if(u?.pip>=5&&!sb.paused)u.skillCD=10},upgrade(i){sb.levels[i]++},nextWave(){sb.wave++},spawn(){},breachDamage(n){sb.life-=n},cueMercenary(){},hitEnemy(e,d){if(e.hp>0)e.hp-=d},recordKill(e){e.rewarded=true},burst(){},settleRun(){return 7},reset(){sb.ended=false;sb.board=[]},updateKing(){sb.kingEvent.state='entrance';return true}};
 const button={onclick:sb.summon};vm.createContext(sb);vm.runInContext(fs.readFileSync('game-sfx.js','utf8'),sb);return {sb,nodes,events,sources,buffers,storage,engine,button,play:n=>vm.runInContext(`GameSFX.play(${JSON.stringify(n)})`,sb)};
}
test('effects wait for gesture, cache finite bounded samples and cap combat voices',()=>{
 const b=boot();assert.equal(b.play('cannon'),false);assert.equal(b.sources.length,0);b.events.pointerdown();assert(b.buffers.length>=25);
 for(const data of b.buffers){assert(data.length>0);assert(data.every(x=>Number.isFinite(x)&&Math.abs(x)<1));assert(Math.abs(data[0])<.001);assert(Math.abs(data.at(-1))<.001)}
 assert(b.play('cannon'));assert(!b.play('cannon'));for(let i=0;i<25;i++){b.engine.currentTime+=.2;b.play(['arrow','hit','bolt'][i%3])}assert.equal(b.sources.length,6);
 assert(b.play('skill'));assert.equal(b.sources.length,7);b.sb.document.hidden=true;assert(!b.play('wave'));b.events.visibilitychange();assert(b.sources.every(s=>s.stopped));
});
test('successful actions sound once, rejected actions stay silent and button references are rebound',()=>{
 const b=boot();b.events.pointerdown();b.button.onclick();assert.equal(b.sb.board.length,1);assert.equal(b.sources.length,1);
 b.engine.currentTime+=1;b.sb.summon.call({reject:true});assert.equal(b.sources.length,1);assert.equal(b.sb.merge(),false);assert.equal(b.sources.length,1);
 b.sb.summon();b.engine.currentTime+=1;assert.equal(b.sb.merge(),true);assert.equal(b.sources.length,3);
 b.sb.board[0].pip=5;b.engine.currentTime+=1;b.sb.useSkill();assert.equal(b.sources.length,4);
 b.engine.currentTime+=1;b.sb.life=0;b.sb.ended=true;assert.equal(b.sb.settleRun(),7);assert.equal(b.sources.length,5);b.engine.currentTime+=1;b.sb.settleRun();assert.equal(b.sources.length,5);
});
test('independent effect preferences persist, mute stops voices and unsupported audio is harmless',()=>{
 const b=boot({volume:.4,muted:false});assert.equal(b.nodes['#sfx-volume'].value,40);b.events.pointerdown();b.play('skill');b.nodes['#sfx-toggle'].click();assert(b.sources.every(s=>s.stopped));assert(!b.play('wave'));assert(JSON.parse(b.storage.get('night-duty-sfx')).muted);
 b.nodes['#sfx-volume'].value='20';b.nodes['#sfx-volume'].input();assert.equal(JSON.parse(b.storage.get('night-duty-sfx')).volume,.2);
 const old=boot(null,{unsupported:true});assert.equal(old.play('wave'),false);assert(old.nodes['#sfx-toggle'].disabled);
 const broken=boot(null,{broken:true});broken.events.pointerdown();assert.equal(broken.play('wave'),false);assert.doesNotThrow(()=>broken.sb.summon());
});
