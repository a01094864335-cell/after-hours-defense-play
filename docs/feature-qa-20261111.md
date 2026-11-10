# Whole-game repeated QA

Scope: user-requested audit of real game features, each at least ten independent repetitions where feasible. Reference main: `e1931a10a0f4c98cea450b2d848eefee9e912786`. Approved artwork/layout are preserved. All data is isolated test storage, never player profiles.

## Evidence layers

1. `tests/feature-combat.test.cjs`: 87 named scenarios × 10 independently booted VM fixtures, seeds 71001–71010. All 17 staff passive/active abilities, seven supports, seven bosses, enemy skills, summon/start/merge/upgrades, resource guards, pause, waves, defeat/settlement, perks, tactical reposition/builds/resume, mines and decoys, plus all three non-tutorial consumables (success/failure/invalid-input/storage rollback/stock/pause/end/duplicate guards).
2. `tests/feature-progression.test.cjs`: 192 variants × 10 independent VMs, seeds 4101–4110, explicit draws for pack outcomes. Three items, two training tracks through level 30, eleven targeted staff, seven supports, all 24 pack outcomes, duplicates/pity, deck restrictions, three presets/starters, fifteen daily modifiers and Seoul date boundary, forty castle stories, nineteen hiring comics, reward/history/idempotency.
3. `tests/feature-storage-audio.test.cjs`: 31 groups × 10 independent repetitions (30 behavioral groups plus one PCM asset-validation group), repeated state and mocked browser-policy tests for wallet validation, backups/rollback/recovery, active runs, GM isolation, profiles, session ownership, orientation, audio preferences/lifecycle and tutorial lessons. Named attempts are emitted in TAP. Audio API mocks do not establish audible sound quality.
4. `tests/run_feature_qa.py`: discovers every actual browser TestCase in `test_*.py` except the separate modal screenshot inventory. Five CI shards each run every scenario twice, for attempts 1–10. Each scenario uses fresh contexts. No automatic retry hides failures. JSON records source commit, scenario, attempt, status, elapsed time, actual context viewports/touch/mobile settings and failure screenshots. Fixture errors and never-run attempts are explicit. New end-to-end journeys include backup download/upload/restore, every collected story, and Back/Forward lock recovery.
5. Existing modal inventory: 51 real UI states across four Chromium viewport sizes plus focused WebKit states. It remains an independent geometry/visual review layer, not ten functional repetitions.

## Confirmed defect and minimal repair

Backup file reading is asynchronous. Previously a user could validate old textarea contents while a newly chosen file was still loading. The loaded file then replaced the visible text without invalidating the old Restore preview. File read failures also escaped without a readable status, and older reads could overwrite a newer selection.

`save-transfer-ui.js` now versions outstanding reads; new selections, manual edits and closing invalidate pending results. A completed file read invalidates any preview again. Read errors produce a recoverable message. No art, layout, prices, balance or saved-data format changes.

The pre-fix targeted suite reproduced the first two issues in twenty failing repetitions. Post-fix tests cover stale preview, overlapping reads, errors, edits and dismissal. Preserved pre-fix and focused post-fix TAP evidence is in `qa/feature-regressions/backup-file-race-before.tap` (20 failures) and `backup-file-race-after.tap` (40 passes). Three real-DOM race/error/interruption scenarios are also part of the ten-repeat browser runner.

## Commands and artifacts

- `node --test --test-reporter=tap tests/*.test.cjs`
- `node scripts/build-pages.cjs /tmp/feature-game-pages`
- `UI_GAME_ROOT=/tmp/feature-game-pages UI_CHROMIUM_PATH='' FEATURE_QA_SHARD=0 python tests/run_feature_qa.py` (repeat shards 0–4)
- CI artifacts: `feature-qa-<run-id>-<shard>/report.json` and failure PNGs; `modal-inventory-<run-id>` for visual inventory.

Deployment requires both the existing runtime job and all five feature QA shards. Browser and release claims apply only to the exact passing CI commit, never merely to prepared tests.

## Limits and honest gaps

VM passes assert game state, not real DOM, touch behavior, paint or sound. Seeded/controlled state covers important branches, not every possible combinatorial board, training, boss, item and modifier interaction or unlimited-duration play. Browser tests use Chromium mobile viewport/touch emulation; separate WebKit coverage does not equal testing on physical iPhones/Android phones. OS-native file pickers, device-specific audio quality, thermal/battery impact, prolonged offline backgrounding and all accessibility assistive technologies still require physical-device validation. The local Chromium process cannot launch in this execution environment, so local browser attempts are blocked, not passed; GitHub Actions is the supported browser execution route.

Some original tests used outdated fixtures or selectors; any correction must preserve the behavioral assertion and be recorded separately from production defects. Never count a screenshot, retry or fixed test fixture as an independent functional pass.

## First browser pass findings (initial head 0bd04c7)

Run `42859535167`, shard 4, attempts 9–10: 130 passed, 16 failed, 8 errors, no skipped or unrun tests (154 scenario attempts). This initial version had 77 scenarios, not the later 80. Artifact `13785705413` contains the report and actual failure screenshots.

- **Real hiring-story race:** a queued native dialog close event cleared a newly reopened story and moved focus away. Next then stayed on page 1. The close handler now ignores obsolete close events when the dialog is open again. Ten independent mocked queued-event repetitions failed before and passed after; the original real-browser rapid reopen stress is unchanged. Evidence: `qa/feature-regressions/hiring-reopen-before.log` and `hiring-reopen-after.log`.
- **Unnecessary hidden-shop work:** presentation refresh rewrote already-present panel/header classes. Guarded class additions avoid those writes without changing visuals. A ten-fixture repeated-refresh regression verifies idempotence. The browser assertion still requires zero closed-shop mutations and now includes mutation details on failure.
- **Readable help:** skill instructions measured 13px against the existing 14px minimum. A narrowly scoped 14px rule restores that minimum; no illustration/layout redesign.
- **Obsolete test surfaces:** Android bounds, training/roster controls and portrait checks referenced hidden legacy nodes. They now target the approved visible shadow-root interfaces and loaded portrait images. Speed accessibility text is checked against its current exact label.
- **Approved scrolling versus old fixed-height assumptions:** recruitment and results use whole-sheet scrolling on short phones. Tests now require the action to be reachable by real scrolling, within viewport and every clipping ancestor, and actually clickable, while retaining focus/dismissal/data assertions. Perk targets use the actual scrolling behavior. No forced clicks, skipped cases, reduced bounds or shrunken artwork hide failures.

All changed browser tests must pass ten fresh attempts on a new candidate before these findings are closed. Earlier failures remain evidence, not counted as passing retries.


## Second browser pass (head 6cdf3d8)

Run `42862362664`, merge candidate `97a7dbe0fa504833aa57f928ce0cb755342ca777`: all 800 attempts ran, 780 passed, 10 failed and 10 errored; no skipped/unrun attempts. Each of five reports recorded 156 pass, 2 fail, 2 error. Existing runtime, modal inventory and smoke checks passed.

All previous functional fixes passed their ten browser repetitions. Remaining failures were confined to training: the portrait test selected an intentionally hidden Back control instead of visible Close, and the visible Close's 44px hitbox extended 1px above a short phone viewport. The test now selects each screen's actual visible close button. Moving the training Close down 4px preserves artwork and its 44px target while bringing it fully into bounds; the strict viewport assertion is unchanged. Another complete ten-repeat run is required before release.
