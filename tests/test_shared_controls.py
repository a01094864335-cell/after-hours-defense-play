"""Shared native controls retain keyboard, form, focus, and dynamic modal behavior."""
import unittest
import test_usability as ui

class SharedControlsTests(unittest.TestCase):
    setUpClass = classmethod(ui.UsabilityTests.setUpClass.__func__)
    tearDownClass = classmethod(ui.UsabilityTests.tearDownClass.__func__)
    open = ui.UsabilityTests.open

    def test_native_identity_keyboard_and_form_semantics_survive_refresh(self):
        page = self.open(390, 844)
        result = page.evaluate("""() => {
          const form=document.createElement('form');
          const b=document.createElement('button');b.type='submit';b.textContent='Apply';
          b.dataset.controlKind='primary';form.append(b);document.body.append(form);
          let count=0;form.addEventListener('submit',e=>{e.preventDefault();count++});
          b.focus();const ref=b;for(let i=0;i<10;i++)GameControls.enhance(form);
          const focused=document.activeElement===b;
          b.click();b.disabled=true;GameControls.enhance(form);b.click();
          return {same:ref===form.firstChild,focused,
            type:b.type,count,disabled:b.disabled,kind:b.dataset.uiControl};
        }""")
        self.assertEqual(result,dict(same=True,focused=True,type='submit',count=1,disabled=True,kind='primary'))
        page.context.close()

    def test_dynamic_dialog_icon_and_worded_action_remain_distinct(self):
        for width,height in [(320,568),(390,844)]:
            page=self.open(width,height)
            page.evaluate("""() => {
              const d=document.createElement('dialog');d.id='component-test';
              d.innerHTML='<header><h2>Dynamic</h2><button type="button" id="dynamic-close" data-control-kind="close" aria-label="Close dialog">Close</button></header><footer class="ui-dialog-actions"><button type="button">Continue</button></footer>';
              document.body.append(d);d.querySelector('#dynamic-close').onclick=()=>d.close();d.showModal();
            }""")
            button=page.locator('#dynamic-close')
            page.wait_for_function("document.querySelector('#dynamic-close').dataset.uiControl==='close'")
            self.assertEqual(button.get_attribute('aria-label'),'Close dialog')
            self.assertEqual(page.locator('#component-test footer button').inner_text(),'Continue')
            self.assertEqual(page.locator('#component-test footer button img').count(),0)
            self.assertTrue(button.locator('img').evaluate('(e)=>e.complete&&e.naturalWidth>0'))
            size=button.bounding_box();self.assertEqual(size['width'],44);self.assertEqual(size['height'],44)
            before=button.evaluate('(b)=>{window.keptIcon=b.firstChild;return getComputedStyle(b).backgroundColor}')
            writes=button.evaluate('''(b)=>{
              const observer=new MutationObserver(()=>{});
              observer.observe(b,{attributes:true,childList:true,subtree:true});
              for(let i=0;i<5;i++)GameControls.enhance(document);
              const count=observer.takeRecords().length;observer.disconnect();return count;
            }''')
            self.assertEqual(writes,0)
            self.assertTrue(button.evaluate('(b)=>b.firstChild===window.keptIcon'))
            button.focus();page.keyboard.press('Enter')
            self.assertFalse(page.locator('#component-test').evaluate('(d)=>d.open'))
            page.context.close()
