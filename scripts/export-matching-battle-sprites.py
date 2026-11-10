"""Mechanically pack approved frames with gutters; never redraw character art."""
from pathlib import Path
from tempfile import TemporaryDirectory
import json, subprocess, hashlib, math
from PIL import Image
ROOT = Path(__file__).resolve().parents[1]
SCALE, GUTTER, QUALITY = .75, 2, 90
records = [r for r in json.loads((ROOT/'assets/character-portraits/manifest.json').read_text())['characters'] if r['group'] != 'merc']
entries = {}
for record in records:
    id = record['id']
    master = ROOT/('designs/battle-identity-20261110' if id in ['gobi', 'electric-technician'] else 'designs/battle-comic-20261110')/f'{id}-master.png'
    image = Image.open(master).convert('RGBA')
    assert image.size == (1536, 1024)
    alpha = image.getchannel('A')
    originals = []
    for index in range(6):
        cx, cy = index % 3 * 512, index // 3 * 512
        bounds = alpha.crop((cx, cy, cx+512, cy+512)).point(lambda p: 255 if p >= 96 else 0).getbbox()
        assert bounds is not None
        left, top, right, bottom = bounds
        assert 0 < left < right < 512 and 0 < top < bottom < 512, (id, index, bounds)
        originals.append(dict(x=cx+left, y=cy+top, w=right-left, h=bottom-top, pivotX=256-left, pivotY=bottom-top-1))
    sizes = [(math.ceil(f['w']*SCALE), math.ceil(f['h']*SCALE)) for f in originals]
    columns = [max(sizes[i][0], sizes[i+3][0])+GUTTER*2 for i in range(3)]
    rows = [max(h for _, h in sizes[i:i+3])+GUTTER*2 for i in [0, 3]]
    width, height = sum(columns), sum(rows)
    frames = []
    target = ROOT/'assets/character-motion'/f'{id}.webp'
    with TemporaryDirectory(prefix='battle-atlas-') as tmp:
        pack = ['magick', '-size', f'{width}x{height}', 'xc:none']
        for index, (f, (w, h)) in enumerate(zip(originals, sizes)):
            x = sum(columns[:index % 3])+GUTTER
            y = sum(rows[:index // 3])+GUTTER
            crop = Path(tmp)/f'{index}.png'
            subprocess.run(['magick', str(master), '-crop', f"{f['w']}x{f['h']}+{f['x']}+{f['y']}", '+repage', '-resize', f'{w}x{h}!', str(crop)], check=True)
            pack += [str(crop), '-geometry', f'+{x}+{y}', '-composite']
            frames.append(dict(x=x, y=y, w=w, h=h, pivotX=f['pivotX']*SCALE, pivotY=f['pivotY']*SCALE))
        subprocess.run(pack+['-quality', str(QUALITY), str(target)], check=True)
        # The fallback uses the same resized idle pixels, not a second decode of a full sheet.
        subprocess.run(['magick', str(Path(tmp)/'0.png'), '-quality', str(QUALITY), str(target.with_name(id+'-idle.webp'))], check=True)
    entries[id] = dict(name=record['name'], group='staff', artStyle='main-comic', file=f'assets/character-motion/{id}.webp', fallback=f'assets/character-motion/{id}-idle.webp', faceReference=f'assets/character-portraits/{id}.webp', width=width, sheetHeight=height, height=originals[0]['h']*SCALE, frames=frames, sha256=hashlib.sha256(target.read_bytes()).hexdigest())
manifest = dict(version=2, export=dict(scale=SCALE, gutter=GUTTER, quality=QUALITY, layout='tight-columns'), poses=['idle','blink','anticipation','attack','skill','recovery'], characters=entries)
(ROOT/'assets/character-motion/manifest.json').write_text(json.dumps(manifest, ensure_ascii=False, indent=2)+'\n')
ids = list(entries)
js = "'use strict';\n// Tightly packed full-body frames; source masters remain unchanged.\nObject.assign(MotionSheets, "+json.dumps(entries, ensure_ascii=False, indent=2)+");\nwindow.CharacterMotion=(()=>{const ids=Object.freeze("+json.dumps(ids)+");const known=new Set(ids);return Object.freeze({ids,has:id=>known.has(id),imagePath:id=>known.has(id)?'assets/character-motion/'+id+'-idle.webp':''})})();\n"
(ROOT/'assets/character-motion/manifest.js').write_text(js)
print(json.dumps(dict(characters=len(entries), atlasBytes=sum((ROOT/e['file']).stat().st_size for e in entries.values()), rgbaDecodedBytes=sum(e['width']*e['sheetHeight']*4 for e in entries.values()))))
