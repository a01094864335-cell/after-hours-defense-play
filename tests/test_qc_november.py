"""Visible outcome and localization regressions found during the November QC sweep."""
import unittest
import test_usability as ui
from browser_helpers import enter_preparation

class NovemberQCTests(unittest.TestCase):
    setUpClass=classmethod(ui.UsabilityTests.setUpClass.__func__)
    tearDownClass=classmethod(ui.UsabilityTests.tearDownClass.__func__)
    open=ui.UsabilityTests.open

    def battle(self,p,lang='ko'):
        p.evaluate("lang=>{saveChange(d=>d.tutorialComplete=true);restartTo('lobby');GameLanguage.set(lang);reset();setScreen('battle');playing=true;wave=10;dailyEnabled=false;paused=false;queue=['normal'];timer=999;kingEvent.timer=999;board=Array(15).fill(null);board[0]={type:0,pip:5,cool:999,skillCD:0};selected=0;sync()}",lang)

    def test_story_discovery_is_readable_on_fullscreen_art(self):
        p=self.open(320,568)
        p.locator('#asset-lobby-host [data-proxy="#enter-battle"]').click()
        color=p.locator('#story-discovery').evaluate('e=>getComputedStyle(e).color')
        import re
        channels=[int(v)for v in re.findall(r'\d+',color)[:3]]
        self.assertGreater(min(channels),150,color)
        self.assertGreaterEqual(p.locator('#story-discovery').evaluate('e=>parseFloat(getComputedStyle(e).fontSize)'),12)

    def test_roulette_has_one_highlight_and_full_color_reward_portraits(self):
        for w,h in [(320,568),(390,844)]:
            p=self.open(w,h);p.emulate_media(reduced_motion='reduce');self.battle(p)
            p.evaluate("bonusPending=true;paused=true;rewardBundle=makeRewardOffers();rewardBundle.winner=2;renderPerkChoices();document.querySelector('#perk').showModal();sync()")
            p.wait_for_function('!document.querySelector("#roulette-claim").disabled')
            colors=p.locator('#perk-options>button:visible').evaluate_all("es=>es.map(e=>({winner:e.dataset.winner==='true',color:getComputedStyle(e).backgroundColor,filter:getComputedStyle(e,'::before').filter}))")
            import re
            for card in colors:
                rgb=[int(v)for v in re.findall(r'\d+',card['color'])[:3]]
                self.assertEqual(card['filter'],'none',card)
                if not card['winner']:self.assertLess(max(rgb)-min(rgb),60,card)
            self.assertEqual(sum(c['winner']for c in colors),1)
            self.assertEqual(p.locator('#tactical-preview').evaluate('e=>getComputedStyle(e).visibility'),'hidden')
            ui.assert_reachable(self,p,'#roulette-claim');p.locator('#roulette-claim').click()
            self.assertFalse(p.evaluate('bonusPending'));self.assertEqual(p.evaluate('wave'),11);p.context.close()

    def test_defeat_does_not_claim_a_safe_clock_out(self):
        p=self.open(390,844);self.battle(p)
        p.evaluate('life=0;update(1/60);sync()')
        self.assertTrue(p.locator('#result').is_visible())
        self.assertNotIn('무사히',p.locator('#result-title-badge').inner_text())
        self.assertIn('돌파',p.locator('#result-title-badge').inner_text())

    def test_english_discard_confirmation_preserves_the_high_rank_guard(self):
        p=self.open(320,568);self.battle(p,'en')
        self.assertEqual(p.locator('#board-trash span').inner_text(),'Trash')
        p.locator('#board-trash').click();self.assertTrue(p.evaluate('!!board[0]'))
        self.assertEqual(p.locator('#board-trash span').inner_text(),'Sure?')
        self.assertIn('Confirm',p.locator('#board-trash').get_attribute('aria-label'))
        self.assertIn('No SP',p.locator('#message').inner_text())
        p.locator('#board-trash').click();self.assertIsNone(p.evaluate('board[0]'))


    # Keep the native touch-cancel path separate from scripted merge outcomes.
    def test_preparation_cancelled_touch_drag_redraws_without_changing_board(self):
        from browser_helpers import board_point
        p=self.open(390,844)
        p.evaluate("saveChange(d=>d.tutorialComplete=true);restartTo('lobby')")
        enter_preparation(p);p.locator('#summon').click();p.wait_for_timeout(1500)
        index=p.evaluate('board.findIndex(Boolean)');pos=board_point(p,p.evaluate('i=>cells[i]',index))
        before=p.evaluate('JSON.stringify({board,sp,cost})');cdp=p.context.new_cdp_session(p)
        cdp.send('Input.dispatchTouchEvent',{'type':'touchStart','touchPoints':[{'x':pos['x'],'y':pos['y']}]})
        cdp.send('Input.dispatchTouchEvent',{'type':'touchMove','touchPoints':[{'x':pos['x']+30,'y':pos['y']+30}]})
        p.wait_for_function('!!drag?.moved');p.wait_for_timeout(250);draws=p.evaluate('GamePerformance.stats.draws')
        cdp.send('Input.dispatchTouchEvent',{'type':'touchCancel','touchPoints':[]});p.wait_for_timeout(400)
        self.assertTrue(p.evaluate('drag===null'))
        self.assertGreater(p.evaluate('GamePerformance.stats.draws'),draws)
        self.assertEqual(p.evaluate('JSON.stringify({board,sp,cost})'),before)


    def test_english_help_topics_stay_whole_and_restore_korean(self):
        p=self.open(320,568)
        p.locator('#asset-lobby-host .a-settings').click();p.locator('#language-en').click()
        p.locator('#menu-tab-manage').click();p.locator('#ref-menu-help').click()
        self.assertIn('Summon staff',p.locator('#info-page-basics').inner_text())
        self.assertIn('Spend SP',p.locator('#info-page-basics').inner_text())
        tabs=p.locator('#info .single-screen-tabs button')
        self.assertEqual(tabs.all_inner_texts(),['Guide','Merge','Fight','Boss'])
        for tab in tabs.all():
            self.assertLessEqual(tab.bounding_box()['height'],48)
            self.assertTrue(tab.evaluate('e=>e.scrollWidth<=e.clientWidth+1'))
        p.locator('#info-tab-merge').click()
        self.assertIn('Failure chance',p.locator('#info-page-merge').inner_text())
        p.evaluate("GameLanguage.set('ko')")
        self.assertEqual(p.locator('#info-tab-basics').inner_text(),'기본')
        p.locator('#info-tab-basics').click()
        self.assertIn('직원 소환',p.locator('#info-page-basics').inner_text())

    def test_secondary_finger_cannot_replace_or_release_primary_drag(self):
        from browser_helpers import board_point
        p=self.open(390,844)
        p.evaluate("saveChange(d=>d.tutorialComplete=true);restartTo('lobby')")
        enter_preparation(p)
        for _ in range(2):p.locator('#summon').click()
        p.wait_for_timeout(1500)
        ids=p.evaluate('board.map((u,i)=>u?i:-1).filter(i=>i>=0)')
        positions=[board_point(p,p.evaluate('i=>cells[i]',i))for i in ids]
        points=[{'id':i+1,'x':pos['x'],'y':pos['y']}for i,pos in enumerate(positions)]
        before=p.evaluate('JSON.stringify({board,sp,cost})');cdp=p.context.new_cdp_session(p)
        cdp.send('Input.dispatchTouchEvent',{'type':'touchStart','touchPoints':points[:1]})
        self.assertEqual(p.evaluate('drag.from'),ids[0])
        cdp.send('Input.dispatchTouchEvent',{'type':'touchStart','touchPoints':points})
        self.assertEqual(p.evaluate('drag.from'),ids[0])
        cdp.send('Input.dispatchTouchEvent',{'type':'touchEnd','touchPoints':points[1:]})
        self.assertEqual(p.evaluate('drag.from'),ids[0])
        cdp.send('Input.dispatchTouchEvent',{'type':'touchCancel','touchPoints':[]})
        self.assertIsNone(p.evaluate('drag'))
        self.assertEqual(p.evaluate('JSON.stringify({board,sp,cost})'),before)
        p.mouse.move(positions[0]['x'],positions[0]['y']);p.mouse.down(button='right')
        self.assertIsNone(p.evaluate('drag'));p.mouse.up(button='right')

    def test_unchanged_recycle_controls_do_not_rewrite_dom(self):
        p=self.open(390,844);self.battle(p)
        changes=p.evaluate("""async()=>{const changes=[],root=document.querySelector('#board-trash');const observer=new MutationObserver(rs=>changes.push(...rs));observer.observe(root,{subtree:true,childList:true,attributes:true});for(let i=0;i<20;i++)BoardRecycle.refresh();await Promise.resolve();observer.disconnect();return changes.length}""")
        self.assertEqual(changes,0)

if __name__=='__main__':unittest.main()
