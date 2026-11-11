"""Larger enemies use actual projected bounds and preserve combat/save state."""
import unittest
import test_usability as ui
class EnemySizeTests(unittest.TestCase):
    setUpClass=classmethod(ui.UsabilityTests.setUpClass.__func__)
    tearDownClass=classmethod(ui.UsabilityTests.tearDownClass.__func__)
    open=ui.UsabilityTests.open
    def test_native_enemy_render_grows_without_changing_combat_state_or_clipping(self):
        for width,height in [(320,568),(390,844),(430,932)]:
            p=self.open(width,height)
            result=p.evaluate('''async()=>{
              meta.tutorialComplete=true;reset();setScreen('battle');playing=true;paused=true;wave=8;
              board=Array.from({length:15},(_,i)=>({type:i,pip:5,cool:1,skillCD:0}));
              await Promise.all([...CombatComic.ids,...kinds.map(k=>k.file)].map(id=>Motion.preload(id).decode()));
              enemies=[];for(const [i,type]of ['normal','fast','knight','priest','mage'].entries()){spawn(type);placeEnemyAtProgress(enemies.at(-1),110+i*145)}sync();
              const before=JSON.stringify(runSnapshot()),drawn=[],original=CanvasRenderingContext2D.prototype.drawImage;
              CanvasRenderingContext2D.prototype.drawImage=function(im,...args){if(this.canvas.id==='battle-paint'&&im.src?.includes('/combat-comic/')&&args.length===8)drawn.push({src:im.src,h:args[7]});return original.call(this,im,...args)};
              try{draw()}finally{CanvasRenderingContext2D.prototype.drawImage=original}
              const stage=document.querySelector('.board-stage'),w=stage.clientWidth,h=stage.clientHeight;
              return {same:before===JSON.stringify(runSnapshot()),drawn,expected:43*.91*w/600*1.05*1.35,bounds:enemies.map(e=>{const d=Motion.sheets[enemyDefinition(e).file],a=BattlePresentation.project({x:e.x,y:e.y+12},w,h),size=BattlePresentation.enemySize(d,43*.91,w,a,false),b=BattlePresentation.bodyBounds(d);return {left:a.x-b.left*size/d.height,right:a.x+b.right*size/d.height,top:a.y-b.top*size/d.height}}),width:w};
            }''')
            self.assertTrue(result['same']);self.assertGreaterEqual(len(result['drawn']),5)
            normal=next(x for x in result['drawn'] if '/novice-adventurer.webp' in x['src'])
            self.assertAlmostEqual(normal['h'],result['expected'],delta=2)
            for b in result['bounds']:
                self.assertGreaterEqual(b['left'],1);self.assertLessEqual(b['right'],result['width']-1);self.assertGreaterEqual(b['top'],19)
            p.context.close()
