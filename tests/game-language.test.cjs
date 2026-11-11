'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
function setup(saved,fail=false){const store=new Map([['wallet','unchanged']]);if(saved!==undefined)store.set('after-hours-language-v1',saved);let handler;const sb={window:{addEventListener:(name,fn)=>{if(name==='storage')handler=fn}},document:{documentElement:{}},GameStorage:{getItem:k=>store.get(k),setItem:(k,v)=>{if(fail)throw Error('blocked');store.set(k,v)}},GMTest:{enabled:false,fresh:false}};vm.runInNewContext(fs.readFileSync('game-language.js','utf8'),sb);return {lang:sb.window.GameLanguage,store,sb,event:e=>handler(e)};}
test('language preference restores only supported values and changes no game saves',()=>{
 for(const value of [undefined,'invalid','EN','null']){const b=setup(value);assert.equal(b.lang.current,'ko');assert.equal(b.sb.document.documentElement.lang,'ko')}
 const b=setup('en');assert.equal(b.lang.current,'en');assert.equal(b.lang.t(' 당직 준비 '),' Prepare shift ');assert.equal(b.lang.t('untranslated story'),'untranslated story');assert(!b.lang.set('ja'));assert(b.lang.set('ko'));assert.equal(b.store.get(b.lang.key),'ko');assert.equal(b.store.get('wallet'),'unchanged');assert.equal(b.store.size,2);
});
test('failed persistence keeps previous locale and valid cross-tab preferences notify without writing',()=>{
 const b=setup(undefined,true);assert.equal(b.lang.set('en'),false);assert.equal(b.lang.current,'ko');let calls=0;b.lang.subscribe(()=>calls++);b.event({key:b.lang.key,newValue:'en'});assert.equal(b.lang.current,'en');assert.equal(calls,1);assert.equal(b.store.has(b.lang.key),false);b.event({key:b.lang.key,newValue:'xx'});assert.equal(calls,1);b.sb.GMTest.fresh=true;b.event({key:b.lang.key,newValue:'ko'});assert.equal(b.lang.current,'en');
});
