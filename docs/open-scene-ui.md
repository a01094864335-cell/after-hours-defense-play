# C · Open Scene

The game now uses the approved borderless C concept: broad cream, blue and mint
color fields, large character scenes, open lists and a single emphasized action.
Existing controls retain their IDs, listeners, save behavior and game rules.

## Runtime integration

- `ui.css` owns layout; `open-scene.css` supplies the new surface after narrative CSS.
- The retired `gameworld.css` surface is no longer loaded by `index.html`.
- `open-scene.js` inserts decorative art and a DOM wordmark, and maps interface
  icons to the new family. It does not replace game event handlers or save data.
- `battle-art.js` loads the new courtyard and translucent board pads. The canvas
  route and unit-grade backplates use the new palette. The 600 × 600 world,
  15 board cells, projection and pointer/keyboard coordinates remain unchanged.
- All words, prices, probabilities, names and levels remain DOM/canvas text.
  Assets contain no labels. Full English translation is a separate localization
  task; long English text and 130% font scaling are tested against the same UI.

## Assets

`assets/open-scene/manifest.json` lists all 36 runtime assets:

| Kind | Count | Format |
| --- | ---: | --- |
| Castle entrance, courtyard, training room, recruitment room | 4 | WebP |
| Approved lobby, result, training and recruitment cast scenes | 4 | WebP, alpha |
| Navigation and action icons | 25 | SVG |
| Idle, selected and merge-compatible board pads | 3 | SVG |

The four cast illustrations come from the approved concept artwork. Four new
room illustrations were generated in the same art family. Each sheet was split
into its authored quadrants and exported as WebP for runtime delivery. The SVG
icons and board pads are vector assets. Raster assets total approximately 1 MB.
`gallery.html` provides a visual index. The release builder includes every asset
and the asset manifest; the release test verifies every reference.

## Screen coverage

The actual game capture gallery is `qa/open-scene/index.html`. Captured states:

1. Lobby
2. Battle
3. Shift report and reward
4. Staff archive
5. Staff training
6. Recruitment shop
7. Hired staff detail
8. Duty roster editor
9. Support training
10. Item shop
11. First-hire story
12. Daily variation list
13. Menu and audio settings
14. Run records and stored formations
15. Story archive
16. Prologue
17. Equipment upgrades
18. Battle help
19. Leave confirmation
20. Pause overlay
21. Save transfer
22. Unhired staff list
23. Unhired staff detail
24. Support hero list
25. Support hero detail
26. Graduation hire selection
27. Staff trial
28. Recruitment result
29. Bonus and strategy selection

Tutorial dialogue, practice iframe and skill cut-ins also use the shared surface.
Narrative panels retain their authored images and use the new text/control trays.

## Verification

- `node --test tests/*.test.cjs`
- `node scripts/build-pages.cjs /tmp/open-scene-pages`
- `UI_GAME_ROOT=/tmp/open-scene-pages python -m unittest discover -s tests -p test_browser_smoke.py -v`
- `UI_BASE_URL=http://127.0.0.1:8004/ node scripts/capture-open-scene.cjs`
- `UI_BASE_URL=http://127.0.0.1:8004/ node scripts/check-open-scene-details.cjs`
- `UI_BASE_URL=http://127.0.0.1:8004/ node scripts/check-layout-stress.cjs`

The capture script supports `UI_WIDTH`, `UI_HEIGHT`, and `UI_QA_DIR`. Captures use
isolated GM profiles; all purchases, settlement, tabs and dialog actions use the
existing runtime functions. Combat outcome setup is used only to capture the
report state. No live user save is involved.
