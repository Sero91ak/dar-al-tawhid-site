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

## 2. Die fünf vorhandenen Original-Runway-Videos installieren

Bitte **ausschließlich die zuerst erstellten personenfreien 9:16-Clips** verwenden, nicht die späteren Apple-TV-Kaaba-Collagen oder Muezzin-Bildanimationen.

| Gebet | Runway Task-ID | Clip |
|---|---|---|
| Faǧr | `03f541e3-e7cf-47f5-9bcc-ce7d97ff24a6` | 10 s, 1080 × 1920 |
| Ẓuhr | `d182c3c9-5e13-4c7e-9675-95ca6b07ce2b` | 8 s, 1080 × 1920 |
| ʿAṣr | `b3a7718d-66d0-415b-a803-d481053b90a1` | 8 s, 1080 × 1920 |
| Maġrib | `d2dcf692-950c-4e3b-ab81-6bb6a55c5382` | 8 s, 1080 × 1920 |
| ʿIšāʾ | `387c0c44-bd03-4014-9671-628f3fe6aa18` | 8 s, 1080 × 1920 |

### A. Über die Oberfläche (kein Terminal erforderlich)

Runway → Original-MP4 exportieren → Simulator-Dateien verfügbar machen → in der Cinematic-Vorschau das jeweilige Gebet auswählen → **Video importieren** → Datei wählen. Importierte Videos werden nur im App-Container des Simulators gespeichert.

### B. Per Terminal (alle fünf auf einmal)

Nach der ersten Installation der App im Simulator:
```bash
APP_DATA="$(xcrun simctl get_app_container booted de.daraltawhid.app data)"
DEST="$APP_DATA/Library/Application Support/DarAdhanCinematic"
mkdir -p "$DEST"
cp "/PFAD/ZU/FAJR.mp4"    "$DEST/dar-adhan-fajr.mp4"
cp "/PFAD/ZU/DHUHR.mp4"   "$DEST/dar-adhan-dhuhr.mp4"
cp "/PFAD/ZU/ASR.mp4"     "$DEST/dar-adhan-asr.mp4"
cp "/PFAD/ZU/MAGHRIB.mp4" "$DEST/dar-adhan-maghrib.mp4"
cp "/PFAD/ZU/ISHA.mp4"    "$DEST/dar-adhan-isha.mp4"
```
Danach die Simulator-App neu starten. Die fünf lokalen Clips werden nun je Gebet als **stummes AVPlayerLooper-Video** abgespielt. Ein echtes Video ist erst dann sichtbar, wenn die Dateien auf diesem Weg importiert wurden; ohne Datei erscheint ausdrücklich nur der grafische Fallback.

**Warum sind die MP4s nicht schon im GitHub-Commit?** Die originalen Runway-Downloads sind derzeit nicht als übertragbare lokale Dateien verfügbar. Kurzlebige Runway-CDN-URLs dürfen nicht als produktive App-Assets eingesetzt oder in GitHub eingecheckt werden.

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

Erst nach bestandener Simulator-Abnahme und gesicherten Original-MP4s: Produktionsfähiges Asset-Paket, dann echte AlarmKit-/Live-Activity-Anbindung **hinter einem nutzerseitig aktivierten Schalter**. Dieser Branch wird nicht automatisch in `main` gemergt.
