"""Build lightweight public previews plus the full repository evidence gallery."""
import html,json
from pathlib import Path
from PIL import Image
ROOT=Path(__file__).resolve().parents[2];QA=ROOT/'qa/text-grid-20261111';rows=json.loads((QA/'accepted.json').read_text());baseline=json.loads((QA/'baseline.json').read_text())
style='body{margin:0;padding:24px;background:#10254b;color:#fff6df;font:15px/1.6 system-ui,sans-serif}h1{font-size:25px}a{color:#ffdf57}header{max-width:1000px}label{margin-right:16px}select,button{padding:8px;margin:4px;border-radius:8px}main{display:flex;flex-wrap:wrap;gap:20px;align-items:flex-start}figure{margin:0;width:250px}img{width:100%;height:auto;display:block;border-radius:8px}figcaption{padding:8px 0;overflow-wrap:anywhere}small{display:block;color:#c5d5f5}'
items=[]
for r in rows:
 for field in ['screenshot','bottomScreenshot']:
  if r.get(field):items.append({'id':r['id'],'size':r['size'],'lang':r['lang'],'state':'top' if field=='screenshot' else 'bottom','src':r[field]})
 for sc in r.get('scrolls',[]):items.append({'id':r['id'],'size':r['size'],'lang':r['lang'],'state':'scroll '+str(sc['at']),'src':sc['screenshot']})
for r in baseline:
 for field in ['screenshot','bottomScreenshot']:
  if r.get(field):items.append({'id':r['id'],'size':r['size'],'lang':'ko-before','state':'before' if field=='screenshot' else 'before-bottom','src':r[field]})
(QA/'index.html').write_text('<!doctype html><html lang="ko"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>전체 UI 텍스트·여백 검수</title><style>'+style+'</style><header><h1>전체 UI 텍스트·애셋 여백 검수</h1><p>실제 최신 main의 배포 패키지 캡처. en은 UI 문구 후보이며 정식 영문판이 아닙니다. en-stress는 긴 영문 샘플과 130% 글자 검사입니다.</p><p><a href="../../docs/text-grid-audit-20261111.md">화면별 발견·수정 내역</a> · <a href="summary.json">검사 요약</a> · <a href="accepted.json">원시 측정 후보</a></p><label>언어 <select id="lang"><option>ko</option><option>en</option><option>en-stress</option><option>ko-before</option></select></label><label>크기 <select id="size"><option value="">전체</option>'+''.join('<option>'+x+'</option>' for x in sorted({r['size'] for r in items}))+'</select></label><label>화면 <select id="screen"><option value="">전체</option>'+''.join('<option>'+html.escape(x)+'</option>' for x in sorted({r['id'] for r in items}))+'</select></label><p id="count"></p></header><main></main><script>const data='+json.dumps(items,ensure_ascii=False)+';function render(){const xs=data.filter(x=>x.lang===lang.value&&(!size.value||x.size===size.value)&&(!screen.value||x.id===screen.value));document.querySelector("#count").textContent=xs.length+" captures";document.querySelector("main").replaceChildren(...xs.map(x=>{const f=document.createElement("figure"),i=document.createElement("img"),c=document.createElement("figcaption");i.src=x.src;i.loading="lazy";i.alt=x.id;c.textContent=x.id+" · "+x.size+" · "+x.lang+" · "+x.state;f.append(i,c);return f}));}for(const s of document.querySelectorAll("select"))s.onchange=render;render();</script></html>')
PUBLIC=ROOT/'assets/text-grid';PUBLIC.mkdir(exist_ok=True)
screens={'lobby':'메인','roster':'직원 도감','shop-pack':'상점','training-staff':'훈련소','battle-selected':'인게임','result-normal':'종료·정산'}
previews=[]
for id,label in screens.items():
 for lang in ['ko','en']:
  target='shop-available' if id=='shop-pack' else id
  r=next(r for r in rows if r['id']==target and r['size']=='390x844' and r['lang']==lang)
  dest=f'preview-{id}-{lang}.webp';(PUBLIC/dest).write_bytes((QA/r['screenshot']).read_bytes());bottom=None
  if r.get('bottomScreenshot'):
   bottom=f'preview-{id}-{lang}-bottom.webp';(PUBLIC/bottom).write_bytes((QA/r['bottomScreenshot']).read_bytes())
  previews.append({'id':id,'label':label,'lang':lang,'src':dest,'bottom':bottom})
(PUBLIC/'review.html').write_text('<!doctype html><html lang="ko"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>한글·영문 후보 UI 여백 검수</title><style>'+style+'</style><header><h1>한글·영문 후보 UI 여백 검수</h1><p>주요 6화면 실제 캡처. 영문은 UI 번역 후보·레이아웃 검수이며 출시된 영문판이 아닙니다. 일부 본문과 원화의 한글은 정식 번역/애셋 교체 후 재검수가 필요합니다.</p><p><a href="../../">게임 열기</a> · <a href="https://github.com/a01094864335-cell/after-hours-defense-play/blob/main/docs/text-grid-audit-20261111.md">전체 화면 발견·수정 문서</a></p><label>언어 <select id="lang"><option value="ko">한국어</option><option value="en">English copy proposals</option></select></label><label>위치 <select id="position"><option value="top">상단</option><option value="bottom">하단</option></select></label></header><main></main><script>const data='+json.dumps(previews,ensure_ascii=False)+';function render(){document.querySelector("main").replaceChildren(...data.filter(x=>x.lang===lang.value).map(x=>{const f=document.createElement("figure"),i=document.createElement("img"),c=document.createElement("figcaption");i.src=position.value==="bottom"&&x.bottom?x.bottom:x.src;i.loading="lazy";i.alt=x.label;c.textContent=x.label;f.append(i,c);return f}));}lang.onchange=position.onchange=render;render();</script></html>')
print(len(items),'gallery images;',len(previews),'public previews')
