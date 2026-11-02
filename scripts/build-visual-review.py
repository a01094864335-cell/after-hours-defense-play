"""Create a navigable before/after evidence report; requires Pillow."""
from pathlib import Path
from PIL import Image,ImageDraw
import json,html
root=Path(__file__).resolve().parents[1]/'qa/visual-pass'
for phase in ['before','after']:
 base=root/phase;checks=json.loads((base/'checks.json').read_text())
 for width in [320,390,430]:
  folder=base/str(width);valid={r['screen'] for r in checks if r.get('screen')and not r.get('scenarioError')and r['size'][0]==width}
  for p in folder.glob('*.png'):
   if p.stem.removesuffix('-bottom')not in valid:p.unlink()
  files=sorted(folder.glob('*.png'));out=base/'sheets';out.mkdir(exist_ok=True)
  for p in out.glob(f'{width}-*.jpg'):p.unlink()
  for start in range(0,len(files),6):
   group=files[start:start+6];height=Image.open(group[0]).height
   sheet=Image.new('RGB',(width*3,(height+26)*2),'#eeeedc');draw=ImageDraw.Draw(sheet)
   for j,p in enumerate(group):
    x=j%3*width;y=j//3*(height+26);sheet.paste(Image.open(p),(x,y+26));draw.text((x+6,y+5),p.name,fill='black')
   sheet.save(out/f'{width}-{start//6+1}.jpg',quality=85)
parts=['<!doctype html><html lang="ko"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>모바일 UI 1차 시각 검수</title><style>body{background:#21172f;color:#fff1d4;font:14px system-ui;margin:24px}a{color:#ffe198}.pair{display:flex;gap:16px;flex-wrap:wrap}figure{margin:8px 0}img{width:320px;max-width:100%;height:auto}section{border-top:1px solid #84658b;padding:16px 0}nav{position:sticky;top:0;background:#21172ff0;padding:12px}h2{font-size:18px}</style><h1>모바일 UI · 1차 시각 검수</h1><p>실제 after-hours-defense-play 코드 · Chromium 모바일 에뮬레이션. GM 임시 데이터로 전투·보상·스토리 상태를 구성했으며 실제 저장 기록은 사용하지 않았습니다. Safari 실기기 검증은 포함하지 않습니다.</p><p><a href="README.md">수정 내역과 검수 범위</a></p><nav>']
for w in [320,390,430]:parts.append(f'<a href="#w{w}">{w}px</a> · ')
parts.append('</nav>')
count=0
for w in [320,390,430]:
 parts.append(f'<h2 id="w{w}">{w}px</h2>');before={p.name.split('-',1)[1]:p for p in(root/'before'/str(w)).glob('*.png')}
 for p in sorted((root/'after'/str(w)).glob('*.png')):
  key=p.name.split('-',1)[1];parts.append(f'<section><h2>{html.escape(key)}</h2><div class="pair">')
  for label,im in [('수정 전',before.get(key)),('수정 후',p)]:
   if im:parts.append(f'<figure><figcaption>{label}</figcaption><a href="{im.relative_to(root)}"><img loading="lazy" src="{im.relative_to(root)}" alt="{html.escape(key)} {label}"></a></figure>')
  parts.append('</div></section>');count+=1
parts.append('</html>');(root/'index.html').write_text(''.join(parts));print('after screenshots',count,'before screenshots',len(list((root/'before').glob('*/*.png'))))
