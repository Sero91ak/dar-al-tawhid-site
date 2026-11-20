/* DĀR AL TAWḤĪD KIDS V28 – slots 59–62: four independent, authentically sourced lessons.
 * Twelve distinct age-specific teaching texts, verified Qurʾān / Ṣaḥīḥ references.
 * Safe pedagogy; no fictional Ṣaḥābah quotations; no auto-generated audio.
 */
(function(){
"use strict";
const prior=window.DARKidsAcademyCurriculum;
if(!prior||!prior["fiqh-wudu-schritte-reihenfolge"])return;
const additions={
  "quran-al-fatihah-kennenlernen": {
    "id": "quran-al-fatihah-kennenlernen",
    "subject": "aqidah",
    "pillar": "quran",
    "topic": "Al-Fātiḥah kennenlernen",
    "title": "Qurʾān · Al-Fātiḥah verstehen",
    "lead": "Wir lernen die erste Sūrah des Qurʾān kennen und verstehen ihren Beginn.",
    "goal": "Ich erkenne al-Fātiḥah und verstehe die Bedeutung des Lobes Allahs.",
    "quran": {
      "surah": 1,
      "ayah": 2,
      "label": "Sūrat al-Fātiḥah · 1:2",
      "arabic": "الْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ",
      "meaning": "Alles Lob gebührt Allah, dem Herrn der Welten.",
      "excerpt": false
    },
    "hadith": {
      "source": "Ṣaḥīḥ al-Buḫārī, Nr. 4474 · Abū Saʿīd ibn al-Muʿallā",
      "text": "Der Prophet ﷺ erklärte, dass Sūrat al-Fātiḥah eine besonders bedeutende Sūrah des Qurʾān ist."
    },
    "sourceAudit": {
      "hadithUrl": "https://sunnah.com/bukhari:4474",
      "hadithNumber": "4474",
      "narrator": "Abū Saʿīd ibn al-Muʿallā",
      "authenticity": "Ṣaḥīḥ",
      "quranReference": "1:2",
      "quranTextType": "complete",
      "hadithMeaningIsParaphrase": true,
      "verifiedDate": "2026-10-12",
      "note": "Der Unterricht zitiert nur Āyah 1:2. Das Vortragen der gesamten Sūrah erfolgt allein aus einem vollständigen authentischen Qurʾān-Audio; keine geklonte Rezitation."
    },
    "hint": "Al-Fātiḥah bedeutet: die Eröffnende. 'Al-ḥamdu lillāh' heißt: Alles Lob gehört Allah.",
    "sample": "Al-Fātiḥah ist die erste Sūrah. Ihr Beginn lehrt uns, Allah zu loben.",
    "ageText": {
      "4-5": {
        "intro": "Die erste Sūrah im Qurʾān heißt al-Fātiḥah. Wir hören aufmerksam zu.",
        "lines": [
          "Al-Fātiḥah steht am Anfang des Qurʾān.",
          "Ich höre eine richtige Qurʾān-Rezitation.",
          "Al-ḥamdu lillāh bedeutet: Alles Lob gehört Allah.",
          "Ich darf langsam lernen und nachfragen."
        ],
        "evidence": "Im Qurʾān steht: Alles Lob gehört Allah. Der Prophet ﷺ erklärte die große Bedeutung dieser Sūrah."
      },
      "6-8": {
        "intro": "Wir lernen den Namen al-Fātiḥah und den Sinn ihrer ersten Lobpreisung.",
        "lines": [
          "Al-Fātiḥah bedeutet: die Eröffnende.",
          "Sie ist die erste Sūrah im Qurʾān.",
          "'Al-ḥamdu lillāhi rabbi l-ʿālamīn' lobt Allah als Herrn der Welten.",
          "Wir lernen die richtige Aussprache durch eine echte Rezitation und einen geeigneten Lehrer."
        ],
        "evidence": "Ṣaḥīḥ al-Buḫārī Nr. 4474 benennt die herausragende Bedeutung der Sūrah; das Unterrichtsbeispiel erklärt Āyah 1:2."
      },
      "9-10": {
        "intro": "Wir trennen den arabischen Offenbarungstext von seiner deutschen Bedeutungsübersetzung.",
        "lines": [
          "Die gezeigte Āyah 1:2 gehört zu Sūrat al-Fātiḥah.",
          "Al-ḥamd bezeichnet das Lob, das Allah gebührt.",
          "Abū Saʿīd ibn al-Muʿallā überlieferte die prophetische Erklärung über die Bedeutung dieser Sūrah.",
          "Wir lesen den Vers, verstehen seine Grundbedeutung und hören die vollständige Sūrah nur als authentische Rezitation."
        ],
        "evidence": "Der Ḥadīṯ spricht über die gesamte Sūrah, während die arabische Zeile hier nur Āyah 1:2 zeigt."
      }
    },
    "questions": {
      "4-5": [
        {
          "type": "choice",
          "prompt": "Wir haben den Anfang des Qurʾāns kennengelernt. Wie heißt die erste Sūrah im Qurʾān?",
          "options": [
            "Al-Fātiḥah",
            "Al-Iḫlāṣ"
          ],
          "correct": 0,
          "hint": "Sie beginnt den Qurʾān.",
          "explain": "Al-Fātiḥah ist die erste Sūrah."
        },
        {
          "type": "choice",
          "prompt": "Wenn wir „al-ḥamdu lillāh“ sagen, was drücken wir damit aus?",
          "options": [
            "Alles Lob gehört Allah.",
            "Ich bitte Allah um Hilfe."
          ],
          "correct": 0,
          "hint": "Wir loben Allah.",
          "explain": "Alles Lob gehört Allah."
        }
      ],
      "6-8": [
        {
          "type": "choice",
          "prompt": "Was bedeutet der Name Sūrat al-Fātiḥah auf Deutsch?",
          "options": [
            "Die Eröffnende",
            "Die Aufrichtige"
          ],
          "correct": 0,
          "hint": "Sie steht am Anfang.",
          "explain": "Die Eröffnende."
        },
        {
          "type": "choice",
          "prompt": "Wir haben den Vers über das Lob Allahs kennengelernt. Was sagt er über Allah aus?",
          "options": [
            "Allah gebührt das Lob.",
            "Wir bitten Allah in diesem Vers nur um etwas."
          ],
          "correct": 0,
          "hint": "Lies die Bedeutung.",
          "explain": "Alles Lob gebührt Allah."
        },
        {
          "type": "text",
          "prompt": "Wie übst du die richtige Qurʾān-Aussprache?",
          "sample": "Ich höre eine echte Rezitation und übe mit einer Lehrperson.",
          "hint": "Keine künstlich nachgesprochene arabische Rezitation."
        }
      ],
      "9-10": [
        {
          "type": "choice",
          "prompt": "Wir haben eine Überlieferung über die besondere Stellung von al-Fātiḥah kennengelernt. Was erklärt sie?",
          "options": [
            "Die besondere Bedeutung der gesamten Sūrat al-Fātiḥah.",
            "Nur den einzelnen zweiten Vers, nicht die ganze Sūrah."
          ],
          "correct": 0,
          "hint": "Abū Saʿīd überlieferte dies.",
          "explain": "Der Prophet ﷺ lehrte die Bedeutung von al-Fātiḥah."
        },
        {
          "type": "text",
          "prompt": "Erkläre den Unterschied zwischen arabischem Text und deutscher Bedeutung.",
          "sample": "Der arabische Qurʾāntext ist Original; die deutsche Formulierung erklärt die Bedeutung.",
          "hint": "Trenne Original und Übersetzung."
        },
        {
          "type": "text",
          "prompt": "Was bedeutet 'rabbi l-ʿālamīn' im Unterricht?",
          "sample": "Allah ist der Herr der Welten.",
          "hint": "Überlege, wer in diesem Vers als Herr der Welten bezeichnet wird."
        }
      ]
    },
    "voiceApproved": false
  },
  "sirah-nuh-geduldig-einladen": {
    "id": "sirah-nuh-geduldig-einladen",
    "subject": "aqidah",
    "pillar": "sirah",
    "topic": "Nūḥ عليه السلام und Geduld",
    "title": "Sīrah · Nūḥ und seine Geduld",
    "lead": "Nūḥ عليه السلام rief seine Menschen beharrlich zu Allah.",
    "goal": "Ich erfahre, dass Nūḥ ein Gesandter Allahs war und sein gutes Anliegen nicht sofort aufgab.",
    "quran": {
      "surah": 71,
      "ayah": 5,
      "label": "Sūrat Nūḥ · 71:5",
      "arabic": "قَالَ رَبِّ إِنِّي دَعَوْتُ قَوْمِي لَيْلًا وَنَهَارًا",
      "meaning": "Er sagte: Mein Herr, ich habe mein Volk bei Nacht und bei Tag gerufen.",
      "excerpt": false
    },
    "hadith": {
      "source": "Ṣaḥīḥ al-Buḫārī, Nr. 7410; Ṣaḥīḥ Muslim, Nr. 193 · Anas ibn Mālik",
      "text": "In einem authentischen Bericht wird Nūḥ als der erste Gesandte beschrieben, den Allah zu den Menschen der Erde sandte."
    },
    "sourceAudit": {
      "hadithUrl": "https://dorar.net/hadith/sharh/5840",
      "hadithNumber": "7410",
      "narrator": "Anas ibn Mālik",
      "authenticity": "Ṣaḥīḥ",
      "quranReference": "71:5",
      "quranTextType": "complete",
      "hadithMeaningIsParaphrase": true,
      "verifiedDate": "2026-10-12",
      "note": "Der längere Ḥadīṯ behandelt die Fürsprache am Jüngsten Tag; nur seine ausdrückliche Aussage über Nūḥ wird altersgerecht behandelt. Geduldiges Rufen wird direkt aus Qurʾān 71:5 erläutert."
    },
    "hint": "Geduld bedeutet hier: ruhig und beharrlich Gutes tun. Kinder müssen keine Erwachsenen belehren oder gefährliche Situationen aushalten.",
    "sample": "Nūḥ عليه السلام war ein Gesandter Allahs. Er rief sein Volk immer wieder zum Guten.",
    "ageText": {
      "4-5": {
        "intro": "Nūḥ war ein Prophet und Gesandter Allahs. Er erinnerte die Menschen an Allah.",
        "lines": [
          "Allah schickte Nūḥ zu den Menschen.",
          "Nūḥ rief seine Menschen bei Tag und bei Nacht.",
          "Das lesen wir im Qurʾān.",
          "Wenn ich etwas Schwieriges lerne, darf ich Pausen machen und Hilfe holen."
        ],
        "evidence": "Der Qurʾān erzählt, wie Nūḥ sein Volk rief. Der Ṣaḥīḥ-Ḥadīṯ erwähnt Nūḥ als Gesandten."
      },
      "6-8": {
        "intro": "Nūḥ عليه السلام blieb beharrlich, obwohl nicht jeder auf ihn hörte.",
        "lines": [
          "Sūrat Nūḥ 71:5 nennt sein Rufen bei Nacht und bei Tag.",
          "Er rief seine Menschen zum Glauben an Allah.",
          "Ein authentischer Ḥadīṯ nennt Nūḥ einen frühen Gesandten zu den Menschen.",
          "Wir lernen daraus, beim Guten Geduld zu üben, ohne uns in Gefahr zu bringen."
        ],
        "evidence": "Der Qurʾān belegt das beharrliche Rufen; der Ḥadīṯ belegt Nūḥs Stellung als Gesandter."
      },
      "9-10": {
        "intro": "Wir vergleichen Qurʾān 71:5 und einen Teil des authentischen Schafāʿah-Berichts.",
        "lines": [
          "Der Qurʾān zitiert die Worte Nūḥs über sein andauerndes Rufen.",
          "Der Überlieferung bei al-Buḫārī Nr. 7410 entnehmen wir eine Aussage über seine Sendung.",
          "Der Ḥadīṯ liefert hier keinen neuen Bericht über eine Unterrichtsszene oder die Arche.",
          "Das Alltagsbeispiel 'bei einer schwierigen Aufgabe ruhig bleiben' ist eine pädagogische Anwendung, keine Nūḥ-Erzählung."
        ],
        "evidence": "Die Geduld Nūḥs wird auf Qurʾān 71:5 gegründet; wir erfinden keine zusätzlichen Ereignisse."
      }
    },
    "questions": {
      "4-5": [
        {
          "type": "choice",
          "prompt": "Wer war Nūḥ?",
          "options": [
            "Ein Gesandter Allahs.",
            "Ein erfundenes Spielzeug."
          ],
          "correct": 0,
          "hint": "Der Qurʾān erzählt von ihm.",
          "explain": "Nūḥ war ein Gesandter."
        },
        {
          "type": "choice",
          "prompt": "Wann rief er sein Volk?",
          "options": [
            "Bei Nacht und bei Tag.",
            "Nur beim Geburtstag."
          ],
          "correct": 0,
          "hint": "So steht es in Qurʾān 71:5.",
          "explain": "Bei Nacht und bei Tag."
        }
      ],
      "6-8": [
        {
          "type": "choice",
          "prompt": "Was berichtet Qurʾān 71:5?",
          "options": [
            "Nūḥ rief sein Volk bei Nacht und bei Tag.",
            "Nūḥ baute ein modernes Auto."
          ],
          "correct": 0,
          "hint": "Die Āyah ist unser Beleg.",
          "explain": "Er rief sein Volk immer wieder."
        },
        {
          "type": "choice",
          "prompt": "Was zeigt der Ḥadīṯ über Nūḥ?",
          "options": [
            "Er war ein von Allah gesandter Gesandter.",
            "Wir wissen alle heutigen Details seines Alltags."
          ],
          "correct": 0,
          "hint": "Der Ḥadīṯ nennt Nūḥs Sendung.",
          "explain": "Er war ein Gesandter."
        },
        {
          "type": "text",
          "prompt": "Was kannst du bei einer schwierigen Lernaufgabe tun?",
          "sample": "Ruhig weiterüben, eine Pause machen und nach Hilfe fragen.",
          "hint": "Das ist unsere heutige Übung."
        }
      ],
      "9-10": [
        {
          "type": "choice",
          "prompt": "Welche Quelle enthält die Worte 'bei Nacht und bei Tag'?",
          "options": [
            "Qurʾān 71:5.",
            "Unser eigenes Arbeitsblatt als Originalquelle."
          ],
          "correct": 0,
          "hint": "Prüfe die Āyah.",
          "explain": "Qurʾān 71:5."
        },
        {
          "type": "text",
          "prompt": "Was sagt al-Buḫārī 7410 über Nūḥ?",
          "sample": "Er wird als ein Gesandter zu den Menschen der Erde beschrieben.",
          "hint": "Gib nicht den gesamten längeren Ḥadīṯ als Kindergeschichte wieder."
        },
        {
          "type": "text",
          "prompt": "Warum dürfen wir Lernpausen als Beispiel nennen?",
          "sample": "Weil es eine sichere Anwendung ist; es ist keine überlieferte Szene aus Nūḥs Leben.",
          "hint": "Originalbeleg und Didaktik unterscheiden."
        }
      ]
    },
    "voiceApproved": false
  },
  "dua-abend-dhikr-lernen": {
    "id": "dua-abend-dhikr-lernen",
    "subject": "adab",
    "pillar": "dua",
    "topic": "Abends Allah gedenken",
    "title": "Duʿāʾ · Abends an Allah denken",
    "lead": "Wir lernen einen kurzen Anfang eines authentischen Abendgedenkens.",
    "goal": "Ich verstehe, dass der Abend eine Gelegenheit zum Gedenken Allahs ist.",
    "quran": {
      "surah": 33,
      "ayah": 41,
      "label": "Sūrat al-Aḥzāb · 33:41",
      "arabic": "يَا أَيُّهَا الَّذِينَ آمَنُوا اذْكُرُوا اللَّهَ ذِكْرًا كَثِيرًا",
      "meaning": "O die ihr glaubt, gedenkt Allahs in häufigem Gedenken.",
      "excerpt": false
    },
    "hadith": {
      "source": "Ṣaḥīḥ Muslim, Nr. 2723 · ʿAbdullāh ibn Masʿūd",
      "text": "Der Prophet ﷺ sprach am Abend einen Gedenkspruch, der mit 'Amsaynā wa-amsā l-mulku lillāh' beginnt: Wir sind am Abend angelangt, und die Herrschaft gehört Allah."
    },
    "sourceAudit": {
      "hadithUrl": "https://dorar.net/h/SUjNATlp?osoul=1",
      "hadithNumber": "2723",
      "narrator": "ʿAbdullāh ibn Masʿūd",
      "authenticity": "Ṣaḥīḥ",
      "quranReference": "33:41",
      "quranTextType": "complete",
      "hadithMeaningIsParaphrase": true,
      "verifiedDate": "2026-10-12",
      "note": "Der angeführte Wortlaut ist lediglich der ANFANG eines längeren authentischen Abend-ḏikr. Er darf nicht als vollständige Formel ausgegeben werden. Die komplette Rezitation braucht Originalaufnahme und menschliche Freigabe."
    },
    "hint": "Ḏikr heißt Gedenken Allahs. Die Formel aus Muslim 2723 ist länger als der hier besprochene Beginn.",
    "sample": "Am Abend kann ich Allah danken und einen überlieferten Ḏikr mit einem Erwachsenen lernen.",
    "ageText": {
      "4-5": {
        "intro": "Wenn es Abend wird, dürfen wir an Allah denken und Ihm danken.",
        "lines": [
          "Am Abend wird es ruhiger.",
          "Ich darf Allah danken.",
          "Der Prophet ﷺ gedachte Allahs auch am Abend.",
          "Ein Erwachsener kann mir ein richtiges Abend-Duʿāʾ zeigen."
        ],
        "evidence": "Allah befiehlt im Qurʾān, Seiner oft zu gedenken. Der Prophet ﷺ hatte authentische Worte für den Abend."
      },
      "6-8": {
        "intro": "Ḏikr ist das arabische Wort für Gedenken Allahs.",
        "lines": [
          "Qurʾān 33:41 fordert zum Gedenken Allahs auf.",
          "Der Prophet ﷺ sagte am Abend überlieferte Worte.",
          "Ein Gedenkspruch beginnt mit 'Amsaynā wa-amsā l-mulku lillāh'.",
          "Wir lernen die Bedeutung Schritt für Schritt und hören für die vollständige Formel nur eine überprüfte Aufnahme."
        ],
        "evidence": "Muslim 2723 enthält mehr Worte als diesen Anfang. Der Unterricht ersetzt keine vollständige Rezitation."
      },
      "9-10": {
        "intro": "Wir unterscheiden Qurʾān, authentische Abend-Adhkār und eine Unterrichtserklärung.",
        "lines": [
          "Der Qurʾān gebietet häufiges Gedenken Allahs.",
          "Ibn Masʿūd überlieferte die Abendformel aus Muslim Nr. 2723.",
          "Die hier erklärte Einleitung verweist auf Allahs Herrschaft und das Eintreten des Abends.",
          "Den vollständigen Ḏikr lernen wir aus dem Original; die deutsche Bedeutung ist eine Erklärung und keine arabische Rezitation."
        ],
        "evidence": "Die anfänglichen arabischen Worte allein sind ausdrücklich kein Nachweis für eine vollständige feste Duʿāʾ-Formel."
      }
    },
    "questions": {
      "4-5": [
        {
          "type": "choice",
          "prompt": "Woran dürfen wir abends denken?",
          "options": [
            "An Allah.",
            "Nur an Streit."
          ],
          "correct": 0,
          "hint": "Du darfst dankbar sein.",
          "explain": "Wir gedenken Allahs."
        },
        {
          "type": "choice",
          "prompt": "Wer kann dir eine richtige Duʿāʾ zeigen?",
          "options": [
            "Ein geeigneter Erwachsener.",
            "Eine erfundene Aufnahme."
          ],
          "correct": 0,
          "hint": "Wir lernen mit echten Quellen.",
          "explain": "Ein vertrauenswürdiger Erwachsener."
        }
      ],
      "6-8": [
        {
          "type": "choice",
          "prompt": "Was heißt Ḏikr?",
          "options": [
            "Gedenken Allahs.",
            "Eine neue Spielfigur."
          ],
          "correct": 0,
          "hint": "Es ist ein arabisches Wort.",
          "explain": "Ḏikr bedeutet Gedenken Allahs."
        },
        {
          "type": "choice",
          "prompt": "Ist der gezeigte Beginn die ganze Abendformel?",
          "options": [
            "Nein, die Überlieferung ist länger.",
            "Ja, sie endet sicher nach diesen Worten."
          ],
          "correct": 0,
          "hint": "Muslim 2723 ist länger.",
          "explain": "Der Anfang ist nicht das ganze Duʿāʾ."
        },
        {
          "type": "text",
          "prompt": "Im Unterricht haben wir gelernt, dass Allah uns zum Gedenken aufruft. Was bedeutet diese Aussage in deinen Worten?",
          "sample": "Die Gläubigen sollen Allah häufig gedenken.",
          "hint": "Trenne Qurʾān von Ḥadīṯ."
        }
      ],
      "9-10": [
        {
          "type": "choice",
          "prompt": "Woher kommt der Anfang der Abendformel?",
          "options": [
            "Ṣaḥīḥ Muslim Nr. 2723.",
            "Aus einer neuen, unbelegten Alltagsformel."
          ],
          "correct": 0,
          "hint": "Ibn Masʿūd überlieferte sie.",
          "explain": "Aus einem authentischen Ḥadīṯ."
        },
        {
          "type": "text",
          "prompt": "Warum darf eine Übersetzung nicht als Originalrezitation ausgegeben werden?",
          "sample": "Der Offenbarungs- und Überlieferungswortlaut bleibt arabisch; Deutsch erklärt nur die Bedeutung.",
          "hint": "Original und Erklärung unterscheiden."
        },
        {
          "type": "text",
          "prompt": "Wie prüfst du einen authentischen Abend-Ḏikr?",
          "sample": "Den vollständigen Wortlaut und seine Quelle nachschlagen und nur korrekt lernen.",
          "hint": "Ein Anfang allein ist nicht die ganze Formel."
        }
      ]
    },
    "voiceApproved": false
  },
  "family-geschwister-unterstuetzen": {
    "id": "family-geschwister-unterstuetzen",
    "subject": "akhlaq",
    "pillar": "family",
    "topic": "Geschwistern helfen und füreinander da sein",
    "title": "Familie · Wir helfen einander",
    "lead": "Wenn jemand traurig ist oder Hilfe braucht, können wir freundlich unterstützen.",
    "goal": "Ich erkenne eine passende, sichere Hilfe für ein Geschwisterkind.",
    "quran": {
      "surah": 5,
      "ayah": 2,
      "label": "Sūrat al-Māʾidah · 5:2",
      "arabic": "وَتَعَاوَنُوا عَلَى الْبِرِّ وَالتَّقْوَىٰ",
      "meaning": "Helft einander zu Güte und Gottesfurcht. (Versauszug)",
      "excerpt": true
    },
    "hadith": {
      "source": "Ṣaḥīḥ al-Buḫārī, Nr. 6026; Ṣaḥīḥ Muslim, Nr. 2585 · Abū Mūsā al-Ashʿarī",
      "text": "Der Prophet ﷺ verglich die gegenseitige Unterstützung der Gläubigen mit einem Gebäude, dessen Teile einander stärken."
    },
    "sourceAudit": {
      "hadithUrl": "https://dorar.net/hadith/sharh/151122",
      "hadithNumber": "6026",
      "narrator": "Abū Mūsā al-Ashʿarī",
      "authenticity": "Ṣaḥīḥ",
      "quranReference": "5:2",
      "quranTextType": "excerpt",
      "hadithMeaningIsParaphrase": true,
      "verifiedDate": "2026-10-12",
      "note": "Die Quelle behandelt die gegenseitige Unterstützung der Gläubigen allgemein. Einem traurigen oder jüngeren Geschwisterkind zu helfen, ist die heutige Unterrichtsanwendung; sie unterscheidet sich vom Unterricht 54 über gerechtes Teilen."
    },
    "hint": "Helfen ist freiwillige altersgerechte Verantwortung. Kinder sind nicht für die Sicherheit, Gesundheit oder Erziehung ihrer Geschwister zuständig; in schwierigen Situationen Erwachsene holen.",
    "sample": "Ich kann fragen, ob mein Geschwisterkind Hilfe möchte, und bei Schwierigkeiten einen Erwachsenen holen.",
    "ageText": {
      "4-5": {
        "intro": "Manchmal braucht dein Bruder oder deine Schwester Hilfe.",
        "lines": [
          "Ich sehe: Jemand ist traurig.",
          "Ich frage freundlich: Kann ich dir helfen?",
          "Ich darf einen Erwachsenen holen.",
          "Wir helfen, ohne zu schubsen oder auszulachen."
        ],
        "evidence": "Allah lehrt gegenseitige Hilfe beim Guten. Der Prophet ﷺ erklärte, dass Gläubige einander stärken."
      },
      "6-8": {
        "intro": "Wir lernen heute nicht das Teilen, sondern das Unterstützen bei Bedarf.",
        "lines": [
          "Qurʾān 5:2 ruft zur gegenseitigen Hilfe beim Guten auf.",
          "Der Prophet ﷺ erklärte gegenseitige Unterstützung mit einem festen Gebäude.",
          "Ich kann zuhören oder bei einer kleinen Aufgabe helfen.",
          "Wenn ein Problem zu groß ist, bitte ich Erwachsene um Hilfe."
        ],
        "evidence": "Das Bild vom Gebäude stammt aus dem Ḥadīṯ; die Familiensituation ist eine Anwendung."
      },
      "9-10": {
        "intro": "Gute Zusammenarbeit bedeutet, anderen zu helfen, ohne ihre Aufgaben vollständig übernehmen zu müssen.",
        "lines": [
          "Der Qurʾān spricht vom Zusammenwirken im Guten.",
          "Der Ḥadīṯ bei al-Buḫārī 6026 und Muslim 2585 vergleicht gegenseitige Hilfe mit einem tragfähigen Gebäude.",
          "Wir unterscheiden das allgemeine religiöse Prinzip von einer konkreten Familiensituation.",
          "Bei Gefahr, Krankheit oder belastenden Problemen haben Erwachsene die Verantwortung; Kinder dürfen Unterstützung anfordern."
        ],
        "evidence": "Unterstützung heißt nicht, sich selbst zu überlasten oder gefährliche Geheimnisse zu bewahren."
      }
    },
    "questions": {
      "4-5": [
        {
          "type": "choice",
          "prompt": "Deine Schwester ist traurig. Was kannst du tun?",
          "options": [
            "Freundlich fragen, ob sie Hilfe möchte.",
            "Sie absichtlich auslachen."
          ],
          "correct": 0,
          "hint": "Sei freundlich.",
          "explain": "Ich kann fragen und zuhören."
        },
        {
          "type": "choice",
          "prompt": "Ein Problem ist zu groß. Was tust du?",
          "options": [
            "Einen Erwachsenen holen.",
            "Ganz allein gefährliche Aufgaben übernehmen."
          ],
          "correct": 0,
          "hint": "Du darfst Hilfe holen.",
          "explain": "Ein Erwachsener kann helfen."
        }
      ],
      "6-8": [
        {
          "type": "choice",
          "prompt": "Du möchtest gemeinsam mit anderen helfen. Bei welcher Art von Handlungen sollen wir uns nach der Bedeutung des Verses gegenseitig unterstützen?",
          "options": [
            "Im Guten zusammenzuhelfen.",
            "Bei allem mitmachen, auch wenn es jemandem schadet."
          ],
          "correct": 0,
          "hint": "Es geht um gute Hilfe.",
          "explain": "Wir helfen beim Guten."
        },
        {
          "type": "choice",
          "prompt": "Welches Bild benutzt der Prophet ﷺ?",
          "options": [
            "Ein starkes Gebäude.",
            "Ein zerbrochenes Spielzeug als religiöse Pflicht."
          ],
          "correct": 0,
          "hint": "Quelle: al-Buḫārī 6026.",
          "explain": "Teile eines Gebäudes stützen sich."
        },
        {
          "type": "text",
          "prompt": "Wie hilfst du einem Geschwisterkind sinnvoll?",
          "sample": "Ich frage, was es braucht, helfe altersgerecht und hole bei Schwierigkeiten Erwachsene.",
          "hint": "Hilfe darf sicher sein."
        }
      ],
      "9-10": [
        {
          "type": "choice",
          "prompt": "Was ist der ursprüngliche Sinn des Ḥadīṯ?",
          "options": [
            "Gläubige unterstützen einander wie Teile eines Gebäudes.",
            "Kinder müssen die gesamte Elternverantwortung übernehmen."
          ],
          "correct": 0,
          "hint": "Trenne Quelle und Familienbeispiel.",
          "explain": "Die Überlieferung behandelt gegenseitige Unterstützung."
        },
        {
          "type": "text",
          "prompt": "Was unterscheidet Unterricht 62 von Unterricht 54?",
          "sample": "Hier geht es um passende Hilfe, dort um gerechtes Teilen.",
          "hint": "Zwei eigenständige Lernziele."
        },
        {
          "type": "text",
          "prompt": "Warum braucht Helfen klare Grenzen?",
          "sample": "Kinder dürfen Nein sagen und in belastenden Situationen Erwachsenenhilfe suchen.",
          "hint": "Verantwortung muss zum Alter passen."
        }
      ]
    },
    "voiceApproved": false
  }
};
for(const [id,l] of Object.entries(additions)){
 if(l.id!==id||prior[id]||!l.quran||!l.hadith?.source||!l.sourceAudit?.hadithUrl||l.voiceApproved)throw Error("Invalid V28 "+id);
 for(const age of ["4-5","6-8","9-10"])
  if(l.ageText[age].lines.length!==4||l.questions[age].length<2)throw Error("Missing V28 age text "+id+" "+age);
}
window.DARKidsAcademyCurriculum=Object.freeze({...prior,...additions});
window.DARKidsAcademyCurriculumV28=Object.freeze({"version":"20261012-v28","count":4,"ids":["quran-al-fatihah-kennenlernen","sirah-nuh-geduldig-einladen","dua-abend-dhikr-lernen","family-geschwister-unterstuetzen"],"pillars":{"quran-al-fatihah-kennenlernen":"quran","sirah-nuh-geduldig-einladen":"sirah","dua-abend-dhikr-lernen":"dua","family-geschwister-unterstuetzen":"family"},"religiousSourcesVerified":true,"voiceRecordingsApproved":false,"requiresHumanAudioApproval":true});
})();