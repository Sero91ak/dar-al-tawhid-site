# DĀR AL TAWḤĪD – Desktop Website Audit

**Stand:** 16.11.2026
**Status:** Teilprüfung und gezielte Sicherheits-/Pfadkorrekturen; vollständige Abnahme noch offen
**Branch:** `codex/desktop-audit-sanitization-2026-11`

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## A. Geprüfter Umfang

Geprüft wurden die öffentliche Desktop-Einstiegsdatei `desktop-preview/index.html`, `desktop-preview/desktop-overhaul.css`, `desktop-preview/desktop-overhaul.js`, die Desktop-Routen im produktiven Chromium-Browser, der Router `cloudflare/site-router.js`, das Preview-Gate sowie `wrangler.toml`. Projektregeln in `AGENTS.md`, `STABILITY.md` und `docs/adult-responsive-layout-contract.md` wurden einbezogen.

In der produktiven Website wurden Start, Qurʾān, Beiträge, Ḥadīṯ, Duʿāʾ, Wissen, Bibliothek, Frauen, Gebetszeiten, Quiz und Mehr aufgerufen. Bestätigt sichtbar waren unter anderem 493 Beiträge, 137 Bibliothekseinträge und 589 Quizfragen. Der Frauenbereich benötigte nach dem Aufruf zusätzliche Ladezeit. Gebetszeiten zeigten ohne erteilte Standortfreigabe keine berechneten Zeiten.

Die Projektregeln verlangen zuerst eine isolierte DAR-Test-Vorschau und einen Nachweis über Desktop, Tablet, Mobil/Fold, RTL, beide Themes, Tastatur und Interaktionen. Ein Browserzugriff auf die lokale Vorschau wurde durch die Browser-Sicherheitsrichtlinie blockiert. Daher wurde keine lokale oder DAR-Test-Vorschau als visuell abgenommen deklariert.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## B. Bestätigte Befunde

| Priorität | Befund | Ursache und Auswirkung |
| --- | --- | --- |
| Kritisch | Feste Preview-Gate-Zugangsdaten standen als Standardwerte im Quellcode und in `wrangler.toml`. | Bei fehlenden Worker-Variablen konnten geschützte Vorschaupfade mit den eingebauten Fallbacks erreichbar sein. Werte werden in diesem Bericht nicht wiedergegeben. |
| Hoch | Die öffentliche Desktop-HTML lud Frauen-CSS und JavaScript über `/test/assets/`. | Öffentliche Website war an interne Testpfade gekoppelt; Änderungen oder Sperren dieser Testassets konnten den Produktionsbereich brechen. |
| Hoch | Der Frauenrenderer lud 49 Datendateien aus dem Testdatenpfad. | Direkter Ersatz mit den anderen vorhandenen Produktionsdaten hätte Inhalte verändert: Die Bestände weichen ab. Inhalt wurde daher nicht stillschweigend ausgetauscht. |
| Mittel | HTML und Desktop-CSS enthalten zahlreiche historische Overrides und `!important`-Regeln; statische Prüfung fand 174 Regeln mit 5–9 px. | Das erschwert sichere Konsolidierung. Computed-Styles im Live-Chromium zeigten außerdem 92 Elemente unter 12 px, darunter auch kleine dekorative Metadaten. |
| Mittel | Die HTML-Grundseite hatte keine vollständige Description-/Open-Graph-/Twitter-Metadaten. | Alle dynamischen Routen teilen eine HTML-Shell; ohne Client-Aktualisierung erschienen Titel und Canonical nicht routenspezifisch. |

Der produktive Browser meldete beim geprüften Aufruf keinen Website-Konsolenfehler; protokollierte Extension-Meldungen waren dem Browser-Plugin zugeordnet. Ein vollständiger Netzwerkwasserfall- oder Core-Web-Vitals-Lauf fand nicht statt.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## C. Durchgeführte Änderungen

