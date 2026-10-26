'use strict';
(()=>{
 const q=s=>document.querySelector(s),lobby=q('#lobby'),art=q('.lobby-art');
 if(!lobby||!art||typeof art.append!=='function')return;
 document.documentElement.classList.add('duo-live');
 const oldHero=q('.lobby-gobi'),largeHero=new Image();largeHero.className='lobby-gobi';largeHero.dataset.motion='static-duo-gobi';largeHero.src='assets/mobile/lobby-gobi.webp';largeHero.alt='신입 고비';oldHero.replaceWith(largeHero);
 const title=q('.lobby-title'),heading=title.querySelector('h1');
 heading.className='duo-sr';const floating=document.createElement('div');floating.className='duo-logo-float';
 const logo=new Image();logo.src='assets/reference-ui/title-logo.svg';logo.alt='';floating.append(logo);
 const tagline=document.createElement('p');tagline.textContent='마왕은 퇴근, 우리의 밤은 시작!';
 const shadow=document.createElement('span');shadow.className='duo-logo-shadow';shadow.setAttribute('aria-hidden','true');title.replaceChildren(heading,floating,shadow,tagline);
 const tools=document.createElement('div');tools.className='duo-shortcuts';
 for(const id of ['lobby-story-collection','training-entry']){const b=q('#'+id);if(b)tools.append(b)}art.append(tools);
 const companion=document.createElement('button');companion.type='button';companion.className='duo-companion';companion.onclick=()=>q('.ref-merc-plus')?.click();
 const portrait=new Image();portrait.alt='';portrait.dataset.motion='static-duo-companion';const copy=document.createElement('span'),tag=document.createElement('small'),name=document.createElement('b');copy.append(tag,name);companion.append(portrait,copy);art.append(companion);
 const daily=q('#daily-option');lobby.append(daily);const footer=q('.live-lobby-footer');footer.prepend(q('.mode-card'));
 let last='';function refresh(){const key=meta.equipped||'';companion.dataset.merc=key;if(key===last&&companion.dataset.ready)return;last=key;companion.dataset.ready='1';companion.dataset.empty=String(!key);const merc=key&&mercCatalog[key];portrait.hidden=!merc;if(merc)portrait.src='assets/pixel/'+merc.file+'.webp';tag.textContent=merc?'오늘의 동료':'함께 출근할 동료';name.textContent=merc?merc.name:'지원 용병 선택 +';companion.setAttribute('aria-label',merc?merc.name+' · 지원 용병 변경':'지원 용병 선택');q('.lobby-badge').textContent=merc?'오늘은 내가 지켜줄게!':'같이 출근할 동료를 골라볼까?'}
 const original=renderMeta;renderMeta=function(...args){const result=original.apply(this,args);refresh();return result};refresh();
 const sizeFooter=()=>{const h=footer.getBoundingClientRect().height;if(h)lobby.style.setProperty('--duo-footer-height',h+'px')};if(typeof ResizeObserver!=='undefined')new ResizeObserver(sizeFooter).observe(footer);sizeFooter();
})();
