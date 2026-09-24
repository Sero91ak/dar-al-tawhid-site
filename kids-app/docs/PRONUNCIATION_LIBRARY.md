# Aussprachebibliothek – DĀR AL TAWḤĪD Kids

Die Kids-App verwendet für lokale Vorlesestimme und Feedback dieselbe Aussprachebasis wie das zentrale DĀR-AL-TAWḤĪD-Voice-System.

## Runtime

`Services/PronunciationLibrary.swift`

- Stand: 2026-09-24
- 3.719 konkrete Regeln
- generiert aus der zentralen ElevenLabs-Masterbibliothek
- sichtbare Texte werden nicht verändert
- nur der Text für die Sprachsynthese wird phonetisch vorbereitet

`NarrationService.swift` ruft vor `AVSpeechUtterance` immer `KidsPronunciationLibrary.prepare(...)` auf.

Vorgefertigte MP3-Hörgeschichten bleiben unverändert; sie sollen beim Erzeugen serverseitig das zentrale ElevenLabs-Wörterbuch verwenden.

## Zentrale Source of Truth

Die vollständige Masterbibliothek liegt im zentralen Voice-PR unter `data/voice/pronunciation/`. Bei späteren Ergänzungen wird diese Swift-Datei aus derselben Regelbasis neu generiert, damit Kids und Haupt-Voice-System nicht auseinanderlaufen.