| Datei | Änderung |
| --- | --- |
| `cloudflare/preview-gate.js` | Eingebaute Benutzer-/Passwort-Fallbacks entfernt. Gate verweigert Zugriff, wenn private Worker-Secrets fehlen. |
| `wrangler.toml` | Öffentlich lesbare `[vars]`-Zugangswerte entfernt. |
| `desktop-preview/index.html` | Frauen-CSS wird über die öffentlichen Asset-Pfade geladen. Der Renderer wird aus einem Desktop-eigenen Bundle geladen. SEO-/Social-Metadaten ergänzt. |
| `desktop-preview/assets/frauen/frauen-fiqh.js` | Renderer isoliert kopiert; interne `/test/`-Asset- und Datenpfade durch öffentliche bzw. Desktop-spezifische Pfade ersetzt. |
| `desktop-preview/data/` | Die 49 benötigten JSON-Dateien bytegleich aus dem aktuell verwendeten Testbestand übernommen. Das hält die derzeit ausgelieferten Inhalte unverändert, bis fachliche Parität geprüft ist. Gesamtumfang rund 1,3 MB. |
| `desktop-preview/desktop-overhaul.js` | Routentitel, Beschreibung, Open-Graph-/Twitter-Felder und Canonical werden nach dem Rendern aus der sichtbaren Route aktualisiert. |
| `desktop-preview/desktop-overhaul.css` | Betroffene Mikro-Beschriftungen auf mindestens 11 px angehoben. Der große Bestand historischer CSS-Overrides wurde nicht entfernt, weil eine zuverlässige Abhängigkeits- und Screenshotprüfung fehlt. |
| `scripts/check-desktop-audit.cjs` | Regressionstest ergänzt: keine `/test/`-Referenzen im öffentlichen HTML/Renderer, alle 49 JSON-Dateien unverändert, Gate ohne unsichere Standardwerte. |
| `content/admin/change-scope-lock.json` | Eng begrenzten, zeitlich befristeten Scope für genau diese Desktop- und Gate-Dateien dokumentiert; globale Sperre bleibt aktiv. |

Keine Änderungen an nativer iOS-/Android-App, PWA, Apple TV, Kids, Admin-Oberfläche, Push oder redaktionellen Datenbeständen außerhalb der bytegleichen Desktop-Kopien.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## D. Designprüfung

Produktiv-Chromium zeigt die eigenständige Website-Shell mit Sidebar, Kopfbereich, Gebetszeitenleiste und Inhaltsbereich. Helles und dunkles Erscheinungsbild wurden am Live-Aufruf angesehen. Der geprüft sichtbare Seitenbereich hatte bei 1363 × 936 CSS-Pixeln keinen horizontalen Überlauf.

Eine Vorher-/Nachher-Abnahme der Änderungen war nicht möglich, da die lokale Vorschau im Browser durch eine Sicherheitsrichtlinie abgewiesen wurde. Die Viewport-Matrix, Zoomstufen, Tablet/Fold, RTL sowie eine vollständige Prüfung der beiden Themes stehen daher noch aus. Einheitlichkeit und vollständige Lesbarkeit beider Designs sind **nicht** abschließend bestätigt.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## E. Browser- und Viewportprüfung

| Umgebung | Ergebnis |
| --- | --- |
| Chromium, produktive Website, 1363 × 936 | Tatsächlich geöffnet; Routen navigiert, sichtbaren Start-/Frauenbereich angesehen; am gemessenen Viewport kein horizontaler Überlauf. |
| Safari auf macOS | Nicht verfügbar; nicht getestet. |
| WebKit-Automation | Nicht verfügbar; nicht getestet. |
| 1920 × 1080, 1600 × 900, 1440 × 900, 1366 × 768, 1280 × 800, 1024 × 768, 768 × 1024 | Nicht abgenommen. |
| Zoom 100 %, 125 %, 150 %, 200 % | Nicht abgenommen. |
| Lokale Desktop-Vorschau | Browserzugriff durch URL-Sicherheitsrichtlinie blockiert; keine Umgehung versucht. |

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## F. Funktionsprüfung

Im produktiven Chromium wurden die Hauptrouten über die sichtbare Navigation geöffnet. Inhalte und Routen waren für Start, Qurʾān, Beiträge, Ḥadīṯ, Duʿāʾ, Wissen, Bibliothek, Frauen, Gebetszeiten, Quiz und Mehr erreichbar. Eine vollständige Klickprüfung aller Unterseiten, Quellen/PDFs, Player-Steuerungen, Formulare, Filter und Dialogaktionen wurde nicht durchgeführt.

