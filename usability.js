'use strict';
/* Presentation structure only; purchases and combat continue through existing handlers. */
(()=>{
 const q=s=>document.querySelector(s);
 const equipment=q('#equipment'),content=document.createElement('div');content.className='equipment-content';content.append(q('#cards'));equipment.append(content);
 // Fixed heading/action areas keep autofocus from scrolling away the help title.
 const help=q('#info'),helpBody=document.createElement('div');helpBody.className='help-content';
 for(const child of [...help.children])if(child!==q('#info>h2')&&child!==q('#info-close'))helpBody.append(child);
 q('#info-close').before(helpBody);
 const perk=q('#perk'),perkBody=document.createElement('div');perkBody.className='perk-content';
 for(const child of [...perk.children])if(child.id!=='perk-back')perkBody.append(child);
 perk.prepend(perkBody);
 const intro=q('.training-intro');intro.innerHTML='같은 그룹 전체 성장 · 신규 채용에도 적용<br><small>코인 사용 · 확정 성공 · 현재 기기·브라우저에 저장</small>';
 const breakdown=document.createElement('details');breakdown.id='result-breakdown';breakdown.innerHTML='<summary>보상 내역·다음 안내</summary>';q('#result-text').before(breakdown);breakdown.append(q('#result-text'));
 const originalStats=describeStats;describeStats=function(){originalStats();breakdown.open=!runReward?.paid||tutorialMode&&!tutorialWon};
 function prices(){
  for(const button of document.querySelectorAll('.shop-row button')){
   const text=button.textContent;if(button.dataset.formattedPrice===text)continue;
   const match=text.match(/^(\d+)\s*코인(.*)/s);if(!match)continue;
   const amount=document.createElement('strong');amount.textContent=match[1];
   const unit=document.createElement('span');unit.textContent=' 코인';
   const note=document.createElement('small');note.textContent=match[2].replace(/^\s*[·\n]\s*/, '').trim().replace(/(\d+개)\s*/, '$1\n').replace(/(영구 고용)\s*/, '$1\n');
   const price=document.createElement('span');price.className='price-line';price.append(amount,unit);button.replaceChildren(price,note);button.dataset.formattedPrice=button.textContent;
  }
 }
 const oldMeta=renderMeta;renderMeta=function(){oldMeta();prices()};prices();
 // A full explanation remains available without taking space from the short-phone board.
 const notice=q('.battle-notice');notice.tabIndex=0;notice.setAttribute('role','button');notice.setAttribute('aria-label','전투 안내 전체 보기');
 const showNotice=()=>{const d=document.createElement('dialog');d.className='notice-dialog';const h=document.createElement('h2');h.textContent='전투 안내';const p=document.createElement('p');p.textContent=q('#message').textContent;const close=document.createElement('button');close.textContent='알겠어요';close.onclick=()=>d.close();d.append(h,p,close);document.body.append(d);const resume=playing&&!paused&&!ended;if(resume){paused=true;sync()}d.addEventListener('close',()=>{d.remove();if(resume&&!ended){paused=false;sync()}});d.showModal()};
 notice.addEventListener('click',showNotice);notice.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();showNotice()}});
 // Keep initial instructions concise enough to read on short phones.
 const oldSync=sync;sync=function(){oldSync();if(appScreen==='battle'&&!playing&&!ended)uiText(q('#message'),'직원을 소환한 뒤 당직 시작을 누르세요.');if(appScreen!=='battle'||ended){const hud=q('#boss-readout');if(hud)uiProp(hud,'hidden',true)}};
})();
