# Apple-TV-Hintergründe

Dieser Ordner ist die zentrale Registry für animierte tvOS-Hintergründe.

## Aktueller Modus

- selection.mode: `ownerFixed`
- nur der vom Betreiber gewählte Hintergrund wird verwendet
- Benutzerauswahl ist vorbereitet, aber deaktiviert
- automatische Rotation ist vorbereitet, aber deaktiviert
- vorgesehener Rotationsabstand: 15 Minuten

## Aktueller Hintergrund

- ID: `bg_makkah_dusk_01`
- Titel: Makkah – Abenddämmerung
- 3840×2160 (4K UHD)
- HEVC/H.265 in MP4
- Endlosschleife, stumm
- Seitenverhältnis 16:9
- Darstellungsmodus: cover

## Xcode

`AppleTVBackgroundService.swift` liest diesen Katalog, bestimmt den aktuell freigegebenen Hintergrund und stellt eine lokale Video-URL bereit.

`AppleTVAnimatedBackgroundView.swift` kann diese URL als vollflächigen, stummen Loop hinter der tvOS-Oberfläche anzeigen.

Später kann `allowUserSelection` aktiviert oder `selection.mode` auf Rotation umgestellt werden, ohne die Asset-Struktur zu ändern.
