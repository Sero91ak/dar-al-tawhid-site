# Layout-Studio: Anmeldung ohne zusätzliche Cloudflare-Eingabe

Editor: `https://dar-al-tawhid.de/test/academy/startseiten-editor.html`

Der Editor hat nun eine eigene, ausschließlich auf seine HTML-, JS- und CSS-Dateien
begrenzte **Browser-Basic-Anmeldung**. Auf dem iPad in Safari den festgelegten
Benutzernamen und das vom Eigentümer gewählte Passwort eingeben.

Der **gesalzene PBKDF2-SHA256-Prüfwert** liegt in `cloudflare/preview-gate.js`.
Das Klartextpasswort wird dort nicht abgelegt. Ein separates Worker-Secret oder
eine manuelle Cloudflare-Einstellung ist für diesen Zugang nicht nötig.

Der Editor-Zugang ist **kein** Erstellerzugang für die Kids-Akademie und
ändert den Test-Login der App selbst nicht. Alle Test-/Besucher-Veröffentlichungen
bleiben getrennt vom Editor-Login und benötigen ihre reguläre Freigabe.

**Hinweis:** Ein fest im öffentlich zugänglichen Repository gespeicherter
Passwort-Prüfwert kann offline angegriffen werden. Deshalb den Editor niemals
für vertrauliche Kundendaten oder unbeschränkte Produktionsrechte verwenden.
Für eine spätere serverseitige Live-Veröffentlichung muss eine stärkere
Authentifizierung mit privaten Secrets und idealerweise 2FA eingerichtet werden.

Nach einer Passwortänderung kann Safari die vorhandene Basic-Anmeldung
zwischenspeichern. Bei einer 401-Antwort die Zugangsdaten erneut eingeben oder
eine private Safari-Registerkarte nutzen.
