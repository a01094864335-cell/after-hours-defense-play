'use strict';
// Stable IDs are appended to the existing roster; saved numeric types never move.
const NightExpansion = {
 staff: [
  {id:'duru-archivist',name:'두루',job:'미라 기록관',dept:'문서 검수실',color:'#ead1a1',damage:8,interval:1.4,role:'보호막 해체',object:'scroll',skill:'반려 도장',desc:'보호막 적 우선 · 보호막에 2.5배 피해',skillText:'선두 5명에게 등급 × 18 피해 · 보호막 피해 3배',story:'수백 년 묵은 서류도 꼼꼼하게 검수하는 미라. 침입 허가가 없는 용사는 반려한다.',quote:'허가서가 없네요. 반려입니다!',traits:'꼼꼼함 · 붕대와 두루마리'},
  {id:'kkangtong-engineer',name:'깡통',job:'자석 정비공',dept:'고철 정비실',color:'#f3a567',damage:12,interval:1.6,role:'밀어내기',object:'magnet',skill:'고철 반발장',desc:'일반 적을 20만큼 밀기 · 같은 적은 4초 후 재적용',skillText:'일반 적 전체를 45만큼 밀고 2초 감속 · 군단장 밀기 면역',story:'고철 더미에서 주운 부품으로 자신을 고치는 작은 정비공. 머리보다 큰 자석이 자랑이다.',quote:'붙어라! 아니, 이번엔 떨어져!',traits:'가분수 · 고철 수집가'},
  {id:'ddangkong-miner',name:'땅콩',job:'두더지 지뢰공',dept:'지하 보수반',color:'#e9bc64',damage:30,interval:3,role:'지뢰 설치',object:'mine',skill:'긴급 굴착',desc:'지뢰 2개 설치 · 0.45초 후 작동 · 12초 유지',skillText:'강화 지뢰 3개 설치 · 폭발 범위 70 · 같은 직원의 기존 지뢰 교체',story:'성 아래 배관을 다 외우는 두더지. 오늘의 공사는 용사들의 발밑에서 시작된다.',quote:'공사 중입니다! 발밑 조심!',traits:'안전제일 · 작은 앞발'},
  {id:'chalkak-photographer',name:'찰칵',job:'꼬마 유령 사진사',dept:'성문 사진실',color:'#7fcef5',damage:14,interval:1.5,role:'표적 집중',object:'camera',skill:'연속 촬영',desc:'같은 적 연속 촬영마다 피해 +12% · 최대 5중첩',skillText:'현재 표적에 등급 × 18 피해로 6회 연속 촬영 · 집중 중첩 적용',story:'어두운 후드 안에서 반짝이는 눈으로 야간 기록을 남기는 꼬마 유령. 군단장도 사진을 피할 수 없다.',quote:'움직이지 마세요. 찰칵!',traits:'수줍음 · 카메라 수집'},
  {id:'bongtu-postmaster',name:'봉투',job:'마력 우편원',dept:'사내 우편실',color:'#f6a9bf',damage:0,interval:2,role:'스킬 충전',object:'letter',skill:'긴급 결재',desc:'인접 5등급 이상 직원의 스킬 회복 속도 +12~30% · 중첩 안 됨',skillText:'인접 직원의 남은 스킬 대기시간 30% 단축 · 최대 6초 · 봉투끼리 지원 불가',story:'사내 결재가 밀리면 누구보다 바빠지는 작은 임프. 긴급 봉투에는 동료를 위한 마력이 담겨 있다.',quote:'긴급 결재입니다! 지금 열어주세요!',traits:'성실함 · 편지와 깃펜'}
 ],
 mercs: [
  {id:'chikchik',name:'칙칙',job:'유령 보급 기관사',dept:'야간 보급소',color:'#7dcaf3',price:45,object:'train',role:'무료 소환',skill:'보급 열차',desc:'5웨이브마다 다음 직원 소환 1회 무료 · 보유 상한 1회',story:'성벽 틈으로 작은 기차를 몰고 오는 유령 기관사. 가장 늦은 동료도 제시간에 데려온다.',quote:'다음 역은, 야간 근무 보드입니다!',traits:'시간 엄수 · 꼬마 기차'},
  {id:'banchang',name:'반창',job:'아홀로틀 의무관',dept:'응급 의무실',color:'#f49fc1',price:40,object:'potion',role:'기절 정화',skill:'말랑 처방',desc:'8초마다 기절한 직원 1명 정화 · 대상이 없으면 대기',story:'분홍 아가미를 팔랑이며 달려오는 의무관. 민트 물약과 작은 구급가방이면 밤샘 근무도 든든하다.',quote:'괜찮아요, 제가 옆에 있어요!',traits:'다정함 · 분홍 아가미'},
  {id:'coco',name:'코코',job:'박쥐 강아지 파수꾼',dept:'성문 감시실',color:'#d5ad7b',price:40,object:'sonar',role:'선두 저지',skill:'멍! 접근 금지',desc:'10초마다 선두 일반 적 최대 3명을 1초 정지 · 군단장 제외',story:'커다란 귀로 발소리를 먼저 듣는 작은 파수꾼. 금빛 방울이 울리면 침입자도 움찔한다.',quote:'멍! 여기부터는 직원 전용!',traits:'충성심 · 커다란 귀'},
  {id:'q',name:'큐',job:'까마귀 전술관',dept:'전술 관측실',color:'#ceabed',price:50,object:'horn',role:'군단장 집중',skill:'집중 사격 신호',desc:'군단장 등장 후 6초간 직원의 해당 군단장 피해 +20% · 분신 제외',story:'짧은 호른 신호로 동료들의 호흡을 맞추는 까마귀. 지휘봉 끝은 언제나 가장 위험한 적을 가리킨다.',quote:'지금이야. 모두 저쪽을 봐!',traits:'침착함 · 지휘봉과 호른'}
 ]
};
