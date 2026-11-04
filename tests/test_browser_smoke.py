"""Release gate: real controls plus saving and settlement in Chromium."""
import unittest
import test_usability as ui
import test_release_smoke as safety
from browser_helpers import start_battle


class GameplaySmokeTests(unittest.TestCase):
    setUpClass = classmethod(ui.UsabilityTests.setUpClass.__func__)
    tearDownClass = classmethod(ui.UsabilityTests.tearDownClass.__func__)
    open = ui.UsabilityTests.open

    def test_fresh_player_starts_combat_through_visible_controls(self):
        page = self.open(390, 844)
        errors = []
        page.on('pageerror', lambda error: errors.append(str(error)))
        start_battle(page)
        self.assertEqual(page.evaluate('board.filter(Boolean).length'), 5)
        before = page.evaluate('time')
        page.wait_for_function('(before)=>time > before + .2', arg=before)
        page.locator('#pause').click()
        frozen = page.evaluate('time')
        page.wait_for_timeout(200)
        self.assertEqual(page.evaluate('time'), frozen)
        page.locator('#pause-continue').click()
        page.wait_for_function('(before)=>time > before', arg=frozen)
        self.assertEqual(errors, [])

    def test_wave_six_instruction_requires_one_selection(self):
        page = self.open(390, 844)
        start_battle(page)
        # Skip elapsed waves, but use the actual lesson, canvas and skill control.
        page.evaluate('wave=6;afterWaveStart();sync()')
        page.locator('#coach-next').click()
        self.assertEqual(page.evaluate('selected'), -1)
        cell = page.evaluate('cells[TutorialCoach.task.index]')
        box = page.locator('#game').bounding_box()
        page.mouse.click(box['x'] + cell['x'] * box['width'] / 600,
                         box['y'] + cell['y'] * box['height'] / 600)
        self.assertTrue(page.locator('#skill').is_enabled())
        page.locator('#skill').click()
        self.assertEqual(page.evaluate('TutorialCoach.task.lesson'), 'skill')
        self.assertGreater(page.evaluate('board[selected].skillCD'), 0)


def load_tests(loader, tests, pattern):
    suite = loader.loadTestsFromTestCase(GameplaySmokeTests)
    if pattern != "test_browser_smoke.py":
        return suite
    for name in [
        'test_reload_resume_keeps_run_and_training',
        'test_second_tab_cannot_write_and_reconnect_reads_latest',
        'test_normal_reward_does_not_pay_twice',
        'test_failed_purchase_keeps_wallet_and_inventory',
        'test_pending_reward_recovers_after_reload',
        'test_rotation_pauses_and_requires_explicit_continue',
    ]:
        suite.addTest(safety.ReleaseSafetyTests(name))
    return suite
