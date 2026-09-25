# DĀR AL TAWḤĪD Kids

Eigenständige Kids-App. **Nicht** Teil der Besucher-App (`/` ) und **nicht** Teil der Erwachsenen-Test-App (`/test/`).

## GitHub

https://github.com/Sero91ak/dar-al-tawhid-site/tree/main/kids


## Testphase (jetzt)

Nur die Test-App existiert:

**https://dar-al-tawhid.de/kids/test/**

Es gibt noch **keine** Live-Kids-App für Besucher.

## Harmonisieren ohne Vermischen

Kids **liest** Daten der Haupt-App (nur Abruf, keine UI-Übernahme):

- Qurʾān-Index: `/content/quran/surahs.json`
- Quiz: `/data/quiz-questions.json`
- Tagesinhalt: `/content/updates/daily.json`

Kids-eigene Inhalte liegen nur unter `kids/`.

## Verboten

- Keine Kids-Routen in `index.html` / `test/index.html`
- Keine Kids-Buttons in der Haupt-Navigation
- Keine automatischen Besucher-Pushes aus Kids
- Kein Live-Kids-Ordner unter `kids/` außer `kids/test/`, bis ausdrücklich „Kids live“

## iOS

Später eigenes Target / eigene Bundle-ID. Noch nicht die Haupt-iOS-App umbauen.
