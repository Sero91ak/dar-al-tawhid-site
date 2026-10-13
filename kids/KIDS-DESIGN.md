## Globale, undurchsichtige Detailkopfzeile inklusive iOS-Statusleiste — `KIDS_GLOBAL_STATUS_SAFE_AREA_V1410`

Für **alle** gegenwärtigen und künftigen KIDS-Unterseiten verpflichtend. Die
obere Leiste soll sich wie die vorhandene Detailnavigation der Ṣaḥābah- und
Prophetengeschichten anfühlen: ein zusammenhängender blickdichter Kopf,
mit Original-Zurückpfeil links, Seitentitel/Untertitel daneben und dem
Edge-to-Edge-Hero unmittelbar **unter** dem Kopf. Beim Scrollen ist weder
Hero-Bild noch Lesetext **über oder hinter dem sichtbaren Kopf** zu sehen.

Der globale, bereits bestehende body-Portal-Mechanismus bleibt erhalten,
jedoch muss dessen Kopf an `top:0` beginnen, **nicht** an
`top:var(--safe-top)`. Das mit `env(safe-area-inset-top)` bemessene
Status-/Dynamic-Island-Feld liegt **innerhalb derselben opaken Header-Fläche**,
niemals als externes transparentes Zwischenstück. Die reale Gesamthöhe
(mit Safe-Area) bestimmt der zentrale Controller und setzt sie als
`.kids-detail-head-spacer` am ursprünglichen Platz, sodass Hero und Text
darunter starten. Nach Orientation-/Viewport-Änderung Höhe neu messen.
Keine doppelten Appbars, keine zweite Statusleiste, keine schwebende Kapsel,
keine transparente Glasschicht oder verschobenes Hintergrundbild.

**Anwendung:** Der zentrale Standard gilt für jede
`.view.kids-detail-page > .kids-detail-appbar`; bereits korrekt
funktionierende Fullscreen-Dialoge behalten ihre eigene feste Leiste und
ihren Original-Zurück-Handler. Jungen-/Mädchen-Farbvariablen werden aus
der aktiven Seite übernommen. Floating-3D-Hauptnavigation, Gebetszeiten,
Audio und die gespeicherten Geschichten bleiben unverändert.

**Abnahme:** Auf iPhone-PWA (inkl. Status-/Dynamic-Island-Bereich),
Android, Fold/Tablet und Desktop visuell am Start einer Kategorie, nach
schnellem Scrollen, nach Zurück und nach Geräte-Drehung prüfen. Die
vorhandene Kids-Design-Guard-Regel muss `top:0`, Safe-Area **im** Header,
blickdichten Farb-Hintergrund, Linksausrichtung und dynamisch gemessenen
Platzhalter verifizieren. Automatisierte Codeprüfungen ersetzen keine
tatsächliche Screenshot-/Scrollprüfung.

---


## Verbindliche globale feste Kopfzeile — `KIDS_GLOBAL_FIXED_DETAIL_V1400`

Verbindlich für **sämtliche gegenwärtigen und künftig neu angelegten Unterseiten**
innerhalb der Kinder-App: Propheten, Ṣaḥābah, Ṣaḥābiyyāt, Salaf, Dīn,
Wissen, Quiz, Duʿāʾ und neue Geschichten/Unterrichtsmodule.
Der bisherige `position:sticky`-Ansatz innerhalb animierter `.view`-
und `.shell`-Container darf nicht als zuverlässige iPhone-PWA-
Kopf-Fixierung betrachtet werden. Er kann mitten auf dem Bildschirm
stehen bleiben oder mit dem Hero mitscrollen.

**Standard:** Der zentrale Controller `kids/global-detail-dock-v1247.js`
stellt die ECHTE obere Appbar eines aktiven `.view.kids-detail-page`
an `document.body` bereit. Die UI verwendet unverändert ihren
ursprünglichen Zurück-Button mit echten Click-Handlern, Titel und Untertitel.
Der Controller legt am ursprünglichen Ort lediglich einen
höhenangepassten, nicht interaktiven Platzhalter an.
`kids/global-detail-dock-v1247.css` setzt diese Leiste als
`position:fixed` mit korrekter iOS-Safe-Area und opakem Hintergrund.
Die Kopfzeile bleibt sichtbar und ihre Position ist **unabhängig von jedem
Scrollcontainer**, auch bei schnellen Scrollgesten und Kategorienwechsel.
Beim Zurückgehen oder Tab-Wechsel wird sie ohne Klon in die Originalseite
zurückgesetzt. Neue Detailseiten brauchen nur den bestehenden
`.kids-detail-page > .kids-detail-appbar`-Vertrag und keinen eigenen
Scroll-Handler.

