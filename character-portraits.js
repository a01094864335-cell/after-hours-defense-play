'use strict';
// One character ID -> one approved-style floating head, for every UI surface.
// Battle and ally cutins share these faces; gameplay coordinates stay separate.
window.CharacterPortraits = (() => {
 const ids = Object.freeze(['goblin-guard','orc-technician','slime-cleaner','gobi','electric-technician','ghost-courier','bat-nurse','skeleton-chef','mimic-storekeeper','spider-tailor','nightmare-counselor','kobold-recruiter','merc-ward','merc-accountant','merc-rescue','duru-archivist','kkangtong-engineer','ddangkong-miner','chalkak-photographer','bongtu-postmaster','merc-chikchik','merc-banchang','merc-coco','merc-q']);
 const known = new Set(ids), cache = new Map();
 function src(id, fallback='') { return known.has(id) ? 'assets/character-portraits/' + id + '.webp' : fallback; }
 function image(id, className='', alt='') {
  const img = new Image(); img.addEventListener('load',()=>window.GamePerformance?.invalidate()); img.src = src(id); img.alt = alt; img.className = className;
  img.dataset.characterId = id; img.dataset.motion = 'static-character-identity'; img.decoding = 'async';
  if(!cache.has(id))cache.set(id,img);
  return img;
 }
 function preload(id) {
  if(!known.has(id))return null;
  if(!cache.has(id))image(id);
  return cache.get(id);
 }
 function draw(ctx,id,x,y,size,options={}) {
  if(!known.has(id))return false;
  const img=preload(id);if(!img.complete||!img.naturalWidth)return false;
  ctx.save();ctx.imageSmoothingEnabled=true;ctx.globalAlpha*=options.alpha??1;
  ctx.translate(x,y);if(options.flip)ctx.scale(-1,1);if(options.angle)ctx.rotate(options.angle);
  ctx.drawImage(img,-size/2,-size,size,size);ctx.restore();return true;
 }
 return Object.freeze({ids,src,image,preload,draw});
})();
