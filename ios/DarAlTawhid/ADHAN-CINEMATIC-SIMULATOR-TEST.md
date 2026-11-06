# DĀR AL TAWḤĪD · Adhān Cinematic — Simulator-Test

**Status:** isolierter nativer iOS/iPadOS-Demo-Modus im separaten Branch. **Keine Veröffentlichung, kein AlarmKit-Release und keine Änderung an der Besucher-Weboberfläche.**

## 1. Branch und Projekt öffnen

```bash
git fetch origin
git switch feature/ios-adhan-cinematic-simulator-20261101
cd ios/DarAlTawhid
open DarAlTawhid.xcodeproj
```

Xcode: **Scheme `DarAlTawhid`** → Configuration **Debug** → iPhone- oder iPad-Simulator → **Run (⌘R)**.
Die Debug-App zeigt oben rechts die Schaltfläche **CINEMA TEST**. Ein Klick öffnet den vollständig nativen Vollbild-Test.

**Nicht** `DarAlTawhidKids` öffnen. `DarAppShell.usesStagingWeb` bleibt unverändert. Die im App Store installierte Version ist hiervon nicht betroffen.

## 2. Die fünf Original-Runway-Videos sind bereits im Testbranch

**Ab 1. November 2026:** Alle fünf echten, zuerst generierten, personenfreien Original-MP4s sind physisch im separaten GitHub-Testbranch eingecheckt; sie wurden auf 1080 × 1920, richtige Dauer und **keine Audiospur** geprüft.

`ios/DarAlTawhid/Shared/CinematicMedia/`:

| Gebet | Originaldatei | Runway-Auftrag | Dauer |
|---|---|---|---|
| Fajr | `dar-adhan-fajr.mp4` | `03f541e3-e7cf-47f5-9bcc-ce7d97ff24a6` | 10 s |
| Ẓuhr | `dar-adhan-dhuhr.mp4` | `d182c3c9-5e13-4c7e-9675-95ca6b07ce2b` | 8 s |
| ʿAṣr | `dar-adhan-asr.mp4` | `b3a7718d-66d0-415b-a803-d481053b90a1` | 8 s |
| Maghrib | `dar-adhan-maghrib.mp4` | `d2dcf692-950c-4e3b-ab81-6bb6a55c5382` | 8 s |
| ʿIšāʾ | `dar-adhan-isha.mp4` | `387c0c44-bd03-4014-9671-628f3fe6aa18` | 8 s |

Die native SwiftUI-Ansicht lädt automatisch zuerst ein ggf. vom Benutzer manuell ersetztes Video, ansonsten das **mit Xcode mitgelieferte Originalvideo** aus `Bundle.main/CinematicMedia/`. Die 5 Videos müssen weder aus Runway erneut heruntergeladen noch über einen Files-Picker importiert werden. Keine signierten CDN-URLs als Laufzeit-Abhängigkeit.

### Empfohlener Xcode-Test: eigene, isolierte Simulator-App

```bash
git fetch origin
git switch feature/ios-adhan-cinematic-simulator-20261101
cd ios/AdhanCinematicPreview
xcodegen generate
open DarAdhanCinematicPreview.xcodeproj
```

Falls am aktuellen Repository ungesicherte lokale Änderungen vorliegen, stattdessen zunächst eine **eigene Testkopie** anlegen; nichts mit `git reset --hard` oder `git clean -fd` löschen.

**Xcode:** `DarAdhanCinematicPreview` → iPhone-Simulator → `⌘R`. Der Media-Ordner wird direkt als Xcode-Ressourcenverzeichnis in den Bundle eingebaut.

### Alternative: bestehende Besucher-App

Die Besucher-App enthält denselben Cinematic-Test nur im DEBUG-Simulator. Das Hauptprojekt benötigt lokal die vorhandenen OneSignal-XCFrameworks. Ist die Abhängigkeit nicht installiert, die unabhängige Preview-App verwenden.

## 3. Simulator-Abnahme (manuell)

- [ ] Fajr auswählen: `الفَجْر` + `Faǧr` + Erinnerung gut lesbar
- [ ] Wechsel Ẓuhr / ʿAṣr / Maġrib / ʿIšāʾ: keine Mischung von Video und Beschriftung
- [ ] Original-MP4 importieren; Video läuft weich und **ohne eigenen Ton**
- [ ] Nach dem Loop keine sichtbare Schwarzblende oder abruptes Standbild
- [ ] **Adhān anhören**: echte öffentlich vorhandene Audioaufnahme wird separat abgespielt
- [ ] **Adhān stoppen**, Gebetswechsel, Schließen: Audio pausiert/stoppt
- [ ] iPhone Hochformat, iPhone Querformat, iPad Hochformat und iPad Querformat
- [ ] Kleine Displays, Safe Areas, Dynamic Type, VoiceOver, Bewegung reduzieren
- [ ] Gerät sperren / App in den Hintergrund: Video ruht; App nach Rückkehr stabil
- [ ] Keine Änderung an Web-Navigation, Gebetszeitenberechnung, Push/OneSignal oder Kinder-App

## 4. Wichtige technische Grenzen

Dies ist **noch kein automatischer Alarm zur echten Gebetszeit**. Es ist die kontrollierte Vorschau für Film-/Text-/Audio-Komposition und Geräteformate. Eine automatische AlarmKit-Auslösung bei gesperrtem Gerät sowie das vollständige, zuverlässige Abspielen und automatische Stoppen des Adhāns sind separat auf einem echten iPhone zu verifizieren; der Simulator bestätigt das **nicht**.

Der Vollbild-Cinematic-Player darf bei gesperrtem iPhone nicht beliebig über dem System-Lockscreen eingeblendet werden. Die Videoanimation ist für die bereits aktive App vorgesehen.

Die historischen Filmszenen sind bewusst personenfrei, ohne Musik, ohne UI im Videobild, mit edlen dunklen Grün-/Nachtblau- und Goldakzenten. Deutsche Erinnerung und arabische Schrift bleiben native, barrierearme SwiftUI-Elemente.

## 5. Nächster Freigabepunkt

Erst nach bestandener Simulator-Abnahme (die Original-MP4s sind bereits gesichert): Produktionsfähiges Asset-Paket, dann echte AlarmKit-/Live-Activity-Anbindung **hinter einem nutzerseitig aktivierten Schalter**. Dieser Branch wird nicht automatisch in `main` gemergt.
