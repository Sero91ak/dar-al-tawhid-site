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

Nach Dedupe-Reparatur und den Gap-Fill-Batches `06-001` bis `06-271` gilt jetzt:

```text
Qurʾān-Gesamtverse: 6236
entriesCount: 4776
totalVerifiedEntries: 4776
loadedEntries: 4776
uniqueVerifiedReferences: 4776
missingCount: 1460
duplicateCount: 0
invalidCount: 0
countMismatchCount: 0
firstMissingReference: 2:82
lastMissingReference: 19:98
letzter fortlaufender Batch: entries-batch-05z-116.json
letzter fortlaufender Vers: 114:6
letzter Gap-Fill-Batch: entries-gap-06-271.json
nächster Gap-Fill-Batch: entries-gap-06-272.json
```

Seit der Dedupe-Basis `4190` wurden damit `583` neue eindeutige, geprüfte Referenzen registriert.

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
06-176  1
06-177  1
06-178  1
06-179  1
06-180  1
06-181  1
06-182  1
06-183  1
06-184  1
06-185  1
06-186  1
06-187  1
06-188  1
06-189  1
06-190  1
06-191  1
06-192  1
06-193  1
06-194  1
06-195  1
06-196  1
06-197  1
06-198  1
06-199  1
06-200  1
06-201  1
06-202  1
06-203  1
06-204  1
06-205  1
06-206  1
06-207  1
06-208  1
06-209  1
06-210  1
06-211  1
06-212  1
06-213  1
06-214  1
06-215  1
06-216  1
06-217  1
06-218  1
06-219  1
06-220  1
06-221  3
06-222  4
06-223  2
06-224  2
06-225  2
06-226  2
06-227  2
06-228  13
06-229  5
06-230  6
06-231  4
06-232  3
06-233  2
06-234  5
06-235  7
06-236  4
06-237  7
06-238  8
06-239  3
06-240  4
06-241  2
06-242  5
06-243  4
06-244  4
06-245  3
06-246  3
06-247  3
06-248  2
06-249  2
06-250  2
06-251  5
06-252  3
06-253  3
06-254  5
06-255  4
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
06-176: 4:75
06-177: 4:82
06-178: 4:81
06-179: 4:85
06-180: 4:91
06-181: 4:83
06-182: 4:92
06-183: 4:100
06-184: 4:98
06-185: 4:99
06-186: 4:110
06-187: 4:112
06-188: 4:115
06-189: 4:117
06-190: 4:119
06-191: 4:129
06-192: 4:130
06-193: 4:135
06-194: 4:137
06-195: 4:144
06-196: 4:147
06-197: 4:148
06-198: 4:150
06-199: 4:160
06-200: 4:162
06-201: 4:155
06-202: 4:157
06-203: 4:154
06-204: 4:146
06-205: 5:1
06-206: 5:4
06-207: 5:7
06-208: 5:13
06-209: 5:14
06-210: 5:15
06-211: 5:19
06-212: 5:21
06-213: 5:26
06-214: 5:31
06-215: 5:34
06-216: 5:42
06-217: 5:50
06-218: 5:54
06-219: 5:64
06-220: 5:66
06-221: 5:71, 5:81, 5:82
06-222: 5:83, 5:89, 5:94, 5:96
06-223: 5:103, 5:108
06-224: 5:107, 5:114
06-225: 6:1, 6:2
06-226: 6:8, 6:9
06-227: 6:11, 6:12
06-228: 6:19, 6:20, 6:23, 6:24, 6:25, 6:26, 6:28, 6:34, 6:38, 6:39, 6:44, 6:46, 6:60
06-229: 6:63, 6:69, 6:70, 6:71, 6:76
06-230: 6:95, 6:96, 6:99, 6:100, 6:103, 6:104
06-231: 6:108, 6:109, 6:111, 6:112
06-232: 6:115, 6:119, 6:121
06-233: 6:122, 6:125
06-234: 6:118, 6:120, 6:123, 6:128, 6:129
06-235: 6:137, 6:138, 6:139, 6:140, 6:141, 6:142, 6:143
06-236: 6:146, 6:147, 6:148, 6:151
06-237: 6:152, 6:154, 6:156, 6:157, 6:159, 6:160, 6:162
06-238: 7:2, 7:8, 7:11, 7:16, 7:17, 7:22, 7:26, 7:32
06-239: 7:37, 7:40, 7:46
06-240: 7:82, 7:86, 7:95, 7:156
06-241: 7:145, 7:202
06-242: 7:29, 7:38, 7:51, 7:57, 7:58
06-243: 7:48, 7:49, 7:53, 7:55
06-244: 7:69, 7:74, 7:85, 7:89
06-245: 7:100, 7:102, 7:111
06-246: 7:127, 7:130, 7:131
06-247: 7:133, 7:134, 7:135
06-248: 7:137, 7:142
06-249: 7:146, 7:150
06-250: 7:152, 7:155
06-251: 7:164, 7:165, 7:166, 7:167, 7:168
06-252: 7:171, 7:175, 7:180
06-253: 7:200, 7:201, 7:204
06-254: 7:205, 8:21, 8:25, 8:29, 8:30
06-255: 8:32, 8:34, 8:35, 8:36
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


