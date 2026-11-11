"""Hidden UI illustrations load on entry; retired footer bitmaps never load."""
import unittest
import test_usability as ui
class LoadingBudgetTests(unittest.TestCase):
    setUpClass=classmethod(ui.UsabilityTests.setUpClass.__func__)
    tearDownClass=classmethod(ui.UsabilityTests.tearDownClass.__func__)
    open=ui.UsabilityTests.open
    def test_hidden_art_waits_for_entry_and_uses_live_navigation(self):
        p=self.open(390,844)
        urls=p.evaluate("performance.getEntriesByType('resource').map(r=>r.name)")
        image_bytes=p.evaluate("performance.getEntriesByType('resource').filter(r=>/\\.(webp|png|svg)$/.test(new URL(r.name).pathname)).reduce((a,r)=>a+r.decodedBodySize,0)")
        self.assertGreater(image_bytes,1000000)
        self.assertLess(image_bytes,4200000)
        for name in ['roster-reference.webp','training-reference.webp','shop-reference.webp','gnb-lobby.webp','gnb-roster.webp','gnb-shop.webp']:
            self.assertFalse(any(name in url for url in urls),name)
        p.evaluate("meta.tutorialComplete=true;restartTo('lobby');renderMeta()")
        for proxy,host,name,close in [('#roster-open','asset-roster-host','roster-reference.webp','.r-close'),('#shop-open','asset-shop-host','shop-reference.webp','.close'),('#training-entry','asset-training-host','training-reference.webp','.back')]:
            p.locator('#asset-lobby-host [data-proxy="'+proxy+'"]').click()
            p.wait_for_function('(name)=>performance.getEntriesByType("resource").some(r=>r.name.includes(name))',arg=name)
            self.assertEqual(p.locator('#'+host+' image[data-art-src]').count(),0)
            self.assertEqual(p.locator('#'+host+' .shared-gnb button').count(),3)
            p.locator('#'+host+' '+close).click()
