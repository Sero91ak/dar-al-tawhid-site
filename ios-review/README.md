# DĀR AL TAWḤĪD – iOS-App-Bewertung (Test-Branch)

## Aktueller Stand
- `ios-review/index.html`: freiwillige, bildschirmfüllende Bewertungsseite im freigegebenen Nachtblau-/Gold-Stil.
- `ios-review/moonlit-courtyard.svg`: verlustfreies, illustriertes Ersatzmotiv (noch nicht das freigegebene Foto selbst).
- `assets/dar-more-final-v15.js`: eigener Link nur, wenn `window.DAR_OFFICIAL_IOS_APP === true`.
- Apple-Link: https://apps.apple.com/de/app/id6805988753?action=write-review
- Die Sterne sind dekorativ. Sterne und Text werden **nur im App Store** eingegeben; ein Klick beweist keine erfolgte Bewertung.

## Automatische Aufforderung – geplant, noch nicht aktiv
Die automatisch einblendende native Aufforderung muss mit **StoreKit AppStore.requestReview(in:)**
in der offiziellen iOS-App umgesetzt werden. Keine eigene automatische HTML- oder Push-Aufforderung.

Freigaberegel (alle Bedingungen):
1. Mindestens sieben Tage seit der ersten erfolgreichen App-Nutzung.
2. Mindestens fünf sinnvolle App-Sitzungen (je >= 2 Minuten aktive Nutzung; zwischen Beginn zweier gezählter Sitzungen >= 30 Minuten).
3. Mindestens ein abgeschlossener Lern-/Lesevorgang, durch die echte App signalisiert.
4. Es gibt keinen aktiven Login-/Kauf-/Download-/Audio-/Leseschritt; die App ist im Vordergrund.
5. Nicht bereits für dieselbe App-Version versucht und frühestens 180 Tage nach einem früheren Versuch.
6. Vor der Systemanfrage zwei Sekunden warten. Apple entscheidet selbst, ob ein Dialog erscheint.
7. Ein manueller Bewertungslink setzt **niemals** den Bewertungsstatus "hat bewertet".

Apple: max. 3 automatische Anzeigen in 365 Tagen (abhängig von eigenen Systemregeln),
in TestFlight wird der automatische Dialog nicht gezeigt. `AppStore.requestReview(in:)`
ist nicht als Reaktion auf einen Button-Tipp aufzurufen.

## Noch fehlende Schritte vor echter Freigabe
- Die geschützten nativen Dateien `DarAlTawhidApp.swift`/`WebAppView.swift` sind
  aktuell durch `content/admin/push-lanes-lock.json` gesperrt.
  Diese Sperre nicht umgehen. Änderungen erst nach ausdrücklicher Spur-/Globalfreigabe nach Repository-Regel.
- Erlebnissignale in der Erwachsenen-App tatsächlich verdrahten, StoreKit aufrufen,
  Policy mit simulierten Zeiten testen.
- Richtige Foto-Motivdatei statt SVG-Ersatz zuordnen und Safe-Area/kleine iPhones prüfen.
- Getrennte TestFlight-/Gerätetests; anschließend Freigabe und neuer iOS-Build.
- Kids, Android, Apple TV, Push und Live-Deployment dürfen von dieser Änderung nicht verändert werden.

Offizielle Dokumentation: https://developer.apple.com/documentation/storekit/requesting-app-store-reviews
