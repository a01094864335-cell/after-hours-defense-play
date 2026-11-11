"""Mechanical split/resize/export of reviewed generated illustrations."""
import json,hashlib
from pathlib import Path
from PIL import Image
R=Path(__file__).resolve().parents[2];D=R/'designs/art-polish-20261111';Q=R/'qa/art-review-20261111';out=D/'masters';out.mkdir(exist_ok=True);records=[]
for name,source in json.loads((D/'generation-inputs.json').read_text()).items():
 master=out/(name+'.webp');source=Path(source) if Path(source).exists() else master
 im=Image.open(source).convert('RGB')
 if source!=master:im.save(master,quality=96,method=6)
 if name in ['intro04','flea04retry','coffee02retry','rain02retry']:
  paths={'intro04':'assets/comic/04-night-duty.webp','flea04retry':'assets/castle-stories/castle-flea-market/04.webp','coffee02retry':'assets/castle-stories/coffee/02.webp','rain02retry':'assets/castle-stories/rain/02.webp'};pieces=[(paths[name],im)]
 else:
  if name=='inventory-rain':paths=['assets/castle-stories/inventory/03.webp','assets/castle-stories/rain/02.webp']
  else:
   episode,pair=name.rsplit('-',1);paths=[f'assets/castle-stories/{episode}/{n.zfill(2)}.webp' for n in pair]
  pieces=[(p,im.crop((i*im.width//2,0,(i+1)*im.width//2,im.height))) for i,p in enumerate(paths)]
 for path,tile in pieces:
  target=R/path;old=target.read_bytes();backup=Q/'originals'/path;backup.parent.mkdir(parents=True,exist_ok=True)
  if not backup.exists():backup.write_bytes(old)
  size=Image.open(backup).size;tile=tile.resize(size,Image.Resampling.LANCZOS)
  for quality in [89,86,83,80]:
   tile.save(target,quality=quality,method=6)
   if target.stat().st_size<195000:break
  records.append({'path':path,'master':str(master.relative_to(R)),'sourceSize':list(im.size),'size':list(size),'quality':quality,'bytes':target.stat().st_size,'beforeSha256':hashlib.sha256(backup.read_bytes()).hexdigest(),'sha256':hashlib.sha256(target.read_bytes()).hexdigest()})
records=list({r['path']:r for r in records}.values());(Q/'edited-images.json').write_text(json.dumps(records,indent=2));print('exported',len(records),'frames')
