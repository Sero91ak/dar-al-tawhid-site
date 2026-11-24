# DĀR AL TAWḤĪD — Social Post Studio v1.0

Interner, lokal-first Social-Media-Editor mit den zwei Original-Hintergründen aus den hochgeladenen Referenzen.

## Start

ZIP herunterladen, entpacken, `index.html` in Safari, Chrome oder Edge öffnen. Kein Server notwendig: Bytegleiche Original-Hintergründe sind als Data-URLs in `brand-data.js` eingebettet, damit Canvas-Exporte auch offline ohne CORS-Fehler funktionieren. Im lokal herunterladbaren ZIP liegen die Original-JPEGs zusätzlich unverändert unter `brand/`. Im GitHub-Modul werden die unveränderten JPEG-Bytes ausschließlich über `brand-data.js` eingebettet; das Modul benötigt daher keine zusätzlichen Binärdateien.

## Funktionen

8 Layoutvarianten: Kurzaussage, Cover/Titel, Gelehrtenzitat, Qurʾān, Widerlegung, Belegvergleich, Quellenübersicht, Fazit. Feste Brand-Ebenen, Canvas-Editor, Safe Area, Text positionieren und verschieben, Schriftgröße, Schrifttyp und Farbe, Fett-/Kursiv-Markierungen, Arabisch/RTL, lokale Bilder und Figuren innerhalb der Safe Area hinzufügen, skalieren und transparent setzen, Seiten hinzufügen, duplizieren, verschieben und löschen, Projekte im Browser speichern und als JSON weiterbearbeiten, PNG/JPG/PDF/ZIP-Export. 9 Sprachen für die Kern-Bedienoberfläche.

## Master-Lock

Cover: 1254 × 1254 Pixel. SHA256: `38c2e463b69f0f0ef0cf9a255a8d6f15336a0c143c179de29768cd321f7f8adb`.
Text: 864 × 1536 Pixel. SHA256: `691cf410220e7994081f34aa13ea49e2ac9bacfbcc6f452d422f3fbe54a5130b`.

Die Vorlagenbilder werden ohne Veränderung und proportional auf die Exportfläche eingepasst. Für 4:5 oder andere vom Original abweichende Formate verbleiben gegebenenfalls Randflächen; weder Brand-Header noch Footer werden beschnitten.

## Grenzen

Keine Apple-Pages-Dateiimportierung, keine KI-Quellenrecherche, kein autonomes Erstellen neuer Folgeseiten, kein Cloud-Sync. Schriftarten werden aus den verfügbaren Systemfonts gewählt; die ursprünglichen Apple-Pages-Fonts sind noch nicht exakt abgeglichen. Veraltete oder nicht verifizierte Beispielbelege dürfen nicht ungeprüft veröffentlicht werden. Kein Nutzer-/Admin-Login; nicht ungeschützt in die öffentliche Website einhängen. Keine Veröffentlichung oder Push-Funktion.

## Einbindung in den bestehenden DĀR Admin

Der Editor ist im Entwicklungsbranch als eigener Admin-Menüpunkt **Bildstudio** innerhalb der Gruppe **REDAKTION** integriert. Das bisherige **Redaktionsatelier** und dessen Arbeitsstand bleiben erhalten.

Geplanter Einstieg nach Cloudflare-Freigabe: `https://dar-al-tawhid.de/admin/?tab=bildstudio`

Verwendete Dateien:
- `admin/index.html`: Tab-Registrierung, Deep Link, Rendern ohne Statistik-Request
- `admin/command-center-v2.js`: Menügruppe REDAKTION / Bildstudio
- `admin/social-review.js` und `.css`: gemeinsamer Admin-Workspace mit Bildstudio-/Redaktions-Umschaltung
- `tools/dar-social-editor-v1/`: eigenständiger lokaler Canvas-Editor
- `scripts/test-admin-social-studio-integration.cjs`: statische Regressionstests

Der bestehende DĀR-Admin-PIN ist **clientseitig**; die darunterliegenden statischen Studio-Assets sind bislang **nicht mit einer separaten serverseitigen Besitzer-Sitzung geschützt**. Kein Anspruch, dass ein bloßer Menüpunkt oder eingebetteter iframe eine echte Zugriffssperre ist. Vor einer öffentlichen Produktivbereitstellung muss der Cloudflare-Router ein echtes serverseitiges Admin-Gate durchsetzen (oder der Eigentümer muss eine bewusst öffentliche Bereitstellung ausdrücklich genehmigen). Keine automatischen Veröffentlichungen, externen Uploads oder OneSignal-Pushes.

Die in den Admin-Einstellungen ausgewählte Farbe gilt ausschließlich für die Editor-Bedienoberfläche; exportierte Bilder verwenden die Original-Designmaster.

## GitHub-Integration (separater Freigabeschritt)

Isolierte Ordnerstruktur `tools/dar-social-editor-v1/`; später aus bestehendem Admin mit vorhandener Admin-Authentifizierung einbinden, ohne das Besucher-UI anzupassen. Ein GitHub-Commit ist kein Live- oder App-Nachweis. Keine Änderung an Cloudflare-Router, Source-Links, Lernbereichen, OneSignal, Kids oder bestehenden Automationen.

## Qualität

`node --check studio.js`: bestanden.
Node DOM-/Canvas-Mocktest: Initialisierung, 2 Startseiten, Textmodul hinzufügen, Seite duplizieren: bestanden.
ZIP-Byteformat/CRC: `unzip -t` bestanden.
Browser-E2E/Safari/iPad-Test: **noch offen**, weil die lokale Browsernavigation in dieser Ausführungsumgebung vom Administrator blockiert wurde. Vor Livefreigabe erforderlich.