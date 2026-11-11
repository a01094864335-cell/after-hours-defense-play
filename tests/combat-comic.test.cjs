'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),crypto=require('node:crypto');
const m=JSON.parse(fs.readFileSync('assets/combat-comic/manifest.json')).characters;
test('all non-staff combat actors have six bounded comic poses, hashed atlases and matching idle fallbacks',()=>{
 assert.equal(Object.keys(m).length,20);assert.equal(Object.values(m).filter(v=>v.group==='enemy').length,12);assert.equal(Object.values(m).filter(v=>v.group==='merc').length,7);assert.equal(Object.values(m).filter(v=>v.group==='king').length,1);
 for(const[id,a]of Object.entries(m)){
  assert.equal(a.artStyle,'main-comic',id);assert.equal(a.frames.length,6,id);assert(fs.existsSync(a.fallback));assert.equal(crypto.createHash('sha256').update(fs.readFileSync(a.file)).digest('hex'),a.sha256);
  for(const f of a.frames){assert(f.w>0&&f.h>0&&f.x>=2&&f.y>=2&&f.x+f.w<=a.width-2&&f.y+f.h<=a.sheetHeight-2,id);assert(f.pivotX>=0&&f.pivotX<=f.w&&f.pivotY>=0&&f.pivotY<f.h,id);}
 }
 const sizes=JSON.parse(fs.readFileSync('qa/combat-style-20261111/asset-measurements.json'));assert(sizes.reduce((s,x)=>s+x.decodedBytes,0)<sizes.reduce((s,x)=>s+x.oldDecodedBytes,0)*.5);assert(sizes.reduce((s,x)=>s+x.atlasBytes,0)<sizes.reduce((s,x)=>s+x.oldAtlasBytes,0));
});
test('comic actor registry overrides legacy art before engine and leaves staff registry intact',()=>{
 const box={window:{}};vm.createContext(box);for(const f of ['assets/motion/manifest.js','assets/bosses/manifest.js','assets/expansion-v2/manifest.js','assets/character-motion/manifest.js','assets/combat-comic/manifest.js'])vm.runInContext(fs.readFileSync(f,'utf8'),box);
 for(const id of box.window.CombatComic.ids){assert.equal(vm.runInContext(`MotionSheets[${JSON.stringify(id)}].file`,box),m[id].file);assert.equal(box.window.CombatComic.imagePath(id),m[id].fallback)}
 assert.equal(vm.runInContext("MotionSheets.gobi.file",box),'assets/character-motion/gobi.webp');assert.equal(box.window.CombatComic.has('unknown'),false);
 const html=fs.readFileSync('index.html','utf8');assert(html.indexOf('assets/combat-comic/manifest.js')<html.indexOf('src="motion.js'));assert(html.indexOf('assets/character-motion/manifest.js')<html.indexOf('assets/combat-comic/manifest.js'));
});
