'use strict';
const {chromium}=require('playwright'),fs=require('fs'),path=require('path');
const geometry=require('./geometry-audit.cjs'),canvasGeometry=require('./canvas-audit.cjs');
const BASE=process.env.UI_BASE_URL||'http://127.0.0.1:8004/';
const out=process.env.UI_QA_DIR||path.join(__dirname,'../../qa/ui-review-canvas-latest');fs.mkdirSync(out+'/screens',{recursive:true});const rows=[],failures=[];
(async()=>{const b=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});
for(const [w,h]of [[320,568],[390,640],[390,844],[430,932]]){
 const p=await b.newPage({viewport:{width:w,height:h},isMobile:true,hasTouch:true,reducedMotion:'reduce'});await p.goto(BASE+'?gm=1&coins=400');await p.waitForTimeout(100);
 await p.evaluate(async()=>{
  document.querySelector('#gm-test-panel').style.display='none';document.body.classList.remove('gm-test-active');meta.tutorialComplete=true;reset();tutorialMode=false;setScreen('battle');playing=true;paused=true;wave=8;sp=240;enemies=[];queue=[];timer=999;intermission=0;
  board=Array.from({length:15},(_,i)=>({type:i%kinds.length,pip:5,cool:100,attack:0,arrival:0,income:5,skillCD:12}));selected=7;sync();
  await Promise.all(Object.keys(Motion.sheets).map(k=>{const im=Motion.preload(k);return im?.decode?.().catch(()=>{})}));
  if(typeof CharacterPortraits!=='undefined')await Promise.all(CharacterPortraits.ids.map(id=>CharacterPortraits.image(id).decode()));
  window.__oldUnitFrame=Motion.unitFrame;Motion.unitFrame=()=>window.__forcedPose||0;
 });
 await p.evaluate(canvasGeometry);
 await p.evaluate(()=>{
  const original=CanvasRenderingContext2D.prototype.drawImage;
  window.__spriteDraws=[];
  CanvasRenderingContext2D.prototype.drawImage=function(image,...args){
   if(this.canvas.id==='battle-paint'&&image.tagName==='IMG'&&[4,8].includes(args.length)){
    const [sourceX,sourceY,sourceW,sourceH,x,y,width,height]=args.length===8?args:[0,0,image.naturalWidth,image.naturalHeight,...args],m=this.getTransform(),r=this.canvas.getBoundingClientRect(),scaleX=r.width/this.canvas.width,scaleY=r.height/this.canvas.height;
    const point=(x,y)=>({x:r.left+(m.a*x+m.c*y+m.e)*scaleX,y:r.top+(m.b*x+m.d*y+m.f)*scaleY});
    const corners=[point(x,y),point(x+width,y),point(x,y+height),point(x+width,y+height)];
    window.__spriteDraws.push({image,src:image.src,sourceX,sourceY,sourceW,sourceH,x,y,width,height,m,canvas:{left:r.left,top:r.top,scaleX,scaleY},box:{left:Math.min(...corners.map(p=>p.x)),top:Math.min(...corners.map(p=>p.y)),right:Math.max(...corners.map(p=>p.x)),bottom:Math.max(...corners.map(p=>p.y))}});
   }
   return original.call(this,image,...args);
  };
 });
 async function record(id){
  const canvas=await p.evaluate(canvasGeometry);
  const pixels=await p.evaluate(()=>{
   const collisions=[],cache=window.__spriteAlpha||(window.__spriteAlpha=new Map());
   for(const a of window.__spriteDraws){
    const key=[a.src,a.sourceX,a.sourceY,a.sourceW,a.sourceH].join('|');let data=cache.get(key);
    if(!data){try{const c=document.createElement('canvas');c.width=c.height=32;const ctx=c.getContext('2d');ctx.drawImage(a.image,a.sourceX,a.sourceY,a.sourceW,a.sourceH,0,0,32,32);data=ctx.getImageData(0,0,32,32).data;cache.set(key,data);}catch{continue;}}
    for(const t of window.__captureCanvasText){const o={left:Math.max(a.box.left,t.left),top:Math.max(a.box.top,t.top),right:Math.min(a.box.right,t.right),bottom:Math.min(a.box.bottom,t.bottom)};const ow=o.right-o.left,oh=o.bottom-o.top;if(ow<=2||oh<=2)continue;const inv=a.m.inverse();let solid=0,n=0;for(let iy=0;iy<5;iy++)for(let ix=0;ix<5;ix++){const gx=o.left+(ix+.5)*ow/5,gy=o.top+(iy+.5)*oh/5;const q=new DOMPoint((gx-a.canvas.left)/a.canvas.scaleX,(gy-a.canvas.top)/a.canvas.scaleY).matrixTransform(inv),x=Math.floor((q.x-a.x)/a.width*32),y=Math.floor((q.y-a.y)/a.height*32);if(x>=0&&x<32&&y>=0&&y<32){n++;if(data[(y*32+x)*4+3]>100)solid++;}}if(n&&solid/n>.2)collisions.push({type:'canvas-text-sprite-overlap',text:t.text,sprite:a.src.split('/').at(-1),alpha:solid/n,box:o});}
   }
   const count=window.__spriteDraws.length;window.__spriteDraws=[];return {drawnSprites:count,collisions};
  });
  const result=await p.evaluate(geometry);let shot=null;
  if(pixels.collisions.length||canvas.issues.length||id.startsWith('king-')){shot=`screens/${w}x${h}-${id}.png`;await p.screenshot({path:out+'/'+shot});}
  rows.push({viewport:[w,h],case:id,canvas,pixels,geometry:result,screenshot:shot});
 }
 for(let type=0;type<17;type++)for(let pose=0;pose<6;pose++){
  await p.evaluate(({type,pose})=>{board[7].type=type;window.__forcedPose=pose;selected=7;sync();window.__spriteDraws=[];},{type,pose});await record('staff-'+type+'-pose-'+pose);
 }
 for(const state of ['question','refuse','entrance','afterglow']){await p.evaluate(s=>{kingEvent={state:s,elapsed:.5,timer:50};window.__spriteDraws=[];},state);await record('king-'+state);}
 await p.close();fs.writeFileSync(out+'/results.json',JSON.stringify({rows,failures},null,2));console.log(JSON.stringify({viewport:[w,h],rows:rows.length,collisions:rows.filter(r=>r.pixels.collisions.length).length}));
}
// Real cross-tab lock screen, using isolated test storage rather than a live player profile.
for(const [w,h]of [[320,568],[390,844]]){
 const context=await b.newContext({viewport:{width:w,height:h}}),owner=await context.newPage();await owner.goto(BASE);await owner.waitForFunction(()=>GameSession.canWrite());const blocked=await context.newPage();await blocked.goto(BASE);await blocked.locator('#session-notice:not([hidden])').waitFor();await blocked.evaluate(()=>window.__geometryScopeOverride='#session-notice');const result=await blocked.evaluate(geometry);const shot=`screens/${w}x${h}-session-lock.png`;await blocked.screenshot({path:out+'/'+shot});rows.push({viewport:[w,h],case:'session-lock',geometry:result,screenshot:shot});await context.close();
}
for(const [w,h]of [[568,320],[844,390]]){const p=await b.newPage({viewport:{width:w,height:h}});await p.goto(BASE+'?gm=1');await p.evaluate(()=>{document.querySelector('#gm-test-panel').style.display='none';window.__geometryScopeOverride='#rotation-notice';GameOrientation.refresh()});const result=await p.evaluate(geometry);const shot=`screens/${w}x${h}-landscape.png`;await p.screenshot({path:out+'/'+shot});rows.push({viewport:[w,h],case:'landscape-rotation',geometry:result,screenshot:shot});await p.close();}
await b.close();fs.writeFileSync(out+'/results.json',JSON.stringify({rows,failures},null,2));
})().catch(e=>{console.error(e);fs.writeFileSync(out+'/fatal.json',JSON.stringify({error:e.stack}));process.exit(1)});
