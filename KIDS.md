# DĀR AL TAWḤĪD Kids

Eigenständige Kids-App. Nicht die Besucher-App und nicht die Erwachsenen-iOS-App.

## Web (Live)

https://dar-al-tawhid.de/kids/

Alte Adresse `/test/kids/` leitet auf `/kids/` um.

## iOS (App Store / TestFlight)

Eigenes Xcode-Projekt: `ios/DarAlTawhidKids/`

Bundle-ID: `de.daraltawhid.kids`  
Homescreen: **TAWḤĪD KIDS**  
Anleitung: `ios/DarAlTawhidKids/README.md`

Die native Hülle lädt `https://dar-al-tawhid.de/kids/start`.

## Deploy

Kids liegt auf der **Besucher-App** unter `/kids/` (`wrangler.toml` / Deploy Besucher-App).

- Inhalt: `kids/**` und `ios/DarAlTawhidKids/**`
- Keine Push-Nachrichten aus Kids an Besucher.

## GitHub

https://github.com/Sero91ak/dar-al-tawhid-site/tree/main/kids