## Batch 06-256 — 04.11.2026

10 neue eindeutige Referenzen: 2:112, 2:117, 2:133, 2:145, 2:147, 2:169, 2:176, 2:209, 3:11, 3:18. Stand 4712 von 6236; 1524 offen. Quellentexte, Isnād und Grenzen siehe SOURCE_REVIEW_06-256.md. Der historische Voll-Audit 24.09.2026 ist nicht der Beleg für den neuen Live-Stand. Die aktualisierte JSON-Lückenliste ist maßgeblich.

## Batch 06-257 — 04.11.2026

Zehn neue eigenständige Qurʾān-Referenzen: 3:24, 3:29, 3:31, 3:38, 3:43, 3:67, 3:94, 3:98, 3:105, 3:135. Neuer struktureller Zählstand 4722/6236, fehlend 1514. Originalstellen und kritische Überlieferungshinweise dokumentiert in SOURCE_REVIEW_06-257.md. Ein überlieferter Isnād ist nicht automatisch eine authentifizierte Kette.

## Batch 06-258 — 04.11.2026

Zehn neue unabhängige Referenzen: 3:80, 3:106, 3:137, 3:138, 3:139, 3:143, 3:147, 3:148, 3:162, 3:163. Katalog 4732/6236, Lücken 1504. Arabisch mit direkten Tafsīr-aṭ-Ṭabarī-Stellen und Überlieferungsvarianten in SOURCE_REVIEW_06-258.md. Ein technisch gültiger Eintrag ist keine pauschale Isnādauthentifizierung.

## Batch 06-259 — 04.11.2026

10 neue eindeutige Versreferenzen: 3:155, 3:165, 3:168, 3:174, 3:175, 3:178, 4:1, 4:4, 4:7, 4:20. Katalog 4742/6236, Lücken 1494. Quellen und kritische Isnād-/Asbāb-Hinweise: SOURCE_REVIEW_06-259.md. Katalogzählung ist kein Nachweis unabhängig vollständiger Authentizitätsprüfung oder globaler Geräteauslieferung.

## Batch 06-260 — 04.11.2026

Zehn neue eindeutige Referenzen: 4:13, 4:18, 4:25, 4:31, 4:35, 4:40, 4:44, 4:49, 4:50, 4:53. 4752 registriert, 1484 offen. Direkte Originalquellen und offen deklarierte Überlieferungsbewertungen in SOURCE_REVIEW_06-260.md. Gesonderte technische Validierung und Live-Prüfung nach Veröffentlichung obligatorisch.

## Batch 06-261 — 05.11.2026

Zehn neue vor dem Batch tatsächlich offene Referenzen: 4:56, 4:61, 4:71, 4:72, 4:73, 4:78, 4:79, 4:103, 4:104, 4:108. Katalog 4762/6236, Lücken 1474. Originalstellen, Wortlaut und differenzierte Isnādhinweise stehen in SOURCE_REVIEW_06-261.md. Strukturelle Veröffentlichung ≠ universelle ṣaḥīḥ-Einstufung; globale Endpunkt- und Geräteprüfung separat.

## Batch 06-262 – 06.11.2026 (authentizitätsgeprüft)

10 Originalstellen untersucht, 1 authentisch bewertete mawqūf-Überlieferung zu 4:141 übernommen; 9 noch offen. 4763 von 6236, 1473 Lücken. Quellen, Einwände und Einzelstatus: SOURCE_REVIEW_06-262.md. Gewünschte Batchgröße rechtfertigt keine schwach belegte Zuschreibung.

## Batch 06-263 — 06.11.2026

Ein authentisch eingestufter mawqūf-Āṯar von Abū Hurayrah zu Qurʾān 4:145, Ibn Abī Ḥātim 6154. Aḥmad Šākir: isnād ṣaḥīḥ; al-Wādiʿī: isnād ḥasan. Vier weitere geprüfte Kandidaten (4:118, 4:120, 4:124, 4:171) bleiben mangels vollständiger Beweislage offen. Katalog 4764, Lücken 1472; Detailbericht SOURCE_REVIEW_06-263.md.

## Batch 06-264 – 06.11.2026

Ein marfūʿer und in Ṣaḥīḥ al-Buḫārī 3435 authentisch überlieferter Prophetenbericht zu 4:171 über ʿUbādah ibn aṣ-Ṣāmit registriert; die Kapitelüberschrift zitiert den Qurʾān-Vers direkt. Kein eigenes mawqūf-Wort ʿUbādahs. 4:102 aus Buḫārī 942 separat vorgemerkt, noch nicht registriert. Neuer Stand 4765/6236, 1471 offene Referenzen. Quellen-/Textprüfung in SOURCE_REVIEW_06-264.md.

