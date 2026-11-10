"""Measure alpha bounds and export generated atlas cells; never redraw character art."""
from pathlib import Path
import json, subprocess, hashlib
from PIL import Image
ROOT=Path(__file__).resolve().parents[1]
records=[r for r in json.loads((ROOT/'assets/character-portraits/manifest.json').read_text())['characters'] if r['group']!='merc']
ids=[r['id'] for r in records];entries={}
for id in ids:
    master=ROOT/('designs/battle-identity-20261110' if id in ['gobi','electric-technician'] else 'designs/battle-comic-20261110')/f'{id}-master.png'
    image=Image.open(master).convert('RGBA');alpha=image.getchannel('A').load();frames=[]
    assert image.size==(1536,1024)
    for index in range(6):
        cx=index%3*512;cy=index//3*512
        points=[(x,y) for y in range(512) for x in range(512) if alpha[cx+x,cy+y]>=96]
        left=min(p[0] for p in points);right=max(p[0] for p in points);top=min(p[1] for p in points);bottom=max(p[1] for p in points)
        assert left>0 and right<511 and top>0 and bottom<511,(id,index,left,top,right,bottom)
        frames.append(dict(x=cx+left,y=cy+top,w=right-left+1,h=bottom-top+1,pivotX=256-left,pivotY=bottom-top))
    target=ROOT/'assets/character-motion'/f'{id}.webp'
    subprocess.run(['magick',str(master),'-quality','93',str(target)],check=True)
    f=frames[0];idle=target.with_name(id+'-idle.webp')
    subprocess.run(['magick',str(master),'-crop',f"{f['w']}x{f['h']}+{f['x']}+{f['y']}",'+repage','-quality','93',str(idle)],check=True)
    entries[id]={'name':next(r['name'] for r in records if r['id']==id),'group':'staff','artStyle':'main-comic','file':f'assets/character-motion/{id}.webp','fallback':f'assets/character-motion/{id}-idle.webp','faceReference':f'assets/character-portraits/{id}.webp','width':1536,'sheetHeight':1024,'height':frames[0]['h'],'frames':frames,'sha256':hashlib.sha256(target.read_bytes()).hexdigest()}
manifest={'version':1,'poses':['idle','blink','anticipation','attack','skill','recovery'],'characters':entries}
(ROOT/'assets/character-motion/manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n')
js="'use strict';\n// Full-body motion sheets derived from the current menu faces.\nObject.assign(MotionSheets, "+json.dumps(entries,ensure_ascii=False,indent=2)+");\nwindow.CharacterMotion=(()=>{const ids=Object.freeze("+json.dumps(ids)+");const known=new Set(ids);return Object.freeze({ids,has:id=>known.has(id),imagePath:id=>known.has(id)?'assets/character-motion/'+id+'-idle.webp':''})})();\n"
(ROOT/'assets/character-motion/manifest.js').write_text(js)
print(json.dumps({id:{'height':e['height'],'frames':len(e['frames'])} for id,e in entries.items()}))
