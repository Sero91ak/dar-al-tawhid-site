# DĀR AL TAWḤĪD – Erwachsenen-Layout-Audit

**Datum:** 04.11.2026  
**Basis:** `main` `10050ca6f4e0968ca7ff947e77e867d0ff8626ee`  
**Arbeitsbranch:** `fix/global-adult-layout-audit-2026-11-04`  
**Status:** Teilkorrektur und Quell-/Mock-Regressionstests abgeschlossen; technische Gesamtfreigabe offen. Kein Deploy und keine Änderung an `main`.

## Ergebnis in Kürze

Das Inventar bestätigt eine echte doppelte Fold-Layoutzuständigkeit in der Besucher-Surface: `adaptive-layout.js` berechnet die nutzbare Kapazität und schreibt den Root-Zustand; `fold-split.js` berechnete parallel eigene Breakpoints und schrieb dieselben Root-Attribute, Klassen und Pane-Messwerte. Der Fold-Controller wurde auf einen Leser der zentralen Entscheidung reduziert. Die bestehende Navigations-/Scroll-Retention-Funktion bleibt erhalten.

Das reicht nicht für die verlangte Gesamtfreigabe. DAR Test ist durch eine Login-Seite blockiert, die Native-iOS-Datei ist gesperrt und Geräte/Simulatoren stehen nicht zur Verfügung. Die erforderlichen Breiten-, Rotations-, Sprach-, Theme-, Tastatur-, Scroll- und Vorher/Nachher-Browserprüfungen wurden daher nicht vollständig ausgeführt. Zwei bestehende Frauen-Hero-Quelltextprüfungen schlagen bereits auf dem unveränderten Main-Stand fehl. Die Ergebnisse werden nicht als Layoutfreigabe ausgegeben.

## Routinen- und Layout-Eigentümer

| Surface / Route | Breiten- und Shell-Eigentümer | Geometrie / Hero / Safe Area | Scroll-Eigentümer | Befund |
| --- | --- | --- | --- | --- |
| Öffentliche Website, Desktop und Mobilbrowser | Cloudflare `site-router.js` → `desktop-preview/` | Eigenständige Website-Shell; nicht die Besucher-App-Shell | Website-Router/Seite | Separate Architektur. Live-Startseite und Frauenroute wurden im Browser angesehen. Keine Änderung an dieser Surface. |
| Besucher-App, iOS-WebView und Android-PWA | `adaptive-layout.js` für adaptive Shell-/Pane-Kapazität; `dar-app-chrome`/Bottom-Nav für App-Navigation | Basis-HTML plus über Cloudflare injizierte Erwachsenen-, Frontstage-, Hero- und Frauen-Styles; native iOS-Safe-Area zusätzlich in WebView-Host | App-/Routencontroller; Hero-Scrollstandard und Frauen-Runtime für ihre jeweiligen Routen | `fold-split.js` war zweiter Schreiber derselben Fold-Geometrie; lokal konsolidiert. Native Reset bleibt offen. |
| DAR Test, `/test/` | `cloudflare/test-app-worker.js` transformiert die Test-HTML; `dar-fold-workspace-v2.js` steuert Test-Fold-Kapazität | Test-eigene Workspace-CSS plus injizierte Erwachsenen- und Frauen-Hero-Styles | Workspace-Rail und realer `#appView` im Reader-Pane; getrennte Pane-Scrollbereiche | Worker entfernt im ausgelieferten HTML ältere Adaptive-/Fold-Assets und injiziert V2. Öffentliche Testoberfläche war am Login blockiert. |
| Desktop-Vorschau | `desktop-preview/` über Site-Router | Eigene Desktop-/Website-Regeln | Website-Routing | Nicht mit der Mobil-App zusammenführen; Desktop wurde nicht geändert. |

## Konflikt- und Ursachenmatrix

