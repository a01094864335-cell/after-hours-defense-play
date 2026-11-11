'use strict';
// Presentation only: original story controllers own pages, rewards and saves.
(()=>{
 if(typeof ResizeObserver==='undefined')return;
 const attached=new WeakSet();
 const focusPoints={"hiring-stories/bat-nurse/01.webp":0,"hiring-stories/chalkak-photographer/03.webp":0,"hiring-stories/nightmare-counselor/03.webp":0,"hiring-stories/merc-q/02.webp":10,"hiring-stories/merc-q/03.webp":10,"hiring-stories/bongtu-postmaster/03.webp":10,"hiring-stories/merc-rescue/03.webp":10,"hiring-stories/merc-accountant/03.webp":10,"castle-stories/chair-project/03.webp":0,"castle-stories/clean-floor/02.webp":10,"castle-stories/clean-floor/03.webp":5,"castle-stories/clean-floor/04.webp":5,"comic/03-emergency-staff.webp":0,"comic/04-night-duty.webp":70,"castle-stories/shortcut-trap/03.webp":85,"castle-stories/shortcut-trap/04.webp":0,"castle-stories/rain/02.webp":0,"castle-stories/same-place-tomorrow/03.webp":0,"castle-stories/counseling/03.webp":0,"castle-stories/counseling/04.webp":10,"castle-stories/shift-handoff/04.webp":10,"castle-stories/parcel/01.webp":0,"castle-stories/cape/03.webp":10,"castle-stories/cape/04.webp":10,"castle-stories/castle-flea-market/03.webp":8,"castle-stories/inventory/03.webp":10,"castle-stories/quiet-night/03.webp":80,"castle-stories/inspection/02.webp":20,"castle-stories/payday/01.webp":15,"castle-stories/payday/03.webp":10,"castle-stories/plant-duty/04.webp":10,"castle-stories/call-by-name/02.webp":10,"castle-stories/call-by-name/04.webp":15,"castle-stories/castle-sports/03.webp":20,"castle-stories/castle-sports/04.webp":20};
 function attach(dialog){
  if(attached.has(dialog))return;const art=dialog.querySelector('.comic-stage,.hire-art'),caption=dialog.querySelector('.comic-bottom,footer'),image=art?.querySelector('img');if(!art||!caption||!image)return;attached.add(dialog);
  const text=(full)=>document.documentElement.lang.startsWith('en')?(full?'Read story':'Full art'):(full?'대사 보기':'그림 전체');
  const button=document.createElement('button');button.type='button';button.className='story-art-toggle';button.textContent=text(false);button.setAttribute('aria-label','대사를 숨기고 그림 전체 보기');button.setAttribute('aria-pressed','false');dialog.append(button);
  function focus(){const path=new URL(image.src,location.href).pathname;const entry=Object.entries(focusPoints).find(([key])=>path.endsWith('/assets/'+key));dialog.style.setProperty('--story-focus','50% '+(entry?entry[1]:36)+'%');}
  const label=(full)=>document.documentElement.lang.startsWith('en')?(full?'Return to dialogue and story controls':'Hide dialogue and view full artwork'):(full?'대사와 이야기 조작으로 돌아가기':'대사를 숨기고 그림 전체 보기');
  function reset(){focus();dialog.classList.remove('story-art-expanded');button.setAttribute('aria-pressed','false');button.textContent=text(false);button.setAttribute('aria-label',label(false));}
  function size(){if(!dialog.open||dialog.classList.contains('story-art-expanded'))return;const top=art.getBoundingClientRect().top,edge=caption.getBoundingClientRect().top;dialog.style.setProperty('--story-art-height',Math.max(100,Math.round(edge-top+10))+'px');}
  new MutationObserver(()=>{button.textContent=text(dialog.classList.contains('story-art-expanded'));button.setAttribute('aria-label',label(dialog.classList.contains('story-art-expanded')))}).observe(document.documentElement,{attributes:true,attributeFilter:['lang']});
  button.onclick=()=>{const open=dialog.classList.toggle('story-art-expanded');button.setAttribute('aria-pressed',String(open));button.textContent=text(open);button.setAttribute('aria-label',label(open));if(!open)size()};
  const resize=new ResizeObserver(size);resize.observe(dialog);resize.observe(caption);
  new MutationObserver(changes=>{if(changes.some(x=>x.attributeName==='src')){reset();}requestAnimationFrame(size)}).observe(image,{attributes:true,attributeFilter:['src']});
  new MutationObserver(()=>{if(!dialog.open)reset();else requestAnimationFrame(size)}).observe(dialog,{attributes:true,attributeFilter:['open']});
  dialog.addEventListener('keydown',e=>{if(e.key==='Escape'&&dialog.classList.contains('story-art-expanded')){e.preventDefault();e.stopImmediatePropagation();reset();size();button.focus()}},true);
  dialog.addEventListener('cancel',e=>{if(dialog.classList.contains('story-art-expanded')){e.preventDefault();reset();size();button.focus()}});
  reset();requestAnimationFrame(size);
 }
 function scan(){for(const id of ['promo','hiring-story']){const d=document.getElementById(id);if(d)attach(d)}}
 new MutationObserver(scan).observe(document.body,{childList:true});scan();
})();
