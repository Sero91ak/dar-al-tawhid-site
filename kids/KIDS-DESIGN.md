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


## Globale Kapselbreite — `KIDS_GLOBAL_CAPSULE_WIDTH`

- Referenz ist die äußere **Qurʾān-Reise-Kapsel** auf dem Smartphone.
- Große navigierbare Kapseln nutzen die verfügbare Seitenbreite nahezu vollständig: Shell-Sicherheitsabstand 16 px, davon visuell 6 px Bleed je Seite → effektiv ungefähr 10 px Außenrand.
- Keine schmalen zentrierten Karten für Propheten, Ṣaḥābah, Ṣaḥābiyyāt oder andere Hauptbereiche.
- Unterkarten innerhalb einer großen Kapsel bleiben 100 % breit innerhalb ihres Elternbereichs; sie dürfen die Elternkapsel nicht überlaufen.
- Auf Tablet/Desktop gilt 100 % der vorgesehenen Content-Spalte ohne künstliches zusätzliches `max-width`.
- Freier Platz aus entfernten Pfeilen wird immer Bild und Text zurückgegeben.

## Globaler Touch-Glow — `KIDS_GLOBAL_TOUCH_GLOW`

- Jede navigierbare Kids-Kapsel verwendet denselben ruhigen Interaktionszustand.
- `hover` (Desktop), `active`/Pointer-Press (Touch) und `focus-visible` hellen ausschließlich Kontur und Glow leicht auf.
- Kein Hochspringen, kein `translateY`, kein Scale-/Lift-Effekt.
- Mobile Touch-Rückmeldung wird zusätzlich durch `kids-card-interaction.js` stabilisiert, damit der Glow auf iPhone/iPad sichtbar bleibt.
- Globale Pflichtregel: **jede anklickbare Capsule/Karte** erhält denselben Glow bei Hover, Touch/Pressed und Focus – auch neu hinzukommende Bereiche. `kids-card-interaction.js` markiert neue Buttons/Karten innerhalb der Kids-Views und Story-Libraries automatisch; `.kids-tap-card` bleibt der explizite Opt-in. Lokale Component-`box-shadow`-Regeln dürfen den Press-Glow nicht überschreiben.


## Startseiten-Hero – verbindliche Referenz (V1199)

- Das obere Startseitenmotiv ist **statisch** und verwendet ausschließlich `/kids/assets/kids-home-v1191/hero-static-reference.jpg`.
- Das Motiv läuft auf iPhone/iPad **edge-to-edge bis unter den Statusbereich**; kein separater Petrol-/Leerstreifen oberhalb des Bildes.
- Smartphone-Framing: **100% Breite / auto Höhe**, proportional um **13,2 vw nach oben** verschoben, damit der im Referenzasset enthaltene dunkle Sicherheitsstreifen vollständig außerhalb des sichtbaren Hero liegt. Tablet: **cover / center 42%**. Keine Kamera-, Zoom-, Pan-, Wolken- oder Hintergrundanimation.
- Die sichtbare Sternschnuppe gehört zum statischen Referenzbild. Keine zusätzliche CSS-/Video-Sternschnuppe darüberlegen.
- **DĀR AL TAWḤĪD** wird als echte App-Schrift gerendert: Adobe Fonts **Cinzel 700** (Kit `jka5jda`), mit lokalem Offline-Fallback `/assets/fonts/cinzel-latin-600-normal.woff2`; groß, vollständig sichtbar, gold, flacher optischer Bogen. Niemals wieder SVG-`textPath`/`textLength` für diese Wortmarke, damit auf iOS kein D abgeschnitten wird.
- Die Goldschrift selbst bleibt positionsstabil; nur ein dezenter horizontal wandernder Lichtschein ist erlaubt.
- **Kids** behält den sanften, zeitversetzten Balloon-Effekt pro Buchstabe sowie den dezenten Unterglow.
- Keine generierte/eingebrannte Schrift im Hintergrundbild verwenden; die Markenwörter bleiben echte UI-Typografie.


## Nicht-Hero-Unterseiten-Navigation — `KIDS_SUBPAGE_NAV_RAIL`

