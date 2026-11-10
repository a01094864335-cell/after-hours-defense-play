"""Compare old/new encoded frames at board and cutin display sizes (SSIM)."""
from pathlib import Path
from tempfile import TemporaryDirectory
import json, subprocess, sys
before = Path(sys.argv[1])
after = Path(__file__).resolve().parents[1]/'assets/character-motion'
old = json.loads((before/'manifest.json').read_text())['characters']
new = json.loads((after/'manifest.json').read_text())['characters']
rows = []
with TemporaryDirectory(prefix='battle-ssim-') as tmp:
    for id, record in old.items():
        for index, f in enumerate(record['frames']):
            g = new[id]['frames'][index]
            for height in [120, 335]:
                width = round(f['w']*height/f['h'])
                for root, frame, name in [(before,f,'old'),(after,g,'new')]:
                    subprocess.run(['magick',str(root/(id+'.webp')),'-crop',f"{frame['w']}x{frame['h']}+{frame['x']}+{frame['y']}",'+repage','-resize',f'{width}x{height}!','-background','#284cbd','-alpha','remove',str(Path(tmp)/(name+'.miff'))],check=True)
                result = subprocess.run(['magick','compare','-metric','SSIM',str(Path(tmp)/'old.miff'),str(Path(tmp)/'new.miff'),'null:'],capture_output=True,text=True)
                assert result.returncode in [0,1],result.stderr
                rows.append(dict(id=id,pose=index,displayHeight=height,ssim=float(result.stderr.strip().split()[0])))
summary = {str(height):dict(frames=sum(r['displayHeight']==height for r in rows),minimum=min(r['ssim'] for r in rows if r['displayHeight']==height),mean=sum(r['ssim'] for r in rows if r['displayHeight']==height)/sum(r['displayHeight']==height for r in rows)) for height in [120,335]}
print(json.dumps(dict(metric='SSIM on blue composite; 120px board at DPR2 and 335px cutin',summary=summary,frames=rows),indent=2))
