# TAWḤĪD KIDS · Denken, Quellen prüfen, Wissen weitergeben

**Stand:** 31.10.2026 · **Status:** Entwurf vor islamwissenschaftlicher, pädagogischer, akustischer und Geräte-Abnahme.

## Ziel
Kinder zwischen 4 und 10 Jahren sollen nach einer Lektion nicht nur eine Antwort auswählen, sondern erklären können, was sie gelernt haben, die im Unterricht genannten Qurʾān- und Sunnah-Belege wiederfinden und eine eigene Frage an eine vertraute Person stellen.

## Grenzen
Keine frei generierten religiösen Antworten. Kein KI-Chat mit Kindern ohne fachlich geprüftes Retrieval und Schutzfilter. Keine erfundenen Zitate, kein automatisches Bewerten offener Antworten, keine Speicherung oder Weitergabe von Kinderantworten. Keine Kontaktaufnahme mit Fremden, keine viralen oder drängenden Einladungen. Eltern können die bestehende Lernakademie freiwillig gemeinsam mit dem Kind öffnen.

## 3 Stufen
1. **Selber denken:** eine altersgerechte Alltagssituation ohne Angst oder Beschämung; nicht sofort die Lösung offenlegen.
2. **Woher wissen wir das?** Quelle im vorhandenen dritten Unterrichtsschritt anzeigen; Originalarabisch, deutsche Bedeutung, Hadith-Paraphrase und Praxisbeispiel klar trennen.
3. **Weitergeben:** Kind stellt eine Frage an Eltern oder eine andere vertraute Person. Inhaltliche Richtigkeit wird nicht automatisch zertifiziert.

## Alter
4–5 Jahre: kurze konkrete Alltagssituation, mündliches Erzählen statt Schreibpflicht. 6–8: verständliche Begründung und sichere Anwendung. 9–10: Quellen unterscheiden, eigene Begründung und einen möglichen Irrtum prüfen.

## Audio
Neue Audios ausschließlich nach textlicher Endabnahme. Qurʾān vom vorhandenen Rezitator, keine synthetische Qurʾān-Rezitation. Fuṣḥā, arabische Ausdrücke und deutsche Satzmelodie durch echte menschliche Hörprüfung. Sprachisolation beachten: Deutsches „nur“ ist nicht arabisches Nūr. Vorhandene Aufnahmen nicht ersetzen und keine ElevenLabs-Credits ohne Freigabe verbrauchen.

## Release-Gate
Getrennte Profile, Mädchenfarben, arabische Schrift, Hoch-/Querformat, Scroll, Tastatur, Offline, 3 Altersgruppen und Kinderschutz auf iPhone/iPad tatsächlich testen. Keine Veröffentlichung an Besucher, bevor Issue #1535 sowie die einzelnen Lektionstexte fachlich geklärt sind.

## Umsetzungsstand dieses Drafts
- Zwölf **themenspezifische** Karteikarten-Situationen mit je drei **verschiedenen** Altersfassungen (36 redaktionelle Szenarien): die elf Grundlagen aus Curriculum V1 plus Ṣidq.
- Für weitere vorhandene modulare Lektionen greift vorerst nur ein **neutraler allgemeiner Gesprächsanstoß**. Das ist eine sichere Übergangslösung, **keine fertige individuelle Didaktik-Freigabe** für alle 66 Lektionen.
- Quellenfelder werden ausschließlich aus dem bereits geladenen, unveränderten Unterrichtsdatensatz übernommen; die Kinder können mit einem Button den echten Quellen-Unterrichtsschritt 3 erneut öffnen.
- Freiwilliger Elternhinweis öffnet nur die bestehende interne Route `/kids/`. Keine WhatsApp-/Social-Automatik, keine öffentliche Kinder-URL, keine Profilinformationen im Link.
- Die separat geladene Dialogdatei enthält keine neue Audioerzeugung. Solange die genaue Text-/Aussprachefreigabe offen ist, bleibt der neue Dialog **Text** und darf nicht als vollständig vertonte Funktion beworben werden.

## Abnahme auf echten Geräten
Für 4–5, 6–8 und 9–10 jeweils männliches und weibliches Profil: alle drei Dialogbuttons bedienen, große Schrift, horizontale/vertikale Orientierung, Seitenfokus 4 und 5, Rücksprung zum Quellenunterricht, Rückkehr zum Abschluss, Safe-Area-Scrollen hinter der Navigation, Offline-Verhalten, Screenreader und Quellenlinks prüfen. Die neue JS/CSS-Datei muss vor einer Freigabe in den Offline-/Service-Worker-Cache aufgenommen und die produktive PWA-Version korrekt angehoben werden. **Dieser Draft hat weder diesen Cache-Release noch eine Gerätetestfreigabe durchgeführt.**
