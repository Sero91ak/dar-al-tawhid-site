# Frauen im Islam · Compact Editorial V1417

**Status:** Isolierter, nicht produktiver Pilot auf Basis des funktionierenden V1416 HeroDock. Keine native App-/Datenänderung.

## Ziel
Auf Wunsch des Nutzers werden nur Hub- und Kapitelübersicht im Frauenbereich kompakter, ohne Funktion oder Lesbarkeit zu opfern. Die Bilder bleiben vollständig erkennbar, ohne zusätzliche Skalierung, fremde Fotos, `transform:scale()`, neue Zuschneideparameter oder veränderte `background-position`-/`background-size`-Werte. Die vorhandene Originalfotografie mit `background-size:cover` bleibt bestehen; aufgrund unterschiedlicher Originalseitenverhältnisse ist ein vollständig uncropped Bild bei Full-Bleed physikalisch nicht garantiert.

## Technische Grenzen
- **Unverändert:** `assets/frauen/frauen-live-adapter.js`, V1416 HeroDock `assets/frauen/frauen-original-v1224-header-seam-v1405.css`, alle Originalbilddateien und URLs, `frauen-fiqh.js`, Post-/Q-IDs und Quellen.
- **Einzelne Präsentationsdatei:** `assets/frauen/frauen-compact-editorial-v1417.css`, auf `body.is-frauen-route[data-frauen-view=hub|group]` plus die originalen Frauen-DOM-Klassen begrenzt. Wird ausschließlich in der Erwachsenen-Besucher-App und DAR Test ausgeliefert. Keine globalen CSS- oder Touch-/Scroll-Regeln.
- **Vertikale Verdichtung:** Foto ca. 12 % niedriger, Kapitelkarten mit kleineren Mindesthöhen und Abständen, Suchfeld weiterhin mindestens 48 px und 16 px Text. Lange Beschreibungen und große Schrift dürfen die Karte vergrößern; **kein Ausblenden/Line-Clamp**.
- **Fold/iPad:** Spaltenanzahl richtet sich an realer nutzbarer Inhaltsbreite statt allein am Gerät; schmale Fold-Lesespalten bleiben einspaltig.
- **Scroll:** Die dynamische Platzreserve gehört weiterhin einzig zum vorhandenen V1416 ResizeObserver. Keine weiteren Controller, no extra overlays, kein Klonen oder neues `scroll`-/`touchmove`-Listening.
- **Navigation:** Back-Schaltfläche, Suche, Hero-Text, Quellen, 3D-Icons und untere Navigation werden nicht geändert.

## Freigabekriterien
Automatische Pflichtprüfungen: `scripts/check-frauen-stage-native-v1415.cjs` unverändert grün sowie `scripts/check-frauen-compact-editorial-v1417.cjs` bei 320, 390, 430, 600, 768-Fold-Lesespalte, 1024, 1280, Landscape und Salbei/Dār al-Layl. Textüberlauf, originale Foto-URL und ursprünglicher Ausschnitt, Scroll ohne Header-Sprung, Suche/Eingabe/Keyboard, Hub→Gruppe→Ausstieg, keine Doppelbilder und genaue Spacerhöhe werden geprüft.

**Kein Merge nach `main` und keine Live-Änderung ohne grüne CI und visuelle Abnahme.** Die externe Live-/Geräteprüfung ist davon unabhängig nachzuholen.