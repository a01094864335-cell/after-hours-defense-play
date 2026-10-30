'use strict';
/* Keep artwork frames stationary; only their content scrolls. */
(()=>{
 if(typeof document.createElement!=='function')return;
 const dailyClose=document.querySelector('#daily-events-close');if(dailyClose){dailyClose.setAttribute('aria-label','변주 목록 닫기');dailyClose.textContent='×';}
 const layouts={
  'daily-events-dialog':'.sheet-head',equipment:'.sheet-head,#equipment-balance',
  info:'h2,#info-close',menu:'h2,#menu-close',leave:'h2,#leave-confirm,#leave-cancel',
  shop:'.sheet-head,#shop-wallet,#shop-status,.shop-tabs',
  'story-archive':'.sheet-head,#story-progress',guide:'#guide-title,#guide-next,#discount-tutorial-skip',
  perk:'#perk-back',deck:'.sheet-head',
  'journey-dialog':':first-child','save-transfer-dialog':':first-child,#save-restore'
 };
 function wrap(dialog,keep){
  if(!dialog)return;
  let body=dialog.querySelector(':scope > .panel-scroll-body');
  if(!body){body=document.createElement('div');body.className='panel-scroll-body';const content=[...dialog.children].filter(e=>!e.matches(keep));if(!content.length)return;content[0].before(body);body.append(...content);}
  for(const child of [...dialog.children])if(child!==body&&!child.matches(keep))body.append(child);
  dialog.classList.add('contained-panel');
 }
 function detail(){
  const d=document.querySelector('#roster-detail');if(!d||d.hidden||d.querySelector(':scope > .panel-scroll-body'))return;
  const actions=d.querySelector(':scope > .live-dossier-actions')||document.createElement('div');actions.className='live-dossier-actions';
  actions.append(...d.querySelectorAll(':scope > .staff-action,:scope > #detail-action-status'));
  const body=document.createElement('div');body.className='panel-scroll-body';body.append(...[...d.children].filter(e=>e!==actions));d.append(body);if(actions.children.length)d.append(actions);
 }
 function refresh(){const restore=document.querySelector('#save-restore'),save=document.querySelector('#save-transfer-dialog');if(restore&&save&&restore.parentElement!==save)save.append(restore);const reveal=document.querySelector('.recruit-reveal');if(reveal?.querySelector('.ref-recruit-actions'))wrap(reveal,'.ref-recruit-actions');for(const [id,keep]of Object.entries(layouts))wrap(document.getElementById(id),keep);detail();}
 let queued=false;new MutationObserver(()=>{if(queued)return;queued=true;queueMicrotask(()=>{queued=false;refresh()})}).observe(document.body,{childList:true,subtree:true});refresh();
})();
