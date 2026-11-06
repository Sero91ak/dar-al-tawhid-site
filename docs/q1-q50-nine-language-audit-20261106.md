# DĀR AL TAWḤĪD · Q1–Q50 Mehrsprachigkeits-Audit

Stand: 06.11.2026 · Stand der Technik im Branch `feature/q1-q50-nine-language-foundation-20261106`. **Keine Behauptung einer abgeschlossenen Übersetzung oder Live-Veröffentlichung.**

## Kanonischer Vertrag

- Es bestehen genau dieselben Quellen-IDs `qsource:1` bis `qsource:50` und dieselben öffentlichen URLs `/q/1/` bis `/q/50/`. Die explizite Sprachwahl nutzt `?lang=de|ar|en|tr|ku|ckb|bs|fr|es`; das erzeugt keine neue Q-ID.
- Die neun Erwachsenen-Sprachen müssen für alle UI-Elemente vorhanden sein. Arabisch und Sorani werden rechts-nach-links dargestellt. Die aktive Sprache ist die ausdrückliche Q-Seitenwahl vor dem gespeicherten Erwachsenen-App-Wert `darAdultPreferredLocaleV1`.
- Bei fehlenden Übersetzungen niemals so tun, als sei deutscher religiöser Originalinhalt bereits übersetzt. Ungeprüfte Teilmanuskripte bleiben mit sichtbarem Prüfstatus gekennzeichnet. Quellenlinks, arabisches Original, Aussagenstatus und Isnād sind unveränderlich.
- Q49 und Q50 behalten ihre vorhandenen gesonderten Source-/Quiz-Adapter. Q1–Q48 erhalten einen zentralen UI-/Inhaltsadapter am bestehenden Cloudflare-Router.

## Tatsächlich nachgewiesene Abdeckung

| Quellen | Quellenkarte vorhanden | Neunsprachige Bedienoberfläche | Mehrsprachige Inhaltsdaten | Status |
|---|---|---|---|---|
| Q1–Q5 | 5/5 | gemeinsamer Adapter technisch vorbereitet | je Titel, Hauptaussage, Thema und Überlieferungs-/Statushinweis in neun Sprachen | **teilweise übersetzte, fachlich ungeprüfte Entwürfe** |
| Q6–Q48 | 43/43 | gemeinsamer Adapter technisch vorbereitet | keine vollständigen geprüften Übersetzungsmanuskripte | **deutsches Original mit sichtbarem, übersetztem Hinweis** |
| Q49 | vorhanden | vorhandene eigene Sprachintegration | neun Sprachentwürfe in `assets/q49-locales.json` | fachliche Freigabe separat erforderlich |
| Q50 | vorhanden | vorhandene eigene Sprachintegration | neun Sprachentwürfe in `assets/q50-locales.json` | unabhängige Sprach-/Fachprüfung ausstehend |

## Technische Dateien

- `assets/q1-q48-translation-catalog-v1.json`: 48 kanonische Einträge, nur tatsächlich vorhandene Entwürfe markiert.
- `assets/q-legacy-nine-language-v1.js`: universelle Quellenkarten-Sprachwahl ohne Belegänderung, mit nachvollziehbarem Übersetzungsstatus.
- `assets/q-royal-manuscript-v42.js`: vorhandene Q-Quellenkopfzeile folgt auch der Q1–Q48-Sprachwahl.
- `cloudflare/site-router.js`: injiziert die Sprachkomponente auf den alten nummerierten Seiten; Q49+ wird nicht übernommen.
- `scripts/check-q1-q50-nine-language-foundation.cjs`: Sicherheitsprüfung für alle 50 IDs, vorhandene Inhaltspakete, RTL, Fallback und Rückkehr zum deutschen Original.

## Existierende Lernbereich-Verknüpfung

- Q6 → `/lernen/ikhlas/`, Q46 → `/lernen/wissen-adab/`, Q47 → `/lernen/tawhid-iman-akhlaq/`, Q48 → `/lernen/selbstpruefung/`: die alte Lernansicht hat nun dieselbe Sprachauswahl, behält die Quizantworten und zeigt bei fehlender vollständiger Übersetzung einen klaren Hinweis. 
- Q49 und Q50 behalten ihre bestehenden spezialisierten neunsprachigen Lernsysteme.
- Ein Sprachauswahlwechsel erhält die vorhandenen Q- und Lern-Routen mit einem `?lang=`-Parameter, **ohne neue Quellen-ID**.

## Reihenfolge für die vollständige redaktionelle Fertigstellung

**Je fünf Q-Nummern pro Fachblock:** Q1–Q5 vollständig fertig übersetzen und mit Originaltext abgleichen, danach Q6–Q10, Q11–Q15, Q16–Q20, Q21–Q25, Q26–Q30, Q31–Q35, Q36–Q40, Q41–Q45 und Q46–Q50. Für jeden Block sämtliche sichtbaren Abschnitte, Erläuterungen, Titel, Fazits, Primärquellenbeschriftungen und zugehörigen **bestehenden** Lernmodule lokalisieren. Keine bloße Oberflächensimulation. Nur entsprechend geprüfte Sprachfassungen als fachlich freigegeben markieren.

Dies ist ein überprüfbarer Arbeitsstand, keine abgeschlossene neunsprachige Veröffentlichung. Keine Änderungen an Kids, OneSignal, Push-Freigaben oder Q-Navigation.
