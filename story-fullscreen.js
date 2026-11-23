'use strict';
// Shared approved art skin; existing story controllers retain all navigation/save logic.
(()=>{
 if(typeof document.createElement!=='function'||typeof MutationObserver!=='function')return;
 const promo=document.querySelector('#promo');
 function setup(dialog){
  if(dialog.dataset.storySkin)return;dialog.dataset.storySkin='moonlight-bd-v1';
  if(dialog.id==='promo'){
   const head=dialog.querySelector('.comic-head'),chapter=dialog.querySelector('.comic-chapter'),count=dialog.querySelector('#promo-count'),speaker=dialog.querySelector('#promo-speaker'),copy=dialog.querySelector('.comic-copy');
   if(head&&chapter){head.prepend(chapter);if(count)chapter.prepend(count);const tag=document.createElement('span');tag.className='story-chapter-tag';tag.textContent='마왕성 야간 일지';chapter.prepend(tag)}
   if(copy&&speaker)copy.prepend(speaker);
   dialog.querySelector('#promo-skip').setAttribute('aria-label','이야기 건너뛰기');
  }else{dialog.querySelector('header small').textContent='첫 출근 기록';dialog.querySelector('[data-hire-close]').setAttribute('aria-label','이야기 닫기')}
  const nav=dialog.querySelector('.comic-nav,footer nav'),dots=document.createElement('span');dots.className='story-dots';dots.setAttribute('role','img');
  for(let i=0;i<4;i++)dots.append(document.createElement('i'));nav.children[0].after(dots);
  let queued=false;const update=()=>{if(queued)return;queued=true;queueMicrotask(()=>{queued=false;refresh(dialog)})};
  new MutationObserver(update).observe(dialog,{childList:true,subtree:true,characterData:true});refresh(dialog);
 }
 function refresh(dialog){
  const label=dialog.querySelector('#promo-count,.hire-page')?.textContent||'1 / 4',match=label.match(/(\d+)\s*\/\s*(\d+)/),page=match?Number(match[1]):1,total=match?Number(match[2]):4;
  const dots=dialog.querySelector('.story-dots');dots.setAttribute('aria-label',page+' / '+total+(document.documentElement.lang.startsWith('en')?' pages':' 페이지'));const progress=String(page).padStart(2,'0')+' / '+String(total).padStart(2,'0');if(dots.textContent!==progress)dots.textContent=progress;
  const next=dialog.querySelector('#promo-next,[data-hire-next]');if(next)next.dataset.last=String(page===total);
  const tag=dialog.querySelector('.story-chapter-tag');if(tag){const source=typeof currentCastleStory!=='undefined'&&currentCastleStory.original?'첫 당직 이야기':'마왕성 야간 일지',value=GameLanguage.t(source);if(tag.textContent!==value)tag.textContent=value}
 }
 if(promo)setup(promo);
 new MutationObserver(records=>{for(const r of records)for(const n of r.addedNodes)if(n.nodeType===1&&n.id==='hiring-story')setup(n)}).observe(document.body,{childList:true});
 const hire=document.querySelector('#hiring-story');if(hire)setup(hire);
})();
