# UI review regression

Use a disposable local browser profile and a local game server. These scripts seed test data with GM mode and must not run against a player's existing browser session. Install Playwright and Chromium first.

```sh
UI_BASE_URL=http://127.0.0.1:8004/ UI_QA_DIR=qa/ui-review-latest node scripts/ui-review/verify-fixes.cjs
UI_BASE_URL=http://127.0.0.1:8004/ UI_QA_DIR=qa/ui-review-latest/layout AUDIT_MODES=ko100,ko130,en-real130 node scripts/ui-review/run-audit.cjs
UI_BASE_URL=http://127.0.0.1:8004/ UI_QA_DIR=qa/ui-review-latest/canvas node scripts/ui-review/run-canvas-assets.cjs
```

`AUDIT_VIEWPORT=320x568` selects one viewport. `AUDIT_CASE_FILTER` selects case IDs by regular expression. `AUDIT_CAPTURE_READERS=1` includes narrative readers in screenshots. Default normal coverage is 407 cases per viewport; stress coverage is 101 representative cases per viewport. Scroll positions and expanded details produce multiple geometry evaluations per case.

The English fixture tests layout capacity; it is not production localization. Geometry candidates need visual review: cropped story-cover source images and the king entrance intentionally intersect other bounds. The canvas audit measures actual nontransparent sprite pixels, not just the transparent source rectangles. Staff/status collisions are defects; the large king entrance deliberately covers the board.

The durable November 9 report and reviewed classifications are in `qa/ui-review-fixes/validation-summary.json` and `docs/ui-review-fixes-2026-11-09.md`. Raw measurement JSON and additional captures remain in the local QA output, rather than the deployment package.
