# DAR AL TAWḤĪD – Drei-Oberflächen-Regel

Dieses Projekt hat drei getrennte Oberflächen:

1. **Klassische Webseite**: `/`
2. **Web-App / PWA**: `/app/`
3. **iOS-App**: native iPhone-App mit App-Oberfläche

## Grundsatz

Gleicher Inhalt, aber getrennte Darstellung.

- Webseite: klassische Wissensplattform, SEO-freundlich, normale Header-Navigation, keine Bottom-Navigation.
- Web-App: App-Oberfläche mit Bottom-Navigation, Gebetszeiten, Push, Favoriten, Qibla, Offline/PWA.
- iOS-App: iPhone-optimierte App-Oberfläche mit Safe-Area, Push, Offline/Cache und App-Routing.

## Verboten

- App-Bottom-Navigation auf der klassischen Webseite.
- Push-/Reminder-Steuerung als Hauptbereich der Webseite.
- App-Speichern-Hinweis als Hauptfunktion der Webseite.
- Klassische Webseite in der iOS-App laden.
- Neue Inhalte nur in einer Oberfläche bauen und die anderen vergessen.

## Pflicht bei jeder Änderung

Jede Änderung muss prüfen und dokumentieren:

### Webseite
- geändert: ja/nein
- Route/Datei:
- Darstellung:
- geprüft:

### Web-App/PWA
- geändert: ja/nein
- Route/Datei:
- Darstellung:
- geprüft:

### iOS-App
- geändert: ja/nein
- URL/Route:
- Darstellung:
- geprüft:

### Gemeinsame Daten
- Datei:
- genutzt von:
- geändert: ja/nein

## Aktueller Sicherheitszustand

Die iOS-App lädt laut `DarAppShell.swift` aktuell die Live-Root-URL `https://dar-al-tawhid.de/#home`. Daher darf die Root-Seite nicht ohne iOS-App-Migration live umgestellt werden.

Sicherer Weg:

1. Klassische Webseite auf Root vorbereiten.
2. Web-App sauber nach `/app/` migrieren.
3. iOS-App-Launch-URL erst danach auf `/app/#home` ändern.
4. Alles testen.
5. Erst dann live freigeben.
