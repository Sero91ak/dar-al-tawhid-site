# TAWḤĪD KIDS NEXT – Umsetzungs- und Prüfstatus

Stand: 29.10.2026 · Branch `codex/tawhid-kids-next-completion-20261029` · Status: **SIMULATOR / NICHT FREIGEGEBEN**.

## Architektur und Xcode-Einstieg

- Ein gemeinsamer Workspace `ios/DarAlTawhidKids/DarAlTawhidKids.xcworkspace` enthält das bestehende Projekt und das separate generierte `Next/TawhidKidsNext.xcodeproj`. `xcodebuild -list -workspace` weist `DarAlTawhidKids`, `DarAlTawhidKidsCreator` und `TawhidKidsNext` aus.
- NEXT-Scheme/Target: `TawhidKidsNext`; Debug-Bundle: `de.daraltawhid.kids.next.dev`; iOS-Simulator-only, `CODE_SIGNING_ALLOWED=NO`. Bestands-App, Creator-Scheme, produktives Bundle, Signing und Live-Server wurden nicht geändert.
- Der Launcher führt Preflight, Sicherung des generierten Projekts, XcodeGen, Workspace-Prüfung, Build, XCTest und Simulator-Install/Launch durch. Ressourcen werden als Quellen mit Nicht-Swift-Dateien deklariert, weil XcodeGen 2.46 die parallele `resources:`-Sektion in dieser Spec nicht ins Projekt übernahm.

## Inhalt und Oberfläche

- Nativ umgesetzt: Startansicht mit originalem Hero-Bild, Profilanzeige/-auswahl, Heute-Aktionen; fünf Tabs Heute/Hören/Lernen/Duʿāʾ/Eltern mit Original-3D-Icons; Quiz-State-Flow mit falsche-Antwort-Wiederholung, Abschluss und lokalem Rundenfortschritt; verifizierte Duʿāʾ-Auswahl und deklarierte Originalaudio-URL-Felder.
- Quizbestand: 900/900 freigegeben und eindeutige IDs, je 300 für 4–6, 7–8 und 9–10. Das Manifest hat 1.884 eindeutige Quiz-Audioeinträge; 613 exakte Frage-Audio-Schlüssel plus 900 Feedback-Paare. Statische Dateiexistenz/Schlüssel bedeutet keine Hörabnahme.
- Duʿāʾ-Bestand: 120/120 verifiziert/eindeutig, alle drei Audiofelder deklariert. Trilingual-Guard prüft 1.366 Wortsegmente. Er beweist weder Aufnahmequalität noch Synchronität.
- Storys, Qurʾān, Akademie, Gebetszeiten/Qibla und Elternfunktionen sind noch nicht vollständig nativ migriert. Sie bleiben über den vorhandenen KIDS-WebKit-Adapter erreichbar; die Paritätsmatrix markiert dies als Adapter/offen.

## Verifizierte Checks

- Xcode 27.1; iPhone Duo iOS 27.1: Build erfolgreich, XCTest **4 bestanden**, Swift Testing **5 bestanden**, 0 fehlgeschlagen. Vollständiges Log: `.qa/test-duo.log`; xcresult in `.qa/DerivedData/Logs/Test/`.
- Device Hub Accessibility-Baum bestätigte „Salām“, originales Hero-Bild, Heute-Aktionen und fünf Tabs. Device-Hub-Ansicht zeigte das Motiv; installiert und gestartet wurde Bundle `de.daraltawhid.kids.next.dev`. Das ist eine Sichtprüfung der geschlossenen Duo-Pose, keine Interaktionsabnahme.
- Gates mit Exit 0: `kids/check-ui-contract-v1420.cjs`, `kids/tools/test-quiz-home-entry-v1450.cjs`, `kids/tools/quiz_v4_contract_guard.py`, `scripts/kids-design-guard.js`, `scripts/kids-dua-trilingual-guard.js`. App-Lane-Gate mit `INTEGRITY_BASE_REF=08e886d6e1e42dde834be1f8c581fd4125ffa86e` meldet nur Kids-Spur. Ausgaben liegen in `.qa/gate-*.log`.
- Der app-lane Guard muss auf den tatsächlichen `main`-Ausgangspunkt gesetzt werden: der Branch hat einen Merge-Commit, und `HEAD~1` als Default vergleicht sonst den gesamten kanonischen Main-Merge mit seinem Elternstand und meldet fremde alte Spuren.
- Staging-Origin `/kids/start.html` wurde read-only angefragt: Redirect 307 auf `/kids/start`, dann HTTP 200 HTML. Drei zufällig geprüfte M4A-URLs antworteten HTTP 200; keine Auth-/Inhalts-/Audio-Hörabnahme.
- Lokale Quiz-Audiodateien: 1.884/1.884 manifestierte eindeutige Dateien vorhanden. Duʿāʾ-Audiodateien: 360 eindeutige lokale Dateien zu den 120×3 deklarierten Feldern. Menschliches Hören bleibt offen.

## Bestehende Kids-Gates und Grenzen

- Im aktuellen Branch vorhandene Auftrags-Gates wurden ausgeführt und bestanden.
- Die drei Pfade `scripts/kids-design-guard.js`, `scripts/kids-dua-trilingual-guard.js` und `scripts/app-lane-guard.js` existierten nach vollständiger Sparse-Checkout-Ergänzung; alle liefen. Der erste Designlauf scheiterte nur, weil `cloudflare/site-router.js` im Sparse-Checkout nicht vorhanden war; nach Ergänzung bestand er.
- Keine physischen Geräte, kein iPad-Simulatorlauf und keine vollständige Duo-Auf/Teilfalt-/Rotationsprüfung. Keine Story-/Qurʾān-/Gebetszeit-/Eltern-End-to-End-Prüfung, keine systematische VoiceOver-/Dynamic-Type-/Offline-/Hintergrundaudio-/Performance-Abnahme und keine Hörprüfung.
- Keine belastbare vollständige Route-/Modal-/Fehlerseiteninventur mit Screenshots pro Screen/Profil/Alter. Die Paritätsmatrix ist daher Fortschrittsinventar, keine Vollständigkeitsbescheinigung.

## Git-/Freigabezustand

- Arbeitsbranch ist vom Recovery-Branch abgeleitet und mit dem aktuellen Main-Stand integriert, damit nur der aktuelle Kids-NEXT-Diff als Kandidat verbleibt. Die ursprüngliche Recovery-Arbeitskopie und ihre lokalen Änderungen wurden nicht angerührt.
- Änderungen sind noch nicht committed oder gepusht. Kein PR, Merge, Live-Push, Cloudflare-Deploy, App Store Connect, TestFlight oder Apple-Signing-Schritt.
- Freigabestatus bleibt **SIMULATOR / NICHT FREIGEGEBEN**. Native Vollmigration und reale Geräte-/Audio-/Datenschutz-Abnahme sind vor einer Produktfreigabe erforderlich.

## Protokolle

- `.qa/recovery-preflight-20261029-185544.log`
- `.qa/test-duo.log`
- `.qa/gate-ui-contract.log`, `.qa/gate-quiz-home.log`, `.qa/gate-quiz-v4.log`
- `.qa/gate-kids-design.log`, `.qa/gate-kids-dua.log`, `.qa/gate-app-lane.log`
- `.qa/integrated-run/` wird vom vollständigen Launcher befüllt.
