# Xcode Integration – Qurʾān Tadabbur

## Geltungsbereich

Dieser Tadabbur-Bereich gilt für:

- Apple TV / tvOS Qurʾān-Bereich
- iOS Qurʾān-Bereich, sobald derselbe Remote-Content-Loader verwendet wird
- iPadOS Qurʾān-Bereich, sobald derselbe Remote-Content-Loader verwendet wird

Nicht gemeint:

- keine KI-Erzeugung von Tadabbur-Texten
- keine erfundenen Salaf-Zuschreibungen
- keine automatische thematische Ersatz-Erklärung bei fehlendem Eintrag

## GitHub-Datenquelle

Raw-Basis:

```text
https://raw.githubusercontent.com/Sero91ak/dar-al-tawhid-site/apple-tv-hadith-staging/apple-tv/quran/tadabbur/
```

Zentraler Einstieg:

```text
catalog.json
```

Danach:

```text
entries-index.json
```

Der Index listet alle geprüften Datendateien. Xcode darf nicht nur `entries.json` fest verdrahten, sondern muss alle Dateien aus `entries-index.json` bzw. `catalog.json.entriesPaths` laden.

Aktueller registrierter Stand:

```text
entriesCount: 5102
totalVerifiedEntries: 5102
letzter Batch: entries-batch-05z-116.json
letzter Vers im aktuellen Durchgang: 114:6
```

## Aktive Xcode-Dateien

Die aktive Datei für das Apple-TV-/Qurʾān-Xcode-Paket ist:

```text
apple-tv/xcode/TVQuranTadabburSupport.swift
```

Wichtig:

- `QuranTabView.swift` liegt unter `apple-tv/xcode/`.
- `TVQuranTadabburSupport.swift` liegt deshalb ebenfalls unter `apple-tv/xcode/`.
- So findet Xcode `TVQuranTadabbur`, `TVQuranTadabburStore` und `TVQuranTadabburCard` direkt.
- Es gibt bewusst keine zweite aktive `.swift`-Kopie im Tadabbur-Datenordner, damit keine doppelten Swift-Typen entstehen.

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

Das bestehende Qurʾān-Versmodell wird nur über Lookup erweitert, nicht durch erfundene Felder:

```swift
TVQuranTadabburCard(
    reference: verse.reference,
    tadabbur: tadabburStore.entry(for: verse.reference)
)
```

## Fertiger Support-Code

`TVQuranTadabburSupport.swift` muss:

1. den zentralen `RemoteContentSyncService` triggern,
2. `quran/tadabbur/catalog.json` laden,
3. `entries-index.json` laden,
4. alle registrierten Batches laden,
5. Anzahl, Referenzen und Pflichtfelder validieren,
6. alles nach exakter `Sūrah:Āyah`-Referenz zusammenführen,
7. nur einen vollständig validierten Stand aktiv cachen,
8. bei Netzwerk- oder Datenfehlern den letzten gültigen Cache behalten.

## Datenprüfung vor jedem neuen Batch

Nach jeder Änderung an `catalog.json`, `entries-index.json`, `entries.json` oder `entries-batch-*.json` muss der Tadabbur-Prüfer laufen:

```bash
python3 apple-tv/quran/tadabbur/tools/verify_tadabbur_catalog.py
```

Die vollständige Prüfanweisung steht hier:

```text
apple-tv/quran/tadabbur/VERIFY.md
```

Der Prüfer kontrolliert unter anderem:

- Katalogzählung gegen Indexzählung,
- Dateiliste im Katalog gegen Dateiliste im Index,
- tatsächliche Eintragsanzahl pro Batch,
- doppelte Referenzen,
- Pflichtfelder,
- Gesamtzahl `5102`, solange kein neuer geprüfter Batch registriert wurde,
- letzten Referenzstand `114:6` im aktuellen Durchgang.

## Lookup-Regel

Versreferenzen sind kanonisch:

```text
Sūrah:Āyah
```

Beispiele:

```text
13:28
99:5
114:6
```

Beim Rendern muss dieselbe Referenz aus dem aktuellen Qurʾān-Vers gebildet werden:

```swift
let reference = "\(surahNumber):\(ayahNumber)"
```

Bei keinem geprüften Treffer niemals Text erzeugen oder ableiten. Exakt anzeigen:

```text
Für diesen Vers liegt derzeit keine geprüfte Salaf-Überlieferung vor.
```

## Vollständige Versabdeckung

`coverage.json` beschreibt 114 Sūren und 6.236 Verse.

„Vollständige Abdeckung“ bedeutet:

- geprüfter Eintrag vorhanden → diesen anzeigen,
- kein geprüfter Eintrag vorhanden → festen Fallback anzeigen.

Es bedeutet ausdrücklich nicht, dass für jeden Vers eine Aussage erfunden oder lose thematisch zugeordnet wird.

## Darstellung

Tadabbur wird direkt unter dem Qurʾān-Vers bzw. unter der deutschen Übersetzung angezeigt.

Pflicht:

- ruhige dunkle Dar-al-Layl-Karte
- cremefarbene Schrift
- dezenter Goldakzent
- keine Logos
- keine Überlagerung des Qurʾān-Textes
- keine unnötig großen Abstände
- maximal drei sichtbare Zeilen für den Tadabbur-Text
- Überlieferer und Generation sichtbar
- Quelle und Einstufung sichtbar
- Versreferenz sichtbar

## Sicherheitsregel

Keine dynamisch erzeugten Tadabbur-Texte.
Keine erfundene Zuschreibung.
Keine automatische Ersetzung fehlender Salaf-Aussagen durch KI-Text.

Die App rendert ausschließlich geprüfte GitHub-Daten oder den festen Fallback.

## Abnahmetest

1. App starten.
2. Qurʾān-Bereich öffnen.
3. Remote-Content-Sync muss `quran/tadabbur/catalog.json` laden.
4. App erkennt `entriesCount = 5102`.
5. App lädt `entries-batch-05z-116.json`.
6. Vers `114:6` öffnen.
7. Tadabbur-Karte erscheint unter der Übersetzung.
8. Internet ausschalten.
9. App neu starten.
10. Letzter vollständiger Tadabbur-Cache bleibt nutzbar.
11. Vers ohne geprüften Eintrag öffnen.
12. Nur der feste Fallback erscheint.
13. Prüfer ausführen: `python3 apple-tv/quran/tadabbur/tools/verify_tadabbur_catalog.py`.
14. Ergebnis muss `TADABBUR VERIFY OK` sein.

## Schlussregel

Wenn neue Tadabbur-Batches später in `catalog.json` und `entries-index.json` registriert werden, darf kein Xcode-Code geändert werden müssen.
