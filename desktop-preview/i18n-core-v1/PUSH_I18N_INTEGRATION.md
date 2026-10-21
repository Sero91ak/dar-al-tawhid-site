# DĀR Zentrum – Push-Lokalisierung: Integrationsvertrag

Status: Entwurf, kein Live-Versand, nur Erwachsenen-App. Kids-App ausgeschlossen.

## Architektur

1. Sprachregister: desktop-preview/i18n-core-v1/locales.json. Derzeit de, ar, en, tr, ku, ckb, bs, fr, es. Beliebig erweiterbar; neu registrierte Codes sind erst nach redaktioneller Freigabe lieferbar.
2. Jede Installation bzw. OneSignal-Subscription erhält eine eigene **serverseitig geschützte** Zuordnung app_locale, aus der **in der App ausdrücklich gewählten Sprache**. OneSignal.User-`addTags` und `setLanguage` sind USER-gebunden und **kein verlässlicher Ort für unterschiedliche Sprachen zweier Geräte desselben OneSignal-Users**. Das Backend nimmt nie die Betriebssystemsprache als Ersatz einer expliziten App-Wahl.
3. Nach App-Sprachwechsel muss die Browser-/PWA-/Native-Bridge die Sprache per **authentifiziertem Backend-Endpunkt** auf die aktuelle Subscription-ID schreiben und die bestätigte Antwort prüfen. Der bloße Besitz/Empfang einer öffentlichen Subscription-ID ist kein Identitätsnachweis. Kein Client darf direkt mit anonymem PostgREST eine beliebige Zeile ändern. Ebenso nach OneSignal-Login, Reinstallation und Subscription-Wechsel; kein automatisches Push-Opt-in.
4. Native iOS und Android müssen dieselbe Sprache übertragen. Keine neue App-ID und keine zusätzliche Subscription pro Sprachwechsel.
5. Der Server wählt pro **Subscription** eine bereits geprüfte Übersetzung. Für Kurmancî/Soranî nicht auf mutmaßliche OneSignal-/OS-Sprachcodes verlassen. Bei individuell adressierten Pushs kann das bereits lokalisierte Textpaar über den technischen OneSignal-Fallback-Schlüssel en zugestellt werden. Es bleibt inhaltlich die gewählte Sprache.
6. Keine unfertigen Fachübersetzungen: Status approved und passende kanonische Revision erfordern; sonst die geprüfte deutsche Fassung verwenden, im Zielbereich Übersetzungsstatus kennzeichnen.
7. Deduplizierung über Ereignisart, tatsächliche lokale Zeit/Datum/Modus bzw. Content-ID/Revision und Subscription-ID. **Sprache gehört nicht in den Idempotenzschlüssel.** Vor Umschaltung mit der bisherigen Queue, Collapse-ID, Tages-ID und bestehenden Delivery-Claims abgleichen; niemals alte Ereignisse nachsenden.
8. Gebets-Scheduler und alle Einstellungen bleiben unverändert: Standort, Zeitzone, Berechnungsmethode, 5/10/15-Minuten-Vorwarnzeit und Taḥajjud. Die Platzhalter {minutes} und {time} werden anhand der Benutzerkonfiguration aufgelöst, niemals als starrer Standardtext verschickt.
9. Duʿāʾ, Tages-Āyah, Empfehlung und Beiträge behalten eine kanonische Content-ID, Quellenbeleg und Q-Nummer. Ziel-URL und Deep-Link müssen vor Versand mit dem tatsächlichen App-Router abgeglichen werden. Ein neuer Tages-Āyah-Sendekanal erfordert eigene Opt-ins.
10. Kein kostenpflichtiger Übersetzungs-API-Aufruf ohne Freigabe. Jede Sprache fachlich und sprachlich prüfen.

## Bereits vorhandene Integrationsstellen – bewusst noch unberührt

- index.html und test/index.html: Sprachwahl, syncPrayerPushTags, syncDailyPushTags, savePushRegistration
- assets/prayer-push-tags.js: Web-OneSignal-Subscription und Umgebung
- ios/DarAlTawhid/DarAlTawhid/DarPushNotifications.swift: Native-iOS-Registrierung
- android/app/src/main/java/de/daraltawhid/app/DarPush.kt: Native-Android-Bridge
- cloudflare/prayer-push-scheduler.js: derzeit deutsche Kopie unter de und en, sendet gebündelt nach Gebetsparametern; benötigt pro-Subscription-Locale-Auflösung
- cloudflare/daily-push-scheduler.js: derzeit deutsche Kopie unter de und en; sendet bereits pro Subscription
- desktop-preview/i18n-core-v1/onesignal-nine-language-drafts.json: 15 redaktionelle, nicht sendende OneSignal-Vorlagen

## Neu in diesem Entwurfszweig

