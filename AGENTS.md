# DAR AL TAWHID Projektregeln

Du darfst nur den ausdrücklich genannten Bereich ändern.

Bestehende Funktionen, Buttons, Layouts, Push-Benachrichtigungen, Gebetszeiten, Qibla-Kompass, Beiträge, Suchfunktion, Filter, Service Worker, Manifest und App-Struktur dürfen nicht entfernt, vereinfacht oder umgebaut werden.

Bei jeder Aufgabe:
1. Zuerst die passende Stelle in index.html suchen.
2. Nur den betroffenen Abschnitt ändern.
3. Keine unnötigen Formatierungen im restlichen Code.
4. Keine bestehenden IDs, Klassen oder Funktionen löschen.
5. Keine alten Beiträge löschen.
6. Keine Push-Funktion, Service Worker oder Manifest-Dateien verändern, außer ich verlange es ausdrücklich.
7. Nach der Änderung kurz sagen, welche Datei und welcher Bereich geändert wurde.
8. Wenn Unsicherheit besteht, erst fragen und nicht eigenständig umbauen.
9. Neue Änderungen, Beiträge, Funktionen, Layouts und Reparaturen immer zuerst direkt in Dar Test / Staging bereitstellen, damit der Nutzer sie prüfen kann. Nicht direkt live für Besucher veröffentlichen.
10. Live-Veröffentlichung auf `main` oder in die Besucher-App nur nach ausdrücklicher Freigabe des Nutzers, z. B. „push live“, „live veröffentlichen“ oder „freigeben“.
11. Push-Benachrichtigungen aus Test/Staging dürfen niemals an alle Besucher gehen; dort nur Admin-/Test-Pushs nutzen.

## Admin-App (Sonderregel – immer aktuell halten)

15. **Änderungen an der privaten Admin-App** (`admin/**`, inkl. KI-Video-Studio) werden **direkt gepusht und live für die Admin-App ausgerollt**, sobald sie fertig sind: Commit → Push auf `main` (bzw. Deploy-Workflow `deploy-live-admin-app`) → Admin-UI ist aktuell. Kein separates „push live“ abwarten.
16. Das betrifft **nicht** die Besucher-App und **nicht** automatische Besucher-Pushs. Feed-/Push-Aktionen aus dem Video-Studio bleiben manuell.

## App-Spuren (Sprache verstehen – Kids eigenständig)

17. **Kids ist eine eigenständige App.** „Global“, „alle Apps“, „überall“, „iOS“, „Web-App“, „Website“, „Apple TV“ meinen **nicht** die Kids-App. Kids nur ändern, wenn der Nutzer ausdrücklich **Kids** / **Kinder-App** sagt.
18. **„Global“ bei Ḥadīṯ, Āṯār, Qurʾān, Tadabbur** = derselbe geprüfte Stand in die **Erwachsenen-Oberflächen**, so wie bisher: Website, Besucher-Web-App, iOS-WebApp, native iOS-App, Android-WebApp, Apple TV. Getrennte Commits/Deploys je Spur, nicht ein Misch-Commit.
19. **„Global“ / „iOS WebApp“ / „iOS App“** = die genannten Erwachsenen-Apps. Apple TV **mit**, wenn der Nutzer Apple TV sagt oder der Inhalt Ḥadīṯ/Āṯār/Qurʾān/Tadabbur ist (wie der bestehende Canonical-Live-Weg). Apple TV **nicht** mit, wenn der Nutzer klar nur Web oder nur iOS meint.
20. **Nur eine App genannt** = nur diese Spur. **Mehrere Erwachsenen-Apps in einem Satz** = nacheinander eigene Commits: Test → Besucher-Web/Desktop → iOS → Apple TV. Nie `kids/` mit `index.html` / `apple-tv/` / `test/` mischen. CI (`scripts/app-lane-guard.js`) blockiert Misch-Commits.
21. Kids (`kids/**`) nur über **Deploy Kids App Live**. Besucher über **Deploy Besucher-App**. Dar Test über Test-Deploy. Apple TV über den Apple-TV-Weg. Ein hängender Job einer Spur darf andere schon gepushte Commits nicht verwerfen.

## Quiz-Fragen (Sonderregel – immer live)

12. **Neue geprüfte Quiz-Fragen** werden **ohne Rückfrage direkt live** in die Besucher-App übernommen: Batch erzeugen, in `data/quiz-questions.json` und `data/quiz-questions-test.json` einpflegen, auf `main` mergen und deployen. Keine Freigabe mit „push live“ abwarten.
13. Besucher-App lädt `data/quiz-questions.json`; Test lädt `data/quiz-questions-test.json`. Beide Dateien bei jedem neuen Quiz-Block aktualisieren.
14. Diese Sonderregel gilt nur für Quiz-Inhalte (Fragen/JSON), nicht für Push-Kampagnen, Fokus-Banner oder App-Shell-Änderungen.

## Push-System-Schutz (streng – nicht verletzen)

Das Push-System ist geschützt durch `scripts/push-system-guard.js` und CI (Canonical State Guard, App Health Check, Worker-Deploy).

**Verboten ohne ausdrückliche Freigabe des Nutzers:**
- Entfernen oder Ausdünnen von `cloudflare/worker.js` (Scheduler, `/api/prayer/*`, `/api/daily/*`, `/api/push/welcome`)
- Entfernen des Cron `[triggers] crons = ["*/5 * * * *"]` aus `cloudflare/wrangler.toml`
- Löschen/Deaktivieren von `prayer-push-*.js`, `daily-push-*.js`
- Entfernen von `syncPrayerPushTags`, `syncDailyPushTags`, `savePushRegistration`, Tages-Push-Panel in `index.html`/`test/index.html`
- Admin-Rollbacks die den Worker auf reine Publish-Logik reduzieren

**Vor jedem Merge auf `main`:** `node scripts/push-system-guard.js`, `node scripts/push-lanes-guard.js` und `node scripts/repo-integrity-guard.js` müssen grün sein. Bei Worker-Änderungen deployt die GitHub Action nur, wenn der Guard besteht.

## Push-Spuren (hart – getrennt, nie ohne Befehl)

Geschützt durch `content/admin/push-lanes-lock.json` und `scripts/push-lanes-guard.js` (CI: Canonical State Guard, App Health Check, Worker-Deploy).

