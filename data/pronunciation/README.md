# DĀR AL TAWḤĪD – Aussprachebibliothek

Zentrale, provider-unabhängige Aussprachequelle für eigene Audio-/Stimmproduktionen.

## Bestand

- 901 kanonische Begriffe und Phrasen
- 3.719 konkrete Match-Regeln inklusive Schreibvarianten
- Alias-Lautschriften als robuste Synthese-Fallbacks
- IPA als phonetische Referenz
- W3C-PLS-Dateien für generische Sprachsysteme
- QA-Sätze für Hörtests

## Source of Truth

1. `pronunciation-rules.json` – Runtime-Quelle für Apps und Audiopipelines
2. `pronunciation-master.csv` – vollständige bearbeitbare Regelmatrix
3. `canonical-terms.csv` – kanonische Schreibweise, Alias, IPA und Priorität
4. `alias-master.pls` / `ipa-master.pls` – standardisierte PLS-Exporte

## Regel

Sichtbarer Text bleibt in wissenschaftlicher Transliteration, z. B. `Mūsā`, `Tawḥīd`, `ʿAqīdah`.
Für Sprachproduktion wird intern die Aussprachebibliothek herangezogen.

Bei Überschneidungen gilt: längere/spezifischere Regel zuerst.

## Eigene Stimme

Die Bibliothek ist nicht an einen externen TTS-Anbieter gebunden. Sie ist für DĀR AL TAWḤĪD Kids und die eigene Stimmproduktion vorgesehen. Fertige Eigenproduktionen sollen als Audio-Datei gespeichert werden; System-TTS bleibt nur Entwicklungs-/Fallbackpfad.

## Pflege

Neue Begriffe zuerst kanonisch prüfen. Danach Alias und IPA ergänzen, Varianten erzeugen und QA-Hörtest durchführen. Qurʾān-Rezitation wird nicht synthetisiert, sondern ausschließlich als echte Rezitation verwendet.

## Wissenschaftliche Verifikation

Zusätzlich zur Runtime-Bibliothek liegen drei Verifikationsdateien vor:

- `authoritative-sources.json` – Quellenhierarchie und zulässiger Verwendungszweck jeder Quelle
- `arabic-phoneme-reference.json` – breite klassisch-/standardarabische IPA-Referenz
- `brand-pronunciation-overrides.json` – ausdrücklich freigegebene Markenlesungen

Verifikationshierarchie:

1. explizite Markenfreigabe nur für exakt gelistete Brand-Strings,
2. Standard-/Klassisch-Arabische Phonologie,
3. Qurʾān-nahe phonetische Transkriptionsregeln, wo lexikalisch relevant,
4. wissenschaftliche Romanisierung nur zur Schreibweisenkontrolle,
5. sekundäre Lehrquellen nur als Zusatzbestätigung.

Wichtig: Kein externer Katalog wird als universelle „100-%-Aussprache“ behandelt. Dialekt, Allophonie, Kasus-/Pausalformen und verbundene Rede können die phonetische Realisierung verändern. Solche Fälle werden als Varianten oder Overrides dokumentiert, nicht still vereinheitlicht.

Für `DĀR AL TAWḤĪD` gilt die freigegebene Markenlesung `Daar al Tauhiid`. Sie ist bewusst von der regulären Sonnenbuchstaben-Assimilation in klassisch/standardarabischer verbundener Rede getrennt.

Prüfung:

```bash
node scripts/pronunciation/validate-pronunciation-library.mjs
node scripts/pronunciation/validate-authoritative-pronunciation.mjs
```
