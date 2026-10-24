'use strict';
// The gallery trial uses the real battle and the existing memory-only GM save.
function prepareNewHireTrial(support='banchang') {
 if(!GMTest.enabled||saveWarning||playing&&!ended||ended&&runReward&&!runReward.paid)return false;
 if(!NightExpansion.mercs.some(k=>k.id===support))return false;
 const staff=NightExpansion.staff.map(k=>k.id),mercs=NightExpansion.mercs.map(k=>k.id);
 if(!saveChange(d=>{
  d.staff=[...new Set([...d.staff,...staff])];
  d.owned=[...new Set([...d.owned,...mercs])];
  d.deck=staff.slice();d.equipped=support;d.tutorialComplete=true;
 }))return false;
 for(const dialog of document.querySelectorAll('dialog[open]'))dialog.close();
 clearActiveRun();reset();
 // Place the mail support in the middle, adjacent to two skill users.
 const order=[staff[0],staff[1],staff[4],staff[3],staff[2]];
 order.forEach((id,i)=>{
  const type=kinds.findIndex(k=>k.file===id);
  board[5+i]={type,pip:5,cool:0,attack:0,arrival:.5,income:5,skillCD:0};
  Motion.preload(id);
 });
 activeMerc=support;Motion.preload('merc-'+support);sp=1000;wave=4;selected=5;
 noteRoster();renderStaffArchive();sync();
 document.querySelector('#enter-battle').onclick();
 say('신규 동료 체험 · 5등급 직원 5명과 '+NightExpansion.mercs.find(k=>k.id===support).name+' 준비 완료! 당직 시작 후 직원을 눌러 고유 스킬을 써보세요.');
 return true;
}

(()=>{
 if(!GMTest.enabled||typeof document.createElement!=='function')return;
 const panel=document.querySelector('#gm-test-panel');if(!panel)return;
 const section=document.createElement('section');section.className='gm-new-hires';
 section.innerHTML='<strong>신규 동료 9종 · 인게임 체험</strong><p>5등급 직원 5명 · 1,000 SP · 5차부터 시작<br>지원 영웅을 골라 새 테스트판을 준비해요.</p><label for="gm-new-support">보드 밖 지원 영웅</label><select id="gm-new-support">'+NightExpansion.mercs.map(k=>'<option value="'+k.id+'">'+k.name+' · '+k.role+'</option>').join('')+'</select><button id="gm-new-prepare">신규 5인 + 지원 영웅으로 준비</button><p id="gm-new-status" role="status">일반 저장에는 해금·편성·보상이 반영되지 않아요.</p>';
 panel.querySelector('.gm-test-body').append(section);
 const choice=document.querySelector('#gm-new-support'),button=document.querySelector('#gm-new-prepare'),status=document.querySelector('#gm-new-status');
 choice.value='banchang';
 button.onclick=()=>{
  if(prepareNewHireTrial(choice.value)){panel.open=false;status.textContent='이야기를 넘긴 뒤 당직 시작을 누르세요. 직원 선택 → 고유 스킬로 효과를 확인할 수 있어요.';}
  else status.textContent='현재 판을 종료한 뒤 다시 준비할 수 있어요.';
 };
 const previous=renderMeta;renderMeta=function(){previous();button.disabled=!!saveWarning||playing&&!ended||ended&&runReward&&!runReward.paid;choice.disabled=button.disabled;};
 const params=new URLSearchParams(window.location.search);
 const exit=document.querySelector('#gm-test-exit'),url=new URL(exit.href);url.searchParams.delete('roster');url.searchParams.delete('support');exit.href=url.href;
 if(params.get('roster')==='new'){
  const requested=params.get('support');
  if(NightExpansion.mercs.some(k=>k.id===requested))choice.value=requested;
  button.onclick();
 }
})();
