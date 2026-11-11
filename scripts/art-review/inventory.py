"""Mechanical image inventory/contact sheets. Does not redraw source artwork."""
import hashlib,json,collections,math,io,xml.etree.ElementTree as ET
from pathlib import Path
from PIL import Image,ImageDraw,ImageOps
ROOT=Path(__file__).resolve().parents[2];OUT=ROOT/'qa/art-review-20261111';OUT.mkdir(exist_ok=True)
release=json.loads(Path('/tmp/art-audit-baseline/release-manifest.json').read_text())['files'];rows=[]
try:import cairosvg
except ImportError:cairosvg=None
for base in ['assets','previews']:
 for p in sorted((ROOT/base).rglob('*')):
  if 'art-review' in p.parts:continue # derived review thumbnails, not source artwork
  if p.suffix.lower() not in ['.png','.webp','.jpg','.jpeg','.svg']:continue
  rel=p.relative_to(ROOT).as_posix();data=p.read_bytes();row={'path':rel,'bytes':len(data),'sha256':hashlib.sha256(data).hexdigest(),'packaged':rel in release,'group':'/'.join(p.relative_to(ROOT).parts[:2])}
  try:
   
   if p.suffix=='.svg':
    ET.fromstring(data);row['format']='svg';im=Image.open(Path('/tmp/art-svg-thumbs')/(rel.replace('/','__')+'.png'))
   else:im=Image.open(p)
   im=ImageOps.exif_transpose(im).convert('RGBA');row.update(width=im.width,height=im.height,alphaBox=im.getchannel('A').getbbox(),pixelHash=hashlib.sha256(im.tobytes()).hexdigest());row['alphaOccupancy']=round(sum(im.getchannel('A').histogram()[32:])/(im.width*im.height),4)
  except Exception as e:row['readError']=str(e)
  rows.append(row)
(OUT/'image-inventory.json').write_text(json.dumps(rows,ensure_ascii=False,indent=2))
bygroup=collections.defaultdict(list)
for r in rows:bygroup[r['group']].append(r)
manifest=[]
for group,items in bygroup.items():
 for start in range(0,len(items),20):
  part=items[start:start+20];sheet=Image.new('RGB',(1200,5*245),'#e5e8ed');d=ImageDraw.Draw(sheet)
  for k,r in enumerate(part):
   x=k%5*240;y=k//5*245
   try:
    p=ROOT/r['path'];im=Image.open(Path('/tmp/art-svg-thumbs')/(r['path'].replace('/','__')+'.png')) if p.suffix=='.svg' else Image.open(p)
    im=im.convert('RGBA');im.thumbnail((220,190));bg=Image.new('RGBA',(220,190),'#fff7e6');bg.alpha_composite(im,((220-im.width)//2,(190-im.height)//2));sheet.paste(bg.convert('RGB'),(x+10,y+5))
   except Exception:pass
   label=Path(r['path']).name;d.text((x+8,y+200),label[:32],fill='#10254b');d.text((x+8,y+218),('PKG ' if r['packaged'] else 'REF ')+str(r.get('width','?'))+'x'+str(r.get('height','?')),fill='#455a73')
  name=group.replace('/','-')+f'-{start//20:02}.jpg';(OUT/'contacts').mkdir(exist_ok=True);sheet.save(OUT/'contacts'/name,quality=86);manifest.append({'group':group,'sheet':'contacts/'+name,'paths':[r['path'] for r in part]})
(OUT/'contact-index.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2))
print(json.dumps({'files':len(rows),'packaged':sum(r['packaged'] for r in rows),'groups':len(bygroup),'sheets':len(manifest),'readErrors':[r for r in rows if r.get('readError')],'rasterBytes':sum(r['bytes'] for r in rows)},ensure_ascii=False))
