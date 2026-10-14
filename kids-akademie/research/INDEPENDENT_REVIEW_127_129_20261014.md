# Redaktion und Quellen-Teilabgleich – Lektionen 127–129

**14. Oktober 2026 · PR #1113 · Arbeitsentwurf, wissenschaftlich NICHT freigegeben.**

## Umfang

Die Lektionen 127–129 haben je drei eigenständig verfasste deutsche Altersfassungen (4–5, 6–8 und 9–10 Jahre), je vier Unterrichtsabschnitte, eine altersgerechte Situation, praktische Übung und Beleggrenze. Die Texte stehen in `kids/akademie/curriculum-editorial-127-129-v1.js`; das Modul wird nach der Redaktion 123–126 geladen. Lern-IDs und Reihenfolge bleiben erhalten.

### 127 – Mit Gästen freundlich umgehen

**Qurʾān 51:24** nennt die geehrten Gäste Ibrāhīms. Im Unterricht wird daraus ein höflicher Gruß und ein Hilfsangebot entwickelt. Spätere Teile der Qurʾān-Erzählung und die konkrete heutige Wohnungsszene werden nicht als Inhalt von 51:24 ausgegeben. Niemand wird zu Körperkontakt mit Gästen verpflichtet.

- Bereits registrierter Ibn-Kaṯīr-Verweis: https://www.islamweb.net/ar/library/content/49/1768
- Zusätzlicher Text-/Kontextabgleich: [Dorar – adh-Dhāriyāt 24–30](https://dorar.net/tafseer/51/5)

### 128 – Lernen und Pausen ausgleichen

**Qurʾān 2:286** lehrt zu Beginn, dass Allah keiner Seele mehr auferlegt, als sie tragen kann. Das V38-Feld enthielt bisher nur einen **Ausschnitt** des langen Verses, bezeichnete ihn aber als vollständigen Vers. Das Overlay setzt jetzt einen eindeutig markierten **Versanfangs-Auszug** mit `excerpt=true`. Eine konkrete Minutenregel für Lernzeiten lässt sich daraus nicht ableiten. Pausen- und Hilfsregeln bleiben altersgerechte Unterrichtsdidaktik.

- Bereits registrierter Ibn-Kaṯīr-Verweis: https://www.islamweb.net/ar/library/content/49/233
- Text-/Kontextabgleich: [Dorar – al-Baqarah 284–286](https://dorar.net/tafseer/2/49)

### 129 – Fehler bereuen und verbessern

**Qurʾān 39:53** beginnt mit `قُلْ` und endet mit `إِنَّهُ هُوَ الْغَفُورُ الرَّحِيمُ`. Das alte V38-Arabischfeld ließ `قُلْ` weg und hängte Aussagen der **gesonderten Verse 39:54 und 39:55** an, obwohl nur 39:53 beschriftet war. Das Overlay enthält nun ausschließlich den Vers 39:53. Die Geschichte über eine Entschuldigung ist als Unterrichtsbeispiel gekennzeichnet. Ein verletztes Kind muss sich nicht selbst die Schuld geben oder erzwungen vergeben.

- Registrierte frühere Tafsīr-Stelle: https://www.islamweb.net/ar/library/content/49/1629
- Zusätzlicher Islamweb-Textabgleich zu 39:53 und dem Folgevers: [Tafsīr as-Saʿdī – az-Zumar 53](https://www.islamweb.net/ar/library/content/209/1346/)

## Technische Textkonsistenz

Für die **11 redaktionell vertieften Lektionen 119–129** wurden die **33 Altersfassungen** mit den Sprechtext-Platzhaltern verglichen und der Textplan auf den zuletzt gelesenen Stand synchronisiert:

- 33 Intros, 132 Unterrichtszeilen und 33 Sprechskripte = **198 Sollvergleiche**.
- Textbestand aktuell: **1.514 unterschiedliche Textbausteine**, **2.109 Kontextverwendungen**, **0 generierte Audios / 0 Credits**.
- Mehrfachbenutzte Sätze sind in der Textinventarliste dedupliziert; es wurden keine Sprachaufnahmen beauftragt.
- Dies ist nur ein Datenabgleich; ein vollständiger Node-/Browser-Test und eine unabhängige menschliche Prüfung sind **nicht** dadurch bestanden.

## Freigabegrenze

Alle zwölf bzw. neun neuen Unterrichtstexte der vorangehenden Blöcke und dieses Blocks bleiben bei `sourceAudit.scientificApproval=false`. Kein Merge auf `main`, keine Audioerzeugung und kein Live-Deploy. Die ursprünglichen V38-Arabischfelder bleiben historische Entwurfsdaten; maßgeblich für die Arbeitsansicht sind die danach geladenen Korrekturmodule. Vor einer Konsolidierung müssen die korrigierten Versgrenzen in die endgültige kanonische Quelle übernommen und nochmals geprüft werden.
