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

The local, uncommitted checkout at `/Users/muwahhid91/Developer/DARNext-Local-20261117` contains a much larger native DARNext snapshot and a detailed feature matrix. It has no commit/HEAD and its files are untracked; its ancestry and exact equivalence to the GitHub PR base have not been established. Treat it as a protected source snapshot, not as proof that all of its changes are present on GitHub.

The current PRs are focused increments, not evidence that all app content, features, languages, and platform states are complete. The whole-app audit remains open for:

- feature-by-feature source/owner and branch provenance;
- a fully evidenced Start capsule → native detail → exact-origin return flow;
- scroll/frame profiling, not just scroll gestures;
- nine-language and RTL layout, VoiceOver, Dynamic Type, Reduce Motion runtime, iPad split view and narrow widths;
- Offline/delta content behavior, source-link integrity and cross-feature routes;
- real audio interruption and location-permission behavior;
- supported older iOS runtime coverage and release-gate documentation.

## Next work

1. Preserve and reconcile the untracked local snapshot against the actual GitHub DARNext branch before treating either as the complete source of truth.
2. Continue isolated product PRs against confirmed source owners; prioritize the fully tested card/detail/return flow and the remaining user-visible defects.
3. When storage allows, run the current-source iPhone/iPad UI matrix and a supported Instruments or hardware frame-time trace. Report setup failures separately from app failures.
4. Keep Issue #1789 open until each required feature and QA gate has direct evidence. No main merge, public release, or paid service is authorized by this status document.