- push-i18n-resolver.cjs: nur Berechnung, keine Netz-/OneSignal-Anbindung; Sprach-/Fallback- und ID-Auflösung
- test-push-i18n-resolver.cjs: Offline-Fälle für neun Sprachen, zehnte Sprache, RTL, Sprachwechsel, Duplikate, ID, Platzhalter
- audit-push-i18n.cjs: nicht sendende Inventur der OneSignal-Entwürfe und des Sprachregisters
- push-copy-nine-languages-draft.json: 135 sprachspezifische Titel-/Textpaare für die 15 Ereignisse; alle status=draft
- push-app-locale-proposed-migration.sql: isolierte RLS-Datenbanktabelle; absichtlich NICHT angewandt
- test-push-copy-nine-languages.cjs: exakt 9×15 Paare, 5/10/15-Minuten-Dynamik, Quelle/Sprachregister
- dry-run-push-nine-languages.cjs: neun rein synthetische Einwilligungen, keine echten Empfänger


Offline-Prüfung:
    node desktop-preview/i18n-core-v1/test-push-i18n-resolver.cjs
    node desktop-preview/i18n-core-v1/audit-push-i18n.cjs
    node desktop-preview/i18n-core-v1/test-app-locale-push-adapter.cjs
    node desktop-preview/i18n-core-v1/test-push-copy-nine-languages.cjs
    node desktop-preview/i18n-core-v1/dry-run-push-nine-languages.cjs


## Bedingungen für die geschützte Live-Anbindung

Die ausdrückliche Änderungsanfrage liegt vor. Die Projektregeln verlangen aber zusätzlich das **separat vom Besitzer vorzulegende Push-Kennwort** und Marker für globale sowie spurbezogene Freigabe (Gebet, Tagesinhalt, Beitrag, OneSignal-Kern, Native). Keine Kennwörter in Klartext in Tickets, Docs oder Code. Dazu kommt die explizite Scope-Freigabe in content/admin/change-scope-lock.json. Ohne die Sperren zu erfüllen bleiben alle geschützten Sender und SDK-Integrationen unverändert.

Nächster integrierbarer Schritt nach Freigabe: die Speicherung von dar_app_locale in bestehenden Datenbanken prüfen und erforderliche Migration samt Rollback vorbereiten, Web- und Native-Sync einbauen, produktive Sender die genehmigten Textfassungen wählen lassen, OneSignal-Subscription-Test mit den neun Sprachen durchführen.

Testkriterien: nur Admin/Test-Abonnements im Staging, Push-Opt-in wahren, je Test-Subscription genau eine Nachricht pro Ereignis, korrekte Zeitwerte, korrekter Deep-Link, kein Sprachwechsel-Doppelsend, Android/iOS/Web separat prüfen. Danach bestehende Push-, Lane-, Scope-, Repo- und App-Guards sowie Deployment-Abnahme.

## Sicherheitsbefund

Eine Repository-Suche fand eine als OneSignal-API-Schlüssel bezeichnete Zeichenkette in .replit. Schlüssel nie ins Chatprotokoll kopieren. Gültigkeit und Berechtigungen prüfen und einen aktiven Schlüssel rotieren, bevor produktive Änderungen freigeschaltet werden. Git-Historie dabei mitbedenken.


## Bestätigter Datenbank-/Berechtigungsbefund am 22.10.2026

- Supabase-Projekt: DĀR Erwachsene, Tabelle public.prayer_push_registrations. RLS ist zwar aktiviert, doch alle drei bestehenden Client-Policies haben qual=true bzw. with_check=true. Direkte Prüfung ergab für anon SELECT, INSERT und UPDATE jeweils true.
- cloudflare/prayer-push-scheduler.js lädt die Registrierung derzeit mit dem öffentlichen SUPABASE_ANON_KEY. Eine sofortige RLS-Sperre **würde den laufenden Gebets-Push gefährden**. Deshalb kein ungetestetes Durchschalten, keine heimliche Migration.
- Neue app_locale-Werte dürfen **nicht** in diesem öffentlich zugänglichen Registrierungsbestand veröffentlicht werden. Es liegt ein nicht angewendeter Entwurf in push-app-locale-proposed-migration.sql für eine separate serverseitig lesbare Tabelle public.dar_push_subscription_locales vor: RLS und Force RLS, keine anon/authenticated grants, ausschließlich service_role.
- Zur produktiven Nutzung braucht es einen neuen Eigentumsnachweis über eine authentifizierte, serverseitige API. OneSignal-Subscription-ID allein ist kein Authentifizierungsfaktor. SQL-Entwurf nicht ohne separate DB-/Push-Freigabe ausführen.
- Vor Schließen der alten Client-Policies: Gebets-Scheduler mit sicherem Server-Credential verbinden, bestehende öffentliche Browser-Registrierung durch authentifizierte API ersetzen und alle drei Push-Spuren plus Opt-out real prüfen; danach minimale RLS-Policies und Grants setzen.
