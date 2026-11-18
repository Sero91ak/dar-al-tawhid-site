# DĀR AL TAWḤĪD HOME V3 · Smart Prayer Display
Stand: 18. November 2026. Scope: getrennte HOME-Web-/Android-Kiosk-Vorschau. **Keine Produktion, kein ungeprüftes Hardware-OTA.**

## Verbindliche Schnittstellen und Nutzerziel
- Eigenes Vollbildgerät 7–11 Zoll, vor allem Landscape; Touch, WLAN und Lautsprecher.
- Bestehende HOME V2 Berechnungs-/Player-Logik erhalten und optisch mit 3D-Icons, GitHub-Wallpapern, klassisch islamischer Typografie, feinen Linien und getrennten Informationszonen modernisieren.
- Originale App-Oberflächen für iOS, Android, Kids, tvOS, öffentliche Desktop-Webseite **nicht verändern**.
- Ein Hintergrundbild ist eine persönliche Geräteeinstellung; zentrale redaktionelle GitHub-Pushes dürfen das nicht ohne Zustimmung überschreiben.

## Tatsächlich in dieser Entwicklungsfassung implementiert
1. CSS-Dashboard für Landscape mit großer „Nächstes Gebet“-Ansicht, freier visueller Hintergrundfläche, Fünf-Gebete-Band, Qurʾān-Player und Tagesinhalten.
2. DĀR-3D-Icons aus `/assets/dar-3d-icons/*.png`, vorhandenes `/app-logo-original.png`, Gebetsmotive aus `/test/assets/prayer-motifs/*.webp`.
3. Auswahl mehrerer vorhandener, nicht umbenannter GitHub-Bildmotive, lokaler eigener Bilddateien bis 1,5 MB, eigenes Bild für Bildschirmschoner, Hell-/Dunkelmodus.
4. Neuer Einstellungen-Bereich in eigener Rasterarchitektur: Landscape mit Seitenleiste, zugängliche Touchflächen, Bildauswahl und Synchrontaste.
5. Getrennte Auswahl und Hörprobe für Faǧr-Aḏān und vier reguläre Gebete anhand des **vorhandenen** `apple-tv/prayer/adhan.json` Katalogs. Wiedergabe endet mit Audio-Ende bzw. bei Fehler; manuelles Stoppen erhalten. Auf dem Tablet gelten Autoplay-Einschränkungen.
6. HOME V2 liest weiterhin DĀR-API-Gebetszeiten, `content/updates/daily.json`, Rezitatoren, Ḥadīṯ-Beispielserie und Qurʾān-Audiodaten; Online-Abfrage nach bestehender Einstellung 60–900 Sekunden, standardmäßig 300 Sekunden; bei Neuverbindung.
7. Visuelle Aḏān-Überblendung verwendet auf Wunsch das Gerätelayoutmotiv und den Gebetsnamen. Vorhandener Cinematic-Videoadapter bleibt erhalten, sofern in der freigegebenen Konfiguration eine HTTPS-Quelle hinterlegt ist.
8. Bildschirm-/Aḏān-Einstellungen bleiben über den vorhandenen V2-LocalStorage und einen unabhängigen V3-Präferenzschlüssel lokal erhalten.

## Kanonische bestehende Quellen
- GitHub: `Sero91ak/dar-al-tawhid-site`; HOME-V2: `home-device/index.html`.
- 3D-Icons: `assets/dar-3d-icons/`; Logo: `app-logo-original.png`.
- Hintergrundkandidaten: `assets/home-v1194/hero-wide-adobe.jpg`, `kids/assets/kids-salah-v1262/cinematic-still.jpg`, `test/assets/dar-3d-icons/dar-home-cinematic-hero.png`, `kids/assets/kids-home-v1191/hero-static-reference.jpg`.
- Aḏān-Katalog: `apple-tv/prayer/adhan.json`; Gebetskonfiguration: `apple-tv/prayer/catalog.json`.
- TV-Bildschirmschoner-Rotation: `apple-tv/screensaver/catalog.json` und `rotation.json`.
- Kanonische tägliche Inhalte: `content/updates/daily.json`.

## Noch **nicht** als fertig ausgeben
- Verbindliche 9-Sprachen-/RTL-Abnahme, vollständiger Ḥadīṯ-Bestand, Rechte für kommerzielle Audio-/Bildverbreitung, native Linux-/Android-Systemdienste, Hardwaretests.
- Unbeaufsichtigtes Aḏān-Autoplay aus einem beliebigen Android-Browser / während Geräteschlaf und Netzausfall. Verkaufsversion benötigt einen nativen, zeitgesteuerten, auch nach Neustart beständigen Audio-Service plus Tests für Zeitzonen/DST und 72 h offline.
- Direkte Paarung/Steuerung des HOME-Geräts aus iOS/Android im lokalen WLAN, sichere OTA-/Rollback-Routine und geräteübergreifende Synchronisierung persönlicher Einstellungen.
- Eigenständiges Redaktionsbackend oder vollständiges GitHub-History-Bildauswahltool; die aktuelle Galerie verwendet **bestehende benannte Dateien**, keine unerwiesenen neuen Medien.

## Geplanter sicherer Kopplungsvertrag
1. HOME sendet oder zeigt einmaligen kurzlebigen Pair-Code/QR auf dem Bildschirm; mobile App findet Gerät optional per mDNS im lokalen WLAN nach Berechtigung, kann manuell eine Adresse eingeben.
2. Gegenüberstellung und gegenseitige Bestätigung auf Display und Mobilgerät, lokale HTTPS-/signierte Challenge, anschließend jeweils eigenes Device-Token mit minimalem Scope.
3. APIs für Status/Steuerung: `GET /api/home/v1/device`, `POST /api/home/v1/pair/claim`, `POST /api/home/v1/commands` (MVP nach Security-Review). Keine GitHub-Zugangsdaten an Endgeräte.
4. Fernsteuerung aus derselben App nur mit bestätigtem Pairing, Tokenrotation, Abbruch und Geräteentkopplung. Cloud-Gerätestatus und lokale direkte Verbindung getrennt.
5. Redaktionsänderungen: GitHub → CI/Signatur → Cloudflare → kontrollierter Pull der Geräte. Persönliche Präferenzen separat.

## Release-Gates
- 1024×600, 1280×800, 1600×900, 1920×1200 und Tablet-Hochformatfallback ohne Textüberlauf.
- Jeder Einstellungs-Button arbeitet; Fajr-Selektor listet nur `isFajr=true`, Standard-Aḏān nur `isFajr=false`.
- Audioprüfung: Start, Ende, Fehler, Unterbrechen/Fortsetzen von Qurʾān; kein Bild/Audio unbegrenzt hängen lassen.
- Inhalte: Offline-Markierung, API-Ausfall, wiederkehrende Verbindung, keine fälschlich „heute“ betitelten alten Daten.
- Kein verdeckter GitHub-/Cloudflare-Schlüssel im Browser. Standortdaten bleiben lokal; Gerätezuordnung erst nach Pairing.
- Prüfungen von Nutzerrechten und CE/RED/EMV/RoHS für Verkauf, signiertes OTA, echte Hardwaretests.

**Deployment:** ausschließlich `dar-home-kiosk-preview` auf Cloudflare Workers; Hauptworker `dar-al-tawhid-site` niemals mit HOME-Vorschau überschreiben.
