'use strict';
// Device-local records. No network requests, player IDs or behavioral uploads.
window.PlayObservations=(()=>{
 const en=()=>document.documentElement?.lang?.startsWith('en'),observations=()=>runInsights.observations;
 const strategies={chain:['연쇄 잔광','Chain lightning'],economy:['정산 특근','Overtime accounting'],guard:['비상 방벽','Emergency ward']};
 const strategyName=id=>id?strategies[id][en()?1:0]:(en()?'None':'없음');
 function pairs(){let count=0;for(let i=0;i<15;i++)for(let j=i+1;j<15;j++)if(board[i]&&board[j]&&board[i].type===board[j].type&&board[i].pip===board[j].pip&&board[i].pip<7)count++;return count}
 const previousWave=afterWaveStart;afterWaveStart=function(){
  if(!tutorialMode&&(wave===1||wave===5||wave>=10&&wave<=20||wave===25||wave===30)){
   const s=observations();if(!s.waves.some(w=>w.wave===wave))s.waves.push({wave,seconds:runInsights.seconds,sp,units:board.filter(Boolean).length,highest:Math.max(0,...board.filter(Boolean).map(u=>u.pip)),gear:runDeck.reduce((sum,i)=>sum+levels[i],0),pairs:pairs(),strategy:window.TacticalDuty.snapshot().build});
  }
  return previousWave();
 };
 function noteMerge(first,second,success){if(!tutorialMode)observations().lastMerge={wave,clock:time,success,sourceType:first.type,targetType:second.type,sourcePip:first.pip,targetPip:second.pip}}
 function noteReward(offer){if(tutorialMode||!offer)return;const s=observations();s.choices.push({wave,id:offer.id,mode:rewardBundle?.mode||'roulette',strategy:offer.id==='build'?window.TacticalDuty.snapshot().build:null,seconds:runInsights.seconds});s.choices=s.choices.slice(-30)}
 const previousHit=hitEnemy;hitEnemy=function(e,damage,slow,shared=false,bypass=false){
  const conductive=!tutorialMode&&!shared&&attackOwner===4&&e.wet>0&&e.hp>0,before=Math.max(0,e.hp)+Math.max(0,e.shield||0);
  const value=previousHit(e,damage,slow,shared,bypass);
  if(conductive){const s=observations();s.cooperation.hits++;s.cooperation.bonusDamage+=Math.max(0,before-Math.max(0,e.hp)-Math.max(0,e.shield||0))/6}
  return value;
 };
 function noteBreach(boss=false){if(tutorialMode)return;const s=observations(),b=runInsights.breaches.at(-1);if(!b)return;const afterMerge=!!s.lastMerge&&time-s.lastMerge.clock>=0&&time-s.lastMerge.clock<=10;if(afterMerge)s.postMergeBreaches++;s.breaches.push({wave:b.wave,name:b.name,hp:b.hp,max:b.max,boss,afterMerge,seconds:runInsights.seconds,sp,units:board.filter(Boolean).length,pairs:pairs(),strategy:window.TacticalDuty.snapshot().build});s.breaches=s.breaches.slice(-12)}
 const previousItem=consumeItem;consumeItem=function(key){const value=previousItem(key);if(value)observations().items={...runInsights.items};return value};
 const previousRecord=runRecord;runRecord=function(){return {...previousRecord(),observations:{...JSON.parse(JSON.stringify(observations())),items:{...runInsights.items},outcome:life<=0?'defeat':window.TacticalDuty.completedWave()?'clockout':tutorialWon?'tutorial':'ended'}}};
 function report(){return {game:'after-hours-defense',version:1,ruleset:'fun-20261123-v1',created:new Date().toISOString(),scope:'Device-local completed shifts; observations are correlations, not causal defeat attribution. Cooperative extra damage is an estimate.',records:profile().records.map(r=>JSON.parse(JSON.stringify(r)))}}
 function exportReport(){if(typeof Blob!=='function'||typeof URL.createObjectURL!=='function')return false;const url=URL.createObjectURL(new Blob([JSON.stringify(report(),null,2)],{type:'application/json'})),a=document.createElement('a');a.href=url;a.download='night-shift-play-records.json';a.hidden=true;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);return true}
 function render(){
  const host=document.querySelector('#run-analysis');if(!host||!ended)return;
  let root=host.querySelector('#play-observations');if(!root){root=document.createElement('section');root.id='play-observations';(host.querySelector(':scope > details')||host).append(root)}
  const s=observations(),previous=profile().records.find(r=>r.id!==runId&&!r.tutorial&&!r.observations?.incomplete&&r.observations?.ruleset===s.ruleset&&r.training.staff===runTraining.staff&&r.training.merc===runTraining.merc&&r.rule===(dailyEnabled?DAILY_RULES[dailyRule].name:'기본 규칙'));
  const comparison=previous?(en()?'Same training and rules: ':'같은 훈련·규칙 기록: ')+(wave-previous.wave>=0?'+':'')+(wave-previous.wave)+(en()?' waves':'웨이브'):(en()?'No earlier run with the same training and rules.':'같은 훈련·규칙의 비교 기록이 아직 없어요.');
  root.innerHTML='<h3>'+(en()?'Growth & teamwork':'성장과 협업')+'</h3><p>'+(en()?'Strategy: ':'당직 전략: ')+strategyName(window.TacticalDuty.snapshot().build)+'<br>'+(en()?'Teamwork hits: ':'협업 발동: ')+s.cooperation.hits+(en()?' · Estimated extra damage ':'회 · 추가 피해 약 ')+Math.round(s.cooperation.bonusDamage)+'</p><p>'+comparison+'<br>'+(en()?'Breaches within 10 combat seconds of a merge: ':'합성 후 전투시간 10초 내 돌파: ')+s.postMergeBreaches+(en()?'. This does not establish the cause of defeat.':'건 · 패배 원인으로 단정하지 않아요.')+'</p><button type="button" id="play-records-export">'+(en()?'Save play records':'플레이 기록 저장')+'</button>';
  root.querySelector('button').onclick=exportReport;
 }
 const previousAnalysis=renderAnalysis;renderAnalysis=function(){const value=previousAnalysis();if(typeof document.createElement==='function')render();return value};
 if(typeof document.createElement==='function')GameLanguage.subscribe(()=>{if(ended)render()});
 return Object.freeze({report,exportReport,render,noteBreach,noteMerge,noteReward});
})();
