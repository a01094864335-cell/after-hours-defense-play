'use strict';
// Character identity is separate from battle kinds: dossier names never change combat rules.
const staffIdentity=[
 ['브릭','경비반','성문보다 퇴근 시간을 더 철저히 지키는 작은 경비원.','제 근무 시간엔, 무단입장 안 됩니다!','문지기 · 꼼꼼함','#e9c66e'],
 ['토르크','시설관리팀','고장 난 건 뭐든 고치지만, 용사는 일단 분해하고 본다.','고장 났어요? 일단 한 대 쳐볼게요.','수리광 · 호탕함','#ee9979'],
 ['뽀득','환경미화팀','반짝이는 바닥을 사랑하는 슬라임. 흙 묻은 용사 신발이 제일 싫다.','용사님, 방금 닦았거든요?','깔끔쟁이 · 말랑함','#7adbd7'],
 ['고비','야간 당직실','첫 출근에 성의 운명까지 인수인계받은 신입. 떨리는 손으로도 장부는 놓지 않는다.','일단… 오늘 밤만 무사히 넘겨봐요!','신입 · 책임감','#bfd892'],
 ['찌릿','전력관리팀','정전보다 심심한 밤이 싫은 도마뱀 기사. 꼬리 끝까지 에너지가 넘친다.','전기세는 제가 낼 테니, 쭉 연결해요!','에너지 과다 · 장난꾸러기','#ffe075'],
 ['루프','심야 배송팀','벽도 군단도 통과하는 유령 배달부. 수취인 부재라는 말은 모른다.','특급 배송이요! 방패 너머까지 갑니다~','시간 엄수 · 낙천적','#a5e9d5']
];
const staffRecords=kinds.slice(0,6).map((k,i)=>({id:k.file,name:staffIdentity[i][0],job:k.name,dept:staffIdentity[i][1],story:staffIdentity[i][2],quote:staffIdentity[i][3],traits:staffIdentity[i][4],color:staffIdentity[i][5],group:'staff',image:'assets/pixel/'+k.file+'.webp',role:roles[i],ability:[
 '가장 앞선 적 한 명에게 석궁을 발사합니다. 기본 피해 14 · 기본 간격 0.8초.',
 '선두 적 주변 반경 65 안의 적을 함께 공격합니다. 기본 피해 20 · 기본 간격 1.5초.',
 '세제 공격으로 2초간 이동 속도를 50% 낮춥니다. 군단장에게는 25% 감속. 기본 피해 5 · 기본 간격 1.1초.',
 '5초마다 등급 × (5 + 장비 레벨 × 2) SP를 생산합니다. 직접 공격은 하지 않습니다.',
 '130 거리 안의 적에게 최대 3명까지 번개를 연결합니다. 기본 피해 16, 다음 대상마다 80%로 감소 · 기본 간격 1.25초.',
 '일직선 경로의 적들을 관통하는 소포를 던집니다. 기본 피해 20 · 기본 간격 1.4초.'
 ][i],skill:skillNames[i],skillText:skillDescriptions[i]+' · 재사용 20초',status:'근무 가능'}));
