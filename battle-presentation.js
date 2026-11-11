'use strict';
// D layout is a view projection. Combat, range checks and saved cells stay 600×600.
window.BattlePresentation=(()=>{
 const q=s=>document.querySelector(s),enabled=typeof document.createElement==='function';
 function axes(w,h){return {x:[[0,82,110,186,262,338,414,490,518,600],[0,w*68/948,w*110/948,w*265/948,w*398/948,w*527/948,w*664/948,w*823/948,w*881/948,w]],y:[[0,123,202,479,567,600],[0,h*188/949,h*317.5/949,h*798.5/949,h*923/949,h]]}}
 function map(v,from,to){let i=0;while(i<from.length-2&&v>from[i+1])i++;return to[i]+(v-from[i])/(from[i+1]-from[i])*(to[i+1]-to[i])}
 function project(p,w,h){const a=axes(w,h);return{x:map(p.x,...a.x),y:map(p.y,...a.y)}}
 function unproject(p,w,h){const a=axes(w,h);return{x:map(p.x,a.x[1],a.x[0]),y:map(p.y,a.y[1],a.y[0])}}
 function point(e){const r=canvas.getBoundingClientRect();return unproject({x:e.clientX-r.left,y:e.clientY-r.top},r.width,r.height)}
 function screenPoint(p){const r=canvas.getBoundingClientRect(),v=project(p,r.width,r.height);return{x:r.left+v.x,y:r.top+v.y}}
 // Compare the idle silhouette's footprint, not atlas height or the widest attack.
 // One scale covers all six poses so gesturing never makes a character shrink.
 const extents=new WeakMap();
 function bodyBounds(data){
  let value=extents.get(data);
  if(!value){const idle=data.frames[0];value={presence:Math.sqrt(idle.w*idle.h),top:Math.max(...data.frames.map(f=>f.pivotY)),bottom:Math.max(...data.frames.map(f=>f.h-f.pivotY)),side:Math.max(...data.frames.map(f=>Math.max(f.pivotX,f.w-f.pivotX)))};extents.set(data,value)}
  return value;
 }
 function staffSize(data,row,cell){
  const b=bodyBounds(data),space=Math.max(1,cell-7),vertical=Math.max(1,row-13);
  const presence=Math.min(cell*.80,row*.70);
  // Narrow silhouettes can read taller despite equal footprint; keep reviewed
  // per-character art corrections board-only, without rescaling source pixels.
  return Math.min(presence/b.presence,space/(2*b.side),vertical/(b.top+b.bottom))*data.height*(data.boardScale??1);
 }
 const missingBorders=new Set(['electric-technician','mimic-storekeeper','spider-tailor','chalkak-photographer']);
 if(!enabled)return {enabled,axes,project,unproject,point,screenPoint,staffSize,bodyBounds};
 const stage=q('.board-stage'),view=document.createElement('canvas');view.id='battle-paint';view.setAttribute('aria-hidden','true');view.style.pointerEvents='none';stage.prepend(view);q('#battle').classList.add('battle-d');
 const staffKeys=new Set(kinds.map(kind=>kind.file));
 const paint=view.getContext('2d');let collecting=false,actors=[],texts=[],width=0,height=0,projection=null;
 const fonts=new Map();
 function layout(){if(projection&&projection.width===width&&projection.height===height)return projection;const a=axes(width,height),patches=[];for(let y=0;y<a.y[0].length-1;y++)for(let x=0;x<a.x[0].length-1;x++){const sx=a.x[0][x],sy=a.y[0][y];patches.push([sx,sy,a.x[0][x+1]-sx,a.y[0][y+1]-sy,a.x[1][x],a.y[1][y],a.x[1][x+1]-a.x[1][x],a.y[1][y+1]-a.y[1][y]])}fonts.clear();return projection={width,height,a,patches,row:(a.y[1][3]-a.y[1][2])/3,cell:(map(490,...a.x)-map(110,...a.x))/5}}
 function viewPoint(p,a){return{x:map(p.x,...a.x),y:map(p.y,...a.y)}}
 const oldMotion=Motion.draw;
 // Every battle actor uses a full-body motion sheet; menu portraits remain independent.
 Motion.draw=function(target,key,x,y,size,pose=0,options={}){
  if(!collecting||target!==ctx)return oldMotion(target,key,x,y,size,pose,options);
  const m=ctx.getTransform();actors.push({key,x:m.a*x+m.c*y+m.e,y:m.b*x+m.d*y+m.f,size,pose,options:{...options,alpha:(options.alpha??1)*ctx.globalAlpha}});Motion.preload(key);return true;
 };
 const oldText=ctx.fillText.bind(ctx);
 ctx.fillText=function(text,x,y,maxWidth){if(!collecting)return maxWidth===undefined?oldText(text,x,y):oldText(text,x,y,maxWidth);if(text==='·'||String(text).startsWith('★ 스킬'))return;const m=ctx.getTransform();texts.push({text,x:m.a*x+m.c*y+m.e,y:m.b*x+m.d*y+m.f,font:ctx.font,fill:ctx.fillStyle,align:ctx.textAlign,alpha:ctx.globalAlpha});};
 // The native D frames replace the previous illustrated cell skins.
 if(typeof LiveUIAssets!=='undefined'){const oldCell=LiveUIAssets.cell;LiveUIAssets.cell=function(target,...args){if(target!==ctx)oldCell(target,...args)}}
 function render(){
  if(width<1||height<1)return;const geometry=layout(),a=geometry.a,dpr=Math.min(devicePixelRatio||1,2);paint.setTransform(dpr,0,0,dpr,0,0);paint.imageSmoothingEnabled=false;paint.clearRect(0,0,width,height);
  for(const patch of geometry.patches)paint.drawImage(canvas,...patch);
  NightWatchArt.selection(paint,width,height);
  const {row,cell}=geometry,enemyHUD=[];
  for(const actor of actors){const p=viewPoint(actor,a),data=Motion.sheets[actor.key];let size=actor.size*width/600*(staffKeys.has(actor.key)?1.35:data?.group==='enemy'?1.05:1.12);
   if(data){const f=data.frames[Math.max(0,Math.min(5,actor.pose))];if(staffKeys.has(actor.key)){size=staffSize(data,row,cell);if(missingBorders.has(actor.key))actor.options.outline=1.25;}else if(data.group==='enemy')size=Math.min(size,Math.min(52,width*.13)*data.height/Math.max(...data.frames.map(frame=>frame.w))); if(actor.options.enemy)enemyHUD.push({e:actor.options.enemy,x:p.x,top:p.y-f.pivotY*size/data.height});}
   if(!oldMotion(paint,actor.key,p.x,p.y,size,actor.pose,actor.options)){const fallback=images[actor.key];if(fallback?.complete&&fallback.naturalWidth){const w=size*fallback.naturalWidth/fallback.naturalHeight;paint.save();paint.globalAlpha=actor.options.alpha??1;paint.drawImage(fallback,p.x-w/2,p.y-size,w,size);paint.restore()}}
  }
  for(const t of texts){const p=viewPoint(t,a);let font=fonts.get(t.font);if(!font){font=t.font.replace(/([\d.]+)px/,(_,n)=>Math.max(7.5,Number(n)*width/600)+'px');fonts.set(t.font,font)}paint.save();paint.font=font;paint.fillStyle=t.fill;paint.textAlign=t.align;paint.globalAlpha=t.alpha;paint.fillText(t.text,p.x,p.y);paint.restore();}

  // Health follows the displayed full-body bounds, rather than the old source height.
  for(const hud of enemyHUD){const e=hud.e;if(e.escaped||e.hp<=0)continue;const w=Math.min(24,width*.064),x=Math.max(1,Math.min(width-w-1,hud.x-w/2)),y=Math.max(13,hud.top-7);paint.save();paint.fillStyle='#0c174e';paint.beginPath();paint.roundRect(x-1,y-1,w+2,5,2);paint.fill();paint.fillStyle=e.slow||e.freeze>0?'#87e6ef':'#ff628b';paint.fillRect(x,y,w*Math.max(0,e.hp/e.max),3);if(e.shield>0){paint.fillStyle='#9edbff';paint.fillRect(x,y+5,w*Math.min(1,e.shield/(e.max*.4)),2)}if(e.type!=='normal'){paint.font='bold 8px system-ui';paint.textAlign='center';paint.lineWidth=2.5;paint.strokeStyle='#112356';const label=e.decoy?'분신':enemyDefinition(e).badge;paint.strokeText(label,hud.x,y-3);paint.fillStyle='#fff0c7';paint.fillText(label,hud.x,y-3)}paint.restore()}
 }
 // The support is a UI companion, separate from the fifteen playable cells.
 const support=document.createElement('aside');support.id='battle-support';support.hidden=true;
 const supportFace=document.createElement('img'),supportCopy=document.createElement('span'),supportName=document.createElement('b'),supportState=document.createElement('small');supportFace.alt='';supportFace.decoding='async';supportCopy.append(supportName,supportState);support.append(supportFace,supportCopy);stage.append(support);
 drawMercenary=function(){}; // Remove the legacy pixel actor and dark plinth only.
 function supportPresentation(){
  const id=playing?activeMerc:meta.equipped,record=id&&staffRecords.find(r=>r.id==='merc-'+id);
  const kingCutin=kingEvent.state==='entrance'||kingEvent.state==='afterglow';
  uiProp(support,'hidden',!record||kingCutin);if(!record||kingCutin)return;
  const source=CharacterPortraits.src(record.id);if(supportFace.getAttribute('src')!==source)supportFace.src=source;
  const casting=!!mercGesture.motionState&&!paused&&!ended;
  uiText(supportName,record.name);uiText(supportState,document.documentElement.lang.startsWith('en')?(casting?'Supporting!':'Auto support'):(casting?'지원 중!':'자동 지원'));
  uiAttr(support,'data-active',casting?'true':'false');uiAttr(support,'title',trainedMercDescription(id,true));uiAttr(support,'aria-label',record.name+' · '+supportState.textContent+' · '+trainedMercDescription(id,true));
 }
 const oldDraw=draw;draw=function(){actors.length=0;texts.length=0;collecting=true;try{oldDraw()}finally{collecting=false}render()};
 fitBoard=function(){const r=stage.getBoundingClientRect();if(r.width<2||r.height<2)return;width=r.width;height=r.height;const dpr=Math.min(devicePixelRatio||1,2),w=Math.round(width*dpr),h=Math.round(height*dpr);if(view.width!==w||view.height!==h){view.width=w;view.height=h}canvas.style.setProperty('width',width+'px','important');canvas.style.setProperty('height',height+'px','important');canvas.style.setProperty('transform','none');canvas.boardInsetTop=0;GamePerformance.invalidate()};
 new ResizeObserver(fitBoard).observe(stage);window.addEventListener('resize',fitBoard);
 // Move the existing live notification node; its full-text dialog keeps working.
 const notice=q('.battle-notice'),badge=document.createElement('span');badge.className='battle-alert-icon';badge.textContent='↘';badge.setAttribute('aria-hidden','true');notice.prepend(badge);q('.battle-top').after(notice);notice.append(q('#item-hint'),q('#boss-warning'));
 const skillRow=q('.skill-row'),portrait=document.createElement('img'),copy=document.createElement('div'),name=document.createElement('b'),grade=document.createElement('small');
 portrait.id='battle-selected-portrait';portrait.alt='';portrait.dataset.motion='static-battle-selection';copy.className='battle-selected-copy';name.id='battle-selected-name';grade.id='battle-selected-grade';copy.append(name,grade,q('#skill-help'));skillRow.prepend(portrait,copy);
 const pickGrid=document.createElement('span');pickGrid.className='battle-pick-grid';pickGrid.setAttribute('aria-hidden','true');for(let i=0;i<9;i++)pickGrid.append(document.createElement('i'));skillRow.prepend(pickGrid);
 q('.battle-controls').prepend(skillRow,q('.summon-row'),q('.item-buttons'));
 const energy=q('.summon-row > span');for(const n of [...energy.childNodes])if(n.nodeType===3)n.textContent=n.textContent.replace('SP','');
 const mini=document.createElement('div');mini.className='battle-stage-meta';mini.innerHTML='<span><img src="assets/ui-v2/icons/sword.svg" alt=""><b id="battle-remaining"></b></span><span><img src="assets/ui-v2/icons/shield.svg" alt=""><b id="battle-next-boss"></b></span>';stage.append(mini);
 for(const key of Object.keys(itemCatalog))q('#item-'+key).setAttribute('aria-label',itemCatalog[key].name);
 function selection(){const u=board[selected];const source=u?staffPortraitPath(kinds[u.type].file):null;if(source&&portrait.getAttribute('src')!==source)portrait.src=source;
  const english=document.documentElement.lang.startsWith('en');
  uiText(name,u?skillNames[u.type]:(english?'Pick a staff member':'보드의 직원을 눌러보세요'));uiText(grade,u?(u.pip<5?'★'+u.pip+' · ★5 해금':'✦'.repeat(u.pip)):(english?'Unique skills unlock at ★5':'★5부터 고유 스킬을 사용할 수 있어요'));
  uiProp(portrait,'hidden',!u);uiProp(q('#skill'),'hidden',!u);supportPresentation();
  const original=!u?'직원 선택 후 스킬 사용':skillNames[u.type]+' · '+(u.pip<5?'5등급 해금':u.stun>0?'기절 중':(u.skillCD||0)>0?Math.ceil(u.skillCD)+'초 후 사용':!playing?'당직 시작 후 사용':paused?'일시정지 중':'사용');uiAttr(q('#skill'),'aria-label',original);uiText(q('#skill'),!u?'선택':u.stun>0?'기절':u.pip<5?'★5':(u.skillCD||0)>0?Math.ceil(u.skillCD)+'s':!playing?'대기':paused?'일시정지':'사용');
  uiAttr(skillRow,'data-selected',u?'true':'false');uiAttr(skillRow,'data-skill-state',q('#skill').getAttribute('data-state'));
 }
 const oldSkill=syncSkill;syncSkill=function(){oldSkill();selection()};
 const oldSync=sync;sync=function(){oldSync();selection();uiText(q('#battle-remaining'),Math.max(0,enemies.filter(e=>e.hp>0&&!e.escaped).length+queue.length));uiText(q('#battle-next-boss'),(Math.floor(wave/5)+1)*5);for(const key of Object.keys(itemCatalog)){uiAttr(q('#item-'+key),'aria-label',itemCatalog[key].name+' · 보유 '+itemCount(key)+'개');uiAttr(q('#item-'+key),'aria-pressed',itemMode===key)}};
 selection();fitBoard();
 return {enabled,axes,project,unproject,point,screenPoint,staffSize,bodyBounds,resize:fitBoard};
})();
