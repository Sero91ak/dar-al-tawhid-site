# DĀR AL TAWḤĪD Zentrum – Wissensbereich Themen

**Verbindliche neue Regel vom 30.10.2026.** Ergänzt die globalen Beitrags- und Quellenregeln, ersetzt sie nicht. Die Erwachsenen-Besucher-App hat drei Profiloptionen (Frau, Mann, Neutral), aber keine getrennte Bibliothekskopie.

## Dauerregel: identische Q-Quellenlinks, kontextabhängiges Zurück (05.11.2026)

Diese Regel gilt für **alle** neuen und bestehenden Wissensbereich-Themenkarten, zugeordneten Erwachsenen-Beiträge, freigegebenen Sprachen und verknüpften Lernbereiche und zugleich für die tägliche Beitragserstellung der **DĀR AL TAWḤĪD Zentrale** (Abschnitt L der bestehenden Automatik). Ein Quellenbeleg besitzt genau eine kanonische URL `https://dar-al-tawhid.de/q/N/`; diese bleibt beim Teilen über WhatsApp, Telegram und Browser **identisch**. Keine zweite Q-Karte/URL bei Zuordnung desselben Beitrags zum Frauen- und Männerwissen, keine App-spezifischen oder künstlichen Rücksprung-URLs. Manuell ausgewählte vorhandene `?lang=`-Sprachen ändern die Q-ID nicht.

**Interner Aufruf in der laufenden Erwachsenen-App:** vorhandener Reader ohne Full Reload/Start-Loader; Zurück führt vom Lernbereich zur Quelle und von dort genau zur vorherigen Beitrags-/Wissensbereichsseite, mit Tab, Suche/Filtern und Scrollstand. Browser/System-Zurück respektiert diese Hierarchie. **Extern geteilter/direkt geöffneter Quellenlink:** dieselbe selbständige `/q/N/`-Seite ohne eigenen künstlichen Zurück-Button; die Ursprungsanwendung bzw. der Browser stellt Zurück/Schließen bereit. Kein automatischer Sprung auf die Startseite; freiwillige Websitelinks sind davon unabhängig. Islamweb, Shamela, Dorar und PDF/Scan öffnen weiter ihre tatsächlichen Originalziele.

