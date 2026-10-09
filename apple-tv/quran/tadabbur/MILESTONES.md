# Qurʾān-Tadabbur — 10-Prozent-Meilensteine

## Ziel

6.236 von 6.236 eindeutigen Qurʾān-Referenzen mit jeweils eigenständigem früh überliefertem und quellengeprüftem Tadabbur. **Keine generierten Fülltexte**.

| Meilenstein | Registrierte Referenzen mindestens | Freigabe |
| --- | ---: | --- |
| 80 % | 4.989 | Neue Einträge einzeln überprüft; Technik-Audit ohne Fehler |
| 90 % | 5.613 | Zusätzlich gesonderte Stichproben, Widerspruchsprüfung und historischer Quellenaudit |
| 100 % | 6.236 | Jeder Vers einzeln belegt; technisch und fachlich vollständiger Audit; Live-Nachweis |

Ausgangswert vor 06-223: 4.571 Einträge (73,30 %), 1.665 offen, 418 bis zur 80-%-Grenze.

## Unverhandelbare Qualitätsgatter

1. Jede neue Referenz muss im **aktuellen** Lückenbericht fehlen.
2. Für jede neue Aussage Originalwortlaut, Direktfundstelle, Versbezug, Erzähler, Generation und vollständige Überlieferungskette prüfen.
3. Ein bloß gefundener Isnād ist **keine** Authentizitätsbestätigung. Tadlīs, Inqiṭāʿ, unbekannte Überlieferer, späte Mischüberlieferungen und konkurrierende Fassungen gesondert kontrollieren.
4. Unklare Überlieferungen bleiben offen. Keine erfundenen Zuschreibungen, keine frei formulierten Salaf-Zitate und keine unbegründeten ṣaḥīḥ-/ḥasan-Einstufungen.
5. Deutsche Paraphrasen müssen mit dem arabischen Überlieferungswortlaut und dessen Reichweite übereinstimmen. Fiqh-Ikhtilāf nicht unterschlagen.
6. Batch höchstens 25 neue Referenzen; kleine Batches sind erwünscht, wenn nur wenige Kandidaten sicher sind.
7. Batch, Katalog, Index, Lückenbericht und Status gemeinsam committen.
8. Nach jedem Batch vollständige technische Prüfung durchführen: Python-Katalogprüfung, JS-Gap-Audit und JS-Meilensteinprüfung. Gespeicherten Gap-Report auf Änderungen prüfen.
9. Vor Stufenfreigabe Veröffentlichungsworkflow und tatsächlich öffentlich abrufbare Daten nachweisen.
10. **Registrierungszahlen sind keine eigenständige Authentizitätsprüfung bestehender 4.000+ Inhalte.** Technische und wissenschaftliche Freigaben getrennt dokumentieren.

Aktuelle Fortschrittsmessung (ohne manuelle Prozentbehauptung):

```bash
node apple-tv/quran/tadabbur/tools/check-milestones.mjs
```

Der App-Fallback bei fehlendem Eintrag bleibt unverändert.
