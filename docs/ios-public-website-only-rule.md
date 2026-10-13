# iOS Besucher – ausschließlich Website (13.10.2026)

Verbindliche Oberflächenregel für DĀR AL TAWḤĪD:

- Auf iPhone und iPad in Safari, ChatGPT-In-App-Browser, Messengern und sonstigen normalen Browsern öffnet sich unter `https://dar-al-tawhid.de/` nur die **öffentliche Website**.
- Alte Besucher-PWA-Einstiege (`/?pwa=1`, `/?homescreen=1`, `/?app=1`, `/?mobile=1`, `/pwa/`) dürfen die Besucher-App-Shell auf iOS/iPadOS nicht ausliefern. Stattdessen Website-Einstieg `/`.
- iPadOS mit Macintosh-Desktop-User-Agent benötigt ergänzende clientseitige Erkennung (Touch-Gerät) und den PWA-Service-Worker-Schutz.
- Die offizielle **native iOS-App im App Store** bleibt unabhängig davon erreichbar und darf nicht durch eine Browser-Sperre beschädigt werden.
- Android: eigene PWA mit Installation, Offline-Shell und isoliertem Cache bleibt unverändert.
- Test-App, KIDS und private Verwaltungsoberflächen nicht durch pauschale iOS-Weiterleitungen verändern.
- Niemals einen iOS-Besucher-Web-App-Link mit `?pwa=1` empfehlen. Öffentlich für Apple nur `https://dar-al-tawhid.de/` verlinken.
- Browser-Chrome/Toolbar externer Apps kann nicht durch HTML/CSS entfernt werden. Keine browserseitigen UI-Elemente simulieren oder entfernen.
- Quellenbelege `/q/N/` bleiben einzeln öffentlich erreichbar; die Eigentümer-Quellenbibliothek `/quellen/` ist ein getrennter Zugriffsschutz-Auftrag.

Technik: `cloudflare/site-router.js` (iOS-Browser-Routing und iPadOS-Fallback), `pwa/service-worker.js` (alte iOS-Offline-Shell abweisen), `scripts/public-website-isolation-guard.js` (Regressionstests). Ein Commit allein bestätigt noch keinen Cloudflare-Live-Deploy.
