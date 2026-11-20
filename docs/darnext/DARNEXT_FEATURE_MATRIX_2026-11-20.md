# DAR NEXT Feature Matrix and Work Backlog

**Snapshot:** 2026-11-20  
**Repository:** `Sero91ak/dar-al-tawhid-site`  
**Audited source:** `codex/darnext-primary-deep-links-20261120` at `31c9e7932370d8dde5a6e65a9eee07173fd024d3`  
**Purpose:** Evidence-based inventory for Issue #1789. This is a development snapshot, not a release or acceptance report.

## Status key

- **Source present, acceptance open** — a DARNext source owner exists; the full runtime behavior, regressions, and device matrix have not been demonstrated for this snapshot.
- **In progress** — an open DARNext PR changes this area; its validation limits are called out below.
- **Not verified** — no current, requirement-wide test evidence is available. This does not assert that the feature is absent.
- **Out of scope here** — explicitly handled under another issue and must not replace the whole-app work in #1789.

A source file, parse check, unit test, simulator install, or screenshot proves only that specific evidence. It does not prove the whole feature or every platform.

## Current code and branch picture

The audited feature branch descends through the DARNext work currently represented by open draft PRs #1816 (agreed five tabs), #1817 (assistant entry gate), and #1820 (Quiz/Posts deep links). Related current work is **not all integrated into that branch**:

| PR | Area | Current review state / evidence limit |
|---|---|---|
| #1812 | Xcode entry point and quiz resources | Open draft; base for current DARNext stabilization stack. |
| #1813 | Qurʾān audio interruptions | Open draft. |
| #1814 | Qurʾān focus and Reduce Motion | Open draft. |
| #1815 | Location authorization actor safety | Open draft. |
| #1816 | Five-tab navigation | Open draft; prior recorded tests do not validate later PR heads. |
| #1817 | Hide unqualified assistant prototype entry points | Open draft. |
| #1820 | Quiz and Posts deep links | Open draft; audited source head above. |
| #1821 | Stop location updates after permission loss | Open draft, based on #1815. |
| #1822 | Accessible Posts card-to-detail zoom transition | Open draft, based on #1817; parser checks only, no Xcode build/UI acceptance. |
| #1823 | Global Qurʾān Stop clears player state | Open draft, based on #1813; parser checks only, no Xcode build/XCTest. |
| #1824 | Whole-app feature/branch matrix | Open draft documentation PR based on #1820; this inventory. |
| #1825 | Posts → approved Quiz context | Open draft based on #1820; parser checks and authored tests, no build/XCTest/UI run. |

These PRs are independent or stacked development changes, not a merged, integrated build. No live release is intended.

## Feature matrix