- Diese Regel gilt ausschließlich für kompakte Titel-/Untertitel-Leisten auf Bibliotheks- und Unterseiten, z. B. „Den Dīn lernen“, Propheten, Ṣaḥābah, Ṣaḥābiyyāt und „Geschichten des Īmān“.
- Solche Leisten werden als eingebettete, ruhige Glasfläche aufgebaut: großzügige Höhe, klare Titelhierarchie und ein eindeutig beschrifteter Zurück-Button mit mindestens 44 px realer Touch-Fläche.
- Der Zurück-Button darf niemals durch globale Kartenregeln auf volle Breite wachsen. Auch bei alten/stalen iOS-/PWA-Runtimes bleibt seine Geometrie fest.
- Bestehende **Hero-/Bildbühnen werden nicht verändert**. Das gilt ausdrücklich auch für Zurück-/Minimieren-Controls, die direkt innerhalb eines Hero-Bildes liegen.
- Nicht unter diese Regel fallen die Startseiten-Hero-Bühne, Geschichten-/Qurʾān-/Eltern-Heroes, Detail-Heroes, Player-Heroes, die Duʿāʾ-Detailbildbühne, Quiz-Kontextbuttons und die untere Haupt-Tab-Leiste.
- Neue Unterseiten mit dieser Struktur verwenden `.kids-subpage-nav` und `.kids-subpage-back`, damit der globale Standard automatisch greift.


## Korrektur Unterseiten-Kopf — `KIDS_SUBPAGE_APPBAR_V14`

- Der Nicht-Hero-Unterseitenkopf ist **keine eigene große Karte/Kapsel**. Er sitzt als ruhige, integrierte App-Bar direkt am oberen Seitenrand.
- Kein großer beschrifteter „Zurück“-Pill-Button. Zurück bleibt ein kompakter 44–48-px-Control links; Titel und Untertitel bekommen die visuelle Priorität.
- Keine doppelte Rahmenwirkung aus Seitenkopf plus Inhaltskarten. Nur eine sehr feine untere Trennlinie und zurückhaltender Blur sind erlaubt.
- Titel darf groß genug für Kinder sein, soll aber keine Inhaltskarte imitieren. Untertitel bleibt sekundär.
- Diese Korrektur gilt global nur für die bereits definierte Nicht-Hero-Unterseitenstruktur. Hero-/Bildbühnen und deren Overlay-Controls bleiben weiterhin ausdrücklich ausgeschlossen.


## Eingedockter Unterseiten-Kopf — `KIDS_SUBPAGE_DOCK_V15`

- Der Unterseitenkopf ist weder die alte dünne Leiste noch eine große schwebende Karte.
- Er ist als **eingedockter Top-Header mit nur unten abgerundeten Ecken** aufgebaut. Dadurch ist die Navigation sichtbar neu gestaltet, bleibt aber Teil der Seite und konkurriert nicht mit Inhaltskarten.
- Links sitzt ein 46–52-px Zurück-Control mit einem per CSS gezeichneten Chevron. Kein großer „Zurück“-Text-Pill.
- Zwischen Zurück-Control und Titelblock liegt eine feine vertikale Akzentlinie. Titel bleibt primär, Untertitel sekundär.
- Tiefe entsteht nur über einen dezenten unteren Schatten/Blur und eine feine Akzentkante; keine komplette Kartenumrandung.
- Hero-/Bildbühnen, Detail-Heroes und deren Overlay-Navigation sind weiterhin ausdrücklich ausgeschlossen.


## Interaktives Zurück-Wischen — `KIDS_INTERACTIVE_EDGE_SWIPE_V1246`

- In geöffneten Unterseiten kann **von der rechten Displaykante nach links** gewischt werden, um den Bereich zu verlassen.
- Zusätzlich bleibt die iOS-Gewohnheit **von der linken Kante nach rechts** erhalten.
- Die aktive Fläche folgt dem Finger kontinuierlich; es gibt keinen harten Sprung am Ende der Geste.
- Eine nicht abgeschlossene Geste federt weich in die Ausgangsposition zurück. Eine abgeschlossene Geste gleitet aus dem Viewport und aktiviert erst danach den vorherigen Zustand.
- Vertikales Scrollen, Slider sowie Audio-/Qurʾān-Fortschrittsflächen dürfen nicht als Zurück-Geste übernommen werden.
- Hero-/Bildbühnen werden durch diese Regel nicht optisch verändert.
