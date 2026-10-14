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
