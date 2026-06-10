# TaxiPro Dispatch

Disposition-App für Taxi- und Krankentransport-Unternehmen.

**Online:** https://sero91ak.github.io/taxipro-dispatch/

## Als App auf dem Smartphone installieren

TaxiPro ist eine **Progressive Web App (PWA)** – installierbar wie eine native App:

- **Android (Chrome):** Menü → „App installieren“ oder Banner „Installieren“
- **iPhone (Safari):** Teilen → „Zum Home-Bildschirm“

Nach der Installation startet TaxiPro im Vollbild mit Bottom-Navigation, Touch-optimierten Formularen und Standort-Button (📍) für Abholadressen.

## Fahrer-App (separater Zugang)

Fahrer sehen **keine Zentrale** – nur ihre zugewiesenen Fahrten und Dokumente.

**Zentrale (Disposition):**
1. Fahrer anlegen → PIN & App-Link wird erzeugt
2. Bei Fahrt auf **🚀** → **📱 App** (Fahrt erscheint in der Fahrer-App) oder **📲 WA** (WhatsApp)
3. **Microsoft Cloud** verbinden (SharePoint) – damit Fahrer-Handys synchronisieren
4. Monatsende: **📄 Dokument an Fahrer senden** (Excel/PDF) → Fahrer unterschreibt in der App

**Fahrer (Smartphone):**
- Link öffnen: `index.html?mode=driver&token=…` oder PIN eingeben
- **🗺️ Navigation** → Google Maps
- **🏥 KTS** / **💶 Eigenleistung** → Zahlungsstatus an Zentrale
- **✍️ Fahrschein** → Gast-Unterschrift auf dem Display (Dialyse etc.)
- **💬 Nachricht** an die Zentrale
- **📄 Dokumente** → Monatsabrechnungen unterschreiben

**Push-Benachrichtigungen:** Beim ersten Öffnen Benachrichtigungen erlauben. Neue Fahrten & Dokumente werden per Push + Cloud-Sync (alle 45 Sek.) gemeldet.

Fahrer-Einstieg auch über: `driver.html`

Stand: Juni 2026 · Mobile PWA + Fahrer-App

## Google Kalender verbinden

In der [Google Cloud Console](https://console.cloud.google.com) unter OAuth-Client diese Origin eintragen:

- `https://sero91ak.github.io`
- `http://localhost:8080` (für lokale Entwicklung)
