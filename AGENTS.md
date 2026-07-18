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

**Vor jedem Merge auf `main`:** `node scripts/push-system-guard.js` und `node scripts/repo-integrity-guard.js` müssen grün sein. Bei Worker-Änderungen deployt die GitHub Action nur, wenn der Guard besteht.

## Repo-Integritäts-Schutz (streng – nicht verletzen)

Geschützt durch `scripts/repo-integrity-guard.js` und CI (Canonical State Guard, App Health Check, Deploy).

**Verboten ohne ausdrückliche Freigabe des Nutzers:**
- Löschen oder Ausdünnen von Kern-Ordnern: `assets/`, `content/`, `admin/`, `cloudflare/`, `scripts/`
- Massen-Löschung (>80 Dateien in einem Commit)
- Entfernen von `assets/live-boot.js`, `manifest.json`, `wrangler.toml`, `content/posts/`, `admin/index.html`

**CI blockiert** Push/Merge/Deploy wenn zu wenige Dateien im Repo sind oder geschützte Pfade gelöscht würden.
