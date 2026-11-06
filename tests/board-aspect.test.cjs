const test=require('node:test'),assert=require('node:assert/strict'),boot=require('./runtime-boot.cjs');
test('board fits tall and short viewports without distorting pointer coordinates',()=>{
 const b=boot('');
 for(const [w,h] of [[390,476],[320,247],[480,560],[390,390]]){
  b.nodes['.board-stage'].getBoundingClientRect=()=>({width:w,height:h});
  const style={};b.nodes['#game'].style.setProperty=(k,v)=>style[k]=v;
  b.run('fitBoard()');const size=Math.floor(Math.min(w*600/576,h*600/548));
  assert.equal(style.width,size+'px');assert.equal(style.height,size+'px');
  const clippedX=Math.max(0,(size-w)/2)*600/size;
  const clippedY=Math.max(0,size-h)*600/size;
  assert.ok(clippedX<=12);
  assert.ok(clippedY*10/13<=40);
  assert.ok(clippedY*3/13<=12);
  assert.ok(Math.abs(b.nodes['#game'].boardInsetTop-clippedY*10/13)<.001);
  b.nodes['#game'].getBoundingClientRect=()=>({left:15,top:20,width:size,height:size});
  assert.equal(b.run(`JSON.stringify(point({clientX:${15+size/2},clientY:${20+size/2}}))`),'{'+'"x":300,"y":300}');
 }
});
