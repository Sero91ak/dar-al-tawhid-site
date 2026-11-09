# DĀR AL TAWḤĪD · Global HeroDock V2 (verbindlich)

**Stand: 09.11.2026.** Ziel: Einheitliches, dauerhaftes Verhalten für **alle fotografischen Kopfbereiche der Erwachsenen-App**, auch bei künftigen neuen Seiten. Kein Ersatz für andere Inhalte, keine neue Navigation, keine neuen Bilder.

## Architekturvertrag
- **Ein Layout-Eigentümer:** \`assets/dar-global-herodock-v2.js\` und \`.css\` für alle geeigneten Erwachsenen-Bild-Heros. Der vorhandene Frauen-Hero \`#darFrauenHeroDockV1416\` ist ausgenommen und bleibt Eigentümer seines eigenen Bild-/Suchsystems.
- **Original statt Klon:** Bildtragender Header, verlinkte Buttons, Suche und sämtliche Text-/Quelleninhalte bleiben als ORIGINAL-DOM-Knoten am ursprünglichen Platz. Fixiertes Positionieren ist rein visuell; es wird weder die Bild-URL noch Post-ID, Route oder Listener-Verankerung verändert.
- **Vollbreite:** Das Bild füllt den **wirklichen App-Lesebereich**. Smartphone/Hochkant/Querformat/iPad = vollständige nutzbare App-Fläche. Fold/Dual-Pane = rechte Lesespalte, nie über die linke Navigation oder Falz. Auf der öffentlichen Desktop-Website gilt deren eigener Layout-Owner.
- **Unter dem Header:** Die geometrische Oberkante des Bilds entspricht der tatsächlichen Unterkante des vorhandenen Markenheaders; im DAR-Test-Fold-V2 entspricht sie dessen Topbar. Kein zweiter Header-Observer, keine pauschalen \`100vw\`-Breakout-Margins oder manuell geschätzten Geräte-Offsets.
- **Scroll-Achse:** Der Hero bleibt oben angeheftet, der Seiteninhalt scrollt im **bereits existierenden** Document-/Pane-Scroller darunter. Eine einzige gemessene Platzreserve gleicht genau die sichtbare Höhe von Bild plus optionaler Suche aus. Keine Scroll-Event-Patches, \`preventDefault\`, Scroll-Writes, Klone oder zusätzlichen Scrollcontainer.
- **Fotografischer Schutz:** Nur Header mit tatsächlichem \`background-image: url(...)\`, echtem ausreichend großem Bild oder explizit mit \`data-dar-herodock="photo"\` aktivierter Bildfläche werden angedockt. Reine Überschriften, Tabellen, Beitragstextbilder, Leser, Qurʾān, Duʿāʾ-Lernplayer, Popups, Home-Gebetszeiten, Kids, Admin, tvOS und Apple Watch bleiben ausgeschlossen.
- **Responsiv:** Containerbreite statt Gerätenamen, Orientierung, Safe Areas, Fold, Split-View, Landscape, große Schrift, lange Titel, 9 Sprachen, RTL, \`prefers-reduced-motion\` und Salbei/Dār al-Layl prüfen. Kein Zuschnitt, der Titel oder Bedienelemente verschluckt.
- **Künftige Bereiche:** Der Renderer erstellt die echte fotografische Kopffläche im normalen Inhaltsbereich und setzt \`data-dar-herodock="photo"\` **auf den eigentlichen Kopfblock**, nicht auf ein Beitragsbild oder eine Karte. Eine neue zweite Dock-Engine, neue CSS-Notfall-Patches oder eigene Größenberechnungen sind nicht zulässig.

## Bestand / Auto-Erkennung
| Seite | Bekannte reale Hero-Position | Verhalten |
|---|---|---|
| Beiträge | \`.post-reader > .post-reader-title\` | Bild anheften, Titel und Actions erhalten |
| Themenübersicht | \`.topics-hub > .view-head\` | Hero anheften, Suche optional |
| Themendetail | \`.topic-collection-page > .view-head\` | Hero anheften |
| Ḥadīṯ Übersicht/Werk/Kitāb/Bāb | \`.hadith-hub > .view-head\` | Original-Bild anheften, Suchfeld optional |
| Duʿāʾ/Bibliothek/Propheten | \`.dua-hub\`, \`.books-library-shell\`, \`.prophets-hub\` mit fotografischem Header | Bild anheften, falls tatsächlich vorhanden |
| Gelehrte/Personen | \`.scholars-index__header\` | Nur anheften, wenn diese konkrete Ansicht ein freigegebenes Foto enthält; keine Fotos erfinden |
| Frauen im Islam | \`#darFrauenHeroDockV1416\` | **Unverändert**, eigener bewährter Layout-Eigentümer |
| Neue Erwachsenen-Bereiche | \`data-dar-herodock="photo"\` | Automatische Bild- und Pane-Erkennung |

## Release-Gates
Vor jeder neuen Hero-Seite: echte CSS-Kaskade laden, Fotoerkennung, Pixel-Deckung von Pane/Markenheader, 0/Mehrfach-Scroll, Routewechsel, Suchfokus/Caret, Touch-Targets, lesbare Inhalte, 320–1920px, Fold-V2 mit isoliertem Scroller, zwei Themes, RTL und Reduced Motion testen. Zuerst DAR Test/isolierter PR; erst mit grünen CI-Checks, aktueller Freigabe und produktiver Cloudflare-Live-Verifikation nach \`main\`. GitHub-Push allein ist keine Live-Freigabe.

**Kein Eingriff** in Originalbilder, Content, Q-Quellen, Scroll-History, OneSignal, iOS Swift, Android Signierung, Kinder-App oder die bestehende Shell-Route.
