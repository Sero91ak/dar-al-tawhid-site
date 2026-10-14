# DĀR AL TAWḤĪD KIDS AKADEMI – Quellenbindung der Lektionen 17–20

**14.10.2026.** Nur geschützter Branch `chatgpt/kids-akademie-155-158-20261014`/Draft-PR #1142. **Keine wissenschaftliche Endfreigabe, kein Merge auf main, kein Live-Deploy, kein Audio, kein Copilot.**

Die vier Lektions-IDs existierten bereits im Vertiefungskatalog `kids/akademie/curriculum-v2.js`. Sie verwenden die Basis-`sourceId`-Zuordnung der frühen Stunden; im zentralen Quellenregister `SOURCE_REGISTRY.json` fehlten bis jetzt eigenständige `lessonIds` für diese vier Vertiefungen. **Keine vier neuen Lektions-IDs** wurden erzeugt.

| Slot | Unterrichts-ID und Thema | Jetzt zugeordnete Originalquelle | Prüfung |
|---|---|---|---|
| 17 | `akhlaq-sabr-nicht-aufgeben` – Nicht aufgeben | **Ibn Kaṯīr** zu Qurʾān 2:153, Islamweb 49/184, `SRC-CORE5-IBNKATHIR-184`; **al-Buḫārī 1469 / Muslim 1053**, Bericht von Abū Saʿīd al-Ḫudrī, `SRC-CORE5-BUKHARI-1469` | Beide Quellen zuvor für Lektion 5 tatsächlich nachgelesen; **Wiederverwendung, keine neue Primärkontrolle** |
| 18 | `adab-salam-zuerst-gru-en` – Zuerst grüßen | **Ṣaḥīḥ Muslim 54**, von Abū Hurayrah, `أفشوا السلام بينكم`, `SRC-CORE2-MUSLIM-54`, [Islamweb 1/152](https://www.islamweb.net/ar/library/content/1/152#:~:text=%D8%A3%D9%81%D8%B4%D9%88%D8%A7%20%D8%A7%D9%84%D8%B3%D9%84%D8%A7%D9%85%20%D8%A8%D9%8A%D9%86%D9%83%D9%85) | Bereits für Lektion 2 unmittelbar kontrolliert; **Wiederverwendung**. Qurʾān 4:86 regelt die **Antwort**, nicht die Initiative des Grußes |
| 19 | `fiqh-taharah-sauberer-lernplatz` – Sauberer Lernplatz | **al-Buḫārī 2989 / Muslim 1009** von Abū Hurayrah, `وَيُمِيطُ الْأَذَى عَنِ الطَّرِيقِ صَدَقَةٌ`, neuer `SRC-CORE19-BUKHARI-2989`, [Dorar 70324](https://dorar.net/hadith/sharh/70324#:~:text=%D9%88%D9%8A%D9%85%D9%8A%D8%B7%20%D8%A7%D9%84%D8%A3%D8%B0%D9%89%20%D8%B9%D9%86%20%D8%A7%D9%84%D8%B7%D8%B1%D9%8A%D9%82) | **Neuer digital nachgelesener authentischer Bericht**, nicht Originaldruck. Über Entfernung schädlicher Hindernisse **auf dem Weg**, nicht über rein ritualrechtliche Naǧāsah oder ein allgemeines Papierschnipselgebot |
| 20 | `aqidah-tawhid-nur-allah-anbeten` – Nur Allah anbeten | **Ibn Kaṯīr zu 51:56**, `SRC-V38-51-56`, [Islamweb 49/1772](https://www.islamweb.net/ar/library/content/49/1772), und **al-Buḫārī 2856 / Muslim 30**, Bericht von Muʿāḏ ibn Ǧabal, `SRC-CORE4-BUKHARI-2856`, [Dorar 11568](https://dorar.net/hadith/sharh/11568) | Beide bestehende früher recherchierte Quellen wiederverwendet; Qurʾānvers und authentischen Ḥadīṯ **als verschiedene Quellengattungen** kennzeichnen |

## Wichtige Fiqh- und Kinderschutz-Abgrenzung bei 19

Die alte Lektions-ID hat als `sourceId` die Basiseinheit `fiqh-taharah`. Ihre heutige Szene handelt aber vom **Aufräumen des Lernplatzes nach dem Basteln**. Die klassischen al-Mughnī-Texte `SRC-FIQH118-MUGHNI-784` usw. behandeln die **Reinheit des tatsächlichen Gebetsplatzes**, nicht das Wegräumen beliebiger sauberer Papierschnipsel. Darum **keine** falsche Primärquellenbindung dieser Sonderstelle an die Schulszene. Der neu überprüfte authentische Ḥadīṯ betrifft ebenfalls **den Weg**; die vorsichtige Übertragung auf sichere Lernraum-Ordnung ist als **eigene pädagogische Analogie**, nicht als wörtlicher Prophetensatz oder neue religiöse Pflicht zu kennzeichnen. Kinder dürfen nur ungefährliche Dinge aufheben; bei Glasscherben, Spritzen, unbekannten Stoffen und Gewalt immer Erwachsene holen. **Drei Fiqh-Altersfassungen und ihre bisherigen Versanzeigen müssen später zusätzlich unabhängig überprüft werden**, ehe wissenschaftlich freigegeben wird.

Dorar 70324 führt zusätzlich in einer leicht anderen Wiedergabe eine Buḫārī-Zählung **2891** an; der eigens zitierte hier genutzte Wortlaut mit der Buḫārī-Zahl **2989** wird auf derselben Seite ausdrücklich zusammen mit Muslim **1009** geführt. Keine neuen Texte aus einem eigenständig durchgesehenen gedruckten Buḫārī vortäuschen.

## Technisches Ergebnis und Sperren

- Quellenregister jetzt **157 eindeutige IDs** statt 156: **ein neuer Bericht** und **fünf Verknüpfungen mit bestehenden Quellen** für die vier alten Unterrichtseinheiten.
- Basislektion, Quiztexte, alle vorhandenen Altersfassungen, Audiovorgaben, Quellen-Anzeigeobjekte und Lernfortschritt wurden **nicht umgeschrieben**. Nur das zentrale Quellenregister, die Forschungsakte und dessen technischer Prüfumfang wurden erweitert.
- Das Ledger `LESSON_STATUS.json` wird **nicht** automatisch auf `approved` gesetzt. Diese Verknüpfung ist eine abgeschlossene **Indexierung**, keine abgeschlossene Gesamtquellen-/pädagogische Kontrolle.
- **Nächste vier:** 21 (`akhlaq-amanah-geliehene-dinge`), 22 (`adab-worte-bei-streit-sprechen`), 23 (`fiqh-wudu-gesicht-und-arme`), 24 (`aqidah-iman-die-engel`). Gerade bei Wuḍūʾ 23 die richtige Versgrenze Qurʾān 5:6 und die klassische hanbalitische Primärquelle überprüfen.
- Wissenschaftlich **0/624 Altersfassungen endgültig freigegeben**. Keine Audioerzeugung oder Kreditausgabe.
