# DĀR AL TAWḤĪD — fünf ORIGINAL-Runway-Cinematic-Videos

Dieser Ordner ist die **zentrale, feste Quelle** für den nativen iOS-Adhān-Cinematic-Test und die eigenständige Simulator-Vorschau.

**Nicht** die späteren fünf Ersatzgenerationen oder Muezzin-/Kaʿba-Bilder verwenden. Es gehören exakt diese fünf ursprünglichen Seedance-2.0-Runway-MP4s hierher:

| Dateiname (exakt) | Gebet | Runway-Original-Auftrag | Original | Ton |
|---|---|---|---|---|
| `dar-adhan-fajr.mp4` | Fajr | `03f541e3-e7cf-47f5-9bcc-ce7d97ff24a6` | 1080×1920, 10 s | stumm |
| `dar-adhan-dhuhr.mp4` | Ẓuhr | `d182c3c9-5e13-4c7e-9675-95ca6b07ce2b` | 1080×1920, 8 s | stumm |
| `dar-adhan-asr.mp4` | ʿAṣr | `b3a7718d-66d0-415b-a803-d481053b90a1` | 1080×1920, 8 s | stumm |
| `dar-adhan-maghrib.mp4` | Maghrib | `d2dcf692-950c-4e3b-ab81-6bb6a55c5382` | 1080×1920, 8 s | stumm |
| `dar-adhan-isha.mp4` | ʿIšāʾ | `387c0c44-bd03-4014-9671-628f3fe6aa18` | 1080×1920, 8 s | stumm |

**Status 01.11.2026: Alle fünf Original-MP4-Dateien wurden tatsächlich aus den verifizierten Runway-Tasks heruntergeladen und in diesem GitHub-Testbranch mit genau diesen Namen dauerhaft gespeichert.** Der einmalige Import hat Breite, Höhe, Laufzeit und die fehlende Audiospur kontrolliert. Es sind keine neuen Exporte oder manuellen Umbenennungen erforderlich. Die signierten temporären Download-URLs werden zur Laufzeit nicht verwendet.

**Xcode-Integration:** Die Debug-Cinematic-Ansicht liest zuerst lokal importierte MP4s aus Application Support und dann `Bundle.main/CinematicMedia/dar-adhan-*.mp4`. Der Ordner wird als Ressourcenverzeichnis in das App-Bundle aufgenommen (auch für die eigenständige Simulator-Test-App). Nach Einfügen der fünf MP4-Dateien muss ein neuer Xcode-Debug-Build erzeugt werden, um sie direkt ohne manuellen Import in der App zu sehen.

**Sicherheit:** Die endgültig heruntergeladenen, verifizierten MP4s sind im isolierten Testbranch versioniert. Der einmalige Download-Workflow mit befristeten URLs wurde anschließend entfernt. `.gitignore` verhindert versehentliche spätere Videoimporte; die fünf gezielt eingecheckten Originale bleiben getrackt. Keine Änderung an Kids, Apple TV, Web oder der App-Store-Produktion.
