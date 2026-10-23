'use strict';
// One pack: 90% board staff, 10% off-board support. Owned heroes yield points.
const RECRUIT_SUPPORT_RATE=.10;
function packComplete(){return [...BASE_STAFF,...RECRUIT_STAFF].every(id=>meta.staff.includes(id))&&Object.keys(mercCatalog).every(id=>meta.owned.includes(id))}
renderRecruitShop=function(){
 const b=document.querySelector('#buy-staff-pack'),complete=packComplete(),busy=playing&&!ended;
 b.disabled=!!saveWarning||meta.coins<PACK_PRICE||complete||busy;
 b.textContent=complete?'전체 영웅 채용 완료':busy?'당직 종료 후 채용 가능':PACK_PRICE+' 코인 · 채용팩 열기'+(meta.coins<PACK_PRICE?' · '+(PACK_PRICE-meta.coins)+'코인 부족':'');
 document.querySelector('#recruit-balance').textContent='보유 '+meta.coins+' 코인 · 채용 포인트 '+meta.recruitPoints+' / '+RECRUIT_POINTS;
};
buyStaffPack=function(){
 if(saveWarning||meta.coins<PACK_PRICE||playing&&!ended||packComplete())return false;
 const support=Math.random()<RECRUIT_SUPPORT_RATE,pool=support?Object.keys(mercCatalog):[...BASE_STAFF,...RECRUIT_STAFF],id=pool[Math.floor(Math.random()*pool.length)];
 const duplicate=(support?meta.owned:meta.staff).includes(id);
 if(!saveChange(d=>{d.coins-=PACK_PRICE;if(duplicate)d.recruitPoints++;else if(support)d.owned.push(id);else d.staff.push(id)}))return false;
 revealRecruit(support?'merc-'+id:id,duplicate);return true;
};
revealRecruit=function(id,duplicate){
 const r=staffRecords.find(r=>r.id===id),support=r.group==='merc';
 document.querySelector('#recruit-result').innerHTML='<div class="recruit-reveal"><img src="'+r.image+'" alt="'+r.name+'"><b>'+(duplicate?'다시 만난 동료':support?'희귀 지원 영웅 도착!':'새 동료 도착!')+'</b><strong>'+r.name+' · '+r.job+'</strong><p>'+(duplicate?'중복 채용 → 채용 포인트 +1<br>'+RECRUIT_POINTS+'포인트로 미채용 일반 직원 1명을 지정 채용해요.<br>현재 '+meta.recruitPoints+'포인트':'“'+r.quote+'”<br>'+(support?'직원 도감 → 지원 영웅에서 선택해주세요.':'직원 도감에서 근무 명단에 넣어주세요.'))+'</p></div>';
 renderStaffArchive();renderMeta();document.querySelector('#recruit-dialog')?.showModal();
};
// Keep the legacy entry point selection-only, including callers outside the archive.
buyMerc=function(key){
 if(!mercCatalog[key]||!meta.owned.includes(key)||playing&&!ended){showMetaStatus('보유한 지원 영웅은 당직 시작 전 또는 종료 후 선택할 수 있어요.');return false}
 if(!saveChange(d=>{d.equipped=d.equipped===key?null:key}))return false;
 renderMeta();return true;
};
function openSupportArchive(){
 if(document.querySelector('#shop').open)document.querySelector('#shop').close();
 document.querySelector('#roster-open').onclick();rosterGroup='merc';renderStaffArchive();
}
const showPackRecord=showStaffRecord;
showStaffRecord=function(id){
 showPackRecord(id);const r=staffRecords.find(r=>r.id===id);if(!r||r.group!=='merc'||!staffOwned(r))return;
 const detail=document.querySelector('#roster-detail'),button=document.createElement('button');button.id='support-equip';button.className='staff-action';button.textContent=meta.equipped===id.slice(5)?'선택 중 · 해제':'지원 영웅으로 선택';button.disabled=!!saveWarning||playing&&!ended;
 button.onclick=()=>{if(buyMerc(id.slice(5))){renderStaffArchive();showStaffRecord(id)}};detail.append(button);
};
shopTab=function(tab){
 const items=tab==='items';document.querySelector('#shop-items').hidden=!items;document.querySelector('.recruit-shop').hidden=items;document.querySelector('#shop-mercs').hidden=true;
 document.querySelector('#shop-tab-items').classList.toggle('active',items);document.querySelector('#shop-tab-mercs').classList.toggle('active',!items);
 document.querySelector('#shop-tab-items').setAttribute('aria-pressed',String(items));document.querySelector('#shop-tab-mercs').setAttribute('aria-pressed',String(!items));
};
document.querySelector('#shop-tab-mercs').parentElement?.prepend(document.querySelector('#shop-tab-mercs'));document.querySelector('#shop-tab-mercs').textContent='채용팩';document.querySelector('#shop-tab-items').textContent='개별 아이템';document.querySelector('#shop-tab-mercs').onclick=()=>shopTab('pack');document.querySelector('#shop-tab-items').onclick=()=>shopTab('items');
const packSection=document.querySelector('.recruit-shop');packSection.querySelector('h3').textContent='영웅 채용팩';const facts=packSection.querySelector('.recruit-facts');if(facts)facts.innerHTML='<div><dt>가격</dt><dd>'+PACK_PRICE+' 코인</dd></div><div><dt>일반</dt><dd>90% · 12종 각 7.5%</dd></div><div><dt>지원</dt><dd>10% · 3종 각 약 3.33%</dd></div><div><dt>중복</dt><dd>채용 포인트 +1</dd></div>';packSection.querySelector('p').innerHTML='일반 직원 90% · 지원 영웅 10%<br>일반 12종 각 7.5% · 지원 3종 각 약 3.33%<br>중복은 채용 포인트 +1 · 3포인트로 일반 직원 지정 채용';
document.querySelector('#shop-to-roster').textContent='직원 도감 · 일반 편성 / 지원 영웅 선택 →';document.querySelector('#roster-tab-merc').textContent='지원 영웅 3';
const shopNote=document.querySelector('.shop-note');shopNote.querySelector('p').textContent='채용팩은 영구 고용 · 아이템은 개별 구매 / 1회 소비 · 글로벌 코인 전용';
document.querySelector('#buy-staff-pack').onclick=buyStaffPack;
const openPackShop=document.querySelector('#shop-open').onclick;document.querySelector('#shop-open').onclick=()=>{shopTab('pack');openPackShop()};
shopTab('pack');renderMeta();
