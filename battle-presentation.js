'use strict';
// D layout is a view projection. Combat, range checks and saved cells stay 600×600.
window.BattlePresentation=(()=>{
 const q=s=>document.querySelector(s),enabled=typeof document.createElement==='function';
 function axes(w,h){const small=h<360,pad=Math.min(44,w*.132),edge=Math.min(28,w*.088);return {x:[[0,82,110,490,518,600],[0,edge,pad,w-pad,w-edge,w]],y:[[0,123,202,479,567,600],[0,small?Math.min(42,h*.15):68,small?Math.min(64,h*.24):100,h-(small?Math.min(78,h*.28):108),h-(small?Math.min(14,h*.05):30),h]]}}
 function map(v,from,to){let i=0;while(i<from.length-2&&v>from[i+1])i++;return to[i]+(v-from[i])/(from[i+1]-from[i])*(to[i+1]-to[i])}
 function project(p,w,h){const a=axes(w,h);return{x:map(p.x,...a.x),y:map(p.y,...a.y)}}
 function unproject(p,w,h){const a=axes(w,h);return{x:map(p.x,a.x[1],a.x[0]),y:map(p.y,a.y[1],a.y[0])}}
 function point(e){const r=canvas.getBoundingClientRect();return unproject({x:e.clientX-r.left,y:e.clientY-r.top},r.width,r.height)}
 function screenPoint(p){const r=canvas.getBoundingClientRect(),v=project(p,r.width,r.height);return{x:r.left+v.x,y:r.top+v.y}}
 if(!enabled)return {enabled,axes,project,unproject,point,screenPoint};
 const stage=q('.board-stage'),view=document.createElement('canvas');view.id='battle-paint';view.setAttribute('aria-hidden','true');view.style.pointerEvents='none';stage.prepend(view);q('#battle').classList.add('battle-d');
 const staffKeys=new Set(kinds.map(kind=>kind.file));
 const paint=view.getContext('2d');let collecting=false,actors=[],texts=[],width=0,height=0;
 const oldMotion=Motion.draw;
 Motion.draw=function(target,key,x,y,size,pose=0,options={}){
  if(!collecting||target!==ctx)return oldMotion(target,key,x,y,size,pose,options);
  const m=ctx.getTransform();actors.push({key,x:m.a*x+m.c*y+m.e,y:m.b*x+m.d*y+m.f,size,pose,options:{...options,alpha:(options.alpha??1)*ctx.globalAlpha}});Motion.preload(key);return true;
 };
 const oldText=ctx.fillText.bind(ctx);
 ctx.fillText=function(text,x,y,maxWidth){if(!collecting)return maxWidth===undefined?oldText(text,x,y):oldText(text,x,y,maxWidth);if(text==='·'||String(text).startsWith('★ 스킬'))return;const m=ctx.getTransform();texts.push({text,x:m.a*x+m.c*y+m.e,y:m.b*x+m.d*y+m.f,font:ctx.font,fill:ctx.fillStyle,align:ctx.textAlign,alpha:ctx.globalAlpha});};
 // The native D frames replace the previous illustrated cell skins.
 if(typeof LiveUIAssets!=='undefined'){const oldCell=LiveUIAssets.cell;LiveUIAssets.cell=function(target,...args){if(target!==ctx)oldCell(target,...args)}}
 function render(){
  if(width<1||height<1)return;const a=axes(width,height),dpr=Math.min(devicePixelRatio||1,2);paint.setTransform(dpr,0,0,dpr,0,0);paint.imageSmoothingEnabled=false;paint.clearRect(0,0,width,height);
  for(let y=0;y<a.y[0].length-1;y++)for(let x=0;x<a.x[0].length-1;x++){
   const sx=a.x[0][x],sy=a.y[0][y],sw=a.x[0][x+1]-sx,sh=a.y[0][y+1]-sy,dx=a.x[1][x],dy=a.y[1][y],dw=a.x[1][x+1]-dx,dh=a.y[1][y+1]-dy;
   paint.drawImage(canvas,sx,sy,sw,sh,dx,dy,dw,dh);
  }
  const row=(a.y[1][3]-a.y[1][2])/3,cell=(a.x[1][3]-a.x[1][2])/5;
  for(const actor of actors){const p=project(actor,width,height),data=Motion.sheets[actor.key];let size=actor.size*width/600*1.12;
   if(data){const f=data.frames[Math.max(0,Math.min(5,actor.pose))];if(staffKeys.has(actor.key))size=Math.min(size,row*.73,Math.max(12,row-22),(cell-4)*data.height/f.w);else if(data.group==='enemy')size=Math.min(size,Math.min(52,width*.13)*data.height/f.w);}
   if(!oldMotion(paint,actor.key,p.x,p.y,size,actor.pose,actor.options)){const fallback=images[actor.key];if(fallback?.complete&&fallback.naturalWidth){const w=size*fallback.naturalWidth/fallback.naturalHeight;paint.save();paint.globalAlpha=actor.options.alpha??1;paint.drawImage(fallback,p.x-w/2,p.y-size,w,size);paint.restore()}}
  }
  for(const t of texts){const p=project(t,width,height);paint.save();paint.font=t.font.replace(/([\d.]+)px/,(_,n)=>Math.max(7.5,Number(n)*width/600)+'px');paint.fillStyle=t.fill;paint.textAlign=t.align;paint.globalAlpha=t.alpha;paint.fillText(t.text,p.x,p.y);paint.restore();}
 }
 const oldDraw=draw;draw=function(){actors=[];texts=[];collecting=true;try{oldDraw()}finally{collecting=false}render()};
 fitBoard=function(){const r=stage.getBoundingClientRect();if(r.width<2||r.height<2)return;width=r.width;height=r.height;const dpr=Math.min(devicePixelRatio||1,2),w=Math.round(width*dpr),h=Math.round(height*dpr);if(view.width!==w||view.height!==h){view.width=w;view.height=h}canvas.style.setProperty('width',width+'px','important');canvas.style.setProperty('height',height+'px','important');canvas.style.setProperty('transform','none');canvas.boardInsetTop=0;GamePerformance.invalidate()};
 new ResizeObserver(fitBoard).observe(stage);window.addEventListener('resize',fitBoard);
 // Move the existing live notification node; its full-text dialog keeps working.
 const notice=q('.battle-notice'),badge=document.createElement('span');badge.className='battle-alert-icon';badge.textContent='↘';badge.setAttribute('aria-hidden','true');notice.prepend(badge);q('.battle-top').after(notice);notice.append(q('#item-hint'),q('#boss-warning'));
 const skillRow=q('.skill-row'),portrait=document.createElement('img'),copy=document.createElement('div'),name=document.createElement('b'),grade=document.createElement('small');
 portrait.id='battle-selected-portrait';portrait.alt='';portrait.dataset.motion='static-battle-selection';copy.className='battle-selected-copy';name.id='battle-selected-name';grade.id='battle-selected-grade';copy.append(name,grade,q('#skill-help'));skillRow.prepend(portrait,copy);
 q('.battle-controls').prepend(skillRow,q('.summon-row'),q('.item-buttons'));
 const energy=q('.summon-row > span');for(const n of [...energy.childNodes])if(n.nodeType===3)n.textContent=n.textContent.replace('SP','');
 const mini=document.createElement('div');mini.className='battle-stage-meta';mini.innerHTML='<span><img src="assets/ui-v2/icons/sword.svg" alt=""><b id="battle-remaining"></b></span><span><img src="assets/ui-v2/icons/shield.svg" alt=""><b id="battle-next-boss"></b></span>';stage.append(mini);
 for(const key of Object.keys(itemCatalog))q('#item-'+key).setAttribute('aria-label',itemCatalog[key].name);
 function selection(){const u=board[selected];const source=u?staffImagePath(kinds[u.type].file):'assets/ui-v2/icons/staff.svg';if(portrait.getAttribute('src')!==source)portrait.src=source;
  uiText(name,u?skillNames[u.type]:'고유 스킬');uiText(grade,u?'✦'.repeat(u.pip):'★5 이상');
  const original=!u?'직원 선택 후 스킬 사용':skillNames[u.type]+' · '+(u.pip<5?'5등급 해금':u.stun>0?'기절 중':(u.skillCD||0)>0?Math.ceil(u.skillCD)+'초 후 사용':!playing?'당직 시작 후 사용':paused?'일시정지 중':'사용');uiAttr(q('#skill'),'aria-label',original);uiText(q('#skill'),!u?'선택':u.stun>0?'기절':u.pip<5?'★5':(u.skillCD||0)>0?Math.ceil(u.skillCD)+'s':!playing?'대기':paused?'일시정지':'사용');
  uiAttr(skillRow,'data-selected',u?'true':'false');
 }
 const oldSkill=syncSkill;syncSkill=function(){oldSkill();selection()};
 const oldSync=sync;sync=function(){oldSync();selection();uiText(q('#battle-remaining'),Math.max(0,enemies.filter(e=>e.hp>0&&!e.escaped).length+queue.length));uiText(q('#battle-next-boss'),(Math.floor(wave/5)+1)*5);for(const key of Object.keys(itemCatalog)){uiAttr(q('#item-'+key),'aria-label',itemCatalog[key].name+' · 보유 '+itemCount(key)+'개');uiAttr(q('#item-'+key),'aria-pressed',itemMode===key)}};
 selection();fitBoard();
 return {enabled,axes,project,unproject,point,screenPoint,resize:fitBoard};
})();
