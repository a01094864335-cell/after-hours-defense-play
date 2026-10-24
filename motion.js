'use strict';
// One atlas per character. Frame rectangles are measured from the original alpha;
// PNGs stay untouched, and missing sheets fall back to the original portrait.
const Motion = (() => {
  const sheets = typeof MotionSheets === 'undefined' ? {} : MotionSheets;
  const cache = new Map(), portraits = new Set();
  const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)');
  let uiTime = 0, uiLast = 0, uiDrawn = -1;
  const observer = typeof IntersectionObserver === 'undefined' ? null :
    new IntersectionObserver(entries => entries.forEach(e => { e.target.motionVisible = e.isIntersecting; }));

  function asset(key) {
    if (!sheets[key]) return null;
    if (!cache.has(key)) {
      const im = new Image();
      im.src = scriptBase + sheets[key].file;
      cache.set(key, im);
    }
    return cache.get(key);
  }
  const scriptBase = typeof document.currentScript?.src === 'string' && document.currentScript.src
    ? document.currentScript.src.replace(/[^/]*$/, '') : '';

  function frame(state = 'idle', age = 0, duration = .4, phase = 0) {
    if (reduced?.matches) return state === 'hit' ? 5 : state === 'skill' || state === 'attack' ? 3 : 0;
    if (state === 'hit') return 5;
    if (state === 'walk') return [0, 1, 2, 1][Math.floor(age * 9) % 4];
    if (state === 'cast') return age < duration * .35 ? 3 : 4;
    if (state === 'anticipate') return 2;
    if (state === 'attack' || state === 'skill') {
      const p = Math.min(.999, Math.max(0, age / duration));
      return p < .38 ? 3 : p < .72 ? 4 : 5;
    }
    // Independent short blinks, not a synchronized open/closed oscillation.
    return ((age + phase * .731) % 3.7) > 3.49 ? 1 : 0;
  }

  function draw(ctx, key, x, y, height, pose = 0, options = {}) {
    const data = sheets[key], im = asset(key);
    if (!data || !im?.complete || !im.naturalWidth) return false;
    const f = data.frames[Math.max(0, Math.min(5, pose))];
    const scale = height / data.height;
    ctx.save();
    ctx.imageSmoothingEnabled = data.group === 'king';
    ctx.translate(Math.round(x), Math.round(y));
    ctx.scale(options.flip ? -1 : 1, 1);
    if (options.angle) ctx.rotate(options.angle);
    if (options.alpha !== undefined) ctx.globalAlpha *= options.alpha;
    ctx.drawImage(im, f.x, f.y, f.w, f.h,
      Math.round(-f.pivotX * scale), Math.round(-f.pivotY * scale),
      Math.round(f.w * scale), Math.round(f.h * scale));
    ctx.restore();
    return true;
  }

  function start(unit, state, duration = .4) {
    // Fast multishots keep progressing through their current gesture.
    if (unit.motionState === 'skill' && unit.motionAge < unit.motionDuration && state !== 'skill') return;
    if (state === 'attack' && unit.motionState === 'attack' && unit.motionAge < unit.motionDuration * .7) return;
    unit.motionState = state;
    unit.motionAge = 0;
    unit.motionDuration = duration;
  }
  function tick(unit, dt) {
    if (!unit.motionState) return;
    unit.motionAge += dt;
    if (unit.motionAge >= unit.motionDuration) unit.motionState = null;
  }
  function unitFrame(unit, clock, phase, interval) {
    if (unit.stun > 0) return 1;
    if (unit.motionState) return frame(unit.motionState, unit.motionAge, unit.motionDuration);
    if (interval && unit.cool > 0 && unit.cool < Math.min(.15, interval * .25)) return frame('anticipate');
    return frame('idle', clock, 1, phase);
  }

  function mount(root = document) {
    if (!root.querySelectorAll) return;
    const candidates = [...root.querySelectorAll('img')];
    if (root.tagName === 'IMG') candidates.push(root);
    for (const img of candidates) {
      if (img.id === 'promo-face' || img.closest?.('.staff-locked')) continue; // Keep unrecruited silhouettes anonymous.
      const key = img.dataset.motion || img.getAttribute('src')?.split('/').pop()?.replace(/\.(?:png|webp)$/, '').replace(/-portrait$/, '');
      if (!sheets[key]) continue;
      const c = document.createElement('canvas');
      c.width = c.height = 320;
      c.className = img.className;
      c.dataset.motion = key;
      c.setAttribute('role', 'img');
      if (img.alt) c.setAttribute('aria-label', img.alt);
      else c.setAttribute('aria-hidden', 'true');
      c.motionFallback = img;
      c.motionVisible = !observer;
      c.motionPhase = portraits.size * .83;
      c.motionMode = img.dataset.motionMode || 'auto';
      img.replaceWith(c);
      portraits.add(c);
      observer?.observe(c);
    }
  }

  function drawUI(now, frozen = false) {
    const dt = uiLast ? Math.min((now - uiLast) / 1000, .1) : 0;
    uiLast = now;
    if (document.hidden) return;
    if (!frozen) uiTime += dt;
    if (now - uiDrawn < 80) return; // UI portraits need at most 12.5 fps.
    uiDrawn = now;
    for (const c of portraits) {
      if (!c.isConnected) { observer?.unobserve(c); portraits.delete(c); continue; }
      if (!c.motionVisible) continue;
      const key = c.dataset.motion, data = sheets[key], t = uiTime + c.motionPhase;
      let pose = frame('idle', t);
      const mode = c.motionMode;
      if (!reduced?.matches) {
        if (mode === 'walk' || data?.group === 'enemy' && mode === 'auto') pose = frame('walk', t);
        else if (mode === 'action') pose = [2, 3, 4, 5, 0][Math.floor(t * 6) % 5];
        else if (mode === 'auto' && t % 7 > 5.8) pose = [2, 3, 4, 5][Math.min(3, Math.floor((t % 7 - 5.8) / .3))];
      }
      const cc = c.getContext('2d');
      cc.clearRect(0, 0, 320, 320);
      cc.fillStyle = '#130e2428';
      cc.beginPath();cc.ellipse(160, 293, 68, 12, 0, 0, Math.PI * 2);cc.fill();
      if (!draw(cc, key, 160, 294, 248, pose)) {
        const fallback = c.motionFallback;
        if (fallback.complete && fallback.naturalWidth && fallback.naturalHeight) {
          const scale = Math.min(280 / fallback.naturalWidth, 248 / fallback.naturalHeight);
          const w = fallback.naturalWidth * scale, h = fallback.naturalHeight * scale;
          cc.drawImage(fallback, 160 - w / 2, 294 - h, w, h);
        }
      }
    }
  }
  function preview(mode) { for (const c of portraits) c.motionMode = mode; }
  if (typeof MutationObserver !== 'undefined' && document.body) {
    new MutationObserver(records => {
      for (const record of records) for (const node of record.addedNodes) {
        if (node.nodeType === 1) mount(node);
      }
    }).observe(document.body, { childList: true, subtree: true });
  }
  return { draw, frame, start, tick, unitFrame, mount, drawUI, preview, preload: asset, reduced, sheets };
})();
