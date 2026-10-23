'use strict';

// One writer owns both the wallet and the active run. Do not let a second tab
// initialize from stale data and later replace the first tab's entire save.
window.GameSession = (() => {
  if (GMTest.enabled) return {canWrite: () => true};
  let owner = false, requesting = false, release = null, loaded = false;
  let panel, message, retry;
  const canWrite = () => owner;

  function block(text) {
    owner = false;
    if (typeof playing !== 'undefined' && playing && !ended) paused = true;
    document.querySelector('#app-shell').inert = true;
    for (const dialog of document.querySelectorAll('dialog')) dialog.inert = true;
    message.textContent = text;
    panel.hidden = false;
    retry.disabled = requesting;
    retry.focus();
  }

  function initialize() {
    // Re-read only after acquiring the lock: the other tab may have saved while
    // this page's scripts were loading.
    meta = loadMeta();
    reset();
    sync();
    document.querySelector('#resume-run').hidden = !GameStorage.getItem(RUN_SAVE);
    if (typeof restorePendingSettlement === 'function') restorePendingSettlement();
    document.querySelector('#app-shell').inert = false;
    for (const dialog of document.querySelectorAll('dialog')) dialog.inert = false;
    panel.hidden = true;
    if (window.GameOrientation) GameOrientation.refresh();
  }

  async function connect() {
    if (owner || requesting) return;
    if (!navigator.locks) {
      block('이 브라우저에서는 안전한 게임 저장을 사용할 수 없어요. 최신 브라우저에서 다시 열어주세요.');
      retry.disabled = true;
      return;
    }
    requesting = true;
    retry.disabled = true;
    try {
      await navigator.locks.request('after-hours-defense-writer-v1', {ifAvailable: true}, async lock => {
        requesting = false;
        if (!lock) {
          block('다른 탭에서 게임을 실행 중이에요. 해당 탭을 닫은 뒤 다시 연결해주세요.');
          return;
        }
        owner = true;
        try {
          initialize();
          await new Promise(resolve => { release = resolve; });
        } finally {
          owner = false;
          release = null;
        }
      });
    } catch (error) {
      requesting = false;
      block('저장 연결을 시작하지 못했어요. 다른 게임 탭을 닫고 다시 연결해주세요.');
    }
  }

  window.addEventListener('DOMContentLoaded', () => {
    loaded = true;
    panel = document.createElement('section');
    panel.id = 'session-notice';
    panel.setAttribute('role', 'dialog');
    panel.setAttribute('aria-modal', 'true');
    panel.setAttribute('aria-labelledby', 'session-title');
    panel.innerHTML = '<div><h2 id="session-title">게임 저장 연결</h2><p></p><button>다시 연결</button></div>';
    message = panel.querySelector('p');
    retry = panel.querySelector('button');
    retry.onclick = connect;
    document.body.append(panel);
    block('게임을 준비하고 있어요.');
    connect();
  });

  window.addEventListener('pagehide', () => {
    if (!owner) return;
    if (typeof saveActiveRun === 'function') saveActiveRun();
    owner = false;
    if (release) release();
  });
  window.addEventListener('pageshow', event => {
    if (event.persisted && loaded && !owner) connect();
  });
  window.addEventListener('storage', event => {
    if (owner && event.key === 'after-hours-defense-v1') {
      block('다른 창에서 저장 데이터가 변경됐어요. 해당 창을 닫고 다시 연결하면 최신 데이터를 불러옵니다.');
      if (release) release();
    }
  });

  // The notice remains interactive; all game input is stopped until ownership.
  for (const type of ['click', 'pointerdown', 'pointerup', 'keydown']) {
    document.addEventListener(type, event => {
      if (!owner && !event.target.closest('#session-notice')) {
        event.preventDefault();
        event.stopImmediatePropagation();
      }
    }, true);
  }
  return {canWrite};
})();
