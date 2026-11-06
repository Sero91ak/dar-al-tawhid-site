/* DĀR AL TAWḤĪD KIDS V26 – lessons 46–50
 * Precisely located Arabic Qurʾān passages + independently verified Ṣaḥīḥ.
 * Narrator attribution does not fabricate a standalone Companion statement.
 * Each age receives original teacher wording; German Ḥadīṯ meanings are PARAPHRASES.
 * All five still require new V4 story voice recordings and human audio review.
 */
(function(){
"use strict";
const existing=window.DARKidsAcademyCurriculum;
if(!existing||!existing["akhlaq-nafs-gutes-herz"])return;
const additions={
  "fiqh-reinheit-unterscheiden": {
    "id": "fiqh-reinheit-unterscheiden",
    "subject": "fiqh",
    "pillar": "fiqh",
    "topic": "Reinheit und Sauberkeit",
    "title": "Ṭahārah · Reinheit verstehen",
    "lead": "Vor dem Gebet lernen wir, rein zu sein.",
    "goal": "Ich unterscheide gewöhnliche Sauberkeit von der Gebetswaschung.",
    "quran": {
      "surah": 5,
      "ayah": 6,
      "label": "Sūrat al-Māʾidah · 5:6",
      "arabic": "يَا أَيُّهَا الَّذِينَ آمَنُوا إِذَا قُمْتُمْ إِلَى الصَّلَاةِ فَاغْسِلُوا وُجُوهَكُمْ وَأَيْدِيَكُمْ إِلَى الْمَرَافِقِ",
      "meaning": "Wenn ihr zum Gebet aufsteht, wascht eure Gesichter und Hände bis zu den Ellenbogen. (Auszug)",
      "excerpt": true
    },
    "hadith": {
      "source": "Ṣaḥīḥ Muslim, Nr. 223 · Abū Mālik al-Ashʿarī",
      "text": "Der Prophet ﷺ betonte die große Bedeutung der rituellen Reinheit für den Glauben."
    },
    "sourceAudit": {
      "hadithUrl": "https://sunnah.com/muslim:223",
      "quranReference": "5:6",
      "hadithNumber": "223",
      "authenticity": "Ṣaḥīḥ",
      "narrator": "Abū Mālik al-Ashʿarī",
      "quranTextType": "excerpt",
      "verifiedDate": "2026-10-12",
      "hadithMeaningIsParaphrase": true
    },
    "hint": "Händewaschen nach dem Spielen ist gut. Wuḍūʾ ist die besondere Waschung vor dem Gebet.",
    "sample": "Ich halte mich sauber und lerne die Gebetswaschung.",
    "ageText": {
      "4-5": {
        "intro": "Wir halten unsere Hände sauber. Vor dem Gebet lernen wir eine besondere Waschung.",
        "lines": [
          "Nach dem Spielen wasche ich schmutzige Hände.",
          "Vor dem Gebet gibt es eine besondere Waschung.",
          "Sie heißt Wuḍūʾ: Waschung vor dem Gebet.",
          "Ein Erwachsener zeigt mir die einzelnen Schritte."
        ],
        "evidence": "Allah nennt im Qurʾān Waschungen für das Gebet. Der Prophet ﷺ lehrte, dass Reinheit wichtig ist."
      },
      "6-8": {
        "intro": "Sauberkeit und religiöse Reinheit sind miteinander verbunden, aber nicht dasselbe.",
        "lines": [
          "Wenn meine Hände schmutzig sind, wasche ich den Schmutz ab.",
          "Wuḍūʾ ist eine besondere Reinigung für das Gebet.",
          "In Qurʾān 5:6 werden Gesicht und Arme genannt.",
          "Wir üben die Gebetswaschung nach der Sunnah mit Anleitung."
        ],
        "evidence": "Qurʾān 5:6 beschreibt die Gebetswaschung. Ṣaḥīḥ Muslim 223 betont den hohen Wert der Reinigung, ohne gewöhnliches Aufräumen mit Wuḍūʾ gleichzusetzen."
      },
      "9-10": {
        "intro": "Wir unterscheiden Ṭahārah im Fiqh von allgemeiner Hygiene.",
        "lines": [
          "Alltägliche Hygiene schützt vor Schmutz und dient der Gesundheit.",
          "Rituelle Reinheit bezieht sich auf die Voraussetzungen gottesdienstlicher Handlungen.",
          "Qurʾān 5:6 legt Waschungen bei Wuḍūʾ dar.",
          "Bei Fragen zu Einzelregeln lernen wir von einer fachkundigen Lehrperson."
        ],
        "evidence": "Der Qurʾān benennt Bestandteile des Wuḍūʾ; Muslim 223 berichtet den besonderen religiösen Wert der Reinheit. Wir setzen nicht jede Hygienemaßnahme einer rituellen Waschung gleich."
      }
    },
    "lines": [
      "Wenn meine Hände schmutzig sind, wasche ich den Schmutz ab.",
      "Wuḍūʾ ist eine besondere Reinigung für das Gebet.",
      "In Qurʾān 5:6 werden Gesicht und Arme genannt.",
      "Wir üben die Gebetswaschung nach der Sunnah mit Anleitung."
    ],
    "questions": {
      "4-5": [
        {
          "type": "choice",
          "prompt": "Was kannst du hier Gutes tun?",
          "options": [
            "Ich wasche meine Hände und lerne Wuḍūʾ zusätzlich.",
            "Ich sage: Händewaschen und Wuḍūʾ sind immer genau dasselbe."
          ],
          "correct": 0,
          "hint": "Händewaschen nach dem Spielen ist gut. Wuḍūʾ ist die besondere Waschung vor dem Gebet.",
          "explain": "Ich halte mich sauber und lerne die Gebetswaschung."
        },
        {
          "type": "choice",
          "prompt": "Was üben wir heute?",
          "options": [
            "Ich halte mich sauber und lerne die Gebetswaschung.",
            "Andere mit Absicht verletzen."
          ],
          "correct": 0,
          "hint": "Vor dem Gebet lernen wir, rein zu sein.",
          "explain": "Ich unterscheide gewöhnliche Sauberkeit von der Gebetswaschung."
        }
      ],
      "6-8": [
        {
          "type": "choice",
          "prompt": "Welche Handlung passt zu unserem Unterricht?",
          "options": [
            "Ich wasche meine Hände und lerne Wuḍūʾ zusätzlich.",
            "Ich sage: Händewaschen und Wuḍūʾ sind immer genau dasselbe."
          ],
          "correct": 0,
          "hint": "Händewaschen nach dem Spielen ist gut. Wuḍūʾ ist die besondere Waschung vor dem Gebet.",
          "explain": "Ich halte mich sauber und lerne die Gebetswaschung."
        },
        {
          "type": "text",
          "prompt": "Erkläre das Thema mit einem eigenen sicheren Beispiel: Reinheit und Sauberkeit.",
          "sample": "Ich unterscheide gewöhnliche Sauberkeit von der Gebetswaschung.",
          "hint": "Händewaschen nach dem Spielen ist gut. Wuḍūʾ ist die besondere Waschung vor dem Gebet."
        },
        {
          "type": "choice",
          "prompt": "Woher stammen unsere religiösen Aussagen?",
          "options": [
            "Aus dem Qurʾān und der authentischen Sunnah.",
            "Aus frei erfundenen Berichten ohne Quelle."
          ],
          "correct": 0,
          "hint": "Qurʾān 5:6 und Ṣaḥīḥ Muslim, Nr. 223 · Abū Mālik al-Ashʿarī",
          "explain": "Ich unterscheide gewöhnliche Sauberkeit von der Gebetswaschung."
        }
      ],
      "9-10": [
        {
          "type": "choice",
          "prompt": "Welche Entscheidung passt am besten zu den beiden Quellen?",
          "options": [
            "Ich wasche meine Hände und lerne Wuḍūʾ zusätzlich.",
            "Ich sage: Händewaschen und Wuḍūʾ sind immer genau dasselbe."
          ],
          "correct": 0,
          "hint": "Händewaschen nach dem Spielen ist gut. Wuḍūʾ ist die besondere Waschung vor dem Gebet.",
          "explain": "Ich halte mich sauber und lerne die Gebetswaschung."
        },
        {
          "type": "text",
          "prompt": "Warum ersetzt gewöhnliches Händewaschen nicht automatisch die vollständige Gebetswaschung?",
          "sample": "Wuḍūʾ hat bestimmte religiöse Handlungen und Voraussetzungen; normale Hygiene ist etwas anderes.",
          "hint": "Prüfe Qurʾān 5:6 und Ṣaḥīḥ Muslim, Nr. 223 · Abū Mālik al-Ashʿarī."
        },
        {
          "type": "text",
          "prompt": "Was steht in der Quelle und was ist unsere heutige Unterrichtsanwendung?",
          "sample": "Wuḍūʾ hat bestimmte religiöse Handlungen und Voraussetzungen; normale Hygiene ist etwas anderes.",
          "hint": "Unterscheide Originalbeleg, Bedeutung und Alltagsbeispiel."
        }
      ]
    }
  },
  "aqidah-quran-allahs-wort": {
    "id": "aqidah-quran-allahs-wort",
    "subject": "aqidah",
    "pillar": "quran",
    "topic": "Der Qurʾān – Allahs Wort",
    "title": "Qurʾān · Allahs Wort achten",
    "lead": "Wir hören und lernen Allahs Wort.",
    "goal": "Ich lerne den Qurʾān mit Respekt und übe in Ruhe.",
    "quran": {
      "surah": 2,
      "ayah": 2,
      "label": "Sūrat al-Baqarah · 2:2",
      "arabic": "ذَٰلِكَ الْكِتَابُ لَا رَيْبَ ۛ فِيهِ هُدًى لِلْمُتَّقِينَ",
      "meaning": "Dies ist das Buch, an dem kein Zweifel besteht: eine Rechtleitung für die Gottesfürchtigen.",
      "excerpt": false
    },
    "hadith": {
      "source": "Ṣaḥīḥ al-Buḫārī, Nr. 5027 · ʿUṯmān ibn ʿAffān",
      "text": "Der Prophet ﷺ lehrte den besonderen Wert dessen, der den Qurʾān lernt und ihn weiterlehrt."
    },
    "sourceAudit": {
      "hadithUrl": "https://dorar.net/hadith/sharh/151215",
      "quranReference": "2:2",
      "hadithNumber": "5027",
      "authenticity": "Ṣaḥīḥ",
      "narrator": "ʿUṯmān ibn ʿAffān",
      "quranTextType": "complete",
      "verifiedDate": "2026-10-12",
      "hadithMeaningIsParaphrase": true
    },
    "hint": "Zum Anhören wählen wir eine wirkliche Qurʾān-Rezitation, nie eine künstliche nachgesprochene Qurʾān-Stimme.",
    "sample": "Ich höre Qurʾān mit Respekt und lerne Schritt für Schritt.",
    "ageText": {
      "4-5": {
        "intro": "Der Qurʾān ist Allahs Wort. Wir hören ruhig zu.",
        "lines": [
          "Wir hören einen Vers aus dem Qurʾān.",
          "Der Qurʾān ist Allahs Wort.",
          "Ich darf nach der Bedeutung fragen.",
          "Ich lerne ohne Eile."
        ],
        "evidence": "Allah nennt den Qurʾān eine Rechtleitung. Der Prophet ﷺ lobte das Lernen und Lehren des Qurʾān."
      },
      "6-8": {
        "intro": "Wir lernen den Unterschied zwischen Qurʾān und deutscher Erklärung.",
        "lines": [
          "Der Qurʾān wurde auf Arabisch offenbart.",
          "Eine deutsche Übersetzung erklärt seine Bedeutung.",
          "Beim Hören hören wir eine echte Rezitation.",
          "Der Prophet ﷺ lobte diejenigen, die Qurʾān lernen und lehren."
        ],
        "evidence": "In Qurʾān 2:2 heißt das Buch eine Rechtleitung. Nach al-Buḫārī 5027 ist das Lernen und Weiterlehren des Qurʾān besonders wertvoll."
      },
      "9-10": {
        "intro": "Wir betrachten Offenbarung, arabischen Originaltext und die Erklärung auf Deutsch.",
        "lines": [
          "Der arabische Qurʾān ist Allahs Offenbarung, nicht eine deutsche Nacherzählung.",
          "Übersetzungen geben Bedeutungen wieder und sind selbst keine originalen arabischen Verse.",
          "ʿUṯmān ibn ʿAffān überlieferte die Lehre vom Lernen und Weiterlehren des Qurʾān.",
          "Wir lernen mit einem geprüften Text und authentischer Rezitation."
        ],
        "evidence": "Qurʾān 2:2 beschreibt die Schrift als Rechtleitung. Al-Buḫārī 5027 nennt ʿUṯmān ibn ʿAffān als Überlieferer; wir erfinden deshalb kein eigenes Zitat von ihm."
      }
    },
    "lines": [
      "Der Qurʾān wurde auf Arabisch offenbart.",
      "Eine deutsche Übersetzung erklärt seine Bedeutung.",
      "Beim Hören hören wir eine echte Rezitation.",
      "Der Prophet ﷺ lobte diejenigen, die Qurʾān lernen und lehren."
    ],
    "questions": {
      "4-5": [
        {
          "type": "choice",
          "prompt": "Was kannst du hier Gutes tun?",
          "options": [
            "Ich höre aufmerksam zu und frage nach der Bedeutung.",
            "Ich spiele absichtlich laut darüber."
          ],
          "correct": 0,
          "hint": "Zum Anhören wählen wir eine wirkliche Qurʾān-Rezitation, nie eine künstliche nachgesprochene Qurʾān-Stimme.",
          "explain": "Ich höre Qurʾān mit Respekt und lerne Schritt für Schritt."
        },
        {
          "type": "choice",
          "prompt": "Was üben wir heute?",
          "options": [
            "Ich höre Qurʾān mit Respekt und lerne Schritt für Schritt.",
            "Andere mit Absicht verletzen."
          ],
          "correct": 0,
          "hint": "Wir hören und lernen Allahs Wort.",
          "explain": "Ich lerne den Qurʾān mit Respekt und übe in Ruhe."
        }
      ],
      "6-8": [
        {
          "type": "choice",
          "prompt": "Welche Handlung passt zu unserem Unterricht?",
          "options": [
            "Ich höre aufmerksam zu und frage nach der Bedeutung.",
            "Ich spiele absichtlich laut darüber."
          ],
          "correct": 0,
          "hint": "Zum Anhören wählen wir eine wirkliche Qurʾān-Rezitation, nie eine künstliche nachgesprochene Qurʾān-Stimme.",
          "explain": "Ich höre Qurʾān mit Respekt und lerne Schritt für Schritt."
        },
        {
          "type": "text",
          "prompt": "Erkläre das Thema mit einem eigenen sicheren Beispiel: Der Qurʾān – Allahs Wort.",
          "sample": "Ich lerne den Qurʾān mit Respekt und übe in Ruhe.",
          "hint": "Zum Anhören wählen wir eine wirkliche Qurʾān-Rezitation, nie eine künstliche nachgesprochene Qurʾān-Stimme."
        },
        {
          "type": "choice",
          "prompt": "Woher stammen unsere religiösen Aussagen?",
          "options": [
            "Aus dem Qurʾān und der authentischen Sunnah.",
            "Aus frei erfundenen Berichten ohne Quelle."
          ],
          "correct": 0,
          "hint": "Qurʾān 2:2 und Ṣaḥīḥ al-Buḫārī, Nr. 5027 · ʿUṯmān ibn ʿAffān",
          "explain": "Ich lerne den Qurʾān mit Respekt und übe in Ruhe."
        }
      ],
      "9-10": [
        {
          "type": "choice",
          "prompt": "Welche Entscheidung passt am besten zu den beiden Quellen?",
          "options": [
            "Ich höre aufmerksam zu und frage nach der Bedeutung.",
            "Ich spiele absichtlich laut darüber."
          ],
          "correct": 0,
          "hint": "Zum Anhören wählen wir eine wirkliche Qurʾān-Rezitation, nie eine künstliche nachgesprochene Qurʾān-Stimme.",
          "explain": "Ich höre Qurʾān mit Respekt und lerne Schritt für Schritt."
        },
        {
          "type": "text",
          "prompt": "Was ist der Unterschied zwischen arabischem Qurʾān-Vers und deutscher Bedeutungsübersetzung?",
          "sample": "Der arabische Vers ist Offenbarung; die deutsche Übersetzung erklärt die Bedeutung und darf nicht als arabischer Originaltext ausgegeben werden.",
          "hint": "Prüfe Qurʾān 2:2 und Ṣaḥīḥ al-Buḫārī, Nr. 5027 · ʿUṯmān ibn ʿAffān."
        },
        {
          "type": "text",
          "prompt": "Was steht in der Quelle und was ist unsere heutige Unterrichtsanwendung?",
          "sample": "Der arabische Vers ist Offenbarung; die deutsche Übersetzung erklärt die Bedeutung und darf nicht als arabischer Originaltext ausgegeben werden.",
          "hint": "Unterscheide Originalbeleg, Bedeutung und Alltagsbeispiel."
        }
      ]
    }
  },
  "aqidah-sirah-adam-erschoepfung": {
    "id": "aqidah-sirah-adam-erschoepfung",
    "subject": "aqidah",
    "pillar": "sirah",
    "topic": "Ādam عليه السلام kennenlernen",
    "title": "Ādam · Allah erschuf den ersten Menschen",
    "lead": "Allah erschuf Ādam und lehrte ihn.",
    "goal": "Ich weiß, dass Allah Ādam erschuf; wir erfinden keine Einzelheiten über ihn.",
    "quran": {
      "surah": 3,
      "ayah": 59,
      "label": "Sūrat Āl ʿImrān · 3:59",
      "arabic": "إِنَّ مَثَلَ عِيسَىٰ عِندَ اللَّهِ كَمَثَلِ آدَمَ ۖ خَلَقَهُ مِن تُرَابٍ ثُمَّ قَالَ لَهُ كُن فَيَكُونُ",
      "meaning": "Bei Allah ist das Beispiel von ʿĪsā wie das von Ādam. Er erschuf ihn aus Erde, dann sagte Er zu ihm: Sei!, und er war.",
      "excerpt": false
    },
    "hadith": {
      "source": "Ṣaḥīḥ al-Buḫārī, Nr. 3326 · Abū Hurayrah",
      "text": "Der Prophet ﷺ berichtete, dass Allah Ādam erschuf und ihn lehrte, die Engel mit dem Friedensgruß zu begrüßen."
    },
    "sourceAudit": {
      "hadithUrl": "https://dorar.net/hadith/sharh/12842",
      "quranReference": "3:59",
      "hadithNumber": "3326",
      "authenticity": "Ṣaḥīḥ",
      "narrator": "Abū Hurayrah",
      "quranTextType": "complete",
      "verifiedDate": "2026-10-12",
      "hadithMeaningIsParaphrase": true
    },
    "hint": "Wir stellen Propheten nicht als Personen dar und beschreiben nicht unbelegte Einzelheiten.",
    "sample": "Allah erschuf Ādam. Wir lernen nur, was Qurʾān und authentische Sunnah darüber berichten.",
    "ageText": {
      "4-5": {
        "intro": "Ādam war der erste Mensch. Allah hat ihn erschaffen.",
        "lines": [
          "Allah erschuf Ādam.",
          "Ādam war der erste Mensch.",
          "Wir sprechen respektvoll über ihn.",
          "Wir hören nur Geschichten, die gute Quellen haben."
        ],
        "evidence": "Allah berichtet im Qurʾān von der Erschaffung Ādams. Der Prophet ﷺ berichtete ebenfalls über Ādam."
      },
      "6-8": {
        "intro": "Wir lernen etwas aus dem Qurʾān über Ādam, ohne eine erfundene Geschichte hinzuzufügen.",
        "lines": [
          "Qurʾān 3:59 erinnert an die Erschaffung Ādams.",
          "Allah erschuf ihn aus Erde.",
          "Der Prophet ﷺ berichtete auch vom Friedensgruß Ādams.",
          "Wir erzählen die Überlieferung ohne Bilder von Propheten."
        ],
        "evidence": "Qurʾān 3:59 nennt die Erschaffung Ādams aus Erde. Ṣaḥīḥ al-Buḫārī 3326 erwähnt Ādam und den Friedensgruß."
      },
      "9-10": {
        "intro": "Wir unterscheiden die sichere Qurʾān-Aussage, den Ḥadīṯ und nicht belegte Erzählungen.",
        "lines": [
          "Qurʾān 3:59 stellt die Erschaffung Ādams in einem bestimmten Vergleich dar.",
          "Im Vers wird beschrieben, dass Allah Ādam aus Erde erschuf.",
          "Abū Hurayrah überlieferte einen authentischen Bericht zum Friedensgruß Ādams.",
          "Wir leiten aus einer Erzählung keine unbelegten Einzelheiten oder Illustrationen ab."
        ],
        "evidence": "Qurʾān 3:59 behandelt den Vergleich mit ʿĪsā, während al-Buḫārī 3326 in seinem eigenen Zusammenhang den Friedensgruß beschreibt. Beides darf nicht zu einem erfundenen Zitat verbunden werden."
      }
    },
    "lines": [
      "Qurʾān 3:59 erinnert an die Erschaffung Ādams.",
      "Allah erschuf ihn aus Erde.",
      "Der Prophet ﷺ berichtete auch vom Friedensgruß Ādams.",
      "Wir erzählen die Überlieferung ohne Bilder von Propheten."
    ],
    "questions": {
      "4-5": [
        {
          "type": "choice",
          "prompt": "Was kannst du hier Gutes tun?",
          "options": [
            "Ich frage freundlich, wo das im Qurʾān oder in der Sunnah steht.",
            "Ich übernehme die Geschichte ungeprüft als Tatsache."
          ],
          "correct": 0,
          "hint": "Wir stellen Propheten nicht als Personen dar und beschreiben nicht unbelegte Einzelheiten.",
          "explain": "Allah erschuf Ādam. Wir lernen nur, was Qurʾān und authentische Sunnah darüber berichten."
        },
        {
          "type": "choice",
          "prompt": "Was üben wir heute?",
          "options": [
            "Allah erschuf Ādam. Wir lernen nur, was Qurʾān und authentische Sunnah darüber berichten.",
            "Andere mit Absicht verletzen."
          ],
          "correct": 0,
          "hint": "Allah erschuf Ādam und lehrte ihn.",
          "explain": "Ich weiß, dass Allah Ādam erschuf; wir erfinden keine Einzelheiten über ihn."
        }
      ],
      "6-8": [
        {
          "type": "choice",
          "prompt": "Welche Handlung passt zu unserem Unterricht?",
          "options": [
            "Ich frage freundlich, wo das im Qurʾān oder in der Sunnah steht.",
            "Ich übernehme die Geschichte ungeprüft als Tatsache."
          ],
          "correct": 0,
          "hint": "Wir stellen Propheten nicht als Personen dar und beschreiben nicht unbelegte Einzelheiten.",
          "explain": "Allah erschuf Ādam. Wir lernen nur, was Qurʾān und authentische Sunnah darüber berichten."
        },
        {
          "type": "text",
          "prompt": "Erkläre das Thema mit einem eigenen sicheren Beispiel: Ādam عليه السلام kennenlernen.",
          "sample": "Ich weiß, dass Allah Ādam erschuf; wir erfinden keine Einzelheiten über ihn.",
          "hint": "Wir stellen Propheten nicht als Personen dar und beschreiben nicht unbelegte Einzelheiten."
        },
        {
          "type": "choice",
          "prompt": "Woher stammen unsere religiösen Aussagen?",
          "options": [
            "Aus dem Qurʾān und der authentischen Sunnah.",
            "Aus frei erfundenen Berichten ohne Quelle."
          ],
          "correct": 0,
          "hint": "Qurʾān 3:59 und Ṣaḥīḥ al-Buḫārī, Nr. 3326 · Abū Hurayrah",
          "explain": "Ich weiß, dass Allah Ādam erschuf; wir erfinden keine Einzelheiten über ihn."
        }
      ],
      "9-10": [
        {
          "type": "choice",
          "prompt": "Welche Entscheidung passt am besten zu den beiden Quellen?",
          "options": [
            "Ich frage freundlich, wo das im Qurʾān oder in der Sunnah steht.",
            "Ich übernehme die Geschichte ungeprüft als Tatsache."
          ],
          "correct": 0,
          "hint": "Wir stellen Propheten nicht als Personen dar und beschreiben nicht unbelegte Einzelheiten.",
          "explain": "Allah erschuf Ādam. Wir lernen nur, was Qurʾān und authentische Sunnah darüber berichten."
        },
        {
          "type": "text",
          "prompt": "Warum dürfen wir aus einer nicht belegten Erzählung keine neue Aussage über einen Propheten machen?",
          "sample": "Religiöse Berichte über Propheten brauchen einen sicheren Beleg aus Qurʾān und authentischer Sunnah.",
          "hint": "Prüfe Qurʾān 3:59 und Ṣaḥīḥ al-Buḫārī, Nr. 3326 · Abū Hurayrah."
        },
        {
          "type": "text",
          "prompt": "Was steht in der Quelle und was ist unsere heutige Unterrichtsanwendung?",
          "sample": "Religiöse Berichte über Propheten brauchen einen sicheren Beleg aus Qurʾān und authentischer Sunnah.",
          "hint": "Unterscheide Originalbeleg, Bedeutung und Alltagsbeispiel."
        }
      ]
    }
  },
  "adab-morgen-dhikr": {
    "id": "adab-morgen-dhikr",
    "subject": "adab",
    "pillar": "dua",
    "topic": "Morgens Allah gedenken",
    "title": "Morgen-Ḏikr · Allah loben",
    "lead": "Am Morgen erinnern wir uns an Allah.",
    "goal": "Ich lerne eine authentische Lobpreisung und verstehe ihren Sinn.",
    "quran": {
      "surah": 33,
      "ayah": 41,
      "label": "Sūrat al-Aḥzāb · 33:41",
      "arabic": "يَا أَيُّهَا الَّذِينَ آمَنُوا اذْكُرُوا اللَّهَ ذِكْرًا كَثِيرًا",
      "meaning": "O ihr, die ihr glaubt, gedenkt Allahs in häufigem Gedenken.",
      "excerpt": false
    },
    "hadith": {
      "source": "Ṣaḥīḥ Muslim, Nr. 2692 · Abū Hurayrah",
      "text": "Der Prophet ﷺ nannte die Lobpreisung Subḥāna llāhi wa-bi-ḥamdihī für den Morgen und Abend und erwähnte den besonderen Lohn für hundert Wiederholungen."
    },
    "sourceAudit": {
      "hadithUrl": "https://dorar.net/hadith/sharh/152577",
      "quranReference": "33:41",
      "hadithNumber": "2692",
      "authenticity": "Ṣaḥīḥ",
      "narrator": "Abū Hurayrah",
      "quranTextType": "complete",
      "verifiedDate": "2026-10-12",
      "hadithMeaningIsParaphrase": true,
      "practiceNote": "Der genannte besondere Lohn ist an die im Ḥadīṯ genannte Zahl gebunden. Kindern wird kein verpflichtendes Pensum auferlegt."
    },
    "hint": "Die Überlieferung nennt hundert Wiederholungen für einen bestimmten Lohn; für kleine Kinder ist das keine Pflicht oder Leistungsprüfung.",
    "sample": "Ich gedenke Allahs ohne Eile und lerne die Bedeutung von Subḥāna llāhi wa-bi-ḥamdihī.",
    "ageText": {
      "4-5": {
        "intro": "Am Morgen können wir an Allah denken und Ihn loben.",
        "lines": [
          "Ein neuer Morgen ist da.",
          "Wir danken Allah für diesen Tag.",
          "Ich kann eine kurze Lobpreisung lernen.",
          "Ich darf in meinem Tempo üben."
        ],
        "evidence": "Allah lädt uns ein, oft an Ihn zu denken. Der Prophet ﷺ nannte eine schöne Lobpreisung für den Morgen."
      },
      "6-8": {
        "intro": "Wir lernen, was Ḏikr bedeutet: Allah mit guten Worten gedenken.",
        "lines": [
          "Ḏikr heißt: an Allah denken und Ihn loben.",
          "Allah ruft im Qurʾān zum häufigen Gedenken auf.",
          "Der Prophet ﷺ lehrte Subḥāna llāhi wa-bi-ḥamdihī.",
          "Ich lerne den Ausdruck und seine Bedeutung Schritt für Schritt."
        ],
        "evidence": "Qurʾān 33:41 befiehlt das häufige Gedenken. Muslim 2692 nennt eine authentische Lobpreisung am Morgen und Abend."
      },
      "9-10": {
        "intro": "Wir unterscheiden die allgemeine Aufforderung zum Gedenken und die konkrete Überlieferung zur Lobpreisung.",
        "lines": [
          "Qurʾān 33:41 ruft zu viel Ḏikr auf.",
          "Muslim 2692 nennt Subḥāna llāhi wa-bi-ḥamdihī am Morgen und Abend.",
          "Die genannte besondere Belohnung bezieht sich auf hundert Wiederholungen.",
          "Wir erfinden weder zusätzliche Worte noch machen wir daraus eine Kinderpflicht."
        ],
        "evidence": "Der Qurʾān-Vers beschreibt das allgemeine Gedenken. Der Ḥadīṯ nennt die genaue Formel und Zahl für den erwähnten Lohn. Wir halten diese Angaben auseinander."
      }
    },
    "lines": [
      "Ḏikr heißt: an Allah denken und Ihn loben.",
      "Allah ruft im Qurʾān zum häufigen Gedenken auf.",
      "Der Prophet ﷺ lehrte Subḥāna llāhi wa-bi-ḥamdihī.",
      "Ich lerne den Ausdruck und seine Bedeutung Schritt für Schritt."
    ],
    "questions": {
      "4-5": [
        {
          "type": "choice",
          "prompt": "Was kannst du hier Gutes tun?",
          "options": [
            "Ich darf Allah gedenken und die Lobpreisung in Ruhe lernen.",
            "Ich sage anderen Kindern, sie müssen hundertmal aufsagen, sonst machen sie etwas Verbotenes."
          ],
          "correct": 0,
          "hint": "Die Überlieferung nennt hundert Wiederholungen für einen bestimmten Lohn; für kleine Kinder ist das keine Pflicht oder Leistungsprüfung.",
          "explain": "Ich gedenke Allahs ohne Eile und lerne die Bedeutung von Subḥāna llāhi wa-bi-ḥamdihī."
        },
        {
          "type": "choice",
          "prompt": "Was üben wir heute?",
          "options": [
            "Ich gedenke Allahs ohne Eile und lerne die Bedeutung von Subḥāna llāhi wa-bi-ḥamdihī.",
            "Andere mit Absicht verletzen."
          ],
          "correct": 0,
          "hint": "Am Morgen erinnern wir uns an Allah.",
          "explain": "Ich lerne eine authentische Lobpreisung und verstehe ihren Sinn."
        }
      ],
      "6-8": [
        {
          "type": "choice",
          "prompt": "Welche Handlung passt zu unserem Unterricht?",
          "options": [
            "Ich darf Allah gedenken und die Lobpreisung in Ruhe lernen.",
            "Ich sage anderen Kindern, sie müssen hundertmal aufsagen, sonst machen sie etwas Verbotenes."
          ],
          "correct": 0,
          "hint": "Die Überlieferung nennt hundert Wiederholungen für einen bestimmten Lohn; für kleine Kinder ist das keine Pflicht oder Leistungsprüfung.",
          "explain": "Ich gedenke Allahs ohne Eile und lerne die Bedeutung von Subḥāna llāhi wa-bi-ḥamdihī."
        },
        {
          "type": "text",
          "prompt": "Erkläre das Thema mit einem eigenen sicheren Beispiel: Morgens Allah gedenken.",
          "sample": "Ich lerne eine authentische Lobpreisung und verstehe ihren Sinn.",
          "hint": "Die Überlieferung nennt hundert Wiederholungen für einen bestimmten Lohn; für kleine Kinder ist das keine Pflicht oder Leistungsprüfung."
        },
        {
          "type": "choice",
          "prompt": "Woher stammen unsere religiösen Aussagen?",
          "options": [
            "Aus dem Qurʾān und der authentischen Sunnah.",
            "Aus frei erfundenen Berichten ohne Quelle."
          ],
          "correct": 0,
          "hint": "Qurʾān 33:41 und Ṣaḥīḥ Muslim, Nr. 2692 · Abū Hurayrah",
          "explain": "Ich lerne eine authentische Lobpreisung und verstehe ihren Sinn."
        }
      ],
      "9-10": [
        {
          "type": "choice",
          "prompt": "Welche Entscheidung passt am besten zu den beiden Quellen?",
          "options": [
            "Ich darf Allah gedenken und die Lobpreisung in Ruhe lernen.",
            "Ich sage anderen Kindern, sie müssen hundertmal aufsagen, sonst machen sie etwas Verbotenes."
          ],
          "correct": 0,
          "hint": "Die Überlieferung nennt hundert Wiederholungen für einen bestimmten Lohn; für kleine Kinder ist das keine Pflicht oder Leistungsprüfung.",
          "explain": "Ich gedenke Allahs ohne Eile und lerne die Bedeutung von Subḥāna llāhi wa-bi-ḥamdihī."
        },
        {
          "type": "text",
          "prompt": "Warum darf die Zahl hundert im Ḥadīṯ nicht verändert oder als Pflicht für kleine Kinder dargestellt werden?",
          "sample": "Die Überlieferung nennt eine bestimmte Zahl für einen besonderen Lohn, aber keine allgemeine Verpflichtung für kleine Kinder.",
          "hint": "Prüfe Qurʾān 33:41 und Ṣaḥīḥ Muslim, Nr. 2692 · Abū Hurayrah."
        },
        {
          "type": "text",
          "prompt": "Was steht in der Quelle und was ist unsere heutige Unterrichtsanwendung?",
          "sample": "Die Überlieferung nennt eine bestimmte Zahl für einen besonderen Lohn, aber keine allgemeine Verpflichtung für kleine Kinder.",
          "hint": "Unterscheide Originalbeleg, Bedeutung und Alltagsbeispiel."
        }
      ]
    }
  },
  "adab-eltern-freundlich": {
    "id": "adab-eltern-freundlich",
    "subject": "adab",
    "pillar": "family",
    "topic": "Mit Eltern liebevoll umgehen",
    "title": "Eltern · Güte und Respekt",
    "lead": "Wir begegnen unseren Eltern mit guten Worten.",
    "goal": "Ich spreche freundlich, höre zu und kann bei Schwierigkeiten um Hilfe bitten.",
    "quran": {
      "surah": 17,
      "ayah": 23,
      "label": "Sūrat al-Isrāʾ · 17:23",
      "arabic": "وَبِالْوَالِدَيْنِ إِحْسَانًا",
      "meaning": "Und zu den Eltern sollt ihr gütig sein. (Auszug)",
      "excerpt": true
    },
    "hadith": {
      "source": "Ṣaḥīḥ al-Buḫārī, Nr. 5971; Ṣaḥīḥ Muslim, Nr. 2548 · Abū Hurayrah",
      "text": "Auf die Frage nach der Person, die besonders gute Behandlung verdient, nannte der Prophet ﷺ dreimal die Mutter und dann den Vater."
    },
    "sourceAudit": {
      "hadithUrl": "https://sunnah.com/bukhari:5971",
      "quranReference": "17:23",
      "hadithNumber": "5971",
      "authenticity": "Ṣaḥīḥ",
      "narrator": "Abū Hurayrah",
      "quranTextType": "excerpt",
      "verifiedDate": "2026-10-12",
      "hadithMeaningIsParaphrase": true
    },
    "hint": "Freundlich sein bedeutet nicht, bei Angst, Gefahr oder unerlaubten Forderungen schweigen zu müssen. Kinder dürfen immer vertrauenswürdige Erwachsene um Hilfe bitten.",
    "sample": "Ich spreche freundlich mit meinen Eltern und hole Hilfe, wenn ich sie brauche.",
    "ageText": {
      "4-5": {
        "intro": "Mama und Papa verdienen freundliche Worte.",
        "lines": [
          "Ich kann Mama und Papa freundlich grüßen.",
          "Ich höre zu, wenn sie mit mir sprechen.",
          "Ich darf ehrlich sagen, wenn ich Angst habe.",
          "Wenn ich Hilfe brauche, frage ich eine sichere Person."
        ],
        "evidence": "Allah sagt, dass wir zu unseren Eltern gütig sein sollen. Der Prophet ﷺ sprach über die gute Behandlung von Mutter und Vater."
      },
      "6-8": {
        "intro": "Wir lernen, warum Eltern liebevollen Umgang verdienen und wie wir offen miteinander sprechen.",
        "lines": [
          "Qurʾān 17:23 ruft zu Güte gegenüber Eltern auf.",
          "Der Prophet ﷺ betonte besonders die gute Behandlung der Mutter.",
          "Auch dem Vater begegnen wir mit Respekt.",
          "Bei Sorgen darf ich offen sprechen und mir Hilfe holen."
        ],
        "evidence": "Qurʾān 17:23 nennt die Güte gegenüber Eltern. In al-Buḫārī 5971 wird die Mutter dreimal vor dem Vater als besonders anspruchsberechtigt genannt."
      },
      "9-10": {
        "intro": "Wir unterscheiden das Gebot guter Elternbehandlung von der Pflicht, die eigene Sicherheit ernst zu nehmen.",
        "lines": [
          "Qurʾān 17:23 fordert Güte und respektvollen Umgang mit Eltern.",
          "Der Ḥadīṯ in al-Buḫārī 5971 betont besonders die Rechte der Mutter.",
          "Gutes Verhalten zeigt sich in freundlichen Worten und angemessener Hilfe.",
          "Bei Gefahr, Gewalt oder ungerechten Forderungen darf und soll ein Kind Hilfe bei vertrauenswürdigen Erwachsenen suchen."
        ],
        "evidence": "Der Qurʾān spricht allgemein von Güte gegenüber Eltern. Die authentische Sunnah erläutert die besondere Stellung von Mutter und Vater, ohne zu verlangen, dass Kinder Gefahren verschweigen."
      }
    },
    "lines": [
      "Qurʾān 17:23 ruft zu Güte gegenüber Eltern auf.",
      "Der Prophet ﷺ betonte besonders die gute Behandlung der Mutter.",
      "Auch dem Vater begegnen wir mit Respekt.",
      "Bei Sorgen darf ich offen sprechen und mir Hilfe holen."
    ],
    "questions": {
      "4-5": [
        {
          "type": "choice",
          "prompt": "Was kannst du hier Gutes tun?",
          "options": [
            "Ich spreche ruhig und bitte um einen passenden Moment.",
            "Ich schreie absichtlich und verletze sie mit Worten."
          ],
          "correct": 0,
          "hint": "Freundlich sein bedeutet nicht, bei Angst, Gefahr oder unerlaubten Forderungen schweigen zu müssen. Kinder dürfen immer vertrauenswürdige Erwachsene um Hilfe bitten.",
          "explain": "Ich spreche freundlich mit meinen Eltern und hole Hilfe, wenn ich sie brauche."
        },
        {
          "type": "choice",
          "prompt": "Was üben wir heute?",
          "options": [
            "Ich spreche freundlich mit meinen Eltern und hole Hilfe, wenn ich sie brauche.",
            "Andere mit Absicht verletzen."
          ],
          "correct": 0,
          "hint": "Wir begegnen unseren Eltern mit guten Worten.",
          "explain": "Ich spreche freundlich, höre zu und kann bei Schwierigkeiten um Hilfe bitten."
        }
      ],
      "6-8": [
        {
          "type": "choice",
          "prompt": "Welche Handlung passt zu unserem Unterricht?",
          "options": [
            "Ich spreche ruhig und bitte um einen passenden Moment.",
            "Ich schreie absichtlich und verletze sie mit Worten."
          ],
          "correct": 0,
          "hint": "Freundlich sein bedeutet nicht, bei Angst, Gefahr oder unerlaubten Forderungen schweigen zu müssen. Kinder dürfen immer vertrauenswürdige Erwachsene um Hilfe bitten.",
          "explain": "Ich spreche freundlich mit meinen Eltern und hole Hilfe, wenn ich sie brauche."
        },
        {
          "type": "text",
          "prompt": "Erkläre das Thema mit einem eigenen sicheren Beispiel: Mit Eltern liebevoll umgehen.",
          "sample": "Ich spreche freundlich, höre zu und kann bei Schwierigkeiten um Hilfe bitten.",
          "hint": "Freundlich sein bedeutet nicht, bei Angst, Gefahr oder unerlaubten Forderungen schweigen zu müssen. Kinder dürfen immer vertrauenswürdige Erwachsene um Hilfe bitten."
        },
        {
          "type": "choice",
          "prompt": "Woher stammen unsere religiösen Aussagen?",
          "options": [
            "Aus dem Qurʾān und der authentischen Sunnah.",
            "Aus frei erfundenen Berichten ohne Quelle."
          ],
          "correct": 0,
          "hint": "Qurʾān 17:23 und Ṣaḥīḥ al-Buḫārī, Nr. 5971; Ṣaḥīḥ Muslim, Nr. 2548 · Abū Hurayrah",
          "explain": "Ich spreche freundlich, höre zu und kann bei Schwierigkeiten um Hilfe bitten."
        }
      ],
      "9-10": [
        {
          "type": "choice",
          "prompt": "Welche Entscheidung passt am besten zu den beiden Quellen?",
          "options": [
            "Ich spreche ruhig und bitte um einen passenden Moment.",
            "Ich schreie absichtlich und verletze sie mit Worten."
          ],
          "correct": 0,
          "hint": "Freundlich sein bedeutet nicht, bei Angst, Gefahr oder unerlaubten Forderungen schweigen zu müssen. Kinder dürfen immer vertrauenswürdige Erwachsene um Hilfe bitten.",
          "explain": "Ich spreche freundlich mit meinen Eltern und hole Hilfe, wenn ich sie brauche."
        },
        {
          "type": "text",
          "prompt": "Warum passen gutes Verhalten zu den Eltern und das Bitten um Hilfe in gefährlichen Situationen zusammen?",
          "sample": "Respekt ist wichtig, aber er bedeutet nicht, Gewalt oder gefährliche Situationen zu verschweigen.",
          "hint": "Prüfe Qurʾān 17:23 und Ṣaḥīḥ al-Buḫārī, Nr. 5971; Ṣaḥīḥ Muslim, Nr. 2548 · Abū Hurayrah."
        },
        {
          "type": "text",
          "prompt": "Was steht in der Quelle und was ist unsere heutige Unterrichtsanwendung?",
          "sample": "Respekt ist wichtig, aber er bedeutet nicht, Gewalt oder gefährliche Situationen zu verschweigen.",
          "hint": "Unterscheide Originalbeleg, Bedeutung und Alltagsbeispiel."
        }
      ]
    }
  }
};
for(const [id,l] of Object.entries(additions)){
 if(existing[id]||l.id!==id)throw Error("KIDS V26 invalid lesson "+id);
 for(const age of ["4-5","6-8","9-10"]){
  if(l.ageText[age].lines.length!==4||l.questions[age].length<2)throw Error("KIDS V26 age teaching missing "+id+" "+age);
 }
}
window.DARKidsAcademyCurriculum=Object.freeze({...existing,...additions});
window.DARKidsAcademyCurriculumV26=Object.freeze({version:"20261012-v26",count:5,ids:Object.keys(additions),pillars:Object.fromEntries(Object.entries(additions).map(([id,x])=>[id,x.pillar])),voiceRecordingsApproved:false});
})();
