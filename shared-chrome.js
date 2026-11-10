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
 // Group existing controls without cloning them or taking ownership of their state.
 function group(parent, id, title, nodes) {
  if (!parent || parent.querySelector('#' + id)) return;
  const members = nodes.filter(Boolean);
  if (!members.length) return;
  const section = document.createElement('section'); section.id = id; section.className = 'shared-detail-group';
  const heading = document.createElement('h3'); heading.id = id + '-title'; heading.textContent = title;
  section.setAttribute('aria-labelledby', heading.id); section.append(heading);
  parent.insertBefore(section, members[0]);
  for (const node of members) section.append(node);
 }
 function detailContent(scope) {
  const menuBody = scope.querySelector('#menu > .panel-scroll-body');
  if (menuBody) {
   const get = id => menuBody.querySelector(':scope > #' + id);
   group(menuBody, 'shared-menu-display', '화면과 연출', ['compact-fx-toggle'].map(get));
   group(menuBody, 'shared-menu-tools', '당직 도구', ['menu-training','ref-menu-help'].map(get));
   group(menuBody, 'shared-menu-records', '이야기와 저장', ['menu-story','save-transfer-open'].map(get));
   group(menuBody, 'shared-menu-reset', '현재 당직 초기화', ['reset'].map(get));
  }
  const backup = scope.querySelector('#save-transfer-dialog .save-transfer-actions');
  if (backup && !backup.querySelector('#shared-backup-export')) {
   group(backup, 'shared-backup-export', '1. 현재 기록 보관', [backup.querySelector('#save-download')]);
   group(backup, 'shared-backup-import', '2. 가져올 백업 확인', [...backup.querySelectorAll(':scope > label'), backup.querySelector('#save-preview')]);
  }
  if (backup && !backup.dataset.chromeBackupBound) {
   backup.dataset.chromeBackupBound = 'true';
   // Native invalidation runs first; only refresh the presentation of that state.
   for (const event of ['input', 'change']) backup.addEventListener(event, () => detailContent(scope));
  }
  const status = scope.querySelector('#save-transfer-status');
  if (status) {
   const phase = status.textContent.startsWith('백업 확인 실패') ? 'error' : scope.querySelector('#save-restore')?.hidden === false ? 'preview' : 'info';
   if (status.dataset.phase !== phase) status.dataset.phase = phase;
  }
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
   if (title.parentElement.classList.contains('panel-scroll-body') && title.previousElementSibling) title.parentElement.prepend(title);
  }
  // Only dismissal controls become icon buttons. Acknowledgement actions keep words.
  const closeSelector = 'dialog.shared-paper-modal header [id$="-close"],dialog .sheet-head [id$="-close"],dialog .ui-dialog-header [id$="-close"],#recruit-close,[data-hire-close],.r-close,header .close';
  for (const button of scope.querySelectorAll(closeSelector)) {
   if (button.tagName === 'BUTTON') icon(button, 'close');
  }
  for (const button of scope.querySelectorAll('#roster-back,.r-back,header .back')) icon(button, 'back');
  detailContent(scope);
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
    const link = document.createElement('link'); link.rel = 'stylesheet'; link.href = new URL('shared-chrome.css?v=paper-comic-4', base).href;
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
