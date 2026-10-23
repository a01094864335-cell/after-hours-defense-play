'use strict';
// Only the storage adapter touches the real save. GM writes stay in this tab's memory.
const GMTest=(()=>{
 const limit=1000000000,defaultCoins=100000;
 const parseCoins=value=>typeof value==='string'&&/^(0|[1-9]\d*)$/.test(value)&&Number.isSafeInteger(Number(value))&&Number(value)<=limit?Number(value):null;
 let enabled=false,initialCoins=defaultCoins,notice='';
 try{const search=typeof window!=='undefined'?window.location?.search:'';if(search&&typeof URLSearchParams!=='undefined'){const params=new URLSearchParams(search);enabled=params.get('gm')==='1';if(enabled&&params.has('coins')){const value=params.getAll('coins').length===1?parseCoins(params.get('coins')):null;if(value===null)notice='coins는 0~1,000,000,000 사이 정수여야 해요. 기본 100,000코인으로 시작했어요.';else initialCoins=value}}}catch(e){/* Missing browser location keeps normal mode unchanged. */}
 return Object.freeze({enabled,initialCoins,notice,limit,parseCoins});
})();
const GameStorage=(()=>{
 const memory=new Map();
 return Object.freeze({
  getItem(key){
   if(!GMTest.enabled)return localStorage.getItem(key);
   if(memory.has(key))return memory.get(key);
   // A normal run must never become a GM run by accidentally resuming it.
   if((key==='after-hours-active-run-v1'||key==='after-hours-defense-pending-v1')){memory.set(key,null);return null}
   let value=null;try{value=localStorage.getItem(key)}catch(e){}
   if(key==='after-hours-defense-v1'&&value!==null){try{const copy=JSON.parse(value);if(copy&&typeof copy==='object'&&!Array.isArray(copy)){copy.coins=GMTest.initialCoins;value=JSON.stringify(copy)}}catch(e){/* Let the game's existing save validator report malformed saves. */}}
   memory.set(key,value);return value;
  },
  setItem(key,value){if(GMTest.enabled)memory.set(key,String(value));else localStorage.setItem(key,value)},
  removeItem(key){if(GMTest.enabled)memory.set(key,null);else localStorage.removeItem(key)}
 });
})();
