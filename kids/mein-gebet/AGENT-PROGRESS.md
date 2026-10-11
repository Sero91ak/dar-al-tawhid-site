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
- Der fest auf das original-V7.7-Modell begrenzte 3/4-Scan benötigt **17 unabhängige 5°-Schritte** von 5° bis 85° mit endlichen IoU-Werten. Der 45°-Messwert des Kamerascans muss zum eigenen festen 45°-Datensatz **und** zum unabhängigen V4-Fünf-Ansichten-Messwert (Rundungstoleranz 0,00002) passen. Die Aufnahme akzeptiert kein `physical_camera_angle_established=true`, keine angeblich abgeschlossene Identitäts-/Gebetsabnahme und keinen fingierten 90%-Erfolg.
- Der existierende Fünf-Ansichten-CLI liefert bei V7.7 erwartungsgemäß Exitcode 1; dieser fachliche Ablehnungsstatus darf das reine technische Analyseergebnis nicht unbrauchbar machen, setzt aber **niemals** Produktionsflags. `fiveView90PctAccepted` bleibt explizit `false`, solange diese Dreiviertelansicht unkalibriert ist.
- Zusätzlich Testfälle gegen NaN, falsch zugeordnete Kameraansichten, fehlende Werte, defekte Sweeps, unberechtigte Freigaben und orchestrierte Berichte mit **synthetischen Platzhalterbytes** im ZIP-Ingest. Keine echten Modell-Bytes erfunden oder zur Repo-Versionierung hinzugefügt.
- Eine separate **lokale Reproduktion der zentralen Entscheidungslogik** wurde am 11.10.2026 mit sechs Python-`unittest`-Methoden ausgeführt: 6/6 bestanden (einschließlich Subtests mit verfälschten Daten und 45°-Quervergleich). **Das ist kein vollständiger GitHub-Actions-Lauf der geänderten Repo-Dateien.** In der aktuell zugänglichen GitHub-Abfrage konnten für den neuen Head-Commit keine bestätigten CI-Ergebnisse eingesehen werden; diese Abnahme bleibt offen.
- Original-V7.7-ZIP in Library `/Kinder App/Mein_Gebet_V77_STRICT_NICHT_FREIGEGEBEN.zip` weiterhin nur per Metadaten sichtbar, Rohdatenzugriff verweigert. Keine neue 5-View-Messung möglich, kein reales iPhone/iPad-Gerät geprüft.
- `productionReady=false`, kein `main`-Merge, kein Live-Push. Weitere Modellierung und jede religiöse Lehrfreigabe strikt gesperrt bis zu echter Originaldateneinsicht und anschließender Abnahme.


## 2026-10-11 — Interaktive HTML-Ersteller-Vorschau V7.8 (nicht 3D-Modellversion)

- Eigenständige vollständige HTML-Datei `kids/mein-gebet/vorschau-v78-interaktiv.html` im separaten Draft-Branch abgelegt; Dashboard `kids/mein-gebet/vorschau.html` verlinkt sie, ohne Produktions-Kids-Shell oder `main` zu verändern.
- Vier Lernbereiche, zwölf einzeln anklickbare Stationen, Vorherige/Nächste/Zurück, getrennte Jungen-/Mädchen-Farbgebung und lokale `sessionStorage`-Testmarkierungen nur für neun zugängliche **redaktionelle** Textstationen. Keine der drei gesperrten 3D-Stationen darf den Testfortschritt erhöhen. Kinderprofil-Speicherkeys werden nicht verwendet, keine Anmeldung/Netzwerkanfrage erforderlich.
- Noch kein originaler 3D-GLB in dieser HTML-Datei: 3D-Bewegungen, Audio, fachliche Lehrfreigabe, individuelle Mädchen-Rig-Prüfung und echte Kinder-Lernstände bleiben explizit ausstehend. **V7.8 bezeichnet ausschließlich die HTML-Vorschau, nicht eine neue 3D-Modellversion.**
- Lokale Chromium-Testläufe via Playwright auf 320, 375, 440, 820 und 1024 px: fünf von fünf Bedien-/Layoutfällen bestanden (horizontaler Overflow, Navigation, Profiltrennung, 3D-Lock, Test-Reset, JS-Laufzeitfehler). Isolierter SessionStorage-Mock testete Wiederherstellung von 1/9 und Reset nach Neuinitialisierung (kein echter Browser-Neustart/realer iPhone-/iPad-Test). In dieser Toolumgebung war direkte `file://`-/localhost-Navigation im Browser administrativ blockiert, deshalb wurden die HTML-Bytes über `page.set_content` getestet. Der lokale Preview-Code wurde zusätzlich mit Node `vm.Script` syntaktisch validiert.
- GitHub-Workflow für V7.8-Pfad und neue `test-preview-html.cjs`-Invarianten ergänzt, aber CI-Lauf für den neuesten Commit **noch nicht nachgewiesen**. Nur Branch-Speicherung bestätigt.
- Bestehende Produktionsfreigaben bleiben `false`, kein Merge, kein Deploy, kein Ersetzen bestehender Kids-App-Bereiche.


