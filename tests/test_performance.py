"""Work-count and timing invariants; these do not claim device temperature readings."""
import unittest
import test_usability as ui

class PerformanceTests(unittest.TestCase):
    setUpClass=classmethod(ui.UsabilityTests.setUpClass.__func__)
    tearDownClass=classmethod(ui.UsabilityTests.tearDownClass.__func__)
    open=ui.UsabilityTests.open
    def battle(self):
        a=self.open(390,844)
        a.evaluate("saveChange(d=>{d.tutorialComplete=true});reset();setScreen('battle');playing=true;wave=20;queue=[];intermission=-999;kingEvent.timer=1000;enemies=[{type:'normal',hp:1e9,max:1e9,x:82,y:520,segment:0,progress:0,speed:0,slow:0,hurt:0,skill:999,shield:0,rush:0}];board[0]={type:0,pip:1,cool:0,attack:0,income:5};sync()")
        a.wait_for_timeout(400);return a
    def test_mobile_default_mode_toggle_persists(self):
        a=self.open(390,844);self.assertEqual(a.evaluate('GamePerformance.fps'),30)
        a.locator('#asset-lobby-host [data-proxy="#menu-open"]').click();a.locator('#power-save-toggle').click();self.assertEqual(a.evaluate('GamePerformance.fps'),60)
        a.reload(wait_until='networkidle');a.wait_for_function('GameSession.canWrite()');self.assertEqual(a.evaluate('GamePerformance.fps'),60)
        a.context.close();a=self.open(1280,900);self.assertEqual(a.evaluate('GamePerformance.fps'),60)
    def test_static_lobby_and_pause_do_not_keep_drawing(self):
        a=self.open(390,844);a.wait_for_timeout(600)
        before=a.evaluate('({...GamePerformance.stats})');a.wait_for_timeout(500);after=a.evaluate('({...GamePerformance.stats})')
        self.assertEqual(before,after)
        a.context.close();a=self.battle();a.evaluate('paused=true;sync()');a.wait_for_timeout(300)
        before=a.evaluate('({...GamePerformance.stats})');a.wait_for_timeout(500);self.assertEqual(before,a.evaluate('({...GamePerformance.stats})'))
    def test_render_limit_and_fixed_simulation_rate(self):
        a=self.battle();before=a.evaluate('({...GamePerformance.stats})');a.wait_for_timeout(1100);after=a.evaluate('({...GamePerformance.stats})')
        self.assertLessEqual(after['draws']-before['draws'],38);self.assertGreater(after['draws']-before['draws'],15)
        self.assertLessEqual(after['uiFlushes']-before['uiFlushes'],12)
        self.assertGreater(after['updates']-before['updates'],45)
        times=a.evaluate('''()=>[1,2,3].map(speed=>{GamePerformance.resetSimulation();let total=0;for(let i=0;i<30;i++)GamePerformance.advance(1/30,speed,dt=>{total+=dt});return total})''')
        for expected,observed in enumerate(times,1):self.assertAlmostEqual(expected,observed)
    def test_hidden_tab_stops_and_does_not_catch_up(self):
        a=self.battle();a.evaluate("Object.defineProperty(document,'hidden',{configurable:true,get:()=>true});document.dispatchEvent(new Event('visibilitychange'))")
        before=a.evaluate('({time,...GamePerformance.stats})');a.wait_for_timeout(500);self.assertEqual(before,a.evaluate('({time,...GamePerformance.stats})'))
        a.evaluate("delete document.hidden;document.dispatchEvent(new Event('visibilitychange'))");a.wait_for_timeout(100)
        self.assertLess(a.evaluate('time')-before['time'],.25)
    def test_background_and_portrait_bitmaps_are_reused(self):
        a=self.open(390,844);a.wait_for_timeout(600)
        count=a.evaluate('GamePerformance.stats.portraitDraws');a.evaluate('Motion.drawUI(performance.now()+500,true);Motion.drawUI(performance.now()+1000,true)')
        self.assertEqual(count,a.evaluate('GamePerformance.stats.portraitDraws'))
        self.assertTrue(a.evaluate("[...document.querySelectorAll('canvas[data-motion]')].every(c=>c.width<=192)"))
        a.context.close();a=self.battle()
        self.assertTrue(a.evaluate('()=>{const layer=staticBoardLayer;selected=0;draw();selected=-1;draw();return layer===staticBoardLayer}'))
    def test_portraits_appear_after_opening_static_dialogs(self):
        a=self.open(390,844)
        for button,host,close in [('#training-entry','#asset-training-host','.back'),('#roster-open','#asset-roster-host','.r-close')]:
            a.locator('#asset-lobby-host [data-proxy="'+button+'"]').click()
            if button=='#training-entry':
                a.locator(host+' [data-ss-label="effects"]').click()
            # The approved interfaces display original portrait images in shadow DOM,
            # not the hidden legacy animated canvases. Verify the visible asset loads.
            portrait=a.locator(host+' img[data-character-id]').first
            portrait.scroll_into_view_if_needed()
            a.wait_for_function("""selector=>{
                const img=document.querySelector(selector).shadowRoot.querySelector('img[data-character-id]');
                return img.complete && img.naturalWidth>0;
            }""",arg=host)
            self.assertTrue(portrait.is_visible())
            self.assertGreater(portrait.evaluate('e=>e.naturalHeight'),0)
            a.locator(host+' '+close).click()
    def test_closed_shop_is_not_rebuilt_and_refreshes_on_open(self):
        a=self.battle();a.evaluate("window.shopMutations=0;window.shopMutationDetails=[];window.shopObserver=new MutationObserver(rs=>{shopMutations+=rs.length;shopMutationDetails.push(...rs.map(r=>({type:r.type,id:r.target.id,attribute:r.attributeName})))});shopObserver.observe(document.querySelector('#shop'),{subtree:true,childList:true,attributes:true});meta.coins=100;sync()")
        a.wait_for_timeout(150);self.assertEqual(a.evaluate('shopMutations'),0,a.evaluate('shopMutationDetails'))
        a.evaluate('paused=true;sync()');a.locator('#pause-guide').count() # No interaction behind the pause overlay.
        a.evaluate("document.querySelector('#shop').showModal()")
        self.assertEqual(a.locator('#shop-coins').inner_text(),'100');self.assertFalse(a.locator('#buy-grade').is_disabled())
    def test_boss_warning_drawing_uses_cached_geometry(self):
        a=self.battle();a.evaluate("wave=5;bossPlans[5]='ruby';spawn('boss');const e=enemies.at(-1);e.warning=1;e.warningCells=[0,1];e.skill=.8")
        a.evaluate("()=>{const original=canvas.getBoundingClientRect;try{canvas.getBoundingClientRect=()=>{throw Error('layout read during warning draw')};drawBossFields()}finally{canvas.getBoundingClientRect=original}}")
