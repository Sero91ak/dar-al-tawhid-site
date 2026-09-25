# DĀR AL TAWḤĪD Kids

Eigenständige Kids-Test-App. Nicht die Besucher-App.

## Der Link, den du nutzt

https://dar-al-tawhid.de/test/kids/?darsw=1012&kv=20260925-12

Kurz: https://dar-al-tawhid.de/test/kids/

## Deploy (ohne Cloudflare-Builds-Kostenfalle)

Kids liegt auf dem **Dar-Test-Worker** (`dar-al-tawhid.de/test/kids/`), nicht auf der Besucher-App.

- Nur `test/kids/**` ändern — **kein** Besucher-`wrangler deploy`, **kein** Cloudflare Workers Builds für die Live-Site.
- Tab-Leiste/Test-App kommt über Workflow **Deploy Dar Test App** (`wrangler.test.toml`).
- Keine Push-Nachrichten aus Kids an Besucher.

## GitHub

https://github.com/Sero91ak/dar-al-tawhid-site/tree/main/test/kids
