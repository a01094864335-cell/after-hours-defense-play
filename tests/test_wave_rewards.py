"""Real reward tickets stay atomic, persistent and readable in both copy lengths."""
import unittest
import test_usability as ui

class WaveRewardTests(unittest.TestCase):
    setUpClass=classmethod(ui.UsabilityTests.setUpClass.__func__)
    tearDownClass=classmethod(ui.UsabilityTests.tearDownClass.__func__)
    open=ui.UsabilityTests.open
    def seed(self,p,w,lang='ko'):
        p.evaluate("([w,lang])=>{document.querySelectorAll('dialog[open]').forEach(d=>d.close());document.documentElement.lang=lang;meta.tutorialComplete=true;reset();setScreen('battle');wave=w;playing=true;paused=true;bonusPending=true;renderPerkChoices();document.querySelector('#perk').showModal();sync()}",[w,lang])
    def test_three_tickets_targets_and_utilities_fit_phone_in_both_languages(self):
        for width,height in [(320,568),(390,844)]:
            p=self.open(width,height)
            for lang in ['ko','en']:
                for w in [5,10,15,20,25,30,35]:
                    self.seed(p,w,lang)
                    cards=p.locator('#perk-options>button:visible')
                    self.assertEqual(cards.count(),3)
                    for c in cards.all():
                        self.assertTrue(c.is_enabled());r=c.bounding_box()
                        self.assertGreaterEqual(r['x'],0);self.assertLessEqual(r['x']+r['width'],width)
                        self.assertEqual(c.evaluate('e=>e.scrollWidth<=e.clientWidth+1'),True)
                        self.assertLessEqual(r['y']+r['height'],height)
                    ui.assert_reachable(self,p,'#perk-reposition')
                    self.assertEqual(p.locator('#perk-cashout').is_visible(),w%15==0)
                    self.assertFalse(p.locator('#perk-targets').is_visible())
            p.context.close()
    def test_saved_offer_survives_reload_and_single_click_awards_fixed_target_once(self):
        p=self.open(390,844);self.seed(p,25)
        p.evaluate('saveActiveRun()');before=p.evaluate('JSON.stringify(rewardBundle)')
        target=p.evaluate("rewardBundle.offers.find(o=>o.id==='staff').type")
        p.reload(wait_until='networkidle');p.wait_for_function('GameSession.canWrite()');self.assertTrue(p.evaluate('resumeRun()'))
        self.assertEqual(p.evaluate('JSON.stringify(rewardBundle)'),before)
        p.locator('#perk-staff').click();self.assertFalse(p.evaluate('bonusPending'))
        self.assertEqual(p.evaluate(f'board.filter(u=>u?.type==={target}&&u.pip===4).length'),1)
        self.assertFalse(p.evaluate("choosePerk('staff')"))
