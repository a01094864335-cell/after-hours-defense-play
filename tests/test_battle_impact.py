"""Native battle presentation checks: art loading, selection, cues and render-only motion."""
import unittest
import test_usability as ui

class BattleImpactTests(unittest.TestCase):
    setUpClass=classmethod(ui.UsabilityTests.setUpClass.__func__)
    tearDownClass=classmethod(ui.UsabilityTests.tearDownClass.__func__)
    open=ui.UsabilityTests.open

    def battle(self,p):
        p.evaluate("meta.tutorialComplete=true;reset();setScreen('battle');playing=true;paused=false;wave=3;dailyEnabled=false;queue=[];timer=999;kingEvent.timer=999;board=Array(15).fill(null);board[0]={type:0,pip:4,cool:999,attack:0,arrival:0,income:999,skillCD:0};update=()=>{};sync();draw()")

    def test_rank5_art_is_lazy_and_all_forms_fit_mobile_cells(self):
        p=self.open(390,844)
        self.assertEqual(p.evaluate("performance.getEntriesByType('resource').filter(r=>/assets\\/rank5\\/.*\\.webp/.test(r.name)).length"),0)
        self.battle(p)
        for offset in [0,10]:
            p.evaluate("o=>{board=Array.from({length:15},(_,i)=>({type:(i+o)%17,pip:5,cool:999,arrival:0,skillCD:0}));board.forEach(u=>BattleImpact.staffKey(u));sync();draw()}",offset)
            p.wait_for_function("board.every(u=>BattleImpact.staffKey(u).startsWith('rank5-'))")
            fits=p.evaluate("""()=>{const r=document.querySelector('.board-stage').getBoundingClientRect(),a=BattlePresentation.axes(r.width,r.height),row=(a.y[1][3]-a.y[1][2])/3,cell=(a.x[1][7]-a.x[1][2])/5;return board.every(u=>{const d=Motion.sheets[BattleImpact.staffKey(u)],s=BattlePresentation.staffSize(d,row,cell)/d.height,b=BattlePresentation.bodyBounds(d);return 2*b.side*s<=cell-6&& (b.top+b.bottom)*s<=row-12})}""")
            self.assertTrue(fits)
        p.context.close()

    def test_selection_has_no_bubble_and_keeps_the_native_skill_action(self):
        for w,h in [(320,568),(390,844)]:
            p=self.open(w,h);self.battle(p)
            p.evaluate("board[0].pip=5;spawn('normal');enemies[0].hp=enemies[0].max=10000;sync();draw()")
            point=p.evaluate('BattlePresentation.screenPoint(cells[0])');p.mouse.click(point['x'],point['y'])
            self.assertEqual(p.evaluate('selected'),0)
            self.assertTrue(p.locator('#tactical-preview').is_hidden())
            self.assertEqual(p.locator('#battle-selected-name').inner_text(),'브릭')
            p.locator('#skill').click()
            self.assertGreater(p.evaluate('board[0].skillCD'),0)
            self.assertTrue(p.locator('#tactical-preview').is_hidden());p.context.close()

    def test_cartoon_boss_cues_begin_at_five_ten_fifteen_and_do_not_cover_other_copy(self):
        for lang in ['ko','en']:
            p=self.open(320,568);self.battle(p);p.evaluate('x=>GameLanguage.set(x)',lang)
            p.evaluate('clearBossWarning();wave=3;nextWave();sync()');self.assertTrue(p.locator('#boss-warning').is_hidden())
            for wave in [5,10,15]:
                p.evaluate('w=>{wave=w-1;nextWave();sync();tickBossWarning(0)}',wave)
                warning=p.locator('#boss-warning');self.assertTrue(warning.is_visible())
                self.assertIn(str(wave),p.locator('#boss-warning-label').inner_text())
                self.assertEqual(p.locator('#message').evaluate('e=>getComputedStyle(e).visibility'),'hidden')
                p.wait_for_timeout(400)
                bounds=warning.bounding_box();self.assertGreaterEqual(bounds['x'],0);self.assertLessEqual(bounds['x']+bounds['width'],320)
                remaining=p.evaluate('paused=true;bossWarning.left')
                p.evaluate('tickBossWarning(1)');self.assertEqual(p.evaluate('bossWarning.left'),remaining)
                p.evaluate('paused=false;tickBossWarning(4)');self.assertTrue(warning.is_hidden())
            p.context.close()

    def test_failure_and_departure_effects_keep_atomic_loss_refund_and_wallet(self):
        p=self.open(390,844);self.battle(p)
        p.evaluate("board[0]={type:4,pip:5};board[1]={type:4,pip:5};sp=100;window.beforeWallet=meta.coins;window.expectedRefund=mergeRefund();Math.random=()=>0;merge(0,1);draw()")
        self.assertIsNone(p.evaluate('board[0]'));self.assertEqual(p.evaluate('board[1].pip'),5)
        self.assertEqual(p.evaluate('sp'),p.evaluate('100+expectedRefund'))
        self.assertEqual(p.evaluate("fx.find(f=>f.effect==='mergeFail').staffType"),4)
        p.evaluate('selectBoardCell(1)');p.locator('#board-trash').click();p.locator('#board-trash').click()
        self.assertIsNone(p.evaluate('board[1]'));self.assertEqual(p.evaluate('meta.coins'),p.evaluate('beforeWallet'))
        self.assertTrue(p.evaluate("fx.some(f=>f.effect==='staffExit')"));p.context.close()

    def test_enemy_hop_reduced_motion_and_effect_budget_leave_engine_state_unchanged(self):
        p=self.open(390,844);self.battle(p)
        result=p.evaluate("""()=>{spawn('normal');const e=enemies[0];e.progress=17;e.x=82;e.y=400;const before=JSON.stringify(e),calls=[],native=Motion.draw;Motion.draw=(c,k,x,y,h,pose,o)=>{calls.push({x,y,o});return true};drawEnemyMotion(e,43);Motion.draw=native;return {same:before===JSON.stringify(e),y:calls.at(-1).y}}""")
        self.assertTrue(result['same']);self.assertLess(result['y'],412)
        p.emulate_media(reduced_motion='reduce')
        self.assertEqual(p.evaluate("(()=>{let y;const native=Motion.draw;Motion.draw=(c,k,x,v)=>{y=v;return true};drawEnemyMotion(enemies[0],43);Motion.draw=native;return y})()"),412)
        p.evaluate("fx=[];for(let i=0;i<1000;i++)burst('arrival',cells[0].x,cells[0].y,'#ffdf77');draw()")
        self.assertEqual(p.evaluate('fx.length'),480);p.context.close()
