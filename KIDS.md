# DĀR AL TAWḤĪD Kids

Eigenständige Kids-App. Nicht die Besucher-App und nicht die Erwachsenen-iOS-App.

## Web (Dar Test)

https://dar-al-tawhid.de/test/kids/

Kurz: https://dar-al-tawhid.de/test/kids/

## iOS (App Store / TestFlight)

Eigenes Xcode-Projekt: `ios/DarAlTawhidKids/`

Bundle-ID: `de.daraltawhid.kids`  
Homescreen: **TAWḤĪD KIDS** (voller Name passt nicht ungekürzt)  
Anleitung: `ios/DarAlTawhidKids/README.md`

## Deploy (ohne Cloudflare-Builds-Kostenfalle)

Kids liegt auf dem **Dar-Test-Worker** (`dar-al-tawhid.de/test/kids/`), nicht auf der Besucher-App.

- Nur `test/kids/**` und `ios/DarAlTawhidKids/**` für Kids ändern — **kein** Besucher-`wrangler deploy`.
- Keine Push-Nachrichten aus Kids an Besucher.


## Deploy (ohne Cloudflare-Builds-Kostenfalle)

Kids liegt auf dem **Dar-Test-Worker** (`dar-al-tawhid.de/test/kids/`), nicht auf der Besucher-App.

- Nur `test/kids/**` ändern — **kein** Besucher-`wrangler deploy`, **kein** Cloudflare Workers Builds für die Live-Site.
- Tab-Leiste/Test-App kommt über Workflow **Deploy Dar Test App** (`wrangler.test.toml`).
- Keine Push-Nachrichten aus Kids an Besucher.

## GitHub

https://github.com/Sero91ak/dar-al-tawhid-site/tree/main/test/kids
