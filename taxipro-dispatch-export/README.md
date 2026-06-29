# TaxiPro – Taxi Meckenheim GmbH

Professionelles Dispositions-System – **zwei getrennte Apps**, kostenlos, ohne API-Key.

**Startseite:** https://sero91ak.github.io/taxipro-dispatch/home.html

## Zwei Apps – getrennt installieren

| App | URL | Home-Bildschirm |
|-----|-----|-----------------|
| **Zentrale / Disponent** | `dispatch.html` | Name: **Zentrale** (Gold) |
| **Fahrer** | `driver.html` | Name: **Fahrer** (Teal) |

### Zentrale installieren (Disponent / Admin)
1. `dispatch.html` öffnen (nicht `index.html` direkt!)
2. **iPhone:** Safari → Teilen → Zum Home-Bildschirm → **Zentrale**
3. **Android:** „Zentrale-App installieren“ oder Menü → App installieren

### Fahrer-App installieren
1. Link von der Zentrale erhalten oder `driver.html` öffnen
2. **iPhone:** Safari → Teilen → Zum Home-Bildschirm → **Fahrer**
3. PIN eingeben oder Link mit Token öffnen

## Zentrale – Funktionen

- **Serienfahrten-System:** Dashboard, Serienauftrag, Prüfliste vor Freigabe, Monatslisten, Unterschriftszettel (KTS/RE getrennt), Listenimport
- Kalender (Plan / Woche / Monat), Heute-Ansicht, Kundenkatalog
- Kranken-, Rechnungs-, Privat- und Serienfahrten
- **Adresssuche kostenlos** (OpenStreetMap / Photon – 0 €)
- Google Kalender + Google Drive Sync
- Fahrer-Vermittlung: **📱 App** oder **📲 WhatsApp**
- Mobile PWA: Bottom-Nav, Schnellzugriff, Pull-to-Refresh

## Fahrer-App – Funktionen

- Nur zugewiesene Fahrten (kein Zugang zur Zentrale)
- Navigation (Google Maps Links), Anrufen, KTS / Eigenleistung
- Fahrschein-Unterschrift, Team-Chat, Schicht Start/Ende
- Push + Sync alle ~45 Sek.

## Kosten

- App-Nutzung: **kostenlos**
- Adresssuche: **OpenStreetMap** (kein Google API-Key nötig)
- Google Maps Links zum Navigieren: kostenlos

## Google Kalender (OAuth)

In der [Google Cloud Console](https://console.cloud.google.com) Origin eintragen:

- `https://sero91ak.github.io`
- `http://localhost:8080`
