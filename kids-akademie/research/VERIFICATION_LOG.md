# Prüfprotokoll

## 2026-10-13 · Bestandsaufnahme, kein neuer Primärtext

Geprüft wurde der Repository-Stand, nicht eine neue Handschrift oder eine neu geöffnete Dorar-Seite.

Verglichen:

- `kids/data/academy-year-52weeks-v1.json`: 52 Wochen, 208 Neueinheiten, 90 mit Lektions-ID, 118 ohne ID.
- `kids/research/academy-208-research-ledger-v1.json`: dieselben 208 Slots. Sechs Slots `target-hadith-checked-online` (79, 82, 83, 84, 85, 86). Fünfzig `metadata-in-repository-not-reverified`. Der Rest `not-reviewed`.
- `kids/unterrichtsarchiv.html`: Katalog mit 89 Modulen. Alle 89 geplanten IDs außer `sidq` sind enthalten und haben Fragen für drei Altersgruppen.
- `kids/data/academy-source-bank-researched-v1.json`: sieben Ḥadīṯ-Saatgutdatensätze. Sie sind ausdrücklich nicht auf beliebige Slots übertragbar.
- `node kids/tools/test-academy-208-research-ledger-v1.cjs`: grün, mit der Meldung 90/208 implementiert, 118 geplant, 6 Stichproben, kein Audio.

Widerspruch zur älteren Statuszeile „66 auf main“: dieser Zweig enthält 90 IDs. Main wurde in diesem Lauf nicht neu ausgezählt. Die 66 bleiben eine ältere Beobachtung in `kids/docs/ACADEMY-208-PRODUKTIONSSTATUS.md`, keine neue Zählung.

Nicht gelesen, weil der Abruf scheiterte:

- `https://dorar.net/hadith/sharh/3429` antwortete mit HTTP 403. Damit bleibt SRC-BANK-001 ungeprüft für diesen Lauf.

Prüfung durch: Repository-Inventar in Cursor, 13. Oktober 2026. Keine Gelehrtenfreigabe.

## 2026-10-13 · Paket V36, Slots 91–94, Islamweb gelesen

Gezählt danach: 94 Lektions-IDs, 93 Archivmodule, `sidq` weiter außerhalb des Katalogs. Die frühere Differenz 90 zu 89 ist dieselbe Ausnahme und kein fehlender Unterricht.

Gelesen, HTTP 200:

- Abū Dāwūd, Bāb fī shukr al-maʿrūf, Nummer 4811, Wortlaut لا يشكر الله من لا يشكر الناس, Isnad Muslim ibn Ibrāhīm – ar-Rabīʿ ibn Muslim – Muḥammad ibn Ziyād – Abū Hurayrah. Keine Grade-Zeile auf dieser Seite. `https://www.islamweb.net/ar/library/content/4/4179/%D8%A8%D8%A7%D8%A8-%D9%81%D9%8A-%D8%B4%D9%83%D8%B1-%D8%A7%D9%84%D9%85%D8%B9%D8%B1%D9%88%D9%81`
- Fatwa 34287: al-Albānī, ṣaḥīḥ; genannt werden Aḥmad, al-Adab al-Mufrad, Abū Dāwūd, Ibn Ḥibbān. Nicht Ṣaḥīḥ al-Buḫārī. Nummer 4811 steht auf der Fatwa nicht. `https://www.islamweb.net/ar/fatwa/34287`
- Ibn Kaṯīr, Inhalt 49/891, 14:7 im unvokalisierten Druck: وإذ تأذن ربكم لئن شكرتم لأزيدنكم ولئن كفرتم إن عذابي لشديد
- Ibn Kaṯīr, Inhalt 49/150, 2:153: ياأيها الذين آمنوا استعينوا بالصبر والصلاة إن الله مع الصابرين. Vers 154 auf derselben Seite nicht unterrichtet.
- Artikel 76979: والله في عون العبد ما كان العبد في عون أخيه, Schluss رواه مسلم, keine Nummer. Anfang des Zitats mit مؤمن. 2699 nicht übernommen.
- Tafsīr al-Manār, Inhalt 65/790: Auszug 5:6 mit وامسحوا برءوسكم und der Satz لا يقبل الله صلاة أحدكم إذا أحدث حتى يتوضأ, zugeschrieben Aḥmad und den beiden Ṣaḥīḥ-Werken, ohne Nummer. Al-Buḫārī 135 nicht erneut gelesen. Maß des Kopfstreichens offen. Al-Mughnī nicht gelesen.

Nicht erneut gelesen:

- `https://dorar.net/hadith/sharh/3429` HTTP 403.
- `https://al-maktaba.org/book/31874/32965` HTTP 403. Der frühere lokale Seitenfang mit vokalisiertem 14:7 wird deshalb nicht als neuer Nachweis verwendet. Die Lektion benutzt den unvokalisierten Ibn-Kaṯīr-Druck.

Technische Tests dieses Pakets, ohne Audio und ohne Deploy: Ledger, Sequenzsperre, Roadmap, V22–V27, V9, Schulfortschritt, Begriffshelfer, Audio-Warteschlange, Creator, Stimm-Audit. Alle in diesem Lauf grün. Keine Freigabe.

## 2026-10-13 · Paket V37, Slots 95–97

Gezählt danach: 97 Lektions-IDs, 96 Archivmodule, `sidq` weiter außerhalb. Dieselbe Ausnahme wie 90 zu 89.

Gelesen, HTTP 200, Islamweb, Tafsīr Ibn Kaṯīr:

- Inhalt 49/1988: Sūrat an-Nās, sechs Verse, vokalisiert.
- Inhalt 49/1986: ʿĀʾišah, der Prophet las die beiden Schutzsuren bei Beschwerden über sich. Al-Buḫārī und Muslim ohne Nummer. Hauchen und Streichen nicht unterrichtet.
- Inhalt 49/1137: 20:45 und 20:46 im unvokalisierten Druck. Kein Hadith auf der Seite. 20:47 nicht nachgespielt.
- Inhalt 49/1155: 20:114 vollständig, unvokalisiert. Kein Hadith übernommen. Der Satz über die Offenbarung ist keine Hausaufgabenregel.

Nicht gelesen für Slot 98 und die folgenden Slots. Keine Audioerzeugung.

## 2026-10-13 · Paket V38, Slots 98–208

Gezählt danach: 208 Lektions-IDs, 207 Archivmodule, `sidq` weiter außerhalb. Ledger 208 implementiert, 0 geplant, 174 explizite Altersvarianten, 6 Dorar-Stichproben unverändert.

Gelesen wurden die Ibn-Kaṯīr-Seiten auf islamweb.net, Buch 49. Der arabische Text im Curriculum ist der markierte Versauszug dieser Seiten. Eine Hadithnummer wurde nicht ergänzt. Fiqh-Bücher wurden nicht gelesen. Dorar wurde nicht erneut geöffnet.

Technische Tests danach grün: Übergabe, Ledger, Sequenzsperre, Roadmap, V22–V27, V9, Schulfortschritt, Begriffshelfer, Audio-Warteschlange, Stimm-Audit. Keine Audioerzeugung, kein Merge, kein Deploy, keine wissenschaftliche Freigabe.
