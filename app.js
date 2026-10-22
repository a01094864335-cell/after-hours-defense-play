'use strict';
let appScreen='lobby',panelResume=false,leaveResume=false;
function setScreen(screen){appScreen=screen;for(const id of ['lobby','battle','result'])uiProp(document.querySelector('#'+id),'hidden',id!==screen)}
function appRender(){if(document.querySelector('#equipment').open)uiText(document.querySelector('#equipment-balance'),'보유 '+Math.floor(sp)+' SP · 같은 종류 전체 강화');uiText(document.querySelector('#battle-merc'),activeMerc?'지원 · '+mercCatalog[activeMerc].name:'');if(ended&&runReward)appScreen='result';setScreen(appScreen);uiProp(document.querySelector('#start'),'hidden',playing);uiText(document.querySelector('#pause'),paused?'▶':'Ⅱ');uiAttr(document.querySelector('#pause'),'aria-label',paused?'계속하기':'일시정지');if(typeof GameSkin!=='undefined')GameSkin.refresh()}

function openSheet(id){panelResume=playing&&!paused&&!ended;if(panelResume)paused=true;sync();document.querySelector('#'+id).showModal()}
for(const id of ['equipment','info','menu'])document.querySelector('#'+id).addEventListener('close',()=>{if(panelResume&&!ended)paused=false;panelResume=false;sync()});
document.querySelector('#equipment-close').onclick=()=>document.querySelector('#equipment').close();document.querySelector('#info-close').onclick=()=>document.querySelector('#info').close();document.querySelector('#menu-close').onclick=()=>document.querySelector('#menu').close();
document.querySelector('#upgrade-open').onclick=()=>openSheet('equipment');document.querySelector('#skill-help').onclick=()=>openSheet('info');document.querySelector('#help-open').onclick=()=>openSheet('info');document.querySelector('#menu-open').onclick=()=>openSheet('menu');
document.querySelector('#menu-story').onclick=()=>{document.querySelector('#menu').close();document.querySelector('#story-open').onclick()};
document.querySelector('#enter-battle').onclick=()=>{setScreen('battle');promoIndex=0;showPromo();sync()};
function restartTo(target){if(ended&&runReward&&!runReward.paid){settleRun();if(!runReward.paid)return}reset();setScreen(target);if(target==='battle'){promoIndex=0;showPromo()}sync()}
document.querySelector('#reset').onclick=()=>{document.querySelector('#menu').close();if(playing&&!ended)askLeave();else restartTo('lobby')};
document.querySelector('#result-again').onclick=()=>restartTo('battle');document.querySelector('#result-home').onclick=()=>restartTo('lobby');
function askLeave(){leaveResume=playing&&!paused&&!ended;if(leaveResume)paused=true;sync();document.querySelector('#leave').showModal()}
document.querySelector('#battle-back').onclick=()=>{if(playing&&!ended)askLeave();else setScreen('lobby')};
document.querySelector('#leave-cancel').onclick=()=>document.querySelector('#leave').close();document.querySelector('#leave').addEventListener('close',()=>{if(leaveResume&&!ended)paused=false;leaveResume=false;sync()});
document.querySelector('#leave-confirm').onclick=()=>{document.querySelector('#leave').close();restartTo('lobby')};
setScreen('lobby');sync();
function fitBoard(){const area=document.querySelector('.board-stage'),rect=area.getBoundingClientRect();if(rect.width>12&&rect.height>0){const size=Math.floor(Math.min(rect.width-12,rect.height));if(canvas.style.width!==size+'px')canvas.style.width=size+'px';if(canvas.style.height!==size+'px')canvas.style.height=size+'px';GamePerformance.boardWidth=size;GamePerformance.invalidate()}}
if(typeof ResizeObserver!=='undefined'){const boardObserver=new ResizeObserver(fitBoard);boardObserver.observe(document.querySelector('.board-stage'))}
if(typeof window.addEventListener==='function')window.addEventListener('resize',fitBoard);
fitBoard();

// Lobby codex and shop categories expose only implemented content.
const roles=['단일 공격','범위 공격','이동 방해','운영비 생산','연쇄 공격','관통 공격'];
function shopTab(tab){document.querySelector('#shop-items').hidden=tab!=='items';document.querySelector('#shop-mercs').hidden=tab!=='mercs';document.querySelector('#shop-tab-items').classList.toggle('active',tab==='items');document.querySelector('#shop-tab-mercs').classList.toggle('active',tab==='mercs')}
document.querySelector('#shop-tab-items').onclick=()=>shopTab('items');document.querySelector('#shop-tab-mercs').onclick=()=>shopTab('mercs');shopTab('items');

document.querySelector('#quick-story').onclick=()=>document.querySelector('#story-open').onclick();document.querySelector('#quick-help').onclick=()=>document.querySelector('#help-open').onclick();
