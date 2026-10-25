# Erwachsenen-Beitrags-Push · sichere Reparaturvorlage
**Stand:** 2026-10-13 · **Status:** technischer Entwurf, **keine Freigabe für Live-Push**.

## Nutzerziel und Spuren
Nur Erwachsenen-Website, Besucher-PWA/Web-App, native iOS-Besucher-App und bestehende Android-Besucher-App. Gemeinsame Website-Beitragsquelle, aber unterschiedlicher Geräte-Push. KIDS, lokale/serverseitige Gebets-Pushs, Tages-Duʿāʾ, Empfehlungen, Jumuʿah, Willkommens-Push und App-Store-Builds anderer Produkte bleiben unverändert. Ein Webseiten-Deploy alleine aktualisiert **keinen** kompilierten nativen Swift-/Android-Code.

Nutzerworkflow: fertigen authentisch belegten Beitrag zur Prüfung → explizit „Push live“ → Beitrag samt /q/-Quellenkarte und Index veröffentlichen → Live-HTTP-Inhalt prüfen → **genau eine** Push-Mitteilung pro berechtigtem, tatsächlich abonniertem Erwachsenen-Gerät. Geräte, die keine Benachrichtigung erlaubt haben oder Beitragsmeldungen abgewählt haben, erhalten keinen Push. Keine Wiederholung älterer Artikel.

## Verifizierte Störung (12.–13.10.2026)
1. Am 09.10.2026 liefen mehrere ältere Beitrags-Pushs über OneSignal-Gruppe `DAR_PUSH` mit je **74 nativen iOS**-Versendungen plus Web. Das Segment hat **keine Filter**, darf darum nicht als Nachweis einer Beitrags-Einwilligung dienen.
2. Am 12.10.2026 wurde der Artikel zu Qurʾān 24:22 manuell über AND-Filter `dar_push=true` und `post_notifications=true` gesendet: OneSignal-Nachricht `e9f0b2c4-7bc1-45ed-a790-0478c175bc91`, **2 Web-Versendungen (1 Chrome, 1 Safari), 0 native iOS, 0 Android**, 0 bestätigte Empfänge. Darum bekam der Eigentümer keinen iOS-Beitragspush; **dieser Artikel darf nicht nochmals global versendet werden**.
3. `cloudflare/post-push-admin.js` und `scripts/send-post-push.js` versuchen weiterhin breite `Subscribed Users` bzw. `DAR_PUSH`-Segmente. Die GitHub-Variante verwendet außerdem `crypto.randomUUID()` pro Sendeversuch; das schützt nicht vor erneuter Auslieferung desselben Artikels.
4. `ios/DarAlTawhid/DarAlTawhid/DarPushNotifications.swift` speichert `prayer_\(key)_enabled` in Supabase, aber die produktive Tabelle `public.prayer_push_registrations` hat **keine fünf entsprechenden Spalten**. Der Client prüft die Upsert-HTTP-Antwort nicht.
5. `cloudflare/ios-native-push-register.js` schreibt `dar_push`, aber nicht standardmäßig `post_notifications`. Das ist ein alternativer Registrierungsweg, nicht der Beweis, dass genau die aktuelle native App ihn benutzt.
6. In der Supabase-Tabelle sind 48 historische Zeilen / 44 unterschiedliche Subscription-IDs und 11 `DAR-iOS-native`-Zeilen dokumentiert (nur 9 unterschiedliche IDs). Aus diesen 11 historischen externen IDs zeigten beim Stichproben-Abruf 7 eine iOS-Subscription, davon 2 enabled, 5 disabled; diese historische Liste ist **keine belastbare Live-Empfängerliste**.
7. Für die Registrierungsdatenbank ist ein gesondertes Rollen-/Datenschutzreview erforderlich. Einzelheiten und Ergebnisse zu Zugriffsrechten gehören nicht in ein öffentliches Repository. Sicherheitsumbau nur getrennt und ohne Störung laufender Benachrichtigungen.
8. Ein WebView-Brückenpfad kann `optedIn/ready` aus dem **bloßen Vorhandensein einer Subscription-ID** ableiten; das beweist keine aktive Berechtigung.
9. iOS/Android SDK `addTags` sendet zahlreiche Tag-Felder; die realen Nutzer-Tags bzw. OneSignal-Planlimits müssen gemessen werden. **Fehlende Tag-Werte nicht durch einen ungefilterten Massenversand kompensieren.**

