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

Laden der ersten Serie:

```swift
let hadiths = try await HadithRemoteService.shared.loadSeries("001-050")
```

## Verhalten

1. `index.json` der Serie wird von GitHub geladen.
2. Danach werden die einzelnen `HAD-XXXX.json`-Dateien in der festgelegten Reihenfolge geladen.
3. Nach erfolgreichem Download wird die komplette Serie lokal gecacht.
4. Ist GitHub oder das Internet nicht erreichbar, wird die zuletzt erfolgreich gespeicherte Serie geladen.
5. Bereits vergebene IDs werden nie verschoben.

## Darstellung

- Überliefererzeile
- kleiner Abstand
- `Der Prophet ﷺ sagte:` und Ḥadīṯ-Text in einem zusammenhängenden Block
- kleiner Abstand
- Quellenzeile

`textMarkdown` muss als `AttributedString` dargestellt werden:

- `**…**` = fett
- `*…*` = kursiv

UTF-8 und die wissenschaftliche Unicode-Transliteration müssen vollständig erhalten bleiben.
