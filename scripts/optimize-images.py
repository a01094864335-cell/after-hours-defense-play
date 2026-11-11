"""Re-encode shipped illustrations without resizing or altering alpha/layout."""
from pathlib import Path
from PIL import Image
from concurrent.futures import ThreadPoolExecutor
import io,json,math,hashlib
import numpy as np
R=Path(__file__).resolve().parents[1];B=Path('/tmp/optimization-before');O=R/'qa/optimization-20261111'
manifest=json.loads((B/'release-manifest.json').read_text())['files']
def selected(p):return p.endswith('.webp') and (p.startswith(('assets/castle-stories/','assets/hiring-stories/','assets/comic/','assets/shared-chrome/','assets/battle-exact/','assets/text-grid/shop-hero')) or p.startswith('previews/asset-') and '/assets/' in p)
def run(path):
 source=B/path;data=source.read_bytes()
 if len(data)<12000:return None
 im=Image.open(source).convert('RGBA');original=np.asarray(im).astype(np.float32);alpha=original[:,:,3];mask=alpha>32;threshold=38 if '/stories/' in path or path.startswith(('assets/castle-stories/','assets/hiring-stories/','assets/comic/')) else 40
 for quality in [80,85,90,94]:
  buf=io.BytesIO();im.save(buf,format='WEBP',quality=quality,method=6,exact=True);encoded=buf.getvalue()
  if len(encoded)>len(data)*.92:continue
  decoded=np.asarray(Image.open(io.BytesIO(encoded)).convert('RGBA')).astype(np.float32)
  if not np.array_equal(alpha,decoded[:,:,3]):continue
  error=(original[:,:,:3]-decoded[:,:,:3])[mask];mse=float(np.mean(error*error));psnr=99 if mse==0 else 10*math.log10(255*255/mse)
  if psnr<threshold:continue
  (R/path).write_bytes(encoded);return {'path':path,'before':len(data),'after':len(encoded),'quality':quality,'psnr':round(psnr,2),'size':list(im.size),'alphaUnchanged':True,'beforeSha256':hashlib.sha256(data).hexdigest(),'sha256':hashlib.sha256(encoded).hexdigest()}
 return None
paths=[p for p in manifest if selected(p)]
with ThreadPoolExecutor(max_workers=4) as pool:rows=[r for r in pool.map(run,paths) if r]
report={'files':rows,'before':sum(r['before'] for r in rows),'after':sum(r['after'] for r in rows),'note':'PSNR is an objective re-encoding guard, not a substitute for visual inspection. Same dimensions and exact alpha. Story >=38dB, UI >=40dB; saves at least8%.'}
(O/'images.json').write_text(json.dumps(report,indent=2));print({k:v for k,v in report.items() if k!='files'},'files',len(rows))