Die Systeme sind **einzelne Spuren** und dürfen einander nicht überschreiben:
- **Gebets-Push (Server):** OneSignal/Cron, `cloudflare/prayer-push-*.js`
- **Gebets-Erinnerungen (App-Uhr):** lokale Timer nach den Zeiten auf dem Bildschirm
- **Tages-Push:** Duʿāʾ 09:00 / Empfehlung 12:00
- **Jumuʿah-Push**
- **Willkommens-Push**
- **Beitrags-Push**
- **News-Push**
- **Bibliotheks-/PDF-Push**
- **Fokus-Push:** Quiz, Propheten und Zakāt
- **OneSignal-Kern:** App-ID, API-Key, SDK-Worker und Öffnungsziele
- **Native iOS-Push-Registrierung und Weiterleitung**
- **Worker-Cron** `*/5 * * * *`

**Verboten ohne ausdrücklichen Nutzer-Befehl, Kennwort und Doppel-Freigabe:** Jeder Push-Eingriff braucht zuerst eine klare Anfrage des Nutzers. Zusätzlich muss der Commit `push-password:<Kennwort>`, `push-global-freigabe` und den Marker der konkreten Spur enthalten (z. B. `prayer-push-scheduler-freigabe`, `daily-push-freigabe`, `post-push-freigabe`). Ohne Anfrage, ohne Kennwort oder ohne Spur-Freigabe bleibt OneSignal/Gebet/Duʿāʾ des Tages/Empfehlung/Beiträge/News/Bibliothek/Fokus unverändert.
- Diese Dateien oder Funktionen in `index.html` / `worker.js` mitändern, auch nicht „nebenbei“ bei Layout/Feed/Quiz.
- Mehrere Spuren in einem Commit (außer `push-lanes-multi-freigabe`).
- Eine allgemeine App-, Layout-, Build-, PDF- oder Content-Freigabe gilt niemals als Push-Freigabe.
- Bei jeder unklaren Push-Auswirkung zuerst den Nutzer fragen; ohne Antwort bleibt der Push-Code unverändert.

**Wenn der Nutzer Push bewusst ändert:** nur diese Spur korrigieren, **sofort live** auf `main` (Worker + App), Sperre bleibt aktiv. Ohne solchen Befehl gilt: nicht anfassen.

## Beitrags-Push (Hang-Sperre – autonom reparieren)

Geschützt durch `content/admin/post-push-hang-lock.json` und `scripts/post-push-hang-guard.js`. Menschliche Zeiten: **Europe/Berlin**.

Der Besucher-Beitrags-Push darf **nicht hängen**. Der Workflow **Post Push Hang Watchdog** läuft **nicht** im Minuten-Takt und stößt **keine** extra Cloudflare-Deploys an. Status-Commits (`pending-pushes` usw.) tragen `[skip ci]`, damit Cloudflare Pages/Workers Builds nicht bei jedem Queue-Tick bauen. Nachsenden nur nach erfolgreichem Besucher-Deploy oder manuell. Gebets-/Tages-/Jumuʿah-Push und der bestehende Worker-**Runtime**-Cron (`*/5`, kein Deploy) bleiben getrennte Spuren.

## Repo-Integritäts-Schutz (streng – nicht verletzen)

Geschützt durch `scripts/repo-integrity-guard.js` und CI (Canonical State Guard, App Health Check, Deploy).

**Verboten ohne ausdrückliche Freigabe des Nutzers:**
- Löschen oder Ausdünnen von Kern-Ordnern: `assets/`, `content/`, `admin/`, `cloudflare/`, `scripts/`
- Massen-Löschung (>80 Dateien in einem Commit)
- Entfernen von `assets/live-boot.js`, `manifest.json`, `wrangler.toml`, `content/posts/`, `admin/index.html`

**CI blockiert** Push/Merge/Deploy wenn zu wenige Dateien im Repo sind oder geschützte Pfade gelöscht würden.

## Header-Gebetszeit-Darstellung (streng – nicht verletzen)

Geschützt durch `content/admin/header-prayer-display-lock.json` und `scripts/header-prayer-display-guard.js` (CI: Canonical State Guard, App Health Check).

**Verboten ohne ausdrückliche Freigabe des Nutzers:**
- Zurück zum Einzeilen-Format `Gebet · Uhrzeit` mit Ellipsis (`Maghrib · 21…`) im Header
- `updatePrayerCountdowns()` darf den Header nicht jede Sekunde per `innerHTML` neu rendern
- Entfernen von `HEADER_PRAYER_DISPLAY_GUARD`, `header-prayer-line`, `headerPrayerLineHtml`

**Freigabe:** nur nach ausdrücklichem Nutzer-Auftrag, z. B. „Header-Gebetszeit freigeben“.

## Globale Änderungssperre (streng – nicht verletzen)

Geschützt durch `content/admin/change-scope-lock.json` und `scripts/change-scope-lock-guard.js` (CI: Canonical State Guard, App Health Check, Worker-Deploy).

**Solange `globalLock: true`:**
- Keine Änderung an App, Layout, Push, Admin, Content, Assets oder Workflows – **außer** der Nutzer hat den Bereich ausdrücklich freigegeben.
- Freigabe nur durch Eintrag in `unlockedScopes` in `change-scope-lock.json` (mit `paths`, `reason`, optional `expiresAt`).
- Ausnahmen ohne Freigabe: `alwaysAllowed` (z. B. Quiz-JSON laut Sonderregel, Lock-Datei selbst).
- **Kein Agent darf** bei gesperrtem Zustand andere Dateien „nebenbei“ mitändern – nur der explizit beauftragte Bereich.

**Vor jedem Merge:** `node scripts/change-scope-lock-guard.js` muss grün sein.

## Dauerfreigabe täglicher Erwachsenen-Beiträge (Nutzerauftrag 09.10.2026, ab 10.10.2026)

