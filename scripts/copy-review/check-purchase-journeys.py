import sys,json,re
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parents[2]/'tests'))
import test_usability as ui
ui.UsabilityTests.setUpClass();out=Path('/tmp/copy-review-purchase-journeys');out.mkdir(exist_ok=True);rows=[]
try:
 for i,(w,h) in enumerate([(320,568),(390,844),(430,932),(320,568),(390,844)],1):
  p=ui.UsabilityTests().open(w,h);p.evaluate('saveChange(d=>{d.coins=PACK_PRICE;d.tutorialComplete=true});renderMeta()')
  p.locator('#asset-lobby-host [data-proxy="#menu-open"]').click();p.locator('#language-en').click();p.locator('#menu-close').click()
  p.locator('#asset-lobby-host [data-proxy="#shop-open"]').click()
  assert 'Open' in p.locator('#asset-shop-host #price').inner_text()
  assert str(p.evaluate('PACK_PRICE')) in p.locator('#asset-shop-host #price').inner_text()
  assert p.locator('#asset-shop-host #points').evaluate("e=>e.previousElementSibling.textContent")=='Recruit points'
  summary=p.locator('#asset-shop-host .paper > details > summary');summary.click()
  body=p.locator('#asset-shop-host .recruit-rules-body');text=body.inner_text()
  assert not re.search('[가-힣]',text),text
  for value in ['17','5.29%','7','1.43%','9','equal odds','resets','+1','3','10']:assert value in text,value
  assert body.evaluate('e=>e.scrollWidth<=e.clientWidth')
  p.screenshot(path=str(out/f'{i}-{w}-rules-en.png'))
  p.locator('#asset-shop-host .recruit-rules-done').click()
  assert summary.evaluate('e=>e.getRootNode().activeElement===e')
  p.locator('#asset-shop-host .purchase').click();p.locator('#recruit-dialog').wait_for(state='visible')
  assert p.evaluate('meta.coins')==0
  if p.evaluate('!!document.querySelector("#hiring-story")?.open'):p.locator('#hiring-story [data-hire-close]').click()
  p.locator('#recruit-dialog .ref-recruit-actions button').last.click()
  p.locator('#asset-shop-host .close').click()
  p.reload(wait_until='networkidle');p.wait_for_function('GameSession.canWrite()')
  assert p.evaluate('meta.coins')==0 and p.evaluate('GameLanguage.current')=='en'
  rows.append({'round':i,'viewport':[w,h],'realSettingsAndPurchase':True,'priceDebitedOnceAndPersisted':True,'localizedOddsAndFocus':True})
  p.context.close()
finally:ui.UsabilityTests.tearDownClass();(out/'report.json').write_text(json.dumps(rows,indent=2))