const incomingStaff=[
 ['bat-nurse','나비','박쥐 간호사','의무실','약화 지원','다친 동료를 보면 졸음도 달아나는 야간 간호사. 용사에게는 조금 따끔한 처방을 내린다.','따끔해요~ 엄살은 접수 안 돼요.','다정함 · 단호함','#dba2dc','따끔한 처방','적에게 표식을 남겨 받는 피해를 늘리는 약화 공격.','집중 진료','체력이 가장 높은 적에게 강한 약화 표식을 부여.'],
 ['skeleton-chef','보니','해골 요리사','야간 급식실','지속 피해','직원들의 야식을 책임지는 해골 요리사. 뼈는 앙상해도 인심은 푸짐하다.','뜨거우니까 천천히… 아니, 용사는 빨리!','큰손 · 야식 장인','#efb68a','오늘의 매운 수프','뜨거운 수프로 적에게 화상 지속 피해.','야식 대잔치','넓은 범위에 수프를 쏟아 화상 지대 생성.'],
 ['mimic-storekeeper','덥석','미믹 창고지기','물류 창고','마무리 공격','재고는 한 개도 놓치지 않는 살아 있는 창고. 미등록 용사는 일단 입고 처리한다.','반품은 안 됩니다. 꿀꺽!','수집벽 · 먹성','#d5a26f','미등록 입고','체력이 낮은 적을 노리는 마무리 공격.','긴급 재고 정리','약해진 일반 적을 삼키고 군단장에게는 피해.'],
 ['spider-tailor','실비','거미 재봉사','피복 수선실','피해 연결','찢어진 망토도 어색한 팀워크도 꿰매는 재봉사. 여덟 손발이 늘 바쁘다.','도망가도 소용없어요. 실밥 잡았거든요.','섬세함 · 멀티태스커','#b9aae8','실로 묶인 운명','두 적을 실로 연결해 피해를 공유하게 하는 공격.','단체 수선','여러 적을 한꺼번에 연결.'],
 ['nightmare-counselor','몽실','악몽 상담사','마음 휴게실','스킬 방해','늘 졸려 보이지만 상대의 고민은 끝까지 듣는다. 용사의 전투 의욕도 재워버린다.','그 스킬, 내일 이야기해도 괜찮아요.','차분함 · 졸음 많음','#baaceb','잠깐 쉬어가요','적의 스킬 사용을 늦추는 방해 공격.','강제 상담 시간','일정 시간 적 스킬을 봉인.'],
 ['kobold-recruiter','도기','코볼트 인사담당','인사총무팀','동료 지원','빈 근무표를 보면 참지 못하는 열혈 인사담당. 도장을 찍는 속도만큼 채용도 빠르다.','복지는… 생존입니다! 함께해요!','추진력 · 동료애','#dfbe87','근무 독려','인접 직원의 공격 속도를 높이는 지원.','긴급 채용','빈 칸에 편성 직원 중 1등급 한 명을 무료 소환.']
];
for(const [id,name,job,dept,role,story,quote,traits,color,skill,ability,ultimate,skillText] of incomingStaff)staffRecords.push({id,name,job,dept,role,story,quote,traits,color,group:'incoming',image:'assets/staff-expansion/'+id+'.webp',ability,skill:ultimate,skillText,status:'입사 예정',basicName:skill});
[
 ['ward','본가드','계약 경호실','방어 지원','말수는 적지만 방패 뒤의 동료는 반드시 지키는 해골 계약직.','한 번은, 제가 막겠습니다.','묵묵함 · 의리','#a7c9ed','철벽 계약'],
 ['accountant','오울리','재무 지원실','운영비 지원','밤눈만큼 숫자에도 밝은 부엉이. 처치 실적을 한 푼도 빠짐없이 정산한다.','야근 수당, 제가 챙겨드릴게요.','계산 정확 · 현실적','#e3c68e','꼼꼼한 정산'],
 ['rescue','플레어','비상 대응실','광역 지원','비상벨보다 먼저 달려오는 작은 임프. 성 안에서 가장 뜨거운 동료다.','불렀어요? 이미 출동했어요!','행동파 · 열정','#efa28b','비상 출동']
].forEach(([key,name,dept,role,story,quote,traits,color,skill])=>{const k=mercCatalog[key];staffRecords.push({id:'merc-'+key,name,job:k.name,dept,role,story,quote,traits,color,group:'merc',image:'assets/mobile/merc-'+key+'.webp',ability:k.desc,skill,skillText:'보드 밖에서 자동 발동 · 당직 시작 전 1명 장착',status:'특수 용병',price:k.price})});
for(let i=0;i<RECRUIT_STAFF.length;i++){const r=staffRecords.find(v=>v.id===RECRUIT_STAFF[i]);r.ability=kinds[i+6].desc;r.skill=skillNames[i+6];r.skillText=skillDescriptions[i+6]+' · 재사용 20초';}
function staffOwned(r){return r.group==='merc'?meta.owned.includes(r.id.slice(5)):meta.staff.includes(r.id)}
// Numeric support rules stay visible in the employee dossier.
staffRecords.find(r=>r.id==='kobold-recruiter').ability='상하좌우 직원 공속 +[12 + (등급-1)×3 + (장비 Lv.-1)×2]%, 최대 38%. 여러 명이면 가장 높은 효과만 적용합니다. 기절 중에는 지원이 멈춥니다.';
staffRecords.find(r=>r.id==='nightmare-counselor').ability='기본 피해 10 · 간격 1.6초. 대상마다 2초에 한 번 스킬을 0.5초 지연하며 군단장은 0.2초만 지연합니다.';
staffRecords.find(r=>r.id==='skeleton-chef').ability='기본 피해 10 · 간격 1.6초. 4초간 초당 6×[1+(등급-1)×0.3]×장비 배수의 화상. 중첩하지 않고 가장 강한 화상만 적용하며 각 화상의 시간은 독립적입니다.';
function staffStatus(r){return staffOwned(r)?r.group==='merc'?'고용 완료':meta.deck.includes(r.id)?'근무 편성':'채용 완료':'미채용'}
let rosterGroup='staff',rosterSelected=null;
function renderStaffArchive(){
 const list=staffRecords.filter(r=>rosterGroup==='merc'?r.group==='merc':r.group!=='merc'&&(rosterGroup==='staff'?staffOwned(r):!staffOwned(r)));if(typeof renderStaffDeck==='function')renderStaffDeck();
 document.querySelector('#roster-list').innerHTML=list.map(r=>{const owned=staffOwned(r);return `<button class="staff-pass ${owned?'':'staff-locked'}" data-staff="${r.id}" style="--staff-accent:${owned?r.color:'#9b8caa'}" aria-label="${owned?r.name+', '+r.job:'미채용 직원'} 인사기록 보기"><span class="pass-meta">NIGHT OFFICE <b>${staffStatus(r)}</b></span><span class="pass-portrait"><img src="${r.image}" alt="" loading="lazy">${owned?'':'<b class="locked-mark">?</b>'}</span><span class="pass-job">${owned?r.job:'봉인된 인사기록'}</span><span class="pass-role">${owned?r.role:'채용 후 공개'}</span><span class="pass-quote">${owned?'“'+r.quote+'”':'어떤 동료가 기다리고 있을까요?'}</span><span class="pass-open">${owned?r.name:'???'}</span></button>`}).join('')||'<p class="archive-empty">모든 직원을 채용했어요!</p>';
 for(const r of list)document.querySelector('[data-staff="'+r.id+'"]').onclick=()=>showStaffRecord(r.id);
 for(const key of ['staff','incoming','merc']){const b=document.querySelector('#roster-tab-'+key);b.classList.toggle('active',key===rosterGroup);b.setAttribute('aria-pressed',String(key===rosterGroup))}
 document.querySelector('#roster-tab-staff').textContent='채용 직원 '+meta.staff.length;
 document.querySelector('#roster-tab-incoming').textContent='미채용 '+(12-meta.staff.length);
 document.querySelector('#roster-note').textContent=rosterGroup==='incoming'?'채용팩으로 새로운 동료를 만나세요. 채용 전에는 실루엣만 공개돼요.':rosterGroup==='merc'?'특수 용병은 상점에서 고용 후 보드 밖에 1명 장착할 수 있어요.':'사원증에서 근무 명단에 추가하거나 해제할 수 있어요.';
}
function showStaffRecord(id){
 const r=staffRecords.find(r=>r.id===id);if(!r)return;rosterSelected=id;if(!staffOwned(r)){showLockedRecord(r);return;}
 const detail=document.querySelector('#roster-detail');detail.innerHTML=`<div class="dossier-hero" style="--staff-accent:${r.color}"><span class="dossier-stamp">${staffStatus(r)}</span><small>PERSONNEL FILE · ${String(staffRecords.indexOf(r)+1).padStart(2,'0')}</small><img src="${r.image}" alt="${r.name}"><span>${r.dept} / ${r.job}</span><h3>${r.name}</h3><p>${r.traits}</p></div><blockquote>“${r.quote}”<small>당직에 임하는 한마디</small></blockquote><section class="dossier-section"><h4>어떤 동료인가요?</h4><p>${r.story}</p></section><section class="dossier-section"><h4>기본 능력 <span>${r.role}</span></h4><p>${r.ability}</p>${r.group==='staff'?'<small>기본 피해·간격은 장비 Lv.1, 1등급 기준. 등급이 높아지면 공격 간격이 짧아져요.</small>':''}</section><section class="dossier-section skill-file"><small>${r.group!=='merc'?'5등급 해금 · 수동 스킬':'자동 지원 능력'}</small><h4>${r.skill}</h4><p>${r.skillText}</p></section><p class="dossier-foot">${r.group==='merc'?r.price+' 글로벌 코인으로 영구 고용 · 상점에서 지원 용병 1명을 선택해요.':'근무 명단 변경은 즉시 저장돼요. 당직 시작 전 5명을 채워주세요.'}</p>`;
 if(r.group!=='merc'){detail.innerHTML+='<button id="staff-toggle" class="staff-action">'+(meta.deck.includes(id)?'근무 명단에서 해제':'근무 명단에 추가')+'</button><p id="detail-action-status" role="status"></p>';document.querySelector('#staff-toggle').onclick=()=>toggleStaff(id);}
 document.querySelector('#roster-overview').hidden=true;detail.hidden=false;document.querySelector('#roster-back').hidden=false;document.querySelector('#roster-title').textContent='직원 인사기록';document.querySelector('#roster').scrollTop=0;document.querySelector('#roster-back').focus?.();
}
function closeStaffRecord(restoreFocus=true){const previous=rosterSelected;rosterSelected=null;document.querySelector('#roster-detail').hidden=true;document.querySelector('#roster-overview').hidden=false;document.querySelector('#roster-back').hidden=true;document.querySelector('#roster-title').textContent='야간 인사기록부';if(restoreFocus&&previous)document.querySelector('[data-staff="'+previous+'"]')?.focus?.()}
for(const key of ['staff','incoming','merc'])document.querySelector('#roster-tab-'+key).onclick=()=>{rosterGroup=key;renderStaffArchive()};
document.querySelector('#roster-back').onclick=()=>closeStaffRecord();
document.querySelector('#roster-open').onclick=()=>{closeStaffRecord(false);renderStaffArchive();document.querySelector('#roster').showModal()};
document.querySelector('#roster-close').onclick=()=>document.querySelector('#roster').close();
renderStaffArchive();

