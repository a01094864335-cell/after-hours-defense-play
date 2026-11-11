import json
from pathlib import Path
from PIL import Image,ImageDraw
ROOT=Path(__file__).resolve().parents[2];OUT=ROOT/'qa/art-review-20261111';data=json.loads((OUT/'story-data.json').read_text());out=OUT/'story-contacts';out.mkdir(exist_ok=True);manifest=[]
for kind in ['castle','hiring']:
 for story in data[kind]:
  files=([ROOT/'assets/comic'/p for p in ['01-first-shift-sd.webp','02-invasion.webp','03-emergency-staff.webp','04-night-duty.webp']] if story.get('original') else [ROOT/'assets/castle-stories'/story['id']/f'{i+1:02}.webp' for i in range(4)]) if kind=='castle' else [ROOT/'assets/hiring-stories'/p['file'] for p in story['panels']]
  sheet=Image.new('RGB',(1120,630),'#e7edf4');d=ImageDraw.Draw(sheet);d.text((12,8),kind+' / '+story['id'],fill='#10254b')
  for i,p in enumerate(files):
   im=Image.open(p).convert('RGB');im.thumbnail((272,490));x=i*280+4;sheet.paste(im,(x,32));d.text((x,530),p.name,fill='#10254b')
   speaker=(story.get('panels',[])[i][1] if kind=='castle' and not story.get('original') else story.get('name',''))
   # Canonical faces alongside scene art make identity differences easy to spot.
   ids=set()
   if kind=='castle' and not story.get('original'):ids.add(story['panels'][i][4])
   elif kind=='hiring':ids.add(story['id'])
   ids.add('gobi')
   for j,id in enumerate(ids):
    face=ROOT/'assets/character-portraits'/f'{id}.webp'
    if face.exists():
     a=Image.open(face).convert('RGBA');a.thumbnail((72,72));sheet.paste(a,(x+j*82,550),a)
  name=f'{kind}-{story["id"]}.jpg';sheet.save(out/name,quality=91);manifest.append({'kind':kind,'id':story['id'],'sheet':'story-contacts/'+name,'images':[str(p.relative_to(ROOT)) for p in files]})
(OUT/'story-contact-index.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2));print(len(manifest),'episodes',sum(len(x['images']) for x in manifest),'panels')
