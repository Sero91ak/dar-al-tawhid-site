## 14.10.2026 · 208/208 Unterrichtslektionen jetzt individuell redigiert · wissenschaftlich noch nicht freigegeben

**Redaktioneller Jahresstand:** 52 Wochen, **208 Themen**, jeweils für 4–5, 6–8 und 9–10 Jahre; **624 Altersentwürfe vorhanden**. Das bezieht sich auf ausgearbeitete Textentwürfe, **nicht** auf die endgültige fachwissenschaftliche oder pädagogische Freigabe. Die noch individuell zu bearbeitenden Lektionsslots betragen **0**; **wissenschaftlich freigegeben sind 0/624**.

**Neu 203–205:** Digitaler Adab (49:11); Tashahhud (Ibn Qudāmah, al-Mughnī 15/611/618, nicht allein 2:238); Taslīm (al-Mughnī 15/621–622, nicht allein 4:86). Je drei eigenständige Altersfassungen, insgesamt 9, getrennt gespeichert als `kids/akademie/curriculum-editorial-203-205-v1.js`.

**Neu 206–208:** Fragen zu Gebetsfehlern (al-Mughnī 15/729, 15/757; Qurʾān 21:7 kein unmittelbarer Einzelbeleg); Ramaḍān/Fasten (2:185 und al-Mughnī 15/1713, ohne Zwang gegenüber Kindern); Zakāh und Ḥaǧǧ (2:43 und 3:97, eigene Bedingungen noch fachlich offen). Insgesamt 9 weitere Altersfassungen, gespeichert als `kids/akademie/curriculum-editorial-206-208-v1.js`. **Alle fünf abschließenden Fiqh-Lektionen bleiben `fiqhHumanReviewNeeded=true`** und `scientificApproval=false`.

**Technik/QA:** Finale Loader-Reihenfolge `199-202` → `203-205` → `206-208`; überlappender alter `203-206`-Loader wurde aus `index.html` entfernt, die alte Quelldatei bleibt erhalten. Beide Voice-Text-Deltas umfassen **114 nicht generierte Sprechtext-Kontexte**, keine synthetische Rezitation und **0 verbrauchte TTS-Credits**. Schreibgeschützter Datenabgleich: 18/18 Altersversionen, 114 Texte, 0 sichtbare interne QA-Bezeichnungen in den neuen Kindertexten, genau einmalige Skripteinbindung und korrekte Reihenfolge. Reproduzierbarer Test `kids/tools/test-academy-editorial-203-208-v1.cjs` angelegt; **vollständiger Node-, Browser- und GitHub-CI-Test ist noch nicht tatsächlich ausgeführt**.

**Wissenschaftlicher Nachweis:** `kids-akademie/research/EDITORIAL_REVIEW_203_208_20261014.md`. Frühere Teilberichte zu 155–202 und alle bestehenden Lektions-Belegverweise bleiben vorhanden. **Noch zu tun:**
- Unabhängige Qurʾān-/Tafsīr-/Ḥadīṯ-/Fiqh-Quellenkontrolle aller 208 Lektionen, einschließlich Versbereichs-, Auszugs-, Seiten- und Authentizitätsnachweisen; Korrektur alter Registry-/Quiz-Zuordnungen statt bloßer Vertrauensübernahme.
- Pädagogische Schlussprüfung aller 624 Fassungen; Kinderschutz, fehlende Entwickler-/Testtexte, keine Angstbilder, kein Zwang, unterschiedliche Altersansprache.
- Vollständige Node-/Browser-/CI-Suite ausführen; erst nach technischem Review den bislang separaten Redaktionszweig korrekt in den übergeordneten Arbeits-PR integrieren.
- Die Text-Deltas mit dem kanonischen Sprachplan abgleichen. **Keine Audioerzeugung, kein Live-Deploy, kein Merge auf `main` ohne separate bewusste Freigabe.**

**Fortsetzung nach Redaktionsabschluss:** Beginne mit *Quellenaudit von Lektion 1 an*, oder mit den offenen **17 vertieften Fiqh-Fällen**, deren Verzeichnis in den Auditakten steht. Die Zahlen 208/208 und 624/624 dürfen nicht als endgültig wissenschaftlich geprüfte Freigaben kommuniziert werden.

## 14.10.2026 · Individuelle Redaktion bis 202/208, noch sechs Lektionsentwürfe

- **199–202:** Fürsorge für Kranke (Qurʾān 4:36), Platzmachen (58:11), Sitzen zwischen zwei Niederwerfungen (22:77 mit separatem Fiqh), guter Charakter (68:4). Zwölf individuell ausgearbeitete Altersfassungen in `kids/akademie/curriculum-editorial-199-202-v1.js`, bestehende IDs/Quiz/Fortschritt unverändert.
- **Fiqh 201:** Ibn Qudāmah, al-Mughnī, Bd. 1 S. 308–309, Islamweb 15/599 (Sitzhaltung), 15/601 (Bittwort) und 15/602 (zweite Niederwerfung). `fiqhHumanReviewNeeded=true` und `scientificApproval=false` bleiben erhalten. Keine neuen individuellen Gebetsgültigkeitsurteile bei Krankheit.
- **Quellenakte:** `kids-akademie/research/EDITORIAL_REVIEW_199_202_20261014.md`. Unterrichtsbeispiele als eigene Didaktik gekennzeichnet, keine medizinische Eigenverantwortung oder Bloßstellung von Kindern.
- **Technik:** `kids/data/academy-voice-editorial-199-202-delta-v1.json` mit 76 rein textuellen, ungenerierten Kontexten (`generateCreditsUsed=0`). **12/12 Struktur-/Textkontrollen erfolgreich**, null interne QA-Begriffe in Kindertexten; im Index einmalig nach 195–198 eingebunden. Testskript hinterlegt, aber Node-/Browser-/CI-Ausführung noch nicht bestätigt.
- **Weiter:** 203–208, davon **Fiqh 204–208** mit besonders sorgfältigen klassischen Quellen; insgesamt **6 individuelle Redaktionen offen**, außerdem wissenschaftliche Gesamtkontrolle aller 624 Altersfassungen, bisher 0/624 final freigegeben. Kein Merge, kein Live-Deploy, keine Audioerzeugung.

## 14.10.2026 · Individuelle Redaktion bis Slot 198/208 · geschützter PR #1142

