const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),boot=require('./runtime-boot.cjs');
test('static board rendering builds once and reuses its canvas',()=>{
 const b=boot('');b.run(`document.createElement=()=>({getContext:()=>ctx});drawBoardBase();drawBoardBase();drawBoardBase();`);
 assert.equal(b.run('GamePerformance.stats.backgroundBuilds'),1);
 assert.match(fs.readFileSync('game.js','utf8'),/function draw\(\)\{[^\n]*ctx.textAlign="center"/);
 assert.match(fs.readFileSync('game.js','utf8'),/function draw\(\)\{[^\n]*drawBoardBase\(\)/);
});
test('power-saving UI portraits do not fetch animation atlases and redraw only when changed',()=>{
 let loads=0;const context=new Proxy({},{get:()=>()=>{}}),portrait={dataset:{},setAttribute(){},getBoundingClientRect:()=>({width:40,height:40}),getContext:()=>context,closest:()=>null,isConnected:true};
 const img={tagName:'IMG',dataset:{},getAttribute:()=> 'assets/pixel/gobi.webp',replaceWith(){},addEventListener(){},loading:'lazy',complete:true,naturalWidth:100,naturalHeight:120};
 const policy={lowPower:true,invalidate(){},stats:{portraitDraws:0}};
 const sb={GamePerformance:policy,window:{GamePerformance:policy,matchMedia:()=>({matches:false})},document:{hidden:false,createElement:()=>portrait,querySelectorAll:()=>[img]},devicePixelRatio:1,MotionSheets:{gobi:{file:'atlas.webp',height:100,frames:[]}},Image:class{addEventListener(){}set src(v){loads++}}};
 vm.createContext(sb);vm.runInContext(fs.readFileSync('motion.js','utf8')+';Motion.mount();Motion.drawUI(100,true);Motion.drawUI(200,true);',sb);
 assert.equal(loads,0);assert.equal(img.loading,'eager');assert.equal(policy.stats.portraitDraws,1);
 policy.lowPower=false;vm.runInContext('Motion.invalidate();Motion.drawUI(300);',sb);assert.equal(loads,1);
});
