'use strict';
// Approved personnel, mail and training art. Native controls remain the authority.
(() => {
 if(typeof URL!=='function'||typeof MutationObserver!=='function'||typeof document.createElement!=='function'||!document.body)return;
 const sheet=new URL('concept-people.css?v=approved-3',document.baseURI).href;
 const image=(id,cls)=>{const img=document.createElement('img');img.src=new URL('assets/character-portraits/'+id+'.webp',document.baseURI).href;img.alt='';img.className=cls;return img};
 const watched=new WeakSet();let queued=false;
 function refresh(){
  for(const id of ['starter-choice','staff-trial'])document.getElementById(id)?.classList.add('concept-modal');
  for(const id of ['roster','shop','training']){
   const shadow=document.getElementById('asset-'+id+'-host')?.shadowRoot;if(!shadow)continue;
   if(!shadow.querySelector('link[data-concept-people]')){const link=document.createElement('link');link.rel='stylesheet';link.href=sheet;link.dataset.conceptPeople='';shadow.append(link)}
   if(!watched.has(shadow)){watched.add(shadow);observer.observe(shadow,{childList:true,subtree:true,attributes:true,attributeFilter:['hidden']})}
   const root=shadow.querySelector('#asset-'+id);if(!root)continue;
   if(id==='shop'&&!root.querySelector('.concept-mail-portrait')){
    root.querySelector('h1').textContent='마왕성 우편 상점';
    const stage=root.querySelector('.hero-stage');stage.append(image('ghost-courier','concept-mail-portrait'));
    const parcel=document.createElement('div');parcel.className='concept-parcel';parcel.innerHTML='<div><strong>직원 모집 패키지</strong><span>새 동료가 도착합니다!</span></div>';stage.append(parcel);
    const awning=document.createElement('div');awning.className='concept-awning';awning.setAttribute('aria-hidden','true');for(let i=0;i<7;i++)awning.append(document.createElement('i'));root.prepend(awning);
   }
   if(id==='shop'){
    let dock=root.querySelector('.concept-purchase-dock');
    if(!dock){const purchase=root.querySelector('.purchase');if(purchase){dock=document.createElement('section');dock.className='concept-purchase-dock';dock.setAttribute('aria-label','채용팩 구매');dock.append(purchase);const balance=root.querySelector('#balance');if(balance)dock.append(balance);root.querySelector('footer').before(dock)}}
    if(dock){const hidden=!!root.querySelector('#pack')?.hidden;if(dock.hidden!==hidden)dock.hidden=hidden}
   }
   if(id==='training'&&!root.querySelector('.concept-training-portrait')){
    root.querySelector('.stage').append(image('goblin-guard','concept-training-portrait'));
    const label=document.createElement('span');label.className='concept-training-label';label.textContent='그룹 전체 성장 · 확정 성공';root.querySelector('.stage').append(label);
    const subtitle=document.createElement('p');subtitle.className='concept-training-subtitle';subtitle.textContent='작은 연습이 다음 근무를 바꿔요';root.querySelector('header').append(subtitle);
   }
  }
  const starter=document.getElementById('starter-choice'),options=document.getElementById('starter-options');
  if(starter&&options){
   const title=starter.querySelector('h2');if(title&&title.textContent!=='첫 동료를 골라요')title.textContent='첫 동료를 골라요';
   if(!starter.querySelector('.concept-starter-intro')){const p=document.createElement('p');p.className='concept-starter-intro';p.textContent='처음 한 번, 무료로 채용할 수 있어요';starter.querySelector('header').after(p)}
   let cta=starter.querySelector('#concept-starter-claim');if(!cta){cta=document.createElement('button');cta.id='concept-starter-claim';cta.type='button';cta.addEventListener('click',()=>options.querySelector('article[data-concept-selected="true"] .concept-native-claim')?.click());options.after(cta)}
   for(const card of options.querySelectorAll('article')){
    if(card.dataset.conceptBound)continue;card.dataset.conceptBound='true';const buttons=card.querySelectorAll('button');const claim=buttons[buttons.length-1];if(!claim)continue;claim.classList.add('concept-native-claim');
    const select=document.createElement('button');select.className='concept-starter-select';select.type='button';select.textContent='이 동료 선택';select.setAttribute('aria-label',(card.querySelector('b')?.textContent||'동료')+' 선택');select.addEventListener('click',()=>selectCard(card));card.append(select);
    card.addEventListener('click',e=>{if(!e.target.closest('button'))selectCard(card)});
   }
   function selectCard(card){for(const c of options.querySelectorAll('article')){const active=c===card;c.dataset.conceptSelected=String(active);c.querySelector('.concept-starter-select')?.setAttribute('aria-pressed',String(active))}const name=card.querySelector('b')?.textContent||'동료';const text=name+' 무료 채용';if(cta.textContent!==text)cta.textContent=text;cta.disabled=!!card.querySelector('.concept-native-claim')?.disabled}
   const selected=options.querySelector('article[data-concept-selected="true"]')||options.querySelector('article');if(selected)selectCard(selected);
  }
 }
 const observer=new MutationObserver(()=>{if(queued)return;queued=true;queueMicrotask(()=>{queued=false;refresh()})});
 observer.observe(document.body,{childList:true,subtree:true});refresh();
})();