In Vollbild-Detaildialogen bleibt die Kopfzeile als eigenes Geschwister
**vor** dem Scrollbereich. Beispiele: `#salafDetail` besitzt
`> .salaf-story-nav` + `> .salaf-detail-scroll`, nicht einen Header
INNERHALB von `.salaf-detail-scroll`. Andere bestehende Modalbereiche
mit eigenen funktionierenden Dock-Layouts werden nicht überschrieben.

**Einfache Unterseitenstruktur, dauerhaft verpflichtend:**
oberer fester Dock (einzige Zurück-Funktion) →
vollbreiter Hero `background-size:cover` ohne zweite Kapsel oder Abstand →
lesbarer, zugänglicher Inhalt im Scrollbereich →
unveränderte untere schwebende 3D-Tab-Leiste.
Keine Gesichter, keine Menschen-/Tierfiguren oder unfreiwillige
Bild-Schrift; Thema und Profilfarben beachten.
Die Seiten müssen auf iOS PWA/WKWebView, Android, Smartphone, Fold,
Tablet, iPad, Desktop und im Querformat gleich bedienbar sein.
Niemals zusätzliche Testhinweise oder interne Build-Bezeichnungen
auf öffentlich sichtbaren Oberflächen einsetzen.

**Schätze der Salaf, weitere bindende Sonderregel:**
Die acht Themenkacheln auf der Einstiegsseite sind selbst das
Navigationsverzeichnis. **Keine doppelte „Alle Geschichten“-Gesamtliste**
unterhalb der Themenkarten anzeigen, auch bei später gefülltem Manifest.
Freigegebene Geschichten werden unter ihren Kategorien angezeigt;
die gesonderten Personen-/Offline-Ansichten bleiben erreichbar.
Der zentrale Navigationsmanager muss den Zustand beim Zurückgehen
korrekt behandeln.

**Verbindliche Freigabe:** Der bestehende
`kids/check-salaf-visual-contract-v1380.cjs` innerhalb von
`scripts/kids-design-guard.js` prüft Portal-JavaScript, direkte
Appbar-/Hero-Struktur, gemessenen Platzhalter, fixierte CSS-Regeln,
ursprüngliche Back-Listener, keine globale Doppelliste, eigene
Story-Scrollfläche, Build-/Service-Worker-Versionen und freigegebene
Bild-Hashes. Echte iPhone-/Android-/Tablet-Sichtprüfung bleibt
zusätzlich erforderlich; reine CI-Green-Flags sind keine visuelle Freigabe.

---

## Verbindliche globale Detailseiten-Architektur — `KIDS_GLOBAL_DETAIL_PAGE_ARCHITECTURE_V1390`

**Für ALLE zukünftigen KIDS-Details verpflichtend:** Propheten, Ṣaḥābah,
Ṣaḥābiyyāt, Salaf, Geschichten, Duʿāʾ, Quiz, neue Unterrichte und spätere Module.

1. Eine einzige obere Navigation mit bestehendem Chevron-Zurück-Button,
   Seitentitel und dynamischem Untertitel. Kein doppelter Header,
   kein improvisierter Zurück-Pill, kein separater Kapsel- oder Zwischenstreifen.
   Den ORIGINALEN Zurück-Handler beibehalten.
2. Bei Detailseiten innerhalb eines Haupt-Tabs steht `.kids-detail-appbar`
   **als direktes erstes Kind** der aktiven `.view.kids-detail-page`,
   niemals in einem dynamisch ersetzten `.pane`, verschachtelten
   `.salaf-wrap` oder scrollenden Hero. `data-kids-detail-layout` setzen.
   So greift global `kids/global-detail-dock-v1247.css`: ein festes/sticky
   Appbar unabhängig von den nachfolgenden Inhalten. Die Safe Area wird
   **einmal** berücksichtigt.
