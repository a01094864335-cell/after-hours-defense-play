'use strict';
module.exports = function applyFixture(mode) {
 window.__restoreGeometryFixture?.();
 const textChanges=[],styleChanges=[];
 window.__restoreGeometryFixture=()=>{for(const [n,text]of textChanges)if(n.isConnected)n.textContent=text;for(const [e,style]of styleChanges)if(e.isConnected){if(style===null)e.removeAttribute('style');else e.setAttribute('style',style);}window.__restoreGeometryFixture=null;};
 const dialog=[...document.querySelectorAll('dialog[open]')].at(-1);
 const scope=dialog||document.querySelector('#tutorial-gobi:not([hidden])')||document.querySelector('#skill-cutin:not([hidden])')||document.querySelector('#ref-pause:not([hidden])')||document.querySelector('#app-shell');
 if(mode.startsWith('en')){
  const exact={ '야간 인사기록부':'Night Shift Personnel Archive','야간 훈련소':'Permanent Staff Training','야간 파견 상점':'Night Recruitment Marketplace','당직 준비':'Prepare for the Night Shift','직원 훈련':'Employee Training','특수 용병 훈련':'Special Support Hero Training','채용팩':'Recruitment Pack','개별 아이템':'Individual Consumable Items','닫기 ×':'Close ×','오늘의 근무 명단':'Tonight’s Five-Person Duty Roster','훈련하기':'Upgrade Permanent Training','소환':'Summon a Staff Member','당직 메뉴':'Night Shift Settings','수고했어요, 고비!':'Great work on your shift, Gobi!','기본 능력':'Basic Staff Ability','고유 스킬':'Unique Character Skill','이야기 도감':'Castle Story Collection','직원 도감':'Employee Collection Archive','상점':'Marketplace','당직실':'Night Shift Lobby','돌아가기':'Return to the Previous Screen','다음 →':'Continue to the Next Page →','알겠어요':'Understood, Continue','확인':'Confirm and Continue','다시 당직 서기':'Start Another Night Shift','보상으로 훈련하기':'Train Staff with Your Rewards','로비로 돌아가기':'Return to the Main Lobby'};
  const walker=document.createTreeWalker(scope,NodeFilter.SHOW_TEXT),nodes=[];
  while(walker.nextNode())nodes.push(walker.currentNode);
  for(const n of nodes){const old=n.textContent.trim(),p=n.parentElement;if(!/[가-힣]/.test(old)||!p.getClientRects().length||p.closest('[hidden],script,style,#gm-test-panel'))continue;
   let value=exact[old];
   if(mode==='en-real130'){
    const words={'마왕이':'AFTER HOURS','퇴근한 뒤':'DEFENSE','이야기':'Stories','기록':'Records','훈련소':'Training','사용':'Use Skill','선택':'Select','등급 합성':'Grade Merge','종류 합성':'Type Merge','마왕 깨우기':'Wake the King','브릭':'Brick','토르크':'Dork','뽀득':'Ppodeuk','고비':'Gobi','찌릿':'Jjit','루프':'Loop','나비':'Nabi','보니':'Boni','덥석':'Deopseok','적용 중':'Applied','미채용':'Not Hired','닫기':'Close'};
    const byButton={'ref-menu-help':'How to Play','menu-training':'Permanent Training','reset':'Restart Current Run','power-save-toggle':'Power Saver · 30 FPS','compact-fx-toggle':'Compact Skill Effects','save-transfer-open':'Save Backup and Transfer','menu-story':'Story Collection','sfx-toggle':'Turn Sound Effects Off','bgm-toggle':'Turn Background Music Off','roster-tab-staff':'Hired Staff','roster-tab-incoming':'Not Hired','roster-tab-merc':'Support Heroes','skill':'Use Skill','item-grade':'Grade Merge','item-kind':'Type Merge','item-king':'Wake the King','deck-close':'Done','training-tab-staff':'Employee Training','training-tab-merc':'Support Hero Training','pause-guide':'How to Play','pause-home':'Return to Lobby','pause-continue':'Continue Shift','result-training':'Train with Rewards','shop-to-roster':'Staff Archive','buy-staff-pack':'120 Coins · Open Recruitment Pack','buy-grade':'20 Coins','buy-kind':'30 Coins','buy-king':'50 Coins','trial-play':'Try in Battle','support-recruit-specific':'Recruit this Support Hero'};
    const b=p.closest('button');
    value=words[old]||value;
    if(b&&byButton[b.id])value=byButton[b.id];
    if(p.closest('#summon'))value=old.replace('소환','Summon');
    if(p.closest('.staff-action'))value='Remove from Duty Roster';
    if(!value&&b)value='View Details';
   }

   if(!value){if(p.closest('.pass-open,.training-character-title b,.dossier-hero h3'))value='Emergency Facilities Specialist';else if(p.closest('.pass-role,.pass-meta,.pass-job,.training-character-title>span'))value='Currently Assigned to Night Duty';else if(p.closest('h1,h2,h3'))value='Night Shift Employee Operations';else if(p.closest('button,summary'))value='View Additional Staff Information';else{const words='Additional night shift staff support details apply to all members of the current duty group including newly recruited employees'.split(' ');value=words.slice(0,Math.min(words.length,Math.max(4,Math.ceil(old.length*.25)))).join(' ');}}
   textChanges.push([n,n.textContent]);n.textContent=value;
  }
 }
 if(mode!=='ko100'){
  const els=[scope,...scope.querySelectorAll('*')].filter(e=>e.getClientRects().length&&!e.closest('[hidden],#gm-test-panel')&&!e.matches('img,canvas,svg,path,script,style'));
  const sizes=els.map(e=>[e,parseFloat(getComputedStyle(e).fontSize)]);
  for(const [e,size]of sizes)if(size>0){styleChanges.push([e,e.getAttribute('style')]);e.style.fontSize=(size*1.3)+'px';}
 }
};
