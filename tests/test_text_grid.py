"""Art-safe padding and English copy candidates keep live controls accessible."""
import json
from pathlib import Path
import unittest
import test_usability as ui

ROOT=Path(__file__).resolve().parents[1]
FIXTURE=(ROOT/'scripts/text-grid/english-fixture.cjs').read_text().split('module.exports=',1)[1].rsplit(';',1)[0]
EXTRA=json.loads((ROOT/'scripts/text-grid/english-extra.json').read_text())

class TextGridTests(unittest.TestCase):
    setUpClass=classmethod(ui.UsabilityTests.setUpClass.__func__)
    tearDownClass=classmethod(ui.UsabilityTests.tearDownClass.__func__)
    open=ui.UsabilityTests.open

    def test_english_roster_title_does_not_cover_close(self):
        for w,h in [(320,568),(390,844)]:
            p=self.open(w,h)
            p.evaluate("meta.tutorialComplete=true;restartTo('lobby');renderMeta()")
            p.locator('#asset-lobby-host [data-proxy="#roster-open"]').click()
            p.evaluate('('+FIXTURE+')',{'mode':'en','extra':EXTRA})
            title=p.locator('#asset-roster-host .shared-title').bounding_box()
            close=p.locator('#asset-roster-host .r-close').bounding_box()
            self.assertLessEqual(title['x']+title['width'],close['x']-4)
            p.locator('#asset-roster-host .r-close').click()
            self.assertFalse(p.locator('#roster').evaluate('e=>e.open'))
            p.context.close()

    def test_short_training_shows_power_comparison_above_purchase_dock(self):
        p=self.open(320,568)
        p.evaluate("meta.tutorialComplete=true;restartTo('lobby');renderMeta()")
        p.locator('#asset-lobby-host [data-proxy="#training-entry"]').click()
        power=p.locator('#asset-training-host .power').bounding_box()
        dock=p.locator('#asset-training-host .upgrade-bar').bounding_box()
        self.assertLessEqual(power['y']+power['height'],dock['y']+1)
        self.assertEqual(p.locator('#asset-training-host #hint:visible').count(),0)

    def test_shop_wordless_art_and_dom_title_reach_real_purchase(self):
        p=self.open(320,568)
        p.evaluate("saveChange(d=>{d.coins=400;d.tutorialComplete=true});renderMeta()")
        p.locator('#asset-lobby-host [data-proxy="#shop-open"]').click()
        art=p.locator('#asset-shop-host .grid-shop-hero')
        # Off-screen art is intentionally requested on entry, not at boot.
        p.wait_for_function("()=>{const image=document.querySelector('#asset-shop-host').shadowRoot.querySelector('.grid-shop-hero');return image.complete&&image.naturalWidth>0}")
        self.assertTrue(art.evaluate('e=>e.complete&&e.naturalWidth>0'))
        p.evaluate('('+FIXTURE+')',{'mode':'en','extra':EXTRA})
        self.assertEqual(p.locator('#asset-shop-host .grid-shop-title').inner_text(),'Recruit Pack')
        p.locator('#asset-shop-host .scroll').evaluate('e=>e.scrollTop=e.scrollHeight')
        purchase=p.locator('#asset-shop-host .purchase')
        self.assertTrue(purchase.is_visible())
        self.assertTrue(purchase.is_enabled())
        purchase.click()
        self.assertTrue(p.locator('#recruit-dialog').evaluate('e=>e.open'))

    def test_large_lobby_wallet_keeps_exact_amount_accessible(self):
        p=self.open(320,568)
        p.evaluate("meta.coins=99999999;renderMeta()")
        wallet=p.locator('#asset-lobby-host #a-coins')
        self.assertEqual(wallet.inner_text(),'1억')
        self.assertEqual(wallet.get_attribute('aria-label'),'99,999,999')
        self.assertEqual(p.evaluate('meta.coins'),99999999)
        p.evaluate('('+FIXTURE+')',{'mode':'en','extra':EXTRA})
        self.assertEqual(wallet.inner_text(),'100M')

    def test_long_story_copy_scrolls_without_covering_page_controls(self):
        p=self.open(320,568)
        p.evaluate("meta.tutorialComplete=true;restartTo('lobby');document.querySelector('#enter-battle').click()")
        p.evaluate("document.querySelector('#promo-line').textContent='A long English story sentence with extra detail. '.repeat(10);document.querySelector('#promo-aside').textContent='A second character replies with another long sentence. '.repeat(4)")
        body=p.locator('#promo .comic-copy')
        nav=p.locator('#promo .comic-nav')
        b=body.bounding_box();n=nav.bounding_box()
        self.assertLessEqual(b['y']+b['height']+6,n['y'])
        self.assertEqual(body.evaluate("e=>getComputedStyle(e).overflowY"),'auto')
        self.assertGreater(body.evaluate('e=>e.scrollHeight'),body.evaluate('e=>e.clientHeight'))
        before=p.locator('#promo-count').inner_text()
        p.locator('#promo-next').click()
        self.assertNotEqual(p.locator('#promo-count').inner_text(),before)
