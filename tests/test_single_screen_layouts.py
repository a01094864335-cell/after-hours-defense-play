"""Real primary screens fit a phone; secondary content and large type remain usable.

Uses the same isolated browser/server fixture as the existing UI regressions.
No DOM replacements, forced clicks, or screenshot stand-ins exercise controls.
"""
import unittest
import test_usability as ui


SIZES = [(320, 568), (390, 684)]
TRAINING = '#asset-training-host '
SHOP = '#asset-shop-host '

# Geometry is checked BEFORE any scroll-into-view/actionability call. A primary
# screen cannot pass just because Playwright silently scrolled its contents.
VISIBLE_BOUNDS = """e => {
    const r=e.getBoundingClientRect();
    let left=0,top=0,right=innerWidth,bottom=innerHeight;
    for(let p=e.parentElement||e.getRootNode().host;p;p=p.parentElement||p.getRootNode().host){
        const s=getComputedStyle(p),b=p.getBoundingClientRect();
        if(s.display==='contents')continue;
        if(/auto|scroll|hidden|clip/.test(s.overflowX)){
            left=Math.max(left,b.left+p.clientLeft);
            right=Math.min(right,b.left+p.clientLeft+p.clientWidth);
        }
        if(/auto|scroll|hidden|clip/.test(s.overflowY)){
            top=Math.max(top,b.top+p.clientTop);
            bottom=Math.min(bottom,b.top+p.clientTop+p.clientHeight);
        }
    }
    return {x:r.left,y:r.top,right:r.right,bottom:r.bottom,
            width:r.width,height:r.height,left,top,clipRight:right,clipBottom:bottom};
}"""


