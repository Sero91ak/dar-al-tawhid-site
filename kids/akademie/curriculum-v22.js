/* DĀR AL TAWḤĪD KIDS · V22 authentische Lektionen 35–38.
 * Four exact Qurʾān references + four independently traceable Ṣaḥīḥ narrations.
 * German source summaries are PARAPHRASES, not invented prophetic quotes.
 * Age-specific narration and interactive tasks (4–5 / 6–8 / 9–10).
 * No approved V4 master audio is implied by this lesson content.
 */
(function(){
"use strict";
const existing=window.DARKidsAcademyCurriculum;
if(!existing||!existing["aqidah-ikhlas-gute-absichten"]||!existing["fiqh-salah-gebet-lernen"])return;
const additions={
  "adab-essen-bismillah": {
    "id": "adab-essen-bismillah",
    "subject": "adab",
    "topic": "Essen mit Bismillāh",
    "title": "Bismillāh · Tischsitten",
    "lead": "Vor dem Essen denken wir an Allah.",
    "goal": "Ich sage Bismillāh, esse mit der rechten Hand und nehme von meiner Seite.",
    "quran": {
      "surah": 7,
      "ayah": 31,
      "label": "Sūrat al-Aʿrāf · 7:31",
      "arabic": "وَكُلُوا وَاشْرَبُوا وَلَا تُسْرِفُوا",
      "meaning": "Esst und trinkt, aber seid nicht maßlos.",
      "excerpt": true
    },
    "hadith": {
      "source": "Ṣaḥīḥ al-Buḫārī, Nr. 5376; Ṣaḥīḥ Muslim, Nr. 2022",
      "text": "Der Prophet ﷺ lehrte den jungen ʿUmar ibn Abī Salamah: Nenne Allahs Namen, iss mit deiner rechten Hand und iss von dem, was vor dir liegt."
    },
    "sourceAudit": {
      "hadithUrl": "https://sunnah.com/bukhari:5376",
      "quranReference": "7:31",
      "hadithNumber": "5376",
      "authenticity": "Ṣaḥīḥ (al-Buḫārī)",
      "quranTextType": "excerpt",
      "verifiedDate": "2026-10-11"
    },
    "hint": "Der Prophet ﷺ erklärte die Tischsitten freundlich einem Kind.",
    "sample": "Ich sage Bismillāh und esse achtsam.",
    "ageText": {
      "4-5": {
        "intro": "Wir üben ein kleines Wort vor dem Essen: Bismillāh.",
        "lines": [
          "Ich setze mich ruhig an den Tisch.",
          "Bevor ich esse, sage ich: Bismillāh.",
          "Ich esse mit meiner rechten Hand.",
          "Ich nehme das Essen, das vor mir liegt."
        ],
        "evidence": "Allah lehrt uns, beim Essen nicht maßlos zu sein. Der Prophet ﷺ zeigte einem Kind gute Tischsitten."
      },
      "6-8": {
        "intro": "Wir lernen drei Tischsitten aus der Sunnah.",
        "lines": [
          "Der Prophet ﷺ lehrte einem Jungen, Allahs Namen zu nennen.",
          "Vor dem Essen sage ich Bismillāh.",
          "Ich esse mit meiner rechten Hand und nehme von meiner Seite.",
          "Ich nehme eine passende Menge und verschwende kein Essen."
        ],
        "evidence": "In Qurʾān 7:31 verbietet Allah Maßlosigkeit. In al-Buḫārī 5376 lehrt der Prophet ﷺ das Essen mit der rechten Hand und von der nahen Seite."
      },
      "9-10": {
        "intro": "Wir verbinden Qurʾān 7:31 mit der authentischen Überlieferung über die Tischsitten.",
        "lines": [
          "Der Qurʾān erlaubt Essen und Trinken und warnt davor, verschwenderisch zu sein.",
          "ʿUmar ibn Abī Salamah wurde als Kind vom Propheten ﷺ freundlich angeleitet.",
          "Wir nennen Allahs Namen, essen mit der rechten Hand und von der nahen Seite.",
          "Ich unterscheide die wörtliche Lehre der Sunnah von unseren heutigen Übungsbeispielen."
        ],
        "evidence": "Der Vers 7:31 thematisiert Maßhalten; der Ḥadīṯ 5376 nennt drei konkrete Tischsitten. Beides ergänzen wir, ohne die Quellen zu vermischen."
      }
    },
    "lines": [
      "Der Prophet ﷺ lehrte einem Jungen, Allahs Namen zu nennen.",
      "Vor dem Essen sage ich Bismillāh.",
      "Ich esse mit meiner rechten Hand und nehme von meiner Seite.",
      "Ich nehme eine passende Menge und verschwende kein Essen."
    ],
    "questions": {
      "4-5": [
        {
          "type": "choice",
          "prompt": "Was ist hier eine gute Handlung?",
          "options": [
            "Ich sage Bismillāh und esse von der Seite vor mir.",
            "Ich greife ungefragt quer durch die Schüssel."
          ],
          "correct": 0,
          "hint": "Der Prophet ﷺ erklärte die Tischsitten freundlich einem Kind.",
          "explain": "Ich sage Bismillāh und esse achtsam."
        },
        {
          "type": "choice",
          "prompt": "Was möchtest du dir heute merken?",
          "options": [
            "Ich sage Bismillāh und esse achtsam.",
            "Ich darf andere absichtlich verletzen."
          ],
          "correct": 0,
          "hint": "Vor dem Essen denken wir an Allah.",
          "explain": "Ich sage Bismillāh, esse mit der rechten Hand und nehme von meiner Seite."
        }
      ],
      "6-8": [
        {
          "type": "choice",
          "prompt": "Welche Handlung passt zu unserem Unterricht?",
          "options": [
            "Ich sage Bismillāh und esse von der Seite vor mir.",
            "Ich greife ungefragt quer durch die Schüssel."
          ],
          "correct": 0,
          "hint": "Der Prophet ﷺ erklärte die Tischsitten freundlich einem Kind.",
          "explain": "Ich sage Bismillāh und esse achtsam."
        },
        {
          "type": "text",
          "prompt": "Erkläre an einem eigenen Beispiel: Essen mit Bismillāh.",
          "sample": "Ich sage Bismillāh, esse mit der rechten Hand und nehme von meiner Seite.",
          "hint": "Der Prophet ﷺ erklärte die Tischsitten freundlich einem Kind."
        },
        {
          "type": "choice",
          "prompt": "Woher stammen die religiösen Belege?",
          "options": [
            "Aus dem Qurʾān und einer authentischen Überlieferung.",
            "Aus einer erfundenen Geschichte ohne Quelle."
          ],
          "correct": 0,
          "hint": "7:31 und Ṣaḥīḥ al-Buḫārī 5376",
          "explain": "Ich sage Bismillāh, esse mit der rechten Hand und nehme von meiner Seite."
        }
      ],
      "9-10": [
        {
          "type": "choice",
          "prompt": "Welche Entscheidung entspricht dem Unterricht?",
          "options": [
            "Ich sage Bismillāh und esse von der Seite vor mir.",
            "Ich greife ungefragt quer durch die Schüssel."
          ],
          "correct": 0,
          "hint": "Der Prophet ﷺ erklärte die Tischsitten freundlich einem Kind.",
          "explain": "Ich sage Bismillāh und esse achtsam."
        },
        {
          "type": "text",
          "prompt": "Welche drei Handlungen lehrte der Prophet ﷺ dem Jungen ʿUmar ibn Abī Salamah?",
          "sample": "Allahs Namen nennen, mit der rechten Hand essen und von dem essen, was vor einem liegt.",
          "hint": "Vergleiche Qurʾān 7:31 mit al-Buḫārī 5376."
        },
        {
          "type": "text",
          "prompt": "Beschreibe eine sichere Alltagssituation zu „Essen mit Bismillāh“ und begründe sie mit beiden Belegen.",
          "sample": "Allahs Namen nennen, mit der rechten Hand essen und von dem essen, was vor einem liegt.",
          "hint": "Der Prophet ﷺ erklärte die Tischsitten freundlich einem Kind."
        }
      ]
    }
  },
  "akhlaq-tiere-barmherzigkeit": {
    "id": "akhlaq-tiere-barmherzigkeit",
    "subject": "akhlaq",
    "topic": "Barmherzig zu Tieren",
    "title": "Tiere schützen · Raḥmah",
    "lead": "Allahs Geschöpfe sollen wir freundlich behandeln.",
    "goal": "Ich gehe achtsam mit Tieren um und hole bei Bedarf Erwachsene dazu.",
    "quran": {
      "surah": 6,
      "ayah": 38,
      "label": "Sūrat al-Anʿām · 6:38",
      "arabic": "وَمَا مِن دَابَّةٍ فِي الْأَرْضِ وَلَا طَائِرٍ يَطِيرُ بِجَنَاحَيْهِ إِلَّا أُمَمٌ أَمْثَالُكُمْ",
      "meaning": "Auch die Tiere auf der Erde und die Vögel sind Gemeinschaften wie ihr.",
      "excerpt": true
    },
    "hadith": {
      "source": "Ṣaḥīḥ al-Buḫārī, Nr. 2363; Ṣaḥīḥ Muslim, Nr. 2244",
      "text": "Der Prophet ﷺ berichtete von einem Mann, der einem durstigen Hund Wasser gab, und erklärte, dass es für Güte gegenüber Lebewesen Lohn gibt."
    },
    "sourceAudit": {
      "hadithUrl": "https://sunnah.com/bukhari:2363",
      "quranReference": "6:38",
      "hadithNumber": "2363",
      "authenticity": "Ṣaḥīḥ (al-Buḫārī)",
      "quranTextType": "excerpt",
      "verifiedDate": "2026-10-11"
    },
    "hint": "Bei fremden oder verletzten Tieren holen Kinder zuerst Erwachsene zu Hilfe.",
    "sample": "Ich tue Tieren nicht weh und bitte bei einem hilfsbedürftigen Tier um Hilfe.",
    "ageText": {
      "4-5": {
        "intro": "Tiere können hungrig, durstig oder ängstlich sein.",
        "lines": [
          "Ein Vogel braucht Ruhe und einen sicheren Platz.",
          "Ich werfe nicht nach Tieren und ärgere sie nicht.",
          "Wenn ein Tier Hilfe braucht, rufe ich einen Erwachsenen.",
          "Wir können freundlich sein, ohne fremde Tiere anzufassen."
        ],
        "evidence": "Allah spricht im Qurʾān auch über Tiere. Der Prophet ﷺ lobte die Hilfe für einen durstigen Hund."
      },
      "6-8": {
        "intro": "Barmherzigkeit bedeutet: Ich nehme die Bedürfnisse eines Tieres ernst.",
        "lines": [
          "Allah nennt Tiere und Vögel Gemeinschaften.",
          "Der Prophet ﷺ berichtete über die Hilfe für einen durstigen Hund.",
          "Ich erschrecke oder verletze Tiere nicht.",
          "Bei fremden, kranken oder verletzten Tieren hole ich Erwachsene."
        ],
        "evidence": "Qurʾān 6:38 nennt Tiere als Gemeinschaften. Der authentische Ḥadīṯ 2363 zeigt, dass Güte zu einem Tier eine gute Tat sein kann."
      },
      "9-10": {
        "intro": "Wir untersuchen, was die Quellen über den Umgang mit Tieren lehren.",
        "lines": [
          "Qurʾān 6:38 beschreibt Tiere und Vögel als Gemeinschaften.",
          "In al-Buḫārī 2363 wird berichtet, wie ein Mann einem durstigen Hund Wasser gab.",
          "Der Prophet ﷺ bestätigte den Lohn für Barmherzigkeit gegenüber Lebewesen.",
          "Im Alltag achten wir auf Tierwohl und Sicherheit und bitten bei Gefahr Erwachsene um Hilfe."
        ],
        "evidence": "Der Qurʾān-Vers beschreibt die Schöpfung; der Ḥadīṯ belegt den Lohn guter Behandlung. Daraus folgt keine Aufforderung, unbekannte Tiere selbst anzufassen."
      }
    },
    "lines": [
      "Allah nennt Tiere und Vögel Gemeinschaften.",
      "Der Prophet ﷺ berichtete über die Hilfe für einen durstigen Hund.",
      "Ich erschrecke oder verletze Tiere nicht.",
      "Bei fremden, kranken oder verletzten Tieren hole ich Erwachsene."
    ],
    "questions": {
      "4-5": [
        {
          "type": "choice",
          "prompt": "Was ist hier eine gute Handlung?",
          "options": [
            "Ich halte Abstand und bitte einen Erwachsenen, sicher zu helfen.",
            "Ich ärgere den Hund oder renne auf ihn zu."
          ],
          "correct": 0,
          "hint": "Bei fremden oder verletzten Tieren holen Kinder zuerst Erwachsene zu Hilfe.",
          "explain": "Ich tue Tieren nicht weh und bitte bei einem hilfsbedürftigen Tier um Hilfe."
        },
        {
          "type": "choice",
          "prompt": "Was möchtest du dir heute merken?",
          "options": [
            "Ich tue Tieren nicht weh und bitte bei einem hilfsbedürftigen Tier um Hilfe.",
            "Ich darf andere absichtlich verletzen."
          ],
          "correct": 0,
          "hint": "Allahs Geschöpfe sollen wir freundlich behandeln.",
          "explain": "Ich gehe achtsam mit Tieren um und hole bei Bedarf Erwachsene dazu."
        }
      ],
      "6-8": [
        {
          "type": "choice",
          "prompt": "Welche Handlung passt zu unserem Unterricht?",
          "options": [
            "Ich halte Abstand und bitte einen Erwachsenen, sicher zu helfen.",
            "Ich ärgere den Hund oder renne auf ihn zu."
          ],
          "correct": 0,
          "hint": "Bei fremden oder verletzten Tieren holen Kinder zuerst Erwachsene zu Hilfe.",
          "explain": "Ich tue Tieren nicht weh und bitte bei einem hilfsbedürftigen Tier um Hilfe."
        },
        {
          "type": "text",
          "prompt": "Erkläre an einem eigenen Beispiel: Barmherzig zu Tieren.",
          "sample": "Ich gehe achtsam mit Tieren um und hole bei Bedarf Erwachsene dazu.",
          "hint": "Bei fremden oder verletzten Tieren holen Kinder zuerst Erwachsene zu Hilfe."
        },
        {
          "type": "choice",
          "prompt": "Woher stammen die religiösen Belege?",
          "options": [
            "Aus dem Qurʾān und einer authentischen Überlieferung.",
            "Aus einer erfundenen Geschichte ohne Quelle."
          ],
          "correct": 0,
          "hint": "6:38 und Ṣaḥīḥ al-Buḫārī 2363",
          "explain": "Ich gehe achtsam mit Tieren um und hole bei Bedarf Erwachsene dazu."
        }
      ],
      "9-10": [
        {
          "type": "choice",
          "prompt": "Welche Entscheidung entspricht dem Unterricht?",
          "options": [
            "Ich halte Abstand und bitte einen Erwachsenen, sicher zu helfen.",
            "Ich ärgere den Hund oder renne auf ihn zu."
          ],
          "correct": 0,
          "hint": "Bei fremden oder verletzten Tieren holen Kinder zuerst Erwachsene zu Hilfe.",
          "explain": "Ich tue Tieren nicht weh und bitte bei einem hilfsbedürftigen Tier um Hilfe."
        },
        {
          "type": "text",
          "prompt": "Warum passen Qurʾān 6:38 und der Ḥadīṯ über den durstigen Hund zusammen?",
          "sample": "Der Qurʾān erinnert an Tiergemeinschaften, und die Sunnah lehrt Barmherzigkeit und gute Behandlung.",
          "hint": "Vergleiche Qurʾān 6:38 mit al-Buḫārī 2363."
        },
        {
          "type": "text",
          "prompt": "Beschreibe eine sichere Alltagssituation zu „Barmherzig zu Tieren“ und begründe sie mit beiden Belegen.",
          "sample": "Der Qurʾān erinnert an Tiergemeinschaften, und die Sunnah lehrt Barmherzigkeit und gute Behandlung.",
          "hint": "Bei fremden oder verletzten Tieren holen Kinder zuerst Erwachsene zu Hilfe."
        }
      ]
    }
  },
  "adab-nachbarn-gutes": {
    "id": "adab-nachbarn-gutes",
    "subject": "adab",
    "topic": "Gute Nachbarschaft",
    "title": "Nachbarn · Freundlich und rücksichtsvoll",
    "lead": "Auch unseren Nachbarn begegnen wir freundlich.",
    "goal": "Ich nehme Rücksicht und helfe, wenn es sicher und möglich ist.",
    "quran": {
      "surah": 4,
      "ayah": 36,
      "label": "Sūrat an-Nisāʾ · 4:36",
      "arabic": "وَالْجَارِ ذِي الْقُرْبَىٰ وَالْجَارِ الْجُنُبِ",
      "meaning": "Und seid gut zu nahen und ferneren Nachbarn.",
      "excerpt": true
    },
    "hadith": {
      "source": "Ṣaḥīḥ al-Buḫārī, Nr. 6014; Ṣaḥīḥ Muslim, Nr. 2624",
      "text": "Der Prophet ﷺ sagte, dass Ǧibrīl ihm die gute Behandlung des Nachbarn so oft ans Herz legte, dass er annahm, der Nachbar könne erbberechtigt werden."
    },
    "sourceAudit": {
      "hadithUrl": "https://dorar.net/hadith/sharh/13223",
      "quranReference": "4:36",
      "hadithNumber": "6014",
      "authenticity": "Ṣaḥīḥ (al-Buḫārī)",
      "quranTextType": "excerpt",
      "verifiedDate": "2026-10-11"
    },
    "hint": "Freundlichkeit heißt nicht, dass Kinder die Tür öffnen oder Fremde allein besuchen sollen.",
    "sample": "Ich grüße höflich und nehme Rücksicht auf andere im Haus.",
    "ageText": {
      "4-5": {
        "intro": "Auch Menschen, die neben uns wohnen, verdienen freundliche Worte.",
        "lines": [
          "Unsere Nachbarn wohnen in unserer Nähe.",
          "Ich kann freundlich grüßen, wenn meine Eltern dabei sind.",
          "Ich bin achtsam und mache niemandem absichtlich Angst.",
          "Bei Fragen an fremde Menschen bitte ich meine Eltern um Hilfe."
        ],
        "evidence": "Allah nennt die guten Rechte der Nachbarn. Der Prophet ﷺ zeigte, wie wichtig freundliche Nachbarschaft ist."
      },
      "6-8": {
        "intro": "Wir lernen, warum wir auf Nachbarn Rücksicht nehmen.",
        "lines": [
          "Der Qurʾān erwähnt ausdrücklich nahe und fernere Nachbarn.",
          "Der Prophet ﷺ betonte wiederholt die Rechte des Nachbarn.",
          "Wir sprechen höflich und vermeiden absichtliche Störungen.",
          "Wenn jemand Hilfe braucht, fragen wir zuerst unsere Eltern."
        ],
        "evidence": "In Qurʾān 4:36 wird gutes Verhalten zu Nachbarn genannt. Ṣaḥīḥ al-Buḫārī 6014 zeigt, wie nachdrücklich dieses Recht ist."
      },
      "9-10": {
        "intro": "Wir unterscheiden höfliche Alltagshandlungen und den starken Nachbarschaftsauftrag in den Quellen.",
        "lines": [
          "Qurʾān 4:36 nennt sowohl Nachbarn mit Nähe als auch fernere Nachbarn.",
          "Ǧibrīl erinnerte den Propheten ﷺ häufig an die Rechte der Nachbarn.",
          "Deshalb vermeide ich unnötige Störungen und begegne Menschen respektvoll.",
          "Als Kind achte ich auf Sicherheit: Besuche und Hilfe erfolgen mit Zustimmung der Eltern."
        ],
        "evidence": "Der Ḥadīṯ 6014 beschreibt eine wiederholte Mahnung durch Ǧibrīl. Er behauptet nicht, dass Nachbarn tatsächlich automatisch erben."
      }
    },
    "lines": [
      "Der Qurʾān erwähnt ausdrücklich nahe und fernere Nachbarn.",
      "Der Prophet ﷺ betonte wiederholt die Rechte des Nachbarn.",
      "Wir sprechen höflich und vermeiden absichtliche Störungen.",
      "Wenn jemand Hilfe braucht, fragen wir zuerst unsere Eltern."
    ],
    "questions": {
      "4-5": [
        {
          "type": "choice",
          "prompt": "Was ist hier eine gute Handlung?",
          "options": [
            "Ich spreche leise und nehme Rücksicht.",
            "Ich schreie absichtlich vor der Nachbartür."
          ],
          "correct": 0,
          "hint": "Freundlichkeit heißt nicht, dass Kinder die Tür öffnen oder Fremde allein besuchen sollen.",
          "explain": "Ich grüße höflich und nehme Rücksicht auf andere im Haus."
        },
        {
          "type": "choice",
          "prompt": "Was möchtest du dir heute merken?",
          "options": [
            "Ich grüße höflich und nehme Rücksicht auf andere im Haus.",
            "Ich darf andere absichtlich verletzen."
          ],
          "correct": 0,
          "hint": "Auch unseren Nachbarn begegnen wir freundlich.",
          "explain": "Ich nehme Rücksicht und helfe, wenn es sicher und möglich ist."
        }
      ],
      "6-8": [
        {
          "type": "choice",
          "prompt": "Welche Handlung passt zu unserem Unterricht?",
          "options": [
            "Ich spreche leise und nehme Rücksicht.",
            "Ich schreie absichtlich vor der Nachbartür."
          ],
          "correct": 0,
          "hint": "Freundlichkeit heißt nicht, dass Kinder die Tür öffnen oder Fremde allein besuchen sollen.",
          "explain": "Ich grüße höflich und nehme Rücksicht auf andere im Haus."
        },
        {
          "type": "text",
          "prompt": "Erkläre an einem eigenen Beispiel: Gute Nachbarschaft.",
          "sample": "Ich nehme Rücksicht und helfe, wenn es sicher und möglich ist.",
          "hint": "Freundlichkeit heißt nicht, dass Kinder die Tür öffnen oder Fremde allein besuchen sollen."
        },
        {
          "type": "choice",
          "prompt": "Woher stammen die religiösen Belege?",
          "options": [
            "Aus dem Qurʾān und einer authentischen Überlieferung.",
            "Aus einer erfundenen Geschichte ohne Quelle."
          ],
          "correct": 0,
          "hint": "4:36 und Ṣaḥīḥ al-Buḫārī 6014",
          "explain": "Ich nehme Rücksicht und helfe, wenn es sicher und möglich ist."
        }
      ],
      "9-10": [
        {
          "type": "choice",
          "prompt": "Welche Entscheidung entspricht dem Unterricht?",
          "options": [
            "Ich spreche leise und nehme Rücksicht.",
            "Ich schreie absichtlich vor der Nachbartür."
          ],
          "correct": 0,
          "hint": "Freundlichkeit heißt nicht, dass Kinder die Tür öffnen oder Fremde allein besuchen sollen.",
          "explain": "Ich grüße höflich und nehme Rücksicht auf andere im Haus."
        },
        {
          "type": "text",
          "prompt": "Wie verdeutlicht Ṣaḥīḥ al-Buḫārī 6014 die Rechte des Nachbarn?",
          "sample": "Ǧibrīl mahnte den Propheten ﷺ so oft zu den Nachbarrechten, dass er an ein mögliches Erbrecht dachte; er sagt nicht, dass der Nachbar tatsächlich erbt.",
          "hint": "Vergleiche Qurʾān 4:36 mit al-Buḫārī 6014."
        },
        {
          "type": "text",
          "prompt": "Beschreibe eine sichere Alltagssituation zu „Gute Nachbarschaft“ und begründe sie mit beiden Belegen.",
          "sample": "Ǧibrīl mahnte den Propheten ﷺ so oft zu den Nachbarrechten, dass er an ein mögliches Erbrecht dachte; er sagt nicht, dass der Nachbar tatsächlich erbt.",
          "hint": "Freundlichkeit heißt nicht, dass Kinder die Tür öffnen oder Fremde allein besuchen sollen."
        }
      ]
    }
  },
  "aqidah-dua-allah-bitten": {
    "id": "aqidah-dua-allah-bitten",
    "subject": "aqidah",
    "topic": "Allah um Hilfe bitten",
    "title": "Duʿāʾ · Allah um Hilfe bitten",
    "lead": "In unserem Bittgebet wenden wir uns an Allah.",
    "goal": "Ich weiß: Duʿāʾ richten wir an Allah und bleiben geduldig.",
    "quran": {
      "surah": 1,
      "ayah": 5,
      "label": "Sūrat al-Fātiḥah · 1:5",
      "arabic": "إِيَّاكَ نَعْبُدُ وَإِيَّاكَ نَسْتَعِينُ",
      "meaning": "Dir allein dienen wir, und Dich allein bitten wir um Hilfe.",
      "excerpt": false
    },
    "hadith": {
      "source": "Ṣaḥīḥ al-Buḫārī, Nr. 6340; Ṣaḥīḥ Muslim, Nr. 2735",
      "text": "Der Prophet ﷺ lehrte, beim Bittgebet nicht ungeduldig zu werden und nicht vorschnell zu sagen, man habe gebetet, aber keine Antwort erhalten."
    },
    "sourceAudit": {
      "hadithUrl": "https://sunnah.com/bukhari:6340",
      "quranReference": "1:5",
      "hadithNumber": "6340",
      "authenticity": "Ṣaḥīḥ (al-Buḫārī)",
      "quranTextType": "complete",
      "verifiedDate": "2026-10-11"
    },
    "hint": "Menschen um alltägliche Hilfe zu bitten ist etwas anderes als das Bittgebet als Anbetung an Allah.",
    "sample": "Ich bitte Allah im Duʿāʾ und darf Menschen um praktische Hilfe bitten.",
    "ageText": {
      "4-5": {
        "intro": "Allah hört unser Bittgebet. Wir dürfen Ihn bitten.",
        "lines": [
          "Wenn ich Duʿāʾ mache, bitte ich Allah.",
          "Ich kann Allah mit einfachen eigenen Worten bitten.",
          "Wenn ich Hilfe brauche, darf ich auch Mama oder Papa fragen.",
          "Ich bleibe geduldig und vertraue Allah."
        ],
        "evidence": "In al-Fātiḥah bitten wir Allah um Hilfe. Der Prophet ﷺ lehrte uns, im Duʿāʾ geduldig zu sein."
      },
      "6-8": {
        "intro": "Wir lernen, was Duʿāʾ ist und wie wir geduldig bleiben.",
        "lines": [
          "Al-Fātiḥah 1:5 lehrt uns, Allah allein zu dienen und Ihn um Hilfe zu bitten.",
          "Duʿāʾ ist eine Anbetung und richtet sich an Allah.",
          "Menschen dürfen wir um alltägliche Hilfe bitten, zum Beispiel beim Lernen.",
          "Beim Bittgebet bleiben wir geduldig und geben nicht auf."
        ],
        "evidence": "Qurʾān 1:5 lehrt die Hinwendung zu Allah; in Ṣaḥīḥ al-Buḫārī 6340 wird davor gewarnt, ein Bittgebet aus Ungeduld aufzugeben."
      },
      "9-10": {
        "intro": "Wir unterscheiden Duʿāʾ als ʿIbādah und alltägliche praktische Hilfe.",
        "lines": [
          "In al-Fātiḥah 1:5 sagen wir: Dir allein dienen wir und Dich allein bitten wir um Hilfe.",
          "Ein an Allah gerichtetes Bittgebet gehört zur Anbetung.",
          "Wir dürfen Menschen um natürliche Hilfe bitten, beispielsweise um Rat oder Unterstützung.",
          "Der Prophet ﷺ warnte davor, aus Ungeduld zu behaupten, unser Bittgebet sei vergeblich."
        ],
        "evidence": "Der Qurʾān spricht von ausschließlicher Anbetung und Hilfe durch Allah; der authentische Ḥadīṯ 6340 lehrt Geduld im Duʿāʾ. Alltagshilfe durch Menschen wird dadurch nicht verboten."
      }
    },
    "lines": [
      "Al-Fātiḥah 1:5 lehrt uns, Allah allein zu dienen und Ihn um Hilfe zu bitten.",
      "Duʿāʾ ist eine Anbetung und richtet sich an Allah.",
      "Menschen dürfen wir um alltägliche Hilfe bitten, zum Beispiel beim Lernen.",
      "Beim Bittgebet bleiben wir geduldig und geben nicht auf."
    ],
    "questions": {
      "4-5": [
        {
          "type": "choice",
          "prompt": "Was ist hier eine gute Handlung?",
          "options": [
            "Ich bitte Allah um Hilfe und frage auch meine Eltern oder Lehrkraft.",
            "Ich glaube, nach einem Duʿāʾ darf ich niemanden mehr um praktische Hilfe bitten."
          ],
          "correct": 0,
          "hint": "Menschen um alltägliche Hilfe zu bitten ist etwas anderes als das Bittgebet als Anbetung an Allah.",
          "explain": "Ich bitte Allah im Duʿāʾ und darf Menschen um praktische Hilfe bitten."
        },
        {
          "type": "choice",
          "prompt": "Was möchtest du dir heute merken?",
          "options": [
            "Ich bitte Allah im Duʿāʾ und darf Menschen um praktische Hilfe bitten.",
            "Ich darf andere absichtlich verletzen."
          ],
          "correct": 0,
          "hint": "In unserem Bittgebet wenden wir uns an Allah.",
          "explain": "Ich weiß: Duʿāʾ richten wir an Allah und bleiben geduldig."
        }
      ],
      "6-8": [
        {
          "type": "choice",
          "prompt": "Welche Handlung passt zu unserem Unterricht?",
          "options": [
            "Ich bitte Allah um Hilfe und frage auch meine Eltern oder Lehrkraft.",
            "Ich glaube, nach einem Duʿāʾ darf ich niemanden mehr um praktische Hilfe bitten."
          ],
          "correct": 0,
          "hint": "Menschen um alltägliche Hilfe zu bitten ist etwas anderes als das Bittgebet als Anbetung an Allah.",
          "explain": "Ich bitte Allah im Duʿāʾ und darf Menschen um praktische Hilfe bitten."
        },
        {
          "type": "text",
          "prompt": "Erkläre an einem eigenen Beispiel: Allah um Hilfe bitten.",
          "sample": "Ich weiß: Duʿāʾ richten wir an Allah und bleiben geduldig.",
          "hint": "Menschen um alltägliche Hilfe zu bitten ist etwas anderes als das Bittgebet als Anbetung an Allah."
        },
        {
          "type": "choice",
          "prompt": "Woher stammen die religiösen Belege?",
          "options": [
            "Aus dem Qurʾān und einer authentischen Überlieferung.",
            "Aus einer erfundenen Geschichte ohne Quelle."
          ],
          "correct": 0,
          "hint": "1:5 und Ṣaḥīḥ al-Buḫārī 6340",
          "explain": "Ich weiß: Duʿāʾ richten wir an Allah und bleiben geduldig."
        }
      ],
      "9-10": [
        {
          "type": "choice",
          "prompt": "Welche Entscheidung entspricht dem Unterricht?",
          "options": [
            "Ich bitte Allah um Hilfe und frage auch meine Eltern oder Lehrkraft.",
            "Ich glaube, nach einem Duʿāʾ darf ich niemanden mehr um praktische Hilfe bitten."
          ],
          "correct": 0,
          "hint": "Menschen um alltägliche Hilfe zu bitten ist etwas anderes als das Bittgebet als Anbetung an Allah.",
          "explain": "Ich bitte Allah im Duʿāʾ und darf Menschen um praktische Hilfe bitten."
        },
        {
          "type": "text",
          "prompt": "Was ist der Unterschied zwischen Duʿāʾ und der Bitte an einen Menschen, etwas zu erklären?",
          "sample": "Duʿāʾ ist eine an Allah gerichtete Anbetung. Eine alltägliche Bitte um praktische Hilfe an Menschen ist etwas anderes.",
          "hint": "Vergleiche Qurʾān 1:5 mit al-Buḫārī 6340."
        },
        {
          "type": "text",
          "prompt": "Beschreibe eine sichere Alltagssituation zu „Allah um Hilfe bitten“ und begründe sie mit beiden Belegen.",
          "sample": "Duʿāʾ ist eine an Allah gerichtete Anbetung. Eine alltägliche Bitte um praktische Hilfe an Menschen ist etwas anderes.",
          "hint": "Menschen um alltägliche Hilfe zu bitten ist etwas anderes als das Bittgebet als Anbetung an Allah."
        }
      ]
    }
  }
};
for(const [id,lesson] of Object.entries(additions)){
 if(existing[id]||lesson.id!==id)throw Error("KIDS V22: duplicate or invalid lesson "+id);
 for(const age of ["4-5","6-8","9-10"]){
  if(lesson.ageText[age].lines.length!==4||lesson.questions[age].length<2)
   throw Error("KIDS V22: age-specific instruction incomplete: "+id+" "+age);
 }
}
window.DARKidsAcademyCurriculum=Object.freeze({...existing,...additions});
window.DARKidsAcademyCurriculumV22=Object.freeze({version:"20261011-v22",count:4,ids:Object.keys(additions),religiousSourcesVerified:true,voiceRecordingsApproved:false});
})();
