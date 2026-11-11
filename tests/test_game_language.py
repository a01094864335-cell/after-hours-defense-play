"""Language controls persist, preserve game data, and fit real settings/lobby UI."""
import unittest
import test_usability as ui
class GameLanguageTests(unittest.TestCase):
    setUpClass=classmethod(ui.UsabilityTests.setUpClass.__func__)
    tearDownClass=classmethod(ui.UsabilityTests.tearDownClass.__func__)
    open=ui.UsabilityTests.open
    def settings(self,p):p.locator('#asset-lobby-host .a-settings').click()
    def test_switch_reload_and_korean_restore_keep_game_saves(self):
        p=self.open(390,844);errors=[];p.on('pageerror',lambda e:errors.append(str(e)))
        self.settings(p);before=p.evaluate('({wallet:GameStorage.getItem(META_KEY),run:GameStorage.getItem(RUN_SAVE)})')
        p.locator('#language-en').click();self.assertEqual(p.locator('html').get_attribute('lang'),'en')
        self.assertEqual(p.locator('#language-en').get_attribute('aria-pressed'),'true');self.assertEqual(p.locator('#shared-menu-confirm').inner_text(),'Done')
        p.locator('#shared-menu-confirm').click();self.assertEqual(p.locator('#asset-lobby-host .a-start').inner_text(),'Prepare shift')
        self.assertEqual(p.locator('#asset-lobby-host .a-shortcuts span').all_inner_texts()[:2],['Story','Train'])
        p.evaluate('renderMeta();renderProgress();AssetLobby.refresh()');self.assertEqual(p.locator('#asset-lobby-host .a-start').inner_text(),'Prepare shift')
        self.assertEqual(p.evaluate('({wallet:GameStorage.getItem(META_KEY),run:GameStorage.getItem(RUN_SAVE)})'),before)
        p.reload(wait_until='networkidle');p.wait_for_function('GameSession.canWrite()');self.assertEqual(p.locator('html').get_attribute('lang'),'en')
        self.assertEqual(p.locator('#asset-lobby-host .shared-gnb button').count(),3)
        self.assertEqual(p.locator('#asset-lobby-host .shared-gnb').get_attribute('aria-label'),'Main navigation')
        self.settings(p);p.locator('#language-ko').click();self.assertEqual(p.locator('#shared-menu-confirm').inner_text(),'확인')
        p.locator('#shared-menu-confirm').click();self.assertEqual(p.locator('#asset-lobby-host .a-start').inner_text(),'당직 준비');self.assertEqual(errors,[])
        self.assertEqual(p.locator('#asset-lobby-host .a-shortcuts span').all_inner_texts()[:2],['이야기','훈련소'])
    def test_controls_and_english_text_fit_short_phone_and_audio_state_stays_native(self):
        for width,height in [(320,568),(390,844)]:
            p=self.open(width,height);self.settings(p)
            for lang in ['en','ko','en']:
                p.locator('#language-'+lang).click()
                for selector in ['#language-ko','#language-en']:
                    ui.assert_reachable(self,p,selector);b=p.locator(selector).bounding_box();self.assertGreaterEqual(b['height'],44);self.assertLessEqual(b['x']+b['width'],width)
            toggle=p.locator('#sfx-toggle');toggle.scroll_into_view_if_needed();before=toggle.get_attribute('aria-pressed');toggle.click();self.assertNotEqual(toggle.get_attribute('aria-pressed'),before);self.assertIn(toggle.inner_text(),['Enable effects','Mute effects'])
            ui.assert_reachable(self,p,'#shared-menu-confirm');p.locator('#shared-menu-confirm').click()
            for selector in ['.a-start','.a-daily','.a-mode','.a-profile > span']:
                self.assertTrue(p.locator('#asset-lobby-host '+selector).evaluate('e=>e.scrollWidth<=e.clientWidth+1'),selector)
            p.context.close()
    def test_storage_failure_and_switch_during_paused_battle_preserve_state(self):
        p=self.open(390,844);self.settings(p)
        p.evaluate("()=>{window.savedSet=Storage.prototype.setItem;Storage.prototype.setItem=function(k,v){if(k===GameLanguage.key)throw Error('blocked');return savedSet.call(this,k,v)}}")
        p.locator('#language-en').click();self.assertEqual(p.locator('html').get_attribute('lang'),'ko');self.assertTrue(p.locator('#language-status').is_visible())
        p.evaluate('()=>{Storage.prototype.setItem=savedSet}');p.locator('#shared-menu-confirm').click()
        p.evaluate("meta.tutorialComplete=true;reset();setScreen('battle');playing=true;paused=true;wave=3;board[0]={type:0,pip:5,cool:1,skillCD:7};sync()")
        before=p.evaluate('JSON.stringify(runSnapshot())');self.assertTrue(p.evaluate("GameLanguage.set('en')"));self.assertEqual(p.evaluate('JSON.stringify(runSnapshot())'),before)
