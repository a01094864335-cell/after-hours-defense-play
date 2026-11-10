"""Behavioral layout checks for the usability review's observed regressions."""
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from threading import Thread
import unittest
from browser_helpers import chromium_options, game_root, enter_preparation, start_battle
from playwright.sync_api import sync_playwright

def assert_reachable(test, page, selector):
    """Scroll the actual rendered surface, then reject viewport/ancestor clipping."""
    target = page.locator(selector)
    target.scroll_into_view_if_needed()
    bounds = target.evaluate("""e=>{
      const r=e.getBoundingClientRect();let left=0,top=0,right=innerWidth,bottom=innerHeight;
      for(let p=e.parentElement||e.getRootNode().host;p;p=p.parentElement||p.getRootNode().host){
        const s=getComputedStyle(p),b=p.getBoundingClientRect();
        if(s.display==='contents')continue;
        if(/auto|scroll|hidden|clip/.test(s.overflowX)){left=Math.max(left,b.left+p.clientLeft);right=Math.min(right,b.left+p.clientLeft+p.clientWidth)}
        if(/auto|scroll|hidden|clip/.test(s.overflowY)){top=Math.max(top,b.top+p.clientTop);bottom=Math.min(bottom,b.top+p.clientTop+p.clientHeight)}
      }
      return {x:r.x,y:r.y,right:r.right,bottom:r.bottom,left,top,clipRight:right,clipBottom:bottom};
    }""")
    test.assertGreaterEqual(bounds['x'], bounds['left']-1, selector)
    test.assertGreaterEqual(bounds['y'], bounds['top']-1, selector)
    test.assertLessEqual(bounds['right'], bounds['clipRight']+1, selector)
    test.assertLessEqual(bounds['bottom'], bounds['clipBottom']+1, selector)
    target.click(trial=True)


class QuietHandler(SimpleHTTPRequestHandler):
    def log_message(self,*args):
        pass

class UsabilityTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.server=ThreadingHTTPServer(('127.0.0.1',0),partial(QuietHandler,directory=game_root()))
        Thread(target=cls.server.serve_forever,daemon=True).start()
        cls.pw=sync_playwright().start()
        cls.browser=cls.pw.chromium.launch(**chromium_options())
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
            a=self.open(w,h);a.evaluate('saveChange(d=>d.coins=120);renderMeta()');a.locator('#asset-lobby-host [data-proxy="#shop-open"]').click();a.locator('#asset-shop-host .purchase').click()
            if a.locator('#hiring-story[open]').count():
                self.assertTrue(a.locator('#hiring-story').evaluate('e=>e.contains(document.activeElement)'))
                a.locator('[data-hire-close]').click()
            a.wait_for_selector('#recruit-dialog[open] .ref-recruit-actions');self.inside(a,'#recruit-dialog');assert_reachable(self,a,'.ref-recruit-actions button:last-child')
            self.assertTrue(a.evaluate("document.querySelector('#recruit-dialog').contains(document.activeElement)"))
            for _ in range(6):a.keyboard.press('Tab');self.assertTrue(a.evaluate("document.querySelector('#recruit-dialog').contains(document.activeElement)"))
            a.keyboard.press('Escape');self.assertEqual(a.locator('#recruit-dialog[open]').count(),0);self.assertEqual(a.locator('#shop[open]').count(),1)
            a.evaluate("revealRecruit(RECRUIT_STAFF[0],true)");a.wait_for_selector('.ref-recruit-actions');assert_reachable(self,a,'.ref-recruit-actions button:last-child');a.locator('.ref-recruit-actions button:last-child').click()
            self.assertEqual(a.locator('#recruit-dialog[open]').count(),0);a.context.close()
    def test_sp_four_digits_stay_on_one_line(self):
        for w,h in [(320,568),(390,844),(1280,900)]:
            a=self.open(w,h);enter_preparation(a);a.evaluate('sp=9999;sync()')
            size=a.locator('#sp').evaluate('(e)=>({w:e.scrollWidth,c:e.clientWidth,h:e.getBoundingClientRect().height,line:parseFloat(getComputedStyle(e).lineHeight)})')
            self.assertLessEqual(size['h'],size['line']+1);self.inside(a,'#summon');self.inside(a,'#upgrade-open');a.context.close()
    def test_short_roster_shows_three_complete_cards(self):
        a=self.open(320,568);a.locator('#asset-lobby-host [data-proxy="#roster-open"]').click()
        count=a.locator('#asset-roster-host .r-scroll').evaluate('(e)=>{const r=e.getBoundingClientRect();return [...e.querySelectorAll(".r-card")].filter(c=>{const b=c.getBoundingClientRect();return b.top>=r.top&&b.bottom<=r.bottom}).length}')
        self.assertGreaterEqual(count,3)
    def test_equipment_and_live_training_controls_survive_scrolling(self):
        a=self.open(320,568);enter_preparation(a);a.locator('#upgrade-open').click()
        before=a.locator('#equipment-close').bounding_box();a.locator('.equipment-content').evaluate('e=>e.scrollTop=e.scrollHeight')
        self.assertEqual(before,a.locator('#equipment-close').bounding_box());self.inside(a,'#equipment-close');self.inside(a,'#equipment-balance');a.locator('#equipment-close').click()
        a.locator('#battle-back').click()
        a.locator('#asset-lobby-host [data-proxy="#training-entry"]').click()
        host='#asset-training-host '
        fixed=[host+'header',host+'[data-group="merc"]',host+'#upgrade',host+'.close']
        before={selector:a.locator(selector).bounding_box() for selector in fixed}
        a.locator(host+'.scroll').evaluate('e=>e.scrollTop=e.scrollHeight')
        for selector in fixed:
            self.inside(a,selector)
            self.assertEqual(before[selector],a.locator(selector).bounding_box())
        a.locator(host+'#level').scroll_into_view_if_needed()
        self.assertIn('Lv.',a.locator(host+'#level').inner_text())
        a.locator(host+'.close').click()
        self.assertFalse(a.locator('#training-dialog').evaluate('d=>d.open'))
    def test_short_report_primary_action_is_scroll_reachable(self):
        a=self.open(320,568);a.evaluate('wave=10;tutorialMode=true;tutorialWon=true;ended=true;settleRun();sync()')
        self.inside(a,'#result-title');a.locator('#result-stats').scroll_into_view_if_needed();self.assertTrue(a.locator('#result-stats').is_visible());assert_reachable(self,a,'#result-again');a.locator('#result-again').click()
        self.assertEqual(a.locator('#result:not([hidden])').count(),0)
    def test_boss_canvas_hud_and_help_show_current_identity(self):
        a=self.open(320,568);enter_preparation(a)
        labels=a.evaluate("""()=>{
          wave=5;bossPlans[5]='ruby';spawn('boss');sync();
          const labels=[],original=ctx.fillText;
          try{ctx.fillText=function(text,...args){labels.push(text);return original.call(this,text,...args)};drawBossHUD()}
          finally{ctx.fillText=original}
          return labels;
        }""")
        self.assertTrue(any('루비' in text for text in labels))
        self.assertTrue(any('화염 돌파' in text for text in labels))
        a.locator('#battle-back').click();a.locator('#asset-lobby-host [data-proxy="#menu-open"]').click();a.locator('#ref-menu-help').click()
        a.locator('.boss-guide summary').click()
        self.assertIn('루비',a.locator('#boss-guide-list').inner_text())
        self.assertEqual(a.locator('#boss-guide-list .boss-counter').count(),7)
        self.assertTrue(all(text.strip() for text in a.locator('#boss-guide-list .boss-counter').all_inner_texts()))
