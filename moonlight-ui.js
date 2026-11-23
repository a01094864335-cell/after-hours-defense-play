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
  stage.setAttribute('aria-label','랜덤 동료 채용팩');
  scene.classList.add('recruit-draw-scene');
  const draw=document.createElement('div');draw.className='recruit-draw';
  draw.innerHTML='<p class="draw-kicker"></p><div class="draw-portraits" aria-hidden="true"></div><div class="draw-envelope" aria-hidden="true"><i></i><span>?</span></div><p class="draw-caption"></p>';
  scene.append(draw);
  // Preview real members of the pool; the display never predicts the next roll.
  const previewIds=['goblin-guard','slime-cleaner','merc-ward','skeleton-chef'];
  for(const id of previewIds){const card=document.createElement('span');card.className='draw-portrait';card.append(CharacterPortraits.image(id,'','',true));draw.querySelector('.draw-portraits').append(card)}
  const translateDraw=()=>{const en=window.GameLanguage?.current==='en';draw.querySelector('.draw-kicker').textContent=en?'WHO WILL ARRIVE?':'이번엔 누가 올까?';draw.querySelector('.draw-caption').textContent=en?'Open a pack · Meet 1 random colleague':'봉투를 열면 · 랜덤 동료 1명';scene.querySelector('.grid-shop-title').textContent=en?'Hero Recruit Pack':'영웅 채용팩';stage.setAttribute('aria-label',en?'Random colleague recruit pack':'랜덤 동료 채용팩')};
  window.GameLanguage?.subscribe(translateDraw);translateDraw();

 }
 document.documentElement.dataset.uiVersion='moonlight-20261119';
})();
