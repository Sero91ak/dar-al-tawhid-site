# Xcode / tvOS – GitHub-Anbindung

## Datenquelle

Staging-Raw-Basis:

`https://raw.githubusercontent.com/Sero91ak/dar-al-tawhid-site/apple-tv-hadith-staging/apple-tv/hadith/`

Produktiv wird später nach ausdrücklicher Freigabe dieselbe Struktur auf `main` verwendet.

## Einbau

Diese Dateien in das tvOS-Target übernehmen:

- `HadithModels.swift`
- `HadithCardView.swift`
- `HadithRemoteService.swift`

Alle aktuell im GitHub-Katalog registrierten Ḥadīṯ-Serien laden:

```swift
let hadiths = try await HadithRemoteService.shared.loadAllHadith()
```

`loadAllHadith()` ist der Standard. Neue Serien wie `051-100` oder `101-150` werden später über `hadith/catalog.json` registriert und müssen nicht im Swift-Code fest eingetragen werden.

## Verhalten

1. `hadith/catalog.json` wird von GitHub geladen.
2. Alle dort registrierten Serien werden automatisch erkannt.
3. Das jeweilige `index.json` bestimmt die Dateien und Reihenfolge.
4. Nach erfolgreichem Download wird der vollständige gültige Datenstand lokal gecacht.
5. Ist GitHub oder das Internet nicht erreichbar, wird die zuletzt erfolgreich gespeicherte Fassung geladen.
6. Bereits vergebene IDs werden nie verschoben.

## Darstellung – verbindlich

Die Ḥadīṯ-Karte darf niemals als einheitlicher schwerer Fließtext gerendert werden.

Visuelle Hierarchie:

1. Überliefererzeile – eigenständige, mittelstarke Typografie
2. kleiner Abstand
3. `Der Prophet ﷺ sagte:` – sichtbar semibold, direkt im selben Textblock wie die Aussage
4. Ḥadīṯ-Text – normale Grundschrift mit gezielten Hervorhebungen
5. kleiner Abstand
6. Quelle – kleiner und optisch zurückgenommen

Der Aussagebereich soll eine begrenzte komfortable Lesebreite haben und nicht unnötig von Bildschirmrand zu Bildschirmrand laufen.

## Fett / Kursiv – keine sichtbaren Markdown-Zeichen

`textMarkdown` ist nur das Datenformat. Es darf niemals direkt so ausgegeben werden:

```swift
Text(hadith.textMarkdown)
```

Das würde Steuerzeichen wie `**` oder `*` sichtbar machen und ist verboten.

Die Darstellung muss ausschließlich über `hadith.attributedHadith` bzw. `HadithInlineFormatter` erfolgen.

Bedeutung:

- `**…**` = fett
- `*…*` = kursiv / geschwungen
- `***…***` = fett + kursiv, sofern in späteren Daten verwendet

Die Zeichen `**` und `*` selbst dürfen niemals auf Apple TV sichtbar sein.

`HadithInlineFormatter` entfernt die Steuerzeichen ausdrücklich und weist den Textsegmenten native tvOS-Schriftstile zu. Dadurch bleibt die Darstellung auch dann korrekt, wenn Apples eingebauter Markdown-Parser einen Datensatz nicht verarbeiten kann.

## Typografie

Nicht alle Ebenen verwenden dieselbe Schriftstärke:

- Überlieferer: semibold / rounded
- Sprecherformel: semibold / rounded
- normaler Ḥadīṯ-Text: regular
- starke Hervorhebung: bold
- kurvige Hervorhebung: serif + italic
- Quelle: kleiner, regular und secondary

UTF-8 und die wissenschaftliche Unicode-Transliteration müssen vollständig erhalten bleiben.