| Datei / Selektor oder Funktion | Surface | Ursache | Beobachtete Auswirkung / Risiko | Korrektur / Status |
| --- | --- | --- | --- | --- |
| `assets/adaptive-layout.js`: `data-layout`, `data-fold-dual`, `data-fold-capacity`, Klassen und Pane-Tokens | Besucher-App | Zentrale Messung des tatsächlich verfügbaren Platzes | Richtiger Shell-Eigentümer; konkurrierende Schreiber konnten Entscheidungen zeitlich überschreiben | Bleibt einziger Eigentümer; Änderungen nur über diese Runtime. |
| `assets/fold-split.js`: `isDualViewport()`, `syncRootClass()`, `scheduleSync()` | Besucher-App | Zweite Breakpoint-/Kapazitätsberechnung und Resize-/Orientierungs-/VisualViewport-Schleifen | Abweichende Dual-/Single-Entscheidung und konkurrierende Root-/Pane-Geometrie möglich | **Behoben im Branch:** liest `DarAdaptiveLayout`; ohne Eigentümer geschlossen; `sync()` ist kompatible reine Leseoperation. |
| `assets/adaptive-layout.css` + `assets/fold-split.css` | Besucher-App | Shell- und Content-Pane-Regeln liegen in getrennten Stylesheets | CSS allein bestimmt keine Ownership; benötigt Browserprüfung nach Entfernung des zweiten JS-Schreibers | Nicht pauschal entfernt. Keine neue globale `!important`-Patch-Schicht. |
| `assets/adult-fold-global-v1.css` | Besucher-App | Über `site-router.js` in Adult-Visitor-Surfaces injiziert; gemeinsame Fold-Achsenregeln | Kann mit Basis-Fold-CSS konkurrieren, wenn Selector/Order überlappen | Für Audit inventarisiert; tatsächliche Live-Cascade-Browsermessung nach Branch-Bereitstellung offen. |
| `assets/adult-responsive-viewport-v1381.css` und `assets/dar-hero-scroll-standard-v1.css` | Besucher-App/Test | Responsive, Safe-Area-, Hero- und Scrollregeln aus mehreren Versionsständen | Frühere Hero-Regeln bleiben neben den aktuellen V1407-Routenregeln geladen; Reihenfolge bestimmt Gewinner | Kein vollständiges Entfernen ohne Cascade-/Route-Messung. Vorher/Nachher-Screenshot fehlt. |
| `assets/dar-visitor-frontstage-v1.js/.css` | Besucher-App | Router injiziert Frontstage-Owner in Besucherroute | Eigener Header-/Frontstage-Adapter neben globaler adaptiver Shell | Visitor-Guard prüft Android-PWA, iPad, Insets, Resize und Kids-Isolation; keine Regression dort festgestellt. |
| Frauen `frauen-hero-seam-runtime-v1407.js` + zugehöriges CSS | Besucher-App und DAR Test | Route-spezifische Runtime misst Markenheader und hält Original-Hero/Suche gemeinsam; V1407 aktiv | Arbeitet mit früheren V1381/V1403/V1404-Regeln; CSS-Kaskade muss visueller Browserabnahme standhalten | V1407-Vertragsprüfung besteht. Zwei ältere Hero-Prüfungen scheitern an vorhandenem V3-Marker in `test/assets/dar-test-premium-header-v2.css`; nicht durch diesen Branch verursacht. |
| `assets/dar-immersive-hero-v1.js/.css`, Test-Gegenstücke | App/Test | Kein aktiver HTML-/Router-Ladevorgang gefunden; Pfade erscheinen nur in historischen Prüfungen/Fixtures | Wahrscheinlich nicht aktive Altdateien; das allein beweist keine sichere Löschbarkeit | Nicht gelöscht; Lade-/Cacheprüfung auf echter installierter App offen. |
| `cloudflare/test-app-worker.js` und `test/assets/dar-fold-workspace-v2.js/.css` | DAR Test | Worker entfernt alte adaptive/fold/Thumb-Nav-Assets und injiziert Workspace V2; V2 verwendet dieselbe App-Instanz | Im geladenen Test-Browser waren Branding-Header **und** zweiter V2-Topbar sichtbar. Dual-Workspace-Navigation zeigt sieben Einträge, während die Vertragsregel fünf Tabs verlangt; `category()` fällt für Beiträge/Quiz auf Start zurück. | **Offener sichtbarer Vertragskonflikt.** Testzugang fehlte; keine riskante Änderung ohne fachliche Browserabnahme. V2-Guard besteht, was diese UI-/Zuordnungsfrage nicht abdeckt. |
| `test/index.html`: alte adaptive/fold/thumb-nav-Tags | DAR Test Quelldatei | Quell-HTML enthält ältere Tags; Cloudflare Worker entfernt sie im transformierten Response | Direktes Öffnen aus statischem Origin oder veraltete Cacheantwort könnte andere Controller laden | Worker-Transformation aktuell nach Quelltext belegt; installierte PWA-/Cachezustände nicht mit Gerät geprüft. |
| `test/service-worker.js`: Precache der `/test/assets/adaptive-layout.*`- und `/test/assets/fold-split.*`-Pfade | DAR Test | Einträge bleiben trotz Worker-Entfernung der entsprechenden Test-Asset-Tags im Precache | Unnötige oder nicht existente Requests/alte Cachekopien möglich | Als Cache-Konsolidierungskandidat dokumentiert; keine Service-Worker-Änderung ohne Update-/Offline-Regressionstests. |
| `ios/.../WebAppView.swift`: natives `data-layout=compact` | iOS Native/WKWebView | Native Seite setzt einen Wert, Web-Layoutcontroller misst und setzt ihn erneut | Issue #1478: native und Web-Owner können gegenläufig schreiben; Web-CSS allein kann nativen Reset nicht beheben | **Gesperrt und nicht geändert.** Minimalfix braucht vorgesehene ausdrückliche Freigabe und danach Xcode-/Simulator-/TestFlight-Abnahme. |
| Scroll-/Resize-/Observer-Controller | Besucher-App/Test | Mehrere Shell-/Routencontroller können auf Resize, Mutation, History und Scroll reagieren | Mehrfache Updates/Scrollsprünge sind im Quelltext-/Mock-Gate teils abgedeckt, reale Gerätegeometrie nicht | Besucher Fold-Loop konsolidiert; gesamter Routen-/Gerätepfad bleibt offen. |

