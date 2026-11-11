"""Capture native main/settings in both supported preference states."""
from pathlib import Path
import sys,json
sys.path.insert(0,str(Path(__file__).resolve().parents[1]/'tests'))
import test_usability as ui
out=Path(sys.argv[1]);out.mkdir(parents=True,exist_ok=True)
ui.UsabilityTests.setUpClass()
try:
 test=ui.UsabilityTests();result=[]
 for w,h in [(320,568),(390,844)]:
  p=test.open(w,h);errors=[];p.on('pageerror',lambda e:errors.append(str(e)))
  for lang in ['ko','en']:
   p.locator('#asset-lobby-host .a-settings').click();p.locator('#language-'+lang).click()
   p.screenshot(path=str(out/f'{lang}-{w}-settings.png'))
   p.locator('#shared-menu-confirm').click();p.screenshot(path=str(out/f'{lang}-{w}-lobby.png'))
  result.append({'width':w,'errors':errors});p.context.close()
 (out/'browser-errors.json').write_text(json.dumps(result,indent=2))
finally:ui.UsabilityTests.tearDownClass()
