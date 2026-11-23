'use strict';
/* Moonlit art direction. Original game modules retain state and event handlers. */
(()=>{
 if(typeof URL!=='function'||typeof document==='undefined'||!document.currentScript||!document.body||typeof document.body.attachShadow!=='function')return;
 const base=new URL('.',document.currentScript.src),url=p=>new URL(p,base).href;
 const roots=['asset-lobby-host','asset-roster-host','asset-shop-host','asset-training-host'].map(id=>document.getElementById(id)?.shadowRoot).filter(Boolean);
 const artSheet=document.querySelector('link[href*="moonlight-ui.css"]')?.href||url('moonlight-ui.css?v=20261123-art-1');
 for(const root of roots){const link=document.createElement('link');link.rel='stylesheet';link.href=artSheet;root.append(link)}
 const lobby=document.getElementById('asset-lobby-host')?.shadowRoot;
 if(lobby){
  const root=lobby.querySelector('#asset-lobby');lobby.querySelector('.a-world').src=url('assets/moonlight/lobby.webp');
  root.insertBefore(lobby.querySelector('.a-gobi'),lobby.querySelector('.a-bottom'));

  const gobi=lobby.querySelector('.a-gobi'),ground=document.createElement('span');ground.className='a-gobi-ground';ground.setAttribute('aria-hidden','true');root.insertBefore(ground,gobi);gobi.alt=GameLanguage.t('신입 고비');
  const dock=lobby.querySelector('.a-bottom');let dockHeight='';
  const placeGobi=()=>{const value=Math.round(dock.getBoundingClientRect().height)+'px';if(value!==dockHeight){dockHeight=value;root.style.setProperty('--lobby-dock-height',value)}};
  if(typeof ResizeObserver==='function')new ResizeObserver(placeGobi).observe(dock);else{window.addEventListener('resize',placeGobi);for(const sheet of lobby.querySelectorAll('link'))sheet.addEventListener('load',placeGobi)}
  placeGobi();
  const resume=lobby.querySelector('.a-resume');const update=()=>resume.hidden=resume.disabled;
  new MutationObserver(update).observe(resume,{attributes:true,attributeFilter:['disabled']});update();
 }
 const shop=document.getElementById('asset-shop-host')?.shadowRoot;
 if(shop){
  const stage=shop.querySelector('.hero-stage');const scene=document.createElement('div');scene.className='moon-shop-scene';
  scene.innerHTML='<img loading="lazy" decoding="async" class="grid-shop-hero moon-counter" alt="채용 봉투를 든 고비와 성문에서 달려오는 동료들"><h2 class="grid-shop-title">영웅 채용팩</h2>';
  stage.querySelectorAll('.grid-shop-hero,.grid-shop-title,.grid-shop-eyebrow').forEach(e=>e.remove());stage.append(scene);
  const hero=scene.querySelector('.moon-counter'),shortScreen=window.matchMedia?.('(max-height:650px)');
  function loadRecruitArt(){const wide=!!shortScreen?.matches;hero.dataset.sceneFormat=wide?'wide':'portrait';GamePerformance.loadOnDisplay(hero,url('assets/moonlight/'+(wide?'recruit-gate-rush-wide.webp':'recruit-gate-rush.webp')))}
  loadRecruitArt();shortScreen?.addEventListener?.('change',loadRecruitArt);
  stage.setAttribute('aria-label','새 동료를 맞이하는 성문 앞 영웅 채용팩');

 }
 document.documentElement.dataset.uiVersion='moonlight-20261119';
})();

/* Paid recruitment presentation: save the roll once, then reveal it after opening. */
(()=>{
 if(typeof document==='undefined'||typeof document.getElementById!=='function'||typeof document.body?.attachShadow!=='function')return;
 const buy=document.getElementById('buy-staff-pack');
 if(!buy||typeof revealRecruit!=='function')return;
 const originalClick=buy.onclick,originalReveal=revealRecruit;
 let purchasing=false,opening=null,timer=0;
 const reduced=()=>window.matchMedia('(prefers-reduced-motion: reduce)').matches;
 function finish(){
  if(!opening)return;
  const {cover,dialog,focus,observer}=opening;opening=null;clearTimeout(timer);observer.disconnect();cover.remove();
  dialog.removeAttribute('data-recruit-opening');
  const target=focus?.isConnected?focus:dialog.querySelector('.ref-recruit-actions button:last-child,button');
  if(dialog.open)target?.focus({preventScroll:true});
 }
 buy.onclick=function(event){
  if(opening||purchasing)return false;
  purchasing=true;
  try{return originalClick.call(this,event)}finally{purchasing=false}
 };
 revealRecruit=function(...args){
  const result=originalReveal.apply(this,args);
  if(!purchasing)return result;
  const dialog=document.querySelector('#hiring-story[open]')||document.querySelector('#recruit-dialog[open]');
  if(!dialog)return result;
  const en=window.GameLanguage?.current==='en',cover=document.createElement('div');
  cover.className='recruit-opening';cover.setAttribute('role','group');cover.setAttribute('aria-label',en?'Opening recruit pack':'채용팩 개봉 중');
  cover.innerHTML='<div class="recruit-opening-glow" aria-hidden="true"></div><div class="recruit-opening-art" aria-hidden="true"><img src="assets/reference-ui/recruit-envelope-art.webp" alt=""><span>✦</span></div><p role="status"></p><button type="button"></button>';
  cover.querySelector('p').textContent=en?'Who is at the door…?':'어떤 동료가 찾아왔을까…?';
  const skip=cover.querySelector('button');skip.textContent=en?'Reveal now ›':'바로 확인 ›';skip.onclick=finish;
  const focus=dialog.querySelector('[data-hire-next]')||dialog.querySelector('.ref-recruit-actions button:last-child')||dialog.querySelector('button');
  const observer=new MutationObserver(()=>{if(!dialog.open)finish()});observer.observe(dialog,{attributes:true,attributeFilter:['open']});
  opening={cover,dialog,focus,observer};dialog.setAttribute('data-recruit-opening','');dialog.append(cover);skip.focus({preventScroll:true});
  timer=setTimeout(finish,reduced()?250:1500);
  return result;
 };
 // Keep keyboard interaction inside the temporary opening layer.
 document.addEventListener('keydown',event=>{
  if(!opening)return;
  if(event.key==='Escape'){event.preventDefault();event.stopImmediatePropagation();finish()}
  else if(event.key==='Tab'){event.preventDefault();event.stopImmediatePropagation();opening.cover.querySelector('button').focus()}
  else if(event.key.startsWith('Arrow')){event.preventDefault();event.stopImmediatePropagation()}
 },true);
 document.addEventListener('visibilitychange',()=>{if(document.hidden)finish()});
})();
