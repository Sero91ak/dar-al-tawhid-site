# DĀR AL TAWḤĪD Kids – Designregeln

Verbindlich für `/kids/` und alle künftigen Kids-Erweiterungen.

## Fläche

- Edge-to-Edge / Widescreen: der App-Hintergrund füllt die verfügbare Breite.
- Inhalte haben nur innere Sicherheitsabstände (`safe-area` + 10–12px).
- Keine zentrierte schmale Webseiten-Spalte (kein künstliches `max-width` auf `.shell`).

## Navigation

- Die Tab-Leiste Heute · Geschichten · Qurʾān · Eltern bleibt eine **ovale, schwebende Glas-Kapsel**.
- Kindgerecht: runde Tab-Buttons, keine eckige Erwachsenen-Leiste, kein abgeschnittener Balken unten.
- Nur die **Breite** der Kapsel ist enger als ein Vollbreiten-Balken. Touch-Ziele bleiben oval und großzügig.

## Icons – keine System-Emojis (`KIDS_NO_SYSTEM_EMOJI`)

- In DĀR AL TAWḤĪD Kids dürfen **keine** iOS-/Android-/Unicode-Emojis als UI-Symbole verwendet werden.
- Neue Funktionen, Karten, Modals und Tabs bekommen realistische, kinderfreundliche, **freigestellte** PNG/WebP-Assets.
- Assets liegen in `kids/assets/kids-icons/`.
- Freigestellt heißt: nur das Objekt, echter Alpha-Kanal, kein weißes Quadrat, kein Checkerboard, kein Vorschaurahmen, kein eingebrannter Studio-Hintergrund.
- CSS darf Kästen nicht „wegzaubern“, wenn das Quellbild einen Hintergrund eingebrannt hat – dann muss die Datei neu freigestellt werden.
- Icons schweben wie Wasserzeichen (`background-size: contain`, transparenter Behälter, `drop-shadow`).

## Karten & Antippen — `KIDS_WHOLE_CARD_TAP`

- Navigierbare Kinder-Karten und Kapseln haben **keine permanenten Weiter-Pfeile, Rails oder Edge-Tabs**.
- Die **gesamte Karte** ist das Touch-Ziel. Interaktivität wird nur durch eine sehr leichte Aufhellung der Kontur / einen dezenten Glow bei `:active`, `:hover` und `:focus-visible` angezeigt.
- Karten dürfen beim Antippen oder Hover **nicht springen, hochfahren, skalieren oder vertikal wandern**. Kein `translateY`, kein Lift-Effekt.
- Der durch Pfeile frei gewordene Platz gehört Bild und Text. Text darf nicht wegen einer unsichtbaren Aktionsspalte schmaler werden.
- Diese Regel gilt verbindlich für bestehende und **alle künftigen** navigierbaren Kids-Karten.

## Vorschau-Metadaten — `KIDS_NO_PRECLICK_DURATION`

- Vor dem Öffnen einer Geschichte / eines Hörinhalts werden **keine Laufzeit** (`ca. X Min.`) und **keine Alterszeile** (`Alter X–Y`) auf Auswahlkarten gezeigt.
- Laufzeit und Alterskontext dürfen nach dem Öffnen im Player / Detailbereich weiterhin sichtbar sein.
- Hintergrundbilder: `cover` + sinnvoller Fokus, kein verzerrtes `100% 100%`.

## Qurʾān-Rezitation

- Oben Luft unter der Safe Area, klare Hierarchie: Titel → Schritte → Hinweis → Wort → Buttons.
- HÖREN (Gold) und SPRECHEN (Türkis) sind kompakte Pill-Buttons, Höhe ca. 52–58px, nicht volle Erwachsenen-Leisten.
- Vorherige / Weiter sind kleinere Pills.

## Schutz

`scripts/kids-design-guard.js` prüft diese Marker in CI über `scripts/app-health-check.js`.

## Bereichs-Header – Bildbühnen

- Die Startansichten **Geschichten**, **Mein Qurʾān** und **Eltern** beginnen mit einer vollflächigen, thematisch passenden Bildbühne bis an den Viewport-Rand.
- Der Seitentitel liegt direkt auf dem Bild mit dunklem Lesbarkeitsverlauf; das Bild blendet unten ohne harte Kante in die Nachtblau-Fläche über.
- Für diese Bereichs-Header gibt es **keinen separaten Karten-/Kapselbau** und **keine Kicker-Pill**. Der Kicker ist eine ruhige goldene Editorial-Zeile mit feiner Linie.
- background-size: cover und ein pro Motiv gesetzter Fokus sind Pflicht; Smartphone und Tablet bekommen eigene Höhen/Abstände.
- Die Regel betrifft nur die Bereichs-Header. Die Hauptnavigation **Heute · Geschichten · Qurʾān · Eltern** bleibt ausdrücklich die ovale schwebende Glas-Kapsel.
