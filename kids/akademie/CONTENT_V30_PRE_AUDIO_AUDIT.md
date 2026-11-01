# TAWḤĪD KIDS · Lernakademie V30 · Quelleninventar und Stand vor Audio

**Stand: 01.11.2026 | Entwicklungszweig PR #1588 | noch nicht veröffentlicht | keine Audioerzeugung**

## Prüfbarer Inhaltsstand

- Bestehende `kids/akademie/index.html` (einschließlich der acht Ṣidq-Einstiegsfragen) unverändert; keine CSS-, HTML-, Navigations-, Profil- oder Architekturänderungen.
- Insgesamt **66 Lektionen**: 65 Curriculumeinträge plus 1 fest integrierte Ṣidq-Einführung.
- Insgesamt **528 Altersfragen**: 520 Curriculumsfragen (130 / 195 / 195) plus 8 Ṣidq-Fragen (2 / 3 / 3).
- **295 von 520 Curriculums-Frageslots inhaltlich überarbeitet**; die übrigen **246** unverändert belassen, weil bestehende Aufgaben bereits thematisch konkret waren.
- **33 bisher nicht altersgetrennte Curriculum-Lektionen** haben nun bestehende `ageText`-Felder für 4–5, 6–8, 9–10. Damit weisen alle 65 Curriculumeinträge Altersfassungen auf.
- Mechanische Kompatibilitätsprüfung erfolgreich: IDs, Reihenfolge, Anzahl, Typen, religiöse Originalreferenzen, Audiofreigabewerte, alle anderen bestehenden Lektionsfelder sind unverändert.
- Der V30-Inhalt liegt innerhalb der bestehenden `curriculum-v29.js` und verwendet nur bekannte Datenfelder. Er enthält keine neue UI, keine neue Navigation, keine neuen APIs oder TTS-Dienste.
- Die freistehende reproduzierbare Node-Prüfung befindet sich unter `kids/tools/test-academy-content-v30.cjs`.

## Wesentliche fachliche Grenze

**Strukturprüfung ≠ vollständige religionswissenschaftliche Zertifizierung.** Der Qurʾān- und Sunnah-Wortlaut, die Hadith-Fundstellen sowie bestehende Arabisch-/Fuṣḥā-Bestandteile wurden für diesen V30-Lauf absichtlich nicht umgeschrieben. Das verhindert neue Mutationen, ersetzt aber keine unabhängige vollständige Quellen- und Ausspracheprüfung. Insbesondere dürfen `religiousSourcesVerified`-Metadaten alter Pakete nicht als neue menschliche Freigabe interpretiert werden.

Alle neuen deutschen Erklärungssätze und Beispiele sind Unterrichtssprache; niemals als wörtliche Rede Allahs, des Propheten ﷺ, der Ṣaḥābah oder der Salaf zu vertonen.

## Nachvollzogene Stichproben (noch keine Vollfreigabe)

