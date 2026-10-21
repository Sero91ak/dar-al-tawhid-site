# DĀR AL TAWḤĪD · Zentrale Türkisch-Architektur (Adult)

## Einmal übersetzen, überall denselben freigegebenen Inhalt lesen

Die Originaldaten bleiben am vorhandenen kanonischen Ort (`content/posts`, `content/duas`, `apple-tv/hadith`, `data/quiz-questions.json`, Lernmaterial und Quellenregister). Die serverseitige OpenAI-Pipeline speichert je kanonischer Inhalts-ID und deutschem SHA-256-Quellstand genau eine türkische Sprachfassung. Drafts erhalten niemals automatisch einen Veröffentlichungsstatus.

**Freigabepfad:**
`Deutsches Original → Arbeitsliste → OpenAI-Entwurf → Fach-/Sprachprüfung → approved record → /content/i18n/published/tr/…`

Ein überprüfter JSON-Record enthält `id`, `kind`, `locale=tr`, `sourceHash`, `status=approved`, übersetzte `fields` und unveränderliche Quellenmetadaten `immutable`. Das zentrale `/content/i18n/published/tr/manifest.json` listet ausschließlich freigegebene Datensätze. Dieser Endpunkt soll von **Besucher-Webseite, Web/PWA, Desktop und iOS-WKWebView** *identisch* gelesen werden. Kein Client darf das Modell erneut anrufen.

## DAR TEST – aktuelle Implementierung

- `/test/assets/dar-test-turkish-ui.js` verarbeitet statische UI-Texte und reagiert auf die gemeinsame Sprachpräferenz `darAdultPreferredLocaleV1`.
- `/test/assets/dar-adult-central-content.js` ist der sichere gemeinsame Content-Leser. Seine Funktion `resolve(kind,id,{fields,immutable},lang)` berechnet die Quellenrevision vor türkischer Anzeige und fällt bei fehlender oder veralteter Freigabe auf Deutsch zurück.
- `resolveById('dua'|'quiz'|'learning',canonicalId,lang)` ermittelt die Ursprungsfelder direkt aus den kanonischen JSON-Katalogen. Für Beiträge gibt es `/test/assets/dar-test-turkish-content.js` mit einer eigenständigen Markdown-/Metadaten-Prüfung.
- `/test/i18n/` ist die redaktionelle Test-Leseansicht; sie lädt den zentralen Datensatz vorrangig.
- Das Modell läuft **nur serverseitig**. Arabischer Originaltext, Transliteration, Hadith-Grade, Quelllinks und korrekte Quizantworten sind nicht übersetzbare Metadaten.
- Alle 15 untersuchten Erwachsenen-Routen werden mit einer Browser-Inventur kontrolliert; diese Inventur umfasst keine islamischen Quelltexte und ersetzt keine sprachliche Prüfung.

## Wichtige Abgrenzung

Die vorliegenden OpenAI-Dateien sind **Entwürfe**. Solange der Freigabe-Exporter 0 gültige übersetzte Datensätze meldet, darf die App **nicht** als vollständig türkisch oder als vollständig übersetzt beschrieben werden. Die Oberflächenschicht und der Datentransport werden auf DAR TEST entwickelt, aber vollständige Beitrags-/Ḥadīṯ-/Duʿāʾ-/Lerntext-Übersetzung und Prüfung sind ein eigenständiger redaktioneller Arbeitsumfang.

Der iOS-Erwachsenenclient verwendet eine WKWebView mit der öffentlichen Webseite. Nach eigenständiger Produktfreigabe kann diese denselben zentralen API-Pfad laden; nativ gezeichnete Tab-Leisten und Widgets bleiben ein separater Übersetzungs-/Build-Schritt. **Kein Test-Branch darf Live-Apps automatisch freigeben.**

## Tests

```bash
node test/assets/dar-adult-central-content.test.cjs
node test/assets/dar-adult-central-catalog.test.cjs
node test/assets/dar-test-turkish-ui.test.cjs
node test/assets/dar-test-turkish-content.test.cjs
```

Die produktive Übersetzungsdaten-Erzeugung erfolgt zentral mit `desktop-preview/i18n-core-v1/export-reviewed-content.cjs` nach einer erfolgreichen Arbeitslisten-/Approval-Prüfung. Es werden keine doppelten API-Aufrufe beim Öffnen der App erzeugt.
