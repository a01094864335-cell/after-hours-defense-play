// Browser-only policies are exercised in browser QA; logic tests use inert browser APIs.
module.exports=function(sb){
 sb.GameSession??={canWrite:()=>true};sb.GamePerformance??={invalidate(){},requestUI(){},schedule(){},begin(){},advance(dt,speed,fn){fn(dt*speed)},resetSimulation(){},flushUI(n,fn){fn()},shouldDraw:()=>true,drawn(){},settled(){},finish(){},stats:{backgroundBuilds:0,portraitDraws:0}};
 sb.matchMedia??=()=>({matches:false,addEventListener(){},addListener(){}});sb.addEventListener??=()=>{};sb.Event??=class{};sb.devicePixelRatio??=1;sb.performance??={now:()=>0};sb.setTimeout??=()=>0;sb.clearTimeout??=()=>{};sb.cancelAnimationFrame??=()=>{};
 if(sb.Image&&!sb.Image.prototype.addEventListener)sb.Image.prototype.addEventListener=function(){};
 if(sb.window)sb.window.addEventListener??=()=>{};const d=sb.document;if(!d)return;d.addEventListener??=()=>{};d.dispatchEvent??=()=>{};d.querySelectorAll??=()=>[];d.documentElement??={classList:{toggle(){},contains:()=>false}};d.documentElement.classList.contains??=()=>false;
 if(d.querySelector){const orig=d.querySelector;d.querySelector=function(...args){const e=orig.apply(this,args);if(e){e.dataset??={};if(e.style)e.style.setProperty??=function(k,v){this[k]=v};e.getAttribute??=()=>null;e.classList??={toggle(){}};e.classList.contains??=()=>false;}return e}}
 return sb;
};
