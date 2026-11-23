"""English draft coverage through the real story and personnel controllers."""
import os
from pathlib import Path
import re
import unittest
import test_usability as ui

class EnglishNarrativeTests(unittest.TestCase):
    setUpClass=classmethod(ui.UsabilityTests.setUpClass.__func__)
    tearDownClass=classmethod(ui.UsabilityTests.tearDownClass.__func__)
    open=ui.UsabilityTests.open

    def prepare(self,p):
        errors=[];p.on('pageerror',lambda e:errors.append(str(e)))
        self.addCleanup(lambda errors=errors:self.assertEqual(errors,[]))
        p.evaluate("saveChange(d=>{d.tutorialComplete=true;d.stories=CastleStories.map(s=>s.id);d.staff=kinds.map(k=>k.file);d.owned=Object.keys(mercCatalog)});restartTo('lobby');GameLanguage.set('en')")

    def english(self,text):
        self.assertTrue(text.strip())
        self.assertIsNone(re.search('[가-힣]',text),text)

    def capture(self,p,name):
        out=os.getenv('NARRATIVE_QA_DIR')
        if out:
            Path(out).mkdir(parents=True,exist_ok=True)
            p.wait_for_function("[...document.querySelectorAll('#promo[open] #promo-face,#hiring-story[open] .hire-art img')].every(i=>i.complete&&i.naturalWidth>0)")
            p.screenshot(path=str(Path(out)/(name+'.png')))

    def test_all_forty_castle_stories_and_intro_have_readable_english(self):
        p=self.open(320,568);self.prepare(p);errors=[];p.on('pageerror',lambda e:errors.append(str(e)))
        before=p.evaluate('JSON.stringify({meta,board,sp,cost})')
        ids=p.evaluate('CastleStories.map(s=>s.id)')
        self.assertEqual(len(ids),40)
        for id in ids:
            p.evaluate('id=>replayCastleStory(id)',id)
            for index in range(4):
                self.english(p.locator('#promo-title').inner_text())
                self.english(p.locator('#promo-speaker').inner_text())
                self.english(p.locator('#promo-line').inner_text())
                self.english(p.locator('#promo-aside').inner_text())
                self.english(p.locator('#story-discovery').inner_text())
                ui.assert_reachable(self,p,'#promo-next');ui.assert_reachable(self,p,'#promo-prev') if index else None
                if id=='same-place-tomorrow' and index==3:self.capture(p,'en-320-castle-final')
                if index<3:p.locator('#promo-next').click()
            p.locator('#promo-skip').click();p.wait_for_function('!document.querySelector("#promo").open')
        self.assertEqual(p.evaluate('JSON.stringify({meta,board,sp,cost})'),before)
        self.assertEqual(errors,[])

    def test_all_nineteen_hiring_stories_translate_each_native_page(self):
        for width,height in [(320,568),(390,844)]:
            p=self.open(width,height);self.prepare(p);before=p.evaluate('JSON.stringify({meta,board,sp,cost})')
            ids=p.evaluate('HIRING_STORIES.map(s=>s.id)');self.assertEqual(len(ids),19)
            for id in ids:
                self.assertTrue(p.evaluate('id=>HiringStories.open(id)',id))
                for index in range(4):
                    for selector in ['#hiring-story-title','.hire-name','.hire-dialogue']:
                        self.english(p.locator('#hiring-story '+selector).inner_text())
                    ui.assert_reachable(self,p,'#hiring-story [data-hire-next]')
                    if id=='merc-q' and index==3:self.capture(p,f'en-{width}-hiring-q')
                    p.locator('#hiring-story [data-hire-next]').click()
                p.wait_for_function('!document.querySelector("#hiring-story").open')
            self.assertEqual(p.evaluate('JSON.stringify({meta,board,sp,cost})'),before)

    def test_all_personnel_bios_and_locale_switch_preserve_identity_and_progress(self):
        p=self.open(320,568);self.prepare(p)
        p.locator('#asset-lobby-host [data-proxy="#roster-open"]').click()
        records=p.evaluate('staffRecords.map(r=>({id:r.id,group:r.group}))');self.assertEqual(len(records),24)
        before=p.evaluate('JSON.stringify({meta,board,sp,cost})')
        for r in records:
            p.locator('#asset-roster-host [data-group="'+('merc' if r['group']=='merc' else 'staff')+'"]').click()
            p.locator('#asset-roster-host .r-card[data-record="'+r['id']+'"]').click()
            self.english(p.locator('#roster-detail .dossier-hero h3').inner_text())
            p.locator('#roster-detail [data-ss-label="story"]').click()
            self.english(p.locator('#roster-detail blockquote').inner_text())
            self.english(p.locator('#roster-detail .ss-dossier-story .dossier-section:not(.hire-record) p').first.inner_text())
            ui.assert_reachable(self,p,'#roster-back')
            if r['id']=='electric-technician':self.capture(p,'en-320-jjirit-bio')
            p.locator('#roster-back').click()
        self.assertEqual(p.evaluate('JSON.stringify({meta,board,sp,cost})'),before)
        p.locator('#asset-roster-host .r-close').click()
        p.evaluate("replayCastleStory('first-shift')");p.locator('#promo-next').click()
        english=p.locator('#promo-line').inner_text();index=p.evaluate('promoIndex')
        p.evaluate("GameLanguage.set('ko')")
        self.assertRegex(p.locator('#promo-line').inner_text(),'[가-힣]')
        p.evaluate("GameLanguage.set('en')")
        self.assertEqual(p.locator('#promo-line').inner_text(),english)
        self.assertEqual(p.evaluate('promoIndex'),index)
        self.assertEqual(p.evaluate('JSON.stringify({meta,board,sp,cost})'),before)
        self.capture(p,'en-320-intro-restored')

    def test_queued_close_cannot_clear_reopened_story_or_resume_combat(self):
        p=self.open(390,844);self.prepare(p)
        p.evaluate("playing=true;paused=true;comicResume=true;replayCastleStory('first-shift');document.querySelector('#promo').close();replayCastleStory('midnight-soup')")
        p.evaluate('()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)))')
        self.assertTrue(p.evaluate('castleReplay&&paused&&comicResume'))
        self.assertEqual(p.evaluate('currentCastleStory.id'),'midnight-soup')
        self.assertIn('Replay',p.locator('#story-discovery').inner_text())
        p.locator('#promo-next').click();self.english(p.locator('#story-discovery').inner_text())
        p.locator('#promo-skip').click();p.wait_for_function('!paused&&!comicResume&&!castleReplay')

if __name__=='__main__':unittest.main()
