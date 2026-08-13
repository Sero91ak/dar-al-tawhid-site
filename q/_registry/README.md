# DAR AL TAWḤĪD Kurzlink-Registry (`/q/<nummer>`)

Dieser Ordner ist die zentrale Ablage für alle nummerierten Quellen-Kurzlinks.

## Ziel
- Keine manuelle Zettel-Liste mehr
- Fortlaufende Nummern im Repo speichern
- Jeder Kurzlink ist dauerhaft nachvollziehbar
- Jede Aussage/Beitrag-Quelle ist verpflichtend registriert

## Struktur
- `shortlinks.json` → alle bisherigen Zuordnungen (`/q/<n>` -> Zielseite)
- `next-number.txt` → nächste freie Nummer
- `shortlink-template.html` → Vorlage für neue `q/<n>/index.html`

## Pflichtdaten pro Linkeintrag (`shortlinks.json`)
- `number` → fortlaufende Nummer
- `shortPath` → z. B. `/q/2/`
- `targetPath` → Zielseite unter `/quelle/...`
- `title` → kurzer Titel
- `postReference` → interne Beitrags-/Statement-Referenz (z. B. `statement-002`)
- `statementSummary` → Kernaussage (kurz)
- `sourceLabel` → Quellenangabe in Kurzform
- `status` → `active` oder `archived`
- `createdAt` → UTC-Zeitstempel

## Standardablauf für neuen Link
1. Nummer aus `next-number.txt` nehmen (z. B. `2`).
2. Neue Datei anlegen: `q/2/index.html` (auf Basis `shortlink-template.html`).
3. `__NUMBER__` und `__TARGET_PATH__` ersetzen.
4. Eintrag in `shortlinks.json` unter `links` ergänzen (inkl. Pflichtdaten).
5. `next-number.txt` auf nächste Zahl setzen (`3`).
6. Optional `q/index.html` auf den neuesten Link umstellen (falls gewünscht).

## Kurzformat für Posts
- Immer ohne Schema schreiben:
  - `dar-al-tawhid.de/q/1`
  - `dar-al-tawhid.de/q/2`
  - ...

## Hinweis
- `q/index.html` ist der Kurz-Einstieg.
- `q/<nummer>/index.html` ist der stabile, versionierte Link.
