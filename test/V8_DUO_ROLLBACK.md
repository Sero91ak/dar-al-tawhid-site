# DAR TEST V8 · Duo / Fold / iPad — isolierte Vorschau

## Sicherheits-Snapshot

- Ursprünglicher, unveränderter Ausgangspunkt: `44076f298b9966999ed16d955409a08c408145a4`
- Arbeitszweig: `feature/dar-test-v8-duo-rollback-20261022`
- Keine Veröffentlichung nach `main`, keine Änderung an `/pwa/`, Kids, produktiven iOS-Targets, Widgets oder Cloudflare-Router.
- Nur Test-App: `test/index.html`, `test/assets/dar-test-duo-v8.css`, `test/assets/dar-test-duo-v8.js`, `test/assets/fold-thumb-nav.js`, QA-Dateien.

## Sofort-Zurück

- **Im Testzweig /test/:** Schaltfläche `Zurück`. Damit wird das V8-Layout auf diesem Gerät deaktiviert und die alte Testansicht nach Neuladen dargestellt. Sämtliche übrigen App-Einstellungen bleiben unverändert.
- **Auch direkt:** `/test/?duov8=off#home` deaktiviert die Design-Schicht. `/test/?duov8=on#home` aktiviert sie erneut.
- **GitHub-Code-Rollback:** diesen Feature-Branch verwerfen oder ausschließlich die Änderungen dieses Zweigs rückgängig machen. Originalstand siehe Commit oben.
- `Zurück` löscht keine Favoriten, keine Konten, keinen Lesestand, keine Sprach- oder Farbauswahl, keine Nutzerinhalte.

## Funktionaler Ansatz

1. Originale App-Engine und Navigation bleiben Eigentümer aller Aktionen. Keine zweite Tabbar, keine Kopie von Qurʾān-/Gebetszeiten-/Player-Logik.
2. iPhone Duo / Fold offen: automatische bestehende linke Navigation bei ausreichend Breite und Höhe; eingeschränkte Fenster werden kompakt.
3. Sprache: neun registrierte Codes `de, ar, en, tr, ku, ckb, bs, fr, es`. Die vorhandene Sprachwahl prüft tatsächliche Bereitschaft; unfertige Sprachen werden nicht fälschlich freigegeben.
4. Farben/Schrift/Icon/Konto/GPS/Benachrichtigungen: vorhandene Einstellungs- und Service-Funktionen öffnen; keine Schatten-Konfiguration.
5. Nur zusätzliche CSS-/JS-Schicht, per Flag abschaltbar.

## Unverzichtbare Freigabeprüfung

`node test/tools/test-duo-v8-contract.cjs`

Danach im **Xcode 27.1 Device Hub** testen: iPhone Duo geschlossen, offen, quer, halb geöffnet, Tastatur, Split View; außerdem Samsung Fold geschlossen/offen, normales iPhone, iPad Hoch-/Querformat. Für die neun Sprachen RTL/LTR, echte Texte und sämtliche Unterseiten gesondert prüfen. Keine Produktivübernahme ohne visuelle Kontrolle und funktionale Browser-/WebView-Tests.
