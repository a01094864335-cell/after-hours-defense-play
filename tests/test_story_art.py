"""Artwork viewing must retain the same story, unlocks and controls."""
import unittest
import test_usability as ui

class StoryArtTests(unittest.TestCase):
    setUpClass=classmethod(ui.UsabilityTests.setUpClass.__func__)
    tearDownClass=classmethod(ui.UsabilityTests.tearDownClass.__func__)
    open=ui.UsabilityTests.open

    def test_full_art_preserves_story_state_and_returns_to_caption(self):
        for w,h in [(320,568),(390,844)]:
            p=self.open(w,h)
            p.evaluate("meta.tutorialComplete=true;restartTo('lobby');meta.stories=CastleStories.map(s=>s.id);replayCastleStory('castle-sports')")
            p.wait_for_selector('#promo .story-art-toggle')
            before=p.evaluate('JSON.stringify({coins:meta.coins,stories:meta.stories,page:promoIndex})')
            art=p.locator('#promo .comic-stage');caption=p.locator('#promo .comic-bottom')
            p.wait_for_timeout(80)
            self.assertLessEqual(art.bounding_box()['y']+art.bounding_box()['height'],caption.bounding_box()['y']+11)
            p.locator('#promo .story-art-toggle').click()
            self.assertEqual(p.locator('#promo .story-art-toggle').get_attribute('aria-pressed'),'true')
            self.assertFalse(caption.is_visible())
            self.assertEqual(p.locator('#promo-face').evaluate('e=>getComputedStyle(e).objectFit'),'contain')
            p.keyboard.press('Escape')
            self.assertTrue(caption.is_visible())
            self.assertTrue(p.locator('#promo').evaluate('e=>e.open'))
            self.assertEqual(p.evaluate('JSON.stringify({coins:meta.coins,stories:meta.stories,page:promoIndex})'),before)
            p.locator('#promo-next').click()
            self.assertEqual(p.evaluate('promoIndex'),1)
            p.evaluate("replayCastleStory('chair-project');promoIndex=2;renderCastleStory()")
            p.wait_for_timeout(30)
            self.assertEqual(p.locator('#promo-face').evaluate('e=>getComputedStyle(e).objectPosition'),'50% 0%')
            p.evaluate("document.documentElement.lang='en'")
            self.assertEqual(p.locator('#promo .story-art-toggle').inner_text(),'Full art')
            self.assertEqual(p.locator('#promo .story-art-toggle').get_attribute('aria-label'),'Hide dialogue and view full artwork')
            p.locator('#promo .story-art-toggle').click()
            self.assertEqual(p.locator('#promo-face').evaluate('e=>getComputedStyle(e).objectPosition'),'50% 50%')
            p.locator('#promo .story-art-toggle').click()
            p.evaluate("document.querySelector('#promo').close();meta.staff=[...BASE_STAFF,...RECRUIT_STAFF];meta.owned=[...MERC_IDS];HiringStories.open('spider-tailor')")
            p.locator('#hiring-story .story-art-toggle').click()
            self.assertFalse(p.locator('#hiring-story footer').is_visible())
            p.locator('#hiring-story .story-art-toggle').click()
            self.assertTrue(p.locator('#hiring-story footer').is_visible())
            p.locator('[data-hire-next]').click()
            self.assertEqual(p.locator('.hire-page').inner_text(),'2 / 4')
            p.context.close()

    def test_shop_and_battle_share_item_artwork(self):
        p=self.open(390,844)
        p.evaluate("meta.tutorialComplete=true;restartTo('lobby');document.querySelector('#shop-open').click()")
        p.locator('#asset-shop-host [data-tab="items"]').click()
        for key in ['grade','kind','king']:
            self.assertEqual(p.locator('#item-'+key+' img').get_attribute('src'),'assets/battle-exact/item-'+key+'.webp')
            self.assertEqual(p.locator('#buy-'+key).evaluate("e=>e.parentElement.querySelector('img').getAttribute('src')"),'assets/battle-exact/item-'+key+'.webp')
            self.assertEqual(p.locator('#asset-shop-host article').filter(has=p.locator('[data-item="'+key+'"]')).locator('img').get_attribute('src'),'assets/battle-exact/item-'+key+'.webp')

    def test_every_hiring_panel_updates_the_art_not_the_shared_close_icon(self):
        p=self.open(320,568)
        p.evaluate("meta.tutorialComplete=true;restartTo('lobby');meta.staff=[...BASE_STAFF,...RECRUIT_STAFF];meta.owned=[...MERC_IDS]")
        for story in p.evaluate('HIRING_STORIES.map(s=>({id:s.id,panels:s.panels.map(p=>p.file)}))'):
            p.evaluate('(id)=>HiringStories.open(id)',story['id'])
            for i,file in enumerate(story['panels']):
                if i:p.locator('[data-hire-next]').click()
                art=p.locator('#hiring-story .hire-art img')
                self.assertEqual(art.get_attribute('src'),'assets/hiring-stories/'+file)
                art.evaluate('(e)=>e.decode()')
                close=p.locator('#hiring-story [data-hire-close] img')
                self.assertTrue(close.get_attribute('src').endswith('/shared-chrome/close.svg'))
            p.locator('[data-hire-close]').click()
