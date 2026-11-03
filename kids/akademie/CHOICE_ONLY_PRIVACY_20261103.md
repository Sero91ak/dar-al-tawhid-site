# TAWḤĪD KIDS – Lernakademie ohne Texteingabe und Mikrofon

**Änderung vom 03.11.2026 – Review, noch nicht auf Besucher-Live freigegeben.**

## Verbindliche Kinder-Bedienung

- Jede Lernfrage wird ausschließlich mit **Antwortbuttons** bearbeitet; 2–5 Auswahlmöglichkeiten.
- Pro Antwort bleibt der getrennte „Hören“-Button zur **Ausgabe** vorhanden. Hören darf keine Antwort auswählen und keine Mikrofonberechtigung anfragen.
- Keine freien Antworten per Tastatur, Textarea, Diktat, Speech Recognition oder MediaRecorder in der Lernakademie.
- Keine Sprachclips von Kindern aufnehmen, speichern, synchronisieren oder versenden.
- Qurʾān-Rezitation, Mastersprecher, Salam, die fünf Lernschritte, Jungen-/Mädchenprofile, eigenständige Scrollbereiche und alle bisherigen IDs/\`academy-v4\`-Lernstände erhalten.
- Hinweis, Wiederholung, Retry und Ergebnisanzeige weiterhin per Button.

## Übergang der bisherigen freien Lernfragen

Die redaktionell vorhandenen `type:"text"`-Fragen werden **nur in der Darstellung**, ohne Änderung der Curriculum-Quelldaten, in Choice-Fragen umgewandelt. Die kanonische Beispielantwort dient als Richtwert; eine falsche Option wird aus bereits vorhandenen Antwortalternativen derselben Lektion gewählt. Diese maschinell zusammengestellten Antwortalternativen sind **nicht redaktionell oder islamwissenschaftlich final freigegeben** und bleiben in der Fortschrittsbewertung als `unverified` gekennzeichnet. Die ursprüngliche Fragenanzahl bleibt unverändert.

**Vor Produktivfreigabe erforderlich:** Alle konvertierten Fragen pro Altersstufe redaktionell auf Eindeutigkeit und pädagogisch plausible Distraktoren prüfen; Testlauf jeder Altersstufe im Jungen- und Mädchenprofil; iPhone-/iPad-/Android-PWA-Scroll und Screenreader-Tastbedienung prüfen; Build/CI grün; Service-Worker-/Cache-Version vor Veröffentlichung aktualisieren und die tatsächlich ausgelieferte Besucher-App auf fehlende Eingabe- und Mikrofonfunktion prüfen.

Der separate 208-Lektionen-PR #1588 enthält weiterhin 142 nicht freigegebene redaktionelle Entwürfe; dieser Datenschutz-Patch gibt sie nicht frei und erzeugt keine neuen Audios.

## Erlaubte technische Alt-Daten

Historische Lernstände mit unbewerteten Antworten dürfen im bestehenden lokalen Schema weiter gelesen werden, aber es wird kein neuer Freitext und keine Kinderstimme gespeichert. Andere Bereiche wie Qurʾān-Lernstudio oder Profilverwaltung sind nicht Teil dieses Auftrags.
