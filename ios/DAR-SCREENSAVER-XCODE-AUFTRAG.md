# Xcode-Auftrag: Bildschirmschoner DĀR AL TAWḤĪD

**Status:** verbindlicher Umsetzungsauftrag  
**Zielprojekt:** `ios/DarAlTawhid/DarAlTawhid.xcodeproj`  
**Plattform:** native iOS-App in Xcode (Swift). Apple TV später dieselbe Engine, nicht die Web-App.  
**Phase 1:** nur Bildschirmschoner. Kein Vers-Sync zur Recitation.

## 1. Auftrag in einem Satz

In der nativen iOS-App einen Bildschirmschoner bauen: der Nutzer wählt den Hintergrund (eigenes Bild **oder** Siegel-Deckblatt). Darauf wechseln Ḥadīth, Duʿāʾ und Qurʾānverse zufällig, die Anzeigedauer richtet sich nach der Textlänge.

## 2. Was dieser Auftrag nicht ist

- Nicht die Ladeseeite / Boot-Overlay (`WebAppView` Loading mit rundem Siegel) umbauen.
- Nicht Home, Beiträge, Navigation, Gebetszeiten, Qibla, Push, Service Worker oder Web-`index.html` anfassen.
- Nicht Qurʾān-Audio an den sichtbaren Vers koppeln. Recitation bleibt in Phase 1 reine Audio.
- Keine fremden Hadith-Websites. Keine maschinellen Übersetzungen.

## 3. Wo es in Xcode sitzt

Bestehende App ist ein `WKWebView` (`WebAppView.swift`) über `DarAlTawhidApp.swift`.

Der Bildschirmschoner ist ein **natives Vollbild-Overlay** über der WebView, nicht eine HTML-Seite.

Neue Dateien im Target `DarAlTawhid`:

| Datei | Aufgabe |
|---|---|
| `DarScreensaverView.swift` | Vollbild-Darstellung |
| `DarScreensaverEngine.swift` | Pool, Shuffle, Dauer |
| `DarScreensaverSettings.swift` | Hintergrundwahl, Idle-Zeit, Inhaltsschalter |
| `DarScreensaverItem.swift` | Modell: Typ, Texte, Quelle, Dauer |

Einbindung: Overlay in `WebAppView` einhängen. Bestehende IDs, Tab-Bar, Deep Links und Loading-Overlay nicht entfernen.

## 4. Hintergrund — Nutzerwahl

Zwei Modi, umschaltbar in den Einstellungen des Bildschirmschoners:

### A. Bild
- Nutzer wählt ein Foto aus der Mediathek oder ein mitgeliefertes ruhiges Asset.
- Vollflächig, `scaleAspectFill`, dunkel abgedeckt (leichte dunkle Schicht), damit Schrift lesbar bleibt.
- Kein grelles Foto ohne Abdeckung.

### B. Siegel-Deckblatt
- Keine große Karte mit dicker Umrandung.
- Ruhige Fläche (dunkel oder themenpassend).
- Rundes Markensiegel (`BrandMark`) dezent, nicht als Haupttext.
- Schrift der Stücke steht frei auf der Fläche.
- Feine, dünne Linien nur wo nötig. Keine Kasten-Batterie.

Solange der Nutzer kein eigenes Bild gelegt hat: Fallback **Siegel-Deckblatt**.

## 5. Inhalt auf dem Schoner

Drei Sorten, im Wechsel, Shuffle ohne sofortige Wiederholung desselben Stücks:

1. **Qurʾānvers** — Arabisch groß, deutsch darunter, Sure und Āyah-Nummer klein.
2. **Duʿāʾ** — Arabisch, deutsch, bibliographische Quellenzeile klein.
3. **Ḥadīth** — nur geprüfte deutsche Übersetzung, Überlieferer, Buch und Nummer, Status ṣaḥīḥ/ḥasan.

Auf dem Fernseher/iPhone **keine** fremden URLs, kein `https://`, keine Dorar-/Sunnah.com-Links. Sichtbare Quelle nur Werk + Stelle. Interne Kurzlinks `dar-al-tawhid.de/q/<n>` nur wenn das Stück bereits einen geprüften Kurzlink hat; sonst nur bibliographische Zeile.

Sprache der Bedeutung: **Deutsch**. Arabisch bleibt sichtbar, wo vorhanden.

## 6. Pflicht-Quellen (keine anderen)

Nur vorhandene, geprüfte DAR-Bestände:

| Typ | Quelle im Repo |
|---|---|
| Qurʾān | `content/quran/<sure>.json` → `verses[].ar`, `verses[].de`, Sure/Āyah |
| Duʿāʾ | `content/duas/duas.json` → `ar`, `de`, `src` |
| Ḥadīth | App-Hadith-Bibliothek `/data/hadith/…` **nur** wenn `germanStatus === "verified"` und Grad ṣaḥīḥ oder ḥasan |

Ablehnen:

- `germanStatus` machine / review / missing
- ungeprüfte Importe
- Widget-Dummytexte aus `DarDailyContent.swift` als Dauerpool

Phase-1-Minimum, falls der Hadith-Datensatz im Bundle noch dünn ist: Qurʾān + Duʿāʾ vollständig, Ḥadīth sobald verifizierte DE-Einträge gebündelt sind. Leere Karten nicht zeigen.

## 7. Anzeigedauer nach Textlänge

Dauer aus dem sichtbaren deutschen Text plus Arabisch, in Zeichen:

