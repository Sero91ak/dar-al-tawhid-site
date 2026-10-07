# Qurʾān Tadabbur – Gap-Fill Status

Status: verbindliche Fortsetzung nach Abschluss des fortlaufenden Verslaufs  
Branch: `main` (Live für Web, iOS, Android, Apple TV)  
Letzter Voll-Audit: 24.09.2026

## Aktueller auditfester Stand

Der historische Stand `5102` war die Zahl registrierter Zeilen, nicht die Zahl eindeutiger Qurʾān-Referenzen.

Der erste vollständige Audit ergab:

```text
geladene Einträge: 5102
eindeutige Referenzen: 4190
Duplikate: 912
ungültige Referenzen: 0
Count-Mismatches: 2
```

Die 912 späteren Dubletten wurden verlustfrei aus dem registrierten Datensatz entfernt und in

```text
duplicate-review-archive.json
```

archiviert. Die jeweils erste registrierte Referenz bleibt kanonisch.

Nach Dedupe-Reparatur und den Gap-Fill-Batches `06-001` bis `06-175` gilt jetzt:

```text
Qurʾān-Gesamtverse: 6236
entriesCount: 4519
totalVerifiedEntries: 4519
loadedEntries: 4519
uniqueVerifiedReferences: 4519
missingCount: 1717
duplicateCount: 0
invalidCount: 0
countMismatchCount: 0
firstMissingReference: 2:82
lastMissingReference: 19:98
letzter fortlaufender Batch: entries-batch-05z-116.json
letzter fortlaufender Vers: 114:6
letzter Gap-Fill-Batch: entries-gap-06-175.json
nächster Gap-Fill-Batch: entries-gap-06-176.json
```

Seit der Dedupe-Basis `4190` wurden damit `329` neue eindeutige, geprüfte Referenzen registriert.

## Warum kein `entries-batch-05z-117.json`?

`entries-batch-05z-116.json` erreicht Qurʾān `114:6`.

Danach gibt es keinen weiteren Qurʾān-Vers. Alle weiteren Arbeiten sind ausschließlich interne Gap-Fills.

## Abgeschlossene Gap-Fill-Batches

```text
06-001  7      06-017  2      06-033  5
06-002  8      06-018  2      06-034  2
06-003  3      06-019  3      06-035  3
06-004  5      06-020  6      06-036  2
06-005  1      06-021  4      06-037  3
06-006  4      06-022  3      06-038  2
06-007  8      06-023  6      06-039  2
06-008  1      06-024  5      06-040  1
06-009  3      06-025  4      06-041  3
06-010  7      06-026  3      06-042  2
06-011  8      06-027  5      06-043  3
06-012  6      06-028  3      06-044  3
06-013  2      06-029  2      06-045  1
06-014  3      06-030  3      06-046  2
06-015  3      06-031  3      06-047  2
06-016  2      06-032  1      06-048  2
06-049  5
06-050  2
06-051  2
06-052  3
06-053  3
06-054  2
06-055  2
06-056  2
06-057  3
06-058  2
06-059  2
06-060  2
06-061  1
06-062  2
06-063  1
06-064  1
06-065  2
06-066  1
06-067  2
06-068  1
06-069  1
06-070  2
06-071  1
06-072  1
06-073  1
06-074  2
06-075  1
06-076  1
06-077  1
06-078  1
06-079  1
06-080  1
06-081  1
06-082  1
06-083  1
06-084  1
06-085  1
06-086  1
06-087  1
06-088  1
06-089  1
06-090  1
06-091  1
06-092  1
06-093  1
06-094  1
06-095  1
06-096  1
06-097  1
06-098  1
06-099  1
06-100  1
06-101  1
06-102  1
06-103  1
06-104  1
06-105  1
06-106  2
06-107  1
06-108  1
06-109  1
06-110  3
06-111  2
06-112  1
06-113  3
06-114  2
06-115  2
06-116  1
06-117  1
06-118  1
06-119  1
06-120  1
06-121  1
06-122  1
06-123  1
06-124  1
06-125  1
06-126  2
06-127  1
06-128  1
06-129  1
06-130  2
06-131  1
06-132  2
06-133  2
06-134  1
06-135  1
06-136  1
06-137  1
06-138  1
06-139  1
06-140  1
06-141  1
06-142  1
06-143  1
06-144  1
06-145  2
06-146  1
06-147  1
06-148  1
06-149  1
06-150  1
06-151  1
06-152  1
06-153  1
06-154  2
06-155  1
06-156  1
06-157  1
06-158  1
06-159  1
06-160  1
06-161  1
06-162  1
06-163  1
06-164  1
06-165  1
06-166  1
06-167  1
06-168  1
06-169  1
06-170  1
06-171  1
06-172  1
06-173  1
06-174  2
06-175  1
```

