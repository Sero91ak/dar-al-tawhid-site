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


## 2026-10-11 — Strikte Kontur-/Kamera-Beweiskette, nächste isolierte Arbeitseinheit

- Scope: nur `rigging/qa_v77_archive.py`, `rigging/test_qa_v77_archive.py`, diese Arbeitsnotiz; keine Live-Dateien.
- Die V7.7-Aufnahme blockiert nun erfundene, unvollständige oder nichtnumerische Berichte. Alle **fünf** benannten Projektionsansichten müssen gültige Azimute und endliche Kontur-/Kopf-/Masken-Messungen enthalten. Der referenzierte 3/4-Winkel bleibt explizit **nicht physikalisch kalibriert**.
- Der fest auf das original-V7.7-Modell begrenzte 3/4-Scan benötigt **17 unabhängige 5°-Schritte** von 5° bis 85° mit endlichen IoU-Werten. Die Aufnahme akzeptiert kein `physical_camera_angle_established=true`, keine angeblich abgeschlossene Identitäts-/Gebetsabnahme und keinen fingierten 90%-Erfolg.
- Der existierende Fünf-Ansichten-CLI liefert bei V7.7 erwartungsgemäß Exitcode 1; dieser fachliche Ablehnungsstatus darf das reine technische Analyseergebnis nicht unbrauchbar machen, setzt aber **niemals** Produktionsflags. `fiveView90PctAccepted` bleibt explizit `false`, solange diese Dreiviertelansicht unkalibriert ist.
- Zusätzlich Testfälle gegen NaN, falsch zugeordnete Kameraansichten, fehlende Werte, defekte Sweeps, unberechtigte Freigaben und orchestrierte Berichte mit **synthetischen Platzhalterbytes** im ZIP-Ingest. Keine echten Modell-Bytes erfunden oder zur Repo-Versionierung hinzugefügt.
- Eine separate **lokale Reproduktion der zentralen Entscheidungslogik** wurde am 11.10.2026 mit fünf Python-`unittest`-Methoden ausgeführt: 5/5 bestanden (einschließlich Subtests mit verfälschten Daten). **Das ist kein vollständiger GitHub-Actions-Lauf der geänderten Repo-Dateien.** In der aktuell zugänglichen GitHub-Abfrage konnten für den neuen Head-Commit keine bestätigten CI-Ergebnisse eingesehen werden; diese Abnahme bleibt offen.
- Original-V7.7-ZIP in Library `/Kinder App/Mein_Gebet_V77_STRICT_NICHT_FREIGEGEBEN.zip` weiterhin nur per Metadaten sichtbar, Rohdatenzugriff verweigert. Keine neue 5-View-Messung möglich, kein reales iPhone/iPad-Gerät geprüft.
- `productionReady=false`, kein `main`-Merge, kein Live-Push. Weitere Modellierung und jede religiöse Lehrfreigabe strikt gesperrt bis zu echter Originaldateneinsicht und anschließender Abnahme.

