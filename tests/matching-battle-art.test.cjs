'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),crypto=require('node:crypto');
test('All 17 staff battle sheets preserve six bounded poses and current face references',()=>{
 const m=JSON.parse(fs.readFileSync('assets/character-motion/manifest.json'));
 const staff=JSON.parse(fs.readFileSync('assets/character-portraits/manifest.json')).characters.filter(r=>r.group!=='merc').map(r=>r.id);assert.equal(staff.length,17);assert.deepEqual(Object.keys(m.characters),staff);
 assert.deepEqual(m.poses,['idle','blink','anticipation','attack','skill','recovery']);
 for(const[id,r]of Object.entries(m.characters)){
  assert.equal(r.artStyle,'main-comic');assert.equal(r.frames.length,6);assert.equal(r.faceReference,'assets/character-portraits/'+id+'.webp');
  assert(fs.existsSync(r.faceReference));assert(fs.existsSync(r.fallback));
  assert.equal(crypto.createHash('sha256').update(fs.readFileSync(r.file)).digest('hex'),r.sha256);
  for(const f of r.frames){assert(f.w>0&&f.h>0);assert(f.x>=0&&f.y>=0);assert(f.x+f.w<=r.width);assert(f.y+f.h<=r.sheetHeight);assert(f.pivotX>=0&&f.pivotX<=f.w);assert(f.pivotY>=0&&f.pivotY<f.h);}
 }
});
test('matching battle manifest replaces legacy sheets and supplies matching load fallbacks',()=>{
 const sandbox={window:{},MotionSheets:{gobi:{file:'legacy-bald-gobi'},'electric-technician':{file:'legacy-lizard'}}};vm.createContext(sandbox);
 vm.runInContext(fs.readFileSync('assets/character-motion/manifest.js','utf8'),sandbox);
 for(const id of sandbox.window.CharacterMotion.ids){
  assert(sandbox.window.CharacterMotion.has(id));assert.equal(sandbox.MotionSheets[id].file,'assets/character-motion/'+id+'.webp');
  assert.equal(sandbox.window.CharacterMotion.imagePath(id),'assets/character-motion/'+id+'-idle.webp');
 }
 assert.equal(sandbox.window.CharacterMotion.has('unknown'),false);
});

test('packed battle art stays within mobile memory and transfer budgets without frame bleed',()=>{
 const m=JSON.parse(fs.readFileSync('assets/character-motion/manifest.json'));
 assert.equal(m.export.gutter,2);
 let bytes=0,pixels=0;
 for(const r of Object.values(m.characters)){
  bytes+=fs.statSync(r.file).size+fs.statSync(r.fallback).size;pixels+=r.width*r.sheetHeight;
  for(let i=0;i<r.frames.length;i++){
   const a=r.frames[i];assert(a.x>=2&&a.y>=2);assert(a.x+a.w<=r.width-2);assert(a.y+a.h<=r.sheetHeight-2);
   for(const b of r.frames.slice(i+1))assert(a.x+a.w+2<=b.x||b.x+b.w+2<=a.x||a.y+a.h+2<=b.y||b.y+b.h+2<=a.y,'overlapping atlas samples');
  }
 }
 assert(bytes<5*1024*1024);assert(pixels*4<45*1024*1024);
 const font=fs.readFileSync('previews/asset-lobby-20261109/assets/BlackHanSans-Regular.woff2');assert.equal(font.subarray(0,4).toString(),'wOF2');assert(font.length<220000);
 for(const id of ['grade','kind','king'])assert(fs.statSync('assets/mobile/item-'+id+'.webp').size<30000);
});

test('changed atlas layouts request a checksum version so cached old frames cannot mix',()=>{
 const b=require('./runtime-boot.cjs')('');
 const hash=b.run("Motion.sheets.gobi.sha256.slice(0,12)");
 assert.equal(b.run("Motion.preload('gobi').path"),'assets/character-motion/gobi.webp?v='+hash);
});
