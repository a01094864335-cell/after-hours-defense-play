"""Capture real current surfaces; audit story art without changing user storage."""
import sys,json,os
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parents[2]/'tests'))
import test_usability as ui
from test_modal_inventory import CASES,BASE
out=Path(os.environ.get('ART_QA_DIR','/tmp/art-review-20261123/runtime'));out.mkdir(parents=True,exist_ok=True)
ui.UsabilityTests.setUpClass();report={'surfaces':[],'stories':[],'supports':[],'errors':[]}
names={'lobby','settings','info','roster','roster-detail','shop-pack','shop-items','training-staff','training-merc','equipment','deck','daily','story-owned','cinematic','hiring','recruitment','starter','staff-trial','pause','result','perk-wave5'}
try:
 for lang in ['ko','en']:
  for width,height in [(320,568),(390,844),(430,932)]:
   p=ui.UsabilityTests().open(width,height);p.on('pageerror',lambda e:report['errors'].append(str(e)))
   p.evaluate('lang=>GameLanguage.set(lang)',lang)
   for name,selector,code in CASES:
    if name not in names:continue
    p.evaluate("document.querySelectorAll('dialog[open]').forEach(d=>d.close());"+BASE)
    p.evaluate(code)
    if name=='shop-items':p.locator('#asset-shop-host .tabs [data-tab="items"]').click()
    p.locator(selector).wait_for(state='visible');p.wait_for_timeout(80)
    file=f'{lang}-{width}-{name}.jpg';p.screenshot(path=str(out/file),type='jpeg',quality=78)
    report['surfaces'].append({'language':lang,'viewport':[width,height],'name':name,'file':file})
   p.context.close()
  p=ui.UsabilityTests().open(320,568);p.evaluate('lang=>GameLanguage.set(lang)',lang)
  p.evaluate("meta.tutorialComplete=true;restartTo('lobby');meta.staff=[...BASE_STAFF,...RECRUIT_STAFF];meta.owned=[...MERC_IDS];meta.stories=CastleStories.map(s=>s.id)")
  catalog=p.evaluate("[...CastleStories.map(s=>({kind:'castle',id:s.id})),...HIRING_STORIES.map(s=>({kind:'hiring',id:s.id}))]")
  for story in catalog:
   for i in range(4):
    p.evaluate("""({s,i})=>{if(s.kind==='castle'){if(i===0)replayCastleStory(s.id);else{promoIndex=i;renderCastleStory()}}else{if(i===0){document.querySelector('#promo').close();HiringStories.open(s.id)}else document.querySelector('[data-hire-next]').click()}}""",{'s':story,'i':i})
    selector='#promo' if story['kind']=='castle' else '#hiring-story'
    p.locator(selector+' .comic-stage img,'+selector+' .hire-art img').first.evaluate('e=>e.decode()')
    p.wait_for_timeout(25)
    data=p.locator(selector).evaluate("""d=>{const a=d.querySelector('.comic-stage,.hire-art').getBoundingClientRect(),c=d.querySelector('.comic-bottom,footer').getBoundingClientRect(),im=d.querySelector('.comic-stage img,.hire-art img');return {image:im.getAttribute('src'),decoded:im.complete&&im.naturalWidth>0,artHeight:a.height,artBottom:a.bottom,captionTop:c.top}}""")
    report['stories'].append({'language':lang,**story,'panel':i+1,**data})
   p.evaluate("document.querySelectorAll('dialog[open]').forEach(d=>d.close())")
  # Real equipped support IDs, frozen only for screenshot reproducibility.
  p.evaluate("reset();setScreen('battle');playing=true;paused=false;update=()=>{};wave=25;queue=[];timer=999;kingEvent.timer=999;board=Array.from({length:15},(_,i)=>({type:i,pip:5,cool:999,attack:0,arrival:0,income:5,skillCD:0}));meta.owned=MERC_IDS.slice();sync()")
  for id in p.evaluate('MERC_IDS'):
   p.evaluate("id=>{activeMerc=id;meta.equipped=id;sync();draw()}",id);p.wait_for_timeout(70)
   actual=p.locator('#battle-support').inner_text();file=f'{lang}-320-support-{id}.jpg';p.screenshot(path=str(out/file),type='jpeg',quality=80)
   report['supports'].append({'language':lang,'id':id,'label':actual,'file':file})
  p.context.close()
finally:
 (out/'report.json').write_text(json.dumps(report,ensure_ascii=False,indent=2));ui.UsabilityTests.tearDownClass()
assert not report['errors'],report['errors']
# Fullscreen story art intentionally extends behind the caption scrim.
assert all(s['decoded'] and s['artHeight']>0 and 0<=s['captionTop']<568 for s in report['stories'])
print({k:len(v) for k,v in report.items()})
