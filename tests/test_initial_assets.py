"""Cold lobby must not download retired art or closed-panel portraits; detail art stays full-size."""
import unittest
import test_usability as ui
from browser_helpers import enter_preparation
class InitialAssetTests(unittest.TestCase):
    setUpClass=classmethod(ui.UsabilityTests.setUpClass.__func__)
    tearDownClass=classmethod(ui.UsabilityTests.tearDownClass.__func__)
    open=ui.UsabilityTests.open
    def test_cold_lobby_has_bounded_image_payload(self):
        p=self.open(390,844);p.wait_for_timeout(800)
        resources=p.evaluate("performance.getEntriesByType('resource').map(r=>({path:new URL(r.name).pathname,bytes:r.decodedBodySize}))")
        paths=[r['path'] for r in resources]
        for retired in ['/assets/mobile/lobby-gobi.webp','/assets/ui-approved/lobby-background.webp','/previews/asset-lobby-20261109/assets/background.webp','/previews/asset-lobby-20261109/assets/button-primary.webp','/assets/character-portraits/kkangtong-engineer.webp']:
            self.assertNotIn(retired,paths)
        image_bytes=sum(r['bytes'] for r in resources if r['path'].endswith(('.webp','.png','.svg')))
        self.assertLess(image_bytes,850000)
    def test_lobby_thumbnail_does_not_downgrade_full_size_cutin(self):
        p=self.open(390,844);face=p.locator('#asset-lobby-host .a-member img').first
        p.wait_for_function("document.querySelector('#asset-lobby-host').shadowRoot.querySelector('.a-member img').complete")
        self.assertIn('/thumbs/',face.evaluate('e=>e.currentSrc'))
        size=p.evaluate("async()=>{const i=CharacterPortraits.preload('goblin-guard');await i.decode();return i.naturalWidth}")
        self.assertEqual(size,512)
        self.assertIn('/thumbs/',face.evaluate('e=>e.currentSrc'))
    def test_deferred_equipment_portrait_loads_when_opened(self):
        p=self.open(320,568);p.evaluate('saveChange(d=>d.tutorialComplete=true);restartTo("lobby")')
        enter_preparation(p)
        for _ in range(5):p.locator('#summon').click()
        p.locator('#upgrade-open').click();face=p.locator('#up0 img').first
        face.wait_for(state='visible');p.wait_for_function("document.querySelector('#up0 img').complete&&document.querySelector('#up0 img').naturalWidth>0")
        self.assertEqual(face.evaluate('e=>e.naturalWidth'),512)
