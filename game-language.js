'use strict';
// Device preference only; never rewrite wallet, run snapshots or imported saves.
const GameLanguage=(()=>{
 const key='after-hours-language-v1',listeners=new Set(),originals=new WeakMap();
 const messages={

  "일반 직원 17종 각 약 5.29%, 지원 영웅 7종 각 약 1.43%. 9팩 연속 미보유 지원을 만나지 못하면 다음 팩은 미보유 지원 중 균등 확률로 확정됩니다. 미보유 지원 채용 시 보장 횟수가 초기화됩니다.": "17 staff · ~5.29% each; 7 supports · ~1.43% each. After 9 packs without unowned support, the next guarantees one with equal odds. Recruiting unowned support resets the counter.",
  "중복은 채용 포인트 +1. 일반 직원은 3포인트, 지원 영웅은 10포인트로 도감에서 지정 채용할 수 있습니다.": "Duplicate: +1 point. Choose staff for 3 points or support for 10 in the roster."
,
  '지급 완료':'Paid','저장 재시도 필요':'Retry saving',
  '등급 합성권':'Rank merge ticket','종류 합성권':'Kind merge ticket','마왕 깨우기':'Wake the king',
  '종류가 달라도 같은 등급 합성':'Merge matching ranks across kinds',
  '등급이 달라도 같은 종류 합성':'Merge matching kinds across ranks',
  '현재 적이 있을 때 마왕 즉시 출동':'Call the king while enemies are present',

  '주 메뉴':'Main navigation','당직 메뉴':'Settings','설정':'Settings','언어':'Language','확인':'Done','닫기':'Close','뒤로':'Back',
  '효과음':'Sound effects','효과음 볼륨':'Effects volume','효과음 켜기':'Enable effects','효과음 끄기':'Mute effects','배경 음악':'Music','배경음악':'Music','배경 음악 볼륨':'Music volume','BGM 볼륨':'Music volume','BGM 켜기':'Enable music','BGM 끄기':'Mute music',
  '화면과 연출':'Display & effects','당직 도구':'Shift tools','이야기와 저장':'Stories & saves','현재 당직 초기화':'Reset this shift','근무 안내':'How to play','당직 안내':'How to play','훈련소':'Training','야간 훈련소':'Training room','스토리 다시 보기':'Replay stories','이야기 다시 보기':'Replay stories','이야기 보기':'View stories','저장 기록 내보내기 · 가져오기':'Export / import saves','기록 내보내기·가져오기':'Export / import saves','저장 내보내기 / 가져오기':'Export / import saves','현재 판 초기화':'Reset current run','처음부터 다시':'Start over','초기화':'Reset','절전 모드 켜짐 · 30 FPS':'Power saving · 30 FPS','부드러운 화면 · 60 FPS':'Smooth display · 60 FPS',
  '화면을 한 번 누르면 음악이 시작돼요.':'Tap the screen to start music.','음악을 불러오지 못했어요. 잠시 후 BGM을 다시 켜주세요.':'Music could not load. Try enabling it again.',
  '신입 고비':'Gobi','이야기':'Stories','이야기 도감':'Story collection','수료 선물':'Graduation gift','수료 선물 직원 선택':'Choose your graduation gift','오늘의 변주':'Daily twist','오늘의 변주 보기':'View daily twist','신입 연수':'Orientation','오늘의 근무 직원':'On duty today','지원 영웅':'Support','지원 영웅 선택':'Choose support','선택하기':'Choose','당직 준비':'Prepare shift','저장된 근무 이어하기':'Resume shift','▶ 저장된 근무 이어하기':'▶ Resume shift','저장된 근무 없음':'No saved shift','당직실':'Lobby','직원 도감':'Staff','상점':'Shop','편성 ›':'Edit ›','근무 중':'On duty','연수 후 편성':'Edit after training','싱글 플레이':'Solo','마왕성 야간 방어':'Castle night defense','신입 연수 · 10웨이브':'Training · 10 waves','신입 연수 · 기본 규칙':'Training · Standard','이전 당직 · 기본 규칙':'Saved shift · Standard rules','기본 규칙':'Standard rules',
  '신입 연수를 마친 뒤 근무 직원을 바꿀 수 있어요.':'Complete orientation to change your team.','진행 중인 근무를 마친 뒤 편성할 수 있어요.':'Finish this shift to edit your team.','현재 판을 종료하거나 초기화한 뒤 편성할 수 있어요.':'End or reset this run to edit your team.','현재 상태에서는 사용할 수 없어요.':'Unavailable right now.',
  '근무 편성':'Team selection','오늘의 당직':'On duty','저장 백업 · 기기 옮기기':'Back up / transfer saves','영구 훈련소':'Permanent training','스킬 연출 · 간결하게':'Skill effects · Compact','스킬 연출 · 크게 보기':'Skill effects · Full','이 브라우저는 효과음을 지원하지 않아요':'Sound effects are unavailable in this browser.',
  '현재 전투의 웨이브·배치·장비 레벨·SP를 초기화하며 미정산 처치 보상은 지급하지 않아요. 보유 코인·영구 고용·저장된 근무 명단은 유지돼요. 이미 사용한 아이템은 반환하지 않아요.':'Resets this run’s waves, board, equipment and SP. Unsettled kill rewards are lost. Coins, recruited staff and saved teams are kept. Used items are not refunded.',
  '상점 닫기':'Close shop','도감 닫기':'Close staff list','훈련소 닫기':'Close training','이야기 닫기':'Close story','야간 파견 상점':'Shop','직원 훈련':'Staff training','특수 용병 훈련':'Support training','훈련하기':'Train','인사기록':'Staff records','완료':'Done','편성 완료':'Team ready','공방 나가기':'Leave workshop','확인했어요':'Got it',
  '알겠어요':'Got it','직원 소환':'Summon staff','빈칸에 랜덤 직원 소환 · SP 소모':'Spend SP → random staff in an empty cell.',
  '5등급 스킬 해금':'Rank 5 skills','★5 이상 직원 선택 → 스킬 사용 · 재사용 대기':'Select ★5+ staff to use skills. Cooldowns apply.',
  '같은 종류·등급 합성':'Merge matching staff','같은 종류·등급 2명 → 다음 등급의 랜덤 직원':'Match kind + rank → random staff one rank higher.',
  '합성 실패 확률은 2등급 5%부터 7등급 30%까지 증가해요. 실패하면 이동한 직원만 사라져요. 합성권은 선택 후 두 직원을 고르면 사용돼요.':'Failure chance rises from 5% at rank 2 to 30% at rank 7. Only the moving staff is lost on failure. Select a merge ticket, then choose two staff to use it.',
  '키보드 조작':'Keyboard controls','키보드: 보드에 Tab으로 이동한 뒤 방향키로 칸 이동, Enter·Space로 선택·합성, Escape로 선택 취소, S로 선택 직원 스킬을 사용해요.':'Tab to the board. Use arrow keys to move, Enter or Space to select or merge, Escape to cancel, and S to use the selected staff skill.',
  '잠깐 쉬어 갈까요?':'Take a break?','전투는 잠시 멈춰 있어요':'The battle is paused.','계속 근무':'Continue shift','근무 종료':'End shift',
  '정예 당직':'Elite shift','화력 지원':'Fire support','느긋한 침입자':'Slow invaders','야식 보급':'Late-night supplies','정비 할인':'Maintenance discount','마력 충전':'Mana recharge','성과급 당직':'Bonus pay','긴축 근무':'Austerity shift','급행 군단':'Marching legion','군단장 특별 훈련':'Boss training','꽁꽁 얼어붙은 밤':'Freezing night','수상한 보급품':'Suspicious supplies','속전속결':'Blitz','위험 수당':'Hazard pay','마력 과부하':'Mana overload'
 };
 const reverse=new Map(Object.entries(messages).map(([ko,en])=>[en,ko]));
 function register(entries){for(const [ko,en] of Object.entries(entries)){if(typeof en!=='string'||!en.trim())throw Error('Empty translation: '+ko);messages[ko]=en;reverse.set(en,ko)}}
 let language='ko';try{const saved=GameStorage.getItem(key);if(saved==='ko'||saved==='en')language=saved}catch{}
 function t(value){const text=String(value),trimmed=text.trim();if(language==='ko')return text;const translated=messages[trimmed];return translated?text.replace(trimmed,translated):text;}
 function apply(){if(document.documentElement)document.documentElement.lang=language;for(const fn of listeners)fn(language);}
 function set(value){if(value!=='ko'&&value!=='en')return false;try{GameStorage.setItem(key,value)}catch{return false}if(language!==value){language=value;apply()}return true;}
 function subscribe(fn){listeners.add(fn);return ()=>listeners.delete(fn)}
 // Explicitly translate known presentation surfaces, never gameplay-owned data.
 function translateTree(root){
  if(!root||typeof document.createTreeWalker!=='function')return;
  const walker=document.createTreeWalker(root,4);let node;
  while((node=walker.nextNode())){
   if(node.parentElement?.closest('script,style,svg,textarea,[data-no-translate]'))continue;
   const value=node.nodeValue,previous=originals.get(node);let source=previous&&value===previous.translated?previous.source:value;
   const trimmed=source.trim();if(reverse.has(trimmed))source=source.replace(trimmed,reverse.get(trimmed));
   const translated=t(source);originals.set(node,{source,translated});if(value!==translated)node.nodeValue=translated;
  }
  const selector='button[aria-label],img[alt],input[aria-label],nav[aria-label],[role="img"][aria-label]';
  for(const el of [...(root.matches?.(selector)?[root]:[]),...root.querySelectorAll(selector)]){
   if(el.closest('[data-no-translate]'))continue;
   const attr=el.tagName==='IMG'?'alt':'aria-label',value=el.getAttribute(attr),source=reverse.get(value)||value,translated=t(source);if(value!==translated)el.setAttribute(attr,translated);
  }
 }
 if(document.documentElement)document.documentElement.lang=language;
 window.addEventListener?.('storage',event=>{if(GMTest.enabled||GMTest.fresh||event.key!==key||!['ko','en'].includes(event.newValue)||event.newValue===language)return;language=event.newValue;apply()});
 return Object.freeze({key,t,set,subscribe,translateTree,register,get current(){return language}});
})();
window.GameLanguage=GameLanguage;
