'use strict';
// Board removal never generates SP or changes recruitment/ownership.
window.BoardRecycle=(()=>{
 let armed=null,button=null,empty=null;
 const english=()=>document.documentElement?.lang?.startsWith('en');
 const nameOf=unit=>window.GameLanguage?.t?.(kinds[unit.type].name)||kinds[unit.type].name;
 const allowed=()=>playing&&!ended&&!paused&&!tutorialMode&&!itemMode&&!window.TutorialCoach?.held?.()&&GameSession.canWrite();
 function discard(index,confirm=false){
  const unit=board[index];if(!allowed()||!unit||!Number.isInteger(index))return false;
  if(unit.pip>=3&&(!confirm||armed!==unit)){armed=unit;selected=index;say(english()?'★'+unit.pip+' '+nameOf(unit)+' · Press again to discard. No SP is returned.':'★'+unit.pip+' '+kinds[unit.type].name+' · 버리기를 한 번 더 누르면 제거돼요. SP는 돌려받지 않아요.');refresh();return false;}
  board[index]=null;selected=-1;drag=null;armed=null;window.TacticalDuty?.hidePreview();
  burst('staffExit',cells[index].x,cells[index].y,kinds[unit.type].color,.5,{sprite:kinds[unit.type].file,staffType:unit.type,pip:unit.pip});say(english()?nameOf(unit)+' discarded · +1 empty slot · No SP returned.':kinds[unit.type].name+' 퇴장 · 빈자리 +1');sync();saveActiveRun();return true;
 }
 function refresh(){
  const en=english();
  if(empty){uiProp(empty,'hidden',board.some(Boolean));uiText(empty,en?'Summon staff onto the board to upgrade them.':'보드에 직원을 소환하면 강화할 수 있어요.')}
  if(!button)return;
  const u=board[drag?.from]||board[selected];
  if(armed!==u)armed=null;
  uiProp(button,'hidden',!u);uiProp(button,'disabled',!allowed()||!u);
  const confirmation=String(!!armed);if(button.dataset.armed!==confirmation)button.dataset.armed=confirmation;
  uiText(button.querySelector('span'),en?(armed?'Sure?':'Trash'):(armed?'확인':'버리기'));
  uiAttr(button,'aria-label',en?(u?(armed?'Confirm discard of ':'Discard ')+nameOf(u)+' · rank '+u.pip+' · No SP returned':'Select staff to discard'):(u?(armed?'다시 눌러 ':'')+kinds[u.type].name+' '+u.pip+'등급 버리기 · SP 반환 없음':'직원을 선택한 뒤 버리기'));
 }

 function drop(e,index){if(!button||!allowed())return false;const r=button.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)return false;selected=index;discard(index,true);refresh();return true;}
 if(typeof document.createElement==='function'){
  empty=document.createElement('p');empty.id='equipment-empty';empty.textContent='보드에 직원을 소환하면 강화할 수 있어요.';document.querySelector('#cards').before(empty);
  button=document.createElement('button');button.id='board-trash';button.type='button';button.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 6h16M9 6V3h6v3M6 6l1 15h10l1-15M10 10v7m4-7v7" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg><span>버리기</span>';
  document.querySelector('.skill-row').append(button);button.onclick=()=>discard(selected,true);
  const oldSkill=syncSkill;syncSkill=function(){oldSkill();refresh()};refresh();
  window.GameLanguage?.subscribe(refresh);
 }
 return {discard,drop,refresh};
})();
// The winner is part of the saved reward bundle. Animation never rolls the prize.
window.RewardRoulette=(()=>{
 let bundle=null,timer=null,ready=false,status=null,claim=null;
 function stop(){if(timer!==null)clearTimeout(timer);timer=null;}
 function render(){
  if(!claim||!bonusPending||!rewardBundle)return;
  const active=rewardBundle,en=document.documentElement.lang.startsWith('en'),root=document.querySelector('#perk-options');
  const cards=active.offers.map(o=>document.querySelector('#perk-'+o.id));
  const dialog=document.querySelector('#perk');dialog.classList.add('reward-roulette');dialog.classList.toggle('reward-choice',active.mode==='choice');status.hidden=false;claim.hidden=false;
  if(active.mode==='choice'){
   stop();bundle=active;ready=true;
   dialog.querySelector('h2').textContent=en?'Choose your shift bonus':'당직 보너스 선택';
   document.querySelector('#perk-intro').textContent=en?'Wave '+wave+' cleared · Choose one of three':wave+'웨이브 돌파 · 원하는 보상 1개 선택';
   document.querySelector('#perk-note').textContent=en?'Your choice is saved. Strategies offer another choice; only one strategy per shift.':'선택 상태 저장 · 전략은 세부 선택 가능 · 당직 전략은 한 판에 1개';
   cards.forEach((c,i)=>{c.disabled=!rewardEligible(active.offers[i]);c.tabIndex=0;c.dataset.lit=String(active.selection===i);c.dataset.winner='false';c.setAttribute('aria-pressed',String(active.selection===i));c.onclick=()=>selectRewardOffer(i)});
   const selected=active.offers[active.selection];claim.disabled=!selected||!rewardEligible(selected);
   claim.textContent=selected?.id==='build'?(en?'Choose a strategy':'전략 고르기'):(en?'Receive & continue':'선택한 보상 받기');
   status.textContent=selected?(en?'Selected: ':'선택: ')+rewardCopy(selected)[0]:(en?'Pick the reward you need.':'필요한 보상을 눌러주세요.');
   if(window.TacticalDuty?.choosingBuild()){window.TacticalDuty.showBuildChoices();status.hidden=true;claim.hidden=true}
   return;
  }
  document.querySelector('#perk h2').textContent=en?'Lucky shift bonus':'당직 보너스 룰렛';
  document.querySelector('#perk-intro').textContent=en?'Wave '+wave+' cleared · one prize, no blanks':wave+'웨이브 돌파 · 꽝 없이 보상 1개';
  document.querySelector('#perk-note').textContent=en?'Each ticket has a 1/3 chance. The result is saved; reloading cannot reroll it.':'각 보상 당첨 확률 1/3 · 추첨 결과 저장 · 새로고침해도 결과 유지';
  for(const c of cards){c.disabled=true;c.tabIndex=-1;c.removeAttribute('aria-pressed')}
  if(bundle!==active){stop();bundle=active;ready=false;saveActiveRun();}
  const paint=index=>cards.forEach((c,i)=>{c.dataset.lit=String(i===index);c.dataset.winner=String(ready&&i===active.winner)});
  const finish=()=>{if(bundle!==active||!bonusPending)return;ready=true;paint(active.winner);const copy=rewardCopy(active.offers[active.winner]);status.textContent=(en?'Winner! ':'당첨! ')+copy[0]+' · '+copy[1];claim.disabled=false;claim.textContent=en?'Receive & continue':'보상 받고 계속';};
  if(ready){finish();return}claim.disabled=true;claim.textContent=en?'Drawing…':'추첨 중…';status.textContent=en?'Which bonus will it be?':'이번 당직 보너스는?';
  if(timer!==null)return;
  let step=0;const count=15+active.winner;
  const tick=()=>{timer=null;if(bundle!==active||!bonusPending)return;paint(step%3);if(step++>=count){finish();return}timer=setTimeout(tick,65+step*8);};
  if(matchMedia('(prefers-reduced-motion: reduce)').matches){timer=setTimeout(finish,300)}else tick();
 }
 function take(){if(!ready||bundle!==rewardBundle||!bonusPending||!GameSession.canWrite())return false;const offer=bundle.offers[bundle.mode==='choice'?bundle.selection:bundle.winner];if(!offer)return false;if(bundle.mode==='choice'&&offer.id==='build'){const opened=window.TacticalDuty.showBuildChoices();if(opened){status.hidden=true;claim.hidden=true}return opened}const ok=choosePerk(offer.id);if(ok){stop();bundle=null;ready=false;}return ok;}
 if(typeof document.createElement==='function'){
  status=document.createElement('p');status.id='roulette-status';status.setAttribute('role','status');status.setAttribute('aria-live','polite');
  claim=document.createElement('button');claim.id='roulette-claim';claim.type='button';claim.onclick=take;
  const root=document.querySelector('#perk-options');root.before(status);root.after(claim);
  const old=renderPerkChoices;renderPerkChoices=function(){old();render()};
 }
 return {render,take};
})();
