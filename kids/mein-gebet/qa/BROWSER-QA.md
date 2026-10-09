# Mein Gebet — Browser-QA (Entwurf)

Kein Geräte- oder Lehr-Freigabeprotokoll. Chromium kann iPhone-/iPad-Maße nur emulieren.

## Lokal
```bash
python3 -m http.server 8765 --bind 127.0.0.1
# Boy iPhone-Maß
# http://127.0.0.1:8765/kids/mein-gebet/demo-junge.html
# Girl iPad-Maß
# http://127.0.0.1:8765/kids/mein-gebet/demo-maedchen.html
# Home-Vertrag (4 Tabs, Testzugang unter Hörwelten)
# http://127.0.0.1:8765/kids/mein-gebet/qa/home-fixture.html
```

## Automatisch
```bash
NODE_PATH=/pfad/zu/playwright/node_modules node kids/mein-gebet/rigging/test-preview-playwright.cjs
node kids/mein-gebet/rigging/test-preview-v1.cjs
node kids/mein-gebet/rigging/test-kids-shell-contract.cjs
```

## Prüfpunkte
1. Home-Testzugang unter der Kapsel-Liste, keine fünfte Kapsel, kein fünfter Tab.
2. Jungenprofil → `figur-junge-original.png`; Mädchenprofil → `figur-maedchen-original.png`.
3. Vier Lernfelder öffnen; Station-Text; Vorherige/Nächste.
4. Browser-Zurück und „Zur Startseite“ kehren schichtweise zurück.
5. Safe-Area-Padding; keine Konsolenfehler.
6. Echtes iPhone/iPad/WKWebView bleibt **ausstehend**.
