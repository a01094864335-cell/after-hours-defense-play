"""Compare the live DOM with the approved illustration's composition contract."""
import unittest
import test_usability as ui


class ExactBattleTests(unittest.TestCase):
    setUpClass = classmethod(ui.UsabilityTests.setUpClass.__func__)
    tearDownClass = classmethod(ui.UsabilityTests.tearDownClass.__func__)
    open = ui.UsabilityTests.open

    def seed(self, page):
        page.evaluate('''()=>{const gm=document.querySelector('#gm-test-panel');if(gm)gm.style.display='none';document.body.classList.remove('gm-test-active');meta.tutorialComplete=true;reset();tutorialMode=false;setScreen('battle');playing=true;paused=false;wave=8;sp=240;queue=['normal'];timer=999;update=()=>{};board[0]={type:0,pip:1,cool:0};sync()}''')

    def test_regions_use_approved_composition_at_all_viewport_sizes(self):
        for width, height in [(320,568),(390,640),(390,684),(390,844),(430,932)]:
            page = self.open(width, height)
            self.seed(page)
            bounds=page.locator('#battle').bounding_box()
            self.assertAlmostEqual(bounds['width'],width,delta=1)
            self.assertAlmostEqual(bounds['height'],height,delta=1)
            result = page.evaluate('''async()=>{
              const spec=await fetch('assets/battle-exact/composition.json').then(r=>r.json());
              const selectors={hud:'.battle-top',wave:'.battle-notice',stage:'.board-stage',skill:'.skill-row',summon:'.summon-row',items:'.item-buttons'};
              const root=document.querySelector('#battle').getBoundingClientRect();
              return Object.entries(selectors).map(([key,selector])=>{const r=document.querySelector(selector).getBoundingClientRect();return {key,expected:spec.regions[key],actual:[(r.left-root.left)/root.width,(r.top-root.top)/root.height,r.width/root.width,r.height/root.height]}})
            }''')
            for region in result:
                for axis, (actual, expected) in enumerate(zip(region['actual'],region['expected'])):
                    self.assertLess(abs(actual-expected)*(width if axis%2==0 else height),1.2,(width,height,region))
            page.close()

    def test_largest_header_buttons_and_projected_staff_remain_clickable(self):
        page = self.open(430,932)
        self.seed(page)
        point = page.evaluate('BattlePresentation.screenPoint(cells[0])')
        page.mouse.click(point['x'],point['y'])
        self.assertEqual(page.evaluate('selected'),0)
        page.locator('#speed').click()
        self.assertEqual(page.evaluate('speed'),2)
        page.locator('#pause').click()
        self.assertTrue(page.evaluate('paused'))
        page.locator('#pause-continue').click()
        self.assertFalse(page.evaluate('paused'))
        page.locator('#upgrade-open').click()
        self.assertTrue(page.locator('#equipment').is_visible())