- **Eng begrenzte Ausnahme zur Einzel-Freigabe oben:** Der Nutzer hat ausdrücklich die tägliche **vollautomatische** Erstellung, Veröffentlichung **und OneSignal-Gerätebenachrichtigung** für exakt einen neuen authentischen Erwachsenen-Beitrag pro Kalendertag um **18:00 Uhr Europe/Berlin** dauerhaft freigegeben. Nur der speziell dafür angelegte DAR-AL-TAWḤĪD-Tagesauftrag ist durch diese Dauerfreigabe abgedeckt. Spontane Aufforderungen wie „Gib mir einen Beitrag“ bleiben **reine Entwurfsanfragen**, ohne jegliche Veröffentlichung. Der tägliche Auftrag darf die übrigen Freigaberegeln nicht auf andere Inhalte übertragen.
- Redaktionelle Vorbereitung nur im privaten/unveröffentlichten GitHub-Branch `automation/dar-daily-editorial`. Auf `main` erst am planmäßigen Veröffentlichungstermin und erst nach eindeutiger Quellen- und Dublettenprüfung. Neue Manuskripte dürfen nicht unbemerkt durch automatisches Committen auf main vorab live gehen.
- Themenrotation inkl. Adab, Aḫlāq, Ikhlāṣ, ʿAqīdah, Tawḥīd, Qurʾān, Īmān, Sunnah, Ṣaḥābah, Tābiʿīn, Āṯār, Fiqh, Manhaj, Tazkiyah und Zuhd. **Nur belegbar authentische** Qurʾān-Zitate, ṣaḥīḥ/ḥasan Ḥadīṯe bzw. nachvollziehbar authentisch überlieferte frühe Āṯār; keine schwachen, unterbrochenen, strittigen oder als gesichert nur behaupteten Āṯār. Präzise arabische Ursprungsstellen, Sprecher, Isnād/Grad, Buch, Nummer/Band/Seite und funktionierende Originalnachweise prüfen. Keine mehrfach verwendeten Aussagen, keine erfundenen Quellen oder Zitate.
- Je Beitrag genau eine neue eigene `/q/N/`-Quellenkarte mit markiertem arabischen Primärwortlaut und allen Einzel-Direktnachweisen, PDF/Scan sobald erhältlich. Fortlaufende Nummern aktuell **immer aus dem neuesten main ermitteln**, niemals vorab fest voraussetzen. Vor Versand Originalnachweise und finale eigene Quellen-URL öffentlich auf Erreichbarkeit prüfen.
- **Release-Gate:** erst vollständigen Beitrags-/Quellenstand, Kataloge, automatisierte Tests und nachweislich erfolgreichen Cloudflare-Live-Deploy prüfen; dann pro Tag höchstens **eine** OneSignal-Benachrichtigung ausschließlich an die abonnierte Erwachsenen-Gruppe `DAR_PUSH` (keine Kids-/Gebets-/Tages-/Jumuʿah-Spur). Idempotenz durch Datum+Beitrags-ID, OneSignal-ID und `content/admin/pending-pushes.json`; alte ungesendete Beiträge nie pauschal mitsenden. Zustell-/Fehlerzahlen dokumentieren und melden. **Wenn Quellen, Dublettenprüfung, Funktionstests, Deployment, OneSignal-Zugang oder tatsächliche Uhrzeit scheitern, NICHT ungeprüft versenden**: sauber blockieren und den Fehler melden. Keine schwachen Inhalte bloß zur Erfüllung täglicher Quote veröffentlichen.
- Die Dauerfreigabe genehmigt **nur Inhalts-Veröffentlichung und Nutzung der bestehenden Beitrags-Push-Schnittstelle**, nicht die Änderung geschützter Push-Implementierung, Push-Workflows, Secrets, Kennwörter, Sperren oder anderer Push-Spuren. Dafür bleiben alle bestehenden Kennwort-/Spur-Freigaben erforderlich.
- **Uhrzeit:** 18:00 lokaler deutscher Zeit einschließlich Sommer-/Winterzeitumstellung, nicht fest 16:00 oder 17:00 UTC. Da Build, Prüfung und Netz-Versand Zeit beanspruchen, niemals minutengenaue echte Gerätezustellung ohne Nachweis behaupten.
- Relevanter Ablauf ist auf einen **16:00-Uhr-Entwurfsauftrag** und einen **18:00-Uhr-Freigabe-/Versandauftrag** verteilt. Beim zweiten Auftrag nicht erneut recherchieren, sondern den geprüften Tagesentwurf sicher vervollständigen und anhand des tatsächlichen Live-Status veröffentlichen.

## Bestehende Beitragsprüfung und Freigabesicherungen (gelten ergänzend zum aktuellen Zentrum-Workflow)

- **Verbindliche VORAB-Dublettenprüfung für JEDE spontane Chat-Beitragsanfrage (ausdrückliche Nutzerkorrektur 17.10.2026):** Schon **bevor** auf „Gib mir einen Beitrag“, „neuer Beitrag“, „Āṯar/Ḥadīṯ zu Thema X“ o. Ä. ein Entwurf im Chat ausgegeben wird, **zuerst** den vorhandenen DĀR-AL-TAWḤĪD-Bestand durchsuchen: mindestens `content/posts/` einschließlich `posts-index.json`, veröffentlichte und vorbereitete Erwachsenen-Beiträge, einschlägige Test-/Staging- und Ramaḍān-Inhalte, Quellenregister `/q/`, Apple-TV-Überlieferungen und passende Kids-/Qurʾān-/Āṯār-Sammlungen. **Inhaltlich** vergleichen – nicht nur Titel oder Dateinamen: identischer Sprecher, arabischer/deutscher Wortlaut, Werk, Nummer, sinngleiche Formulierung und ggf. derselbe Ḥadīṯ/Aṯar sind zu prüfen. **Bereits verwendete Aussage nicht noch einmal als neu anbieten**, auch wenn nur in Test-/Ramaḍān-/Apple-TV-Inhalten vorhanden; bei Fund konkrete Bestandsstelle nennen und eine tatsächlich andere Quelle/Aussage wählen. Keine alleinige Behauptung „neu“, wenn die Überprüfung nicht ausreichend möglich war: Umfang und Unsicherheit transparent nennen. Die Suche muss **vor** dem Antworten stattfinden (ein Publish-Dubletten-Guard erst beim späteren Live-Push reicht nicht). Danach authentischen arabischen Originalwortlaut intern prüfen, Zuschreibung und Fundstelle exakt dokumentieren und einen **deutschen Prüfentwurf mit Direktlinks unmittelbar nach jeder Quelle** gemäß dem aktuellen Phasenmodell ausgeben. **Keine GitHub-Veröffentlichung und kein Geräte-Push bei bloßem „Gib mir einen Beitrag“**; dafür ist die separate ausdrückliche Freigabe erforderlich.


- **Verbindlicher Beitrags-Freigabeablauf (Nutzerkorrektur 09.10.2026):** Bei „Gib mir einen Beitrag“, „neuer Āṯar/Ḥadīṯ“ oder vergleichbaren Anfragen **zuerst nur den **Prüfentwurf mit externen Einzel-Direktlinks nach Phase A** im Chat zum Lesen vorlegen**. **Vor der ausdrücklichen Zustimmung des Nutzers keine neue Beitragsdatei in GitHub, keinen Indexeintrag, keinen Apple-TV-Datensatz und keinen automatischen Live-Deploy erzeugen.** Eine bloße Bitte um einen Beitrag ist **keine** Freigabe. Nach Änderungswünschen zuerst neu zur Prüfung vorlegen. Erst der ausdrückliche Befehl **„Erzeuge Quellenlink“** autorisiert Phase B (eine ausführliche eigene Q-Seite für alle Belege dieses Beitrags), **ohne** damit die gesonderte Beitragsfreigabe oder einen Geräte-Push auszulösen. Erst nach „freigegeben“, „jetzt veröffentlichen“ oder vergleichbarer ausdrücklicher Genehmigung den geprüften Beitrag global ausliefern. **„Push live“ bei Beiträgen umfasst zusätzlich sofort die OneSignal-Gerätebenachrichtigung** und ist zugleich die Freigabe für genau diesen bereits vorgelegten Beitrag; OneSignal-Idempotenz und Live-Prüfung beachten. Niemals ohne solche Freigabe voreilig veröffentlichen.

