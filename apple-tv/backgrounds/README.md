# Apple-TV-Hintergründe

Dieser Ordner ist die zentrale Registry für animierte tvOS-Hintergründe.

## Aktueller Modus

- `selection.mode = ownerFixed`
- nur der Betreiber bestimmt den aktiven Hintergrund
- Benutzerauswahl ist vorbereitet, aber deaktiviert
- automatische Rotation ist vorbereitet, aber deaktiviert
- vorgesehener Rotationsabstand: 15 Minuten

## Aktueller Hintergrund

- ID: `bg_makkah_dusk_01`
- Titel: Makkah – Abenddämmerung
- 3840×2160 (4K UHD)
- HEVC/H.265 in MP4
- 24 fps
- 12 Sekunden
- Endlosschleife, stumm
- Seitenverhältnis 16:9
- Darstellungsmodus: `cover`

## Xcode-Ressource

Aktuell erwartet die Registry die Bundle-Ressource:

`bg_makkah_dusk_01_3840x2160_hevc.mp4`

Die Datei wird über `AppleTVBackgroundService.swift` aufgelöst.
`AppleTVAnimatedBackgroundView.swift` rendert sie vollflächig mit `AVPlayerLooper`.

## Spätere Erweiterung

Die Datenstruktur ist bereits auf mehrere Hintergründe ausgelegt. Später können:

- `allowUserSelection` aktiviert werden,
- ein Auswahl-Pop-up auf Basis derselben Registry gebaut werden,
- oder `selection.mode` auf Rotation gestellt werden.

Für die Rotation ist ein Intervall von 15 Minuten bereits im Katalog vorgesehen.
