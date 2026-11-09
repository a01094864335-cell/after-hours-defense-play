'use strict';
module.exports=function canvasGeometry(){
 if(!window.__captureCanvasText){
  window.__captureCanvasText=[];const original=CanvasRenderingContext2D.prototype.fillText;
  CanvasRenderingContext2D.prototype.fillText=function(text,x,y,maxWidth){
   if(this.canvas.id==='battle-paint'){
    const m=this.getTransform(),r=this.canvas.getBoundingClientRect(),metric=this.measureText(String(text)),sx=r.width/this.canvas.width,sy=r.height/this.canvas.height;
    let left=x;if(this.textAlign==='center')left-=metric.width/2;else if(['right','end'].includes(this.textAlign))left-=metric.width;
    const top=y-(metric.actualBoundingBoxAscent||parseFloat(this.font)),bottom=y+(metric.actualBoundingBoxDescent||0);
    window.__captureCanvasText.push({text:String(text),left:r.left+(m.a*left+m.c*top+m.e)*sx,top:r.top+(m.b*left+m.d*top+m.f)*sy,right:r.left+(m.a*(left+metric.width)+m.c*bottom+m.e)*sx,bottom:r.top+(m.b*(left+metric.width)+m.d*bottom+m.f)*sy});
   }
   return maxWidth===undefined?original.call(this,text,x,y):original.call(this,text,x,y,maxWidth);
  };
 }
 window.__captureCanvasText=[];draw();
 const boxes=window.__captureCanvasText,issues=[],c=document.querySelector('#battle-paint').getBoundingClientRect();
 for(const t of boxes)if(t.left<c.left-1||t.right>c.right+1||t.top<c.top-1||t.bottom>c.bottom+1)issues.push({type:'canvas-label-outside',...t});
 for(let i=0;i<boxes.length;i++)for(let j=i+1;j<boxes.length;j++){const a=boxes[i],b=boxes[j],w=Math.min(a.right,b.right)-Math.max(a.left,b.left),h=Math.min(a.bottom,b.bottom)-Math.max(a.top,b.top);if(w>2&&h>2)issues.push({type:'canvas-label-overlap',a:a.text,b:b.text,overlap:[w,h]});}
 const projected=cells.map(p=>BattlePresentation.project(p,c.width,c.height));
 const columns=Array.from({length:5},(_,col)=>[projected[col].x,projected[col+5].x,projected[col+10].x]);
 const rows=Array.from({length:3},(_,row)=>projected.slice(row*5,row*5+5).map(p=>p.y));
 const columnDrift=Math.max(...columns.map(xs=>Math.max(...xs)-Math.min(...xs)));
 const rowDrift=Math.max(...rows.map(ys=>Math.max(...ys)-Math.min(...ys)));
 if(columnDrift>1||rowDrift>1)issues.push({type:'canvas-grid-drift',columnDrift,rowDrift});
 return {issues,textBoxes:boxes,grid:{columns,rows,columnDrift,rowDrift}};
};
