'use strict';
const SUPPORT_PITY=10,SUPPORT_POINTS=10;
const safeText=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function profile(){return meta.profile;}
function missingSupports(){return MERC_IDS.filter(id=>!meta.owned.includes(id));}
// Sampling and wallet changes are one transaction; failed saves consume nothing.
buyStaffPack=function(){
 if(saveWarning||meta.coins<PACK_PRICE||playing&&!ended||packComplete())return false;
 const missing=missingSupports(),guaranteed=missing.length>0&&profile().pity>=SUPPORT_PITY-1;
 const support=guaranteed||Math.random()<RECRUIT_SUPPORT_RATE;
 const pool=guaranteed?missing:support?MERC_IDS:[...BASE_STAFF,...RECRUIT_STAFF];
 const id=pool[Math.floor(Math.random()*pool.length)],duplicate=(support?meta.owned:meta.staff).includes(id);
 if(!saveChange(d=>{d.coins-=PACK_PRICE;if(duplicate)d.recruitPoints++;else if(support)d.owned.push(id);else d.staff.push(id);d.profile.pity=missing.length?((support&&!duplicate)?0:Math.min(9,d.profile.pity+1)):0;}))return false;
 revealRecruit(support?'merc-'+id:id,duplicate);return true;
};
const previousRecruitShop=renderRecruitShop;let recruitRenderKey='';
renderRecruitShop=function(){const key=JSON.stringify([meta.coins,meta.recruitPoints,meta.owned,meta.staff,profile().pity,playing,ended,saveWarning]);if(key===recruitRenderKey)return;recruitRenderKey=key;previousRecruitShop();document.querySelector('#recruit-balance').textContent='보유 '+meta.coins+' 코인 · 채용 포인트 '+meta.recruitPoints+' · '+(missingSupports().length?'미보유 지원 보장 '+profile().pity+'/10':'지원 수집 완료');};
function recruitSupport(id){
 if(!MERC_IDS.includes(id)||meta.owned.includes(id)||saveWarning||playing&&!ended||meta.recruitPoints<SUPPORT_POINTS)return false;
 if(!saveChange(d=>{d.recruitPoints-=SUPPORT_POINTS;d.owned.push(id);d.profile.pity=0;}))return false;
 renderMeta();renderStaffArchive();showStaffRecord('merc-'+id);return true;
}
const previousRecord=showStaffRecord;
showStaffRecord=function(id){previousRecord(id);const key=id.replace(/^merc-/, '');if(!id.startsWith('merc-')||!MERC_IDS.includes(key)||meta.owned.includes(key)||typeof document.createElement!=='function')return;
 const detail=document.querySelector('#roster-detail'),r=staffRecords.find(r=>r.id===id);detail.querySelector('#archive-shop')?.classList.remove('staff-action');const packInfo=detail.querySelector('.dossier-section p');if(packInfo)packInfo.textContent='일반 팩: 지원 전체 10% · 각 지원은 균등. 미보유 지원이 나오지 않은 9팩 뒤에는 다음 팩에서 미보유 지원을 보장해요. 현재 '+profile().pity+'/10.';
 const preview=document.createElement('section');preview.className='dossier-section';const heading=document.createElement('h4'),copy=document.createElement('p');heading.textContent=r.name+' · '+r.job;copy.textContent=trainedMercDescription(key,false)+' · 보유 '+meta.recruitPoints+' / 필요 '+SUPPORT_POINTS+' 포인트. 지정 채용도 미보유 지원 보장 횟수를 초기화해요.';preview.append(heading,copy);detail.append(preview);
 const b=document.createElement('button');b.id='support-recruit-specific';b.className='staff-action';b.textContent=SUPPORT_POINTS+' 포인트 · '+r.name+' 지정 채용';b.disabled=!!saveWarning||meta.recruitPoints<SUPPORT_POINTS||playing&&!ended;b.onclick=()=>recruitSupport(key);detail.append(b);
};
const previousArchive=renderStaffArchive;renderStaffArchive=function(){previousArchive();if(rosterGroup==='merc')document.querySelector('#roster-note').textContent='채용팩·10팩 미보유 보장·10포인트 지정 채용. 인사기록에서 지원 1명을 선택하세요.';};
// Capture decisions and effective assistance, not just raw attack damage.
const decisionSummon=summon;summon=function(){const old=board.filter(Boolean).length,oldSP=sp,free=summonPrice()===0;decisionSummon();if(board.filter(Boolean).length>old){runInsights.summons++;if(free)runInsights.support.sp+=Math.max(0,sp-oldSP);}};
const decisionSkill=useSkill;useSkill=function(){const u=board[selected],cd=u?.skillCD||0;decisionSkill();if(u&&(u.skillCD||0)>cd)runInsights.skills++;};
const decisionItem=consumeItem;consumeItem=function(key){const result=decisionItem(key);if(result)runInsights.items[key]++;return result;};
const insightHit=hitEnemy;hitEnemy=function(e,damage,...args){const before=Math.max(0,e.hp)+Math.max(0,e.shield||0);insightHit(e,damage,...args);const dealt=Math.max(0,before-Math.max(0,e.hp)-Math.max(0,e.shield||0));if(attackOwner===null&&activeMerc==='rescue')runInsights.support.damage+=dealt;if(e.vulnerability>1&&e.vulnerable>0)runInsights.help[6]+=dealt*(1-1/e.vulnerability);if(args[1])runInsights.help[9]+=dealt;if(activeMerc==='q'&&e.qMark>0)runInsights.support.boost+=dealt*(1-1/(1+(e.qBonus||0)));};
const insightBreach=breachDamage;breachDamage=function(amount){const charges=wardChargesUsed;insightBreach(amount);if(wardChargesUsed>charges)runInsights.support.prevented+=amount;};
const insightRecordKill=recordKill;recordKill=function(e){const first=!e.rewarded&&!e.decoy,oldSP=sp;insightRecordKill(e);if(first&&e.type==='boss')runInsights.bosses=[...runInsights.bosses,{name:bossDefinition(e).name,wave,seconds:Math.max(0,runInsights.seconds-(e.insightSpawn||0)),king:kingEvent.state==='entrance'}].slice(-30);if(first&&activeMerc==='accountant')runInsights.support.sp+=Math.max(0,sp-oldSP-Math.round((10+Math.floor(wave/3))*dailyModifier('killSP')*100)/100);};
const insightExtra=extraAttack;extraAttack=function(u,i,e,damage){const timer=e.skill,cd=e.counselDelayCD||0;insightExtra(u,i,e,damage);if(u.type===10&&cd===0)runInsights.help[10]+=Math.max(0,e.skill-timer);};
const insightUpdate=update;update=function(dt){
 const active=playing&&!paused&&!ended;
 if(active){runInsights.seconds+=dt/Math.max(1,speed);for(const e of enemies)if(e.hp>0&&e.slow>0)runInsights.help[2]+=Math.min(dt,e.slow)*(1-trainingSlow(e));
  for(let i=0;i<board.length;i++){const u=board[i];if(!u||u.stun>0)continue;const haste=Math.max(0,staffHaste(i)-1);runInsights.help[11]+=dt*haste;if(u.pip>=5&&(u.skillCD||0)>0)runInsights.help[16]+=dt*Math.max(0,staffCooldownRate(i)-1);}
 }
 const stuns=active?board.map(u=>u?.stun||0):[],freezes=active?enemies.map(e=>[e,e.freeze||0]):[];const beforeSP=sp;
 insightUpdate(dt);
 if(active&&activeMerc==='banchang')runInsights.support.cleanses+=stuns.filter((n,i)=>n>dt&&board[i]&&!(board[i].stun>0)).length;
 if(active&&activeMerc==='coco')runInsights.support.stops+=freezes.filter(([e,n])=>(e.freeze||0)>Math.max(0,n-dt)+.01).length;
 if(active&&activeMerc==='chikchik'&&sp>beforeSP&&expansionState.freeSummon===0){/* Free-summon income is included in the SP wallet. */}
};
const insightSpawn=spawn;spawn=function(type){insightSpawn(type);if(type==='boss')enemies.at(-1).insightSpawn=runInsights.seconds;};
function resultHint(){if(!board.some(u=>u&&kinds[u.type].damage>0))return '이번 배치에는 공격하는 직원이 없었어요. 운영·버프 직원만으로는 적을 막을 수 없으니, 공격 직원을 소환한 뒤 당직을 시작해보세요.';const last=runInsights.breaches.at(-1);if(!last)return tutorialWon?'연수 수료! 이제 편성과 지원을 바꿔 정식 당직에 도전해보세요.':'다음 당직에서는 다른 편성과 장비 투자 순서를 비교해보세요.';
 if(last.name.includes('군단장')||last.damage===2)return '마지막 돌파 적은 '+last.name+' · 체력 '+Math.ceil(last.hp/Math.max(1,last.max)*100)+'%가 남았어요. 다음 판은 군단장 등장에 맞춰 스킬과 집중 공격을 준비해보세요.';
 if(runInsights.failed>=3)return '합성 실패 '+runInsights.failed+'회가 있었어요. 전투 중에는 공격 직원을 남기고, 반값 소환과 합성 보장을 활용해보세요.';
 return '마지막 돌파 적은 '+last.name+' · 체력 '+Math.ceil(last.hp/Math.max(1,last.max)*100)+'%가 남았어요. 선두 적 제어와 범위 공격 장비를 함께 점검해보세요.';}
