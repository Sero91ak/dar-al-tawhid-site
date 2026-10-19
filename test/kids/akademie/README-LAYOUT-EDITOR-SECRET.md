# DĀR AL TAWḤĪD · Test-Layout-Studio-Anmeldung

Geschützter Editor:
`https://dar-al-tawhid.de/test/academy/startseiten-editor.html`

## Anmeldung auf dem iPad

Der Editor verwendet eine **einzige Passworteingabe** im Stil der Dar-Test-App,
ohne Benutzername und ohne den Browser-Basic-Auth-Dialog.
Das Formular wird vom Test-Worker ausgeliefert. Bei erfolgreicher Prüfung
stellt der Worker die private Studio-Vorschau bereit; die zugehörigen Styles
und Skripte werden in die autorisierte HTML-Antwort eingebettet.

Das Editor-Passwort wird nicht im Klartext in GitHub hinterlegt. Der gesalzene
PBKDF2-SHA256-Prüfwert befindet sich in `cloudflare/preview-gate.js`.
Ein gesondert einzurichtendes Cloudflare-Secret ist für **diesen
Vorschau-Zugang** derzeit nicht nötig.

Der Editor-Zugang ändert weder das bestehende Test-App-Passwort noch die
Kids-Akademie-Anmeldung. Ein Designerentwurf wird nicht automatisch als
Besucher-App-Inhalt veröffentlicht.

**Sicherheit:** Da das Repository öffentliche Passwort-Prüfwerte enthält,
könnte ein Angreifer schwache Passwörter offline angreifen. Darum ist dieser
Zugang nur für einen isolierten Testeditor geeignet. Für spätere Live-Push-
Aktionen müssen serverseitige, stärker geschützte Zugangsdaten und eine
zusätzliche Freigabe vorausgesetzt werden.

Beim erneuten Öffnen ist gegebenenfalls die Passworteingabe erneut nötig.
