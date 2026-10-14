# TAWḤĪD KIDS · V2.0 – Test-Abnahme A (14.10.2026)

## Zweck
Erste sichtbare, **rein gestalterische Testumsetzung** im Bereich „Schätze der Salaf“, ausschließlich auf `kids-creator-staging` und `dar-al-tawhid-kids-creator.sero91ak.workers.dev`. Keine Änderungen an `main`, der öffentlichen Kinder-App oder an der nativen Besucher-App.

## Unantastbar
- Startseite mit dem genehmigten Moscheebild `/kids/assets/kids-salah-v1272/hero-home.png`.
- Alle fünf Gebetszeiten und ihre Berechnung, Position, Darstellung und Bedienung.
- Bestehende untere schwebende 3D-Navigation und alle Icons.
- Gespeicherte Profile/Lernstände, laufendes Audio, Storytexte, Quellen, Quizfragen und Offline-Daten.
- Bestehende Jungen-/Mädchen-Hero-Bilder; keine neuen Motive oder Personen.
- Keine sichtbaren Test-/Entwicklerhinweise innerhalb der Kinderansichten.

## Pilot A: Schätze der Salaf
**Neu:** abgestimmte Gestaltungsvariablen für Jungen (Nachtblau/Petrol/Gold) und Mädchen (Pflaume/Rosé/Champagnergold), konsistente Themenkartengrenzen, bessere Lesbarkeit, deutlicher ausgewählte Themenfilter, ruhige Schatten, sinnvolle Abstände, barrierearme Fokuszustände und kleine Bildschirmbreiten.

**Nicht geändert:** Kategorienanzahl/-ordnung, Texte, Story-Player, Quellen, Hero-Bilder, Story-Scrollposition, Kopf-Dock, Gebetszeiten und untere Navigation.

**Technik:** ein rein additives Stylesheet `/kids/design-v2-salaf-pilot.css?v=20261014-1`, ausschließlich in den drei identischen Test-Entrypoints geladen. CSS beeinflusst nur `#view-salaf` und dessen Kinder.

## Visuelle Abnahme im Test-Worker
1. Jungenprofil öffnen → Geschichten → Schätze der Salaf. Originalhero, acht Themenkarten, aktive Filter, Titel und Text visuell kontrollieren.
2. Mädchenprofil öffnen → dieselben Schritte. Kein blauer/lila rechteckiger Fremdhintergrund, gut erkennbare Gold-/Rosé-Akzente.
3. Kategorie → Geschichte → Zurück, auch nach schnellem Scrollen. Header sitzt oben; Hero beginnt unmittelbar darunter. Keine doppelte Geschichtenliste.
4. iPhone-Safe-Area, Android-Chrome, Tablet und Hoch-/Querformat kontrollieren. Mindestens 56px hohe Bedienelemente.
5. Zur Startseite zurückkehren: Moscheebild, alle fünf Gebetszeiten und die ovale 3D-Navigation sind identisch zur bisherigen App.
6. Bei fehlendem Audio sind die Hörmodi deaktiviert, Lesen funktioniert weiterhin. Keine Quellen-URLs in Kinderansichten.

**Automatischer Test:** `node kids/tools/test-v2-salaf-pilot.cjs` wird vor dem getrennten KIDS-Creator-Deploy geprüft.

## Nur KIDS-Testserver veröffentlichen
GitHub Actions → **Deploy Dar Test App** → **Run workflow** → Branch **kids-creator-staging** → target **kids-creator**.
Dadurch wird nur der getrennte KIDS Creator Worker publiziert; die öffentliche Domain bleibt unverändert.
Testlink: https://dar-al-tawhid-kids-creator.sero91ak.workers.dev/kids/start.html

Kein Merge nach `main` und keine Besucher-Veröffentlichung ohne ausdrückliche Freigabe nach Sichtprüfung.

## Danach
Nach der ersten visuellen Bewertung: eventuelle Pilotfehler korrigieren, Designsystem stabilisieren und die nächste einzelne Kategorie im Creator-Testzweig übernehmen. Keine Massenausrollung.
