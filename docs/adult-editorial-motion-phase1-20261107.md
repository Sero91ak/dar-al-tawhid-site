# DĀR AL TAWḤĪD · Editorial UI & Immersive Motion – Phase 1

Status: **isolierter Preview-Branch, keine Produktionsfreigabe** · 07.11.2026

## Architektur, Scope und Verantwortlichkeiten

- **Visitor Index / iOS-WKWebView und Android-PWA:** `cloudflare/site-router.js` bindet zwei neue *kanonische* Komponenten-Dateien einmalig in `activateAdultGlobalBrandV2(html)` ein. Bereits vorhandenes Layout bleibt Eigentum der ursprünglichen Shell.
- **Neue Styles:** `assets/dar-adult-editorial-system-v1.css` enthält nur Design-Tokens und opt-in-Attribute. **Kein** neues Layer mit globalen `!important`-Overrides; keine globalen Maße oder Farben, die das Theme ersetzen.
- **Neue Laufzeit:** `assets/dar-adult-editorial-system-v1.js` ist ein begrenzter, eventbasierter Controller. Er annotiert vorhandene Beitragsleser und optionale, ausdrücklich nichtfixierte Hero-Komponenten, statt DOM zu verschieben. Ein IntersectionObserver für maximal 16 sichtbare Sprecher/Trenner; kein Scroll-Listener, keine MutationObserver-Schleife, keine Fetches, keine Timer.
- **Desktop/public Website:** eigener Surface-Owner `desktop-preview/`. Dort nur getrennt nach Desktop-Regressionsfreigabe integrieren. Eine Browser-Website darf nie durch iOS-Safe-Area-Regeln zur mobilen App-Hülle werden.
- **DAR Test:** eigenständige Oberfläche; kein Test-/Produktions-Mischcommit. Die synthetische Browser-Fixture überprüft die Komponente ohne DAR Test zu verändern.
- **Ausgenommen:** `/kids/`, `/test/`, `/admin/`, `/q/N/`, `/quellen/`, `/lernen/`, native Swift-Hülle, Quellenlinks, Login, Push, Gebetszeiten, Standort, Qibla.

## Jetzt implementiert

1. Ein Satz Theme-geerbter Tokens: Lesebreite (76ch), Fluid Spacing, feine Linien, Akzent, springartige Bewegungs-Easing-Werte.
2. Beitragsleser: ruhigere Typografie und Zeilenumbrüche; Editorial-Abschnitte und opt-in Container Queries; vorhandene Bild-/Slide-/Quellenkapseln bleiben unverändert.
3. Dezent animierte Sichtbarkeit bei **tatsächlicher** Schnittmenge des Viewports: der Text ist vor dem Observer sichtbar, keine initiale Opacity 0.
4. Opt-in `data-dar-ed-grid`, `data-dar-ed-flat-section`, `data-dar-ed-toolbar`, `data-dar-ed-expand`, `data-dar-ed-overflow`, `data-dar-ed-spring`. Keine erzwungene Card-Umgestaltung.
5. Nur `data-hero-scroll="normal"` kann opt-in scrollgetriebene Copy-Animation erhalten; sticky Header/Hero/Suche nie.
6. Ein explizites `DarAdultEditorialMotionV1.transitionSwap(owner, callback)` für spätere echte Shared-Element-Aktionen, mit Fallback und reduced-motion-Verzicht. **Nicht** globaler Router-Ersatz oder automatisch in allen Seiten aktiv.

**Noch nicht implementiert / keine Abnahmebehauptung:** Vollständige plattformübergreifende Shared-Element-Routen, Cinematic Parallax in produktiven Heroes, alle einzelnen Seiten umgebaute Editorial-Renderer, öffentliche Desktop-Adaption, neue Nav-Controller. Diese wären riskant ohne Inventur und müssen eigene Opt-in-Owner-PRs erhalten.

## Testnachweis und Freigabekriterien

- `node scripts/check-adult-editorial-motion-v1.cjs`: JS/CSS-Vertrag, keine Doppeleinbindung, keine geschützten Layout-Owner, Test/Kids/Admin/Quellen-Isolation, reduzierte Bewegung, beobachtete Reveal-Elemente, Seitenübergangs-Fallback.
- `python3 scripts/check-adult-editorial-motion-browser.py`: echter Chromium-Test auf 320/390/430/600/768/1024/1440 CSS-Px, je Salbei/Elfenbein, Dār al-Layl und RTL (21 Kombinationen) plus reduced-motion; Header- und untere Navigation-Zugriff, horizontale Überläufe und Lesebreite.
- Bestehende CI-Checks, Cloudflare-Dryrun, App-Lane-, Canonical-, Core-Lock- und Health-Prüfungen. Bei Fehlern **kein** Merge.
- Vor Live: vollständige App-/Desktop-/Fold-/iPad-Ansicht einschließlich Route/Home/Wissen/Beiträge/Frauen/Qurʾān, Tastatur/Zoom/Fokus/Quellenlink-Rückweg/Theme/9 Sprachen visuell abnehmen. Synthetische Test-Fixures allein sind kein Hardwaretest.

Die Datenquelle, Post-/Q-IDs, Originalbilder, 3D-Icons und bestehenden zwei freigegebenen Erscheinungsbilder werden nicht verändert. Diese UI-Arbeit erzeugt **keine** OneSignal-Benachrichtigung.