function showLockedRecord(r){
 const isMerc=r.group==='merc';
 const detail=document.querySelector('#roster-detail');detail.innerHTML=`<div class="dossier-hero staff-locked"><small>SEALED PERSONNEL FILE</small><img src="${r.image}" alt="미채용 캐릭터 실루엣"><h3>???</h3><p>채용하면 이름과 능력이 공개돼요.</p></div><section class="dossier-section"><h4>새 동료를 만나는 방법</h4><p>${isMerc?'상점 → 특수 용병에서 '+r.price+'코인으로 영구 고용하세요. 보유 '+meta.coins+'코인 · '+(meta.coins<r.price?(r.price-meta.coins)+'코인 더 필요해요.':'지금 고용할 수 있어요.'):'상점에서 30 글로벌 코인으로 채용팩을 구매하세요. 6종 중 1명이 동일 확률로 등장해요.'}</p></section>${isMerc?'':`<section class="dossier-section"><h4>지정 채용</h4><p>중복 채용으로 모은 포인트로 이 직원을 확정 채용해요.<br>보유 ${meta.recruitPoints} / 필요 ${RECRUIT_POINTS} 포인트</p><button id="recruit-specific" class="staff-action">${RECRUIT_POINTS} 포인트 · 이 직원 채용</button></section>`}<button id="archive-shop" class="staff-action">${isMerc?'용병 상점으로':'채용팩 상점으로'} →</button>`;
 if(!isMerc){const b=document.querySelector('#recruit-specific');b.disabled=!!saveWarning||meta.recruitPoints<RECRUIT_POINTS||playing&&!ended;b.onclick=()=>recruitByPoints(r.id)}
 document.querySelector('#archive-shop').onclick=()=>{document.querySelector('#roster').close();document.querySelector('#shop-open').onclick();shopTab(isMerc?'mercs':'items')};
 document.querySelector('#roster-overview').hidden=true;detail.hidden=false;document.querySelector('#roster-back').hidden=false;document.querySelector('#roster-title').textContent='봉인된 인사기록';document.querySelector('#roster').scrollTop=0;document.querySelector('#roster-back').focus?.();
}
