'use strict';
// Original, pre-rendered music: no audio synthesis work in the combat loop.
(() => {
  if (typeof Audio !== 'function') return;
  const tracks = {lobby:'lobby-night',battle:'night-shift',boss:'commander'};
  const players = new Map(), pending = new Set();
  let unlocked = false, volume = .35, muted = false, active = '';
  try {
    const saved = JSON.parse(localStorage.getItem('night-duty-audio') || 'null');
    if (saved && Number.isFinite(saved.volume)) volume = Math.max(0, Math.min(1, saved.volume));
    muted = saved?.muted === true;
  } catch (_) {}
  const slider = document.querySelector('#bgm-volume');
  const toggle = document.querySelector('#bgm-toggle');
  const value = document.querySelector('#bgm-value');
  const status = document.querySelector('#bgm-status');
  function controls() {
    if (slider) slider.value = Math.round(volume * 100);
    if (value) value.textContent = Math.round(volume * 100) + '%';
    if (toggle) {
      toggle.textContent = muted ? 'BGM 켜기' : 'BGM 끄기';
      toggle.setAttribute('aria-pressed', String(muted));
    }
  }
  function save() {
    try { localStorage.setItem('night-duty-audio', JSON.stringify({volume,muted})); } catch (_) {}
    controls(); update();
  }
  function scene() {
    if (typeof appScreen === 'undefined' || appScreen !== 'battle') return 'lobby';
    return typeof enemies !== 'undefined' && enemies?.some(e => e.type === 'boss' && e.hp > 0) ? 'boss' : 'battle';
  }
  function update() {
    const stopped = document.hidden || !unlocked || muted || volume === 0 ||
      (typeof appScreen !== 'undefined' && appScreen === 'battle' && typeof paused !== 'undefined' && paused);
    active = scene();
    if (stopped) {
      for (const player of players.values()) { player.pause(); player.volume = 0; }
      return;
    }
    let player = players.get(active);
    if (!player) {
      player = new Audio('assets/audio/' + tracks[active] + '.wav');
      player.loop = true; player.preload = 'none'; player.volume = 0;
      player.addEventListener('error', () => { if(status) status.textContent = '음악을 불러오지 못했어요. 잠시 후 BGM을 다시 켜주세요.'; });
      players.set(active, player);
    }
    for (const [key, audio] of players) {
      const target = key === active ? volume * .72 : 0;
      audio.volume = Math.max(0, Math.min(1, audio.volume + Math.max(-.055, Math.min(.055, target-audio.volume))));
      if (key !== active && audio.volume < .001) audio.pause();
      if (key === active && audio.paused && !pending.has(audio)) {
        pending.add(audio);
        Promise.resolve(audio.play()).then(() => {
          if (status) status.textContent = '';
          if (document.hidden || muted || !unlocked || volume === 0) audio.pause();
        }).catch(() => {
          unlocked = false;
          if (status) status.textContent = '화면을 한 번 누르면 음악이 시작돼요.';
        }).finally(() => pending.delete(audio));
      }
    }
  }
  function unlock() { unlocked = true; update(); }
  document.addEventListener('pointerdown', unlock, {passive:true});
  document.addEventListener('keydown', unlock);
  document.addEventListener('visibilitychange', update);
  window.addEventListener('pagehide', () => {unlocked = false; update();});
  window.addEventListener('pageshow', update);
  if (slider) slider.addEventListener('input', () => {volume = Number(slider.value)/100; unlocked = true; save();});
  if (toggle) toggle.addEventListener('click', () => {muted = !muted; unlocked = true; save();});
  controls();
  window.setInterval(update, 100);
})();
