'use strict';
(()=>{
 if(!GMTest.enabled||typeof document.createElement!=='function')return;
 document.body.classList.add('gm-test-active');const panel=document.createElement('details');panel.id='gm-test-panel';panel.innerHTML='<summary id="gm-test-summary">GM TEST</summary><div class="gm-test-body"><strong>GM 테스트 · 원본 기록 보호</strong><p>현재 탭의 메모리에서만 시험해요. 구매·강화·전투 결과는 원래 기록에 반영되지 않으며 새로고침하면 처음 상태로 돌아가요.</p><label for="gm-test-coins">테스트 글로벌 코인</label><input id="gm-test-coins" type="number" min="0" max="1000000000" step="1" inputmode="numeric"><button id="gm-test-apply">코인 설정</button><button id="gm-test-tutorial">연수 건너뛰고 새 판 준비</button><p id="gm-test-message" role="status"></p><a id="gm-test-exit">정상 모드로 돌아가기 →</a></div>';document.body.append(panel);
 const q=s=>document.querySelector(s);q('#gm-test-coins').value=String(GMTest.initialCoins);q('#gm-test-message').textContent=GMTest.notice||'URL 예시: ?gm=1&coins=100000';
 const exit=new URL(window.location.href);exit.searchParams.delete('gm');exit.searchParams.delete('coins');q('#gm-test-exit').href=exit.href;
 q('#gm-test-apply').onclick=()=>{const value=GMTest.parseCoins(q('#gm-test-coins').value);if(value===null){q('#gm-test-message').textContent='0~1,000,000,000 사이의 정수를 입력해주세요.';return}if(saveChange(d=>{d.coins=value})){renderMeta();q('#gm-test-message').textContent='테스트 잔액을 '+value.toLocaleString()+'코인으로 설정했어요.'}else q('#gm-test-message').textContent='현재 테스트 저장 상태를 확인해주세요.'};
 q('#gm-test-tutorial').onclick=()=>{if(playing&&!ended)return;if(saveChange(d=>{d.tutorialComplete=true})){restartTo('lobby');q('#gm-test-message').textContent='테스트에서만 연수를 완료하고 새 판을 준비했어요.'}};
 let last='';const update=()=>{const key=meta.coins+':'+playing+':'+ended;if(key===last)return;last=key;q('#gm-test-summary').textContent='GM TEST · '+meta.coins.toLocaleString()+' 코인 ▾';q('#gm-test-tutorial').disabled=playing&&!ended;};const previous=renderMeta;renderMeta=function(){previous();update()};update();
})();
