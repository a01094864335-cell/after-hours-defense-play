"""Daily combat events are retired without disrupting lobby navigation or resumes."""
import unittest,os
from pathlib import Path
import test_usability as ui
from browser_helpers import enter_preparation
class NoDailyTests(unittest.TestCase):
    setUpClass=classmethod(ui.UsabilityTests.setUpClass.__func__)
    tearDownClass=classmethod(ui.UsabilityTests.tearDownClass.__func__)
    open=ui.UsabilityTests.open
    def test_lobby_has_no_daily_entry_and_new_runs_keep_base_rules(self):
        for w,h in [(320,568),(390,844)]:
            p=self.open(w,h);p.evaluate("saveChange(d=>d.tutorialComplete=true);restartTo('lobby')")
            self.assertFalse(p.locator('#asset-lobby-host .a-daily').is_visible())
            ui.assert_reachable(self,p,'#asset-lobby-host .a-start')
            out=os.getenv('NO_DAILY_QA_DIR')
            if out:Path(out).mkdir(parents=True,exist_ok=True);p.screenshot(path=str(Path(out)/f'lobby-{w}.png'))
            enter_preparation(p)
            for _ in range(5):p.locator('#summon').click()
            self.assertFalse(p.evaluate('dailyEnabled'));self.assertEqual(p.evaluate('summonPrice()'),40)
            p.evaluate('saveActiveRun()');p.reload(wait_until='networkidle');p.wait_for_function('GameSession.canWrite()');self.assertTrue(p.evaluate('resumeRun()'))
            self.assertFalse(p.evaluate('dailyEnabled'));self.assertFalse(p.locator('#daily-current').is_visible());p.context.close()