- **195–198:** Verantwortung für Worte (Qurʾān 49:11), Jüngere freundlich behandeln (49:10), das Herz mit guten Taten pflegen (98:5), Suǧūd kennenlernen (22:77). `kids/akademie/curriculum-editorial-195-198-v1.js` enthält vier bestehende IDs mit **12 individuellen Altersversionen** für 4–5, 6–8 und 9–10 Jahre.
- **Fiqh 198:** Ibn Qudāmah, al-Mughnī, Bd. 1 S. 303–305, [Islamweb 15/592](https://islamweb.net/ar/library/content/15/592), tatsächlich gelesen: sieben Niederwerfungsstellen, unterschiedliche Ansichten zur Reihenfolge von Knien/Händen und zur Nase. Die Verse selbst geben keine Handwinkel vor. `fiqhHumanReviewNeeded=true` und `scientificApproval=false` bleiben erhalten; individuelle körperliche Ausnahmen noch offen.
- **Text/Audio:** `kids/data/academy-voice-editorial-195-198-delta-v1.json` enthält **76 nicht generierte Textkontexte**, null Credits. Die 12 Altersfassungen wurden gegen ihre Texte abgeglichen: **12/12 erfolgreich**, keine QA-/Freigabewörter in den Kindertexten. Der Index lädt das Modul **genau einmal** nach 191–194. Node-Test `kids/tools/test-academy-editorial-195-198-v1.cjs` hinterlegt, aber **nicht als ausgeführter Node-/Browser-/CI-Test ausgeben**.
- **Quellen- und pädagogische Akte:** `kids-akademie/research/EDITORIAL_REVIEW_195_198_20261014.md`. Qurʾān, Tafsīr, klassische Fiqh-Quelle und eigene Fallgeschichten ausdrücklich getrennt. Vorhandene Quiz- und Lernfortschrittsdaten beibehalten.
- **Nächster konkreter Abschnitt:** Lektionen **199–202**. Individuelle Redaktion **198/208**, **10 weitere 199–208** offen, wissenschaftliche Endkontrolle aller **624 Altersfassungen** weiter erforderlich und keine als endgültig freigegeben. Kein Live-Deploy, kein Merge, keine Audioerzeugung und kein Copilot.

## 14.10.2026 · Unterricht bis 194/208 redaktionell ausgearbeitet, geschützter PR #1142

- **191–194:** Istighfār, Aufrichten aus dem Rukūʿ, Tawḥīd mit eigenen Worten und Überblick über die Glaubenssäulen; `kids/akademie/curriculum-editorial-191-194-v1.js` enthält **12 altersdifferenzierte Unterrichtstexte** mit vier Abschnitten, Lernziel, Szene, Übung und Quellenabgrenzung.
- **Sichtbare Quellenkorrekturen:** 191 nur **Qurʾān 71:10**, ohne versehentlich angehängten Text aus 71:11; 193 vollständig **112:1–4**, nicht fälschlich nur 112:1; 194 **2:285** passend zum bestehenden Quiz, nicht die alte Quellenregister-Verknüpfung 2:286. Das historische Quellenregister bleibt als Prüfungsausgangslage erhalten. Forschungsakte: `kids-akademie/research/EDITORIAL_REVIEW_191_194_20261014.md`.
- **Fiqh 192:** klassisch hanbalitischer Primärabgleich mit **Ibn Qudāmah, al-Mughnī, Masʾalah 703, Islamweb 15/580** (hier unabhängig überprüfte Primärstelle; die frühere Referenz 15/574 ist nicht gleichbedeutend als erneut gelesen ausgewiesen). Qurʾān 2:43 wird nicht zur Quelle nicht genannter Bewegungsdetails erklärt. `fiqhHumanReviewNeeded=true`, `scientificApproval=false` bleiben erhalten. Details für Imām/Maʾmūm und Einschränkungen stehen noch aus.
- **Technik:** Index lädt das neue Modul einmal nach 187–190. `kids/data/academy-voice-editorial-191-194-delta-v1.json` enthält **76 unbearbeitete Audio-/ungenerierte reine Text-Kontexte**, `generateCreditsUsed=0`. **12/12 strukturierte Alters-/Textkontrollen bestanden, 0 Konflikte**, keine internen Freigabetexte in den Kinderfeldern. Node-Test `kids/tools/test-academy-editorial-191-194-v1.cjs` gespeichert, aber ein echter Node-/Browser-/CI-Lauf ist nicht nachgewiesen.
- **Nächste individuelle Lektionen 195–198**, insbesondere Fiqh 198 nur nach klassischer Primärkontrolle. **14 Lektionsplätze 195–208** bleiben individuell zu redigieren, danach wissenschaftliche Gesamtprüfung aller 624 Fassungen. Aktuell **0/624 endgültig freigegeben**. Kein Merge, kein Live-Deploy, keine Audioerzeugung, kein Copilot.

## 14.10.2026 · Unterricht bis 190/208 individuell redigiert

**Neue Lektionen 187–190:** Vertrauen und Bemühen (2:45); Fragen zum Īmān (21:7); Mut zur Wahrheit (33:70); Ältere respektvoll ansprechen (17:23–24; Referenzkorrektur für das Quiz). Vier Einzelthemen als **zwölf alterseigene Entwürfe** 4–5, 6–8 und 9–10. Datenmodul `kids/akademie/curriculum-editorial-187-190-v1.js` nach 183–186 genau einmal in `kids/akademie/index.html` eingebunden. Alte IDs, Quizfragen, Lernfortschritte unverändert.

**Quellen und Grenzen:** Ibn Kaṯīr, bestehende Islamweb-Nachweise 49/85, 49/1163, 49/1508 und 49/1005. 21:7 hat einen historischen Gesandtenkontext, 17:23–24 sprechen ausdrücklich von den Eltern, 33:70 rechtfertigt keine gefährliche öffentliche Konfrontation. Forschungsakte: `kids-akademie/research/EDITORIAL_REVIEW_187_190_20261014.md`. Keine der vier alten Islamweb-Seiten wird ohne gesonderten neuen Abruf als frisch vollständig verifiziert gekennzeichnet.

**Technik:** `kids/data/academy-voice-editorial-187-190-delta-v1.json` enthält **76 vollständig abgeglichene, aber nicht generierte** Textkontexte, 0 Audio-Credits. `kids/tools/test-academy-editorial-187-190-v1.cjs` als reproduzierbarer Node-Test gespeichert. **53/53 eigenständig ausgeführte schreibgeschützte Inhalts- und Loaderkontrollen bestanden**. Vollständiger Node-/Browser-/CI-Lauf noch nicht durch diese Prüfung ersetzt.

**Gesamtstand:** Individuelle Redaktion bis Slot **190 von 208**. **Noch 18 einzelne Lektionen 191–208** (darunter Fiqh 192, 198, 201, 204–208); anschließender vollständiger wissenschaftlicher Review aller 624 Altersfassungen. `scientificApproval=false` und Fiqh-Prüfsperren erhalten. Kein Merge auf main, kein Live-Deploy, keine Audioerzeugung und keine laufenden Kosten.

**Wiederaufnahme:** 191–194, insbesondere Fiqh 192 nur mit gesonderter klassisch-hanbalitischer Quelle. Geschützter Draft-PR #1142.

## 14.10.2026 · Unterricht bis 186/208, geschützter Entwurf

- **183–186:** Hilfsbereitschaft ohne Druck; Aufmerksamkeit beim Qurʾān-Vortrag; Schuldgefühle ohne Angstbilder; Rukūʿ kennenlernen. Vier vorhandene Lektions-IDs, **12 individuelle Altersfassungen**, je vier Unterrichtsabschnitten, Situation, Übung, Lernziel und Quellenabgrenzung: `kids/akademie/curriculum-editorial-183-186-v1.js`.
- **Quellen:** Qurʾān 5:2 (Ibn Kaṯīr 49/372), 7:204 (49/589), 39:53 (49/1629) und 22:77 (49/1229). Die Kinderanzeige von **39:53** enthält jetzt nur den einzelnen vollständigen Vers und nicht 39:54/55. Klassisch-hanbalitischer Fiqh für 186: Ibn Qudāmah, `al-Mughnī`, Bd. 1 S. 295–296, Islamweb 15/570; die Handhaltung auf den Knien ist als empfohlen, die Verbeugung als erforderlich voneinander getrennt. `fiqhHumanReviewNeeded=true` und `scientificApproval=false` bleiben.
- **Technik:** `kids/data/academy-voice-editorial-183-186-delta-v1.json`: **76 Textkontexte**, `generateCreditsUsed=0`, keine Audioerzeugung; Loader einmalig nach 179–182. Alle 12 Altersfassungen stimmen beim schreibgeschützten Datenvergleich mit den Textkontexten überein, 0 interne QA-Metadaten in den Kindertexten. `kids/tools/test-academy-editorial-183-186-v1.cjs` als reproduzierbarer Node-Test hinterlegt; vollständige Node-/Browser-/CI-Ausführung ist nicht bestätigt.
- **Stand:** 186/208 individuell redigiert; **22 Lektionen 187–208** für individuelle Redaktion offen. Ältere Quellen und alle 624 Altersfassungen erfordern eine separate wissenschaftliche Endprüfung; **0/624 freigegeben**. Kein Merge auf `main`, kein Live-Deploy.
- **Nächster Block:** 187–190, danach Fiqh-Quellen besonders bei 192 gezielt überprüfen. Sprechtext-Deltas vor jeder künftigen Aufnahme in den kanonischen Textplan konsolidieren.

## 14.10.2026 · Fortsetzung bis Slot 182/208 · geschützter Draft-PR #1142

**Lektionsblock 179–182:** Wertschätzender Umgang mit sich selbst, Qurʾān-Rezitation im Gebet, Einzigkeit Allahs gegenüber Geschöpfen und gute Worte. Vier bestehende IDs; je drei Altersfassungen mit Lernziel, vier individuellen Unterrichtsabschnitten, Situation, Praxis, Quellenabgrenzung und Zusammenfassung. Unter `kids/akademie/curriculum-editorial-179-182-v1.js`; im Index korrekt einmalig nach 175–178 geladen.

**Wissenschaftlicher Schwerpunkt Fiqh 180:** Qurʾān 15:87 und Tafsīr Ibn Kaṯīr (Islamweb 49/933) getrennt von dem authentischen Fātiḥah-Hadith des ʿUbādah ibn aṣ-Ṣāmit (Ṣaḥīḥ al-Buḫārī, Islamweb 0/724, lokale Zählung 723) und dem hanbalitischen **Ibn Qudāmah, al-Mughnī, Bd. 1 S. 284, Islamweb 15/553**. Der Erörterung zur Fātiḥah als Rukn liegen echte klassische Nachweise zugrunde; Maʾmūm- und Ausnahmefälle bleiben ungeprüft, `fiqhHumanReviewNeeded=true` und `scientificApproval=false`.

**Qurʾān-Anzeige Slot 181:** Das Altregister führte die gesamte Sūrah al-Iḫlāṣ unter **112:1**. Die Kinderanzeige gibt nun den korrekten vollständigen Bereich **112:1–4** wieder. Altregister als Auditspur erhalten.

**Texte:** `kids/data/academy-voice-editorial-179-182-delta-v1.json`: **76 ungegenerierte deutsche Textkontexte**, **0 Credits**. Technische Hinweise in den Kindertexten von Slot 180 vor der Synchronisierung entfernt. Quellenakte `kids-akademie/research/EDITORIAL_REVIEW_179_182_20261014.md`, isolierter Node-Regressionstest `kids/tools/test-academy-editorial-179-182-v1.cjs` gespeichert.

**Prüfergebnis:** **131/131** direkte strukturierte Daten-, Voice-, Kindersprache-, Quellenfeld- und Script-Reihenfolge-Abgleiche bestanden. Kein echter vollständiger Node-/Browser-/CI-Lauf bestätigt.

**Gesamt:** Individuell redaktionell bis **182/208**; **26 Lektionen 183–208** zur Ausarbeitung offen. **624 Altersfassungen benötigen weiterhin wissenschaftliche Vollkontrolle (0/624 freigegeben)**. Audio-Textdeltas nicht mit kanonischem Plan konsolidiert. **Kein Merge auf main, kein Live-Deploy, keine neue Audioerzeugung.** Nächster Block **183–186**, Fiqh **186** gesondert klassisch prüfen.

## 14.10.2026 · Unterricht bis Lektion 182/208, abgesicherte Fortsetzung

- **179–182:** Wertschätzend mit sich selbst umgehen; die Fātiḥah-Rezitation im Gebet; keine göttliche Macht für Geschöpfe behaupten; Glaube und gute Worte. `kids/akademie/curriculum-editorial-179-182-v1.js` enthält die bestehenden vier Lektions-IDs mit **12 eigenständigen Altersfassungen** in je vier Lehrabschnitten, mit Lernziel, Situation, Übung und Quellenabgrenzung.
- **Quellen:** Qurʾān 17:70, 15:87, 112:1–4, 2:83. Für Fiqh 180 zusätzlich Prophetenwortlaut von ʿUbādah ibn aṣ-Ṣāmit, durch Ibn Qudāmah im `al-Mughnī` zitiert (Bd. 1, S. 284, Islamweb 15/553). Eigene Teilprüfung: `kids-akademie/research/INDEPENDENT_FIQH_180_PRIMARY_CHECK_20261014.md`. Der direkte Islamweb-Link der Bukhārī-Registry 0/724 wurde im unabhängigen Abruf nicht bestätigt; nicht als erneut geprüft markieren. `fiqhHumanReviewNeeded=true`, `scientificApproval=false` bleiben.
- **Integrität:** `kids/data/academy-voice-editorial-179-182-delta-v1.json`: **76 reine Textkontexte**, 0 generierte Audios und 0 TTS-Credits. 12/12 schreibgeschützte Alters-/Voice-Textkontrollen bestanden. Kinderinhalte auf interne Audittexte geprüft; 0 sichtbare QA-Begriffe. Akademie-Loader enthält den Block genau einmal nach 175–178. Separater Node-Regressionstest in `kids/tools/test-academy-editorial-179-182-v1.cjs` liegt bereit, wurde **noch nicht nachweisbar im Node-/Browser-/CI-Lauf ausgeführt**.
- **Status:** Individuelle Redaktion bis **182/208**, **26 weitere Lektionen (183–208)** offen. Frühere Entwürfe und alle 624 Altersversionen benötigen wissenschaftliche Endkontrolle. **0/624 freigegeben.** Keine Audioerzeugung, kein Merge auf `main`, keine Live-Veröffentlichung.
- **Nächste Arbeit:** 183–186, mit eigenem klassisch-hanbalitischem Fiqh-Review für 186; den bestehenden Quellenbericht `kids-akademie/research/INDEPENDENT_FIQH_REVIEW_186.md` als Ausgangspunkt prüfen, statt doppelt zu forschen.

## 14.10.2026 · Unterricht bis 178/208 individuell redigiert – prüfbarer Entwurfsstand

- **175–178:** Tawḥīd im Alltag, Bemühen und Allah vertrauen, verschiedene Menschen respektieren, Trinkwasser mit guten Umgangsformen. Vier vorhandene IDs mit **12 individuellen Altersfassungen**, je vier Kinderabschnitten, Lernziel, Situation, Übung, Quellenabgrenzung und Zusammenfassung, als `kids/akademie/curriculum-editorial-175-178-v1.js`.
- **Quellen:** Qurʾān 1:5 (Ibn Kaṯīr, Islamweb 49/46), 2:45 (49/85), 30:22 (49/1424), 16:10 (49/942). Keine pauschale Verwechslung von alltäglicher Bitte und Anbetung; keine erfundenen Trinkrituale aus dem Wasser-Vers.
- **Technik:** `kids/data/academy-voice-editorial-175-178-delta-v1.json` enthält **76 nicht erzeugte Sprechtext-Kontexte**, `generateCreditsUsed=0`. Der Loader bindet das Modul einmal nach 171–174 ein. **16 von 16 schreibgeschützten Prüfungen bestanden:** Altersfassungen, Texte/Voice-Konsistenz, Loader und null Credits; keine technischen Kinder-Prüfvermerke gefunden. `kids/tools/test-academy-editorial-175-178-v1.cjs` liegt für den späteren vollständigen Node-Test bereit.
- **Qualitätskorrektur in 174:** Interne Schlüssel `scientificApproval=false` und `fiqhHumanReviewNeeded=true` aus dem potenziell kinderseitig angezeigten Quellenfeld entfernt; die entsprechenden Freigabeflags bleiben ausschließlich im `sourceAudit`.
- **Nächste Lektionsredaktion 179–182**, mit klassischer hanbalitischer Primärquellenprüfung für **Fiqh 180**. Insgesamt **30 individuelle Lektionsredaktionen 179–208** noch offen; wissenschaftlich endgültige Freigabe **0/624**. Kein Merge, keine Audioerzeugung, kein Live-Deploy. Die Voice-Deltas sind weiterhin nicht in den kanonischen Sprachplan konsolidiert.
- **Prüfgrenze:** Der dokumentierte schreibgeschützte Datenabgleich ersetzt keinen im Repository ausgeführten Node-/Browser-/CI-Test.

## 14.10.2026 · Individuelle Kindertexte 175–178 fertig entworfen · 178/208

- **Lektionsnummern 175–178:** Tawḥīd im Alltag (`tawhid-im-alltag`), Bemühen und Vertrauen (`iman-bemuehen-und-vertrauen`), Respekt gegenüber Menschen mit unterschiedlicher Sprache/Erscheinung (`akhlaq-unterschiedliche-menschen`) und achtsamer Umgang mit Trinkwasser (`adab-trinken-mit-guten-sitten`).
- **Pädagogisch:** `kids/akademie/curriculum-editorial-175-178-v1.js` mit zwölf unterschiedlichen Altersfassungen (4–5, 6–8, 9–10), jeweils Lernziel, vier Unterrichtsabschnitte, kindliches Alltagsszenario, Übung, Quellenabgrenzung und Zusammenfassung. Bestehende Lektions-IDs, Quizfragen und Fortschritts- und Profildaten bleiben erhalten.
- **Quellenakten:** `kids-akademie/research/EDITORIAL_REVIEW_175_178_20261014.md`, Qurʾān 1:5, 2:45, 30:22 und 16:10; Ibn Kaṯīr auf Islamweb 49/46, 49/85, 49/1424 und 49/942 durch Suchabruf geprüft. Keine pauschalen Verbote gewöhnlicher Hilfe, keine Notengarantien, kein Spott über Menschen, keine erfundenen Trinkrituale.
- **Sprechplan:** `kids/data/academy-voice-editorial-175-178-delta-v1.json` enthält **76 unvertont geschriebene Text-Kontexte**, `generateCreditsUsed:0`. Kanonischer Sprechplan noch nicht konsolidiert. `kids/tools/test-academy-editorial-175-178-v1.cjs` als isolierter Node-Regressionstest eingecheckt.
- **Datenkontrolle:** **129/129** strukturierte Text-/Voice-/Ladereihenfolge-Abgleiche erfolgreich; Node-/Browser-/CI-Lauf nicht ausgeführt, externer Checkout hier ohne DNS. Keine wissenschaftliche Endfreigabe.
- **Fortschritt:** Individuelle redaktionelle Texte **178/208**; weitere **30 Lektionen 179–208** einzeln ausarbeiten. Alle **624/624** Altersfassungen weiterhin fachwissenschaftlich zu prüfen, davon **0 wissenschaftlich endgültig freigegeben**. Fiqh-Slots bleiben bei `fiqhHumanReviewNeeded=true`.
- **Nächster Arbeitsschritt:** **179–182**, inklusive gesonderter hanbalitischer Quellenprüfung des Fiqh-Slots **180**. Geschützter Entwurfs-PR #1142, kein Merge auf `main`, kein Live-Deploy, keine Audioerzeugung.

## 14.10.2026 · Unterricht bis 174/208 individuell redigiert (PR #1142, kein Merge)

**Neu 171–174:** Vier weitere Kinderlektionen in `kids/akademie/curriculum-editorial-171-174-v1.js` und damit **12 eigene Altersfassungen**. Themen: vorsichtiger Umgang mit Essen, Selbstständigkeit, ruhig lernen, Gebetsbeginn `Takbīrat al-Iḥrām`.

**Wesentliche Quellenreparatur:** Slot **172** verwendete im Altregister Qurʾān **94:5–6**, das vorhandene Quiz behandelte aber **94:7–8**. Die Kinderanzeige wurde für 172 auf den zutreffenden Versbereich **94:7–8** mit vollständigem arabischem Wortlaut und passender deutscher Sinnbeschreibung geändert. Das alte Registry-Objekt muss später separat aufgelöst werden. Quellenakte: `kids-akademie/research/EDITORIAL_REVIEW_171_174_20261014.md`.

**Fiqh Slot 174:** Die konkrete Eröffnungsformel `Allāhu akbar` beruht nicht auf einem frei abgeleiteten Wortlaut aus Qurʾān 17:111, sondern auf klassischer hanbalitischer Primärstelle **Ibn Qudāmah, al-Mughnī, Bd. 1, S. 275–277, Islamweb 15/532–534**. Der Takbīr als notwendiger Bestandteil wurde nachgelesen; Details und Ausnahmen bleiben `fiqhHumanReviewNeeded=true`, `scientificApproval=false`.

**Daten und Tests:** `kids/data/academy-voice-editorial-171-174-delta-v1.json` umfasst **76 Text-Kontexte**; keine Aufnahmen, **0 Credits**. `kids/tools/test-academy-editorial-171-174-v1.cjs` als reproduzierbarer Node-Test gespeichert. **131/131 direkte Daten-, Quellenfeld-, Kindertext- und Ladereihenfolge-Kontrollen bestanden**. Vollständige Node-/Browser-/CI-Ausführung noch nicht verifiziert (externer Git-Checkout hier nicht erreichbar). Keine Audio-Synchronisierung mit dem kanonischen Plan behaupten.

**Fortschritt:** Individuelle Redaktion nun bis **174/208**. **34 weitere Lektionen 175–208** offen. Unabhängige wissenschaftliche Vollabnahme weiter **0/624**; keine Freigabe für Kinderplayer, kein Merge auf main, kein Live-Deploy. Nächster Block **175–178**. Der Hauptproduktionszweig aus PR #1113 wird nicht automatisch überschrieben.

## 14.10.2026 · ChatGPT-Unterricht fortgesetzt bis 170/208

**Neue Inhalte 167–170:** `curriculum-editorial-167-170-v1.js`, vier Lektionen mit zwölf eigenständigen Altersfassungen. Themen: ʿIbādah, al-Qadar, Aufrichtigkeit, Freude für andere. Je Fassung vier zusammenhängende Kinder-Unterrichtsabschnitte, Lernziel, Beispiel, Übung, Quellengrenze und Zusammenfassung.

**Rechercheakte:** `kids-akademie/research/EDITORIAL_REVIEW_167_170_20261014.md`. Quellen: Qurʾān 51:56, 54:49, 39:2 und 49:10. Ibn-Kaṯīr-Primärstelle Islamweb 49/1753 verifiziert; die anderen drei direkt benannten Islamweb-Seiten waren bei erneutem Abruf nicht zugänglich, deshalb als **Altreferenzen mit Hilfstextabgleich** markiert, nicht als neu gelesene Primärseite. Keine Scheinfreigabe.

**Technik:** Einmalige Einbindung in `kids/akademie/index.html` nach 163–166. `kids/data/academy-voice-editorial-167-170-delta-v1.json` enthält 76 **ungenerierte** Texte (`generateCreditsUsed:0`). Separater Regressionstest `kids/tools/test-academy-editorial-167-170-v1.cjs` hinterlegt. **129/129 strukturierte Daten-/Ladereihenfolge-/Textabgleiche bestanden**, echter Node-/Browser-/CI-Lauf konnte aufgrund nicht erreichbaren externen Repository-Checkouts noch nicht durchgeführt werden.

**Rückblick 163–166:** Die vorhandenen Dateien für 163–166 und ihre 76 Sprechkontexte wurden zusätzlich kontrolliert: **19/19 strukturierte Abgleiche erfolgreich**. Fiqh 166 bleibt `fiqhHumanReviewNeeded=true`. Quellenakte `research/EDITORIAL_REVIEW_163_166_20261014.md`.

**Gesamtstatus:** Bis Lektion **170/208** individuell redaktionell überarbeitet; **38 weitere Lektionen 171–208** offen. Alle 624 Altersversionen weiterhin wissenschaftlich unfreigegeben. Keine Audioerzeugung, kein Merge auf main, keine Live-Veröffentlichung. Der unvertonte Sprachplan muss vor späterer Audioaufnahme mit allen Deltas abgeglichen werden.

**Nächster Block:** **171–174**, Lektion 174 (Fiqh) nur nach klassisch-hanbalitischer Quellenprüfung. Arbeitszweig `chatgpt/kids-akademie-155-158-20261014`, Entwurfs-PR #1142.

## 14.10.2026 · Einzelredaktion durchgehend bis Lektion 166

- **Zusätzlich Lektionen 163–166** in `kids/akademie/curriculum-editorial-163-166-v1.js` individuell pädagogisch formuliert: Dank für Essen (16:114), nach Lernfehlern weitermachen (94:5–6), Wünsche/maßvoller Umgang (17:29), Stehen im Gebet mit krankheitsbedingter Erleichterung (2:238; **Ibn Qudāmah, al-Mughnī 15/861**). Zwölf weitere eigenständige Altersfassungen 4–5, 6–8 und 9–10 Jahre, mit je vier Lehrabschnitten, eigener Situation, Übung und Quellenabgrenzung.
- **Wortlautgrenzen korrigiert:** Alte V38-Eintragung `94:5` enthielt 94:5–6; neuer Overlay präzisiert auf 94:5–6. Das an Qurʾān 17:29 in älteren Daten irrtümlich angehängte `إِنَّ` (Anschlusswort aus Vers 17:30) wurde in der Kinderanzeige entfernt. Das alte Quellenregister bleibt als Audit-Historie unangetastet. Forschungsakte: `kids-akademie/research/EDITORIAL_REVIEW_163_166_20261014.md`.
- **Fiqh-Slot 166:** al-Mughnī, Islamweb 15/861, zusätzlich Qurʾān 2:238 / Ibn Kaṯīr 49/205; `fiqhHumanReviewNeeded=true` und `scientificApproval=false` bleiben. Keine abschließende Rechtsfreigabe.
- **Voice-Delta:** `kids/data/academy-voice-editorial-163-166-delta-v1.json`: 76 Textkontexte, 0 MP3s/0 Credits, noch nicht im kanonischen Plan. `kids/tools/test-academy-editorial-163-166-v1.cjs` ergänzt; vollständiger Node-/Browser-/CI-Lauf weiter offen.
- **84/84 statische Struktur-/Text-/Ladereihenfolgetests bestanden** in diesem Teilblock; mit den zuvor geprüften Blöcken 155–162 sind das insgesamt **227/227** solcher schreibgeschützten Abgleiche. Nicht als ausgeführte lokale Node- oder Browser-Tests ausgeben.
- **Redaktioneller Stand: 166/208**, also **42 individuelle Lektionsentwürfe (167–208)** verbleiben. Die vollständige Quellenprüfung und wissenschaftliche Freigabe aller 624 Altersfassungen bleibt weiterhin offen, momentan **0/624 Freigaben**. Kein Merge, kein Live-Deploy, keine Audioerzeugung.
- **Nächster Schritt:** Lektionen **167–170**, mit besonderer Vorsicht bei 168 (al-Qadar); Quellen und kindgerechte, nicht deterministisch missverstandene Erklärung überprüfen. Der gesamte neue Block 155–166 liegt im geschützten **Draft-PR #1142** und ist nicht in main oder Besucher-KIDS live.

## 14.10.2026 · Fortsetzung 159–162, individuelle Kindertexte bis Slot 162

- **Slots 159–162** sind zusätzlich zu 155–158 in `kids/akademie/curriculum-editorial-159-162-v1.js` mit **12 eigenständigen Altersfassungen** eingebunden: Allah danken, Īmān/gute Taten, Aufrichtigkeit, ruhig mit Niederlagen umgehen. Der Script-Loader steht einmalig direkt nach 155–158. Quizfragen, Alters-IDs, Quelle `quran` und Lernfortschritt bleiben unverändert.
- Qurʾān-Grundlagen: **16:53** (Ibn Kaṯīr, vorhandener Islamweb-Locus 49/958; Teilkontrolle außerhalb Islamweb), **2:177** (Ibn Kaṯīr, Islamweb 49/161), **2:264** (Ibn Kaṯīr, Islamweb 49/222), **3:134** (Ibn Kaṯīr über Islamweb-Fatwa 95384, altes Primärregister 49/280 nicht unabhängig vollständig abgerufen). Einzelheiten stehen in `kids-akademie/research/EDITORIAL_REVIEW_159_162_20261014.md`.
- Das neue Voice-Delta `kids/data/academy-voice-editorial-159-162-delta-v1.json` umfasst **76 Text-Kontexte**, nicht generiert, nicht in kanonischen Plan übernommen, `generateCreditsUsed=0`. Auch der Block 155–158 enthält 76 reine Textkontexte.
- Neue Regression: `kids/tools/test-academy-editorial-159-162-v1.cjs`. Schreibgeschützte Kontrolle ergab **113/113 erfolgreiche strukturierte Abgleiche** bei 159–162, plus **30/30** bei 155–158. Echter Node-/Browser-/GitHub-Actions-Lauf **noch offen**; vorhandene Prüfskripte beweisen keine ausgeführte CI.
- **Fortlaufender Redaktionsstand: bis 162 von 208 Lektionsslots**, d. h. **46 weitere Slots (163–208)** brauchen individuelle Redaktion und alle älteren Abschnitte eine fachwissenschaftliche Gesamtkontrolle. **0/624 wissenschaftlich endgültig freigegeben**.
- **Wiederaufnahme: Lektionen 163–166**, hierbei Fiqh-Slot **166** nur mit tatsächlich geprüfter klassisch-hanbalitischer Quelle. Kein Merge auf `main`, kein Live-Deploy, keine Audioerzeugung; Branch `chatgpt/kids-akademie-155-158-20261014` mit Draft-PR #1142.

## 14.10.2026 · Unterricht 155–158 individuell erweitert (separater ChatGPT-Arbeitszweig)

- **Vier Unterrichtslektionen 155–158** (`quran-woher-stammt-ein-hadith`, `sirah-sahabah-vorbild`, `dua-adhkar-ohne-zwang`, `family-gemeinschaft-gutes`) mit **zwölf unterschiedlichen Altersfassungen** für 4–5, 6–8 und 9–10 Jahre. Durchgehend vier Kinder-Lehrabschnitte je Altersfassung samt Alltag, Praxis, Lernziel, Quellenabgrenzung und Zusammenfassung.
- **Testloader:** `kids/akademie/curriculum-editorial-155-158-v1.js` nach Lektion 154 im Akademie-`index.html` eingebunden. Die bestehenden IDs, früheren Quizfragen, Profile und Fortschrittsdaten bleiben unverändert.
- **Quellengrundlagen:** Qurʾān 53:3–4 (Ibn Kaṯīr/Islamweb 49/1779; aṭ-Ṭabarī/Islamweb 50/4658), 9:100 (Ibn Kaṯīr 49/685), 33:41–42 (Ibn Kaṯīr 49/1493), 16:90 (Ibn Kaṯīr 49/974). Kinderbildschirm korrigiert Bezeichnungen der Versbereiche **53:3–4 und 33:41–42**, ohne alte Quellenregistereinträge still zu überschreiben. Voller Prüfbericht: `kids-akademie/research/EDITORIAL_REVIEW_155_158_20261014.md`.
- **Voice-Delta:** `kids/data/academy-voice-editorial-155-158-delta-v1.json` mit **76 Textkontexten**. Alle kontextbezogenen Texte anhand des gespeicherten JS-Drafts verglichen: **0 Abweichungen**, **0 generierte Audios, 0 Credits**. Vor irgendwann möglicher Sprachproduktion zuerst Zusammenführung mit dem kanonischen Sprechplan und weitere Freigabe.
- **Prüfskript** `kids/tools/test-academy-editorial-155-158-v1.cjs` neu hinterlegt. **30 schreibgeschützte JSON-/Daten-/Text-/Loader-Kontrollen erfolgreich**, ein tatsächlicher Node-/Browser-/CI-Lauf konnte hier nicht erfolgen und bleibt zwingend offen.
- **Stand:** 158 von 208 Lektionsslots haben nach dem vorhandenen Stand nun individuelle Redaktion. **Noch 50 Slots (159–208)** benötigen individuelle Ausarbeitung; alle 624 Altersfassungen bedürfen weiter der wissenschaftlichen Gesamtprüfung. **0/624 freigegeben.**
- **Wiederaufnahme:** Lektionen **159–162**, dann 163 ff. Kein Merge auf `main`, keine Audioerzeugung, kein Live-Deploy. Diese Änderungen liegen bis zur PR-Übernahme auf `chatgpt/kids-akademie-155-158-20261014` und sind noch nicht Bestandteil von PR #1113.

## 14.10.2026 · Slot 154 · Fiqh-Niyyah korrigiert

- **Lektion 154** (`fiqh-absicht-zum-gebet`) mit **drei eigenständigen Altersfassungen** und hinreichend getrenntem Qurʾān-Beleg, klassischem Fiqh und kindlicher Übung als Overlay `kids/akademie/curriculum-editorial-154-v1.js` im PR #1113 eingebunden.
- **Quellenkorrektur an realen arabischen Qurʾān-Daten:** Das bisher unter 6:162 gespeicherte arabische Feld begann ohne `قُلْ` und enthielt am Ende Teile von **6:163**. Jetzt ist **exakt der vollständige Vers 6:162** gespeichert: `قُلْ إِنَّ صَلَاتِي وَنُسُكِي وَمَحْيَايَ وَمَمَاتِي لِلَّهِ رَبِّ الْعَالَمِينَ`. Abgleich mit Ibn Kaṯīr/Islamweb 49/486. Deutsche Sinnerklärung entsprechend korrigiert.
- **Hanbalitischer Originaltext:** Ibn Qudāmah, `al-Mughnī`, Bd. 1 S. 278, Islamweb 15/542, tatsächlich über Web-Suche eingesehen: Niyyah = Absicht, ihr Ort ist das Herz; Lautäußerung wird als mögliche Bekräftigung erwähnt, **nicht als zusätzliche Pflichtformel**. Keine erfundene gesprochene Niyyah. Prüfbericht: `kids-akademie/research/EDITORIAL_REVIEW_154_20261014.md`.
- **19 unvertonte Sprechtextkontexte** in `kids/data/academy-voice-editorial-154-delta-v1.json` mit Textabgleich **0 Abweichungen**. Für den vorherigen 151–153-Block ebenso **57 Kontexte, 0 Abweichungen**. **0 generierte Audios / 0 Credits**.
- Regressionstest `kids/tools/test-academy-editorial-154-v1.cjs` ist im Repo hinterlegt; vollständiger Node-/Browser-Lauf **noch ausstehend**.
- **Fortlaufende Redaktionsarbeit bis Slot 154/208, damit 54 weitere Unterrichtslektionen (155–208)**. Weiterhin **0/624 endgültige wissenschaftliche Freigaben**. Kein Merge, kein Live-Deploy.
- Als Nächstes **155–158**: Qurʾān/Hadith unterscheiden, Sīrah, Duʿāʾ und familiäres Miteinander.

## 14.10.2026 · Unterricht bis Lektion 153 redaktionell erweitert

- **Lektionen 151–153** (achtsam mit Lebensmitteln umgehen, kleine Aufgaben übernehmen, unbegründete Verdächtigungen prüfen) sind in `kids/akademie/curriculum-editorial-151-153-v1.js` als **neun inhaltlich unterschiedliche Altersfassungen** für 4–5, 6–8 und 9–10 Jahre eingebunden. Vier vollständige Unterrichtsabschnitte, Beispiel, Übung, Quellenabgrenzung und Zusammenfassung pro Altersstufe.
- In `kids/data/academy-voice-editorial-151-153-delta-v1.json` liegen **57 ungegenerierte deutsche Text-Sprechkontexte** mit `generateCreditsUsed:0`. Das Delta gehört vor jeder Audioerzeugung mit dem kanonischen Voice-Plan abgeglichen. Keine künstliche Qurʾān-Rezitation.
- **Quellen:** Qurʾān **6:141** mit Ibn Kaṯīr Bd. 3 S. 348–350 (islamweb.net/ar/library/content/49/472); **90:17** mit Ibn Kaṯīr (islamweb.net/ar/library/content/49/1957, unabhängiger Web-Abruf nicht bestätigt); **49:12** mit Ibn Kaṯīr Bd. 7 S. 378 (islamweb.net/ar/library/content/49/1755). Dokument: `kids-akademie/research/EDITORIAL_REVIEW_151_153_20261014.md`.
- **Wissenschaftliche Abgrenzungen:** Der isrāf-Vers nennt keine genaue Essensmenge und die Tafsīr-Deutungen sind vielfältig; 90:17 fordert Geduld und Barmherzigkeit, keine konkrete Hausarbeitsliste; 49:12 verbietet Verdacht ohne Grund, ohne das Melden tatsächlicher Gefahren auszuschließen. Für Kinder keine Essenszwänge oder erschreckenden Bilder.
- **Integritätsprüfung am GitHub-Text durchgeführt:** 3 IDs, 9 Altersfassungen, 57 Voice-Kontexte, **0 Textabweichungen**, genau eine Index-Einbindung in korrekter Reihenfolge. Reproduzierbarer Node-Test: `node kids/tools/test-academy-editorial-151-153-v1.cjs` (auf Branch gespeichert, tatsächlicher Node-/Browser-Lauf hier **nicht bestätigt**).
- **Gesamte redaktionelle Strecke 119–153:** **35 Lektionen / 105 altersgerechte Fassungen** mit individuellen Arbeitsmodulen. Von 154 bis 208 bleiben **55 weitere Lektionen** zur Redigierung offen; ältere Lektionen und Quellen benötigen zusätzlich Vollkontrolle. **0/624 endgültige wissenschaftliche Freigaben; kein Merge, kein Live-Deploy, 0 neu generierte Audios.**

## 14.10.2026 · Unterricht 147–150 fachlich und pädagogisch weitergeführt

- **Vier weitere Lektionen / zwölf eigenständige Altersfassungen (4–5 / 6–8 / 9–10 Jahre)** redigiert. Das Modul `kids/akademie/curriculum-editorial-147-150-v1.js` liegt auf **PR #1113** und ist nach 143–146, vor dem Term-Coach in `kids/akademie/index.html` eingebunden. Die vorhandenen Lektions-IDs, Quellen, Quizfragen und Lernfortschrittsfelder bleiben unverändert.
- Themen: **147** ar-Raḥmān / ar-Raḥīm (Qurʾān 1:1), **148** Īmān an den Jüngsten Tag (2:177, angstfreie Vermittlung), **149** gemeinsame gute Aufgaben (5:2, keine erfundene Riyāʾ-Textstelle), **150** Streit schlichten (49:10, keine erzwungene Versöhnung bei Gewalt oder Bedrohung).
- **Quellenakte:** `kids-akademie/research/EDITORIAL_REVIEW_147_150_20261014.md` mit den vorhandenen Islamweb-/Ibn-Kaṯīr-Belegen und ausdrücklich gesondertem pädagogischem Eigenanteil. Vollständige aktuelle Primärseitenprüfung und menschliche wissenschaftliche Freigabe nicht abgeschlossen.
- **76 neue unvertonte, deutsche Sprechkontexte** gespeichert in `kids/data/academy-voice-editorial-147-150-delta-v1.json`; Konsistenzabgleich des Delta-Textes gegen das JS-Modul ergab **0 Abweichungen**. Auch der vorangehende Block 143–146: **0 Abweichungen** bei 76 Kontexten. Vor einer zukünftigen Audioerzeugung alle Deltas erst in den kanonischen Sprechplan integrieren. **0 generierte Audios / 0 Credits**.
- **Regressionstest hinzugefügt:** `kids/tools/test-academy-editorial-147-150-v1.cjs`; für 143–146 zusätzlich `test-academy-editorial-143-146-v1.cjs` ergänzt und den Stundentitel der Testdaten berichtigt. Der vollständige Node-/Browser-Lauf ist **noch offen**.
- **Fortschritt der fortlaufenden Redaktion jetzt bis 150/208; als Nächstes 151 ff.** Alle 624 Altersfassungen bleiben wissenschaftlich unfreigegeben. Kein Merge, kein Live-Deploy, keine Audioerzeugung.

## 14.10.2026 · Fortschritt bis Lektion 146 (Arbeitszweig PR #1113)

- **Neu seit dem vorherigen 141er-Stand:** Lektion **142** (hanbalitische Fiqh-Stunde über die fünf Gebetsnamen) mit **3 eigenständigen Altersfassungen**, `curriculum-editorial-142-v1.js`, **19** ungegenerierten Voice-Textkontexten und `research/EDITORIAL_REVIEW_142_20261014.md`. Qurʾān **11:114** enthält keine wörtliche Fünferliste; die Namen werden durch **Ṣaḥīḥ Muslim 612** und **Ibn Qudāmah, al-Mughnī Bd. 1 S. 224–227**, erläutert. `fiqhHumanReviewNeeded=true` und `scientificApproval=false` bleiben erhalten.
- **Lektionen 143–146** (Sunnah verstehen, Hiǧrah, Duʿāʾ beim Verlassen des Hauses, Herkunft respektieren) mit **12 selbständig formulierten Altersfassungen**, `curriculum-editorial-143-146-v1.js`, **76** nicht erzeugten Sprechtextkontexten und der Quellenakte `research/EDITORIAL_REVIEW_143_146_20261014.md`.
- **Kollision 130–133 bereinigt:** Aus einer parallelen Überschneidung entstanden getrennte autoritative Module `curriculum-editorial-130-v1.js` und `curriculum-editorial-131-133-v1.js`. Die spätere überlagernde Datei `curriculum-editorial-130-133-v1.js` samt gleichnamigem Voice-Delta wurde aus dem GitHub-Zweig entfernt. Quellen- und Hadithkorrekturen der spezifischen 131–133-Redaktion bleiben erhalten. Die Abhängigkeit von `curriculum-editorial-134-137-v1.js` wurde entsprechend repariert.
- **Stand der durch individuelle Redaktionsmodule abgedeckten Strecke 119–146:** **28 Lektionen, 84 Altersfassungen, 532 ungegenerierte Voice-Textkontexte** in neun Teilblöcken. Die Altersfassungen bestehen je aus vier inhaltlichen Lehrabschnitten, getrennten Alltagsbeispielen, Praxisaufgaben und Quellenabgrenzung. Der Reihenfolge- und Textintegritätscheck von Lektion 130–146 in dieser Sitzung ergab **0 Abweichungen** in 17 Lektionen/51 Altersfassungen und 323 Textkontexten. Der reproduzierbare Test `node kids/tools/test-academy-editorial-130-146-v1.cjs` ist hinterlegt, aber nicht über einen lokalen Node-Checkout ausgeführt.
- **Nächste Einzelredaktion: Lektion 147 ff.** (bis 208 bleiben **62** Lektionsentwürfe pädagogisch zu überarbeiten). Die ursprünglichen 208 Lektions-IDs und Quiz-/Fortschrittsdaten bleiben bestehen; bereits einzeln quellengesichtete ältere Fiqh-Slots bleiben gesonderte Prüffälle.
- **Unverändert:** 0/624 wissenschaftlich freigegebene Altersfassungen, **keine Audioerzeugung, 0 neue Audio-Credits, kein Merge, kein Live-Deploy**. Alle Sprach-Deltas müssen vor einer etwaigen späteren Aufnahme mit dem kanonischen Voice-Plan konsolidiert werden.

## 14.10.2026 · Unterricht 130–141 · Fortsetzung

- **12 weitere Unterrichtslektionen / 36 eigens verfasste Altersfassungen** in vier aufeinander aufbauenden PR-only Modulen: `curriculum-editorial-130-v1.js`, `curriculum-editorial-131-133-v1.js`, `curriculum-editorial-134-137-v1.js`, `curriculum-editorial-138-141-v1.js`. Alle sind nach den vorhandenen V38–V47-Modulen und nach 127–129, aber vor dem Term-Coach in `kids/akademie/index.html` geladen.
- Drei Quellenberichte unter `kids-akademie/research/`: `EDITORIAL_REVIEW_130_133_20261014.md`, `EDITORIAL_REVIEW_134_137_20261014.md`, `EDITORIAL_REVIEW_138_141_20261014.md`. Beim Fiqh-Slot 130 erfolgte ein erneuter Quellen-Teilabgleich von Ibn Qudāmah, `al-Mughnī`, Bd. 1 S. 224–227 (Islamweb 15/425, 15/428, 15/429). `fiqhHumanReviewNeeded=true` und `scientificApproval=false` bleiben.
- Wichtige Belegabgrenzungen: 131 tartīl ≠ erfundene Tajwīd-Detailregel; 132 Qurʾān 96:1 ≠ vollständige Sīrah; ergänzend Hadith von ʿĀʾišah aus Ṣaḥīḥ al-Buḫārī 3 / Muslim 160 nach Nummer verglichen; 133 Qurʾān 2:172 verlangt Dank, ergänzend Ṣaḥīḥ Muslim 2734 von Anas über Lob nach Essen und Trinken; keine unbelegte feste Formel erfunden; 135 belegte Allah-Namen ≠ freie Namensliste; 136 Muḥammad ﷺ als letztes Siegel der Propheten; 137 40:14 ist nur ein zusätzlich gekennzeichneter Vers zur Aufrichtigkeit neben 40:60; 140 digitale Medienregeln sind eigene Anwendung, nicht Wortlaut 17:36; 141 Hoffnung ohne Beschämung trauriger Kinder.
- Vier ungenerierte Voice-Textdeltas `academy-voice-editorial-130-delta-v1.json`, `academy-voice-editorial-131-133-delta-v1.json`, `academy-voice-editorial-134-137-delta-v1.json`, `academy-voice-editorial-138-141-delta-v1.json` enthalten zusammen **228 Text-Kontexte**; diese werden **vor einer späteren Audioerzeugung** erst in den kanonischen Sprechplan integriert. **0 erzeugte Audios, 0 Credits.**
- Spezifische Regressionstests hinterlegt: `kids/tools/test-academy-editorial-130-133-v1.cjs`, `test-academy-editorial-134-137-v1.cjs`, `test-academy-editorial-138-141-v1.cjs`. GitHub-JSON-/String-/Ladereihenfolge-Kontrolle erfolgreich; voller Node- und Browser-Lauf **noch ausstehend**.
- **Nächste Schritte:** Slot **142** (hanbalitisch teilgeprüfte fünf Gebetsnamen) bei Bedarf noch pädagogisch eigenständig vertiefen; danach **143–208** in der Lektionsreihenfolge. Alle 208 IDs existieren als Entwürfe, bisher **0/624 endgültige wissenschaftliche Freigaben**. **Kein Merge auf main, kein Live-Deploy und keine Audioerzeugung.**

## 14.10.2026 · Unterricht 127–129 fortgeführt

- **Drei weitere Lektionen / neun eigenständige Altersfassungen** in `kids/akademie/curriculum-editorial-127-129-v1.js` eingebunden. Die drei Themen sind Gastfreundschaft, Lernen mit Pausen und Reue nach eigenen Fehlern. Vorhandene IDs und Fragen bleiben bestehen.
- **Qurʾān-Korrekturen:** Slot 128 kennzeichnet den gespeicherten Versanfang zu **2:286** ausdrücklich als `excerpt:true`. Slot 129 verwendet ausschließlich den vollständigen Vers **39:53** einschließlich `قُلْ`; die zuvor fälschlich angehängten Sätze von **39:54/55** wurden entfernt.
- Die **57** Text-Sprechkontexte in `kids/data/academy-voice-editorial-127-129-delta-v1.json` entsprechen den tatsächlich eingebundenen Altersfassungen. Sie sind **nicht generiert**; die kanonische Sprachplandatei wurde nicht überschrieben.
- **Gesamtfortschritt in dieser Arbeitsrunde:** **11 Lektionen / 33 individuelle Altersfassungen (119–129)**; **209 neue oder synchronisierte Textkontexte** in drei getrennten Voice-Deltas; programmatische Konsistenzkontrolle: **0 Abweichungen** und korrekte Modulreihenfolge. Wissenschaftliche Freigabe weiterhin **0/624**; vollständiger Node-/Browser-Lauf noch nicht bestätigt.
- Quellenakte `kids-akademie/research/EDITORIAL_REVIEW_127_129_20261014.md`. **Als Nächstes:** Fiqh-Lektion 130 gesondert anhand al-Mughnī prüfen und dann Unterricht 131 ff. Kein Merge, kein Live-Deploy, keine Audioerzeugung.

## 14.10.2026 · Unterricht 123–126 ebenfalls redaktionell überarbeitet

- **Vier weitere Lektionen / zwölf Altersfassungen** auf dem PR-Arbeitszweig; Modul `kids/akademie/curriculum-editorial-123-126-v1.js` ist nach 119–122 in der Akademie-Vorschau eingebunden. Bestehende Lektions-IDs, Quizfragen, Lernfortschritt und Freigaben bleiben erhalten.
- **Wichtige Quellenkorrektur bei Slot 125:** Qurʾān 99:7 wird arabisch nur bis `خَيْرًا يَرَهُ` dargestellt; der zuvor versehentlich mitgespeicherte Satz zu Schlechtem gehört zu **99:8**. Kein automatisches wissenschaftliches Freigabeprädikat.
- Unvertonte deutsche Texte: `kids/data/academy-voice-editorial-123-126-delta-v1.json` mit **76** Kontexten und **0 Credits**, noch nicht kanonisch in `academy-voice-plan-v38.json` übernommen. Arabische Verslautschrift wurde aus den gesprochenen Kinderzeilen 124 und 125 entfernt, ohne die Qurʾān-Anzeige zu verlieren.
- Gesonderter Quellenbericht `kids-akademie/research/EDITORIAL_REVIEW_123_126_20261014.md`; Regressionstest `kids/tools/test-academy-editorial-123-126-v1.cjs` hinterlegt. Vollständige Node-/Browser-Regression und endgültige wissenschaftliche Einzelprüfung bleiben ausstehend.
- **Nächste pädagogische Lektionen: 127–129**, Fiqh 130 weiterhin gesonderter Prüffall. **0/624 Freigaben, kein Audio, kein Merge, kein Live-Deploy.**

## 14.10.2026 · Unterricht 119–122 einzeln redigiert

- **Jetzt tatsächlich im PR-Draft umgesetzt:** vier Stunden (119–122), **zwölf altersbezogene Unterrichtsfassungen** mit eigenständigem Lernziel, vier inhaltlichen Lerneinheiten, Alltagsbeispiel, Übung, Quellenabgrenzung und Abschluss. Die neue Datei `kids/akademie/curriculum-editorial-119-122-v1.js` wird nach den V44-Fragerevisionen und vor dem Term-Coach geladen. Originale Lektions-IDs, Qurʾān-Texte, Quizfragen und Freigabeattribute bleiben erhalten.
- **Nur gesprochene Textplanung:** 76 zugehörige deutsche Kontexte liegen als eigenes ungegeneriertes Delta in `kids/data/academy-voice-editorial-119-122-delta-v1.json`. Die kanonische V38-Voice-Datei wurde nicht stillschweigend überschrieben. **Vor jeder späteren Audioerzeugung** Textdelta gegen kanonischen Plan auflösen, Abdeckung neu testen und Qurʾān-Rezitation separat halten. 0 Audio-Aufträge/0 Credits aus diesem Paket.
- **Quellenbericht:** `kids-akademie/research/EDITORIAL_REVIEW_119_122_20261014.md`; bei 119–122 wurden Qurʾān-Grundlagen und indexierte Tafsīr-Passagen herangezogen, jedoch keine vollständige unabhängige Prüfung aller Primärseiten und Isnād abgeschlossen.
- **Reproduzierbare Regression hinterlegt:** `node kids/tools/test-academy-editorial-119-122-v1.cjs`. Lesen/Strukturprüfung der GitHub-Dateien erfolgreich; **ein echter Node-/Browser-Test wurde hier nicht ausgeführt** (kein ausführbarer Repository-Checkout verfügbar).
- **Nächste Priorität:** die schematischen Kindertexte **123–129** einzeln vertiefen, danach die übrigen unredigierten Stunden in Reihenfolge; Fiqh 130 und weitere Fiqh-Lektionen gesondert wissenschaftlich abgleichen. Alle 624 Fassungen bleiben wissenschaftlich nicht freigegeben. **Kein Merge, kein Live-Deploy, keine Audioerzeugung.**

## 14.10.2026 · Fiqh 166 und 174

- **Slot 166 – Qiyām:** Unterricht und Fragen aller Altersgruppen zum Stehen im Gebet präzisiert; Kinderschutz bei Schmerzen und körperlichen Einschränkungen; `al-Mughnī` Bd. 1, S. 277 (Islamweb 15/539, 15/538).
- **Slot 174 – Takbīrat al-Iḥrām:** Eröffnungsformel `Allāhu akbar` als Unterrichtskern; Qurʾān 17:111 nicht fälschlich als genaue Ritualanleitung; `al-Mughnī` Bd. 1, S. 276–277 (Islamweb 15/532, 15/533, 15/539).
- Prüfbericht: `kids-akademie/research/INDEPENDENT_FIQH_REVIEW_166_174.md`.
- Sprechplan als **reiner Text** mit den aktualisierten Fassungen synchronisiert; **1.433 unterschiedliche Textbausteine, 2.109 Verwendungen, 0 generierte Audios und 0 Credits**.
- 7 von 17 ausdrücklich markierten Fiqh-Slots haben damit mindestens einen unabhängigen klassischen Quellenabgleich (106, 118, 130, 142, 154, 166, 174). **Keine dieser Lektionen ist endgültig freigegeben.** Die nächsten Fiqh-Slots: 180, 186, 192, 198, 201, 204–208. Danach Altquellen und vollständige pädagogische Einzelprüfung.
- Node-/Browser-Regression sowie Freigabeverfahren sind weiterhin offen; kein Merge auf `main` und kein Live-Deploy.

## 14.10.2026 · Quizredaktion V39–V41 und zusätzliche Quellenprüfung

- **Slots 99–134:** 33 Lektionen mit **264 neu formulierten altersbezogenen Quizfragen** auf V39, V40 und V41; zusätzlich behalten Fiqh 106, 118 und 130 ihre 24 quellenbezogenen Fragen aus V38; korrekt nach V38 in `kids/akademie/index.html` eingebunden. Lernziele, Qurʾān-Originaltexte, IDs und Freigabestatus beibehalten. **Nächste offene Quizredaktion: Slots 135–208 (74 Lektionen).**
- **Spezifische Prüfskripte** `kids/tools/test-academy-v39-quiz-v1.cjs`, `test-academy-v40-quiz-v1.cjs` und `test-academy-v41-quiz-v1.cjs` hinterlegt. Simulierte JavaScript-Ladung der drei Module war erfolgreich, voller Node-/Browser-Lauf noch nicht ausgeführt.
- **Zusätzliche Quellenakte 106:** `kids-akademie/research/FIQH-106-REVIEW.md` mit direkt gelesenen Ibn-Kaṯīr- und al-Mughnī-Fundstellen; drei neue Registereinträge (`SRC-FIQH106-*`). Keine vollständige Fiqh- oder Kinderfreigabe.
- **Unverändert:** 0/624 wissenschaftlich freigegebene Altersfassungen, keine Audioerzeugung, kein Merge auf `main`, kein Live-Deploy.
- Achtung: Es existieren weitere **unabhängige Fiqh-Überarbeitungen** im selben Arbeitszweig (siehe darunter); bei Fortsetzung jeweils den aktuellen GitHub-Kopf prüfen, nicht blind überschreiben.

## 14.10.2026 · Fiqh-Lektion 142 nachgearbeitet

- **Slot 142 – fünf Gebetsnamen:** Statt einer Übung über fehlende Quellenangaben lernen die Kinder jetzt tatsächlich **Faǧr, Ẓuhr, ʿAṣr, Maġrib, ʿIšāʾ**. Drei Altersfassungen, acht Quizfragen, sprechbare Texte und Text-Audioplan aktualisiert. Klassische Quelle `al-Mughnī`, Bd. 1, S. 224 ff. (Islamweb 15/425, 15/428, 15/429).
- Prüfakte: `kids-akademie/research/INDEPENDENT_FIQH_REVIEW_142.md`.
- Die Quellenabgleiche **106, 118, 130, 142 und 154** bleiben jeweils **ohne abschließende menschliche Freigabe**; `fiqhHumanReviewNeeded=true` bleibt an allen 17 vorgeschriebenen Fiqh-Lektionen gesetzt. Kein Audio generiert.
- Als Nächstes die Gebetsabfolge **166, 174, 180, 186, 192, 198, 201, 204, 205** quellenkritisch und altersgerecht bearbeiten. Zusätzlich werden die älteren 34 ungeprüften und 50 lediglich mit Metadaten belegten Lektionen geprüft.

## 14.10.2026 · Fiqh-Lektion 154 nachgearbeitet

- **Niyyah (Slot 154):** Kindertext enthielt unklare Übung „Wir sagen den Namen laut“. Anhand Ibn Qudāmah, `al-Mughnī`, Bd. 1, S. 278 (Islamweb 15/542) durch drei Altersfassungen, acht Quizfragen und alle zugehörigen ungenerierten Voice-Texte ersetzt. **Die Absicht ist im Herzen; die Lernkarte ist keine Gebetsformel.**
- Quellenbericht: `kids-akademie/research/INDEPENDENT_FIQH_REVIEW_154.md`.
- V38-Sprachplan jetzt **1.412 einzigartige Textbausteine und 2.109 Kontexte**, `generateCreditsUsed=0`. Strukturprüfung direkt gegen GitHub-Dateien: keine Abweichung. Ein Node-/Browser-Testlauf bleibt offen.
- Fiqh-Quellenabgleiche zu 106, 118, 130 und 154 sind **keine endgültigen wissenschaftlichen Freigaben**. Alle 17 vorgesehenen Fiqh-Lektionen behalten den menschlichen Prüfstatus.
- **Als Nächstes:** Slot 142 „Die Namen der fünf Gebete“ anhand von `al-Mughnī` und den darin dokumentierten Sunnah-Belegen prüfen; weitere einzelne Kinderlektionen pädagogisch vertiefen.

## 14.10.2026 · Fortschritt nach der ersten V38-Korrekturrunde

- **Fiqh 118 – Gebetsplatz:** `al-Mughnī`, Bd. 1, S. 404–405 (Islamweb 15/788) wurde gelesen. Kein besonderer Teppich aus Qurʾān 2:238 abzuleiten. Drei Belegerklärungen und acht Altersquizfragen korrigiert.
- **Fiqh 130 – Gebetszeiten:** `al-Mughnī`, Bd. 1, S. 224–227 (Islamweb 15/425, 15/428, 15/429) zu den Zeitgrenzen gelesen. Drei Belegerklärungen und acht Altersquizfragen korrigiert.
- Nachweis: `kids-akademie/research/INDEPENDENT_FIQH_REVIEW_118_130.md`.
- **Weiterhin 17/17 Fiqh-Lektionen mit menschlichem Fiqh-Prüfbedarf**, darunter die jetzt teilweise gegen Quellen geprüften 106, 118 und 130. Es wurde kein wissenschaftlicher Freigabestatus hochgesetzt.
- Die Aktualisierung ändert keine Kinder-Audiotexte; der unvertönte Sprechplan muss dafür nicht neu generiert werden.
- Nächster Fiqh-Fokus: 142 (Namen der fünf Gebete), dann 154 (Niyyah); pädagogische Einzelprüfung aller 208 Lektionen bleibt offen.

# Nächste Aufgaben

## Neu: erste unabhängige Quellen-Teilabgleiche

- **Lektion 98 (Mobbing):** Qurʾān 49:11, 16:90 und 49:10 anhand indexierter Islamweb-Ibn-Kaṯīr-Auszüge und Dorar-Tafsīr quellenübergreifend verglichen. Der direkte Öffnungskanal für die Islamweb-Seite war hier nicht zugänglich. Der vollständige Primärtext wurde daher nicht erneut gelesen. Die Grenze zwischen 49:10 und zusätzlicher Kinderschutzregel wurde präzisiert. Siehe `kids-akademie/research/INDEPENDENT_REVIEW_98.md`.
- **Fiqh-Slot 106 (Gebetskleidung):** indexierter Ibn-Qudāmah-Text aus `al-Mughnī` (Bd. 1, S. 401, Islamweb Inhalt `15/783`) und Tafsīr Ibn Kaṯīr zu 74:4 verglichen. Kindgerecht klargestellt, dass gewöhnlicher Staub/Flecken nicht mit jeder rituellen `naǧāsah` gleichzusetzen sind. **`fiqhHumanReviewNeeded=true` bleibt**, keine Fiqh-Freigabe. Siehe `kids-akademie/research/INDEPENDENT_FIQH_REVIEW_106.md`.
- **Strenger Daten-Audit:** Der exakte `.cjs`-Prüfcode wurde anhand der aktuellen GitHub-Dateien in einer JavaScript-Prüfumgebung mit schreibgeschütztem Dateizugriff ausgeführt: **111 Lektionen, 333 Altersfassungen, 1.407 Voice-Texte, 2.109 Textverwendungen, 0 beanstandete sichtbare QA-Formulierungen bzw. Verweisfehler.** Ein echter Node-Prozess im Projekt sowie Browser-Regressionen sind weiterhin durchzuführen. Keine religiöse Freigabe.

## Prioritäten nach der ersten GitHub-Korrekturrunde

**Nicht wieder von 97/208 beginnen.** Die 208 IDs existieren. Die erste automatische Redaktion der V38-Kindertexte, der Quizfragen, der Qurʾān-only-Ansicht und des unvertonten Sprechplans ist bereits auf diesem Zweig committed. V38 enthält weiterhin 111 Lektionen mit 333 Altersfassungen, jetzt 888 Fragen und 1.407 einzigartige Sprechbausteine. Es bleibt ein Entwurf.

1. **Jetzt automatisiert testen:** `node kids/tools/audit-academy-visitor-copy-v1.cjs --strict`; außerdem alte Akademie-, Lernfortschritt-, Audio-Plan- und Jahresplan-Regressionen ausführen. Diese neuen Node-Tests wurden nach der Korrekturrunde noch nicht als durchgelaufen bestätigt. Repariere echte Fehler, ohne alte Lernfortschritts-IDs oder `sidq` zu verändern.
2. **Pädagogisch einzeln lesen:** Schwerpunkt 99–208 – generische Einleitungssätze und schematische Quizalternativen mit kindgerechten, thematisch unterscheidbaren Unterrichtsgeschichten, Fragen und Antworten verbessern. Lektion 98 auf Kinderschutz und klare Trennung von Vers und Schutzübung überprüfen. Keine erfundenen Aussagen.
3. **Wissenschaftlich quellenprüfen:** 17 bereits markierte Fiqh-Slots mit tatsächlich eingesehenen klassischen hanbalitischen Quellen; 34 ältere `not-reviewed`-Slots und 50 nur geerbte Metadaten nachprüfen. Ungelesenes nicht als geprüft darstellen. Quellenlinks inkl. Inhalt/Vers/Kapitel dokumentieren.
4. **Sprechplan nur als Text:** `academy-voice-plan-v38.json` ist synchronisiert, aber kein einziges Audio wurde generiert. Keine ElevenLabs-Aufträge oder synthetische Qurʾān-Rezitation.
5. **Harte Veröffentlichungssperre:** Keine Unterrichtsfreigabe allein wegen bestandener technischer Tests. Kein Merge/Live-Deploy ohne ausdrückliche Entscheidung.

Die frühere Aufgabenliste bleibt unten als historischer Status der ersten V38-Produktion stehen.


Die 208 Slots haben auf diesem Zweig eine Lektions-ID und drei Altersfassungen. Das ist der technische Entwurf, keine Freigabe.

1. Slots 98–208 stehen in `kids/akademie/curriculum-v38.js`. Der arabische Wortlaut ist der auf Islamweb, Tafsīr Ibn Kaṯīr, Buch 49, am 13. Oktober 2026 markierte Versauszug. Eine Hadithnummer wurde nicht ergänzt. Die Fassungen 4–5 und 6–8 lehren Verssinn, Alltag und Übung. Die Fassung 9–10 behält die Quellengrenze. Lektion 98 ist die Schutzstunde zu Mobbing: erkennen, sich nicht selbst die Schuld geben, eine vertraute erwachsene Person holen. Belege dort: 49:11, 16:90, 49:10. Die Sätze „nicht schuld“ und „Hilfe holen“ sind als Schutzregel gekennzeichnet, nicht als Verssatz.
2. Fiqh-Stunden 106, 118, 130, 142, 154, 166, 174, 180, 186, 192, 198, 201, 204, 205, 206, 207 und 208 haben `fiqhHumanReviewNeeded: true`. Al-Mughnī, al-Kāfī und ʿUmdat al-Fiqh wurden dafür nicht gelesen. Gebetshaltungen sind Lehrerübung. Ramaḍān nennt kein Kindesalter. Zakāh und Ḥaǧǧ nennen keine Ritenliste und keine Nisab-Rechnung.
3. Dieselbe Qurʾān-Stelle trägt manchmal zwei Lernziele. Das Feld `sameLocusAsSlot` nennt den früheren Slot. Die Texte sind verschieden; die Fundstelle ist dieselbe.
4. Slots 87–90 bleiben `metadata-in-repository-not-reverified`. Die dort genannten Nummern wurden in diesem Lauf nicht erneut gelesen.
5. 34 ältere Slots bleiben `not-reviewed`. 50 bleiben bei geerbten Metadaten. 6 Dorar-Stichproben (79, 82, 83, 84, 85, 86) wurden nicht erneut geöffnet. Dorar, al-Maktaba und Shamela antworteten in diesem Lauf nicht als erneut gelesene Seiten.
6. `sidq` nicht in den Katalog schieben. 208 IDs und 207 Katalogmodule sind korrekt.
7. Keine Audioerzeugung, kein Merge auf `main`, kein Live-Deploy. `approvedAgeVersions` bleibt 0, bis eine menschliche Freigabe das ändert.
