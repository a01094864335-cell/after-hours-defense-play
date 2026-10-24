'use strict';
(()=>{
 if(typeof document.createElement!=='function')return;
 const q=s=>document.querySelector(s);
 let metaKey='',progressKey='';
 const previousMeta=renderMeta;renderMeta=function(){
  const key=JSON.stringify([meta.coins,meta.items,meta.owned,meta.equipped,meta.deck,meta.staff,meta.recruitPoints,meta.training,expansionState,runTraining,trainingItems,playing,paused,ended,itemMode,activeMerc,wardChargesUsed,Math.ceil(mercTimer||0),enemies.some(e=>e.hp>0),kingEvent.state,saveWarning,appScreen,q('#shop').open,q('#training-dialog').open]);
  if(key===metaKey)return;metaKey=key;previousMeta();
 };
 const previousProgress=renderProgress;renderProgress=function(){
  const key=JSON.stringify([meta.tutorialComplete,meta.deck,playing,ended,wave,tutorialMode,tutorialWon,dailyRule,dailyEnabled,dailyDate,bossPlans]);
  if(key===progressKey)return;progressKey=key;previousProgress();
 };
 const previousSync=sync;sync=function(){previousSync();GamePerformance.invalidate()};
 const button=document.createElement('button');button.id='power-save-toggle';button.type='button';q('#menu').insertBefore(button,q('#menu-close'));
 const label=()=>{uiText(button,GamePerformance.lowPower?'절전 모드 켜짐 · 30 FPS':'부드러운 화면 · 60 FPS');uiAttr(button,'aria-pressed',GamePerformance.lowPower)};
 button.onclick=()=>GamePerformance.setMode(!GamePerformance.lowPower);document.addEventListener('power-mode-change',label);label();
 new MutationObserver(records=>{
  if(records.some(r=>r.type==='attributes'&&r.target.tagName==='DIALOG'))sync();
  GamePerformance.invalidate();
 }).observe(document.body,{subtree:true,childList:true,attributes:true,attributeFilter:['open']});
 GamePerformance.invalidate();
})();
