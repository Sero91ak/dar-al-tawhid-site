# DĀR AL TAWḤĪD KIDS — Qurʾān-/Fuṣḥā-Aussprache: Eigentümer-Stopp

**Datum:** 21.10.2026  
**Ort:** ausschließlich privater Reviewzweig `review/kids-quiz-v4-batch-001-020-20261014`

## Festgestelltes Problem

Der Eigentümer bewertet die angehörte Aussprache des Qurʾān und arabischer Begriffe als deutlich falsch; sie ist **nicht freigegeben**. Die technische Kennzeichnung `model_id=eleven_v4`, ein bestehender `de-DE`-PLS-Eintrag oder ein bestandener MP3-/SHA-256-/Codec-Test belegt weder klassisches Fuṣḥā noch korrektes Tajwīd.

Eine konkrete riskante Gleichsetzung war die bisher im Build-Test akzeptierte deutsche Alias-Form `Qurʾān → Qur-aan`. Sie kann weder den arabischen Qāf (ق) noch Hamza (ء), Länge, Vokalisation oder Artikulationsqualität zuverlässig zertifizieren.

## Sofortige Sicherheitsmaßnahmen

- `quiz-v4-pronunciation-hold.json`: `productionPaused=true`, `paidSpeechAuthorized=false`, `ownerRestartAuthorized=false`, `humanPronunciationApproved=false`. Frühere Kostenfreigaben gelten nicht als neue Aussprachefreigabe.
- Gemeinsamer, kostenpflichtiger `original_mp3()`-Aufruf verweigert neue Requests bei aktivem Stopp sowie für Qurʾān-Begriffe, arabischen Schrifttext und weitere Aussprache-Sperrtexte. Dadurch bleibt auch ein versehentlich durchgereichter Batch-Text blockiert.
- Checkpoint-Bulkproduzent verweigert neue Waves bei Stopp. Bereits laufende Actions mit einem alten Checkout können durch bloße GitHub-Änderungen nicht zuverlässig rückwirkend abgebrochen werden; diese separat prüfen.
- Finales 450-Quiz-Release-Gate verlangt explizite Eigentümer-Hörfreigabe und aufgehobenen Stopp. `quiz-curation-release.json.enabled=false` bleibt unverändert.
- Bezahlte Original-MP3s, Request-Journale, Generation-IDs und SHA-Register NICHT löschen oder neu bezahlen; keine gefälschte Klangfreigabe. Vorläufig: 343/450 **nur technisch** vollständig; 0/450 dokumentiert hörgeprüft.

## Verbindliche getrennte Audiowege

1. **Qurʾān-Āyāt / tatsächliche Rezitation:** Ausschließlich authentische menschliche Qāriʾ-Rezitationen; Sūrah und Āyah exakt zuordnen, gewünschte Qirāʾah kennzeichnen, Tajwīd/Makhāriǧ prüfen. **Nie mit ElevenLabs generieren.**
2. **Arabische Wörter in deutschen Quizfragen:** Als einzelne Originalsegmente und mit eindeutiger Bedeutung/Schreibweise bewerten; die de-DE-Alias-Umschrift ist kein Fuṣḥā-Nachweis. Für `ʿIbādah`, `Ḥalāl`, `Ḥarām` und `Qurʾān` gilt besonderer Hörstopp.
3. **Deutsche Erklärungen:** Die Original-Masterstimme darf nur nach echter akustischer Prüfung für die jeweiligen Audiosegmente genutzt werden; bloßes Metadaten-`eleven_v4` reicht nicht.

## Qualitätskriterien zur Wiederaufnahme

- Originaltext und Wort-SHA gegen die zugehörige Frage, Aussprachebibliothek und Quelle abgleichen.
- Reale Hörprüfung pro betroffener Lautgruppe: ق /q/, ع /ʕ/, ء /ʔ/, ح /ħ/, خ /x/, غ /ɣ/; Madd/ā-ī-ū, Shaddah, Vokalisation und Wortgrenzen.
- Fehlende oder falsche Segmente intern kennzeichnen, aber vorhandene kostenpflichtige Belege erhalten; ausdrücklich KEINE automatische Neu-Synthese.
- Einen sicher authentifizierten Hörvergleich mit bereits vorhandenem Audio bevorzugen. Weitere bezahlte Testaufnahmen nur nach einer **neuen** konkreten Eigentümergenehmigung, korrigiertem Ausspracheprofil und akzeptierter Hörprobe.
- Keine öffentliche Aktivierung, kein behauptetes 450/450, kein automatischer Live-Push vor echten, dokumentierten Hörfreigaben.

**Status:** Produktionsstopp und technische Schutzmaßnahmen eingetragen; noch keine phonetische Korrektur oder neue Audioaufnahme als erfolgreich bestätigt.
