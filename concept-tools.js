'use strict';
/* Object-specific presentation adapters; original controls and event handlers stay in place. */
(() => {
 if(typeof URL!=='function' || !document.currentScript || typeof document.createElement!=='function')return;
 const root=new URL('.',document.currentScript.src);
 const ids=['menu','info','leave','guide','perk','equipment','deck','daily-events-dialog','journey-dialog','save-transfer-dialog','story-archive'];
 function image(key){const i=document.createElement('img');i.src=new URL('assets/character-portraits/'+key+'.webp',root).href;i.alt='';i.className='concept-hero';i.setAttribute('aria-hidden','true');return i;}
 function decorate(panel,key,kind){const header=panel.querySelector(':scope > header,:scope > .sheet-head');if(!header||header.querySelector('.concept-hero'))return;const i=image(key);i.classList.add(kind);header.prepend(i);}
 function footer(panel,id,label,target){if(panel.querySelector('#'+id))return;const f=document.createElement('footer');f.className='ui-dialog-actions concept-footer';const b=document.createElement('button');b.id=id;b.type='button';b.textContent=label;b.addEventListener('click',()=>panel.querySelector(target)?.click());f.append(b);panel.append(f);}
 function refresh(){
  for(const id of ids){const p=document.getElementById(id);if(p)p.classList.add('concept-modal','concept-'+id);}
  const menu=document.getElementById('menu');if(menu){decorate(menu,'gobi','concept-sound-mascot');const h=menu.querySelector('header');if(h&&!h.querySelector('.concept-clip')){const clip=document.createElement('span');clip.className='concept-clip';clip.setAttribute('aria-hidden','true');h.append(clip);}}
  const guide=document.getElementById('guide');if(guide){
   decorate(guide,'ghost-courier','concept-courier');
   const header=guide.querySelector('header');
   if(header&&!header.querySelector('.concept-eyebrow')){const tag=document.createElement('span');tag.className='concept-eyebrow';tag.textContent='전달 메모';header.prepend(tag);}
   const resumed=guide.querySelector('#guide-title')?.textContent==='근무 이어하기';
   let team=guide.querySelector('.concept-resume-team');
   if(resumed&&typeof runDeck!=='undefined'&&typeof kinds!=='undefined'){
    if(!team){team=document.createElement('div');team.className='concept-resume-team';guide.querySelector('.panel-scroll-body').append(team);}
    const key=runDeck.join(',')+'|'+(typeof wave==='number'?wave:0);
    if(team.dataset.key!==key){team.dataset.key=key;team.replaceChildren();const badge=document.createElement('p');badge.textContent='저장된 근무 · WAVE '+(typeof wave==='number'?wave:0);team.append(badge);for(const type of runDeck){const record=kinds[type];if(record)team.append(image(record.file));}}
   }
   if(team)team.hidden=!resumed;
  }
  const perk=document.getElementById('perk');if(perk)decorate(perk,'gobi','concept-bonus-mascot');
  const equipment=document.getElementById('equipment');if(equipment){decorate(equipment,'orc-technician','concept-mechanic');footer(equipment,'concept-equipment-done','공방 나가기','#equipment-close');}
  const deck=document.getElementById('deck');if(deck)footer(deck,'concept-deck-done','편성 완료','#deck-close');
  const daily=document.getElementById('daily-events-dialog');if(daily)footer(daily,'concept-daily-done','확인했어요','#daily-events-close');
  for(const notice of document.querySelectorAll('dialog.notice-dialog')){notice.classList.add('concept-modal','concept-notice');decorate(notice,'gobi','concept-note-mascot');}
  // Existing help cards are populated by reference-ui; decorations never duplicate their copy.
  const steps=document.querySelectorAll('#info .ref-guide-step');
  const manual=document.querySelector('#info .help-content')||document.querySelector('#info .panel-scroll-body');if(manual&&steps.length&&!manual.dataset.conceptOrdered){manual.dataset.conceptOrdered='true';manual.prepend(...steps);}
  steps.forEach((step,index)=>{step.classList.add('concept-help-card');if(!step.querySelector('.concept-hero')){const art=step.querySelector(':scope > img');if(art){art.src=new URL('assets/character-portraits/'+['gobi','goblin-guard','electric-technician'][index%3]+'.webp',root).href;art.classList.add('concept-hero');art.alt='';}else step.prepend(image(['gobi','goblin-guard','electric-technician'][index%3]));}});
 }
 let queued=false;const schedule=()=>{if(queued)return;queued=true;queueMicrotask(()=>{queued=false;refresh();});};
 new MutationObserver(schedule).observe(document.body,{childList:true,subtree:true});refresh();
})();