## Reparaturstufen (je Spur getrennte Commits)
**A. Kontrakt und Testgeräte (ohne Live-Push):** Prüfe bei je EINEM explizit einwilligenden Testgerät: Safari/iOS-PWA, Chrome-Web/Android-PWA, native iOS, native Android. Nutzer-ID und Subscription-ID nur geschützt übertragen, nicht in öffentlichem GitHub oder Logs ablegen. OneSignal-SDK-Registrierung, tatsächlichen `enabled`-/Berechtigungsstatus, Umgebung, Einwilligung und passende Nutzer-Tags prüfen. Kein Test an globalen Segmenten.

**B. Sichere Erwachsenen-Empfängerauswahl:** Eine einzige überprüfbare Quelle für Beitrags-Opt-in. Entweder exakt passende OneSignal-Tags **nach nachgewiesener persistierter Registrierung** und Abonnementstatus, oder mit sicherer Server-Verifikation ausgewählte aktuelle `include_subscription_ids`-Batches. Niemals `Subscribed Users`, `Total Subscriptions` oder ungefiltertes `DAR_PUSH` als Fallback. Test/TestFlight/KIDS und Abmelder immer ausschließen. Über mehrere Plattformen keine Doppelbenachrichtigung an dieselbe Subscription-ID. Bei 0 qualifizierten Empfängern **blockieren und melden**.

**C. Beide Sender in Einklang:** `cloudflare/post-push-admin.js` und `scripts/send-post-push.js` müssen dieselben geprüften Regeln anwenden oder nur EINEN autoritativen Sender behalten; bestehende API-/Cron-Routen erhalten. Gleicher stabiler Idempotenzschlüssel aus Umgebung + Artikel-ID + Empfängerkohorte, ein gesperrter Queue-Eintrag vor dem ersten Send, atomare Erfolgs-/Fehlerprotokollierung und Bestandsprüfung. Der 12.10.-Artikel ist bereits `status:sent` und darf nicht nachgesendet werden.

**D. Apps:** Web/PWA-Registrierungsoberfläche und tatsächlich unterstützte Service-Worker-Pushberechtigungen getrennt prüfen; auf iOS benötigt Web-Push eine entsprechend installierte unterstützte Web-App. Native iOS: bestehende OneSignal-SDK/bridge-Registrierung korrekt synchronisieren, fehlende Supabase-Spalten entfernen bzw. gezielt migrieren, HTTP-Fehler melden, Permission + `optedIn` + gültige aktive Subscription abwarten, nicht bloß ID als aktiv anzeigen. Native Android: Benachrichtigungsberechtigung respektieren und Beitrags-Opt-in nicht mit Gebets-/Duʿāʾ-Erlaubnis gleichsetzen. Swift/Kotlin-Codeänderungen erfordern einen **separaten nativen App-Build / Store-Test**, nicht nur einen Web-Deploy.

**E. Supabase nachfolgend absichern:** Zuerst einen authentifizierten Registrierungsendpunkt mit per-Subscription-Verifikation und Migration bereitstellen; bestehenden Gebets-Scheduler schrittweise auf ihn umstellen, danach die zu breiten `anon`-Rechte einschränken. Keine Blindänderung an der produktiven Tabelle.

**F. Release-Gates:** Guard-Tests `push-system-guard`, `push-lanes-guard`, `change-scope-lock-guard`, `repo-integrity-guard`, App-Lane-Guard; Test-App separat, mindestens vier Einzelgeräte-Tests, Negativtests für Opt-out/Test/KIDS, Cloudflare Live-Parität und OneSignal-Plattformstatistik. Keine globale Freigabe bis auch native iOS-Sends positiv und ohne Doppelungen belegt sind. Frühere erfolgreiche Provider-Werte beweisen keine Sichtbarkeit auf dem Endgerät.

## Noch bestehende Schutzsperre
`content/admin/push-lanes-lock.json` ist `locked:true`, `passwordRequired:true`. Der Nutzer hat die Reparatur der Beitrags-/iOS-Spuren jetzt ausdrücklich beauftragt, aber das zweite **Kennwort-Gate** ist nicht erfüllt. **Weder Kennwort erraten noch in öffentliche Commits schreiben, Lock deaktivieren oder die sperrpflichtigen Dateien indirekt umgehen.** Ein sicherer administrativer Entsperr-/Secret-Workflow muss vor produktiven Änderungen autorisiert werden. Danach Änderungen zuerst im isolierten Staging, nicht in Kids oder gebetsbezogenen Spuren.

## Read-only Codeprüfung
`node docs/adult-post-push-cross-platform-audit.cjs`

Die Prüfung verändert und sendet nichts. Sie kann nur strukturelle Blocker zeigen, **keinen** Live-Geräteempfang bestätigen.

**Diese Datei ist nur Vorbereitung. Sie behebt noch keinen Produktions-Push-Defekt.**
