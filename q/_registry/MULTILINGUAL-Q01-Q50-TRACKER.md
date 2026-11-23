# DĀR AL TAWḤĪD · 50 Q-Quellenkarten in neun Sprachen

Stand: 05.11.2026 · **Inkrementelle Migration, maximal fünf Q-IDs pro Arbeitsauftrag**.

## Sprachvertrag (verbindlich)

- Exakt die Erwachsenen-Sprachen: `de`, `ar`, `en`, `tr`, `ku`, `ckb`, `bs`, `fr`, `es`.
- **Eine Quelle, eine öffentliche Adresse**: `https://dar-al-tawhid.de/q/N/`. Kein neuer übersetzter Quelllink, keine Weiterleitungs- oder Rücksprungparameter.
- Manuelle Spracheinstellung **auf derselben Karte**, vorzugsweise `?lang=` bei bereits eingehenden Legacy-Links, sonst bestehende Erwachsenen-App-Speichereinstellung `darAdultPreferredLocaleV1`; manueller Wechsel speichert die globale Präferenz, ohne die kanonische Adresse zu ändern.
- **Besucherfreundliche Auslieferung:** Nur tatsächlich fachlich und sprachlich freigegebene Übersetzungen aktivieren. Solange Status `draft-needs-scholarly-and-native-language-review` und `approved=false`, die deutsche Originalfassung mit lokalisiertem, deutlich sichtbarem Hinweis anzeigen. Eine KI-Übersetzung niemals fälschlich als von Menschen kontrolliert ausgeben.
- Arabische Originalquellen, Isnād, Buch-/Band-/Seitenzahlen und Ziel-URLs der Quellenbelege bleiben unangetastet. Sichtbare Buchtitel dürfen transliteriert sein; Bedienoberfläche, Zitate/Paraphrasen, Themen und Beschriftungen werden nach Freigabe in der aktiven Sprache angezeigt.
- `ar` und `ckb` erhalten bei freigegebenen Übersetzungen RTL. Smartphone, Foldable, Tablet, iOS WKWebView, Android-PWA und Desktop bedienen dieselbe kanonische Q-ID.
- Der bestehende kontextabhängige In-App-Reader sorgt für Rückkehr zum konkreten Ursprungsbeitrag/Wissensbereich, während extern geteilte Q-Seiten **keinen künstlichen Zurück-Button** besitzen (vgl. PR #1682 und `AGENTS.md`).
- Je Batch isolierter PR, Q-Gate und Sprach-/Quellen-Regressionen; erst nach inhaltlicher Prüfung und grünen Checks freigeben. **Kein Geräte-Push** durch Sprachmigration.

## Zehn getrennte Fünferpakete

| Paket | Q-IDs | Übersetzungsdaten | Sprachlich/fachlich freigegeben | Live |
| --- | --- | --- | --- | --- |
| 1 | Q1–Q5 | Entwürfe aller 9 Sprachen, Adapter + Tests im PR | Nur bestehendes deutsches Original | Nein, bis geprüft |
| 2 | Q6–Q10 | Ausstehend | Ausstehend | Nein |
| 3 | Q11–Q15 | Ausstehend | Ausstehend | Nein |
| 4 | Q16–Q20 | Ausstehend | Ausstehend | Nein |
| 5 | Q21–Q25 | Ausstehend | Ausstehend | Nein |
| 6 | Q26–Q30 | Ausstehend | Ausstehend | Nein |
| 7 | Q31–Q35 | Ausstehend | Ausstehend | Nein |
| 8 | Q36–Q40 | Ausstehend | Ausstehend | Nein |
| 9 | Q41–Q45 | Ausstehend | Ausstehend | Nein |
| 10 | Q46–Q50 | Ausstehend, bestehende Q49/Q50-Sprachdaten zuerst prüfen und wiederverwenden | Ausstehend | Nein |

Q51 ist **nicht** Teil der hier beauftragten 50 Q-IDs und besitzt eine separate neunsprachige Entwurfsintegration. Bestehende Q49/Q50-Übersetzungen nicht duplizieren.

### Paket 1 · technische Abnahme

- Unveränderte kanonische URLs Q1–Q5 und 20 bereits existierende externe/interne Nachweis-URLs per Fingerprint sichern.
- Gemeinsamer Adapter: `q/_registry/source-locale-runtime-01-05.js`.
- Inhalts-/UI-Katalog: `q/_registry/source-locales-01-05.json` (5 × 9; Fremdsprachen **noch nicht freigegeben**).
- Zusätzlicher Pflichtcheck: `node q/_registry/check-q01-05-locales.mjs`, eingebunden in `check-qsource-standard.mjs`.
- Freigabe noch offen: unabhängiger arabischer Wortlaut-/Isnād-Abgleich und muttersprachliche Überprüfung aller acht Übersetzungen je Q-Karte (vor allem Kurmanji/Sorani).
- Nächster **eigenständiger** Arbeitsauftrag: Q6–Q10, maximal fünf Karten.

**Wichtig:** Ein bestehender GitHub-Branch, Pull Request oder ein grüner Syntax-/DOM-Test ist kein Nachweis für abgeschlossene theologischen Übersetzungsprüfung und keine Cloudflare-/Geräte-Live-Bestätigung.
