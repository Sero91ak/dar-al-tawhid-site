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

## Neue Beitragsregel vom 09.10.2026 (Erwachsenen-Apps / Textbeiträge)

- **Verbindliche Bedeutung „Push live“ bei Beiträgen:** Das ist eine ausdrückliche Freigabe zum **Versand einer OneSignal-Gerätebenachrichtigung** an die abonnierte Erwachsenen-Empfängergruppe (derzeit `DAR_PUSH`) **zusätzlich** zur App-/Website-Veröffentlichung. Ein bloßer GitHub-Commit, Cloudflare-Deploy oder Apple-TV-Katalogeintrag erfüllt den Auftrag nicht. Vor dem Versand Beitrag und Ziel-URL live prüfen, bereits gesendete Benachrichtigungen anhand Post-ID/OneSignal-ID auf Dubletten prüfen; idempotent senden, Versand-ID sowie Empfänger-/Fehlerzahlen protokollieren und den realen Versandstatus mitteilen. **Nicht** als automatische Gerätebenachrichtigung interpretieren, wenn nur eine Code-/Layout-Auslieferung verlangt wird. Keine Kinder-App- oder Gebets-Pushs anstoßen; Push-Code-Schutz und Kennwortsperren für Codeänderungen bleiben unangetastet.

- **Priorität: Der App-Aussagebereich enthält nur Sprecher/Zuschreibung, die zitierte Aussage und optional ein kurzes Fazit.** Doppelte Quelle, Kurzlink, Isnād, lange Erläuterungen oder schwarze Quellen-Kästen im Text dürfen nicht mitveröffentlicht werden. Die App zeigt darunter ihre eigenständige Quellenkarte; von dort führt der `/q/`-Link zu Originaltext, Quellenprüfung und ausführlichen Erklärungen. Keine Originalnachweise aus der Quellenkarte entfernen, nur die doppelte Darstellung aus dem Aussage-Body.
- Bei **neu veröffentlichten** normalen Textbeiträgen und App-Beiträgen **keine sichtbaren Hashtagzeilen** und **keine Social-Media-Fußzeilen** wie Telegram, Website und Instagram ausgeben. In neuen `content/posts/*.md` stets `tags: []` verwenden; Altbeiträge nicht pauschal überschreiben.
- Wird ausdrücklich ein **Quellenlink / Quellencode** angefordert, die nächste tatsächlich freie Nummer unter `q/<nummer>/` vergeben, eine **eigene gebündelte Quellenkarte** mit überprüfbaren arabischen Originalwortlauten, einzeln passenden Direktlinks, Textfragment-Markierungen und – falls verfügbar – PDF/Scan erstellen. **In Erwachsenen-Apps (Website/Desktop, iOS, Android, Apple TV) stehen bibliografische Quelle und interner Quellenlink ausschließlich im separaten Quellenbereich**, der aus den Frontmatter-Feldern `source` und `links` erzeugt wird. **Niemals** `📝 Quelle`, `🔗 dar-al-tawhid.de/q/<nummer>` oder den `Überlieferungsstatus` zusätzlich in den Fließtext einfügen. Externe URLs und Isnād-Erläuterungen gehören auf `/q/<nummer>/`. Für reine Social-Media-Textbeiträge außerhalb der Apps kann die Kurzlink-Zeile weiterhin unter der Quelle stehen.
- Bei App-Veröffentlichung den Beitrag **ohne Hashtags** in die gemeinsame Erwachsenen-Beitragsquelle und deren Index aufnehmen, die bestehenden getrennten App-Deploy-Wege beachten. **Keine Besucher-Push-Benachrichtigung ohne gesonderte Freigabe.** Kids-App nicht ohne ausdrückliche Nennung ändern.
- Die **bestehende Social-Icon-Leiste auf /q/-Quellenkarten** ist eine eigenständige Designvorgabe und von der Abschaffung der **Textbeitrags-Fußzeilen** nicht automatisch betroffen.
- Eine Fundstelle ist **kein Beweis für einen ununterbrochenen Isnād**; authentische Zuschreibung und Überlieferungsstatus sachgerecht unterscheiden, insbesondere bei Athār.

## Quellenprüfung & DAR-AL-TAWḤĪD-Kurzlinks (streng – global und ohne Ausnahmen)

Diese Regel ersetzt alle früheren Regeln zu sichtbaren Quellenlinks in veröffentlichten DAR-AL-TAWḤĪD-Inhalten.

- Die **strenge Quellenprüfung gilt überall**: WhatsApp, Telegram, Instagram, Bildbeiträge, normale Textbeiträge, Website-/GitHub-Beiträge, Kommentare/Widerlegungen und PDFs. Aussage, Zuschreibung, Werk, Fundstelle, Überlieferungsstatus und Direktbelege sind vor Veröffentlichung streng zu prüfen.
- Für sichtbare Quellen-Kurzlinks gilt ausschließlich das Schema `dar-al-tawhid.de/q/<nummer>`.
- `https://` wird im veröffentlichten Beitrag **niemals ausgeschrieben**.
- Die Nummerierung ist **streng fortlaufend**: `/q/1`, `/q/2`, `/q/3`, ...
- Bereits vergebene Nummern werden **niemals wiederverwendet, überschrieben oder einer anderen Quelle/Aussage zugeordnet**.
- Vor jeder Vergabe ist der tatsächliche höchste vorhandene `/q/<nummer>`-Eintrag im Repository zu prüfen.
- In jedem Quellen-Post wird der passende Kurzlink direkt mit ausgegeben.
- **Keine Textbeschriftung vor dem sichtbaren Link**: insbesondere niemals `Kurzlink:`, `Direktnachweis:`, `Link:` oder ähnliche Wörter verwenden.
- Der Linkbereich steht **unmittelbar in der nächsten Zeile unter der Quellenzeile**, ohne Leerzeile oder sonstigen Abstand dazwischen.
- Als einziges Kennzeichen des Linkbereichs wird das Symbol `🔗` verwendet. Standardformat bei genau einer Quelle:
  `📝 … Quellenangabe …`
  `🔗 dar-al-tawhid.de/q/<nummer>`
