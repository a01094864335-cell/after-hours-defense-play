'use strict';
// First-run lessons use the real controls. Only the teaching encounters are held.
window.TutorialCoach=(()=>{
 const q=s=>document.querySelector(s);let task=null,skip=null,dialogue=null,dialogueNext=null,compact=false;
 const place=i=>(Math.floor(i/5)+1)+'행 '+(i%5+1)+'열';
 const unit=type=>({type,pip:1,cool:0,attack:0,arrival:.4,income:5,skillCD:0});
 function pairFor(item=false){for(let a=0;a<15;a++)for(let b=a+1;b<15;b++)if(board[a]&&board[b]&&board[a].pip===board[b].pip&&board[a].pip<7&&(item?board[a].type!==board[b].type:board[a].type===board[b].type))return [a,b];return null}
 function practicePair(item=false){let pair=pairFor(item);if(pair)return pair;const empty=board.map((u,i)=>u?-1:i).filter(i=>i>=0);if(empty.length<2)return null;board[empty[0]]=unit(0);board[empty[1]]=unit(item?1:0);return empty.slice(0,2)}
 function held(){return tutorialMode&&!ended&&(!!task||window.DiscountTutorial?.waitingForSummon?.())}
 const feedbackCopy={
 equipment:['같은 직군 전체가 강해졌다','잘했다. 방금 강화한 장비는 같은 직군의 직원 모두에게 적용된다.\n소환과 장비는 같은 SP를 쓰니, 빈자리를 채울지 기존 직원을 강화할지 판단하거라.'],
 skill:['필요한 순간에 직접 쓰는 힘','잘했다. 5등급부터는 직원을 선택해 고유 스킬을 직접 쓸 수 있다.\n한 번 쓰면 재사용 시간을 기다려야 하니, 적이 몰렸을 때를 노려라.'],
 item:['합성 조건을 바꾸는 방법','잘했다. 등급 합성권을 쓰면 종류가 달라도 같은 등급끼리 합칠 수 있다.\n이번에는 성공을 보장했지만, 실전에서 합성권이 실패 확률까지 없애주는 것은 아니다.'],
 king:['급할 때는 나를 불러라','호출은 제대로 배웠군. 지금 나와 있던 적들은 내가 정리했다.\n아직 나오지 않은 적은 남아 있으니 방어를 이어가거라. 정식 당직에서는 보유한 소모품이 필요하다.'],
 discount:['실패 뒤에도 수습할 기회가 있다','잘했다. 방금은 실패 보상 덕분에 반값으로 한 명을 더 불렀다.\n할인은 다음 유료 소환 한 번에만 적용된다. 이제 소환 가격이 원래대로 돌아왔는지 확인하거라.']};
 function finish(message,lesson=task?.kind){task={kind:'feedback',lesson,delay:1.6};say(message);sync();saveActiveRun()}
 function showFeedback(){const entry=feedbackCopy[task.lesson];task.delay=-1;speak(entry[0],entry[1],'알겠습니다 · 계속하기',()=>{task=null;sync();saveActiveRun()});saveActiveRun()}
 function speak(title,text,label='계속하기',next=()=>{},speaker='king'){compact=false;dialogueNext=next;if(!dialogue){showGuide(title,text);return;}uiAttr(q('#coach-portrait'),'src',speaker==='gobi'?staffPortraitPath('gobi'):CombatComic.headPath('demon-king'));uiAttr(q('#coach-portrait'),'alt',speaker==='gobi'?'고비':'마왕');uiText(q('#coach-speaker'),speaker==='gobi'?'고비':'마왕');q('#coach-title').textContent=title;q('#coach-copy').textContent=text;q('#coach-next').textContent=label;dialogueNext=next;dialogue.hidden=false;paused=true;sync()}
 function dismiss(){if(dialogue)dialogue.hidden=true;paused=false;const next=dialogueNext;dialogueNext=null;next?.();sync();saveActiveRun()}
 const originalGuide=showGuide;showGuide=function(title,text){if(tutorialMode&&dialogue)speak(title,text);else originalGuide(title,text)};
 function guide(title,text){speak(title,text,task?'직접 해보기':wave===0?'소환 연습 시작':'계속하기')}
 function failurePractice(){const pair=practicePair();if(!pair){task=null;window.DiscountTutorial?.start();return;}task={kind:'mergefail',pair};guide('실패했을 때도 배워두거라','연습할 직원은 마련해뒀다. 표시된 두 명을 합쳐보거라. 이번 한 번은 실패하도록 해뒀다.\n당황하지 말고, 어느 직원이 사라지고 누가 남는지 살펴보아라.');sync();saveActiveRun()}
 function showResult(){const outcome=task.outcome;task.delay=-1;speak(outcome==='success'?'잘했다. 등급이 하나 올랐다':'실패해도 둘 다 사라지는 건 아니다',outcome==='success'?'잘했다. 같은 종류·같은 등급을 합치면 등급이 하나 오른다. 종류는 랜덤으로 바뀌지.\n빈 출발 자리와 별이 늘어난 도착 자리를 보아라. 이번에는 성공했으니, 다음엔 실패도 배워보자.':'잘 보았느냐? 이동한 직원 한 명만 사라지고, 대상 직원은 그대로 남았다. 다음 유료 소환 한 번은 반값이 된다.\n이번 실패는 연습을 위한 것이었다. 실전에서는 표시된 확률로 결정된다.',outcome==='success'?'실패도 연습하기':'반값 소환 해보기',()=>{task=null;if(outcome==='success')failurePractice();else window.DiscountTutorial?.start();});saveActiveRun()}
 function mergeResult(outcome,a,b){task={kind:'merge-result',outcome,pair:[a,b],delay:1.6};selected=-1;paused=false;say(outcome==='success'?'합성 성공 · 보드의 변화를 확인하세요':'합성 실패 · 출발 직원 소멸 / 대상 직원 유지');sync();saveActiveRun()}
 const originalChance=failChance;failChance=function(pip){return tutorialMode&&task?.kind==='mergefail'?1:originalChance(pip)};
 function hint(){
  if(task?.kind==='feedback')return '연습 완료 · 방금 배운 내용을 마왕님과 확인하세요.';
  if(task?.kind==='merge-result')return '결과 확인 중 · '+(task.outcome==='success'?'등급 상승!':'이동한 직원 소멸 · 대상 직원 유지');
  if(task?.kind==='mergefail')return '실패 연습 · 표시한 두 직원을 합쳐보세요. 이번 1회는 실패해요.';
  if(task?.kind==='merge')return '연습 중 · 표시한 두 직원을 차례로 터치해 합성하세요. 첫 연습은 성공 보장!';
  if(task?.kind==='equipment')return '연습 중 · 장비 → '+kinds[task.type].name+' 강화 버튼을 누르세요.';
  if(task?.kind==='skill')return '연습 중 · 표시한 5등급 직원 선택 → 아래 스킬 버튼을 누르세요.';
  if(task?.kind==='item')return '연습 중 · 등급 합성 버튼 → 표시한 두 직원을 차례로 터치하세요.';
  if(task?.kind==='king')return '연습 중 · 마왕 깨우기를 눌러 용사를 정리하세요. 연습용 1개를 사용해요.';
  if(window.DiscountTutorial?.waitingForSummon?.())return '연습 중 · 반값으로 표시된 직원 소환 버튼을 누르세요.';
  if(wave===0)return '준비 '+preparationCount()+'/5 · 아래 직원 소환 버튼을 '+(5-preparationCount())+'번 누르면 전투가 시작돼요.';
  if(wave<3)return sp<summonPrice()?'자동 공격 중 · 처치 보상으로 SP를 모으세요. 다음 소환 '+summonPrice()+' SP':'SP가 모였어요 · 직원 소환으로 방어선을 보강하세요.';
  return wave>=9?'실전 연습 · 소환·합성·장비·스킬로 10웨이브까지 막으세요.':'자동 공격 중 · 빈자리에는 소환, 같은 종류·등급은 합성하세요.';
 }
 function refresh(){
  const preparing=tutorialMode&&appScreen==='battle'&&preparingDuty();
  uiAttr(q('#battle'),'data-tutorial-preparing',preparing?'true':'false');
  if(dialogue){
   if(preparing&&!paused){compact=true;dialogue.hidden=false;const count=preparationCount();uiText(q('#coach-title'),'첫 동료 부르기 · '+count+'/5');uiText(q('#coach-copy'),count===0?'아래 직원 소환 버튼을 눌러보세요. 빈 보드에 동료가 한 명씩 들어와요.':'좋아요! '+count+'명이 왔어요. '+(5-count)+'번 더 소환하면 자동으로 전투가 시작돼요.');}
   else if(compact){compact=false;dialogue.hidden=true;}
   uiAttr(dialogue,'data-compact',compact?'true':'false');uiProp(q('#coach-next'),'hidden',compact);
  }
  if(preparing&&!paused){const count=preparationCount();uiAttr(q('#summon'),'aria-label','직원 소환 '+summonPrice()+' SP · 준비 '+count+'/5');}

  uiAttr(q('#battle'),'data-tutorial',tutorialMode?'true':'false');
  uiAttr(q('#battle'),'data-teach-skill',tutorialMode&&wave<6?'hidden':'shown');
  uiAttr(q('#battle'),'data-teach-items',tutorialMode&&wave<7?'hidden':'shown');
  if(dialogue&&!dialogue.hidden)uiProp(q('#pause'),'disabled',true);
  if(skip)skip.hidden=!held()||!!(dialogue&&!dialogue.hidden);
  for(const [id,kind]of [['#summon','summon'],['#upgrade-open','equipment'],['#skill','skill'],['#item-grade','item'],['#item-king','king']]){
   const active=tutorialMode&&(task?.kind===kind||(kind==='summon'&&(wave===0||window.DiscountTutorial?.waitingForSummon?.())));
   q(id)?.classList.toggle('tutorial-target',!!active);
  }
  if(tutorialMode){uiText(q('#tutorial-strip'),(wave?'신입 연수 '+wave+'/10 · ':'')+hint());if(wave>=10)uiText(q('#next-boss'),'마지막 공격 · 막아내면 신입 연수 수료!');}
  uiProp(q('#item-hint'),'hidden',!itemMode);if(itemMode)uiText(q('#item-hint'),itemMode==='grade'?'등급 합성: 같은 등급이면 종류가 달라도 합성해요. 직원 두 명을 선택하세요.':'종류 합성: 같은 종류면 등급이 달라도 합성해요. 직원 두 명을 선택하세요.');
 }
 const previousInit=initRunProgress;initRunProgress=function(){task=null;if(dialogue)dialogue.hidden=true;dialogueNext=null;previousInit();if(tutorialMode){bossPlans={5:'leon',10:'ruby'};}refresh()};
 const previousType=randomType;randomType=function(){if(tutorialMode&&preparingDuty()&&preparationCount()<=5)return [0,0,1,2,3][Math.max(0,preparationCount()-1)];return previousType()};
 const previousClose=closePromo;closePromo=function(){previousClose();if(tutorialMode&&appScreen==='battle'&&preparingDuty()&&preparationCount()===0)speak('첫 전투를 앞두고','마왕님, 첫 전투인데… 제가 어떻게 해야 할까요?','마왕의 대답 듣기',()=>guide('먼저 동료부터 불러라','막 자려던 참이지만… 첫 근무니 기본은 알려주마. 혼자 막으려 하지 말고, 동료부터 불러라.\n아래 직원 소환 버튼을 다섯 번 눌러라. 준비금 150 SP면 충분하다. 다섯 명이 모이면 전투가 시작된다.\n첫 연습은 내가 직원을 골라뒀다. 이후 소환과 합성 결과는 랜덤이라는 점을 기억해라.'),'gobi')};
 q('#promo-skip').onclick=closePromo;
 const previousWave=afterWaveStart;afterWaveStart=function(){
  if(!tutorialMode)return previousWave();task=null;itemMode=null;
  if(wave===1)guide('1. 자동 공격과 SP','잘했다. 다섯 명이 모였군. 직원들은 적을 자동으로 공격한다.\n처치 보상과 당직 서기의 수입으로 SP가 모이면 더 소환할 수 있지. 적이 왕좌에 닿으면 생명을 잃는다. 생명 세 개를 모두 잃으면 재도전해야 한다.');
  if(wave===3){const pair=practicePair();if(pair){task={kind:'merge',pair};guaranteedMerge=Math.max(1,Number(guaranteedMerge));guide('2. 두 직원을 합쳐보기','적은 잠시 멈춰두었다.\n'+place(pair[0])+'과 '+place(pair[1])+'의 표시된 직원을 차례로 누르거나 드래그해 합쳐보거라.\n같은 종류·같은 등급끼리 합치면 등급이 하나 오르고 종류는 랜덤으로 바뀐다. 첫 연습은 성공하도록 해두었다.')}else guide('2. 합성 조건','같은 종류·같은 등급의 직원 두 명을 차례로 선택하거라. 7등급은 최대이니 더 합칠 수 없다.');}
  if(wave===4){const type=board.find(u=>u&&[0,1,4].includes(u.type)&&levels[u.type]<5)?.type;if(type!==undefined){const aid=Math.max(0,equipmentCost(type)-sp);sp+=aid;task={kind:'equipment',type};guide('3. 같은 직군 전체 강화','적은 잠시 멈춰두었다. 아래 장비 버튼을 열고 '+kinds[type].name+' 장비를 한 번 강화해보거라.\n같은 직군 전체에 적용되며, 이번 전투에만 유지된다. 소환과 같은 SP를 쓰니 기억해두어라.'+(aid?'\n연습에 필요한 '+aid+' SP는 내가 보태주었다.':''));}}
  if(wave===5)guide('첫 군단장 · 레온','레온은 일반 용사보다 튼튼하다. 방금 배운 소환과 장비 강화로 화력을 보충해보거라.\n군단장과 남은 적을 모두 막으면 보너스를 하나 고를 수 있다.');
  if(wave===6){let i=board.findIndex(u=>u?.type===0);if(i<0)i=board.findIndex(u=>!u);if(i<0)i=board.reduce((best,u,n)=>u.pip<board[best].pip?n:best,0);if(!board[i])board[i]=unit(0);board[i].pip=Math.max(5,board[i].pip);board[i].skillCD=0;board[i].stun=0;selected=-1;boardFocus=i;if(!enemies.some(e=>e.hp>0))spawn('normal');task={kind:'skill',index:i};guide('4. 5등급 고유 스킬','첫 군단장도 막아냈군. 이제 '+kinds[board[i].type].name+' 직원의 등급을 5등급 이상으로 올려두었다.\n표시된 직원을 선택한 뒤 아래 '+skillNames[board[i].type]+' 버튼을 눌러보거라. 적은 잠시 멈춰두었다.\n스킬은 네가 직접 사용해야 하고, 다시 쓰려면 재사용 시간이 지나야 한다.');}
  if(wave===7){trainingItems={grade:2,kind:2,king:1};const pair=practicePair(true);if(pair){task={kind:'item',pair};guaranteedMerge=Math.max(1,Number(guaranteedMerge));guide('5. 합성권 사용하기','적은 잠시 멈춰두었다.\n먼저 등급 합성 버튼을 누르고, '+place(pair[0])+'과 '+place(pair[1])+'의 직원을 차례로 눌러보거라. 같은 등급이면 종류가 달라도 합칠 수 있다.\n이번 연습은 성공을 보장한다. 연습용 합성권을 쓰니 네 보유 아이템은 줄지 않는다.');}else guide('5. 연습용 아이템 지급','등급 합성은 같은 등급끼리, 종류 합성은 같은 종류끼리 조건을 완화한다. 아이템 버튼을 누른 뒤 직원 두 명을 선택하거라. 실전에서는 실패할 수도 있다.');}
  if(wave===8){trainingItems.king=Math.max(1,trainingItems.king);if(!enemies.some(e=>e.hp>0))spawn('normal');task={kind:'king'};guide('6. 위급할 때 마왕 깨우기','감당하기 어렵다면 나를 불러라. 마왕 깨우기를 누르면 지금 나온 적들은 내가 정리해주마. 앞으로 나올 적까지 없어지는 것은 아니다.\n이번에는 연습용 호출을 한 번 써보거라. 정식 당직에서는 보유한 소모품이 필요하다.');}
  if(wave===9)guide('마지막 실전 연습','잘 배웠다. 이제 남은 두 공격은 네 판단으로 막아보거라. 소환과 장비로 보강하고, 필요할 때 스킬을 쓰면 된다.\n실패하면 해당 웨이브에서 생명 세 개로 다시 연습할 수 있다. 10웨이브를 막으면 정식 당직을 맡기마.');
  noteRoster();tutorialCheckpoint=runSnapshot();renderProgress();refresh();saveActiveRun();
 };
 const previousUpdate=update;update=function(dt){if(held()){if(task?.kind==='feedback'&&!paused){if(task.lesson==='king'&&kingEvent.state!=='idle')updateKing(dt/Math.max(1,speed));else {if(task.delay>=0)task.delay-=dt/Math.max(1,speed);if(task.delay<=0)showFeedback();}}if(task?.kind==='merge-result'&&!paused){if(task.delay>=0)task.delay-=dt/Math.max(1,speed);if(task.delay<=0)showResult();}fx.forEach(f=>f.life-=dt/Math.max(1,speed));fx=fx.filter(f=>f.life>0);for(const u of board)if(u){u.arrival=Math.max(0,(u.arrival||0)-dt);Motion.tick(u,dt);}return;}return previousUpdate(dt)};
 const previousKing=updateKing;updateKing=function(dt){if(tutorialMode&&kingEvent.state==='idle')return false;return previousKing(dt)};
 const previousMerge=merge;merge=function(a,b){if(['merge-result','feedback'].includes(task?.kind))return false;const lesson=task?.kind,items=trainingItems.grade,old=board[a];const result=previousMerge(a,b);if(result&&lesson==='merge')mergeResult('success',a,b);else if(lesson==='mergefail'&&old&&!board[a]&&!result)mergeResult('failure',a,b);else if(lesson==='item'&&trainingItems.grade<items)finish('등급 합성권 사용 완료! 종류가 달라도 같은 등급이면 합칠 수 있어요.');return result};
 const previousSummon=summon;summon=function(){if(['merge-result','feedback'].includes(task?.kind))return;return previousSummon()};q('#summon').onclick=summon;
 const previousUpgrade=upgrade;upgrade=function(type){if(['merge-result','feedback'].includes(task?.kind))return;const before=levels[type];previousUpgrade(type);if(task?.kind==='equipment'&&levels[type]>before)finish('장비 강화 완료! 같은 직군 전체의 능력이 올랐어요.')};
 const previousSkill=useSkill;useSkill=function(){const u=board[selected],before=u?.skillCD||0;previousSkill();if(task?.kind==='skill'&&u&&(u.skillCD||0)>before)finish('고유 스킬 사용 완료! 재사용 시간이 지나면 다시 쓸 수 있어요.')};q('#skill').onclick=useSkill;
 const previousItem=selectItem;selectItem=function(key){const before=trainingItems.king;previousItem(key);if(task?.kind==='king'&&trainingItems.king<before)finish('마왕 깨우기 사용 완료! 남은 적들이 다시 들어오면 방어를 이어가세요.');refresh()};
 const previousSync=sync;sync=function(){previousSync();refresh()};
 const previousStats=describeStats;describeStats=function(){previousStats();if(tutorialMode&&tutorialWon)q('#result-again').textContent='정식 당직 시작'};
 const previousSnapshot=runSnapshot;runSnapshot=function(){return {...previousSnapshot(),tutorialLesson:task?JSON.parse(JSON.stringify(task)):null}};
 const previousApply=applySnapshot;applySnapshot=function(s,allowSettled=false,validateOnly=false){const t=s?.tutorialLesson;if(t&&(!['merge','mergefail','merge-result','feedback','equipment','skill','item','king'].includes(t.kind)||(t.pair&&(!Array.isArray(t.pair)||t.pair.length!==2||t.pair.some(i=>!Number.isInteger(i)||i<0||i>14)))||(t.index!==undefined&&(!Number.isInteger(t.index)||t.index<0||t.index>14))||(t.kind==='feedback'&&(!feedbackCopy[t.lesson]||!Number.isFinite(t.delay)))||(t.kind==='merge-result'&&(!['success','failure'].includes(t.outcome)||!Number.isFinite(t.delay)))||(['merge','mergefail','merge-result','item'].includes(t.kind)&&(!t.pair||t.pair[0]===t.pair[1]))||(t.kind==='skill'&&!Number.isInteger(t.index))||(t.kind==='equipment'&&(!Number.isInteger(t.type)||!kinds[t.type]))))throw Error('invalid tutorial lesson');const result=previousApply(s,allowSettled,validateOnly);if(!validateOnly){task=tutorialMode&&t?JSON.parse(JSON.stringify(t)):null;refresh()}return result};
 const previousDraw=draw;draw=function(){previousDraw();if(!tutorialMode||!task)return;const slots=task.pair||(task.index!==undefined?[task.index]:[]);ctx.save();ctx.strokeStyle=task.kind==='merge-result'&&task.outcome==='failure'?'#ff8d98':'#f0cc86';ctx.lineWidth=3;ctx.fillStyle='#f0cc86';ctx.font='bold 11px system-ui';ctx.textAlign='center';slots.forEach((i,n)=>{const c=cells[i];ctx.strokeRect(c.x-36,c.y-41,72,84);ctx.fillText(task.kind==='merge-result'?(n===0?'빈자리':task.outcome==='success'?'등급 +1':'직원 유지'):slots.length===2?String(n+1):'스킬',c.x,c.y-46)});ctx.restore()};
 if(typeof document.createElement==='function'){dialogue=document.createElement('section');dialogue.id='tutorial-gobi';dialogue.hidden=true;dialogue.setAttribute('aria-label','마왕의 신입 연수 안내');dialogue.innerHTML='<img id="coach-portrait" src="assets/mobile/lobby-gobi.webp" alt="고비"><div><small id="coach-speaker">고비</small><strong id="coach-title"></strong><p id="coach-copy"></p><button id="coach-next">계속하기</button></div>';q('#tutorial-strip').after(dialogue);q('#coach-next').onclick=dismiss;skip=document.createElement('button');skip.id='tutorial-practice-skip';skip.textContent='이번 연습 건너뛰기';skip.onclick=()=>{if(window.DiscountTutorial?.waitingForSummon?.())window.DiscountTutorial.skip();task=null;itemMode=null;paused=false;sync();saveActiveRun()};q('#tutorial-strip').after(skip);}
 if(tutorialMode&&!playing)bossPlans={5:'leon',10:'ruby'};refresh();
 return {held,refresh,speak,dismiss,feedback:lesson=>finish('연습 완료',lesson),speaking:()=>!!(dialogue&&!dialogue.hidden&&!compact),get task(){return task}};
})();
