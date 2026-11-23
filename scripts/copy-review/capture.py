import sys,json,os
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parents[2]/'tests'))
import test_usability as ui
from test_modal_inventory import CASES,BASE
out=Path(os.environ.get('COPY_AUDIT_DIR','/tmp/copy-audit-before'));out.mkdir(parents=True,exist_ok=True)
names={'lobby','settings','info','roster','roster-detail','shop-pack','shop-items','training-staff','training-merc','equipment','deck','daily','pause','result','perk-wave5','starter','recruit-rules','backup'}
ui.UsabilityTests.setUpClass();rows=[]
try:
 for lang in ['ko','en']:
  for w,h in [(320,568),(390,844)]:
   p=ui.UsabilityTests().open(w,h);p.evaluate('x=>GameLanguage.set(x)',lang)
   for name,selector,code in CASES:
    if name not in names:continue
    p.evaluate("document.querySelectorAll('dialog[open]').forEach(d=>d.close());"+BASE);p.evaluate("document.querySelector('#shop-open').click()" if name=='recruit-rules' else code)
    if name=='recruit-rules':p.locator('#asset-shop-host .paper > details > summary').click()
    if name=='shop-items':p.locator('#asset-shop-host .tabs [data-tab="items"]').click()
    p.locator(selector).wait_for(state='visible');p.wait_for_timeout(100)
    texts=p.evaluate("""()=>{let roots=[document];for(let i=0;i<roots.length;i++)for(const e of roots[i].querySelectorAll('*'))if(e.shadowRoot)roots.push(e.shadowRoot);return roots.flatMap(root=>[...root.querySelectorAll('p,small,button,h1,h2,h3,h4,summary,label,b,strong')].filter(e=>{const r=e.getBoundingClientRect(),s=getComputedStyle(e);return e.checkVisibility()&&s.visibility!=='hidden'&&r.width>0&&r.height>0&&r.bottom>0&&r.top<innerHeight&&r.right>0&&r.left<innerWidth}).map(e=>({tag:e.tagName,id:e.id,cls:e.className,text:e.innerText.trim(),length:e.innerText.trim().length}))).filter(e=>e.text)}""")
    rows.append({'lang':lang,'width':w,'screen':name,'texts':texts});p.screenshot(path=str(out/f'{lang}-{w}-{name}.jpg'),type='jpeg',quality=75)
   p.context.close()
finally:ui.UsabilityTests.tearDownClass();(out/'copy.json').write_text(json.dumps(rows,ensure_ascii=False,indent=2))