## GitHub-Issues und Pull Requests

| Referenz | Status am 04.11.2026 | Relevanz / Entscheidung |
| --- | --- | --- |
| Issue #1478 | Offen | Native WKWebView setzt `data-layout=compact`; native Datei geschützt. Nicht durch Web-CSS als gelöst behauptet. |
| Issue #1584 | Offen | Übergreifende reale Geräteabnahme, Rotation, Split/Fold und Zustanderhalt bleibt offen. |
| Issue #177 | Offen | Lang bestehendes Scroll-/Performance-Thema; dieser Patch löst nur die doppelte Fold-Shell-Schreiberschaft. |
| PR #1583 | Geschlossen, nicht gemerged | Alter Vorschlag; nicht als Basis übernommen. |
| PR #1624 | Gemerged (`cd334ca`) | Test-only Fold Workspace V2-Transformation. |
| PR #1627 | Gemerged (`6116c63`) | Reale `#appView`-Instanz wird in Pane bewegt; kein iframe/Duplikat. |
| PR #1644 | Gemerged (`f3ee478`) | Frauen-Hero V1407. |
| PR #1647 | Offen, nicht gemerged | V1408 nicht übernommen. |
| PR #1648 | Offen, nicht gemerged | V1409 nicht übernommen. |

## Branch-Änderungen

| Datei | Änderung | Grund |
| --- | --- | --- |
| `assets/fold-split.js` | Eigene Fallback-Breakpointberechnung, Root-Attribut-/Klassen-/Token-Schreibvorgänge und Resize-/Orientierungs-/VisualViewport-Loop entfernt. Zentrale `DarAdaptiveLayout`-Entscheidung gelesen; bei fehlendem Owner fail-closed. Scroll-Retention bleibt bestehen. | Erzwingt genau eine Kapazitätsentscheidung pro Besucher-Shell. |
| `scripts/adult-layout-performance-test.cjs` | Regressionstest ergänzt: kein zweiter Listener, keine Root-Geometrieschreibvorgänge, zentraler Fold-Zustand gelesen. | Macht Ownership-Vereinbarung maschinell überprüfbar. |
| `docs/adult-layout-audit-2026-11-04.md` | Audit, Status, Konfliktmatrix und Testgrenzen dokumentiert. | Reviewbarer Befund und klare Abnahmesperren. |

## Ausgeführte Prüfungen

