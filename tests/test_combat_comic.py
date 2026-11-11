"""Real Canvas verifies all new actors, stable cell geometry, and support identity."""
import unittest
import test_usability as ui
class CombatComicTests(unittest.TestCase):
    setUpClass=classmethod(ui.UsabilityTests.setUpClass.__func__)
    tearDownClass=classmethod(ui.UsabilityTests.tearDownClass.__func__)
    open=ui.UsabilityTests.open
    def test_all_twenty_actors_render_all_poses_and_fallbacks_from_comic_family(self):
        p=self.open(390,844)
        result=p.evaluate('''async()=>{
          const ids=CombatComic.ids;await Promise.all(ids.map(id=>Motion.preload(id).decode()));
          const c=document.createElement('canvas');c.width=400;c.height=400;const ctx=c.getContext('2d'),rows=[];
          for(const id of ids){const data=Motion.sheets[id];for(let pose=0;pose<6;pose++){
            ctx.clearRect(0,0,400,400);Motion.draw(ctx,id,200,350,240,pose);
            const pixels=ctx.getImageData(0,0,400,400).data;let count=0,edge=0;for(let y=0;y<400;y++)for(let x=0;x<400;x++)if(pixels[(y*400+x)*4+3]>95){count++;if(x===0||x===399||y===0||y===399)edge++;}
            rows.push({id,pose,count,edge,file:data.file});
          } const fallback=new Image();fallback.src=CombatComic.imagePath(id);await fallback.decode();}
          return rows;
        }''')
        self.assertEqual(len(result),120)
        for row in result:
            self.assertGreater(row['count'],100,row);self.assertEqual(row['edge'],0,row);self.assertIn('/combat-comic/',row['file'])
    def test_battle_supports_and_king_share_new_art_without_changing_game_state(self):
        p=self.open(320,568)
        p.evaluate("meta.tutorialComplete=true;reset();setScreen('battle');playing=true;paused=true;wave=15;board=Array.from({length:15},(_,i)=>({type:i,pip:5,cool:1,skillCD:0}));sync()")
        state=p.evaluate('JSON.stringify({board,cells,path,sp,life,wave})')
        for key in p.evaluate('Object.keys(mercCatalog)'):
            p.evaluate('id=>{activeMerc=id;sync();draw()}',key)
            self.assertEqual(p.locator('#battle-support img').get_attribute('src'),p.evaluate('id=>CharacterPortraits.src("merc-"+id)',key))
            self.assertTrue(p.locator('#battle-support').is_visible())
        data=p.evaluate("async()=>{await Motion.preload('demon-king').decode();kingEvent={state:'entrance',elapsed:.8,timer:999};sync();draw();return {body:kingArt.file,coach:CombatComic.headPath('demon-king'),same:JSON.stringify({board,cells,path,sp,life,wave})}}")
        self.assertIn('/combat-comic/',data['body']);self.assertIn('/combat-comic/',data['coach']);self.assertEqual(data['same'],state);self.assertFalse(p.locator('#battle-support').is_visible())
