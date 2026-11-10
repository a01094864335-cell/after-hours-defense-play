'use strict';
// Shared presentation only: retain every original button and its live handler.
(() => {
 if (!document.currentScript || typeof document.createElement !== 'function') return;
 const base = new URL('.', document.currentScript.src);
 const url = name => new URL('assets/open-scene/icons/' + name + '.svg', base).href;
 const sheets = new WeakSet();
 function icon(button, name) {
  if (button.dataset.chromeIcon === name) return;
  button.dataset.chromeIcon = name;
  const image = document.createElement('img'); image.src = url(name); image.alt = ''; image.draggable = false;
  button.replaceChildren(image); button.classList.add('shared-icon-button');
 }
 function enhance(scope) {
  for (const nav of scope.querySelectorAll('nav[aria-label="주 메뉴"],.lobby-links')) {
   if (nav.classList.contains('shared-gnb')) continue;
   nav.classList.add('shared-gnb');
   for (const art of nav.querySelectorAll(':scope > img,:scope > svg')) art.remove();
   if (!nav.querySelector('[aria-current="page"]')) nav.querySelectorAll(':scope > button')[1]?.setAttribute('aria-current', 'page');
   const names = ['book','home','shop'];
   [...nav.querySelectorAll(':scope > button')].forEach((button, index) => {
    const label = button.getAttribute('aria-label') || button.textContent.trim();
    button.setAttribute('aria-label', label);
    const image = document.createElement('img'); image.src = url(names[index]); image.alt = '';
    const text = document.createElement('span'); text.textContent = label;
    button.replaceChildren(image, text);
   });
  }
  const closeSelector = '[id$="-close"], [data-hire-close], .r-close, header .close';
  for (const button of scope.querySelectorAll(closeSelector)) {
   if (button.tagName !== 'BUTTON') continue;
   if (!button.hasAttribute('aria-label')) button.setAttribute('aria-label', button.textContent.trim() || '닫기');
   icon(button, 'close');
  }
  for (const button of scope.querySelectorAll('#roster-back,.r-back,header .back')) icon(button, 'back');
 }
 function refresh() {
  enhance(document);
  for (const id of ['asset-lobby-host','asset-roster-host','asset-shop-host','asset-training-host']) {
   const shadow = document.getElementById(id)?.shadowRoot;
   if (!shadow) continue;
   if (!sheets.has(shadow)) {
    sheets.add(shadow);
    const link = document.createElement('link'); link.rel = 'stylesheet'; link.href = new URL('shared-chrome.css', base).href;
    shadow.append(link);
    observer.observe(shadow, {childList:true,subtree:true});
   }
   enhance(shadow);
  }
 }
 let queued = false;
 const observer = new MutationObserver(() => {
  if (queued) return; queued = true;
  queueMicrotask(() => { queued = false; refresh(); });
 });
 observer.observe(document.body, {childList:true,subtree:true});
 refresh();
})();