## 2026-10-11 — Interaktive 3D-Bewegungs-Laborvorschau V7.9 (ohne Original-GLB)

- Neuer isolierter HTML-Browserprototyp `kids/mein-gebet/vorschau-v79-3d-labor.html`, 35 KB, ohne externe JavaScript-Bibliotheken, Netzwerkanfragen oder echte Kinder-Lernstände.
- Procedurale **dreidimensionale** Geometrie (x,y,z), perspektivische Orbit-Kamera/Fingerrotation, zwei technisch getrennt eingefärbte Figurenvarianten und neun **synthetische, fachlich nicht freigegebene** Gebetsstellungen samt interpolierten Posen und Steuerung (Auswahl, nächster/vorheriger, Start/Pause, Geschwindigkeit, Ansicht zurücksetzen). Kein geprüftes GLB, kein glTF-Skin, keine Invarianz von Knochenlängen, keine Authentizität der Gebetspose behauptet.
- Browser bietet WebGL mit Shadern bei verfügbarer Hardware. Falls WebGL gesperrt ist, projiziert der Canvas-2D-Renderer dieselben 3D-Koordinaten auf eine frei drehbare Bildschirmansicht; dies ist ein Software-Renderfallback, **kein** gleichwertiger Beweis für Native-WebGL-/GLB-Einsatz.
- Unabhängige lokale Chromium-Playwright-Simulation am 11.10.2026: 320x680, 375x812, 390x844, 440x956, 768x1024 und 1024x768 bestanden, ohne horizontalen Overflow, Seitenfehler oder externe Requests. Auf 320px und 440px: alle neun auswählbaren Posen, Jungen-/Mädchenwechsel, Start/Pause und Kamerarücksetzung überprüft. In dieser Umgebung musste der CPU-Fallback genutzt werden; WebGL-Ausführung, reale Touchgeräte und Original-GLB bleiben **ungetestet**.
- Die Live-Vorschau auf diesem Chat liegt außerdem als eigenständige herunterladbare HTML-Datei vor. Die HTML-Datei im Repo ist aus dem geprüften Snapshot übertragen; getrenntes Vorschau-Dashboard verlinkt den 3D-Stand. `test-preview-html.cjs` sowie das isolierte Workflow-Path-Filter kontrollieren künftig die neue Datei.
- **Qualitätsgrenzen:** technische Testkörper-/Kleidungsvolumina haben keine originale Charakteridentität; 3D-Limb-Stretch/Bodenkontakt, Suǧūd-Kontaktstellen, gender-/fiqh-spezifische Posen, Gesichtsdetails, Textur, Audio und Lehr-Freigabe sind *nicht* abgenommen. Die Figur darf nie ohne echte Original-GLBs in den Produktionsplayer oder Besucherbereich übernommen werden.
- Release Gates unverändert gesperrt: `productionReady=false`, `permissions.mergeMain=false`, `permissions.liveDeploy=false`. Kein Live-Push. GitHub-CI-Ergebnis für diesen neuen Commit noch unabhängig zu bestätigen.
- Nächster technischer Meilenstein: vom technischen 3D-Posenprototyp zu einem **beweissicher lokal validierten glTF-2.0 Skin/Animation Pipeline-Test** mit fester Knochenlänge und Posekontaktprüfung, anschließend Original-V7.7-GLB nach erfolgreicher Rohdatenübergabe gegen dasselbe Skelettprotokoll prüfen. Ohne echte Binärdatei keine visuellen Originalitätsaussagen.


