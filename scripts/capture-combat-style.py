"""Capture real battle states through the packaged runtime, never synthesize UI."""
from pathlib import Path
import sys,json
sys.path.insert(0,str(Path(__file__).resolve().parents[1]/'tests'))
import test_usability as ui
out=Path(sys.argv[1]);out.mkdir(parents=True,exist_ok=True)
ui.UsabilityTests.setUpClass()
try:
 test=ui.UsabilityTests();records=[]
 for width,height in [(320,568),(390,844)]:
  p=test.open(width,height)
  errors=[];p.on('pageerror',lambda e:errors.append(str(e)))
  p.evaluate("meta.tutorialComplete=true;reset();setScreen('battle');playing=true;paused=false;wave=25;queue=[];timer=999;update=()=>{};board=Array.from({length:15},(_,i)=>({type:i,pip:5,cool:0,attack:0,arrival:0,income:5,skillCD:0}));activeMerc='ward';sync()")
  p.evaluate("async()=>{for(const [key,value]of Object.entries(Motion.sheets))if(value.artStyle==='main-comic'||value.group==='king'||value.group==='enemy'||value.group==='merc')Motion.preload(key);await new Promise(r=>setTimeout(r,800))}")
  for name,code in [
   ('enemies',"kingEvent.state='idle';enemies=[];for(const [i,type]of ['normal','fast','knight','priest','mage'].entries()){spawn(type);placeEnemyAtProgress(enemies.at(-1),100+i*140)}"),
   ('bosses',"enemies=[];for(const [i,id]of bossCatalog.map(b=>b.id).entries()){bossPlans[wave]=id;spawn('boss');enemies.at(-1).bossId=id;placeEnemyAtProgress(enemies.at(-1),60+i*140)}"),
   ('king-entrance',"enemies=[];kingEvent={state:'entrance',elapsed:.8,timer:999};"),
   ('king-afterglow',"kingEvent={state:'afterglow',elapsed:.6,timer:999};")]:
    p.evaluate(code+'sync();draw()');p.screenshot(path=str(out/f'{width}-{name}.png'))
  for id in p.evaluate('Object.keys(mercCatalog)'):
   p.evaluate("id=>{kingEvent.state='idle';activeMerc=id;mercGesture.motionState=null;sync();draw()}",id)
   p.screenshot(path=str(out/f'{width}-support-{id}.png'))
  records.append({'width':width,'errors':errors})
  p.context.close()
 (out/'browser-errors.json').write_text(json.dumps(records,ensure_ascii=False,indent=2))
finally:ui.UsabilityTests.tearDownClass()
