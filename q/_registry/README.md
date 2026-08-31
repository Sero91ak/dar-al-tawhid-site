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

## Pflichtstandard fuer jede `/q/<nummer>/index.html`-Quellenseite

Jede nummerierte Quellenseite muss unten denselben Aufbau verwenden:

1. Web-/Textnachweise ausschließlich als Linkkarten in `<div class="qsource-links">` mit `<a class="qsource-link web">`.
2. PDF- und Scan-Nachweise, sobald vorhanden, zusätzlich als eigene Karten in `<div class="qsource-links">` mit `qsource-link pdf` oder `qsource-link scan`.
3. Keine alten Listen wie `<ul class="qsource-link-list">` für Quellenlinks verwenden.
4. Nach den Linkkarten steht immer die Social-Leiste `<nav class="qsource-social">` mit Telegram, Instagram, WhatsApp und Website.
5. Interner Fallback bleibt als letzte Webkarte möglich: `/q/<nummer>/`.
6. Direktlinks mit Textfragment (`#:~:text=`) oder PDF-Seitenanker (`#page=`) bevorzugen, wenn die Stelle sicher bestimmt ist.
7. Quellenlinks werden nicht automatisch in Beiträgen veröffentlicht, sondern erst nach Freigabe des Nutzers; die `/q/<nummer>/`-Seite darf die vollständigen Direktnachweise enthalten.

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
