'use strict';
// Browser-side geometry audit. Findings are candidates until visually reviewed.
module.exports = function auditGeometry() {
 const dialog=[...document.querySelectorAll('dialog[open]')].at(-1);
 const scope=(window.__geometryScopeOverride&&document.querySelector(window.__geometryScopeOverride))||dialog||document.querySelector('#tutorial-gobi:not([hidden])')||document.querySelector('#skill-cutin:not([hidden])')||document.querySelector('#ref-pause:not([hidden])')||document.querySelector('#app-shell');
 const issues=[],expected=[],grids=[];
 const rect=e=>{const r=e.getBoundingClientRect();return {x:r.x,y:r.y,left:r.left,top:r.top,right:r.right,bottom:r.bottom,width:r.width,height:r.height}};
 const name=e=>e.id?'#'+e.id:e.tagName.toLowerCase()+(e.classList.length?'.'+[...e.classList].join('.'):'' );
 const intersection=(a,b)=>({left:Math.max(a.left,b.left),top:Math.max(a.top,b.top),right:Math.min(a.right,b.right),bottom:Math.min(a.bottom,b.bottom),width:Math.max(0,Math.min(a.right,b.right)-Math.max(a.left,b.left)),height:Math.max(0,Math.min(a.bottom,b.bottom)-Math.max(a.top,b.top))});
 function visible(e){
  if(!e||e.closest('[hidden],#gm-test-panel')||!e.getClientRects().length)return false;
  for(let a=e;a&&a!==document;a=a.parentElement){if(a.tagName==='DETAILS'&&!a.open&&a!==e&&!a.querySelector(':scope > summary')?.contains(e))return false;const s=getComputedStyle(a);if(s.display==='none'||s.visibility==='hidden'||Number(s.opacity)===0)return false;if(s.clipPath==='inset(50%)'||s.clip==='rect(0px, 0px, 0px, 0px)')return false;}
  const r=rect(e);return r.width>1.5&&r.height>1.5;
 }
 function clip(e){
  let c={left:0,top:0,right:innerWidth,bottom:innerHeight,width:innerWidth,height:innerHeight};
  for(let a=e.parentElement;a;a=a.parentElement){const s=getComputedStyle(a),r=rect(a);if(/auto|scroll|hidden|clip/.test(s.overflowX)){c.left=Math.max(c.left,r.left);c.right=Math.min(c.right,r.right);}if(/auto|scroll|hidden|clip/.test(s.overflowY)){c.top=Math.max(c.top,r.top);c.bottom=Math.min(c.bottom,r.bottom);}}
  c.width=Math.max(0,c.right-c.left);c.height=Math.max(0,c.bottom-c.top);return c;
 }
 const onScreen=e=>visible(e)&&intersection(rect(e),clip(e)).width>2&&intersection(rect(e),clip(e)).height>2;
 const add=(type,a,b,detail={})=>issues.push({type,a:typeof a==='string'?a:name(a),b:b?(typeof b==='string'?b:name(b)):null,...detail});
 const all=[scope,...scope.querySelectorAll('*')].filter(visible);
 // Text ranges avoid confusing an entire card box with its actual label.
 const texts=[],walk=document.createTreeWalker(scope,NodeFilter.SHOW_TEXT);
 while(walk.nextNode()){
  const n=walk.currentNode,e=n.parentElement;if(!n.textContent.trim()||!onScreen(e)||e.closest('script,style,.locked-mark,.cutin-announcement'))continue;
  const s=getComputedStyle(e);if(parseFloat(s.fontSize)<1)continue;
  const range=document.createRange();range.selectNodeContents(n);
  for(const rr of range.getClientRects()){
   const r={left:rr.left,top:rr.top,right:rr.right,bottom:rr.bottom,width:rr.width,height:rr.height},v=intersection(r,clip(e));
   if(v.width>2&&v.height>2)texts.push({node:n,e,r,v,label:n.textContent.trim().slice(0,90),font:parseFloat(s.fontSize)});
  }
 }
 for(let i=0;i<texts.length;i++)for(let j=i+1;j<texts.length;j++){
  const a=texts[i],b=texts[j];if(a.node===b.node)continue;if(a.e.closest('.scene-wordmark')&&a.e.closest('.scene-wordmark')===b.e.closest('.scene-wordmark'))continue;
  const c=intersection(a.v,b.v);if(c.width>2&&c.height>2)add('text-text-overlap',a.e,b.e,{textA:a.label,textB:b.label,overlap:[c.width,c.height],box:c});
 }
 for(const e of all){
  if(!onScreen(e))continue;
  const s=getComputedStyle(e),r=rect(e);
  if(e.matches('button,summary,input,textarea,select')){
   if(e.scrollWidth>e.clientWidth+2)add('control-horizontal-overflow',e,null,{client:e.clientWidth,scroll:e.scrollWidth,box:r});
   if(e.matches('button')&&e.scrollHeight>e.clientHeight+2)add('button-vertical-overflow',e,null,{client:e.clientHeight,scroll:e.scrollHeight,box:r});
   if(e.matches('button'))for(const t of texts.filter(t=>e.contains(t.e))){
    if(t.r.left<r.left-1||t.r.right>r.right+1||t.r.top<r.top-1||t.r.bottom>r.bottom+1)add('button-label-outside',e,t.e,{text:t.label,box:t.r,control:r});
   }
  }
  if(e.matches('img,canvas')&&!e.matches('#game,#battle-paint,#skill-cutin canvas')){
   const owner=e.closest('button,summary,.training-character-title,.dossier-hero');
   if(owner&&onScreen(owner)){const p=rect(owner);if(r.left<p.left-2||r.right>p.right+2||r.top<p.top-2||r.bottom>p.bottom+2)add('control-asset-outside',owner,e,{box:r,control:p});}
  }
  if((e.matches('.panel-scroll-body,.live-training-body,#roster-overview,.live-result-body')||e===scope)&&e.scrollWidth>e.clientWidth+2)add('container-horizontal-overflow',e,null,{client:e.clientWidth,scroll:e.scrollWidth,box:r});
 }
 // Alpha-aware image rectangles. Full-scene narrative and battle canvases are intentional backdrops.
 const assetPixels=window.__assetAlphaCache||(window.__assetAlphaCache=new Map());
 function contentRect(image){
  const r=rect(image);if(image.tagName!=='IMG'||!image.naturalWidth)return r;
  const fit=getComputedStyle(image).objectFit;if(!['contain','scale-down'].includes(fit))return r;
  const scale=Math.min(r.width/image.naturalWidth,r.height/image.naturalHeight),w=image.naturalWidth*scale,h=image.naturalHeight*scale;
  return {left:r.left+(r.width-w)/2,top:r.top+(r.height-h)/2,right:r.left+(r.width+w)/2,bottom:r.top+(r.height+h)/2,width:w,height:h};
 }
 function alpha(image,overlap){
  if(image.tagName!=='IMG'||!image.complete||!image.naturalWidth)return 1;
  let data=assetPixels.get(image.currentSrc||image.src);
  if(!data){try{const c=document.createElement('canvas');c.width=c.height=64;const ctx=c.getContext('2d',{willReadFrequently:true});ctx.drawImage(image,0,0,64,64);data=ctx.getImageData(0,0,64,64).data;assetPixels.set(image.currentSrc||image.src,data);}catch{return 1;}}
  const r=contentRect(image);let count=0,solid=0;
  for(let y=0;y<5;y++)for(let x=0;x<5;x++){const px=overlap.left+(x+.5)*overlap.width/5,py=overlap.top+(y+.5)*overlap.height/5;const ix=Math.floor((px-r.left)/r.width*64),iy=Math.floor((py-r.top)/r.height*64);if(ix>=0&&ix<64&&iy>=0&&iy<64){count++;if(data[(iy*64+ix)*4+3]>80)solid++;}}
  return count?solid/count:0;
 }
 for(const image of all.filter(e=>e.matches('img,canvas')&&onScreen(e))){
  if(image.matches('#game,#battle-paint,#skill-cutin canvas')||image.closest('.comic-stage,.hire-art,.story-cover,.card-art'))continue;
  const a=intersection(contentRect(image),clip(image));
  for(const t of texts){
   const o=intersection(a,t.v);if(o.width<=3||o.height<=3||o.width*o.height<t.v.width*t.v.height*.1)continue;
   const occupancy=alpha(image,o);if(occupancy<.24)continue;
   const backplate=t.e.closest('button,.comic-bottom,#pause-window');
   const sameControl=image.closest('button')&&image.closest('button')===t.e.closest('button');
   if(backplate&&!sameControl&&!backplate.contains(image)&&image.closest('.lobby-art')){expected.push({type:'text-over-scene-with-backplate',a:name(t.e),b:name(image),box:o,alpha:occupancy});continue;}
   if(image.closest('#tutorial-gobi')&&t.e.closest('#tutorial-gobi')){expected.push({type:'tutorial-composition',a:name(t.e),b:name(image),box:o});continue;}
   add('text-asset-overlap',t.e,image,{text:t.label,alpha:occupancy,box:o});
  }
 }
 const zones=[
  ['.sheet-head,.training-header,.ui-dialog-header,.development-sheet>header',':scope > *'],
  ['.shop-row',':scope > img,:scope > canvas,:scope > span,:scope > button'],
  ['.staff-pass','.pass-portrait,.pass-open,.pass-role,.pass-meta'],
  ['.dossier-hero',':scope > img,:scope > canvas,:scope > h3,:scope > span,:scope > p'],
  ['.training-character-title',':scope > img,:scope > canvas,:scope > div,:scope > span'],
  ['.summon-row',':scope > *'],['.skill-row',':scope > *'],
  ['.approved-lobby-dock',':scope > *'],
  ['#roster-detail',':scope > *']
 ];
 for(const [parent,children]of zones)for(const group of scope.querySelectorAll(parent)){
  const els=[...group.querySelectorAll(children)].filter(onScreen);
  for(let i=0;i<els.length;i++)for(let j=i+1;j<els.length;j++){if(els[i].contains(els[j])||els[j].contains(els[i]))continue;const o=intersection(intersection(rect(els[i]),clip(els[i])),intersection(rect(els[j]),clip(els[j])));if(o.width>2&&o.height>2)add('component-overlap',els[i],els[j],{group:name(group),box:o});}
 }
 if(dialog){
  const frame=rect(dialog),parts=[...dialog.children].filter(onScreen);
  for(const e of parts){const r=rect(e);if(r.left<frame.left-2||r.right>frame.right+2||r.top<frame.top-2||r.bottom>frame.bottom+2)add('dialog-region-outside',e,dialog,{box:r,frame});}
  for(let i=0;i<parts.length;i++)for(let j=i+1;j<parts.length;j++){
   if(dialog.id==='promo'&&(parts[i].matches('.comic-stage')||parts[j].matches('.comic-stage')))continue;
   const o=intersection(rect(parts[i]),rect(parts[j]));if(o.width>2&&o.height>2)add('dialog-regions-overlap',parts[i],parts[j],{box:o});
  }
 }
 // Fixed controls must fit in the viewport. A partly scrolled row is recorded separately.
 for(const e of all.filter(e=>onScreen(e)&&e.matches('button,.training-footer,.live-result-actions,.ui-dialog-actions,.live-dossier-actions,.sheet-head,.training-header,.ui-dialog-header'))){
  const r=rect(e),c=clip(e);if(r.top<c.top-2||r.bottom>c.bottom+2||r.left<c.left-2||r.right>c.right+2){
   let scroller=e.parentElement;
   while(scroller&&!(/auto|scroll/.test(getComputedStyle(scroller).overflowY)&&scroller.scrollHeight>scroller.clientHeight+1))scroller=scroller.parentElement;
   const data={type:'scroll-boundary-partial',a:name(e),box:r,clip:c};
   if(scroller)expected.push(data);else add('fixed-control-clipped',e,null,{box:r,clip:c});
  }
 }
 // CSS grid audit: track widths, row/column origins, gaps and alignment of repeated items.
 for(const grid of all.filter(e=>onScreen(e)&&e.matches('#roster-list,#deck-options,.deck-slots,#deck-summary,.archive-tabs,.training-tabs,.shop-tabs,#cards,.board-access-grid,.item-buttons'))){
  const s=getComputedStyle(grid);if(s.display!=='grid')continue;
  const columns=s.gridTemplateColumns.split(' ').map(parseFloat).filter(Number.isFinite),children=[...grid.children].filter(visible),r=rect(grid),items=children.map(e=>({name:name(e),r:rect(e)}));
  grids.push({element:name(grid),columns,rows:s.gridTemplateRows,gap:s.gap,box:r,items:items.map(i=>({name:i.name,box:i.r}))});
  if(columns.length>1&&Math.max(...columns)-Math.min(...columns)>1.5)add('uneven-grid-columns',grid,null,{columns,box:r});
  if(columns.length>1){const first=items.slice(0,columns.length);for(let i=columns.length;i<items.length;i++){const target=first[i%columns.length];if(target&&Math.abs(items[i].r.left-target.r.left)>2)add('grid-column-origin-drift',grid,items[i].name,{delta:items[i].r.left-target.r.left,box:items[i].r});}}
 }
 const unique=[...new Map(issues.map(i=>[JSON.stringify([i.type,i.a,i.b,i.text,i.textA,i.textB]),i])).values()];
 return {scope:name(scope),issues:unique,expected,grids,checked:{elements:all.length,textRanges:texts.length,images:all.filter(e=>e.matches('img,canvas')).length,buttons:all.filter(e=>e.matches('button')).length},viewport:[innerWidth,innerHeight]};
};
