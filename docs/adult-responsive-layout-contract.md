# DĀR AL TAWḤĪD · verbindlicher Erwachsenen-Layoutvertrag
Stand: 01.11.2026 · Status: Architektur- und Abnahmeregel, keine Live-Implementierung

## Ziel und Geltungsbereich
Diese Regel gilt für jede künftige Änderung am öffentlichen Erwachsenen-Webauftritt, an der nativen iOS-Besucher-App/WebView, an der Android-PWA und an DAR Test, sofern die Komponente dort existiert. Sie ersetzt ältere, widersprechende Layoutanweisungen (insbesondere „Neueste Beiträge nur als winziger Einstieg“), **nicht** die festen Inhalts-, Quellen-, Neunsprachen-, Veröffentlichungs- und Push-Sicherheitsregeln. Kids, tvOS und Admin bleiben ohne eigenen Auftrag unverändert.

## 1. Grundgesetz: Shell steuert, Feature fügt sich ein
- Jede Oberfläche hat genau einen Layout-Eigentümer (Shell/Route). Ein Feature darf seine übergeordnete Seitenbreite, Navigationsleiste, globale Scrollachse, Safe Areas, Headerstruktur oder Geschwisterreihenfolge nicht autonom überschreiben.
- Gemeinsam sind Design-Tokens, Inhalt/Metadaten, Bedeutung, Zustände und Interaktionsvertrag. **Nicht** identisch sein müssen Pixelbreiten, Spaltenzahl, Navigation oder Desktop-/Mobile-Markup.
- Öffentliches Browser-Web/Desktop ist eine eigenständige responsive Oberfläche (aktuell über Cloudflare-Routing und desktop-preview); native iOS-Besucher-App und Android-PWA sind separat zu prüfen. DAR Test ist der Abnahmeort vor einer Freigabe.
- Jedes Feature deklariert in seiner Dokumentation: Ziel-Surface, Route, Besitzer-Container, zulässige Einfügeposition, Datenquelle, Theme-/Locale-Abhängigkeiten und Regressionseinflüsse.
- **Keine globale CSS-Korrektur mit ungezielten Selektoren, `!important`, 100vw, absoluten Offsets oder DOM-Reparenting**, wenn eine lokal begrenzte Komponentenlösung möglich ist. Vorhandene globale Korrekturen nur gezielt, mit Regressionstest und Rollback-Möglichkeit anfassen.

## 2. Responsive Verhalten nach verfügbarem Platz
- Basis: Mobile-first, echtes Containermaß, `min-width:0`, `max-width:100%`, `box-sizing:border-box`, dynamische Inhaltsgrößen; bevorzugt CSS Grid/Flex und bei Bedarf Container Queries. Keine festen Modellnamen als alleinige Anpassungslogik.
- Smartphone außen/kompakt: einspaltig; Text bricht sauber um; Handlungsflächen ausreichend groß.
- Foldable geöffnet, Dual-/Split-View und Tablet: Ein- oder Zweispaltenlayout **nur wenn die tatsächliche Pane-Breite genügt**; Falz, Ränder, Safe Areas und unabhängige Scrollbereiche beachten. Kein ungewolltes übergreifendes horizontales Seitenscrollen.
- Desktop (Maus/Keyboard, breite Viewports): bewusst eigenständige, breitenbegrenzte Lesespalten und stimmiges Gesamtgrid; keine hochskalierte Smartphone-Kapsel als vollständiges Desktoplayout.
- RTL für ar/ckb, lange deutsche/türkische/kurdische Titel, Schriftvergrößerung, Zoom, Querformat, Dark/Light und `prefers-reduced-motion` mitprüfen.
- Test-Referenzbreiten: 320, 360, 390, 430, 600, 768, 1024, 1280, 1440, 1920 CSS-Pixel und reale Fold-/Split-Panes. Werte sind **Prüfpunkte**, keine starren CSS-Breakpoints.

## 3. Designsystem „Smart Dashboard AI UI“
- Ruhige dunkelgrüne/nachtblaue Flächen, zurückhaltendes Gold, hochwertige Schrift und klare Hierarchie; ausgewählte Themes respektieren.
- **Eine Hauptkapsel pro abgegrenztem Bereich**. Innerhalb davon bevorzugt Weißraum, feine Trennlinien und ruhige Typografie statt ineinander verschachtelter Karten/Rahmen.
- Kapsel, Schriften, Trennlinien, Abstände, Icons und Zustände über wiederverwendbare semantische Tokens; keine isolierten Zufallswerte pro Gerät.
- Zustandsbasiert und ressourcenschonend, ohne erzwungene Animation, Autoscroll, unkontrollierte MutationObserver-Schleifen oder Layout-Sprünge.

