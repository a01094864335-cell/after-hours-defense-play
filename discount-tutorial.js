'use strict';
/* The failure is an explicitly labelled model; the discounted summon is real. */
(()=>{
 if(typeof document.createElement!=='function')return;
 const q=s=>document.querySelector(s),guide=q('#guide'),next=q('#guide-next');
 const stages=['unseen','intro','offer','summon','done','skipped'];
 let stage=tutorialMode?'unseen':'done';
 const model=document.createElement('div');model.id='discount-practice';model.hidden=true;
 model.innerHTML='<small>연습 모형 · 실제 직원 소모 없음</small><div><figure><img src="assets/mobile/lobby-gobi.webp" alt="연습 직원 A"><figcaption>직원 A</figcaption></figure><span aria-hidden="true">＋</span><figure><img src="assets/mobile/lobby-gobi.webp" alt="연습 직원 B"><figcaption>직원 B</figcaption></figure></div>';
 guide.insertBefore(model,next);
 const skip=document.createElement('button');skip.id='discount-tutorial-skip';skip.textContent='이 안내 건너뛰기';skip.hidden=true;guide.append(skip);
 function clean(){guide.removeAttribute('data-discount-lesson');model.hidden=true;skip.hidden=true;next.textContent='알겠어요 · 계속하기'}
 function highlight(){const target=tutorialMode&&stage==='summon'&&appScreen==='battle'&&!ended;if(q('#summon').classList.contains('tutorial-target')!==target)q('#summon').classList.toggle('tutorial-target',target)}
 function persist(){highlight();saveActiveRun()}
 function display(){
  guide.dataset.discountLesson=stage;model.hidden=false;skip.hidden=false;model.classList.toggle('example-failed',stage==='offer');
  q('#guide-title').textContent=stage==='intro'?'반값 소환 연습 · 1 / 3':'반값 소환 연습 · 2 / 3';
  q('#guide-text').textContent=stage==='intro'?'합성은 실패할 수도 있어요. 실전에서는 이동한 직원 1명이 사라지고, 다음 소환 1회가 50% 할인돼요. 먼저 연습 모형으로 실패 상황을 확인해보세요.':'실패 상황을 확인했어요. 다음 소환은 기본 '+summonBasePrice()+' SP 대신 '+summonPrice()+' SP예요. 실제 소환 버튼을 눌러 할인받아보세요.';
  next.textContent=stage==='intro'?'연습 모형으로 실패 확인':'반값 소환 해보기';
  if(!guide.open)guide.showModal();paused=true;sync();
 }
 function start(){if(!tutorialMode||stage!=='unseen')return false;stage='intro';display();persist();return true}
 function resume(){if(!tutorialMode||!['intro','offer'].includes(stage))return false;display();return true}
 next.addEventListener('click',e=>{
  if(!guide.hasAttribute('data-discount-lesson'))return;
  e.preventDefault();e.stopImmediatePropagation();
  if(stage==='intro'){
   stage='offer';summonDiscount=true;
   const assistance=Math.max(0,summonPrice()-sp);sp+=assistance;
   display();if(assistance>0)q('#guide-text').textContent+=' 연습에 필요한 '+assistance+' SP를 지원했어요.';persist();
  }else if(stage==='offer'){
   stage='summon';clean();guide.close();paused=false;say('빛나는 반값 소환 버튼을 눌러보세요. 자리가 가득 찼다면 합성으로 빈자리를 만드세요.');sync();persist();
  }
 },true);
 skip.onclick=()=>{stage='skipped';clean();guide.close();paused=false;sync();persist()};
 const previousSummon=summon;summon=function(){
  const before=cost,discounted=summonDiscount,price=summonPrice();previousSummon();
  if(tutorialMode&&stage==='summon'&&discounted&&!summonDiscount&&cost>before){
   stage='done';clean();showGuide('반값 소환 연습 · 3 / 3 완료',price+' SP로 직원을 소환했어요! 할인은 1회 사용됐고, 다음 소환은 기본 '+summonBasePrice()+' SP입니다. 합성에 실패해도 반값 소환으로 다시 전력을 채워보세요.');persist();
  }
 };
 q('#summon').onclick=summon;
 const previousSync=sync;sync=function(){previousSync();highlight()};
 function validate(saved){if(saved!==null&&saved!==undefined&&(!saved||typeof saved!=='object'||!stages.includes(saved.stage)))throw Error('invalid discount tutorial')}
 window.DiscountTutorial={start,resume,validate,snapshot:()=>({stage}),reset(enabled){stage=enabled?'unseen':'done';clean();highlight()},restore(saved){
  validate(saved);
  stage=saved?.stage??'done';clean();highlight();
 }};
})();
