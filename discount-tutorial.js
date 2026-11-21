'use strict';
/* Legacy module name retained for save compatibility; teach immediate merge SP recycling. */
(()=>{
 if(typeof document.createElement!=='function')return;
 const q=s=>document.querySelector(s),guide=q('#guide'),next=q('#guide-next');
 const stages=['unseen','intro','offer','summon','done','skipped'];let stage=tutorialMode?'unseen':'done';
 const skip=document.createElement('button');skip.id='discount-tutorial-skip';skip.textContent='회수 소환 연습 건너뛰기';skip.hidden=true;guide.append(skip);
 function clean(){guide.removeAttribute('data-discount-lesson');skip.hidden=true;next.textContent='알겠어요 · 계속하기'}
 function highlight(){q('#summon').classList.toggle('tutorial-target',tutorialMode&&stage==='summon'&&appScreen==='battle'&&!ended)}
 function persist(){highlight();saveActiveRun()}
 function display(){if(window.TutorialCoach?.speak){window.TutorialCoach.speak('회수한 운영비로 빈자리를 채워라','합성하면 성공해도 실패해도 운영비 일부가 바로 돌아온다.\n반환된 SP를 모아 새 동료를 불러보거라. 소환 가격은 같은 웨이브 구간에서 오르지 않는다.','직원 소환하기',()=>{stage='summon';sp+=Math.max(0,summonPrice()-sp);sync();persist()});return;}guide.dataset.discountLesson=stage;skip.hidden=false;q('#guide-title').textContent='합성 회수 · 다시 소환';q('#guide-text').textContent='합성하면 소환 비용의 40%를 SP로 돌려받아요.';next.textContent='계속하기';if(!guide.open)guide.showModal();paused=true;sync()}

 function start(){if(!tutorialMode||stage!=='unseen')return false;stage='intro';display();persist();return true}
 function resume(){if(!tutorialMode||!['intro','offer'].includes(stage))return false;display();return true}
 function skipLesson(){stage='skipped';const ours=guide.hasAttribute('data-discount-lesson');clean();if(ours)guide.close();paused=false;sync();persist()}
 next.addEventListener('click',e=>{if(!guide.hasAttribute('data-discount-lesson'))return;e.preventDefault();e.stopImmediatePropagation();if(stage==='intro'){sp+=Math.max(0,summonPrice()-sp);}stage='summon';clean();guide.close();paused=false;say('회수한 SP로 직원을 소환해 빈자리를 채워보세요.');sync();persist()},true);
 skip.onclick=skipLesson;
 const previousSummon=summon;summon=function(){const before=cost,price=summonPrice();previousSummon();if(tutorialMode&&stage==='summon'&&cost>before){stage='done';clean();window.TutorialCoach?.feedback('discount');say(price+' SP 소환 완료! 합성으로 자리를 만들고 다시 소환해보세요.');sync();persist()}};q('#summon').onclick=summon;
 const previousSync=sync;sync=function(){previousSync();highlight()};
 function validate(saved){if(saved!==null&&saved!==undefined&&(!saved||typeof saved!=='object'||!stages.includes(saved.stage)))throw Error('invalid discount tutorial')}
 window.DiscountTutorial={start,resume,skip:skipLesson,waitingForSummon:()=>tutorialMode&&stage==='summon',validate,snapshot:()=>({stage}),reset(enabled){stage=enabled?'unseen':'done';clean();highlight()},restore(saved){validate(saved);stage=saved?.stage??'done';clean();highlight()}};
})();
