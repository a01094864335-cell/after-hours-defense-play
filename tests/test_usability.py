"""Behavioral layout checks for the usability review's observed regressions."""
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from threading import Thread
import unittest
from playwright.sync_api import sync_playwright

class QuietHandler(SimpleHTTPRequestHandler):
    def log_message(self,*args):
        pass

class UsabilityTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.server=ThreadingHTTPServer(('127.0.0.1',0),partial(QuietHandler,directory=str(Path(__file__).resolve().parents[1])))
        Thread(target=cls.server.serve_forever,daemon=True).start()
        cls.pw=sync_playwright().start()
        cls.browser=cls.pw.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox'])
    @classmethod
    def tearDownClass(cls):
        cls.browser.close();cls.pw.stop();cls.server.shutdown();cls.server.server_close()
    def open(self,w,h):
        context=self.browser.new_context(viewport={'width':w,'height':h});self.addCleanup(context.close)
        page=context.new_page();page.goto(f'http://127.0.0.1:{self.server.server_port}/',wait_until='networkidle');page.wait_for_function('GameSession.canWrite()')
        return page
    def inside(self,page,selector):
        b=page.locator(selector).bounding_box();self.assertIsNotNone(b,selector)
        self.assertGreaterEqual(b['y'],0,selector);self.assertLessEqual(b['y']+b['height'],page.viewport_size['height']+1,selector)
        self.assertGreaterEqual(b['x'],0,selector);self.assertLessEqual(b['x']+b['width'],page.viewport_size['width']+1,selector)
    def test_scrolled_shop_result_is_visible_focus_trapped_and_dismissible(self):
        for w,h in [(320,568),(360,640),(390,844)]:
            a=self.open(w,h);a.evaluate('saveChange(d=>d.coins=120);renderMeta()');a.locator('#shop-open').click();a.locator('#buy-staff-pack').click()
            a.wait_for_selector('#recruit-dialog[open] .ref-recruit-actions');self.inside(a,'#recruit-dialog');self.inside(a,'.ref-recruit-actions button:last-child')
            self.assertTrue(a.evaluate("document.querySelector('#recruit-dialog').contains(document.activeElement)"))
            for _ in range(6):a.keyboard.press('Tab');self.assertTrue(a.evaluate("document.querySelector('#recruit-dialog').contains(document.activeElement)"))
            a.keyboard.press('Escape');self.assertEqual(a.locator('#recruit-dialog[open]').count(),0);self.assertEqual(a.locator('#shop[open]').count(),1)
            a.evaluate("revealRecruit(RECRUIT_STAFF[0],true)");a.wait_for_selector('.ref-recruit-actions');self.inside(a,'.ref-recruit-actions button:last-child');a.locator('.ref-recruit-actions button:last-child').click()
            self.assertEqual(a.locator('#recruit-dialog[open]').count(),0);a.context.close()
    def test_sp_four_digits_stay_on_one_line(self):
        for w,h in [(320,568),(390,844),(1280,900)]:
            a=self.open(w,h);a.locator('#enter-battle').click();a.locator('#promo-skip').click();a.evaluate('sp=9999;sync()')
            size=a.locator('#sp').evaluate('(e)=>({w:e.scrollWidth,c:e.clientWidth,h:e.getBoundingClientRect().height,line:parseFloat(getComputedStyle(e).lineHeight)})')
            self.assertLessEqual(size['h'],size['line']+1);self.inside(a,'#summon');self.inside(a,'#upgrade-open');a.context.close()
    def test_short_roster_shows_three_complete_cards(self):
        a=self.open(320,568);a.locator('#roster-open').click()
        count=a.locator('#roster-list').evaluate('(e)=>{const r=e.getBoundingClientRect();return [...e.children].filter(c=>{const b=c.getBoundingClientRect();return b.top>=r.top&&b.bottom<=r.bottom}).length}')
        self.assertGreaterEqual(count,3)
    def test_equipment_context_and_training_context_survive_scrolling(self):
        a=self.open(320,568);a.locator('#enter-battle').click();a.locator('#promo-skip').click();a.locator('#upgrade-open').click()
        before=a.locator('#equipment-close').bounding_box();a.locator('.equipment-content').evaluate('e=>e.scrollTop=e.scrollHeight')
        self.assertEqual(before,a.locator('#equipment-close').bounding_box());self.inside(a,'#equipment-close');self.inside(a,'#equipment-balance');a.locator('#equipment-close').click()
        a.evaluate("document.querySelector('#training-entry').click()");a.locator('.training-body').evaluate('e=>e.scrollTop=e.scrollHeight')
        for selector in ['#training-context','#training-tab-merc','#training-upgrade','#training-close']:self.inside(a,selector)
        self.assertIn('Lv.',a.locator('#training-context').inner_text())
    def test_short_report_primary_action_is_visible(self):
        a=self.open(320,568);a.evaluate('wave=10;tutorialMode=true;tutorialWon=true;ended=true;settleRun();sync()')
        self.inside(a,'#result-again');self.inside(a,'#result-title');self.inside(a,'#result-stats');a.locator('#result-again').click()
        self.assertEqual(a.locator('#result:not([hidden])').count(),0)
    def test_boss_readout_uses_legible_screen_text(self):
        a=self.open(320,568);a.locator('#enter-battle').click();a.locator('#promo-skip').click();a.evaluate("wave=5;bossPlans[5]='ruby';spawn('boss');sync();drawBossHUD()")
        self.inside(a,'#boss-readout');self.assertGreaterEqual(a.locator('#boss-readout strong').evaluate('e=>parseFloat(getComputedStyle(e).fontSize)'),14)
        a.locator('#boss-readout summary').click();self.assertIn('대응:',a.locator('#boss-readout p').inner_text())
