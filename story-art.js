'use strict';
// Presentation only: original story controllers own pages, rewards and saves.
(()=>{
 if(typeof ResizeObserver==='undefined')return;
 const attached=new WeakSet();
 function attach(dialog){
  if(attached.has(dialog))return;const art=dialog.querySelector('.comic-stage,.hire-art'),caption=dialog.querySelector('.comic-bottom,footer'),image=art?.querySelector('img');if(!art||!caption||!image)return;attached.add(dialog);
  const text=(full)=>document.documentElement.lang.startsWith('en')?(full?'Read story':'Full art'):(full?'대사 보기':'그림 전체');
  const button=document.createElement('button');button.type='button';button.className='story-art-toggle';button.textContent=text(false);button.setAttribute('aria-label','대사를 숨기고 그림 전체 보기');button.setAttribute('aria-pressed','false');dialog.append(button);
  function reset(){dialog.classList.remove('story-art-expanded');button.setAttribute('aria-pressed','false');button.textContent=text(false);button.setAttribute('aria-label','대사를 숨기고 그림 전체 보기');}
  function size(){if(!dialog.open||dialog.classList.contains('story-art-expanded'))return;const top=art.getBoundingClientRect().top,edge=caption.getBoundingClientRect().top;dialog.style.setProperty('--story-art-height',Math.max(100,Math.round(edge-top+10))+'px');}
  new MutationObserver(()=>{button.textContent=text(dialog.classList.contains('story-art-expanded'))}).observe(document.documentElement,{attributes:true,attributeFilter:['lang']});
  button.onclick=()=>{const open=dialog.classList.toggle('story-art-expanded');button.setAttribute('aria-pressed',String(open));button.textContent=text(open);button.setAttribute('aria-label',open?'대사와 이야기 조작으로 돌아가기':'대사를 숨기고 그림 전체 보기');if(!open)size()};
  const resize=new ResizeObserver(size);resize.observe(dialog);resize.observe(caption);
  new MutationObserver(changes=>{if(changes.some(x=>x.attributeName==='src')){reset();}requestAnimationFrame(size)}).observe(image,{attributes:true,attributeFilter:['src']});
  new MutationObserver(()=>{if(!dialog.open)reset();else requestAnimationFrame(size)}).observe(dialog,{attributes:true,attributeFilter:['open']});
  dialog.addEventListener('keydown',e=>{if(e.key==='Escape'&&dialog.classList.contains('story-art-expanded')){e.preventDefault();e.stopImmediatePropagation();reset();size();button.focus()}},true);
  dialog.addEventListener('cancel',e=>{if(dialog.classList.contains('story-art-expanded')){e.preventDefault();reset();size();button.focus()}});
  requestAnimationFrame(size);
 }
 function scan(){for(const id of ['promo','hiring-story']){const d=document.getElementById(id);if(d)attach(d)}}
 new MutationObserver(scan).observe(document.body,{childList:true});scan();
})();
