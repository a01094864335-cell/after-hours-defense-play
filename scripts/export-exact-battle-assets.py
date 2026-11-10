"""Encode approved wordless art and extract transparent icon cells mechanically."""
from pathlib import Path
from PIL import Image
import subprocess, json
root=Path(__file__).resolve().parents[1]
source=root/'designs/battle-exact-20261110'
out=root/'assets/battle-exact'
def run(*args): subprocess.run(['magick',*map(str,args)],check=True)
run(source/'wordless-plate-master.png','-resize','948x1659!','-quality','91',out/'arena-ui.webp')
run(out/'arena-ui.webp','-crop','948x100+0+0','+repage','-quality','92',out/'hud.webp')
im=Image.open(source/'item-icons-master.png').convert('RGBA');width,height=im.size;assert width%3==0
for i,key in enumerate(['grade','kind','king']):
 size=width//3;b=im.getchannel('A').crop((i*size,0,(i+1)*size,height)).point(lambda a:255 if a>=64 else 0).getbbox();assert b
 x,y,right,bottom=b
 run(source/'item-icons-master.png','-crop',f'{right-x}x{bottom-y}+{i*size+x}+{y}','+repage','-resize','224x224','-background','none','-gravity','center','-extent','256x256','-quality','90',out/f'item-{key}.webp')
print(json.dumps({p.name:p.stat().st_size for p in out.glob('*.webp')}))
