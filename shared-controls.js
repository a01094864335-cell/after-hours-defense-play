'use strict';
/* Native-button components: presentation only; no click listeners or game state. */
(() => {
 if (!document.currentScript || typeof document.createElement !== 'function') return;
 const base = new URL('.', document.currentScript.src), mounted = new WeakSet();
 const selectors = {
  close: 'dialog.shared-paper-modal header [id$="-close"],dialog .sheet-head [id$="-close"],dialog .ui-dialog-header [id$="-close"],#promo-skip,#recruit-close,#training-close,#roster-close,#starter-close,#trial-close,[data-hire-close],.r-close,header .close',
  back: '#roster-back,.r-back,header .back',
  primary: 'dialog .ui-dialog-actions>button,dialog .concept-footer>button,dialog .ref-recruit-actions>button,#asset-shop .recruit-purchase-dock .purchase,#asset-training #upgrade',
  danger: '#reset,#leave-confirm,#save-restore',
  secondary: 'dialog .sheet-head>button,dialog .ui-dialog-header>button'
 };
 function apply(button, kind) {
  if (button?.tagName !== 'BUTTON') return;
  // Explicit author annotations take precedence over automatic adapters.
  kind = button.getAttribute('data-control-kind') || kind;
  if (!['close','back','primary','secondary','danger'].includes(kind)) return;
  const icon = kind === 'close' || kind === 'back';
  if (button.dataset.uiControl !== kind) button.dataset.uiControl = kind;
  // Never change existing submit behavior; newly authored components should use type=button.
  if (icon) {
   if (!button.getAttribute('aria-label')?.trim()) {
    const english = document.documentElement.lang === 'en';
    button.setAttribute('aria-label', button.textContent.trim() || (kind === 'back' ? (english?'Back':'뒤로') : (english?'Close':'닫기')));
   }
   button.classList.add('shared-icon-button');
   button.dataset.chromeIcon = kind;
   const current = button.firstElementChild;
   const src = new URL('assets/shared-chrome/' + kind + '.svg', base).href;
   if (button.childNodes.length !== 1 || current?.tagName !== 'IMG' || current.src !== src) {
    const image = document.createElement('img');image.src=src;image.alt='';image.draggable=false;
    button.replaceChildren(image);
   }
  }
 }
 function enhance(scope) {
  // Worded acknowledgements and destructive actions keep their words.
  const candidates=new Map();
  for (const kind of ['secondary','primary','danger','back','close'])
   for (const button of scope.querySelectorAll(selectors[kind])) candidates.set(button,kind);
  for (const [button,kind] of candidates) apply(button,kind);
  for (const button of scope.querySelectorAll('button[data-control-kind]')) apply(button,button.dataset.controlKind);
 }
 function mount(scope) {
  if (mounted.has(scope)) return;
  mounted.add(scope);
  const sheet=document.createElement('link');sheet.rel='stylesheet';
  sheet.href=document.querySelector('link[href*="shared-controls.css"]')?.href || new URL('shared-controls.css',base).href;
  scope.append(sheet);
 }
 globalThis.GameControls=Object.freeze({apply,enhance,mount});
})();
