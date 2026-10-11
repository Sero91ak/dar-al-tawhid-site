# KIDS „Mein Gebet“ – physische 2D-Originalquellenprüfung (12.10.2026)

**Scope:** nur der isolierte Entwicklungsbranch `feature/kids-mein-gebet-preview-20261008`, PR #825.
**Nicht:** 3D-Fertigstellung, originale Rig-Abnahme, religiöse Lehrfreigabe, App-Deployment oder Änderung an Besucherprofilen.

## Gesicherte Prüfung

1. Die tatsächlich geöffnete Library-Datei `/Kinder App/Mein_Gebet_Originale_20261011/Originale_10_Ansichten_20261011.zip` enthält 12 reguläre Einträge: zehn visuelle Original-Ansichten, `README.txt`, `original-reference-manifest.json`.
2. Fünf Originalbilder **Junge** und fünf **Mädchen**, jeweils 1.254 × 1.254 Pixel. Die zehn SHA-256-Digests im Archiv entsprechen den dauerhaft erfassten SHA-Pins in `rigging/REFERENCE-ASSET-REGISTRY-V1.json`. Die Originale werden nicht verändert und **nicht** in den Public-Repo-Assets dupliziert.
3. Die Ansichten wurden als Kontaktübersicht visuell geprüft: Junge mit weiß-goldener Kufi, weißem Gewand; Mädchen mit kräftig rosafarbenem Hijab/Kleid. Frontal-, Profil-, Rück- und Dreiviertelansichten sind bei **beiden** vorhanden. Diese Bildsichtung bestätigt **keine** mögliche 3D-Ähnlichkeit.
4. Neuer isolierter, offline nutzbarer Prüfer: `rigging/verify_original_views_zip.py`. Er liest nur erlaubte ZIP-Einträge, vergleicht **jede** Originaldatei mit dem unveränderten GitHub-Registry-SHA, der Dateigröße im Archivmanifest und 1.254×1.254-Pixel-Bildheadern. Er weist fehlende/doppelte/unbekannte Einträge, Pfadtraversal, Größenüberschreitung, SHA-Verfälschung, unzulässige 3D-Freigabe und widersprüchliche Manifestdaten zurück.
5. Im isolierten Labor wurden **8/8 synthetische Sicherheitstests** auf `rigging/test_verify_original_views_zip.py` bestanden. Die echte Bildsammlung wurde separat vollständig verarbeitet und als `original2DSourcePackVerified=true` berichtet, allerdings mit **sämtlichen 3D-, Gebets-, Kinderunterrichts- und Release-Freigaben auf `false`**. Die unabhängige GitHub-Actions-Prüfung läuft auf dem Branch.
6. Der vorher bereits fehlerhafte HTML-Vorschautest wurde repariert: gültige Zeilenumbrüche zwischen `</body>` und `</html>` sind jetzt erlaubt. Das war ein Testfehler, keine Änderung an App oder Vorschau.

### Reproduzierbare Prüfung (lokal, mit berechtigtem Originalarchiv)

```bash
python3 kids/mein-gebet/rigging/verify_original_views_zip.py \
  /PFAD/ZUR/Originale_10_Ansichten_20261011.zip \
  kids/mein-gebet/rigging/REFERENCE-ASSET-REGISTRY-V1.json \
  --output /PFAD/ZUM/original-source-audit.json
python3 kids/mein-gebet/rigging/test_verify_original_views_zip.py
```

**Datenschutz/Isolation:** Das private Quellen-ZIP gehört in die gesicherte Library und wird nur vor Ort geprüft; die GitHub CI benutzt synthetische Testbilder, nicht das private Archiv. Kein Upload von Bild-Rohdaten, GLBs, Kinder-Lernständen oder Profilen in CI.

## Verbindliche weiterhin offene Grenzen

- **V7.7-Archiv / echte Original-Jungen-GLB:** bisher nur Metadaten und historische Analysen, keine aktuell lesbaren und unabhängig geprüften Rig-Binärbytes. Nicht durch V4 oder 3D-Platzhalter ersetzen.
- **Original-Mädchen-GLB:** weiterhin keine unabhängig abgenommene originale, riggbare Binärdatei. Die fünf vorhandenen Mädchen-2D-Blickwinkel lösen nur das Quellenproblem.
- **Bewegungen, audio-synchroner Zwei-Rakʿah-Ablauf, Fiqh, echte Touch-/WebView-Tests:** weiterhin ausstehend.
- **Meilenstein 01:** `in_progress`, nicht abgeschlossen. **Meilensteine 02–12:** nicht freigegeben. `productionReady=false`; kein Merge nach `main`, keine Live-Veröffentlichung.

**Nächster realer Schritt:** Original-V7.7-GLB per autorisiertem Byte-Zugriff wiederherstellen und gegen fixierte Modell-/Referenz-Hashes sowie fünf echte Kamerablickwinkel prüfen; erst danach Originalmodell feinmodellieren/riggen und Gebetsanimationen erstellen.
