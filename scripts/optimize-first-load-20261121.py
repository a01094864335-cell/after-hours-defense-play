"""Audit every shipped image; generate display-sized lobby portraits without touching originals."""
from pathlib import Path
from PIL import Image
import json,sys,hashlib
root=Path(__file__).resolve().parents[1];source=Path(sys.argv[1]);report=root/'qa/flow-loading-20261121';report.mkdir(exist_ok=True)
manifest=json.loads((source/'release-manifest.json').read_text())['files'];rows=[]
for path in manifest:
 if not path.endswith(('.png','.webp','.jpg','.jpeg','.svg')):continue
 p=source/path;row={'path':path,'bytes':p.stat().st_size,'status':'original preserved'}
 if path.endswith('.svg'):row['reason']='Vector UI; preserve crisp outlines'
 else:
  im=Image.open(p);row['size']=im.size
  row['reason']='Atlas geometry / pixel source preserved' if any(v in path for v in ['/motion/','/character-motion/','/combat-comic/','/bosses/','/pixel/']) else 'Existing WebP or reference master; defer non-visible artwork rather than recompress repeatedly'
 rows.append(row)
thumbs=[];out=root/'assets/character-portraits/thumbs';out.mkdir(exist_ok=True)
for p in sorted((source/'assets/character-portraits').glob('*.webp')):
 im=Image.open(p).convert('RGBA');target=out/p.name;im.resize((192,192),Image.Resampling.LANCZOS).save(target,format='WEBP',quality=90,method=4,exact=True)
 thumbs.append({'file':str(target.relative_to(root)),'originalBytes':p.stat().st_size,'bytes':target.stat().st_size,'width':192,'sourceWidth':im.width,'sha256':hashlib.sha256(target.read_bytes()).hexdigest()})
(report/'portrait-thumbnails.json').write_text(json.dumps(thumbs,indent=2)+'\n')
(report/'asset-audit.json').write_text(json.dumps({'inspected':len(rows),'originalImageBytes':sum(r['bytes'] for r in rows),'thumbnailCount':len(thumbs),'policy':'All original illustrations and atlas pixels retained. 192px derivatives for 64 CSS px lobby portraits up to DPR3; original 512px remains in srcset for denser displays and other screens. Deferred imagery loads on display. No claim of shrinking the total archive.','files':rows},ensure_ascii=False,indent=2)+'\n');print({'audited':len(rows),'thumbnails':len(thumbs),'thumbnailBytes':sum(r['bytes'] for r in thumbs)})
