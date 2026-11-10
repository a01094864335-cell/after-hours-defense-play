'use strict';
/* Wordless environment; live path and cells remain the geometry authority. */
const NightWatchArt = (() => {
 let arena;
 function get(){if(!arena){arena=new Image();arena.decoding='async';arena.addEventListener?.('load',()=>GamePerformance.invalidate());arena.src='assets/battle-comic/courtyard.webp'}return arena}
 function field(c){
  const im=get();c.fillStyle='#3152b5';c.fillRect(0,0,600,600);
  if(im.complete&&im.naturalWidth)c.drawImage(im,0,0,600,600);
  c.save();c.lineJoin='round';c.lineCap='round';
  const trace=()=>{c.beginPath();c.moveTo(path[0].x,path[0].y);for(let i=1;i<path.length-1;i++){const a=path[i-1],p=path[i],b=path[i+1],incoming=Math.hypot(p.x-a.x,p.y-a.y),outgoing=Math.hypot(b.x-p.x,b.y-p.y),r=18;c.lineTo(p.x-(p.x-a.x)/incoming*r,p.y-(p.y-a.y)/incoming*r);c.quadraticCurveTo(p.x,p.y,p.x+(b.x-p.x)/outgoing*r,p.y+(b.y-p.y)/outgoing*r)}c.lineTo(path.at(-1).x,path.at(-1).y)};
  trace();c.strokeStyle='#142256';c.lineWidth=65;c.stroke();
  trace();c.strokeStyle='#af89b3';c.lineWidth=56;c.stroke();
  trace();c.strokeStyle='#f1d6bc';c.lineWidth=46;c.stroke();
  const colors=['#f4ddc4','#eed3c2','#e9cec1','#f3dac9'];
  for(let segment=0;segment<path.length-1;segment++){
   const a=path[segment],b=path[segment+1],length=Math.hypot(b.x-a.x,b.y-a.y);
   c.save();c.translate(a.x,a.y);c.rotate(Math.atan2(b.y-a.y,b.x-a.x));
   for(let d=20,n=0;d<length-20;d+=24,n++){
    c.fillStyle=colors[(n+segment)%colors.length];c.strokeStyle='#b58f9f';c.lineWidth=1.2;
    c.beginPath();c.roundRect(d+1,-21,22,42,3);c.fill();c.stroke();
    c.strokeStyle='#fff1d9';c.beginPath();c.moveTo(d+4,-17);c.lineTo(d+20,-17);c.stroke();
    c.strokeStyle='#d1aab0';c.beginPath();c.moveTo(d+5,18);c.lineTo(d+20,18);c.stroke();
   }c.restore();
  }
  const p=path[0];c.translate(p.x,p.y+18);c.fillStyle='#ffda43';c.strokeStyle='#102058';c.lineWidth=3;
  c.beginPath();c.moveTo(-8,13);c.lineTo(8,13);c.lineTo(8,0);c.lineTo(16,0);c.lineTo(0,-17);c.lineTo(-16,0);c.lineTo(-8,0);c.closePath();c.fill();c.stroke();c.restore();
 }
 function cell(c,x,y,selected,match){
  c.save();c.fillStyle=match?'#59efc94f':selected?'#ffda4229':'#294791a0';c.beginPath();c.roundRect(x+2,y+2,72,84,5);c.fill();
  c.strokeStyle=match?'#8ff9df':selected?'#ffdf57':'#a7bdff22';c.lineWidth=selected||match?2:1;c.stroke();if(!selected&&!match){c.strokeStyle='#a8c7ff33';c.beginPath();c.moveTo(x+8,y+5);c.lineTo(x+67,y+5);c.stroke()}c.restore();return true;
 }
 return Object.freeze({arena:get,field,cell});
})();
