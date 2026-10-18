# TAWḤĪD KIDS – sparsame V4-Quiz-Audioproduktion in 100er-Planungsblöcken

**Status:** interner Produktionsplan, keine kostenpflichtige ElevenLabs-Generierung, keine Live-Freigabe.
**Stimme/Modell:** `DkU7j9uO4ZEtLD2iRZSH` / `eleven_v4`.
**Bestandsbasis:** 80/450 technisch vierteilig vollständig; 287 unterschiedliche MP3-SHAs laut aktuellem Übergabebericht. Vor Produktion aus den Ledgern frisch prüfen.

## Unveränderliche Prioritäten

1. **Nicht erneut bezahlen:** Bereits registrierte MP3s über exakten gesprochenen Text und SHA-256 wiederverwenden. Neun historische, bereits bezahlte Flow-Originale ausschließlich zurückholen, niemals neu synthetisieren.
2. **Keine unnötigen Sätze aufnehmen:** Für die 300 älteren Fragen den vorhandenen Entwurf kompakter Anmoderationen und Schlussfloskeln als *separate, noch zu prüfende* Sparvariante vergleichen. Originalfrage, Optionen, richtige Antwort und Erklärung dürfen sich inhaltlich nicht ändern. Niemals einen bereits bezahlten Clip durch einen verkürzten Text ersetzen.
3. **Wiederkehrende Audioelemente einmalig:** Richtig-Lob, Retry, allgemeine Aufforderungen und gleiche Antworten altersübergreifend aus vorhandenen echten V4-MP3s zusammensetzen, soweit sprachlich und pädagogisch passend. Keine zusätzliche TTS-Generierung von 0 neuen Lob-/Retry-Fragmenten.
4. **Priorität nach Abschlussnutzen:** Zuerst bestehende bezahlte Originale und Fragen mit wenigen fehlenden einzigartigen Fragmenten schließen. Bei gleichem Abschlussnutzen geringste *zusätzliche, einzigartige* Textlänge bevorzugen; gemeinsame Teile nur einmal kaufen.
5. **100er ist ausschließlich eine Planungsgröße:** In Teilblöcken bis höchstens zehn neue Originale und maximal 850 geschätzten Credits gemäß existierendem manuellen Workflow ausführen. Vor jedem Teilblock Text-/Paid-SHA-Abgleich, Ledger-/Anfragejournal-Abgleich, neue Kostenrechnung und exakter Batch-Fingerprint. Keine hundert ungesicherten POSTs hintereinander.
6. **Echte Originalbytes sofort sichern:** Vor jedem POST Write-Ahead-Journal; nach Erfolg MP3, Text-SHA, MP3-SHA, Provider-Request-ID, Ledger und Originalregister sichern. Bei unklarer Antwort **STOP – niemals automatisch erneut bestellen**; Backup-Artefakte prüfen.
7. **Direkter privater Quiz-Import:** Erst nach echten MP3-Bytes Offline-Komposition, technische 450er-Abdeckung und ID-Zuordnung aktualisieren. Keine bloßen Provider-Links oder erfundene MP3s als fertig melden.
8. **Veröffentlichung separat:** Quellen- und Hörkontrolle sowie striktes Release-Gate erforderlich. Keine öffentliche KIDS-App-Freigabe oder Verschmelzung mit `main` ohne diese Kontrollen.

## Ausgangsdaten (aus GitHub, 18.10.2026)

| Kennzahl | Nachgewiesener letzter Dokumentationsstand |
|---|---:|
| Technisch vollständige Fragen | 80 / 450 |
| Fehlende vollständige Fragen | 370 |
| Verschiedene MP3-SHAs | 287 |
| Unwiederbringlich neu zu bezahlen für Alter 4–6 | 0 neue Texte |
| Bereits bezahlte, aber fehlende ältere Originaldateien | 9 |
| Eindeutig neue V4-Texte für den gegenwärtigen Gesamtplan | 1.369 |
| Eindeutig neue V4-Texte der ersten 20 älteren Fragen | 65, davon 10 bereits neu erzeugt |
| Noch fehlend in dieser ersten Stufe | 55 |
| Nächster bereits vorausgeplanter Teilblock | 10 Texte, ca. 293,63 **geschätzte** Credits, potenziell 4 weitere technisch vollständige Fragen |
| Tatsächliche Provider-Abrechnung des Teilblocks | offen |

**Kostenkontrolle:** Die frühere 79.075,79-Credit-Gesamtschätzung ist kein bestätigter Rechnungsbetrag und keine Einkaufsfreigabe. Der 24,2-%-Rohtextlängen-Gewinn der Entwurfsfassung ist ebenso wenig eine bestätigte Credit-Ersparnis. Nettoersparnis erst gegen exakte vorhandene Clip-SHAs und den tatsächlichen Provider-Tarif ermitteln.

## Freigabegrenze

Der bestehende Workflow `.github/workflows/kids-v4-older-stage1-exact-paid.yml` benötigt weiterhin die **ausdrückliche inhaltliche Eigenprüfung**, die Kreditfreigabe und den frisch berechneten Batch-Fingerprint. Keine dieser Voraussetzungen durch eine pauschale Anweisung zum Sparen oder schnellerem Arbeiten vortäuschen. Eine 100er-Automatik darf die beiden Bestätigungen nicht umgehen.

**Verknüpfte Dateien:** `kids/review-only/QUIZ-V4-UEBERGABE-AKTUELL.md`, `kids/review-only/quiz-v4-450-next-completion-priority.json`, `kids/review-only/QUIZ-V4-SPRECHTEXT-OPTIMIERUNG-ENTWURF.md`, `kids/review-only/quiz-v4-older-stage1-next-recording-batch.json`.