- [Ṣaḥīḥ al-Buḫārī 1469](https://sunnah.com/bukhari:1469): Geduld, Geduld einüben, Wert der Geduld. Die im Curriculum enthaltene pädagogische Kurzfassung erfindet kein eigenes Prophetenzitat.
- [Ṣaḥīḥ Muslim 2692](https://sunnah.com/muslim:2692): morgendlicher/abendlicher Ḏikr. Die spezifische überlieferte Wiederholungszahl darf bei der Erklärung für Kinder nicht irreführend als Pflicht dargestellt werden.
- [Ṣaḥīḥ al-Buḫārī 6116](https://sunnah.com/bukhari:6116): Ermahnung über Wut; didaktische Schutz- und Hilferegeln sind eine separate pädagogische Anwendung.
- [Ṣaḥīḥ al-Buḫārī 7410](https://sunnah.com/bukhari:7410): Nūḥ wird im Rahmen eines längeren Berichts über die Fürsprache am Tag der Auferstehung genannt. Die kindgerechte Nūḥ-Lektion darf nicht so formuliert sein, als stünde die gesamte Unterrichtsgeschichte in diesem Ḥadīṯ.
- [Ṣaḥīḥ Muslim 2699a](https://sunnah.com/muslim:2699a): Hilfe für andere, Erleichterung einer Schwierigkeit. Die Übung „Helfen ohne Geschenk“ ist keine wörtliche Formulierung dieses Ḥadīṯ.

## Inventar aller 66 Lektionen

| Nr. | Lektion | Qurʾān in Quelle | Sunnah in Quelle | Fachliche Neu-Freigabe |
| --- | --- | --- | --- | --- |
| 01 | Ṣidq – Wahrhaftigkeit | 9:119 | Muslim 2607a | Altbestand; Quellen-Endabnahme offen |
| 02 | Ṣabr – Geduld | 2:153 | Ṣaḥīḥ al-Buḫārī, Nr. 1469 | Unveränderte Altreferenz; externe Endabnahme offen |
| 03 | Amānah – Vertrauen | 23:8 | Ṣaḥīḥ al-Buḫārī, Nr. 33 | Unveränderte Altreferenz; externe Endabnahme offen |
| 04 | Salām – Grüßen | 4:86 | Ṣaḥīḥ Muslim, Nr. 54a | Unveränderte Altreferenz; externe Endabnahme offen |
| 05 | Gute Worte | 17:53 | Ṣaḥīḥ al-Buḫārī, Nr. 6018 | Unveränderte Altreferenz; externe Endabnahme offen |
| 06 | Respekt und Fürsorge | 17:23 | Ṣaḥīḥ al-Buḫārī, Nr. 5971 | Unveränderte Altreferenz; externe Endabnahme offen |
| 07 | Ṭahārah – Reinheit | 74:4 | Ṣaḥīḥ Muslim, Nr. 223 | Unveränderte Altreferenz; externe Endabnahme offen |
| 08 | Wuḍūʾ – Gebetswaschung | 5:6 (Auszug) | Ṣaḥīḥ al-Buḫārī, Nr. 135 | Unveränderte Altreferenz; externe Endabnahme offen |
| 09 | Ṣalāh – das Gebet | 20:14 | Ṣaḥīḥ al-Buḫārī, Nr. 631 | Unveränderte Altreferenz; externe Endabnahme offen |
| 10 | Tawḥīd – Allah allein | 112:1 | Ṣaḥīḥ al-Buḫārī, Nr. 2856 | Unveränderte Altreferenz; externe Endabnahme offen |
| 11 | Īmān – Glaube | 2:3 | Ṣaḥīḥ Muslim, Nr. 8a (Ḥadīṯ Ǧibrīl) | Unveränderte Altreferenz; externe Endabnahme offen |
| 12 | Ikhlāṣ – Aufrichtigkeit | 39:11 | Ṣaḥīḥ al-Buḫārī, Nr. 1 | Unveränderte Altreferenz; externe Endabnahme offen |
| 13 | Geduldig warten · Warten ohne Streit | 2:153 | Ṣaḥīḥ al-Buḫārī, Nr. 1469 | Unveränderte Altreferenz; externe Endabnahme offen |
| 14 | Nicht aufgeben · Geduld beim Üben | 2:153 | Ṣaḥīḥ al-Buḫārī, Nr. 1469 | Unveränderte Altreferenz; externe Endabnahme offen |
| 15 | Geliehene Dinge · Amānah im Alltag | 23:8 | Ṣaḥīḥ al-Buḫārī, Nr. 33 | Unveränderte Altreferenz; externe Endabnahme offen |
| 16 | Mein Versprechen · Zuverlässig sein | 23:8 | Ṣaḥīḥ al-Buḫārī, Nr. 33 | Unveränderte Altreferenz; externe Endabnahme offen |
| 17 | Salām erwidern · Freundlich antworten | 4:86 | Ṣaḥīḥ Muslim, Nr. 54a | Unveränderte Altreferenz; externe Endabnahme offen |
| 18 | Zuerst grüßen · Frieden verbreiten | 4:86 | Ṣaḥīḥ Muslim, Nr. 54a | Unveränderte Altreferenz; externe Endabnahme offen |
| 19 | Bei Streit sprechen · Freundliche Worte | 17:53 | Ṣaḥīḥ al-Buḫārī, Nr. 6018 | Unveränderte Altreferenz; externe Endabnahme offen |
| 20 | Erst nachdenken · Schön sprechen | 17:53 | Ṣaḥīḥ al-Buḫārī, Nr. 6018 | Unveränderte Altreferenz; externe Endabnahme offen |
| 21 | Eltern zuhören · Mit Respekt sprechen | 17:23 | Ṣaḥīḥ al-Buḫārī, Nr. 5971 | Unveränderte Altreferenz; externe Endabnahme offen |
| 22 | Hilfsbereit sein · Für andere da sein | 17:23 | Ṣaḥīḥ al-Buḫārī, Nr. 5971 | Unveränderte Altreferenz; externe Endabnahme offen |
| 23 | Saubere Kleidung · Reinheit beachten | 74:4 | Ṣaḥīḥ Muslim, Nr. 223 | Unveränderte Altreferenz; externe Endabnahme offen |
| 24 | Sauberer Lernplatz · Ordnung und Reinheit | 74:4 | Ṣaḥīḥ Muslim, Nr. 223 | Unveränderte Altreferenz; externe Endabnahme offen |
| 25 | Gesicht und Arme · Wuḍūʾ kennenlernen | 5:6 (Auszug) | Ṣaḥīḥ al-Buḫārī, Nr. 135 | Unveränderte Altreferenz; externe Endabnahme offen |
| 26 | Kopf und Füße · Wuḍūʾ verstehen | 5:6 (Auszug) | Ṣaḥīḥ al-Buḫārī, Nr. 135 | Unveränderte Altreferenz; externe Endabnahme offen |
| 27 | Allah gedenken · Warum wir beten | 20:14 | Ṣaḥīḥ al-Buḫārī, Nr. 631 | Unveränderte Altreferenz; externe Endabnahme offen |
| 28 | Gebet lernen · Vom Propheten lernen | 20:14 | Ṣaḥīḥ al-Buḫārī, Nr. 631 | Unveränderte Altreferenz; externe Endabnahme offen |
| 29 | Allah ist Einer · Tawḥīd verstehen | 112:1 | Ṣaḥīḥ al-Buḫārī, Nr. 2856 | Unveränderte Altreferenz; externe Endabnahme offen |
| 30 | Nur Allah anbeten · Allahs Recht | 112:1 | Ṣaḥīḥ al-Buḫārī, Nr. 2856 | Unveränderte Altreferenz; externe Endabnahme offen |
| 31 | Die Engel · Grundlagen des Īmān | 2:3 | Ṣaḥīḥ Muslim, Nr. 8a (Ḥadīṯ Ǧibrīl) | Unveränderte Altreferenz; externe Endabnahme offen |
| 32 | Die Gesandten · Glaube an Gesandte | 2:3 | Ṣaḥīḥ Muslim, Nr. 8a (Ḥadīṯ Ǧibrīl) | Unveränderte Altreferenz; externe Endabnahme offen |
| 33 | Gutes ohne Lob · Aufrichtig helfen | 39:11 | Ṣaḥīḥ al-Buḫārī, Nr. 1 | Unveränderte Altreferenz; externe Endabnahme offen |
| 34 | Gute Absichten · Warum ich etwas tue | 39:11 | Ṣaḥīḥ al-Buḫārī, Nr. 1 | Unveränderte Altreferenz; externe Endabnahme offen |
| 35 | Bismillāh · Tischsitten | 7:31 (Auszug) | Ṣaḥīḥ al-Buḫārī, Nr. 5376; Ṣaḥīḥ Muslim, Nr. 2022 | Unveränderte Altreferenz; externe Endabnahme offen |
| 36 | Tiere schützen · Raḥmah | 6:38 (Auszug) | Ṣaḥīḥ al-Buḫārī, Nr. 2363; Ṣaḥīḥ Muslim, Nr. 2244 | Unveränderte Altreferenz; externe Endabnahme offen |
| 37 | Nachbarn · Freundlich und rücksichtsvoll | 4:36 (Auszug) | Ṣaḥīḥ al-Buḫārī, Nr. 6014; Ṣaḥīḥ Muslim, Nr. 2624 | Unveränderte Altreferenz; externe Endabnahme offen |
| 38 | Duʿāʾ · Allah um Hilfe bitten | 1:5 | Ṣaḥīḥ al-Buḫārī, Nr. 6340; Ṣaḥīḥ Muslim, Nr. 2735 | Unveränderte Altreferenz; externe Endabnahme offen |
| 39 | Tawḥīd · Allahs Recht | 51:56 | Ṣaḥīḥ al-Buḫārī, Nr. 2856; Ṣaḥīḥ Muslim, Nr. 30 · überliefert von Muʿāḏ ibn Ǧabal | Unveränderte Altreferenz; externe Endabnahme offen |
| 40 | Īmān · Die sechs Grundlagen | 2:285 (Auszug) | Ṣaḥīḥ Muslim, Nr. 8 · Ḥadīṯ Ǧibrīl, überliefert von ʿUmar ibn al-Ḫaṭṭāb | Unveränderte Altreferenz; externe Endabnahme offen |
| 41 | Ikhlāṣ · Warum tue ich Gutes? | 98:5 (Auszug) | Ṣaḥīḥ al-Buḫārī, Nr. 1; Ṣaḥīḥ Muslim, Nr. 1907 · überliefert von ʿUmar ibn al-Ḫaṭṭāb | Unveränderte Altreferenz; externe Endabnahme offen |
| 42 | Akhlāq · Stärke bei Wut | 3:134 (Auszug) | Ṣaḥīḥ al-Buḫārī, Nr. 6114; Ṣaḥīḥ Muslim, Nr. 2609 · überliefert von Abū Hurayrah | Unveränderte Altreferenz; externe Endabnahme offen |
| 43 | Adab · Anklopfen und Privatsphäre | 24:27 (Auszug) | Ṣaḥīḥ al-Buḫārī, Nr. 6245; Ṣaḥīḥ Muslim, Nr. 2153 · überliefert von Abū Saʿīd al-Ḫudrī | Unveränderte Altreferenz; externe Endabnahme offen |
| 44 | Tarbiyah · Lernen ohne Überforderung | 20:132 (Auszug) | Ṣaḥīḥ al-Buḫārī, Nr. 69; Ṣaḥīḥ Muslim, Nr. 1734 · überliefert von Anas ibn Mālik | Unveränderte Altreferenz; externe Endabnahme offen |
| 45 | Tazkiyat an-Nafs · Das Herz pflegen | 91:9 | Ṣaḥīḥ Muslim, Nr. 2564 · überliefert von Abū Hurayrah | Unveränderte Altreferenz; externe Endabnahme offen |
| 46 | Ṭahārah · Reinheit verstehen | 5:6 (Auszug) | Ṣaḥīḥ Muslim, Nr. 223 · Abū Mālik al-Ashʿarī | Unveränderte Altreferenz; externe Endabnahme offen |
| 47 | Qurʾān · Allahs Wort achten | 2:2 | Ṣaḥīḥ al-Buḫārī, Nr. 5027 · ʿUṯmān ibn ʿAffān | Unveränderte Altreferenz; externe Endabnahme offen |
| 48 | Ādam · Allah erschuf den ersten Menschen | 3:59 | Ṣaḥīḥ al-Buḫārī, Nr. 3326 · Abū Hurayrah | Unveränderte Altreferenz; externe Endabnahme offen |
| 49 | Morgen-Ḏikr · Allah loben | 33:41 | Ṣaḥīḥ Muslim, Nr. 2692 · Abū Hurayrah | Unveränderte Altreferenz; externe Endabnahme offen |
| 50 | Eltern · Güte und Respekt | 17:23 (Auszug) | Ṣaḥīḥ al-Buḫārī, Nr. 5971; Ṣaḥīḥ Muslim, Nr. 2548 · Abū Hurayrah | Unveränderte Altreferenz; externe Endabnahme offen |
| 51 | Tawḥīd · Allah erschuf die Tiere | 16:5 (Auszug) | Ṣaḥīḥ al-Buḫārī, Nr. 2363; Ṣaḥīḥ Muslim, Nr. 2244 · Abū Hurayrah | Unveränderte Altreferenz; externe Endabnahme offen |
| 52 | Īmān · Ich glaube an Allah | 2:285 (Auszug) | Ṣaḥīḥ Muslim, Nr. 8 · überliefert von ʿUmar ibn al-Khaṭṭāb | Unveränderte Altreferenz; externe Endabnahme offen |
| 53 | Ikhlāṣ · Lernen mit guter Absicht | 98:5 (Auszug) | Ṣaḥīḥ al-Buḫārī, Nr. 1 · ʿUmar ibn al-Khaṭṭāb | Unveränderte Altreferenz; externe Endabnahme offen |
| 54 | Akhlāq · Wir teilen gerecht | 16:90 (Auszug) | Ṣaḥīḥ al-Buḫārī, Nr. 2587; Ṣaḥīḥ Muslim, Nr. 1623 · an-Nuʿmān ibn Bašīr | Unveränderte Altreferenz; externe Endabnahme offen |
| 55 | Adab · Erst fragen, dann schauen | 24:27 (Auszug) | Ṣaḥīḥ al-Buḫārī, Nr. 6241; Ṣaḥīḥ Muslim, Nr. 2156 · Sahl ibn Saʿd | Unveränderte Altreferenz; externe Endabnahme offen |
| 56 | Tarbiyah · Gut auf meine Sachen achten | 17:34 (Auszug) | Ṣaḥīḥ al-Buḫārī, Nr. 893; Ṣaḥīḥ Muslim, Nr. 1829 · ʿAbdullāh ibn ʿUmar | Unveränderte Altreferenz; externe Endabnahme offen |
| 57 | Tazkiyat an-Nafs · Bei Wut sicher bleiben | 3:134 (Auszug) | Ṣaḥīḥ al-Buḫārī, Nr. 6116 · Abū Hurayrah | Unveränderte Altreferenz; externe Endabnahme offen |
| 58 | Fiqh · So übe ich Wuḍūʾ | 5:6 (Auszug) | Ṣaḥīḥ al-Buḫārī, Nr. 164; Ṣaḥīḥ Muslim, Nr. 226 · ʿUṯmān ibn ʿAffān | Unveränderte Altreferenz; externe Endabnahme offen |
| 59 | Qurʾān · Al-Fātiḥah verstehen | 1:2 | Ṣaḥīḥ al-Buḫārī, Nr. 4474 · Abū Saʿīd ibn al-Muʿallā | Unveränderte Altreferenz; externe Endabnahme offen |
| 60 | Sīrah · Nūḥ und seine Geduld | 71:5 | Ṣaḥīḥ al-Buḫārī, Nr. 7410; Ṣaḥīḥ Muslim, Nr. 193 · Anas ibn Mālik | Unveränderte Altreferenz; externe Endabnahme offen |
| 61 | Duʿāʾ · Abends an Allah denken | 33:41 | Ṣaḥīḥ Muslim, Nr. 2723 · ʿAbdullāh ibn Masʿūd | Unveränderte Altreferenz; externe Endabnahme offen |
| 62 | Familie · Wir helfen einander | 5:2 (Auszug) | Ṣaḥīḥ al-Buḫārī, Nr. 6026; Ṣaḥīḥ Muslim, Nr. 2585 · Abū Mūsā al-Ashʿarī | Unveränderte Altreferenz; externe Endabnahme offen |
| 63 | Tawḥīd · Allah lässt Pflanzen wachsen | 6:99 (Auszug) | Ṣaḥīḥ al-Buḫārī, Nr. 2320; Ṣaḥīḥ Muslim, Nr. 1553 · Anas ibn Mālik | Unveränderte Altreferenz; externe Endabnahme offen |
| 64 | Īmān · Ich glaube an Allahs Engel | 2:285 (Auszug) | Ṣaḥīḥ Muslim, Nr. 8 · ʿUmar ibn al-Khaṭṭāb (Ḥadīṯ Ǧibrīl) | Unveränderte Altreferenz; externe Endabnahme offen |
| 65 | Ikhlāṣ · Gutes tun ohne Gegenleistung | 76:9 | Ṣaḥīḥ Muslim, Nr. 2699 · Abū Hurayrah | Unveränderte Altreferenz; externe Endabnahme offen |
| 66 | Akhlāq · Fehler ehrlich zugeben | 33:70 | Ṣaḥīḥ al-Buḫārī, Nr. 6094; Ṣaḥīḥ Muslim, Nr. 2607 · ʿAbdullāh ibn Masʿūd | Unveränderte Altreferenz; externe Endabnahme offen |

## Übergabe an die anschließende Audiophase

1. Quelleninventar und alle neu formulierten deutschen Texte durch fachkundige muslimische Prüfer finalisieren und als freigegebene Sprechvorlage markieren.
2. Alle Terminologie-Aussprachen (u. a. ʿIbādah, Wuḍūʾ, Ṭahārah, Tawḥīd, Ikhlāṣ, Ṣabr, Ṣidq, Īmān, Salām, Ḏikr, Duʿāʾ, Raḥmah, Tarbiyah, Sīrah) gegen die bestehende Aussprachebibliothek/Fuṣḥā freigeben.
3. Bei Qurʾān ausschließlich vorhandenen authentischen Rezitator samt vollständigem Vers benutzen; keine synthetische Qurʾān-Rezitation erzeugen.
4. Später ElevenLabs/andere gesprochene Texte nur nach ausdrücklicher erneuter Nutzerfreigabe; vorher Kostenbudget, Deduplikation, Voice-Master, Aussprache und Hörproben bestätigen.
5. Nach Audioerstellung getrennte Hörprüfung pro Alter und Fragetyp mit vollständig synchroner App-Wiedergabe durchführen.

**Aktueller Stopp:** Audio nicht begonnen; keine Synthesekosten angefallen. PR #1588 bleibt Draft bis Quellenprüfung, Test-App-/Integrationscheck und ausdrücklicher Veröffentlichungsfreigabe.

## Fachlicher Quellenreview / 01.11.2026

Ein eigenständiges 66-Lektionen-Fachgutachten einschließlich Primärquellenlinks, früher Tafsīr-Auslegung und sauberer Grenze zwischen Offenbarung / Sunnah / Unterrichtsanwendung wurde ergänzt:

- `kids/akademie/ISLAMIC_SCHOLARLY_CONTENT_REVIEW_V30_2026-11-01.md`
- `kids/tools/test-academy-islamic-source-review-v30.cjs`

**Konkrete Korrekturen:** Der deutsche Unterrichtsauszug zu Qurʾān 5:6 unterscheidet jetzt klar das Streichen über den Kopf vom Waschen der Füße (gestützt durch die ʿUṯmān-Wuḍūʾ-Überlieferung, al-Buḫārī 164). Der vorher falsch zugeordnete Sekundärlink über Niyyah, der eine andere als munkar bewertete Erzählung betraf, wurde auf einen passenden Nachweis der authentischen Überlieferung bei al-Buḫārī 1 (ʿUmar) korrigiert. Weitere zuvor nicht genau passende Sekundärlinks sind zu direkten Ṣaḥīḥ-Fundstellen geändert.

**Prüfungen bestanden:** Struktur-/Inhaltsregression und Quellen-/Sperrenregression für die geladene Lernakademie mit unveränderten 66 Lektionen und 528 Frageslots. Diese Regressionen wurden als aus den echten GitHub-Dateien gelesene JavaScript-Tests ausgeführt; regulärer Node-Lauf im GitHub-CI und reale Gerätetests müssen separat bestätigt werden.

**Präzise Freigabegrenze:** Die AI-unterstützte Primärquellenkontrolle und klassische Tafsīr-Gegenprüfung sind dokumentiert. Weder eine unabhängige menschliche ʿĀlim-/Muftī-Begutachtung noch eine vollständige Isnād-Kollation sämtlicher 43 Hadith-Zitationsstrings oder vollständige diakritische Zeichen-für-Zeichen-Kollation aller Qurʾān-Wortlaute darf als abgeschlossen bezeichnet werden. Keine Veröffentlichung und kein Audio ohne gesonderte Freigabe.


### Redaktionelle Fortsetzung: Runde 2 (01.11.2026)

- Stand: **295 von 520** Curriculum-Frageslots gegenüber dem unveränderten Ausgangskanon überarbeitet, die übrigen 225 bleiben erhalten. Das ersetzt die vorherige Zählung 274; es sind nicht 295 neue Fragen, sondern inhaltliche Änderungen an vorhandenen Slots.
- Davon zusätzlich kindgerechte Fragen für 4–5-Jährige, **49 Musterantworten sprachlich bereinigt** und **zehn 6–8-Jahre-Fragen über ʿAqīdah** quellenbezogen überarbeitet; keine Aussagen über das Verborgene hinzuerfunden.
- Besonders wichtig: In der aktuellen Auswahl für Engel/Gesandte wird der Qurʾān-Beleg **2:3** vom ausdrücklich nennenden **Ḥadīṯ Ǧibrīl, Muslim 8a**, unterschieden.
- Fachliche Primärquellen-Vergleichstabelle mit konkreten Prüfpunkten: `kids/akademie/ISLAMIC_SOURCE_REVIEW_ROUND2_2026-11-01.md`.
- Audioproduktion weiterhin ausdrücklich **nicht begonnen**; Draft-PR bleibt ungemergt.