- **Verbindliche Bedeutung „Push live“ bei Beiträgen:** Das ist eine ausdrückliche Freigabe zum **Versand einer OneSignal-Gerätebenachrichtigung** an die abonnierte Erwachsenen-Empfängergruppe (derzeit `DAR_PUSH`) **zusätzlich** zur App-/Website-Veröffentlichung. Ein bloßer GitHub-Commit, Cloudflare-Deploy oder Apple-TV-Katalogeintrag erfüllt den Auftrag nicht. Vor dem Versand Beitrag und Ziel-URL live prüfen, bereits gesendete Benachrichtigungen anhand Post-ID/OneSignal-ID auf Dubletten prüfen; idempotent senden, Versand-ID sowie Empfänger-/Fehlerzahlen protokollieren und den realen Versandstatus mitteilen. **Nicht** als automatische Gerätebenachrichtigung interpretieren, wenn nur eine Code-/Layout-Auslieferung verlangt wird. Keine Kinder-App- oder Gebets-Pushs anstoßen; Push-Code-Schutz und Kennwortsperren für Codeänderungen bleiben unangetastet.

- **Priorität: Der App-Aussagebereich enthält nur Sprecher/Zuschreibung, die zitierte Aussage und optional ein kurzes Fazit.** Doppelte Quelle, Kurzlink, Isnād, lange Erläuterungen oder schwarze Quellen-Kästen im Text dürfen nicht mitveröffentlicht werden. Die App zeigt darunter ihre eigenständige Quellenkarte; von dort führt der `/q/`-Link zu Originaltext, Quellenprüfung und ausführlichen Erklärungen. Keine Originalnachweise aus der Quellenkarte entfernen, nur die doppelte Darstellung aus dem Aussage-Body.
## DĀR AL TAWḤĪD Zentrum – verbindlicher Beitrags- und Quellenlink-Ablauf (Stand 19.10.2026)

**Oberste Priorität und Ablösung:** Dieser zweistufige redaktionelle Ablauf ersetzt **alle älteren und widersprechenden Chat-, Text-, Kurz-/Langbeitrags- und sichtbaren Quellenlink-Vorgaben** im Zentrum. Insbesondere sind die alte Regel „keine externen Links im Prüfentwurf“, die automatische Ausgabe eines /q/-Links bei „Gib mir“, die alte 5-Hashtag-Option, arabische Schrift im Lesertext, Quellenwerbung am Schluss und das Verwechseln von Quellenlink-Erstellung mit Besucher-Veröffentlichung ungültig. Die getrennten technischen App-, Prüf-, Registrierungs-, Lern- und Sicherheitsregeln bleiben bestehen.

**PHASE A – „Gib mir einen Beitrag“, „Beitrag über XY“, Einzelzitat oder langer Text = NUR KONTROLLENTWURF**
- Vorher: strenge semantische Dublettenprüfung über alle relevanten vorhandenen Erwachsenen-/Test-/Apple-TV-/Q-/ggf. Kids-Quellen, dann Originalwortlaut, Zuschreibung, Einzel-Isnād, Grading und Buch/Kapitel/Band/Seite/Nummer prüfen; Unsicherheiten sichtbar kennzeichnen. Ausschließlich fachlich belastbare Quellen-URLs aufführen, keine erfundenen Fundstellen oder #page-Werte.
- **Sichtbarer deutscher Text ohne arabische Schriftzeichen** (nur Fachumschrift mit korrekten Diakritika); die Prüfung von Originalmatn und Isnād erfolgt dennoch anhand der arabischen Primärquelle.
- **Bei jeder einzelnen Aussage unmittelbar nach der zugehörigen `📝 Quelle` die zugehörigen externen, überprüfbaren Direktlinks** (z. B. Islamweb, Shamela, Dorar, Scan) zur persönlichen Kontrolle sichtbar und anklickbar aufführen. Auch wenn es nur *eine* Aussage ist. Bei langen Beiträgen **unter jedem Beleg separat**, nicht bloß am Ende. Nach Möglichkeit Textmarkierung `#:~:text=…`, PDF `#page=N` nur nach nachweislicher Seitenprüfung; ungesicherte Direktmarkierung als solche kennzeichnen. Keine allgemeine Startseite als angeblicher Primärbeleg.
- Dies ist **kein fertiger/öffentlicher Beitrag**. Noch keinen eigenen neuen `dar-al-tawhid.de/q/N`-Link vergeben, keine Q-Seite, keinen Index-Eintrag, keine GitHub-Veröffentlichung und keinen Push erzeugen. Die externen Kontrolllinks sind ausdrücklich eine temporäre **Entwurfsansicht**.

