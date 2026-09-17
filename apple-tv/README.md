# DĀR AL TAWḤĪD – Apple TV

Dieser Ordner ist der zentrale Inhaltsbereich für die tvOS-/Apple-TV-App.

## Einstiegspunkt für Xcode

Xcode lädt zuerst `apple-tv/catalog.json`.

Dieser Katalog entscheidet autonom, welche Inhaltsmodule vorhanden und aktiv sind. Dadurch muss die App bei neuen Bereichen nicht jedes Mal auf feste Ordnernamen umgebaut werden.

## Module

- `hadith/` – authentische Ḥadīṯ-Datenbank – **aktiv**
- `dua/` – Duʿāʾ – **vorbereitet/geplant**
- `athar/` – Āṯār und Aussagen der Ṣaḥābah, Tābiʿīn und Salaf – **vorbereitet/geplant**

Weitere Module werden später ausschließlich über `catalog.json` registriert.

## Ladeprinzip

1. Apple TV lädt `apple-tv/catalog.json`.
2. Nur Module mit `status: active` werden verarbeitet.
3. Für jedes aktive Modul wird dessen `catalogPath` geladen.
4. Das Modul selbst liefert Serien, IDs und Datenpfade.
5. Inhalte werden lokal auf tvOS gecacht.
6. Bei erfolgreicher Netzwerkverbindung werden aktualisierte GitHub-Daten übernommen.
7. Bei Offline-Betrieb bleibt die zuletzt erfolgreich gespeicherte Version verfügbar.
8. Ein fehlerhaftes oder noch nicht aktives Modul darf andere Inhaltsbereiche nicht blockieren.

## IDs

IDs sind pro Inhaltsart dauerhaft stabil und dürfen niemals neu vergeben oder verschoben werden.

Beispiele:

- Ḥadīṯ: `HAD-0001`
- Duʿāʾ später: `DUA-0001`
- Āṯār später: `ATH-0001`

## Darstellung

Jeder Inhaltsbereich besitzt ein eigenes Schema und darf eigene Darstellungsfelder haben. Xcode darf daher nicht voraussetzen, dass ein Duʿāʾ oder Āṯar dieselben Felder wie ein Ḥadīṯ besitzt.

Für Ḥadīṯe gilt aktuell:

1. Überliefererzeile
2. kleiner Abstand
3. `Der Prophet ﷺ sagte:` und Aussage als zusammenhängender Textblock
4. kleiner Abstand
5. Quellenzeile
6. Markdown-Hervorhebungen werden als `AttributedString` gerendert

## Entwicklungsquelle

Aktuelle Raw-fähige Entwicklungsbranch:

`apple-tv-hadith-staging`

Nach ausdrücklicher Freigabe wird dieselbe Ordnerstruktur auf `main` übernommen.
