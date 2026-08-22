# App Privacy Antworten fuer App Store Connect

## Data Used to Track You

No.

Die App verfolgt Nutzer nicht ueber Apps oder Websites anderer Unternehmen hinweg fuer Werbung oder Datenbroker-Zwecke.

## Data Linked to You

Voraussichtlich keine verpflichtenden personenbezogenen Daten fuer die normale Nutzung der Besucher-App.

Falls Apple nach Push fragt:
Push tokens/device identifiers may be processed for delivering notifications after user consent.

## Data Not Linked to You

Moeglich, je nach finaler technischer Einordnung:

- Diagnostics
- Usage Data
- Approximate Location, nur wenn fuer Gebetszeiten/Qibla genutzt und vom Nutzer erlaubt

## Location

Purpose:
App Functionality

Linked to user:
No, sofern keine Account-Verknuepfung besteht.

Tracking:
No.

Notes:
Location access is only used when the user chooses location-based prayer time or Qibla-related functionality.

## User Content

No public user-generated content.

## Contact Info

No contact information is required for normal app use.

## Identifiers

Push notification identifiers may be used if the user enables push notifications.

Purpose:
App Functionality

Tracking:
No.

## Diagnostics

If Apple requires an answer for technical logs:

Diagnostics may be used for crash, stability, and performance improvement.

Purpose:
Analytics / App Functionality

Tracking:
No.

## Finaler Hinweis

Vor dem Absenden in App Store Connect nochmal mit der realen iOS-Version abgleichen:

- Wenn keine native Standortberechtigung abgefragt wird, Location entsprechend nicht angeben.
- Wenn Push nur ueber Web/PWA-Seite laeuft und nicht nativ in iOS, Push-Identifier gesondert pruefen.
- Wenn Analytics im Web aktiv sind, als nicht trackingbezogene Usage/Diagnostics einordnen.

