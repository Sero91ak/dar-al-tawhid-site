# Erwachsenen-Push – neunsprachige OneSignal-Einbindung (22.10.2026)

## Nutzerauftrag und technische Freigabe
Der Nutzer hat die Einbindung der benutzerdefinierten App-Sprache in den OneSignal-Sendeweg ausdrücklich verlangt. Keine Änderung an Gebetszeiten, Uhrzeitberechnung, Vorwarnungswerten, Empfänger-Opt-in, geplanten Sendungen, Push-IDs oder Scheduler-Cron.

## Eingriff in die geschützten Spuren
- `cloudflare/prayer-push-scheduler.js`: ersetzt **nur** die Wörter/Titel/Emojis im vorhandenen OneSignal-Payload durch geprüfte sprachabhängige `headings`/`contents`.
- `cloudflare/daily-push-scheduler.js`: **nur** sprachabhängige `headings`/`contents`; konkrete deutsche Tagestitel und Snippets bleiben unverändert, die anderen Sprachen nutzen geprüfte generische Titel/Texte ohne erfundene Übersetzung konkreter religiöser Quellen.
- `assets/dar-onesignal-language-sync.js` und `cloudflare/site-router.js`: beim bereits erteilten Push-Abo die ausdrücklich gewählte App-Sprache an OneSignal User senden. Nie `requestPermission`, `optIn`, neue Subscription oder Änderung des Gerätestandorts.

## Liefergrenzen / sichere Rollout-Entscheidung
- **Web/PWA**: OneSignal unterstützt die bekannten Provider-Sprachen `de,en,tr,ar,bs,fr,es`, darunter Türkisch. Der SDK-Sprachwert ist *user scoped*, nicht per-Subscription.
- **Kurmancî und Soranî**: OneSignal-Mehrsprachenfelder garantieren die 2 kurdischen Varianten nicht. Der neunsprachige `localizedMessage(...,targetLocale)`-Pfad für einzelne Subscription existiert, aber braucht einen authentifizierten, autorisierten, bereits mit `app_locale` gespeicherten Empfänger. Die private Supabase-Tabelle wurde zuvor mit RLS und nur service_role-Rechten erstellt; ohne sichere Client-/Server-Bindung stehen dort noch keine geprüften Zuordnungen. Deshalb kein automatischer falscher Kurdisch-Versand.
- **Native iOS/Android**: die native OneSignal-SDK-Sprache kann in älteren installierten App-Binaries nicht allein durch ein neues WebView-Skript umgestellt werden. Ein natives SDK-Bridge-Update bzw. serverseitiger verifizierter Sync ist gesondert nötig.
- Der Text ist redaktionell freigegeben; Push-Produktion nur bei bestätigter Repo-Passwortsperre, globaler Push-Freigabe, getrennten Spurfreigaben und CI. Bei fehlenden Guards diesen PR im Entwurf lassen; niemals Buildfehler oder Push-Kennwort ignorieren.

## Regression
`node desktop-preview/i18n-core-v1/test-live-push-i18n-bridge.cjs` und `node desktop-preview/i18n-core-v1/test-onesignal-live-language-bridge.cjs`.

Bei einer Live-Aktivierung erst auf ausdrücklich autorisiertem Testgerät echte Zustellung und Deep-Link verifizieren und **danach** allen Bestandsgeräten aktivieren.
