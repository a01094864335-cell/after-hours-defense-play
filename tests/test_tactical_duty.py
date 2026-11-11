"""Release checks for planning, voluntary settlement and isolated staff practice."""
import unittest
import test_usability as ui
from browser_helpers import board_point


class TacticalDutyTests(unittest.TestCase):
    setUpClass = classmethod(ui.UsabilityTests.setUpClass.__func__)
    tearDownClass = classmethod(ui.UsabilityTests.tearDownClass.__func__)
    open = ui.UsabilityTests.open

    def normal(self):
        page = self.open(390, 844)
        page.evaluate("saveChange(d=>{d.tutorialComplete=true;d.profile.starterClaim=null});restartTo('lobby')")
        return page

    def test_staff_practice_uses_real_skill_without_parent_save_changes(self):
        page = self.normal()
        errors = []
        page.on('pageerror', lambda error: errors.append(str(error)))
        page.locator('#asset-lobby-host [data-proxy="#starter-choice-open"]').click()
        page.locator('#starter-options button').first.click()
        before = page.evaluate('({wallet:GameStorage.getItem(META_KEY),run:GameStorage.getItem(RUN_SAVE)})')
        page.locator('#trial-play').click()
        trial = page.frame_locator('#practice-frame')
        trial.locator('#skill:not(:disabled)').wait_for()
        trial.locator('#skill').click()
        self.assertTrue(trial.locator('#skill').is_disabled())
        page.locator('#trial-close').click()
        page.locator('#practice-frame').wait_for(state='detached')
        self.assertEqual(page.evaluate('({wallet:GameStorage.getItem(META_KEY),run:GameStorage.getItem(RUN_SAVE)})'), before)
        self.assertEqual(errors, [])

    def test_planning_move_and_strategy_survive_resume(self):
        page = self.normal()
        page.locator('#asset-lobby-host [data-proxy="#enter-battle"]').click()
        page.locator('#promo-skip').click()
        for _ in range(5):
            page.locator('#summon').click()
        page.evaluate("wave=5;enemies=[];queue=[];bonusPending=true;paused=true;renderPerkChoices();document.querySelector('#perk').showModal();sync()")
        page.locator('#perk-reposition').click()
        self.assertTrue(page.locator('#ref-pause').is_hidden())
        source, target = page.evaluate('([board.findIndex(Boolean),board.findIndex(u=>!u)])')
        cell = page.evaluate('cells')
        box = page.locator('#game').bounding_box()
        for i in [source, target]:
            pos = board_point(page, cell[i])
            page.mouse.click(pos['x'], pos['y'])
        self.assertTrue(page.evaluate(f'!!board[{target}] && !board[{source}]'))
        page.locator('#reposition-done').click()
        page.evaluate('wave=10;rewardBundle=null;renderPerkChoices()')
        page.locator('#perk-build').click()
        page.reload()
        page.wait_for_function('GameSession.canWrite()')
        page.locator('#asset-lobby-host [data-proxy="#resume-run"]').click()
        self.assertEqual(page.evaluate('TacticalDuty.snapshot().build'), 'economy')

    def test_cashout_keeps_completed_wave_and_pays_once_after_reload(self):
        page = self.normal()
        page.evaluate("reset();setScreen('battle');playing=true;wave=15;bonusPending=true;paused=true;enemies=[];queue=[];runNormal=100;runBoss=3;renderPerkChoices();document.querySelector('#perk').showModal();sync()")
        before = page.evaluate('meta.coins')
        page.locator('#perk-cashout').click()
        self.assertEqual(page.evaluate('meta.coins'), before + 25)
        self.assertEqual(page.evaluate('meta.profile.records[0].cleared'), 15)
        page.reload()
        page.wait_for_function('GameSession.canWrite()')
        self.assertEqual(page.evaluate('meta.coins'), before + 25)
        self.assertEqual(page.evaluate('meta.profile.records.length'), 1)
