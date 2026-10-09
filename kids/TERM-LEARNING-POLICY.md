# DĀR AL TAWḤĪD Kids · Zweisprachiges Wortwissen (verbindlich)

Islamische Fachbegriffe bleiben im Duʿāʾ- und Quiz-Bereich erhalten. Kinder lernen den arabischen Begriff, seine deutsche Entsprechung und die Bedeutung in ganzen, natürlich formulierten Sätzen — in beide Sprachrichtungen.

**Beispiel:** „Duʿāʾ ist Arabisch und bedeutet Bittgebet. Ein Bittgebet ist eine Bitte an Allah. Der Prophet ﷺ sprach dieses Duʿāʾ, wenn er sich zum Schlafen legte.“

- Gemeinsame Terminologieliste: `kids/term-learning.js`; sichtbar beim Duʿāʾ und nach der Quiz-Antwort, altersgerecht mit maximal zwei Begriffen gleichzeitig.
- Der arabische Originaltext und geprüfte Quellen bleiben unverändert. Begriffe werden nicht automatisch falsch gleichgesetzt, etwa Ṣalāh (rituelles Gebet) und Duʿāʾ (Bittgebet).
- **Audio-Pflicht für zukünftige freigegebene Inhalte:** Begriff und deutsche Erklärung natürlich in den Sprechertext integrieren und mit der autorisierten Masterstimme produzieren. Texte nur zusammen mit neu erzeugten, geprüften Audio-Clips und passenden Manifest-Schlüsseln aktualisieren. Keine automatische System-TTS als Ersatz.
- Vorhandene Clips werden durch die zusätzliche Textanzeige nicht verändert. Ein sichtbarer Glossareintrag bedeutet noch keine vertonte Glossarerklärung.

## Duʿāʾ-Lernmodus · verbindliche Dreifach-Zuordnung (V1.09.00)

- Drei gestapelte Ebenen: **Arabischer Originaltext → Lautschrift → deutsche Bedeutung**. Zwei feine Trennlinien, nicht mehr; iPhone/iPad-Vollbildseite und Audio-Buttons unverändert.
- Jede Ebene markiert dieselbe `data-seg`-Wortposition bei Fingertipp, Einzelwort-Audio, Wort-für-Wort-Folge sowie Gesamt-/Langsam-Audio. Bei durchgehendem Audio dienen vorhandene Wortzeitmarken, andernfalls Näherungswerte; nur Wort-für-Wort nutzt die tatsächlichen Endereignisse der einzeln aufgenommenen Clips.
- 120 Duʿāʾs, 1.366 arabische Wortpositionen. Deutsche Bedeutungen liegen unter `kids/dua-word-meanings-v1.js`; sie sind sinngemäße Bedeutungsgruppen, nicht stets wörtliche 1:1-Übersetzungen.
- Für 20 bereits einzeln geprüfte Lautschriftreihen bleiben die vorhandenen Segmenttexte maßgeblich. Für 100 weitere Duʿāʾs nutzt `kids/dua-phonetic-alignment-v1.js` eine rechnerische, konservative Phonemzuordnung aus **bereits vorhandenen** Transliterationen. Diese automatische Zuordnung benötigt nachfolgende sprachliche Stichproben und ist nicht als fachlich endabgenommen zu bezeichnen.
- **Keinesfalls** die lateinischen Wörter nach gleicher Zeichenanzahl oder proportioniertem Leerzeichenindex verteilen, insbesondere bei Bindungen wie `ʿala-l-qawmi-l-kāfirīn`.
- Lange Duʿāʾs scrollen nur **innerhalb** der Leseebene. Die arabische Typografie wird bei Platzmangel nur bis zur Lesbarkeitsuntergrenze reduziert; eine separate Kurzzeile zeigt bei langem Scrollen die aktuelle deutsche Bedeutung.
- Die Regression wird mit `node scripts/kids-dua-trilingual-guard.js` geprüft. Für die Auslieferung müssen zusätzlich der allgemeine GitHub-Health-Check und die tatsächliche Cloudflare-Live-Prüfung erfolgreich sein.
