'use strict';
/* Presentation only. Existing nodes retain native listeners and state authority. */
(() => {
  if (typeof MutationObserver !== 'function' || !document.body) return;
  const sheet = document.querySelector('link[href*="single-screen-people.css"]')?.href || new URL('single-screen-people.css', document.baseURI).href;
  const english = () => window.GameLanguage?.current === 'en';
  const words = {ability:['능력','Abilities'],growth:['성장','Growth'],story:['이야기','Story'],train:['훈련','Train'],effects:['캐릭터별 효과','Character effects']};
  const label = key => words[key][english()?1:0];
  const surfaces = new Set(), probes = new Map();
  let serial = 0;
  function fitSurfaces() {
    const zoom = Number.parseFloat(getComputedStyle(document.body).zoom) || 1;
    for (const surface of surfaces) {
      const value = String(zoom);
      if (surface.style.getPropertyValue('--ss-zoom') !== value) surface.style.setProperty('--ss-zoom', value);
      const probe = probes.get(surface);
      const largeType = probe && Number.parseFloat(getComputedStyle(probe).fontSize) > 28;
      surface.classList.toggle('ss-people-reflow', !!largeType || window.innerWidth / zoom < 260 || window.innerHeight / zoom < 450);
    }
  }
  const resize = typeof ResizeObserver === 'function' ? new ResizeObserver(fitSurfaces) : null;
  resize?.observe(document.body); window.addEventListener('resize',fitSurfaces);
  function watchSurface(surface) {
    if (!surface) return;
    if (!surfaces.has(surface)) { surfaces.add(surface); resize?.observe(surface); }
    const probe = surface.querySelector('#upgrade,.staff-action');
    if (probe !== probes.get(surface)) {
      if (probes.get(surface)) resize?.unobserve(probes.get(surface));
      probes.set(surface,probe); if (probe) resize?.observe(probe);
    }
    fitSurfaces();
  }
  function tabs(keys,panels,name) {
    const nav=document.createElement('nav'); nav.className='ss-people-tabs';nav.setAttribute('role','tablist');nav.setAttribute('aria-label',name);nav.dataset.noTranslate='true';
    const prefix='ss-people-'+(++serial);
    const buttons=keys.map((key,i)=>{
      const button=document.createElement('button');button.type='button';button.dataset.ssLabel=key;button.textContent=label(key);button.id=prefix+'-tab-'+key;
      button.setAttribute('role','tab');button.setAttribute('aria-controls',prefix+'-panel-'+key);
      const panel=panels[i];panel.id=prefix+'-panel-'+key;panel.setAttribute('role','tabpanel');panel.setAttribute('aria-labelledby',button.id);panel.tabIndex=0;
      nav.append(button);return button;
    });
    function select(index,focus=false) {
      buttons.forEach((button,i)=>{button.setAttribute('aria-selected',String(i===index));button.tabIndex=i===index?0:-1;panels[i].hidden=i!==index;});
      if(focus)buttons[index].focus();
    }
    buttons.forEach((button,i)=>button.addEventListener('click',()=>select(i)));
    nav.addEventListener('keydown',event=>{
      const i=buttons.indexOf(event.target);if(i<0)return;
      const target=event.key==='ArrowRight'?(i+1)%buttons.length:event.key==='ArrowLeft'?(i+buttons.length-1)%buttons.length:event.key==='Home'?0:event.key==='End'?buttons.length-1:-1;
      if(target>=0){event.preventDefault();select(target,true);}
    });
    select(0);return nav;
  }
  function staff() {
    const detail=document.getElementById('roster-detail');
    if(!detail||detail.hidden||detail.querySelector('.ss-dossier-main'))return;
    const hero=detail.querySelector('.dossier-hero');if(!hero)return;
    let body=detail.querySelector(':scope > .panel-scroll-body');
    if(!body){body=document.createElement('div');body.className='panel-scroll-body';body.append(...detail.children);detail.append(body);}
    let actions=detail.querySelector('.live-dossier-actions');
    if(!actions){actions=document.createElement('footer');actions.className='live-dossier-actions';detail.append(actions);}
    actions.append(...detail.querySelectorAll('.staff-action, #detail-action-status'));
    const main=document.createElement('section'),growth=document.createElement('section'),story=document.createElement('section');
    main.className='ss-dossier-main';growth.className='ss-dossier-growth';story.className='ss-dossier-story';
    for(const node of [...body.children].filter(node=>node!==hero&&node!==actions)) {
      const text=node.querySelector('h4')?.textContent||'';
      if(node.matches('blockquote,.hire-record,.live-biography')||/어떤 동료|What kind/.test(text))story.append(node);
      else if(/영구 훈련|Permanent training/.test(text)||node.matches('.dossier-foot,.live-training-details'))growth.append(node);
      else main.append(node);
    }
    const identity=document.createElement('div');identity.className='ss-dossier-identity';
    for(const node of [...hero.children])if(!node.matches('img,canvas[data-motion]'))identity.append(node);
    hero.append(identity);
    for(const disclosure of [...growth.querySelectorAll('.live-training-details'),...story.querySelectorAll('.live-biography')])disclosure.open=true;
    body.replaceChildren(main,growth,story);
    const keys=['ability'],panels=[main];
    if(growth.children.length){keys.push('growth');panels.push(growth);}
    if(story.children.length){keys.push('story');panels.push(story);}
    watchSurface(document.getElementById('roster'));detail.classList.add('ss-dossier');detail.dataset.ssLocked=String(hero.classList.contains('staff-locked'));
    detail.prepend(hero,tabs(keys,panels,english()?'Personnel record':'인사기록 내용'));
    if(!actions.children.length)actions.hidden=true;
  }
  const seen=new WeakSet();
  function training() {
    const shadow=document.getElementById('asset-training-host')?.shadowRoot,root=shadow?.querySelector('#asset-training');
    if(!root||seen.has(root))return;
    const scroll=root.querySelector('.scroll'),paper=root.querySelector('.paper'),effectsTitle=root.querySelector('.effects-title'),effectsList=root.querySelector('#effects'),stage=root.querySelector('.stage');
    if(!scroll||!paper||!effectsTitle||!effectsList||!stage)return;
    seen.add(root);const link=document.createElement('link');link.rel='stylesheet';link.href=sheet;shadow.append(link);
    const overview=document.createElement('section'),effects=document.createElement('section');overview.className='ss-training-main';effects.className='ss-training-effects';
    effects.append(effectsTitle,effectsList);paper.prepend(stage);overview.append(paper);
    // Decorative illustration uses spare room only; no intrinsic image height can displace controls.
    const yard=document.createElement('div');yard.className='ss-training-yard';yard.setAttribute('aria-hidden','true');overview.append(yard);
    scroll.replaceChildren(overview,effects);
    const nav=tabs(['train','effects'],[overview,effects],english()?'Training view':'훈련소 보기');scroll.before(nav);root.classList.add('ss-training');
    watchSurface(root);watchSurface(document.getElementById('training-dialog'));
    const page=document.getElementById('training-dialog');
    new MutationObserver(()=>{if(!page.hidden)nav.querySelector('button').click();}).observe(page,{attributes:true,attributeFilter:['hidden']});
  }
  function translate() {
    for(const scope of [document,document.getElementById('asset-training-host')?.shadowRoot].filter(Boolean))
      for(const button of scope.querySelectorAll('[data-ss-label]')){const text=label(button.dataset.ssLabel);if(button.textContent!==text)button.textContent=text;}
  }
  let queued=false;
  function refresh(){staff();training();}
  new MutationObserver(()=>{if(!queued){queued=true;queueMicrotask(()=>{queued=false;refresh();});}}).observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['hidden']});
  window.GameLanguage?.subscribe(translate);refresh();
})();
