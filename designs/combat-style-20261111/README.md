# Combat comic masters

Generated with the image generation tool, using `designs/battle-comic-20261110/goblin-guard-master.png` as the style reference and each previous actor sheet as its identity reference. `sources.json` records the generation artifact names; optimized lossless WebP masters retain the generated RGBA pixels. Six poses use a 3×2 layout. Five masters were generated again to ensure their attack props and effects never cross a tile boundary.

Run `python scripts/export-combat-comic.py` from the repository to crop and pack runtime atlases. The exporter measures alpha ≥96, requires transparent margins, preserves each pose's aspect ratio and a common character scale, and creates matching idle fallbacks. Source masters are not published in the game build. `legacy-manifest.json` preserves the previous 20 actor definitions for identity and size comparisons.

`heads-master.webp` contains 4×2 head cells: ward, accountant, rescue, chikchik / banchang, coco, q, demon king. Extracted support heads retain their canonical `assets/character-portraits/merc-*.webp` paths. The new king head is `assets/combat-comic/demon-king-head.webp`.

Head generation artifact: `exec-a97e086b-87d0-40bb-b202-5162e0b44d68.png`. The exporter also updates the eight heads, canonical portrait metadata, and support cache revisions.
