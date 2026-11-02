const test=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs');
test('fresh sessions ignore existing saves and never modify persistent storage',()=>{
 const saved=new Map([['after-hours-defense-v1','original'],['after-hours-active-run-v1','active']]);
 const c=vm.createContext({window:{location:{search:'?fresh=1&gm=1'}},URLSearchParams,localStorage:{getItem:k=>saved.get(k)??null,setItem:(k,v)=>saved.set(k,v),removeItem:k=>saved.delete(k)}});
 vm.runInContext(fs.readFileSync('gm-mode.js','utf8'),c);
 assert.equal(vm.runInContext('GMTest.enabled',c),false);
 assert.equal(vm.runInContext("GameStorage.getItem('after-hours-defense-v1')",c),null);
 vm.runInContext("GameStorage.setItem('after-hours-defense-v1','practice');GameStorage.removeItem('after-hours-active-run-v1')",c);
 assert.equal(vm.runInContext("GameStorage.getItem('after-hours-defense-v1')",c),'practice');
 assert.equal(saved.get('after-hours-defense-v1'),'original');assert.equal(saved.get('after-hours-active-run-v1'),'active');
});
