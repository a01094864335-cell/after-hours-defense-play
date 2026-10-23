"""Visible text and persistent-action regressions from the screenshot review."""
import unittest
import test_usability as ui
class VisualIssueTests(unittest.TestCase):
    setUpClass=classmethod(ui.UsabilityTests.setUpClass.__func__)
    tearDownClass=classmethod(ui.UsabilityTests.tearDownClass.__func__)
    open=ui.UsabilityTests.open
    inside=ui.UsabilityTests.inside
    def test_sp_unit_and_long_tutorial_fit_on_short_phone(self):
        a=self.open(320,568);a.locator('#enter-battle').click();a.locator('#promo-skip').click();a.evaluate('sp=9999;wave=3;sync()')
        self.assertTrue(a.locator('.sp-balance').evaluate('e=>{const r=e.getBoundingClientRect();return [...e.children].every(c=>{const b=c.getBoundingClientRect();return b.top>=r.top+3&&b.bottom<=r.bottom-3&&b.left>=r.left&&b.right<=r.right})}'))
        self.assertTrue(a.locator('#tutorial-strip').evaluate('e=>e.scrollHeight<=e.clientHeight+1&&e.scrollWidth<=e.clientWidth+1'))
        self.inside(a,'#start');self.assertEqual(a.locator('#start').evaluate('e=>getComputedStyle(e).textShadow'),'none')
    def test_short_help_keeps_heading_and_close_visible_while_scrolling(self):
        a=self.open(320,568);a.locator('#quick-help').click()
        self.inside(a,'#info>h2');self.inside(a,'#info-close')
        self.assertGreaterEqual(a.locator('#skill-info').evaluate('e=>parseFloat(getComputedStyle(e).fontSize)'),14)
        before=a.locator('#info>h2').bounding_box();a.locator('.help-content').evaluate('e=>e.scrollTop=e.scrollHeight')
        self.assertEqual(before,a.locator('#info>h2').bounding_box());self.inside(a,'#info-close');a.locator('#info-close').click();self.assertFalse(a.locator('#info').is_visible())
    def test_reward_return_remains_visible_and_last_target_is_reachable(self):
        a=self.open(320,568);a.evaluate("saveChange(d=>{d.tutorialComplete=true});reset();setScreen('battle');wave=20;playing=true;paused=true;bonusPending=true;renderPerkChoices();document.querySelector('#perk').showModal()")
        a.locator('#perk-equipment').click();self.inside(a,'#perk-back')
        a.locator('.perk-content').evaluate('e=>e.scrollTop=e.scrollHeight')
        self.inside(a,'#perk-targets button:last-child');self.inside(a,'#perk-back')
        a.locator('#perk-back').click();self.assertTrue(a.locator('#perk-options').is_visible());self.assertTrue(a.locator('#perk-back').is_hidden())
    def test_final_list_items_scroll_clear_of_fixed_footers(self):
        a=self.open(320,568)
        for opener,scroller,last,footer in [('#roster-open','#roster-list','#roster-list .staff-pass:last-child','#roster .archive-footer'),('#training-entry','.training-body','#training-effects>article:last-of-type','.training-footer')]:
            a.locator(opener).click();a.locator(scroller).evaluate('e=>e.scrollTop=e.scrollHeight')
            self.assertGreater(a.locator(last).count(),0)
            self.assertLessEqual(a.locator(last).bounding_box()['y']+a.locator(last).bounding_box()['height'],a.locator(footer).bounding_box()['y'])
            a.evaluate("document.querySelectorAll('dialog[open]').forEach(d=>d.close())")
