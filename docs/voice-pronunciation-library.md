# Voice / Aussprache – zentrale Architektur

## Ziel
Alle DĀR-AL-TAWḤĪD-Sprachsysteme verwenden dieselbe Aussprachebibliothek:
- DĀR AL TAWḤĪD Kids
- Hörgeschichten / Prophetengeschichten
- KI-/ElevenLabs-Stimme
- Video-Studio
- weitere Kinder-/Audio-Clients (einschließlich Farid-Kids, sobald dessen TTS-Code im Repo liegt).

Keine zweite, abweichende Wortliste in einem einzelnen Client pflegen.

## Source of Truth
`data/voice/pronunciation/`

Aktueller Stand: **902 kanonische Begriffe/Phrasen** und **3719 konkrete Alias-Regeln**.

Enthalten sind Canonical-CSV, vollständige Master-CSV, Alias-PLS, Eleven-v3-IPA-PLS, ElevenLabs-Rules-JSON, QA-Sätze und Upload-Helfer.

## Runtime
`cloudflare/voice/pronunciation.js`

Die sichtbare wissenschaftliche Unicode-Schreibweise bleibt unverändert. Vor TTS wird `prepareDarSpeech(env, text)` verwendet.

### Produktionsweg
Wenn `ELEVENLABS_PRONUNCIATION_DICTIONARY_ID` und `ELEVENLABS_PRONUNCIATION_DICTIONARY_VERSION_ID` gesetzt sind, bleibt der Originaltext erhalten und ElevenLabs erhält den Dictionary-Locator.

### Fallback
Ohne Dictionary-Secrets ersetzt die zentrale Engine nur für die Sprachausgabe die bekannten Schreibweisen durch die hinterlegten Alias-Aussprachen.

## Kinder-App / Farid-Kids
Jeder vorhandene oder zukünftige TTS-Endpunkt soll dieses zentrale Modul importieren und vor der Audioerzeugung `prepareDarSpeech` aufrufen. Dadurch lernen die Clients nicht separat, sondern greifen auf dieselbe gepflegte Bibliothek zurück.

## Neue Begriffe
1. Wissenschaftliche Schreibweise festlegen.
2. Alias und IPA ergänzen.
3. Mit der tatsächlich verwendeten geklonten Stimme hörprüfen.
4. Masterdateien gemeinsam aktualisieren.
5. QA-Test ausführen.