**PHASE B – Nutzer sagt ausdrücklich „Erzeuge Quellenlink“ = Q-QUELLENSEITE ERSTELLEN UND TEXT FÜR DIE ENDFASSUNG AUFBEREITEN**
- Nach abschließender Quellenprüfung **die nächste wirklich freie Nummer** vergeben, eine **einzige eigene gebündelte** `/q/N/`-Quellenseite **für den ganzen konkreten Beitrag** anlegen – sowohl beim Einzelbeitrag als auch bei langen Beiträgen mit mehreren Aussagen. Die Karte enthält **alle** dort verwendeten Aussagen, Belege und Direktnachweise, nicht nur einen exemplarischen Ausschnitt.
- Die Q-Seite ist **inhaltlich ausführlicher als der Leserbeitrag**: deutsche Gesamtbedeutung, gesicherter arabischer Originalmatn (nur auf der Quellenseite), vollständige verfügbare Überlieferungswege samt Trennung von Matn/Isnād/Einstufung, genauer Werk-/Edition-/Kapitel-/Band-/Seite-/Nummer-Nachweis, fachliche Erläuterung/Šarḥ/Tafsīr und nachvollziehbare Deutung, Kontext, begrenzte und abweichende Auslegungen, sofern relevant; keine unbelegten Erklärungen. Primäre markierte Weblinks und vorhandene PDF-/Scan-Nachweise als getrennte geprüfte Buttons. Ruhiges abgestimmtes Q-Design, hell/dunkel und responsiv.
- **Bestehenden Lernbereich einbinden**: eine inhaltlich passende Verknüpfung von der Q-Seite zu einer vorhandenen thematisch richtigen Lernseite; bei notwendigem neuen Modul die vorhandene wiederverwendbare Lernarchitektur verwenden, nur geprüftes Lehrmaterial, klare Schritte (Einstieg → Lernen/Verstehen → Fragen/Quiz → Praxis/Abschluss), kurze mobile Ansichten, Fortschrittsanzeige und korrekte Rücknavigation. Kein beliebiger, sachfremder Link und kein unechter Lerninhalt als Lückenfüller. Zusätzliche Lernbereich-Erstellung nur im ausdrücklich beauftragten Umfang; keine automatische App-/Push-Freigabe dadurch.
- **Alle bisher im Prüfentwurf sichtbaren externen Links verschwinden aus dem Leserbeitrag** und liegen ausschließlich auf der eigenen Q-Quellenseite. Beim kurzen Chat-Endtext kommt unmittelbar unter der bibliografischen Quellenzeile nur der **eine echte** `🔗 dar-al-tawhid.de/q/N`-Nachweis, sobald erstellt und öffentlich erreichbar. Beim langen kopierbaren Chat-Endtext stehen die bibliografischen Quellen weiterhin bei jedem Beleg, der **eine gebündelte eigene** `🔗 Alle Quellen: dar-al-tawhid.de/q/N`-Nachweis nur einmal am Schluss vor dem kurzen Fazit. Keine Fremdlinks mehr im Endtext.
- **In tatsächlichen Erwachsenen-App-Layouts** bleiben Quellen, interner Q-Kurzlink und Nachweis ausschließlich im **eigenständigen Quellenbereich/Quellenkarte** (aus `source`/`links`); **nicht** unter der Aussage und **nicht** im App-Fließtext. Die Q-Seite ist **kein Ersatz** für die separate Quellenkomponente, sondern deren ausführliches Nachweisziel.
- „Erzeuge Quellenlink“ autorisiert **nur** Erstellung/Prüfung der eigenen Q-Seite und Aufbereitung des finalen Textes, **nicht** eigenständig das Veröffentlichen des Erwachsenen-Beitrags auf Besucher-Apps, das Auslösen von OneSignal-Push oder das Verändern der Kids-App. Eine neue Q-Seite ist nur als öffentlich verifizierter Link zu bezeichnen, wenn tatsächlich ausgeliefert und geprüft; Entwurf/PR ist noch kein öffentlicher Kurzlink. Besucher-Publikation nur nach gesonderter expliziter Freigabe gemäß Beitragsfreigaberegel.

**GEMEINSAME LAYOUT-REGEL für kurze und lange deutsche Chat-Beiträge**
- `📖` Titel in edler kräftiger Unicode-Variante 3, **genau 4 passende Hashtags direkt darunter**, niemals am Schluss. Bei echten App-Posts weiterhin `tags: []` und keine sichtbaren Hashtags.
- **Einzelbeitrag:** Titel → vier Hashtags → `🖋️` Sprecher + Aussage → `📝` genaue Quelle → in PHASE A externe Kontrolllinks / in PHASE B eigener Q-Link → kurzes `🌙 Fazit`.
- **Langer Beitrag:** Titel → vier Hashtags → Hauptgruppen mit `━━ THEMENGRUPPE ━━` (Qurʾān → authentische Sunnah → überprüfte frühe Āṯār/Imāme → Einordnung). Je Aussage klare Zuschreibung + präzise Quelle; in PHASE A kontrollierbare externe Direktlinks unter **jeder** Aussage, in PHASE B nur ein gebündelter Q-Link am Schluss. Abschließend kurzes `🌙 Fazit`.
- **Kopierfreundlichkeit:** Kein arabischer Fließtext oder Originalzitat im Chat-Beitrag; 1–2 hervorgehobene Schlüsselwörter pro Absatz, klare Sprecher, richtige Umschrift, kein ornamental überladener Block. Keine Telegram-/Instagram-/Website-Fußzeilen, Handles, Social-Werbung oder Hashtags am Schluss; Q-Belege sind reine Quellenverweise.
- **Qualität:** Für Ḥadīṯ/Āṯār gradgenau unterscheiden: marfūʿ/mawqūf/maqtūʿ, ṣaḥīḥ/ḥasan/ḍaʿīf und Gelehrtenauslegung. Gute Kette nicht als Beweis für jede weitergehende theologische Deutung ausgeben. Keine pauschalen „unwiderlegbaren“ Bewertungen ohne Beleg.

## Quellenprüfung & DAR-AL-TAWḤĪD-Kurzlinks (streng – global und ohne Ausnahmen)

**Phasenlogik hat Vorrang:** Die oben stehenden Phasen A und B sind verbindlich. Externe kontrollierbare Links im Chat-Prüfentwurf sind ausdrücklich **erlaubt und erforderlich**; das Verbot externer Links gilt ausschließlich für fertig aufbereitete Leserbeiträge und veröffentlichte App-Aussagen. Diese Regel ersetzt ältere widersprechende Linkdarstellungen.

- Die strenge **Quellenprüfung** gilt unverändert überall: arabischer Originalwortlaut in der internen Recherche und auf der Quellenseite, korrekte Zuschreibung, Werk/Edition/Fundstelle, isnādbezogener Status und markierte Nachweise; keine erfundenen Seiten oder Grading-Behauptungen.
- **PHASE A:** Unmittelbar nach **jeder** `📝 Quelle` dürfen und sollen **nur im Kontrollentwurf** geprüfte **externe** Direktlinks zur gleichen Aussage erscheinen; sichtbar und anklickbar. Mehrere Links für einen Beleg sind möglich. Noch kein eigener `/q/N`-Link.
- **PHASE B:** Ein einziger **thematisch gebündelter** eigener `dar-al-tawhid.de/q/<nummer>`-Link pro konkretem Einzel-/Langbeitrag. Bei mehreren Aussagen werden alle unter **einer** Q-Seite dokumentiert, nicht für jede Aussage automatisch eine neue Q-Nummer ausgegeben. Erst erzeugen, registrieren, deployen und Erreichbarkeit prüfen; dann im endgültigen Chat-Beitrag referenzieren.
- Im **kurzen finalen Chat-Text** steht `🔗 dar-al-tawhid.de/q/<nummer>` unmittelbar unter der zugehörigen `📝`-Quellenzeile. Im **langen finalen Chat-Text** steht der eigene Nachweis nur **einmal** als `🔗 Alle Quellen: dar-al-tawhid.de/q/<nummer>` bei Ende des Quellen-/Belegteils vor dem Fazit. Keine einzelnen externen URLs im endgültigen Text.
- In **veröffentlichten Erwachsenen-App-Beiträgen** stehen bibliografische Quelle und **eigener Q-Link nur im separaten Quellenbereich**; im Aussage-Body weder `📝` noch `🔗`, kein Isnād-Kasten. App `tags: []`. Kids-App unverändert.
- `https://` **nicht sichtbar** in fertigen Beiträgen; nur im vorläufigen Prüfentwurf dürfen die externen Prüflinks vollständig anklickbar erscheinen. Keine Social-Media-Werbung.
- Neue Q-Nummern streng fortlaufend, keine Wiederverwendung oder Überschreibung; **direkte Quellen-Buttons** ausschließlich auf der ausführlichen Q-Seite, darunter geprüfte markierte Webfundstellen und vorhandene PDF-/Scan-Nachweise.
- Die Q-Seite enthält alle Matn-/Isnād-/Fundstellen-Nachweise, ausführliche überprüfte Erläuterungen, Abgrenzungen und passende Lernvertiefung. Der Hauptbeitrag bleibt knapp und lesbar. Eigene Quellenlinks dürfen nur auf die eigene Q-Seite verweisen, nicht direkt auf einen fremden Server.
- Bereits bestehende historische Q-Karten oder Altbeiträge werden durch diesen Dokumentationswechsel **nicht** automatisch gelöscht oder inhaltlich umgeschrieben.

