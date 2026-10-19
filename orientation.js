'use strict';
window.GameOrientation = (() => {
  const landscape = matchMedia('(orientation: landscape) and (max-height: 600px)');
  const notice = document.querySelector('#rotation-notice');
  function refresh() {
    notice.hidden = !landscape.matches;
    if (landscape.matches && playing && !ended && !paused) {
      paused = true;
      sync();
    }
    const blocked = landscape.matches || !GameSession.canWrite();
    document.querySelector('#app-shell').inert = blocked;
    for (const dialog of document.querySelectorAll('dialog')) dialog.inert = blocked;
  }
  landscape.addEventListener('change', refresh);
  refresh();
  return {refresh};
})();
