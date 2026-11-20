# DARNext product roadmap and working backlog

Stand: 2026-11-20  
Governing request: [GitHub Issue #1789](https://github.com/Sero91ak/dar-al-tawhid-site/issues/1789)  
Related technology record: [TECH_RADAR.md](TECH_RADAR.md)  
This is an active work plan, not an app-completion or release claim.

## Source-of-truth checkpoint

- The protected local DARNext checkout is an unborn branch with untracked app/project files; no commit identifies its exact parent.
- GitHub PRs #1812–#1817 are open Drafts against older native DARNext branch snapshots. They are reviewable increments, not proof that the local snapshot is integrated or that the current complete app is represented.
- The local and remote code differ materially. Do not transplant local code or claim it is present in a PR until file/commit provenance is resolved.
- No merge, App Store submission, public release, paid service, Kids change, or production website change is authorized by this roadmap.

## Prioritized backlog

| Priority | Work item | State | Evidence / dependency | Completion evidence |
|---|---|---|---|---|
| P0 | Reconcile current DARNext source provenance across local snapshot, native branch, and PRs | Open | Local checkout has no HEAD; PR bases are older and source files differ. Preserve local source and Git objects. | A path-by-path source manifest tied to identified commits, plus a reviewed integration branch with no unexplained files. |
| P0 | Finish the Start capsule → native detail → exact origin return reference flow | Partial | Dashboard→prayer detail→return passed 1/1 on local iPad build after an accessibility-container fix; local fix is not on a proven matching remote source revision. Posts→book return has earlier iPhone evidence. | Current PR revision passes launch, navigation, stable identity, scroll/search restoration, visual return, VoiceOver, Reduce Motion, and iPhone/iPad UI assertions. |
| P0 | Resolve the reported image-scroll hitch/jitter | Open | Scroll gestures pass on iPhone and iPad; no valid frame-rate/hitch measurements. The 2026-11-20 profiled run failed saving its result bundle with ENOSPC; attempted Animation Hitches trace was empty. | Reproducible frame/hitch data on the same build before and after an owner-specific fix, with test device, OS, trace, and summary retained. |
| P1 | Complete current five-tab and visitor-entry behavior | Partial | PR #1816 restores Start · Quiz · Beiträge · Qurʾān · Mehr; PR #1817 removes the unqualified assistant public entry points while retaining prototype code for separate #1791. #1817 UI test/build are still unrun. | Build and simulator tests on the current PR head, with all tab destinations and assistant entry assertions passing. |
| P1 | Close source and learning paths across Posts, Qurʾān, Library, and Quiz | Partial | Existing source return and Quiz→āyah paths have partial local evidence. | Stable IDs and exact canonical source/āyah targets; return to prior scroll/search state; locale/RTL and UI proof on current source. |
| P1 | Complete accessibility and responsive matrix | Open | Some Reduce Motion policies and localization tests exist; no full system-option/UI matrix. | Screen-by-screen VoiceOver, Voice Control, Dynamic Type, contrast, Reduce Motion, nine locales/RTL, keyboard/safe area, iPad Split View and narrow-width results. |
| P1 | Validate audio, prayer/location, offline and content integrity | Partial | Audio interruption and permission-policy code/tests are in separate drafts; hardware behavior and current-revision integration remain open. Offline sync has local unit coverage but remote manifest/tombstone behavior is incomplete. | Real route/phone/Siri audio tests; permission transitions; source-ID integrity; offline/restore/delta rollback tests on a verified branch. |
| P2 | Establish launch, memory, energy and image budgets | Open | Hero decode/cache work exists in the local snapshot; no current measured budget. | Instruments/device measurements and explicit regression thresholds for representative iPhone/iPad builds. |
| P2 | Maintain stable-Apple-technology review process | In progress | [TECH_RADAR.md](TECH_RADAR.md) records the verified local Xcode 27.2 / Swift 6.4.2 / iOS SDK 27.2 environment and provenance caveat. | Review at stable SDK upgrades, record API availability/fallbacks, and update compatibility tests before adopting new APIs. |

## Existing GitHub increments

- [PR #1812](https://github.com/Sero91ak/dar-al-tawhid-site/pull/1812): Xcode entry point, quiz resource, feature matrix. Draft; not merged.
- [PR #1813](https://github.com/Sero91ak/dar-al-tawhid-site/pull/1813): Qurʾān audio interruption policy. Draft; hardware behavior open.
- [PR #1814](https://github.com/Sero91ak/dar-al-tawhid-site/pull/1814): Reduce Motion for focused āyah. Draft; system-option UI test open.
- [PR #1815](https://github.com/Sero91ak/dar-al-tawhid-site/pull/1815): location callback actor safety. Draft; runtime permission flow open.
- [PR #1816](https://github.com/Sero91ak/dar-al-tawhid-site/pull/1816): agreed five-tab navigation. Draft; wider device/accessibility matrix open.
- [PR #1817](https://github.com/Sero91ak/dar-al-tawhid-site/pull/1817): hide unqualified assistant entry points. Draft; build and simulator test open.

These PRs do not by themselves complete Issue #1789; verify each head and base before further integration.

## Immediate sequence

1. Confirm a writable, adequately provisioned test environment; do not delete source, simulator state, recordings, or result bundles to manufacture capacity.
2. Reconcile source provenance and select the current DARNext integration base.
3. Build/test the unverified current PR heads, beginning with #1817, and record complete result bundles.
4. Reproduce the scroll defect with a supported trace; fix the measured owning view and repeat the same interaction.
5. Finish the reference flow and cross-feature source routes.
6. Close accessibility, locale, responsive, audio, offline, launch, and performance gates in feature-sized Draft PRs.
7. Re-run the full required matrix against the final review revisions and keep Issue #1789 open until every requirement has direct evidence.

## Current execution constraint

At the latest check, the Mac had roughly 100 MiB available. Xcode could not save a profiled UI-test result bundle (ENOSPC), and the attempted animation-hitch trace yielded no measurement. This blocks new local simulator/trace evidence but does not convert any open item into a completed item.

## PR integration audit — 2026-11-20

A pairwise merge simulation found a concrete conflict risk in the four sibling Draft PRs #1813–#1816:

- Each branch was compared against shared base commit `7c1692fd8afc4e616b958737665c335c5e093909`.
- Each PR appends its unit assertion at the same end-of-file location in `DARNextTests/DARNextTests.swift` (shared base blob `1b92df8dd69a4a0840f1cc0150c5fbb61105d068`).
- All six pairwise `git merge-file --stdout -p` simulations produced conflict markers in that test file.
- GitHub currently reports each PR individually mergeable against the updated common base; that status does not prove the sibling PRs can be combined together without resolving their overlapping test edits.

Required integration order: merge or stack one feature branch at a time, carry forward the earlier test additions, resolve the shared test file, then rerun the combined DARNext unit/build checks before advancing to the next PR. Do not merge #1813–#1816 in parallel. #1817 already depends on the five-tab branch #1816 and should follow it. This finding is about integration readiness; it does not authorize merging or release.

### Resolution check — 2026-11-20

The four existing policy-test methods were moved to distinct locations in their respective branches; their assertions and production-code changes were preserved. Current branch heads now pass Swift parser checks. Re-running the six pairwise `git merge-file --stdout -p` simulations against common test-file base `1b92df8dd69a4a0840f1cc0150c5fbb61105d068` produced no conflicts. A cumulative simulation of #1813 → #1814 → #1815 → #1816 also merged without conflict, retained all four policy tests, and the combined test file passed `swiftc -frontend -parse`.

This is source-level merge and syntax evidence only. No Xcode build or XCTest run was performed for the updated branch heads. All four PRs remain Draft. PR #1817 still reports mergeable against #1816 after the parent branch update, but its build and simulator test remain outstanding.
