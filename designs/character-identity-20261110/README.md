# Character identity masters

Generated with image generation using the approved lobby illustration as the style and primary identity reference. Additional characters retain identity cues from their existing portraits. These four transparent 1536×1024 sheets each contain six heads in a 3×2 grid.

Runtime exports are 512×512 transparent WebP files under `assets/character-portraits/`. The manifest records cell coordinates, names, IDs, references, identifying features, and output checksums. Source sheets are archival and excluded from the game deployment.

Re-export after an intentional master change: `node scripts/export-character-portraits.cjs`. ImageMagick is required. This performs mechanical cell extraction, transparent padding and encoding; creative image edits should use the image generation tool with the master references.
