"""Build native SVG viewports and fixed-corner frames from approved artwork.
No painted labels are used as runtime text, prices, or character records.
"""
from pathlib import Path
import base64
import re

ROOT = Path(__file__).resolve().parents[1]
ASSETS = ROOT / 'assets/reference-ui'
REFERENCES = ROOT / 'designs/skin-v2/screens-gobi-v2'


def embedded(name):
    return re.search(r'href="(data:[^"]+)"', (ASSETS / name).read_text()).group(1)


def frame(name, rect, corner, uri, gold=False):
    x, y, width, height = rect
    k = corner
    colors = ('#ffe593', '#efae37') if gold else ('#352340', '#1d152b')
    parts = [f'<svg preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg" width="{width}" height="{height}" viewBox="0 0 {width} {height}"><defs><image id="art" width="941" height="1672" href="{uri}"/><linearGradient id="fill" x2="1" y2="1"><stop stop-color="{colors[0]}"/><stop offset="1" stop-color="{colors[1]}"/></linearGradient></defs><rect width="{width}" height="{height}" fill="url(#fill)"/>']
    slices = [
        (x,y,k,k,0,0,k,k), (x+width-k,y,k,k,width-k,0,k,k),
        (x,y+height-k,k,k,0,height-k,k,k), (x+width-k,y+height-k,k,k,width-k,height-k,k,k),
        (x+width/2,y,20,k,k,0,width-2*k,k), (x+width/2,y+height-k,20,k,k,height-k,width-2*k,k),
        (x,y+height/2,k,20,0,k,k,height-2*k), (x+width-k,y+height/2,k,20,width-k,k,k,height-2*k)
    ]
    for index, (sx,sy,sw,sh,dx,dy,dw,dh) in enumerate(slices):
        if name == 'archive-slot-frame.svg' and index == 1:
            # The source top-right check badge overlaps its corner: mirror the clean left corner.
            parts.append(f'<g transform="translate({width} 0) scale(-1 1)"><svg x="0" y="0" width="{k}" height="{k}" viewBox="{x} {y} {k} {k}" preserveAspectRatio="none"><use href="#art"/></svg></g>')
        elif name == 'archive-deck-frame.svg' and index == 5:
            # Source labels touch the bottom edge. Mirror the clean top strip instead.
            parts.append(f'<g transform="translate(0 {height}) scale(1 -1)"><svg x="{k}" y="0" width="{width-2*k}" height="{k}" viewBox="{x+width/2} {y} 20 {k}" preserveAspectRatio="none"><use href="#art"/></svg></g>')
        else:
            parts.append(f'<svg x="{dx}" y="{dy}" width="{dw}" height="{dh}" viewBox="{sx} {sy} {sw} {sh}" preserveAspectRatio="none"><use href="#art"/></svg>')
    (ASSETS / name).write_text(''.join(parts) + '</svg>')


def viewport(name, source, top, height):
    original = REFERENCES / (source + '.png')
    uri = ('data:image/png;base64,' + base64.b64encode(original.read_bytes()).decode()) if original.exists() else embedded(name)
    (ASSETS / name).write_text(f'<svg xmlns="http://www.w3.org/2000/svg" width="941" height="{height}" viewBox="0 {top} 941 {height}" preserveAspectRatio="none"><image width="941" height="1672" href="{uri}"/></svg>')


archive = embedded('archive-header.svg')
frame('archive-card-frame.svg', (20,738,445,192), 24, archive)
frame('archive-deck-frame.svg', (8,342,925,304), 40, archive)
frame('archive-slot-frame.svg', (48,432,157,145), 16, archive)
frame('grid-button-violet.svg', (319,264,305,80), 18, archive)
frame('grid-button-gold.svg', (125,1265,690,155), 30, embedded('lobby-scene.svg'), gold=True)
viewport('grid-market-mercs.svg', '06-shop-mercs', 0, 550)
for name, source, top, height in [
    ('first','14-story-first-shift',170,1040),
    ('invasion','15-story-invasion',250,1000),
    ('recruitment','16-story-recruitment',140,930),
    ('night','17-story-night-duty',180,1020),
]:
    viewport('grid-story-' + name + '.svg', source, top, height)


def live_hud(name, height, rectangles):
    """Remove painted sample balances/close controls behind the real interactive HUD."""
    uri = embedded(name)
    holes = ''.join(f'<rect x="{x}" y="{y}" width="{w}" height="{h}" fill="black"/>' for x,y,w,h in rectangles)
    (ASSETS / name).write_text(f'<svg xmlns="http://www.w3.org/2000/svg" width="941" height="{height}" viewBox="0 0 941 {height}" preserveAspectRatio="none"><defs><mask id="live-hud" maskUnits="userSpaceOnUse"><rect width="941" height="1672" fill="white"/>{holes}</mask></defs><image width="941" height="1672" href="{uri}" mask="url(#live-hud)"/></svg>')

live_hud('market-scene.svg', 580, [(566,35,256,100),(818,35,110,100)])
live_hud('grid-market-mercs.svg', 550, [(535,3,280,100),(815,3,115,105)])