3. Ein `.kids-detail-hero` folgt DIREKT unter diesem Kopf ohne Lücke,
   zusätzliche Umrandung oder zweite Vollbild-Kapsel, `background-size:cover`,
   sinnvolle Brennweite, echtes Edge-to-Edge über das Inhaltsgutter.
   Motiv/Bildunterschrift nicht als Bild generieren: Titel bleibt echte
   zugängliche, mehrzeilige HTML-Schrift. Responsive Höhe begrenzen;
   nicht auf jedem Smartphone 100vh erzwingen.
4. Der sichtbare Detailinhalt scrollt im **einen echten Scrollcontainer**
   (gewöhnlich `.shell`). Header bleibt oben fest, die untere bestehende
   **frei schwebende 3D-Hauptnavigation** bleibt absolut unverändert.
   Kein zusätzliches `overflow-y:auto` für Hero/Absatz/Navigation, keine
   transform/animation auf sticky-Eltern, keine Scroll-Listener als Ersatz
   für CSS-sticky. Vollständig bedienbar im Hoch-/Querformat auf iPhone,
   Android, Fold/Tablet/iPad und Desktop.
5. Profilfarbe getrennt: Jungen Petrol/Nachtblau/Gold;
   Mädchen Pflaume/Rosé/Champagner. Keine pauschale Farbpalette.
   Bilder ohne Menschen, erkennbare Gesichter, Silhouetten oder Tiere;
   keine ungewollte Schrift oder erfundene religiöse Darstellung.
6. Vor Merge/Deploy: reale Layout-/Scrollprüfung und bestehende
   `scripts/kids-design-guard.js`-Abnahme. V1390-CI prüft direktes
   Header-Markup, Appbar/Stage-Semantik, globale CSS-Kontraktregeln,
   Original-Bild-Hashes, zusammenpassende Service-Worker-/Build-IDs und
   unveränderte drei HTML-Einstiege. Bildinhalte bleiben zusätzlich
   **manuell** zu prüfen, die Tests sind keine Gesichtserkennung.
7. Bei neuen Modulen direkt dasselbe globale Contract-Muster nutzen und
   in den bestehenden Design-Guard aufnehmen. Keine projektspezifischen
   Doppel-Header/CSS-Sonderarchitekturen und niemals die globale
   `change-scope-lock.json` als Abkürzung lockern.

**Korrekturfall Schätze der Salaf:** V1380 platzierte das Header-Element
im per `innerHTML` erneuerten `#salafHome`. Dadurch scrollte der Kopf mit
und das Hero wirkte vom Kopf abgesetzt. Seit V1390 ist das einzige
`#salafTopicAppbar` ein dauerhaftes direktes Kind von `#view-salaf`,
dessen Sichtbarkeit/Text beim Wechsel nur aktualisiert werden.

---

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


## Globaler Glow wie Startseite — `KIDS_HOME_GLOW_PARITY_V16`

- Referenz für Hover und Touch ist ausschließlich der ruhige Glow der Startseiten-Karten.
- Global gilt: eine goldene Kontur plus ein weicher, kurzer Gold-Halo. Kein Gold/Türkis-Doppel-Neon und kein starkes inneres Aufleuchten.
- Dieselbe Intensität gilt in Geschichten, Dīn, Propheten, Ṣaḥābah, Ṣaḥābiyyāt, Duʿāʾ, Qurʾān, Quiz und Eltern sowie für künftige markierte Kids-Karten.
- Kleine Controls verwenden denselben Charakter mit kleinerem Radius.
- Kein Scale, kein Lift und kein Springen.


## Globaler Detail-Kopf — `KIDS_GLOBAL_DETAIL_DOCK_V1247`

