# DĀR AL TAWḤĪD · Q49-Mehrsprachigkeitsvertrag

Status: **Staging / redaktionelle und fachliche Prüfung ausstehend**. Kein Live-Beitrag, keine native Sprachfreigabe, keine OneSignal-Aktion.

## Eindeutige IDs und Dateien

- Kanonische Beitrags-ID: `post:ibn-abbas-mutter-wahltun-20261031-q49`
- Quellen-ID / URL: `qsource:49` / `/q/49/`
- Lern-ID / URL: `quiz:qsource:49` / `/lernen/recht-der-mutter/`
- Geteiltes neunsprachiges Manuskript: `assets/q49-locales.json`
- Webseiten-Anpassung: `assets/q49-localized.js`
- Kanonischer Beitragsentwurf: `docs/editorial-drafts/ibn-abbas-mutter-wahltun-20261031-q49.md`
- Unveränderte redaktionelle Sprachgrundlage: `docs/editorial-drafts/ibn-abbas-mutter-wahltun-20261031-q49-nine-languages.json`

## Sprachen und Darstellung

`de`, `ar`, `en`, `tr`, `ku`, `ckb`, `bs`, `fr`, `es`.

- `ar` und `ckb` benötigen RTL-Layout. Originalarabisch bleibt in allen Sprachen Arabisch mit `lang=ar dir=rtl`; es wird nicht maschinell verändert.
- Die ausdrücklich in der Erwachsenen-App gewählte Sprache unter `darAdultPreferredLocaleV1` hat Vorrang gegenüber der Betriebssystemsprache; `?lang=<code>` hat Vorrang vor dem gespeicherten App-Wert.
- Direkte Links tragen die Sprachkennung mit: `/q/49/?lang=tr`, `/lernen/recht-der-mutter/?lang=tr`. Zurück zur deutschen Fassung ohne Parameter oder mit `?lang=de`.
- Die Beitragsüberschrift steht in den Sprachen mit Groß-/Kleinschreibung in GROSSBUCHSTABEN. Arabisch und Soranî besitzen keine solche Kasus-Unterscheidung.
- In der öffentlichen Erwachsenenaussage steht **nur** die erste Aussage von Ibn ʿAbbās. Zweiter Ḥadīṯ, vollständiger arabischer Kontext, Šarḥ und Quellen gehören zur Q49-Quellenkarte.
- Quellentitel in bibliografisch neutralen Referenzen, insgesamt sechs zulässige Direktnachweise, einschließlich Islamweb und Dorar. Keine Links auf nicht freigegebene Quellendomains.
- Der Quizbereich enthält nur vier Verständnisfragen mit je vier Auswahlantworten, Richtig/Falsch-Rückmeldung, Begründung, Fortschritt und Neustart; Originalquellen ausschließlich auf der Q-Seite. 36 lokalisierte Fragefassungen bei vier kanonischen Fragen.
- Deutsches HTML bzw. deutsches Inlineskript bleiben ohne geladenes Datenpaket als Notfall-Fallback funktionsfähig.

## ʿIlm-Chat: vorbereiteter Kontext, keine vorgetäuschte Integration

Beim Öffnen des vorhandenen `/#ilm`-Ziels wird unter dem Schlüssel `darIlmQ49ContextV1` ein **einmal zu verwendender** Kontextdatensatz mit `sourceId`, `locale`, `question` und `sourceUrl` in `sessionStorage` bereitgestellt. Ein späterer autorisierter ʿIlm-Router kann ihn einlesen und nach Validierung der Quelle den passenden Kontext übernehmen. Der aktuelle Q49-Adapter verändert **keinen Chat-Backend-Endpunkt, keine Modellprompts und keine native App-Navigation**. Der Inhalt ist nur Vorbereitungsmetadatum und keine nachgewiesene neunsprachige KI-Antwortfunktion.

## Nötige Abnahme

1. `node scripts/check-q49-nine-language.cjs` erfolgreich.
2. `node q/_registry/check-qsource-standard.mjs` erfolgreich.
3. App Health Check, Canonical State Guard und App Lane Guard erfolgreich.
4. Jede der neun Sprachen fachlich, sprachlich und bei Arabisch/Soranî inklusive Leserichtung prüfen; Übersetzungsstatus `approved=false` bis zur Prüfung unverändert lassen.
5. Jede der neun Q49- und Quiz-URLs mobil, in Safari und in WebView kontrollieren; einen Sprachwechsel und einen Ausfall der JSON-Datei testen. Laufende öffentliche Auslieferung über Cloudflare getrennt überprüfen.
6. Der Live-Besucherbeitrag bedarf einer **gesonderten ausdrücklich autorisierten Freigabe**. Der native ʿIlm-Chat, native App-Sprachwahl, Push und Kids sind nicht Bestandteil dieses Q49-Änderungszweigs.

Für jede spätere Q-Nummer denselben Ein-ID-/Ein-Q-/Mehrsprachigkeitsvertrag übernehmen; Übersetzungen und die nötige QA nicht aus dieser Q49-Freigabe ableiten.
