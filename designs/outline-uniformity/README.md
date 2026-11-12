# Staff outline consistency

## Scope

The 17 existing staff characters retain their original artwork, poses, scale and gameplay. The 13 sheets with baked sticker borders have 78 manually traced vector masks, one per pose. The other four use their existing unmasked silhouette. Source WebP files and the motion manifest are unchanged, including Gobi's 0.88 board scale and the legless ghost/slime designs.

## Rendering

`outlines.js` is generated from reviewed JSON using `node scripts/export-outline-masks.cjs`. Masks are tied to each source SHA; replacement artwork never inherits an old clipping mask. Body and separate decorative effects can have separate outline paths. White body areas, clothing, tools, and effects are not removed by color classification.

Board outlines use a common 1.25 CSS-pixel radius. Larger displays use the existing height-based radius capped at 3 pixels. Small original antialiased fringes and internal/decorative ink lines are intentionally retained where removing them would damage artwork; this is not a claim of mathematically identical line thickness at every pixel.

Display-sized 2x masks are cached with a 128-entry / 4M-pixel limit; output dimensions and mask/source hashes form the cache key. Missing Path2D or stale source hashes fall back to original art. Low-alpha dust is excluded only from the derived white-edge silhouette, not the colored artwork.

## Review and validation

- All 78 traced poses reviewed at enlarged cutin and production staff-size board scale; the four unmasked characters are included in render regression coverage.
- `scripts/capture-outline-runtime.cjs` renders actual Motion.draw before/after galleries: 17 characters × 6 poses × 2 sizes, 204 renders per version. These are isolated rendering comparisons, not gameplay screenshots.
- `scripts/review-outline-masks.cjs` supplies color-loss diagnostics as a supplement to visual review, not a replacement for it. Minor antialias losses at outer ink boundaries can remain.
- Node tests assert 13 source-matched entries / 78 masks, safe fallback, preserved Gobi scale, cache reuse and size separation.
- Chromium CI renders all 102 poses at board/cutin sizes, checks nonblank output and cache reuse, and uploads per-character galleries. Original-image provenance assertions follow derived canvases rather than incorrectly treating an offscreen canvas as a missing sprite.
- Existing browser regression and Pages build remain required before deployment.

No rank-five redesigns or gameplay changes are included.
