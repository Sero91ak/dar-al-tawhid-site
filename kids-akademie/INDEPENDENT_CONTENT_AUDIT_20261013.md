# DĀR AL TAWḤĪD KIDS AKADEMI — unabhängiger Inhaltsaudit (13.10.2026)

## Umfang
Untersucht: tatsächliche Datei `kids/akademie/curriculum-v38.js` auf PR-Stand `8a527f69b0dd0219afe5fd1510114780a9711023`, Slots 98–208 (111 Lektionen). Original-PR #1113 bleibt unangetastet. Diese Review-Arbeit liegt auf einem eigenen Zweig.

## Nachgewiesene Mängel
1. **Schematische Quizfragen:** 110 Lektionen (99–208) verwenden gleichlautende allgemeine Fragen, darunter `Was passt zu dieser Stunde?`, `Woran hält sich diese Stunde?`, `Welche Angabe wäre unehrlich?`, `Was darf diese Stunde nicht behaupten?` und `Wie lautet die Qurʾān-Stelle?`. Die Fragen prüfen oft nicht den jeweiligen Lerninhalt.
2. **Entwickler- und Quellenprüfungen in Kinderinhalten:** Beispielsweise fragt das Quiz von Slot 99 für 4–5-Jährige nach „einer Hadithnummer, die wir erfunden haben“. In Lektion 100 erscheinen ähnliche Formulierungen. Die 9–10-Texte von 99–208 enthalten häufig Hinweise wie „Keine Freigabe für Besucher“, Quellen-Selbsttests und interne Produktionskommentare. Solche Informationen gehören allein ins Recherche-Ledger bzw. die Quellenkarte.
3. **Schwache Antwortalternativen:** In vielen Quizzes ist eine richtige Unterrichtsübung einer eindeutig absurden Alternative gegenübergestellt. Dadurch wird wenig Wissen geprüft.
4. **Didaktik über Quellenprüfung:** Selbst bei 4–5-Jährigen werden Begriffe aus der Dokumentation der Quellenüberprüfung anstelle verständlicher Inhalte abgefragt.
5. **Fiqh-Grundlagen bleiben offen:** Laut `NEXT_TASKS.md` benötigen die Slots 106, 118, 130, 142, 154, 166, 174, 180, 186, 192, 198, 201, 204, 205, 206, 207, 208 klassisch-hanbalitische Prüfung. Die dazu genannten Werke wurden nicht gelesen.

## Trennung von Prüfständen
Die Vollständigkeitsprüfung für 208 IDs / 624 Fassungen ist eine technische Bestandskontrolle. Sie ist **keine** wissenschaftliche Freigabe. `religiousSourcesVerified=false`, `voiceApproved=false`, 0 fachlich freigegeben. Die Aufstellung stammt aus dem GitHub-Projekt; ich habe noch keine vollständige unabhängige Quellenprüfung der 208 Lektionen abgeschlossen.

## Vorgehen
1. Slot 98 (Mobbing/Kinderschutz) gezielt nachbearbeiten: Hilfe auch bei einmaligem Vorfall, bei fehlender Unterstützung weitere Vertrauensperson; kein Nachspielen der Übergriffe.
2. Slots 99 und 100 exemplarisch umfassend korrigieren (altersgerechte Sprache, konkrete Quellenabgrenzung und gegenstandsbezogene Quizfragen).
3. Slots 101–208 danach systematisch ausarbeiten, nicht bloß Texte maschinell bereinigen. Bei jeder Änderung Lektions-ID, Altersfassungen und Quellendaten beibehalten.
4. Jede konkrete Quellenüberprüfung im Ledger nachtragen. Unzugängliche Quellen nicht als gelesen markieren. Fiqh-Stunden zuerst nach Quellenlage korrigieren; keine erfundenen Riten, Urteile oder Ḥadīṯnummern.
5. Integrations- und Regressionstests vor Übernahme in PR #1113 in der ausführbaren Entwicklungsumgebung starten; **nicht** allein aufgrund dieses Audits publizieren.

## Sicherheitsgrenzen
Keine Audioerzeugung, kein Live-Deploy, kein Merge auf `main`, keine Änderungen an Push, Profilen oder Lernfortschritten. Inhalte bleiben Entwürfe bis zum vorgesehenen Prüf- und Freigabeverfahren.
