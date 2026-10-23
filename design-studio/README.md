# DAR Visual Design Studio · Entwicklungsstand V1

Eigenständiges, browserbasiertes Gestaltungslabor unter `/design-studio/`.

**Sicherheitsgrenze:** Dieser Ordner ist auf dem Branch `studio/visual-design-studio-v1-20261023` entstanden. Er verändert **nicht** automatisch `main`, `test/index.html`, die Besucher-App, die PWA, iOS, Android, Apple TV, Workers, Push oder die vorhandenen Inhalte. Änderungen im Studio werden **nur im Browser-LocalStorage** gespeichert oder als Dateien heruntergeladen. Ohne bewusstes Review und separaten Import gibt es keine Veröffentlichung.

## Funktionen der ersten Umsetzung

- Dreiteilige Studio-Oberfläche mit Seiten-, Komponenten- und Ebenenverwaltung, Artboard und Eigenschaftsinspektor.
- Vorschau für 13 Geräteklassen: kleine/große iPhones, Android-Smartphone, Galaxy Fold geschlossen/offen, iPad mini, iPad Pro 13, Android-Tablet, MacBook Air/Pro, Desktop und Apple TV.
- Hoch-/Querformat, anpassbarer Zoom, Raster und Safe-Area-Hilfslinien.
- Visuelle Designfläche: Text, Kapsel, Button, Karte, Trennlinie, Label, Symbol, Bildplatzhalter, Hero-Fläche und arabischer Text.
- Maus-/Touch-Positionieren, Größenziehen am Handle, Ebenenauswahl, Sichtbarkeit, Sperren, Z-Reihenfolge, Duplizieren, Entfernen.
- Schriftfamilie, -größe, -stärke und Ausrichtung; Textinhalt, Text-/Hintergrundfarbe, Kontur, Eckenradius, Transparenz, Innenabstand.
- Bearbeitung entweder für **alle Geräte** oder als **gerätespezifische Eigenschaftsüberschreibung**.
- Rückgängig/Wiederholen, automatische **lokale** Speicherung, Import/Export als JSON; Export einer eigenständigen HTML-Vorschau.
- Dar-Test-Ansichtsmodus: lädt die bestehende `/test/`-Seite in einem iframe auf **demselben Ursprung**, bietet einen Vorschau-CSS-Inspektor und exportiert nicht angewandte CSS-Vorschläge.

## Im GitHub Codespace ansehen

Die aktuelle Arbeit auf dem Codespace darf dadurch **nicht** überschrieben werden. Statt auf dem bestehenden Branch herumzuwechseln, kann man den Studio-Branch als getrennten Worktree öffnen:

```bash
cd /workspaces/dar-al-tawhid-site
git fetch origin studio/visual-design-studio-v1-20261023
git worktree add --detach ../dar-visual-studio origin/studio/visual-design-studio-v1-20261023
cd ../dar-visual-studio
node design-studio/smoke-test.cjs
node design-studio/dev-server.cjs
```

In Codespaces zuerst prüfen, dass **Port 8765 auf „Privat“** steht. Dann **Ports → 8765 → Im Browser öffnen** und `/design-studio/` an die dort angezeigte URL anhängen. Die `/test/`-Vorschau läuft dadurch mit den **im Studio-Worktree enthaltenen** Testdateien; das ist **keine aktuelle Live-Deployment-Bestätigung**. Alternativ kann die Datei `design-studio/index.html` über den Entwicklungsserver geöffnet werden.

Wenn der Worktree bereits existiert, den `git worktree add`-Befehl nicht wiederholen, sondern die bestehende Arbeitskopie öffnen.

## Vertrauensgrenzen

- **Kein visueller Eingriff in bestehende Quelltexte:** Der Entwurfsmodus gestaltet eigenständige Artboards und schreibt keinen Code in vorhandene DAR-Komponenten.
- **Live-Inspektor ist eine Versuchsfunktion:** CSS wird nur in das iframe-Dokument injiziert; es kann durch einen App-Re-Render verloren gehen. Selektoren sind Vorschläge und können nach Umbauten ungültig werden. In komplexen Elementen mit Kind-Knoten ist die Textbearbeitung absichtlich gesperrt.
- **Keine echten Xcode-Simulatoren:** Es werden Browser-Viewport-Formate simuliert. Native SwiftUI, Apple TV Fokus-, Android-WebView- und iOS-WKWebView-Eigenheiten sind zusätzlich auf echten Geräten zu prüfen.
- **Keine automatische Speicherung nach GitHub:** Exportierte Projektdateien müssen gesichert und später kontrolliert übernommen werden. LocalStorage ist browserspezifisch und kann gelöscht werden.
- **Kein Bild-Upload und keine vollständige Schriftbibliothek in V1:** Bildfläche ist ein Platzhalter. Nicht installierte Schriftfamilien erhalten Ersatzschriften.
- **Keine öffentliche Freigabe ohne Zugriffsschutz:** `robots` ist kein Passwortschutz. Das Studio ist ein Entwicklungswerkzeug und sollte in einem privaten Codespace bleiben.
- **Keine Push-/Deployment-Aktionen:** Es existiert weder ein Backend noch eine GitHub-Token-Abfrage.

## Folgeschritte für die professionelle Vollversion

1. Komponentenkatalog direkt aus den vorhandenen DAR-Stilen ableiten (Kapseln, Navigation, Beitragskarten, Duʿāʾ, Qurʾān, Player, Widgets).
2. Robuster Style-Mapping-Layer mit benannten und versionierten Selektoren statt positionsbasierten CSS-Selektoren; Textänderungen als kontrollierte i18n-Änderung.
3. CSS-Variablen, Breakpoints, Auto-Layout/Flex/Grid und Design-Tokens visuell editierbar; direktes Responsive-Reflow.
4. Assets-/Font-Bibliothek mit Lizenz- und Herkunftsdaten (inkl. arabische Qurʾān-Schriften).
5. Screenshots, Diff-Vorschau, Test-Suite und PR-Workflow, der nur nach Review nach `test/` integriert; Besucher-App bleibt separat freigabepflichtig.
6. Teamsitzungen, geräteübergreifende Synchronisierung, Versionsverlauf und Berechtigungen erst nach Authentifizierung und Backend-Design.

Für eine vollständige produktionsfähige Designplattform sind diese Arbeiten zusätzlich erforderlich; V1 ist ein funktionsfähiger **isolierter Editor**, keine fertig integrierte DAR-App-Entwicklungsumgebung.
