"""Common navigation retains real cross-page actions and usable touch geometry."""
import os
from pathlib import Path
import unittest
import test_usability as ui

class SharedChromeTests(unittest.TestCase):
    setUpClass = classmethod(ui.UsabilityTests.setUpClass.__func__)
    tearDownClass = classmethod(ui.UsabilityTests.tearDownClass.__func__)
    open = ui.UsabilityTests.open

    def test_shared_navigation_and_close_across_mobile_sizes(self):
        for width, height in [(320,568),(390,684),(390,844),(430,932)]:
            page = self.open(width,height)
            errors=[]
            page.on('pageerror',lambda error: errors.append(str(error)))
            page.evaluate("meta.tutorialComplete=true;restartTo('lobby');renderMeta()")
            for host, entry, close in [
                ('asset-lobby-host',None,None),
                ('asset-roster-host','[data-proxy="#roster-open"]','.r-close'),
                ('asset-shop-host','[data-proxy="#shop-open"]','.close'),
                ('asset-training-host','[data-proxy="#training-entry"]','.back'),
            ]:
                if entry: page.locator('#asset-lobby-host '+entry).click()
                if host=='asset-lobby-host':
                    settings=page.locator('#asset-lobby-host .a-settings')
                    box=settings.bounding_box()
                    self.assertGreaterEqual(box['width'],44)
                    self.assertGreaterEqual(box['height'],44)
                    # Expand the hitbox while retaining the original 30px gear artwork.
                    art=settings.locator('img').bounding_box()
                    self.assertAlmostEqual(art['width'],30,delta=1)
                    self.assertAlmostEqual(art['height'],30,delta=1)
                dock=page.locator('#'+host+' .shared-gnb')
                self.assertTrue(dock.is_visible())
                boxes=dock.locator('button').evaluate_all('(xs)=>xs.map(x=>{const r=x.getBoundingClientRect();return {x:r.x,y:r.y,w:r.width,h:r.height}})')
                self.assertEqual(len(boxes),3)
                for b in boxes:
                    self.assertGreaterEqual(b['w'],44)
                    self.assertGreaterEqual(b['h'],44)
                    self.assertLessEqual(b['y']+b['h'],height+1)
                icons=dock.locator('button img').evaluate_all('(xs)=>xs.map(x=>{const r=x.getBoundingClientRect();return {w:r.width,h:r.height,ok:x.complete&&x.naturalWidth>0}})')
                self.assertTrue(all(i['ok'] and abs(i['w']-i['h'])<.1 for i in icons))
                self.assertEqual(dock.locator('[aria-current="page"]').count(),1)
                if close:
                    button=page.locator('#'+host+' '+close)
                    b=button.bounding_box()
                    self.assertEqual(round(b['width']),44)
                    self.assertEqual(round(b['height']),44)
                    if host!='asset-training-host':
                        self.assertTrue(button.locator('img').get_attribute('src').endswith('/shared-chrome/close.svg'))
                out=os.getenv('CHROME_QA_DIR')
                if out:
                    Path(out).mkdir(parents=True,exist_ok=True)
                    page.screenshot(path=str(Path(out)/f'{width}x{height}-{host}.png'))
                if close: button.click()
            # Travel with the real footer handlers rather than directly opening dialogs.
            page.locator('#asset-lobby-host .shared-gnb button').nth(0).click()
            page.locator('#asset-roster-host .shared-gnb button').nth(2).click()
            self.assertTrue(page.locator('#shop').evaluate('x=>x.open'))
            page.locator('#asset-shop-host .shared-gnb button').nth(1).click()
            self.assertFalse(page.locator('#shop').evaluate('x=>x.open'))
            page.locator('#asset-lobby-host .a-settings').click()
            page.locator('#menu-close').click()
            self.assertFalse(page.locator('#menu').evaluate('x=>x.open'))
            self.assertEqual(errors,[])
            page.context.close()

    def test_paper_settings_keeps_live_sliders_and_pinned_confirmation(self):
        for width,height in [(320,568),(390,684),(390,844),(430,932)]:
            page=self.open(width,height)
            page.evaluate("meta.tutorialComplete=true;restartTo('lobby');renderMeta()")
            for attempt in range(2):
                page.locator('#asset-lobby-host .a-settings').click()
                page.wait_for_selector('#menu[open] #shared-menu-confirm')
                self.assertEqual(page.locator('#shared-menu-confirm').count(),1)
                self.assertEqual(page.locator('#menu-close').count(),1)
                # Assert the computed cascade, not only class names or stylesheet text.
                tones=page.evaluate("""()=>Object.fromEntries(['menu-story','reset','shared-menu-confirm'].map(id=>{
                    const style=getComputedStyle(document.getElementById(id));
                    return [id,{color:style.backgroundColor,image:style.backgroundImage,border:style.borderTopColor}];
                }))""")
                self.assertEqual(tones['menu-story']['color'],'rgb(255, 253, 247)')
                self.assertEqual(tones['menu-story']['image'],'none')
                self.assertEqual(tones['reset']['color'],'rgb(241, 128, 111)')
                self.assertEqual(tones['reset']['image'],'none')
                self.assertEqual(tones['reset']['border'],'rgb(16, 37, 75)')
                self.assertIn('rgb(255, 227, 74)',tones['shared-menu-confirm']['image'])
                self.assertIn('linear-gradient',tones['shared-menu-confirm']['image'])
                for selector in ['#power-save-toggle','#compact-fx-toggle']:
                    toggle=page.locator(selector)
                    if toggle.count():
                        style=toggle.evaluate('e=>({fg:getComputedStyle(e).color,bg:getComputedStyle(e).backgroundColor})')
                        self.assertNotEqual(style['fg'],style['bg'])
                        self.assertIn(style['fg'],['rgb(16, 37, 75)','rgb(255, 253, 247)'])
                for selector in ['#menu .ui-dialog-header','#menu-close','#shared-menu-confirm']:
                    b=page.locator(selector).bounding_box()
                    self.assertIsNotNone(b)
                    self.assertGreaterEqual(b['y'],0)
                    self.assertLessEqual(b['y']+b['height'],height+1)
                page.locator('#sfx-volume').focus()
                page.locator('#sfx-volume').evaluate("e=>{e.value='27';e.dispatchEvent(new Event('input',{bubbles:true}))}")
                self.assertIn('27',page.locator('#sfx-value').inner_text())
                page.locator('#bgm-volume').evaluate("e=>{e.value='42';e.dispatchEvent(new Event('input',{bubbles:true}))}")
                self.assertIn('42',page.locator('#bgm-value').inner_text())
                page.locator('#menu .panel-scroll-body').evaluate('e=>e.scrollTop=e.scrollHeight')
                self.assertTrue(page.locator('#shared-menu-confirm').is_visible())
                self.assertTrue(page.locator('#menu').evaluate('e=>e.contains(document.activeElement)'))
                out=os.getenv('CHROME_QA_DIR')
                if out:
                    Path(out).mkdir(parents=True,exist_ok=True)
                    page.screenshot(path=str(Path(out)/f'{width}x{height}-settings-{attempt}.png'))
                page.locator('#shared-menu-confirm').click()
                self.assertFalse(page.locator('#menu').evaluate('e=>e.open'))
            page.locator('#asset-lobby-host .a-settings').click()
            page.keyboard.press('Escape')
            self.assertFalse(page.locator('#menu').evaluate('e=>e.open'))
            # The acknowledgement remains a labeled primary action, not an X icon.
            page.evaluate("document.querySelector('#info').showModal()")
            self.assertEqual(page.locator('#info-close').inner_text(),'알겠어요')
            page.locator('#info-close').click()
            self.assertFalse(page.locator('#info').evaluate('e=>e.open'))
            page.context.close()

    def test_backup_and_recruitment_title_chrome(self):
        for width,height in [(320,568),(390,684),(390,844),(430,932)]:
            page=self.open(width,height)
            page.evaluate("meta.tutorialComplete=true;restartTo('lobby');renderMeta()")
            for dialog,entry,close in [
                ('save-transfer-dialog','save-transfer-open','save-transfer-close'),
            ]:
                page.evaluate("id=>document.getElementById(id).click()",entry)
                panel=page.locator('#'+dialog)
                self.assertTrue(panel.evaluate('e=>e.open'))
                header=panel.locator(':scope > header.shared-modal-header')
                self.assertEqual(header.count(),1)
                self.assertEqual(header.locator('h2').evaluate('e=>getComputedStyle(e).backgroundImage'),'none')
                # Long real headings wrap inside the decorated title's own box.
                title_bounds=header.locator('h2').evaluate("""e=>{
                    const r=e.getBoundingClientRect(),range=document.createRange();range.selectNodeContents(e);
                    const t=range.getBoundingClientRect();return {left:r.left,right:r.right,top:r.top,bottom:r.bottom,textLeft:t.left,textRight:t.right,textTop:t.top,textBottom:t.bottom};
                }""")
                self.assertGreaterEqual(title_bounds['textLeft'],title_bounds['left'])
                self.assertLessEqual(title_bounds['textRight'],title_bounds['right'])
                self.assertGreaterEqual(title_bounds['textTop'],title_bounds['top'])
                self.assertLessEqual(title_bounds['textBottom'],title_bounds['bottom'])
                action=panel.locator('#save-preview').first
                self.assertEqual(action.evaluate('e=>getComputedStyle(e).backgroundColor'),'rgb(255, 253, 247)')
                self.assertEqual(action.evaluate('e=>getComputedStyle(e).backgroundImage'),'none')
                self.assertTrue(page.locator('#save-restore').is_hidden())
                button=page.locator('#'+close)
                self.assertTrue(button.locator('img').get_attribute('src').endswith('/shared-chrome/close.svg'))
                for control in [header,button]:
                    b=control.bounding_box()
                    self.assertGreaterEqual(b['y'],0)
                    self.assertLessEqual(b['y']+b['height'],height+1)
                before=button.bounding_box()
                panel.locator('.panel-scroll-body').evaluate('e=>e.scrollTop=e.scrollHeight')
                self.assertEqual(before,button.bounding_box())
                button.click()
                self.assertFalse(panel.evaluate('e=>e.open'))
            page.evaluate("revealRecruit(RECRUIT_STAFF[0],true)")
            title=page.locator('#recruit-result .shared-recruit-title')
            title.wait_for(state='visible')
            self.assertEqual(title.inner_text(),'다시 만난 동료')
            self.assertEqual(title.get_attribute('role'),'heading')
            self.assertEqual(title.evaluate('e=>getComputedStyle(e).backgroundImage'),'none')
            page.locator('#recruit-dialog .ref-recruit-actions button').last.click()
            self.assertFalse(page.locator('#recruit-dialog').evaluate('e=>e.open'))
            page.context.close()

    def test_shop_wallet_contents_stay_inside_pill(self):
        for width,height in [(320,568),(390,844),(480,900)]:
            page=self.open(width,height)
            page.evaluate("meta.tutorialComplete=true;restartTo('lobby');meta.coins=1000000;renderMeta()")
            page.locator('#asset-lobby-host [data-proxy="#shop-open"]').click()
            wallet=page.locator('#asset-shop-host .shared-art-header .wallet')
            bounds=wallet.evaluate("""e=>{
                const rect=n=>{const r=n.getBoundingClientRect();return {left:r.left,right:r.right,top:r.top,bottom:r.bottom}};
                return {parent:rect(e),children:[...e.children].map(rect)};
            }""")
            for child in bounds['children']:
                self.assertGreaterEqual(child['left'],bounds['parent']['left'])
                self.assertLessEqual(child['right'],bounds['parent']['right'])
                self.assertGreaterEqual(child['top'],bounds['parent']['top'])
                self.assertLessEqual(child['bottom'],bounds['parent']['bottom'])
            self.assertEqual(wallet.locator('b').inner_text(),'1,000,000')
            self.assertEqual(page.locator('#asset-shop-host .shared-title').evaluate('e=>getComputedStyle(e).webkitTextStrokeWidth'),'0px')
            page.locator('#asset-shop-host .close').click()
            page.context.close()

    def test_backup_edit_invalidates_preview_presentation(self):
        page=self.open(320,568)
        page.evaluate("meta.tutorialComplete=true;restartTo('lobby');renderMeta();document.querySelector('#save-transfer-open').click();document.querySelector('#save-text').value=JSON.stringify(SaveTransfer.exportData());document.querySelector('#save-preview').click()")
        page.wait_for_function("document.querySelector('#save-transfer-status').dataset.phase==='preview'")
        self.assertFalse(page.locator('#save-restore').is_hidden())
        page.locator('#save-text').fill('{edited')
        page.wait_for_function("document.querySelector('#save-transfer-status').dataset.phase==='info'")
        self.assertTrue(page.locator('#save-restore').is_hidden())
        page.locator('#save-preview').click()
        page.wait_for_function("document.querySelector('#save-transfer-status').dataset.phase==='error'")
        page.context.close()

    def test_shop_refreshes_earned_balance_without_reload(self):
        page=self.open(390,684)
        page.evaluate("meta.tutorialComplete=true;restartTo('lobby');renderMeta()")
        page.locator('#asset-lobby-host [data-proxy="#shop-open"]').click()
        self.assertTrue(page.locator('#asset-shop-host .purchase').is_disabled())
        page.locator('#asset-shop-host .close').click()
        self.assertTrue(page.evaluate("saveChange(d=>d.coins=PACK_PRICE)"))
        page.evaluate('renderMeta()')
        page.locator('#asset-lobby-host [data-proxy="#shop-open"]').click()
        page.wait_for_function("!document.querySelector('#buy-staff-pack').disabled && !document.querySelector('#asset-shop-host').shadowRoot.querySelector('.purchase').disabled")
        page.locator('#asset-shop-host .purchase').click()
        page.wait_for_function('meta.coins===0')
        self.assertTrue(page.locator('#recruit-dialog').evaluate('e=>e.open'))
        page.context.close()

    def test_roster_touch_targets_and_real_content_fit(self):
        for width,height in [(320,568),(390,684),(390,844),(430,932)]:
            page=self.open(width,height)
            page.evaluate("meta.tutorialComplete=true;restartTo('lobby');renderMeta()")
            page.locator('#asset-lobby-host [data-proxy="#roster-open"]').click()
            buttons=page.locator('#asset-roster-host #r-team button')
            self.assertEqual(buttons.count(),5)
            for box in buttons.evaluate_all('xs=>xs.map(e=>{const r=e.getBoundingClientRect();return {w:r.width,h:r.height}})'):
                self.assertGreaterEqual(box['w'],44)
                self.assertGreaterEqual(box['h'],44)
            for selector in ['.r-duty-heading','.r-card-copy','.r-record']:
                sizes=page.locator('#asset-roster-host '+selector).evaluate_all('xs=>xs.map(e=>({client:e.clientWidth,scroll:e.scrollWidth}))')
                self.assertTrue(all(x['scroll']<=x['client']+2 for x in sizes),selector)
            page.context.close()

    def test_result_accordion_targets_are_at_least_44px(self):
        for width,height in [(320,568),(390,684),(390,844),(430,932)]:
            page=self.open(width,height)
            page.evaluate('wave=10;tutorialMode=true;tutorialWon=true;ended=true;settleRun();sync()')
            # Include controls in collapsed nested accordions only after opening them.
            page.locator('#result details').evaluate_all('xs=>xs.forEach(e=>e.open=true)')
            for box in page.locator('#result summary').evaluate_all('xs=>xs.filter(e=>e.getClientRects().length).map(e=>{const r=e.getBoundingClientRect();return {w:r.width,h:r.height}})'):
                self.assertGreaterEqual(box['w'],44)
                self.assertGreaterEqual(box['h'],44)
            page.context.close()

    def test_approved_equipment_and_deck_card_geometry(self):
        for width,height in [(320,568),(390,844),(430,932)]:
            page=self.open(width,height)
            page.evaluate("meta.tutorialComplete=true;restartTo('lobby');renderMeta();openSheet('equipment')")
            cards=page.locator('#equipment #cards>.card:visible')
            self.assertGreater(cards.count(),0)
            for card in cards.all():
                box=card.bounding_box()
                self.assertLessEqual(box['height'],180,'Upgrade should remain a compact horizontal row')
                for arrow in card.locator('.live-direction-icon').all():
                    self.assertLessEqual(arrow.bounding_box()['height'],16)
            page.locator('#equipment-close').click()
            page.evaluate('openDeck()')
            for card in page.locator('#deck-options .deck-choice:visible').all():
                self.assertEqual(card.evaluate('e=>getComputedStyle(e).flexDirection'),'column')
                name=card.locator('strong')
                if name.count():
                    self.assertGreater(name.bounding_box()['width'],40)
            page.locator('#deck-close').click()
            page.context.close()
