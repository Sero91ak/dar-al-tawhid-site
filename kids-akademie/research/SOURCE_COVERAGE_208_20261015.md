# DĀR AL TAWḤĪD KIDS AKADEMI · Quellenabdeckung aller 208 Lektionen

**Prüfdatum:** 15. Oktober 2026  
**Arbeitszweig:** `chatgpt/kids-akademie-155-158-20261014` · Draft-PR #1142 · **keine Veröffentlichung**

## Ergebnis der reproduzierbaren Registerprüfung

| Punkt | Nachgeprüft |
|---|---:|
| Lektions-IDs im Jahresplan | 208 |
| Mit mindestens einer Quelle im zentralen Register verbunden | **208/208** |
| Quellenregistereinträge | 218 |
| Eindeutige Source-IDs | 218 |
| Eindeutige technische Quellenschlüssel (`key`) | 218 |
| Lektions-IDs ohne HTTPS-Direktnachweis | 0 |
| Unbekannte Lektions-IDs in Quellenbindungen | 0 |
| Wissenschaftlich endgültig freigegebene Altersfassungen | **0/624** |
| Aus den neuen Quellenarbeiten erzeugte Audios | **0** |

**Das ist eine vollständige technische Quellenbindung, nicht die 208-fache wissenschaftliche Überprüfung des Quelleninhalts.** Die Gesamtfreigabe bleibt ausdrücklich gesperrt.

## Abgeschlossene Bindungslücken

1. **57–64:** Acht vorhandene ältere Lektionsnachweise aus `curriculum-v27.js` bis `curriculum-v29.js` durch neue, klar markierte Quellenregistereinträge referenziert. Nur die im Originalprojekt gespeicherten Sammlungen, Nummern, Erzähler, Verse und Links übernommen. Keine neuen Hadithtexte ausgedacht.
2. **65–90:** 26 vorhandene ältere Lektionsnachweise aus `curriculum-v29.js` bis `curriculum-v35.js` übernommen. `verificationStatus=legacy-lesson-documentation-not-independently-reverified-2026-10-15` und `checkedOn=null` kennzeichnen die noch ausstehende unabhängige Kontrolle.
3. **3, 7, 11:** Die frühen Fiqh-Grundlagen durch **bereits vorhandene** Tafsīr-/Sunnah-Nachweise im Register verbunden, ohne neue ungesicherte Gesetzesaussagen. Quellen: `SRC-V38-74-4`, `SRC-CORE46-MUSLIM-223` (Reinheit); `SRC-CORE46-IBNKATHIR-376`, `SRC-BANK-002` (Wuḍūʾ); `SRC-CORE30-TABARI-3226`, `SRC-CORE30-BUKHARI-631` (Gebet).

## Erste neu unabhängig gegengeprüfte Überlieferungen (15.10.2026)

- **Slot 57, Zorn:** [Dorar, al-Buḫārī Nr. 6116](https://dorar.net/hadith/sharh/151063) – Abū Hurayrah; arabischer Kurzbeleg `لا تغضب`, die wiederholte prophetische Ermahnung. Der historische Lektionsbeleg entspricht Überlieferung und Nummer. Wichtige pädagogische Grenze: Zorn ist als Gefühl von einem schädigenden Handeln zu unterscheiden.
- **Slot 58, Wuḍūʾ:** [Dorar, Überlieferung von ʿUṯmān über Ḥumrān](https://dorar.net/hadith/sharh/3683) – al-Buḫārī Nr. 164 und die in der Dorar-Auswertung getrennt wiedergegebene Parallelfassung Nr. 1934. Die gebetswaschenden Schritte sind im Bericht genannt. Kinderübungen und hanbalitische Einzelpflichten verlangen weitere Prüfung. Kein falscher Widerspruch zwischen Editionsnummern behauptet.

Die beiden geprüften Source-IDs heißen `SRC-CORE57-LEGACY-HADITH-6116` und `SRC-CORE58-LEGACY-HADITH-164`; ihre Kennzeichnung wurde zu `hadith-number-narrator-arabic-verified-dorar-2026-10-15-not-final-fiqh-approval` präzisiert. **32** neu gebundene historische Hadith-Einträge benötigen weiterhin unabhängige Nachprüfung.

## Technische Defekte behoben

- Elf vorher existierende Datensätze 91–97 hatten keine `key`-Eigenschaft. Alle erhalten nun eindeutige stabile Schlüssel der Form `legacy-src-…`. Kein Originalquellenlink, keine Quellen-ID, kein Lektionsbezug verändert.
- Sechs ältere Einträge enthielten einen zu unklaren Freigabevermerk. Ihr `authenticityNote` sagt jetzt ausdrücklich, dass Wortlaut, Nummerierung und Überlieferung noch nicht unabhängig verifiziert wurden; `checkedOn` bleibt leer.
- Die Regression `kids/tools/test-academy-source-registry-complete-v1.cjs` prüft 208 Zuordnungen, eindeutige Keys und IDs, vorhandene HTTPS-Nachweise, unveränderte Freigabesiegel sowie explizit offene historische Quellen. Eine **äquivalente read-only-Datenprüfung** ergab am 15.10.2026 **0 Fehler**; ein **tatsächlich ausgeführter Node-/Browser-/CI-Lauf** ist damit noch nicht nachgewiesen.

## Nächste verpflichtende Arbeit

1. Die **32 historisch übernommenen, noch nicht unabhängig überprüften Hadithnachweise** anhand ihrer ursprünglichen Ṣaḥīḥ-/Sunan-Stellen nachziehen. Die bloße Zuordnung oder der frühere Dateivermerk `religiousSourcesVerified=true` ist **kein** Beweis eines aktuellen Primärabrufs.
2. Sämtliche Fiqh-Lektionen, insbesondere die 17 ausdrücklich für vertiefte Prüfung genannten Slots (106, 118, 130, 142, 154, 166, 174, 180, 186, 192, 198, 201, 204, 205, 206, 207, 208) im gesamten hanbalitischen Kontext fachwissenschaftlich prüfen; Lehrer- und Kinderschutzgrenzen beibehalten.
3. Quellenangaben und deutsche Erklärung in **allen 624 Altersfassungen** auf beleggetreue Aussagen prüfen; zwischen Wortlaut, sinngemäßer Übersetzung, Tafsīr und Kinderbeispiel trennen.
4. Erst nach erfolgreichem echten Node-/Browser-Regressionslauf, pädagogischer Freigabe und wissenschaftlicher Prüfung über Integration entscheiden. **Keine Audioerzeugung, keine Live-App-Änderung und kein automatischer Merge.**
