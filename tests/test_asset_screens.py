"""The approved main and staff roster must be real, state-backed game surfaces."""
import unittest
import test_usability as ui


class AssetScreenTests(unittest.TestCase):
    setUpClass = classmethod(ui.UsabilityTests.setUpClass.__func__)
    tearDownClass = classmethod(ui.UsabilityTests.tearDownClass.__func__)
    open = ui.UsabilityTests.open

    def test_main_roster_navigation_and_compact_scroll(self):
        for width, height in [(390, 844), (320, 568)]:
            page = self.open(width, height)
            page.locator('#asset-lobby-host [data-proxy="#roster-open"]').click()
            self.assertTrue(page.locator('#roster').evaluate('d=>d.open'))
            self.assertEqual(page.locator('#asset-roster-host .r-card').count(), 6)
            page.locator('#asset-roster-host [data-group="incoming"]').click()
            self.assertEqual(page.locator('#asset-roster-host .r-card').count(), 11)
            page.locator('#asset-roster-host .r-card').first.click()
            self.assertTrue(page.locator('#recruit-specific').is_disabled())
            page.locator('#roster-back').click()
            if width == 320:
                self.assertTrue(page.locator('#asset-roster-host .r-scroll').evaluate('e=>e.scrollHeight>e.clientHeight'))
            page.locator('#asset-roster-host .r-nav [data-action="close"]').click()
            self.assertFalse(page.locator('#roster').evaluate('d=>d.open'))
            self.assertTrue(page.locator('#asset-lobby-host #asset-lobby').is_visible())

    def test_staff_and_support_actions_keep_original_state_rules(self):
        page = self.open(390, 844)
        page.locator('#asset-lobby-host [data-proxy="#roster-open"]').click()
        page.locator('#asset-roster-host .r-card[data-record="goblin-guard"]').click()
        page.locator('#staff-toggle').click()
        self.assertEqual(page.evaluate('meta.deck.length'), 5)
        page.evaluate('saveChange(d=>{d.tutorialComplete=true;d.owned=["ward"]})')
        page.locator('#staff-toggle').click()
        self.assertEqual(page.evaluate('meta.deck.length'), 4)
        page.locator('#roster-back').click()
        self.assertEqual(page.locator('#asset-roster-host #r-count').inner_text(), '4/5')
        page.locator('#asset-roster-host .r-card[data-record="ghost-courier"]').click()
        page.locator('#staff-toggle').click()
        self.assertTrue(page.evaluate('meta.deck.includes("ghost-courier")'))
        page.locator('#roster-back').click()
        page.locator('#asset-roster-host [data-group="merc"]').click()
        page.locator('#asset-roster-host .r-card[data-record="merc-ward"]').click()
        page.locator('#support-equip').click()
        self.assertEqual(page.evaluate('meta.equipped'), 'ward')
        page.locator('#support-equip').click()
        self.assertNotEqual(page.evaluate('meta.equipped'), 'ward')
