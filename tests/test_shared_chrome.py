"""Common navigation retains real cross-page actions and usable touch geometry."""
import os
from pathlib import Path
import unittest
import test_usability as ui

class SharedChromeTests(unittest.TestCase):
    setUpClass = classmethod(ui.UsabilityTests.setUpClass.__func__)
    tearDownClass = classmethod(ui.UsabilityTests.tearDownClass.__func__)
    open = ui.UsabilityTests.open

    def test_shared_navigation_and_close_across_mobile_sizes(self):
        for width, height in [(320,568),(390,684),(390,844),(430,932)]:
            page = self.open(width,height)
            errors=[]
            page.on('pageerror',lambda error: errors.append(str(error)))
            page.evaluate("meta.tutorialComplete=true;restartTo('lobby');renderMeta()")
            for host, entry, close in [
                ('asset-lobby-host',None,None),
                ('asset-roster-host','[data-proxy="#roster-open"]','.r-close'),
                ('asset-shop-host','[data-proxy="#shop-open"]','.close'),
                ('asset-training-host','[data-proxy="#training-entry"]','.close'),
            ]:
                if entry: page.locator('#asset-lobby-host '+entry).click()
                dock=page.locator('#'+host+' .shared-gnb')
                self.assertTrue(dock.is_visible())
                boxes=dock.locator('button').evaluate_all('(xs)=>xs.map(x=>{const r=x.getBoundingClientRect();return {x:r.x,y:r.y,w:r.width,h:r.height}})')
                self.assertEqual(len(boxes),3)
                for b in boxes:
                    self.assertGreaterEqual(b['w'],44)
                    self.assertGreaterEqual(b['h'],44)
                    self.assertLessEqual(b['y']+b['h'],height+1)
                icons=dock.locator('button img').evaluate_all('(xs)=>xs.map(x=>{const r=x.getBoundingClientRect();return {w:r.width,h:r.height,ok:x.complete&&x.naturalWidth>0}})')
                self.assertTrue(all(i['ok'] and abs(i['w']-i['h'])<.1 for i in icons))
                self.assertEqual(dock.locator('[aria-current="page"]').count(),1)
                if close:
                    button=page.locator('#'+host+' '+close)
                    b=button.bounding_box()
                    self.assertEqual(round(b['width']),44)
                    self.assertEqual(round(b['height']),44)
                    self.assertTrue(button.locator('img').get_attribute('src').endswith('/shared-chrome/close.svg'))
                out=os.getenv('CHROME_QA_DIR')
                if out:
                    Path(out).mkdir(parents=True,exist_ok=True)
                    page.screenshot(path=str(Path(out)/f'{width}x{height}-{host}.png'))
                if close: button.click()
            # Travel with the real footer handlers rather than directly opening dialogs.
            page.locator('#asset-lobby-host .shared-gnb button').nth(0).click()
            page.locator('#asset-roster-host .shared-gnb button').nth(2).click()
            self.assertTrue(page.locator('#shop').evaluate('x=>x.open'))
            page.locator('#asset-shop-host .shared-gnb button').nth(1).click()
            self.assertFalse(page.locator('#shop').evaluate('x=>x.open'))
            page.locator('#asset-lobby-host .a-settings').click()
            page.locator('#menu-close').click()
            self.assertFalse(page.locator('#menu').evaluate('x=>x.open'))
            self.assertEqual(errors,[])
            page.context.close()

    def test_paper_settings_keeps_live_sliders_and_pinned_confirmation(self):
        for width,height in [(320,568),(390,684),(390,844),(430,932)]:
            page=self.open(width,height)
            page.evaluate("meta.tutorialComplete=true;restartTo('lobby');renderMeta()")
            for attempt in range(2):
                page.locator('#asset-lobby-host .a-settings').click()
                page.wait_for_selector('#menu[open] #shared-menu-confirm')
                self.assertEqual(page.locator('#shared-menu-confirm').count(),1)
                self.assertEqual(page.locator('#menu-close').count(),1)
                for selector in ['#menu .ui-dialog-header','#menu-close','#shared-menu-confirm']:
                    b=page.locator(selector).bounding_box()
                    self.assertIsNotNone(b)
                    self.assertGreaterEqual(b['y'],0)
                    self.assertLessEqual(b['y']+b['height'],height+1)
                page.locator('#sfx-volume').focus()
                page.locator('#sfx-volume').evaluate("e=>{e.value='27';e.dispatchEvent(new Event('input',{bubbles:true}))}")
                self.assertIn('27',page.locator('#sfx-value').inner_text())
                page.locator('#bgm-volume').evaluate("e=>{e.value='42';e.dispatchEvent(new Event('input',{bubbles:true}))}")
                self.assertIn('42',page.locator('#bgm-value').inner_text())
                page.locator('#menu .panel-scroll-body').evaluate('e=>e.scrollTop=e.scrollHeight')
                self.assertTrue(page.locator('#shared-menu-confirm').is_visible())
                self.assertTrue(page.locator('#menu').evaluate('e=>e.contains(document.activeElement)'))
                out=os.getenv('CHROME_QA_DIR')
                if out:
                    Path(out).mkdir(parents=True,exist_ok=True)
                    page.screenshot(path=str(Path(out)/f'{width}x{height}-settings-{attempt}.png'))
                page.locator('#shared-menu-confirm').click()
                self.assertFalse(page.locator('#menu').evaluate('e=>e.open'))
            page.locator('#asset-lobby-host .a-settings').click()
            page.keyboard.press('Escape')
            self.assertFalse(page.locator('#menu').evaluate('e=>e.open'))
            # The acknowledgement remains a labeled primary action, not an X icon.
            page.evaluate("document.querySelector('#info').showModal()")
            self.assertEqual(page.locator('#info-close').inner_text(),'알겠어요')
            page.locator('#info-close').click()
            self.assertFalse(page.locator('#info').evaluate('e=>e.open'))
            page.context.close()

    def test_record_backup_and_recruitment_title_chrome(self):
        for width,height in [(320,568),(390,684),(390,844),(430,932)]:
            page=self.open(width,height)
            page.evaluate("meta.tutorialComplete=true;restartTo('lobby');renderMeta()")
            for dialog,entry,close in [
                ('journey-dialog','journey-summary','journey-close'),
                ('save-transfer-dialog','save-transfer-open','save-transfer-close'),
            ]:
                page.evaluate("id=>document.getElementById(id).click()",entry)
                panel=page.locator('#'+dialog)
                self.assertTrue(panel.evaluate('e=>e.open'))
                header=panel.locator(':scope > header.shared-modal-header')
                self.assertEqual(header.count(),1)
                self.assertIn('/shared-chrome/plaque.svg',header.locator('h2').evaluate('e=>getComputedStyle(e).backgroundImage'))
                button=page.locator('#'+close)
                self.assertTrue(button.locator('img').get_attribute('src').endswith('/shared-chrome/close.svg'))
                for control in [header,button]:
                    b=control.bounding_box()
                    self.assertGreaterEqual(b['y'],0)
                    self.assertLessEqual(b['y']+b['height'],height+1)
                before=button.bounding_box()
                panel.locator('.panel-scroll-body').evaluate('e=>e.scrollTop=e.scrollHeight')
                self.assertEqual(before,button.bounding_box())
                button.click()
                self.assertFalse(panel.evaluate('e=>e.open'))
            page.evaluate("revealRecruit(RECRUIT_STAFF[0],true)")
            title=page.locator('#recruit-result .shared-recruit-title')
            title.wait_for(state='visible')
            self.assertEqual(title.inner_text(),'다시 만난 동료')
            self.assertEqual(title.get_attribute('role'),'heading')
            self.assertIn('/shared-chrome/plaque.svg',title.evaluate('e=>getComputedStyle(e).backgroundImage'))
            page.locator('#recruit-dialog .ref-recruit-actions button').last.click()
            self.assertFalse(page.locator('#recruit-dialog').evaluate('e=>e.open'))
            page.context.close()
