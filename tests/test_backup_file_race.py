"""Real-DOM backup regressions, repeated independently by run_feature_qa.py.
Only fresh browser contexts and generated JSON payloads are used.
"""
import json
import unittest
import test_usability as ui


class BackupFileRaceTests(unittest.TestCase):
    setUpClass = classmethod(ui.UsabilityTests.setUpClass.__func__)
    tearDownClass = classmethod(ui.UsabilityTests.tearDownClass.__func__)
    open = ui.UsabilityTests.open

    def prepare(self):
        page = self.open(390, 844)
        page.locator('#asset-lobby-host [data-proxy="#menu-open"]').click()
        page.locator('#menu-tab-manage').click()
        page.locator('#save-transfer-open').click()
        data = page.evaluate('SaveTransfer.exportData()')
        page.evaluate('''() => {
          window.qaFileReads = [];
          const read = File.prototype.text;
          File.prototype.text = function() {
            const file = this;
            return new Promise((resolve, reject) => {
              qaFileReads.push({name:file.name, resolve:()=>read.call(file).then(resolve,reject), reject});
            });
          };
        }''')
        return page, data

    def upload(self, page, data, coins, name):
        payload = json.loads(json.dumps(data))
        payload['wallet']['coins'] = coins
        page.locator('#save-file').set_input_files({
            'name': name, 'mimeType': 'application/json',
            'buffer': json.dumps(payload).encode(),
        })

    def test_delayed_file_invalidates_preview_and_latest_selection_wins(self):
        page, data = self.prepare()
        data['wallet']['coins'] = 11
        page.locator('#save-text').fill(json.dumps(data))
        page.locator('#save-preview').click()
        self.assertTrue(page.locator('#save-restore').is_visible())
        self.upload(page, data, 22, 'first.json')
        page.wait_for_function('qaFileReads.length===1')
        # User previews existing text while the file picker read is pending.
        page.locator('#save-preview').click()
        self.assertTrue(page.locator('#save-restore').is_visible())
        page.evaluate('qaFileReads[0].resolve()')
        page.wait_for_function("JSON.parse(document.querySelector('#save-text').value).wallet.coins===22")
        self.assertTrue(page.locator('#save-restore').is_hidden())
        self.upload(page, data, 33, 'slow-old.json')
        self.upload(page, data, 44, 'latest.json')
        page.wait_for_function('qaFileReads.length===3')
        page.evaluate('qaFileReads[2].resolve()')
        page.wait_for_function("JSON.parse(document.querySelector('#save-text').value).wallet.coins===44")
        page.evaluate('qaFileReads[1].resolve()')
        self.assertEqual(json.loads(page.locator('#save-text').input_value())['wallet']['coins'], 44)
        page.locator('#save-preview').click()
        page.locator('#save-restore').click()
        self.assertEqual(page.evaluate('meta.coins'), 44)
        self.assertFalse(page.locator('#save-transfer-dialog').evaluate('d=>d.open'))

    def test_file_read_rejection_has_visible_error_and_no_unhandled_exception(self):
        page, data = self.prepare()
        errors = []
        page.on('pageerror', lambda error: errors.append(str(error)))
        self.upload(page, data, 55, 'unreadable.json')
        page.wait_for_function('qaFileReads.length===1')
        page.evaluate("qaFileReads[0].reject(new Error('isolated QA unreadable file'))")
        page.wait_for_function("document.querySelector('#save-transfer-status').textContent.includes('읽지 못했어요')")
        self.assertTrue(page.locator('#save-restore').is_hidden())
        self.assertEqual(page.evaluate('meta.coins'), 0)
        self.assertEqual(errors, [])
        page.locator('#save-transfer-close').click()
        self.assertFalse(page.locator('#save-transfer-dialog').evaluate('d=>d.open'))

    def test_typing_and_closing_cancel_delayed_file_reads(self):
        page, data = self.prepare()
        self.upload(page, data, 77, 'slow-file.json')
        page.wait_for_function('qaFileReads.length===1')
        data['wallet']['coins'] = 88
        page.locator('#save-text').fill(json.dumps(data))
        page.evaluate('qaFileReads[0].resolve()')
        self.assertEqual(json.loads(page.locator('#save-text').input_value())['wallet']['coins'], 88)
        self.upload(page, data, 99, 'closed-file.json')
        page.wait_for_function('qaFileReads.length===2')
        page.locator('#save-transfer-close').click()
        page.evaluate('qaFileReads[1].resolve()')
        self.assertEqual(json.loads(page.locator('#save-text').input_value())['wallet']['coins'], 88)
        self.assertTrue(page.locator('#save-restore').is_hidden())
        self.assertEqual(page.evaluate('meta.coins'), 0)
