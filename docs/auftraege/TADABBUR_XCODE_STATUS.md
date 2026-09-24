# Status – Qurʾān Tadabbur Xcode-Anbindung

Status: umgesetzt im Branch `apple-tv-hadith-staging`

## Datenstand

```text
Pfad: apple-tv/quran/tadabbur/catalog.json
entriesCount: 5102
totalVerifiedEntries: 5102
letzter Batch: entries-batch-05z-116.json
letzter Vers im aktuellen Durchgang: 114:6
```

## Aktive Xcode-Dateien

```text
apple-tv/xcode/QuranTabView.swift
apple-tv/xcode/TVQuranTadabburSupport.swift
apple-tv/xcode/RemoteContentSyncService.swift
```

## Umsetzung

- `TVQuranTadabburSupport.swift` liegt jetzt direkt im Xcode-App-Ordner.
- `QuranTabView.swift` lädt `TVQuranTadabburStore.shared` als `@StateObject`.
- Beim Vorbereiten des Qurʾān-Tabs wird `tadabburStore.load()` ausgeführt.
- `TVQuranTadabburStore` triggert `RemoteContentSyncService.shared.syncCatalog(relativeCatalogPath: "quran/tadabbur/catalog.json")`.
- Danach wird bevorzugt aus dem zentralen Remote-Content-Cache geladen.
- Wenn der Sync-Cache nicht verfügbar ist, wird direkt remote geladen.
- Wenn Remote fehlschlägt, bleibt der letzte gültige Cache erhalten.
- Die App aktiviert nur vollständig validierte Tadabbur-Daten.

## Anzeige

Die Tadabbur-Karte erscheint direkt unter der deutschen Qurʾān-Übersetzung im Qurʾān-Tab.

Referenzbildung:

```swift
let reference = "\(surahNumber):\(ayahNumber)"
```

Lookup:

```swift
tadabburStore.entry(for: reference)
```

Fallback bei fehlendem geprüften Eintrag:

```text
Für diesen Vers liegt derzeit keine geprüfte Salaf-Überlieferung vor.
```

## Schutzregeln

- Keine KI-Tadabbur-Texte.
- Keine erfundenen Salaf-Zuschreibungen.
- Keine zweite aktive `.swift`-Kopie im Tadabbur-Datenordner.
- Keine feste Grenze wie `5102` oder `05z-116` im Xcode-Code.
- Neue Batches werden künftig nur über `catalog.json` und `entries-index.json` registriert.

## Offener Build-Hinweis

Ein echter Xcode-/tvOS-Build wurde hier nicht ausgeführt. Die Dateien sind aber so vorbereitet, dass das Apple-TV-Xcode-Paket `QuranTabView.swift`, `TVQuranTadabburSupport.swift` und `RemoteContentSyncService.swift` gemeinsam ins Target aufnehmen muss.