## Batch 06-265 — 06.11.2026 (Prüfzweig)

Qurʾān 4:102: Ibn ʿUmar berichtet als Ṣaḥābī die authentische Prophetenhandlung des Furchtgebets bei Ṣaḥīḥ al-Buḫārī 942, dessen Kapitelüberschrift den Vers 4:102 ausdrücklich nennt. Marfūʿ, kein eigenständiges Ibn-ʿUmar-Zitat. Geplanter Stand 4766 von 6236, Lücken 1470; nur nach CI und Global-Push-Freigabe wirksam. Quelle und Isnād in SOURCE_REVIEW_06-265.md.

## Batch 06-266 — 06.11.2026

Qurʾān 3:42: authentischer marfūʿer Prophetenḥadīṯ über ʿAlī zum besonderen Rang Maryams, direkt unter Qurʾān 3:42 bei Ṣaḥīḥ al-Buḫārī 3432. Nicht fälschlich als eigene Ṣaḥābī-Auslegung ausgegeben. Katalog nach Freigabe 4767/6236, Lücken 1469. Kritischer Quellen- und Wortlautabgleich in SOURCE_REVIEW_06-266.md.

## Batch 06-267 — 06.11.2026

Zwei konkrete Qurʾān-Verse durch ṣaḥīḥe Überlieferungen belegt: 5:24 mit Ibn Masʿūds authentischer Zeugenaussage über al-Miqdād bei Badr, Ṣaḥīḥ al-Buḫārī 4609; 5:118 mit der prophetischen Bezugnahme auf ʿĪsās Worte am Tag der Auferstehung, Ṣaḥīḥ al-Buḫārī 4626. Verschiedene Überlieferungsarten ausdrücklich nicht vermischt. Geplanter Stand: 4769/6236, Lücken 1467. Originalwege und zurückgestellte Kandidaten: SOURCE_REVIEW_06-267.md.

## Batch 06-268 — 06.11.2026

Zwei neue, direkt im Ṣaḥīḥ al-Buḫārī verszugeordnete authentische Berichte: 6:59 über die fünf Schlüssel des Verborgenen, Ibn ʿUmar (Nr. 4627), sowie 8:33 mit Anas' Kontextbericht (Nr. 4649). Der im Kontext ebenfalls zitierte Vers 8:32 war bereits erfasst und ist keine neue Referenz. Nach Freigabe: 4771 von 6236, Lücken 1465. Isnād, Quellen und Aussage-Gattungen siehe SOURCE_REVIEW_06-268.md. Produktion und globale App-Auslieferung separat nachweisen.

## Batch 06-269 – 06.11.2026

Zwei direkt versbezogene authentische Auslegungen aus Ṣaḥīḥ al-Buḫārī: Qurʾān 6:86 (Prophetenḥadīṯ über Ibn ʿAbbās zu Yūnus, 4630, marfūʿ) und Qurʾān 6:90 (eigenständiger Ṣaḥābī-Tafsīr Ibn ʿAbbās über Dāwūd und Rechtleitung, 4632, mawqūf). Die Zusatzkette zu 6:90 ist getrennt und nicht in den Hauptweg hineinkopiert. Geplanter Stand 4773/6236, verbleibend 1463; Quellen und Isnādhinweise in SOURCE_REVIEW_06-269.md. Nur nach PR-/Release-Gates gültig.

## Batch 06-270 — 06.11.2026 (Prüfzweig)

Qurʾān 8:39: die authentische mawqūf-Auslegung von ʿAbdullāh ibn ʿUmar im Ṣaḥīḥ al-Buḫārī 4650 und 4651. Er ordnet die religiöse Verfolgung der Muslime dem frühen historischen Verskontext zu und grenzt sie von Machtkämpfen unter Muslimen ab. Kein eigenständiger Prophetenwortlaut, keine heutige Gewaltaufforderung. Katalog nach Freigabe 4774/6236, Lücken 1462. Details in SOURCE_REVIEW_06-270.md.

## Batch 06-271 — 06.11.2026 (authentische Quellen, Prüfzweig)

Zwei frühislamische Kontextberichte aus Ṣaḥīḥ al-Buḫārī: 9:3 Abū Hurayrah über die Bekanntmachung im Ḥaǧǧ (Nr. 4656), 9:12 Ḥuḏayfah über damals noch lebende Adressaten des Verses (Nr. 4658). Mawqūf/Ṣaḥābī-Zeugnisse ausdrücklich abgegrenzt von eigenständigen Prophetenaussprüchen. Sollstand nach Live-Freigabe 4776/6236 und 1460 Lücken. Weitere Einzelheiten: SOURCE_REVIEW_06-271.md.
