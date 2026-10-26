const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
function boot(search='',entries=[]){
 const nodes={},storage=new Map(entries),writes=[];
 const ctx=new Proxy({createRadialGradient:()=>({addColorStop(){}})},{get:(o,k)=>k in o?o[k]:(()=>{}),set:(o,k,v)=>(o[k]=v,true)});
 function el(id){return nodes[id]||(nodes[id]={innerHTML:'',textContent:'',style:{},hidden:false,open:false,classList:{toggle(){}},setAttribute(){},focus(){},getContext:()=>ctx,querySelector:el,querySelectorAll:()=>[],addEventListener(n,cb){this['on'+n]=cb},showModal(){this.open=true},close(){this.open=false;this.onclose?.()},getBoundingClientRect:()=>({width:390,height:350})});}
 class Image{constructor(){this.complete=true;this.naturalWidth=600;this.naturalHeight=400}set src(path){assert(fs.existsSync(path),path);this.path=path}}
 const math=Object.create(Math);math.random=()=>.5;
 const sb={Image,Math:math,URLSearchParams,requestAnimationFrame(){},window:{location:{search},matchMedia:()=>({matches:false})},document:{querySelector:el,querySelectorAll:()=>[]},localStorage:{getItem:k=>storage.get(k)||null,setItem:(k,v)=>{writes.push(k);storage.set(k,v)},removeItem:k=>{writes.push(k);storage.delete(k)}}};
 vm.createContext(require('./runtime-test-env.cjs')(sb));const run=(s,timeout=3000)=>vm.runInContext(s,sb,{timeout});
 for(const [,url]of fs.readFileSync('index.html','utf8').matchAll(/<script src="([^"]+)"/g))run(fs.readFileSync(url.split('?')[0],'utf8'));
 return {run,nodes,storage,writes};
}


module.exports=boot;
