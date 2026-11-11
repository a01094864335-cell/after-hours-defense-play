'use strict';
(()=>{
 if(typeof document.createElement!=='function')return;
 const menu=document.querySelector('#menu'),body=menu?.querySelector(':scope > .panel-scroll-body');if(!body)return;
 const field=document.createElement('fieldset');field.id='language-settings';field.dataset.noTranslate='true';
 field.innerHTML='<legend>언어 / Language</legend><div class="language-options" role="group" aria-label="언어 / Language"><button type="button" id="language-ko" lang="ko" data-language="ko">한국어</button><button type="button" id="language-en" lang="en" data-language="en">English</button></div><small id="language-coverage"></small><p id="language-status" role="status" hidden></p>';
 body.prepend(field);const status=field.querySelector('#language-status');
 function refreshCommon(){
  for(const root of [document,...['asset-lobby-host','asset-roster-host','asset-shop-host','asset-training-host'].map(id=>document.getElementById(id)?.shadowRoot).filter(Boolean)])
   for(const chrome of root.querySelectorAll('.shared-gnb,.shared-art-header,.shared-icon-button'))GameLanguage.translateTree(chrome);
 }
 function refresh(){
  for(const button of field.querySelectorAll('[data-language]'))button.setAttribute('aria-pressed',String(button.dataset.language===GameLanguage.current));
  field.querySelector('#language-coverage').textContent=GameLanguage.current==='en'?'Some descriptions and stories remain in Korean.':'일부 설명과 스토리는 원문으로 표시됩니다.';
  GameLanguage.translateTree(menu);window.AssetLobby?.refresh();refreshCommon();
 }
 field.addEventListener('click',event=>{const button=event.target.closest('button[data-language]');if(!button)return;const ok=GameLanguage.set(button.dataset.language);status.hidden=ok;status.textContent=ok?'':GameLanguage.current==='en'?'Language could not be saved. Please try again.':'언어 설정을 저장하지 못했어요. 다시 시도해주세요.';refresh()});
 GameLanguage.subscribe(()=>{refresh();if(typeof sync==='function')sync();if(typeof bonusPending!=='undefined'&&bonusPending)renderPerkChoices();window.GamePerformance?.invalidate()});
 // Only opening settings triggers a refresh; no observer watches translated text.
 new MutationObserver(()=>{if(menu.open)refresh()}).observe(menu,{attributes:true,attributeFilter:['open']});
 document.addEventListener('click',()=>queueMicrotask(refreshCommon),true);
 new MutationObserver(refreshCommon).observe(document.body,{subtree:true,attributes:true,attributeFilter:['open']});
 refresh();
})();
