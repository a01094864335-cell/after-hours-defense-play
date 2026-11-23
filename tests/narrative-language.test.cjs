'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),boot=require('./runtime-boot.cjs');
test('English draft covers every current narrative and preserves source data and numeric rules',()=>{
 const b=boot(),before=b.run('JSON.stringify({CastleStories,HIRING_STORIES:window.HIRING_STORIES,staffRecords,meta,board,sp,cost})');
 b.run("GameLanguage.set('en')");
 const missing=b.run(`(()=>{
  const missing=[],check=(text,where)=>{if(typeof text!=='string'||!text.trim())return;const en=GameLanguage.t(text);if(/[가-힣]/.test(en))missing.push(where+': '+text)};
  for(const s of CastleStories){check(s.title,s.id);check(s.tag,s.id);for(const p of s.panels||[])for(const v of p.slice(0,4))check(v,s.id)}
  for(const p of promoLines)for(const k of ['title','speaker','line','aside'])check(p[k],'intro');
  for(const s of window.HIRING_STORIES){check(s.title,s.id);for(const p of s.panels)check(p.dialogue,s.id)}
  for(const r of staffRecords)for(const k of ['name','job','dept','story','quote','traits','role','ability','skill','skillText'])check(r[k],r.id+'/'+k);
  return missing;
 })()`);
 assert.deepEqual(Array.from(missing),[]);
 const mismatches=b.run(`(()=>{const digits=s=>(s.match(/\\d+(?:\\.\\d+)?/g)||[]).sort().join('|'),errors=[];for(const r of staffRecords)for(const k of ['ability','skillText'])if(digits(r[k])!==digits(GameLanguage.t(r[k])))errors.push(r.id+'/'+k+': '+r[k]+' => '+GameLanguage.t(r[k]));return errors})()`);
 assert.deepEqual(Array.from(mismatches),[],'English must preserve every ability number');
 b.run("GameLanguage.set('ko')");
 assert.equal(b.run('JSON.stringify({CastleStories,HIRING_STORIES:window.HIRING_STORIES,staffRecords,meta,board,sp,cost})'),before);
});
