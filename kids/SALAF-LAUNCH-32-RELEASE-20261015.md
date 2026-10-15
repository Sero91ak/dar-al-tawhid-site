# TAWḤĪD KIDS – Schätze der Salaf: verifizierbarer Startbestand

Redaktioneller, **nicht in der Kinder-App sichtbarer** Bestandbericht · 15.10.2026

## Ergebnis

- **32 Master-Geschichten** sind im GitHub-Katalog `kids/data/salaf-library-v1.json` mit `verification: approved` **und** `editorialRelease: true` freigegeben: genau 4 je 8 Kategorien.
- Weiterer Entwurf: 1 (nicht freigegeben; unsichtbar im Besucherbereich).
- **Eine einzige vollständige Mastererzählung** je Geschichte für die Altersstufen 4–5, 6–8, 9–10 und beide Profile.
- **0 Masteraudio-Dateien im Salaf-Katalog**, keine synthetischen Rezitationen und keine neuen bezahlten Generierungen. Die Hörfunktion kann erst mit echter genehmigter Datei funktionieren; bereits jetzt verfügbare Texte bleiben lesbar.
- Themen-/Historienauswahl: frühe sunnitische Gelehrte und Tābiʿīn, keine nicht eingeordneten oder vom Auftrag ausgeschlossenen Lehrgruppen; keine erfundenen Dialoge als historische Tatsachen.
- Verifikation des Auslieferungsstands: Der erfolgreiche Canonical-Cloudflare-Worker-Deploy [GitHub Action 38790283290](https://github.com/Sero91ak/dar-al-tawhid-site/actions/runs/38790283290) vom 15.10.2026 hatte Commit `0174523eb3afe956f33c1025327876f06b4cf494`. **Die in diesem Commit gespeicherte Katalog-Datei hat denselben Blob-SHA wie der aktuelle 32er-Bestand** (`dd9150606bcb59f61014e5da01b1fa714aba2c8d`). Das belegt den ausgelieferten Versionsstand der Datei. Ein unabhängiger Sicht-/Hörtest auf einem Besuchergerät ist dadurch nicht ersetzt.
- Der Katalog wird im Besucherskript mit `verification === approved && editorialRelease === true` gefiltert; `kids/sw.js` nutzt für den Salaf-Katalog Network-first. Die Quellendetails werden als Text, nicht als externe anklickbare Links ausgegeben.

## Bestehende Themen und Titel

### Barmherzigkeit & Helfen (4)
- Al-Layṯ und das großzügige Geschenk – Imām al-Layṯ ibn Saʿd (Tahdhīb al-Kamāl fī Asmāʾ ar-Riǧāl; Band 24, S. 274–275, Biographie von al-Layṯ ibn Saʿd – Bericht des Abū Ṣāliḥ)
- Ibn al-Mubārak und die Reisekasse – Imām ʿAbdullāh ibn al-Mubārak (Siyar Aʿlām an-Nubalāʾ; Bd. 8, S. 385–386: Bericht von ʿAlī ibn al-Ḥasan ibn Shaqīq, unmittelbar durch seinen Sohn Muḥammad ibn ʿAlī wiedergegeben; Reiseausgaben und zurückgegebene Geldbeutel.)
- Shuʿbah und das offene Herz – Imām Shuʿbah ibn al-Ḥaǧǧāǧ (Tahdhīb al-Kamāl fī Asmāʾ ar-Riǧāl; Bd. 12, S. 492–493, Biographie Shuʿbah ibn al-Ḥaǧǧāǧ. Direkte Aussagen seiner Schüler Muslim ibn Ibrāhīm, an-Naḍr ibn Shumayl und Yaḥyā al-Qaṭṭān über sein Geben und seine Freundlichkeit gegenüber Bedürftigen.)
- Az-Zuhrī und seine offenen Hände – Imām Muḥammad ibn Shihāb az-Zuhrī (Siyar Aʿlām an-Nubalāʾ; Bd. 5, Biographie Muḥammad ibn Shihāb az-Zuhrī. Abū Ṣāliḥ → al-Layṯ ibn Saʿd; al-Layṯ berichtet als Zeitzeuge von az-Zuhrīs Freigebigkeit, Essen für Gäste und dem Teilen vorhandener Mittel.)

### Ehrlichkeit & Vertrauen (4)
- Ar-Rabīʿ und die ehrliche Antwort – ar-Rabīʿ ibn Khuthaym (Siyar Aʿlām an-Nubalāʾ; Band 4, S. 258–261, Biographie ar-Rabīʿ ibn Khuthaym. Überlieferung Abū l-Aḥwaṣ → Saʿīd ibn Masrūq → al-Mundhir ath-Thawrī über die Antworten des ar-Rabīʿ auf Fragen.)
- Yūnus und das ehrlich verdiente Geld – Yūnus ibn ʿUbayd (Tahdhīb al-Kamāl fī Asmāʾ ar-Riǧāl; Bd. 32, S. 523, 531–532: Saʿīd ibn ʿĀmir → Asmāʾ ibn ʿUbayd, der Yūnus unmittelbar hörte: „laysa šayʾ aʿazz min šayʾayn: dirham ṭayyib wa raǧul yaʿmal ʿalā sunnah“.)
- Imām al-Bukhārī und die ehrliche Korrektur – Imām Muḥammad ibn Ismāʿīl al-Bukhārī (Taġlīq at-Taʿlīq ʿalā Ṣaḥīḥ al-Bukhārī; Bd. 5, S. 386–387, Kapitel Ḏikr manšaʾihī wa-ṭalabihī al-ḥadīṯ. Isnādkette zur Selbstschilderung al-Bukhārīs ist im Abschnitt ausgeschrieben; al-Bukhārī spricht über sein Alter von elf Jahren und die Korrektur 'az-Zubayr ibn ʿAdī' statt 'Abū az-Zubayr'.)
- Abū ʿĀṣim und die behütete Zunge – Imām Abū ʿĀṣim an-Nabīl (Siyar Aʿlām an-Nubalāʾ; Bd. 9, S. 482–483, Biographie Abū ʿĀṣim aḍ-Ḍaḥḥāk ibn Makhlad; Imām al-Bukhārī sagt ausdrücklich «samiʿtu Abā ʿĀṣim yaqūl: munḏu ʿaqaltu anna l-ġībah ḥarām mā iġtabtu aḥadan qaṭṭ».)

### Geduld & Sanftmut (4)
- Imām Aḥmad und die Standhaftigkeit – Imām Aḥmad ibn Ḥanbal (Ḥilyat al-Awliyāʾ; Bd. 9, S. 205–206, Abschnitt zu Imām Aḥmads Miḥnah. Abū Nuʿaym nennt den Bericht von Ṣāliḥ, dem Sohn des Imām, ausdrücklich die zuverlässigste ihm bekannte Überlieferung der Begebenheit; danach weitere historische Augenzeugenberichte und kritische Anmerkung zu einer abweichenden Hadithkette.)
- ʿUrwah und die geduldige Rückkehr – ʿUrwah ibn az-Zubayr (Siyar Aʿlām an-Nubalāʾ; Band 4, S. 426, Biographie ʿUrwah ibn az-Zubayr. Überlieferung Ḍamrah → Ibn Shawdhab, dass ʿUrwah regelmäßig einen Viertel des Qurʾān las und nur in einer besonders schweren Krankheitsnacht unterbrechen musste.)
- Ibn ʿAwn und die ruhige Antwort – ʿAbdullāh ibn ʿAwn (Ḥilyat al-Awliyāʾ wa-Ṭabaqāt al-Aṣfiyāʾ; Bd. 3, S. 40, Biographie ʿAbdullāh ibn ʿAwn, Bericht: al-Ǧawharī → Bakār ibn Muḥammad und Ibn Qaʿnab: «kāna Ibn ʿAwn lā yaġḍab, fa-iḏā aġḍabahu ar-raǧul qāla: bāraka llāhu fīk».)
- Muǧāhid und die Geduld beim Verstehen – Imām Muǧāhid ibn Ǧabr (Siyar Aʿlām an-Nubalāʾ; Bd. 4, S. 450–457, Biographie Muǧāhid ibn Ǧabr: Muḥammad ibn Isḥāq → Abān ibn Ṣāliḥ → Muǧāhid. Direkte Selbstangabe: «ʿaraḍtu l-Qurʾān ṯalāṯa ʿaraḍāt ʿalā Ibn ʿAbbās ... asʾaluhu fīma nazalat wa-kayfa kānat».)

### Wissen & Lernen (4)
- Imām Mālik und die ehrliche Antwort – Imām Mālik ibn Anas (Ǧāmiʿ Bayān al-ʿIlm wa-Faḍlihī; Band 2, S. 839, Bericht 1573 – Bāb mā yalzam al-ʿālim)
- Ash-Shaʿbī und das aufmerksame Zuhören – ʿĀmir ash-Shaʿbī (Sunan ad-Dārimī; al-Muqaddimah, Bāb man lam yara kitābat al-Ḥadīṯ, Bericht 482; Mālik ibn Ismāʿīl → Muḥammad ibn Fuḍayl → ʿAbdullāh ibn Shubrumah: Er hörte ash-Shaʿbī selbst sagen, dass er nichts niedergeschrieben und keine Wiederholung eines Berichts erbeten habe.)
- Sufyān und die acht Ḥadīṯe – Imām Sufyān ibn ʿUyaynah (Siyar Aʿlām an-Nubalāʾ; Bd. 8, S. 460, Biographie Sufyān ibn ʿUyaynah: ar-Rāmahurmuzī → Mūsā ibn Zakariyyā → Ziyād ibn ʿAbdillāh ibn Khuzāʿī → Sufyān selbst: «fa-ḥaddaṯanī bi-ṯamāniyat aḥādīṯ ... fa-ʿaraḍtu l-aḥādīṯa ʿalayhi fa-qāla bāraka llāhu fīk».)
- Abū Bakr ibn ʿAyyāsh und die vielen Lerntage – Abū Bakr ibn ʿAyyāsh (Siyar Aʿlām an-Nubalāʾ; Bd. 8, S. 501–503; Yaḥyā ibn Ādam hört Abū Bakr ibn ʿAyyāsh über sein Lernen bei ʿĀṣim ibn Abī an-Naǧūd und etwa drei Jahre Schulweg bei Hitze, Kälte und Regen berichten.)

### Freundschaft & Adab (4)
- Imām ash-Shāfiʿī und sein Freund – Imām Muḥammad ibn Idrīs ash-Shāfiʿī (Siyar Aʿlām an-Nubalāʾ; Band 10, S. 17, Biographie von Imām ash-Shāfiʿī – Bericht des Yūnus aṣ-Ṣadafī)
- Ayyūb und das freundliche Lächeln – Ayyūb as-Sakhtiyānī (Ḥilyat al-Awliyāʾ; Bd. 3, S. 9: über Sulaymān aṭ-Ṭabarānī → ʿAlī ibn ʿAbd al-ʿAzīz → ʿĀrim → Ḥammād ibn Zayd: „mā raʾaytu raǧulan qaṭṭu ašadda tabassuman fī wuǧūh ar-riǧāl min Ayyūb“.)
- ʿAṭāʾ und die achtsamen Worte – ʿAṭāʾ ibn Abī Rabāḥ (Ḥilyat al-Awliyāʾ; Bd. 3, S. 315, Biographie ʿAṭāʾ ibn Abī Rabāḥ; Muḥammad ibn Sūqah als direkter Hörer der Worte über unnötiges Reden.)
- Bakr al-Muzanī und der aufrichtige Rat – Bakr ibn ʿAbdillāh al-Muzanī (Siyar Aʿlām an-Nubalāʾ; Bd. 4, S. 535–536, Biographie Bakr ibn ʿAbdillāh. Bericht vom Freitag mit ausdrücklicher Direkt-Hörformel «samiʿtu Bakr ibn ʿAbd Allāh yaqūl yawm al-ǧumuʿah»: Wer den besten Menschen in der Moschee suche, solle nach dem aufrichtigsten Ratgeber für die Allgemeinheit fragen.)

### Familie & Eltern (4)
- Muḥammad ibn Sīrīn und die sanfte Stimme – Muḥammad ibn Sīrīn (aṭ-Ṭabaqāt al-Kubrā; Band 7, Biographie Muḥammad ibn Sīrīn, Bericht über seine Mutter (Ausgabe Dār al-Kutub al-ʿIlmiyyah, Bd. 7, S. 148). Isnādkette: Ibn Saʿd → Muḥammad ibn ʿAbdillāh al-Anṣārī → Hišām ibn Ḥassān → Ḥafṣah bint Sīrīn, die Schwester des Betroffenen und unmittelbare Zeugin.)
- ʿUmar und der gute Rat seines Sohnes – ʿUmar ibn ʿAbd al-ʿAzīz (Ḥilyat al-Awliyāʾ wa-Ṭabaqāt al-Aṣfiyāʾ; Bd. 5, S. 355–357, ʿUmar ibn ʿAbd al-ʿAzīz. ʿAbdullāh ibn Muḥammad → Aḥmad ibn al-Ḥusayn → Aḥmad ibn Ibrāhīm → Saʿīd ibn ʿĀmir → Juwayriyah ibn Asmāʾ → Ismāʿīl ibn Abī Ḥakīm, ʿUmars langjähriger Schreiber. Bericht von Rat seines Sohns ʿAbd al-Malik zur Rückgabe ungerecht erworbenen Besitzes.)
- Uways und die Liebe zu seiner Mutter – Uways al-Qaranī (Ṣaḥīḥ Muslim; Kitāb Faḍāʾil aṣ-Ṣaḥābah, Bāb min Faḍāʾil Uways al-Qaranī, Ḥadīṯ 2542. Die vollständige arabische Wiedergabe des Berichts von Usayr ibn Jābir über ʿUmar ibn al-Khaṭṭāb nennt Uways' Güte gegenüber seiner Mutter.)
- Ibn al-Munkadir und die Hilfe für seine Mutter – Muḥammad ibn al-Munkadir (Siyar Aʿlām an-Nubalāʾ; Band 5, S. 359–360, Biographie Muḥammad ibn al-Munkadir. Saʿīd ibn ʿĀmir überliefert Muḥammads eigene Aussage: Sein Bruder ʿUmar verbrachte die Nacht mit freiwilligem Gebet; er selbst massierte den Fuß seiner Mutter und schätzte diese Hilfe hoch. Buchseite auf Islamweb: Siyar-Archiv 60/872; Saʿīd ibn ʿĀmir wird als Berichterstatter genannt, eine eigene 'samiʿtu'-Formel ist hier nicht behauptet.)

### Klugheit & Verantwortung (4)
- Sufyān und die gute Absicht – Imām Sufyān ath-Thawrī (al-Ǧāmiʿ li-Aḫlāq ar-Rāwī wa-Ādāb as-Sāmiʿ; Bd. 1, S. 317, Nr. 692: Ibn as-Sammāk berichtet, er hörte Sufyān ath-Thawrī sagen: „mā ʿālaǧtu šayʾan ašadda ʿalayya min niyyatī innahā tataqallabu ʿalayya“.)
- Shurayḥ und der Brief mit dem guten Rat – Shurayḥ ibn al-Ḥāriṯ al-Kindī (al-Aḥādīṯ al-Mukhtārah; Band 1, S. 238–239, Nr. 133, Überlieferung Muhammad ibn Bashshār → Abū ʿĀmir → Sufyān → Abū Isḥāq ash-Shaybānī → ash-Shaʿbī → Shurayḥ: Shurayḥ schrieb an ʿUmar um Rat, ʿUmar antwortete mit der Reihenfolge Qurʾān – Sunnah – Entscheidungen rechtschaffener Vorgänger.)
- Al-Ḥasan al-Baṣrī und das Wissen, das man lebt – al-Ḥasan al-Baṣrī (Tahdhīb al-Kamāl fī Asmāʾ ar-Riǧāl; Bd. 6, S. 118–119; Abū Bakr ibn Abī Shaybah → Abū Usāmah → Sufyān ath-Thawrī → ʿImrān al-Qaṣīr. Dieser fragte al-Ḥasan selbst nach der Bedeutung des Faqīh.)
- Al-Awzāʿī und die Spuren der Salaf – Imām ʿAbd ar-Raḥmān al-Awzāʿī (Siyar Aʿlām an-Nubalāʾ; Bd. 7, S. 120; al-ʿAbbās ibn al-Walīd → sein Vater al-Walīd ibn Mazyad mit «samiʿtu l-Awzāʿī yaqūl: ʿalayka bi-āthār man salaf ...».)

### Dankbarkeit & Bescheidenheit (4)
- Al-Fuḍayl und die besondere Gabe – Imām al-Fuḍayl ibn ʿIyāḍ (al-Jāmiʿ li-Shuʿab al-Īmān; Band 10, S. 120, Nr. 7259; Überlieferung von al-Fayḍ ibn Isḥāq, der al-Fuḍayl unmittelbar hörte. Originalanker: «أما علمتم أن حاجة الناس إليكم نعمة من الله عليكم، فاحذروا أن تملوا النعم فتصير نقما». Der Text ist ein Athar, kein prophetischer Ḥadīṯ.)
- Muṭarrif und das dankbare Herz – Muṭarrif ibn ʿAbdillāh ibn ash-Shikhkhīr (al-Jāmiʿ li-Shuʿab al-Īmān; Band 6, S. 251, Bericht 4121. Überlieferung al-Ḥajjāj → Mahdī → Ghaylān ibn Jarīr, der Muṭarrif selbst sagen hörte, dass ihm Gesundheit und Dankbarkeit lieber seien als eine Prüfung und bloßes Erdulden.)
- Saʿīd ibn Ǧubayr und der wertvolle Besitz – Saʿīd ibn Ǧubayr (al-Muṣannaf, Kitāb al-Adab, fī l-isrāf fī n-nafaqah; Bd. 6, Kitāb al-Adab, Abschnitt „Fī l-isrāf fī n-nafaqah“, Bericht: Yaʿlā ibn ʿUbayd → Muḥammad ibn Sūqah → Saʿīd ibn Ǧubayr, Antwort über das Verschwenden von Vermögen.)
- Abū l-ʿĀliyah und die zwei Gaben – Abū l-ʿĀliyah ar-Riyāḥī (Ḥilyat al-Awliyāʾ; Bd. 2, S. 220, Kapitel Abū l-ʿĀliyah: Abū Muḥammad ibn Ḥayyān → Aḥmad al-Khuzāʿī → Muḥammad ibn Kathīr → Ḥammād ibn Salamah → Thābit al-Bunānī → Aussage Abū l-ʿĀliyahs über zwei Gaben.)

## Freigabegrenzen

Der technische Freigabestatus ist **kein** Beweis, dass alle 32 historischen Überlieferungen unabhängig menschlich als ṣaḥīḥ eingestuft wurden. Für mehrere Mastertexte liegt `humanEditorialApproval: false` vor; dokumentierte Quellenzuordnung, Überlieferungstyp und kindgerechte Originaltreue müssen vor weiteren großen Releases weiter fortlaufend kontrolliert werden. Ein vorhandener Quellenlink allein belegt nicht automatisch die Authentizität jeder Behauptung.

Der verschärfte Guard `kids/check-salaf-sunni-editorial-v1.cjs` überprüft jetzt die Acht-Kategorien-Mindestbesetzung, mindestens 350 echte Wörter pro Erzähltext, kein HTML/URL im Kindermaster, Quellen nur von erlaubten Domains, profilgerechte Bilder und die Filterung der nicht freigegebenen Inhalte. Zusätzliche gut belegte Geschichten können später ergänzt werden, ohne die 32er Startgrenze als Obergrenze zu missbrauchen.

Alle künftigen Salaf-Texte dürfen nach Freigabe direkt über den gemeinsamen GitHub/Cloudflare-Besucherpfad veröffentlicht werden; ein App-Store-Update wird für reine Katalogtexte nicht benötigt.
