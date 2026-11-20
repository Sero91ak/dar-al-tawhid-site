# DARNext Technology Radar

Stand: 2026-11-20  
Scope: DARNext and GitHub Issue [#1789](https://github.com/Sero91ak/dar-al-tawhid-site/issues/1789)  
Status: working inventory, not an upgrade plan or release approval

## Verified toolchain snapshot

- Local Xcode: **27.2**, build **27B52**.
- Local iOS Simulator SDK: **27.2**.
- Local Swift compiler: **Swift 6.4.2**; the checked-in project currently sets Swift language mode **5.0**.
- The local DARNext project declares **iOS 17.0** for its app and test targets.
- The current local checkout is an untracked, unborn source snapshot. Its ancestry is unresolved and it differs from the GitHub DARNext PR base. Treat its toolchain/API inventory as local evidence only; do not attribute every item below to the GitHub branch.

## Current technology inventory

| Area | Observed state | Radar | Gate before broader use |
|---|---|---|---|
| SwiftUI state | Local snapshot uses `@Observable` in the app environment, prayer/location coordinator, audio engine, and learning model. | Adopt | Preserve iOS 17 availability; test actor boundaries and state restoration. |
| Card-to-detail motion | Local `DARMotion.swift` includes `matchedTransitionSource` and `navigationTransition(.zoom)` paths. | Trial | Confirm actual source branch, iOS availability/fallback, VoiceOver focus, Reduce Motion, and same-origin return on each owning screen. |
| Sheets | Local feature views use `presentationDetents` for reader, search, and detail surfaces. | Adopt | Audit detents, keyboard, Dynamic Type, VoiceOver dismissal, and iPad behavior. |
| Reduce Motion | Local motion helpers and multiple screens read `accessibilityReduceMotion`. | Adopt | Exercise the system setting in UI tests; a unit policy test alone is insufficient. |
| Haptics | Local Dhikr counter uses `sensoryFeedback(.selection, trigger:)`. | Trial | Verify that feedback is optional, non-repetitive, and silent/accessible under system settings. |
| Images | Local snapshot has asynchronous/deduplicated hero decoding and a bounded image cache. | Adopt | Profile memory, decode work, cancellation, and frame times on supported hardware. |
| Assistant/model runtime | Current public-entry draft removes unqualified prototype entry points and retains its code for separate issue #1791. | Hold | No public entry until cost, privacy, source grounding, language, device, and quality gates are passed. |

Radar meanings: **Adopt** means already suitable within its verified owner; **Trial** means limited use pending the listed proof; **Hold** means do not expose or broaden; **Assess** means investigate before implementation. These labels do not mean the whole app is complete.

## Compatibility and maintenance policy

1. Keep the declared iOS 17.0 floor unless a documented user benefit and complete older-device fallback justify a separate change.
2. Use the APIs already present in the verified feature owner; do not add dependencies or paid services for motion or media.
3. For every new stable Apple SDK, record the local Xcode/Swift/SDK versions, release notes, deprecations, availability changes, build results, and device/runtime gaps before updating this radar.
4. Pilot a new API in one feature branch, compare behavior with the existing fallback, measure accessibility/performance, and only then consider reuse.
5. Recheck this document at each planned DARNext release and after Xcode/Swift/iOS upgrades. No automated framework upgrade or production rollout is authorized.
6. Preserve the separation between DARNext development snapshots, GitHub PR heads, the App Store app, web surfaces, Kids, and tvOS.

## Open radar gates

- Establish a source-provenance chain for the local snapshot and reconcile it with current GitHub code before porting local changes.
- Complete the measured card/detail/return reference flow.
- Obtain a supported, exportable frame/hitch trace; prior gesture tests do not measure frame quality.
- Run the nine-locale, RTL, VoiceOver, Dynamic Type, Reduce Motion, Split View, audio, offline, and minimum-iOS runtime gates on current PR revisions.
- Record launch, memory, energy, and image-decoding measurements before setting performance budgets.

## Evidence references

- Local inventory: `DarAlTawhid.xcodeproj/project.pbxproj`, `DARNext/DesignSystem/Components/DARMotion.swift`, feature owners, and simulator result bundles in the protected local checkout.
- PR and branch evidence: [PR #1812](https://github.com/Sero91ak/dar-al-tawhid-site/pull/1812) through [PR #1817](https://github.com/Sero91ak/dar-al-tawhid-site/pull/1817).
- Whole-app verification gaps: [Feature matrix](DAR-NEXT-FEATURE-MATRIX-2026-11-19.md).

