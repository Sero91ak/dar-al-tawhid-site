# KIDS-Quiz – V4-Rettung zuerst, danach neue Aufnahmen (Review)

**Verbindlich:** Serhat-Masterstimme `DkU7j9uO4ZEtLD2iRZSH`, Modell `eleven_v4`.
Kein bestehendes bezahltes Original darf erneut synthetisiert werden. Keine Audiofreigabe und kein Live-Push.
Auch alle reservierten/eingereichten ElevenLabs-Flow-Aufnahmen bleiben bis zur Klärung für neue TTS-Kosten gesperrt.

| Alter | Technisch komplett | Nur alte Originale nachladen | Nur offenen Flow klären | Neue V4-Originale erforderlich |
|---|---:|---:|---:|---:|
| 4-6 | 70 | 80 | 0 | 0 |
| 7-8 | 139 | 0 | 1 | 10 |
| 9-10 | 134 | 0 | 4 | 9 |

**Schon bezahlte Originale noch zu retten:** 9.
**Ungeklärte verbundene Flow-Originale, die nicht erneut gekauft werden dürfen:** 10.
**Quizfragen, die nur auf verbundene Flow-Originale warten:** 5.
**Durch bestätigte bzw. zu prüfende Aussprache gesperrte Texte:** 10 (niemals automatisch neu bezahlen).
**Neue einzigartige Texte nach echtem Deduplizieren:** 22 (nur Berechnungsbasis; keine Credits bestellt).

## Nächste technische Aktion
1. Die historischen neun `eleven_v4`-MP3s mit echten Generation-IDs importieren, nicht regenerieren.
2. Die ausstehenden bereits reservierten oder eingereichten verbundenen Flow-Originale prüfen und NUR als echte Original-MP3s importieren. Keine erneute Synthese dieser Text-SHAs.
3. Den vorhandenen kostenfreien Offline-Zusammenbau und die Quiz-MP3-Zuordnung erneut ausführen.
4. Danach diese Priorisierung mit `python3 kids/tools/plan_quiz_v4_finish_without_duplicate_credits.py` erneut aufbauen.
5. Noch offene neue V4-Originaltexte erneut mit dem Ledger deduplizieren und nur nach Kostenfreigabe produzieren.
6. Menschliche Ausspracheprüfung, Offline-/Gerätetest, Freigabeschalter weiterhin aus.

## Priorität der historischen Originale

- `DX5z8FWaCS4FDx3KrloO`: 35 Quizfragen hängen direkt davon ab.
- `GvXeGQ9Kr1lVy7LEAv5T`: 35 Quizfragen hängen direkt davon ab.
- `2xy9ZLej1wPTrnvAr9p7`: 30 Quizfragen hängen direkt davon ab.
- `aoKJuahenrKHfUE5OD9j`: 30 Quizfragen hängen direkt davon ab.
- `FGX65uXKWBnjULDxg3X1`: 29 Quizfragen hängen direkt davon ab.
- `UUmC2fDiXaV5W1IQSumA`: 27 Quizfragen hängen direkt davon ab.
- `1UAwmEQ77D4BmA9DttHZ`: 1 Quizfragen hängen direkt davon ab.
- `AToalNGbxiRe1zfOnDG3`: 1 Quizfragen hängen direkt davon ab.
- `KIgCxJO3RDxhsIFJSYUB`: 1 Quizfragen hängen direkt davon ab.

_Die technische Priorisierung ist keine Inhalts-, Aussprache- oder Rechnungsprüfung._
