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

## 2026-10-09 — Cursor Cloud, Workstream A (preview usability)

1. Agent: Cursor Cloud. Base: `feature/kids-mein-gebet-preview-20261008` @ `dada2ff66`. Work branch: `cursor/kids-mein-gebet-dev-fa8f`. Draft PR: https://github.com/Sero91ak/dar-al-tawhid-site/pull/894 (base = Feature-Branch, nicht `main`). Final implementation SHA: `0fc8ed8b1`.
2. Defect: `demo-junge.html` / `demo-maedchen.html` inlined a stale copy of the preview and loaded figures from `raw.githubusercontent.com`, so local/offline demos broke and drifted from `preview-v1.js`. iOS hardware back only had Escape, not `history.pushState`.
3. Implementation:
   - `kids/mein-gebet/preview-v1.js`: assets resolved next to the script (`assetDir()`), hero CSS uses those URLs, `pushState`/`popstate` for overview → lesson → station, `dir=auto` on station text, aria-labels on back buttons, profile-accurate image `alt`.
   - Demos now load `preview-v1.js` only (boy/girl still pinned via `data-gender`).
   - `kids/mein-gebet/rigging/test-preview-v1.cjs` added.
   - `.github/workflows/kids-mein-gebet-draft-qa.yml` also runs on agent branches/PRs into the feature branch and on `kids/mein-gebet/**` (not only `rigging/**`).
   - Scope unlock `kids-mein-gebet-autonomous-preview-2026-10-09` limited to this folder + the draft QA workflow + lock file.
4. Local tests on `0fc8ed8b1`: `node kids/mein-gebet/rigging/test-preview-v1.cjs` → 9 PASS; full existing Node+Python synthetic suite on this machine all green (GLB structure/binary/geometry/e2e/pose/IBM/audit/freeze + camera/projection/archive). `node --check kids/mein-gebet/preview-v1.js` green. GitHub Actions URL: see checks on PR #894 after the workflow runs.
5. Screenshots/video: **absent** (no GUI browser on this agent). Real iPhone/iPad: **absent**. Religious approval: **absent**. Original V7.7 GLB: **not in repository** (search found no `.glb`).
6. Remaining blockers: authentic boy GLB SHA `353b0288…`; five-view PNG SHA `062b8555…` not re-measured with v4; girl 3D; Hanbali `approvedToAnimate/Record/Teach` still false; no HTTPS staging / device QA; `productionReady` remains false.
7. Status: **IMPLEMENTED** (2D demo/history/assets). **AUTOMATED TESTED** (preview + existing synthetic rigging). **VISUALLY VERIFIED**: no. **HUMAN APPROVED**: no. **BLOCKED**: original 3D, v4 IoU, fiqh, device, live.
