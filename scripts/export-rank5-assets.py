from PIL import Image
from pathlib import Path
import json,subprocess,hashlib,shutil
root=Path(__file__).resolve().parents[1];out=root/'assets/rank5';masters=root/'designs/rank5-20261123/masters'
groups=[('ac5e7ae4-337d-46a2-8b21-d1426ad3f39d',['goblin-guard','orc-technician','slime-cleaner','gobi','electric-technician']),('ea43a24e-0ab9-4438-aa5a-1fa69272e688',['ghost-courier','bat-nurse','skeleton-chef','mimic-storekeeper','spider-tailor']),('f4a722a6-46cd-4903-82f7-158911bd08ec',['nightmare-counselor','kobold-recruiter','duru-archivist','kkangtong-engineer','ddangkong-miner']),('4f9f985c-c846-4fae-ba78-ab01a0f4a724',['chalkak-photographer','bongtu-postmaster'])]
manifest={};provenance=[]
for gi,(id,keys) in enumerate(groups):
 src=masters/f'group-{gi}.png';im=Image.open(src);cw=im.width/2;rh=im.height/len(keys)
 alpha=im.getchannel('A')
 def split(nominal,axis,bounds,tolerance=55):
  l,t,r,b=bounds;values=[]
  for point in range(max(1,nominal-tolerance),min((im.height if axis=='y' else im.width)-1,nominal+tolerance)+1):
   strip=alpha.crop((l,point,r,point+1) if axis=='y' else (point,t,point+1,b));count=sum(v>=160 for v in strip.get_flattened_data());values.append((count,abs(point-nominal),point))
  count,_,point=min(values)
  if count:raise RuntimeError('No clean transparent divider '+str((gi,axis,nominal,count)))
  return point
 rowCuts=[0]+[split(round(i*rh),'y',(0,0,im.width,im.height)) for i in range(1,len(keys))]+[im.height]
 for row,key in enumerate(keys):
  frames=[];parts=[];offset=2;divider=split(round(cw),'x',(0,rowCuts[row],im.width,rowCuts[row+1]))
  for col in range(2):
   x0,y0=(0 if col==0 else divider),rowCuts[row];x1=divider if col==0 else im.width;y1=rowCuts[row+1]
   tile=im.crop((x0,y0,x1,y1));box=tile.getchannel('A').point(lambda a:255 if a>=128 else 0).getbbox();l,t,r,b=box
   l=max(0,l-2);t=max(0,t-2);r=min(tile.width,r+2);b=min(tile.height,b+2)
   factor=min(280/(r-l),280/(b-t));w,h=round((r-l)*factor),round((b-t)*factor)
   target=Path('/tmp')/f'rank5-{key}-{col}.png'
   subprocess.run(['convert',str(src),'-crop',f'{r-l}x{b-t}+{x0+l}+{y0+t}','+repage','-resize',f'{w}x{h}!',str(target)],check=True)
   frames.append({'x':offset,'y':2,'w':w,'h':h,'pivotX':max(0,min(w,((x1-x0)/2-l)*factor)),'pivotY':h});parts.append(target);offset+=w+4
  height=max(f['h'] for f in frames)+4
  cmd=['convert','-size',f'{offset}x{height}','xc:none']
  for f,p in zip(frames,parts):cmd += [str(p),'-geometry',f"+{f['x']}+{f['y']}",'-composite']
  target=out/f'{key}.webp';cmd+=['-define','webp:lossless=false','-quality','86','-define','webp:alpha-quality=100',str(target)];subprocess.run(cmd,check=True)
  data=target.read_bytes();manifest['rank5-'+key]={'baseKey':key,'group':'staff','artStyle':'main-comic','rankForm':5,'file':'assets/rank5/'+target.name,'width':offset,'sheetHeight':height,'height':max(f['h'] for f in frames),'frames':[frames[i] for i in [0,0,0,1,1,0]],'sha256':hashlib.sha256(data).hexdigest()}
  provenance.append({'character':key,'master':f'designs/rank5-20261123/masters/group-{gi}.png','masterSHA256':hashlib.sha256(src.read_bytes()).hexdigest(),'sourceGrid':{'row':row,'rows':len(keys),'columns':2,'rowCuts':rowCuts,'columnDivider':divider},'encoding':'Alpha-measured empty gutters, ImageMagick mechanical crop/resize/pack; WebP q86 alpha100','bytes':len(data),'poses':2})
(out/'manifest.js').write_text("'use strict';\nObject.assign(MotionSheets, "+json.dumps(manifest,indent=2)+');\n')
(out/'manifest.json').write_text(json.dumps(manifest,indent=2));(masters.parent/'provenance.json').write_text(json.dumps(provenance,indent=2));print('forms',len(manifest),'bytes',sum(p['bytes']for p in provenance))