| Area | Current owner/evidence on audited DARNext branch | Status | Missing acceptance / next action |
|---|---|---|---|
| App shell and primary navigation | `DARNext/Shell/RootShell.swift`; #1816, #1817, #1820 | In progress | Build and exercise all five tabs and deep links on actual supported device sizes; verify back navigation and state retention. |
| Start / dashboard / hero | `DARNext/Features/Dashboard/DashboardView.swift` | Source present, acceptance open | Inspect actual first viewport, top inset/hero gap, scroll anchoring, image changes, and motion on compact/large iPhone and iPad. No all-page scroll acceptance is recorded here. |
| Posts list and detail | `DARNext/Features/Posts/PostsView.swift`, `DARNext/Data/MarkdownContentParser.swift`; #1822 | In progress | Verify source display, card open/return, stable scroll position, Reduce Motion fallback, VoiceOver and Dynamic Type on a running build. |
| Q Registry links | `Post.sourceURL` and canonical number parsed in `MarkdownContentParser.swift` | Data mapping absent in audited bundle | Audited all 64 bundled post Markdown files: 0 contains `canonicalQSourceNumber` or `qSourceNumber`. The parser can represent a mapping, but no post-to-Q destination is currently proven by these bundled records. Add only editorially verified existing IDs; do not infer or generate Q IDs. |
| Quiz | `DARNext/Features/Quiz/QuizView.swift`, `DARNext/Data/ContentResourceStore.swift`, `data/quiz-questions.json` | In progress (#1825) | Audited 600 questions; all 600 meet the published/approved/source-checked predicate. Exact topic match: 2 posts share `Brüderlichkeit` with `quiz-445`. Exact category match: 14 posts in Adab (7), Fiqh (4), Tawḥīd (1), Tazkiyah (2). #1825 adds a truthfully labeled topic-first/category-fallback entry. Parser checks pass; build and interaction tests remain open. |
| Qurʾān reader and navigation | `DARNext/Features/Quran/`; #1814 | In progress | Exercise reading, focus, bookmarks/progress and return state; validate RTL, text scaling, Reduce Motion and offline behavior. |
| Qurʾān global audio / mini-player | `DARNext/Features/Audio/`; #1813, #1823 | In progress | Run real play/pause/stop, interruption, queue, sleep timer and ownership tests; current #1823 has parser evidence only. |
| Prayer times and location | `DARNext/Features/Prayer/`; #1815, #1821 | In progress | Test permission grant/deny/revoke, app resume, location failure, manual location and refresh; do not infer device behavior from actor-level checks. |
| Qibla | `DARNext/Features/Qibla/` | Source present, acceptance open | Verify sensor availability, calibration, permission/error states, orientation and accessibility on device/simulator. |
| Calendar | `DARNext/Features/Calendar/` | Source present, acceptance open | Verify date calculations, navigation, locale/RTL and relevant empty/error states. |
| Library | `DARNext/Features/Library/` | Source present, acceptance open | Verify books/publications resource decode, search/filter, detail, source links and offline behavior. |
| Duʿāʾ and Dhikr | `DARNext/Features/Dua/`, `DARNext/Features/Dhikr/` | Source present, acceptance open | Verify content/provenance, counters or saved state if present, audio/haptics if present, and accessibility. |
| Search | `DARNext/Features/Search/` | Source present, acceptance open | Exercise actual indexed sources, ranking, empty/error results, keyboard/focus, cross-links and offline search. |
| Local progress, bookmarks, restoration | Distributed across Quran, Quiz and shell | Not verified | Map the actual persistence owner and test relaunch, navigation return, scroll restoration, migration and data loss cases before claiming completion. |
| Content import, sync and offline fallback | `DARNext/Data/DARNextContentSyncService.swift`, `LocalContentRepository.swift`, `ContentResourceStore.swift` | Source present, acceptance open | Test canonical version/delta, malformed or revoked content, network loss, cache freshness, and local fallback; prove source version and recovery behavior. |
| Themes, nine adult locales, RTL | `DARNext/DesignSystem/Tokens/DARTheme.swift` and localization/content owners | Not verified | Audit de/ar/en/tr/ku/ckb/bs/fr/es for every relevant surface, long strings, RTL direction, theme contrast, and persistence. |
| Accessibility and motion | Design system; #1814, #1822 | In progress | Run VoiceOver, Dynamic Type, contrast and Reduce Motion checks on built UI. Parser tests are not accessibility acceptance. |
| Adaptive iPhone/iPad/fold layouts | SwiftUI feature and shell owners | Not verified | Check portrait/landscape, safe areas, keyboard, split view and narrow/wide panes; record actual screenshots and interaction results. |
| Performance / scroll smoothness | Dashboard and feature scroll owners | Not verified | Capture repeatable Instruments/scroll evidence for image-heavy screens; inspect hitch data and preserve user-visible page state. |
| Assistant / DĀR Intelligence | Gated by #1817; separate #1791 | Out of scope here | Keep unqualified assistant entry points hidden. #1791 may proceed as a separate research/prototype track and must not displace whole-app work or introduce paid/live AI. |

## Device and test evidence at snapshot time

- The local iPhone 18 Pro Max simulator device (iOS 27.2, UDID `0E6FFE09-906B-4FF8-9653-B8FE853F7239`) is booted; the DARNext bundle is installed and `simctl launch` returned a running PID.
- A `simctl` screenshot was captured from that installed app. Its binary provenance was not matched to the audited GitHub commit, so it is visual evidence of an installed DARNext build only, not proof for the PR heads.
- The active Xcode reports 27.2, but the installation contains no `Simulator.app` in the searched Xcode/Application/Developer locations. Therefore no Simulator GUI window can be opened from this installation. This does not prevent CoreSimulator command-line launch/screenshot, but it limits interactive GUI inspection.
- Xcode build and XCTest have **not** been run for the changes in #1820, #1821, #1822, #1823, or #1825. #1825 includes an authored UI path test, but it has not been executed. Swift parser checks on some PRs are not a build or runtime acceptance.
- Disk space was 127 MiB available at the latest check; an attempt to stage parser inputs failed with ENOSPC. No additional caches, app data, simulator devices, or user files were removed.

## Prioritized continuation

1. **Restore a reviewable simulator surface or use the available command-line CoreSimulator honestly.** Locate/install the missing Apple Simulator app without deleting project or user data; until then, use only tests that can run safely and record the limitation.
2. **Close the visible Start/hero and scroll defects.** Reproduce first viewport spacing and scroll jitter on image-bearing screens, identify the actual SwiftUI owner per screen, then fix and measure the affected screens. Keep this work bounded to DARNext owners.
3. **Complete one verified context path:** #1825 implements the data-supported Quiz portion (exact topic when available, otherwise an explicitly labeled matching category). The canonical Q portion remains blocked on adding editorially verified existing Q IDs to the DARNext post records; 0/64 audited records currently contain one. Then run the authored UI flow and verify scroll restoration.
4. **Run the media/regression pass:** Qurʾān play/pause/stop/interruption, prayer permission loss, deep links, quiz completion, content offline fallback and card-to-detail motion.
5. **Expand the acceptance matrix:** iPhone small/large, iPad split/landscape, RTL/locales, VoiceOver, Dynamic Type, Reduce Motion, and Instruments performance. Record each exact build, device, route, and result.
6. **Maintain this matrix and a change log per focused PR.** Keep all work in draft/review branches until evidence is sufficient; do not deploy or merge as a substitute for device acceptance.

## Limits

This document records source evidence and open verification. It does not claim that DARNext is complete, that every listed module works, that all screen scroll behavior has been tested, or that a new PR is present in the installed simulator app.
