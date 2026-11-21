"""Held pointers repeatedly invoke the real summon path and stop at gameplay boundaries."""
import unittest
import test_usability as ui
class RapidSummonTests(unittest.TestCase):
    setUpClass=classmethod(ui.UsabilityTests.setUpClass.__func__)
    tearDownClass=classmethod(ui.UsabilityTests.tearDownClass.__func__)
    open=ui.UsabilityTests.open
    def ready(self,w=390,h=844):
        p=self.open(w,h)
        p.evaluate("saveChange(d=>d.tutorialComplete=true);restartTo('battle');closePromo();dailyEnabled=false;sp=5000;kingEvent.timer=9999;sync()")
        return p
    def down(self,p):
        r=p.locator('#summon').bounding_box();p.mouse.move(r['x']+r['width']/2,r['y']+r['height']/2);p.mouse.down()
    def test_tap_once_hold_repeats_release_stops_without_extra_click(self):
        for w,h in [(320,568),(390,844)]:
            p=self.ready(w,h);p.locator('#summon').click();self.assertEqual(p.evaluate('cost'),20)
            self.down(p);p.wait_for_timeout(1100);p.mouse.up();count=p.evaluate('cost')
            self.assertGreaterEqual(count,50);p.wait_for_timeout(450);self.assertEqual(p.evaluate('cost'),count)
            p.locator('#summon').click();self.assertEqual(p.evaluate('cost'),count+10)
            p.context.close()
    def test_budget_and_full_board_stop_without_automatic_restart(self):
        p=self.ready();p.evaluate('sp=20;sync()');self.down(p);p.wait_for_timeout(1100)
        self.assertEqual(p.evaluate('[sp,cost]'),[0,30])
        p.evaluate('sp=5000;sync()');p.wait_for_timeout(500);self.assertEqual(p.evaluate('cost'),30);p.mouse.up()
        self.down(p);p.wait_for_timeout(3300);p.mouse.up();self.assertEqual(p.evaluate('board.filter(Boolean).length'),15)
        before=p.evaluate('cost');p.wait_for_timeout(400);self.assertEqual(p.evaluate('cost'),before)
    def test_dialog_pause_and_tutorial_stop_held_pointer(self):
        p=self.ready();self.down(p);p.wait_for_timeout(450);p.evaluate("document.querySelector('#info').showModal()")
        before=p.evaluate('cost');p.wait_for_timeout(500);p.mouse.up();self.assertEqual(p.evaluate('cost'),before)
        p.evaluate("document.querySelector('#info').close();paused=true");self.down(p);p.wait_for_timeout(600);p.mouse.up();self.assertEqual(p.evaluate('cost'),before)
        p.evaluate("paused=false;saveChange(d=>d.tutorialComplete=false);restartTo('battle');closePromo();TutorialCoach.dismiss();TutorialCoach.dismiss();sync()")
        self.down(p);p.wait_for_timeout(2000);p.mouse.up();self.assertEqual(p.evaluate('preparationCount()'),5);self.assertTrue(p.evaluate('TutorialCoach.speaking()'))