- **Dauerregel Quellenkarte + zugehöriger Lernbereich (Nutzerkorrektur mit vier iPhone-Screenshots vom 18.10.2026):** Sämtliche `/q/N/`-Quellenkarten müssen in **hell und dunkel** durchgängig kontrastreich lesbar sein (einschließlich hervorgehobener Wörter, Infokästen, CTA-Lernverknüpfung, deutscher und arabischer Texte). Gemeinsame Token/Barrierefreiheitskorrekturen in `assets/q-source-dar-al-layl.css` verwenden; bei gesonderten Kartenfarbflächen eine ausdrücklich passende Light-/Dark-Variante. Arabische Schrift in eigenen `dir="rtl"`-Blöcken; keine überlaufenden Arabisch-Inlinekästen innerhalb des deutschen Absatzes.
- **Quellenkarte → Lernbereich – inhaltlicher Vertrag:** Auf der ausführlichen Q-Seite eine klar erkennbare, thematisch passende Lernverknüpfung im bereits vorhandenen Design integrieren (sofern eine passende geprüfte Lernseite vorhanden oder deren Neuerstellung beauftragt ist). Die Q-Seite bietet mehr Kontext und präzisen Šarḥ/Tafsīr; die Lernseite vertieft didaktisch durch verständliche Einführung, einzelne Erklärungsschritte, optionales Wissensquiz, Praxisanwendung und Abschluss. Aussagen im Lernbereich brauchen eigene präzise Nachweise; weder ein beliebiger Link noch rein dekorative Aufgaben genügen. Q-Seite und Lernbereich gegenseitig navigierbar machen, bestehende Theme-, Offline-, Responsivitäts- und Datenschutzanforderungen wahren.
- **Wiederverwendbare Lernseiten-Vorlage für alle gegenwärtigen und zukünftigen Quellen-Lernbereiche:** `assets/learning-heritage.css` + `assets/learning-heritage-architecture.svg` als lokale/offline-taugliche historische, islamisch inspirierte Bibliotheks-/Madrasa-Gestaltung; Lernseiten setzen `body.heritage-learning` und `data-learning-stage` (Einführung/Quiz/Praxis/Abschluss). **Kurze Einstiegsseite, Fortschrittsanzeige, kompakte Antwortkarten, möglichst wenig Scrollen**: im Quiz die lange Einführung ausblenden. Hintergrund nur atmosphärisch, **Text/Antworten stets auf deckenden kontrastreichen Flächen**; Smartphone, Tablet, Desktop sowie System-Hell/Dunkel testen. Kein historischer Authentizitätsanspruch an ein KI-generiertes Motiv; keine Personen, keinen fiktiven arabischen Quellentext einblenden. Jede Lernseite behält ihren eigenen nachprüfbaren Inhalt, Quelle, Quizlogik und Datenschutz; ohne ausdrückliche Einzelfreigabe keine neuen Beiträge, keine zusätzliche OneSignal-Push-Benachrichtigung durch reine Designkorrekturen.

- Erst auf dieser eigenen Quellenseite befinden sich die geprüften externen Nachweise als Buttons.
- **PDF/Scan ist Pflicht:** Sobald zu Werk/Fundstelle ein öffentlich zugänglicher PDF- oder Scan-Nachweis existiert, muss die Quellenseite immer einen eigenen `PDF / Scan`-Button enthalten. Ein vorhandener Scan darf nicht aus Platz-, Design- oder Kürzungsgründen weggelassen werden.
- **Textnachweise müssen direkt zur Aussage führen:** Web-/Textnachweise sind mit einer exakten Textfragment-Markierung `#:~:text=…` oder einer technisch gleichwertigen Direktmarkierung auf die belegte Aussage zu setzen. Allgemeine Start-, Such-, Kapitel- oder Werkseiten sind nur Fallback und ersetzen keinen verfügbaren Direktnachweis.
- **PDFs müssen möglichst direkt zur belegten Seite führen:** Wenn die tatsächliche PDF-Seite verifiziert ist, wird `#page=<pdf-seite>` verwendet. Die PDF-Seite darf nicht geschätzt werden. Ist die technische PDF-Seite trotz vorhandenem Scan noch nicht sicher verifiziert, bleibt der PDF/Scan-Button trotzdem Pflicht; die genaue gedruckte Fundstelle wird dann zusätzlich in der Quellenangabe genannt und der Seitenanker erst nach Verifizierung ergänzt.
- Bei mehreren belastbaren Nachweisen soll die Quellenseite mindestens enthalten: primärer Direktnachweis mit Markierung, weiterer unabhängiger Textnachweis soweit vorhanden und PDF/Scan.
- Ein nummerierter Kurzlink darf erst als fertig ausgegeben werden, wenn seine Quellenseite erstellt, Inhalte und Originalbelege geprüft und der öffentliche `/q/<nummer>`-Link technisch verifiziert wurden.
- Die GitHub-Struktur fuer Quellenlinks ist verbindlich: Alle nummerierten Quellenlinks bleiben im einzigen Hauptordner `q/<nummer>/`; keine neuen thematischen Parallelordner fuer einzelne nummerierte Quellenlinks anlegen.
- `q/README.md` ist die menschliche GitHub-Uebersicht und muss bei jedem neuen oder geaenderten nummerierten Quellenlink aktualisiert werden: Nummer, Thema, Sprecher/Überlieferer und Kernaussage muessen dort klar sichtbar sein.
- `q/_registry/shortlinks.json` ist die technische Registry und muss fuer jeden nummerierten Link mindestens `number`, `shortPath`, `targetPath`, `title`, `topic`, `speaker`, `postReference`, `statementSummary`, `sourceLabel`, `status` und `createdAt` enthalten.
- `q/_registry/next-number.txt` und `nextNumber` in `q/_registry/shortlinks.json` muessen immer auf die naechste freie Nummer zeigen. Bestehende Nummern duerfen nicht ueberschrieben, umbenannt oder wiederverwendet werden.
- In GitHub duerfen Nummern nicht unklar bleiben: Auch wenn der oeffentliche Link nur `dar-al-tawhid.de/q/<nummer>` lautet, muss intern in README/Registry klar stehen, welches Thema, welche Aussage und welcher Sprecher/Überlieferer zu dieser Nummer gehoeren.
- Diese integrierte **Phase-A/Phase-B-Regel** ist die vorrangige redaktionelle Arbeitsanweisung für Chat-Prüfentwürfe, finale Chat-Beiträge, Q-Quellenseiten und Lernvertiefungen. Die veröffentlichten App-Oberflächen bleiben bei ihren separaten Quellenkomponenten. Ältere widersprechende Text- oder Linkmuster sind außer Kraft.