- Die bisherigen ovalen, frei im Hero liegenden Zurück-Controls auf den **Detail- und Leseseiten** werden ab V1247 durch denselben **eingedockten Top-Header** wie bei „Den Dīn lernen“ ersetzt.
- Diese neue, ausdrücklich angeforderte Regel **überstimmt für Detailseiten** die älteren V13–V15-Ausnahmen für Hero-Overlay-Zurück-Buttons. Die Hero-Grafiken selbst bleiben unverändert und folgen direkt unter dem Header.
- Pflichtaufbau: links 46–50 px Zurück-Control mit Chevron, feine vertikale Akzentlinie, rechts dynamischer Seitentitel und ruhiger Untertitel; ganze Breite, untere Rundung, feiner Gold-/Petrol-Glow und iOS-Safe-Area.
- Der ursprüngliche Button samt seinem Event-Handler wird in die Kopfzeile verschoben, **niemals durch einen funktionslosen Klon ersetzt**. Wisch-Navigation, Fokus, Lesetext, Audio-Player und Scroll-Position bleiben erhalten.
- Gilt für die Detailansichten von Propheten, Ṣaḥābah, Ṣaḥābiyyāt, Dīn-Lektionen, Geschichten des Īmān, Duʿāʾ sowie die vorhandenen Wissen-, Qurʾān- und Quiz-Dialoge.
- Für künftige Detailmodule `kids/global-detail-dock-v1247.js` als zentrale Registrierung verwenden statt neue ovale Einzelcontrols zu bauen.
- **Nicht betroffen:** Startseiten-Hero, normale Bereichs-Header und insbesondere die untere schwebende Haupt-Tab-Leiste.


## Global kompakter Kopf — `KIDS_COMPACT_GLOBAL_TOP_DOCK_V1248`

- Detail- und Bibliotheksköpfe verwenden denselben kompakten eingedockten Aufbau auf Smartphones und iPads (auch im Querformat).
- Mindesthöhe **60 CSS-px + genau einmal die OS-Safe-Area** auf Smartphones, **64 CSS-px + Safe-Area** auf Tablets; längere Titel dürfen die Höhe automatisch erweitern.
- Kein Text wird abgeschnitten oder mit Ellipsen verborgen. Die Überschrift bleibt lesbar, der Untertitel bleibt direkt darunter.
- Jeder Zurück-Button bleibt mindestens **44 × 44 CSS-px** als echte anklickbare Fläche; bestehende Handler, Swipe-Back, Tastaturfokus und Screenreader-Namen bleiben erhalten.
- Nur vertikale Abstände, Kopfzeilenbreiten, Schriftgröße und Eckradius wurden verringert. Bildbühnen, untere Navigation, Ton, Lesetext, Spielstände und Inhalte ändern sich nicht.
- Die Regeln werden im letzten Abschnitt von `kids/global-detail-dock-v1247.css` definiert und mit `?v=1248` geladen; keine doppelte Safe-Area-Anrechnung oder iPad-Hochskalierung.

- Der Release-Guard liest die aktuell freigegebene Service-Worker-Version aus `kids/version.json` und prüft beide Asset-Referenzen dynamisch; eine alte CSS-Versionsnummer darf einen neuen Kids-Live-Deploy nicht blockieren.


## Duʿāʾ-Header + Erklärungsaktionen — `KIDS_DUA_FULLBLEED_EXPLANATION_CTA_V1249`

- Im Duʿāʾ-Detail reicht der feste obere Detail-Kopf von der linken bis zur rechten **Viewportkante**, unabhängig von der begrenzten Breite des Lesecontainers; die Bildbühne und die globale untere Tab-Leiste bleiben unverändert.
- Safe-Area-Inset gilt weiterhin nur einmal. Pfeiltaste/Zurück-Button bleiben mit 44 × 44 CSS-px Touchfläche vollständig bedienbar.
- Alle **echten Erklärungs-Audiobuttons** mit passenden deutschen Labels erhalten global einen sichtbaren goldenen CSS-Play-Pfeil, eine lesbare Schaltflächenbeschriftung, einen Hinweis 'Tippe hier und hör zu', sowie ruhigen Glow und deutlichen Tastaturfokus.
- Die ursprünglichen Buttons werden **nicht geklont**: Audiosignal, Klick-Handler, deaktiviert-Zustand und Accessibility bleiben erhalten. Statische Erklärungstexte bekommen eine lesbare Typografie, aber keinen falschen Play-Button.
- Gültige Release-Dateien: `kids/global-detail-dock-v1247.css?v=1249` und `kids/global-detail-dock-v1247.js?v=1249` über den v1249-Service-Worker-Cache.


## Duʿāʾ-Lesehierarchie — `KIDS_DUA_READER_HERO_INTRO_V1250`