```
seconds = clamp(round(charCount / 12), 8, 180)
```

| Text | Dauer |
|---|---|
| sehr kurz | 8 s |
| mittel | ca. 20–45 s |
| lang | bis 180 s (3 min) |

- Ein Stück bleibt die volle Dauer, dann weicher Wechsel (Fade 0,6 s).
- Pause per Tap/Remote: Stück steht.
- Nächstes Stück: nicht dasselbe wie die letzten 8.
- Reihenfolge: gemischter Zufall, nicht starr Qurʾān→Duʿāʾ→Ḥadīth in Endlosschleife, aber alle drei Sorten kommen vor, sofern der Pool sie hat.

## 8. Start, Ende, Audio

**Start**

- Automatisch nach Idle (Vorschlag 90 s ohne Touch), **oder**
- eigener Eintrag unter Mehr / Einstellungen: „Bildschirmschoner“.

**Ende**

- Jede Taste, jeder Tap, jede Remote-Aktion: Overlay zu, zurück in die aktuelle App-Ansicht (Menü/WebView).
- Kein erneutes Boot-Logo.

**Qurʾān-Audio (Phase 1)**

- Läuft Recitation, darf sie **weiterlaufen**.
- Der Schoner folgt **nicht** dem gehörten Vers.
- Bild und Ton sind getrennt: Audio im Hintergrund, Text-Shuttle auf dem Screen.
- Vers-Sync ist ein **folgender** Auftrag, nicht dieser.

## 9. Darstellung

- Vollbild, Safe Area achten (Notch, Home-Indicator).
- Große, lesbare Schrift (10-foot später für tvOS; iPhone schon jetzt großzügig).
- Typ-Kicker klein: `QURʾĀN` / `DUʿĀʾ` / `ḤADĪTH`.
- Keine Prozentzahl, kein Ladebalken (das gehört nur zum App-Start).
- Keine dicken Rahmen um den Text.
- Light/Royal: Kontrast prüfen, Schrift nicht im Siegel oder im hellen Bildteil verlieren.

## 10. Einstellungen, die der Nutzer braucht

Native kleine Settings-Seite oder Abschnitt, nur für diesen Bereich:

- Bildschirmschoner ein/aus
- Idle-Sekunden
- Hintergrund: Siegel-Deckblatt / eigenes Bild
- Qurʾānverse ein/aus
- Duʿāʾ ein/aus
- Ḥadīth ein/aus (nur geprüfte)
- Mindest- und Höchstdauer optional, Default wie Formel in §7

Einstellungen lokal auf dem Gerät speichern (`UserDefaults`). Keine Push-Kampagne, kein Serverzwang.

## 11. Xcode-Umsetzung, technisch

- Swift, UIKit oder SwiftUI, passend zum bestehenden UIKit-`WebAppView`.
- Overlay `isUserInteractionEnabled = true`, liegt über der WebView, unter nichts anderem als System-Alerts.
- Timer auf `RunLoop.main`, im Hintergrund pausieren wenn App inactive, außer Audio soll weiterlaufen.
- Bilder: PhotoPicker; kein unbegrenztes Original im Memory — max. Anzeigegröße skalieren.
- JSON der Quellen: entweder gebündelte Kopie der geprüften Pools oder Laden von `https://dar-al-tawhid.de/content/…` mit Cache. Kein Scraping.
- Accessibility: VoiceOver liest deutschen Text; Arabisch als Text, nicht als Bild.

## 12. Tests vor Abnahme

1. Siegel-Deckblatt: Text lesbar, keine Kasten-Ränder, Siegel nicht den Vers überdecken.
2. Eigenes Bild: dunkle Schicht, Schrift bleibt lesbar.
3. Kurzer Vers ~8–12 s, lange Duʿāʾ deutlich länger.
4. Shuffle wiederholt dasselbe Stück nicht sofort.
5. Tap schließt den Schoner, WebView/Menü ist wieder da.
6. Recitation (falls vorhanden) stirbt nicht beim Öffnen des Schoners.
7. Ḥadīth ohne `verified` erscheint nicht.
8. Keine fremde URL auf dem Screen.
9. Light- und Dark-/Royal-Fläche prüfen.
10. Bestehende Ladeseeite unverändert.

## 13. Abnahme durch Auftraggeber

Fertig erst wenn:

- Hintergrundwahl Bild **und** Siegel-Deckblatt funktionieren
- Ḥadīth, Duʿāʾ, Qurʾānverse nach Länge wechseln
- Schoner nativ in Xcode in der iOS-App liegt
- Ladeseeite, Push, Gebet, Web-Layouts unberührt sind

Apple TV: dieselbe Engine später als eigenes Target, nicht die Handy-Web-App auf den Fernseher spiegeln.

## 14. Reihenfolge für den Programmierer

1. Settings + Overlay-Gerüst in Xcode.
2. Siegel-Deckblatt + Textdarstellung.
3. Qurʾān-Pool aus `content/quran`.
4. Duʿāʾ-Pool aus `content/duas/duas.json`.
5. Längenformel und Shuffle.
6. Bild-Hintergrund.
7. Geprüfte Ḥadīthe, sobald der verifizierte DE-Satz im Bundle liegt.
8. Idle-Start und Tap-Exit.
9. Geräte-Test iPhone, danach iPad.

Kein Live-Besucher-Push. Keine Änderung an `cloudflare/worker.js`.
