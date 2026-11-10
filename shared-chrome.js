'use strict';
// Presentation only. Keep original buttons, listeners, focus and game-owned state.
(() => {
 if (!document.currentScript || typeof document.createElement !== 'function') return;
 const base = new URL('.', document.currentScript.src);
 const url = name => new URL('assets/shared-chrome/' + name + '.svg', base).href;
 const sheets = new WeakSet();
 function icon(button, name) {
  if (button.dataset.chromeIcon === name && button.querySelector('img')) return;
  if (!button.hasAttribute('aria-label')) button.setAttribute('aria-label', button.textContent.trim() || (name === 'back' ? '뒤로' : '닫기'));
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
    const image = document.createElement('img'); image.src = url(names[index]); image.alt = ''; image.draggable = false;
    const text = document.createElement('span'); text.textContent = label;
    button.replaceChildren(image, text);
   });
  }
  for (const panel of scope.querySelectorAll('dialog.contained-panel,dialog#roster,dialog#recruit-dialog,dialog#training-dialog,dialog#starter-choice,dialog#staff-trial')) {
   panel.classList.add('shared-paper-modal');
   const header = panel.querySelector(':scope > header');
   if (header) header.classList.add('shared-modal-header');
  }
  for (const title of scope.querySelectorAll('#recruit-result .recruit-reveal > b,#recruit-result .recruit-reveal > .panel-scroll-body > b')) {
   title.classList.add('shared-recruit-title');
   title.setAttribute('role', 'heading'); title.setAttribute('aria-level', '2');
  }
  // Only dismissal controls become icon buttons. Acknowledgement actions keep words.
  const closeSelector = 'dialog.shared-paper-modal header [id$="-close"],dialog .sheet-head [id$="-close"],dialog .ui-dialog-header [id$="-close"],#recruit-close,[data-hire-close],.r-close,header .close';
  for (const button of scope.querySelectorAll(closeSelector)) {
   if (button.tagName === 'BUTTON') icon(button, 'close');
  }
  for (const button of scope.querySelectorAll('#roster-back,.r-back,header .back')) icon(button, 'back');
  const menu = scope.querySelector('dialog#menu');
  if (menu && !menu.querySelector('#shared-menu-confirm')) {
   let footer = menu.querySelector(':scope > .ui-dialog-actions');
   if (!footer) { footer = document.createElement('footer'); footer.className = 'ui-dialog-actions'; menu.append(footer); }
   const confirm = document.createElement('button'); confirm.id = 'shared-menu-confirm'; confirm.type = 'button'; confirm.textContent = '확인';
   confirm.addEventListener('click', () => menu.querySelector('#menu-close')?.click());
   footer.append(confirm);
  }
  for (const range of scope.querySelectorAll('#sfx-volume,#bgm-volume')) {
   if (range.dataset.chromeRange) continue;
   range.dataset.chromeRange = 'true';
   const paint = () => range.style.setProperty('--chrome-volume', range.value + '%');
   range.addEventListener('input', paint); paint();
  }
  // Replace only the baked-in header title, not the custom character/stage artwork.
  for (const root of scope.querySelectorAll('#asset-roster,#asset-shop,#asset-training')) {
   const header = root.querySelector(':scope > header');
   if (!header || header.classList.contains('shared-art-header')) continue;
   header.classList.add('shared-art-header');
   for (const art of header.querySelectorAll(':scope > svg')) art.remove();
   let title = header.querySelector('h1');
   if (!title) { title = document.createElement('h1'); title.textContent = root.getAttribute('aria-label'); header.append(title); }
   title.classList.remove('sr-only'); title.classList.add('shared-title');
  }
 }
 function refresh() {
  enhance(document);
  for (const id of ['asset-lobby-host','asset-roster-host','asset-shop-host','asset-training-host']) {
   const shadow = document.getElementById(id)?.shadowRoot;
   if (!shadow) continue;
   if (!sheets.has(shadow)) {
    sheets.add(shadow);
    const link = document.createElement('link'); link.rel = 'stylesheet'; link.href = new URL('shared-chrome.css?v=paper-comic-3', base).href;
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
