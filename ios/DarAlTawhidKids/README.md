# DĀR AL TAWḤĪD Kids — iOS-App

Eigene native App, getrennt von der Erwachsenen-App (`de.daraltawhid.app`).

- Bundle-ID: `de.daraltawhid.kids`
- Anzeigename auf dem Homescreen: **TAWḤĪD KIDS** (der volle Name DĀR AL TAWḤĪD KIDS wird von iOS abgeschnitten)
- Lädt: `https://dar-al-tawhid.de/test/kids/start`
- Keine Erwachsenen-Navigation, kein Besucher-Feed, kein Push an alle

## In Xcode öffnen

`ios/DarAlTawhidKids/DarAlTawhidKids.xcodeproj`

Team: `ALVZ35NL2N` (wie die Haupt-App). Signing Automatic.

## App Store / TestFlight

1. In App Store Connect eine **neue App** anlegen (nicht die Erwachsenen-App überschreiben).
2. Bundle-ID `de.daraltawhid.kids` registrieren.
3. Alter: **4+**, Kategorie **Bildung**. Nicht die strenge Apple-„Kids Category“, solange kein Parental Gate gebaut ist.
4. Datenschutz: keine Werbung, kein Tracking (siehe `PrivacyInfo.xcprivacy`).
5. Archive in Xcode → Distribute App → App Store Connect.
6. TestFlight zuerst, danach Review.

Die Web-Kids-Inhalte bleiben unter `test/kids/` und werden von der nativen Hülle angezeigt. Änderungen an der Kinderwelt erscheinen nach Deploy ohne neuen Store-Build, außer die native Hülle selbst ändert sich.
