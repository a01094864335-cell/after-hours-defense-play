'use strict';
/* Presentation only: preserve the live game's controls and economy. */
(() => {
  if (typeof MutationObserver !== 'function' || !document.body) return;
  const shadow = document.getElementById('asset-shop-host')?.shadowRoot;
  const root = shadow?.querySelector('#asset-shop'), shop = document.getElementById('shop');
  if (!root || !shop || root.dataset.singleScreenShop) return;
  root.dataset.singleScreenShop = 'true'; root.classList.add('single-screen-shop');
  const link = document.createElement('link'); link.rel = 'stylesheet';
  link.href = document.querySelector('link[href*="single-screen-shop.css"]')?.href || new URL('single-screen-shop.css', document.baseURI).href;
  shadow.append(link);
  const q = selector => root.querySelector(selector);
  const setText = (node, value) => { if (node && node.textContent !== value) node.textContent = value; };
  const pack = q('#pack'), paper = q('.paper'), purchase = q('.purchase'), balance = q('#balance'), status = q('#status');
  const dock = document.createElement('section'); dock.className = 'recruit-purchase-dock';
  dock.append(purchase, balance, status); root.insertBefore(dock, q('footer'));
  const rosterLink = q('.roster-link'); q('.stats').append(rosterLink);
  const guarantee = q('.guarantee'); paper.prepend(guarantee);
  const rateBanner = q('.rate-banner'), rateSummary = document.createElement('span');
  rateSummary.className = 'recruit-guaranteed-rate'; rateBanner.append(rateSummary);
  const details = q('.paper > details'), summary = details.querySelector('summary');
  const rules = document.createElement('dialog'); rules.className = 'recruit-rules'; rules.id = 'recruit-rules';
  rules.setAttribute('aria-labelledby', 'recruit-rules-title');
  const rulesHeader = document.createElement('header'); rulesHeader.className = 'recruit-rules-header';
  const rulesTitle = document.createElement('h2'); rulesTitle.id = 'recruit-rules-title';
  const rulesClose = document.createElement('button'); rulesClose.type = 'button'; rulesClose.className = 'recruit-rules-close'; rulesClose.textContent = '×';
  rulesHeader.append(rulesTitle, rulesClose);
  const rulesBody = document.createElement('div'); rulesBody.className = 'recruit-rules-body'; rulesBody.append(...details.querySelectorAll('p'));
  const rulesDone = document.createElement('button'); rulesDone.type = 'button'; rulesDone.className = 'recruit-rules-done';
  rules.append(rulesHeader, rulesBody, rulesDone); root.append(rules);
  summary.setAttribute('aria-haspopup', 'dialog'); summary.setAttribute('aria-controls', rules.id);
  summary.addEventListener('click', event => { event.preventDefault(); if (!rules.open) rules.showModal(); });
  rulesClose.addEventListener('click', () => rules.close()); rulesDone.addEventListener('click', () => rules.close());
  rules.addEventListener('keydown', event => {
    if (event.key !== 'Tab') return;
    const active = shadow.activeElement;
    if (event.shiftKey && active === rulesClose) { event.preventDefault(); rulesDone.focus(); }
    else if (!event.shiftKey && active === rulesDone) { event.preventDefault(); rulesClose.focus(); }
  });
  rules.addEventListener('close', () => { if (shop.open && !pack.hidden) summary.focus(); });
  shop.addEventListener('close', () => { if (rules.open) rules.close(); });
  function refresh() {
    const english = window.GameLanguage?.current === 'en';
    dock.hidden = pack.hidden;
    const statusTarget = pack.hidden ? q('.scroll') : dock;
    if (status.parentElement !== statusTarget) statusTarget.append(status);
    root.dataset.recruitTab = pack.hidden ? 'items' : 'pack';
    if (pack.hidden && rules.open) rules.close();
    const complete = missingSupports().length === 0;
    guarantee.dataset.complete = String(complete); q('#pips').hidden = complete;
    balance.hidden = packComplete();
    const guaranteed = !complete && profile().pity >= SUPPORT_PITY - 1;
    rateBanner.dataset.guaranteed = String(guaranteed); rateSummary.hidden = !guaranteed;
    setText(rateSummary, english ? 'This pack · Unowned support 100%' : '이번 팩 · 미보유 지원 영웅 100%');
    setText(guarantee.querySelector('b'), english ? 'UNOWNED SUPPORT GUARANTEE' : '미보유 지원 영웅 보장');
    setText(q('.grid-shop-eyebrow'), english ? 'A new colleague awaits!' : '이번엔 어떤 동료가 올까?');
    setText(q('.grid-shop-title'), english ? 'Hero Recruit Pack' : '영웅 채용팩');
    setText(summary, english ? 'Rates & guarantee rules' : '확률 · 보장 규칙');
    setText(rulesTitle, english ? 'Recruitment rules' : '채용 확률 · 보장 규칙');
    setText(rulesDone, english ? 'Got it' : '알겠어요');
    rulesClose.setAttribute('aria-label', english ? 'Close recruitment rules' : '채용 규칙 닫기');
    dock.setAttribute('aria-label', english ? 'Buy recruit pack' : '채용팩 구매');
    setText(rosterLink, english ? 'Choose a colleague ›' : '동료 지정 채용 ›');
    const left = SUPPORT_PITY - profile().pity;
    setText(q('#guarantee-note'), complete ? (english ? 'All support heroes collected' : '지원 영웅을 모두 모았어요') : (english ? `Unowned support guaranteed within ${left} pack${left === 1 ? '' : 's'}` : `미보유 지원 영웅, ${left}팩 안에 확정`));
  }
  new MutationObserver(refresh).observe(pack, {attributes: true, attributeFilter: ['hidden']});
  const observer = new MutationObserver(refresh);
  for (const node of [q('#guarantee-note'), q('#pity'), q('#price')]) observer.observe(node, {childList: true, characterData: true, subtree: true});
  if (typeof ResizeObserver === 'function') {
    const fit = () => root.classList.toggle('large-copy', parseFloat(getComputedStyle(q('#price')).fontSize) > 28);
    new ResizeObserver(fit).observe(purchase); fit();
  }
  window.GameLanguage?.subscribe(refresh); refresh();
})();
