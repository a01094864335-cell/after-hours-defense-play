'use strict';
/* The approved illustrations are presentation assets; all data and actions stay live. */
(()=>{
 if(typeof document.createElement!=='function')return;
 const q=s=>document.querySelector(s);
 function icon(el,name){if(!el)return;el.querySelectorAll('.ui-icon,.skin-icon,.ref-icon').forEach(n=>n.remove());const first=el.firstChild;if(first?.nodeType===3)first.textContent=first.textContent.replace(/[📖♟⌂🛍?☾☰⚡↑]/gu,'').trim();const im=document.createElement('img');im.src='assets/ui-v2/icons/'+name+'.svg';im.alt='';im.className='ref-icon';el.prepend(im)}
 for(const [selector,name] of [['#quick-story','book'],['#quick-help','help'],['#roster-open','scroll'],['.nav-home','home'],['#shop-open','shop'],['#menu-open','gear'],['.mode-card>span','moon'],['#upgrade-open','staff']])icon(q(selector),name);
 q('.brand small').textContent='야간 당직';
 for(const key of ['grade','kind','king']){const im=q('#buy-'+key).parentElement.querySelector('img');if(im)im.src='assets/reference-ui/item-'+key+'-art.webp'}
 q('.lobby-badge').textContent='마왕님 휴식 중  ᶻᶻᶻ';
 const market=document.createElement('div');market.className='ref-market-scene';market.setAttribute('aria-hidden','true');q('#shop').prepend(market);
 // Match the approved product-first layout while preserving all purchase handlers.
 q('#shop').insertBefore(q('.recruit-shop'),q('.shop-note'));
 q('#info>h2').textContent='근무 안내';
 const help=q('#info>p:last-of-type');help.outerHTML='<div class="ref-guide-step"><b>①</b><div><h3>직원 소환</h3><p>SP를 사용해 빈 자리에 랜덤 직원을 파견하세요.</p></div><img src="assets/mobile/lobby-gobi.webp" alt="직원 소환"></div><div class="ref-guide-step"><b>②</b><div><h3>같은 종류·등급 합성</h3><p>같은 직원을 합치면 더 높은 등급의 랜덤 직원이 와요. 합성 실패 확률을 확인하세요.</p></div><img src="assets/mobile/item-grade.webp" alt="등급 합성"></div><div class="ref-guide-step"><b>③</b><div><h3>5등급 스킬 해금</h3><p>5등급 이상 직원을 선택해 고유 스킬을 사용하세요. 다시 사용하려면 충전 시간이 필요해요.</p></div><img src="assets/ui-v2/icons/lightning.svg" alt="고유 스킬"></div>';
 const menuHelp=document.createElement('button');menuHelp.id='ref-menu-help';menuHelp.textContent='근무 안내';menuHelp.onclick=()=>{q('#menu').close();q('#help-open').click()};q('#menu').insertBefore(menuHelp,q('#reset'));q('#menu').insertBefore(q('#menu-story'),q('#reset'));q('#menu').insertBefore(q('#reset'),q('#menu-close'));
 const pause=document.createElement('div');pause.id='ref-pause';pause.hidden=true;pause.setAttribute('role','dialog');pause.setAttribute('aria-label','잠깐 쉬는 중');pause.innerHTML='<section id="pause-window"><h2>☾ 잠깐 쉬는 중</h2><div class="ref-pause-art" aria-hidden="true"></div><p>당직은 잠시 멈춰요</p><button id="pause-continue">▶ 계속 근무</button><button id="pause-guide">▤ 근무 안내</button><button id="pause-home">⌂ 로비로</button></section>';q('#battle').append(pause);
 q('#pause-continue').onclick=()=>{paused=false;sync()};q('#pause-guide').onclick=()=>openSheet('info');q('#pause-home').onclick=()=>q('#battle-back').click();pause.addEventListener('keydown',e=>{if(e.key==='Escape'){paused=false;sync()}});
 const stories=['story-first','story-invasion','story-recruitment','story-night'];
 const oldPromo=showPromo;showPromo=function(){oldPromo();q('#promo').style.setProperty('--story-art',"url('assets/reference-ui/"+stories[promoIndex]+".svg')")};
 const originalRender=appRender;appRender=function(){originalRender();refresh()};
 function refresh(){pause.hidden=!(appScreen==='battle'&&playing&&paused&&!ended&&!document.querySelector('dialog[open]'));q('#pause').setAttribute('aria-label',paused?'계속하기':'일시정지');}
 function decorate(){
  const slot=q('#merc-slot');if(!slot.querySelector('.ref-merc-plus')){
   if(!meta.equipped&&!playing){slot.innerHTML='<span class="ref-merc-empty" aria-hidden="true">✚</span><span>지원 용병<br><small>함께할 용병을 선택하세요</small></span>'}
   const plus=document.createElement('button');plus.className='ref-merc-plus';plus.textContent='+';plus.setAttribute('aria-label','지원 용병 선택');plus.onclick=()=>{q('#shop-open').click();shopTab('mercs')};slot.append(plus);
  }
  document.querySelectorAll('.staff-pass').forEach(card=>{const name=card.querySelector('.pass-open');if(name&&/인사기록|채용 방법/.test(name.textContent)){const record=staffRecords.find(r=>r.id===card.dataset.staff);name.textContent=record&&staffOwned(record)?record.name:'???'}card.querySelector(':scope>strong')?.remove()});
  const reveal=q('.recruit-reveal');if(reveal&&!reveal.querySelector('.ref-recruit-actions')){const actions=document.createElement('div');actions.className='ref-recruit-actions';actions.innerHTML='<button>직원 도감으로</button><button>확인</button>';actions.children[0].onclick=()=>{q('#recruit-result').innerHTML='';q('#shop').close();q('#roster-open').click()};actions.children[1].onclick=()=>q('#recruit-result').innerHTML='';reveal.append(actions)}
  refresh();
 }
 let queued=false;const observer=new MutationObserver(()=>{if(queued)return;queued=true;queueMicrotask(()=>{queued=false;decorate()})});for(const id of ['merc-slot','roster-list','recruit-result'])observer.observe(q('#'+id),{childList:true,subtree:true});const modalObserver=new MutationObserver(refresh);for(const d of document.querySelectorAll('dialog')){modalObserver.observe(d,{attributes:true,attributeFilter:['open']});d.addEventListener('close',refresh)}decorate();
 // Painted slot borders also render inside the live combat canvas.
 const textures={};for(const key of ['slot-square','tab-active']){const im=new Image();im.src='assets/reference-ui/'+key+'.svg';textures[key]=im}
 window.GameSkin={frame(context,key,x,y,w,h){const im=textures[key];if(!im?.complete||!im.naturalWidth)return false;context.drawImage(im,x,y,w,h);return true},refresh,story(index){q('#promo').style.setProperty('--story-art',"url('assets/reference-ui/"+stories[index]+".svg')")},scan:decorate};
 refresh();
})();
