# KIDS GLOBAL RELEASE LOCK · Freigabe-Regel (11.10.2026)

**Nutzerfreigabe ist zwingend. Alle Änderungen zunächst AUSSCHLIESSLICH in der eigenständigen KIDS TEST Web-App / Branch `kids-creator-staging`.**

## Standard: GESPERRT
- Keine inhaltliche Änderung der nativen KIDS Besucher-App oder von `/kids` auf `dar-al-tawhid.de`.
- Kein Merge, kein Cherry-Pick, keine automatische Synchronisierung oder Promotion von `kids-creator-staging` nach `main`.
- Keine Änderung an Live-Kinderprofilen, gespeicherten Lernständen, Veröffentlichungsterminen, Serverfreigaben und App Store Connect.
- Allgemeine Aufforderungen (»Weiter«, »mach«, »arbeite«, »fertig«), technische Checks und grüne CI/Deploys autorisieren **keine** Veröffentlichung.
- `KIDS TEST` darf neue Oberflächen, Notizen und Teststände ausliefern; keine produktiven KIDS-Domains, Routen, API-Schreibzugriffe, Zahlungen oder Pushs.
- Öffentliche workers.dev-Testvorschau darf keine privaten Ersteller-/Kinderinformationen, unveröffentlichten Manuskripte oder API-Schlüssel veröffentlichen.

## Einzige ausdrückliche Ausnahme
Nur wenn der Nutzer ausdrücklich den Freigabebefehl **»Push-Thread global«** erteilt, darf ein konkreter, zuvor geprüfter Änderungsumfang zur Live-Übernahme vorbereitet werden. Auch dann: Branch-/Diff-Prüfung, Quellen-/Alters-/Audio-/Sicherheitsprüfung, überprüfbare Release-Version, separate Freigabe vor dem Live-Deploy. Niemals blind die gesamte Staging-Branch mergen.

## Verbindlicher Entwicklungsablauf
1. Entwurf/Änderung nur in `kids-creator-staging`.
2. KIDS TEST Web-App / dedizierten workers.dev-Worker aktualisieren und iPhone/iPad-Probe durchführen.
3. Dokumentierte Freigabe vom Nutzer abwarten.
4. Ohne »Push-Thread global« bei Phase 2 verbleiben.

## Durchsetzung und Grenzen
- Workflow `deploy-kids-creator` darf ausschließlich aus `kids-creator-staging` zum isolierten Workers-Dev-Ziel deployen.
- Ein schreibgeschützter Browser-Arbeitsbereich darf lokal Pläne/Notizen speichern und JSON exportieren. Solche Eingaben ändern weder Repository noch Besucherstand.
- Diese Datei gilt für sämtliche weiteren Änderungen an KIDS im Test-Branch. Der bereits vorhandene Live-Workflow auf `main` wurde hier bewusst **nicht** geändert: Um die globale Regel auch dort technisch zu erzwingen, ist ein eigener, noch nicht gemergter Sicherheits-PR nötig. Nichts am Besucher-Deployment anfassen, solange »Push-Thread global« nicht autorisiert ist.
