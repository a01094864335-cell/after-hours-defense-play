'use strict';
// Original short synthesizer cues. Buffers are cached; combat never allocates oscillators.
const GameSFX = (() => {
  const AudioEngine = window.AudioContext || window.webkitAudioContext;
  const volumeInput = document.querySelector('#sfx-volume');
  const toggle = document.querySelector('#sfx-toggle');
  const output = document.querySelector('#sfx-value');
  let volume = .55, muted = false, context, master, unlocked = false;
  const buffers = new Map(), voices = new Set(), last = new Map();
  const RATE = 22050, TAU = Math.PI * 2;
  try {
    const s = JSON.parse(localStorage.getItem('night-duty-sfx') || 'null');
    if (s && Number.isFinite(s.volume)) volume = Math.max(0, Math.min(1, s.volume));
    muted = s?.muted === true;
  } catch (_) {}
  function controls() {
    if (volumeInput) volumeInput.value = Math.round(volume * 100);
    if (output) output.textContent = Math.round(volume * 100) + '%';
    if (toggle) {toggle.textContent = muted ? '효과음 켜기' : '효과음 끄기'; toggle.setAttribute('aria-pressed', String(muted));}
    if (master) master.gain.setTargetAtTime(muted ? 0 : volume * .65, context.currentTime, .015);
  }
  function save() {
    try {localStorage.setItem('night-duty-sfx', JSON.stringify({volume,muted}));} catch (_) {}
    controls();
  }
  // [offset, duration, frequency, endFrequency, amplitude, timbre]
  const n = (t,d,f,to=f,a=.35,voice='bell') => [t,d,f,to,a,voice];
  const scores = {
    summon:[n(0,.18,440,660),n(.07,.23,660,880),n(.16,.3,1046.5)],
    merge:[n(0,.18,523.25),n(.08,.2,659.25),n(.16,.25,783.99),n(.25,.38,1046.5)],
    fail:[n(0,.16,392,330,.3,'soft'),n(.13,.23,293.66,196,.28,'soft')],
    upgrade:[n(0,.09,520,800,.25,'metal'),n(.09,.13,659.25),n(.19,.25,987.77)],
    arrow:[n(0,.075,1500,420,.18,'air'),n(.025,.05,340,180,.12,'soft')],
    cannon:[n(0,.22,150,42,.55,'boom'),n(0,.14,600,90,.15,'air')],
    frost:[n(0,.15,520,880,.18,'soft'),n(.04,.15,1100,680,.13,'bell')],
    bolt:[n(0,.09,900,130,.22,'electric')],
    parcel:[n(0,.13,220,650,.24,'soft')],
    heal:[n(0,.16,659.25),n(.1,.2,880,880,.24)],
    fire:[n(0,.18,280,80,.3,'air'),n(0,.12,130,70,.18,'soft')],
    bite:[n(0,.06,170,60,.27,'metal')],
    thread:[n(0,.1,1100,350,.16,'soft')],
    magic:[n(0,.16,440,220,.21,'bell'),n(.04,.13,660,330,.14)],
    machine:[n(0,.07,220,120,.22,'metal'),n(.06,.08,330,170,.15,'metal')],
    hit:[n(0,.045,480,160,.12,'metal')],
    shield:[n(0,.12,740,610,.22,'metal')],
    break:[n(0,.16,950,270,.24,'metal'),n(.04,.12,1420,420,.17,'air')],
    income:[n(0,.12,1046.5,1046.5,.18),n(.065,.16,1318.5,1318.5,.16)],
    skill:[n(0,.28,220,880,.28,'soft'),n(.12,.28,659.25),n(.2,.35,987.77),n(.28,.42,1318.5,1318.5,.25)],
    merc:[n(0,.22,523.25),n(.08,.28,783.99),n(.17,.35,1046.5)],
    king:[n(0,.65,130.81,65.4,.5,'boom'),n(.1,.5,196,196,.25,'soft'),n(.17,.55,261.63)],
    wave:[n(0,.16,440),n(.12,.16,523.25),n(.24,.28,659.25)],
    boss:[n(0,.34,146.83,130.81,.38,'soft'),n(.25,.34,146.83,130.81,.38,'soft'),n(.51,.45,196,98,.4,'boom')],
    bossDown:[n(0,.2,392),n(.1,.22,523.25),n(.22,.38,783.99)],
    defeatEnemy:[n(0,.07,520,780,.1,'bell')],
    breach:[n(0,.22,196,98,.42,'soft'),n(.1,.2,73.42,49,.35,'boom')],
    victory:[n(0,.2,523.25),n(.17,.2,659.25),n(.34,.2,783.99),n(.52,.65,1046.5),n(.52,.65,659.25,659.25,.2)],
    defeat:[n(0,.28,392,392,.3,'soft'),n(.25,.28,329.63,329.63,.3,'soft'),n(.5,.6,220,196,.3,'soft')]
  };
  function render(name) {
    const score = scores[name], duration = Math.max(...score.map(s=>s[0]+s[1])) + .02;
    const buffer = context.createBuffer(1, Math.ceil(duration * RATE), RATE), data = buffer.getChannelData(0);
    let seed = 7183;
    for (const [offset,d,f,to,a,voice] of score) {
      const start = Math.floor(offset * RATE), count = Math.floor(d * RATE);
      for (let i=0; i<count; i++) {
        const t=i/RATE, p=t/d, phase=TAU*(f*t+(to-f)*t*t/(2*d));
        seed=(Math.imul(seed,1664525)+1013904223)|0;
        const noise=(seed>>>0)/2147483648-1;
        let v=Math.sin(phase);
        if (voice==='bell') v=(v+.22*Math.sin(phase*2)+.08*Math.sin(phase*3))*Math.exp(-p*3);
        if (voice==='metal') v=(v+.4*Math.sin(phase*2.73)+.18*noise)*Math.exp(-p*5);
        if (voice==='soft') v=(v+.16*Math.sin(phase*2))*Math.exp(-p*2);
        if (voice==='air') v=noise*.7+v*.15;
        if (voice==='boom') v=(v*.85+noise*.22)*Math.exp(-p*5);
        if (voice==='electric') v=(v*.4+Math.sin(phase*3)*.2+noise*.35)*Math.exp(-p*3);
        data[start+i]+=v*a*Math.min(1,t/.004)*Math.pow(1-p,1.5);
      }
    }
    return buffer;
  }
  function silence() {for (const v of voices) {try {v.source.stop();} catch (_) {}} voices.clear();}
  function unlock() {
    if (!AudioEngine) return;
    try {
      if (!context) {
        context = new AudioEngine(); master=context.createGain(); master.connect(context.destination); controls();
        for (const name of Object.keys(scores)) buffers.set(name,render(name));
      }
      unlocked=true;
      if (context.state==='suspended') context.resume().catch(()=>{unlocked=false;});
    } catch (_) {unlocked=false;}
  }
  const combat = new Set(['arrow','cannon','frost','bolt','parcel','heal','fire','bite','thread','magic','machine','hit','shield','break','income','defeatEnemy']);
  function play(name) {
    if (!unlocked || !context || context.state!=='running' || muted || volume===0 || document.hidden || !buffers.has(name)) return false;
    const isCombat=combat.has(name), now=context.currentTime;
    if (isCombat && typeof paused!=='undefined' && paused) return false;
    if (now-(last.get(name)??-100)<(isCombat?.14:.075)) return false;
    if (isCombat && (now-(last.get('combat')??-100)<.065 || voices.size>=6)) return false;
    if (voices.size>=12) return false;
    try {
      const source=context.createBufferSource(); source.buffer=buffers.get(name);source.connect(master);
      const voice={source};voices.add(voice);
      source.onended=()=>{voices.delete(voice);source.disconnect();};
      source.start();last.set(name,now);if(isCombat)last.set('combat',now);return true;
    } catch (_) {return false;}
  }
  controls();
  if (!AudioEngine) {
    if (volumeInput) volumeInput.disabled=true;
    if (toggle) {toggle.disabled=true;toggle.textContent='이 브라우저는 효과음을 지원하지 않아요';}
    return Object.freeze({play:()=>false});
  }
  document.addEventListener('pointerdown',unlock,{passive:true});
  document.addEventListener('keydown',unlock);
  document.addEventListener('visibilitychange',()=>{if(document.hidden){silence();if(context?.state==='running')context.suspend().catch(()=>{});}else if(unlocked&&context?.state==='suspended')context.resume().catch(()=>{});});
  window.addEventListener('pagehide',()=>{unlocked=false;silence();if(context?.state==='running')context.suspend().catch(()=>{});});
  if(volumeInput)volumeInput.addEventListener('input',()=>{volume=Math.max(0,Math.min(1,Number(volumeInput.value)/100));unlock();if(volume===0)silence();save();});
  if(toggle)toggle.addEventListener('click',()=>{muted=!muted;unlock();if(muted)silence();save();});
  // Wrap only real successful actions; keep existing return values and game state intact.
  function wrap(original,handler) {
    const replacement=function(...args){return handler.call(this,original,args);};
    // Some buttons hold the original function rather than a closure.
    for(const node of document.querySelectorAll('button'))if(node.onclick===original)node.onclick=replacement;
    return replacement;
  }
  if(typeof summon==='function')summon=wrap(summon,function(fn,args){const before=board.filter(Boolean).length;const r=fn.apply(this,args);if(board.filter(Boolean).length>before)play('summon');return r;});
  if(typeof merge==='function')merge=wrap(merge,function(fn,args){const count=board.filter(Boolean).length;const r=fn.apply(this,args);if(r)play('merge');else if(board.filter(Boolean).length<count)play('fail');return r;});
  if(typeof useSkill==='function')useSkill=wrap(useSkill,function(fn,args){const u=board[selected],cd=u?.skillCD||0;const r=fn.apply(this,args);if(u&&(u.skillCD||0)>cd)play('skill');return r;});
  if(typeof upgrade==='function')upgrade=wrap(upgrade,function(fn,args){const level=levels[args[0]];const r=fn.apply(this,args);if(levels[args[0]]>level)play('upgrade');return r;});
  if(typeof nextWave==='function')nextWave=wrap(nextWave,function(fn,args){const before=wave;const r=fn.apply(this,args);if(wave>before)play('wave');return r;});
  if(typeof spawn==='function')spawn=wrap(spawn,function(fn,args){const r=fn.apply(this,args);if(args[0]==='boss')play('boss');return r;});
  if(typeof breachDamage==='function')breachDamage=wrap(breachDamage,function(fn,args){const before=life;const r=fn.apply(this,args);if(life<before)play('breach');return r;});
  if(typeof cueMercenary==='function')cueMercenary=wrap(cueMercenary,function(fn,args){const r=fn.apply(this,args);play('merc');return r;});
  if(typeof hitEnemy==='function')hitEnemy=wrap(hitEnemy,function(fn,args){const hp=args[0].hp;const r=fn.apply(this,args);if(hp>0&&args[0].hp<hp&&!args[3])play('hit');return r;});
  if(typeof recordKill==='function')recordKill=wrap(recordKill,function(fn,args){const fresh=!args[0].rewarded&&!args[0].decoy;const r=fn.apply(this,args);if(fresh)play(args[0].type==='boss'?'bossDown':'defeatEnemy');return r;});
  if(typeof burst==='function')burst=wrap(burst,function(fn,args){const r=fn.apply(this,args);const cue={shieldHit:'shield',shieldBreak:'break',heal:'heal'}[args[0]];if(cue)play(cue);return r;});
  if(typeof Motion!=='undefined'&&typeof Motion.start==='function')Motion.start=wrap(Motion.start,function(fn,args){const r=fn.apply(this,args);const [u,action]=args;if(action==='attack'&&u?.type!==undefined)play(['arrow','cannon','frost','income','bolt','parcel','heal','fire','bite','thread','magic','machine','parcel','magic','machine','cannon','machine'][u.type]||'magic');if(action==='skill'&&u?.type===3)play('income');return r;});
  let reported=false, kingState='idle';
  if(typeof settleRun==='function')settleRun=wrap(settleRun,function(fn,args){const r=fn.apply(this,args);if(ended&&!reported){reported=true;play(life>0?'victory':'defeat');}return r;});
  if(typeof reset==='function')reset=wrap(reset,function(fn,args){const r=fn.apply(this,args);if(!ended){reported=false;kingState='idle';silence();last.clear();}return r;});
  if(typeof updateKing==='function')updateKing=wrap(updateKing,function(fn,args){const r=fn.apply(this,args);if(kingEvent.state==='entrance'&&kingState!=='entrance')play('king');kingState=kingEvent.state;return r;});
  return Object.freeze({play});
})();
