# DĀR AL TAWḤĪD – Apple TV Ḥadīṯ

Dieser Bereich ist ausschließlich für die Apple-TV/tvOS-Ḥadīṯ-Datenbank bestimmt.

## Feste Darstellung

1. Überliefererzeile, z. B. `Abū Hurayrah berichtete:`
2. kleiner Abstand
3. `Der Prophet ﷺ sagte:` und der Ḥadīṯ bilden **einen zusammenhängenden Textblock**; nach dem Doppelpunkt keine zusätzliche Leerzeile
4. kleiner Abstand
5. Quellenzeile

## Formatierung

`textMarkdown` ist die kanonische Anzeigeversion.

- `**Text**` = fett
- `*Text*` = kursiv

Die tvOS-App muss Markdown als `AttributedString` rendern, damit wichtige Wörter sichtbar hervorgehoben werden.

## IDs

IDs werden niemals neu vergeben oder verschoben.

- Serie 1: `HAD-0001` bis `HAD-0050`
- nächste Serie: `HAD-0051` bis `HAD-0100`

## Dateien

- `series/001-050/` – erste 50 authentische Ḥadīṯe, jeder Datensatz einzeln
- `series/001-050/index.json` – Reihenfolge der Serie
- `manifest.json` – globale Metadaten
- `xcode/` – Swift/tvOS-Modelle und Beispielansicht

Es werden nur authentische Ḥadīṯe aufgenommen. Bei Werken außerhalb von Ṣaḥīḥ al-Buḫārī und Ṣaḥīḥ Muslim muss die Authentizität des einzelnen Ḥadīṯes geprüft werden.