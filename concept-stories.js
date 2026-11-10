'use strict';
/* Approved story/support surfaces. Presentation only: retain all game-owned nodes,
   listeners, settlement status, session locking, and pause/resume semantics. */
(() => {
  if (typeof URL !== 'function' || typeof document.createElement !== 'function' || typeof document.createElement('div').append !== 'function') return;
  const q = (selector, root = document) => root.querySelector(selector);
  const decorative = (className, tag = 'div') => {
    const node = document.createElement(tag);
    node.className = className;
    node.setAttribute('aria-hidden', 'true');
    return node;
  };
  function decorate(root = document) {
    const promo = q('#promo', root);
    if (promo && !promo.dataset.conceptStory) {
      promo.dataset.conceptStory = 'true';
      const count = q('#promo-count', promo);
      const header = q('.comic-head', promo);
      if (count && header) header.append(count);
    }
    const pause = q('#pause-window', root);
    if (pause && !pause.dataset.conceptStory) {
      pause.dataset.conceptStory = 'true';
      const sign = decorative('concept-pause-sign');
      pause.prepend(sign);
      const title = q('h2', pause);
      if (title) title.textContent = '잠깐 쉬어 갈까요?';
      const note = document.createElement('p');
      note.className = 'concept-pause-copy';
      note.textContent = '전투는 잠시 멈춰 있어요';
      title?.after(note);
      // This opens the existing Help dialog, not Settings.
      q('#pause-guide', pause).textContent = '근무 안내';
      q('#pause-continue', pause).textContent = '계속 근무';
      q('#pause-home', pause).textContent = '근무 종료';
    }
    const result = q('#result', root);
    if (result && !result.dataset.conceptStory) {
      result.dataset.conceptStory = 'true';
      const hero = q('.result-icon', result);
      if (hero) {
        const portrait = decorative('concept-result-portrait', 'img');
        portrait.src = 'assets/character-portraits/gobi.webp';
        portrait.alt = '';
        hero.replaceChildren(portrait);
        result.prepend(hero);
      }
      const title = q('#result-title', result);
      if (title) hero?.after(title);
      const body = q('.live-result-body', result);
      if (body) {
        const heading = document.createElement('h2');
        heading.className = 'concept-report-heading';
        heading.textContent = '근무 결과';
        body.prepend(heading);
        const actions = q('.live-result-actions', result);
        if (actions) body.append(actions);
      }
    }
    const rotation = q('#rotation-notice > div', root);
    if (rotation && !q('.concept-device-rotation', rotation)) {
      const drawing = decorative('concept-device-rotation');
      for (const name of ['concept-device-landscape', 'concept-device-arrow', 'concept-device-portrait']) drawing.append(decorative(name, 'span'));
      rotation.prepend(drawing);
      const label = document.createElement('small');
      label.className = 'concept-rotation-label';
      label.textContent = '화면 방향 안내';
      rotation.prepend(label);
      // Existing orientation handler pauses; it does not automatically resume.
      const note = document.createElement('small');
      note.className = 'concept-rotation-help';
      note.textContent = '세로로 돌린 뒤 계속 근무를 눌러주세요.';
      rotation.append(note);
    }
    const session = q('#session-notice > div', root);
    if (session && !q('.concept-session-symbol', session)) {
      const symbol = decorative('concept-session-symbol');
      symbol.textContent = '!';
      session.prepend(symbol);
    }
    const viewer = q('#viewer', root);
    if (viewer && !viewer.dataset.conceptStory) {
      viewer.dataset.conceptStory = 'true';
      const heading = document.createElement('h2');
      heading.className = 'concept-gallery-title';
      heading.textContent = '이야기 갤러리';
      viewer.prepend(heading);
      const art = q('#large', viewer);
      if (art) {
        const frame = document.createElement('div');
        frame.className = 'concept-gallery-frame';
        art.before(frame);
        frame.append(art);
        const caption = document.createElement('p');
        caption.className = 'concept-gallery-scene';
        frame.append(caption);
        // Read the current real scene label. Navigation continues to own image,
        // count and selection; only this presentation caption is synchronized.
        const syncCaption = () => {
          const label = art.alt || '';
          if (caption.textContent !== label) caption.textContent = label;
        };
        syncCaption();
        new MutationObserver(syncCaption).observe(art, {attributes:true, attributeFilter:['alt']});
      }
    }
  }
  const start = () => {
    decorate();
    // Lazy hiring/session overlays are direct body additions. Observe no combat
    // subtree or per-frame attributes and never write inside a callback loop.
    new MutationObserver(records => {
      if (records.some(record => [...record.addedNodes].some(node => node.nodeType === 1 && /^(session-notice|ref-pause|result|rotation-notice|viewer)$/.test(node.id)))) decorate();
    }).observe(document.body, {childList:true});
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, {once:true});
  else start();
})();
