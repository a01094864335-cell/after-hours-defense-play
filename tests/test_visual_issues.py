"""Visible text and persistent-action regressions from the screenshot review."""
import unittest
from browser_helpers import enter_preparation, start_battle
import test_usability as ui
class VisualIssueTests(unittest.TestCase):
    setUpClass=classmethod(ui.UsabilityTests.setUpClass.__func__)
    tearDownClass=classmethod(ui.UsabilityTests.tearDownClass.__func__)
    open=ui.UsabilityTests.open
    inside=ui.UsabilityTests.inside
    def test_sp_unit_and_long_tutorial_fit_on_short_phone(self):
        a=self.open(320,568);enter_preparation(a);a.evaluate('sp=9999;wave=3;sync()')
        self.assertTrue(a.locator('#sp').locator('..').evaluate('e=>{const r=e.getBoundingClientRect();return [...e.children].every(c=>{const b=c.getBoundingClientRect();return b.top>=r.top&&b.bottom<=r.bottom&&b.left>=r.left&&b.right<=r.right})}'))
        self.assertTrue(a.locator('#tutorial-strip').evaluate('e=>e.scrollHeight<=e.clientHeight+1&&e.scrollWidth<=e.clientWidth+1'))
        self.inside(a,'#summon')
    def test_short_help_keeps_heading_and_close_visible_while_scrolling(self):
        a=self.open(320,568);a.locator('#asset-lobby-host [data-proxy="#menu-open"]').click();a.locator('#menu-tab-manage').click();a.locator('#ref-menu-help').click()
        self.inside(a,'#info .ui-dialog-header h2');self.inside(a,'#info-close')
        self.assertTrue(a.locator('#info > .panel-scroll-body').evaluate('e=>e.scrollHeight<=e.clientHeight+1'))
        a.locator('#info-tab-support').click()
        self.assertGreaterEqual(a.locator('#skill-info').evaluate('e=>parseFloat(getComputedStyle(e).fontSize)'),14)
        a.locator('#info-tab-boss').click()
        self.assertGreater(a.locator('#info > .panel-scroll-body').evaluate('e=>e.scrollHeight-e.clientHeight'),0)
        before=a.locator('#info .ui-dialog-header h2').bounding_box();a.locator('#info > .panel-scroll-body').evaluate('e=>e.scrollTop=e.scrollHeight')
        self.assertEqual(before,a.locator('#info .ui-dialog-header h2').bounding_box());self.inside(a,'#info-close');a.locator('#info-close').click();self.assertFalse(a.locator('#info').is_visible())
    def test_reward_cards_and_footer_are_reachable_on_short_phone(self):
        a=self.open(320,568);a.evaluate("saveChange(d=>{d.tutorialComplete=true});reset();setScreen('battle');wave=20;playing=true;paused=true;bonusPending=true;renderPerkChoices();document.querySelector('#perk').showModal()")
        self.assertEqual(a.locator('#perk-options>button:visible:enabled').count(),3)
        ui.assert_reachable(self,a,'#perk-options>button:visible:last-child')
        ui.assert_reachable(self,a,'#perk-reposition');self.assertTrue(a.locator('#perk-back').is_hidden())
    def test_final_list_items_scroll_clear_of_fixed_footers(self):
        a=self.open(320,568)
        surfaces=[
            ('#roster-open','#asset-roster-host .r-scroll','#asset-roster-host .r-card:last-child','#asset-roster-host .r-nav [data-action="close"]'),
            ('#training-entry','#asset-training-host .scroll','#asset-training-host #effects details:last-child summary','#asset-training-host .back'),
        ]
        for opener,scroller,last,close in surfaces:
            a.locator('#asset-lobby-host [data-proxy="'+opener+'"]').click()
            if opener=='#training-entry':
                a.locator('#asset-training-host [data-ss-label="effects"]').click()
            a.locator(scroller).evaluate('e=>e.scrollTop=e.scrollHeight')
            self.assertGreater(a.locator(last).count(),0)
            ui.assert_reachable(self,a,last)
            item=a.locator(last).bounding_box();body=a.locator(scroller).bounding_box()
            self.assertGreaterEqual(item['y'],body['y'])
            self.assertLessEqual(item['y']+item['height'],body['y']+body['height']+1)
            a.locator(close).click()
            self.assertTrue(a.locator('#asset-lobby-host #asset-lobby').is_visible())
