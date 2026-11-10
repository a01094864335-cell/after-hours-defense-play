'use strict';
/* Keep existing controls, listeners, localization and simulation state. */
(()=>{
 if(typeof document.createElement!=='function')return;
 const q=s=>document.querySelector(s),battle=q('#battle');battle.classList.add('battle-comic');
 q('#battle-back').setAttribute('aria-label','로비로 돌아가기');
 q('#speed').setAttribute('aria-label','전투 속도 변경');
 q('#pause').setAttribute('aria-label','일시정지 또는 계속하기');
 q('#upgrade-open').setAttribute('aria-label','직원 장비 강화');
 for(const key of Object.keys(itemCatalog)){
  const button=q('#item-'+key);button.dataset.iconOnly='true';button.querySelector('span')?.classList.add('comic-item-name');
 }
 const resource=document.createElement('small');resource.className='comic-sp-unit';resource.textContent='SP';q('.summon-row > span').append(resource);
 const meter=document.createElement('div');meter.className='comic-wave-status';
 const phase=document.createElement('span'),track=document.createElement('div'),fill=document.createElement('i');
 phase.id='comic-wave-phase';track.className='comic-wave-track';track.setAttribute('aria-hidden','true');track.append(fill);meter.append(phase,track);q('.battle-notice').append(meter);
 let total=0,lastWave=-1;
 const oldSync=sync;sync=function(){oldSync();
  const remaining=Math.max(0,enemies.filter(e=>e.hp>0&&!e.escaped).length+queue.length);
  if(wave!==lastWave){lastWave=wave;total=remaining}total=Math.max(total,remaining);
  uiText(phase,ended?'당직 종료':!playing?'당직 준비':intermission>0?'다음 공격 · '+Math.ceil(intermission)+'s':'남은 적 · '+remaining);
  fill.style.width=(!playing?0:intermission>0?100:Math.round((1-remaining/Math.max(1,total))*100))+'%';
  const unit=board[selected];q('#skill').style.setProperty('--skill-progress',String(unit?Math.max(0,Math.min(1,1-(unit.skillCD||0)/skillCooldown())):0));
  uiAttr(q('#speed'),'aria-label','전투 속도 '+speed+'배 · 변경');uiAttr(q('#pause'),'aria-label',paused?'계속하기':'일시정지');
  battle.dataset.phase=!playing?'prepare':ended?'ended':paused?'paused':'running';
 };sync();
})();
