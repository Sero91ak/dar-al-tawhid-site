# DĀR AL TAWḤĪD Kids – Designregeln

Verbindlich für `/test/kids/` und alle künftigen Kids-Erweiterungen.

## Fläche

- Edge-to-Edge / Widescreen: der App-Hintergrund füllt die verfügbare Breite.
- Inhalte haben nur innere Sicherheitsabstände (`safe-area` + 10–12px).
- Keine zentrierte schmale Webseiten-Spalte (kein künstliches `max-width` auf `.shell`).

## Navigation

- Die Tab-Leiste Heute · Geschichten · Qurʾān · Eltern bleibt angeheftet.
- Sie ist eine **gläserne Bar**: `backdrop-filter`, leichte Sättigung, feine Kontur, dezenter Schatten.
- Kompakt in der Höhe: eine Safe-Area, enger Icon–Label-Abstand, Touch-Ziele mindestens 44px.

## Icons – keine System-Emojis (`KIDS_NO_SYSTEM_EMOJI`)

- In DĀR AL TAWḤĪD Kids dürfen **keine** iOS-/Android-/Unicode-Emojis als UI-Symbole verwendet werden.
- Neue Funktionen, Karten, Modals und Tabs bekommen realistische, kinderfreundliche, **freigestellte** PNG/WebP-Assets.
- Assets liegen in `test/kids/assets/kids-icons/`.
- Freigestellt heißt: nur das Objekt, echter Alpha-Kanal, kein weißes Quadrat, kein Checkerboard, kein Vorschaurahmen, kein eingebrannter Studio-Hintergrund.
- CSS darf Kästen nicht „wegzaubern“, wenn das Quellbild einen Hintergrund eingebrannt hat – dann muss die Datei neu freigestellt werden.
- Icons schweben wie Wasserzeichen (`background-size: contain`, transparenter Behälter, `drop-shadow`).

## Karten & Pfeile

- Weiter-Pfeile liegen in einem **eigenen** Rasterfeld rechts, nie im Titel- oder Fließtext.
- Hintergrundbilder: `cover` + sinnvoller Fokus, kein verzerrtes `100% 100%`.

## Qurʾān-Rezitation

- Oben Luft unter der Safe Area, klare Hierarchie: Titel → Schritte → Hinweis → Wort → Buttons.
- HÖREN (Gold) und SPRECHEN (Türkis) sind kompakte Pill-Buttons, Höhe ca. 52–58px, nicht volle Erwachsenen-Leisten.
- Vorherige / Weiter sind kleinere Pills.

## Schutz

`scripts/kids-design-guard.js` prüft diese Marker in CI über `scripts/app-health-check.js`.
