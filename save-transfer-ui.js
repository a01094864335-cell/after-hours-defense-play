'use strict';
(()=>{
 if(typeof document.createElement!=='function')return;
 const q=s=>document.querySelector(s),button=document.createElement('button'),dialog=document.createElement('dialog');
 button.id='save-transfer-open';button.textContent='저장 백업 · 기기 옮기기';q('#menu').insertBefore(button,q('#menu-close'));
 dialog.id='save-transfer-dialog';dialog.className='development-sheet';dialog.innerHTML='<header><h2>저장 백업 · 복원</h2><button id="save-transfer-close">닫기</button></header><div class="save-transfer-actions"><p>진행은 현재 기기·브라우저에 저장돼요. 다른 기기에서는 백업 파일을 가져와 복원하세요. 복원하면 이 브라우저의 코인·영웅·훈련·전투 기록이 백업 내용으로 바뀝니다.</p><button id="save-download">현재 기록 파일로 저장</button><label>백업 파일 선택<input id="save-file" type="file" accept=".json,application/json"></label><label>파일 대신 백업 내용을 붙여넣어도 돼요<textarea id="save-text" spellcheck="false" placeholder="백업 JSON 내용을 붙여넣으세요"></textarea></label><button id="save-preview">백업 확인</button><p id="save-transfer-status" role="status"></p><button id="save-restore" hidden>확인한 백업으로 현재 기록 교체</button></div>';
 document.body.append(dialog);let preview=null,backupResume=false;
 const status=text=>{q('#save-transfer-status').textContent=text;};
 button.onclick=()=>{backupResume=playing&&!ended&&(!paused||panelResume);panelResume=false;q('#menu').close();if(playing&&!ended){paused=true;sync();}dialog.showModal();q('#save-download').disabled=GMTest.enabled||!!saveWarning;preview=null;q('#save-restore').hidden=true;status(GMTest.enabled?'GM 모드의 임시 기록은 백업·복원 대상이 아니에요.':'복원 전에 현재 기록을 먼저 파일로 보관해두세요.');};
 dialog.addEventListener('close',()=>{if(backupResume&&!ended){paused=false;sync();}backupResume=false;});
 q('#save-transfer-close').onclick=()=>dialog.close();
 q('#save-download').onclick=()=>{try{const data=SaveTransfer.exportData(),blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='after-hours-save-'+new Date().toISOString().slice(0,10)+'.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),30000);status('백업 파일을 저장했어요. 휴대폰 파일 앱이나 안전한 폴더에 보관해주세요.');}catch(e){status(e.message);}};
 function invalidate(){preview=null;q('#save-restore').hidden=true;}
 q('#save-text').addEventListener('input',invalidate);
 q('#save-file').onchange=async()=>{invalidate();const file=q('#save-file').files[0];if(!file)return;if(file.size>2000000){status('백업 파일은 2MB 이하여야 해요.');return;}q('#save-text').value=await file.text();status('파일을 읽었어요. 백업 확인을 눌러주세요.');};
 q('#save-preview').onclick=()=>{invalidate();try{if(GMTest.enabled)throw Error('정상 모드에서 복원해주세요.');const raw=q('#save-text').value;if(raw.length>2000000)throw Error('백업 내용은 2MB 이하여야 해요.');preview=SaveTransfer.validate(JSON.parse(raw));status('복원 예정: '+preview.wallet.coins+'코인 · 직원 '+preview.wallet.staff.length+'명 · 지원 '+preview.wallet.owned.length+'명 · 훈련 '+preview.wallet.training.staff+'/'+preview.wallet.training.merc+' · '+(preview.created||'날짜 없음'));q('#save-restore').hidden=false;}catch(e){status('백업 확인 실패: '+e.message);}};
 q('#save-restore').onclick=()=>{if(!preview)return;try{SaveTransfer.restore(preview);dialog.close();reset();sync();q('#resume-run').hidden=!GameStorage.getItem(RUN_SAVE);restorePendingSettlement();showMetaStatus('백업 복원 완료. 저장된 전투가 있으면 이어하기를 선택하세요.');}catch(e){status(e.message);}};
})();
