'use strict';
/* Explain the real failed merge, then spend its discount through the summon control. */
(()=>{
 if(typeof document.createElement!=='function')return;
 const q=s=>document.querySelector(s),guide=q('#guide'),next=q('#guide-next');
 const stages=['unseen','intro','offer','summon','done','skipped'];let stage=tutorialMode?'unseen':'done';
 const skip=document.createElement('button');skip.id='discount-tutorial-skip';skip.textContent='할인 연습 건너뛰기';skip.hidden=true;guide.append(skip);
 function clean(){guide.removeAttribute('data-discount-lesson');skip.hidden=true;next.textContent='알겠어요 · 계속하기'}
 function highlight(){q('#summon').classList.toggle('tutorial-target',tutorialMode&&stage==='summon'&&appScreen==='battle'&&!ended)}
 function persist(){highlight();saveActiveRun()}
 function display(){if(window.TutorialCoach?.speak){window.TutorialCoach.speak('반값 소환으로 빈자리를 채워라','방금 실패로 받은 할인을 써보거라.\n직원 소환 버튼을 누르면 표시된 반값만큼 SP를 쓴다. 할인은 한 번뿐이고, 다음 소환부터는 원래 가격으로 돌아온다.','직원 소환하기',()=>{stage='summon';if(!summonDiscount)summonDiscount=true;sp+=Math.max(0,summonPrice()-sp);sync();persist()});return;}guide.dataset.discountLesson=stage;skip.hidden=false;q('#guide-title').textContent='실패 보상 · 반값 소환';q('#guide-text').textContent='다음 유료 소환 1회가 반값입니다.';next.textContent='계속하기';if(!guide.open)guide.showModal();paused=true;sync()}

 function start(){if(!tutorialMode||stage!=='unseen')return false;stage='intro';display();persist();return true}
 function resume(){if(!tutorialMode||!['intro','offer'].includes(stage))return false;display();return true}
 function skipLesson(){stage='skipped';const ours=guide.hasAttribute('data-discount-lesson');clean();if(ours)guide.close();paused=false;sync();persist()}
 next.addEventListener('click',e=>{if(!guide.hasAttribute('data-discount-lesson'))return;e.preventDefault();e.stopImmediatePropagation();if(stage==='intro'){summonDiscount=true;sp+=Math.max(0,summonPrice()-sp);}stage='summon';clean();guide.close();paused=false;say('적이 멈춘 동안 반값 소환 버튼을 눌러보세요. 이번 할인은 1회만 적용돼요.');sync();persist()},true);
 skip.onclick=skipLesson;
 const previousSummon=summon;summon=function(){const before=cost,discounted=summonDiscount,price=summonPrice();previousSummon();if(tutorialMode&&stage==='summon'&&discounted&&!summonDiscount&&cost>before){stage='done';clean();window.TutorialCoach?.feedback('discount');say(price+' SP 반값 소환 완료! 다음 소환부터 기본 가격으로 돌아갑니다.');sync();persist()}};q('#summon').onclick=summon;
 const previousSync=sync;sync=function(){previousSync();highlight()};
 function validate(saved){if(saved!==null&&saved!==undefined&&(!saved||typeof saved!=='object'||!stages.includes(saved.stage)))throw Error('invalid discount tutorial')}
 window.DiscountTutorial={start,resume,skip:skipLesson,waitingForSummon:()=>tutorialMode&&stage==='summon',validate,snapshot:()=>({stage}),reset(enabled){stage=enabled?'unseen':'done';clean();highlight()},restore(saved){validate(saved);stage=saved?.stage??'done';clean();highlight()}};
})();