| Prüfung | Ergebnis |
| --- | --- |
| Workflow-Gates: JS-Syntax, Touch/Navigation, Layout-Performance, Footer-Route | **Bestanden** |
| `node scripts/app-health-check.js` | **Bestanden**; Repository meldet „All health checks passed.“ |
| `node test/tools/dar-duo-responsive-guard.cjs` | **Bestanden**; V2-Reparent/Restore/No-iframe-Mock. |
| `node test/tools/dar-fold-workspace-v2-guard.cjs` | **Bestanden**; V2-Struktur/Capacity/Route- und Scroll-Vertrag. |
| `node scripts/test-visitor-frontstage-v1.cjs` | **Bestanden**; simulierte Breiten-/Inset-/Resize-/PWA-Fälle. |
| `node scripts/verify-frauen-hero-contract.cjs` | **Bestanden**; Quellen-/Vertragsprüfung, kein Ersatz für Browsergeometrie. |
| `node scripts/check-adult-hero-route-matrix.cjs` | **Fehlgeschlagen auf vorhandenem Main-Code**; V3-Marker in `test/assets/dar-test-premium-header-v2.css`. |
| `node scripts/check-adult-hero-seam.cjs` | **Fehlgeschlagen auf vorhandenem Main-Code**; derselbe veraltete V3-Test-CSS-Marker. |
| Core-sensitive-change-lock self-test + JSON-Dateiliste des Branch-Patches | **Bestanden**; keine geschützte Datei geändert. Der erste Aufruf ohne `--input` war ungültig und fail-closed; maßgebliche gezielte Prüfung ist danach erfolgreich gelaufen. |
| `git diff --check` | **Bestanden** |

## Reale Browser-/Geräteabnahme

| Surface / Prüfung | Ergebnis |
| --- | --- |
| Öffentliche Website im Browser | Vorherzustand visuell aufgerufen: eigene Desktop-Shell und Frauenroute sichtbar. Keine Änderungen hier. Keine Browsergeometrieexporte und kein Nachherzustand, weil es keinen Deploy geben darf. |
| DAR Test `/test/` | Reale Seite im Browser geöffnet; Login-Form blockiert App-Zugriff. Kein Login-Versuch. Im sichtbaren Shell-Zustand zweiter Topbar und Sieben-Punkte-Rail festgestellt. |
| Breiten 320, 360, 390, 430, 600, 768, 900, 1024, 1280, 1440, 1920 CSS-px | Nicht vollständig als Browser-Viewport-Matrix durchführbar. Testscripts decken nur ausgewählte simulierte Größen ab. |
| iPhone/iPad Portrait/Landscape, Split View, Android-PWA, Foldable geschlossen/geöffnet, Dual-Screen/Falz | Nicht mit echten Geräten durchgeführt. |
| Native iOS WKWebView | Nicht getestet; keine Simulator-/Xcode-Session. `WebAppView.swift` bleibt unangetastet. |
| 9 Erwachsenen-Sprachen, RTL Arabisch/Sorani, Themes, Zoom/Schriftvergrößerung, Tastatur, Back/Forward, Qurʾān-Player/Suche/Gebetszeiten | Kein vollständiger realer End-to-End-Lauf; verbleibende Abnahmebedingung. |
| Vorher-/Nachher-Screenshots | Öffentliche Website nur als Vorher-Beobachtung; kein Nachher-Screenshot der Branch-Korrektur. DAR Test kein App-Zugriff. Freigabenachweis fehlt. |

## Freigabestatus

Technisch abgeschlossen ist nur die eng abgegrenzte Entfernung der zweiten Fold-Kapazitäts-/Root-Schreiberschaft samt Mock-Regressionstest. Die Gesamtaufgabe ist **nicht freigabefähig**, bis die beiden vorhandenen Hero-Prüfungen fachlich bereinigt oder als veraltet ersetzt sind, die Test-V2-Header-/Fünf-Tab-Zuordnung im angemeldeten DAR-Test-Browser überprüft wurde, und die verlangte reale Geräte-/Browsermatrix einschließlich iOS Native abgenommen ist. Es wurde kein Deploy, keine Push-Auslösung, kein Merge und keine Store-Auslieferung vorgenommen.

**Empfehlung:** PR als Audit-/Teilkorrektur zur Code-Review bereitstellen, aber nicht mergen oder live freigeben, bis die offenen Test- und Eigentümerfragen geschlossen sind.
