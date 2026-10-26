'use strict';
(()=>{
 if(typeof document.createElement!=='function')return;
 const face=document.querySelector('#promo-face'),stage=document.querySelector('.comic-stage'),status=document.createElement('div'),label=document.createElement('span'),retry=document.createElement('button');
 status.id='story-load-status';status.setAttribute('role','status');retry.id='story-image-retry';retry.textContent='다시 읽기';status.append(label,retry);stage.append(status);
 face.decoding='async';face.setAttribute('fetchpriority','high');let expected='',failed=false;
 function begin(){expected=face.src;failed=false;status.hidden=false;retry.hidden=true;label.textContent='이야기 그림을 읽고 있어요…';if(face.complete&&face.naturalWidth)status.hidden=true;}
 face.addEventListener('load',()=>{if(face.src===expected){failed=false;status.hidden=true;}});
 face.addEventListener('error',()=>{failed=true;status.hidden=false;label.textContent='그림을 읽지 못했어요. 대사는 계속 볼 수 있어요.';retry.hidden=false;});
 retry.onclick=()=>{const url=face.src;begin();face.src=url;};
 const show=renderCastleStory;renderCastleStory=function(){show();begin();};
 document.querySelector('#promo').addEventListener('close',()=>{status.hidden=true;});status.hidden=true;
})();
