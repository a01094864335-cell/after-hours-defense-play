'use strict';
// A tap remains one summon; a held pointer repeats only while the live battle accepts it.
(()=>{
 if(typeof document.addEventListener!=='function')return;
 const button=document.querySelector('#summon');if(!button?.addEventListener)return;
 let timer=null,pointer=null,repeated=false;
 const clear=()=>{if(timer!==null)clearTimeout(timer);timer=null;pointer=null;};
 const allowed=()=>appScreen==='battle'&&!ended&&!paused&&!document.hidden&&!button.disabled&&!document.querySelector('dialog[open]')&&!window.TutorialCoach?.speaking?.()&&(!window.TutorialCoach?.held?.()||window.DiscountTutorial?.waitingForSummon?.());
 function repeat(){if(pointer===null||!allowed()){clear();return}repeated=true;summon();if(allowed())timer=setTimeout(repeat,200);else clear();}
 button.style.touchAction='none';button.style.userSelect='none';
 button.addEventListener('pointerdown',e=>{if(e.button!==0||!e.isPrimary||!allowed())return;clear();repeated=false;pointer=e.pointerId;button.setPointerCapture?.(pointer);timer=setTimeout(repeat,350)});
 button.addEventListener('click',e=>{if(repeated||!allowed()){repeated=false;e.preventDefault();e.stopImmediatePropagation()}},true);
 for(const name of ['pointerup','pointercancel','lostpointercapture'])button.addEventListener(name,clear);
 button.addEventListener('contextmenu',e=>e.preventDefault());
 document.addEventListener('visibilitychange',clear);window.addEventListener('blur',clear);
})();
