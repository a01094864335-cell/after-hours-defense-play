'use strict';
let mercGesture = { motionState: null };
function cueMercenary() { Motion.start(mercGesture, 'skill', .8); }
function animateDefeat(e) {
  if (!Number.isFinite(e.x) || !legion[e.type]) return;
  burst('defeat', e.x, e.y, enemyDefinition(e).color, .38,
    { sprite: enemyDefinition(e).file, size: e.type === 'boss' ? 68 : 40 });
}
function drawAmbient() {
  if (reduce?.matches) return;
  ctx.save();
  const lights = [[37,43],[145,22],[455,22],[563,43],[40,194],[560,194],[40,381],[560,381]];
  for (let i = 0; i < lights.length; i++) {
    const [x,y] = lights[i], flicker = Math.sin(time * 5 + i * 1.9);
    const light = ctx.createRadialGradient(x,y,1,x,y,24 + flicker * 2);
    light.addColorStop(0,'#ffbc6440'); light.addColorStop(1,'#ffbc6400');
    ctx.fillStyle=light;ctx.fillRect(x-28,y-28,56,56);
    pixel(x-1,y-5+flicker,3,5-flicker,'#fff1aacc');
  }
  for(let n=0;n<10;n++) {
    const x=30+(n*137)%540, y=20+((n*71-time*5)%520+520)%520;
    ctx.globalAlpha=.15+.14*Math.sin(time+n);
    pixel(x+Math.sin(time*.6+n)*5,y,2,2,n%2?'#e0c6ff':'#ffe4a0');
  }
  ctx.restore();
}
function drawStaffMotion(u,i,x,y,ghost) {
  const k=kinds[u.type], calm=reduce?.matches, hover=[5,6,10,15].includes(u.type);
  const lift=calm?0:(hover?2.5:0.65)*Math.sin(time*(hover?2.8:2)+i*1.7);
  const arrival=calm?0:Math.max(0,(u.arrival||0)/.5);
  const flip=u.aimX!==undefined&&u.aimX<cells[i].x;
  ctx.save();if(ghost)ctx.globalAlpha=.75;
  ctx.fillStyle='#100a204d';ctx.beginPath();ctx.ellipse(x,y+15,22-arrival*4,5,0,0,Math.PI*2);ctx.fill();
  if(arrival>0){ctx.strokeStyle=k.color;ctx.globalAlpha*=1-arrival*.4;ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(x,y+15,24+arrival*10,6+arrival*4,0,0,Math.PI*2);ctx.stroke()}
  let pose=Motion.unitFrame(u,time,i,[3,11,16].includes(u.type)?0:k.interval/u.pip);
  // The recruiter supports neighbors continuously; show a periodic approval stamp.
  if(u.type===11&&!u.motionState&&!u.stun&&!calm){const phase=(time+i*.7)%5.5;if(phase>4.5)pose=[2,3,4,5][Math.min(3,Math.floor((phase-4.5)*4))]}
  if(!Motion.draw(ctx,k.file,x,y+16-lift-arrival*15,76,pose,{flip}))image(k.file,x,y+15-lift,85);
  if(u.motionState==='skill'&&!calm){const p=u.motionAge/u.motionDuration;ctx.globalAlpha*=1-p;for(let n=0;n<5;n++){const a=n*Math.PI*2/5+p*2;spark(x+Math.cos(a)*29,y-18+Math.sin(a)*21,3,k.color)}}
  ctx.restore();
}
function drawEnemyMotion(e,h) {
  const moving=!reduce?.matches&&!(e.freeze>0),step=moving?Math.sin(e.progress/8):0;
  let pose=Motion.frame('walk',e.progress/65);
  if(e.freeze>0)pose=0;
  if(e.hurt>0)pose=5;
  if(e.cast>0)pose=Motion.frame('cast',.6-e.cast,.6);
  if(e.type==='boss'&&e.warning)pose=3;
  ctx.save();if(e.decoy)ctx.globalAlpha=.55;
  ctx.fillStyle='#100b243d';ctx.beginPath();ctx.ellipse(e.x,e.y+10,h*.22,4,0,0,Math.PI*2);ctx.fill();
  const recoil=reduce?.matches?0:e.hurt/0.15*2;
  if(e.rush>0&&!reduce?.matches){Motion.draw(ctx,enemyDefinition(e).file,e.x-6,e.y+12,h*.91,pose,{alpha:.18})}
  if(!Motion.draw(ctx,enemyDefinition(e).file,e.x-recoil,e.y+12-Math.abs(step),h*.91,pose))image(e.type==='boss'?'hero-leon':enemyDefinition(e).file,e.x,e.y+13,h);
  ctx.restore();
}
function drawMercenary() {
  if(!activeMerc)return;
  const key='merc-'+activeMerc,pose=mercGesture.motionState?Motion.frame('skill',mercGesture.motionAge,.8):Motion.frame('idle',time,1,8);
  ctx.save();ctx.fillStyle='#21182ec9';round(265,520,70,59,10);ctx.fill();
  if(!Motion.draw(ctx,key,300,567,45,pose)){
    const im=images[key];
    if(im?.complete&&im.naturalWidth&&im.naturalHeight){const scale=Math.min(60/im.naturalWidth,45/im.naturalHeight),w=im.naturalWidth*scale,h=im.naturalHeight*scale;ctx.drawImage(im,300-w/2,567-h,w,h);}
  }
  ctx.font='bold 9px system-ui';ctx.fillStyle='#e9c898';ctx.fillText('지원',300,578);
  if(mercGesture.motionState&&!reduce?.matches)spark(325,535,4,'#ffe7b4');ctx.restore();
}
function drawMotionEffect(f,t) {
  if(f.effect==='defeat'){
    const calm=reduce?.matches;
    Motion.draw(ctx,f.sprite,f.x,f.y+12-(calm?0:t*12),f.size*(calm?1:1-t*.15),5,{alpha:1-t});
    if(!calm)for(let n=0;n<4;n++)pixel(f.x+Math.cos(n*1.57)*(8+t*18),f.y-10+Math.sin(n*1.57)*(8+t*12),3,3,f.color);
    return true;
  }
  if(f.effect==='skillAura'){
    const radius=reduce?.matches?25:15+t*38;
    ctx.globalAlpha=1-t;ctx.strokeStyle=f.color;ctx.lineWidth=2;
    ctx.beginPath();ctx.ellipse(f.x,f.y+25,radius,radius*.35,0,0,Math.PI*2);ctx.stroke();
    if(!reduce?.matches)for(let n=0;n<6;n++)spark(f.x+Math.cos(n*1.047)*radius,f.y+Math.sin(n*1.047)*radius-t*22,3,f.color);
    return true;
  }
  return false;
}
