'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const box={window:{},document:{}};vm.runInNewContext(fs.readFileSync('battle-presentation.js','utf8'),box);const p=box.window.BattlePresentation;
const actors=Object.entries(JSON.parse(fs.readFileSync('assets/combat-comic/manifest.json')).characters).filter(([,d])=>d.group==='enemy');
test('all twelve enemy types and six poses fit mobile edges and leave space for health/name HUD',()=>{
 for(const [width,height] of [[320,292],[390,460],[430,530]])for(const [id,d]of actors){
  const boss=id==='hero-leon'||id.startsWith('commander-'),nominal=(boss?75:43)*.91;
  for(const position of [{x:82,y:530},{x:82,y:135},{x:200,y:135},{x:518,y:135},{x:518,y:500}]){
   const a=p.project(position,width,height),size=p.enemySize(d,nominal,width,a,boss),scale=size/d.height;
   assert(size>0&&Number.isFinite(size),id);
   for(const f of d.frames){assert(a.x-f.pivotX*scale>=2-1e-8,id+' left');assert(a.x+(f.w-f.pivotX)*scale<=width-2+1e-8,id+' right');assert(a.y-f.pivotY*scale>=20-1e-8,id+' HUD');}
  }
 }
});
test('ordinary enemies grow by 35 percent and bosses grow at most 12 percent without changing staff scales',()=>{
 const width=390,a=p.project({x:300,y:135},390,460);
 for(const[id,d]of actors){const boss=id==='hero-leon'||id.startsWith('commander-'),nominal=(boss?75:43)*.91,base=nominal*width/600*1.05,actual=p.enemySize(d,nominal,width,a,boss);if(!boss)assert(Math.abs(actual/base-1.35)<1e-8,id);else assert(actual<=base*1.12+1e-8,id);}
});
