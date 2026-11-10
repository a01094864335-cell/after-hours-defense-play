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
                    self.assertTrue(button.locator('img').get_attribute('src').endswith('/open-scene/icons/close.svg'))
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
