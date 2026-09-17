# Xcode / tvOS – GitHub-Anbindung

## Datenquelle

Staging-Raw-Basis:

`https://raw.githubusercontent.com/Sero91ak/dar-al-tawhid-site/apple-tv-hadith-staging/apple-tv/`

Produktiv wird später nach ausdrücklicher Freigabe dieselbe Struktur auf `main` verwendet.

## Einbau

Diese Dateien in das tvOS-Target übernehmen:

- `apple-tv/xcode/AppleTVContentRegistry.swift`
- `apple-tv/xcode/ScreensaverRotationService.swift`
- `apple-tv/hadith/xcode/HadithModels.swift`
- `apple-tv/hadith/xcode/HadithCardView.swift`
- `apple-tv/hadith/xcode/HadithRemoteService.swift`
- `apple-tv/hadith/xcode/HadithScreensaverProvider.swift`

Alle aktuell im GitHub-Katalog registrierten Inhalte laden:

```swift
let hadiths = try await HadithRemoteService.shared.loadAllHadith()
```

Für den Bildschirmschoner ausschließlich:

```swift
let nextHadith = try await HadithScreensaverProvider.shared.nextHadith()
```

Nicht selbst per `randomElement()` auswählen.

`loadAllHadith()` ist der Standard. Neue Serien werden über `hadith/catalog.json` registriert und müssen nicht im Swift-Code fest eingetragen werden.

## Inhaltstyp oben rechts – verbindlich

Die Typbezeichnung im Kopfbereich darf NIEMALS als fester String `ḤADĪṮ` programmiert werden.

Verwende für jeden angezeigten Datensatz:

```swift
Text(record.displayTypeLabel)
```

oder die vorbereitete View:

```swift
AppleTVContentTypeLabel(record: record)
```

Automatische Zuordnung:

- `recordType = hadith` oder fehlendes `recordType` bei Altbeständen → `ḤADĪṮ`
- `recordType = athar` → `ĀṮAR`
- `recordType = dua` → `DUʿĀʾ`

Damit muss bei einer authentischen Aussage eines Ṣaḥābī, Tābiʿī oder Salaf oben rechts `ĀṮAR` erscheinen und NICHT `ḤADĪṮ`.

Der Name der Person bleibt über `narratorLine` unmittelbar im Inhaltsbereich sichtbar, z. B.:

`Von ʿAbdullāh ibn Masʿūd ist authentisch überliefert:`

Dadurch erkennt der Nutzer sowohl den Inhaltstyp als auch die Person, von der die Aussage überliefert ist.

Neue Inhaltstypen müssen künftig über `recordType` und die zentrale Modelllogik ergänzt werden; nicht durch fest programmierte Texte in einzelnen Views.

## Bildschirmschoner-Rotation – verbindlich

Die Rotationsregel liegt zentral in:

`apple-tv/screensaver/rotation.json`

Der Bildschirmschoner verwendet ein persistentes Shuffle-Bag-System:

- jede verfügbare Aussage einmal zeigen, bevor Wiederholungen erlaubt sind
- Reihenfolge pro Zyklus mischen
- Fortschritt dauerhaft in Application Support speichern
- App-/Apple-TV-Neustart setzt den Zyklus nicht zurück
- neue GitHub-IDs werden in die noch offene Queue integriert
- bereits gezeigte IDs bleiben bis zum Zyklusende gesperrt
- entfernte IDs werden aus dem Zustand entfernt
- nach vollständigem Zyklus neuer Shuffle
- letzte 20 IDs des vorherigen Zyklus dürfen nach Möglichkeit nicht in den ersten 20 Positionen des neuen Zyklus erscheinen
- unmittelbare Wiederholung ist verboten

Die Zahl `20` und weitere Rotationswerte werden aus GitHub gelesen. Nach der einmaligen Swift-Integration können diese Werte später über `rotation.json` angepasst werden, ohne die Auswahl-Logik neu zu programmieren.

Wichtig: Eine bereits kompilierte tvOS-App kann neue Swift-Dateien aus GitHub nicht dynamisch ausführen. Deshalb müssen neue Swift-Strukturen einmal in das tvOS-Target integriert und mit der App gebaut werden. Danach werden neue Inhaltsdaten, Serien und Rotationskonfigurationen automatisch aus GitHub geladen.

## Verhalten

1. `apple-tv/catalog.json` wird von GitHub geladen.
2. Die App erkennt die zentrale Bildschirmschoner-Konfiguration.
3. `hadith/catalog.json` wird geladen.
4. Alle dort registrierten Serien werden automatisch erkannt.
5. Das jeweilige `index.json` bestimmt die Dateien.
6. Nach erfolgreichem Download wird der vollständige gültige Datenstand lokal gecacht.
7. Ist GitHub oder das Internet nicht erreichbar, wird die zuletzt erfolgreich gespeicherte Fassung geladen.
8. Bereits vergebene IDs werden nie verschoben.
9. Die Bildschirmschoner-Queue wird separat und dauerhaft gespeichert.

## Darstellung – verbindlich

Die Aussage darf niemals als einheitlicher schwerer Fließtext gerendert werden.

Visuelle Hierarchie:

1. Überlieferer-/Personenzeile – eigenständige, mittelstarke Typografie
2. kleiner Abstand
3. Sprecherformel – z. B. `Der Prophet ﷺ sagte:` oder bei Āṯār `Er sagte:` – sichtbar semibold und direkt im selben Textblock wie die Aussage
4. Aussage – normale Grundschrift mit gezielten Hervorhebungen
5. kleiner Abstand
6. Quelle – kleiner und optisch zurückgenommen

Der Aussagebereich soll eine begrenzte komfortable Lesebreite haben und nicht unnötig von Bildschirmrand zu Bildschirmrand laufen.

## Fett / Kursiv – keine sichtbaren Markdown-Zeichen

`textMarkdown` ist nur das Datenformat. Es darf niemals direkt so ausgegeben werden:

```swift
Text(record.textMarkdown)
```

Die Darstellung muss ausschließlich über `record.attributedHadith` bzw. `HadithInlineFormatter` erfolgen.

Bedeutung:

- `**…**` = fett
- `*…*` = kursiv / geschwungen
- `***…***` = fett + kursiv, sofern in späteren Daten verwendet

Die Zeichen `**` und `*` selbst dürfen niemals auf Apple TV sichtbar sein.

## Typografie

Nicht alle Ebenen verwenden dieselbe Schriftstärke:

- Überlieferer / Person: semibold / rounded
- Sprecherformel: semibold / rounded
- normaler Aussage-Text: regular
- starke Hervorhebung: bold
- kurvige Hervorhebung: serif + italic
- Quelle: kleiner, regular und secondary

UTF-8 und die wissenschaftliche Unicode-Transliteration müssen vollständig erhalten bleiben.