## 4. Verbindlicher Beitragsbereich auf der Erwachsenen-Startseite
- Position **bleibt direkt nach Qurʾān**; Gebetszeiten, Salām, Ibn-Sīrīn, Qibla/Bibliothek, Suche und Qurʾān bleiben in ihrer bereits vereinbarten Reihenfolge unberührt.
- Ersetzt die alte rein kompakte Zeile durch **eine** gut lesbare Premium-Hauptkapsel, keine Kapseln innerhalb der Kapsel: Datum/Kategorie, echter Beitragstitel, kurzer aus geprüften Metadaten/Inhalt abgeleiteter Auszug, Quelle, „Beitrag lesen“, diskreter Positionszähler.
- Die neuesten veröffentlichten Beiträge innerhalb der **letzten fünf Berliner Kalendertage**, mehrere Beiträge am selben Tag inklusive, horizontal per Pointer-/Touch-Swipe mit Scroll Snap durchblätterbar; zusätzlich optional per Pfeilbuttons. Kein automatisches Weiterblättern. Der aktuellste Beitrag steht zuerst; nach Rückkehr bleibt der zuletzt gewählte Beitrag oder per expliziter Aktualisierung wieder der aktuellste sichtbar, nie ungewollter Sprung beim Lesen.
- Optionaler Button klappt **innerhalb desselben Hauptbereichs** eine flache, durch feine Linien gegliederte Beitragsübersicht auf und zu. Auf allen Geräten funktionsfähig, auf Desktop zusätzlich per Maus/Tastatur. Kein verschachtelter Kartenstapel.
- Mindestens der letzte tatsächlich veröffentlichte Beitrag bleibt sichtbar, wenn das Fünf-Tage-Fenster leer ist, mit korrekter Kennzeichnung (nicht als „neu“ deklarieren). Bei Offline-/API-Fehlern kein leer gerendertes Dashboard und kein unkontrollierter Ladespinner.
- Die normale Beitrags-Detailnavigation, Zurückverhalten, die kanonische Post-ID und die vorhandene Quellen-/I18n-Logik bleiben maßgeblich. Keine neue OneSignal-Sendung durch ein Layout-Update.
- Der Beitragsswiper darf nur horizontale **bewusste** Gesten übernehmen, nicht das vertikale Seitenscrollen, Zoom oder Scrollen in anderen Bereichen blockieren.

## 5. Technische Zuordnung (Ist-Stand vom 01.11.2026 prüfen, nicht blind überschreiben)
- Öffentliche Browser-Website: `cloudflare/site-router.js` behandelt Browseraufrufe als Website-Surface und verwendet die Oberfläche unter `desktop-preview/`; Änderungen dort brauchen eigene Desktop-Abnahme.
- Besucherende iOS-/PWA-Startseiten: `assets/dar-home-recent-posts-v1.js`, `assets/dar-home-recent-posts-v1.css` und bestehende Besucher-Home-Komponenten/Router. Nicht davon ausgehen, dass Styles für die WebView automatisch die öffentliche Desktop-Site ändern.
- Bereits existierende Responsive-Regeln (z. B. `assets/adult-responsive-viewport-v1381.css`) und Dar-Test-Korrekturen vor Änderungen inventarisieren. Konfliktierende CSS- und DOM-Eigentümer entflechten, nicht weitere Patch-Schichten stapeln.
- Eine kanonische Beitragsdatenquelle; per Surface getrennte Präsentations-Adapter ohne duplizierte Daten oder automatisch doppelte Startseitenbereiche.
- Erwachsenen-UI sofort in allen neun vereinbarten Sprachen; arabische Primärquellen oder Fachinhalte nie ungenehmigt übersetzen.

## 6. Pflichtprüfung vor jeder Freigabe
1. **Inventar/Auswirkungsanalyse:** echte Route/Shell/Einfügeposition und bestehende CSS-/JS-Owner erfassen; Konflikte mit alten Regeln benennen.
2. **Staging zuerst:** nur DAR Test oder eigener Branch/Preview; niemals durch bloßes Designbriefing einen Live-Deploy oder Beitrags-Push auslösen.
3. **Visuell:** mobile, Fold außen/innen, Tablet (Portrait/Landscape), Desktop (schmal/breit), Zoom und RTL; keine Überläufe, Layoutverschiebungen, abgeschnittene Texte oder überdeckten Controls.
4. **Funktional:** Öffnen/Schließen, horizontales Swipen vs. vertikales Scrollen, Keyboard, Screenreader, Fokus, Zurücknavigation, Browserhistorie, Sprachen, Themes, Laden/Fehler/Leerzustand; Gebetszeiten, GPS, Suche, Qurʾān und fünf Navigationstabs nicht beschädigen.
5. **Automatisiert:** vorhandene Regression-Skripte im Repository plus echten Browser-E2E-/Screenshot-Diff-Check je Surface ausführen; fehlende Tests ergänzen. String-/Quelltextasserts sind **kein Ersatz** für laufende Browser-Interaktionstests.
6. **Rollout/Beweis:** veröffentlichte Assets und korrekte Surface/Cache-Version nachweisen. Bei Fehlschlag Rollback, keine Behauptung „repariert“ ohne geprüften Browserbefund.

## 7. Änderungsdisziplin
Erst Analyse, dann kleinen isolierten Patch, dann Tests, dann Vorschau, dann separate Live-Freigabe. Keine Komplettneuerstellung der Website, keine Änderung an Kids, Push, Gebetszeitberechnung oder anderen Bereichen nur zur Reparatur der Beitragskapsel. Jede neue Komponente ist erst fertig, wenn die **richtige Zuordnung an jeder betroffenen Surface** nachweislich funktioniert.
