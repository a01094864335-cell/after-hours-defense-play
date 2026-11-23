"""Paid packs reveal once, behind a skippable finite opening effect."""
import unittest
from pathlib import Path
import os
import test_usability as ui
class RecruitOpeningTests(unittest.TestCase):
    setUpClass=classmethod(ui.UsabilityTests.setUpClass.__func__)
    tearDownClass=classmethod(ui.UsabilityTests.tearDownClass.__func__)
    open=ui.UsabilityTests.open
    def test_opening_saves_once_then_reveals_and_supports_skip(self):
        for w,h in [(320,568),(390,844)]:
            p=self.open(w,h)
            p.evaluate('saveChange(d=>{d.coins=240;d.tutorialComplete=true});renderMeta();Math.random=()=>0')
            p.locator('#asset-lobby-host [data-proxy="#shop-open"]').click()
            out=os.getenv('RECRUIT_OPENING_QA_DIR')
            if out:
                p.wait_for_function("(()=>{const i=document.querySelector('#asset-shop-host').shadowRoot.querySelector('.moon-counter');return i.complete&&i.naturalWidth>0})()")
                p.wait_for_timeout(350)
                Path(out).mkdir(parents=True,exist_ok=True);p.screenshot(path=str(Path(out)/f'shop-{w}.png'))
            p.locator('#asset-shop-host .purchase').click()
            self.assertTrue(p.locator('.recruit-opening').is_visible())
            self.assertEqual(p.evaluate('meta.coins'),120)
            p.evaluate("document.querySelector('#buy-staff-pack').click();document.querySelector('#buy-staff-pack').click()")
            self.assertEqual(p.evaluate('meta.coins'),120)
            if out:p.screenshot(path=str(Path(out)/f'opening-{w}.png'))
            p.locator('.recruit-opening').wait_for(state='detached')
            self.assertTrue(p.locator('#recruit-dialog[open]').is_visible())
            p.evaluate('HiringStories.close();closeRecruit();saveChange(d=>{d.profile.pity=9;d.owned=[]});renderMeta()')
            p.locator('#asset-shop-host .purchase').click()
            self.assertEqual(p.evaluate('meta.coins'),0)
            self.assertTrue(p.locator('.recruit-opening').is_visible())
            p.locator('.recruit-opening button').click()
            self.assertEqual(p.locator('.recruit-opening').count(),0)
            self.assertTrue(p.locator('#hiring-story[open],#recruit-dialog[open]').count()>0)
            p.context.close()
    def test_reduced_motion_and_insufficient_funds(self):
        p=self.open(390,844);p.emulate_media(reduced_motion='reduce')
        p.evaluate('saveChange(d=>{d.coins=120;d.tutorialComplete=true});renderMeta()')
        p.locator('#asset-lobby-host [data-proxy="#shop-open"]').click()
        p.locator('#asset-shop-host .purchase').click()
        p.locator('.recruit-opening').wait_for(state='detached',timeout=1000)
        p.evaluate("HiringStories.close();closeRecruit();document.querySelector('#buy-staff-pack').click()")
        self.assertEqual(p.evaluate('meta.coins'),0)
        self.assertEqual(p.locator('.recruit-opening').count(),0)
