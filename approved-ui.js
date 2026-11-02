/* Keep the live controls and their listeners; only compose the approved surface. */
(()=>{if(typeof document.createDocumentFragment!=='function')return;
const q=s=>document.querySelector(s),lobby=q('#lobby');if(!lobby)return;
const dock=document.createElement('div');dock.className='approved-lobby-dock';
for(const sel of ['#daily-option','#deck-open','.mode-card','#resume-run','#enter-battle','.lobby-links']){const el=q(sel);if(el)dock.append(el)}lobby.append(dock);
const keepDeck=()=>{const el=q('#deck-open');if(el&&el.parentElement!==dock)dock.insertBefore(el,q('.mode-card'))};new MutationObserver(keepDeck).observe(lobby,{childList:true,subtree:true});keepDeck();
const labels={'lobby-story-collection':['▤','이야기'],'journey-summary':['▥','기록'],'training-entry':['⚔','훈련소']};
for(const [id,[icon,label]] of Object.entries(labels)){const b=q('#'+id);if(!b)continue;const face=document.createElement('span');face.className='approved-shortcut-face';const iconName=id==='lobby-story-collection'?'book':id==='journey-summary'?'scroll':'sword';face.innerHTML='<img alt="" src="assets/ui-v2/icons/'+iconName+'.svg"><span>'+label+'</span>';b.append(face)}
})();
