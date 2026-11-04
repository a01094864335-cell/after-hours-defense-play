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
        a=self.open(320,568);a.locator('#menu-open').click();a.locator('#ref-menu-help').click()
        self.inside(a,'#info .ui-dialog-header h2');self.inside(a,'#info-close')
        self.assertGreaterEqual(a.locator('#skill-info').evaluate('e=>parseFloat(getComputedStyle(e).fontSize)'),14)
        before=a.locator('#info .ui-dialog-header h2').bounding_box();a.locator('#info > .panel-scroll-body').evaluate('e=>e.scrollTop=e.scrollHeight')
        self.assertEqual(before,a.locator('#info .ui-dialog-header h2').bounding_box());self.inside(a,'#info-close');a.locator('#info-close').click();self.assertFalse(a.locator('#info').is_visible())
    def test_reward_return_remains_visible_and_last_target_is_reachable(self):
        a=self.open(320,568);a.evaluate("saveChange(d=>{d.tutorialComplete=true});reset();setScreen('battle');wave=20;playing=true;paused=true;bonusPending=true;renderPerkChoices();document.querySelector('#perk').showModal()")
        a.locator('#perk-equipment').click();self.inside(a,'#perk-back')
        a.locator('.perk-content').evaluate('e=>e.scrollTop=e.scrollHeight')
        self.inside(a,'#perk-targets button:last-child');self.inside(a,'#perk-back')
        a.locator('#perk-back').click();self.assertTrue(a.locator('#perk-options').is_visible());self.assertTrue(a.locator('#perk-back').is_hidden())
    def test_final_list_items_scroll_clear_of_fixed_footers(self):
        a=self.open(320,568)
        for opener,scroller,last in [('#roster-open','#roster-overview','#roster-list .staff-pass:last-child'),('#training-entry','.live-training-body','#training-effects>article:last-of-type')]:
            a.locator(opener).click();a.locator(scroller).evaluate('e=>e.scrollTop=e.scrollHeight')
            self.assertGreater(a.locator(last).count(),0)
            item=a.locator(last).bounding_box();body=a.locator(scroller).bounding_box()
            self.assertGreaterEqual(item['y'],body['y'])
            self.assertLessEqual(item['y']+item['height'],body['y']+body['height']+1)
            a.evaluate("document.querySelectorAll('dialog[open]').forEach(d=>d.close())")
