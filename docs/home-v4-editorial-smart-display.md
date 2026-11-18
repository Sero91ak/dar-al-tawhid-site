# DĀR AL TAWḤĪD HOME · Editorial V4 (Smart Prayer Display)

**Stand:** 2026-11-18. **Release-Typ:** isolierte Browser-/Android-Kiosk-Testoberfläche, noch kein Verkaufsgerät.

## Architektur und Designvertrag
- Ziel: ruhiges, klassisch-islamisches Ambient-Display im Stil der DĀR-Apple-TV-Inhaltsarchitektur, nicht dieselbe Oberfläche und nicht blind kopierte tvOS-Views.
- Hintergrund ist **die gesamte Bildschirmfläche**. Ausgedehnte Kontrastverläufe hinter wichtigen Texten statt vieler Karten.
- Großformatiges nächstes Gebet + Countdown; rechts Vers; durch feine Linien begrenzte Reihe der fünf täglichen Gebete; darunter Ḥadīṯ/Qurʾān-Tagesinhalt und Player als zwei editoriale Zonen.
- **Keine untere Tab-Bar**. Ein zentraler Einstellungsknopf im Header; sämtliche sekundären Funktionen über die Einstellungen.
- Nur interaktive Bedienelemente wie Audio, Gebetsauswahl, Einstellungen-Selects und Buttons erhalten Begrenzungen oder kleine visuelle Flächen.
- Großes, kontrastreiches Arabisch und Deutsch; Dār al-Layl und Salbei-Elfenbein; Lesbarkeit auch vor Bildern.

## Quell-Assets und vorhandene Datenverträge
- DĀR-Logo: `/app-logo-original.png`.
- DĀR-3D-Icons: `/assets/dar-3d-icons/`, insbesondere `prayer.png`, `settings.png`, `quran.png`.
- Gebetszeitmotive: `/test/assets/prayer-motifs/{fajr,dhuhr,asr,maghrib,isha}.webp`, mit vorhandenem `/kids/assets/kids-salah-v1262/cinematic-still.jpg` als Fehlerersatz.
- Hintergrundgalerie: bereits in V3 nachgewiesene GitHub-Dateien, u.a. `/assets/home-v1194/hero-wide-adobe.jpg`, `/kids/assets/kids-salah-v1262/cinematic-still.jpg` und `/test/assets/dar-3d-icons/dar-home-cinematic-hero.png`.
- Apple TV-Inhaltsverträge werden referenziert, nicht überschrieben: `apple-tv/home/catalog.json`, `apple-tv/prayer/catalog.json`, `apple-tv/prayer/adhan.json`, `apple-tv/screensaver/catalog.json`, `apple-tv/screensaver/rotation.json`.
- Bestehender HOME-Prototyp verwaltet Gebetszeiten aus DĀR-API, Tagesvers aus `/content/updates/daily.json`, Qurʾān-Audio-Proxy sowie lokale UI-Präferenzen. Die Faǧr-/Standard-Aḏān-Wahl der V3 bleibt aktiv.

## Implementierte V4-Komponenten
1. `home-device/home-v4.css`: Kantenfreie redaktionelle Flächen, Gradienten, Trennlinien, Lesbarkeitsschichten, SwiftUI-ähnliche Touch-Einstellungsoberfläche ohne zusätzliche Karten.
2. `home-device/home-v4.js`: einzelne Einstellungen-Schaltfläche, Apple-TV-inspirierte Vollbild-Aḏān-Darstellung mit jeweiligem vorhandenen Gebetsmotiv, Fehlerersatz, dezentes Branding im Bildschirmschoner.
3. `home-device/index.html`: untere Leiste entfernt und referenzlose Event-Handler abgesichert. „Qurʾān-Vers anzeigen“ und „Ḥadīṯ anzeigen“ jetzt direkt in Einstellungen > Qurʾān & Ḥadīṯ erreichbar.
4. Autonome Quellaktualisierung gemäß bestehender HOME-V2/V3-Logik. Keine Änderung der produktiven Plattform oder der anderen Apps.

## Verifiziert
- HOME V4 Browser-Syntax und Layout bei 1024×600, 1280×800, 1600×900, 1920×1200, 800×1280: erfolgreich.
- Keine Fuß-Tab-Navigation; App-Lesezonen vorhanden; kein horizontales Seitenüberlaufen.
- Helles Thema und auswählbare GitHub-Hintergründe, konfigurierbarer Bildschirmschoner: automatisierte Interaktionstests erfolgreich.
- Audiodaten-Katalogauswahl: 8 Faǧr- und 20 reguläre Aḏān-Aufnahmen geladen.
- Logo, 3D-Icon-Assets und vorhandene Bildquellen via HTTPS geprüft; Gebetszeitmotiven für alle fünf Gebete zusätzliche CI-Prüfung.
- Qurʾān-Titel kollabiert auch bei mittlerer Landscape-Höhe nicht mehr.
- HOME-Kiosk-Vorschau wird ausschließlich über eigenen Cloudflare Worker `dar-home-kiosk-preview` veröffentlicht.

## Tatsächlich noch offen
- Das **lokale Xcode-/iCloud-Projekt mit zusätzlichen Apple-TV-Hintergrund- und Ersatzbildern** konnte nicht direkt aus diesem Chat gelesen werden. Die verfügbaren Inhalte stammen aus dem verbundenen GitHub-Repositorium. Keine Behauptung, alle lokalen Xcode-Assets importiert zu haben.
- Das hier ist keine echte SwiftUI-App, sondern eine responsive, SwiftUI-artige HOME-Weboberfläche für das geplante Smart-Display.
- Kein nachgewiesener Hardware-Kiosk mit Linux-Firmware, signierten Offline-OTA-Updates, geschütztem WLAN-Pairing mit iOS/Android oder garantiertem Browser-Hintergrund-Aḏān.
- Noch keine vollständige tvOS-ShuffleBag-5/5/5-Rotation von Ḥadīṯ/Āṯār/Qurʾān-Tadabbur im HOME-Bildschirmschoner; der vorhandene V2-Kern bietet bisher Qurʾān-/Ḥadīṯ-Wechsel.
- Für verkaufte Geräte Lizenzen für Bilder/Audios, genaue Gebetszeiten-Methodik, Hardware-Langzeitprüfung, Aḏān-/Akkustiktests und native Betriebssystemintegration prüfen.

## Sicherheits- und Release-Regeln
- Keine Änderung an tvOS/iOS/Android/Kids oder produktivem Website-Router.
- Geschützten GitHub-Core-Workflow nicht umgehen oder nach `main` mergen; separater Feature-Branch sowie Preview-Worker.
- Geräteeinstellungen bleiben lokal; Cloud-Veröffentlichung ändert keine persönlichen Werte.
- Prüfergebnisse sind Browser-/CI-Abnahme, keine Hardware-Zertifizierung.