Implementierung: `assets/dar-app-chrome.js`, `assets/dar-reading-surface-v1.js`, `assets/q-source-app-view.js` (PR #1682), Regression: `node q/_registry/check-source-navigation.mjs`. **Pflicht vor jedem neuen Post oder Wissensbereich-Livegang:** gleiche URL, Q-ID, internes Zurück (inkl. Quelle→Lernen→Quelle→Post), externe Messenger-/Browseransicht ohne eigenen Back, Scrollstand, originale Fachquellen, iOS/PWA/Desktop und neun Sprachen prüfen. Vor jeder Veröffentlichung gelten weiterhin die bestehenden Locks, Freigaben, Authentizitätskontrollen, Cloudflare-Live-Nachweise und die getrennte Push-Regel.


## Die drei Kommandos

**„Wissensbereich Themen“:** Aktuellen GitHub-main-Stand, Beiträge, Q-Karten, Lernseiten, Bibliothek, bestehende Entwürfe und Veröffentlichungsmetadaten prüfen. `node scripts/wissensbereich-themen.cjs scan "THEMA"` nutzen. Geordneten Bestands-/Dubletten-/Lückenbericht für Frauen und Männer liefern, vorhandene Inhalte zur Mehrfachzuordnung vorschlagen, externe Originalquellen nur bei tatsächlichen Lücken recherchieren. Keine Veröffentlichung und keine Push-Mitteilung.

**„Wissensbereich Thema erstellen“:** Beide Zielbereiche prüfen; geeignete vorhandene Beiträge mit derselben kanonischen Post-ID wiederverwenden. Für echte Lücken getrennt überprüfbare *Entwürfe* erstellen, mit klarer Zielgruppen-Taxonomie, arabischem Originalbeleg und nachprüfbarem direkten Primärlink, genauer Übersetzung, isnād-kritischer Einordnung (falls relevant), Q-Karte, passender Lernseite und dokumentierten Gelehrtenmeinungen. Unverifizierte Kandidaten bleiben als Forschungsbedarf markiert; nichts erfinden. Validierbares Entwurfsmanifest nach `content/admin/wissensbereich-themen-drafts/YYYY-MM-DD-<slug>.json`; vor der Freigabe `node scripts/wissensbereich-themen.cjs check <datei>`.

**„Wissensbereich live pushen“:** Nur ausdrücklich geprüfte und freigegebene Inhalte über die **vorhandene DĀR-Admin-Veröffentlichungsroute** publizieren; Index, Q-Link, Inhalte, App-Ansichten und Produktionsdeploy getrennt prüfen. Dieser Befehl allein ist **kein** OneSignal-Geräteversand. Die bestehende „Beitrag erstellen / push live“-Regel für globale Veröffentlichungen bleibt erhalten.

## Hierarchie und Dubletten

Vor dem Neuschreiben nach kanonischer ID, genauer Quelle/Q-Link, Zitat, normalisierten Titeln, Schreibvarianten und semantischer Überschneidung suchen. Identischer Inhalt wird **referenziert**, nicht kopiert. So darf ein gemeinsamer Beitrag gleichzeitig in Frauenwissen und Männerwissen erscheinen, ohne doppelte Beitrags-ID, Q-Nummer oder Notification. Ähnlichkeitsfunde erfordern redaktionelle Prüfung. Das Scan-Skript ist nur ein deterministisches Vorsieb, kein vollständiger semantischer Beweis.

**Frauen:** Ḥayḍ, Nifās, Istiḥāḍah, Gebet/Fasten, Ehe/Familie, Kleidung, Mutterschaft im Fiqh, Ṣaḥābiyyāt und Gelehrte, Lernwege. **Männer:** Gebet/Jumuʿah, Ehe/Vaterschaft, Unterhalt/Zakāt, Adab/Verantwortung, Ṣaḥābah und Gelehrte, Fiqh/Uṣūl, Lernwege. **Beide:** Qurʾān, Sunnah, Tafsīr, Ḥadīṯ, ʿAqīdah, Tawḥīd, Duʿāʾ, Geschichte und Quellenkritik. Keiner der Bereiche schränkt Inhalte anderer Profile ein.

## Eigene App-Intelligenz

Zuerst ein lokaler, inkrementeller quellengebundener **Such-/Wissensindex**: kanonische ID, Inhaltshash, Sprache, Zielgruppe, geprüfte Quellen und Links. Neue freigegebene Inhalte werden indexiert, korrigierte ersetzt, entfernte nicht weiterhin angeboten. Antworten verweisen auf bestehende belegte Quellen; bei fehlendem Befund `kein geprüfter Treffer` anzeigen. Nutzerprofile/Notizen und Lernstand bleiben privat und gehen nicht ungefragt in den gemeinsamen Index. Es existiert **noch kein nachgewiesenes eigenes generatives KI-Modell**; dessen spätere Integration setzt Anbieter-/Kosten-/Datenschutzfreigabe und fachliche Prüfungen voraus.

## Profilbezogene Gerätebenachrichtigungen – geplant, nicht als live ausgeben

Das gegenwärtige Besucherprofil lebt **lokal** in der App. Eine bloße Auswahl von Frau/Mann ist deshalb noch kein verlässliches serverseitiges OneSignal-Zielgruppentag. Vor echter Auslieferung ist ein eigener, zustimmungsbasierter Profil-/Opt-in-Sync zu den registrierten Installationen erforderlich, einschließlich Profilwechsel/Abmelden und Test A/B/Neutral. Zielgruppe nur: `woman AND adult-app AND knowledge-opt-in` oder `man AND adult-app AND knowledge-opt-in`. Bei Neutral oder fehlender Einwilligung **keine Wissensbereich-Benachrichtigung**. **Kein** Ersatz durch globale OneSignal-Segmente `DAR_PUSH`, `Subscribed Users` oder `all`. Andere ausdrücklich abonnierte globale Nachrichten sind davon nicht automatisch betroffen.

**Schutz:** `content/admin/push-lanes-lock.json` fordert weiter Kennwort und separate globale sowie spurbezogene Freigabe. Bei „global live pushen“ darf niemals ohne gesonderten Geräteversandauftrag OneSignal ausgelöst werden. Existierende OneSignal-/Prayer-/Daily-Push-Dateien bis zu dieser Freigabe nicht verändern.

## Zentrale und Qualitätskontrolle

Die vorhandene DĀR-AL-TAWḤĪD-Zentrale bleibt die einzige zentrale Automatik mit ihrem aktuellen Rhythmus/Status und ihren bestehenden Sicherheits-/Zeitfenstern. Diese Anleitung ist für **nutzerinitiierte** Wissensbereich-Aufträge verbindlich, nicht für ungefragtes Dauerpublizieren. GitHub-Commit ist kein Nachweis für Live-Auslieferung; Cloudflare-Deploy ist kein Beweis für zugestellte Geräte-Pushs. Kids, Dar Test, Apple TV, native Store-Release, Gebetszeiten und bestehende Push-Spuren bleiben unverändert.

## DĀR Admin – verbindliche getrennte Push-Matrix (30.10.2026)

Die Admin-App bietet einen **Wissensbereich Themen**-Bereich mit einer deterministischen Vorschau (keine Sende-Funktion). Die neue Matrix gilt für die spätere echte Profilsegmentierung:

| Nachricht | Frau | Mann | Neutral |
|---|---|---|---|
| Allgemeiner Beitrag | Ja bei bestehendem globalem Push-Opt-in | Ja bei bestehendem globalem Push-Opt-in | Ja bei bestehendem globalem Push-Opt-in |
| Wissensbereich Frauen | Nur mit Frauenprofil + Wissens-Opt-in | Nein | Nein |
| Wissensbereich Männer | Nein | Nur mit Männerprofil + Wissens-Opt-in | Nein |

Bei Frau→Mann muss die Frau-Zuordnung entfernt werden, ehe Mann aktiviert wird; bei Mann→Frau umgekehrt. Bei Wechsel zu Neutral sind beide Zielgruppentags zu entfernen und **alle** Wissensbereich-Pushs auszuschließen. Keine Profilwahl/kein überprüftes Gerätesegment = **kein** zielgruppenbezogener Versand, aber normale globale Meldungen bleiben separat verfügbar. Identischer Beitrag in beiden Bereichen bekommt eine kanonische ID; falls ein separater Geräteversand später freigegeben wird, muss die Zustellung je Installation/Version idempotent sein.

**Implementierungsstand:** DĀR Admin zeigt die Regel und einen datenschutzfreundlichen, nicht-sendenden Routingsimulator. Es existiert noch **keine** verifizierte serverseitige Zuordnung von Besucherprofil zu OneSignal-Subscription. Die bisherige OneSignal-Schutzsperre wird nicht geändert; deshalb **keine tatsächliche Wissensbereich-Benachrichtigung** und kein Empfängercount. Die normale Inhaltsveröffentlichung bleibt unangetastet.