Die Zahl hinter jedem Batch ist die aktuell registrierte Eintragszahl der Datei.

## Audit-Korrektur bei 06-025

Der erste Audit von `entries-gap-06-025.json` stoppte korrekt, weil Qurʾān `2:229` bereits in

```text
entries-batch-04n.json
```

registriert war.

Der doppelte Eintrag wurde ausschließlich aus `06-025` entfernt. Der kanonische, bereits vorhandene Eintrag blieb unverändert bestehen.

Aktuell:

```text
entries-gap-06-025.json: 4 Einträge
duplicateCount: 0
invalidCount: 0
countMismatchCount: 0
```

Qurʾān `2:229` darf nicht erneut als Gap-Fill registriert werden.

## Zuletzt ergänzte Bereiche

```text
06-041: 3:3, 3:4, 3:8
06-042: 3:27, 3:28
06-043: 3:45, 3:46, 3:48
06-044: 3:55, 3:59, 3:60
06-045: 3:72
06-046: 3:100, 3:112
06-047: 3:111, 3:113
06-048: 3:117, 3:118
06-049: 2:4, 2:5, 2:7, 2:21, 2:50
06-050: 2:42, 2:52
06-051: 2:44, 2:83
06-052: 2:67, 2:70, 2:87
06-053: 2:96, 2:101, 2:102
06-054: 2:103, 2:104
06-055: 2:108, 2:114
06-056: 2:90, 2:93
06-057: 2:116, 2:120, 2:121
06-058: 2:94, 2:105
06-059: 2:46, 2:72
06-060: 2:51, 2:128
06-061: 2:126
06-062: 2:47, 2:53
06-063: 2:136
06-064: 2:137
06-065: 2:134, 2:135
06-066: 2:141
06-067: 2:91, 2:95
06-068: 2:146
06-069: 2:148
06-070: 2:139, 2:140
06-071: 2:150
06-072: 2:160
06-073: 2:165
06-074: 2:168, 2:170
06-075: 2:156
06-076: 2:180
06-077: 2:201
06-078: 2:213
06-079: 2:225
06-080: 2:243
06-081: 2:221
06-082: 2:181
06-083: 2:172
06-084: 2:202
06-085: 2:210
06-086: 2:212
06-087: 2:163
06-088: 2:211
06-089: 2:215
06-092: 2:214
06-093: 2:241
06-094: 2:262
06-095: 2:36
06-096: 2:48
06-097: 2:161
06-098: 2:164
06-099: 2:179
06-100: 2:155
06-101: 2:157
06-102: 2:149
06-103: 2:6
06-104: 2:190
06-105: 2:191
06-106: 2:247, 2:251
06-107: 2:38
06-108: 2:205
06-109: 2:216
06-110: 2:226, 2:227, 2:245
06-111: 2:248, 2:257
06-112: 2:206
06-113: 2:268, 2:275, 2:280
06-114: 3:19, 3:34
06-115: 3:33, 3:37
06-116: 3:44
06-117: 3:85
06-118: 2:43
06-119: 2:49
06-120: 2:64
06-121: 2:151
06-122: 2:246
06-123: 2:186
06-124: 2:192
06-125: 2:258
06-126: 2:259, 3:2
06-127: 2:264
06-128: 2:274
06-129: 2:276
06-130: 2:283, 3:5
06-131: 2:281
06-132: 3:14, 3:26
06-133: 3:41, 3:49
06-134: 3:52
06-135: 3:74
06-136: 3:84
06-137: 3:75
06-138: 3:97
06-139: 3:101
06-140: 3:130
06-141: 3:141
06-142: 3:153
06-143: 3:156
06-144: 3:176
06-145: 3:177, 3:179
06-146: 3:181
06-147: 3:184
06-148: 3:187
06-149: 3:180
06-150: 4:2
06-151: 4:9
06-152: 4:17
06-153: 4:21
06-154: 4:27, 4:28
06-155: 4:29
06-156: 4:33
06-157: 4:41
06-158: 4:46
06-159: 4:51
06-160: 3:140
06-161: 3:146
06-162: 3:164
06-163: 3:185
06-164: 4:6
06-165: 4:10
06-166: 4:16
06-167: 4:22
06-168: 4:37
06-169: 4:38
06-170: 4:47
06-171: 4:54
06-172: 4:55
06-173: 4:60
06-174: 4:63, 4:64
06-175: 4:66
```

