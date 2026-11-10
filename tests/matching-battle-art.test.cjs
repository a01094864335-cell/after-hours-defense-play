'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),crypto=require('node:crypto');
test('Gobi and Jjit battle sheets preserve six bounded poses and current face references',()=>{
 const m=JSON.parse(fs.readFileSync('assets/character-motion/manifest.json'));
 assert.deepEqual(Object.keys(m.characters),['gobi','electric-technician']);
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
 for(const id of ['gobi','electric-technician']){
  assert(sandbox.window.CharacterMotion.has(id));assert.equal(sandbox.MotionSheets[id].file,'assets/character-motion/'+id+'.webp');
  assert.equal(sandbox.window.CharacterMotion.imagePath(id),'assets/character-motion/'+id+'-idle.webp');
 }
 assert.equal(sandbox.window.CharacterMotion.has('unknown'),false);
});
