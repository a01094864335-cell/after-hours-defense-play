'use strict';
/* Wordless environment; live path and cells remain the geometry authority. */
const NightWatchArt = (() => {
 let arena;
 function get(){if(!arena){arena=new Image();arena.decoding='async';arena.addEventListener?.('load',()=>GamePerformance.invalidate());arena.src='assets/battle-comic/courtyard.webp'}return arena}
 function field(c){
  const im=get();c.fillStyle='#3152b5';c.fillRect(0,0,600,600);
  if(im.complete&&im.naturalWidth)c.drawImage(im,0,0,600,600);
  c.save();c.lineJoin='round';c.lineCap='round';
  const trace=()=>{c.beginPath();path.forEach((p,i)=>i?c.lineTo(p.x,p.y):c.moveTo(p.x,p.y))};
  trace();c.strokeStyle='#142256';c.lineWidth=65;c.stroke();
  trace();c.strokeStyle='#af89b3';c.lineWidth=56;c.stroke();
  trace();c.strokeStyle='#f1d6bc';c.lineWidth=46;c.stroke();
  c.strokeStyle='#b296b1';c.lineWidth=1.6;c.lineCap='butt';
  for(let segment=0;segment<path.length-1;segment++){
   const a=path[segment],b=path[segment+1],length=Math.hypot(b.x-a.x,b.y-a.y),dx=(b.x-a.x)/length,dy=(b.y-a.y)/length;
   for(let d=15;d<length-12;d+=24){const x=a.x+dx*d,y=a.y+dy*d;c.beginPath();c.moveTo(x-dy*21,y+dx*21);c.lineTo(x+dy*21,y-dx*21);c.stroke()}
  }
  const p=path[0];c.translate(p.x,p.y+18);c.fillStyle='#ffda43';c.strokeStyle='#102058';c.lineWidth=3;
  c.beginPath();c.moveTo(-8,13);c.lineTo(8,13);c.lineTo(8,0);c.lineTo(16,0);c.lineTo(0,-17);c.lineTo(-16,0);c.lineTo(-8,0);c.closePath();c.fill();c.stroke();c.restore();
 }
 function cell(c,x,y,selected,match){
  c.save();c.fillStyle=match?'#59efc94f':selected?'#ffda4229':'#14245a24';c.beginPath();c.roundRect(x+2,y+2,72,84,5);c.fill();
  c.strokeStyle=match?'#8ff9df':selected?'#ffdf57':'#a7bdff22';c.lineWidth=selected||match?2:1;c.stroke();c.restore();return true;
 }
 return Object.freeze({arena:get,field,cell});
})();
