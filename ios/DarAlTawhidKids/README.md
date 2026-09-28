# TAWḤĪD Kids — iOS

Eigene native App, getrennt von der Erwachsenen-App (`de.daraltawhid.app`).

- Bundle-ID: `de.daraltawhid.kids`
- Team: `ALVZ35NL2N`
- Start-URL: `https://dar-al-tawhid.de/test/kids/start`
- Schema: `daraltawhidkids://`

Die WKWebView bleibt auf `/test/kids/`. Die Erwachsenen-Seite und fremde Hosts öffnen Safari bzw. laden die Kids-Startseite neu.

## In Xcode öffnen

Doppelklick auf `Xcode-oeffnen.command` oder:

`ios/DarAlTawhidKids/DarAlTawhidKids.xcodeproj`

Scheme **DarAlTawhidKids** wählen, Signing-Team prüfen, Gerät oder Simulator, Run.

Beide Projekte zusammen: `ios/DarAlTawhid/DarAlTawhid.xcworkspace` (Erwachsene + Kids).

## TestFlight

1. Scheme DarAlTawhidKids, Any iOS Device.
2. Product → Archive.
3. App Store Connect: **neue App** mit Bundle `de.daraltawhid.kids` (nicht die Erwachsenen-App überschreiben).
4. IPA-Dateiname auf dem Schreibtisch nicht mit der Erwachsenen-IPA vermischen.
