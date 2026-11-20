# DAR NEXT · Issue #1789 status snapshot

Stand: 2026-11-19 21:16 CET  
Scope: [Issue #1789](https://github.com/Sero91ak/dar-al-tawhid-site/issues/1789)  
Repository: `Sero91ak/dar-al-tawhid-site`

This is a dated checkpoint, not a completion claim. All feature PRs below remain open drafts and none is merged or released.

## Current reviewable changes

| Area | Review item | Verified | Still open |
|---|---|---|---|
| Xcode entry point and quiz resource | [PR #1812](https://github.com/Sero91ak/dar-al-tawhid-site/pull/1812) | Xcode project/scheme and app/test targets build; the native quiz resource is restored to 600 questions. Earlier focused unit run passed 5/5. | PR integration, full current-source audit, broad UI/scroll and accessibility coverage. |
| Qur'an audio interruption | [PR #1813](https://github.com/Sero91ak/dar-al-tawhid-site/pull/1813) | Combined simulator build succeeded; interruption resume policy is covered by the combined unit run. | Hardware route/phone/Siri interruption and playback continuity. |
| Reduce Motion in ayah focus | [PR #1814](https://github.com/Sero91ak/dar-al-tawhid-site/pull/1814) | Combined simulator build succeeded; motion policy is covered by the combined unit run. | UI run with system Reduce Motion enabled; audit of all other motion surfaces. |
| Location callback isolation | [PR #1815](https://github.com/Sero91ak/dar-al-tawhid-site/pull/1815) | MainActor handoff typechecks; authorization policy test compiles and passes. Follow-up commit imports CoreLocation explicitly. | Runtime permission changes and location updates on device. |
| Primary navigation | [PR #1816](https://github.com/Sero91ak/dar-al-tawhid-site/pull/1816) | iPhone 18 Pro Max / iOS 27.2: build-for-testing passed, unit tests 6/6, tab-to-Quiz UI test 1/1. | Full iPad, RTL, VoiceOver, Dynamic Type, and route restoration matrix. |

## Combined verification on 2026-11-19

On the DARNext development overlay containing the changes above, `xcodebuild build-for-testing` succeeded for the app, unit, and UI test targets on iPhone 18 Pro Max / iOS 27.2. The combined `DARNextTests` run reported 9/9 tests passed, including audio interruption, Reduce Motion, location authorization, and tab order.

Xcode then failed to import the activity log into the result bundle because the disk ran out of space. Therefore the console output is evidence for the nine test cases, but the xcresult is incomplete and this is not a complete standalone validation of each PR. No live release or merge was performed. At the end of the run approximately 100 MiB remained free, so no further simulator run was started.

## Scroll and hero evidence

Existing simulator result bundles show:

- iPhone 18 Pro Max / iOS 27.2: primary image-bearing tabs scroll test passed 1/1; six additional image-area tests passed 6/6.
- iPad Pro 13-inch M5 / iOS 27.2: the later hero-gap/title-collapse run passed 2/2. An earlier run failed the Beiträge title-collapse assertion; the later pass is the post-fix result.
- The tested gestures and bounded hero spacing establish interaction and layout behavior only. No valid frame-time or hitch measurement has established that scrolling is smooth. An iPhone test-manager communication failure was an infrastructure failure, not an observed app assertion.

## Whole-app inventory and source provenance

## DARNext branch provenance audit (2026-11-19)

The local development mirror has remote refs for several DARNext branches but is itself on unborn branch `codex/darnext-scroll-jank-20261117`: `git status` reports no commits and the app/project files as untracked. The mirror is about 7.4 GiB across 5,503 files. Its Git object store has several shallow remote refs, but there is no local commit identifying the untracked source tree. `git reflog --all` has no entry for the unborn scroll-jank branch. The available reflogs record only the Oct branch fetches and the later #1812/#1813 review worktrees; none links this untracked tree to a source commit.

Current relevant remote tips inspected:
- `codex/darnext-native-masterauftrag-20261024`: `4acec871f16d69e14a9ce51e154db7f8bde29d75`, 2026-10-25.
- `codex/darnext-apple-heritage-master-v1-20261024`: `59830126b81aac19bde78854acb387a49b604ee8`, 2026-10-24.
- `codex/darnext-apple-heritage-sync-20261024`: `5548020f3dc229fcfadbb0b15482698705988ca7`.
- `codex/darnext-p5-p9-20261024`: `c750bafd2121d8cd9c8ada6990b05cada20dfb1b`, 2026-10-24.
- `codex/darnext-phase4-wip-2026-10-23`: `b5a7d0c35ceae92a5e6ba7688ed4356ea1b14f42`, 2026-10-24.

GitHub comparison reports no common ancestor between the native-master branch and the Apple-Heritage, Apple-Heritage-sync, P5-P9, or Phase-4 branches. The native-master branch and current `main` are also diverged (21 commits unique to native-master and 1,829 unique to main at this audit). The Oct branches cannot be ranked by ancestry.

A blob comparison of seven important Swift files (RootShell, Dashboard, DARTheme, DARMotion, Posts, Quran, ContentSync) found that the local untracked snapshot matches none of the compared Oct branch blobs; the native-master branch does not contain the local `DARMotion.swift` path at all. This confirms source-tree differences, but not which untracked edits are intentional or which commit they descend from. A read-only whole-tree blob comparison against native-master counted 5,393 regular local files (excluding `.git` and symlinks) versus 15,561 tracked remote files: 226 path/blob matches, 100 same-path blobs with different content, 5,067 local-only paths, and 15,235 remote-only paths. This is a partial native-source export, not a complete checkout of the repository.

**Decision:** do not treat the Oct native branch or the untracked local mirror as the proven latest source. PRs #1812–#1817 remain separately reviewable experiments against the Oct native baseline. Reconcile the local snapshot's file inventory and preserved Git objects/reflogs with a known branch before transplanting further product edits. Keep the untracked source and 7.4-GiB object store intact.


The local, uncommitted checkout at `/Users/muwahhid91/Developer/DARNext-Local-20261117` contains a much larger native DARNext snapshot and a detailed feature matrix. It has no commit/HEAD and its files are untracked; its ancestry and exact equivalence to the GitHub PR base have not been established. Treat it as a protected source snapshot, not as proof that all of its changes are present on GitHub.

The current PRs are focused increments, not evidence that all app content, features, languages, and platform states are complete. The whole-app audit remains open for:

- feature-by-feature source/owner and branch provenance;
- a fully evidenced Start capsule → native detail → exact-origin return flow;
- scroll/frame profiling, not just scroll gestures;
- nine-language and RTL layout, VoiceOver, Dynamic Type, Reduce Motion runtime, iPad split view and narrow widths;
- Offline/delta content behavior, source-link integrity and cross-feature routes;
- real audio interruption and location-permission behavior;
- supported older iOS runtime coverage and release-gate documentation.

## Assistant public-entry audit (2026-11-19 21:21 CET)

The primary-tab PR removes the Assistant tab, but a source audit found two remaining visitor-facing routes: a Dashboard quick action and an “AI Assistant” tile in the Islamic Hub. The underlying transport is a local keyword matcher with canned replies; the inspected assistant files contain no generative model or external AI endpoint. These labels overstate the current prototype and precede the quality gates in #1791.

[PR #1817](https://github.com/Sero91ak/dar-al-tawhid-site/pull/1817), based on the primary-tab PR, removes those two public entry points while retaining the prototype source. It adds a UI assertion for both surfaces. The new UI assertion and build have not yet run due to low local disk space; PR #1817 remains draft pending Xcode verification.

## Next work

1. Preserve and reconcile the untracked local snapshot against the actual GitHub DARNext branch before treating either as the complete source of truth.
2. Continue isolated product PRs against confirmed source owners; prioritize the fully tested card/detail/return flow and the remaining user-visible defects.
3. When storage allows, run the current-source iPhone/iPad UI matrix and a supported Instruments or hardware frame-time trace. Report setup failures separately from app failures.
4. Keep Issue #1789 open until each required feature and QA gate has direct evidence. No main merge, public release, or paid service is authorized by this status document.


## Status addendum – 2026-11-20

- Current iPad Pro 13-inch M5 / iOS 27.2 scroll UI test across Start, Quiz, Posts, and Qurʾān passed 1/1. This verifies the test gestures and navigation, not frame pacing.
- Dashboard prayer-card → details → return passed 1/1 on the local snapshot after adding an accessibility container so the parent section identifier no longer masks the button identifier. This fix is not in the GitHub PR branch; the remote Dashboard source differs, so it was not copied over.
- A simultaneous Instruments Animation Hitches attempt produced no usable trace. The profiled UI run stopped after 216.9 seconds with ENOSPC while importing the result bundle; that bundle is incomplete and unreadable. The separate unprofiled scroll result remains the valid 1/1 gesture result.
- Local toolchain queried directly: Xcode 27.2 (27B52), iOS Simulator SDK 27.2, Swift 6.4.2; local DARNext project deployment target 17.0 and Swift language mode 5.0. The local source tree remains untracked and provenance-unresolved.
- Added [the whole-app roadmap](DAR-NEXT-ROADMAP-2026-11-20.md) and [the technology radar](TECH_RADAR.md) to PR #1812, alongside the updated feature matrix. PR #1812 is still Draft/open/mergeable; these are planning/review artifacts and do not close product or QA gates.
- Latest disk check: about 100 MiB available; no Xcode/test process running. The previously approved cache deletion command was rejected by the automatic execution protection, and no deletion was attempted through an alternate method.
- Next executable runtime gate remains current-head build/test for PR #1817, followed by the full current iPhone/iPad matrix and supported frame/hitch profiling when a writable test environment has sufficient capacity. No merge, release, or paid service.


## Test-source update – 2026-11-20

PR #1817 now waits for the relevant Dashboard quick-action and Hub worship sections before checking for assistant entry points. Its UI test also checks accessible button labels, reducing the risk that a missing/offscreen text query produces a false pass. The current remote XCTest source passes `xcrun swiftc -frontend -parse` when read from the PR branch. This is parser evidence only; Xcode target build and simulator execution remain unrun. PR #1817 remains Draft.
