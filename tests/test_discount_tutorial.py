"""First-play discount practice uses a model, then the real summon action."""
import unittest
import test_usability as ui

class DiscountTutorialTests(unittest.TestCase):
    setUpClass=classmethod(ui.UsabilityTests.setUpClass.__func__)
    tearDownClass=classmethod(ui.UsabilityTests.tearDownClass.__func__)
    open=ui.UsabilityTests.open
    inside=ui.UsabilityTests.inside
    def lesson(self,a):
        a.locator('#enter-battle').click();a.locator('#promo-skip').click()
        a.evaluate('playing=true;wave=3;cost=100;intermission=-999;afterWaveStart();sync()')
        self.assertEqual(a.evaluate('DiscountTutorial.snapshot().stage'),'intro')
    def test_practice_keeps_real_staff_and_requires_actual_discounted_summon(self):
        a=self.open(320,568);self.lesson(a);before=a.evaluate('JSON.stringify(board)')
        self.inside(a,'#guide-next');self.inside(a,'#discount-tutorial-skip');a.locator('#guide-next').click()
        self.assertEqual(a.evaluate('JSON.stringify(board)'),before);self.assertTrue(a.evaluate('summonDiscount'));self.assertEqual(a.evaluate('DiscountTutorial.snapshot().stage'),'offer')
        a.locator('#guide-next').click();self.assertTrue(a.locator('#summon').evaluate("e=>e.classList.contains('tutorial-target')"))
        before=a.evaluate('sp');a.locator('#summon').click()
        self.assertEqual(a.evaluate('sp'),before-50);self.assertEqual(a.evaluate('cost'),110);self.assertFalse(a.evaluate('summonDiscount'))
        self.assertEqual(a.evaluate('DiscountTutorial.snapshot().stage'),'done');self.assertIn('3 / 3',a.locator('#guide-title').inner_text())
        a.locator('#guide-next').click();self.assertFalse(a.evaluate('paused'));self.assertEqual(a.locator('#guide[open]').count(),0)
    def test_resume_restores_offer_and_pending_action_without_duplicate_support(self):
        a=self.open(390,844);self.lesson(a);a.locator('#guide-next').click();before=a.evaluate('sp')
        a.reload(wait_until='networkidle');a.wait_for_function('GameSession.canWrite()');a.evaluate('resumeRun()')
        self.assertEqual(a.evaluate('sp'),before);self.assertEqual(a.evaluate('DiscountTutorial.snapshot().stage'),'offer');self.assertIn('2 / 3',a.locator('#guide-title').inner_text())
        a.locator('#guide-next').click();a.reload(wait_until='networkidle');a.wait_for_function('GameSession.canWrite()');a.evaluate('resumeRun()');a.locator('#guide-next').click()
        self.assertEqual(a.evaluate('DiscountTutorial.snapshot().stage'),'summon');a.locator('#summon').click();self.assertEqual(a.evaluate('DiscountTutorial.snapshot().stage'),'done')
    def test_skip_does_not_graduate_and_returning_players_are_not_auto_enrolled(self):
        a=self.open(390,844);self.lesson(a);a.locator('#discount-tutorial-skip').click()
        self.assertEqual(a.evaluate('DiscountTutorial.snapshot().stage'),'skipped');self.assertFalse(a.evaluate('meta.tutorialComplete'));self.assertFalse(a.evaluate('summonDiscount'))
        a.evaluate('afterWaveStart()');self.assertNotIn('반값 소환 연습',a.locator('#guide-title').inner_text());a.context.close()
        a=self.open(390,844);a.evaluate('saveChange(d=>{d.tutorialComplete=true});reset();wave=3;afterWaveStart()')
        self.assertEqual(a.locator('#guide[open]').count(),0);self.assertEqual(a.evaluate('DiscountTutorial.snapshot().stage'),'done')
    def test_blocked_summon_does_not_complete_and_legacy_runs_do_not_restart_lesson(self):
        a=self.open(390,844);self.lesson(a);a.locator('#guide-next').click();a.locator('#guide-next').click()
        a.evaluate('sp=0;summon();sync()');self.assertEqual(a.evaluate('DiscountTutorial.snapshot().stage'),'summon');self.assertTrue(a.evaluate('summonDiscount'))
        a.evaluate('const old=runSnapshot();delete old.discountTutorial;applySnapshot(old)');self.assertEqual(a.evaluate('DiscountTutorial.snapshot().stage'),'done')
