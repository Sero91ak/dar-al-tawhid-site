/* DĀR AL TAWḤĪD KIDS V27 – Unterricht 51–58, 8 eigene Themen / 24 altersbezogene Textfassungen.
 * Qurʾān-Stellen als Auszug markiert; authentische Ṣaḥīḥ-Überlieferung mit Direkthinweis.
 * Pädagogische Anwendungen sind keine Originalzitate. Keine Kinder-Audiofreigabe.
 * V27 wird NACH V26 geladen; bestehende Fortschrittsreihenfolge unverändert.
 */
(function(){
"use strict";
const prior=window.DARKidsAcademyCurriculum;
if(!prior||!prior["adab-eltern-freundlich"])return;
const additions={
  "aqidah-allah-erschuf-tiere": {
    "id": "aqidah-allah-erschuf-tiere",
    "subject": "aqidah",
    "pillar": "tawhid",
    "topic": "Allah erschuf die Tiere",
    "title": "Tawḥīd · Allah erschuf die Tiere",
    "lead": "Allah ist der Schöpfer; wir behandeln Tiere behutsam.",
    "goal": "Ich erkenne Allah als Schöpfer der Tiere und übe einen sicheren, guten Umgang.",
    "quran": {
      "surah": 16,
      "ayah": 5,
      "label": "Sūrat an-Naḥl · 16:5",
      "arabic": "وَالْأَنْعَامَ خَلَقَهَا",
      "meaning": "Auch die Nutztiere hat Er erschaffen. (Versauszug)",
      "excerpt": true
    },
    "hadith": {
      "source": "Ṣaḥīḥ al-Buḫārī, Nr. 2363; Ṣaḥīḥ Muslim, Nr. 2244 · Abū Hurayrah",
      "text": "Der Prophet ﷺ erzählte von einem Mann, der einem durstigen Hund Wasser gab; für Barmherzigkeit gegenüber Tieren gibt es Lohn."
    },
    "sourceAudit": {
      "hadithUrl": "https://dorar.net/hadith/sharh/67134",
      "hadithNumber": "2363",
      "narrator": "Abū Hurayrah",
      "authenticity": "Ṣaḥīḥ",
      "note": "Die Geschichte ist prophetische Überlieferung, keine frei erfundene Ṣaḥābī-Aussage; die Tierbeobachtung ist pädagogische Anwendung.",
      "quranReference": "16:5",
      "quranTextType": "excerpt",
      "hadithMeaningIsParaphrase": true,
      "verifiedDate": "2026-10-12",
      "directLinkChecked": true
    },
    "hint": "Tiere nicht jagen, quälen oder ohne Erlaubnis anfassen. Bei einem unbekannten Tier einen Erwachsenen fragen.",
    "sample": "Allah hat Tiere erschaffen. Ich gehe freundlich und vorsichtig mit ihnen um.",
    "ageText": {
      "4-5": {
        "intro": "Schau, ein Tier! Allah hat es erschaffen. Wir lassen es in Ruhe, wenn es Angst hat.",
        "lines": [
          "Allah hat auch die Tiere erschaffen.",
          "Ich beobachte ein Tier aus sicherer Entfernung.",
          "Ich erschrecke oder ziehe es nicht.",
          "Für die Hilfe an einem Tier frage ich einen Erwachsenen."
        ],
        "evidence": "Im Qurʾān steht, dass Allah Tiere erschaffen hat. Der Prophet ﷺ erzählte von Freundlichkeit gegenüber einem durstigen Tier."
      },
      "6-8": {
        "intro": "Tiere sind Geschöpfe Allahs. Wir lernen, was Fürsorge und ein sicherer Umgang bedeuten.",
        "lines": [
          "Sūrat an-Naḥl 16:5 erinnert an Tiere, die Allah erschaffen hat.",
          "Im authentischen Ḥadīṯ gab ein Mann einem durstigen Hund Wasser.",
          "Ich beobachte Tiere vorsichtig, ohne sie zu verfolgen.",
          "Wenn ein Tier Hilfe braucht, bitte ich eine geeignete erwachsene Person darum."
        ],
        "evidence": "Die Überlieferung zeigt Barmherzigkeit. Sie fordert Kinder nicht auf, fremde Tiere anzufassen oder Gefahren einzugehen."
      },
      "9-10": {
        "intro": "Wir verbinden den Schöpfungsbeleg im Qurʾān mit der authentischen Überlieferung über Barmherzigkeit.",
        "lines": [
          "Qurʾān 16:5 nennt die Erschaffung von Nutztieren als Teil von Allahs Schöpfung.",
          "Abū Hurayrah überlieferte den Bericht von der Hilfe an einem durstigen Hund.",
          "Die Quelle begründet einen guten Umgang; unsere heutige Beobachtungsübung ist eine Anwendung.",
          "Bei verletzten oder fremden Tieren sind Sicherheit und Hilfe durch Erwachsene wichtig."
        ],
        "evidence": "Qurʾān-Auszug und Ḥadīṯ getrennt zuordnen; die heutige Sicherheitsregel ist pädagogisch, kein wörtliches Zitat."
      }
    },
    "questions": {
      "4-5": [
        {
          "type": "choice",
          "prompt": "Wer hat die Tiere erschaffen?",
          "options": [
            "Allah",
            "Ein Spielzeugmacher"
          ],
          "correct": 0,
          "hint": "Denke an den Qurʾān-Vers.",
          "explain": "Allah ist der Schöpfer."
        },
        {
          "type": "choice",
          "prompt": "Ein Tier hat Angst. Was machst du?",
          "options": [
            "Ich lasse ihm Ruhe.",
            "Ich jage hinterher."
          ],
          "correct": 0,
          "hint": "Das Tier braucht Abstand.",
          "explain": "Ich lasse es in Ruhe und hole bei Bedarf Hilfe."
        }
      ],
      "6-8": [
        {
          "type": "choice",
          "prompt": "Was erzählt die authentische Überlieferung?",
          "options": [
            "Ein Mann gab einem durstigen Hund Wasser.",
            "Man soll jedes Tier ungefragt hochheben."
          ],
          "correct": 0,
          "hint": "Es geht um Barmherzigkeit.",
          "explain": "Der Mann half einem durstigen Tier."
        },
        {
          "type": "choice",
          "prompt": "Wie hilfst du einem fremden verletzten Tier sicher?",
          "options": [
            "Ich bitte einen Erwachsenen um Hilfe.",
            "Ich fasse es sofort an."
          ],
          "correct": 0,
          "hint": "Sicherheit zählt.",
          "explain": "Ich hole geeignete Hilfe."
        },
        {
          "type": "text",
          "prompt": "Was ist Quelle und was unsere heutige Übung?",
          "sample": "Qurʾān 16:5 nennt erschaffene Tiere; die Übung ist achtsames Beobachten.",
          "hint": "Unterscheide Beleg und Anwendung."
        }
      ],
      "9-10": [
        {
          "type": "choice",
          "prompt": "Was lässt sich durch den Ḥadīṯ belegen?",
          "options": [
            "Barmherzigkeit gegenüber Tieren ist gut.",
            "Kinder müssen jedes fremde Tier anfassen."
          ],
          "correct": 0,
          "hint": "Denke an den durstigen Hund.",
          "explain": "Guter Umgang, nicht riskantes Anfassen."
        },
        {
          "type": "text",
          "prompt": "Erkläre die Beziehung von Qurʾān 16:5 und al-Buḫārī 2363.",
          "sample": "Der Vers nennt Allahs Schöpfung; die Überlieferung lehrt Barmherzigkeit.",
          "hint": "Gib beide Quellen getrennt an."
        },
        {
          "type": "text",
          "prompt": "Entwirf eine sichere gute Handlung für Tiere.",
          "sample": "Ich beobachte in Ruhe und informiere bei Gefahr einen Erwachsenen.",
          "hint": "Unsere Anwendung ist kein wörtlicher Offenbarungstext."
        }
      ]
    },
    "sourceType": "Quran and verified Sahih; teaching examples are paraphrases",
    "voiceApproved": false
  },
  "aqidah-iman-an-allah-vertiefen": {
    "id": "aqidah-iman-an-allah-vertiefen",
    "subject": "aqidah",
    "pillar": "iman",
    "topic": "Īmān an Allah vertiefen",
    "title": "Īmān · Ich glaube an Allah",
    "lead": "Wir lernen, was Īmān bedeutet und wie wir darüber sprechen.",
    "goal": "Ich benenne den Glauben an Allah als Grundlage des Īmān.",
    "quran": {
      "surah": 2,
      "ayah": 285,
      "label": "Sūrat al-Baqarah · 2:285",
      "arabic": "كُلٌّ آمَنَ بِاللَّهِ وَمَلَائِكَتِهِ وَكُتُبِهِ وَرُسُلِهِ",
      "meaning": "Alle glauben an Allah, Seine Engel, Seine Bücher und Seine Gesandten. (Versauszug)",
      "excerpt": true
    },
    "hadith": {
      "source": "Ṣaḥīḥ Muslim, Nr. 8 · überliefert von ʿUmar ibn al-Khaṭṭāb",
      "text": "Im Ḥadīṯ von Ǧibrīl erklärt der Prophet ﷺ die Grundlagen des Īmān: Glaube an Allah, Engel, Bücher, Gesandte, Jüngsten Tag und die Bestimmung."
    },
    "sourceAudit": {
      "hadithUrl": "https://dorar.net/hadith/sharh/1189",
      "hadithNumber": "8",
      "narrator": "ʿUmar ibn al-Khaṭṭāb",
      "authenticity": "Ṣaḥīḥ",
      "note": "Der Nachweis verweist ausdrücklich auf die vollständige Überlieferung bei Muslim Nr. 8; die Darstellung ist kindgerecht zusammengefasst.",
      "quranReference": "2:285",
      "quranTextType": "excerpt",
      "hadithMeaningIsParaphrase": true,
      "verifiedDate": "2026-10-12",
      "directLinkChecked": true
    },
    "hint": "Īmān bedeutet Glaube; wir reden darüber ohne über die Herzen anderer Menschen zu urteilen.",
    "sample": "Ich glaube an Allah und lerne Schritt für Schritt die Grundlagen des Īmān.",
    "ageText": {
      "4-5": {
        "intro": "Īmān heißt: Glaube. Wir glauben an Allah und lernen Ihn kennen.",
        "lines": [
          "Ich darf sagen: Ich glaube an Allah.",
          "Allah hat uns erschaffen.",
          "Ich lerne liebevoll aus Qurʾān und Sunnah.",
          "Wenn ich eine Frage habe, darf ich fragen."
        ],
        "evidence": "Im Qurʾān steht, dass die Gläubigen an Allah glauben. Der Prophet ﷺ erklärte den Īmān."
      },
      "6-8": {
        "intro": "Īmān ist mehr als nur ein schweres Wort: Es geht darum, was wir glauben.",
        "lines": [
          "Īmān ist das arabische Wort für Glauben.",
          "Der Qurʾān nennt Allah und weitere Grundlagen des Glaubens.",
          "Im Ḥadīṯ von Ǧibrīl nennt der Prophet ﷺ sechs Glaubensgrundlagen.",
          "Heute beginnen wir mit dem Glauben an Allah und lernen die übrigen nacheinander."
        ],
        "evidence": "Ṣaḥīḥ Muslim 8 ist der Bericht über die Frage nach Īmān; nicht alle sechs Teile müssen heute auswendig gelernt werden."
      },
      "9-10": {
        "intro": "Wir arbeiten mit Qurʾān 2:285 und dem authentischen Ḥadīṯ von Ǧibrīl.",
        "lines": [
          "Der Qurʾān nennt den Glauben an Allah, die Engel, die Bücher und die Gesandten.",
          "Im Ḥadīṯ beschreibt der Prophet ﷺ die sechs Grundlagen des Īmān.",
          "Die Gliederung hilft uns beim Lernen; sie ist keine Grundlage für Urteile über einzelne Personen.",
          "Wir können die Begriffe erklären, Fragen stellen und ihre Quellen nachschlagen."
        ],
        "evidence": "Die Formulierung der sechs Īmān-Grundlagen stammt aus Muslim Nr. 8, nicht aus einem erfundenen Ausspruch einer späteren Person."
      }
    },
    "questions": {
      "4-5": [
        {
          "type": "choice",
          "prompt": "Was bedeutet Īmān?",
          "options": [
            "Glaube",
            "Ein Getränk"
          ],
          "correct": 0,
          "hint": "Ein arabisches Wort.",
          "explain": "Īmān bedeutet Glaube."
        },
        {
          "type": "choice",
          "prompt": "Wen glauben wir als Schöpfer?",
          "options": [
            "Allah",
            "Ein selbstgemachtes Bild"
          ],
          "correct": 0,
          "hint": "Denke an unser Thema.",
          "explain": "Wir glauben an Allah."
        }
      ],
      "6-8": [
        {
          "type": "choice",
          "prompt": "Welches Wort bedeutet Glaube?",
          "options": [
            "Īmān",
            "Wuḍūʾ"
          ],
          "correct": 0,
          "hint": "Wuḍūʾ ist eine Waschung.",
          "explain": "Īmān bedeutet Glaube."
        },
        {
          "type": "choice",
          "prompt": "Wo erklärt der Prophet ﷺ die Glaubensgrundlagen?",
          "options": [
            "Im Ḥadīṯ von Ǧibrīl.",
            "In einer erfundenen Geschichte."
          ],
          "correct": 0,
          "hint": "Quelle: Ṣaḥīḥ Muslim Nr. 8.",
          "explain": "Der Ḥadīṯ von Ǧibrīl."
        },
        {
          "type": "text",
          "prompt": "Nenne zwei Glaubensgrundlagen, die im Qurʾān-Auszug stehen.",
          "sample": "Der Glaube an Allah und an Seine Engel.",
          "hint": "Auch Bücher und Gesandte werden genannt."
        }
      ],
      "9-10": [
        {
          "type": "choice",
          "prompt": "Was ist eine belegte Aussage?",
          "options": [
            "Muslim Nr. 8 erklärt die sechs Īmān-Grundlagen.",
            "Wir dürfen anderer Leute Herzen beurteilen."
          ],
          "correct": 0,
          "hint": "Lies die authentische Überlieferung.",
          "explain": "Die sechs Grundlagen stehen im Ḥadīṯ."
        },
        {
          "type": "text",
          "prompt": "Was nennen Qurʾān 2:285 und Muslim 8 gemeinsam?",
          "sample": "Beide sprechen von den Grundlagen des Glaubens an Allah und weitere Glaubensinhalte.",
          "hint": "Vergleiche die beiden Quellen."
        },
        {
          "type": "text",
          "prompt": "Wie erklärst du Īmān einem jüngeren Kind?",
          "sample": "Īmān heißt Glaube; wir glauben an Allah und lernen in kleinen Schritten.",
          "hint": "Keine schwierigen Urteile über andere Personen."
        }
      ]
    },
    "sourceType": "Quran and verified Sahih; teaching examples are paraphrases",
    "voiceApproved": false
  },
  "aqidah-ikhlas-gute-lernabsicht": {
    "id": "aqidah-ikhlas-gute-lernabsicht",
    "subject": "aqidah",
    "pillar": "ikhlas",
    "topic": "Gute Absichten vor dem Lernen",
    "title": "Ikhlāṣ · Lernen mit guter Absicht",
    "lead": "Gutes Lernen beginnt mit einem aufrichtigen Herzen.",
    "goal": "Ich kann vor dem Unterricht eine einfache gute Absicht formulieren.",
    "quran": {
      "surah": 98,
      "ayah": 5,
      "label": "Sūrat al-Bayyinah · 98:5",
      "arabic": "وَمَا أُمِرُوا إِلَّا لِيَعْبُدُوا اللَّهَ مُخْلِصِينَ لَهُ الدِّينَ",
      "meaning": "Ihnen wurde nur befohlen, Allah zu dienen, indem sie Ihm gegenüber aufrichtig in der Religion sind. (Versauszug)",
      "excerpt": true
    },
    "hadith": {
      "source": "Ṣaḥīḥ al-Buḫārī, Nr. 1 · ʿUmar ibn al-Khaṭṭāb",
      "text": "Der Prophet ﷺ lehrte, dass Taten nach den Absichten beurteilt werden."
    },
    "sourceAudit": {
      "hadithUrl": "https://dorar.net/hadith/sharh/3429",
      "hadithNumber": "1",
      "narrator": "ʿUmar ibn al-Khaṭṭāb",
      "authenticity": "Ṣaḥīḥ",
      "note": "Der Unterricht über die Lernabsicht ist eine pädagogische Anwendung des authentischen Grundsatzes; keine erfundene feste Bittformel.",
      "quranReference": "98:5",
      "quranTextType": "excerpt",
      "hadithMeaningIsParaphrase": true,
      "verifiedDate": "2026-10-12",
      "directLinkChecked": true
    },
    "hint": "Ikhlāṣ heißt Aufrichtigkeit: etwas Gutes für Allah tun, statt nur gesehen werden zu wollen.",
    "sample": "Ich lerne, um Allah zu gefallen und gute Dinge zu verstehen.",
    "ageText": {
      "4-5": {
        "intro": "Bevor ich lerne, denke ich an eine gute Absicht: Ich möchte Gutes lernen.",
        "lines": [
          "Ich setze mich zum Lernen hin.",
          "Ich darf leise denken: Ich möchte Gutes lernen.",
          "Ich lerne nicht nur, damit andere klatschen.",
          "Ich freue mich über einen kleinen Lernschritt."
        ],
        "evidence": "Allah liebt die Aufrichtigkeit. Der Prophet ﷺ erklärte, dass die Absicht wichtig ist."
      },
      "6-8": {
        "intro": "Eine Absicht ist das, was ich mit meinem Lernen erreichen möchte.",
        "lines": [
          "Ikhlāṣ heißt: ehrlich und aufrichtig für Allah handeln.",
          "Vor dem Unterricht erinnere ich mich an eine gute Absicht.",
          "Ich will etwas Richtiges lernen und danach Gutes tun.",
          "Lob ist schön, aber nicht der einzige Grund, warum ich lerne."
        ],
        "evidence": "Qurʾān 98:5 spricht von Aufrichtigkeit; der Ḥadīṯ bei al-Buḫārī 1 von Absichten."
      },
      "9-10": {
        "intro": "Wir unterscheiden zwischen der Absicht im Herzen und der sichtbaren Handlung.",
        "lines": [
          "Qurʾān 98:5 verbindet Anbetung mit Ikhlāṣ.",
          "ʿUmar überlieferte den Grundsatz, dass Taten nach den Absichten beurteilt werden.",
          "Lernen mit guter Absicht bedeutet: Wissen richtig verstehen und danach handeln.",
          "Wir beurteilen nicht die Absichten anderer; sie sind uns nicht sicher bekannt."
        ],
        "evidence": "Die Absicht ist kein vorgeschriebener Satz, der vor jedem Unterricht laut gesprochen werden müsste."
      }
    },
    "questions": {
      "4-5": [
        {
          "type": "choice",
          "prompt": "Was ist eine gute Absicht fürs Lernen?",
          "options": [
            "Ich möchte Gutes lernen.",
            "Ich möchte jemanden ärgern."
          ],
          "correct": 0,
          "hint": "Denke an etwas Gutes.",
          "explain": "Gutes lernen ist eine gute Absicht."
        },
        {
          "type": "choice",
          "prompt": "Muss jeder meine Absicht hören?",
          "options": [
            "Nein, sie kann in meinem Herzen sein.",
            "Ja, ich muss sie laut rufen."
          ],
          "correct": 0,
          "hint": "Die Absicht ist im Herzen.",
          "explain": "Sie muss nicht laut gerufen werden."
        }
      ],
      "6-8": [
        {
          "type": "choice",
          "prompt": "Was bedeutet Ikhlāṣ?",
          "options": [
            "Aufrichtigkeit",
            "Eine Farbe"
          ],
          "correct": 0,
          "hint": "Ein Wort für ehrliche Absichten.",
          "explain": "Ikhlāṣ ist Aufrichtigkeit."
        },
        {
          "type": "choice",
          "prompt": "Welche Absicht passt?",
          "options": [
            "Ich lerne, um das Gute zu verstehen.",
            "Ich lerne nur, um andere auszulachen."
          ],
          "correct": 0,
          "hint": "Denke an die Wirkung.",
          "explain": "Wissen kann zu guten Taten führen."
        },
        {
          "type": "text",
          "prompt": "Warum kann dieselbe Handlung unterschiedliche Absichten haben?",
          "sample": "Zwei Kinder können lernen, aber verschiedene Ziele dabei haben.",
          "hint": "Ṣaḥīḥ al-Buḫārī Nr. 1."
        }
      ],
      "9-10": [
        {
          "type": "choice",
          "prompt": "Welche Aussage stimmt?",
          "options": [
            "Gute Absichten sind wichtig, ohne dass man fremde Herzen beurteilt.",
            "Ich weiß genau, was jeder andere denkt."
          ],
          "correct": 0,
          "hint": "Absichten kennt Allah.",
          "explain": "Wir urteilen nicht über unbekannte Absichten."
        },
        {
          "type": "text",
          "prompt": "Unterscheide Qurʾān-Beleg und unsere Unterrichtsübung.",
          "sample": "98:5 lehrt Aufrichtigkeit; die Übung ist, sich vor dem Lernen eine gute Absicht bewusst zu machen.",
          "hint": "Das Beispiel ist kein wörtliches Zitat."
        },
        {
          "type": "text",
          "prompt": "Was bedeutet al-Buḫārī Nr. 1 für deinen Lernalltag?",
          "sample": "Ich prüfe meine eigene Absicht und bemühe mich um gutes Handeln.",
          "hint": "Beziehe dich auf die Überlieferung von ʿUmar."
        }
      ]
    },
    "sourceType": "Quran and verified Sahih; teaching examples are paraphrases",
    "voiceApproved": false
  },
  "akhlaq-geschwister-fair-teilen": {
    "id": "akhlaq-geschwister-fair-teilen",
    "subject": "akhlaq",
    "pillar": "akhlaq",
    "topic": "Gerecht zu Geschwistern sein",
    "title": "Akhlāq · Wir teilen gerecht",
    "lead": "Im Spiel achten wir auf Fairness und die Gefühle anderer.",
    "goal": "Ich kann eine faire Lösung beim gemeinsamen Spielen finden.",
    "quran": {
      "surah": 16,
      "ayah": 90,
      "label": "Sūrat an-Naḥl · 16:90",
      "arabic": "إِنَّ اللَّهَ يَأْمُرُ بِالْعَدْلِ وَالْإِحْسَانِ",
      "meaning": "Allah gebietet Gerechtigkeit und gutes Handeln. (Versauszug)",
      "excerpt": true
    },
    "hadith": {
      "source": "Ṣaḥīḥ al-Buḫārī, Nr. 2587; Ṣaḥīḥ Muslim, Nr. 1623 · an-Nuʿmān ibn Bašīr",
      "text": "Der Prophet ﷺ forderte Eltern auf, ihre Kinder bei Geschenken gerecht zu behandeln."
    },
    "sourceAudit": {
      "hadithUrl": "https://dorar.net/hadith/sharh/14634",
      "hadithNumber": "2587",
      "narrator": "an-Nuʿmān ibn Bašīr",
      "authenticity": "Ṣaḥīḥ",
      "note": "Der Ḥadīṯ richtet sich im Ursprung an Eltern beim Beschenken; das faire Abwechseln ist eine didaktische Anwendung des allgemeinen Gerechtigkeitsgebots.",
      "quranReference": "16:90",
      "quranTextType": "excerpt",
      "hadithMeaningIsParaphrase": true,
      "verifiedDate": "2026-10-12",
      "directLinkChecked": true
    },
    "hint": "Gerecht bedeutet nicht, immer alles exakt gleich zu haben; wir fragen nach einer angemessenen fairen Lösung.",
    "sample": "Wir sprechen miteinander und wechseln uns beim Spielen ab.",
    "ageText": {
      "4-5": {
        "intro": "Zwei Kinder wollen dasselbe Spielzeug. Wir können eine faire Lösung finden.",
        "lines": [
          "Ich sage freundlich, dass ich auch spielen möchte.",
          "Ich höre, wenn das andere Kind etwas sagen will.",
          "Wir können uns abwechseln.",
          "Wenn es Streit gibt, holen wir Hilfe."
        ],
        "evidence": "Der Qurʾān sagt, dass Allah Gerechtigkeit gebietet; unser Beispiel ist das Abwechseln."
      },
      "6-8": {
        "intro": "Fairness gehört zum guten Umgang miteinander.",
        "lines": [
          "Gerechtigkeit ist ein wichtiges Gebot im Qurʾān.",
          "Der Prophet ﷺ wies Eltern an, ihre Kinder gerecht zu behandeln.",
          "Unter Geschwistern können wir Spielregeln vereinbaren.",
          "Wenn eine Regel unfair scheint, dürfen wir ruhig darüber sprechen."
        ],
        "evidence": "Der Ḥadīṯ behandelt Geschenke durch Eltern; unsere Übung behandelt gerechtes Spielen."
      },
      "9-10": {
        "intro": "Wir vergleichen ein allgemeines Gerechtigkeitsgebot mit einem konkreten Ḥadīṯ.",
        "lines": [
          "Qurʾān 16:90 fordert zu Gerechtigkeit und gutem Handeln auf.",
          "Im authentischen Bericht über an-Nuʿmān geht es um Gerechtigkeit zwischen Kindern bei Geschenken.",
          "Beim gemeinsamen Spielen übertragen wir das Prinzip angemessen, ohne den Ḥadīṯ umzudeuten.",
          "Wir unterscheiden zwischen gerecht, gleich und den besonderen Bedürfnissen anderer."
        ],
        "evidence": "Die Quelle spricht über Eltern; gerechtes Teilen unter Kindern ist eine nachvollziehbare pädagogische Anwendung."
      }
    },
    "questions": {
      "4-5": [
        {
          "type": "choice",
          "prompt": "Zwei Kinder möchten ein Spielzeug. Was hilft?",
          "options": [
            "Abwechseln.",
            "Es absichtlich kaputtmachen."
          ],
          "correct": 0,
          "hint": "Denke an Fairness.",
          "explain": "Wir können uns abwechseln."
        },
        {
          "type": "choice",
          "prompt": "Was machst du bei Streit?",
          "options": [
            "Ruhig Hilfe holen.",
            "Sofort schubsen."
          ],
          "correct": 0,
          "hint": "Sicher bleiben.",
          "explain": "Wir sprechen oder holen Hilfe."
        }
      ],
      "6-8": [
        {
          "type": "choice",
          "prompt": "Was gebietet Qurʾān 16:90?",
          "options": [
            "Gerechtigkeit und gutes Handeln.",
            "Absichtliche Ungerechtigkeit."
          ],
          "correct": 0,
          "hint": "Denke an den Vers.",
          "explain": "Allah gebietet Gerechtigkeit."
        },
        {
          "type": "choice",
          "prompt": "Worum geht es bei Muslim Nr. 1623?",
          "options": [
            "Gerechter Umgang mit Kindern bei Geschenken.",
            "Das genaue Spielzeug in unserem Beispiel."
          ],
          "correct": 0,
          "hint": "Quelle und Beispiel sind verschieden.",
          "explain": "Der Ḥadīṯ behandelt Eltern und Geschenke."
        },
        {
          "type": "text",
          "prompt": "Welche faire Spielregel schlägst du vor?",
          "sample": "Wir spielen nacheinander gleich lange, soweit das sinnvoll ist.",
          "hint": "Berücksichtige die Situation."
        }
      ],
      "9-10": [
        {
          "type": "choice",
          "prompt": "Welche Zuordnung ist richtig?",
          "options": [
            "Der Ḥadīṯ behandelt Geschenke der Eltern; die Spielregel ist Anwendung.",
            "Der Ḥadīṯ schreibt einen Spielzeug-Timer vor."
          ],
          "correct": 0,
          "hint": "Trenne Beleg und Übung.",
          "explain": "Beleg und Anwendung dürfen nicht verwechselt werden."
        },
        {
          "type": "text",
          "prompt": "Warum ist gerecht nicht immer genau dasselbe wie gleich?",
          "sample": "Menschen können unterschiedliche Bedürfnisse haben; gerechte Regeln berücksichtigen sie.",
          "hint": "Denke an Alter und Situation."
        },
        {
          "type": "text",
          "prompt": "Vergleiche Qurʾān 16:90 mit Muslim 1623.",
          "sample": "Der Vers gebietet Gerechtigkeit allgemein; der Ḥadīṯ zeigt einen Fall innerhalb der Familie.",
          "hint": "Nenne den ursprünglichen Gegenstand des Ḥadīṯ."
        }
      ]
    },
    "sourceType": "Quran and verified Sahih; teaching examples are paraphrases",
    "voiceApproved": false
  },
  "adab-privatsphaere-andere-achten": {
    "id": "adab-privatsphaere-andere-achten",
    "subject": "adab",
    "pillar": "adab",
    "topic": "Privatsphäre anderer achten",
    "title": "Adab · Erst fragen, dann schauen",
    "lead": "Ich respektiere die Räume und persönlichen Dinge anderer.",
    "goal": "Ich frage um Erlaubnis und schaue nicht heimlich in fremde Sachen.",
    "quran": {
      "surah": 24,
      "ayah": 27,
      "label": "Sūrat an-Nūr · 24:27",
      "arabic": "لَا تَدْخُلُوا بُيُوتًا غَيْرَ بُيُوتِكُمْ حَتَّى تَسْتَأْنِسُوا وَتُسَلِّمُوا عَلَى أَهْلِهَا",
      "meaning": "Betretet nicht andere Häuser als eure eigenen, bevor ihr um Erlaubnis gebeten und ihre Bewohner begrüßt habt. (Versauszug)",
      "excerpt": true
    },
    "hadith": {
      "source": "Ṣaḥīḥ al-Buḫārī, Nr. 6241; Ṣaḥīḥ Muslim, Nr. 2156 · Sahl ibn Saʿd",
      "text": "Der Prophet ﷺ erklärte, dass um Erlaubnis gebeten wird, damit die Privatsphäre und der Blick in fremde Räume geschützt sind."
    },
    "sourceAudit": {
      "hadithUrl": "https://dorar.net/hadith/sharh/9448",
      "hadithNumber": "6241",
      "narrator": "Sahl ibn Saʿd",
      "authenticity": "Ṣaḥīḥ",
      "note": "Der Unterricht gibt nur den altersgeeigneten Inhalt des Ḥadīṯ wieder; drastische Einzelheiten des längeren Berichts gehören nicht zum Kindertext.",
      "quranReference": "24:27",
      "quranTextType": "excerpt",
      "hadithMeaningIsParaphrase": true,
      "verifiedDate": "2026-10-12",
      "directLinkChecked": true
    },
    "hint": "Wenn jemand deine Grenzen verletzt oder du dich unsicher fühlst, darfst du immer Hilfe bei einer vertrauenswürdigen erwachsenen Person holen.",
    "sample": "Ich frage, bevor ich ein anderes Zimmer betrete oder fremde Dinge anschaue.",
    "ageText": {
      "4-5": {
        "intro": "Manchmal möchte jemand allein sein. Wir fragen zuerst.",
        "lines": [
          "Ich klopfe an eine geschlossene Tür.",
          "Ich warte auf eine Antwort.",
          "Ich schaue nicht heimlich in fremde Taschen.",
          "Wenn etwas nicht in Ordnung ist, darf ich Hilfe holen."
        ],
        "evidence": "Der Qurʾān lehrt, vor dem Betreten fremder Häuser um Erlaubnis zu bitten."
      },
      "6-8": {
        "intro": "Privatsphäre bedeutet, dass jeder einen geschützten eigenen Bereich haben darf.",
        "lines": [
          "Qurʾān 24:27 lehrt das Bitten um Erlaubnis.",
          "Der Prophet ﷺ erklärte, warum der Blick in fremde Räume geschützt werden soll.",
          "Ich respektiere Türen, Schubladen und persönliche Sachen.",
          "Auch meine Grenzen sind wichtig: Bei Problemen darf ich klar Nein sagen und Hilfe suchen."
        ],
        "evidence": "Unser Beispiel mit Tasche und Schublade ist eine kindgerechte Übertragung des Schutzes der Privatsphäre."
      },
      "9-10": {
        "intro": "Wir unterscheiden das ausdrückliche Qurʾān-Gebot für fremde Häuser von heutigen Alltagsbeispielen.",
        "lines": [
          "Sūrat an-Nūr 24:27 nennt Erlaubnis und Begrüßung vor dem Betreten fremder Häuser.",
          "Im authentischen Ḥadīṯ erläutert der Prophet ﷺ den Schutz vor unerlaubtem Hineinsehen.",
          "Heute übertragen wir das Prinzip auf persönliche Gegenstände und digitale Privatsphäre.",
          "Wenn Geheimhaltung jemandem schadet oder gefährlich wird, hat das Bitten um Schutz und Hilfe Vorrang."
        ],
        "evidence": "Ein Kind muss keine gefährlichen Geheimnisse für andere bewahren; sichere Grenzen und Hilfesuche sind erlaubt."
      }
    },
    "questions": {
      "4-5": [
        {
          "type": "choice",
          "prompt": "Die Tür ist geschlossen. Was machst du?",
          "options": [
            "Anklopfen und warten.",
            "Einfach hineinlaufen."
          ],
          "correct": 0,
          "hint": "Erst fragen.",
          "explain": "Ich klopfe an."
        },
        {
          "type": "choice",
          "prompt": "Du bist unsicher. Was darfst du tun?",
          "options": [
            "Einen vertrauten Erwachsenen um Hilfe bitten.",
            "Still bleiben, obwohl du Angst hast."
          ],
          "correct": 0,
          "hint": "Hilfe ist erlaubt.",
          "explain": "Ich darf Hilfe holen."
        }
      ],
      "6-8": [
        {
          "type": "choice",
          "prompt": "Warum bitten wir um Erlaubnis?",
          "options": [
            "Um die Privatsphäre anderer zu achten.",
            "Damit wir heimlich alles sehen können."
          ],
          "correct": 0,
          "hint": "Denke an Schutz.",
          "explain": "Wir achten andere."
        },
        {
          "type": "choice",
          "prompt": "Du möchtest in eine fremde Tasche sehen.",
          "options": [
            "Zuerst den Besitzer fragen.",
            "Unbemerkt hineinschauen."
          ],
          "correct": 0,
          "hint": "Fremde Sachen sind privat.",
          "explain": "Ich frage."
        },
        {
          "type": "text",
          "prompt": "Nenne eine sichere Regel für eigene Grenzen.",
          "sample": "Ich sage Nein, wenn etwas unangenehm ist, und suche Hilfe.",
          "hint": "Persönliche Grenzen sind wichtig."
        }
      ],
      "9-10": [
        {
          "type": "choice",
          "prompt": "Du möchtest einen fremden Raum betreten. Wie sollen wir uns nach der Lehre dieses Qurʾān-Verses verhalten?",
          "options": [
            "Vor dem Betreten fremder Häuser um Erlaubnis bitten.",
            "Erst hineingehen und danach um Erlaubnis bitten."
          ],
          "correct": 0,
          "hint": "Lies den Vers.",
          "explain": "Erlaubnis vor dem Betreten."
        },
        {
          "type": "text",
          "prompt": "Nenne ein modernes Beispiel des Grundsatzes.",
          "sample": "Ich lese keine fremden Chatnachrichten ohne Erlaubnis.",
          "hint": "Das ist eine Anwendung, kein wörtlicher Vers."
        },
        {
          "type": "text",
          "prompt": "Wann hat Hilfesuche Vorrang vor Geheimhaltung?",
          "sample": "Wenn jemand bedroht wird, Angst hat oder Schutz braucht.",
          "hint": "Niemand muss gefährliche Geheimnisse bewahren."
        }
      ]
    },
    "sourceType": "Quran and verified Sahih; teaching examples are paraphrases",
    "voiceApproved": false
  },
  "akhlaq-tarbiyah-sachen-pflegen": {
    "id": "akhlaq-tarbiyah-sachen-pflegen",
    "subject": "akhlaq",
    "pillar": "tarbiyah",
    "topic": "Eigene Sachen pflegen",
    "title": "Tarbiyah · Gut auf meine Sachen achten",
    "lead": "Ich übe Verantwortung für die Dinge, die mir anvertraut sind.",
    "goal": "Ich kann jeden Tag eine kleine Aufgabe für meine Sachen übernehmen.",
    "quran": {
      "surah": 17,
      "ayah": 34,
      "label": "Sūrat al-Isrāʾ · 17:34",
      "arabic": "وَأَوْفُوا بِالْعَهْدِ ۖ إِنَّ الْعَهْدَ كَانَ مَسْئُولًا",
      "meaning": "Haltet das Versprechen ein. Nach dem Versprechen wird gefragt werden. (Versauszug)",
      "excerpt": true
    },
    "hadith": {
      "source": "Ṣaḥīḥ al-Buḫārī, Nr. 893; Ṣaḥīḥ Muslim, Nr. 1829 · ʿAbdullāh ibn ʿUmar",
      "text": "Der Prophet ﷺ lehrte, dass Menschen für die Dinge und Aufgaben verantwortlich sind, die ihnen anvertraut werden."
    },
    "sourceAudit": {
      "hadithUrl": "https://dorar.net/hadith/sharh/6192",
      "hadithNumber": "893",
      "narrator": "ʿAbdullāh ibn ʿUmar",
      "authenticity": "Ṣaḥīḥ",
      "note": "Die Quellen sprechen von Verpflichtung und Verantwortung; die Schultasche ist lediglich ein altersgerechtes Beispiel, kein Prophetenzitat.",
      "quranReference": "17:34",
      "quranTextType": "excerpt",
      "hadithMeaningIsParaphrase": true,
      "verifiedDate": "2026-10-12",
      "directLinkChecked": true
    },
    "hint": "Tarbiyah heißt liebevolle Erziehung und Einübung guter Gewohnheiten; Ordnung darf nie als Beschämung oder Strafe vermittelt werden.",
    "sample": "Ich lege meine Sachen nach dem Lernen an ihren Platz.",
    "ageText": {
      "4-5": {
        "intro": "Meine Tasche hat einen Platz. Ich kann eine kleine Sache selbst schaffen.",
        "lines": [
          "Ich sammle meine Stifte ein.",
          "Ich lege mein Heft an seinen Platz.",
          "Ich bitte um Hilfe, wenn es zu schwer ist.",
          "Ein kleiner Schritt reicht für heute."
        ],
        "evidence": "Der Prophet ﷺ lehrte Verantwortung. Unsere Taschenübung hilft, Verantwortung zu lernen."
      },
      "6-8": {
        "intro": "Wer auf seine Dinge achtet, übt Zuverlässigkeit im Alltag.",
        "lines": [
          "Tarbiyah bedeutet: gute Gewohnheiten mit Geduld lernen.",
          "Eine kleine Aufgabe kann sein, das eigene Heft wegzulegen.",
          "Der Qurʾān spricht davon, Verpflichtungen ernst zu nehmen.",
          "Der Prophet ﷺ lehrte, dass Verantwortung wichtig ist."
        ],
        "evidence": "Die Schulsachen werden in den Quellen nicht ausdrücklich genannt; wir nutzen sie als sichere Übung."
      },
      "9-10": {
        "intro": "Wir lernen, was Verantwortung bedeutet und wie man sie ohne Überforderung übt.",
        "lines": [
          "Qurʾān 17:34 erinnert daran, Verpflichtungen einzuhalten.",
          "Im Ṣaḥīḥ-Ḥadīṯ von Ibn ʿUmar geht es um Verantwortung im jeweiligen Bereich.",
          "Für meinen Alltag kann ich eine passende Aufgabe selbst übernehmen.",
          "Andere brauchen vielleicht Unterstützung; Tarbiyah geschieht mit Geduld und Freundlichkeit."
        ],
        "evidence": "Quelle und persönliche Alltagsplanung unterscheiden; keine Pflicht aus einer einzelnen Aufräumaufgabe ableiten."
      }
    },
    "questions": {
      "4-5": [
        {
          "type": "choice",
          "prompt": "Wohin gehört dein Heft nach dem Lernen?",
          "options": [
            "An einen passenden Platz.",
            "Absichtlich in den Müll."
          ],
          "correct": 0,
          "hint": "Du darfst es ordentlich hinlegen.",
          "explain": "Ich räume es weg."
        },
        {
          "type": "choice",
          "prompt": "Was ist gut, wenn du Hilfe brauchst?",
          "options": [
            "Um Hilfe bitten.",
            "Angst haben, weil du es nicht allein schaffst."
          ],
          "correct": 0,
          "hint": "Hilfe ist in Ordnung.",
          "explain": "Ich darf fragen."
        }
      ],
      "6-8": [
        {
          "type": "choice",
          "prompt": "Was bedeutet Tarbiyah hier?",
          "options": [
            "Gute Gewohnheiten mit Geduld üben.",
            "Andere auslachen."
          ],
          "correct": 0,
          "hint": "Denke an Lernen.",
          "explain": "Wir üben gute Gewohnheiten."
        },
        {
          "type": "choice",
          "prompt": "Worum geht es im Ḥadīṯ?",
          "options": [
            "Verantwortung für anvertraute Dinge.",
            "Eine Pflicht, jedes Heft täglich genau gleich zu sortieren."
          ],
          "correct": 0,
          "hint": "Die Tasche ist unser Beispiel.",
          "explain": "Verantwortung ist wichtig."
        },
        {
          "type": "text",
          "prompt": "Welche kleine Aufgabe möchtest du selbst übernehmen?",
          "sample": "Ich packe abends mein Heft in die Tasche.",
          "hint": "Wähle eine erreichbare Aufgabe."
        }
      ],
      "9-10": [
        {
          "type": "choice",
          "prompt": "Welche Aussage ist quellentreu?",
          "options": [
            "Die Quellen lehren Verantwortung; Taschenordnung ist unsere Anwendung.",
            "Der Prophet ﷺ schrieb moderne Schultaschenregeln vor."
          ],
          "correct": 0,
          "hint": "Unterscheide Text und Übung.",
          "explain": "Die Ordnung ist eine Anwendung."
        },
        {
          "type": "text",
          "prompt": "Was haben Qurʾān 17:34 und al-Buḫārī 893 gemeinsam?",
          "sample": "Beide erinnern an Verbindlichkeit und Verantwortung.",
          "hint": "Ordne Beleg und Bedeutung zu."
        },
        {
          "type": "text",
          "prompt": "Wie kann man Verantwortung lernen, ohne andere zu beschämen?",
          "sample": "Mit kleinen altersgerechten Aufgaben, Geduld und Hilfsbereitschaft.",
          "hint": "Tarbiyah soll kindgerecht sein."
        }
      ]
    },
    "sourceType": "Quran and verified Sahih; teaching examples are paraphrases",
    "voiceApproved": false
  },
  "akhlaq-nafs-wut-sicher-ausdruecken": {
    "id": "akhlaq-nafs-wut-sicher-ausdruecken",
    "subject": "akhlaq",
    "pillar": "nafs",
    "topic": "Wut ohne Verletzungen ausdrücken",
    "title": "Tazkiyat an-Nafs · Bei Wut sicher bleiben",
    "lead": "Wut ist ein Gefühl; wichtig ist, wie wir damit handeln.",
    "goal": "Ich kenne sichere Schritte, wenn ich sehr ärgerlich werde.",
    "quran": {
      "surah": 3,
      "ayah": 134,
      "label": "Sūrat Āl ʿImrān · 3:134",
      "arabic": "وَالْكَاظِمِينَ الْغَيْظَ وَالْعَافِينَ عَنِ النَّاسِ",
      "meaning": "Und diejenigen, die ihren Zorn zurückhalten und den Menschen verzeihen. (Versauszug)",
      "excerpt": true
    },
    "hadith": {
      "source": "Ṣaḥīḥ al-Buḫārī, Nr. 6116 · Abū Hurayrah",
      "text": "Ein Mann bat den Propheten ﷺ um Rat. Er riet ihm wiederholt, dem Zorn nicht nachzugeben."
    },
    "sourceAudit": {
      "hadithUrl": "https://dorar.net/hadith/sharh/151063",
      "hadithNumber": "6116",
      "narrator": "Abū Hurayrah",
      "authenticity": "Ṣaḥīḥ",
      "note": "'Abstand nehmen, ruhig sprechen und Hilfe holen' sind sichere pädagogische Beispiele; nicht wörtlich im genannten Ḥadīṯ befohlen.",
      "quranReference": "3:134",
      "quranTextType": "excerpt",
      "hadithMeaningIsParaphrase": true,
      "verifiedDate": "2026-10-12",
      "directLinkChecked": true
    },
    "hint": "Wut ist nicht automatisch eine Sünde. Kinder dürfen Nein sagen und Hilfe holen, wenn ihnen Unrecht geschieht oder sie sich bedroht fühlen.",
    "sample": "Wenn ich wütend bin, schlage ich nicht. Ich halte Abstand und hole bei Bedarf Hilfe.",
    "ageText": {
      "4-5": {
        "intro": "Manchmal sind wir wütend. Wir dürfen das fühlen, aber wir tun niemandem weh.",
        "lines": [
          "Ich merke: Ich bin gerade wütend.",
          "Ich benutze meine Hände nicht zum Schlagen.",
          "Ich kann einen Schritt Abstand nehmen.",
          "Ich sage: Ich brauche Hilfe oder eine Pause."
        ],
        "evidence": "Der Qurʾān lobt Menschen, die ihren Zorn zurückhalten. Der Prophet ﷺ gab einen Rat zum Umgang mit Zorn."
      },
      "6-8": {
        "intro": "Wir unterscheiden unser Gefühl von der Handlung, die wir auswählen.",
        "lines": [
          "Wut ist ein Gefühl und kann stark sein.",
          "Tazkiyat an-Nafs bedeutet, am eigenen Charakter zu arbeiten.",
          "Im Qurʾān werden Menschen gelobt, die ihren Zorn beherrschen.",
          "Ich übe Abstand, ein ruhiges Wort und das Bitten um Hilfe."
        ],
        "evidence": "Die Schritte zum sicheren Verhalten sind eine pädagogische Übung zu den Quellen."
      },
      "9-10": {
        "intro": "Wir betrachten Qurʾān 3:134 und den authentischen Rat des Propheten ﷺ zu Zorn.",
        "lines": [
          "Der Vers nennt das Zurückhalten des Zorns und das Verzeihen.",
          "Al-Buḫārī 6116 enthält den wiederholten Rat, sich vom Zorn nicht beherrschen zu lassen.",
          "Wir können Grenzen klar benennen, ohne andere zu verletzen.",
          "Wenn Gefahr besteht, darf ich mich entfernen und Unterstützung holen; Verzeihen bedeutet nicht, Gewalt zu dulden."
        ],
        "evidence": "Die Quellen lehren Selbstbeherrschung. Sicherheitsregeln im Unterricht sind heutige Anwendungen."
      }
    },
    "questions": {
      "4-5": [
        {
          "type": "choice",
          "prompt": "Du bist wütend. Was kannst du tun?",
          "options": [
            "Eine Pause machen.",
            "Jemanden schlagen."
          ],
          "correct": 0,
          "hint": "Die Hände bleiben sicher.",
          "explain": "Ich nehme Abstand."
        },
        {
          "type": "choice",
          "prompt": "Du brauchst Hilfe. Was sagst du?",
          "options": [
            "Bitte hilf mir.",
            "Ich darf nie etwas sagen."
          ],
          "correct": 0,
          "hint": "Hilfe ist erlaubt.",
          "explain": "Ich darf um Hilfe bitten."
        }
      ],
      "6-8": [
        {
          "type": "choice",
          "prompt": "Was ist der Unterschied zwischen Gefühl und Handlung?",
          "options": [
            "Ich darf Wut fühlen, ohne zu schlagen.",
            "Wenn ich wütend bin, muss ich jemanden verletzen."
          ],
          "correct": 0,
          "hint": "Du kannst entscheiden, was du tust.",
          "explain": "Ein Gefühl zwingt nicht zu Gewalt."
        },
        {
          "type": "choice",
          "prompt": "Was heißt Tazkiyat an-Nafs hier?",
          "options": [
            "Am eigenen Verhalten arbeiten.",
            "Andere bedrohen."
          ],
          "correct": 0,
          "hint": "Wir verbessern Gewohnheiten.",
          "explain": "Den eigenen Charakter entwickeln."
        },
        {
          "type": "text",
          "prompt": "Nenne zwei sichere Schritte, wenn du wütend wirst.",
          "sample": "Ich nehme Abstand und bitte um Hilfe.",
          "hint": "Wut darf ausgesprochen werden."
        }
      ],
      "9-10": [
        {
          "type": "choice",
          "prompt": "Was lehrt der Qurʾān-Auszug?",
          "options": [
            "Zorn beherrschen und Verzeihen sind lobenswert.",
            "Jede Wut ist schon körperliche Gewalt."
          ],
          "correct": 0,
          "hint": "Denke an den Vers.",
          "explain": "Die Handlung ist entscheidend."
        },
        {
          "type": "text",
          "prompt": "Trenne den Ḥadīṯ von der Unterrichtsübung.",
          "sample": "Al-Buḫārī 6116 rät zur Beherrschung von Zorn; Abstand nehmen ist unsere Sicherheitsübung.",
          "hint": "Keine erfundene prophetische Anweisung."
        },
        {
          "type": "text",
          "prompt": "Warum darf man Grenzen setzen, auch wenn man Verzeihen lernt?",
          "sample": "Verzeihen heißt nicht, Gefahr oder Übergriffe schweigend auszuhalten.",
          "hint": "Sicherheit ist wichtig."
        }
      ]
    },
    "sourceType": "Quran and verified Sahih; teaching examples are paraphrases",
    "voiceApproved": false
  },
  "fiqh-wudu-schritte-reihenfolge": {
    "id": "fiqh-wudu-schritte-reihenfolge",
    "subject": "fiqh",
    "pillar": "fiqh",
    "topic": "Wuḍūʾ in der richtigen Reihenfolge",
    "title": "Fiqh · So übe ich Wuḍūʾ",
    "lead": "Die Gebetswaschung lernen wir schrittweise nach der Sunnah.",
    "goal": "Ich kenne den Grundablauf der Gebetswaschung und übe ihn mit einem Erwachsenen.",
    "quran": {
      "surah": 5,
      "ayah": 6,
      "label": "Sūrat al-Māʾidah · 5:6",
      "arabic": "فَاغْسِلُوا وُجُوهَكُمْ وَأَيْدِيَكُمْ إِلَى الْمَرَافِقِ",
      "meaning": "Wascht eure Gesichter und eure Hände bis zu den Ellenbogen. (Versauszug)",
      "excerpt": true
    },
    "hadith": {
      "source": "Ṣaḥīḥ al-Buḫārī, Nr. 164; Ṣaḥīḥ Muslim, Nr. 226 · ʿUṯmān ibn ʿAffān",
      "text": "ʿUṯmān zeigte die Gebetswaschung und sagte, dass er den Propheten ﷺ in dieser Weise die Gebetswaschung verrichten sah."
    },
    "sourceAudit": {
      "hadithUrl": "https://dorar.net/hadith/sharh/3683",
      "hadithNumber": "164",
      "narrator": "ʿUṯmān ibn ʿAffān, berichtet über Ḥumrān",
      "authenticity": "Ṣaḥīḥ",
      "note": "Die Reihenfolge im Unterricht ist eine kindgerechte Zusammenfassung des Ḥadīṯ. Rechtliche Details und hanbalitische Pflichtbestandteile sind vor einer anspruchsvollen Rechtslektion separat zu prüfen.",
      "quranReference": "5:6",
      "quranTextType": "excerpt",
      "hadithMeaningIsParaphrase": true,
      "verifiedDate": "2026-10-12",
      "directLinkChecked": true
    },
    "hint": "Zum Üben Erwachsene um Anleitung bitten, nicht in Wassergefäße hineinklettern oder gefährliche Wasserstellen aufsuchen. Wenig Wasser genügt für die Übung.",
    "sample": "Hände, Mund und Nase, Gesicht, Arme, Kopf und Ohren, Füße – ich übe ruhig mit Hilfe.",
    "ageText": {
      "4-5": {
        "intro": "Wuḍūʾ ist die besondere Waschung vor dem Gebet. Wir lernen sie langsam.",
        "lines": [
          "Wir beginnen mit sauberen Händen.",
          "Dann zeigt ein Erwachsener Mund, Nase und Gesicht.",
          "Wir lernen Arme und das Streichen über den Kopf.",
          "Zum Schluss üben wir die Füße, ohne Wasser zu verschwenden."
        ],
        "evidence": "Der Qurʾān nennt die Gebetswaschung. ʿUṯmān zeigte, wie der Prophet ﷺ Wuḍūʾ machte."
      },
      "6-8": {
        "intro": "Wuḍūʾ hat einen geordneten Ablauf. Wir lernen die Schritte nach einem authentischen Bericht.",
        "lines": [
          "Zuerst die Hände, dann Mund und Nase.",
          "Danach Gesicht und Arme bis zu den Ellenbogen.",
          "Nun wird über Kopf und Ohren gestrichen.",
          "Danach die Füße einschließlich der Knöchel; wir üben mit Anleitung und wenig Wasser."
        ],
        "evidence": "Der Ṣaḥābī ʿUṯmān zeigte die überlieferte Waschung; das Waschen von Gesicht und Armen steht ausdrücklich in Qurʾān 5:6."
      },
      "9-10": {
        "intro": "Wir vergleichen Qurʾān 5:6 mit der von ʿUṯmān überlieferten Praxis.",
        "lines": [
          "Qurʾān 5:6 nennt wesentliche Körperteile der Gebetswaschung.",
          "Der authentische Bericht zeigt einen geordneten Ablauf einschließlich Mund, Nase und Kopf.",
          "Wir unterscheiden Waschen mit Wasser vom Streichen über den Kopf.",
          "Ein Erwachsener kann bei Details und hanbalitischen Fiqh-Fragen helfen; nicht alle Waschungen müssen dreimal vorgenommen werden."
        ],
        "evidence": "Bukhārī 164 und Muslim 226 sind der Nachweis der von ʿUṯmān gezeigten Praxis; diese Unterrichtsfassung ist keine eigenständige Rechtsfatwā."
      }
    },
    "questions": {
      "4-5": [
        {
          "type": "choice",
          "prompt": "Was bedeutet Wuḍūʾ?",
          "options": [
            "Gebetswaschung",
            "Ein Spiel"
          ],
          "correct": 0,
          "hint": "Vor dem Gebet.",
          "explain": "Wuḍūʾ ist die Gebetswaschung."
        },
        {
          "type": "choice",
          "prompt": "Wie üben wir sie sicher?",
          "options": [
            "Mit einem Erwachsenen und wenig Wasser.",
            "Allein an einem tiefen Brunnen."
          ],
          "correct": 0,
          "hint": "Denke an Sicherheit.",
          "explain": "Wir üben ruhig und sicher."
        }
      ],
      "6-8": [
        {
          "type": "choice",
          "prompt": "Was kommt nach Mund und Nase?",
          "options": [
            "Das Gesicht.",
            "Die Schuhe anziehen."
          ],
          "correct": 0,
          "hint": "Denke an die Reihenfolge.",
          "explain": "Wir waschen das Gesicht."
        },
        {
          "type": "choice",
          "prompt": "Was machen wir am Kopf?",
          "options": [
            "Wir streichen mit nassen Händen darüber.",
            "Wir werfen Wasser ins Gesicht anderer."
          ],
          "correct": 0,
          "hint": "Der Kopf wird gestrichen.",
          "explain": "Wir machen Masḥ."
        },
        {
          "type": "text",
          "prompt": "Nenne die grundlegende Reihenfolge.",
          "sample": "Hände, Mund und Nase, Gesicht, Arme, Kopf und Ohren, Füße.",
          "hint": "Lerne die Schritte mit Anleitung."
        }
      ],
      "9-10": [
        {
          "type": "choice",
          "prompt": "Was zeigt der authentische Bericht von ʿUṯmān?",
          "options": [
            "Die überlieferte Praxis der Gebetswaschung.",
            "Ein frei erfundenes Ritual."
          ],
          "correct": 0,
          "hint": "Bukhārī Nr. 164.",
          "explain": "Der Bericht beschreibt Wuḍūʾ."
        },
        {
          "type": "text",
          "prompt": "Was ist der Unterschied zwischen Waschen und Streichen?",
          "sample": "Das Gesicht wird gewaschen; über den Kopf wird mit nassen Händen gestrichen.",
          "hint": "Qurʾān 5:6 hilft dabei."
        },
        {
          "type": "text",
          "prompt": "Warum unterscheiden wir Textbeleg und Fiqh-Erläuterung?",
          "sample": "Die Quellen nennen den Ablauf; Rechtsdetails brauchen genaue Auslegung und Prüfung.",
          "hint": "Die hanbalitische Fiqh-Prüfung erfolgt gesondert."
        }
      ]
    },
    "sourceType": "Quran and verified Sahih; teaching examples are paraphrases",
    "voiceApproved": false
  }
};
for(const [id,l] of Object.entries(additions)){
 if(l.id!==id||prior[id]||!l.quran.excerpt||!l.sourceAudit.hadithUrl||l.voiceApproved)throw Error("V27 unsafe content: "+id);
 for(const age of ["4-5","6-8","9-10"]){
  if(l.ageText[age].lines.length!==4||l.questions[age].length<2)throw Error("V27 missing age-specific lesson: "+id+" "+age);
 }
}
window.DARKidsAcademyCurriculum=Object.freeze({...prior,...additions});
window.DARKidsAcademyCurriculumV27=Object.freeze({
  "version": "20261012-v27",
  "count": 8,
  "ids": [
    "aqidah-allah-erschuf-tiere",
    "aqidah-iman-an-allah-vertiefen",
    "aqidah-ikhlas-gute-lernabsicht",
    "akhlaq-geschwister-fair-teilen",
    "adab-privatsphaere-andere-achten",
    "akhlaq-tarbiyah-sachen-pflegen",
    "akhlaq-nafs-wut-sicher-ausdruecken",
    "fiqh-wudu-schritte-reihenfolge"
  ],
  "pillars": {
    "aqidah-allah-erschuf-tiere": "tawhid",
    "aqidah-iman-an-allah-vertiefen": "iman",
    "aqidah-ikhlas-gute-lernabsicht": "ikhlas",
    "akhlaq-geschwister-fair-teilen": "akhlaq",
    "adab-privatsphaere-andere-achten": "adab",
    "akhlaq-tarbiyah-sachen-pflegen": "tarbiyah",
    "akhlaq-nafs-wut-sicher-ausdruecken": "nafs",
    "fiqh-wudu-schritte-reihenfolge": "fiqh"
  },
  "religiousSourcesVerified": true,
  "voiceRecordingsApproved": false,
  "requiresHumanAudioApproval": true
});
})();
