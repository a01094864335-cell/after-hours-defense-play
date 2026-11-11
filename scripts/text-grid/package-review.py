"""Package accepted captures; retain raw rectangles as candidates, not approvals."""
import concurrent.futures
import json
import shutil
from pathlib import Path
from PIL import Image
ROOT=Path(__file__).resolve().parents[2]
QA=ROOT/'qa/text-grid-20261111'
SOURCES=['final','extended','readers-final','scrolls','scrolls-roster-final','recheck','roster-final','lobby-final','narrative-final','stress-final','system','narrative-nav-final','extended-stress','all-stress','shop-final','shop-all-final','nav-all-final','shop-availability-final','stamp-final','stamp-shop-final']
accepted={};superseded=[]
if (QA/'accepted.json').exists():
    for row in json.loads((QA/'accepted.json').read_text()):accepted[(row['id'],row.get('size'),row['lang'])]=row
for source in SOURCES:
    file=QA/source/'report.json'
    if not file.exists():continue
    for row in json.loads(file.read_text()):
        if row.get('error'):
            superseded.append({'source':source,'id':row['id'],'size':row.get('size'),'lang':row['lang'],'error':row['error']})
            continue
        if not row.get('size') and row.get('screenshot'):
            with Image.open(QA/source/row['screenshot']) as im:row['size']=f'{im.width}x{im.height}'
        row['captureSource']=source
        accepted[(row['id'],row.get('size'),row['lang'])]=row
DEST=QA/'reviewed';DEST.mkdir(exist_ok=True)
jobs={}
def add_image(source,name,prefix):
    if not name:return None
    if name.startswith('reviewed/'):
        file=QA/name;jobs[file]=file;return name
    dest=prefix+'-'+Path(name).stem+'.webp'
    jobs[DEST/dest]=QA/source/name
    return 'reviewed/'+dest
rows=[]
for key,row in sorted(accepted.items()):
    source=row['captureSource'];prefix=source
    for field in ['screenshot','bottomScreenshot']:row[field]=add_image(source,row.get(field),prefix)
    for scroll in row.get('scrolls',[]):scroll['screenshot']=add_image(source,scroll.get('screenshot'),prefix)
    trans=row.get('translation')
    if trans:
        text=[t['text'] for phase in ['top','bottom','geometry'] for t in row.get(phase,{}).get('texts',[])]+[t['text'] for s in row.get('scrolls',[]) for t in s.get('texts',[])]
        row['translation']={'mode':row['lang'],'translatedNodeCount':trans.get('translatedNodeCount',len(trans.get('translated',[]))), 'untranslatedVisible':sorted({t for t in text if any('가'<=c<='힣' for c in t)}),'meaning':'Copy proposals, not production localization. en-stress contains synthetic English prose.'}
    rows.append(row)
baseline=[]
baseline_source=QA/'baseline/report.json' if (QA/'baseline/report.json').exists() else QA/'baseline.json'
for row in json.loads(baseline_source.read_text()):
    if row.get('error'):continue
    for f in ['screenshot','bottomScreenshot']:row[f]=add_image('baseline',row.get(f),'baseline')
    baseline.append(row)
def export(pair):
    out,source=pair
    if out.exists() and out.stat().st_mtime>=source.stat().st_mtime:return
    with Image.open(source) as im:im.convert('RGB').save(out,'WEBP',quality=88,method=6)
with concurrent.futures.ThreadPoolExecutor(max_workers=8) as pool:list(pool.map(export,jobs.items()))
for file in DEST.glob('*.webp'):
    if file not in jobs:file.unlink()
(QA/'accepted.json').write_text(json.dumps(rows,ensure_ascii=False,indent=2))
(QA/'baseline.json').write_text(json.dumps(baseline,ensure_ascii=False,indent=2))
summary={'sourceMain':'3edfd726393392a7843b7d53a50be041c2cc9d11','sourceDeploymentRun':42929351921,'captureMethod':'Local official release package; public github.io denied by execution proxy (403).','englishStatus':'UI copy proposals plus explicit synthetic prose stress at 130%; not a released or fully translated English edition.','matrixBase':{'states':54,'sizes':4,'languages':2,'completed':432,'harnessErrors':0},'acceptedUniqueStates':len(rows),'acceptedByLanguage':{lang:sum(r['lang']==lang for r in rows) for lang in ['ko','en','en-stress']},'baselineStates':len(baseline),'images':len(jobs),'acceptedPageErrors':[{'id':r['id'],'errors':r.get('errors')} for r in rows if r.get('errors')],'supersededHarnessFailures':superseded,'validation':{'nodeTests':3257,'browserTests':36,'targetedBrowserTests':5},'geometryNote':'Raw rectangle and padding findings remain candidates. Layered/rotated/scroll-clipped content is visually classified; not all candidates are defects.'}
(QA/'summary.json').write_text(json.dumps(summary,ensure_ascii=False,indent=2))
print(json.dumps({k:summary[k] for k in ['acceptedUniqueStates','acceptedByLanguage','images','acceptedPageErrors']},ensure_ascii=False))
