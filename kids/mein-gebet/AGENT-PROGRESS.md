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

## 2026-10-09 — Cursor Cloud, Phase 1 UI + unabhängige Phase-2-Verträge (PR #894 Fortsetzung)

1. Agent: Cursor Cloud. Branch `cursor/kids-mein-gebet-dev-fa8f`, Draft-PR https://github.com/Sero91ak/dar-al-tawhid-site/pull/894 gegen `feature/kids-mein-gebet-preview-20261008`.
2. Auftrag aus Review #894: echte Browser-/History-Prüfung, Kids-Home-Anbindung ohne fünften Tab, kein Voice-Studio-Fix, keine GLB-Erfindung.
3. Umsetzung:
   - `preview-v1.js`: UI-Zurück nutzt `history.back()` wenn ein Mein-Gebet-State liegt; linker Rand-Swipe; Safe-Area oben; `overscroll-behavior:contain`. Cache-Pin `preview-v1.js?v=2` in den drei identischen Kids-Shells.
   - `config.json`: Phase 1, `permanentBottomTab=false`, keine Live-/Merge-Freigabe.
   - `qa/home-fixture.html` bildet den Kids-Home-Vertrag (4 Tabs, Grid, Testzugang).
   - `rigging/test-kids-shell-contract.cjs` (11 Checks) und `rigging/test-preview-playwright.cjs` (Chromium: iPhone-Boy, iPad-Girl, Fixture, `goBack`).
   - Screenshots unter `qa/screenshots/` (Chromium-Emulation, kein physisches iPhone).
4. Tests vor Push: `test-preview-v1.cjs` 10 PASS inkl. History-Back; Shell-Vertrag 11 PASS; Playwright 3 PASS (`NODE_PATH=/tmp/pw/node_modules`). Synthetische Rigging-Suite unverändert nicht als 3D-Freigabe gewertet. CI-URL am **finalen** SHA nach dem Push nachtragen.
5. Browser: Chromium 390×844 / 768×1024 / Fixture; 0 Konsolenfehler. Junge weiß/gold, Mädchen pinkes Hijab, 4 Tabs Heute/Geschichten/Qurʾān/Eltern. **Echtes iPhone/iPad/WKWebView: absent.** Religiöse Freigabe: absent.
6. Phase 2 dauerhafter Tab, Original-GLB, Audio, Fiqh-Animation: **BLOCKED** (Freigabe bzw. fehlende Bytes). Voice-Studio-Validate-Rot: fremde Spur, nicht angefasst.
7. Status: **IMPLEMENTED** (History-Back, Swipe, Home-Vertrag). **AUTOMATED TESTED** (VM + Chromium). **VISUALLY VERIFIED**: Chromium-Emulation ja, reales Gerät nein. **HUMAN APPROVED**: nein.
