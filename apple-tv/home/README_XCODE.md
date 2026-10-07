# Apple TV Startseite — Slot-Trennung (verbindlich)

## Xcode-Irrtum (nicht umsetzen)

Live-Tadabbur-Dateien enthalten **bewusst** Ṣaḥābī-/Salaf-Aussagen und oft einen Ḥadīṯ **zum Vers**.  
Das ist kein Fehler und **kein** Grund, sie im Qurʾān-Bereich auszublenden.

- Der **Qurʾān-Vers** (Arabisch + Deutsch) kommt aus dem Reader (`quran-uthmani` / `de.bubenheim`).
- Das Tadabbur-JSON liefert **nicht** den Vers, sondern die **Erklärung/Aussage** zu `reference` = `Sūrah:Āyah` (z. B. `2:183`).
- Eine Filterung „kein getrennter Vers im Tadabbur-JSON → Datensatz verstecken“ macht den Bereich leer („Inhalt derzeit nicht verfügbar“). **Diese Filterung rückgängig machen.**

## Haltezeit (Screensaver + Startseite Vers/Tadabbur)

Einheit **Sekunden**, niemals Millisekunden.
`seconds = 16 + (wörter * 0.35)`, min 18, max 40.
Kein `Timer` in ms, der Aussagen oder Verse durchrast.

## Soll (drei getrennte Slots, drei Quellen)

```
Gebetszeiten   ← prayer API + Standort
Qurʾān-Vers    ← Qurʾān-Reader (Arabisch + Deutsch)
Tadabbur       ← apple-tv/quran/tadabbur  Lookup reference
```

```swift
let reference = "\(surahNumber):\(ayahNumber)"
let verseAr = quranReader.arabic(surahNumber, ayahNumber)
let verseDe = quranReader.german(surahNumber, ayahNumber)
let tad = tadabburStore.entry(for: reference)
// tad.text / narrator / generation / source / grading UNTER dem Vers anzeigen
// NICHT filtern, nur weil generation == Ṣaḥābī oder relation einen Ḥadīṯ nennt
```

Kein Tadabbur-Treffer:

```text
Für diesen Vers liegt derzeit keine geprüfte Salaf-Überlieferung vor.
```

## Wirklich falsch (das war der alte Bug)

Ḥadīṯ-**Bibliothek** / Screensaver in den Tadabbur-Slot:

- `HadithScreensaverProvider`
- `HAD-XXXX.json` / `library-shell.json`
- `sharhText` aus der Ḥadīṯ-Bibliothek

Das ist eine **andere** Quelle ohne Vers-Lookup.

## Bildschirmschoner — nicht löschen

`HadithScreensaverProvider` bleibt aktiv. Keine Tadabbur-Home-Filterung darauf anwenden. Nicht entfernen.

Leeres „Inhalt derzeit nicht verfügbar“ auf dem **echten Apple TV** ist ein Netzwerk-/Cache-Thema am Gerät, nicht am Simulator. Gerät in Xcode als tvOS-Ziel wählen.

Live: `https://dar-al-tawhid.de/apple-tv/home/catalog.json`
