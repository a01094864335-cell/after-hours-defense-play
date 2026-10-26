from pathlib import Path
from PIL import Image
import json
root=Path(__file__).resolve().parents[1]
rows=[]
for f in sorted((root/'assets/castle-stories').glob('*/*.png')):
 with Image.open(f) as image:
  image=image.convert('RGB')
  image.thumbnail((900,1200),Image.Resampling.LANCZOS)
  out=f.with_suffix('.webp');image.save(out,'WEBP',quality=82,method=6)
  rows.append({'file':out.relative_to(root).as_posix(),'before':f.stat().st_size,'after':out.stat().st_size,'width':image.width,'height':image.height})
report={'panels':len(rows),'before':sum(r['before'] for r in rows),'after':sum(r['after'] for r in rows),'files':rows}
(root/'story-optimization.json').write_text(json.dumps(report,indent=2)+'\n')
print(json.dumps({k:v for k,v in report.items() if k!='files'}))