## Nächste echte Audit-Lücken

Der erste weiterhin fehlende Vers ist:

```text
2:82
```

Der aktuelle nächste 25er-Auditbereich beginnt mit:

```text
2:82
2:92
2:98
2:99
2:107
2:110
2:112
2:117
2:119
2:122
2:123
2:131
2:133
2:145
2:147
2:162
2:169
2:176
2:209
2:242
2:244
2:250
2:252
2:263
2:277
```

Diese Referenzen sind Arbeitsziele, keine Aufforderung zum künstlichen Füllen. Ein Vers bleibt offen, bis ein konkreter früher Bericht mit belastbarer Zuordnung und ausreichend geprüfter Überlieferungskette vorliegt.

## Gap-Fill-Regel

Ab jetzt verbindlich:

```text
1. fehlende Referenzen nur aus dem aktuellen Audit übernehmen
2. ausschließlich geprüfte Einträge ergänzen
3. keine doppelten reference-Werte registrieren
4. keine ungültigen Qurʾān-Referenzen erzeugen
5. maximal 25 Einträge pro Gap-Fill-Datei
6. vor Registrierung gegen den aktuellen Branchkopf prüfen
7. nach jedem Batch catalog.json und entries-index.json aktualisieren
8. nach jedem Batch Audit erneut ausführen
9. Audit muss duplicateCount=0, invalidCount=0 und countMismatchCount=0 behalten
10. kein Eintrag wird nur erzeugt, um eine Zahl zu erhöhen
11. mursal/unsichere oder nicht vollständig geprüfte Überlieferungen werden nicht als ṣaḥīḥ ausgegeben
12. bereits registrierte Referenzen werden vor jedem neuen Batch gegen den Audit geprüft
```

## Audit-Tool

```text
apple-tv/quran/tadabbur/tools/find-missing-references.mjs
```

Ausführen:

```bash
cd apple-tv/quran/tadabbur
node tools/find-missing-references.mjs
```

Der Report enthält insbesondere:

- `totalVerses`
- `catalogEntriesCount`
- `indexTotalVerifiedEntries`
- `loadedEntries`
- `uniqueVerifiedReferences`
- `missingCount`
- `duplicateCount`
- `invalidCount`
- `countMismatchCount`
- `firstMissingReference`
- `lastMissingReference`
- `suggestedNextBatch`
- `suggestedNextPlus200`
- vollständige `missing`-Liste

## Dedupe-Reparatur

Werkzeug:

```text
apple-tv/quran/tadabbur/tools/dedupe-registered-entries.mjs
```

Review-Archiv:

```text
apple-tv/quran/tadabbur/duplicate-review-archive.json
```

Die entfernten Mehrfacheinträge bleiben dort mit `canonicalPath` und `removedFromPath` nachvollziehbar.

## Strenge Inhaltsregel

Fehlende Verse dürfen nicht durch frei erzeugten religiösen Text gefüllt werden.

Wenn für eine Referenz kein geprüfter Eintrag vorliegt, bleibt der feste Fallback aktiv:

```text
Für diesen Vers liegt derzeit keine geprüfte Salaf-Überlieferung vor.
```

## App-Verhalten

- geprüfter Eintrag vorhanden → Tadabbur-Karte anzeigen
- kein geprüfter Eintrag vorhanden → festen Fallback anzeigen

Das ist vollständige technische Abdeckung ohne erfundene inhaltliche Abdeckung.
