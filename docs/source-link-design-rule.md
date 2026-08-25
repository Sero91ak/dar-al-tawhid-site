# DAR AL TAWḤĪD – Quellenlink-Designregel

Diese Regel gilt verbindlich für alle neuen `/q/`-Quellenseiten und Direktnachweis-Links.

## Farbsystem
- Quellenlinks und Quellenseiten verwenden die Dār-al-Layl-Farbkombination.
- Hauptfarben:
  - Hintergrund: `#080b0a`
  - Fläche: `#141916`
  - Text: `#f1ede3`
  - Gold: `#d8c18b`
  - helles Gold: `#e8d7b3`
  - Linien/Borders: `rgba(168,139,79,.32)`

## Pflicht-CSS
Alle neuen Quellenlinks nutzen die globale Datei:

```html
<link rel="stylesheet" href="/assets/q-source-dar-al-layl.css">
```

## Linkkarten
Jeder Direktnachweis wird als `.qsource-link` gebaut:

```html
<a class="qsource-link" href="...">
  <span class="qsource-icon">1</span>
  <span>
    <strong>Titel öffnen</strong>
    <span>kurzer Quellenhinweis</span>
  </span>
</a>
```

Für PDF/Scan:

```html
<a class="qsource-link is-pdf" href="...">...</a>
<a class="qsource-link is-scan" href="...">...</a>
```

## Wasserzeichen
Das Logo darf nicht als hart sichtbares PNG in den Hintergrund gesetzt werden. Es wird über CSS-Maskierung als echtes Wasserzeichen umgesetzt:

```css
-webkit-mask: var(--qs-logo) center/330px no-repeat;
mask: var(--qs-logo) center/330px no-repeat;
```

## Verboten
- keine rohen Statuszeilen wie „geprüfter Direktnachweis“ im sichtbaren Header
- keine billigen harten PNG-Hintergründe
- keine hellen Standardflächen für `/q/`-Seiten
- keine Social-Media-Texte unten; unten nur passende Icons
- keine unedlen grauen Trennlinien

## Struktur jeder Quellenseite
1. kompakter Header mit Logo, DAR AL TAWḤĪD und by Serhat Abu Malik
2. Thema/Titel
3. Originalwortlaut
4. Übersetzung
5. Isnād-Bereich
6. Hauptquellen/Fundstellen
7. Direktnachweise
8. PDF/Scan-Bereich
9. Prüfvermerk/Fazit, wenn nötig
10. Social-Icons unten
