'use strict';
// Presentation adapter only. The original personnel handlers own all state and actions.
(()=>{
 if(!document.currentScript||!document.body||typeof document.body.attachShadow!=='function'||document.getElementById('asset-roster-host'))return;
 const here=new URL('.',document.currentScript.src),asset=n=>new URL('assets/'+n,here).href,dialog=document.querySelector('#roster');
 const host=document.createElement('div');host.id='asset-roster-host';const shadow=host.attachShadow({mode:'open'}),style=document.createElement('link');style.rel='stylesheet';style.href=new URL('roster.css',here).href;
 const root=document.createElement('section');root.id='asset-roster';root.setAttribute('aria-label','직원 도감');
 const crop=(box,cls='')=>`<svg class="${cls}" viewBox="${box}" preserveAspectRatio="none" aria-hidden="true" focusable="false"><image data-art-src="${asset('roster-reference.webp')}" width="887" height="1774"/></svg>`;
 root.innerHTML=`<svg class="r-wood" viewBox="0 0 887 1920" preserveAspectRatio="none" aria-hidden="true"><defs><pattern id="wood" width="887" height="90" patternUnits="userSpaceOnUse"><svg width="887" height="90" viewBox="0 1684 887 90"><image data-art-src="${asset('roster-reference.webp')}" width="887" height="1774"/></svg></pattern></defs><rect width="887" height="1920" fill="url(#wood)"/></svg><header class="r-header">${crop('0 0 887 258')}<button data-action="close" class="r-back" aria-label="당직실로 돌아가기"></button><button data-action="close" class="r-close" aria-label="직원 도감 닫기"></button></header><nav class="r-tabs" aria-label="직원 분류"><button data-group="staff"></button><button data-group="incoming"></button><button data-group="merc"></button></nav><section class="r-duty" aria-label="오늘의 근무 명단"><div class="r-duty-heading"><span aria-hidden="true">▣</span><strong>오늘의<br>근무 명단 <b id="r-count"></b></strong></div><div id="r-team"></div></section><div class="r-scroll" tabindex="0" aria-label="직원 목록"><div class="r-book"><svg class="r-paper-texture" viewBox="280 180 850 480" preserveAspectRatio="none" aria-hidden="true"><image data-art-src="${asset('card-paper.webp')}" width="1443" height="908"/></svg><div id="r-cards"></div>${crop('0 1337 887 214','r-book-foot')}<p id="r-note"></p></div></div><footer><nav class="r-nav" aria-label="주 메뉴"><button aria-label="직원 도감" aria-current="page" data-action="overview"></button><button aria-label="당직실" data-action="close"></button><button aria-label="상점" data-action="shop"></button></nav></footer>`;
 new MutationObserver(hydrateArt).observe(dialog,{attributes:true,attributeFilter:['open']});
 shadow.append(style,root);dialog.append(host);dialog.classList.add('asset-roster-dialog');
 const local=s=>root.querySelector(s),escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 // Heads are shared with the main party, never cropped from a separate mockup.
 function art(r,head=false){return `<img class="${head?'r-head':'r-portrait'}" data-character-id="${escape(r.id)}" src="${escape(CharacterPortraits.src(r.id,r.image))}" alt="" loading="lazy">`;}
 let key='',selected='',scroll=0;
 function hydrateArt(){if(!(dialog.open))return;for(const image of root.querySelectorAll('image[data-art-src]')){image.setAttribute('href',image.dataset.artSrc);image.removeAttribute('data-art-src')}}
 function refresh(){hydrateArt();
  const detail=!document.querySelector('#roster-detail').hidden;dialog.classList.toggle('asset-roster-detail',detail);host.hidden=detail;
  if(detail)return;
  const state=JSON.stringify([rosterGroup,meta.staff,meta.deck,meta.owned,meta.equipped]);if(state===key)return;key=state;
  const staff=staffRecords.filter(r=>r.group!=='merc'),mercs=staffRecords.filter(r=>r.group==='merc');
  for(const [group,title,count] of [['staff','채용 직원',staff.filter(staffOwned).length],['incoming','미채용',staff.filter(r=>!staffOwned(r)).length],['merc','지원 영웅',mercs.length]]){const b=local(`[data-group="${group}"]`);b.innerHTML=title+' <b>'+count+'</b>';b.setAttribute('aria-pressed',String(group===rosterGroup));}
  local('#r-count').textContent=meta.deck.length+'/5';
  local('#r-team').innerHTML=meta.deck.map(id=>{const r=staffRecords.find(r=>r.id===id);return r?`<button data-record="${escape(id)}" aria-label="${escape(r.name)} 인사기록 보기">${art(r,true)}<span>${escape(r.name)}</span></button>`:''}).join('');
  const list=staffRecords.filter(r=>rosterGroup==='merc'?r.group==='merc':r.group!=='merc'&&(rosterGroup==='staff'?staffOwned(r):!staffOwned(r)));
  local('#r-cards').innerHTML=list.map(r=>{const owned=staffOwned(r),active=owned&&(r.group==='merc'?meta.equipped===r.id.slice(5):meta.deck.includes(r.id));return `<button class="r-card ${owned?'':'r-locked'}" data-record="${escape(r.id)}" aria-label="${escape(owned?r.name+' · '+r.job:'미채용 직원')} 인사기록 보기"><div class="r-art">${art(r)}${owned?'':'<b class="r-question">?</b>'}</div><div class="r-card-copy"><strong>${owned?escape(r.name):'???'}</strong><span class="r-job">${owned?escape(r.job):'미채용 직원'}</span><span class="${active?'r-stamp':'r-record'}">${active?(r.group==='merc'?'지원 중':'편성 중'):'인사기록 보기'}</span></div></button>`}).join('')||'<p class="r-empty">모든 직원을 채용했어요!</p>';
  local('#r-note').textContent=rosterGroup==='staff'?'직원을 눌러 인사기록을 확인하세요':rosterGroup==='incoming'?'채용 전에는 실루엣만 공개돼요':`지원 영웅 ${mercs.filter(staffOwned).length}/${mercs.length} 고용 · 인사기록에서 1명 선택`;
 }
 root.addEventListener('click',event=>{const b=event.target.closest('button');if(!b)return;if(b.dataset.group){rosterGroup=b.dataset.group;renderStaffArchive();local('.r-scroll').scrollTop=0;}else if(b.dataset.record){selected=b.dataset.record;scroll=local('.r-scroll').scrollTop;showStaffRecord(selected);}else if(b.dataset.action==='close'){dialog.close();}else if(b.dataset.action==='shop'){dialog.close();document.querySelector('#shop-open').click();}else if(b.dataset.action==='overview'){rosterGroup='staff';renderStaffArchive();local('.r-scroll').scrollTop=0;}});
 for(const name of ['renderStaffArchive','showStaffRecord','showLockedRecord','closeStaffRecord']){const previous=window[name];if(typeof previous==='function')window[name]=function(...args){const result=previous.apply(this,args);refresh();if(name==='closeStaffRecord'&&args[0]!==false&&selected){local('.r-scroll').scrollTop=scroll;local(`[data-record="${selected}"]`)?.focus({preventScroll:true});}return result;};}
 new MutationObserver(refresh).observe(document.querySelector('#roster-detail'),{attributes:true,attributeFilter:['hidden']});
 dialog.addEventListener('close',()=>{key='';refresh();});
 refresh();window.AssetRoster={refresh};
})();
