'use strict';
const TRAINING_MAX=30,TRAINING_MILESTONES=[5,10,20,30];
let runTraining=null,wardChargesUsed=0;
function validTraining(t){return !!t&&['staff','merc'].every(k=>Number.isInteger(t[k])&&t[k]>=1&&t[k]<=TRAINING_MAX)}
function trainingLevel(group,battle=true){const value=battle&&typeof playing!=='undefined'&&playing&&runTraining?runTraining:meta.training;return value?.[group]||1}
function trainingTier(group='staff',level=trainingLevel(group)){return TRAINING_MILESTONES.filter(n=>level>=n).length}
function trainingCost(level){return level>=TRAINING_MAX?0:Math.round((8+2*(level-1)+.6*(level-1)**2)/2)*2}
function staffTrainingMultiplier(level=trainingLevel('staff')){return 1+(level-1)*.8/29}
const GRADE_POWER=Object.freeze([1,1.05,1.2,1.5,2,2.7,3.8]);
function gradePower(pip){return GRADE_POWER[Math.max(1,Math.min(7,pip||1))-1]}
function enemyGrowth(base,early,late,w){return base*Math.pow(early,Math.min(w,15))*Math.pow(late,Math.max(0,w-15))}
function staffPower(type){return (1+(levels[type]-1)*.45)*staffTrainingMultiplier()}
function trainingIncome(u){const base=u.pip*(7+(levels[3]-1)*2)*(1+(trainingLevel('staff')-1)*.4/29);u.paydays=(u.paydays||0)+1;return Math.round((base+(u.paydays%5===0?u.pip*trainingTier():0))*100)/100}
function trainingAttack(u,damage){if(u.type!==0)return damage;u.shots=(u.shots||0)+1;const t=trainingTier();return t&&u.shots%(t>=2?7:8)===0?damage*([1,1.2,1.2,1.35,1.5][t]):damage}
function trainingSlow(e){const tier=e.slowTrainingTier||0,level=e.slowTrainingLevel||1,progress=(level-1)/29;return e.type==='boss'?Math.max(.65,.75-tier*.01-progress*.03):Math.max(.35,.5-tier*.01-progress*.06)}
function mercInterval(){const level=trainingLevel('merc');return level>=30?13:level>=10?14:15}
function mercDamageRate(){return .08+(trainingLevel('merc')-1)*.0005}
function accountantIncome(){const tier=trainingTier('merc');return 2+(trainingLevel('merc')-1)*.02+(kills%10===0?tier*2:0)}
function wardCapacity(){return trainingLevel('merc')>=30?2:1}
function trainedMercDescription(key,battle=false){const extra=expansionMercDescription(key,battle);if(extra)return extra;const level=trainingLevel('merc',battle),tier=trainingTier('merc',level);if(key==='accountant')return '처치마다 +'+(2+(level-1)*.02).toFixed(2)+' SP'+(tier?' · 10처치마다 +'+tier*2+' SP':'');if(key==='rescue')return (level>=30?13:level>=10?14:15)+'초마다 전 적 최대 HP의 '+((.08+(level-1)*.0005)*100).toFixed(2)+'% 피해'+(tier?' · 피해 +10% 표식 '+(level>=20?2:1)+'초':'');return '첫 돌파 '+(level>=30?2:1)+'회 완전 방어'+(tier?' · 발동 시 전체 감속':'')+(level>1?' · 발동 정산 +'+((level-1)*.5+(level>=10?10:0))+' SP':'')+(level>=20?' · 짧은 전체 정지':'')}
function trainGroup(group){
 if(!['staff','merc'].includes(group)||saveWarning)return false;
 if(typeof playing!=='undefined'&&playing&&!ended){showMetaStatus('영구 훈련은 당직이 끝난 뒤에 할 수 있어요.');return false}
 const level=trainingLevel(group,false),price=trainingCost(level);
 if(level>=TRAINING_MAX||meta.coins<price)return false;
 if(!saveChange(d=>{if(!validTraining(d.training))d.training={staff:1,merc:1};d.coins-=price;d.training[group]=level+1}))return false;
 // Units prepared in the lobby receive the new training when this shift starts.
 runTraining={...meta.training};showMetaStatus((group==='staff'?'직원':'특수 용병')+' 훈련 Lv.'+(level+1)+' 완료 · 다음 당직에도 유지돼요.');
 renderMeta();if(typeof renderTraining==='function')renderTraining();return true;
}
const trainingEffectText={
 'goblin-guard':['8번째 평타 피해 +20%','강화 화살 주기 8→7회','강화 화살 피해 +35%','강화 화살 피해 +50%'],
 'orc-technician':['폭발 반경 65→70','폭발 반경 70→75','폭발 반경 75→80','폭발 반경 80→85'],
 'slime-cleaner':['감속 시간 +0.1초·감속률 +1%p','누적 시간 +0.2초·감속률 +2%p','누적 시간 +0.3초·감속률 +3%p','누적 시간 +0.4초·감속률 +4%p'],
 'gobi':['매 5회 수입에 등급×1 SP 추가','추가 정산 등급×2 SP','추가 정산 등급×3 SP','추가 정산 등급×4 SP'],
 'electric-technician':['연쇄 탐색 거리 130→140','연쇄 피해 유지율 80→85%','연쇄 표적 최대 3→4명','연쇄 피해 유지율 85→90%'],
 'ghost-courier':['관통 반폭 24→26','관통 반폭 26→28','관통 반폭 28→30','관통 반폭 30→32'],
 'bat-nurse':['평타·스킬 표식 +0.25초','누적 표식 시간 +0.5초','누적 표식 시간 +0.75초','누적 표식 시간 +1초'],
 'skeleton-chef':['평타·스킬 화상 +0.25초','누적 화상 시간 +0.5초','누적 화상 시간 +0.75초','누적 화상 시간 +1초'],
 'mimic-storekeeper':['마무리 기준 HP 30→31%','마무리 기준 HP 31→32%','마무리 기준 HP 32→33%','마무리 기준 HP 33→34%'],
 'spider-tailor':['스킬 연결 5→6명·공유 36%','스킬 연결 6→7명·공유 37%','평타 연결 2→3명·스킬 8명·공유 38%','스킬 연결 8→9명·공유 39%'],
 'nightmare-counselor':['지연 일반 +0.025초·군단장 +0.01초','누적 일반 +0.05초·군단장 +0.02초','누적 일반 +0.075초·군단장 +0.03초','누적 일반 +0.1초·군단장 +0.04초'],
 'kobold-recruiter':['긴급 채용 시 +10 SP','긴급 채용 시 +20 SP','긴급 채용 시 +30 SP','긴급 채용 시 +40 SP'],
 'ward':['방어 발동 시 전 적 1초 감속','방어 발동 시 +10 SP','방어 발동 시 일반 1초·군단장 0.5초 정지','한 판 방어 횟수 1→2회'],
 'accountant':['10처치마다 +2 SP','10처치마다 +4 SP','10처치마다 +6 SP','10처치마다 +8 SP'],
 'rescue':['지원 사격 후 피해 +10% 표식 1초','지원 주기 15→14초','약화 표식 1→2초','지원 주기 14→13초']
};

