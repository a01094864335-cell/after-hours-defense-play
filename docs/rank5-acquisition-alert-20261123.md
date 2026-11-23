# ★5 acquisition alert

The approved navy top strip gains a warm gold variant for newly acquired ★5 units. It shows five stars, the character's localized name and awakening label, and the existing portrait. The corresponding unit gets a short gold ring and a few canvas sparkles. No additional image downloads are introduced.

Successful merges and staff reward grants call the presentation hook with the actual resulting unit. Only exact rank five qualifies: selection, atlas loading, save restoration, unsuccessful merges and rank six/seven do not announce. Repeated calls for the same pending/current unit are ignored. The queue keeps at most six pending events.

The strip uses the boss alert's 56px geometry and right-side entrance/exit. Its lifetime is 2.8 seconds of active presentation time. Boss warnings have priority; pause, dialogs, hidden tabs and other screens suspend the announcement. Reset clears active and queued announcements. Character rings follow the unit reference, so a removed or replaced unit cannot leave a ring on the old cell. Reduced motion removes sliding and sparkles; low power reduces sparkles.

Validation: actual successful ★4→★5 merge in Korean and English, 320×568 / 390×844 / 430×932; localized name fit, existing portrait source, boss priority, pause/resume, full right-edge exit, no selection replay and reset cleanup. Existing combat presentation checks remain in the same suite. Evidence: `qa/rank5-alert-20261123/`.
