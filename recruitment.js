'use strict';
function renderRecruitShop(){
 uiText(document.querySelector('#staff-pack-price'),PACK_PRICE+' 코인');
 const allHired=RECRUIT_STAFF.every(id=>meta.staff.includes(id));
 const button=document.querySelector('#buy-staff-pack');button.disabled=!!saveWarning||meta.coins<PACK_PRICE||allHired||playing&&!ended;
 button.textContent=allHired?'전 직원 채용 완료':playing&&!ended?'당직 종료 후 채용 가능':PACK_PRICE+' 코인 · 채용팩 열기'+(meta.coins<PACK_PRICE?' · '+(PACK_PRICE-meta.coins)+'코인 부족':'');
 document.querySelector('#recruit-balance').textContent='보유 '+meta.coins+' 코인 · 채용 포인트 '+meta.recruitPoints+' / '+RECRUIT_POINTS;
}
// Use the browser top layer: a scrolled shop must never clip a purchase result.
const recruitDialog=document.createElement('dialog');recruitDialog.id='recruit-dialog';
recruitDialog.setAttribute('aria-label','직원 채용 결과');
recruitDialog.append(document.querySelector('#recruit-result'));document.body.append(recruitDialog);
function closeRecruit(){recruitDialog.close();document.querySelector('#recruit-result').replaceChildren()}
recruitDialog.addEventListener('keydown',e=>{
 if(e.key!=='Tab')return;
 const buttons=[...recruitDialog.querySelectorAll('button:not(:disabled)')];
 const first=buttons[0],last=buttons[buttons.length-1];
 if(!first)return;
 if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus()}
 else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus()}
});
recruitDialog.addEventListener('cancel',e=>{e.preventDefault();closeRecruit()});
function revealRecruit(id,duplicate){
 const r=staffRecords.find(r=>r.id===id);
 document.querySelector('#recruit-result').innerHTML='<div class="recruit-reveal"><img src="'+r.image+'" alt="'+r.name+'"><b>'+(duplicate?'다시 만난 동료':'신입 사원 도착!')+'</b><strong>'+r.name+' · '+r.job+'</strong><p'+(duplicate?' class="recruit-point-guide"':'')+'>'+ (duplicate?'중복 채용 → 채용 포인트 +1<br>이미 보유한 직원 대신 받는 포인트예요.<br>'+RECRUIT_POINTS+'포인트로 미채용 직원 1명을 골라 채용해요.<br>사용: 직원 도감 → 미채용 → 지정 채용<br>현재 보유 '+meta.recruitPoints+'포인트':'“'+r.quote+'”<br>직원 도감에서 근무 명단에 넣어주세요.')+'</p></div>';
 renderRecruitShop();renderStaffArchive();renderMeta();
 document.querySelector('#recruit-dialog').showModal();
}
function buyStaffPack(){
 if(saveWarning||meta.coins<PACK_PRICE||playing&&!ended||RECRUIT_STAFF.every(id=>meta.staff.includes(id)))return false;
 const id=RECRUIT_STAFF[Math.floor(Math.random()*RECRUIT_STAFF.length)],duplicate=meta.staff.includes(id);
 if(!saveChange(d=>{d.coins-=PACK_PRICE;if(duplicate)d.recruitPoints++;else d.staff.push(id)}))return false;
 revealRecruit(id,duplicate);return true;
}
function recruitByPoints(id){
 if(saveWarning||playing&&!ended||!RECRUIT_STAFF.includes(id)||meta.staff.includes(id)||meta.recruitPoints<RECRUIT_POINTS)return false;
 if(!saveChange(d=>{d.recruitPoints-=RECRUIT_POINTS;d.staff.push(id)}))return false;
 renderMeta();renderStaffArchive();showStaffRecord(id);return true;
}
function toggleStaff(id){
 if((typeof tutorialMode!=='undefined'&&!meta.tutorialComplete)||saveWarning||playing&&!ended||board.some(Boolean)&&!ended){document.querySelector('#detail-action-status').textContent='현재 판을 종료하거나 초기화한 뒤 편성할 수 있어요.';return false}
 if(!meta.staff.includes(id))return false;
 const removing=meta.deck.includes(id);
 if(!removing&&meta.deck.length>=5){document.querySelector('#detail-action-status').textContent='근무 명단이 꽉 찼어요. 기존 직원 1명을 해제해주세요.';return false}
 if(!saveChange(d=>{d.deck=removing?d.deck.filter(key=>key!==id):[...d.deck,id]}))return false;
 renderStaffArchive();showStaffRecord(id);sync();return true;
}
function renderStaffDeck(){
 document.querySelector('#staff-deck').innerHTML='<b>오늘의 근무 명단 <em>'+meta.deck.length+' / 5</em></b><div class="deck-slots">'+Array.from({length:5},(_,i)=>{const id=meta.deck[i],r=staffRecords.find(v=>v.id===id);return r?'<button data-deck="'+id+'" aria-label="'+r.name+' 편성 관리"><img src="'+r.image+'" alt=""><small>'+r.name+'</small></button>':'<span class="empty-deck">＋<small>빈 자리</small></span>'}).join('')+'</div><p id="deck-status" role="status">'+(meta.deck.length===5?'선택한 5명만 각 20% 확률로 소환돼요.':'당직 시작 전에 정확히 5명을 골라주세요.')+'</p>';
 for(const id of meta.deck)document.querySelector('[data-deck="'+id+'"]').onclick=()=>showStaffRecord(id);
}
document.querySelector('#buy-staff-pack').onclick=buyStaffPack;
document.querySelector('#shop-to-roster').onclick=()=>{document.querySelector('#shop').close();document.querySelector('#roster-open').onclick()};
const enterBattle=document.querySelector('#enter-battle').onclick;
document.querySelector('#enter-battle').onclick=()=>{if(meta.deck.length!==5){document.querySelector('#roster-open').onclick();document.querySelector('#deck-status').textContent='당직을 시작하려면 5명을 편성해주세요.';return}enterBattle()};
renderStaffArchive();renderRecruitShop();
