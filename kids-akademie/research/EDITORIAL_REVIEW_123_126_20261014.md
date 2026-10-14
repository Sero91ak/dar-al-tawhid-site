# Kinderunterricht 123–126 – redaktionelle Einzelprüfung und Quellenstand

**14.10.2026 · PR #1113 · Arbeitszweig `cursor/kids-akademie-208-fa8f`**

**Geltungsbereich:** Slots 123–126, zwölf altersgetrennte Unterrichtsfassungen (4–5, 6–8, 9–10). Nicht als Wissenschafts- oder Kinderfreigabe zu verstehen. `scientificApproval=false`, insgesamt `approvedAgeVersions=0`. Kein Audio, kein Live-Deploy, kein Merge.

## Redaktionelle Änderungen

- **123 · Tawḥīd · Allahs Wissen:** Drei eigene Erklärungen, jeweils mit einem konkret nachvollziehbaren Lernbeispiel und einer Übung. Menschen müssen beobachten und lernen; das wird nicht mit Allahs vollkommenem Wissen gleichgesetzt. Keine neu erfundene Aufzählung des Verborgenen.
- **124 · Īmān · Respekt vor allen Gesandten:** Glaube an alle Gesandten wird von der Frage verschiedener Ränge sauber getrennt. Lernbeispiele sind keine Sīrah-Überlieferungen. Referenz auf Slot 112 (`sameLocusAsSlot`) bleibt bestehen.
- **125 · Ikhlāṣ · Kleine gute Taten:** Im V38-Datenfeld `quran.arabic` waren Qurʾān 99:7 und 99:8 aneinandergereiht, obwohl nur 99:7 etikettiert war. Der neue Einzelunterricht überschreibt das Feld mit **99:7 allein**: `فَمَنْ يَعْمَلْ مِثْقَالَ ذَرَّةٍ خَيْرًا يَرَهُ`. Vers 99:8 bleibt ein ausdrücklich eigenständiger Folgevers. Die Botschaft über kleine Taten wird nicht als spezifischer Befehl zu Applausverzicht oder erfundenen Unterrichtsübungen ausgegeben.
- **126 · Akhlāq · Bescheidenheit:** `hawn` wird mit Ruhe, Würde und Verzicht auf Überheblichkeit erläutert. Bescheidenheit bedeutet nicht, in gefährlichen Situationen schweigen oder schutzlos bleiben zu müssen. Die Kinderschutzanwendung ist didaktisch, kein wörtliches Verszitat.

## Überprüfbare Stellen und Prüfgrenzen

| Slot | Primärstelle | Direktnachweis und tatsächlich erreichte Prüfgrenze |
| --- | --- | --- |
| 123 | Qurʾān 6:59 | Bereits im Katalog: Ibn Kaṯīr, Islamweb `https://www.islamweb.net/ar/library/content/49/434`. Direkte erneute Öffnung am 14.10.2026 nicht gelungen. Der Verswortlaut wurde mit dem separaten Qurʾān-/Tafsīr-Index abgeglichen; **kein** vollständiger Primärtext-Abgleich der Islamweb-Ausgabe behauptet. |
| 124 | Qurʾān 2:136 | **Direkt gelesen:** Ibn Kaṯīr, *Tafsīr*, Bd. 1, S. 449, Islamweb `https://www.islamweb.net/ar/library/content/49/140`. Ibn Kaṯīr erläutert `لا نفرق بين أحد منهم` durch den Glauben an sämtliche Gesandte und die Absage an selektives Glauben/Verwerfen. Keine Aussage von gleicher Stellung aller Gesandten daraus abgeleitet. |
| 125 | Qurʾān 99:7 (99:8 separat) | Katalogverweis: Ibn Kaṯīr auf Islamweb `https://www.islamweb.net/ar/library/content/49/1971` war direkt nicht erreichbar. Getrennte Verse waren dagegen in Islamwebs indexierter Darstellung zur Sūrah 99 und weiteren Tafsīr-Seiten erkennbar, unter anderem `https://www.islamweb.net/ar/library/content/201/5723`. **Versgrenze geprüft, vollständiger Ibn-Kaṯīr-Primärtext dieser Fundstelle noch offen.** |
| 126 | Qurʾān 25:63 | **Direkt gelesen:** Ibn Kaṯīr, *Tafsīr*, Bd. 6, S. 122, Islamweb `https://www.islamweb.net/ar/library/content/49/1305`. `هونا` wird als `بسکينة ووقار` beziehungsweise ruhige Würde ohne Hochmut erläutert; weder gespielte Schwäche noch eine Pflicht zum Dulden von Übergriffen abgeleitet. |

Aus den Tafsīr-Seiten wurden **keine neu nummerierten Ḥadīṯe** in die Kinderlektionen übernommen. Historische Figuren und Vorgänge werden nicht erfunden. Beim Qurʾān bleiben arabischer Wortlaut, sinngemäße deutsche Erklärung und freie Lehrübung unterscheidbar.

## Technische Integration und Sicherheit

- Das bestehende V38-Curriculum bleibt vollständig erhalten; über `curriculum-editorial-123-126-v1.js` werden ausschließlich die vier genannten Lektionen überschrieben.
- Die KIDS-Ansicht lädt den redaktionellen Block nach `curriculum-editorial-119-122-v1.js`. Lektions-IDs, alle Quizfragen, Lernfortschrittspositionen, `sidq` und `sourceAudit.scientificApproval=false` bleiben unverändert.
- Der unvertönte V38-Sprechtextplan ist für Slots 119–126 synchronisiert; keine Aufnahme oder synthetische Qurʾān-Rezitation wurde in Auftrag gegeben. `generateCreditsUsed=0`.
- Ab hier: Slots 127–129, Slot 130 separat Fiqh-geprüft, danach 131 ff. individuell redigieren.

**Offen:** Alle 208 Lektionen benötigen weiterhin unabhängige Prüfung einschließlich altersgerechter Didaktik, Quellenakten und, bei Fiqh, klassischer hanbalitischer Rechtsbelege. Diese vier Slots sind **noch nicht wissenschaftlich freigegeben**.