Audioausgabe, Tastaturbedienung, Fokusreihenfolge, Screenreader, Suche im vollständigen Funktionsumfang und Browserhistorie wurden nicht abschließend getestet. Gebetszeiten konnten ohne Standortfreigabe nicht funktional mit einem realen Standort geprüft werden.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## G. Sicherheit

Bestätigt beseitigt im Branch: die sichtbaren Default-Credentials aus `wrangler.toml` und `cloudflare/preview-gate.js`; das Gate ist bei fehlenden privaten Werten geschlossen.

**Sicherheits-/Release-Blocker:** Für geschützte Preview-Routen müssen neue, zufällige Werte über die private Cloudflare-Worker-Secret-Verwaltung gesetzt und die alten Zugangsdaten rotiert werden. Dieser Schritt wurde nicht vorgenommen. Ein Deployment mit fehlenden Secrets würde den Zugriff auf die geschützten Vorschaupfade absichtlich verweigern. Keine Zugangswerte gehören in Git oder diesen Bericht.

Öffentliche Desktop-Markup-Referenzen auf `/test/` wurden beseitigt; die 49 Datenkopien bewahren den aktuell dargestellten Bestand. Es ist noch zu prüfen, ob aus indirekt eingebundenen Dateien weitere interne Testressourcen geladen werden.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## H. Tests, Branch und Deployment

Erfolgreich ausgeführt:

- `node scripts/check-desktop-audit.cjs` – bestanden; 49 Datendateien bytegleich und Pfad-/Gate-Assertions bestanden.
- `node --check desktop-preview/desktop-overhaul.js` – bestanden.
- `node --check desktop-preview/assets/frauen/frauen-fiqh.js` – bestanden.
- `node --input-type=module --check < cloudflare/preview-gate.js` – bestanden.
- `node scripts/change-scope-lock-guard.js` – meldete sechs geänderte Dateien innerhalb erlaubter Bereiche; vorhandene Scope-Sperre bleibt aktiv.
- `git diff --check` – bestanden nach Bereinigung einer abschließenden Leerzeile.

Nicht ausgeführt: vollständiger Projekt-Build, vorhandene CI-Workflows, Browser-Matrix und produktionsnaher E2E-/Screenshotvergleich. Der Checkout enthält nur ausgewählte Sparse-Pfade; Workflowdateien und die übrigen Buildskripte waren in dieser Arbeitskopie nicht vorhanden. Kein Produktionsdeployment wurde gestartet.

GitHub-Prüfbranch: `codex/desktop-audit-sanitization-2026-11`. Commit: `e71cdf69bb3326deb1777e0d88dd5816d78e8e27`. Draft PR: [#1787](https://github.com/Sero91ak/dar-al-tawhid-site/pull/1787). Der PR stand bei Erstellung auf `mergeable: false`; keine Zusammenführung oder Veröffentlichung.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## I. Offene Punkte / Abnahmesperren

1. Cloudflare-Worker-Secrets privat rotieren und setzen; anschließend geschützte Preview-Routen prüfen.
2. Isolierte DAR-Test-Vorschau bereitstellen und die korrekte Desktop-Surface nachweisen.
3. Vollständige Viewport- und Zoommatrix mit Screenshots für beide Themes durchführen; Safari/WebKit separat prüfen.
4. CSS-Overrides nach aktiver Abhängigkeit konsolidieren; dabei Komponenten, Tablet/Mobil und weitere Surfaces regressionsprüfen.
5. Vollständige Funktionsprüfung der Player, Suche, Dialoge, Quellen, PDFs, Einstellungen, Downloads, Tastatur und Standortflüsse durchführen.
6. Performance/Core Web Vitals, Netzwerkanfragen, Barrierefreiheit, Canonical/Indexierung und indirekte Testasset-Referenzen prüfen.
7. Vor Merge das vollständige Repository-CI und alle relevanten Regressionen ausführen.

**Ergebnis:** Es gibt konkrete, überprüfbare Sicherheits- und Asset-Isolationskorrekturen. Der Auftrag zur vollständigen visuellen und funktionalen Sanierung ist mit den hier verfügbaren Browser- und Checkout-Möglichkeiten noch nicht vollständig abgenommen.
