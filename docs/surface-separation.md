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

## Aktueller Sicherheitszustand (Stand PR #632)

| Oberfläche | Route / Datei | Launch |
|------------|---------------|--------|
| Webseite | `/` → `index.html` | klassische Startseite |
| Web-App/PWA | `/app/` → `app/index.html` | `#home` |
| iOS-App | `DarAppShell.swift` | `https://dar-al-tawhid.de/app/#home` |

Legacy-App-Hashes auf `/` werden per Redirect-Script und direkten Links nach `/app/` weitergeleitet.

**Wichtig:** Die iOS-App-Änderung wirkt erst mit neuem TestFlight/App-Store-Build.

Sicherer Live-Weg:

1. PR #632 vollständig testen (Webseite, `/app/`, Guards, Push-Links).
2. Draft → Ready for Review → Freigabe.
3. Erst danach deployen und iOS-Build 71+ mit `/app/#home` ausrollen.
