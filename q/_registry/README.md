# DAR AL TAWḤĪD Kurzlink-Registry (`/q/<nummer>`)

Dieser Ordner ist die zentrale Ablage für alle nummerierten Quellen-Kurzlinks.

Die lesbare GitHub-Uebersicht fuer Menschen steht eine Ebene hoeher in:

- `q/README.md`

Diese Registry hier ist die technische Verwaltung fuer Nummern, Vorlage und Zuordnung.

## Ziel
- Keine manuelle Zettel-Liste mehr
- Fortlaufende Nummern im Repo speichern
- Jeder Kurzlink ist dauerhaft nachvollziehbar
- Jede Aussage/Beitrag-Quelle ist verpflichtend registriert

## Struktur
- `shortlinks.json` → alle bisherigen Zuordnungen (`/q/<n>` -> Zielseite)
- `next-number.txt` → nächste freie Nummer
- `shortlink-template.html` → Vorlage für neue `q/<n>/index.html`
- `register-shortlink.mjs` → erstellt automatisch neuen Kurzlink + Registry-Eintrag

## Pflichtdaten pro Linkeintrag (`shortlinks.json`)
- `number` → fortlaufende Nummer
- `shortPath` → z. B. `/q/2/`
- `targetPath` → Zielseite unter `/quelle/...`
- `title` → kurzer Titel
- `topic` → Thema fuer GitHub-Uebersicht
- `speaker` → Sprecher / Ueberlieferer fuer GitHub-Uebersicht
- `postReference` → interne Beitrags-/Statement-Referenz (z. B. `statement-002`)
- `statementSummary` → Kernaussage (kurz)
- `sourceLabel` → Quellenangabe in Kurzform
- `status` → `active` oder `archived`
- `createdAt` → UTC-Zeitstempel

## Standardablauf für neuen Link
1. Befehl ausführen:

```bash
node q/_registry/register-shortlink.mjs \
  --target /quelle/meine-quellenseite/ \
  --title "Kurztitel zur Aussage" \
  --topic "Thema der Aussage" \
  --speaker "Sprecher oder Ueberlieferer" \
  --postReference statement-00X \
  --summary "Kernaussage in 1 Satz" \
  --source "Primärquelle in Kurzform"
```

2. Script erzeugt automatisch:
   - `q/<nummer>/index.html`
   - neuen Eintrag in `shortlinks.json`
   - `next-number.txt` +1
   - `q/index.html` zeigt auf den neuesten Kurzlink
   - `q/README.md` zeigt die Nummer mit Thema und Sprecher in GitHub

## Kurzformat für Posts
- Immer ohne Schema schreiben:
  - `dar-al-tawhid.de/q/1`
  - `dar-al-tawhid.de/q/2`
  - ...

## Hinweis
- `q/index.html` ist der Kurz-Einstieg.
- `q/<nummer>/index.html` ist der stabile, versionierte Link.
- In GitHub immer zuerst `q/README.md` pruefen: dort steht `q/<nummer>` mit Thema und Sprecher.
