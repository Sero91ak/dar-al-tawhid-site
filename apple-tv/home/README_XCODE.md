# Apple TV Startseite — Slot-Trennung (verbindlich)

## Fehler

Auf der Startseite bei den Gebetszeiten steht unter dem Qurʾān-Vers der **Tadabbur-Bereich**.  
Dort wurden fälschlich **Ḥadīṯe, Salaf-Aussagen aus der Ḥadīṯ-Bibliothek und Šarḥ** gezeigt (`HadithScreensaverProvider` / `hadith/catalog.json`).

Das ist falsch.

## Soll

```
Gebetszeiten          ← prayer/catalog.json + Standort-API
Qurʾān-Vers           ← aktueller Vers (Arabisch + Deutsch)
Tadabbur              ← nur quran/tadabbur, Lookup Sūrah:Āyah
```

## Verboten im Tadabbur-Slot

- `HadithScreensaverProvider`
- `apple-tv/hadith/catalog.json` / `library-shell.json` / `HAD-XXXX.json`
- `sharhText` / `sharhScholar` aus der Ḥadīṯ-Bibliothek
- Screensaver-Rotation

Ḥadīṯ, Āṯār und Šarḥ gehören in **Bibliothek** und **Bildschirmschoner**, nicht unter den Vers auf der Startseite.

## Lookup

```swift
let reference = "\(surahNumber):\(ayahNumber)"
let entry = tadabburStore.entry(for: reference)
```

Anzeige nur: `text`, `narrator`, `generation`, `source`, `grading`.

Kein Treffer:

```text
Für diesen Vers liegt derzeit keine geprüfte Salaf-Überlieferung vor.
```

`defaultModule` in `apple-tv/catalog.json` bleibt `hadith` **nur für den Bibliotheks-Tab**, nicht für `TVHomeView`.

Live-Vertrag: `https://dar-al-tawhid.de/apple-tv/home/catalog.json`
