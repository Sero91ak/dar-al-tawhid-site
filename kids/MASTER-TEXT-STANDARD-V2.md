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
- **Dauerhafter Bestandsschutz:** Bereits freigegebene, aufgenommene Master-Audios und die exakt dazugehörigen Master-Texte sind richtig und bleiben unverändert. Keine Neuaufnahme, keine Neugenerierung, keine Nachvertonung, keine Text- oder Timing-Anpassung, keine automatische v2-Migration dieser Paare. Bestehende Hören-/Mitlesen-/Offline-Daten bleiben synchron. Nur bei einem **neuen ausdrücklichen Einzelauftrag des Eigentümers** darf ein vorhandenes Paar überhaupt zur Bearbeitung freigegeben werden.

## 4. Migration am 17.10.2026

- `kids/data/deen-lessons.json`: 6 Hauptlektionen, alle drei `scripts` identisch zum jeweiligen Master.
- `kids/data/deen-curriculum-v1.json`: 24 veröffentlichte Folgemodule mit eigenem Master-Text.
- `kids/data/salaf-library-v1.json`: 34 redaktionell hinterlegte Geschichten, unveränderte Veröffentlichungs- und Belegprüfungen.
- `kids/data/stories-authentic.json`: 4 weitere geprüfte Textgeschichten sowie das eingebettete Story-Standard-Feld.
- `voice-studio/content-studio.js`: Abschlussregel für **neue** Kinder-Mastertexte. Bereits existierende Story-Ziele sind absichtlich ausgenommen.

**Endgültige Festlegung des Eigentümers (17.10.2026):** Die bereits vertonten Propheten-, Ṣaḥābah- und Ṣaḥābiyyāt-Archive bleiben **dauerhaft unverändert**. Die vorhandenen Texte sind richtig; die Original-Audios werden nicht mehr geändert oder neu produziert. Die v2-Regel wird nicht rückwirkend darauf angewandt. Bestehende Paare sind von künftigen globalen Text-Normalisierungen ausdrücklich ausgenommen.

## 5. Qualitätsgates

`node scripts/kids-master-text-standard-v2-check.js` muss ohne Fehler durchlaufen. Zusätzlich vor Freigabe prüfen: vollständigen Salām, keine doppelte Schlussformel, identische Skripte je Altersgruppe, Ton-Text-Gleichheit und verlässliche Quellen.


## 6. Lernakademie – vollständiger Salām in allen aktiven Kinderprofilen (29.10.2026)

**Eigentümerregel:** Bei jeder von der KIDS-Lernakademie ausgegebenen **islamischen Begrüßung oder Abschiedsgrußformel** wird die festgelegte vollständige Form in UI, Lehrtext und Vorleseauftrag unverändert ausgeschrieben:

> As-Salāmu ʿalaykum wa Raḥmatullāhi wa Barakātuh.

- **Niemals** nur „As-Salāmu ʿalaykum“, „Salām“ oder die auf „ʿalaykum“ verkürzte Grußform als Ersatz für die volle Begrüßung ausgeben; die Anrede folgt **separat**.
- Jungenprofil: „Lieber Bruder.“; Mädchenprofil: „Liebe Schwester.“. Vorhandene optionale Profilnamen erst in der Anrede, nicht zwischen Bestandteilen der vollständigen Grußformel einfügen.
- Alle Altersstufen 4–5, 6–8, 9–10: derselbe vollständige Salām. Bei schmalen Displays natürlich über mehrere Zeilen umbrechen, **nie abschneiden, verkleinern bis unlesbar oder mit Auslassungspunkten ersetzen**.
- Neue ElevenLabs-V4-Aufnahmen: **erst nach** exakt abgeglichenem Volltext, Fuṣḥā-Hörprüfung und Eigentümerfreigabe. Die bekannte, unfreigegebene alte `As-salāmu ʿalaykum, liebe Schwester.`-Pilotaufnahme ist **keine** freigegebene Aufnahme der vollständigen Formel; darf nicht im Academy-Begrüßungsknopf abgespielt werden. Bereits bezahlte Binärdateien und Prüfarchive nicht umschreiben.
- **Quellenschutz:** Qurʾān-Original, authentische Ḥadīṯ-Zitate, historische Quellen und ältere bereits fertig freigegebene Ton-Text-Paare bleiben unverändert. Die Regel korrigiert die **redaktionellen Begrüßungen**, nicht wörtliche Belegtexte.
- Änderungs-/QA-Schutz: `node kids/tools/test-academy-full-salam-v1.cjs` prüft Junge/Mädchen, Online-UI, Vorlesetext, altersabhängige Lehrfragen und die Sperre der unvollständigen Archivaufnahme. Teststatus ersetzt keine echte menschliche Hörprüfung und keine iPhone/iPad-Sichtung.
