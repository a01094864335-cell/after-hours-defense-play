'use strict';
// Presentation metadata only. Existing nodes, event handlers and game state own behavior.
(() => {
  if(typeof document.createDocumentFragment !== 'function')return;
  document.documentElement.classList.add('gameworld');
  const themes={
    roster:['staff','인사기록부'],deck:['staff','당직 편성'],
    'training-dialog':['sword','야간 훈련소'],equipment:['gear','장비 지급소'],
    shop:['shop','야간 파견 상점'],result:['moon','당직 보고서'],
    'story-archive':['book','성의 이야기'],'journey-dialog':['scroll','근무 기록'],
    'daily-events-dialog':['moon','오늘의 변주'],info:['help','근무 안내'],
    menu:['gear','당직 메뉴'],leave:['home','당직 종료'],
    guide:['book','신입 연수'],perk:['lightning','정비 보너스'],
    'save-transfer-dialog':['scroll','기록 보관'],'recruit-dialog':['staff','새로운 동료'],
    'starter-choice':['staff','첫 근무 명단'],'staff-trial':['sword','직원 연습'],
    'hiring-story':['book','첫 출근 기록']
  };
  function decorate(root){
    if(!(root instanceof Element))return;
    for(const el of [root,...root.querySelectorAll('dialog,#result')]){
      const theme=themes[el.id];
      if(!theme||el.dataset.worldIcon)continue;
      el.dataset.worldIcon=theme[0];
      el.style.setProperty('--world-icon',`url("assets/ui-v2/icons/${theme[0]}.svg")`);
    }
  }
  decorate(document.body);
  new MutationObserver(records=>{
    for(const record of records)for(const node of record.addedNodes)if(node instanceof Element)decorate(node);
  }).observe(document.body,{childList:true,subtree:true});
})();
