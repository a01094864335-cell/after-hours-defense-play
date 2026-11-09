'use strict';
/* Presentation only: move existing controls without replacing their handlers.
   Images are wordless. All localizable copy stays in the DOM. */
(() => {
  if (typeof document.createDocumentFragment !== 'function') return;
  document.documentElement.classList.add('open-scene');
  const q = s => document.querySelector(s);
  const base = 'assets/open-scene/';
  const art = (name, className) => {
    const image = new Image();
    image.src = base + name + '.webp';
    image.alt = '';
    image.className = 'scene-art ' + className;
    image.decoding = 'async';
    image.draggable = false;
    image.setAttribute('aria-hidden', 'true');
    return image;
  };
  // Keep the archive's tabs out of its scrolling body. Existing listeners stay on
  // the same nodes, and detail views hide the tab strip with the overview.
  const overview = q('#roster-overview');
  const archiveTabs = q('.archive-tabs');
  if (overview && archiveTabs) {
    overview.before(archiveTabs);
    const syncTabs = () => { archiveTabs.hidden = overview.hidden; };
    new MutationObserver(syncTabs).observe(overview, {attributes:true, attributeFilter:['hidden']});
    syncTabs();
  }
  const companion = q('.duo-companion');
  if (companion) q('#deck-open')?.after(companion);
  const supportCast = document.createElement('div');
  supportCast.className = 'scene-support-cast';
  supportCast.setAttribute('aria-hidden', 'true');
  for (const id of Object.keys(mercCatalog).slice(0, 5)) {
    const portrait = new Image();
    portrait.src = mercImagePath(id);
    portrait.alt = '';
    portrait.dataset.motion = 'static-support-training';
    supportCast.append(portrait);
  }
  q('.live-training-body')?.prepend(supportCast);
  const hero = q('.lobby-art');
  hero.append(art('lobby-cast', 'scene-lobby-cast'));
  const partyLabel = document.createElement('small');
  partyLabel.className = 'scene-party-label';
  partyLabel.textContent = '근무 직원';
  partyLabel.dataset.i18n = 'lobby.party';
  q('#deck-open')?.prepend(partyLabel);
  const heading = q('.lobby-title h1');
  if (heading) {
    heading.classList.remove('duo-sr');
    heading.classList.add('scene-wordmark');
    heading.dataset.i18n = 'game.title';
  }
  const brand = q('.brand');
  if (brand) brand.prepend(art('result-cast', 'scene-profile'));
  const result = q('.result-icon');
  if (result) result.replaceChildren(art('result-cast', 'scene-result-cast'));
  const shopScene = q('.ref-market-scene');
  if (shopScene) shopScene.replaceChildren(art('shop-cast', 'scene-shop-cast'));
  const training = q('.live-training-body');
  if (training) training.prepend(art('training-cast', 'scene-training-cast'));

  const originalStats = describeStats;
  describeStats = function (...args) {
    const result = originalStats.apply(this, args);
    let ledger = q('.scene-report-ledger');
    if (!ledger) {
      ledger = document.createElement('section');
      ledger.className = 'scene-report-ledger';
      ledger.setAttribute('aria-label', '당직 상세 기록');
      q('#result-stats')?.after(ledger);
    }
    const records = q('#result-stats > details');
    if (records) {
      ledger.querySelector('[data-report-records]')?.remove();
      records.dataset.reportRecords = '1';
      ledger.prepend(records);
    }
    const analysis = q('#run-analysis');
    if (analysis && analysis.parentElement !== ledger) ledger.append(analysis);
    return result;
  };

  // Existing bitmap/SVG controls get the same wordless icon family.
  // Observe only inserted subtrees; do not redraw unchanged game UI per frame.
  const aliases = { 'arrow-left':'back', 'arrow-right':'arrow', envelope:'shop', mail:'shop', crown:'moon', settings:'gear', record:'scroll', archive:'book', bag:'shop', info:'help', sound:'volume' };
  const icons = new Set(['close','back','arrow','book','home','staff','gear','shop','scroll','sword','shield','moon','lightning','help','pause','play','menu','coin','heart','plus','check','lock','spark','volume','retry']);
  function decorate(root) {
    if (!(root instanceof Element)) return;
    const cards = root.matches('.staff-pass') ? [root] : [...root.querySelectorAll('.staff-pass')];
    for (const card of cards) {
      const id = card.dataset.staff || '';
      card.dataset.sceneEquipped = String(id.startsWith('merc-') ? meta.equipped === id.slice(5) : meta.deck.includes(id));
    }
    const close = root.matches('[data-hire-close]') ? root : root.querySelector('[data-hire-close]');
    if (close && !close.querySelector('.scene-close-icon')) {
      close.setAttribute('aria-label', '닫기');
      const icon = new Image();
      icon.src = base + 'icons/close.svg';
      icon.alt = '';
      icon.className = 'scene-close-icon';
      close.replaceChildren(icon);
    }
    const images = root.matches('img') ? [root] : [...root.querySelectorAll('img')];
    for (const image of images) {
      const src = image.getAttribute('src') || '';
      const match = src.match(/^assets\/ui-v2\/icons\/([\w-]+)\.svg$/);
      if (!match) continue;
      const name = aliases[match[1]] || match[1];
      if (icons.has(name)) image.src = base + 'icons/' + name + '.svg';
    }
  }
  decorate(document.body);
  new MutationObserver(records => {
    for (const record of records) for (const node of record.addedNodes) decorate(node);
  }).observe(document.body, { childList:true, subtree:true });
})();
