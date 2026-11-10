"""Reproducible encoding only: preserve source icons and all font glyphs."""
from pathlib import Path
import json, subprocess
from fontTools.ttLib import TTFont
root = Path(__file__).resolve().parents[1]
font = root/'previews/asset-lobby-20261109/assets/BlackHanSans-Regular.ttf'
source = TTFont(font)
source.flavor = 'woff2'
target = font.with_suffix('.woff2')
source.save(target)
original, packed = TTFont(font), TTFont(target)
assert original.getBestCmap() == packed.getBestCmap()
assert original['hmtx'].metrics == packed['hmtx'].metrics
for name in ['item-grade', 'item-kind', 'item-king']:
    subprocess.run(['magick', str(root/f'designs/battle-optimization-20261110/{name}.webp'), '-resize', '256x256', '-quality', '90', str(root/f'assets/mobile/{name}.webp')], check=True)
print(json.dumps({'fontBefore':font.stat().st_size,'fontAfter':target.stat().st_size,'unicodeCharacters':len(original.getBestCmap()),'glyphs':len(original.getGlyphOrder()),'allGlyphsAndMetricsPreserved':True}))
