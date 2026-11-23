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
