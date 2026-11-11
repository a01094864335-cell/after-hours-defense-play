'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const characters=JSON.parse(fs.readFileSync('assets/character-motion/manifest.json')).characters;
function presentation(){const box={window:{},document:{}};vm.runInNewContext(fs.readFileSync('battle-presentation.js','utf8'),box);return box.window.BattlePresentation}
test('all 102 staff poses fit around their actual pivot at a stable silhouette scale',()=>{
 const p=presentation();
 for(const[row,cell]of [[84,59],[65,48],[110,90],[14,45]])for(const[id,data]of Object.entries(characters)){
  const scale=p.staffSize(data,row,cell)/data.height;
  assert(Number.isFinite(scale)&&scale>0,id);
  for(const f of data.frames){
   assert(f.pivotX*scale<=(cell-7)/2+1e-8,id+' left');
   assert((f.w-f.pivotX)*scale<=(cell-7)/2+1e-8,id+' right');
   assert(f.h*scale<=Math.max(1,row-13)+1e-8,id+' height');
  }
 }
});
test('wide and rounded bodies keep proportions instead of being stretched to humanoid height',()=>{
 const p=presentation(),f=(w,h)=>({height:h,frames:Array.from({length:6},()=>({w,h,pivotX:w/2,pivotY:h-1}))});
 const tall=f(200,350),round=f(300,240),a=p.staffSize(tall,120,100)/tall.height,b=p.staffSize(round,120,100)/round.height;
 assert(Math.abs(Math.sqrt(200*350)*a-Math.sqrt(300*240)*b)<1e-8);
 assert(240*b<350*a);
});
test('Gobi stays at the reviewed 12 percent smaller board scale without changing its art',()=>{
 const p=presentation(),gobi=characters.gobi,unadjusted={...gobi,boardScale:1};
 assert.equal(gobi.boardScale,.88);
 for(const[row,cell]of [[84,59],[65,48],[110,90],[52,42]]){
  assert(Math.abs(p.staffSize(gobi,row,cell)/p.staffSize(unadjusted,row,cell)-.88)<1e-10);
 }
 for(const[id,data]of Object.entries(characters))if(id!=='gobi')assert.equal(data.boardScale,undefined,id);
 assert.equal(gobi.file,'assets/character-motion/gobi.webp');
});
test('missing-border defaults and explicit outlines are cached, padded and bounded',()=>{
 let creates=0,stamps=0;const calls=[];
 const context=()=>({scale(){},drawImage(){stamps++},fillRect(){}});
 const sheet={height:100,file:'x.webp',sha256:'test',frames:Array.from({length:6},()=>({x:2,y:2,w:80,h:100,pivotX:40,pivotY:99}))};
 const box={window:{},document:{createElement(){creates++;return {getContext:context}}},MotionSheets:{test:sheet,'electric-technician':sheet,'mimic-storekeeper':sheet,'spider-tailor':sheet,'chalkak-photographer':sheet},Image:class{complete=true;naturalWidth=100;addEventListener(){}},Map,Set};
 vm.runInNewContext(fs.readFileSync('motion.js','utf8')+';globalThis.motion=Motion;',box);
 const target={save(){},restore(){},translate(){},scale(){},drawImage(...args){calls.push(args)}};
 box.motion.draw(target,'test',0,0,50);assert.equal(creates,0);
 box.motion.draw(target,'test',0,0,50,0,{outline:1.25});assert.equal(creates,1);assert.equal(stamps,16);
 const edge=calls.at(-2);assert.equal(edge[1],-23);assert.equal(edge[3],46);
 box.motion.draw(target,'test',0,0,50,0,{outline:1.25,flip:true,alpha:.5});assert.equal(creates,1);
 for(let i=0;i<60;i++)box.motion.draw(target,'test',0,0,100+i,0,{outline:1.25});
 box.motion.draw(target,'test',0,0,50,0,{outline:1.25});assert.equal(creates,62,'old sizes are evicted instead of retaining every resize');
 for(const key of ['electric-technician','mimic-storekeeper','spider-tailor','chalkak-photographer']){const before=creates;box.motion.draw(target,key,0,0,240);assert.equal(creates,before+1,key+' gets a default cutin outline');assert.equal(calls.at(-2)[3],204,'240px cutin gets 4.8px radius plus padding');}
 const before=creates;box.motion.draw(target,'electric-technician',0,0,240,0,{outline:0});assert.equal(creates,before,'explicit disable is supported');
 const large=creates;for(let i=0;i<2;i++)box.motion.draw(target,'electric-technician',0,0,1400);assert.equal(creates,large+2,'oversized masks are not retained beyond the 16 MiB backing-store budget');
});
