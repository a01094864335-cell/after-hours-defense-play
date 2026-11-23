"""Native choice, strategy, cooperative combat and local report UX."""
import json
import os
from pathlib import Path
import unittest
import test_usability as ui

class FunPriorityTests(unittest.TestCase):
    setUpClass=classmethod(ui.UsabilityTests.setUpClass.__func__)
    tearDownClass=classmethod(ui.UsabilityTests.tearDownClass.__func__)
    open=ui.UsabilityTests.open

    def reward(self,p,wave=5,lang='ko'):
        p.evaluate("({wave:w,lang})=>{saveChange(d=>d.tutorialComplete=true);restartTo('lobby');GameLanguage.set(lang);reset();setScreen('battle');playing=true;wave=w;dailyEnabled=false;paused=true;bonusPending=true;queue=[];timer=999;kingEvent.timer=999;board=Array(15).fill(null);board[0]={type:0,pip:1,cool:999};rewardBundle=null;renderPerkChoices();document.querySelector('#perk').showModal();sync()}",{'wave':wave,'lang':lang})

    def capture(self,p,name):
        out=os.getenv('FUN_QA_DIR')
        if out:
            Path(out).mkdir(parents=True,exist_ok=True);p.screenshot(path=str(Path(out)/(name+'.png')))

    def test_fifth_and_fifteenth_roulette_survive_reload_in_both_languages(self):
        for width,height,lang,wave in [(320,568,'ko',5),(390,844,'en',15)]:
            p=self.open(width,height);errors=[];p.on('pageerror',lambda e:errors.append(str(e)));self.reward(p,wave,lang)
            self.assertEqual(p.locator('#perk-options>button:visible:disabled').count(),3)
            p.wait_for_function('!document.querySelector("#roulette-claim").disabled')
            self.assertEqual(p.locator('#perk-options [data-winner="true"]').count(),1)
            self.capture(p,f'{lang}-{width}-wave{wave}-roulette')
            saved=p.evaluate('JSON.stringify(rewardBundle)')
            p.reload(wait_until='networkidle');p.wait_for_function('GameSession.canWrite()');self.assertTrue(p.evaluate('resumeRun()'))
            self.assertEqual(p.evaluate('JSON.stringify(rewardBundle)'),saved)
            p.wait_for_function('!document.querySelector("#roulette-claim").disabled')
            ui.assert_reachable(self,p,'#roulette-claim');p.locator('#roulette-claim').click()
            self.assertEqual(p.evaluate('wave'),wave+1);self.assertFalse(p.evaluate('RewardRoulette.take()'))
            self.assertEqual(p.evaluate('runInsights.observations.choices.length'),1);self.assertEqual(errors,[]);p.context.close()

    def test_saved_choice_converts_to_roulette_and_keeps_its_new_winner(self):
        p=self.open(320,568);self.reward(p,5,'ko')
        p.evaluate("rewardBundle.mode='choice';delete rewardBundle.winner;rewardBundle.selection=0;saveActiveRun()")
        p.reload(wait_until='networkidle');p.wait_for_function('GameSession.canWrite()');self.assertTrue(p.evaluate('resumeRun()'))
        self.assertEqual(p.evaluate('rewardBundle.mode'),'roulette');self.assertEqual(p.locator('#perk-options>button:visible:disabled').count(),3)
        p.wait_for_function('!document.querySelector("#roulette-claim").disabled');saved=p.evaluate('JSON.stringify(rewardBundle)')
        p.reload(wait_until='networkidle');p.wait_for_function('GameSession.canWrite()');p.evaluate('resumeRun()');self.assertEqual(p.evaluate('JSON.stringify(rewardBundle)'),saved)
        p.locator('#roulette-claim').click();self.assertEqual(p.evaluate('wave'),6)

    def test_strategy_reward_grants_saved_strategy_without_another_choice(self):
        p=self.open(390,844);self.reward(p,5,'en')
        p.evaluate("rewardBundle.offers.find(o=>o.id==='build').build='guard';rewardBundle.winner=rewardBundle.offers.findIndex(o=>o.id==='build');saveActiveRun()")
        p.reload(wait_until='networkidle');p.wait_for_function('GameSession.canWrite()');p.evaluate('resumeRun()')
        p.locator('#roulette-claim').click();self.assertEqual(p.evaluate('TacticalDuty.snapshot().build'),'guard');self.assertEqual(p.evaluate('wave'),6)
        self.assertFalse(p.evaluate("TacticalDuty.chooseBuild('guard')"))

    def test_cooperative_battle_and_report_download_preserve_wallet(self):
        p=self.open(390,844);self.reward(p,10,'en')
        p.evaluate("document.querySelector('#perk').close();bonusPending=false;paused=false;wave=12;board=Array(15).fill(null);board[6]={type:2,pip:1,cool:0};board[7]={type:4,pip:1,cool:0};spawn('normal');enemies[0].hp=enemies[0].max=100000;queue=['normal'];timer=999;kingEvent.timer=999;sync()")
        p.wait_for_function('runInsights.observations.cooperation.hits>0')
        self.assertGreater(p.evaluate('enemies[0].wet'),0);self.capture(p,'en-390-teamwork')
        p.evaluate('life=0;update(.01);sync()');p.locator('#result').wait_for(state='visible')
        details=p.locator('#run-analysis > details');details.locator('summary').first.click()
        export=p.locator('#play-records-export');export.scroll_into_view_if_needed();ui.assert_reachable(self,p,'#play-records-export')
        before=p.evaluate('JSON.stringify(meta)');self.capture(p,'en-390-observations')
        with p.expect_download() as event:export.click()
        data=json.loads(Path(event.value.path()).read_text());self.assertEqual(data['ruleset'],'fun-20261123-v1')
        self.assertGreater(data['records'][0]['observations']['cooperation']['hits'],0)
        self.assertEqual(p.evaluate('JSON.stringify(meta)'),before)

    def test_lobby_full_body_art_stays_clear_of_controls_and_old_sticker_is_not_loaded(self):
        for width,height,lang in [(320,568,'ko'),(390,844,'ko'),(430,932,'ko'),(390,640,'en')]:
            p=self.open(width,height)
            p.evaluate('lang=>GameLanguage.set(lang)',lang)
            if lang=='en':
                p.evaluate("saveChange(d=>d.tutorialComplete=true);reset();playing=true;paused=true;wave=2;cost=60;board[0]={type:0,pip:1,cool:0};saveActiveRun();restartTo('lobby');sync()")
            hero=p.locator('#asset-lobby-host .a-gobi')
            p.wait_for_function("()=>{const r=document.querySelector('#asset-lobby-host').shadowRoot;return r.querySelector('.a-gobi').naturalWidth>0&&r.querySelector('#asset-lobby').style.getPropertyValue('--lobby-dock-height')!==''}")
            self.assertTrue(hero.get_attribute('src').endswith('/assets/moonlight/gobi-lobby.webp'))
            p.wait_for_function("()=>{const r=document.querySelector('#asset-lobby-host').shadowRoot;return r.querySelector('.a-gobi').getBoundingClientRect().bottom+10<=r.querySelector('.a-roster').getBoundingClientRect().top}")
            box=hero.bounding_box();self.assertGreater(box['y'],40);self.assertLessEqual(box['x']+box['width'],width)
            ui.assert_reachable(self,p,'#asset-lobby-host .a-start');ui.assert_reachable(self,p,'#asset-lobby-host .a-settings')
            urls=p.evaluate("performance.getEntriesByType('resource').map(r=>new URL(r.name).pathname)")
            self.assertFalse(any(u.endswith('/asset-lobby-20261109/assets/gobi.webp')for u in urls))
            self.capture(p,f'{lang}-{width}-{height}-lobby');p.context.close()

if __name__=='__main__':unittest.main()
