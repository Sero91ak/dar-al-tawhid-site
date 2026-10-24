# DARNext · Apple Edition — Projektübergabe

Arbeitszweig: `codex/darnext-apple-heritage-master-v1-20261024`  
Basierend auf: `codex/darnext-phase4-wip-2026-10-23`  
Letzte Spezifikation: 24.10.2026

## GitHub-Auftrag für Xcode
**Issue #1420:** https://github.com/Sero91ak/dar-al-tawhid-site/issues/1420  
Dort steht die komplette Arbeitskette mit Links auf alle Spezifikationen. Agenten können mit dieser Issue-Nummer starten, müssen aber den unten genannten Arbeitszweig lokal abgleichen.

## Verbindliche Dokumente
1. **[APPLE-HERITAGE-DESIGN-MASTER-V1.md](APPLE-HERITAGE-DESIGN-MASTER-V1.md)** — Vision, Designsystem, native Seiten, Datenmodell, Quellenstatus, Mehrsprachigkeit, Content-Sync, Apple-Technik und Abnahme.
2. **[XCODE-MASTER-AUFTRAG-V1.md](XCODE-MASTER-AUFTRAG-V1.md)** — konkrete Ausführungsanweisung, P0-Audit, sichere Implementierungsphasen und QA.
3. **[IMPLEMENTATION-STATUS.md](IMPLEMENTATION-STATUS.md)** — Status-/Test- und Blockerbericht, vom Xcode-Agenten fortzuschreiben.

## Sofortiger Ablauf
- Beide Masterdokumente vollständig lesen, Branchstand mit lokalem Arbeitsbaum abgleichen.
- DARNext **isoliert** ändern, bestehende iOS-/Web-/Kids-/TV-/Watch-Targets und Live-Deployment unangetastet lassen.
- P0 Audit, dann Design Foundation und die drei nativen Referenzseiten (Dashboard, Wissenschaftsblatt, Muṣḥaf) aus echten Quellen.
- Nach jeder Phase Commit/Test/Status aktualisieren, niemals fertige Builds/Push-Erfolge ohne wirkliche Prüfung behaupten.

## Benutzerhinweis
GitHub-Push ändert nicht unmittelbar die auf dem iPhone installierte App. Dafür muss der aktuelle Code auf dem Mac synchronisiert, in Xcode mit dem DARNext-Scheme gebaut und per Run auf das iPhone übertragen werden.