function runRecord(){return {id:runId,wave,cleared:tutorialWon?10:Math.max(0,wave-1),coins:runReward?.total||0,seconds:Math.round(runInsights.seconds),rule:tutorialMode?'신입 연수':dailyEnabled?DAILY_RULES[dailyRule].name:'기본 규칙',deck:runDeck.map(i=>kinds[i].file),support:activeMerc,training:{...runTraining},king:{...runInsights.king},bosses:runInsights.bosses.map(b=>({...b})),tutorial:tutorialMode};}
const insightSettle=settleRun;settleRun=function(){insightSettle();if(!ended||!runReward?.paid||tutorialMode&&!tutorialWon)return;const record=runRecord();if(profile().records.some(r=>r.id===runId))return;
 if(saveChange(d=>{d.profile.records=[record,...d.profile.records].slice(0,20);if(!tutorialMode)d.profile.best=Math.max(d.profile.best,record.cleared);})){renderJourney();renderAnalysis();}
};
const insightDescribe=describeStats;describeStats=function(){insightDescribe();if(typeof document.createElement==='function')renderAnalysis();};
// Snapshot restore retains the exact decisions, king assistance and play time.
const insightRestore=applySnapshot;applySnapshot=function(...args){const result=insightRestore(...args);if(!args[2])renderJourney();return result;};
const insightMeta=renderMeta;renderMeta=function(){insightMeta();if(typeof document.createElement==='function'){renderRecruitShop();renderJourney();}};
function helpText(type){const n=runInsights.help[type]||0;if(type===6)return '표식 추가 피해 약 '+Math.round(n);if(type===2)return '이동 지연 '+n.toFixed(1)+'초';if(type===10)return '스킬 지연 '+n.toFixed(1)+'초';if(type===11)return '인접 공격 가속 '+n.toFixed(1)+'초';if(type===9)return '공유 전달 피해 '+Math.round(n);if(type===16)return '스킬 충전 단축 '+n.toFixed(1)+'초';return '—';}
function renderAnalysis(){
 const host=document.querySelector('#run-analysis');if(!host)return;
 const s=runInsights,rows=runDeck.map(i=>'<tr><th scope="row">'+kinds[i].name+'</th><td>'+Math.round(runStats[i].damage).toLocaleString()+'</td><td>'+runStats[i].kills+'</td><td>'+Math.round(runStats[i].income)+'</td><td>'+helpText(i)+'</td></tr>').join('');
 const previous=profile().records.find(r=>r.id!==runId&&!r.tutorial),delta=previous?wave-previous.wave:null;
 host.innerHTML='<h3>이번 당직 분석</h3><p>'+safeText(resultHint())+'</p><p>이전 당직 대비 '+(delta===null?'첫 기록':(delta>=0?'+':'')+delta+'웨이브')+' · 실제 근무 '+Math.floor(s.seconds/60)+'분 '+Math.floor(s.seconds%60)+'초</p><p>소환 '+s.summons+'회 · 합성 '+(s.merges-s.failed)+'성공 / '+s.failed+'실패 · 스킬 '+s.skills+'회<br>아이템: 등급 '+s.items.grade+' · 종류 '+s.items.kind+' · 마왕 '+s.items.king+'</p><p>마왕 출동 '+s.king.appearances+'회 · '+s.king.kills+'명 처치 (군단장 '+s.king.bosses+'명 포함)</p><p>지원 기여: 피해 '+Math.round(s.support.damage)+' · 추가 피해 약 '+Math.round(s.support.boost)+' · SP '+Math.round(s.support.sp)+' · 생명 방어 '+s.support.prevented+' · 정화 '+s.support.cleanses+' · 저지 '+s.support.stops+'명</p><p>군단장 처치: '+(s.bosses.map(b=>safeText(b.name)+' '+b.seconds.toFixed(1)+'초'+(b.king?' (마왕)':'')).join(' · ')||'기록 없음')+'</p><details><summary>직원별 기여·돌파 기록</summary><div class="analysis-scroll"><table><caption>피해·처치·SP와 보조 기여 (가속·감속은 누적 대상 시간)</caption><thead><tr><th>직원</th><th>피해</th><th>처치</th><th>SP</th><th>보조</th></tr></thead><tbody>'+rows+'</tbody></table></div><p>'+s.breaches.map(b=>b.wave+'차 '+safeText(b.name)+' · HP '+Math.ceil(b.hp/Math.max(1,b.max)*100)+'% · 생명 -'+b.damage).join('<br>')+'</p></details>';
}
function deckWarning(){const helpers=meta.deck.filter(id=>[2,3,9,10,11,16].includes(kinds.findIndex(k=>k.file===id))).length;return helpers>=3?'보조 직원 '+helpers+'명 편성 · 초반 공격이 부족할 수 있어요. 장비 강화와 공격 직원 수를 점검하세요.':'';}
function renderJourney(){
 const host=document.querySelector('#journey-summary');if(!host)return;
 const entry=document.querySelector('#training-entry-summary');if(entry)uiText(entry,'직원 '+meta.training.staff+' · 용병 '+meta.training.merc+' →');
 const best=profile().best,target=(Math.floor(best/5)+1)*5,last=profile().records.find(r=>!r.tutorial);
 const text='최고 '+best+'웨이브 돌파 · 다음 목표 '+target+'웨이브'+(last?'\n최근 '+last.wave+'차 · '+last.rule+' · 직원 Lv.'+last.training.staff+' / 지원 Lv.'+last.training.merc:'');
 const summary=text+(deckWarning()?'\n'+deckWarning():'');const goal=document.querySelector('#journey-goal');if(goal)uiText(goal,summary);const tip=document.querySelector('#deck-tip');if(tip){tip.dataset.originalTip??=tip.textContent;uiText(tip,tip.dataset.originalTip+(deckWarning()?' '+deckWarning():''));}if(document.documentElement.classList.contains('duo-live')){if(host.dataset.summary!==summary){host.dataset.summary=summary;const copy=document.createElement('span');copy.textContent=summary;host.replaceChildren(copy);host.setAttribute('aria-label',summary+' · 기록과 편성 보관함 열기');}}else if(host.textContent!==summary)host.textContent=summary;
 const list=document.querySelector('#run-history-list');if(list&&document.querySelector('#journey-dialog')?.open)list.innerHTML=profile().records.map(r=>'<li><b>'+r.wave+'차 · '+r.coins+'코인</b><span>'+safeText(r.rule)+' · 직원 '+r.training.staff+' / 지원 '+r.training.merc+' · 마왕 '+r.king.appearances+'회</span></li>').join('')||'<li>당직을 마치면 최근 20판을 기록해요.</li>';
}
function savePreset(index){if(!Number.isInteger(index)||index<0||index>2||meta.deck.length!==5||playing&&!ended||!meta.tutorialComplete)return false;return saveChange(d=>{d.profile.presets[index]={staff:d.deck.slice(),support:d.equipped};});}
function loadPreset(index){const preset=profile().presets[index];if(!preset||!meta.tutorialComplete||playing&&!ended||board.some(Boolean)&&!ended||preset.staff.some(id=>!meta.staff.includes(id))||preset.support&&!meta.owned.includes(preset.support))return false;const saved=saveChange(d=>{d.deck=preset.staff.slice();d.equipped=preset.support;});if(saved){runDeck=meta.deck.map(id=>kinds.findIndex(k=>k.file===id));sync();renderStaffArchive();}return saved;}
function renderPresets(){const host=document.querySelector('#deck-presets');if(!host)return;host.replaceChildren();for(let i=0;i<3;i++){const row=document.createElement('div'),name=document.createElement('span'),save=document.createElement('button'),load=document.createElement('button');name.textContent='편성 '+(i+1)+(profile().presets[i]?' · 저장됨':' · 빈 슬롯');save.textContent='현재 편성 저장';load.textContent='불러오기';save.disabled=!meta.tutorialComplete||playing&&!ended||meta.deck.length!==5;load.disabled=!profile().presets[i]||!meta.tutorialComplete||playing&&!ended||board.some(Boolean)&&!ended;save.onclick=()=>{if(savePreset(i)){renderPresets();showMetaStatus('편성 '+(i+1)+' 저장 완료');}};load.onclick=()=>{if(loadPreset(i)){renderPresets();showMetaStatus('편성 '+(i+1)+' 적용 완료');}};row.append(name,save,load);host.append(row);}}
if(typeof document.createElement==='function'){
 const q=s=>document.querySelector(s);
 let statusTimer;const previousStatus=showMetaStatus;showMetaStatus=function(text){previousStatus(text);clearTimeout(statusTimer);if(playing&&!ended&&/실패|오류|복구/.test(text))say('저장 안내: '+text);statusTimer=setTimeout(()=>{if(q('#meta-status').textContent===text)q('#meta-status').textContent='';},/실패|오류/.test(text)?8000:4000);};
 q('#speed').onclick=()=>{speed=speed%3+1;sync();};
 q('#buy-staff-pack').onclick=buyStaffPack;q('#summon').onclick=summon;q('#skill').onclick=useSkill;q('#retry-reward').onclick=settleRun;
 const facts=q('.recruit-facts');if(facts)facts.innerHTML='<div><dt>일반</dt><dd>90% · '+kinds.length+'종 균등</dd></div><div><dt>지원</dt><dd>10% · '+MERC_IDS.length+'종 균등</dd></div><div><dt>보장</dt><dd>10팩 내 미보유 지원 1명</dd></div><div><dt>지정</dt><dd>일반 3 / 지원 10 포인트</dd></div>';
 q('.recruit-shop>p').textContent='일반 90% / 지원 10%. 9팩 연속 미보유 지원을 만나지 못하면 다음 팩은 미보유 지원 확정! 미보유 지원을 채용하면 보장 횟수 초기화. 중복은 1포인트, 일반 3포인트·지원 10포인트로 도감에서 지정 채용해요. 보장 팩은 미보유 지원끼리 균등 확률이에요.';
 const analysis=document.createElement('section');analysis.id='run-analysis';q('#result-stats').after(analysis);
 const journey=document.createElement('button');journey.id='journey-summary';journey.type='button';journey.setAttribute('aria-label','개인 최고 기록과 최근 당직 보기');q('#training-entry').before(journey);
 const dialog=document.createElement('dialog');dialog.id='journey-dialog';dialog.className='development-sheet';dialog.innerHTML='<header><h2>당직 기록 · 편성 보관함</h2><button id="journey-close">닫기</button></header><p id="journey-goal" role="status"></p><p>기록은 이번 업데이트 이후부터 쌓여요. 최고 기록은 정식 당직의 완료 웨이브 기준이에요. 오늘의 변주와 마왕 도움도 함께 비교해보세요.</p><h3>편성 3개 저장</h3><p>직원 5명 + 지원 1명. 연수 수료 후 사용 가능하며, 소환 전 또는 당직 종료 후 불러올 수 있어요.</p><div id="deck-presets"></div><h3>최근 20판</h3><ol id="run-history-list"></ol>';
 document.body.append(dialog);journey.onclick=()=>{dialog.showModal();renderPresets();renderJourney();};q('#journey-close').onclick=()=>dialog.close();
 const deckButton=document.createElement('button');deckButton.textContent='편성 저장 · 기록 보기';deckButton.onclick=()=>{q('#deck').close();journey.click();};q('#deck').append(deckButton);
 const fxButton=document.createElement('button');fxButton.id='compact-fx-toggle';q('#menu').insertBefore(fxButton,q('#menu-close'));
 const fxLabel=()=>{fxButton.textContent=profile().compactFX?'스킬 연출 · 간결하게':'스킬 연출 · 크게 보기';fxButton.setAttribute('aria-pressed',String(profile().compactFX));document.documentElement.classList.toggle('compact-skill-fx',profile().compactFX);};
 fxButton.onclick=()=>{if(saveChange(d=>{d.profile.compactFX=!d.profile.compactFX;}))fxLabel();};
 const oldReset=reset;reset=function(){oldReset();SkillCutin.clear(true);fxLabel();renderJourney();};fxLabel();renderJourney();renderRecruitShop();
}
