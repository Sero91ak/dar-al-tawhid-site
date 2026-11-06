# DĀR AL TAWḤĪD · Wissenshaus (GitHub-basierte Designvorschau)

## Zweck
Eigenständige, von der vorhandenen Live- und Test-App isolierte Ansicht. Klassisches Manuskript-/Bibliotheksdesign mit kompaktem Dashboard, responsiver Navigation, Quellen-Pop-ups, lokalem Speichern und originalgetreuen Quellen. Kein Umbau des bisherigen index.html.

## Tatsächlich eingebundene Quelldateien
- `content/posts/posts-index.json`: 481 Dateiverweise; vollständiges Beitrags-Markdown wird **erst beim Öffnen** abgerufen. ID, Gelehrte, Quelle und Text bleiben unverändert.
- `test/data/dar-smart-post-titles-v1.json`: vorhandener Titelsuchindex.
- `data/books-library.json`: **nur** ausdrücklich verifizierte Bücher; andere Einträge werden nicht angezeigt.
- `data/scholars-library.json`: Gelehrtenregister im App-Zustand.
- `content/quran/NNN.json`: 114 Sūren, mit Uthmānī-Arabisch, deutscher Übersetzung, Transliterationsfeldern. Anzeige höchstens 12 Verse pro Seite.
- `content/duas/dua-*.md`: alle 97 per Manifest registrierten vorhandenen Duʿāʾ-Originaldateien. Arabisch, Lautschrift, Deutsch, Quelle im Lesefenster.
- `content/updates/daily.json`: offizielle tagesaktuelle Beitragsempfehlung und Duʿāʾ.
- `apple-tv/quran/tadabbur/entries.json` plus `entries-index.json`: zunächst Schnellindex, 499 weitere Tadabbur-Dateien in Gruppen à 12 nachladbar. Keine künstliche Aussage bei fehlender Überlieferung.
- Icons/Buchumschläge aus den bestehenden Assets, sofern vom Buchindex geliefert.

## Bedienung
- Smartphone: feste 5er-Tabbar. Desktop: feste linke Sidebar, Schnellleiste, optionale rechte Quellenkarten.
- Beiträge, Duʿāʾ, Verse, Gelehrten-/Buchnachweise: modales Lesefenster mit Quellen und, soweit im Original vorhanden, externem Direktnachweis.
- Merkliste, Leserposition und Tag/Nacht-Aussehen werden lokal im Browser gespeichert.
- Frag DĀR ist **keine autonome KI**, sondern vorerst eine lokale Suche über vorhandene Quellenindizes. Semantische Volltextsuche und serverseitige LLM-Anbindung sind ausdrücklich nicht implementiert.
- Gebetszeiten, Qibla, Konto und ursprüngliche App bleiben in ihrer etablierten Implementierung. Die Vorschau verweist darauf und behauptet keine integrierte Authentifizierung.

## Präzisionsgrenzen
Der Repository-Baum umfasst über 15.000 Dateien. Diese erste integrierte Oberfläche indexiert die zentralen Inhalte, nicht alle Dateien, Audios oder Plattformtargets. Beitragssuche durchsucht zunächst Titel/Dateinamen und nicht den gesamten Inhalt aller 481 Dateien. Die Tadabbur-Schnellansicht startet mit 31 Einträgen und lädt weitere Chargen auf Nutzeraktion. Weder API-Schlüssel noch unangemeldete Cloud-Funktionen werden verwendet.

## Sicherheits- und Veröffentlichungsregeln
- Nur eigene Dateien unter `wissenshaus/`; keine Änderungen an `index.html`, `test/`, Kids, iOS, Android, Worker, Manifesten, Service Workers oder OneSignal.
- Kein Live- oder Test-Deploy ohne ausdrückliche Freigabe und Gesundheitsprüfungen.
- Keine Erfindung von Quellen, Übersetzungen, Q-Kurzlinks oder Beitrags-IDs.
- UI-Deutsch ist der Ausgangsstand; andere Sprachfassungen erst nach redaktioneller Prüfung.
- `main` wird nicht automatisch verändert; diese Arbeit liegt im Feature-Branch.

## Prüfen (nach Checkout oder im isolierten Repository)
```sh
node --check wissenshaus/app.js
node wissenshaus/smoke-test.cjs
```

Der eigentliche Browser-Smoketest braucht eine isolierte Test-URL oder einen lokalen HTTP-Server, unter dem die Repository-Wurzel ausgeliefert wird, z. B. `python3 -m http.server 8000` und dann `http://localhost:8000/wissenshaus/`. Er prüft Datenabruf, Responsive-UI, den kompletten Quellenfluss, die Merkliste, die Suchform und das Verhalten ohne Netz.
