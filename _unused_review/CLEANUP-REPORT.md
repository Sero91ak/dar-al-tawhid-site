# Cleanup-Prüfbericht (Branch: `cursor/cleanup-unused-system-code-e34c`)

Datum: 2026-06-18

## Ziel
Aufräumen von ungenutztem/dupliziertem Code und Dateien ohne funktionierende App-Bereiche zu beschädigen.

---

## Entfernt (endgültig)

| Datei/Funktion | Grund | Risiko |
|---|---|---|
| **64× `content/*.md`** | Byte-identische Duplikate von `content/posts/` (alle 64 verifiziert mit `diff -q`) | **Keins** – App lädt nur `content/posts/` |
| **`assets/auto-refresh.js`** | Nirgends eingebunden; veraltetes Repo in Script | Keins |
| **`assets/prayer-push-tags.js`** | Superseded durch inline Push-Tags in `index.html` | Keins |
| **`.github/workflows/install-prayer-push-tags.yml`** | One-off-Workflow für entfernte JS-Datei | Keins |
| **`.github/workflows/sync-taxipro-dispatch.yml`** | Fremdprojekt (TaxiPro); Ordner existiert nicht im Repo | Keins |
| **`LEGACY_PRAYER_TAGS`** (index + test) | Konstante definiert, nie verwendet | Keins |
| **`tabButton()`** (admin) | Funktion definiert, UI nutzt `<select>` seit Tab-Picker-Umstellung | Keins |

---

## Archiviert (`_unused_review/` – nicht von App geladen)

| Datei | Grund | Risiko wenn archiviert |
|---|---|---|
| **`legacy-posts.json`** | Legacy-JSON (~50 Beiträge); App nutzt Markdown + `posts-index.json` | Keins |
| **`duas-md-archived/` (60 Dateien)** | Duʿā-MD würde **vor** `duas.json` geladen (GitHub-API-Pfad); Archivierung stellt sicher, dass nur `duas.json` gilt | Keins – JSON enthält dua-001…030 |

**TODO:** Nach manueller Bestätigung archivierte Dateien endgültig löschen.

---

## Deaktiviert / verbessert (nicht gelöscht)

| Änderung | Grund |
|---|---|
| **`persistPostsCache()`** entfernt `CACHE_KEY_LEGACY` nach erfolgreichem Schreiben | Alte Cache-Version blockiert nicht mehr dauerhaft |
| **Besucher-Statistik (`#statistik`)** | Route leitet bereits auf `#more` um – Code bewusst **behalten** (kein UI-Zugang, aber kein Risiko durch Entfernen großer Blöcke) |
| **Doppelter Bild-Editor-Block** | Bewusst **nicht** angefasst – zu invasiv für Cleanup ohne Regressionstest |

---

## Behalten (weiterhin nötig)

| Bereich | Grund |
|---|---|
| `content/posts/` (426 Beiträge) | Produktiv |
| `content/duas/duas.json`, `daily-dua-pool.json` | Duʿā-Runtime |
| `test/index.html` | Staging/Dar Test |
| `admin/index.html`, `quellen-manager.js` | Admin inkl. Quellen-Tab |
| `service-worker.js`, `admin/sw.js`, Push, Worker, Manifeste | PWA + Veröffentlichung |
| Alle `scripts/*-guard.js` | CI-Schutz |

---

## Neu: CI-Schutz

- **`scripts/cleanup-guard.js`** – verhindert Rückkehr von Duplikaten und blockiert `content/duas/*.md` (würde `duas.json` überschreiben)

---

## Getestet (automatisch)

| Test | Ergebnis |
|---|---|
| `scripts/cleanup-guard.js` | OK |
| `scripts/source-files-guard.js` | OK |
| `scripts/quellen-manager-test.js` | OK |
| `scripts/version-update-guard.js` | OK |
| `scripts/posts-load-guard.js` | (via CI) |
| `scripts/slide-post-guard.js` | (via CI) |

Manuell empfohlen nach Merge: Startseite, Beitrag öffnen, Suche, Slide-Beitrag 426, Duʿāʾ-Liste, Admin Quellen-Tab, PWA Hard-Refresh.

---

## Nicht angefasst (Review offen)

| Item | Empfehlung |
|---|---|
| Typo-Dateinamen `026-06-05-*.md` in posts-index | Umbenennen in separatem PR |
| Fehlende Binär-Assets (Icons, post-templates JPG) | Deploy-Artefakt – nicht löschen |
| Doppelter Premium-Bild-Editor-Code (~8472–8790) | Nur nach manuellem QA entfernen |
| `#image-editor-test` Route | Optional später entfernen |
