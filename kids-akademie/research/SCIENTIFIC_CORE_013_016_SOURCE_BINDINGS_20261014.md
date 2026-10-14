# DĀR AL TAWḤĪD KIDS AKADEMI · Quellen- und Zuordnungsprüfung Lektionen 13–16

**14. Oktober 2026 · geschützter GitHub-Zweig** `chatgpt/kids-akademie-155-158-20261014`. Die 208 Lektions-IDs und 624 Altersfassungen sind redaktionelle Entwürfe; **keine wissenschaftliche Endfreigabe, kein Audio, kein Merge/Live-Deploy**.

## Ziel und Befund

Die vier Lernstunden 13–16 waren im Statusledger als `sourceStatus: not-reviewed` gekennzeichnet und hatten **keinen direkten lessonId-Eintrag im zentralen Quellenregister**. Das ist ein fehlender Index-/Prüfschritt, kein hinreichender Nachweis für fehlende Inhalte. Bestehende, früher geprüfte Quellen werden wiederverwendet, statt Duplikate anzulegen. Für die Fiqh-Stunde 15 wurde eine neue klassische Originalquelle **unmittelbar** nachgelesen.

| Slot | Vorhandene Lektions-ID | Fachquelle und konkreter Nachweis | Art |
|---|---|---|---|
| 13 · Geduldig warten | `akhlaq-sabr-geduldig-warten` | Ibn Kaṯīr, Tafsīr **2:153**, Bd. 1 S. 467, [Islamweb 49/184](https://www.islamweb.net/ar/library/content/49/184) | Wiederverwendung `SRC-CORE5-IBNKATHIR-184`, bereits für frühe Lektion 5 geprüft |
| 14 · Salām erwidern | `adab-salam-salam-erwidern` | al-Qurṭubī, Tafsīr **4:86**, Bd. 5 S. 256, [Islamweb 48/1095](https://islamweb.net/ar/library/content/48/1095) | Wiederverwendung `SRC-CORE2-QURTUBI-1095`, bereits für frühe Lektion 2 geprüft |
| 15 · Saubere Kleidung | `fiqh-taharah-saubere-kleidung` | **Ibn Qudāmah, al-Mughnī**, Kitāb aṣ-Ṣalāh, Kapitel Gebet mit Verunreinigung, **Bd. 1 S. 401**, [Islamweb 15/783](https://gcp.islamweb.net/ar/library/content/15/783/%D8%A8%D8%A7%D8%A8-%D8%A7%D9%84%D8%B5%D9%84%D8%A7%D8%A9-%D8%A8%D8%A7%D9%84%D9%86%D8%AC%D8%A7%D8%B3%D8%A9-%D9%88%D8%BA%D9%8A%D8%B1-%D8%B0%D9%84%D9%83#:~:text=%D8%A7%D9%84%D8%B7%D9%87%D8%A7%D8%B1%D8%A9%20%D9%85%D9%86%20%D8%A7%D9%84%D9%86%D8%AC%D8%A7%D8%B3%D8%A9) | **Neuer eigenständiger Primär-Fachbeleg** `SRC-FIQH15-MUGHNI-783` |
| 16 · Allah ist Einer | `aqidah-tawhid-allah-ist-einer` | Ibn Kaṯīr, Tafsīr **112:1–4**, [Islamweb 49/1984](https://www.islamweb.net/ar/library/content/49/1984) | Wiederverwendung `SRC-V38-112-1`, das bereits den Wortlaut aller vier Verse enthält |

## Neue Originallektüre zum hanbalitischen Fiqh, Slot 15

Bei **Ibn Qudāmah, al-Mughnī, Bd. 1 S. 401 / Islamweb 15/783**, wird die Reinheit von Naǧāsah an Körper und Kleidung als Bedingung der Gebetsgültigkeit in der Mehrheitsmeinung behandelt:

`الطَّهَارَةُ مِنَ النَّجَاسَةِ فِي بَدَنِ الْمُصَلِّي وَثَوْبِهِ شَرْطٌ لِصِحَّةِ الصَّلَاةِ`

Der Text führt Qurʾān **74:4** (`وَثِيَابَكَ فَطَهِّرْ`) und weitere Überlieferungen in seiner Begründung an. Er diskutiert zugleich unterschiedliche frühe Meinungen. Deshalb wird aus dieser Teilstelle **kein unqualifizierter Spruch über jeden Fleck, vergessene Verunreinigung oder krankheitsbedingte Ausnahme** gemacht. Die kindgerechte Lektion muss zwischen tatsächlicher religiöser Naǧāsah und gewöhnlicher Alltagsverschmutzung unterscheiden, ohne Kinder bei Unfällen zu beschämen. Ein menschlicher hanbalitischer Fachreview ist weiter erforderlich.

**Quellenlage:** Die Originalstelle 15/783 wurde am 14.10.2026 direkt eingesehen; bei Slots 13, 14 und 16 werden **bereits vorhandene und früher gekennzeichnete** Quellen verwendet, ohne einen neuen unabhängigen Abruf dieser drei Originalseiten zu behaupten.

## Integrität und weitere Arbeit

- Die Registry enthält nun **156 eindeutige Source-IDs** (vorher 155) sowie vier neue Lektionszuordnungen; drei bestehen aus wiederverwendeten Quellen, eine Quelle ist neu. `sourceCount` wurde entsprechend aktualisiert.
- Keine Änderung an Kindertexten, vorhandenen Qurʾān-Einblendungen, Quizfragen, Fortschrittsdaten, App-Oberfläche, Audio- oder Freigabeflags.
- `LESSON_STATUS.json` bleibt bei diesen Slots konservativ `sourceStatus: not-reviewed` bis zur **inhaltlichen Gesamtprüfung aller Altersfassungen, Originalzitate und Quizfragen**. Neu ergänzt wurde allein die Quellenbindung, **keine wissenschaftliche Abnahme**.
- Offene Indexlücken der nächsten Gruppe **17–28**: `akhlaq-sabr-nicht-aufgeben`, `adab-salam-zuerst-gru-en`, `fiqh-taharah-sauberer-lernplatz`, `aqidah-tawhid-nur-allah-anbeten`, `akhlaq-amanah-geliehene-dinge`, `adab-worte-bei-streit-sprechen`, `fiqh-wudu-gesicht-und-arme`, `aqidah-iman-die-engel`, `akhlaq-amanah-mein-versprechen`, `adab-worte-erst-nachdenken`, `fiqh-wudu-kopf-und-fu-e`, `aqidah-iman-die-gesandten`. Alle benötigen eine Zuordnung **mit überprüftem Vers- bzw. Hadithbezug**, bei Fiqh eine passende klassische Fachquelle. Wiederverwendbare Quellen zuerst prüfen; keine erfundenen Belege.
- Ein neuer technischer Registry-Regressionstest kann diese vier Zuordnungen absichern. Ein Test ist nicht bereits dadurch gelaufen, dass er im Repository liegt.

**Sicherheitsgrenze:** Kein Copilot, keine synthetische Qurʾān-Rezitation, kein Live-Deploy, keine Freigabe, kein Merge auf `main`.
