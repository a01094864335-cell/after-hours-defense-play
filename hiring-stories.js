'use strict';
// Ownership is the unlock record: viewing never charges coins or changes rewards.
const HiringStories=(()=>{
 const episodes=new Map((window.HIRING_STORIES||[]).map(e=>[e.id,e]));
 let dialog,current,page=0,returnFocus,touchX=0;
 const owned=id=>{const r=staffRecords.find(r=>r.id===id);return !!r&&staffOwned(r)};
 function close(){if(dialog?.open)dialog.close()}
 function build(){
  if(dialog)return true;if(typeof document.createElement!=='function')return false;
  dialog=document.createElement('dialog');dialog.id='hiring-story';dialog.setAttribute('aria-labelledby','hiring-story-title');
  dialog.innerHTML='<header><div><small>마왕성 · 첫 출근 기록</small><h2 id="hiring-story-title"></h2></div><button type="button" data-hire-close>닫기 ×</button></header><div class="hire-art"><img alt=""><p class="hire-image-status" role="status"></p></div><footer><b class="hire-name"></b><p class="hire-dialogue" aria-live="polite"></p><nav aria-label="채용 이야기 페이지"><button type="button" data-hire-prev>← 이전</button><span class="hire-page"></span><button type="button" data-hire-next>다음 →</button></nav></footer>';
  document.body.append(dialog);
  dialog.querySelector('[data-hire-close]').onclick=close;
  dialog.querySelector('[data-hire-prev]').onclick=()=>move(-1);
  dialog.querySelector('[data-hire-next]').onclick=()=>page===3?close():move(1);
  dialog.addEventListener('close',()=>{current=null;if(returnFocus?.isConnected)returnFocus.focus()});
  dialog.addEventListener('keydown',e=>{if(e.key==='ArrowRight'||e.key==='ArrowLeft'){e.preventDefault();move(e.key==='ArrowRight'?1:-1)}});
  const art=dialog.querySelector('.hire-art');
  art.addEventListener('touchstart',e=>{touchX=e.changedTouches[0].clientX},{passive:true});
  art.addEventListener('touchend',e=>{const dx=e.changedTouches[0].clientX-touchX;if(Math.abs(dx)>60)move(dx<0?1:-1)},{passive:true});
  const img=dialog.querySelector('img');img.onload=()=>dialog.querySelector('.hire-image-status').textContent='';img.onerror=()=>dialog.querySelector('.hire-image-status').textContent='그림을 불러오지 못했어요. 대사를 읽거나 다음 장으로 넘길 수 있어요.';
  return true;
 }
 function render(){
  const p=current.panels[page],img=dialog.querySelector('img');
  dialog.querySelector('#hiring-story-title').textContent=current.title;
  dialog.querySelector('.hire-name').textContent=current.name+' · '+current.job;
  dialog.querySelector('.hire-dialogue').textContent=p.dialogue;
  dialog.querySelector('.hire-page').textContent=(page+1)+' / 4';
  dialog.querySelector('[data-hire-prev]').disabled=page===0;
  dialog.querySelector('[data-hire-next]').textContent=page===3?'이야기 완료 ✓':'다음 →';
  dialog.querySelector('.hire-image-status').textContent='그림을 불러오는 중…';
  img.alt=current.name+'의 입사 이야기 '+(page+1)+'번째 장면';img.src='assets/hiring-stories/'+p.file;
  if(page<3){const next=new Image();next.src='assets/hiring-stories/'+current.panels[page+1].file}
 }
 function move(n){if(!current)return;page=Math.max(0,Math.min(3,page+n));render()}
 const api={has:id=>episodes.has(id),canView:id=>episodes.has(id)&&owned(id),open(id){
  if(!api.canView(id)||!build())return false;
  if(!dialog.open)returnFocus=document.activeElement;
  current=episodes.get(id);page=0;render();if(!dialog.open)dialog.showModal();dialog.querySelector('[data-hire-next]').focus();return true;
 },close};
 const originalReveal=revealRecruit;
 revealRecruit=function(id,duplicate){const result=originalReveal.apply(this,arguments);if(!duplicate&&api.canView(id))api.open(id);return result};
 const originalPoints=recruitByPoints;
 recruitByPoints=function(id){const wasOwned=owned(id),result=originalPoints.apply(this,arguments);if(result&&!wasOwned&&api.canView(id))api.open(id);return result};
 const originalSupport=recruitSupport;
 recruitSupport=function(id){const key='merc-'+id,wasOwned=owned(key),result=originalSupport.apply(this,arguments);if(result&&!wasOwned&&api.canView(key))api.open(key);return result};
 const originalRecord=showStaffRecord;
 showStaffRecord=function(id){const result=originalRecord.apply(this,arguments);if(!api.canView(id)||typeof document.createElement!=='function')return result;
  const detail=document.querySelector('#roster-detail');if(!detail||detail.querySelector('[data-hire-replay]'))return result;
  const section=document.createElement('section');section.className='dossier-section hire-record';
  const title=document.createElement('h4');title.textContent='첫 출근 기록';
  const copy=document.createElement('p');copy.textContent=episodes.get(id).title+' · 네 컷 이야기';
  const button=document.createElement('button');button.type='button';button.dataset.hireReplay=id;button.textContent='입사 이야기 보기 →';button.onclick=()=>api.open(id);
  section.append(title,copy,button);(detail.querySelector('.panel-scroll-body')||detail).append(section);return result;
 };
 return api;
})();
