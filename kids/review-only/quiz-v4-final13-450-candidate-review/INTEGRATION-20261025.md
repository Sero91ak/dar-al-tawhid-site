# TAWḤĪD KIDS · Quiz V4 mit 450 Fragen und vier Audioteilen

**Integrationszweig – keine Live-Schaltung.**

- 450 ausgewählte Originalfragen: 150 für 4–6, 150 für 7–8, 150 für 9–10 Jahre.
- 450 weitere Originalfragen bleiben als Reserve erhalten. 900 kanonische IDs und bestehende Lernstände werden nicht verändert.
- 1.800 Audioteil-Zuordnungen: Frage, richtige Antwort/Lob, Wiederholung, Erklärung.
- 884 unterschiedliche, echte ElevenLabs-`eleven_v4`-MP3s der Stimme **Serhat Abu Malik – Master** werden nach der ursprünglichen Frage-ID und dem Altersband zugeordnet. Es gibt bewusst mehrfach verwendete Originalaufnahmen.
- Herkunft: privater Prüfzweig `review/kids-v4-final13-candidates-20261023`, PR #1406 (23.10.2026). Dateiinhalte werden als Git-Binärblobs übernommen, **ohne erneute Synthese oder ElevenLabs-Credits**.
- Audioindex: `kids/review-only/quiz-v4-final13-450-candidate-review/candidate-450-playback-manifest.json`.
- Wortgetreue Sprechtexte: `kids/data/quiz-v4-curated-450-production-review.json`.
- Reviewplayer: `kids/quiz-v4-private-hearing-preview.html` (nur auf lokalem Branch-Testserver / abgeschotteter Testvorschau, keine Kids-Navigation).
- Prüfung: `python3 kids/tools/kids_quiz_v4_450_private_integrity.py` kontrolliert Originalfragen, die Alterseinteilung, je vier Audioteile, SHA-256 der Sprechtexte, Bytes und SHA-256 der 884 echten Audiodateien. Automatischer GitHub-Actions-Workflow im PR.
- `kids/data/quiz-curation-release.json` verbleibt auf `enabled=false`. Der öffentliche Quizcode und die Kids-Startseite werden nicht überschrieben.
- **Offen: 0/450 menschliche Hörfreigaben.** Fuṣḥā/Makhāriǧ, nicht passende Lautungen, Atemgeräusche, Korrektheit sowie iOS-/Android-/Offline-Wiedergabe müssen im realen Test geprüft und bestätigt werden.
- Erst nach dieser dokumentierten Freigabe, erfolgreichem Produktionsrelease-Gate und finaler Prüfung eine separate, gezielte Live-Integration vornehmen. Keine Aufnahme vorab als akustisch geprüft markieren.

Der Auftrag zur Komplettintegration ist so vorbereitet, dass nach erfolgreicher Abnahme die vorhandenen Dateien übernommen werden können. **Der Live-Push ist bewusst nicht Bestandteil dieses Zweigs, solange die Aussprache-Holds aktiv sind.**
