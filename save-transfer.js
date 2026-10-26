'use strict';
// Recover an interrupted multi-key import before the wallet is read.
const SaveTransfer=(()=>{
 const keys=['after-hours-defense-v1','after-hours-active-run-v1','after-hours-defense-pending-v1'],journalKey='after-hours-import-transaction-v1';
 let recoveryError=false;
 function recover(){
  if(GMTest.enabled||!GameSession.canWrite())return;
  recoveryError=false;
  try{const raw=GameStorage.getItem(journalKey);if(raw){const j=JSON.parse(raw);if(!j||j.version!==1||!['preparing','committed'].includes(j.phase)||!Array.isArray(j.before)||j.before.length!==3||j.before.some(v=>v!==null&&typeof v!=='string'))throw Error('invalid import journal');if(j.phase==='preparing')j.before.forEach((v,i)=>v===null?GameStorage.removeItem(keys[i]):GameStorage.setItem(keys[i],v));GameStorage.removeItem(journalKey);}}catch(e){recoveryError=true;}
 }
 recover();
 function validate(input){
  if(!input||input.game!=='after-hours-defense'||input.version!==1||!input.wallet||!Array.isArray(input.saves)||input.saves.length!==2)throw Error('올바른 마왕성 백업 파일이 아니에요.');
  const wallet=validateMeta(JSON.parse(JSON.stringify(input.wallet)));
  function checkSnapshot(s){if(!Array.isArray(s.queue)||s.queue.some(t=>!legion[t])||!Array.isArray(s.enemies)||s.enemies.some(e=>!['hp','max','x','y','progress','speed','segment','skill','shield'].every(k=>Number.isFinite(e[k]))||e.max<=0||e.speed<0)||!['timer','intermission','time','cost'].every(k=>Number.isFinite(s[k]))||s.board.some(u=>u&&['cool','attack','arrival','income','skillCD','stun'].some(k=>u[k]!==undefined&&!Number.isFinite(u[k]))))throw Error('전투 수치가 올바르지 않아요.');applySnapshot(s,true,true);}

  for(let i=0;i<2;i++){const data=input.saves[i];if(data===null)continue;if(!data||!data.snapshot)throw Error('전투 기록 형식이 잘못됐어요.');const snap=JSON.parse(JSON.stringify(data.snapshot));if(i===1&&snap.ended!==true)throw Error('미지급 결과 형식이 잘못됐어요.');if(snap.life===0&&snap.ended)snap.life=1;checkSnapshot(snap);if(snap.runDeck.some(t=>!wallet.staff.includes(kinds[t].file))||snap.activeMerc&&!wallet.owned.includes(snap.activeMerc))throw Error('보유 영웅과 전투 기록이 맞지 않아요.');if(data.checkpoint){const point=JSON.parse(JSON.stringify(data.checkpoint));checkSnapshot(point);}}
  return {game:input.game,version:1,created:typeof input.created==='string'?input.created:'',wallet,saves:JSON.parse(JSON.stringify(input.saves))};
 }
 function exportData(){
  if(GMTest.enabled)throw Error('GM 기록은 임시 테스트라 백업할 수 없어요.');
  if(!GameSession.canWrite()||saveWarning)throw Error('저장 연결을 확인한 뒤 다시 시도해주세요.');
  if(playing&&!ended)saveActiveRun();
  return validate({game:'after-hours-defense',version:1,created:new Date().toISOString(),wallet:meta,saves:keys.slice(1).map(k=>{const raw=GameStorage.getItem(k);return raw?JSON.parse(raw):null;})});
 }
 function restore(input){
  if(GMTest.enabled||!GameSession.canWrite()||playing&&!ended)throw Error('정상 모드에서 현재 당직을 마친 뒤 복원해주세요.');
  const data=validate(input),before=keys.map(k=>GameStorage.getItem(k)),next=[JSON.stringify(data.wallet),...data.saves.map(s=>s===null?null:JSON.stringify(s))];
  let committed=false;
  try{
   GameStorage.setItem(journalKey,JSON.stringify({version:1,phase:'preparing',before}));
   next.forEach((v,i)=>v===null?GameStorage.removeItem(keys[i]):GameStorage.setItem(keys[i],v));
   GameStorage.setItem(journalKey,JSON.stringify({version:1,phase:'committed',before}));committed=true;
  }catch(error){
   try{before.forEach((v,i)=>v===null?GameStorage.removeItem(keys[i]):GameStorage.setItem(keys[i],v));GameStorage.removeItem(journalKey);}catch(rollback){saveWarning='백업 복원이 중단됐어요. 저장 공간을 확보하고 새로고침하면 이전 기록 복구를 다시 시도해요.';}
   throw Error('복원 저장에 실패했어요. 이전 기록 복구를 시도했으며 백업 파일은 그대로예요.');
  }
  if(committed){try{GameStorage.removeItem(journalKey);}catch(e){/* A committed journal can be cleaned on the next load. */}meta=gmUnlockRoster(data.wallet);saveWarning='';return true;}
  return false;
 }
 return {get recoveryError(){return recoveryError;},recover,validate,exportData,restore};
})();
