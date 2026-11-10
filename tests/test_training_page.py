"""Training is a guarded app page with history, retained art and live upgrades."""
import unittest
import test_usability as ui

class TrainingPageTests(unittest.TestCase):
    setUpClass = classmethod(ui.UsabilityTests.setUpClass.__func__)
    tearDownClass = classmethod(ui.UsabilityTests.tearDownClass.__func__)
    open = ui.UsabilityTests.open

    def test_independent_page_history_and_navigation_ten_times(self):
        for attempt in range(10):
            with self.subTest(attempt=attempt + 1):
                p = self.open(320 if attempt % 2 else 390, 568 if attempt % 2 else 844)
                p.evaluate('saveChange(d=>{d.tutorialComplete=true;d.coins=100});renderMeta();openTraining()')
                p.wait_for_function("appScreen==='training' && !document.body.classList.contains('asset-lobby-active')")
                self.assertEqual(p.locator('#training-dialog').evaluate('e=>e.tagName'), 'SECTION')
                self.assertEqual(p.locator('dialog:modal').count(), 0)
                self.assertTrue(p.locator('#training-dialog').evaluate("e=>e.closest('#app-shell')!==null"))
                self.assertEqual(p.locator('#asset-training-host footer [aria-current="page"]').count(), 1)
                ui.assert_reachable(self, p, '#asset-training-host .back')
                ui.assert_reachable(self, p, '#asset-training-host #upgrade')
                ui.assert_reachable(self, p, '#asset-training-host [data-action="home"]')
                before = p.evaluate('JSON.stringify(meta)')
                p.go_back()
                p.wait_for_function("appScreen==='lobby'")
                p.go_forward()
                p.wait_for_function("appScreen==='training'")
                for target in ['roster', 'shop']:
                    p.locator(f'#asset-training-host [data-action="{target}"]').click()
                    self.assertEqual(p.evaluate('appScreen'), 'training')
                    p.evaluate(f"document.querySelector('#{target}').close()")
                    self.assertTrue(p.locator('#asset-training-host').is_visible())
                self.assertEqual(p.evaluate('JSON.stringify(meta)'), before)
                cost = p.evaluate("trainingCost(meta.training.staff)")
                p.locator('#asset-training-host #upgrade').click()
                self.assertEqual(p.evaluate('meta.training.staff'), 2)
                self.assertEqual(p.evaluate('meta.coins'), 100 - cost)
                p.locator('#asset-training-host .back').click()
                p.wait_for_function("appScreen==='lobby'")

    def test_battle_pause_and_result_page(self):
        p = self.open(390, 844)
        p.evaluate("playing=true;ended=false;paused=true;panelResume=true;setScreen('battle');openTraining()")
        self.assertTrue(p.evaluate('paused && trainingResume && !panelResume'))
        p.locator('#asset-training-host [data-action="roster"]').click()
        self.assertTrue(p.evaluate('paused'))
        p.evaluate("document.querySelector('#roster').close()")
        p.locator('#asset-training-host .back').click()
        p.wait_for_function("appScreen==='battle'")
        self.assertFalse(p.evaluate('paused'))
        p.wait_for_timeout(100)
        p.evaluate("playing=false;ended=true;runReward={paid:true,total:0};setScreen('result');openTraining();appRender()")
        self.assertEqual(p.evaluate('appScreen'), 'training')
        p.locator('#asset-training-host .back').click()
        self.assertEqual(p.evaluate('appScreen'), 'result')

    def test_landscape_keeps_page_inside_inert_guard(self):
        p = self.open(390, 844)
        p.evaluate('openTraining()')
        p.set_viewport_size({'width': 844, 'height': 390})
        p.wait_for_function("document.querySelector('#app-shell').inert")
        self.assertTrue(p.locator('#training-dialog').evaluate("e=>e.closest('[inert]')!==null"))
        p.set_viewport_size({'width': 390, 'height': 844})
        p.wait_for_function("!document.querySelector('#app-shell').inert")
        self.assertTrue(p.locator('#asset-training-host .back').is_visible())

if __name__ == '__main__':
    unittest.main()
