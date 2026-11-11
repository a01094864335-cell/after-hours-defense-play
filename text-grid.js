'use strict';
// Shared text safe areas. Real state, handlers and scroll containers stay native.
(()=>{
 if(!document.currentScript||typeof document.createElement!=='function')return;
 const base=new URL('.',document.currentScript.src),seen=new WeakSet(),sheet=document.querySelector('link[href*="text-grid.css"]')?.href||new URL('text-grid.css',base).href;
 function enhance(scope){
  const hero=scope.querySelector('#asset-shop .hero-stage');
  if(hero&&!hero.querySelector('.grid-shop-hero')){
   const art=hero.querySelector('svg.hero');if(art)art.style.display='none';
   const image=document.createElement('img');image.className='grid-shop-hero';image.src=new URL('assets/text-grid/shop-hero-wordless.webp',base).href;image.alt='';
   const eyebrow=document.createElement('span');eyebrow.className='grid-shop-eyebrow';eyebrow.textContent='새 동료를 만나보세요!';
   const title=document.createElement('strong');title.className='grid-shop-title';title.textContent='영웅 채용팩';
   hero.append(image,eyebrow,title);
  }
  const hint=scope.querySelector('#asset-training #hint'),remaining=scope.querySelector('#asset-training #remaining');
  if(hint&&remaining){const duplicate=hint.textContent.trim()===remaining.textContent.trim();if(hint.hidden!==duplicate)hint.hidden=duplicate;}
  const wallet=scope.querySelector('#asset-lobby #a-coins');
  if(wallet){const count=Number((wallet.parentElement.getAttribute('aria-label')||wallet.textContent).replace(/[^\d]/g,''));if(Number.isFinite(count)&&count>=10000){wallet.title=count.toLocaleString();wallet.setAttribute('aria-label',count.toLocaleString());const compact=new Intl.NumberFormat(document.documentElement.lang.startsWith('en')?'en':'ko-KR',{notation:'compact',maximumFractionDigits:1}).format(count);if(wallet.textContent!==compact)wallet.textContent=compact;}}
  const heading=scope.querySelector('#asset-lobby .a-roster h2');
  const label=heading&&[...heading.childNodes].find(n=>n.nodeType===3&&n.textContent.includes('오늘의 근무 직원'));
  if(label)label.textContent=label.textContent.replace('오늘의 근무 직원','오늘의 당직');
  const lobby=scope.querySelector('#asset-lobby');
  if(lobby&&!lobby.querySelector('.grid-english-logo')){const logo=document.createElement('div');logo.className='grid-english-logo';logo.setAttribute('aria-label','After Hours Defense');logo.innerHTML='<span>AFTER HOURS</span><strong>DEFENSE</strong>';lobby.append(logo);}
 }
 function refresh(){enhance(document);for(const id of ['asset-lobby-host','asset-roster-host','asset-shop-host','asset-training-host']){const root=document.getElementById(id)?.shadowRoot;if(!root)continue;if(!seen.has(root)){seen.add(root);const link=document.createElement('link');link.rel='stylesheet';link.href=sheet;root.append(link);observer.observe(root,{childList:true,subtree:true});}enhance(root);}}
 let queued=false;const observer=new MutationObserver(()=>{if(queued)return;queued=true;queueMicrotask(()=>{queued=false;refresh()})});observer.observe(document.body,{childList:true,subtree:true});refresh();
})();
