/* DĀR AL TAWḤĪD KIDS V30 · Unterricht 67–70; Quellen geprüft, didaktische Beispiele gekennzeichnet.
 * Alle drei Altersgruppen separat; keine Audiofreigabe und keine Veränderung früherer Lernstände.
 */
(function(){
"use strict";
const prior=window.DARKidsAcademyCurriculum;
if(!prior||!prior["akhlaq-fehler-ehrlich-zugeben"])return;
const additions={
  "adab-gespraechspartner-ausreden-lassen": {
    "id": "adab-gespraechspartner-ausreden-lassen",
    "subject": "adab",
    "pillar": "adab",
    "topic": "Gesprächspartner ausreden lassen",
    "title": "Adab · Freundlich zuhören",
    "lead": "Wir lassen andere zu Wort kommen und achten ihre Worte.",
    "goal": "Ich warte beim Gespräch und frage freundlich nach, wenn jemand fertig ist.",
    "quran": {
      "surah": 17,
      "ayah": 53,
      "label": "Sūrat al-Isrāʾ · 17:53",
      "arabic": "وَقُل لِّعِبَادِي يَقُولُوا الَّتِي هِيَ أَحْسَنُ",
      "meaning": "Und sage Meinen Dienern, sie sollen die besten Worte sprechen. (Sinngemäße Bedeutung, Versauszug)",
      "excerpt": true
    },
    "hadith": {
      "source": "Ṣaḥīḥ al-Buḫārī, Nr. 6018; Ṣaḥīḥ Muslim, Nr. 47 · Abū Hurayrah",
      "text": "Der Prophet ﷺ lehrte: Wer an Allah und den Jüngsten Tag glaubt, soll Gutes sprechen oder schweigen. (Sinngemäße Bedeutung)"
    },
    "sourceAudit": {
      "hadithUrl": "https://dorar.net/hadith/sharh/4363",
      "hadithNumber": "6018",
      "narrator": "Abū Hurayrah",
      "authenticity": "Ṣaḥīḥ",
      "quranReference": "17:53",
      "quranTextType": "excerpt",
      "hadithMeaningIsParaphrase": true,
      "verifiedDate": "2026-10-12",
      "note": "Der Qurʾānvers betrifft gute Worte, der Ḥadīṯ verantwortliches Sprechen. Das gegenseitige Ausredenlassen ist die pädagogische Gesprächsübung, kein gesondert wörtlich überlieferter Befehl aus diesen Texten."
    },
    "hint": "Kein Kind muss bei Gefahr oder dringend benötigter Hilfe schweigen. Erwachsene ermöglichen sichere Unterbrechungen.",
    "sample": "Ich höre zu. Wenn du fertig bist, möchte ich auch etwas sagen.",
    "ageText": {
      "4-5": {
        "intro": "Zwei Kinder möchten beide erzählen.",
        "lines": [
          "Meine Freundin spricht gerade.",
          "Ich schaue hin und höre zu.",
          "Ich warte kurz, bis sie fertig ist.",
          "Danach darf ich selbst etwas erzählen."
        ],
        "evidence": "Der Qurʾān lehrt gute Worte; wir üben dazu ruhiges Zuhören."
      },
      "6-8": {
        "intro": "Gutes Sprechen gelingt besser, wenn wir einander auch zuhören.",
        "lines": [
          "In Qurʾān 17:53 sollen Allahs Diener gute Worte wählen.",
          "Der Prophet ﷺ lehrte, Gutes zu sagen oder zu schweigen.",
          "Ich unterbreche nicht dauernd, sondern gebe anderen Zeit.",
          "Bei einer wichtigen Frage kann ich nach einer Pause freundlich sprechen."
        ],
        "evidence": "Das Ausredenlassen ist unsere Alltagsübung zur Rücksicht; die Szene ist kein Ḥadīṯ."
      },
      "9-10": {
        "intro": "Wir unterscheiden den Wortlaut der Belege von einer hilfreichen Gesprächsregel.",
        "lines": [
          "Qurʾān 17:53 fordert dazu auf, gute Worte zu wählen.",
          "Abū Hurayrah überlieferte in al-Buḫārī 6018 die Weisung, Gutes zu sprechen oder zu schweigen.",
          "Aus beidem üben wir, nicht jede Pause mit den eigenen Worten zu füllen und andere ausreden zu lassen.",
          "Wenn sich jemand unwohl oder unsicher fühlt, darf er jederzeit Hilfe holen oder unterbrechen."
        ],
        "evidence": "Weder Vers noch Ḥadīṯ verwenden wörtlich die Regel „Immer ausreden lassen“; das ist die gekennzeichnete pädagogische Anwendung."
      }
    },
    "questions": {
      "4-5": [
        {
          "type": "choice",
          "prompt": "Jemand erzählt. Was machst du?",
          "options": [
            "Ich höre zu.",
            "Ich rede absichtlich laut dazwischen."
          ],
          "correct": 0,
          "hint": "Warte einen Moment.",
          "explain": "Zuhören ist freundlich."
        },
        {
          "type": "choice",
          "prompt": "Wann kannst du deine Geschichte erzählen?",
          "options": [
            "Wenn die andere Person fertig ist.",
            "Nur indem ich sie unterbreche."
          ],
          "correct": 0,
          "hint": "Auch ich bekomme Zeit.",
          "explain": "Wir lassen einander zu Wort kommen."
        }
      ],
      "6-8": [
        {
          "type": "choice",
          "prompt": "Was lehrt Qurʾān 17:53?",
          "options": [
            "Gute Worte wählen.",
            "Andere ständig verspotten."
          ],
          "correct": 0,
          "hint": "Achte auf deine Worte.",
          "explain": "Die Worte sollen gut sein."
        },
        {
          "type": "choice",
          "prompt": "Was machst du, wenn zwei gleichzeitig reden?",
          "options": [
            "Ich warte und bitte freundlich um eine Reihenfolge.",
            "Ich werde immer lauter."
          ],
          "correct": 0,
          "hint": "Wir hören uns gegenseitig.",
          "explain": "Jede Person darf erzählen."
        },
        {
          "type": "text",
          "prompt": "Was kannst du sagen, wenn du auch etwas beitragen willst?",
          "sample": "Darf ich danach etwas erzählen?",
          "hint": "Formuliere eine freundliche Bitte."
        }
      ],
      "9-10": [
        {
          "type": "choice",
          "prompt": "Welche Aussage gibt die Quellen korrekt wieder?",
          "options": [
            "Die Belege lehren gute und verantwortliche Worte.",
            "Im Ḥadīṯ steht wörtlich eine Sitzordnung für Diskussionen."
          ],
          "correct": 0,
          "hint": "Vergleiche Beleg und Übung.",
          "explain": "Das Ausredenlassen ist die Anwendung."
        },
        {
          "type": "text",
          "prompt": "Begründe die Übung mit Qurʾān 17:53 und al-Buḫārī 6018.",
          "sample": "Beide betonen guten Umgang mit Worten. Zuhören ist eine sinnvolle Übung daraus.",
          "hint": "Originalquelle und Anwendung trennen."
        },
        {
          "type": "text",
          "prompt": "Wann ist Unterbrechen richtig?",
          "sample": "Bei Gefahr oder wenn ich dringend Hilfe brauche, darf ich sofort sprechen.",
          "hint": "Denke an Sicherheit."
        }
      ]
    },
    "voiceApproved": false
  },
  "tarbiyah-aufgaben-kleine-schritte": {
    "id": "tarbiyah-aufgaben-kleine-schritte",
    "subject": "akhlaq",
    "pillar": "tarbiyah",
    "topic": "Aufgaben in kleinen Schritten",
    "title": "Tarbiyah · Schritt für Schritt",
    "lead": "Kleine Schritte helfen beim Beginnen und Dranbleiben.",
    "goal": "Ich kann eine Aufgabe in zwei erreichbare Schritte teilen und um Hilfe bitten.",
    "quran": {
      "surah": 2,
      "ayah": 286,
      "label": "Sūrat al-Baqarah · 2:286",
      "arabic": "لَا يُكَلِّفُ اللَّهُ نَفْسًا إِلَّا وُسْعَهَا",
      "meaning": "Allah erlegt keiner Seele mehr auf, als sie leisten kann. (Versauszug)",
      "excerpt": true
    },
    "hadith": {
      "source": "Ṣaḥīḥ al-Buḫārī, Nr. 6464; Ṣaḥīḥ Muslim, Nr. 2818 · ʿĀʾishah",
      "text": "Der Prophet ﷺ erklärte, dass Allah die beständigen guten Taten liebt, auch wenn sie klein sind. (Sinngemäß)"
    },
    "sourceAudit": {
      "hadithUrl": "https://dorar.net/hadith/sharh/25705",
      "hadithNumber": "6464",
      "narrator": "ʿĀʾishah",
      "authenticity": "Ṣaḥīḥ",
      "quranReference": "2:286",
      "quranTextType": "excerpt",
      "hadithMeaningIsParaphrase": true,
      "verifiedDate": "2026-10-12",
      "note": "Qurʾān 2:286 behandelt Gottes religiöse Pflichten gemäß Fähigkeit, nicht eine pädagogische Garantie jeder Schulaufgabe. Der Ḥadīṯ betrifft beständige gute Taten. Kleine Schulschritte sind eine ausdrücklich didaktische Übertragung, kein religiöses Pflichtmaß."
    },
    "hint": "Aufgaben dürfen angepasst werden; bei Überforderung sind Pausen und Hilfe richtig.",
    "sample": "Zuerst lege ich das Buch hin, dann räume ich die Stifte weg.",
    "ageText": {
      "4-5": {
        "intro": "Ein Zimmer sieht unordentlich aus. Wo fange ich an?",
        "lines": [
          "Ich suche nur die Bücher.",
          "Ich stelle ein Buch an seinen Platz.",
          "Danach räume ich die Stifte zusammen.",
          "Ich darf jemanden um Hilfe bitten."
        ],
        "evidence": "Unsere Aufräumübung ist ein Beispiel. Der Ḥadīṯ lobt beständige kleine gute Taten."
      },
      "6-8": {
        "intro": "Große Aufgaben können wir überschaubar machen.",
        "lines": [
          "Allah verlangt von Menschen nichts, was ihre Kraft übersteigt; so steht es im Vers 2:286 über religiöse Pflichten.",
          "Der Prophet ﷺ sprach von beständigen guten Taten, selbst wenn sie klein sind.",
          "Wir teilen eine Aufgabe in einen ersten und einen zweiten Teil.",
          "Eine Pause oder Hilfe macht mich nicht weniger wertvoll."
        ],
        "evidence": "Wir übertragen die Idee von Beständigkeit als Lernhilfe; das Schulbeispiel ist kein Ḥadīṯ."
      },
      "9-10": {
        "intro": "Wir üben eine sinnvolle Methode, ohne dem Qurʾān etwas unterzuschieben.",
        "lines": [
          "Qurʾān 2:286 spricht davon, dass Allah niemandem religiöse Pflichten jenseits seiner Fähigkeit auferlegt.",
          "Al-Buḫārī 6464 betont beständige gute Taten, selbst wenn sie wenig erscheinen.",
          "Daraus entwickeln wir eine Lernstrategie: Ziel festlegen, kleine Teilaufgaben bearbeiten und kontrollieren.",
          "Diese Lernmethode ist unsere pädagogische Anwendung; die Quelle nennt keine vorgeschriebene Schrittzahl."
        ],
        "evidence": "Belege und Unterrichtsmethode sind klar voneinander getrennt."
      }
    },
    "questions": {
      "4-5": [
        {
          "type": "choice",
          "prompt": "Viele Sachen liegen herum. Was hilft?",
          "options": [
            "Erst die Bücher, dann die Stifte.",
            "Alles gleichzeitig tragen."
          ],
          "correct": 0,
          "hint": "Ein Schritt nach dem anderen.",
          "explain": "So bleibt die Aufgabe übersichtlich."
        },
        {
          "type": "choice",
          "prompt": "Wenn etwas zu schwer ist, darfst du ...",
          "options": [
            "um Hilfe bitten.",
            "dich dafür schämen."
          ],
          "correct": 0,
          "hint": "Hilfe ist erlaubt.",
          "explain": "Du musst nichts allein schaffen."
        }
      ],
      "6-8": [
        {
          "type": "choice",
          "prompt": "Was sagt der Ḥadīṯ über gute Taten?",
          "options": [
            "Beständige kleine gute Taten sind beliebt.",
            "Nur riesige einmalige Taten zählen."
          ],
          "correct": 0,
          "hint": "Erinnere dich an Beständigkeit.",
          "explain": "Auch kleine gute Taten zählen."
        },
        {
          "type": "choice",
          "prompt": "Wie beginne ich eine schwierige Aufgabe?",
          "options": [
            "Ich teile sie in machbare Schritte.",
            "Ich gebe sofort auf."
          ],
          "correct": 0,
          "hint": "Beginne übersichtlich.",
          "explain": "Ein erreichbarer Schritt hilft."
        },
        {
          "type": "text",
          "prompt": "Nenne zwei Schritte für das Aufräumen deines Tisches.",
          "sample": "Erst die Bücher stapeln, dann die Stifte sortieren.",
          "hint": "Zwei eigene Schritte genügen."
        }
      ],
      "9-10": [
        {
          "type": "choice",
          "prompt": "Was bedeutet Qurʾān 2:286 ursprünglich?",
          "options": [
            "Allah verpflichtet niemanden über dessen Vermögen hinaus.",
            "Jede Hausaufgabe muss sofort leicht sein."
          ],
          "correct": 0,
          "hint": "Beachte den Kontext des Verses.",
          "explain": "Der Vers behandelt Allahs Verpflichtungen."
        },
        {
          "type": "text",
          "prompt": "Erkläre den Zusammenhang zwischen al-Buḫārī 6464 und unserer Lernübung.",
          "sample": "Beständigkeit ist belegt, das Aufteilen einer Schulaufgabe ist unsere Methode.",
          "hint": "Grenze Quelle und Didaktik ab."
        },
        {
          "type": "text",
          "prompt": "Was hilft, wenn der erste Teil noch nicht gelingt?",
          "sample": "Pause machen, Hilfe holen oder den Teil kleiner wählen.",
          "hint": "Suche eine sichere, realistische Lösung."
        }
      ]
    },
    "voiceApproved": false
  },
  "nafs-mit-enttaeuschung-umgehen": {
    "id": "nafs-mit-enttaeuschung-umgehen",
    "subject": "akhlaq",
    "pillar": "nafs",
    "topic": "Mit Enttäuschungen umgehen",
    "title": "Nafs · Wenn etwas anders kommt",
    "lead": "Enttäuschung ist ein Gefühl. Wir lernen, damit freundlich und sicher umzugehen.",
    "goal": "Ich kann mein Gefühl benennen, ruhig reagieren und Hilfe suchen.",
    "quran": {
      "surah": 2,
      "ayah": 153,
      "label": "Sūrat al-Baqarah · 2:153",
      "arabic": "يَا أَيُّهَا الَّذِينَ آمَنُوا اسْتَعِينُوا بِالصَّبْرِ وَالصَّلَاةِ ۚ إِنَّ اللَّهَ مَعَ الصَّابِرِينَ",
      "meaning": "O ihr, die ihr glaubt, sucht Hilfe in Geduld und im Gebet; Allah ist mit den Geduldigen.",
      "excerpt": false
    },
    "hadith": {
      "source": "Ṣaḥīḥ Muslim, Nr. 2999 · Ṣuhayb ibn Sinān",
      "text": "Der Prophet ﷺ erklärte: Wenn einem Gläubigen Gutes widerfährt, dankt er; trifft ihn Schwieriges, übt er Geduld. (Sinngemäß)"
    },
    "sourceAudit": {
      "hadithUrl": "https://dorar.net/hadith/sharh/152156",
      "hadithNumber": "2999",
      "narrator": "Ṣuhayb ibn Sinān",
      "authenticity": "Ṣaḥīḥ",
      "quranReference": "2:153",
      "quranTextType": "complete",
      "hadithMeaningIsParaphrase": true,
      "verifiedDate": "2026-10-12",
      "note": "Geduld bedeutet nicht Gefühlsunterdrückung. Die Szene mit einer Absage ist eine sichere pädagogische Anwendung, kein historischer Bericht über den Propheten."
    },
    "hint": "Traurigkeit ist erlaubt. Bei belastenden Gefühlen darf jedes Kind eine Vertrauensperson ansprechen; kein Kind muss sich allein beruhigen.",
    "sample": "Ich bin traurig, weil es heute nicht klappt. Darf ich mit dir reden?",
    "ageText": {
      "4-5": {
        "intro": "Heute fällt unser Ausflug aus. Ich bin traurig.",
        "lines": [
          "Ich darf traurig sein.",
          "Ich sage: Ich bin enttäuscht.",
          "Ich frage jemanden, ob er mir zuhört.",
          "Wir überlegen gemeinsam, was jetzt möglich ist."
        ],
        "evidence": "Der Qurʾān lehrt Geduld. Gefühle benennen ist unsere Unterrichtsübung."
      },
      "6-8": {
        "intro": "Manches läuft nicht so, wie wir es uns wünschen.",
        "lines": [
          "Qurʾān 2:153 ermutigt zum Ṣabr, also zur Geduld.",
          "Der Prophet ﷺ lehrte Dankbarkeit bei Gutem und Geduld bei Schwerem.",
          "Enttäuschung darf ich fühlen und in Worte fassen.",
          "Ich bitte um Hilfe und kann zusammen mit Erwachsenen einen neuen Plan suchen."
        ],
        "evidence": "Die ausgefallene Verabredung ist eine erfundene Alltagsszene und keine Überlieferung."
      },
      "9-10": {
        "intro": "Geduld bedeutet, trotz Enttäuschung gut mit sich und anderen umzugehen.",
        "lines": [
          "Allah ruft in Qurʾān 2:153 dazu auf, mit Geduld und Gebet Hilfe zu suchen.",
          "Ṣuhayb überlieferte in Muslim 2999 die Lehre von Dankbarkeit bei Gutem und Geduld bei Schwierigkeit.",
          "Eine Enttäuschung darf schmerzen. Ich kann mein Gefühl anerkennen, ohne jemanden zu verletzen.",
          "Eine Vertrauensperson um Unterstützung zu bitten widerspricht dem Ṣabr nicht."
        ],
        "evidence": "Das selbstbestimmte Gespräch über Gefühle ist unsere pädagogische Anwendung der belegten Werte."
      }
    },
    "questions": {
      "4-5": [
        {
          "type": "choice",
          "prompt": "Der Ausflug fällt aus. Was darfst du sagen?",
          "options": [
            "Ich bin traurig.",
            "Ich darf nie traurig sein."
          ],
          "correct": 0,
          "hint": "Gefühle haben Platz.",
          "explain": "Ich kann es ruhig sagen."
        },
        {
          "type": "choice",
          "prompt": "Wer kann dir helfen?",
          "options": [
            "Eine vertraute erwachsene Person.",
            "Niemand darf davon wissen."
          ],
          "correct": 0,
          "hint": "Du darfst um Hilfe bitten.",
          "explain": "Gemeinsam geht es leichter."
        }
      ],
      "6-8": [
        {
          "type": "choice",
          "prompt": "Was bedeutet Ṣabr?",
          "options": [
            "Geduld.",
            "Alles allein verstecken."
          ],
          "correct": 0,
          "hint": "Ṣabr bedeutet Geduld.",
          "explain": "Gefühle dürfen da sein."
        },
        {
          "type": "choice",
          "prompt": "Was kannst du bei Enttäuschung tun?",
          "options": [
            "Gefühl benennen und um Hilfe bitten.",
            "Andere absichtlich verletzen."
          ],
          "correct": 0,
          "hint": "Reden hilft.",
          "explain": "Ich kann freundlich Hilfe suchen."
        },
        {
          "type": "text",
          "prompt": "Was sagst du, wenn eine Einladung ausfällt?",
          "sample": "Ich bin enttäuscht. Können wir einen anderen Tag finden?",
          "hint": "Formuliere es ruhig."
        }
      ],
      "9-10": [
        {
          "type": "choice",
          "prompt": "Was nennt Muslim 2999?",
          "options": [
            "Dankbarkeit bei Gutem und Geduld bei Schwierigkeiten.",
            "Dass Menschen niemals traurig sein dürfen."
          ],
          "correct": 0,
          "hint": "Achte auf den überlieferten Sinn.",
          "explain": "Geduld und Dankbarkeit gehören zusammen."
        },
        {
          "type": "text",
          "prompt": "Wie verbindest du Qurʾān 2:153 mit einem eigenen Beispiel?",
          "sample": "Ich suche mit Geduld Hilfe, bleibe fair und kann mein Anliegen offen besprechen.",
          "hint": "Ein eigenes Beispiel ist keine Originalüberlieferung."
        },
        {
          "type": "text",
          "prompt": "Muss man mit Enttäuschung allein zurechtkommen?",
          "sample": "Nein. Man darf mit vertrauten Erwachsenen sprechen und Unterstützung suchen.",
          "hint": "Ṣabr verbietet Hilfe nicht."
        }
      ]
    },
    "voiceApproved": false
  },
  "fiqh-wudu-wasser-sparen": {
    "id": "fiqh-wudu-wasser-sparen",
    "subject": "fiqh",
    "pillar": "fiqh",
    "topic": "Wasser beim Wuḍūʾ sparen",
    "title": "Fiqh · Wuḍūʾ ohne Verschwendung",
    "lead": "Wir reinigen uns sorgfältig und lassen Wasser nicht unnötig laufen.",
    "goal": "Ich verstehe das Vermeiden von Verschwendung beim Wuḍūʾ, ohne die vorgeschriebene Waschung auszulassen.",
    "quran": {
      "surah": 7,
      "ayah": 31,
      "label": "Sūrat al-Aʿrāf · 7:31",
      "arabic": "وَلَا تُسْرِفُوا إِنَّهُ لَا يُحِبُّ الْمُسْرِفِينَ",
      "meaning": "Und seid nicht verschwenderisch; Allah liebt die Verschwenderischen nicht. (Versauszug)",
      "excerpt": true
    },
    "hadith": {
      "source": "Ṣaḥīḥ al-Buḫārī, Nr. 201; Ṣaḥīḥ Muslim, Nr. 325 · Anas ibn Mālik",
      "text": "Anas berichtete, dass der Prophet ﷺ für den Wuḍūʾ einen Mudd Wasser verwendete. (Sinngemäße Bedeutung)"
    },
    "sourceAudit": {
      "hadithUrl": "https://dorar.net/hadith/sharh/532",
      "hadithNumber": "201",
      "narrator": "Anas ibn Mālik",
      "authenticity": "Ṣaḥīḥ",
      "quranReference": "7:31",
      "quranTextType": "excerpt",
      "hadithMeaningIsParaphrase": true,
      "verifiedDate": "2026-10-12",
      "note": "Vers 7:31 erwähnt zunächst Essen und Trinken ohne Verschwendung; hier wird die allgemeine Lehre auf Wasserverbrauch übertragen. Der Mudd ist ein überliefertes Beispiel, keine für jedes Kind verbindliche starre Litergrenze. Vorgeschriebene Waschung vollständig durchführen; hanbalitische Pflichten nicht einschränken."
    },
    "hint": "Kinder üben Wasserhähne nur mit sicherer Aufsicht; nicht an ausreichendem Wasser für die Pflichtteile sparen. Reinigen muss vollständig gelingen.",
    "sample": "Ich nutze genug Wasser zum Waschen und schließe danach den Hahn.",
    "ageText": {
      "4-5": {
        "intro": "Beim Waschen brauche ich Wasser – aber nicht endlos.",
        "lines": [
          "Ich öffne den Hahn mit Hilfe eines Erwachsenen.",
          "Ich wasche sorgfältig mit genug Wasser.",
          "Ich drehe den Hahn zu, wenn ich fertig bin.",
          "So verschwenden wir kein Wasser."
        ],
        "evidence": "Im Qurʾān steht, dass wir nicht verschwenderisch sein sollen. Das Hahnbeispiel ist unsere Übung."
      },
      "6-8": {
        "intro": "Wuḍūʾ ist die Waschung vor dem Gebet. Dafür nutzen wir Wasser achtsam.",
        "lines": [
          "Qurʾān 7:31 verbietet Verschwendung; zuerst geht es im Vers um Essen und Trinken.",
          "Anas berichtete, dass der Prophet ﷺ für Wuḍūʾ einen Mudd Wasser nutzte.",
          "Wir waschen alle nötigen Körperteile vollständig und lassen den Hahn nicht unnötig offen.",
          "Ein Erwachsener hilft, die Waschung richtig und sicher zu lernen."
        ],
        "evidence": "Mudd bezeichnet ein traditionelles Hohlmaß; keine für alle gleiche Pflichtmenge."
      },
      "9-10": {
        "intro": "Wir lernen, warum ausreichende Reinigung und maßvoller Wasserverbrauch zusammengehören.",
        "lines": [
          "Der Wortlaut von 7:31 erwähnt zunächst Essen und Trinken und untersagt Verschwendung; das Prinzip wird auf den Wasserverbrauch angewandt.",
          "Nach al-Buḫārī 201 berichtete Anas, dass der Prophet ﷺ beim Wuḍūʾ einen Mudd verwendete.",
          "Die benötigte Wassermenge ist nicht für alle Menschen oder Situationen auf eine starre Zahl festgelegt.",
          "Wir führen die Waschung vollständig aus und vermeiden zugleich überflüssiges Laufenlassen des Wassers."
        ],
        "evidence": "Die Mengenangabe berichtet die Praxis des Propheten ﷺ; aus ihr folgt kein starres Pflichtvolumen nach Ḥanbalī-Fiqh."
      }
    },
    "questions": {
      "4-5": [
        {
          "type": "choice",
          "prompt": "Was machst du nach dem Waschen?",
          "options": [
            "Ich schließe den Wasserhahn.",
            "Ich lasse ihn ohne Grund laufen."
          ],
          "correct": 0,
          "hint": "Wasser ist wertvoll.",
          "explain": "Hahn nach der Waschung schließen."
        },
        {
          "type": "choice",
          "prompt": "Darfst du die Waschung einfach auslassen, um Wasser zu sparen?",
          "options": [
            "Nein, ich wasche sorgfältig.",
            "Ja, alles bleibt trocken."
          ],
          "correct": 0,
          "hint": "Waschen gehört dazu.",
          "explain": "Achtsam und vollständig waschen."
        }
      ],
      "6-8": [
        {
          "type": "choice",
          "prompt": "Was bedeutet Wuḍūʾ?",
          "options": [
            "Die rituelle Waschung vor dem Gebet.",
            "Ein Trinkbecher."
          ],
          "correct": 0,
          "hint": "Denke an das Gebet.",
          "explain": "Wuḍūʾ bereitet auf das Gebet vor."
        },
        {
          "type": "choice",
          "prompt": "Was berichtet Anas über den Wuḍūʾ des Propheten ﷺ?",
          "options": [
            "Er nutzte einen Mudd Wasser.",
            "Er ließ stets den Hahn unbegrenzt laufen."
          ],
          "correct": 0,
          "hint": "Schau in al-Buḫārī 201.",
          "explain": "Die Quelle nennt einen Mudd."
        },
        {
          "type": "text",
          "prompt": "Wie vermeidest du Verschwendung, ohne das Waschen zu verkürzen?",
          "sample": "Ich wasche alle notwendigen Stellen vollständig und stelle den Hahn danach ab.",
          "hint": "Beide Ziele gehören zusammen."
        }
      ],
      "9-10": [
        {
          "type": "choice",
          "prompt": "Welche Aussage ist fiqhbezogen korrekt?",
          "options": [
            "Genug Wasser für die vollständige Waschung verwenden und unnötigen Verbrauch vermeiden.",
            "Jeder muss unabhängig von der Situation genau eine starre Menge erreichen."
          ],
          "correct": 0,
          "hint": "Der Mudd ist keine starre Obergrenze.",
          "explain": "Pflichtteile vollständig waschen."
        },
        {
          "type": "text",
          "prompt": "Wie stehen Qurʾān 7:31 und al-Buḫārī 201 miteinander in Verbindung?",
          "sample": "Der Qurʾān verurteilt Verschwendung; der Ḥadīṯ nennt eine maßvolle Waschpraxis.",
          "hint": "Den Verskontext korrekt nennen."
        },
        {
          "type": "text",
          "prompt": "Warum darf man nicht zu wenig Wasser nehmen?",
          "sample": "Weil die vorgeschriebenen Waschungen tatsächlich ausgeführt werden müssen.",
          "hint": "Achtsamkeit ersetzt keine Reinigung."
        }
      ]
    },
    "voiceApproved": false
  }
};
for(const [id,lesson] of Object.entries(additions)){
 if(prior[id]||!lesson.quran||!lesson.hadith||!lesson.sourceAudit?.hadithUrl?.startsWith("https://dorar.net/")||lesson.voiceApproved!==false)throw Error("V30 invalid lesson "+id);
 for(const age of ["4-5","6-8","9-10"])if(lesson.ageText?.[age]?.lines?.length!==4||lesson.questions?.[age]?.length<(age==="4-5"?2:3))throw Error("V30 incomplete age content "+id+" "+age);
}
window.DARKidsAcademyCurriculum=Object.freeze({...prior,...additions});
window.DARKidsAcademyCurriculumV30=Object.freeze({"version":"20261012-v30","count":4,"ids":["adab-gespraechspartner-ausreden-lassen","tarbiyah-aufgaben-kleine-schritte","nafs-mit-enttaeuschung-umgehen","fiqh-wudu-wasser-sparen"],"pillars":{"adab-gespraechspartner-ausreden-lassen":"adab","tarbiyah-aufgaben-kleine-schritte":"tarbiyah","nafs-mit-enttaeuschung-umgehen":"nafs","fiqh-wudu-wasser-sparen":"fiqh"},"religiousSourcesVerified":true,"voiceRecordingsApproved":false,"requiresHumanAudioApproval":true});
})();
