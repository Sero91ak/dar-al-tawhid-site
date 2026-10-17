# DĀR AL TAWḤĪD KIDS — verbindlicher Master-Text-Rahmen v2

Freigabe: 17.10.2026. Gilt für alle **neuen oder noch nicht vertonten** Kinder-Mastertexte, insbesondere Dīn, Salaf, belegte Geschichten, Qurʾān-Erklärungen und spätere Kategorien.

## 1. Einstieg
Jede Unterrichtserzählung beginnt mit dem vollständigen islamischen Gruß:

> As-Salāmu ʿalaykum wa Raḥmatullāhi wa Barakātuh.

Die anschließende Ansprache darf inhaltlich passen: „liebe Kinder“, „mein lieber Bruder, meine liebe Schwester“ oder eine freundlich formulierte Begrüßung zur Lektion. Keine doppelte Begrüßung, keine nur verkürzte Salām-Formel. Begrüßung darf variieren; sie muss nicht in jeder Lektion exakt identisch sein.

## 2. Wortgetreuer Schluss – NICHT variieren

> Und Allah, subḥānahu wa taʿālā, weiß es am besten.
>
> Möge Allah, subḥānahu wa taʿālā, uns nützliches Wissen schenken, euren Īmān stärken und euch al-Firdaws al-Aʿlā, die höchste Stufe des Paradieses schenken.
>
> As-Salāmu ʿalaykum wa Raḥmatullāhi wa Barakātuh.

**Keine** weitere Duʿāʾ-Variante, kein verkürzter Abschiedsgruß, kein zusätzliches „Āmīn“ nach dem vereinbarten Schluss. Die Formel ist ein redaktioneller Abschluss, kein als Offenbarung ausgegebenes wörtliches Zitat.

## 3. Eine einzige Masterfassung

- Ein vollständiger Mastertext je Lektion/Geschichte für 4–5, 6–8 und 9–10 Jahre sowie Mädchen- und Jungenprofil. Altersabhängige Oberfläche und Lernhilfen dürfen variieren; der Master-Wortlaut nicht.
- Unterrichtsinhalte, Originalbelege, Quellen sowie Quellen- und Authentizitätsstatus bleiben durch die Rahmenänderung unberührt.
- Master-Audio nur aus dem exakt freigegebenen Mastertext erzeugen bzw. zuordnen. Synchrones Mitlesen und Offline-Fassung müssen exakt dazu passen.
- Ein bereits genehmigtes, aufgenommenes Originalaudio wird **nicht** durch den Text-Fix ersetzt, stummgeschaltet oder stillschweigend abweichend untertitelt. Dieses Paar bleibt vorerst unangetastet und wird erst nach einer neuen passenden Aufnahme und Synchronisierung gemeinsam auf v2 umgestellt.

## 4. Migration am 17.10.2026

- `kids/data/deen-lessons.json`: 6 Hauptlektionen, alle drei `scripts` identisch zum jeweiligen Master.
- `kids/data/deen-curriculum-v1.json`: 24 veröffentlichte Folgemodule mit eigenem Master-Text.
- `kids/data/salaf-library-v1.json`: 34 redaktionell hinterlegte Geschichten, unveränderte Veröffentlichungs- und Belegprüfungen.
- `kids/data/stories-authentic.json`: 4 weitere geprüfte Textgeschichten sowie das eingebettete Story-Standard-Feld.
- `voice-studio/content-studio.js`: Abschlussregel für **neue** Kinder-Mastertexte. Bereits existierende Story-Ziele sind absichtlich ausgenommen.

Bereits vertonte Propheten-, Ṣaḥābah- und Ṣaḥābiyyāt-Archive bleiben aufgrund der Master-Audio-Text-Parität unverändert, bis passende Originalaufnahmen vorliegen.

## 5. Qualitätsgates

`node scripts/kids-master-text-standard-v2-check.js` muss ohne Fehler durchlaufen. Zusätzlich vor Freigabe prüfen: vollständigen Salām, keine doppelte Schlussformel, identische Skripte je Altersgruppe, Ton-Text-Gleichheit und verlässliche Quellen.
