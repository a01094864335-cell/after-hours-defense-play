module.exports=()=>{
 const all=[];const walk=r=>{for(const e of r.children||[]){all.push(e);walk(e);if(e.shadowRoot)walk(e.shadowRoot)}};walk(document.body);
 const parent=e=>e.parentElement||e.getRootNode().host;
 const modal=[...document.querySelectorAll('dialog[open]')].at(-1);
 function visible(e){if(modal){let inside=false;for(let a=e;a;a=parent(a))if(a===modal)inside=true;if(!inside)return false;}for(let a=e;a;a=parent(a)){const s=getComputedStyle(a);if(a.hidden||s.display==='none'||s.visibility==='hidden'||s.clipPath==='inset(50%)')return false;if(a.tagName==='DETAILS'&&!a.open&&a!==e&&!a.querySelector('summary')?.contains(e))return false;}const r=e.getBoundingClientRect();return r.width>2&&r.height>2&&r.bottom>0&&r.top<innerHeight;}
 function clipped(e,r){let b={left:r.left,top:r.top,right:r.right,bottom:r.bottom};for(let a=parent(e);a;a=parent(a)){const s=getComputedStyle(a),p=a.getBoundingClientRect();if(/hidden|clip|auto|scroll/.test(s.overflowX)){b.left=Math.max(b.left,p.left);b.right=Math.min(b.right,p.right)}if(/hidden|clip|auto|scroll/.test(s.overflowY)){b.top=Math.max(b.top,p.top);b.bottom=Math.min(b.bottom,p.bottom)}}return {x:Math.max(0,b.left),y:Math.max(0,b.top),w:Math.max(0,Math.min(innerWidth,b.right)-Math.max(0,b.left)),h:Math.max(0,Math.min(innerHeight,b.bottom)-Math.max(0,b.top))};}
 const key=e=>e.id?'#'+e.id:e.tagName.toLowerCase()+'.'+[...e.classList].join('.');
 const texts=[],issues=[];
 for(const e of all.filter(visible)){
  if(e.matches('script,style,svg,canvas')||e.closest('#gm-test-panel'))continue;
  for(const n of e.childNodes){if(n.nodeType!==3||!n.textContent.trim())continue;const range=document.createRange();range.selectNode(n);const r=range.getBoundingClientRect();const v=clipped(e,r);if(v.w<2||v.h<2)continue;
   texts.push({element:key(e),text:n.textContent.trim(),rect:v});
   const owner=e.closest('button,summary,h1,h2,h3,.r-card-copy,.paper,.dossier-section,.concept-content');
   if(owner){const b=owner.getBoundingClientRect();if(r.left<b.left-1||r.right>b.right+1)issues.push({type:'text-outside',owner:key(owner),text:n.textContent.trim(),delta:[r.left-b.left,b.right-r.right]});
    else if(owner.matches('button,summary')&&r.width>10&&Math.min(r.left-b.left,b.right-r.right)<5)issues.push({type:'tight-inline-padding',owner:key(owner),text:n.textContent.trim(),gap:Math.min(r.left-b.left,b.right-r.right)});
   }
  }
  if(e.matches('button,h1,h2,h3,p,summary')&&e.clientWidth>0&&e.scrollWidth>e.clientWidth+2)issues.push({type:'overflow',owner:key(e),text:e.textContent.trim().slice(0,100),excess:e.scrollWidth-e.clientWidth});
 }
 for(let i=0;i<texts.length;i++)for(let j=i+1;j<texts.length;j++){
 const a=texts[i],b=texts[j];if(a.element===b.element||a.text==='AFTER HOURS'||b.text==='AFTER HOURS')continue;
 const w=Math.min(a.rect.x+a.rect.w,b.rect.x+b.rect.w)-Math.max(a.rect.x,b.rect.x),h=Math.min(a.rect.y+a.rect.h,b.rect.y+b.rect.h)-Math.max(a.rect.y,b.rect.y);
 if(w>2&&h>3)issues.push({type:'text-overlap-candidate',a:a.element,b:b.element,textA:a.text,textB:b.text,overlap:[w,h]});
 }
 return {texts,issues};
};
