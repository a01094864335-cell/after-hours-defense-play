"""Android touch loading and feature-restricted browser regressions."""
import unittest
import test_usability as ui

class AndroidCompatibilityTests(unittest.TestCase):
    setUpClass=classmethod(ui.UsabilityTests.setUpClass.__func__)
    tearDownClass=classmethod(ui.UsabilityTests.tearDownClass.__func__)
    def open_android(self,legacy=False):
        context=self.browser.new_context(**self.pw.devices['Pixel 5']);self.addCleanup(context.close)
        page=context.new_page();errors=[];page.on('pageerror',lambda error:errors.append(str(error)))
        if legacy:
            page.add_init_script('MediaQueryList.prototype.addEventListener=undefined')
            def unsupported_dvh(route):
                response=route.fetch();route.fulfill(response=response,body=response.text().replace('dvh','unsupportedvh'))
            page.route('**/*.css*',unsupported_dvh)
        page.goto(f'http://127.0.0.1:{self.server.server_port}/',wait_until='networkidle')
        page.wait_for_function('GameSession.canWrite()');page.wait_for_timeout(200)
        self.assertFalse(errors,errors)
        return page,errors
    def test_android_touch_lobby_and_battle_open(self):
        page,errors=self.open_android()
        shell=page.locator('#app-shell').bounding_box();self.assertGreater(shell['width'],300);self.assertGreater(shell['height'],500)
        self.assertEqual(page.evaluate('GamePerformance.fps'),30)
        page.locator('#enter-battle').tap();page.locator('#promo-skip').tap()
        self.assertTrue(page.locator('#battle').is_visible());page.locator('#summon').tap()
        self.assertEqual(page.evaluate('board.filter(Boolean).length'),1)
        self.assertFalse(errors,errors)
    def test_old_viewport_units_and_media_listeners_still_start(self):
        page,errors=self.open_android(legacy=True)
        shell=page.locator('#app-shell').bounding_box();self.assertGreater(shell['width'],300);self.assertGreater(shell['height'],500)
        page.locator('#enter-battle').tap();page.locator('#promo-skip').tap();page.locator('#summon').tap()
        self.assertEqual(page.evaluate('board.filter(Boolean).length'),1)
        page.set_viewport_size({'width':851,'height':393});page.wait_for_timeout(200)
        self.assertTrue(page.locator('#rotation-notice').is_visible())
        page.set_viewport_size({'width':393,'height':851});page.wait_for_timeout(200)
        self.assertFalse(page.locator('#rotation-notice').is_visible())
        self.assertFalse(errors,errors)
