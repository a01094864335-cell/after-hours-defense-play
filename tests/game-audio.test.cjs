const test=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs');
function boot(saved){
 const events={},nodes={},players=[],storage=new Map(saved?[['night-duty-audio',JSON.stringify(saved)]]:[]);let tick;
 class Audio{constructor(src){this.src=src;this.paused=true;this.volume=0;players.push(this)}addEventListener(){}play(){this.paused=false;return Promise.resolve()}pause(){this.paused=true}}
 const sb={Audio,Promise,Map,Set,Number,Math,JSON,appScreen:'lobby',paused:false,enemies:[],localStorage:{getItem:k=>storage.get(k),setItem:(k,v)=>storage.set(k,v)},document:{hidden:false,querySelector:id=>nodes[id]??=( {value:0,addEventListener(n,f){this[n]=f},setAttribute(k,v){this[k]=v}}),addEventListener(n,f){events[n]=f}},window:{addEventListener(n,f){events[n]=f},setInterval(f){tick=f}}};
 vm.runInNewContext(fs.readFileSync('game-audio.js','utf8'),sb);return {sb,events,nodes,players,storage,tick:()=>tick()};
}
test('music waits for a gesture, switches to boss, crossfades and pauses in background',async()=>{
 const b=boot();b.tick();assert.equal(b.players.length,0);b.events.pointerdown();await Promise.resolve();assert.match(b.players[0].src,/lobby-night/);assert.equal(b.players[0].loop,true);
 b.sb.appScreen='battle';b.tick();await Promise.resolve();assert.match(b.players[1].src,/night-shift/);
 b.sb.enemies=[{type:'boss',hp:100}];b.tick();await Promise.resolve();assert.match(b.players[2].src,/commander/);
 for(let i=0;i<10;i++)b.tick();assert(b.players[0].paused);assert(b.players[1].paused);assert(!b.players[2].paused);
 b.sb.paused=true;b.tick();assert(b.players.every(a=>a.paused));b.sb.paused=false;b.sb.document.hidden=true;b.tick();assert(b.players.every(a=>a.paused));
});
test('volume and mute persist, zero volume does not load music',()=>{
 const b=boot({volume:0,muted:false});b.events.pointerdown();assert.equal(b.players.length,0);
 b.nodes['#bgm-volume'].value='60';b.nodes['#bgm-volume'].input();assert.equal(JSON.parse(b.storage.get('night-duty-audio')).volume,.6);
 b.nodes['#bgm-toggle'].click();assert.equal(JSON.parse(b.storage.get('night-duty-audio')).muted,true);assert(b.players.every(a=>a.paused));
});
test('all original music files are valid PCM loop assets within mobile budget',()=>{
 for(const file of ['lobby-night','night-shift','commander']){
 const b=fs.readFileSync('assets/audio/'+file+'.wav');assert.equal(b.toString('ascii',0,4),'RIFF');assert.equal(b.readUInt32LE(24),22050);assert.equal(b.readUInt16LE(22),1);assert(b.length<2*1024*1024);assert(b.length>1000000);
 let peak=0;for(let i=44;i<b.length;i+=2)peak=Math.max(peak,Math.abs(b.readInt16LE(i)));assert(peak>8000&&peak<30000);assert(Math.abs(b.readInt16LE(44)-b.readInt16LE(b.length-2))<1500);
 }
});
