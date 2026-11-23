'use strict';
// Presentation only: never changes hit boxes, speed, damage, RNG or saved state.
window.BattleImpact=(()=>{
 const en=()=>document.documentElement?.lang?.startsWith('en');
 function formKey(u){const base=kinds[u.type]?.file;return u.pip>=5&&Motion.sheets['rank5-'+base]?'rank5-'+base:base}
 function staffKey(u){const base=kinds[u.type]?.file,key=formKey(u);if(key===base)return base;const image=Motion.preload(key);return image?.complete&&image.naturalWidth?key:base}
 function polygon(c,x,y,r,points=9,inner=.66,angle=0){c.beginPath();for(let i=0;i<points*2;i++){const a=angle+i*Math.PI/points,d=i%2?r*inner:r;const px=x+Math.cos(a)*d,py=y+Math.sin(a)*d;i?c.lineTo(px,py):c.moveTo(px,py)}c.closePath()}
 function puff(c,x,y,r,color){c.fillStyle=color;c.beginPath();for(let i=0;i<5;i++){const a=i*Math.PI*2/5;c.moveTo(x+Math.cos(a)*r*.55+r*.52,y+Math.sin(a)*r*.4);c.arc(x+Math.cos(a)*r*.55,y+Math.sin(a)*r*.4,r*.52,0,Math.PI*2)}c.fill()}
 function glyph(c,x,y,r,color,type){
  c.save();c.translate(x,y);c.strokeStyle='#10254b';c.lineWidth=1.5;c.fillStyle=color;
  if([3,5,12,16].includes(type)){c.beginPath();c.roundRect(-r,-r*.65,r*2,r*1.3,1);c.fill();c.stroke();if(type!==12){c.beginPath();c.moveTo(-r,-r*.65);c.lineTo(0,r*.2);c.lineTo(r,-r*.65);c.stroke()}}
  else if(type===2||type===7){c.beginPath();c.arc(0,0,r,0,Math.PI*2);c.fill();c.stroke();c.fillStyle='#fff8e3';c.beginPath();c.arc(-r*.25,-r*.25,r*.3,0,Math.PI*2);c.fill()}
  else if(type===4){c.beginPath();c.moveTo(r*.2,-r*1.4);c.lineTo(-r*.8,r*.1);c.lineTo(-r*.1,r*.1);c.lineTo(-r*.3,r*1.3);c.lineTo(r*.9,-r*.2);c.lineTo(r*.15,-r*.2);c.closePath();c.fill();c.stroke()}
  else if(type===10){c.beginPath();c.arc(0,0,r,Math.PI*.25,Math.PI*1.75);c.quadraticCurveTo(-r*.5,0,r*.7,r*.7);c.fill();c.stroke()}
  else{const points=type===1||type===13?8:type===0||type===15?4:type===6?6:type===9?7:5;polygon(c,0,0,r,points,type===15?.22:type===1||type===13?.75:.45,Math.PI/2);c.fill();c.stroke()}
  c.restore();
 }

 const nativeBurst=burst;
 burst=function(effect,x,y,color,duration=.65,extra={}){
  if(['arrival','promotion','mergeFail','staffExit','defeat'].includes(effect)){
   if(fx.length>=480)return;
   if(extra.staffType===undefined){const i=cells.findIndex(c=>Math.abs(c.x-x)<2&&Math.abs(c.y-y)<2);const u=board[i];if(u)extra={...extra,staffType:u.type,sprite:kinds[u.type].file,pip:extra.pip??u.pip};}
   duration=effect==='arrival'?.55:effect==='promotion'?.8:effect==='defeat'?.48:duration;
  }
  return nativeBurst(effect,x,y,color,duration,extra);
 };
 const nativeEffect=drawMotionEffect;
 drawMotionEffect=function(f,t){
  if(!['arrival','promotion','mergeFail','staffExit','defeat'].includes(f.effect))return nativeEffect(f,t);
  const calm=!!reduce?.matches,low=GamePerformance.lowPower,c=ctx,x=f.x,y=f.y,p=calm?.35:t,color=f.color||'#ffd66b',n=calm?0:low?3:6;
  c.save();c.globalAlpha=calm?.6:Math.min(1,(1-p)*1.5);
  if(f.effect==='arrival'||f.effect==='promotion'){
   const strong=f.effect==='promotion',r=strong?18+p*34:14+p*24;
   c.fillStyle=strong?'#ffe59844':color+'44';c.strokeStyle=strong?'#ffc83d':color;c.lineWidth=strong?3:2;
   c.beginPath();c.ellipse(x,y+14,r,r*.3,0,0,Math.PI*2);c.fill();c.stroke();
   if(!calm&&p<.32){c.globalAlpha=(1-p/.32)*.55;c.fillStyle='#fff5c7';polygon(c,x,y-14,30+Math.sin(p/.32*Math.PI)*15,9,.66,-.12);c.fill();c.globalAlpha=1-p;}
   for(let i=0;i<n;i++){const a=i*Math.PI*2/n+.3,spread=(strong?18:12)+p*(strong?36:25);glyph(c,x+Math.cos(a)*spread,y-12+Math.sin(a)*spread*.6-p*12,strong?5:3.5,i%2?color:'#ffe07b',f.staffType)}
   if(strong){c.textAlign='center';c.font='900 19px system-ui';c.strokeStyle='#10254b';c.lineWidth=4;c.fillStyle='#ffe668';const text='★'+f.pip;c.strokeText(text,x,y-54-p*10);c.fillText(text,x,y-54-p*10)}
  }else{
   const failed=f.effect==='mergeFail',exit=f.effect==='staffExit';
   if(f.sprite){const u=f.staffType===undefined?null:{type:f.staffType,pip:f.pip||1},key=u?staffKey(u):f.sprite;
    Motion.draw(c,key,x+(calm?0:Math.sin(p*Math.PI)*(failed?11:6)),y+15-(calm?0:Math.sin(p*Math.PI)*18),f.size||72,5,{alpha:1-p,angle:calm?0:(failed?-1:1)*p*.48,scaleX:1-p*.16,scaleY:1-p*.2,staff:u||undefined});
   }
   if(p>.12||calm){const count=calm?1:low?2:4;for(let i=0;i<count;i++){const a=i*Math.PI*2/count;const spread=10+p*22;puff(c,x+Math.cos(a)*spread,y-7+Math.sin(a)*spread*.5,(failed?11:8)*(1-p*.4),i%2?'#f9f1df':failed?'#d8c1e9':'#cce9f3')}}
   for(let i=0;i<n;i++){const a=i*Math.PI*2/n;glyph(c,x+Math.cos(a)*(15+p*28),y-15+Math.sin(a)*(10+p*24),failed?4:3,i%2?color:'#ffe28e',f.staffType)}
   if(failed){c.font='900 15px system-ui';c.textAlign='center';c.fillStyle='#fff5dc';c.strokeStyle='#683d66';c.lineWidth=4;const text=en()?'OOPS!':'앗!';c.strokeText(text,x,y-52-p*8);c.fillText(text,x,y-52-p*8)}
  }
  c.restore();return true;
 };
 if(typeof document.createElement==='function'){
  const node=document.querySelector('#boss-warning'),stage=document.querySelector('.board-stage'),battle=document.querySelector('#battle');
  if(node&&stage){
   stage.append(node);node.classList.add('comic-boss-warning');const art=document.createElement('img');art.className='comic-boss-portrait';art.alt='';art.decoding='async';node.prepend(art);
   const names={leon:'Commander Leon',aegis:'Commander Aegis',ruby:'Crimson Knight Ruby',lumen:'Choir Captain Lumen',neve:'Frost Witch Neve',mira:'Illusionist Mira',chrono:'Clockwork Knight Chrono'};
   function paintWarning(){if(!bossWarning)return;const b=bossCatalog.find(x=>x.id===bossWarning.id);if(!b)return;const source=Motion.sheets[b.file]?.fallback;if(source&&art.getAttribute('src')!==source)art.src=source;
    uiText(document.querySelector('#boss-warning-label'),en()?'BOSS WAVE '+bossWarning.wave:'WAVE '+bossWarning.wave+' · 군단장');
    uiText(document.querySelector('#boss-warning-name'),en()?names[b.id]:b.name);
    uiText(document.querySelector('#boss-warning-detail'),en()?'Incoming! Get your skills ready.':'등장! 스킬을 준비하세요.');
    uiAttr(node,'data-phase',bossWarning.left<.4?'out':'in');uiAttr(battle,'data-boss-cue',node.hidden?'false':'true');
   }
   const nativeWarning=showBossWarning;showBossWarning=function(w){nativeWarning(w);paintWarning()};
   const nativeTick=tickBossWarning;tickBossWarning=function(dt){nativeTick(dt);if(bossWarning)uiAttr(node,'data-phase',bossWarning.left<.4?'out':'in');uiAttr(battle,'data-boss-cue',bossWarning&&!node.hidden?'true':'false')};
   window.GameLanguage?.subscribe(paintWarning);
  }
  const notice=document.querySelector('#message');
  if(notice&&typeof MutationObserver==='function'){let text=notice.textContent,animation;new MutationObserver(()=>{if(notice.textContent===text)return;text=notice.textContent;if(reduce?.matches||GamePerformance.lowPower)return;animation?.cancel();animation=notice.animate?.([{opacity:.55,translate:'0 3px'},{opacity:1,translate:'0 0'}],{duration:150,easing:'ease-out'});}).observe(notice,{childList:true,characterData:true,subtree:true});}
 }
 window.GamePerformance?.invalidate();
 return Object.freeze({formKey,staffKey});
})();
