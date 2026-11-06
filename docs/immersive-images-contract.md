# DĀR AL TAWḤĪD – verbindliche integrierte Bildarchitektur

Nutzerfreigabe: **06.11.2026**. Designreferenzen: die vom Nutzer gezeigten Juice-Lab-App-Layouts. **Nur das Prinzip der Bildintegration übernehmen, nicht Logos, Motive, Screenshots oder das Produktdesign fremder Anbieter.**

## Verbindliche Gestaltungsregeln

1. **Bild = Benutzeroberfläche.** Historische Hero- und dekorative Seitenbilder müssen Teil einer durchkomponierten UI sein, nicht wie angehängte rechteckige Banner wirken. Bildmotiv, Typografie, Hintergrund, Kontrast, Text und Bedienelemente werden zusammen gestaltet. Weiche Schatten, Masken, fließende Übergänge und sorgfältiger Bildfokus sind zulässig.
2. **Originalbilder bleiben verbindlich.** Vorhandene freigegebene Bilder und 3D-Icons wiederverwenden. Keine Bildersetzung bei einem Layoutauftrag; Motive müssen historisch/thematisch passen. Keine Propheten darstellen. Logo bleibt Original.
3. **Scrollen unter einer fixierten Fläche.** Auf geeigneten Themen-/Detailseiten bleibt der vorhandene Header mit Hero (und, falls zugehörig, Suche) am definierten oberen Anschlag. Inhalt scrollt darunter und verschwindet hinter der deckenden Hero-Ebene. Beim Zurückscrollen erhält die Szene ihren ursprünglichen Bildausschnitt; zulässig ist eine minimale, vom echten Scrollfortschritt gesteuerte Verkleinerung des Hintergrund-Crops. Keine eigenständige zweite Scrollfläche oder Zwangsanimation.
4. **Korrekte Ausnahmen.** Auf der Startseite mit umfangreichem Gebetszeiten-/Salām-Kopf nicht den gesamten Header festklemmen. Frauenbereichs-Hero und Suche bilden weiterhin eine gemeinsame bestehende sticky Fläche; die Bildschicht darf diese Navigation nicht umbauen. Keine dekorativen Bildoverlays auf Qurʾān-Lesetext, Quellenbeweisen, Scans, Ḥadīṯ-Textgrafiken, Modals, Videos oder Kids-App.
5. **Plattformgerechte Integration.** Smartphone, Fold auf/zu, iPad, Split View, Desktop, Landscape nach verfügbarer Breite. Safe Areas, RTL und alle neun Erwachsenen-Sprachen bewahren; nur die bestehenden freigegebenen Farbschemata. Keine iPhone-Mockup-Rahmen innerhalb der eigentlichen App.
6. **Barrierefreiheit/Leistung.** Dekorative Layer `aria-hidden`; Textlesbarkeit gegen jede Fotofläche prüfen. `prefers-reduced-motion` respektieren. Keine scroll-blockierenden Touchhandler, keine DOM-Neuordnung, keine versteckten Inhaltsdoppelungen, keine neuen Layoutcontroller. Scrollfortschritt passiv lesen und grafische Effekte per `requestAnimationFrame` bündeln.
7. **Seitenbilder:** Masken und Verlaufsüberblendungen nur bei eindeutig dekorativen Bildern. Texttragende Screenshots, Buchscans, Quellenbelege dürfen niemals ausgeblendet werden.
8. **Kapseln bleiben funktional.** Bestehende Kapselarchitektur nicht gemeinsam mit einem Bildauftrag umbauen. Keine zusätzlichen leeren Rahmen zur bloßen Dekoration.
9. **Rollout:** Erst DĀR Test, mit echten Bildern und echter Navigation, dann Browser-/Geräteabnahme und gesonderte Freigabe für Besucher/iOS/Android-Live. GitHub-Commit allein ist kein Live- oder Geräte-Nachweis.

## Pilot in DĀR Test

Das experimentelle `dar-fold-workspace-v2` mit linker Seitenrail, Verschieben von `#appView` und eigenem Leser-Scrollcontainer wird im Test-Worker nicht mehr geladen; die historischen Dateien bleiben für Rollback erhalten. Die Standard-5-Tab-Leiste und der normale responsive Layout-Owner bleiben bestehen.

Die ausschließlich unter `/test/` geladenen Dateien `test/assets/dar-test-immersive-art-v1.css` und `.js` ergänzen die **vorhandenen** Bilder als dekorative Unterebenen der wirklichen Hero-Komponenten (Startseite, Frauen, Themen, Beiträge, Ḥadīṯ, Duʿāʾ, Qurʾān-Übersicht, Bibliothek). Suchfelder bleiben echte, bedienbare Inputs. Keine Änderung an Produktiv-App, Admin, Kids, TV, Watch, Push oder Beitragstexten.

Für gezielt freigegebene dekorative Seitenbilder ist `data-dar-art-inline="decorative"` als Opt-in vorgesehen; Belegscans und Bildtext niemals so kennzeichnen.

**Prüfen:** 320, 360, 390, 430, 600, 768, 1024, 1280, 1440px; iPhone, iPad Querformat, Fold geschlossen/geöffnet; dunkles und helles Theme; RTL; Suche mit Tastatur, Touch-Scroll, zurück und vor, Bildfokus und Textkontrast. Technischer Guard: `node test/tools/dar-test-immersive-art-v1-guard.cjs`.
