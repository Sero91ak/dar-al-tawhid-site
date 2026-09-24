# DĀR AL TAWḤĪD KIDS

Eigenständige Kinder-App für 4–10 Jahre.

## Status

Version 0.1 – isolierter Feature-/Staging-Aufbau. Keine Änderung an Besucher-App, bestehender iOS-App oder Apple-TV-App.

## Produktprinzipien

- Hören → sehen → verstehen → wiederholen → anwenden.
- Kurze Einheiten statt endlosem Scrollen.
- Geschichten typischerweise 3–6 Minuten.
- KI-/TTS-Stimmen nur für Erzählung, Erklärung und Bedienhinweise.
- Qurʾān-Rezitation ausschließlich als echte, sauber lizenzierte Audioaufnahme.
- Keine Werbung, keine manipulativen Streaks, keine Coins und kein Kaufdruck.
- Keine Darstellung von Propheten oder Ṣaḥābah als Figuren.
- Historische/religiöse Erzählungen werden erst nach Quellenprüfung veröffentlicht.
- Frei verfasste pädagogische Geschichten werden klar als solche markiert.

## Navigation V0.1

1. Heute
2. Geschichten
3. Lernen
4. Eltern

Unter Lernen: Mein Qurʾān, Meine Duʿāʾ, Mein Dīn, Quiz.

## Technik

- SwiftUI
- iPhone und iPad
- Bundle ID: de.daraltawhid.kids
- Mindestziel: iOS 17
- Offline-fähige lokale Inhalte sind vorgesehen.
- AudioService spielt lokale MP3-Dateien; solange eine Datei fehlt, dient Apple-Sprachsynthese nur als Entwicklungs-Fallback.

## Nächste Schritte

- 4K-Hintergrund-Testset
- echte Audio-Dateistruktur
- Eltern-PIN
- Content-JSON
- Fortschrittsmodell pro Kinderprofil
- erste 10 geprüfte Inhalte
