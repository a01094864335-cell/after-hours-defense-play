"""Support identity, idle guidance and native skill use stay coherent."""
import unittest
import test_usability as ui
class BattleCohesionTests(unittest.TestCase):
    setUpClass=classmethod(ui.UsabilityTests.setUpClass.__func__)
    tearDownClass=classmethod(ui.UsabilityTests.tearDownClass.__func__)
    open=ui.UsabilityTests.open
    def seed(self,p):
        p.evaluate("meta.tutorialComplete=true;reset();tutorialMode=false;setScreen('battle');playing=true;paused=false;wave=8;queue=['normal'];timer=999;update=()=>{};board[0]={type:0,pip:5,skillCD:0,cool:1,arrival:0,income:5};selected=-1;sync()")
    def test_supports_share_approved_faces_and_leave_cells_untouched(self):
        for w,h in [(320,568),(390,844),(430,932)]:
            p=self.open(w,h);self.seed(p)
            p.evaluate('board=Array.from({length:15},(_,i)=>({type:i,pip:5,skillCD:0,cool:1,arrival:0,income:5}));sync();draw()')
            before=p.evaluate('JSON.stringify({board,cells,sp,life})')
            for id in p.evaluate('Object.keys(mercCatalog)'):
                p.evaluate('(id)=>{activeMerc=id;mercGesture.motionState=null;sync();draw()}',id)
                face=p.locator('#battle-support img')
                self.assertEqual(face.get_attribute('src'),'assets/character-portraits/merc-'+id+'.webp')
                face.evaluate('(e)=>e.decode()')
                self.assertTrue(p.locator('#battle-support').is_visible())
                self.assertEqual(p.locator('#battle-support small').inner_text(),'자동 지원')
                r=p.locator('#battle-support').bounding_box();s=p.locator('.skill-row').bounding_box()
                self.assertLessEqual(r['y']+r['height'],s['y'])
                floor=p.evaluate("BattlePresentation.project({x:300,y:479},document.querySelector('.board-stage').clientWidth,document.querySelector('.board-stage').clientHeight).y+document.querySelector('.board-stage').getBoundingClientRect().y")
                self.assertGreaterEqual(face.bounding_box()['y'],floor-1)
            p.evaluate("cueMercenary();sync()")
            self.assertEqual(p.locator('#battle-support').get_attribute('data-active'),'true')
            self.assertEqual(p.evaluate('JSON.stringify({board,cells,sp,life})'),before)
            p.evaluate('activeMerc=null;sync()')
            self.assertFalse(p.locator('#battle-support').is_visible())
            p.context.close()
    def test_idle_panel_select_skill_and_deselect(self):
        for w,h in [(320,568),(390,844)]:
            p=self.open(w,h);self.seed(p)
            self.assertFalse(p.locator('#skill').is_visible())
            self.assertFalse(p.locator('#battle-selected-portrait').is_visible())
            self.assertIn('보드의 직원',p.locator('#battle-selected-name').inner_text())
            help=p.locator('#skill-help').bounding_box();row=p.locator('.skill-row').bounding_box()
            self.assertGreaterEqual(help['height'],44)
            self.assertGreaterEqual(help['y'],row['y']-1)
            self.assertLessEqual(help['y']+help['height'],row['y']+row['height']+1)
            point=p.evaluate('BattlePresentation.screenPoint(cells[0])');p.mouse.click(point['x'],point['y'])
            self.assertEqual(p.evaluate('selected'),0)
            self.assertTrue(p.locator('#skill').is_enabled())
            p.locator('#skill').click()
            self.assertGreater(p.evaluate('board[0].skillCD'),0)
            self.assertTrue(p.locator('#skill').is_disabled())
            p.keyboard.press('Escape')
            p.evaluate('selected=-1;syncSkill()')
            self.assertFalse(p.locator('#skill').is_visible())
            p.context.close()
