'use strict';
/* Moonlit art direction. Original game modules retain state and event handlers. */
(()=>{
 const base=new URL('.',document.currentScript.src),url=p=>new URL(p,base).href;
 const roots=['asset-lobby-host','asset-roster-host','asset-shop-host','asset-training-host'].map(id=>document.getElementById(id)?.shadowRoot).filter(Boolean);
 for(const root of roots){const link=document.createElement('link');link.rel='stylesheet';link.href=url('moonlight-ui.css?v=20261119-1');root.append(link)}
 const lobby=document.getElementById('asset-lobby-host')?.shadowRoot;
 if(lobby){
  const root=lobby.querySelector('#asset-lobby');lobby.querySelector('.a-world').src=url('assets/moonlight/lobby.webp');
  root.insertBefore(lobby.querySelector('.a-gobi'),lobby.querySelector('.a-bottom'));
  const shortcuts=lobby.querySelector('.a-shortcuts');const positionShortcuts=()=>root.insertBefore(shortcuts,lobby.querySelector('.a-bottom'));positionShortcuts();matchMedia('(max-height:650px)').addEventListener('change',positionShortcuts);
  const resume=lobby.querySelector('.a-resume');const update=()=>resume.hidden=resume.disabled;
  new MutationObserver(update).observe(resume,{attributes:true,attributeFilter:['disabled']});update();
 }
 const shop=document.getElementById('asset-shop-host')?.shadowRoot;
 if(shop){
  const stage=shop.querySelector('.hero-stage');const scene=document.createElement('div');scene.className='moon-shop-scene';
  scene.innerHTML='<h2>영웅 채용팩</h2><img class="moon-postmaster" alt="" src="'+url('assets/character-portraits/ghost-courier.webp')+'"><div class="moon-candidates">'+['gobi','slime-cleaner','electric-technician'].map(id=>'<img alt="" src="'+url('assets/character-portraits/'+id+'.webp')+'">').join('')+'</div>';
  stage.replaceChildren(scene);stage.setAttribute('aria-label','달빛 우편 창구의 영웅 채용팩');
 }
 document.documentElement.dataset.uiVersion='moonlight-20261119';
})();
