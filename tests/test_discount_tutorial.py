"""Discount practice follows a real merge and preserves pending action on resume."""
import unittest
import test_usability as ui

class DiscountTutorialTests(unittest.TestCase):
    setUpClass=classmethod(ui.UsabilityTests.setUpClass.__func__)
    tearDownClass=classmethod(ui.UsabilityTests.tearDownClass.__func__)
    open=ui.UsabilityTests.open
    inside=ui.UsabilityTests.inside
    def lesson(self,a):
        a.locator('#enter-battle').click();a.locator('#promo-skip').click()
        a.evaluate("TutorialCoach.dismiss();paused=false;for(let i=0;i<5;i++)summon();TutorialCoach.dismiss();wave=3;afterWaveStart();TutorialCoach.dismiss();paused=false;const pair=TutorialCoach.task.pair;merge(pair[0],pair[1]);update(6);TutorialCoach.dismiss();TutorialCoach.dismiss();const failPair=TutorialCoach.task.pair;merge(...failPair);update(6);TutorialCoach.dismiss()")
        self.assertEqual(a.evaluate('DiscountTutorial.snapshot().stage'),'intro')
    def test_real_merge_then_real_discounted_summon(self):
        a=self.open(320,568);self.lesson(a);before=a.evaluate('JSON.stringify(board)')
        self.inside(a,'#coach-next');a.locator('#coach-next').click()
        self.assertEqual(a.evaluate('JSON.stringify(board)'),before)
        self.assertEqual(a.evaluate('DiscountTutorial.snapshot().stage'),'summon')
        self.assertTrue(a.evaluate('TutorialCoach.held()'))
        before=a.evaluate('sp');price=a.evaluate('summonPrice()');a.locator('#summon').click()
        self.assertEqual(a.evaluate('DiscountTutorial.snapshot().stage'),'done')
        self.assertEqual(a.evaluate('TutorialCoach.task.lesson'),'discount');a.locator('#coach-next').wait_for(state='visible');a.locator('#coach-next').click();self.assertFalse(a.evaluate('TutorialCoach.held()'));self.assertFalse(a.evaluate('summonDiscount'))
    def test_reload_restores_pending_discount_without_duplicate_grant(self):
        a=self.open(390,844);self.lesson(a);a.locator('#coach-next').click();before=a.evaluate('sp')
        a.reload(wait_until='networkidle');a.wait_for_function('GameSession.canWrite()');a.locator('#resume-run').click();a.locator('#coach-next').click()
        self.assertEqual(a.evaluate('sp'),before)
        self.assertEqual(a.evaluate('DiscountTutorial.snapshot().stage'),'summon')
        a.locator('#summon').click();self.assertEqual(a.evaluate('DiscountTutorial.snapshot().stage'),'done')
    def test_skip_does_not_graduate(self):
        a=self.open(390,844);self.lesson(a);a.locator('#coach-next').click();a.locator('#tutorial-practice-skip').click()
        self.assertEqual(a.evaluate('DiscountTutorial.snapshot().stage'),'skipped')
        self.assertFalse(a.evaluate('meta.tutorialComplete'));self.assertFalse(a.evaluate('TutorialCoach.held()'))
    def test_blocked_summon_does_not_complete(self):
        a=self.open(390,844);self.lesson(a);a.locator('#coach-next').click()
        a.evaluate('sp=0;summon();sync()')
        self.assertEqual(a.evaluate('DiscountTutorial.snapshot().stage'),'summon')
        self.assertTrue(a.evaluate('summonDiscount'))
