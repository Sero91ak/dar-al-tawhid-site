# TAWḤĪD KIDS · Schätze der Salaf · 33 Audio-Master – Freigabevertrag

**Kinder-App:** https://dar-al-tawhid.de/kids/ · **Review:** /kids/salaf-v4-all-33-review-20261028.html

## Vollständigkeit und Kosten

- 4 bereits erzeugte Original-Master: `audio/salaf-v4-review-20261027` (niemals erneut kostenpflichtig erzeugen).
- 29 weitere freigegebene Original-Master in acht getrennten Chargen auf `audio/salaf-v4-complete-review-20261028`.
- Ungeprüfte Geschichte `abu-hazim-den-segen-erkennen` ist weiterhin ausgeschlossen.
- Eine Masteraufnahme, dieselben Worte und dieselben Absatz-Zeitmarken für 4–5, 6–8, 9–10 Jahre, Jungen und Mädchen.
- Masterstimme `DkU7j9uO4ZEtLD2iRZSH`, `eleven_v4`, Profil `kids_story`, deutsches Sprachprofil `de`; kein globales arabisches PLS über deutsche Sätze. Wörter wie deutsches „nur“ müssen deutsch bleiben; Fuṣḥā-Lehnwörter müssen natürlich und korrekt klingen.

## Release-Gate

**Automatische TTS-Erzeugung, eine generierte .m4a, ein synchronisiertes Transcript oder ein erfolgreiches CI sind keine menschliche Hörabnahme.** Jede der 33 Aufnahmen muss ganz angehört und unabhängig bestätigt werden: Textparität, Aussprache Deutsch/Fuṣḥā, keine akustischen Fehler, vollständige Salām- und Duʿāʾ-Schlüsse, echtes iPhone- und iPad-Playback und korrekte Mitlese-Marker.

Sichere die realen Prüfungsergebnisse in einer **einzigen** JSON-Datei `kids/audio-jobs/salaf-v4-human-approval-20261028.json`, nachdem alle Geschichten geprüft wurden:

```json
{
  "schemaVersion": 1,
  "collection": "Schätze der Salaf",
  "reviewMode": "manual-full-listening",
  "ownerAuthorizedPublicRelease": true,
  "entries": {
    "STORY_ID": {
      "storyId": "STORY_ID",
      "audioSha256": "tatsächlicher_SHA256_der_genau_abgehörten_Datei",
      "textSha256": "tatsächlicher_SHA256_des_originalen_Mastertexts",
      "reviewer": "Vollständiger Name des tatsächlichen Prüfers",
      "reviewedAt": "2026-10-28T12:00:00+01:00",
      "qaEvidenceReference": "Referenz zur tatsächlichen dokumentierten Hör- und Geräteprüfung",
      "germanPronunciationPassed": true,
      "fushaTermsPassed": true,
      "iphonePlaybackPassed": true,
      "ipadPlaybackPassed": true,
      "textAudioParityPassed": true,
      "paragraphTimingPassed": true,
      "fullAudioListened": true,
      "noAudibleArtifacts": true
    }
  }
}
```

**Das Beispiel ist ausschließlich eine Schemaskizze** mit Platzhaltern, **keine Freigabe**; alle tatsächlichen 33 ID-Schlüssel und belegten SHA-Werte sind zwingend erforderlich. Nie `true` setzen, bevor die jeweiligen Tests tatsächlich bestanden wurden. Ausschließlich die vom Prüfbericht ausgewiesenen Original-SHA-Werte dürfen übernommen werden. Kein automatisch erfundener Prüfername, Zeitpunkt oder Hörnachweis. Bei Fehlern die konkrete Aufnahme sperren und einen gezielten Korrekturauftrag auslösen; keine blind wiederholten kostenpflichtigen ElevenLabs-Anfragen.

## Veröffentlichungsablauf

1. Vier alte und 29 neue **unveränderte** Review-Dateien in einen isolierten Checkout-/Freigabezweig laden: `kids/review-only/salaf-v4-20261027/` und `kids/review-only/salaf-v4-complete-20261028/salaf-v4-pending-01...08/`.
2. Nach vollständig dokumentierter Hörabnahme `python3 kids/tools/release-salaf-v4-reviewed.py --audit` ausführen. Die Prüfung verursacht **keine ElevenLabs-Credits**, verändert keinen öffentlichen Katalog und fordert alle 33 Text-/Audio-SHA und vollständige Absatzzeitmarken.
3. Erst danach mit der tatsächlichen, 33-fach eindeutigen Hörfreigabe `python3 kids/tools/release-salaf-v4-reviewed.py --promote` ausführen. Das schreibt kanonische `/kids/audio/salaf/<story-id>.m4a`-Dateien und das vorhandene `audioMaster`-Feld für exakt die 33 freigegebenen Geschichten, **ohne irgendeine neue Sprachgenerierung**.
4. `node scripts/kids-master-text-standard-v2-check.js` und die vollständigen GitHub-Checks prüfen, die drei UI-Modi inklusive iOS-WKWebView und iPad testen. Bei Änderungen an den Cache-URLs die betreffenden Versionen nachweislich aktualisieren.
5. Nur den vollständig abgenommenen und getesteten Release-PR in `main` übernehmen. Keine OneSignal-Besucher-Pushs auslösen. Vorhandene Kinder- und Erwachsenen-Audios und andere App-Bereiche bleiben unverändert.

**Bis diese Evidenz vorliegt, bleiben `humanListeningApproved`, `approvedForPlayback`, `releaseEnabled` und `audioMaster` öffentlich unverändert.**