## Autonome globale Erwachsenen-Veröffentlichung · 09.10.2026

- Bei neuem, gesondert freigegebenem Einzelbeitrag in `content/posts/`: vorher `scripts/adult-content-publication-guard.js` anwenden. Identische oder hochgradig überlappende Aussagen in den bestehenden Textbeiträgen und in `apple-tv/hadith/series/` werden abgelehnt. Abgelehnte Veröffentlichungen müssen mit bestehender Fundstelle nachvollziehbar gemeldet werden (GitHub-Workflow-Issue). Unsichere Ähnlichkeit nicht als endgültig identisch ausgeben.
- Neuer **Ḥadīṯ** nur mit belegter Authentizitätsbewertung und **verifiziertem Šarḥ**, einschließlich Šarḥ-Gelehrtem, Werk und exaktem Quellenverweis. Fehlende Prüfung = Veröffentlichungssperre; keinen Šarḥ erfinden.
- **Šarḥ-Priorität bei DĀR AL TAWḤĪD (Korrektur 13.10.2026):** Bei jedem Ḥadīṯ zuerst den **ältesten belegbaren direkten Kommentar zum exakt überlieferten Bericht oder demselben belegten Aussagekern** recherchieren. Frühe direkte Erläuterungen etwa von aṭ-Ṭaḥāwī in *Šarḥ Muškil al-Āṯār* und weitere frühere Šurūḥ chronologisch prüfen; an-Nawawī oder Ibn Ḥaǧar nur primär, wenn kein früherer echter direkter Šarḥ nachweisbar ist. Bloßes Zitieren/Überliefern ohne Erklärung ist kein Šarḥ. Autor/Todesjahr, Werk, Fundstelle, überprüfbarer Direktnachweis und die sachlich passende Passage sind Pflicht. Primären frühesten Šarḥ in kanonische Metadaten und `/q/`-Quellenkarte eintragen; spätere direkte Kommentare nur ergänzend. Bei fehlender Verifizierung keine Veröffentlichung.

- Neuer **Athar** erhält `recordType: athar`; **kein Šarḥ erforderlich** und die UI darf nicht „Šarḥ offen“ anzeigen. Überlieferungsstatus in `grade` sichtbar machen. Ein unterbrochener Isnād darf niemals stillschweigend als ṣaḥīḥ gekennzeichnet werden.
- Ein eindeutiger neuer Datensatz erhält die nächste ungenutzte `HAD-xxxx`-Nummer und erscheint über den **kanonischen Apple-TV-/Ḥadīṯ-Datenbestand** in den Erwachsenen-Bibliotheken. Website, Desktop, iOS, Android-Web-/Native-WebView und Apple TV verwenden den freigegebenen gemeinsamen Datenstand. Separate App-Deploys und Versionsprüfungen bleiben erforderlich; einen Commit nicht als abgeschlossene Live-Auslieferung bezeichnen.
- Textbeiträge für Erwachsene **ohne Hashtag-Zeilen und ohne Social-Media-Textfußzeilen**. Bei Quellenlink ist exakt **eine** passende `/q/<nummer>/`-Karte für den Einzelbeitrag maßgebend.
- **Keine Änderungen an Kids und keine OneSignal-/Besucher-Benachrichtigungen** durch diesen Inhalts-Sync. Veröffentlichung auf einer Seite und Versand eines Pushs sind getrennte Aktionen.
- Geschützte App-Spuren gemäß `scripts/app-lane-guard.js` getrennt committen; der kanonische Live-Workflow führt Inhaltssync und Live-Build aus. Bei blockierter Live-Auslieferung konkrete Workflow-Fehler melden statt Erfolg zu behaupten.

## GLOBAL HERO BACKGROUND AUTHORITY

Hero-Bilder der Erwachsenen-App sind der vollflächige Hintergrund ihres Bereichs. Sie nutzen die Breite von `#appView`, mit `background-size:cover` und ohne seitlichen Leerstreifen. Kein `width:100vw` und kein negativer Ausgleichsrand in verschachtelten Containern. Der Bildbereich bleibt ohne Kartenrand und ohne Schatten; Überschrift und nachfolgender Lesetext behalten ihren eigenen Innenabstand. Jedes neue Hero-Motiv übernimmt diese Einbettung. Motiv, Höhe, Typografie und Farbwelt des Bereichs bleiben eigen.

## GLOBAL HERO & SCROLL MASTER STANDARD V1.0

Neue Hero-Bereiche der Erwachsenen-App verwenden nur diesen Vertrag und keine eigene Breiten- oder Scroll-Architektur:

* `dar-hero-stage`, `dar-hero`, `dar-hero-content`, `dar-hero-search`, `dar-page-content`
* `data-hero-kind="landing|category|post"`
* `data-hero-scroll="normal|sticky"`

Typ A (`landing`) ist die große Fläche, etwa die Hälfte der nutzbaren Höhe. Typ B (`category`) liegt auf dem Smartphone etwa bei 220–330 px. Typ C (`post`) bleibt kompakt, etwa 200–300 px, und wächst mit der Überschrift, statt Text abzuschneiden. Das Motiv ist eine CSS-Hintergrundfläche mit `background-size:cover`. Der Text hält die Safe Area. Sticky gilt nur, wenn Suche am Hero bleibt; der Seiten-Scroll bleibt einer. `overflow` auf einem Vorfahren darf diesen Sticky-Hero nicht in einen zweiten Scroll-Container sperren.

