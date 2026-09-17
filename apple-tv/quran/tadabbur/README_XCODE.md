# Xcode Integration – Apple TV Qurʾān Tadabbur

## Geltungsbereich

Nur das Apple-TV-/tvOS-Target.

Nicht verändern:
- iOS-App
- WebView
- Widgets
- Watch-App
- Screensaver

Vorgesehene Integrationsdateien im Xcode-Projekt:

- `DarAlTawhid/DarAlTawhidTV/TVVerseAndPrayerRows.swift`
- falls zwingend notwendig: `DarAlTawhid/DarAlTawhidTV/ContentView.swift`

## GitHub-Datenquelle

Raw-Basis:

`https://raw.githubusercontent.com/Sero91ak/dar-al-tawhid-site/apple-tv-hadith-staging/apple-tv/quran/tadabbur/`

Zentraler Einstieg:

`catalog.json`

Danach:

`entries-index.json`

Der Index listet alle geprüften Datendateien. Xcode darf nicht nur `entries.json` fest verdrahten, sondern muss alle Dateien aus `entries-index.json` laden.

Aktuell:

- `entries.json` – 31 geprüfte Einträge
- `entries-batch-02a.json` – 10
- `entries-batch-02b.json` – 10
- `entries-batch-02c.json` – 10
- `entries-batch-02d.json` – 12

Gesamt: 73 geprüfte Verszuordnungen.

## Datenmodell

```swift
struct TVQuranTadabbur: Codable, Hashable {
    let reference: String
    let text: String
    let narrator: String
    let generation: String
    let source: String
    let grading: String
    let relation: String?
    let note: String?
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

## Fertiger Support-Code

Verwende als Grundlage:

`xcode/TVQuranTadabburSupport.swift`

Dieser Service:

1. lädt `catalog.json`,
2. lädt `entries-index.json`,
3. lädt alle registrierten Batches,
4. validiert Anzahl, Referenzen und doppelte IDs,
5. vereinigt alles nach exakter `Sūrah:Āyah`-Referenz,
6. cached nur einen vollständig validierten Stand,
7. behält bei Netzwerk- oder Datenfehlern den letzten gültigen Cache.

## Lookup-Regel

Versreferenzen sind kanonisch `Sūrah:Āyah`, zum Beispiel `13:28`.

Beim Rendern:

```swift
TVQuranTadabburCard(
    reference: verse.reference,
    tadabbur: tadabburStore.entry(for: verse.reference)
)
```

Bei keinem geprüften Treffer niemals Text erzeugen oder ableiten. Exakt anzeigen:

`Für diesen Vers liegt derzeit keine geprüfte Salaf-Überlieferung vor.`

## Vollständige Versabdeckung

`coverage.json` beschreibt 114 Sūren und 6.236 Verse.

„Vollständige Abdeckung“ bedeutet:

- geprüfter Eintrag vorhanden → diesen anzeigen,
- kein geprüfter Eintrag vorhanden → Fallback anzeigen.

Es bedeutet ausdrücklich nicht, dass für jeden Vers eine Aussage erfunden oder lose thematisch zugeordnet wird.

## Darstellung

- direkt unter dem Qurʾān-Vers
- ruhige transparente Fläche
- goldene Akzente passend zum tvOS-Design
- Erklärung maximal drei sichtbare Zeilen
- Überlieferer und Generation sichtbar
- Quelle und Einstufung sichtbar
- Versreferenz sichtbar
- keine Überlagerung des Qurʾān-Textes
- keine unnötig großen Abstände
- lange Texte mit `lineLimit(3)` und angemessener tvOS-Skalierung

## Sicherheitsregel

Keine dynamisch erzeugten Tadabbur-Texte.
Keine erfundene Zuschreibung.
Keine automatische Ersetzung fehlender Salaf-Aussagen durch KI-Text.

Die TV-App rendert ausschließlich geprüfte GitHub-Daten oder den festen Fallback.

## Noch erforderlich im eigentlichen Xcode-Repository

Die Dateien `TVVerseAndPrayerRows.swift` und `ContentView.swift` liegen nicht in diesem Repository. Daher kann hier kein echter tvOS-Build durchgeführt werden. Sobald das Xcode-Repository bzw. diese Dateien verfügbar sind, muss nur die oben beschriebene Integration vorgenommen und das Apple-TV-Target kompiliert werden.
