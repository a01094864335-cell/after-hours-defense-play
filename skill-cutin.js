'use strict';
// Presentation only: combat resolves immediately, independently of this real-time queue.
const SkillCutin = (() => {
 const pending=[],fallbacks=new Map(),layouts=new Map(),seen=new Set();
 let current=null,age=0,duration=1.15,root=null,art=null,artContext=null,caption=null,shout=null,badge=null,chain=null,live=null;
 const reduced=window.matchMedia?.('(prefers-reduced-motion: reduce)');
 function context(){
  if(typeof playing==='undefined'||!playing||ended||(typeof appScreen!=='undefined'&&appScreen!=='battle'))return 'clear';
  if(['entrance','afterglow'].includes(kingEvent.state))return 'clear';
  if(paused||document.hidden||document.querySelector('dialog[open]')?.open)return 'hold';
  return 'show';
 }
 function mount(){
  if(root||!document.createElement)return;
  const host=document.querySelector('#app-shell');if(!host?.append)return;
  root=document.createElement('section');root.id='skill-cutin';root.hidden=true;root.setAttribute('aria-hidden','true');
  root.innerHTML='<div class="cutin-dim"></div><div class="cutin-rays"></div><div class="cutin-band"></div><div class="cutin-stage"><span class="cutin-badge"></span><div class="cutin-art"><canvas width="520" height="440"></canvas></div><div class="cutin-copy"><span class="cutin-caster"></span><strong class="cutin-shout"></strong><span class="cutin-chain"></span></div></div>';
  host.append(root);art=root.querySelector('canvas');artContext=art.getContext('2d');caption=root.querySelector('.cutin-caster');shout=root.querySelector('.cutin-shout');badge=root.querySelector('.cutin-badge');chain=root.querySelector('.cutin-chain');
  live=document.createElement('span');live.className='cutin-announcement';live.setAttribute('role','status');live.setAttribute('aria-live','polite');live.setAttribute('aria-atomic','true');host.append(live);
 }
 function clear(resetHistory=false){if(resetHistory)seen.clear();pending.length=0;current=null;age=0;if(root)root.hidden=true;if(live)live.textContent='';}
 function syncVisibility(){const state=context();if(state==='clear')clear();else if(root){root.hidden=state!=='show'||!current;root.dataset.suppressed=String(!!document.querySelector('#boss-warning')&&!document.querySelector('#boss-warning').hidden||enemies.some(e=>e.hp>0&&e.warning>0));}return state;}
 function announce(){
  if(!root||!current)return;
  root.dataset.side=current.side;root.dataset.compact=String(current.compact);seen.add(current.key);root.style.setProperty('--cutin-color',current.color);
  badge.textContent=current.side==='enemy'?'군단장 고유 스킬':'직원 고유 스킬';
  caption.textContent=current.name;shout.textContent='“'+current.skill+'!”';
  chain.textContent=current.count>1?'동시 발동 ×'+current.count:'';
  live.textContent=current.name+', '+current.skill+'!'+(current.count>1?' '+current.count+'명 발동':'');
 }
 function enqueue(event){
  if(context()==='clear'||!Motion.sheets[event.file])return false;
  const key=event.side+':'+event.file;
  // Several identical staff can cast at once. Keep a count instead of stacking identical scenes.
  const existing=current?.key===key&&age<.18?current:pending.find(e=>e.key===key);
  if(existing){existing.count++;if(existing===current)announce();return true;}
  const item={...event,key,count:1,compact:meta.profile.compactFX||seen.has(key)};
  // At most one waiting entry per identity (17 staff + 7 commanders).
  if(pending.length>=24)return false;
  if(item.side==='enemy'){const firstStaff=pending.findIndex(e=>e.side==='ally');pending.splice(firstStaff<0?pending.length:firstStaff,0,item);}else pending.push(item);
  Motion.preload(item.file);GamePerformance.invalidate();return true;
 }
 function staff(unit){
  const k=kinds[unit.type],record=typeof staffRecords==='undefined'?null:staffRecords.find(r=>r.id===k.file);
  return enqueue({side:'ally',file:k.file,name:record?.name||k.name,skill:skillNames[unit.type],color:k.color,object:expansionObject(unit.type)});
 }
 function boss(enemy){
  if(enemy.decoy||enemy.hp<=0||enemy.escaped)return false;
  const b=bossDefinition(enemy);
  return enqueue({side:'enemy',file:b.file,name:b.name,skill:b.skillName,color:b.color,object:b.id});
 }
 function tick(elapsed){
  if(syncVisibility()!=='show')return;
  if(current){age+=Math.min(.1,Math.max(0,elapsed));if(age>=duration){current=null;age=0;}}
  if(!current&&pending.length){current=pending.shift();age=0;duration=current.compact?.6:.85;mount();announce();}
  if(root)root.hidden=!current;
 }
 function fallback(key){
  if(!fallbacks.has(key)){
   const im=new Image();im.addEventListener?.('load',()=>GamePerformance.invalidate());im.src=Motion.sheets[key].fallback;fallbacks.set(key,im);
  }
  return fallbacks.get(key);
 }
 function portraitLayout(key){
  if(!layouts.has(key)){
   const data=Motion.sheets[key],left=Math.max(...data.frames.map(f=>f.pivotX)),right=Math.max(...data.frames.map(f=>f.w-f.pivotX));
   const above=Math.max(...data.frames.map(f=>f.pivotY)),below=Math.max(...data.frames.map(f=>f.h-f.pivotY));
   const scale=Math.min(335/data.height,400/(left+right),370/(above+below));
   // Include trailing capes/tails beneath the feet. One fit for all poses avoids size jumps.
   layouts.set(key,{x:260+(left-right)*scale/2,y:410-below*scale,height:scale*data.height});
  }
  return layouts.get(key);
 }
 function emblem(c,id,x,y,size){
  c.save();c.translate(x,y);c.scale(size,size);c.lineWidth=2;c.strokeStyle=current.color;c.fillStyle=current.color;
  if(id==='aegis'){
   c.beginPath();c.moveTo(0,-13);c.lineTo(11,-7);c.lineTo(9,6);c.lineTo(0,14);c.lineTo(-9,6);c.lineTo(-11,-7);c.closePath();c.stroke();c.fillRect(-1,-7,2,14);
  }else if(id==='ruby'){
   c.beginPath();c.moveTo(0,-15);c.lineTo(4,-3);c.lineTo(9,-7);c.lineTo(11,7);c.lineTo(0,14);c.lineTo(-10,7);c.lineTo(-8,-4);c.lineTo(-3,1);c.closePath();c.fill();
  }else if(id==='neve'){
   for(let i=0;i<6;i++){c.rotate(Math.PI/3);c.beginPath();c.moveTo(0,0);c.lineTo(0,-14);c.moveTo(-4,-6);c.lineTo(0,-10);c.lineTo(4,-6);c.stroke();}
  }else if(id==='chrono'){
   c.beginPath();c.arc(0,0,12,0,Math.PI*2);c.stroke();c.beginPath();c.moveTo(0,-8);c.lineTo(0,0);c.lineTo(6,3);c.stroke();
  }else if(id==='mira'){
   for(const dx of [-7,7]){c.beginPath();c.ellipse(dx,0,7,12,0,0,Math.PI*2);c.stroke();}
  }else if(id==='leon'){
   c.fillRect(-9,-14,2,29);c.beginPath();c.moveTo(-7,-13);c.lineTo(12,-10);c.lineTo(7,-4);c.lineTo(12,1);c.lineTo(-7,-2);c.closePath();c.fill();
  }else{
   c.fillRect(-2,-14,4,28);c.fillRect(-10,-5,20,4);c.beginPath();c.arc(0,0,17,0,Math.PI*2);c.stroke();
  }
  c.restore();
 }
 function render(){
  if(!current||!root||root.hidden||!artContext)return;
  const calm=!!reduced?.matches,p=age/duration,enter=Math.min(1,age/.16),exit=Math.min(1,(duration-age)/.2);
  root.style.opacity=String(Math.min(enter,exit));
  root.style.setProperty('--cutin-scale',String(calm?1:.88+.12*(1-(1-enter)**3)));
  root.style.setProperty('--cutin-slide',(calm?0:(1-enter)*35*(current.side==='enemy'?1:-1))+'px');
  root.style.setProperty('--cutin-ray-turn',(calm?0:p*8)+'deg');
  const c=artContext;c.clearRect(0,0,520,440);
  const pulse=calm?0:Math.sin(p*Math.PI),radius=155+pulse*20;
  c.save();c.globalAlpha=.45;c.strokeStyle=current.color;c.lineWidth=2;c.beginPath();c.ellipse(260,251,radius,radius*.75,0,0,Math.PI*2);c.stroke();c.restore();
  for(let i=0;i<6;i++){
   const angle=i*Math.PI/3+(calm?0:p*.32),x=260+Math.cos(angle)*188,y=246+Math.sin(angle)*145;
   c.save();c.globalAlpha=.55+pulse*.2;
   if(current.side==='ally')drawObject(current.object,x,y,current.color,1.15+(calm?0:pulse*.18),calm?0:Math.sin(angle)*.15,c);
   else emblem(c,current.object,x,y,1.2);
   c.restore();
  }
  const pose=Motion.frame('skill',age,duration),fit=portraitLayout(current.file);
  if(!Motion.draw(c,current.file,fit.x,fit.y,fit.height,pose)){
   const im=fallback(current.file);
   if(im.complete&&im.naturalWidth&&im.naturalHeight){const s=Math.min(360/im.naturalWidth,335/im.naturalHeight);c.drawImage(im,260-im.naturalWidth*s/2,410-im.naturalHeight*s,im.naturalWidth*s,im.naturalHeight*s);}
  }
 }
 document.addEventListener('visibilitychange',()=>{if(document.hidden&&root)root.hidden=true;});
 return {staff,boss,tick,render,clear,syncVisibility,
  // A read-only snapshot makes queue/lifecycle regressions observable without exposing game state.
  snapshot:()=>({current:current?{...current}:null,pending:pending.map(e=>({...e})),age,duration,visible:!!root&&!root.hidden})};
})();