class SingleScreenLayoutTests(unittest.TestCase):
    setUpClass = classmethod(ui.UsabilityTests.setUpClass.__func__)
    tearDownClass = classmethod(ui.UsabilityTests.tearDownClass.__func__)
    open = ui.UsabilityTests.open

    def ready(self, width, height):
        page = self.open(width, height)
        page.evaluate("saveChange(d=>{d.tutorialComplete=true;d.coins=1000});renderMeta()")
        return page

    def open_screen(self, page, name):
        if name in ('settings', 'help'):
            page.locator('#asset-lobby-host [data-proxy="#menu-open"]').click()
            if name == 'help':
                page.locator('#menu-tab-manage').click()
                page.locator('#ref-menu-help').click()
        elif name == 'dossier':
            page.locator('#asset-lobby-host [data-proxy="#roster-open"]').click()
            page.locator('#asset-roster-host .r-card[data-record="goblin-guard"]').click()
            page.locator('#roster-detail.ss-dossier').wait_for(state='visible')
        else:
            entry = '#shop-open' if name == 'shop' else '#training-entry'
            page.locator(f'#asset-lobby-host [data-proxy="{entry}"]').click()
        # Layout observers and the shadow-root stylesheet must have settled.
        page.evaluate('document.fonts.ready')
        page.evaluate('new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)))')

    def assert_visible_without_scroll(self, page, selector):
        target = page.locator(selector)
        self.assertTrue(target.is_visible(), selector)
        b = target.evaluate(VISIBLE_BOUNDS)
        self.assertGreater(b['width'], 0, selector)
        self.assertGreater(b['height'], 0, selector)
        self.assertGreaterEqual(b['x'], b['left'] - 1, (selector, b))
        self.assertGreaterEqual(b['y'], b['top'] - 1, (selector, b))
        self.assertLessEqual(b['right'], b['clipRight'] + 1, (selector, b))
        self.assertLessEqual(b['bottom'], b['clipBottom'] + 1, (selector, b))

    def assert_no_primary_scroll(self, page, selector):
        self.assert_visible_without_scroll(page, selector)
        sizes = page.locator(selector).evaluate('''e=>({
            width:e.clientWidth,scrollWidth:e.scrollWidth,
            height:e.clientHeight,scrollHeight:e.scrollHeight,top:e.scrollTop
        })''')
        self.assertLessEqual(sizes['scrollHeight'], sizes['height'] + 2, (selector, sizes))
        self.assertLessEqual(sizes['scrollWidth'], sizes['width'] + 2, (selector, sizes))
        self.assertAlmostEqual(sizes['top'], 0, delta=1, msg=selector)

    def test_five_primary_screens_fit_both_short_phone_sizes(self):
        screens = [
            ('settings', '#menu > .panel-scroll-body',
             ['#menu > header', '#language-settings', '#sfx-volume', '#bgm-volume',
              '#power-save-toggle', '#compact-fx-toggle', '#shared-menu-confirm']),
            ('help', '#info > .panel-scroll-body',
             ['#info > header', '#info-page-basics', '#info-close']),
            ('dossier', '#roster-detail > .panel-scroll-body',
             ['#roster > .sheet-head', '#roster-detail > .dossier-hero',
              '#roster-detail .ss-people-tabs', '#roster-detail .ss-dossier-main', '#staff-toggle']),
            ('shop', SHOP + '.scroll',
             [SHOP + '#asset-shop > header', SHOP + '.tabs', SHOP + '.paper',
              SHOP + '.recruit-purchase-dock', SHOP + '.purchase', SHOP + 'footer']),
            ('training', TRAINING + '.scroll',
             [TRAINING + '#asset-training > header', TRAINING + '.tabs', TRAINING + '.ss-people-tabs',
              TRAINING + '.paper', TRAINING + '.upgrade-bar', TRAINING + '#upgrade', TRAINING + 'footer']),
        ]
        for width, height in SIZES:
            for name, scroller, selectors in screens:
                with self.subTest(viewport=(width, height), screen=name):
                    page = self.ready(width, height)
                    self.open_screen(page, name)
                    self.assert_no_primary_scroll(page, scroller)
                    for selector in selectors:
                        self.assert_visible_without_scroll(page, selector)
                    page.context.close()

    def assert_tab_selection(self, nav, selected):
        tabs = nav.locator('[role="tab"]')
        self.assertEqual(nav.locator('[role="tab"][aria-selected="true"]').count(), 1)
        for index in range(tabs.count()):
            tab = tabs.nth(index)
            self.assertEqual(tab.get_attribute('aria-selected'), str(index == selected).lower())
            self.assertEqual(tab.get_attribute('tabindex'), '0' if index == selected else '-1')
            panel = tab.evaluate('''e=>{
                const panel=e.getRootNode().getElementById(e.getAttribute('aria-controls'));
                return panel && {role:panel.getAttribute('role'),label:panel.getAttribute('aria-labelledby'),
                    hidden:panel.hidden,visible:panel.getClientRects().length>0};
            }''')
            self.assertIsNotNone(panel)
            self.assertEqual(panel['role'], 'tabpanel')
            self.assertEqual(panel['label'], tab.get_attribute('id'))
            self.assertEqual(panel['hidden'], index != selected)
            self.assertEqual(panel['visible'], index == selected)
        self.assertTrue(tabs.nth(selected).evaluate('e=>e.getRootNode().activeElement===e'))

    def test_topic_tabs_support_click_arrows_home_end_and_hidden_panels(self):
        for name, selector, count in [
            ('settings', '#menu .single-screen-tabs', 2),
            ('help', '#info .single-screen-tabs', 4),
            ('dossier', '#roster-detail .ss-people-tabs', 3),
            ('training', TRAINING + '.ss-people-tabs', 2),
        ]:
            with self.subTest(screen=name):
                page = self.ready(320, 568)
                self.open_screen(page, name)
                nav = page.locator(selector)
                self.assertEqual(nav.get_attribute('role'), 'tablist')
                self.assertTrue(nav.get_attribute('aria-label'))
                tabs = nav.locator('[role="tab"]')
                self.assertEqual(tabs.count(), count)
                tabs.first.focus()
                self.assert_tab_selection(nav, 0)
                for key, selected in [('End', count - 1), ('ArrowRight', 0),
                                      ('ArrowLeft', count - 1), ('Home', 0), ('ArrowRight', 1)]:
                    page.keyboard.press(key)
                    self.assert_tab_selection(nav, selected)
                tabs.first.click()
                self.assert_tab_selection(nav, 0)
                page.context.close()

    def test_recruitment_rules_are_modal_and_purchase_keeps_native_economy(self):
        for width, height in SIZES:
            with self.subTest(viewport=(width, height)):
                page = self.ready(width, height)
                page.evaluate('saveChange(d=>{d.coins=PACK_PRICE*2;d.profile.pity=SUPPORT_PITY-1});renderMeta()')
                self.open_screen(page, 'shop')
                summary = page.locator(SHOP + '.paper > details > summary')
                self.assertEqual(summary.get_attribute('aria-haspopup'), 'dialog')
                before = page.evaluate('JSON.stringify(meta)')
                for dismiss in ('Escape', 'button'):
                    summary.click()
                    rules = page.locator(SHOP + '#recruit-rules')
                    self.assertTrue(rules.evaluate('e=>e.open && e.matches(":modal")'))
                    self.assert_visible_without_scroll(page, SHOP + '#recruit-rules')
                    text = rules.inner_text()
                    for fact in ['5.29%', '1.43%', '9팩', '3포인트', '10포인트']:
                        self.assertIn(fact, text)
                    for _ in range(5):
                        page.keyboard.press('Tab')
                        self.assertTrue(rules.evaluate('e=>e.contains(e.getRootNode().activeElement)'))
                    if dismiss == 'Escape':
                        page.keyboard.press('Escape')
                    else:
                        page.locator(SHOP + '.recruit-rules-done').click()
                    self.assertFalse(rules.evaluate('e=>e.open'))
                    self.assertTrue(page.locator('#shop').evaluate('e=>e.open'))
                    self.assertTrue(summary.evaluate('e=>e.getRootNode().activeElement===e'))
                self.assertEqual(page.evaluate('JSON.stringify(meta)'), before)
                self.assertTrue(page.locator(SHOP + '.purchase').is_enabled())
                self.assertFalse(page.locator('#buy-staff-pack').is_disabled())
                page.locator(SHOP + '.purchase').click()
                page.wait_for_function('meta.coins===PACK_PRICE && meta.owned.length===1 && profile().pity===0')
                self.assertTrue(page.locator('#recruit-dialog').evaluate('e=>e.open'))
                if page.locator('#hiring-story[open]').count():
                    page.locator('[data-hire-close]').click()
                page.locator('#recruit-dialog .ref-recruit-actions button').last.click()
                self.assertEqual(page.locator(SHOP + '#pity').inner_text(), '0/10')
                page.locator(SHOP + '.tabs [data-tab="items"]').click()
                self.assertTrue(page.locator(SHOP + '.recruit-purchase-dock').is_hidden())
                self.assertTrue(page.locator(SHOP + '#items').is_visible())
                page.locator(SHOP + '.tabs [data-tab="pack"]').click()
                self.assert_visible_without_scroll(page, SHOP + '.purchase')
                page.context.close()

    def test_training_yard_loads_without_displacing_live_upgrade_and_navigation(self):
        for width, height in SIZES:
            with self.subTest(viewport=(width, height)):
                page = self.ready(width, height)
                self.open_screen(page, 'training')
                yard = page.locator(TRAINING + '.ss-training-yard')
                self.assertEqual(yard.get_attribute('aria-hidden'), 'true')
                self.assertEqual(yard.evaluate('e=>getComputedStyle(e).pointerEvents'), 'none')
                art = yard.evaluate(r'''async e=>{
                    const background=getComputedStyle(e).backgroundImage;
                    const match=background.match(/url\(["']?([^"')]+)["']?\)/);
                    if(!match)return null;
                    const image=new Image();image.src=match[1];await image.decode();
                    return {src:image.src,width:image.naturalWidth,height:image.naturalHeight};
                }''')
                self.assertIsNotNone(art)
                self.assertTrue(art['src'].endswith('/assets/single-screen/training-yard.webp'))
                self.assertGreater(art['width'], 0)
                self.assertGreater(art['height'], 0)
                self.assert_visible_without_scroll(page, TRAINING + '.ss-training-yard')
                dock = page.locator(TRAINING + '.upgrade-bar').bounding_box()
                self.assertLessEqual(yard.bounding_box()['y'] + yard.bounding_box()['height'], dock['y'] + 1)
                fixed = [TRAINING + '#upgrade', TRAINING + '.back', TRAINING + 'footer']
                before = {selector: page.locator(selector).bounding_box() for selector in fixed}
                page.locator(TRAINING + '[data-ss-label="effects"]').click()
                self.assertTrue(yard.is_hidden())
                page.locator(TRAINING + '.scroll').evaluate('e=>e.scrollTop=e.scrollHeight')
                ui.assert_reachable(self, page, TRAINING + '#effects details:last-child summary')
                for selector in fixed:
                    self.assert_visible_without_scroll(page, selector)
                    self.assertEqual(page.locator(selector).bounding_box(), before[selector])
                page.locator(TRAINING + '[data-ss-label="train"]').click()
                cost = page.evaluate('trainingCost(meta.training.staff)')
                page.locator(TRAINING + '#upgrade').click()
                self.assertEqual(page.evaluate('meta.training.staff'), 2)
                self.assertEqual(page.evaluate('meta.coins'), 1000 - cost)
                self.assert_visible_without_scroll(page, TRAINING + '#upgrade')
                self.assert_visible_without_scroll(page, TRAINING + 'footer')
                page.context.close()

    def test_double_size_fonts_use_reachable_scrolling_fallbacks(self):
        cases = [
            ('settings', '#menu', '#shared-menu-confirm',
             ['#language-en', '#sfx-volume', '#bgm-volume', '#compact-fx-toggle', '#shared-menu-confirm']),
            ('help', '#info', '#info-close', ['#info .single-screen-keyboard summary', '#info-close']),
            ('dossier', '#roster', '#staff-toggle', ['#roster-detail .skill-file p', '#staff-toggle', '#roster-back']),
            ('shop', SHOP + '#asset-shop', SHOP + '#price',
             [SHOP + '.paper > details > summary', SHOP + '.purchase', SHOP + '.close']),
            ('training', TRAINING + '#asset-training', TRAINING + '#upgrade',
             [TRAINING + '#level', TRAINING + '#upgrade', TRAINING + 'footer [data-action="home"]', TRAINING + '.back']),
        ]
        for width, height in SIZES:
            for name, root, probe, controls in cases:
                with self.subTest(viewport=(width, height), screen=name, font_scale=2):
                    page = self.ready(width, height)
                    self.open_screen(page, name)
                    baseline = page.locator(probe).evaluate('e=>parseFloat(getComputedStyle(e).fontSize)')
                    # Snapshot every size first: inherited sizes must not compound.
                    # This stresses text at 200%, rather than shrinking the viewport
                    # or applying a transform which could conceal clipping.
                    page.locator(root).evaluate('''root=>{
                        const sizes=[root,...root.querySelectorAll('*')].map(e=>[e,parseFloat(getComputedStyle(e).fontSize)]);
                        for(const [e,size] of sizes)if(size>0)e.style.setProperty('font-size',`${size*2}px`,'important');
                    }''')
                    page.evaluate('new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)))')
                    actual = page.locator(probe).evaluate('e=>parseFloat(getComputedStyle(e).fontSize)')
                    self.assertGreaterEqual(actual, baseline * 1.99)
                    for selector in controls:
                        ui.assert_reachable(self, page, selector)
                    page.context.close()


if __name__ == '__main__':
    unittest.main()
