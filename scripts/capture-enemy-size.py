"""Replay an actual combat snapshot and native stress scenes at candidate sizes."""
from pathlib import Path
import json,sys
sys.path.insert(0,str(Path(__file__).resolve().parents[1]/'tests'))
import test_usability as ui
root=Path(__file__).resolve().parents[1];out=Path(sys.argv[1]);out.mkdir(parents=True,exist_ok=True)
source=(root/'battle-presentation.js').read_text();records=[]
ui.UsabilityTests.setUpClass()
try:
 test=ui.UsabilityTests()
 for width,height in [(320,568),(390,844),(430,932)]:
  for label,factor in ([('final',1.35)] if '--final' in sys.argv else [('before',1),('plus25',1.25),('plus35',1.35),('plus50',1.5)]):
   context=ui.UsabilityTests.browser.new_context(viewport={'width':width,'height':height})
   code=source.replace('(boss?1.12:1.35)',f'(boss?1.12:{factor})')
   if label=='before':
    code=code.replace("size=enemySize(data,actor.size,width,p,actor.options.enemy?.type==='boss'||actor.key==='hero-leon'||actor.key.startsWith('commander-'))","size=Math.min(size,Math.min(52,width*.13)*data.height/Math.max(...data.frames.map(frame=>frame.w)))")
   if label!='final':context.route('**/battle-presentation.js*',lambda route,request,body=code:route.fulfill(status=200,content_type='text/javascript',body=body))
   p=context.new_page();p.goto(f'http://127.0.0.1:{ui.UsabilityTests.server.server_port}/',wait_until='networkidle');p.wait_for_function('GameSession.canWrite()')
   errors=[];p.on('pageerror',lambda e:errors.append(str(e)))
   p.evaluate("let qaSeed=137;Math.random=()=>((qaSeed=(Math.imul(qaSeed,1664525)+1013904223)>>>0)/4294967296);meta.tutorialComplete=true;reset();setScreen('battle');requestAnimationFrame=()=>{};paused=false;for(let i=0;i<5;i++)summon();")
   # Let the real engine spawn and move enemies, without replacing combat logic.
   snap=p.evaluate("()=>{for(let t=0;t<360;t++)update(1/60);sync();return runSnapshot()}")
   p.evaluate("async()=>{await Promise.all(CombatComic.ids.map(id=>Motion.preload(id).decode()));await Promise.all(kinds.map(k=>Motion.preload(k.file).decode()));sync();draw()}")
   p.screenshot(path=str(out/f'{width}-{label}-real-wave1.png'))
   p.evaluate("playing=true;paused=false;wave=15;queue=[];timer=999;enemies=[];kingEvent={state:'idle',timer:999,elapsed:0};board=Array.from({length:15},(_,i)=>({type:i,pip:5,cool:1,attack:0,arrival:0,income:5,skillCD:0}));activeMerc='ward';for(let i=0;i<17;i++){spawn(['normal','fast','knight','priest','mage'][i%5]);placeEnemyAtProgress(enemies.at(-1),50+i*55)}sync();draw()")
   p.screenshot(path=str(out/f'{width}-{label}-dense.png'))
   p.evaluate("enemies=[];for(const [i,b] of bossCatalog.entries()){bossPlans[wave]=b.id;spawn('boss');placeEnemyAtProgress(enemies.at(-1),100+i*135)}sync();draw()")
   p.screenshot(path=str(out/f'{width}-{label}-bosses.png'))
   records.append({'width':width,'candidate':label,'errors':errors,'realSnapshot':snap if label in ['before','final'] else None,'enemies':p.evaluate("enemies.map(e=>{const d=Motion.sheets[enemyDefinition(e).file],anchor=BattlePresentation.project({x:e.x,y:e.y+12},document.querySelector('.board-stage').clientWidth,document.querySelector('.board-stage').clientHeight);return {id:enemyDefinition(e).file,height:BattlePresentation.enemySize(d,75*.91,document.querySelector('.board-stage').clientWidth,anchor,true)}})")})
   context.close()
 (out/'results.json').write_text(json.dumps(records,ensure_ascii=False,indent=2))
finally:ui.UsabilityTests.tearDownClass()
