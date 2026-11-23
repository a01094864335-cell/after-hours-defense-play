"""Actual mobile controls for randomized rewards, board recycling and deployed-only equipment."""
import unittest,os
from pathlib import Path
import test_usability as ui
from browser_helpers import board_point
class DutyPatchTests(unittest.TestCase):
    setUpClass=classmethod(ui.UsabilityTests.setUpClass.__func__)
    tearDownClass=classmethod(ui.UsabilityTests.tearDownClass.__func__)
    open=ui.UsabilityTests.open
    def battle(self,p):
        p.evaluate("meta.tutorialComplete=true;reset();setScreen('battle');playing=true;wave=10;cost=60;sp=500;dailyEnabled=false;paused=false;queue=['normal'];timer=999;kingEvent.timer=999;board=Array(15).fill(null);board[0]={type:0,pip:1};board[1]={type:1,pip:5};sync()")
    def test_trash_click_confirmation_and_deployed_equipment(self):
        for w,h in [(320,568),(390,844)]:
            p=self.open(w,h);self.battle(p)
            p.locator('#game').press('Enter')
            ui.assert_reachable(self,p,'#board-trash');p.locator('#board-trash').click();self.assertIsNone(p.evaluate('board[0]'))
            p.locator('#game').press('ArrowRight');p.locator('#game').press('Enter')
            p.locator('#board-trash').click();self.assertTrue(p.evaluate('!!board[1]'));self.assertEqual(p.locator('#board-trash').get_attribute('data-armed'),'true')
            p.locator('#upgrade-open').click();self.assertEqual(p.locator('#cards button:visible').count(),1);self.assertTrue(p.locator('#up1').is_visible());p.locator('#up1').click();self.assertEqual(p.evaluate('levels[1]'),2)
            p.locator('#equipment-close').click() if p.locator('#equipment-close').count() else p.locator('#equipment button[data-close]').click()
            p.context.close()
    def test_drag_to_trash_frees_cell(self):
        p=self.open(390,844);self.battle(p);pos=board_point(p,p.evaluate('cells[0]'));p.mouse.move(pos['x'],pos['y']);p.mouse.down();p.mouse.move(pos['x']+15,pos['y']+15,steps=3)
        # Raw mouse dispatch is not a locator action with auto-waiting. Observe
        # the delivered drag before reading the newly revealed drop target.
        p.wait_for_function('drag?.from===0&&drag.moved',timeout=5000)
        p.locator('#board-trash').wait_for(state='visible',timeout=5000)
        r=p.locator('#board-trash').bounding_box();self.assertIsNotNone(r);p.mouse.move(r['x']+r['width']/2,r['y']+r['height']/2,steps=8);p.mouse.up();self.assertIsNone(p.evaluate('board[0]'))
    def test_roulette_pauses_combat_preserves_result_and_single_claim(self):
        for w,h in [(320,568),(390,844)]:
            p=self.open(w,h);self.battle(p);p.evaluate("wave=10;bonusPending=true;paused=true;renderPerkChoices();document.querySelector('#perk').showModal();sync()")
            before=p.evaluate('time');p.wait_for_function("!document.querySelector('#roulette-claim').disabled")
            self.assertEqual(p.evaluate('time'),before);self.assertEqual(p.locator('#perk-options [data-winner=true]').count(),1)
            ui.assert_reachable(self,p,'#roulette-claim');fixed=p.evaluate('JSON.stringify(rewardBundle)')
            out=os.getenv('DUTY_QA_DIR')
            if out:Path(out).mkdir(parents=True,exist_ok=True);p.screenshot(path=str(Path(out)/f'roulette-{w}.png'))
            p.reload(wait_until='networkidle');p.wait_for_function('GameSession.canWrite()');self.assertTrue(p.evaluate('resumeRun()'));self.assertEqual(p.evaluate('JSON.stringify(rewardBundle)'),fixed)
            p.locator('#roulette-claim').click();self.assertFalse(p.evaluate('bonusPending'));self.assertEqual(p.evaluate('wave'),11);self.assertFalse(p.evaluate('RewardRoulette.take()'));p.context.close()
