'use strict';
/* Existing controls and simulation, positioned on the approved wordless plate. */
(()=>{
 if(typeof document.createElement!=='function')return;
 const q=s=>document.querySelector(s),battle=q('#battle');battle.classList.add('battle-comic','battle-exact');
 for(const [id,label]of [['battle-back','로비로 돌아가기'],['speed','전투 속도 변경'],['pause','일시정지 또는 계속하기'],['upgrade-open','직원 장비 강화']])q('#'+id).setAttribute('aria-label',label);
 for(const key of Object.keys(itemCatalog)){const button=q('#item-'+key);button.querySelector('img').src=itemArtwork(key);button.dataset.iconOnly='true';button.querySelector('span')?.classList.add('comic-item-name')}
 q('#battle-back').innerHTML='<svg viewBox="0 0 32 32" aria-hidden="true"><path d="m18 6-11 10 11 10M8 16h18" fill="none" stroke="#11214a" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/></svg>';
 q('.battle-stage-meta').setAttribute('aria-hidden','true');
 q('#upgrade-open').innerHTML='<svg viewBox="0 0 32 32" aria-hidden="true"><path fill="#10224f" fill-rule="evenodd" d="M13 1h6l1 4 3 2 4-1 3 5-3 3v4l3 3-3 5-4-1-3 2-1 4h-6l-1-4-3-2-4 1-3-5 3-3v-4l-3-3 3-5 4 1 3-2zm3 9a6 6 0 1 0 0 12 6 6 0 0 0 0-12"/></svg>';
 const energy=q('.summon-row > span');for(const node of [...energy.childNodes])if(node.nodeType===3)node.textContent='';energy.insertAdjacentHTML('afterbegin','<svg class="exact-energy-bolt" viewBox="0 0 32 40" aria-hidden="true"><path d="M18 1 3 24l10-1-3 16 19-25-11 2Z" fill="#ffe13c"/></svg>');
 const resource=document.createElement('small');resource.className='comic-sp-unit';resource.textContent='SP';q('.summon-row > span').append(resource);
 const meter=document.createElement('div');meter.className='comic-wave-status';
 const phase=document.createElement('span'),readout=document.createElement('span'),value=document.createElement('b'),icon=document.createElement('span'),track=document.createElement('div');
 phase.id='comic-wave-phase';readout.className='exact-wave-readout';value.id='exact-wave-value';icon.className='exact-wave-icon';icon.setAttribute('aria-hidden','true');icon.innerHTML='<svg data-symbol="clock" viewBox="0 0 28 28" fill="none" stroke-width="2.5" stroke-linecap="round"><path d="M11 2h6m-3 0v4m7 0 2-2"/><circle cx="14" cy="16" r="9.5"/><path d="M14 10v6h5"/></svg><svg data-symbol="count" viewBox="0 0 28 28" fill="none" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m5 3 4 2 13 15-3 3L6 8Zm-2 16 6-6m4 6-6 6m12-12 6-8-4-2-8 8M3 23l2 2m17-3 3 3"/></svg>';readout.append(icon,value);
 track.className='comic-wave-track';track.setAttribute('aria-hidden','true');const dots=Array.from({length:5},()=>{const dot=document.createElement('i');track.append(dot);return dot});meter.append(phase,readout,track);q('.battle-notice').append(meter);
 let total=0,lastWave=-1,toastTimer,lastSummonLabel='',lastSPDigits=0;
 new MutationObserver(()=>{if(toastTimer)clearTimeout(toastTimer);battle.classList.add('exact-toast-visible');toastTimer=setTimeout(()=>battle.classList.remove('exact-toast-visible'),2400)}).observe(q('#message'),{childList:true,subtree:true,characterData:true});
 const oldSync=sync;sync=function(){oldSync();
  const remaining=Math.max(0,enemies.filter(e=>e.hp>0&&!e.escaped).length+queue.length);
  if(wave!==lastWave){lastWave=wave;total=remaining}total=Math.max(total,remaining);
  const waiting=intermission>0,preparing=!playing;
  uiText(phase,ended?'당직 종료':preparing?'당직 준비':waiting?'다음 웨이브':'남은 적');
  uiText(value,ended?String(wave):preparing?board.filter(Boolean).length+'/5':waiting?Math.ceil(intermission)+'s':String(remaining));
  uiAttr(icon,'data-clock',waiting);
  const summonLabel=q('#summon').textContent;if(summonLabel!==lastSummonLabel){lastSummonLabel=summonLabel;q('#summon').style.setProperty('--exact-summon-font',Math.max(4.6,Math.min(7.8,65/summonLabel.replace(/\s/g,'').length))+'cqw')}
  const progress=preparing?board.filter(Boolean).length/5:waiting?1:1-remaining/Math.max(1,total),count=Math.round(Math.max(0,Math.min(1,progress))*5);
  dots.forEach((dot,i)=>uiAttr(dot,'data-filled',i<count));
  uiAttr(meter,'title','다음 군단장 '+((Math.floor(wave/5)+1)*5)+'차 · 클릭하면 전투 안내');
  const digits=q('#sp').textContent.length;if(digits!==lastSPDigits){lastSPDigits=digits;q('#sp').style.setProperty('--exact-sp-font',(6*Math.min(1,3.45/digits))+'cqw')}
  const unit=board[selected];q('#skill').style.setProperty('--skill-progress',String(unit?Math.max(0,Math.min(1,1-(unit.skillCD||0)/skillCooldown())):0));
  uiAttr(q('#speed'),'aria-label','전투 속도 '+speed+'배 · 변경');uiAttr(q('#pause'),'aria-label',paused?'계속하기':'일시정지');
  battle.dataset.phase=ended?'ended':preparing?'prepare':paused?'paused':'running';
 };sync();
})();
