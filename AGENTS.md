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

## Cursor Cloud specific instructions

This repository is a **static PWA** (single-page app). There is no package manager, no
build step, no test suite, and no linter configured. The whole app is `index.html` plus
static assets and JSON/Markdown content under `content/`, `assets/`, etc.

- **No dependencies to install.** There is no `package.json`/lockfile. The update script is
  intentionally a no-op. `node` (v22) and `python3` are preinstalled.
- **Run the app (dev):** serve the repo root over HTTP, e.g.
  `python3 -m http.server 8000` (or `npx serve .`), then open `http://localhost:8000/`.
  Do NOT open `index.html` via `file://` — content is fetched with absolute paths
  (`/content/...`, `/manifest.json`), so it must be served from the repo root.
- **Posts:** the app loads posts from GitHub raw/API (`raw.githubusercontent.com` /
  `api.github.com`) at runtime, with a local fallback to `content/posts/posts-index.json`.
  Locally served, the Beiträge list still works because it fetches from GitHub; network
  access to GitHub is required for live post content. Duʿās and Qurʾān data are served
  locally from `content/`.
- **`scripts/` (Node, CI-only):** helper scripts like `scripts/build-posts-index.js` use
  only Node built-in modules and are run by GitHub Actions, not needed for local dev.
  `build-posts-index.js` regenerates the tracked `content/posts/posts-index.json` (uses
  `git hash-object`); only run it intentionally when adding posts.
- **Service worker / OneSignal / manifest:** do not modify unless explicitly requested
  (see project rules above). When testing in a browser, a stale service worker cache can
  hide changes — hard-reload or unregister the SW if edits don't appear.