- Bei mehreren getrennten Quellen erhält jeder Quellenblock seinen eigenen fortlaufenden Kurzlink. Auch dort steht jeweils direkt unter der zugehörigen Quellenzeile ohne Leerzeile nur `🔗 dar-al-tawhid.de/q/<nummer>`; keine Zusätze wie `Quelle 1:`, `Quelle 2:` oder `Kurzlink:` vor dem Link.
- **Keine sichtbaren Fremd-URLs** im Beitrag oder sonstigen veröffentlichten Lesertext: keine Dorar-, Islamweb-, Shamela-, al-Maktaba-, Ketabonline-, Waqfeya-, Archive.org-, Turāth-, Tafsir.app-, PDF-/Scan- oder sonstigen externen URLs.
- Auch der lange interne Pfad `dar-al-tawhid.de/quelle/<slug>/` wird im veröffentlichten Beitrag nicht ausgegeben. Er bleibt nur die interne DAR-AL-TAWḤĪD-Quellenseite hinter dem nummerierten `/q/<nummer>`-Alias.
- Die Quellenzeile darf und soll Werk, Band, Seite, Kapitel, Nummer, Überlieferungsstatus und sonstige genaue bibliographische Angaben nennen; die sichtbare anklickbare URL bleibt ausschließlich der eigene nummerierte `/q/<nummer>`-Kurzlink.
- Der `/q/<nummer>`-Kurzlink darf intern nur auf die eigene DAR-AL-TAWḤĪD-Quellenseite führen und **nicht direkt auf eine externe Quelle**.
- Die interne DAR-AL-TAWḤĪD-Quellenseite bleibt die edle, kompakte Quellenkarte im freigegebenen gemeinsamen Design mit Aussage, Sprecher/Überlieferer, genauer Fundstelle, Status, Isnād soweit vorgesehen, Branding, `by Serhat Abu Malik` und Social-Verknüpfungen.
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
- Diese Regel ist **kanal-, format- und chatübergreifend** verbindlich und ersetzt ältere Beitrags- und Linkregeln, soweit sie ihr widersprechen.

## Autonome globale Erwachsenen-Veröffentlichung · 09.10.2026

- Bei neuem, gesondert freigegebenem Einzelbeitrag in `content/posts/`: vorher `scripts/adult-content-publication-guard.js` anwenden. Identische oder hochgradig überlappende Aussagen in den bestehenden Textbeiträgen und in `apple-tv/hadith/series/` werden abgelehnt. Abgelehnte Veröffentlichungen müssen mit bestehender Fundstelle nachvollziehbar gemeldet werden (GitHub-Workflow-Issue). Unsichere Ähnlichkeit nicht als endgültig identisch ausgeben.
- Neuer **Ḥadīṯ** nur mit belegter Authentizitätsbewertung und **verifiziertem Šarḥ**, einschließlich Šarḥ-Gelehrtem, Werk und exaktem Quellenverweis. Fehlende Prüfung = Veröffentlichungssperre; keinen Šarḥ erfinden.
- Neuer **Athar** erhält `recordType: athar`; **kein Šarḥ erforderlich** und die UI darf nicht „Šarḥ offen“ anzeigen. Überlieferungsstatus in `grade` sichtbar machen. Ein unterbrochener Isnād darf niemals stillschweigend als ṣaḥīḥ gekennzeichnet werden.
- Ein eindeutiger neuer Datensatz erhält die nächste ungenutzte `HAD-xxxx`-Nummer und erscheint über den **kanonischen Apple-TV-/Ḥadīṯ-Datenbestand** in den Erwachsenen-Bibliotheken. Website, Desktop, iOS, Android-Web-/Native-WebView und Apple TV verwenden den freigegebenen gemeinsamen Datenstand. Separate App-Deploys und Versionsprüfungen bleiben erforderlich; einen Commit nicht als abgeschlossene Live-Auslieferung bezeichnen.
- Textbeiträge für Erwachsene **ohne Hashtag-Zeilen und ohne Social-Media-Textfußzeilen**. Bei Quellenlink ist exakt **eine** passende `/q/<nummer>/`-Karte für den Einzelbeitrag maßgebend.
- **Keine Änderungen an Kids und keine OneSignal-/Besucher-Benachrichtigungen** durch diesen Inhalts-Sync. Veröffentlichung auf einer Seite und Versand eines Pushs sind getrennte Aktionen.
- Geschützte App-Spuren gemäß `scripts/app-lane-guard.js` getrennt committen; der kanonische Live-Workflow führt Inhaltssync und Live-Build aus. Bei blockierter Live-Auslieferung konkrete Workflow-Fehler melden statt Erfolg zu behaupten.
