# Mein Gebet — Shared Agent Progress

**Last human/ChatGPT preparation:** 2026-10-09. This file is a handoff ledger, not evidence that Codex/Cursor has started.

## Current state
- Source of truth: `rigging/PROJECT-STATUS-RELEASE-GATES.json`.
- Draft branch: `feature/kids-mein-gebet-preview-20261008`; GitHub PR #825.
- Last independently verified native synthetic CI suite before agent handoff: **238/238 checks**, GitHub Actions run https://github.com/Sero91ak/dar-al-tawhid-site/actions/runs/37954199324. Later instructions-only commits need exact HEAD CI readback.
- Real user-approved original 3D model(s), calibrated five-view V4 comparison, entire prayer animation sequence and device/theological approvals are **NOT complete**.
- Codex/Cursor has **NOT yet been launched** from this ChatGPT conversation.

## Agents — append verified milestones here
For each milestone, append:
1. Agent/provider and start mode: Codex Cloud or Cursor Cloud (with task link if available).
2. Git base branch and commit SHA. Isolated work branch and draft PR.
3. Actual implementation (files, behavior) and reproducible bug.
4. Test commands and resulting CI run **on final commit SHA**.
5. Browser screenshots/video, real device/religious approvals: explicit present/absent.
6. Remaining blocking files, permissions, approval or fixes.
7. Status: IMPLEMENTED, AUTOMATED TESTED, VISUALLY VERIFIED, HUMAN APPROVED or BLOCKED.

Never mark production ready or amend failed tests into success without evidence.


## 2026-10-11 — V7.7 archive recovery audit split (ChatGPT)

1. The ChatGPT Library metadata exposes the original generated archive `/Kinder App/Mein_Gebet_V77_STRICT_NICHT_FREIGEGEBEN.zip` (6,635,848 bytes). Its raw bytes are NOT accessible: `files.materialize` explicitly reports that no authorized raw-byte materialization path exists. This is **not** a verified GLB recovery.
2. The source intake tool `rigging/qa_v77_archive.py` previously conflated a valid completed five-angle measurement returning exit 1 (the expected V7.7 quality-gate failure; 3/4 angle physically uncalibrated) with a corrupt/unreadable archive. It now separates:
   - pinned SHA-256 bytes + a successful structural rig check;
   - completed five-view measurements on pinned model/reference, accepting the documented research CLI exit 1;
   - completed successful angle sensitivity diagnostic on the same immutable files.
   The resulting `qaAnalysisComplete` is **not** a likeness, silhouette, prayer teaching, or production approval; every production flag remains false.
3. `rigging/test_qa_v77_archive.py` now includes synthetic outcome tests that reject bad checksums, rig failures, malformed five-view data, missing evidence, failed diagnostics, fabricated calibration, or forged production approval. No original figure bytes were invented.
4. The existing release-gate status remains `draft_not_complete`; no original GLB binary was obtained or remeasured, and no new 3D mesh / clip was created. No change to `main`, the live Kids app, children's progress, profile storage, SW, or audio.
5. Next: obtain an authorized raw-file reference to the exact archived V7.7 ZIP; rerun archive intake against its SHA-pinned GLB+PNG, and only then attempt camera calibration, sculpt comparison, animations, and real device QA. CI results for this commit must be verified independently before marking tests passed.

