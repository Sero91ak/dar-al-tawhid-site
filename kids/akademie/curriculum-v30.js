/* DĀR AL TAWḤĪD KIDS V30 · Unterricht 67–70, je drei Altersstufen.
 * Qurʾān-Originaltext / sinngemäße Ḥadīṯ-Wiedergabe / heutige Didaktik ausdrücklich getrennt.
 * Keine automatisch erzeugten oder freigegebenen Masterstimmen-Aufnahmen.
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
    "title": "Adab · Zuhören und ausreden lassen",
    "lead": "Gute Worte beginnen auch mit aufmerksamem Zuhören.",
    "goal": "Ich höre zu, lasse andere ausreden und antworte freundlich.",
    "quran": {
      "surah": 17,
      "ayah": 53,
      "label": "Sūrat al-Isrāʾ · 17:53",
      "arabic": "وَقُل لِّعِبَادِي يَقُولُوا الَّتِي هِيَ أَحْسَنُ",
      "meaning": "Sag Meinen Dienern, dass sie das sagen sollen, was am besten ist. (Versauszug)",
      "excerpt": true
    },
    "hadith": {
      "source": "Ṣaḥīḥ al-Buḫārī 6018; Ṣaḥīḥ Muslim 47 · Abū Hurayrah",
      "text": "Der Prophet ﷺ lehrte, Gutes zu reden oder zu schweigen. (Sinngemäß)"
    },
    "sourceAudit": {
      "hadithUrl": "https://dorar.net/hadith/sharh/4361",
      "hadithNumber": "6018",
      "narrator": "Abū Hurayrah",
      "authenticity": "Ṣaḥīḥ",
      "quranReference": "17:53",
      "quranTextType": "excerpt",
      "hadithMeaningIsParaphrase": true,
      "directLinkChecked": true,
      "verifiedDate": "2026-10-12",
      "note": "Ausredenlassen ist eine pädagogische Gesprächsregel, nicht der Wortlaut des Verses oder Ḥadīṯ."
    },
    "hint": "Bei Gefahr oder Unrecht darf ein Kind sofort Hilfe holen; gute Gesprächsregeln verlangen kein Schweigen in Not.",
    "sample": "Ich warte, bis mein Freund fertig ist, und frage danach freundlich nach.",
    "ageText": {
      "4-5": {
        "intro": "Dein Freund möchte etwas erzählen. Hörst du erst zu?",
        "lines": [
          "Mein Freund erzählt mir etwas.",
          "Ich schaue hin und höre zu.",
          "Wenn er fertig ist, darf ich antworten.",
          "Braucht jemand dringend Hilfe, hole ich sofort einen Erwachsenen."
        ],
        "evidence": "Im Qurʾān geht es um gute Worte; die Sunnah lehrt gutes Sprechen."
      },
      "6-8": {
        "intro": "Wir üben Gesprächsrollen: Eine Person erzählt, die andere hört zu.",
        "lines": [
          "Qurʾān 17:53 lehrt, gute Worte zu wählen.",
          "Im Ḥadīṯ lernen wir, Gutes zu sagen oder still zu sein.",
          "Ich unterbreche andere nicht unnötig.",
          "Danach frage ich freundlich nach und darf meine Meinung äußern."
        ],
        "evidence": "Das Nicht-Unterbrechen ist eine Übung für freundliche Gespräche, kein wörtliches Quellenzitat."
      },
      "9-10": {
        "intro": "Wir prüfen, was Qurʾān und Sunnah sagen, und was unsere Unterrichtsregel hinzufügt.",
        "lines": [
          "Qurʾān 17:53 fordert dazu auf, gut zu sprechen.",
          "Abū Hurayrah überliefert den authentischen Ḥadīṯ über gutes Reden.",
          "Ich lasse mein Gegenüber ausreden, um es zuerst zu verstehen.",
          "Wenn jemand verletzt wird oder Gefahr besteht, darf ich sofort Unterstützung suchen."
        ],
        "evidence": "Gutes Sprechen ist direkt belegt. Die Gesprächsübung ist eine eigene altersgerechte Anwendung."
      }
    },
    "questions": {
      "4-5": [
        {
          "type": "choice",
          "prompt": "Dein Freund erzählt. Was tust du?",
          "options": [
            "Ich höre erst zu.",
            "Ich rufe ständig dazwischen."
          ],
          "correct": 0,
          "hint": "Denke an das Lernziel dieser Unterrichtseinheit.",
          "explain": "Zuhören zeigt Respekt."
        },
        {
          "type": "choice",
          "prompt": "Jemand ist in Gefahr. Was tust du?",
          "options": [
            "Ich hole sofort Hilfe.",
            "Ich muss still bleiben."
          ],
          "correct": 0,
          "hint": "Denke an das Lernziel dieser Unterrichtseinheit.",
          "explain": "Sicherheit geht vor."
        }
      ],
      "6-8": [
        {
          "type": "choice",
          "prompt": "Was lehrt Qurʾān 17:53?",
          "options": [
            "Gute Worte zu wählen.",
            "Andere auszulachen."
          ],
          "correct": 0,
          "hint": "Denke an das Lernziel dieser Unterrichtseinheit.",
          "explain": "Der Vers spricht von guter Rede."
        },
        {
          "type": "choice",
          "prompt": "Was machst du nach dem Zuhören?",
          "options": [
            "Ich frage freundlich nach.",
            "Ich lache über die Erzählung."
          ],
          "correct": 0,
          "hint": "Denke an das Lernziel dieser Unterrichtseinheit.",
          "explain": "Fragen zeigen Interesse."
        },
        {
          "type": "text",
          "prompt": "Wie reagierst du, wenn jemand sofort Hilfe braucht?",
          "sample": "Ich spreche sofort eine vertrauenswürdige erwachsene Person an.",
          "hint": "Antworte mit eigenen Worten."
        }
      ],
      "9-10": [
        {
          "type": "choice",
          "prompt": "Welche Aussage stimmt?",
          "options": [
            "Die Gesprächsregel ist unsere Anwendung guter Rede.",
            "Der Vers nennt unser Rollenspiel wörtlich."
          ],
          "correct": 0,
          "hint": "Denke an das Lernziel dieser Unterrichtseinheit.",
          "explain": "Quelle und Didaktik müssen getrennt bleiben."
        },
        {
          "type": "text",
          "prompt": "Was lehrt al-Buḫārī 6018?",
          "sample": "Gutes reden oder schweigen.",
          "hint": "Antworte mit eigenen Worten."
        },
        {
          "type": "text",
          "prompt": "Wie kannst du höflich anderer Meinung sein?",
          "sample": "Ich höre zunächst zu und antworte ohne Beleidigung.",
          "hint": "Antworte mit eigenen Worten."
        }
      ]
    },
    "voiceApproved": false,
    "sourceType": "Qurʾān original; Ṣaḥīḥ meaning is paraphrase; didactic example is not quotation"
  },
  "akhlaq-tarbiyah-aufgaben-kleine-schritte": {
    "id": "akhlaq-tarbiyah-aufgaben-kleine-schritte",
    "subject": "akhlaq",
    "pillar": "tarbiyah",
    "topic": "Aufgaben in kleinen Schritten",
    "title": "Tarbiyah · Schritt für Schritt lernen",
    "lead": "Kleine, regelmäßige Schritte erleichtern eine große Aufgabe.",
    "goal": "Ich teile eine Aufgabe in machbare Schritte und darf um Hilfe bitten.",
    "quran": {
      "surah": 20,
      "ayah": 114,
      "label": "Sūrat Ṭā-Hā · 20:114",
      "arabic": "وَقُل رَّبِّ زِدْنِي عِلْمًا",
      "meaning": "Und sag: Mein Herr, mehre mein Wissen! (Versauszug)",
      "excerpt": true
    },
    "hadith": {
      "source": "Ṣaḥīḥ al-Buḫārī 6464; Ṣaḥīḥ Muslim 783 · ʿĀʾishah",
      "text": "Der Prophet ﷺ lehrte, dass beständige gute Taten geliebt sind, auch wenn sie klein sind. (Sinngemäß)"
    },
    "sourceAudit": {
      "hadithUrl": "https://dorar.net/h/EWjbLEIo",
      "hadithNumber": "6464",
      "narrator": "ʿĀʾishah",
      "authenticity": "Ṣaḥīḥ",
      "quranReference": "20:114",
      "quranTextType": "excerpt",
      "hadithMeaningIsParaphrase": true,
      "directLinkChecked": true,
      "verifiedDate": "2026-10-12",
      "note": "Die Duʿāʾ um Wissen und die Beständigkeit sind belegt; moderne Zweischritt-Lernmethoden sind eigene Didaktik."
    },
    "hint": "Pausen sind erlaubt; Kinder dürfen Aufgaben an ihre Fähigkeiten anpassen.",
    "sample": "Zuerst sortiere ich die Stifte, dann die Hefte.",
    "ageText": {
      "4-5": {
        "intro": "Ein großer Tisch ist unordentlich. Wir beginnen einfach.",
        "lines": [
          "Ich darf Allah um mehr Wissen bitten.",
          "Zuerst räume ich eine Sache weg.",
          "Dann versuche ich einen zweiten kleinen Schritt.",
          "Wenn es schwierig ist, frage ich nach Hilfe."
        ],
        "evidence": "Der Qurʾān lehrt die Bitte um Wissen; der Ḥadīṯ lobt Beständigkeit."
      },
      "6-8": {
        "intro": "Zwei kleine Schritte statt einer überwältigenden Aufgabe: So probieren wir es.",
        "lines": [
          "Qurʾān 20:114 enthält die Bitte um mehr Wissen.",
          "ʿĀʾishah überlieferte den Ḥadīṯ über regelmäßige gute Taten.",
          "Ich teile eine Aufgabe sinnvoll auf.",
          "Nach jedem kleinen Schritt prüfe ich, ob ich Hilfe brauche."
        ],
        "evidence": "Die Zweischritt-Aufgabe ist unsere Lernmethode, keine zusätzliche Religionsvorschrift."
      },
      "9-10": {
        "intro": "Wir unterscheiden das religiöse Ziel vom pädagogischen Weg, es zu üben.",
        "lines": [
          "Die Qurʾān-Bitte lautet: Mein Herr, mehre mein Wissen.",
          "Im Ṣaḥīḥ-Ḥadīṯ wird Beständigkeit guter Taten hervorgehoben.",
          "Ich setze mir erreichbare kleine Lernziele statt alles auf einmal schaffen zu wollen.",
          "Lernmethoden bleiben Hilfsmittel; eine Pause ist keine Sünde."
        ],
        "evidence": "Der Ḥadīṯ betrifft gute Taten allgemein, keinen vorgeschriebenen heutigen Stundenplan."
      }
    },
    "questions": {
      "4-5": [
        {
          "type": "choice",
          "prompt": "Wie beginnst du eine große Aufgabe?",
          "options": [
            "Mit einem kleinen Schritt.",
            "Indem ich alles wegwerfe."
          ],
          "correct": 0,
          "hint": "Denke an das Lernziel dieser Unterrichtseinheit.",
          "explain": "Ein guter Anfang darf klein sein."
        },
        {
          "type": "choice",
          "prompt": "Wenn du nicht weiterweißt?",
          "options": [
            "Ich frage nach Hilfe.",
            "Ich muss alles alleine können."
          ],
          "correct": 0,
          "hint": "Denke an das Lernziel dieser Unterrichtseinheit.",
          "explain": "Hilfe ist erlaubt."
        }
      ],
      "6-8": [
        {
          "type": "choice",
          "prompt": "Welche Bitte steht in Qurʾān 20:114?",
          "options": [
            "Mein Herr, mehre mein Wissen.",
            "Ich brauche kein Wissen."
          ],
          "correct": 0,
          "hint": "Denke an das Lernziel dieser Unterrichtseinheit.",
          "explain": "Wir dürfen Allah um Wissen bitten."
        },
        {
          "type": "choice",
          "prompt": "Was lobt der Ḥadīṯ?",
          "options": [
            "Regelmäßige gute Taten, auch kleine.",
            "Nur die größten Taten."
          ],
          "correct": 0,
          "hint": "Denke an das Lernziel dieser Unterrichtseinheit.",
          "explain": "Beständigkeit zählt."
        },
        {
          "type": "text",
          "prompt": "Nenne zwei Schritte zum Aufräumen.",
          "sample": "Erst Stifte sortieren, danach Bücher weglegen.",
          "hint": "Antworte mit eigenen Worten."
        }
      ],
      "9-10": [
        {
          "type": "choice",
          "prompt": "Was ist unsere pädagogische Anwendung?",
          "options": [
            "Die Aufgabe in Schritte teilen.",
            "Den Ḥadīṯ als Stundenplan ausgeben."
          ],
          "correct": 0,
          "hint": "Denke an das Lernziel dieser Unterrichtseinheit.",
          "explain": "Die Methode ist kein Offenbarungstext."
        },
        {
          "type": "text",
          "prompt": "Wie verbindest du Bitte um Wissen und beständiges Üben?",
          "sample": "Ich bitte Allah um Wissen und übe regelmäßig in machbaren Schritten.",
          "hint": "Antworte mit eigenen Worten."
        },
        {
          "type": "text",
          "prompt": "Wann änderst du einen Plan?",
          "sample": "Wenn er zu schwer ist, mache ich kleinere Schritte oder bitte um Hilfe.",
          "hint": "Antworte mit eigenen Worten."
        }
      ]
    },
    "voiceApproved": false,
    "sourceType": "Qurʾān original; Ṣaḥīḥ meaning is paraphrase; didactic example is not quotation"
  },
  "akhlaq-nafs-enttaeuschung-verarbeiten": {
    "id": "akhlaq-nafs-enttaeuschung-verarbeiten",
    "subject": "akhlaq",
    "pillar": "nafs",
    "topic": "Mit Enttäuschungen umgehen",
    "title": "Nafs · Mit Enttäuschung gut umgehen",
    "lead": "Traurig sein ist erlaubt. Ich darf um Trost und Unterstützung bitten.",
    "goal": "Ich benenne meine Gefühle und suche einen sicheren, guten Weg.",
    "quran": {
      "surah": 94,
      "ayah": 5,
      "label": "Sūrat aš-Šarḥ · 94:5",
      "arabic": "فَإِنَّ مَعَ الْعُسْرِ يُسْرًا",
      "meaning": "Gewiss, mit der Erschwernis kommt Erleichterung.",
      "excerpt": false
    },
    "hadith": {
      "source": "Ṣaḥīḥ Muslim 2999 · Ṣuhayb ibn Sinān",
      "text": "Der Prophet ﷺ lehrte: In guten Zeiten ist Dankbarkeit und in Schwierigkeiten Geduld eine gute Eigenschaft. (Sinngemäß)"
    },
    "sourceAudit": {
      "hadithUrl": "https://dorar.net/hadith/sharh/152156",
      "hadithNumber": "2999",
      "narrator": "Ṣuhayb ibn Sinān",
      "authenticity": "Ṣaḥīḥ",
      "quranReference": "94:5",
      "quranTextType": "complete",
      "hadithMeaningIsParaphrase": true,
      "directLinkChecked": true,
      "verifiedDate": "2026-10-12",
      "note": "Kein Versprechen, dass jede Enttäuschung sofort verschwindet. Gefühle und Trost sind pädagogisches Beispiel."
    },
    "hint": "Weinen und Traurigkeit sind erlaubt. Kein Kind muss Belastendes alleine durchstehen.",
    "sample": "Ich sage: Ich bin enttäuscht. Können wir reden?",
    "ageText": {
      "4-5": {
        "intro": "Der geplante Ausflug fällt aus. Vielleicht bist du traurig.",
        "lines": [
          "Ich darf traurig sein.",
          "Ich kann sagen: Das macht mich traurig.",
          "Ich bitte jemanden um Trost.",
          "Später kann ich etwas anderes versuchen."
        ],
        "evidence": "Allah erinnert uns an Erleichterung; der Prophet ﷺ lehrte Geduld."
      },
      "6-8": {
        "intro": "Eine Verabredung fällt aus. Wir überlegen einen freundlichen Umgang damit.",
        "lines": [
          "Enttäuschung ist ein normales Gefühl.",
          "Qurʾān 94:5 spricht von Erleichterung.",
          "Im authentischen Ḥadīṯ wird Geduld bei Schwierigkeiten gelehrt.",
          "Ich darf um Trost bitten und einen neuen Termin suchen."
        ],
        "evidence": "Eine abgesagte Verabredung ist unser Beispiel, nicht Teil des Ḥadīṯ."
      },
      "9-10": {
        "intro": "Gefühle ausdrücken und geduldig handeln schließen sich nicht aus.",
        "lines": [
          "Qurʾān 94:5 nennt Erleichterung mit Schwierigkeit.",
          "Ṣuhayb überlieferte den Ṣaḥīḥ-Ḥadīṯ über Dankbarkeit und Geduld.",
          "Ich kann Ärger und Traurigkeit ausdrücken, ohne andere zu verletzen.",
          "Es ist erlaubt, Unterstützung zu suchen und nicht sofort eine Lösung zu haben."
        ],
        "evidence": "Die Quellen garantieren keinen bestimmten Zeitpunkt, an dem Schwierigkeiten verschwinden."
      }
    },
    "questions": {
      "4-5": [
        {
          "type": "choice",
          "prompt": "Ein Ausflug fällt aus. Darfst du traurig sein?",
          "options": [
            "Ja, ich darf darüber reden.",
            "Nein, traurig sein ist verboten."
          ],
          "correct": 0,
          "hint": "Denke an das Lernziel dieser Unterrichtseinheit.",
          "explain": "Gefühle dürfen da sein."
        },
        {
          "type": "choice",
          "prompt": "Was kann dir helfen?",
          "options": [
            "Jemanden um Trost bitten.",
            "Andere schubsen."
          ],
          "correct": 0,
          "hint": "Denke an das Lernziel dieser Unterrichtseinheit.",
          "explain": "Hilfe suchen ist richtig."
        }
      ],
      "6-8": [
        {
          "type": "choice",
          "prompt": "Was steht in Qurʾān 94:5?",
          "options": [
            "Mit der Erschwernis kommt Erleichterung.",
            "Niemand ist je traurig."
          ],
          "correct": 0,
          "hint": "Denke an das Lernziel dieser Unterrichtseinheit.",
          "explain": "Der Vers spricht von Erleichterung."
        },
        {
          "type": "choice",
          "prompt": "Wie reagierst du auf eine Absage?",
          "options": [
            "Ich sage ruhig, was mich traurig macht.",
            "Ich beschimpfe alle."
          ],
          "correct": 0,
          "hint": "Denke an das Lernziel dieser Unterrichtseinheit.",
          "explain": "Gefühle kann man freundlich ausdrücken."
        },
        {
          "type": "text",
          "prompt": "Sage einen freundlichen Satz, wenn du enttäuscht bist.",
          "sample": "Ich bin traurig, dass es nicht klappt. Können wir reden?",
          "hint": "Antworte mit eigenen Worten."
        }
      ],
      "9-10": [
        {
          "type": "choice",
          "prompt": "Was wäre eine unbelegte Behauptung?",
          "options": [
            "Jede Enttäuschung ist sofort nach einer Stunde vorbei.",
            "Geduld ist eine gute Eigenschaft."
          ],
          "correct": 0,
          "hint": "Denke an das Lernziel dieser Unterrichtseinheit.",
          "explain": "Keine festen Zeitversprechen ableiten."
        },
        {
          "type": "text",
          "prompt": "Was ist der Unterschied zwischen Geduld und Unterdrücken?",
          "sample": "Ich darf Gefühle zeigen und Unterstützung suchen, ohne jemanden zu verletzen.",
          "hint": "Antworte mit eigenen Worten."
        },
        {
          "type": "text",
          "prompt": "Was zeigt Muslim 2999?",
          "sample": "Bei Gutem Dankbarkeit und bei Schwierigkeiten Geduld.",
          "hint": "Antworte mit eigenen Worten."
        }
      ]
    },
    "voiceApproved": false,
    "sourceType": "Qurʾān original; Ṣaḥīḥ meaning is paraphrase; didactic example is not quotation"
  },
  "fiqh-wudu-wasser-sparen": {
    "id": "fiqh-wudu-wasser-sparen",
    "subject": "fiqh",
    "pillar": "fiqh",
    "topic": "Wasser beim Wuḍūʾ sparen",
    "title": "Fiqh · Beim Wuḍūʾ Wasser sparen",
    "lead": "Ich wasche gründlich, ohne unnötig Wasser laufen zu lassen.",
    "goal": "Ich lerne die Waschung vollständig und vermeide Verschwendung.",
    "quran": {
      "surah": 7,
      "ayah": 31,
      "label": "Sūrat al-Aʿrāf · 7:31",
      "arabic": "وَكُلُوا وَاشْرَبُوا وَلَا تُسْرِفُوا",
      "meaning": "Esst und trinkt, aber seid nicht verschwenderisch. (Versauszug)",
      "excerpt": true
    },
    "hadith": {
      "source": "Ṣaḥīḥ al-Buḫārī 201; Ṣaḥīḥ Muslim 325 · Anas ibn Mālik",
      "text": "Anas überlieferte, dass der Prophet ﷺ für die Gebetswaschung ein Mudd Wasser verwendete. (Sinngemäß)"
    },
    "sourceAudit": {
      "hadithUrl": "https://dorar.net/hadith/sharh/120730",
      "hadithNumber": "201",
      "narrator": "Anas ibn Mālik",
      "authenticity": "Ṣaḥīḥ",
      "quranReference": "7:31",
      "quranTextType": "excerpt",
      "hadithMeaningIsParaphrase": true,
      "directLinkChecked": true,
      "verifiedDate": "2026-10-12",
      "note": "Vers zur Vermeidung von Verschwendung allgemein. Der Ḥadīṯ berichtet eine ausreichende Menge für den Propheten ﷺ, keine starre Litergrenze. Das Schließen des Wasserhahns ist heutige Anwendung.",
      "fiqhSchool": "Ḥanbalī, Ibn Qudāmah, al-Muġnī, Ṭahārah – Wuḍūʾ bi-l-mudd",
      "fiqhReferenceUrl": "https://www.islamweb.net/ar/library/content/15/236/%D9%85%D8%B3%D8%A3%D9%84%D8%A9-%D9%8A%D8%AA%D9%88%D8%B6%D8%A3-%D8%A8%D8%A7%D9%84%D9%85%D8%AF-%D9%88%D9%8A%D8%BA%D8%AA%D8%B3%D9%84-%D8%A8%D8%A7%D9%84%D8%B5%D8%A7%D8%B9"
    },
    "hint": "Wassersparen darf nie zu unvollständigem Wuḍūʾ führen. Kinder üben mit einer erwachsenen Person.",
    "sample": "Ich schließe den Hahn zwischen den Schritten und wasche alle nötigen Stellen.",
    "ageText": {
      "4-5": {
        "intro": "Wir achten auf Wasser, wenn wir Wuḍūʾ lernen.",
        "lines": [
          "Wasser ist wertvoll.",
          "Ich drehe den Hahn zu, wenn ich ihn nicht brauche.",
          "Ich wasche alle notwendigen Stellen.",
          "Ein Erwachsener zeigt mir die richtige Gebetswaschung."
        ],
        "evidence": "Der Qurʾān verbietet Verschwendung; der Prophet ﷺ nutzte beim Wuḍūʾ wenig Wasser."
      },
      "6-8": {
        "intro": "Wir lernen: sparsam sein und trotzdem richtig waschen.",
        "lines": [
          "Qurʾān 7:31 warnt vor Verschwendung.",
          "Anas berichtete über die Wassermenge beim Wuḍūʾ des Propheten ﷺ.",
          "Ich lasse den Hahn nicht unnötig laufen.",
          "Sparen heißt nicht, vorgeschriebene Stellen auszulassen."
        ],
        "evidence": "Der überlieferte Mudd ist ein Beispiel der Prophetenspraxis, keine starre Obergrenze für alle."
      },
      "9-10": {
        "intro": "Wir unterscheiden Sunnah-Praxis, hanbalitische Fiqh-Erläuterung und heutige Anwendung.",
        "lines": [
          "Qurʾān 7:31 verbietet Verschwendung allgemein.",
          "Al-Buḫārī 201 berichtet, dass der Prophet ﷺ mit einem Mudd Wuḍūʾ machte.",
          "Ibn Qudāmah behandelt diese überlieferte Wassermenge im al-Muġnī.",
          "Der Hahn soll nicht unnötig laufen, aber die notwendigen Waschungen müssen vollständig sein."
        ],
        "evidence": "Die Menge variiert nach Bedarf; es gibt hier kein universelles Ein-Mudd-Maximum."
      }
    },
    "questions": {
      "4-5": [
        {
          "type": "choice",
          "prompt": "Du brauchst gerade kein Wasser. Was machst du?",
          "options": [
            "Ich drehe den Hahn zu.",
            "Ich lasse ihn laufen."
          ],
          "correct": 0,
          "hint": "Denke an das Lernziel dieser Unterrichtseinheit.",
          "explain": "Wasser ist wertvoll."
        },
        {
          "type": "choice",
          "prompt": "Was ist beim Wuḍūʾ wichtig?",
          "options": [
            "Alle nötigen Stellen richtig waschen.",
            "Nur die Fingerspitzen nass machen."
          ],
          "correct": 0,
          "hint": "Denke an das Lernziel dieser Unterrichtseinheit.",
          "explain": "Die Waschung muss richtig sein."
        }
      ],
      "6-8": [
        {
          "type": "choice",
          "prompt": "Was warnt Qurʾān 7:31?",
          "options": [
            "Vor Verschwendung.",
            "Vor Sauberkeit."
          ],
          "correct": 0,
          "hint": "Denke an das Lernziel dieser Unterrichtseinheit.",
          "explain": "Der Vers verbietet Verschwendung."
        },
        {
          "type": "choice",
          "prompt": "Wie sparst du Wasser?",
          "options": [
            "Den Hahn zwischen Schritten schließen.",
            "Den Hahn voll laufen lassen."
          ],
          "correct": 0,
          "hint": "Denke an das Lernziel dieser Unterrichtseinheit.",
          "explain": "Unnötiges Laufenlassen vermeiden."
        },
        {
          "type": "text",
          "prompt": "Warum muss Wuḍūʾ trotzdem vollständig sein?",
          "sample": "Weil die vorgeschriebenen Waschungen mit Wasser durchgeführt werden müssen.",
          "hint": "Antworte mit eigenen Worten."
        }
      ],
      "9-10": [
        {
          "type": "choice",
          "prompt": "Was zeigt der Bericht über ein Mudd?",
          "options": [
            "Die überlieferte Praxis, keine starre Obergrenze für alle.",
            "Jede größere Menge macht Wuḍūʾ ungültig."
          ],
          "correct": 0,
          "hint": "Denke an das Lernziel dieser Unterrichtseinheit.",
          "explain": "Der Bericht beschreibt Prophetenspraxis."
        },
        {
          "type": "text",
          "prompt": "Was erläutert Ibn Qudāmah sinngemäß?",
          "sample": "Die überlieferte Menge kann ausreichen; vorgeschriebene Waschungen müssen erfüllt sein.",
          "hint": "Antworte mit eigenen Worten."
        },
        {
          "type": "text",
          "prompt": "Trenne religiösen Beleg und Alltagshilfe.",
          "sample": "Qurʾān verbietet Verschwendung, Sunnah berichtet die Menge; Hahn schließen ist unsere heutige Übung.",
          "hint": "Antworte mit eigenen Worten."
        }
      ]
    },
    "voiceApproved": false,
    "sourceType": "Qurʾān original; Ṣaḥīḥ meaning is paraphrase; didactic example is not quotation"
  }
};
for(const [id,l] of Object.entries(additions)){
 if(id!==l.id||prior[id]||!l.sourceAudit?.hadithUrl||l.voiceApproved!==false)throw Error("V30 invalid lesson "+id);
 for(const age of ["4-5","6-8","9-10"]){if(l.ageText[age]?.lines?.length!==4||l.questions[age]?.length<2)throw Error("V30 missing age "+id+" "+age)}
}
window.DARKidsAcademyCurriculum=Object.freeze({...prior,...additions});
window.DARKidsAcademyCurriculumV30=Object.freeze({version:"20261012-v30",count:4,ids:["adab-gespraechspartner-ausreden-lassen","akhlaq-tarbiyah-aufgaben-kleine-schritte","akhlaq-nafs-enttaeuschung-verarbeiten","fiqh-wudu-wasser-sparen"],pillars:{"adab-gespraechspartner-ausreden-lassen":"adab","akhlaq-tarbiyah-aufgaben-kleine-schritte":"tarbiyah","akhlaq-nafs-enttaeuschung-verarbeiten":"nafs","fiqh-wudu-wasser-sparen":"fiqh"},religiousSourcesVerified:true,voiceRecordingsApproved:false,requiresHumanAudioApproval:true});
})();
