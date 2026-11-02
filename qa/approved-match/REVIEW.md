# Approved lobby and battle implementation

Approved reference: review/approved-reference.png. Implemented captures: lobby-final.png and battle-final.png (390×756). Additional responsive evidence: 320×568, 390×844, 430×932 folders.

Visual review corrected duplicate shortcut labels, floating title caption, missing party row, reversed party label, empty board margins, missing back arrow, and SP capsule height. The lobby uses clean scene artwork with independently rendered controls. Its unified dock follows daily event → party → mode → primary action → navigation. Battle follows HUD → boss strip → live 5×3 board → summon → skill → items → dialogue.

The composition follows the approved reference; it is not a pixel-identical bitmap reproduction. Clean generated scene details and existing employee sprites differ, and live values (wave, SP cost, coins, daily variation and party) remain dynamic. No gameplay values or game flow changed.

Validation: 30 runtime tests passed; 96 screen states across three mobile sizes had no button horizontal overflow, viewport escape, or runtime errors. All 15 board cell centers round-trip through pointer conversion after responsive canvas resizing. Pages export includes the new skin, controller and scene.

Text constraints: shortcut labels single line, 4 Korean characters; GNB single line, 5 characters; primary action single line within 260×32px at 390px width (22px font); party name single line within 34×12px (9px font); daily event row label 150×18px (12px font); companion label single line within 150×18px; battle summon single line within 175×28px (18px font); item labels single line within each 110×34px button (10px font); battle dialogue may wrap to two lines. All labels remain live system text for localization; no localized copy is baked into control assets.