- Hero: visuelles Motiv + kompaktes Kicker-Siegel + Duʿāʾ-Titel; die Erklärung/Einleitung erscheint **unter** dem Motiv ohne zusätzlichen Kasten, nur mit dezenter Goldlinie.
- Genau **eine leichte Lesefläche** für Arabisch, Lautschrift, deutsche Bedeutung, Erklärungs-Audiobutton und Quellennennung. Die Fläche hat weniger Innenabstand und geringere Rahmen-/Schattenstärke.
- Smartphone: Arabisch 35–49 CSS-px, Lautschrift 18–21 CSS-px, Deutsch 18–21 CSS-px; Tablet: gleiche Lesbarkeit, nur angemessene breite. Lange arabische Verse, lange Titel und Lautschrift umbrechen ohne Abschneiden.
- Qurʾān- und Ḥadīṯ-Quellen bleiben als **reiner, lesbarer Text** erhalten. Externe Nachweis-Schaltflächen werden in der Kinder-App **nicht generiert**; `sourceUrl` bleibt intern in den geprüften Datensätzen erhalten, keine externe Navigation.
- Untere globale Tabs, Screenreader-Bezeichnungen, Lern-/Hör-Audio, bestehende Interaktionen und Bilder bleiben unverändert.
- CSS/JS für den Duʿāʾ-Hub: `dua-hub-v1219.css?v=1250`, `dua-hub-v1219.js?v=1250`, Offline-Cache `v1250`.


## Globale Quellenanzeige für Kinder — V1251

In allen Kinderansichten bleibt der **konkrete Quellenbeleg als reiner, gut lesbarer Text** erhalten. Es werden keine Schaltflächen mit „Nachweis öffnen“, „Quelle öffnen“ oder „Beleg öffnen“ angeboten. Auch ältere Duʿāʾ-Dialoge und dynamisch hinzugefügte Bedienelemente dürfen diese externen Quellenaktionen nicht erneut einblenden. Die Audio-, Lern- und Navigationsfunktionen bleiben unverändert.

## Mädchenfiguren – verbindliche Bedeckungsregel

- Mädchenfiguren **niemals mit sichtbaren Haaren, Haaransatz oder unbedecktem Hals** darstellen.
- Die Figur trägt einen vollständig bedeckenden Ḥiǧāb/Khimār. Für Gebetsanimationen und Gebetstrainer nur passende, vollständig bedeckende Gebetskleidung verwenden.
- Dies gilt gleichermaßen für Avatare, Heroes, Illustrationen, Animationen, generierte Medien und Vorschaubilder.
- Für reine Gebetszeiten-Anzeigen sind **keine Figuren nötig**; die Uhrzeit und gut lesbare animierte Typografie haben Vorrang.


## Gebetszeiten – immersiver Startseiten-Hero (V1270)

- Der bestehende Startseiten-Hero, der Salām, „Hören. Mitlesen. Lernen.“ und der Gebetszeitbereich bilden **eine einzige, visuell durchgehende Bildbühne**. Die Gebetszeitdarstellung erhält ausdrücklich **keine zweite, isolierte Karte/Kapsel** und keinen abrupten Hintergrundausschnitt.
- Reihenfolge: Markenbild/Avatar → Salām → Hör-/Lern-Einleitung → „Zeit für Ṣalāh“ → aktuelle und nächste Gebetszeit → Live-Countdown → alle fünf Zeiten → Schaltfläche „Alle Gebetszeiten ansehen“ → nächster regulärer Home-Inhalt.
- Vollbild-Detail „Unsere fünf Gebete“: nächtliches Moschee-/Laternen-Motiv im oberen Hintergrund, gut lesbarer Titel und Untertitel, kompakte Ortsauswahl, fünf groß lesbare Zeilen (Fajr, Dhuhr, ʿAṣr, Maghrib, ʿIshāʾ) mit thematisch abgestuften Tageslichtmotiven. Das aktuelle Gebet ist warm-golden hervorgehoben, das nächste türkis; Mädchenprofil erhält eigenständige Rosé-/Violett-Abstimmung.
- **Uhrzeiten und Countdown sind niemals Teil eines generierten Bildes/Videos**. Nur standort- und methodenbezogene echte Daten im DOM; bei fehlendem Ort bzw. fehlender API-Antwort sinnvolle Hinweise und `--:--`, keine erfundenen Platzhalter-Zeiten.
- Adobe/Runway dienen ausschließlich atmosphärischen Hintergrundmedien. Dateien müssen lokal in der App liegen; es werden **keine temporären externen Download-URLs oder Medien-Tokens im ausgelieferten Code** eingebettet. Video ist rein dekorativ, stumm, ohne Schrift/Ziffern und mit offline verfügbarem Standbild; Energiesparmodus und `prefers-reduced-motion` werden respektiert.
- Über Smartphone-Breiten dürfen weder `HH:MM`-Ziffern noch fünf Zeitspalten abgeschnitten werden. Die unteren Kids-Navigationstabs, der Weiterhören-Bereich sowie die bestehende Home-Profilstruktur bleiben unabhängig und funktionsfähig.


