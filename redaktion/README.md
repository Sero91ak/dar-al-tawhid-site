# DĀR AL TAWḤĪD · Privates Redaktionsatelier

Private Browseradresse: `/redaktion/` (kein öffentlicher Beitrags- oder Quellenlink).

## Sicherheit und Inbetriebnahme

Die Route wird *vor* dem öffentlichen Seitenrouting in `cloudflare/site-router.js` über `cloudflare/editorial-gate.js` geprüft. Das Repository nutzt in `wrangler.toml` bereits `[assets] run_worker_first = true`. Dadurch erfordert auch der Zugriff auf `/redaktion/index.html`, `/redaktion/editor.js` und `/redaktion/style.css` eine gültige Sitzung.

Im Cloudflare Worker `dar-al-tawhid-site` müssen vor Freigabe **zwei geheime Werte** eingerichtet sein:

- `EDITORIAL_OWNER_PASSWORD`: ein neues, einzigartiges und langes Eigentümerpasswort; **nicht** das im alten Frontend hinterlegte Test-/Admin-Passwort wiederverwenden.
- `EDITORIAL_OWNER_SESSION_SECRET`: unabhängiger zufälliger Sitzungsschlüssel mit mindestens 32 Zeichen (besser mindestens 32 zufällige Bytes, Base64-codiert).

Diese Werte **niemals in GitHub, HTML, JavaScript, Logs oder Chats speichern**. Sind sie nicht vorhanden, antworten sämtliche Redaktionsrouten absichtlich mit HTTP 503 statt Inhalte herauszugeben. Login: serverseitige Prüfung, signiertes `HttpOnly; Secure; SameSite=Strict`-Cookie, maximale Gültigkeit 14 Tage, anschließend erneute Eingabe. Auf dem Cloudflare-WAF-Login-Pfad `/redaktion/login` ein Rate Limit aktivieren. Cloudflare Access bzw. MFA kann zusätzlich die Identität absichern.

Ein Commit allein bestätigt **keinen Live-Deploy**. Nach Einrichtung der Secrets erfolgt die reguläre `Deploy Besucher-App`-Auslieferung über den zentralen Produktions-Workflow. Anschließend unautorisiert `/redaktion/`, `/redaktion/index.html`, `/redaktion/editor.js` und `/redaktion/style.css` von einem ausgeloggten Browser prüfen und sicherstellen, dass kein Dateiinhalt erscheint. Anschließend die An-/Abmeldung auf iPhone, iPad und Desktop testen. Bereits öffentlich in einem GitHub-Repository gespeicherte Dateien können unabhängig vom URL-Gate eingesehen werden; dort dürfen folglich keine privaten Eigentümer-Entwürfe oder Passwörter abgelegt werden.

## Redaktionsfunktionen

- Lesen aus `content/posts/posts-index.json` und kanonischen `content/posts/<slug>.md`. Eine GitHub-Original-ID bleibt für alle neun Sprachen dieselbe.
- `de,ar,en,tr,ku,ckb,bs,fr,es`; RTL für Arabisch und Soranî.
- Bereits offiziell freigegebene Übersetzungsmanuskripte können, wo vorhanden, als **noch unfreigegebene Social-Media-Entwürfe** eingelesen werden. Keine unbestätigten Fachübersetzungen automatisch freigeben.
- Quellenlink wird nur nach Abruf einer vorhandenen `/q/<nummer>/`-Seite bestätigt; keine freie Nummer erfinden.
- Nachweiskarten aus dem Originalbeitrag und der konkreten Q-Seite; pro Originalbeleg ein kopierbarer Direktlink, möglichst mit Autor, Buch, Band, Seite und Nummer.
- Editor für echte Unicode-Schrift sowie Markdown-Vorschau, markierbarer Text, einzelnes Zitat, komplette Textkopie, Teilen; Hashtags in Telegram/Instagram und ohne Hashtags in WhatsApp.
- Texte lassen sich als JSON exportieren/importieren. **Lokale Entwurfsbearbeitung wird vorerst nur im jeweiligen Browser gespeichert.** Die dauerhafte private serverseitige GitHub-Schreib-/Synchronisierungsanbindung ist noch nicht aktiviert.
- Kein automatisches Veröffentlichen, keine Änderungen an OneSignal, vorhandenen Besucher- oder Kids-Inhalten.

## Weitere verpflichtende Abnahme

Redaktionelle Prüfung jeder einzelnen Übersetzung, Quellenidentität und originalgetreue Unicode-Kopie auf iOS/Android; lokale Speicher-/Export-Probe; Q-Nachweise mehrfach kontrollieren. Für manuelle Review-Bestätigungen handelt es sich nicht um unabhängige Muttersprachler-Zertifizierungen.