Der wiederhergestellte Frauen-Hero wird von diesem Vertrag nicht überschrieben. Ältere Seiten werden einzeln umgestellt. Ausnahmen ohne diesen Vertrag: Qurʾān-Leseseite, Video-Vollbild, Modals und spezielle Lernansichten. Prüfung: `node scripts/hero-scroll-standard-guard.js`.

## ZENTRALE DAUERAUFGABE – ḤADĪṮ, ŠARḤ, ĀṮĀR & TADABBUR (18.10.2026)

**Verbindlich chat- und geräteübergreifend:** Der fortlaufende kanonische Inhaltsauftrag gehört zum bestehenden **DĀR AL TAWḤĪD Zentrum / DĀR AL TAWḤĪD Zentrale**. Technische und redaktionelle Einzelregeln samt Arbeitszeiger stehen in `content/admin/canonical-content-continuation-policy.json`. Bei jeder späteren Anfrage wie „weiter“, „Hadithe“, „Šarḥ“, „Āṯār“ oder „Tadabbur fortsetzen“ dort und in den aktuellen `apple-tv/**`-Audits neu ansetzen, nicht bei alten Chat-Zahlen. Keine zweite Automatisierung und keine parallel konkurrierende Inhaltszentrale anlegen.

1. **In 10er- oder 20er-Blöcken:** möglichst zwanzig, mindestens zehn individuell geprüfte Kandidaten pro sinnvoll zusammenhängendem Arbeitsdurchgang; fertiggestellte, offene, gesperrte und Dubletten **getrennt** zählen. Qualität vor Geschwindigkeit: zehn gesichtete Datensätze sind nicht automatisch zehn authentifizierte Inhalte. Bei erschöpften Quellen nachvollziehbar stoppen statt erfinden.
 **GitHub-/Deploy-Ökonomie:** Einen fertigen und durchgeprüften 10er-/20er-Block bevorzugt als EINEN atomaren Content-Commit inklusive Audit, Index/Katalog/Manifest schreiben und danach EINMAL den bestehenden Canonical-Live-Workflow auslösen; nicht pro Einzeldatei einen eigenen Deploy aufbauen.
2. **Zwei unabhängige Ḥadīṯ-Spuren:** (a) echte offene alte Šarḥ-Lücken nacharbeiten; nicht Dubletten oder Āṯār als Šarḥ-Lücken zählen; (b) neue, bislang nicht vorhandene Ṣaḥīḥ/Ḥasan-Ḥadīṯe nur mit frühestem nachgewiesenen direkten klassischen arabischen Šarḥ, genauem Buch/Kapitel/Nummer/Edition/Band/Seite soweit überprüfbar. Keine modernen freien Nacherzählungen als Gelehrtenkommentar ausgeben. Vor jedem Commit Wortlaut, Primärstelle, Attribution und semantische Überlappungen kontrollieren.
3. **Āṯār parallel fortsetzen:** Frühe Ṣaḥābah-, Tābiʿīn- und Salaf-Aussagen; für jeden Kandidaten Einzel-Isnād und Grad, ggf. `mawqūf` / `maqtūʿ` / `munqaṭiʿ` sichtbar. Ohne verlässlichen Nachweis **kein** pauschales „authentisch/athar“, und keinen ungesicherten Āṯar als ṣaḥīḥ veröffentlichen. Šarḥ für Āṯār nicht erforderlich.
4. **Qurʾān/Tadabbur ist endlich:** das Ziel sind exakt 6.236 einzigartige, je Vers geprüfte Bezugseinträge; fehlende Verse einzeln belegen und vollständig prüfen. Bei nachgewiesen 6.236/6.236 diesen Erstellungsstrang als **abgeschlossen** markieren; danach allenfalls Korrektur/Qualitätspflege, keine erfundenen neuen Verse oder Dopplungen. Der Ḥadīṯ-/Āṯār-Strang bleibt unabhängig davon offen.
5. **Direkt nach fertig und geprüft global veröffentlichen:** Den bestehenden kanonischen Datenbestand `apple-tv/hadith/**` bzw. `apple-tv/quran/tadabbur/**` samt Index, Katalog, Manifest und Audits **über den bestehenden Workflow** `.github/workflows/canonical-islamic-content-live.yml` synchronisieren. Auf die erwachsene Website, Besucher-Web-/PWA/Android, bestehende iOS-WebView-/native Remote-Content-Einbindung und Apple TV einschließlich Bibliothek/Home/Bildschirmschoner. Keine gesonderte spätere Sammelveröffentlichung abwarten, sofern die Quellen- und Deployment-Gates bestanden sind.
6. **„Global“ heißt nicht blind „live“:** Neues GitHub-Commit, erfolgreicher GitHub-Job, Cloudflare-Auslieferung und tatsächliche Abholung in nativer iOS-/tvOS-App sind **verschiedene Zustände**, einzeln prüfen. Apple-TV-Screensaver muss seinen persistierten `shuffleBag` fortsetzen: alle gültigen Karten einmal, bevor erneut gemischt wird; neue IDs zum Restbeutel, nicht Neustart bei jedem Öffnen. Ein noch bestehender Wiederholungsfehler wird nicht durch Katalog-Neuaufbau geheilt.
7. **Keine OneSignal-Benachrichtigung als Nebeneffekt:** Mit „live gepusht“ ist in diesem Abschnitt **Inhaltssynchronisation**, nicht eine massenhafte Geräte-Push-Nachricht gemeint. Geschützte Push-Spuren, OneSignal, Gebets-/Tages-/Jumuʿah-Systeme, UI, Service Worker, App-Builds und Kinder-App nicht mitändern. Die eine täglich freigegebene Erwachsenen-Beitragsveröffentlichung der Zentrale bleibt separat. Nur echte Änderungen der iOS-/tvOS-App-Hülle benötigen Store-Release; reine kompatible Remote-Inhalte üblicherweise nicht.
8. **Fortsetzungsnachweis:** Vor der Arbeit neuesten `main` und Blob-SHA prüfen; im Audit festhalten: bearbeitete IDs, Primärquellen, genau verifizierter Status, offene Fragen, neue `nextId`, gebaute Kataloge, Workflows und Live-Abrufstatus. Nie eine bereits bereinigte oder doppelte Aussage still reaktivieren. Nächsten freien Audit-Block sowie offene echte Šarḥ-Lücken an die bestehende Zentrale übergeben.

**Sonderfreigabe nur für geprüfte kanonische Erwachsenen-Inhaltsdateien** durch Nutzer vom 18.10.2026: Dieser Abschnitt präzisiert die allgemeine Staging-Freigaberegel für kanonische religiöse Inhalte, ohne andere Releases, Layoutänderungen, Security-Locks, Kids oder OneSignal-Push zu autorisieren. Bei realem Blocker keine Sperre umgehen, sondern den Grund im Zentrum dokumentieren.