## Duʿāʾ-Lernmodus – dreisprachiger Wortfokus (V1.09.01)

- **Unveränderte Vollbildseite:** Arabisch, Lautschrift und Deutsch erscheinen in genau dieser Reihenfolge, mit je einer feinen Trennlinie vor Lautschrift und Deutsch. Es wird keine weitere Karte und keine zweite horizontale Trennlinie direkt vor den Steuerungen erzeugt.
- **120 Duʿāʾs / 1.366 Wortpositionen:** Jede geprüfte arabische Wortposition besitzt eine deutsche sinngemäße Lernbedeutung und eine Lautschrift-Einheit. Diese Einheiten sind nach demselben Index synchron hervorgehoben; arabische und deutsche Grammatik müssen dabei nicht künstlich 1:1 gleichgesetzt werden. Linguistische Freigabe bleibt ein gesonderter Prüfpunkt.
- **Kompakt, aber lesbar:** Die Wortgröße ist adaptiv mit unteren Grenzen (Arabisch 31 px, Lautschrift 16,5 px, Deutsch 14 px). Hinweise und überflüssige Abstände schrumpfen vor dem eigentlichen Lesetext. Die App-Seite, Kopfzeile und Wiedergabe-Bedienelemente bleiben unverändert.
- **Lange Duʿāʾs:** Bei mehr als 18 Wörtern oder Platzmangel werden die drei Leseebenen innerhalb des vorhandenen Raums getrennt scrollbar. Das aktive arabische Wort, die passende Lautschrift und die deutsche Bedeutung bleiben gemeinsam sichtbar. Fingerbedienung darf dabei nicht die äußere Seite scrollen.
- **Audio bleibt authentisch:** „Ganz hören“ nutzt die durchgehende Fuṣḥā-Aufnahme, „Langsam hören“ ihre freigegebene langsamere Aufnahme und „Wort für Wort“ die einzelnen Wortdateien. Der Fokus läuft in allen drei Ebenen mit; beim ganzen Hören können Zeitmarker ohne freigegebene Wort-Timestamps nur näherungsweise synchronisiert sein.
- **Release-Schutz:** `scripts/kids-dua-trilingual-guard.js` prüft die vollständigen Wort-/Lautschrift-/Bedeutungsindizes, den echten Asset-Verweis in allen Kids-Einstiegsseiten sowie die passende Service-Worker-Offline-Dateiliste. Es dürfen keine veralteten festgeschriebenen Abfrageversionen einen ansonsten gültigen Release verhindern.

## Einheitliche dezente Kapsel-Rückmeldung — `KIDS_STORY_GLOW_PARITY_V1218`

- Referenz ist die sanfte Goldkontur der **Hörbücher-Karte im Home-Bereich**: keine nachträglich stärkere Beleuchtung, kein Gold-/Türkis-Doppelhalo, keine animierte Lichtwelle.
- Auf Themen-, Buch-, Unterrichts- und Geschichtenkarten gilt der gemeinsame Touch-/Hover-/Fokus-Effekt über `kids-touch-rail.css` und `kids-card-interaction.js`. Auch innerhalb geöffneter Themen bleibt die Rückmeldung gedämpft.
- Das alte verzögerte `kids-story-touch-glow`-System (560 ms) ist deaktiviert; die alte CSS-Datei liefert nur einen zurückhaltenden Fallback nach denselben Variablen.
- **Ausnahme:** Zurück- und Kopfzeilensteuerungen, globale Navigation und andere nicht als Inhaltskarte gedachte Funktionen erhalten keinen Themenkarten-Glow. Sichtbare Tastaturfokuszustände bleiben dennoch erhalten.
- Änderungen der Kapsel-Interaktion dürfen keine Abstände, Safe-Areas, Audiofunktionen oder Seitenwechsel verändern.
