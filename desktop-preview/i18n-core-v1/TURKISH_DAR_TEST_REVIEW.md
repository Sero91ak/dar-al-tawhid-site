# DĀR AL TAWḤĪD · Türkische Erwachsenen-Übersetzungen (DAR TEST)

## Stand: 21.10.2026
Dies ist eine **nicht veröffentlichte** Integrationsspur. Der bestehende Sprachschalter aus Home/Mehr/Einstellungen speichert `darAdultPreferredLocaleV1`; die DAR-TEST-Leseansicht befindet sich unter `/test/i18n/` und wird in „Mehr“ verlinkt. Nicht gleichsetzen mit einer vollständig lokalisierten Gesamt-App.

### Nachvollziehbarer erster OpenAI-Draft
- Ursprungsbeitrag: `content/posts/hasan-al-basri-selbstpruefung-20261021-481.md`
- Kanonische ID: `post:hasan-al-basri-selbstpruefung-20261021-481`
- GitHub-Actions-Run: https://github.com/Sero91ak/dar-al-tawhid-site/actions/runs/39655625273
- Modell: `gpt-4.1`, 722 Prompt-Tokens + 205 Completion-Tokens = **927 Tokens**
- Artefakt, dauerhaft als unfreigegebene Kopie im isolierten Branch abgelegt:
  `review-artifacts/tr/post/hasan-al-basri-selbstpruefung-20261021-481-openai-run-39655625273.json`
- Existierender redaktioneller Entwurf: `translations/tr/post/hasan-al-basri-selbstpruefung-20261021-481-074b61b8f8.json` (unverändert, DRAFT).
- Der Run hatte noch den falschen Dateisuffix `9b9306807c` (SHA-256 von JSON-String statt Roh-ID). Der Worklist-Generator wurde auf den kanonischen Suffix `074b61b8f8` korrigiert. Beide Dateien dürfen nicht automatisch gegenseitig überschrieben werden.

## Freigabeablauf
1. Bezahlten OpenAI-Draft und bestehenden redaktionellen Entwurf **mit dem vollständigen deutschen Original vergleichen**; bei Widersprüchen zusätzlich die maßgebliche arabische Originalquelle bzw. den Q-Nachweis prüfen.
2. Sprecherzuordnung, Anführungszeichen/Sinngemäß-Status, Quellenreferenzen, Āṯār-/Ḥadīṯ-Einstufung, Ungewissheitsgrade, Namen, Fachtermini und Vollständigkeit gegenprüfen.
3. Zwei echte redaktionelle Prüfungen dokumentieren: `reviewer.linguistic` und `reviewer.religious`, mit `reviewer.arabicOriginalChecked=true`, `reviewer.sourcesChecked=true` und `reviewedAt`. Nicht mit Dummy-Werten freigeben.
4. Erst nach bestandener Prüfung den **bestehenden kanonischen Übersetzungsdatensatz** auf `status=approved` setzen (Felder, ID und Quellhash unverändert gebunden). Anschließend im kanonischen Post-Sprachmanifest `languages.tr.status=approved` und `publicDisplayAllowed=true` setzen.
5. `node desktop-preview/i18n-core-v1/test-translation-worklist.cjs` und `node scripts/verify-adult-post-language-manifests.cjs` müssen bestehen. Danach erneut in DAR TEST auf iPhone/Android/Desktop prüfen. Besucher-/Native-Freigabe erfordert eine gesonderte Entscheidung.

## Laufzeitvertrag
Der Test-Leser fordert ausschließlich dieselbe-originige **statische** Post-Markdown-Datei, den kanonischen Post-Index, das Sprachmanifest und (nur falls freigegeben) die türkische Übersetzung an. Er berechnet denselben SHA-256-Quellfingerprint wie die Worklist; er lädt **niemals einen DRAFT als veröffentlichten Text**. Unbekannte/ungültige/alte Revisionen zeigen nur das deutsche Original und einen sichtbaren Hinweis.

**Keine API-Schlüssel in HTML/JS, kein Browsermodellaufruf, kein Trigger der OpenAI-API beim Lesen.** Die generierende GitHub-Automatik ist vor Freigabe deaktiviert, solange `DAR_I18N_AI_GENERATE_ENABLED` nicht explizit auf `true` gestellt wird. Im Test-Pull-Request wurde sie zusätzlich auf `tr` und höchstens eine bezahlte Anfrage je Workflow-Ausführung begrenzt.

Die umfassende Übersetzung aller Menüs und aller bestehenden Beiträge, Duʿāʾs, Ḥadīṯe und Lernmodule bleibt eine separate Aufgabe. Kinder-App, Apple TV, Besucherproduktion, PDF, Push und Gebetszeiten bleiben unangetastet.
