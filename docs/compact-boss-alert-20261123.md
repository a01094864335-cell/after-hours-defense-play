# Compact boss alert — option B

The boss notice uses a 56px navy strip below the battle HUD with a yellow warning diamond, wave number, localized commander name and existing commander art. It enters from beyond the right edge in 320ms and leaves through the right edge in 360ms. The existing 3.2-second game-time lifetime, pause behavior and five-wave trigger remain intact.

The notice blocks no input. Reduced-motion users get static appearance and a nonmoving dismissal. All copy remains HTML text; Korean and English use the same layout.

Validation: native battle presentation suite (5 scenarios), runtime impact checks, plus Korean/English captures at 320×568, 390×844 and 430×932. Captures verify 56px height, untruncated names, viewport fit after entrance and complete right-edge exit. Evidence: `qa/compact-alert-20261123/`.
