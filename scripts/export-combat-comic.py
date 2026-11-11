"""Pack generated comic masters; crop/resize only, never redraw character pixels."""
from pathlib import Path
import json,hashlib,math
from PIL import Image
ROOT=Path(__file__).resolve().parents[1]
SOURCE=ROOT/'designs/combat-style-20261111';OUT=ROOT/'assets/combat-comic'
old=json.loads((SOURCE/'legacy-manifest.json').read_text());inputs=json.loads((SOURCE/'sources.json').read_text());entries={};measurements=[]
for record in inputs:
 id=record['id'];master=SOURCE/(id+'-master.webp');im=Image.open(master).convert('RGBA');assert im.size==(1536,1024),(id,im.size)
 scale=.75 if id=='demon-king' else .5
 crops=[];bounds=[]
 for i in range(6):
  tile=im.crop((i%3*512,i//3*512,i%3*512+512,i//3*512+512));box=tile.getchannel('A').point(lambda a:255 if a>=96 else 0).getbbox();assert box,(id,i)
  l,t,r,b=box;assert l>0 and t>0 and r<512 and b<512,(id,i,box)
  crop=tile.crop(box);w,h=math.ceil(crop.width*scale),math.ceil(crop.height*scale);crop=crop.resize((w,h),Image.Resampling.LANCZOS)
  crops.append(crop);bounds.append({'w':w,'h':h,'pivotX':(256-l)*scale,'pivotY':h-1})
 cols=[max(crops[i].width,crops[i+3].width)+4 for i in range(3)];rows=[max(c.height for c in crops[i:i+3])+4 for i in [0,3]]
 atlas=Image.new('RGBA',(sum(cols),sum(rows)));frames=[]
 for i,c in enumerate(crops):
  x=sum(cols[:i%3])+2;y=sum(rows[:i//3])+2;atlas.paste(c,(x,y));frames.append({'x':x,'y':y,**bounds[i]})
 target=OUT/(id+'.webp');atlas.save(target,quality=90,method=6);crops[0].save(OUT/(id+'-idle.webp'),quality=90,method=6)
 entries[id]={'name':old[id]['name'],'group':old[id]['group'],'artStyle':'main-comic','file':str(target.relative_to(ROOT)),'fallback':f'assets/combat-comic/{id}-idle.webp','width':atlas.width,'sheetHeight':atlas.height,'height':bounds[0]['h'],'frames':frames,'sha256':hashlib.sha256(target.read_bytes()).hexdigest(),'sourceMaster':str(master.relative_to(ROOT)),'whiteOutline':'baked'}
 measurements.append({'id':id,'group':old[id]['group'],'oldAtlasBytes':(ROOT/old[id]['file']).stat().st_size,'atlasBytes':target.stat().st_size,'oldDecodedBytes':old[id]['width']*old[id]['sheetHeight']*4,'decodedBytes':atlas.width*atlas.height*4})
manifest={'version':1,'styleReference':'designs/battle-comic-20261110/goblin-guard-master.png','characters':entries}
(OUT/'manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n')
js="'use strict';\n// One comic style for every battle actor. Loaded before Motion and game definitions.\nObject.assign(MotionSheets,"+json.dumps(entries,ensure_ascii=False)+");\nwindow.CombatComic=(()=>{const ids=Object.freeze("+json.dumps(list(entries))+");const known=new Set(ids);return Object.freeze({ids,has:id=>known.has(id),imagePath:id=>known.has(id)?'assets/combat-comic/'+id+'-idle.webp':'',headPath:id=>id==='demon-king'?'assets/combat-comic/demon-king-head.webp':id.startsWith('merc-')?'assets/character-portraits/'+id+'.webp':''})})();\n"
(OUT/'manifest.js').write_text(js)
(ROOT/'qa/combat-style-20261111/asset-measurements.json').write_text(json.dumps(measurements,ensure_ascii=False,indent=2)+'\n')
print(json.dumps({'characters':len(entries),'atlasBytes':sum(x['atlasBytes']for x in measurements),'oldAtlasBytes':sum(x['oldAtlasBytes']for x in measurements),'decodedBytes':sum(x['decodedBytes']for x in measurements),'oldDecodedBytes':sum(x['oldDecodedBytes']for x in measurements)}))
# Canonical heads are cropped from the same approved identity sheet.
heads=Image.open(SOURCE/'heads-master.webp').convert('RGBA')
face_ids=['merc-ward','merc-accountant','merc-rescue','merc-chikchik','merc-banchang','merc-coco','merc-q','demon-king']
face_manifest_path=ROOT/'assets/character-portraits/manifest.json'
face_manifest=json.loads(face_manifest_path.read_text());revisions={}
for index,id in enumerate(face_ids):
 tile=heads.crop((index%4*384,index//4*512,(index%4+1)*384,(index//4+1)*512))
 box=tile.getchannel('A').point(lambda a:255 if a>=96 else 0).getbbox();assert box
 art=tile.crop(box);art.thumbnail((320,320),Image.Resampling.LANCZOS)
 face=Image.new('RGBA',(352,352));face.paste(art,((352-art.width)//2,(352-art.height)//2))
 path=ROOT/f'assets/character-portraits/{id}.webp' if id!='demon-king' else OUT/'demon-king-head.webp'
 face.save(path,quality=90,method=6);sha=hashlib.sha256(path.read_bytes()).hexdigest()
 if id!='demon-king':revisions[id]=sha[:12]
 for record in face_manifest['characters']:
  if record['id']==id:record.update(master='designs/combat-style-20261111/heads-master.webp',cell=[index%4*384,index//4*512,384,512],sha256=sha,identityReference='designs/combat-style-20261111/heads-master.webp')
face_manifest_path.write_text(json.dumps(face_manifest,ensure_ascii=False,indent=2)+'\n')
import re
portrait_js=ROOT/'character-portraits.js';portrait_js.write_text(re.sub(r'const revisions=.*?;', 'const revisions='+json.dumps(revisions)+';',portrait_js.read_text()))
