'use strict';
// Rendering policy is independent of game speed and of the combat save format.
window.GamePerformance=(()=>{
 const mobile=matchMedia('(pointer: coarse), (max-width: 600px)');
 let explicit=null;try{const value=localStorage.getItem('after-hours-power-save-v1');if(value==='on'||value==='off')explicit=value==='on'}catch{}
 let lowPower=explicit??mobile.matches,callback=null,timer=null,raf=null,inFrame=false;
 let dirty=true,uiDirty=true,lastUI=-Infinity,lastDraw=-Infinity,accumulator=0;
 const stats={draws:0,updates:0,uiFlushes:0,backgroundBuilds:0,portraitDraws:0};
 function cancel(){if(timer!==null)clearTimeout(timer);if(raf!==null)cancelAnimationFrame(raf);timer=raf=null}
 function schedule(next,delay=0){callback=next;if(document.hidden||timer!==null||raf!==null||!callback)return;timer=setTimeout(()=>{timer=null;raf=requestAnimationFrame(now=>{raf=null;callback(now)})},Math.max(0,delay))}
 function invalidate(){dirty=true;if(!inFrame)schedule(callback)}
 function requestUI(){uiDirty=true;if(!inFrame)schedule(callback)}
 function applyMode(){document.documentElement.classList.toggle('power-save',lowPower);if(typeof Motion!=='undefined')Motion.invalidate();invalidate();document.dispatchEvent(new Event('power-mode-change'))}
 function setMode(value){explicit=lowPower=!!value;try{localStorage.setItem('after-hours-power-save-v1',lowPower?'on':'off')}catch{}applyMode()}
 mobile.addEventListener('change',()=>{if(explicit===null){lowPower=mobile.matches;applyMode()}});
 document.addEventListener('visibilitychange',()=>{cancel();accumulator=0;if(typeof last!=='undefined')last=0;if(!document.hidden){dirty=uiDirty=true;schedule(callback)}});
 document.addEventListener('load',invalidate,true);
 for(const event of ['click','change','pointermove','keydown'])document.addEventListener(event,invalidate,{passive:true});
 addEventListener('resize',invalidate);
 document.documentElement.classList.toggle('power-save',lowPower);
 return {stats,get lowPower(){return lowPower},get fps(){return lowPower?30:60},get dirty(){return dirty},boardWidth:600,
  setMode,invalidate,requestUI,schedule,begin(){inFrame=true},resetSimulation(){accumulator=0},
  advance(elapsed,speed,tick){accumulator+=Math.min(.1,Math.max(0,elapsed));let count=0;while(accumulator+1e-9>=1/60&&count<6){accumulator-=1/60;count++;stats.updates++;if(tick(speed/60)===false){accumulator=0;break}}return count},
  flushUI(now,flush){if(uiDirty&&now-lastUI>=100){uiDirty=false;lastUI=now;stats.uiFlushes++;flush()}},
  settled(){dirty=false},
  shouldDraw(now){return now-lastDraw>=1000/(lowPower?30:60)-3},drawn(now){lastDraw=now;dirty=false;stats.draws++},
  finish(next,now,active,animatedUI){inFrame=false;callback=next;if(document.hidden)return;
   if(active||dirty)schedule(next,Math.max(1,lastDraw+1000/(lowPower?30:60)-performance.now()-8));
   else if(uiDirty)schedule(next,Math.max(1,100-(now-lastUI)));
   else if(animatedUI)schedule(next,80);
  }
 };
})();
