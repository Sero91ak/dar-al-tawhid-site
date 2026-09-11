# DAR AL TAWḤĪD Kurzlink-Registry (`/q/<nummer>`)

Dieser Ordner ist die zentrale Ablage für alle nummerierten Quellen-Kurzlinks.

Die lesbare GitHub-Übersicht für Menschen steht eine Ebene höher in:

- `q/README.md`

Diese Registry hier ist die technische Verwaltung für Nummern, Vorlage und Zuordnung.

## Ziel
- Keine manuelle Zettel-Liste mehr
- Fortlaufende Nummern im Repo speichern
- Jeder Kurzlink ist dauerhaft nachvollziehbar
- Jede Aussage/Beitrag-Quelle ist verpflichtend registriert
- Jede Quellen-Seite bleibt optisch einheitlich, ausführlich und mit anklickbaren Icon-Links

## Struktur
- `shortlinks.json` → alle bisherigen Zuordnungen (`/q/<n>` → Zielseite)
- `next-number.txt` → nächste freie Nummer
- `shortlink-template.html` → Vorlage für neue `q/<n>/index.html`
- `register-shortlink.mjs` → erstellt automatisch neuen Kurzlink + Registry-Eintrag

## Pflichtstandard für jede `/q/<nummer>/index.html`-Quellenseite

Jede nummerierte Quellenseite muss diesen Aufbau verwenden:

1. Die Seite ist erklärend aufgebaut: Aussage, Einordnung, Nutzen/Abgrenzung, direkte Quellenstellen und Kurzfazit.
2. Quellenangaben nennen primär Originalwerke und frühe/klassische Quellen: Qurʾān, Sunnah, Ṣaḥābah, Tābiʿīn, Salaf, Hadithwerke, Tafsīrwerke, Atharwerke und anerkannte klassische Sharḥ-Werke.
3. Fatwā-Seiten werden nicht als Quellenangabe geführt. Islamweb darf nur als Bibliotheksseite eines Originalwerks genutzt werden, nicht als Fatwā-Verweis.
4. Web-/Textnachweise erscheinen ausschließlich als Linkkarten in `<div class="qsource-links">` mit `<a class="qsource-link web">`.
5. PDF- und Scan-Nachweise müssen, sobald auffindbar, zusätzlich als eigene Karten in `<div class="qsource-links">` eingebaut werden, mit `qsource-link pdf` oder `qsource-link scan`.
6. Direktlinks mit Textfragment (`#:~:text=`) oder PDF-Seitenanker (`#page=`) werden bevorzugt, wenn die Stelle sicher bestimmt ist.
7. Keine alten Listen wie `<ul class="qsource-link-list">` für Quellenlinks verwenden.
8. Keine Text-Footer wie `Telegram Instagram WhatsApp Website` verwenden.
9. Nach den Linkkarten steht immer die Social-Icon-Leiste `<nav class="qsource-social">` mit anklickbaren Icons für Telegram, Instagram, WhatsApp und Website.
10. Interner Fallback bleibt als letzte Webkarte möglich: `/q/<nummer>/`.
11. Quellenlinks werden nicht automatisch in Beiträgen veröffentlicht, sondern erst nach Freigabe des Nutzers; die `/q/<nummer>/`-Seite darf die vollständigen Direktnachweise enthalten.

## Standard-Social-Icon-Leiste

```html
<nav class="qsource-social" aria-label="Social Links">
  <a class="telegram" href="https://t.me/dar_al_tauhid" target="_blank" rel="noopener noreferrer" aria-label="Telegram"></a>
  <a class="instagram" href="https://www.instagram.com/dar_at_tawhid/" target="_blank" rel="noopener noreferrer" aria-label="Instagram"></a>
  <a class="whatsapp" href="https://whatsapp.com/channel/0029VbBK0YaDp2Q8A0kW1F3g" target="_blank" rel="noopener noreferrer" aria-label="WhatsApp"></a>
  <a class="web" href="/" aria-label="Website"></a>
</nav>
```

## Pflichtdaten pro Linkeintrag (`shortlinks.json`)
- `number` → fortlaufende Nummer
- `shortPath` → z. B. `/q/2/`
- `targetPath` → Zielseite unter `/quelle/...` oder dieselbe `/q/<nummer>/`-Seite
- `title` → kurzer Titel
- `topic` → Thema für GitHub-Übersicht
- `speaker` → Sprecher / Überlieferer für GitHub-Übersicht
- `postReference` → interne Beitrags-/Statement-Referenz (z. B. `statement-002`)
- `statementSummary` → Kernaussage in Kurzform
- `sourceLabel` → Quellenangabe in Kurzform, ohne Fatwā-Verweis
- `status` → `active` oder `archived`
- `createdAt` → UTC-Zeitstempel

## Standardablauf für neuen Link
1. Befehl ausführen:

```bash
node q/_registry/register-shortlink.mjs \
  --target /quelle/meine-quellenseite/ \
  --title "Kurztitel zur Aussage" \
  --topic "Thema der Aussage" \
  --speaker "Sprecher oder Überlieferer" \
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
- In GitHub immer zuerst `q/README.md` prüfen: dort steht `q/<nummer>` mit Thema und Sprecher.
