# DĀR AL TAWḤĪD Kids — iOS-App

Eigene native App, getrennt von der Erwachsenen-App (`de.daraltawhid.app`).

- Bundle-ID: `de.daraltawhid.kids`
- Anzeigename auf dem Homescreen: **TAWḤĪD KIDS**
- Team: `ALVZ35NL2N`
- Start: `https://dar-al-tawhid.de/test/kids/start`
- Schema: `daraltawhidkids://`

Die WKWebView bleibt auf `/test/kids/`. Keine Erwachsenen-Navigation.

## In Xcode öffnen

Doppelklick auf `Xcode-oeffnen.command` oder:

`ios/DarAlTawhidKids/DarAlTawhidKids.xcodeproj`

Scheme **DarAlTawhidKids**, Signing Automatic, Team prüfen, Gerät oder Simulator, Run.

Beide Projekte: `ios/DarAlTawhid/DarAlTawhid.xcworkspace`.

## App Store / TestFlight

1. In App Store Connect eine **neue App** anlegen (nicht die Erwachsenen-App überschreiben).
2. Bundle-ID `de.daraltawhid.kids` registrieren.
3. Alter: **4+**, Kategorie **Bildung**. Nicht die strenge Apple-„Kids Category“, solange kein Parental Gate gebaut ist.
4. Datenschutz: keine Werbung, kein Tracking (`PrivacyInfo.xcprivacy`).
5. Archive → Distribute App → App Store Connect.
6. IPA nicht mit der Erwachsenen-Datei auf dem Schreibtisch vermischen.

Web-Kids unter `test/kids/` erscheinen nach Deploy ohne neuen Store-Build, außer die native Hülle ändert sich.
