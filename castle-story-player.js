'use strict';
// Existing dialogue controls keep ownership of pause/resume, swipe and skip.
const STORY_DISCOVERY_REWARD=5;
let currentCastleStory=CastleStories[0],castleStoryRun=null,castleReplay=false,castleArchiveResume=false,castleDiscovery='',castleRunEpisode=null;
function nextCastleStory(){return CastleStories[Math.floor(Math.random()*CastleStories.length)]}
function discoverCastleStory(){
 if(meta.stories.includes(currentCastleStory.id)){castleDiscovery='수집한 이야기 · 다시 만난 마왕성의 하루';return}
 const paid=saveChange(d=>{d.stories.push(currentCastleStory.id);d.coins+=STORY_DISCOVERY_REWARD});
 castleDiscovery=paid?'NEW · 이야기 해금! 글로벌 코인 +'+STORY_DISCOVERY_REWARD:'저장 실패 · 이야기 해금과 보상을 재시도해주세요';
 document.querySelector('#story-retry').hidden=paid;
 renderStoryLobby();sync();
}
function castlePortrait(key){if(key==='demon-king')return typeof MotionSheets!=='undefined'?MotionSheets[key].fallback:'assets/demon-king-slim-v2.webp';if(key.startsWith('merc-'))return 'assets/mobile/'+key+'.webp';return 'assets/'+(RECRUIT_STAFF.includes(key)?'staff-expansion/':'pixel/')+key+'.webp'}
function castleIllustration(episode,index){return 'assets/castle-stories/'+episode.id+'/'+String(index+1).padStart(2,'0')+'.webp'}
let castleNextIllustration=null;
const originalShowPromo=showPromo;
function renderCastleStory(){
 const dialog=document.querySelector('#promo');const episode=currentCastleStory;
 dialog.classList.toggle('castle-daily-story',!episode.original);
 if(episode.original){originalShowPromo();}
 else{
  const [scene,speaker,line,aside,portrait]=episode.panels[promoIndex];
  const face=document.querySelector('#promo-face');face.onerror=null;
  face.src=castleIllustration(episode,promoIndex);face.alt=episode.title+' · '+scene;
  if(promoIndex<episode.panels.length-1){castleNextIllustration=new Image();castleNextIllustration.decoding='async';castleNextIllustration.fetchPriority='low';castleNextIllustration.src=castleIllustration(episode,promoIndex+1)}
  dialog.classList.toggle('comic-dialogue',false);
  document.querySelector('#promo-title').textContent=scene;
  document.querySelector('#promo-speaker').textContent=speaker;
  document.querySelector('#promo-line').textContent='“'+line+'”';
  document.querySelector('#promo-aside').textContent=aside;
  document.querySelector('#promo-prev').disabled=promoIndex===0;
  document.querySelector('#promo-next').textContent=promoIndex===3?'당직 준비하기 →':'다음 →';
  if(!dialog.open)dialog.showModal();
 }
 document.querySelector('#promo-count').textContent=episode.tag+' · '+(promoIndex+1)+' / 4';
 document.querySelector('#story-discovery').textContent=castleReplay?'수집한 이야기 다시 보기':castleDiscovery;
 document.querySelector('#promo-next').textContent=promoIndex===3?(castleReplay?'도감으로 →':'당직 준비하기 →'):'다음 →';
}
showPromo=function(){
 if(!document.querySelector('#promo').open&&promoIndex===0&&!castleReplay){
  document.querySelector('#story-retry').hidden=true;
  if(castleStoryRun!==runId){currentCastleStory=nextCastleStory();castleRunEpisode=currentCastleStory;castleStoryRun=runId;discoverCastleStory()}
 else if(castleRunEpisode){currentCastleStory=castleRunEpisode;document.querySelector('#story-retry').hidden=meta.stories.includes(currentCastleStory.id)}
 }
 renderCastleStory();
};
function renderStoryArchive(){
 const owned=CastleStories.filter(s=>meta.stories.includes(s.id));
 document.querySelector('#story-progress').textContent=owned.length+' / '+CastleStories.length+' 이야기 수집';
 document.querySelector('#story-archive-list').innerHTML=CastleStories.map((s,i)=>{
  const unlocked=meta.stories.includes(s.id),src=s.original?'assets/comic/01-first-shift.webp':castleIllustration(s,0);
  return '<button class="story-card '+(unlocked?'collected':'locked')+'" data-story="'+s.id+'" '+(unlocked?'':'disabled')+'><span class="story-cover">'+(unlocked?'<img loading="lazy" src="'+src+'" alt="">':'<span aria-hidden="true">?</span>')+'</span><small>야간 일지 '+String(i+1).padStart(2,'0')+'</small><b>'+(unlocked?s.title:'아직 발견하지 못한 하루')+'</b><em>'+(unlocked?'수집 완료 · 다시 보기':'당직 시작 시 무작위 발견')+'</em></button>';
 }).join('');
}
function openStoryArchive(){
 castleArchiveResume=playing&&!paused&&!ended;if(castleArchiveResume)paused=true;
 renderStoryArchive();document.querySelector('#story-archive').showModal();sync();
}
function replayCastleStory(id){
 const episode=CastleStories.find(s=>s.id===id);if(!episode||!meta.stories.includes(id))return;
 castleReplay=true;currentCastleStory=episode;promoIndex=0;document.querySelector('#story-retry').hidden=true;renderCastleStory();
}
document.querySelector('#story-open').onclick=openStoryArchive;
document.querySelector('#story-archive-list').onclick=e=>{const card=e.target.closest('[data-story]');if(card)replayCastleStory(card.dataset.story)};
document.querySelector('#story-archive-close').onclick=()=>document.querySelector('#story-archive').close();
document.querySelector('#story-archive').addEventListener('close',()=>{if(castleArchiveResume&&!ended)paused=false;castleArchiveResume=false;sync()});
document.querySelector('#promo').addEventListener('close',()=>{castleReplay=false});
document.querySelector('#story-retry').onclick=()=>{discoverCastleStory();renderCastleStory()};

// Transfer the menu pause to the archive before the asynchronous close event.
document.querySelector('#menu-story').onclick=()=>{if(panelResume&&!ended)paused=false;panelResume=false;document.querySelector('#menu').close();openStoryArchive()};

function renderStoryLobby(){
 const count=CastleStories.filter(s=>meta.stories.includes(s.id)).length;
 document.querySelector('#lobby-story-count').textContent=count+' / '+CastleStories.length;
 document.querySelector('#lobby-story-fill').style.width=(count/CastleStories.length*100)+'%';
 document.querySelector('#lobby-story-hint').textContent=count===CastleStories.length?'모든 이야기를 모았어요! 다시 읽어볼까요?':'매 판 랜덤 이야기 · 첫 발견 시 글로벌 코인 +'+STORY_DISCOVERY_REWARD;
}
document.querySelector('#lobby-story-collection').onclick=openStoryArchive;
renderStoryLobby();
