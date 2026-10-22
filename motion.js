'use strict';
// One atlas per character. Frame rectangles are measured from the original alpha;
// PNGs stay untouched, and missing sheets fall back to the original portrait.
const Motion = (() => {
  const sheets = typeof MotionSheets === 'undefined' ? {} : MotionSheets;
  const cache = new Map(), portraits = new Set();
  const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)');
  let uiTime = 0, uiLast = 0, uiDrawn = -1;
  const observer = typeof IntersectionObserver === 'undefined' ? null :
    new IntersectionObserver(entries => entries.forEach(e => {e.target.motionVisible=e.isIntersecting;if(e.isIntersecting){e.target.motionKey=null;uiDrawn=-Infinity;window.GamePerformance?.invalidate()}}));

  function asset(key) {
    if (!sheets[key]) return null;
    if (!cache.has(key)) {
      const im = new Image();
      im.addEventListener('load',()=>{invalidate();window.GamePerformance?.invalidate()});im.src = scriptBase + sheets[key].file;
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
      if (img.closest?.('.staff-locked')) continue; // Keep unrecruited silhouettes anonymous.
      const key = img.dataset.motion || img.getAttribute('src')?.split('/').pop()?.replace(/\.(?:png|webp)$/, '');
      if (!sheets[key]) continue;
      const c = document.createElement('canvas');
      c.width = c.height = 64;
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
      observer?.observe(c);resizeObserver?.observe(c);img.addEventListener('load',()=>{c.motionKey=null;uiDrawn=-Infinity;window.GamePerformance?.invalidate()});window.GamePerformance?.invalidate();
    }
  }

  function resolution(c,box){
    const cap=window.GamePerformance?.lowPower?192:320;
    return Math.min(cap,Math.max(64,Math.ceil(Math.max(box.width,box.height)*Math.min(devicePixelRatio||1,1.5)/32)*32));
  }
  const resizeObserver=typeof ResizeObserver==='undefined'?null:new ResizeObserver(entries=>{
    for(const e of entries){if(!e.contentRect.width||!e.contentRect.height)continue;const n=resolution(e.target,e.contentRect);if(e.target.motionResolution!==n){e.target.motionResolution=n;e.target.motionKey=null;uiDrawn=-Infinity;window.GamePerformance?.invalidate()}}
  });
  function drawUI(now,frozen=false){
    const dt=uiLast?Math.min((now-uiLast)/1000,.1):0;uiLast=now;
    if(document.hidden)return;
    if(!frozen)uiTime+=dt;
    if(now-uiDrawn<80)return;
    uiDrawn=now;
    for(const c of portraits){
      if(!c.isConnected){observer?.unobserve(c);resizeObserver?.unobserve(c);portraits.delete(c);continue}
      if(!c.motionVisible||c.closest('[hidden],dialog:not([open])'))continue;
      const key=c.dataset.motion,data=sheets[key],t=uiTime+c.motionPhase,mode=c.motionMode;
      let pose=frame('idle',t);
      if(window.GamePerformance?.lowPower||reduced?.matches)pose=0;
      else if(frozen)pose=c.motionLastPose??0;
      else if(mode==='walk'||data?.group==='enemy'&&mode==='auto')pose=frame('walk',t);
      else if(mode==='action')pose=[2,3,4,5,0][Math.floor(t*6)%5];
      else if(mode==='auto'&&t%7>5.8)pose=[2,3,4,5][Math.min(3,Math.floor((t%7-5.8)/.3))];
      if(!c.motionResolution)c.motionResolution=resolution(c,c.getBoundingClientRect());
      const n=c.motionResolution,im=asset(key),fallback=c.motionFallback;
      const drawKey=[pose,n,im?.complete&&im.naturalWidth>0,fallback.complete&&fallback.naturalWidth>0].join('|');
      if(c.motionKey===drawKey)continue;
      c.motionKey=drawKey;c.motionLastPose=pose;
      if(c.width!==n)c.width=c.height=n;
      const cc=c.motionContext||(c.motionContext=c.getContext('2d'));cc.setTransform(1,0,0,1,0,0);cc.clearRect(0,0,n,n);cc.setTransform(n/320,0,0,n/320,0,0);
      cc.fillStyle='#130e2428';cc.beginPath();cc.ellipse(160,293,68,12,0,0,Math.PI*2);cc.fill();
      if(!draw(cc,key,160,294,248,pose)&&fallback.complete&&fallback.naturalWidth)cc.drawImage(fallback,20,14,280,280);
      if(window.GamePerformance)GamePerformance.stats.portraitDraws++;
    }
  }
  function invalidate(){uiDrawn=-Infinity;for(const c of portraits){c.motionKey=null;c.motionResolution=null}}
  function hasAnimated(){for(const c of portraits)if(c.isConnected&&c.motionVisible&&!c.closest('[hidden],dialog:not([open])'))return true;return false}
  function preview(mode) {for(const c of portraits){c.motionMode=mode;c.motionKey=null}window.GamePerformance?.invalidate()}
  if (typeof MutationObserver !== 'undefined' && document.body) {
    new MutationObserver(records => {
      for (const record of records) for (const node of record.addedNodes) {
        if (node.nodeType === 1) mount(node);
      }
    }).observe(document.body, { childList: true, subtree: true });
  }
  return { draw, frame, start, tick, unitFrame, mount, drawUI, invalidate, hasAnimated, preview, preload: asset, reduced, sheets };
})();
