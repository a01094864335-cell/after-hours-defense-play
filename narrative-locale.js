'use strict';
// Translate presentation nodes only. Never replace roster records, story IDs,
// ownership, story progress, rewards or the battle's numeric source of truth.
window.NarrativeLocale=(()=>{
 const data=window.NarrativeEnglish,entries={...data.names};
 const add=(ko,en)=>{if(typeof ko==='string'&&typeof en==='string')entries[ko]=en};
 for(const episode of CastleStories){
  const en=data.castle[episode.id];if(!en)continue;
  add(episode.title,en[0]);add(episode.tag,en[1]);
  if(episode.panels)episode.panels.forEach((p,i)=>{const t=en[2][i];if(!t)return;add(p[0],t[0]);add(episode.title+' · '+p[0],en[0]+' · '+t[0]);add(p[2],t[1]);add('“'+p[2]+'”','“'+t[1]+'”');add(p[3],t[2])});
  for(let i=1;i<=4;i++)add((episode.original?episode.tag:'지난 근무 일지 · '+episode.tag)+' · '+i+' / 4',(episode.original?en[1]:'Shift log · '+en[1])+' · '+i+' / 4');
 }
 promoLines.forEach((p,i)=>{const t=data.intro[i];for(const [key,j]of [['title',0],['speaker',1],['line',2],['aside',3]])add(p[key],t[j]);add(p.title+' — '+p.aside,t[0]+' — '+t[3])});
 const fields=['job','dept','story','quote','traits','role','ability','skill','skillText'];
 for(const record of staffRecords){
  const values=data.staff[record.id],name=data.names[record.name];if(!values||values.length!==fields.length||!name)continue;
  fields.forEach((key,i)=>add(record[key],values[i]));
  add('“'+record.quote+'”','“'+values[3]+'”');add(record.dept+' / '+record.job,values[1]+' / '+values[0]);add(record.name+' · '+record.job,name+' · '+values[0]);
  add(record.name+' 인사기록 보기','View '+name+'’s record');add(record.name+' · '+record.job+' 인사기록 보기','View '+name+' · '+values[0]);
 }
 for(const episode of window.HIRING_STORIES){
  const en=data.hiring[episode.id];if(!en||en[1].length!==episode.panels.length)continue;
  add(episode.title,en[0]);add(episode.title+' · 네 컷 이야기',en[0]+' · A four-panel story');
  episode.panels.forEach((p,i)=>{add(p.dialogue,en[1][i]);add(episode.name+'의 입사 이야기 '+(i+1)+'번째 장면',data.names[episode.name]+'’s first day · scene '+(i+1))});
 }
 for(let i=0;i<=CastleStories.length;i++)add(i+' / '+CastleStories.length+' 이야기 수집',i+' / '+CastleStories.length+' stories collected');
 for(let i=1;i<=CastleStories.length;i++)add('야간 일지 '+String(i).padStart(2,'0'),'Night log '+String(i).padStart(2,'0'));
 Object.assign(entries,{
  '첫 출근 기록':'First-day record','마왕성 · 첫 출근 기록':'Castle · First-day record','첫 당직 이야기':'The first night shift','마왕성 야간 일지':'Castle Night Logs',
  '지난 근무 일지':'Past shift log','수집한 이야기 다시 보기':'Replay collected story','수집한 이야기 · 다시 만난 마왕성의 하루':'Collected story · Another day at the castle',
  'NEW · 이야기 해금! 글로벌 코인 +5':'NEW · Story unlocked! +5 global coins','저장 실패 · 이야기 해금과 보상을 재시도해주세요':'Save failed · Retry the story unlock and reward',
  '아직 발견하지 못한 하루':'A day yet to be discovered','수집 완료 · 다시 보기':'Collected · Replay','당직 시작 시 무작위 발견':'Discover randomly when starting a shift',
  '이전':'Previous','← 이전':'← Previous','다음':'Next','다음 →':'Next →','당직 준비하기 →':'Prepare →','도감으로 →':'Archive →','이야기 완료 ✓':'Done ✓','건너뛰기 ×':'Skip ×','닫기 ×':'Close ×',
  '그림을 불러오는 중…':'Loading artwork…','이야기 그림을 읽고 있어요…':'Loading story artwork…','다시 읽기':'Retry image',
  '그림을 불러오지 못했어요. 대사를 읽거나 다음 장으로 넘길 수 있어요.':'Artwork could not load. You can still read the dialogue or go to the next scene.',
  '그림을 읽지 못했어요. 대사는 계속 볼 수 있어요.':'Artwork could not load. You can still read the dialogue.',
  '채용 이야기 페이지':'Hiring story pages','이야기 건너뛰기':'Skip story','그림 전체':'Full art','대사 보기':'Read story',
  '직원 인사기록':'Personnel record','야간 인사기록부':'Night Personnel Files','봉인된 인사기록':'Sealed personnel record','인사기록 보기':'View record','어떤 동료인가요?':'What kind of colleague?',
  '당직에 임하는 한마디':'A word before the shift','기본 능력':'Basic ability','5등급 해금 · 수동 스킬':'Rank 5 unlock · Manual skill','자동 지원 능력':'Automatic support',
  '기본 피해·간격은 장비 Lv.1, 1등급 기준. 등급이 높아지면 공격 간격이 짧아져요.':'Base damage and interval are for rank 1 with Lv.1 equipment. Higher ranks attack faster.',
  '채용팩에서 영구 고용 · 직원 도감에서 지원 영웅 1명을 선택해요.':'Permanently hired from packs · Choose one support hero in Staff.',
  '근무 명단 변경은 즉시 저장돼요. 당직 시작 전 5명을 채워주세요.':'Roster changes save immediately. Fill all five slots before starting.',
  '근무 명단에서 해제':'Remove from team','근무 명단에 추가':'Add to team','입사 이야기 보기 →':'Read first-day story →',
  '채용 직원':'Hired staff','미채용':'Not hired','미채용 직원':'Unhired staff','채용 후 공개':'Revealed after hiring','편성 중':'On team','지원 중':'Supporting','고용 완료':'Hired','채용 완료':'Recruited','근무 가능':'Available','근무 편성':'On team',
  '모든 직원을 채용했어요!':'All staff recruited!','직원을 눌러 인사기록을 확인하세요':'Select staff to view their records.','채용 전에는 실루엣만 공개돼요':'Only silhouettes are shown before hiring.',
  '채용팩에서 획득':'Found in hiring packs','지원 1명 선택':'Choose one support',
  '수고했어요, 고비!':'Good work, Gobi!','근무 결과':'Shift report','이번 당직 수당':'Shift allowance','보유 코인에 반영했어요.':'Added to your coin balance.','도달 웨이브':'Wave reached','저지한 용사':'Adventurers stopped',
  '직원별 근무 기록':'Staff contributions','당직 분석':'Shift analysis','보상 내역·다음 안내':'Rewards & next steps','다시 당직 서기':'Start another shift','보상으로 훈련하기':'Train with rewards','로비로 돌아가기':'Return to lobby','왕좌가 돌파됐어요':'Throne breached'
 });
 GameLanguage.register(entries);
 const coverage=Object.freeze({castle:CastleStories.length,hiring:window.HIRING_STORIES.length,personnel:staffRecords.length});
 if(typeof MutationObserver!=='function'||typeof document.getElementById!=='function')return Object.freeze({apply:()=>{},refresh:()=>{},coverage});
 const watched=new WeakSet();
 function apply(root){if(root)GameLanguage.translateTree(root)}
 function watch(root){if(!root||watched.has(root))return;watched.add(root);new MutationObserver(()=>apply(root)).observe(root,{subtree:true,childList:true,characterData:true});apply(root)}
 function surfaces(){for(const id of ['promo','hiring-story','story-archive','roster','result'])watch(document.getElementById(id));watch(document.getElementById('asset-roster-host')?.shadowRoot)}
 // Rendering hooks handle every page, including replays; observers handle the
 // late-created dossier tabs and image-error text, rather than the whole game.
 for(const name of ['renderCastleStory','renderStoryArchive','showStaffRecord','showLockedRecord','renderStaffArchive']){
  const previous=window[name];if(typeof previous==='function')window[name]=function(...args){const value=previous.apply(this,args);surfaces();for(const id of ['promo','story-archive','roster'])apply(document.getElementById(id));apply(document.getElementById('asset-roster-host')?.shadowRoot);return value};
 }
 const refresh=()=>{surfaces();for(const id of ['promo','hiring-story','story-archive','roster','result'])apply(document.getElementById(id));apply(document.getElementById('asset-roster-host')?.shadowRoot)};
 GameLanguage.subscribe(refresh);new MutationObserver(surfaces).observe(document.body,{childList:true});refresh();
 return Object.freeze({apply,refresh,coverage});
})();
