"""End-to-end gaps: backup files, every collected story, and browser navigation.
Each test is independently repeated ten times by run_feature_qa.py in CI.
"""
import json
import unittest
import test_usability as ui


class FeatureJourneyTests(unittest.TestCase):
    setUpClass = classmethod(ui.UsabilityTests.setUpClass.__func__)
    tearDownClass = classmethod(ui.UsabilityTests.tearDownClass.__func__)
    open = ui.UsabilityTests.open

    def test_backup_download_upload_restore_and_reload(self):
        page = self.open(390, 844)
        page.evaluate('saveChange(d=>{d.coins=321;d.tutorialComplete=true});renderMeta()')
        page.locator('#asset-lobby-host [data-proxy="#menu-open"]').click()
        page.locator('#save-transfer-open').click()
        with page.expect_download() as download:
            page.locator('#save-download').click()
        data = json.loads(open(download.value.path(), encoding='utf-8').read())
        self.assertEqual(data['wallet']['coins'], 321)
        page.evaluate('saveChange(d=>d.coins=7)')
        page.locator('#save-file').set_input_files({'name':'isolated-qa-save.json', 'mimeType':'application/json', 'buffer':json.dumps(data).encode()})
        page.wait_for_function("document.querySelector('#save-text').value.includes('321')")
        page.locator('#save-preview').click()
        self.assertTrue(page.locator('#save-restore').is_visible())
        page.locator('#save-restore').click()
        self.assertEqual(page.evaluate('meta.coins'), 321)
        self.assertFalse(page.locator('#save-transfer-dialog').evaluate('d=>d.open'))
        page.reload(wait_until='networkidle')
        page.wait_for_function('GameSession.canWrite()')
        self.assertEqual(page.evaluate('meta.coins'), 321)
        self.assertIsNone(page.evaluate("localStorage.getItem('after-hours-import-transaction-v1')"))

    def test_every_story_replays_without_rewards_and_cleans_close_state(self):
        page = self.open(390, 844)
        page.evaluate('saveChange(d=>{d.stories=CastleStories.map(s=>s.id);d.coins=123});renderMeta()')
        ids = page.evaluate('CastleStories.map(s=>s.id)')
        page.locator('#asset-lobby-host [data-proxy="#lobby-story-collection"]').click()
        for story_id in ids:
            with self.subTest(story=story_id):
                page.locator(f'[data-story="{story_id}"]').click()
                self.assertTrue(page.evaluate('castleReplay'))
                self.assertTrue(page.locator('#promo-prev').is_disabled())
                page.locator('#promo-next').click()
                self.assertEqual(page.evaluate('promoIndex'), 1)
                page.locator('#promo-prev').click()
                self.assertEqual(page.evaluate('promoIndex'), 0)
                for _ in range(4):
                    page.locator('#promo-next').click()
                page.wait_for_function('!castleReplay')
                self.assertFalse(page.locator('#promo').evaluate('d=>d.open'))
                self.assertTrue(page.locator('#story-archive').evaluate('d=>d.open'))
                self.assertEqual(page.evaluate('meta.coins'), 123)
        page.keyboard.press('Escape')
        self.assertFalse(page.locator('#story-archive').evaluate('d=>d.open'))
        self.assertTrue(page.locator('#asset-lobby-host #asset-lobby').is_visible())

    def test_every_hiring_story_pages_back_close_and_escape(self):
        page = self.open(390, 844)
        page.evaluate('saveChange(d=>{d.staff=kinds.map(k=>k.file);d.owned=MERC_IDS.slice()});renderMeta()')
        ids = page.evaluate('staffRecords.filter(r=>HiringStories.canView(r.id)).map(r=>r.id)')
        self.assertGreater(len(ids), 0)
        for staff_id in ids:
            with self.subTest(staff=staff_id):
                self.assertTrue(page.evaluate('(id)=>HiringStories.open(id)', staff_id))
                self.assertTrue(page.locator('[data-hire-prev]').is_disabled())
                page.locator('[data-hire-next]').click()
                self.assertIn('2', page.locator('.hire-page').inner_text())
                page.locator('[data-hire-prev]').click()
                self.assertIn('1', page.locator('.hire-page').inner_text())
                for _ in range(4):
                    page.locator('[data-hire-next]').click()
                self.assertFalse(page.locator('#hiring-story').evaluate('d=>d.open'))
                page.evaluate('(id)=>HiringStories.open(id)', staff_id)
                page.keyboard.press('Escape')
                self.assertFalse(page.locator('#hiring-story').evaluate('d=>d.open'))

    def test_browser_back_forward_reacquires_storage_and_keeps_wallet(self):
        page = self.open(390, 844)
        page.evaluate('saveChange(d=>d.coins=47)')
        page.goto('about:blank')
        page.go_back(wait_until='networkidle')
        page.wait_for_function('GameSession.canWrite()')
        self.assertEqual(page.evaluate('meta.coins'), 47)
        page.go_forward()
        self.assertEqual(page.url, 'about:blank')
        page.go_back(wait_until='networkidle')
        page.wait_for_function('GameSession.canWrite()')
        self.assertEqual(page.evaluate('meta.coins'), 47)
