'use strict';
/* The approved wordless plate owns scenery. Only state overlays are painted here. */
const NightWatchArt=(()=>{
 let arena;const states=Array(15).fill(0);
 function get(){if(!arena){arena=new Image();arena.decoding='async';arena.fetchPriority='low';arena.addEventListener?.('load',()=>GamePerformance.invalidate());arena.src='assets/battle-exact/arena-ui.webp'}return arena}
 function field(c){c.clearRect(0,0,600,600)}
 function cell(c,x,y,selected,match){const index=Math.round((y-202)/95)*5+Math.round((x-110)/76);if(index>=0&&index<15)states[index]=selected?1:match?2:0;return true}
 function selection(c,w,h){const xs=[110,265,398,527,664,823],ys=[249,467,621,779];for(let i=0;i<15;i++){if(!states[i])continue;const col=i%5,row=Math.floor(i/5),x=xs[col]*w/948+2,y=ys[row]*h/949+2,width=(xs[col+1]-xs[col])*w/948-4,height=(ys[row+1]-ys[row])*h/949-4,n=7;c.save();c.fillStyle=states[i]===2?'#8ff9df1b':'#ffdf5718';c.strokeStyle=states[i]===2?'#8ff9df':'#ffdf57';c.lineWidth=1.5;c.beginPath();c.roundRect(x,y,width,height,4);c.fill();c.beginPath();for(const [px,py,dx,dy]of [[x,y,1,1],[x+width,y,-1,1],[x,y+height,1,-1],[x+width,y+height,-1,-1]]){c.moveTo(px,py+dy*n);c.lineTo(px,py);c.lineTo(px+dx*n,py)}c.stroke();c.restore()}}
 // The CSS arena loads on battle entry; avoid an unused lobby prefetch.
 return Object.freeze({arena:get,field,cell,selection});
})();
