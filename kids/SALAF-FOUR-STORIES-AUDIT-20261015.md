# Schätze der Salaf – vier Mastertexte, Quellenkontrolle und Freigabe
**Datum:** 15. Oktober 2026 · **nur interne Redaktion**, nicht als Kindervorschau verwenden.

Ziel des Eigentümers: **vier vollständig belegte, freigegebene Geschichten pro Thema; acht Themen = 32**. Als Mindeststandard gelten frühe Ahl-as-Sunnah-Persönlichkeiten, differenzierte Āthār-Quellen mit möglichst direktem zeitgenössischem Überlieferungsweg, keine erfundenen historischen Szenen, ein gemeinsamer Mastertext pro Geschichte für alle Altersstufen und Profile. Quellen-URLs bleiben nur im Datensatz, nie als klickbare Kinder-Links.

## 1. al-Ḥasan al-Baṣrī – Wissen und Handeln
- Person: Tābiʿī und früher sunnitischer Gelehrter.
- Arabischer Anker: „سألت الحسن ... إنما الفقيه الزاهد في الدنيا ، البصير بدينه ، المداوم على عبادة ربه“.
- Erster Gewährsmann: ʿImrān al-Qaṣīr berichtet von seiner **eigenen** Frage an al-Ḥasan. Überlieferung in al-Mizzī, *Tahdhīb al-Kamāl*, 6/118–119: Abū Bakr ibn Abī Shaybah → Abū Usāmah → Sufyān → ʿImrān.
- Parallelnachweis Ibn Abī Shaybah, *al-Muṣannaf*, Band 8, S. 576 (Edition abhängig).
- Nachweis: https://www.islamweb.net/ar/library/content/1001/1287/
- Abgrenzung: Die Aussage ist ein Athar über religiöses Verständnis und gute Werke, **kein prophetischer Ḥadīṯ**. Die Alltagssituationen der Kinder sind didaktische Beispiele.

## 2. Imām al-Awzāʿī – die Spuren der Salaf
- Person: ʿAbd ar-Raḥmān ibn ʿAmr al-Awzāʿī, früher sunnitischer Imām.
- Arabischer Anker: „العباس بن الوليد: حدثنا أبي: سمعت الأوزاعي يقول: عليك بآثار من سلف ... وإياك وآراء الرجال ...“.
- Direkte Hörformel von al-Walīd ibn Mazyad: **samiʿtu l-Awzāʿī**. Bei adh-Dhahabī, *Siyar Aʿlām an-Nubalāʾ*, Band 7, S. 120.
- Parallele in Ibn al-Qayyim, *Iʿlām al-Muwaqqiʿīn*, 1/60.
- Nachweis: https://www.islamweb.net/ar/library/content/60/1151/
- Abgrenzung: Kein Kinder-Streit über konfessionelle Gruppen; nur verantwortungsvoller Umgang mit Belegen.

## 3. ʿAṭāʾ ibn Abī Rabāḥ – achtsame Worte
- Person: Tābiʿī und Gelehrter von Makka.
- Arabischer Anker: „قال لنا عطاء ... إن من كان قبلكم كانوا يكرهون فضول الكلام“.
- Direkter Zeuge: Muḥammad ibn Sūqah berichtet von seinem Besuch bei ʿAṭāʾ; die Geschichte wurde von Yaʿlā ibn ʿUbayd über Muḥammad ibn Sūqah bewahrt.
- Quellen: Abū Nuʿaym, *Ḥilyat al-Awliyāʾ*, 3/315 und Abschnitt Muḥammad ibn Sūqah Bd. 5.
- Nachweise: https://www.islamweb.net/ar/library/content/131/885/ und https://www.islamweb.net/ar/library/content/131/1091/
- Abgrenzung: Nicht behaupten, Kinder dürften nicht spielen, sprechen oder um Hilfe bitten; die Ermahnung betrifft überflüssige, unbedachte Rede.

## 4. Abū Bakr ibn ʿAyyāsh – viele Lerntage
- Person: früher sunnitischer Qurʾān-Überlieferer und Rezitationslehrer.
- Arabischer Anker: „قال يحيى بن آدم: قال لي أبو بكر: تعلمت من عاصم القرآن كما يتعلم الصبي من المعلم“; zusätzlich „اختلفت إلى عاصم نحوا من ثلاث سنين، في الحر والشتاء والمطر“.
- Direkter Schüler Yaḥyā ibn Ādam bewahrt Abū Bakrs eigene Rückschau; Quelle: adh-Dhahabī, *Siyar Aʿlām an-Nubalāʾ*, Band 8, S. 501–503.
- Nachweis: https://www.islamweb.net/ar/library/content/60/1431/
- Abgrenzung: Kein neues Alif-Bāʾ-/Qurʾān-Lernsystem in der Kinder-App. Die Geschichte ist ein bloßer historischer Hör-/Lesetext über Geduld beim Wissenserwerb. Im selben Eintrag vom Autor ausdrücklich als ungesichert markierte Nebenüberlieferung wird nicht übernommen.

## Technische Prüfsperren und Live-Grenzen
- Protagonisten sind einmalig im freigegebenen Anfangsbestand; Kategorien zählen nach dieser Serie: `ilm 4, hikma 4, adab 3, family 3, sabr 3, rahma 2, sidq 2, shukr 2`. Gesamt: **23/32**, **9** weitere erforderlich.
- Zwei alte Entwürfe (`umar-ibn-abd-al-aziz-hoert-auf-gelehrte` und `abu-hazim-den-segen-erkennen`) bleiben gesperrt; weder scheinbar gefüllte Karten noch automatische Freigabe.
- Vollständige Mastertexte in `kids/data/salaf-library-v1.json`, alle mit `verification: "approved"`, `editorialRelease: true`, `audioMaster: null`. Keine ElevenLabs-Credits. Die bereits vorhandene Besucher-UI filtert ausschließlich freigegebene Geschichten.
- Der Autor der KI-Quellenprüfung ist **kein** unabhängiger menschlicher Endredakteur. `humanEditorialApproval: false` bleibt im Datensatz korrekt; die vom Nutzer angeordnete autonome Veröffentlichung ist separat vermerkt. Verifizierte Fundstelle eines Athar ist keine allgemeine Einstufung jeder Biographienachricht als ṣaḥīḥ.
- Keine Änderung der Qurʾān-Lernsystem-Entfernung, der Mädchen-/Jungen-Themen, App-Bar, Tab-Leiste, der anderen KIDS-Bereiche oder der Erwachsenen-Apps.
- Veröffentlichung durch kanonisches Cloudflare-Produktionsworkflow **nach grünen CI-Checks**, danach GitHub-Deployabschluss und Live-Datenabruf abgleichen.
