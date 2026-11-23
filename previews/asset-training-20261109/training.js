'use strict';
// Art-only adapter. Native training owns prices, persistence, battle locks and upgrades.
(()=>{
 if(!document.currentScript||!document.body||typeof document.body.attachShadow!=='function'||document.getElementById('asset-training-host'))return;
 const base=new URL('.',document.currentScript.src),asset=n=>new URL('assets/'+n,base).href,q=s=>document.querySelector(s),dialog=q('#training-dialog');
 const host=document.createElement('div');host.id='asset-training-host';const shadow=host.attachShadow({mode:'open'}),style=document.createElement('link');style.rel='stylesheet';style.href=new URL('training.css',base).href;
 const crop=(box,cls)=>`<svg class="${cls}" viewBox="${box}" preserveAspectRatio="xMidYMid meet" aria-hidden="true"><image data-art-src="${asset('training-reference.webp')}" width="898" height="1752"/></svg>`;
 const root=document.createElement('section');root.id='asset-training';root.setAttribute('aria-label','야간 훈련소');
 root.innerHTML=`<header>${crop('0 0 898 160','header-art')}<button data-action="back" class="back" aria-label="이전 화면으로 돌아가기"></button><h1 class="sr-only">야간 훈련소</h1></header><nav class="tabs" aria-label="훈련 그룹"><button data-group="staff">직원 훈련</button><button data-group="merc">지원 영웅 훈련</button></nav><div class="scroll"><div class="stage">${crop('0 231 898 337','hero')}<span class="stamp">전원 성장!<br><b>확정 성공</b></span><span class="spark one" aria-hidden="true">✦</span><span class="spark two" aria-hidden="true">✧</span><span class="shout" aria-hidden="true">한 번 더!</span></div><section class="paper"><h2 id="level"></h2><div class="power"><span class="sword" aria-hidden="true">⚔</span><div><small id="power-label"></small><b id="power-value"></b></div></div><div id="milestones" aria-label="고유 효과 해금 레벨"></div><div class="effects-title"><h3>캐릭터별 해금 효과</h3><b id="next"></b></div><div id="effects"></div><p class="policy">같은 그룹 전체 적용 · 신규 채용에도 유지</p></section></div><section class="upgrade-bar" aria-label="훈련 구매"><div class="balance"><span>● 보유 <b id="coins"></b> 코인</span><small id="remaining"></small></div><button id="upgrade" data-action="upgrade"></button><p id="hint"></p><p id="status" role="status"></p></section><footer><nav aria-label="주 메뉴"><button data-action="roster" aria-label="직원 도감"></button><button data-action="home" aria-label="당직실" aria-current="page"></button><button data-action="shop" aria-label="상점"></button></nav></footer>`;
 new MutationObserver(hydrateArt).observe(dialog,{attributes:true,attributeFilter:['hidden']});
 shadow.append(style,root);dialog.append(host);dialog.classList.add('asset-training-page');const local=s=>root.querySelector(s);let last='',previousGroup='';
 function hydrateArt(){if(!(!dialog.hidden))return;for(const image of root.querySelectorAll('image[data-art-src]')){image.setAttribute('href',image.dataset.artSrc);image.removeAttribute('data-art-src')}}
 function refresh(){hydrateArt();
  const level=trainingLevel(trainingGroup,false),next=Math.min(TRAINING_MAX,level+1),cost=trainingCost(level),milestone=TRAINING_MILESTONES.find(n=>n>level),staff=trainingGroup==='staff';
  const en=window.GameLanguage?.current==='en';
  const state=JSON.stringify([en,trainingGroup,meta.coins,meta.training,meta.staff,meta.owned,playing,ended,saveWarning,q('#training-status').textContent]);if(state===last)return;last=state;
  root.querySelectorAll('[data-group]').forEach(b=>{b.setAttribute('aria-pressed',String(b.dataset.group===trainingGroup));b.textContent=en?(b.dataset.group==='staff'?'Staff':'Support'):(b.dataset.group==='staff'?'직원 강화':'지원 영웅 강화');});
  local('#level').innerHTML=(en?(staff?'All staff':'All support'):(staff?'직원 전체':'지원 영웅 전체'))+' <span>Lv.'+level+'</span>'+(level<TRAINING_MAX?' <em>➜ Lv.'+next+'</em>':' <em>MAX!</em>');
  local('.power').hidden=!staff;
  local('#power-label').textContent=staff?(en?'Attack damage':'공격 피해'):(en?'Shared training level':'공통 훈련 레벨');
  local('#power-value').innerHTML=staff?'+'+((staffTrainingMultiplier(level)-1)*100).toFixed(1)+'%'+(level<TRAINING_MAX?' <span>➜ +'+((staffTrainingMultiplier(next)-1)*100).toFixed(1)+'%</span>':''):'Lv.'+level+(level<TRAINING_MAX?' <span>➜ Lv.'+next+'</span>':'');
  local('.policy').textContent=en?'Includes future hires.':'앞으로 채용할 동료도 함께 강화';
  local('#milestones').innerHTML=TRAINING_MILESTONES.map(n=>`<span class="medal ${level>=n?'unlocked':n===milestone?'next':''}"><b>${n}</b><small>${level>=n?'해금':n===milestone?'다음':'잠김'}</small></span>`).join('');local('#next').textContent=milestone?'다음 Lv.'+milestone:'모두 해금!';
  local('#coins').textContent=meta.coins.toLocaleString();
  local('#coins').parentElement.firstChild.nodeValue=en?'Coins ':'● 보유 ';local('#coins').parentElement.lastChild.nodeValue=en?'':' 코인';
  local('#remaining').textContent=level===TRAINING_MAX?(en?'Maximum level':'최대 레벨 달성'):meta.coins>=cost?(en?(meta.coins-cost).toLocaleString()+' coins after training':'훈련 후 '+(meta.coins-cost).toLocaleString()+' 코인'):(en?'Need '+(cost-meta.coins)+' coins':(cost-meta.coins)+' 코인 부족');
  local('#upgrade').disabled=q('#training-upgrade').disabled;
  local('#upgrade').textContent=level===TRAINING_MAX?(en?'MAX · Training complete':'MAX · 훈련 완료'):(en?'Train · '+cost+' coins':'강화하기 · '+cost+' 코인');
  local('#hint').textContent=saveWarning||(playing&&!ended?(en?'Available after battle.':'전투 종료 후 강화 가능'):'');local('#status').textContent=q('#training-status').textContent;
  if(previousGroup!==trainingGroup)local('.scroll').scrollTop=0;previousGroup=trainingGroup;
 }
 root.addEventListener('click',e=>{const b=e.target.closest('button');if(!b||b.disabled)return;if(b.dataset.group){q('#training-tab-'+b.dataset.group).click();q('#training-status').textContent='';refresh();}else if(b.dataset.action==='upgrade'){const before=trainingLevel(trainingGroup,false);q('#training-upgrade').click();refresh();if(trainingLevel(trainingGroup,false)>before){root.classList.remove('success');void root.offsetWidth;root.classList.add('success');}}else{trainingNavigate(b.dataset.action);}});
 const native=window.renderTraining;window.renderTraining=function(...args){const result=native.apply(this,args);refresh();return result;};
 new MutationObserver(()=>{if(!dialog.hidden)refresh()}).observe(dialog,{attributes:true,attributeFilter:['hidden']});new MutationObserver(refresh).observe(q('#training-status'),{childList:true,characterData:true,subtree:true});function reset(){last='';root.classList.remove('success')}window.GameLanguage?.subscribe(()=>{last='';refresh()});refresh();window.AssetTraining={refresh,reset};
})();