## 2026-10-11 — V8.0 HTML-Salām-Fehlerkorrektur, nur interne Testfigur

- Aus den zwei Screenshots des Nutzers: aktuelle V7.9-Figur ist eindeutig **nicht** das Original-V7.7-Modell; technisch generierter Platzhalter mit falschen Gesichts-, Kufi-/Haar- und Körpermerkmalen. In diesem Gespräch wurde **keine zeitlich prüfbare Videodatei** bereitgestellt; die folgende Prüfung ist ein Code-/Browserablauftest, keine Auswertung eines vom Nutzer aufgenommenen Videos.
- Echte Codefehlstelle V7.9: nur ein fester `headTurn:1.05` in der finalen `Salām`-Pose, keine zweite Kopfdrehung. Die V8.0-Vorschau setzt `frames[8]` auf die identische Tashahhud-Rumpfpose, interpoliert den Kopf separat über positive rechte Yaw-Achse (+1,07 rad), Mitte (0), negative linke Yaw-Achse (-1,07 rad). Rechte und linke Kopfseite werden zeitlich beschriftet. Weißes Kufi/Haar-Dekor wird bei der Jungenfigur bei Kopfdrehung mit der Gesichtsausrichtung bewegt.
- Die Steuerung unterstützt Pause/Fortsetzen und Wiederholen speziell für den Schluss-Salām. Es gibt noch kein authentisches GLB-Skinning, keine Original-3D-Figur, keine geprüften Schulter-/Wirbelkontaktpunkte, keine Tashahhud- oder Suǧūd-Abnahme und **keinen** vollständigen Rakʿah-Ablauf. Deshalb weiterhin `productionApproved=false` und ausdrücklich nicht als Lehranimation freigegeben.
- Lokal ausgeführt: `node --check` des extrahierten inline-JS bestanden; taslim-Zeitfunktionsprobe mit Node positiv-rechts, mittig, negativ-links bestanden. Chromium-Playwright-Realbrowser (Canvas-2D-Fallback, WebGL mangels unterstützter Testumgebung nicht validiert): Salām rechts, Pause gehalten (gleicher Winkel), Salām links (negativer Winkel), keine JS-Fehler, keine horizontale Überläufe. Separate Darstellungschecks bei 320×690, 390×844, 440×956 und 820×1080 mit Mädchenprofil und Salām-Auswahl erfolgreich, ohne JS-Fehler oder Overflow. Auf echtem iPhone/iPad und gegen Original-GLB noch **nicht** getestet.
- Datei: `kids/mein-gebet/vorschau-v80-salam-fix.html`. Vorschau-Hub verlinkt sie; isolierter Workflow ist um Pfad ergänzt; `rigging/test-preview-html.cjs` überprüft unter anderem geometrisch unveränderte Tashahhud-/Salām-Frames und die Vorzeichen +/0/− der Kopfdrehung. Neue GitHub-Actions-Ergebnisse für den Head-Commit sind noch nicht bestätigt.
- Kein Merge in `main`, keine Änderungen an produktiver Besucher-Kinder-App, keine neuen Kinder-Lernstände oder Audio-/Modelldateien. Nächste echte Produktionsarbeit: Original-V7.7-GLB roh wiederherstellen, auf originaler Skin-Hierarchie Kopf allein animieren und die echte visuelle Originalität vor jeder pädagogischen Freigabe abnehmen.
