# DĀR AL TAWḤĪD · Eigentümer-Sperre für Standort, Qibla, Gebetszeiten

**Gültig ab Aktivierung auf main, dauerhaft gesperrt / default deny.**

Diese Regel wurde auf ausdrücklichen Auftrag des Eigentümers eingerichtet. Sie ergänzt die vorhandenen Besucher-Live-, Push-, Widget- und Staging-Regeln und hebt keine vorhandene Sperre auf.

## Unveränderliche Schutzbereiche

- GPS-Berechtigung, automatische/manuelle Standortwahl, WKWebView ↔ CoreLocation, Standort-Persistenz.
- Qibla-Kompass, Qibla-Suche und Richtungsberechnung.
- Gebetszeiten-Engine, Berechnungsmethoden, Zeiten-Synchronisierung, Anzeige und native Widgets.
- Zugehörige Web-/Test-Parität und native Swift-Brücken.
- Die Sperre selbst: GitHub-Workflow, Guard-Skript, CODEOWNERS und diese Datei.

Die geschützten Dateien und HTML-Kennungen werden in scripts/core-sensitive-change-lock.cjs technisch geprüft. Publizistische Beitragsänderungen außerhalb geschützter HTML-Abschnitte bleiben möglich.

## ABSOLUTES STANDARDVERBOT

Keine automatische oder manuelle Änderung der oben genannten Funktionalität, kein Refactoring, kein stiller Hotfix, kein Workflow-Bypass und kein Live-Deployment einer solchen Änderung ohne vorherige neue, **ausdrückliche und konkrete Freigabe** des Eigentümers. Insbesondere NICHT einen alten Chat-Auftrag oder ein allgemeines „weitermachen“ als Entsperrung verwenden.

Der Eigentümer hat ein separates Freigabekennwort festgelegt. Dieses Kennwort darf NICHT in Git, GitHub-Dateien, Commit-Nachrichten, PRs, Actions-Inputs, Logs, Kommentaren oder veröffentlichtem JavaScript stehen. Die CI verarbeitet bewusst **keine Passwörter**. Das Kennwort alleine stellt KEINE technische GitHub-Authentifizierung dar; die verbindliche Repository-Zugriffskontrolle muss über GitHub-Zugang, Mehrfaktor-Authentifizierung und Branch-Ruleset erfolgen.

Falls irgendwann eine Änderung gewünscht ist:
1. Der Eigentümer nennt Umfang und konkrete betroffene Funktionen neu und autorisiert die Ausnahme bewusst über einen sicheren Kanal.
2. Eine Änderung wird ausschließlich in einem eigenen, nachvollziehbaren PR entwickelt und in Dar Test getestet.
3. Der Eigentümer prüft und genehmigt den PR ausdrücklich in GitHub. Sperränderungen selbst brauchen dieselbe Freigabe.
4. Erst danach darf der Eigentümer die dafür nötige, eng befristete Änderung der Sperre freigeben; anschließend Sperre wieder vollständig schließen.
5. Kein direkter Push auf main; keine Änderungen an Widgets, Pushs oder produktiven App-Targets außerhalb des genehmigten Umfangs.

**Der Guard sperrt absichtlich alle Änderungen an vollständig geschützten Dateien.** Eine passwortbasierte technische Entsperrung existiert nicht. Dies ist eine Sicherheitsentscheidung: keine schwachen Passwörter oder prüfbaren Hashes im öffentlichen Repository hinterlegen.

## Erweiterung: Repositoryweiter Eigentuemerschutz

- In `.github/CODEOWNERS` ist `* @Sero91ak` definiert: alle Datei-Aenderungen benoetigen bei aktivierter GitHub-Branch-Regel einen Code-Owner-Review.
- Zusaetzlich schuetzt `core-sensitive-change-lock.cjs` Standort, Gebetszeiten, Qibla, native Berechtigungen, Projektkonfiguration, CI-Workflows und Sicherheits-Guards.
- Die Regeln werden nur vorbeugend erzwungen, wenn GitHub eine aktive Main-Ruleset-Pruefung mit verpflichtendem PR, Code-Owner-Review und Statuschecks durchsetzt.
- Alle Aenderungen bleiben nachvollziehbar und beduerfen der ausdruecklichen Freigabe des Eigentuemers. Kein genereller Bypass.
- Dieser PR umfasst ausnahmsweise die Besucher- und Test-App gleichzeitig, weil derselbe gezielte GPS-Fix beide wieder in Einklang bringen muss. Die Mehrspur-Freigabe betrifft nur die App-Lane-Pruefung; sie hebt den kritischen Kern-Schutz nicht auf.
- GitHub verbietet dem Autor einer PR, die eigene PR zu reviewen. Fuer Eigentuemer-PRs ist ein unabhaengiger Reviewer oder ein gesonderter Bot-PR-Autor erforderlich.

## OBLIGATORISCHE GITHUB-EINSTELLUNG — ohne diese NICHT vollständig erzwungen

Im Repository **Settings → Rules → Rulesets** eine aktive Branch-Regel für main erstellen:
- Require a pull request before merging (kein direkter Push auf main).
- Require code owner reviews; stale reviews bei neuen Commits verwerfen.
- Den Statuscheck **Critical Core Change Lock / Protect core location, Qibla and prayer** verpflichtend machen, sobald er in GitHub verfügbar ist.
- Force-Pushes und Branch-Löschung verbieten; Regeln auch für Administratoren anwenden, keinen allgemeinen Bypass festlegen.
- GitHub 2FA/MFA für den Eigentümer einschalten.

**Ohne Ruleset** kann GitHub einen Push schon annehmen, bevor ein nachfolgender CI-Check fehlschlägt; dieser Guard allein kann das nicht verhindern. Das Ruleset kann über die aktuell verfügbare GitHub-Verbindung nicht gesetzt werden und erfordert den Repository-Eigentümer.

## Stand bei Einrichtung

PR #1452 (GPS-/Gebetszeiten-Reparatur) ist eine noch nicht freigegebene Änderung an den nun gesperrten Bereichen. Nicht unbemerkt mergen oder global veröffentlichen. Zuerst gesonderte Eigentümerentscheidung und Prüfung. Diese Sicherheitsänderung betrifft ausschließlich GitHub-Policies und CI; sie verändert weder GPS-Verhalten noch installierte Apps.
