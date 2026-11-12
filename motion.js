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
      im.addEventListener('load',()=>{invalidate();window.GamePerformance?.invalidate()});im.src = scriptBase + sheets[key].file + (sheets[key].sha256 ? '?v='+sheets[key].sha256.slice(0,12) : '');
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

  // Reviewed per-pose vector masks remove only the old baked sticker margin.
  // Original atlases/face pixels stay unchanged. Match source SHA so future art
  // (including new rank forms) can never accidentally inherit an old silhouette.
  const contourCache=new Map();let contourPixels=0;
  function contourFrame(im,key,pose,f,w,h){
    const entry=typeof StaffOutlineMasks==='undefined'?null:StaffOutlineMasks.characters[key];
    const spec=entry?.frames?.[pose];
    if(!spec||entry.sourceSha256!==sheets[key].sha256||typeof Path2D!=='function'||typeof document.createElement!=='function')return null;
    const id=key+'|'+pose+'|'+entry.sourceSha256+'|'+StaffOutlineMasks.sha256+'|'+w+'|'+h;
    if(contourCache.has(id)){const v=contourCache.get(id);contourCache.delete(id);contourCache.set(id,v);return v}
    function masked(path){const c=document.createElement('canvas');c.width=Math.max(1,w*2);c.height=Math.max(1,h*2);const g=c.getContext('2d');g.scale(c.width/f.w,c.height/f.h);g.fillStyle=g.strokeStyle='#fff';g.lineJoin=g.lineCap='round';g.lineWidth=2*(spec.padding||0);
      // Fill subpaths separately: detached effects must UNION, never cancel
      // against the main contour because of opposite path winding.
      for(const part of path.split(/(?=M\s)/).filter(Boolean)){const p=new Path2D(part);g.fill(p);if(spec.padding)g.stroke(p)}
      g.globalCompositeOperation='source-in';g.drawImage(im,f.x,f.y,f.w,f.h,0,0,f.w,f.h);return c;
    }
    const image=masked(spec.path),edgeImage=spec.outlinePath&&spec.outlinePath!==spec.path?masked(spec.outlinePath):image;
    const pixels=image.width*image.height*(edgeImage===image?1:2),value={image,edgeImage,frame:{...f,x:0,y:0,w:image.width,h:image.height},pixels};
    while(contourCache.size&&(contourCache.size>=128||contourPixels+pixels>4*1024*1024)){const oldest=contourCache.keys().next().value;contourPixels-=contourCache.get(oldest).pixels;contourCache.delete(oldest)}
    if(pixels<=4*1024*1024){contourCache.set(id,value);contourPixels+=pixels}return value;
  }

  // Four source sheets lack baked sticker edges. Also cover larger skill cutins.
  // Cache small display-sized masks, never the full-resolution atlas or each tick.
  const outlineCache=new Map(),missingBorders=new Set(['electric-technician','mimic-storekeeper','spider-tailor','chalkak-photographer']);
  let outlinePixels=0;
  function outline(im,key,f,pose,w,h,radius){
    if(typeof document.createElement!=='function')return null;
    const id=[key,sheets[key].sha256,typeof StaffOutlineMasks==='undefined'?'raw':StaffOutlineMasks.sha256,pose,w,h,radius].join('|');
    if(outlineCache.has(id))return outlineCache.get(id);
    const pad=Math.ceil(radius)+1,n=2,c=document.createElement('canvas');
    c.width=(w+2*pad)*n;c.height=(h+2*pad)*n;
    const mask=c.getContext('2d');mask.scale(n,n);mask.imageSmoothingEnabled=true;
    // Threshold ONLY the derived edge silhouette, not the original artwork.
    // Otherwise sixteen stamps amplify invisible atlas dust into white specks.
    let edgeSource=im,edgeFrame=f;
    if(typeof mask.getImageData==='function'){const base=document.createElement('canvas');base.width=w*n;base.height=h*n;const b=base.getContext('2d');b.drawImage(im,f.x,f.y,f.w,f.h,0,0,base.width,base.height);const pixels=b.getImageData(0,0,base.width,base.height);for(let i=3;i<pixels.data.length;i+=4)pixels.data[i]=pixels.data[i]>=128?255:0;b.putImageData(pixels,0,0);edgeSource=base;edgeFrame={x:0,y:0,w:base.width,h:base.height};}
    for(let i=0;i<16;i++){const a=i*Math.PI/8;mask.drawImage(edgeSource,edgeFrame.x,edgeFrame.y,edgeFrame.w,edgeFrame.h,pad+Math.cos(a)*radius,pad+Math.sin(a)*radius,w,h)}
    mask.globalCompositeOperation='source-in';mask.fillStyle='#fff';mask.fillRect(0,0,c.width/n,c.height/n);
    const pixels=c.width*c.height,value={canvas:c,pad,pixels};
    // Limit both entry count and backing-store memory (16 MiB of RGBA pixels).
    while(outlineCache.size&&(outlineCache.size>=48||outlinePixels+pixels>4*1024*1024)){
      const oldest=outlineCache.keys().next().value;outlinePixels-=outlineCache.get(oldest).pixels;outlineCache.delete(oldest);
    }
    if(pixels<=4*1024*1024){outlineCache.set(id,value);outlinePixels+=pixels}
    return value;
  }

  function draw(ctx, key, x, y, height, pose = 0, options = {}) {
    const data = sheets[key], im = asset(key);
    if (!data || !im?.complete || !im.naturalWidth) return false;
    const f = data.frames[Math.max(0, Math.min(5, pose))];
    const scale = height / data.height;
    ctx.save();
    ctx.imageSmoothingEnabled = data.group === 'king' || data.artStyle === 'main-comic';
    ctx.translate(Math.round(x), Math.round(y));
    ctx.scale(options.flip ? -1 : 1, 1);
    if (options.angle) ctx.rotate(options.angle);
    if (options.alpha !== undefined) ctx.globalAlpha *= options.alpha;
    const dx=Math.round(-f.pivotX*scale),dy=Math.round(-f.pivotY*scale),w=Math.round(f.w*scale),h=Math.round(f.h*scale);
    const contour=contourFrame(im,key,Math.max(0,Math.min(5,pose)),f,w,h);
    const source=contour?.image||im,sourceFrame=contour?.frame||f;
    const radius=options.outline??(contour||missingBorders.has(key)?Math.max(1.25,Math.min(3,height*.012)):0);
    if(radius>0&&w>0&&h>0){
      const edge=outline(contour?.edgeImage||im,key,sourceFrame,pose,w,h,radius);
      if(edge)ctx.drawImage(edge.canvas,dx-edge.pad,dy-edge.pad,w+2*edge.pad,h+2*edge.pad);
    }
    ctx.drawImage(source, sourceFrame.x, sourceFrame.y, sourceFrame.w, sourceFrame.h,dx,dy,w,h);
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
      if (img.dataset.characterId || /(?:^|\/)assets\/character-portraits\//.test(img.getAttribute('src') || '')) continue; // Shared identity heads must not turn back into legacy full-body sprites.
      if (img.id === 'promo-face' || img.id === 'coach-portrait' || img.closest?.('.staff-locked')) continue; // Keep unrecruited silhouettes anonymous.
      const key = img.dataset.motion || img.getAttribute('src')?.split('/').pop()?.replace(/\.(?:png|webp)$/, '').replace(/-portrait$/, '');
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
      const staticPortrait=window.GamePerformance?.lowPower||reduced?.matches;
      const n=c.motionResolution,fallback=c.motionFallback,im=staticPortrait?null:asset(key);
      // Lazy thumbnails are detached by mount; request only once actually visible.
      if(fallback.loading==='lazy')fallback.loading='eager';
      const drawKey=[staticPortrait,pose,n,im?.complete&&im.naturalWidth>0,fallback.complete&&fallback.naturalWidth>0].join('|');
      if(c.motionKey===drawKey)continue;
      c.motionKey=drawKey;c.motionLastPose=pose;
      if(c.width!==n)c.width=c.height=n;
      const cc=c.motionContext||(c.motionContext=c.getContext('2d'));cc.setTransform(1,0,0,1,0,0);cc.clearRect(0,0,n,n);cc.setTransform(n/320,0,0,n/320,0,0);
      cc.fillStyle='#130e2428';cc.beginPath();cc.ellipse(160,293,68,12,0,0,Math.PI*2);cc.fill();
      if((staticPortrait||!draw(cc,key,160,294,248,pose))&&fallback.complete&&fallback.naturalWidth){
        const scale=Math.min(280/fallback.naturalWidth,280/fallback.naturalHeight);
        const w=fallback.naturalWidth*scale,h=fallback.naturalHeight*scale;
        cc.drawImage(fallback,(320-w)/2,294-h,w,h);
      }
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