Object.assign(trainingEffectText,{
 'duru-archivist':['보호막 배수 2.5→2.6','보호막 배수 2.6→2.7','보호막 배수 2.7→2.8','보호막 배수 2.8→2.9'],
 'kkangtong-engineer':['기본 밀기 +2 · 스킬 +3','기본 밀기 +4 · 스킬 +6','기본 밀기 +6 · 스킬 +9','기본 밀기 +8 · 스킬 +12'],
 'ddangkong-miner':['강화 지뢰 피해 +5%','강화 지뢰 피해 +10%','강화 지뢰 피해 +15%','강화 지뢰 피해 +20%'],
 'chalkak-photographer':['집중 중첩당 +13%','집중 중첩당 +14%','집중 중첩당 +15%','집중 중첩당 +16%'],
 'bongtu-postmaster':['충전 +0.5%p · 결재 상한 6.25초','충전 +1%p · 결재 상한 6.5초','충전 +1.5%p · 결재 상한 6.75초','충전 +2%p · 결재 상한 7초'],
 'chikchik':['무료 소환 시 +3 SP','무료 소환 시 +6 SP','무료 소환 시 +9 SP','무료 소환 시 +12 SP'],
 'banchang':['정화 간격 7.5초','정화 간격 7초','정화 2명 · 간격 6.5초','정화 간격 6초'],
 'coco':['정지 1.1초 · 간격 9.5초','정지 1.2초 · 간격 9초','대상 4명 · 정지 1.3초 · 간격 8.5초','정지 1.4초 · 간격 8초'],
 'q':['6.5초간 피해 +22.5%','7초간 피해 +25%','7.5초간 피해 +27.5%','8초간 피해 +30%']
});
function trainingDossier(record){const group=record.group==='merc'?'merc':'staff',id=record.id.replace(/^merc-/,''),level=trainingLevel(group,false);return '<section class="dossier-section"><h4>영구 훈련 Lv.'+level+' / 30</h4><p>'+(group==='staff'?'공격 피해 +'+((staffTrainingMultiplier(level)-1)*100).toFixed(1)+'% · SP 장비와 별도 곱셈':'특수 용병 전체에 공통 적용')+'</p>'+trainingEffectText[id].map((text,i)=>'<p>'+ (level>=TRAINING_MILESTONES[i]?'✓ 해금':'잠김')+' · Lv.'+TRAINING_MILESTONES[i]+' '+text+'</p>').join('')+'</section>'}
