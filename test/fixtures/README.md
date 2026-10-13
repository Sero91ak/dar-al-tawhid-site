# Dar Test – schlanke Beispieldaten

Dar Test ist eine **isolierte Design- und Funktionsumgebung**, keine Kopie der Besucher-App.

- **Beiträge:** exakt fünf vorhandene, quellenbelegte Beiträge aus unterschiedlichen Kategorien. Die einzige Liste ist `content/staging/posts/posts-index.json`. Dateien mit `dir: "content/posts"` werden **nur gelesen**, nicht nach Staging kopiert. Staging-Dateien bleiben ausdrücklich unveröffentlicht.
- **Duʿāʾ:** fünf vorhandene qurʾānische Beispiele aus der Test-App. Kein Einlesen der gesamten externen Duʿāʾ-Sammlung und keine Übernahme früherer großer Duʿāʾ-Caches.
- **Übrige Bereiche:** jeweils nur so viele repräsentative Fälle, wie zur Prüfung von Layout, Navigation, Suche, Player, Offline-Funktion, unterschiedlichen Themes und Bildschirmgrößen erforderlich sind. Kernfunktionen wie Qurʾān-Reader, Suche und Verlinkung dürfen durch das Reduzieren nicht beschädigt werden.
- Keine erfundenen Zitate oder Quellen; echte Dateien und Quellenlinks verwenden.
- Bei Design-Umbauten die fünf Beispieldaten und ihre Unterseiten erhalten; Datenumfang nur bei konkretem Testbedarf gezielt erweitern.
- **Besucher-App, Produktionsinhalte und KIDS bleiben unangetastet.** Die Test-App selbst darf nicht mit einem veröffentlichten Besucherstand verwechselt werden.

Diese Regel verhindert lange Synchronisationen und zeigt dennoch Karten, Detailansichten, Quellen und Wechsel zwischen Kategorien.
