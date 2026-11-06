# DĀR AL TAWḤĪD · globale Salām-Begrüßung (06.11.2026)

## Freigabevermerk

**lanes-multi-freigabe**

Der Nutzer hat ausdrücklich angeordnet, dass die **Begrüßung von der hochgeladenen Textvorlage global in der bestehenden Erwachsenen-App ersetzt und veröffentlicht** wird. Die koordinierte, inhaltsgleiche Änderung betrifft ausschließlich drei bestehende Surface-/Deploy-Spuren:

- Öffentliche Website und Desktop-/Responsive-Web-Oberfläche
- Besucher-App für iOS/iPad/WKWebView und Android-PWA einschließlich Foldables
- DAR Test als vorgeschaltete Testoberfläche

**Keine Freigabe** für Kids, Apple TV, Gebetszeitenberechnung, OneSignal-Geräteversand, Push-Sender, Quellenkarten, navigationsverändernde oder sonstige funktionale Änderungen.

## Kanonischer deutscher Wortlaut

**Salām:** As-salāmu ʿalaikum wa raḥmatullāhi wa barakātuh

**Titel:** Willkommen bei DĀR AL TAWḤĪD

**Beschreibung:** Eine geordnete Wissensplattform mit Beiträgen aus Qurʾān, authentischer Sunnah und den Āṯār der frühen Imāme – sowie einer umfangreichen Duʿāʾ-Sammlung aus Qurʾān und authentischer Sunnah.

Die drei Textteile werden als getrennte, semantische Elemente gerendert. Der Text bleibt vollständig, ohne Ellipsen/Line-Clamp oder feste Zeilenhöhen; Breite, Umbruch und Schriftgröße passen sich der nutzbaren Pane an. Die Website-Shell und Besucher-/Test-App-Shells behalten ihre jeweiligen Layout-Owner und Navigation.

## Technischer Vertrag

- Gemeinsamer neunsprachiger Textkatalog: `assets/i18n/adult-home-welcome-v1.js`; App-Sprachschlüssel `darAdultPreferredLocaleV1`, RTL für `ar/ckb`
- Deutscher Text wortgetreu; in anderen registrierten Sprachen sinngleiche Bedienoberflächentexte. Fachquellen und Originalbelege nicht berührt.
- Website: `desktop-preview/index.html`, CSS in der vorhandenen V8-Shell
- Besucher-App: vorhandene `assets/dar-adult-brand-header-v2.*` und `assets/dar-home-test-parity-visitor.js`
- Test-App: `test/assets/dar-home-html-parity-v1.js` und V47-Fallback
- Versionskonforme Einbindung durch die bestehenden Cloudflare-Surface-Router. Kein zweiter Header-/Scroll-Controller, kein zusätzlicher Tab, keine native Swift-Änderung.

## Abnahmeregel

Staging-/Testanzeige, vorhandene Regression-/GitHub-Checks, echte mobile/tablet/desktop-/RTL-Prüfungen und produktive Asset-Auslieferung getrennt nachweisen. Ein erfolgreicher Merge beweist **nicht** automatisch Geräte- oder Live-Synchronität.

Dieser Freigabevermerk gilt ausschließlich für die hier bezeichnete dreispurige Textänderung.
