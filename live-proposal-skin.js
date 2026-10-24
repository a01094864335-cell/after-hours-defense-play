'use strict';
(()=>{
const q=s=>document.querySelector(s),bottom=q('.lobby-bottom');if(typeof bottom?.insertBefore!=='function')return;
const training=q('#training-entry');if(training)bottom.append(training);
const lobby=q('#lobby'),scroll=document.createElement('div'),footer=document.createElement('div');scroll.className='live-lobby-scroll';footer.className='live-lobby-footer';footer.append(q('#enter-battle'),q('#resume-run'),q('.reward-hint'),q('.lobby-links'));scroll.append(q('.lobby-art'),bottom);lobby.append(scroll,footer);bottom.prepend(q('#merc-slot'));
const market=q('.ref-market-scene'),tabs=q('.shop-tabs');if(market&&tabs)tabs.after(market);
const gear=q('#upgrade-open img');if(gear)gear.src='assets/ui-v2/icons/gear.svg';
const images=['board-cell','board-cell-selected','board-cell-merge'].map(name=>{const im=new Image();im.src='assets/ui-live/'+name+'.svg';return im});window.LiveUIAssets={cell(ctx,x,y,w,h,selected,match){const im=images[match?2:selected?1:0];if(im.complete&&im.naturalWidth)ctx.drawImage(im,x,y,w,h)}};
document.documentElement.dataset.uiSkin='proposal-assets-v1';
})();
