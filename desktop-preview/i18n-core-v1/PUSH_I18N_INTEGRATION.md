# DĀR Zentrum – Push-Lokalisierung: Integrationsvertrag

Status: Entwurf, kein Live-Versand, nur Erwachsenen-App. Kids-App ausgeschlossen.

## Architektur

1. Sprachregister: desktop-preview/i18n-core-v1/locales.json. Derzeit de, ar, en, tr, ku, ckb, bs, fr, es. Beliebig erweiterbar; neu registrierte Codes sind erst nach redaktioneller Freigabe lieferbar.
2. Jede Installation bzw. OneSignal-Subscription erhält das Tag dar_app_locale aus der **in der App ausdrücklich gewählten Sprache**. Die Betriebssystemsprache darf eine explizite App-Sprache nicht überschreiben.
3. Nach App-Sprachwechsel muss die bestehende Browser-/PWA-/Native-Bridge OneSignal.User.addTags({dar_app_locale: code}) setzen und dieselbe Sprache in die vorhandene Server-Registrierung zur Subscription-ID schreiben. Ebenso nach OneSignal-Login, Reinstallation und Subscription-Wechsel; kein automatisches Push-Opt-in.
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

Offline-Prüfung:
    node desktop-preview/i18n-core-v1/test-push-i18n-resolver.cjs
    node desktop-preview/i18n-core-v1/audit-push-i18n.cjs

## Bedingungen für die geschützte Live-Anbindung

Die ausdrückliche Änderungsanfrage liegt vor. Die Projektregeln verlangen aber zusätzlich das **separat vom Besitzer vorzulegende Push-Kennwort** und Marker für globale sowie spurbezogene Freigabe (Gebet, Tagesinhalt, Beitrag, OneSignal-Kern, Native). Keine Kennwörter in Klartext in Tickets, Docs oder Code. Dazu kommt die explizite Scope-Freigabe in content/admin/change-scope-lock.json. Ohne die Sperren zu erfüllen bleiben alle geschützten Sender und SDK-Integrationen unverändert.

Nächster integrierbarer Schritt nach Freigabe: die Speicherung von dar_app_locale in bestehenden Datenbanken prüfen und erforderliche Migration samt Rollback vorbereiten, Web- und Native-Sync einbauen, produktive Sender die genehmigten Textfassungen wählen lassen, OneSignal-Subscription-Test mit den neun Sprachen durchführen.

Testkriterien: nur Admin/Test-Abonnements im Staging, Push-Opt-in wahren, je Test-Subscription genau eine Nachricht pro Ereignis, korrekte Zeitwerte, korrekter Deep-Link, kein Sprachwechsel-Doppelsend, Android/iOS/Web separat prüfen. Danach bestehende Push-, Lane-, Scope-, Repo- und App-Guards sowie Deployment-Abnahme.

## Sicherheitsbefund

Eine Repository-Suche fand eine als OneSignal-API-Schlüssel bezeichnete Zeichenkette in .replit. Schlüssel nie ins Chatprotokoll kopieren. Gültigkeit und Berechtigungen prüfen und einen aktiven Schlüssel rotieren, bevor produktive Änderungen freigeschaltet werden. Git-Historie dabei mitbedenken.
