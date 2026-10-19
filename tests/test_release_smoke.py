"""Run with: python3 -m unittest discover -s tests -v (requires Playwright/Chromium)."""
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from threading import Thread
import unittest
from playwright.sync_api import sync_playwright


class QuietHandler(SimpleHTTPRequestHandler):
    def log_message(self, *args):
        pass


class ReleaseSafetyTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        root = Path(__file__).resolve().parents[1]
        cls.server = ThreadingHTTPServer(('127.0.0.1', 0), partial(QuietHandler, directory=str(root)))
        cls.thread = Thread(target=cls.server.serve_forever, daemon=True)
        cls.thread.start()
        cls.url = f'http://127.0.0.1:{cls.server.server_port}/'
        cls.playwright = sync_playwright().start()
        cls.browser = cls.playwright.chromium.launch(executable_path='/usr/bin/chromium', headless=True, args=['--no-sandbox'])

    @classmethod
    def tearDownClass(cls):
        cls.browser.close()
        cls.playwright.stop()
        cls.server.shutdown()
        cls.server.server_close()

    def setUp(self):
        self.context = self.browser.new_context(viewport={'width': 390, 'height': 844})
        self.errors = []
        self.page = self.context.new_page()
        self.page.on('pageerror', lambda e: self.errors.append(str(e)))
        self.page.goto(self.url, wait_until='networkidle')
        self.page.wait_for_function('GameSession.canWrite()')
        self.addCleanup(self.context.close)

    def tearDown(self):
        self.assertEqual(self.errors, [])

    def start_normal(self):
        self.page.evaluate('saveChange(d=>{d.coins=100;d.tutorialComplete=true});reset();sync()')
        self.page.locator('#enter-battle').click()
        self.page.locator('#promo-skip').click()
        self.page.locator('#summon').click()
        self.page.locator('#start').click()
        self.page.evaluate('paused=true;sync();saveActiveRun()')

    def fail_storage(self, meta_only=False):
        self.page.evaluate('''metaOnly => {
          window.originalSetItem=Storage.prototype.setItem;
          Storage.prototype.setItem=function(k,v){
            if(!metaOnly||k===META_KEY)throw new DOMException('test quota','QuotaExceededError');
            return originalSetItem.call(this,k,v);
          };
        }''', meta_only)

    def test_settlement_and_graduation_are_atomic_and_idempotent(self):
        data = self.page.evaluate('''()=>{
          wave=10;tutorialWon=true;ended=true;runNormal=20;runBoss=1;
          settleRun();const first=meta.coins;settleRun();
          return {first,second:meta.coins,total:runReward.total,completed:meta.tutorialComplete,pending:!!localStorage.getItem(PENDING_REWARD_SAVE),text:document.querySelector('#result-stats').textContent};
        }''')
        self.assertEqual((data['first'], data['second'], data['total']), (37, 37, 37))
        self.assertTrue(data['completed'])
        self.assertFalse(data['pending'])
        self.assertIn('+37', data['text'])

    def test_normal_reward_does_not_pay_twice(self):
        self.start_normal()
        data = self.page.evaluate('''()=>{runNormal=25;runBoss=1;wave=5;ended=true;settleRun();const first=meta.coins;settleRun();return [first,meta.coins]}''')
        self.assertEqual(data, [107, 107])

    def test_failed_purchase_keeps_wallet_and_inventory(self):
        self.page.evaluate('saveChange(d=>d.coins=100)')
        self.fail_storage()
        self.page.evaluate("buyItem('grade')")
        self.assertEqual(self.page.evaluate('[meta.coins,meta.items.grade,JSON.parse(localStorage.getItem(META_KEY)).coins]'), [100, 0, 100])

    def test_pending_reward_recovers_after_reload(self):
        self.start_normal()
        self.fail_storage(meta_only=True)
        data = self.page.evaluate('''()=>{runNormal=120;runBoss=1;wave=5;life=0;ended=true;settleRun();return [runReward.paid,!!localStorage.getItem(PENDING_REWARD_SAVE),!!localStorage.getItem(RUN_SAVE)]}''')
        self.assertEqual(data, [False, True, True])
        self.page.reload(wait_until='networkidle')
        self.page.wait_for_function('GameSession.canWrite() && runReward?.paid')
        self.assertEqual(self.page.evaluate('[meta.coins,runReward.total,appScreen]'), [117, 17, 'result'])
        self.page.evaluate('settleRun()')
        self.assertEqual(self.page.evaluate('meta.coins'), 117)
        self.assertIsNone(self.page.evaluate('localStorage.getItem(PENDING_REWARD_SAVE)'))

    def test_total_storage_failure_preserves_last_checkpoint(self):
        self.start_normal()
        before = self.page.evaluate('localStorage.getItem(RUN_SAVE)')
        self.fail_storage()
        self.page.evaluate('runNormal=120;runBoss=1;ended=true;settleRun()')
        self.assertEqual(self.page.evaluate('localStorage.getItem(RUN_SAVE)'), before)
        self.page.reload(wait_until='networkidle')
        self.page.wait_for_function('GameSession.canWrite()')
        self.assertTrue(self.page.evaluate('resumeRun()'))
        self.assertEqual(self.page.evaluate('[wave,sp,life]'), [1, 140, 3])

    def test_retry_in_same_tab_pays_once(self):
        self.start_normal()
        self.fail_storage()
        self.page.evaluate('runNormal=120;runBoss=1;ended=true;settleRun()')
        self.page.evaluate('()=>{Storage.prototype.setItem=originalSetItem}')
        self.page.locator('#retry-reward').click()
        self.assertEqual(self.page.evaluate('[meta.coins,runReward.paid]'), [117, True])
        self.page.evaluate('settleRun()')
        self.assertEqual(self.page.evaluate('meta.coins'), 117)

    def test_graduation_failure_and_navigation_preserve_checkpoint(self):
        self.page.evaluate("setScreen('battle');summon();document.querySelector('#start').click();document.querySelector('#guide').close();paused=true;wave=10;saveActiveRun()")
        before = self.page.evaluate('localStorage.getItem(RUN_SAVE)')
        self.fail_storage()
        # Use the actual graduation path, which also attempts to clear the run.
        self.page.evaluate("advanceProgress();clearActiveRun();restartTo('lobby')")
        self.assertFalse(self.page.evaluate('runReward.paid'))
        self.assertEqual(self.page.evaluate('localStorage.getItem(RUN_SAVE)'), before)

    def test_legacy_partially_paid_graduation_does_not_double_base(self):
        self.page.evaluate('''()=>{
          saveChange(d=>d.coins=100);wave=10;tutorialMode=true;tutorialWon=true;ended=true;runNormal=20;runBoss=1;
          saveChange(d=>{d.coins+=7;d.settled.push(runId)});writePendingSettlement();
        }''')
        self.page.reload(wait_until='networkidle')
        self.page.wait_for_function('GameSession.canWrite() && runReward?.paid')
        self.assertEqual(self.page.evaluate('[meta.coins,meta.tutorialComplete,runReward.total]'), [137, True, 37])

    def test_second_tab_cannot_write_and_reconnect_reads_latest(self):
        self.page.evaluate('saveChange(d=>d.coins=100)')
        other = self.context.new_page()
        other.goto(self.url, wait_until='networkidle')
        self.assertFalse(other.evaluate('GameSession.canWrite()'))
        self.assertTrue(other.locator('#session-notice').is_visible())
        self.page.evaluate("buyItem('grade')")
        other.evaluate("buyItem('kind');saveActiveRun();clearActiveRun()")
        self.assertEqual(self.page.evaluate('[meta.coins,meta.items.grade,meta.items.kind]'), [92, 1, 0])
        self.page.close()
        other.locator('#session-notice button').click()
        other.wait_for_function('GameSession.canWrite()')
        other.evaluate("buyItem('kind')")
        self.assertEqual(other.evaluate('[meta.coins,meta.items.grade,meta.items.kind]'), [80, 1, 1])

    def test_reload_resume_keeps_run_and_training(self):
        self.start_normal()
        before = self.page.evaluate('JSON.stringify([runId,wave,sp,life,board,runTraining])')
        self.page.reload(wait_until='networkidle')
        self.page.wait_for_function('GameSession.canWrite()')
        self.assertTrue(self.page.evaluate('resumeRun()'))
        self.assertEqual(self.page.evaluate('JSON.stringify([runId,wave,sp,life,board,runTraining])'), before)

    def test_rotation_pauses_and_requires_explicit_continue(self):
        self.start_normal()
        self.page.evaluate('paused=false;sync()')
        self.page.set_viewport_size({'width': 844, 'height': 390})
        self.page.wait_for_function("!document.querySelector('#rotation-notice').hidden && paused")
        self.assertTrue(self.page.evaluate("document.querySelector('#app-shell').inert"))
        self.page.set_viewport_size({'width': 390, 'height': 844})
        self.page.wait_for_function("document.querySelector('#rotation-notice').hidden && !document.querySelector('#app-shell').inert")
        self.assertTrue(self.page.evaluate('paused'))
        self.page.locator('#pause-continue').click()
        self.assertFalse(self.page.evaluate('paused'))

    def test_short_portrait_has_larger_board_and_visible_controls(self):
        for width, height in [(320, 568), (360, 640)]:
            with self.subTest(viewport=(width, height)):
                self.page.set_viewport_size({'width': width, 'height': height})
                self.page.locator('#enter-battle').click()
                self.page.locator('#promo-skip').click()
                self.page.wait_for_timeout(100)
                board = self.page.locator('#game').bounding_box()
                self.assertGreaterEqual(board['width'], 240)
                for selector in ['#summon', '#upgrade-open', '#start', '#skill', '#item-grade', '#item-kind', '#item-king']:
                    box = self.page.locator(selector).bounding_box()
                    self.assertGreaterEqual(box['y'], 0)
                    self.assertLessEqual(box['y'] + box['height'], height)
                    self.assertGreaterEqual(box['x'], 0)
                    self.assertLessEqual(box['x'] + box['width'], width)
                self.page.locator('#battle-back').click()

    def test_all_seven_bosses_warn_cast_and_settle_once(self):
        self.start_normal()
        result = self.page.evaluate('''()=>bossCatalog.map(b=>{
          enemies=[];wave=5;bossPlans[5]=b.id;spawn('boss');const e=enemies[0];
          board=Array.from({length:15},(_,i)=>i<2?{type:0,pip:5,cool:0,attack:0,income:5}:null);
          e.hp=e.max/2;placeEnemyAtProgress(e,300);const before={hp:e.hp,shield:e.shield,progress:e.progress};
          warnBoss(e);const cells=[...e.warningCells];castBoss(e);
          const effects={rush:e.rush,shield:e.shield,hp:e.hp,scorch:e.scorchLeft,stunned:board.filter(u=>u?.stun>0).length,decoys:enemies.filter(n=>n.decoy).length,progress:e.progress};
          const rewards=runBoss;recordKill(e);recordKill(e);
          for(const d of enemies.filter(n=>n.decoy))recordKill(d);
          return {id:b.id,before,cells,effects,reward:runBoss-rewards};
        })''')
        self.assertEqual(len(result), 7)
        by_id = {r['id']: r for r in result}
        self.assertTrue(all(r['reward'] == 1 for r in result))
        self.assertEqual(by_id['leon']['effects']['rush'], 2)
        self.assertGreater(by_id['aegis']['effects']['shield'], by_id['aegis']['before']['shield'])
        self.assertEqual(by_id['ruby']['effects']['scorch'], 4)
        self.assertGreater(by_id['lumen']['effects']['hp'], by_id['lumen']['before']['hp'])
        self.assertEqual(by_id['neve']['effects']['stunned'], 2)
        self.assertEqual(by_id['mira']['effects']['decoys'], 2)
        self.assertEqual(by_id['chrono']['effects']['progress'], 190)


if __name__ == '__main__':
    unittest.main()
