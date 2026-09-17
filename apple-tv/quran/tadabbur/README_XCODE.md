# Xcode Integration – Apple TV Qurʾān Tadabbur

## Geltungsbereich

Nur das Apple-TV-/tvOS-Target. Keine Änderungen an iOS, WebView, Widgets, Watch-App oder Screensaver.

Vorgesehene Integrationsdateien im Xcode-Projekt:

- `DarAlTawhid/DarAlTawhidTV/TVVerseAndPrayerRows.swift`
- falls zwingend notwendig: `DarAlTawhid/DarAlTawhidTV/ContentView.swift`

## Datenquelle

Raw-Basis:

`https://raw.githubusercontent.com/Sero91ak/dar-al-tawhid-site/apple-tv-hadith-staging/apple-tv/quran/tadabbur/`

Katalog:

`catalog.json`

Verifizierte Einträge:

`entries.json`

## Swift-Modell

```swift
struct TVQuranTadabbur: Codable, Hashable {
    let text: String
    let narrator: String
    let generation: String
    let source: String
    let reference: String
    let grading: String
}
```

Das bestehende Apple-TV-Versmodell wird ausschließlich im tvOS-Target erweitert:

```swift
struct TVQuranVerse: Identifiable {
    let id: String
    let reference: String
    let text: String
    let tadabbur: TVQuranTadabbur?
}
```

## Lookup-Regel

Versreferenzen werden kanonisch als `Sūrah:Āyah` gespeichert, z. B. `13:28`.

Beim Rendern:

1. `entries.json` laden und lokal cachen.
2. Einträge nach `reference` indexieren.
3. Für den aktuellen Vers exakt über `verse.reference` nachschlagen.
4. Bei Treffer Karte mit Text, Überlieferer, Generation, Quelle und Einstufung anzeigen.
5. Bei keinem Treffer niemals eine Aussage erzeugen. Stattdessen exakt anzeigen:

`Für diesen Vers liegt derzeit keine geprüfte Salaf-Überlieferung vor.`

## Darstellung

- direkt unter dem Qurʾān-Vers
- ruhige transparente Fläche
- goldene Akzente passend zum bestehenden tvOS-Design
- Erklärung maximal drei sichtbare Zeilen
- Überlieferer + Generation sichtbar
- Quelle + Einstufung sichtbar
- Versreferenz sichtbar
- keine Überlagerung des Qurʾān-Textes
- keine unnötig großen Abstände
- lange Texte mit `lineLimit(3)` und geeigneter tvOS-Skalierung

## Sicherheitsregel

Keine dynamisch erzeugten oder vom Modell improvisierten Tadabbur-Texte. Die TV-App rendert ausschließlich GitHub-Daten oder den Fallback.

## Wichtig

Die GitHub-Datenebene ist vorbereitet. Die eigentlichen Xcode-Dateien `TVVerseAndPrayerRows.swift` und `ContentView.swift` befinden sich nicht in diesem Repository und können deshalb hier nicht kompiliert oder direkt gepatcht werden.
