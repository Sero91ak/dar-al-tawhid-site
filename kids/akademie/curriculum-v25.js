/* DĀR AL TAWḤĪD KIDS V25: seven reviewed Qurʾān + Ṣaḥīḥ basics.
 * Age 4–5 / 6–8 / 9–10 are distinct. Statements attributed to Companions are
 * narrator provenance ONLY; no fabricated independent Ṣaḥābah/Salaf athār.
 * German summaries are paraphrases and never replace original Arabic recitation.
 * Neither public Master audio nor expensive TTS generation is implied.
 */
(function(){
"use strict";
const old=window.DARKidsAcademyCurriculum;
if(!old||!old["aqidah-dua-allah-bitten"])return;
const additions={
  "aqidah-tawhid-recht-allahs": {
    "id": "aqidah-tawhid-recht-allahs",
    "pillar": "tawhid",
    "subject": "aqidah",
    "topic": "Allah allein anbeten",
    "title": "Tawḥīd · Allahs Recht",
    "lead": "Allah allein verdient unsere Anbetung.",
    "goal": "Ich lerne, dass wir Allah allein anbeten.",
    "quran": {
      "surah": 51,
      "ayah": 56,
      "label": "Sūrat aḏ-Ḏāriyāt · 51:56",
      "arabic": "وَمَا خَلَقْتُ الْجِنَّ وَالْإِنسَ إِلَّا لِيَعْبُدُونِ",
      "meaning": "Ich habe die Ǧinn und die Menschen nur erschaffen, damit sie Mir dienen.",
      "excerpt": false
    },
    "hadith": {
      "source": "Ṣaḥīḥ al-Buḫārī, Nr. 2856; Ṣaḥīḥ Muslim, Nr. 30 · überliefert von Muʿāḏ ibn Ǧabal",
      "text": "Der Prophet ﷺ erklärte Muʿāḏ ibn Ǧabal, dass Allahs Recht gegenüber den Menschen darin besteht, dass sie Ihn anbeten und Ihm nichts beigesellen."
    },
    "ageText": {
      "4-5": {
        "intro": "Allah hat uns erschaffen. Wir beten Allah allein an.",
        "lines": [
          "Allah ist unser Schöpfer.",
          "Wir dürfen Allah danken.",
          "Wenn wir Duʿāʾ machen, bitten wir Allah.",
          "Das nennen wir Tawḥīd: Allah allein anbeten."
        ],
        "evidence": "Im Qurʾān steht, dass wir Allah dienen sollen. Der Prophet ﷺ lehrte Muʿāḏ, dass wir Allah allein anbeten."
      },
      "6-8": {
        "intro": "Wir lernen, warum die Anbetung allein Allah gehört.",
        "lines": [
          "Allah hat die Menschen und die Ǧinn erschaffen, um Ihm zu dienen.",
          "Anbetung richtet sich allein an Allah.",
          "Duʿāʾ gehört zur Anbetung; gewöhnliche Hilfe dürfen wir von Menschen erbitten.",
          "Der Prophet ﷺ erklärte Muʿāḏ das Recht Allahs."
        ],
        "evidence": "Qurʾān 51:56 nennt den Grund für unsere Erschaffung. Der authentische Ḥadīṯ 2856 erklärt, dass Allah allein angebetet wird."
      },
      "9-10": {
        "intro": "Wir verbinden Qurʾān 51:56 mit dem Ṣaḥīḥ-Ḥadīṯ von Muʿāḏ ibn Ǧabal.",
        "lines": [
          "Allah beschreibt in Sūrat aḏ-Ḏāriyāt 51:56 die Anbetung als Zweck der Erschaffung.",
          "Muʿāḏ ibn Ǧabal überlieferte, wie der Prophet ﷺ Allahs Recht erklärte.",
          "Tawḥīd bedeutet, die Anbetung ausschließlich Allah zuzuwenden.",
          "Wir unterscheiden religiöse Anbetung von normaler gegenseitiger Hilfe."
        ],
        "evidence": "Der Qurʾān nennt die Anbetung Allahs. In al-Buḫārī 2856 wird das Recht Allahs ausdrücklich erklärt; darüber urteilen Kinder nicht über andere Menschen."
      }
    },
    "hint": "Tawḥīd heißt: Allah allein anbeten.",
    "sample": "Ich richte mein Bittgebet an Allah und kann Menschen um praktische Hilfe bitten.",
    "sourceAudit": {
      "hadithUrl": "https://dorar.net/hadith/sharh/11568",
      "hadithNumber": "2856",
      "quranReference": "51:56",
      "authenticity": "Ṣaḥīḥ",
      "quranTextType": "complete",
      "verifiedDate": "2026-10-11",
      "note": "German translations and lesson illustrations are educational paraphrases, not original prophetic words."
    },
    "lines": [
      "Allah hat die Menschen und die Ǧinn erschaffen, um Ihm zu dienen.",
      "Anbetung richtet sich allein an Allah.",
      "Duʿāʾ gehört zur Anbetung; gewöhnliche Hilfe dürfen wir von Menschen erbitten.",
      "Der Prophet ﷺ erklärte Muʿāḏ das Recht Allahs."
    ],
    "questions": {
      "4-5": [
        {
          "type": "choice",
          "prompt": "Was kannst du hier Gutes tun?",
          "options": [
            "Ich danke Allah und mache ein Bittgebet.",
            "Ich bete einen Gegenstand an."
          ],
          "correct": 0,
          "hint": "Tawḥīd heißt: Allah allein anbeten.",
          "explain": "Ich richte mein Bittgebet an Allah und kann Menschen um praktische Hilfe bitten."
        },
        {
          "type": "choice",
          "prompt": "Was merken wir uns?",
          "options": [
            "Ich richte mein Bittgebet an Allah und kann Menschen um praktische Hilfe bitten.",
            "Ich muss andere absichtlich verletzen."
          ],
          "correct": 0,
          "hint": "Allah allein verdient unsere Anbetung.",
          "explain": "Ich lerne, dass wir Allah allein anbeten."
        }
      ],
      "6-8": [
        {
          "type": "choice",
          "prompt": "Welche Handlung passt zu dieser Lehre?",
          "options": [
            "Ich danke Allah und mache ein Bittgebet.",
            "Ich bete einen Gegenstand an."
          ],
          "correct": 0,
          "hint": "Tawḥīd heißt: Allah allein anbeten.",
          "explain": "Ich richte mein Bittgebet an Allah und kann Menschen um praktische Hilfe bitten."
        },
        {
          "type": "text",
          "prompt": "Erkläre an einem eigenen Beispiel: Allah allein anbeten.",
          "sample": "Ich lerne, dass wir Allah allein anbeten.",
          "hint": "Tawḥīd heißt: Allah allein anbeten."
        },
        {
          "type": "choice",
          "prompt": "Woher stammen die religiösen Belege?",
          "options": [
            "Aus dem Qurʾān und einer authentischen Überlieferung.",
            "Aus einer ausgedachten Geschichte ohne Quelle."
          ],
          "correct": 0,
          "hint": "Qurʾān 51:56 · Ṣaḥīḥ al-Buḫārī, Nr. 2856; Ṣaḥīḥ Muslim, Nr. 30 · überliefert von Muʿāḏ ibn Ǧabal",
          "explain": "Ich lerne, dass wir Allah allein anbeten."
        }
      ],
      "9-10": [
        {
          "type": "choice",
          "prompt": "Welche Handlung ist durch den Unterricht begründet?",
          "options": [
            "Ich danke Allah und mache ein Bittgebet.",
            "Ich bete einen Gegenstand an."
          ],
          "correct": 0,
          "hint": "Tawḥīd heißt: Allah allein anbeten.",
          "explain": "Ich richte mein Bittgebet an Allah und kann Menschen um praktische Hilfe bitten."
        },
        {
          "type": "text",
          "prompt": "Wie ergänzen sich Qurʾān 51:56 und die Überlieferung von Muʿāḏ?",
          "sample": "Beide lehren Allahs Recht auf die Anbetung. Der Ḥadīṯ erläutert das ausschließliche Anbeten Allahs.",
          "hint": "Vergleiche Qurʾān 51:56 mit der authentischen Überlieferung."
        },
        {
          "type": "text",
          "prompt": "Beschreibe eine sichere Alltagshandlung zu Allah allein anbeten und erkläre, wie sie zu den Quellen passt.",
          "sample": "Ich richte mein Bittgebet an Allah und kann Menschen um praktische Hilfe bitten.",
          "hint": "Tawḥīd heißt: Allah allein anbeten."
        }
      ]
    }
  },
  "aqidah-iman-sechs-grundlagen": {
    "id": "aqidah-iman-sechs-grundlagen",
    "pillar": "iman",
    "subject": "aqidah",
    "topic": "Die sechs Glaubenssäulen",
    "title": "Īmān · Die sechs Grundlagen",
    "lead": "Unser Īmān hat sechs wichtige Grundlagen.",
    "goal": "Ich lerne die sechs Glaubensgrundlagen in meinem Tempo.",
    "quran": {
      "surah": 2,
      "ayah": 285,
      "label": "Sūrat al-Baqarah · 2:285",
      "arabic": "كُلٌّ آمَنَ بِاللَّهِ وَمَلَائِكَتِهِ وَكُتُبِهِ وَرُسُلِهِ",
      "meaning": "Alle glauben an Allah, Seine Engel, Seine Bücher und Seine Gesandten.",
      "excerpt": true
    },
    "hadith": {
      "source": "Ṣaḥīḥ Muslim, Nr. 8 · Ḥadīṯ Ǧibrīl, überliefert von ʿUmar ibn al-Ḫaṭṭāb",
      "text": "Im Ḥadīṯ Ǧibrīl erläuterte der Prophet ﷺ die sechs Grundlagen des Īmān: Allah, Engel, Bücher, Gesandte, Jüngster Tag und Allahs Bestimmung."
    },
    "ageText": {
      "4-5": {
        "intro": "Īmān heißt Glaube. Wir lernen heute, dass Allah uns Glauben lehrt.",
        "lines": [
          "Wir glauben an Allah.",
          "Allah hat Engel erschaffen.",
          "Allah schickte Seine Botschaften durch Gesandte.",
          "Die übrigen Glaubensgrundlagen lernen wir Schritt für Schritt."
        ],
        "evidence": "Der Qurʾān spricht vom Glauben an Allah, die Engel, Bücher und Gesandten. Der Prophet ﷺ erklärte die Glaubensgrundlagen."
      },
      "6-8": {
        "intro": "Der Prophet ﷺ erklärte, dass Īmān sechs wichtige Grundlagen hat.",
        "lines": [
          "Wir glauben an Allah und Seine Engel.",
          "Wir glauben an Allahs Bücher und Seine Gesandten.",
          "Wir glauben an den Jüngsten Tag.",
          "Wir glauben an Allahs Bestimmung und fragen bei schwierigen Fragen nach."
        ],
        "evidence": "Qurʾān 2:285 nennt mehrere Glaubensgrundlagen. Der authentische Ḥadīṯ Ǧibrīl nennt sie vollständig als sechs."
      },
      "9-10": {
        "intro": "Wir lernen die sechs Glaubensgrundlagen mit Qurʾān 2:285 und Ṣaḥīḥ Muslim 8.",
        "lines": [
          "Īmān an Allah ist eine der sechs Grundlagen des Glaubens.",
          "Zu ihnen zählen außerdem Engel, die Bücher und die Gesandten Allahs.",
          "Die weiteren Grundlagen sind der Jüngste Tag und der Glaube an al-Qadar.",
          "Wir unterscheiden die verkürzte Versstelle vom vollständigeren Ḥadīṯ Ǧibrīl."
        ],
        "evidence": "Der Textauszug aus 2:285 enthält vier Glaubensgegenstände. Muslim 8 nennt alle sechs; wir geben den Qurʾān nicht fälschlich als wörtliche Sechser-Liste wieder."
      }
    },
    "hint": "Īmān bedeutet Glaube. Schwierige Wörter kann dir der Begriffshelfer erklären.",
    "sample": "Ich kann die Glaubensgrundlagen nach und nach nennen.",
    "sourceAudit": {
      "hadithUrl": "https://sunnah.com/muslim:8a",
      "hadithNumber": "8",
      "quranReference": "2:285",
      "authenticity": "Ṣaḥīḥ",
      "quranTextType": "excerpt",
      "verifiedDate": "2026-10-11",
      "note": "German translations and lesson illustrations are educational paraphrases, not original prophetic words."
    },
    "lines": [
      "Wir glauben an Allah und Seine Engel.",
      "Wir glauben an Allahs Bücher und Seine Gesandten.",
      "Wir glauben an den Jüngsten Tag.",
      "Wir glauben an Allahs Bestimmung und fragen bei schwierigen Fragen nach."
    ],
    "questions": {
      "4-5": [
        {
          "type": "choice",
          "prompt": "Was kannst du hier Gutes tun?",
          "options": [
            "Ich erkläre freundlich: Īmān bedeutet Glaube.",
            "Ich lache die Frage aus."
          ],
          "correct": 0,
          "hint": "Īmān bedeutet Glaube. Schwierige Wörter kann dir der Begriffshelfer erklären.",
          "explain": "Ich kann die Glaubensgrundlagen nach und nach nennen."
        },
        {
          "type": "choice",
          "prompt": "Was merken wir uns?",
          "options": [
            "Ich kann die Glaubensgrundlagen nach und nach nennen.",
            "Ich muss andere absichtlich verletzen."
          ],
          "correct": 0,
          "hint": "Unser Īmān hat sechs wichtige Grundlagen.",
          "explain": "Ich lerne die sechs Glaubensgrundlagen in meinem Tempo."
        }
      ],
      "6-8": [
        {
          "type": "choice",
          "prompt": "Welche Handlung passt zu dieser Lehre?",
          "options": [
            "Ich erkläre freundlich: Īmān bedeutet Glaube.",
            "Ich lache die Frage aus."
          ],
          "correct": 0,
          "hint": "Īmān bedeutet Glaube. Schwierige Wörter kann dir der Begriffshelfer erklären.",
          "explain": "Ich kann die Glaubensgrundlagen nach und nach nennen."
        },
        {
          "type": "text",
          "prompt": "Erkläre an einem eigenen Beispiel: Die sechs Glaubenssäulen.",
          "sample": "Ich lerne die sechs Glaubensgrundlagen in meinem Tempo.",
          "hint": "Īmān bedeutet Glaube. Schwierige Wörter kann dir der Begriffshelfer erklären."
        },
        {
          "type": "choice",
          "prompt": "Woher stammen die religiösen Belege?",
          "options": [
            "Aus dem Qurʾān und einer authentischen Überlieferung.",
            "Aus einer ausgedachten Geschichte ohne Quelle."
          ],
          "correct": 0,
          "hint": "Qurʾān 2:285 · Ṣaḥīḥ Muslim, Nr. 8 · Ḥadīṯ Ǧibrīl, überliefert von ʿUmar ibn al-Ḫaṭṭāb",
          "explain": "Ich lerne die sechs Glaubensgrundlagen in meinem Tempo."
        }
      ],
      "9-10": [
        {
          "type": "choice",
          "prompt": "Welche Handlung ist durch den Unterricht begründet?",
          "options": [
            "Ich erkläre freundlich: Īmān bedeutet Glaube.",
            "Ich lache die Frage aus."
          ],
          "correct": 0,
          "hint": "Īmān bedeutet Glaube. Schwierige Wörter kann dir der Begriffshelfer erklären.",
          "explain": "Ich kann die Glaubensgrundlagen nach und nach nennen."
        },
        {
          "type": "text",
          "prompt": "Welche zwei Grundlagen ergänzt der Ḥadīṯ Ǧibrīl zu den vier im Versauszug genannten?",
          "sample": "Der Glaube an den Jüngsten Tag und an Allahs Bestimmung, al-Qadar.",
          "hint": "Vergleiche Qurʾān 2:285 mit der authentischen Überlieferung."
        },
        {
          "type": "text",
          "prompt": "Beschreibe eine sichere Alltagshandlung zu Die sechs Glaubenssäulen und erkläre, wie sie zu den Quellen passt.",
          "sample": "Ich kann die Glaubensgrundlagen nach und nach nennen.",
          "hint": "Īmān bedeutet Glaube. Schwierige Wörter kann dir der Begriffshelfer erklären."
        }
      ]
    }
  },
  "aqidah-ikhlas-warum-gutes-tun": {
    "id": "aqidah-ikhlas-warum-gutes-tun",
    "pillar": "ikhlas",
    "subject": "aqidah",
    "topic": "Gutes mit richtiger Absicht",
    "title": "Ikhlāṣ · Warum tue ich Gutes?",
    "lead": "Wir bemühen uns, Gutes für Allah zu tun.",
    "goal": "Ich übe eine gute Absicht, ohne auf Lob zu warten.",
    "quran": {
      "surah": 98,
      "ayah": 5,
      "label": "Sūrat al-Bayyinah · 98:5",
      "arabic": "وَمَا أُمِرُوا إِلَّا لِيَعْبُدُوا اللَّهَ مُخْلِصِينَ لَهُ الدِّينَ",
      "meaning": "Ihnen wurde aufgetragen, Allah zu dienen und Ihm gegenüber aufrichtig zu sein.",
      "excerpt": true
    },
    "hadith": {
      "source": "Ṣaḥīḥ al-Buḫārī, Nr. 1; Ṣaḥīḥ Muslim, Nr. 1907 · überliefert von ʿUmar ibn al-Ḫaṭṭāb",
      "text": "Der Prophet ﷺ erklärte, dass der Wert einer Handlung mit der Absicht zusammenhängt, mit der sie ausgeführt wird."
    },
    "ageText": {
      "4-5": {
        "intro": "Ich kann etwas Gutes tun, auch wenn niemand klatscht.",
        "lines": [
          "Ein Freund braucht Hilfe.",
          "Ich helfe, weil ich Gutes tun möchte.",
          "Ich muss dafür kein Geschenk bekommen.",
          "Das nennt man Ikhlāṣ: aufrichtig sein."
        ],
        "evidence": "Allah lehrt uns, Ihm aufrichtig zu dienen. Der Prophet ﷺ erklärte, dass die Absicht wichtig ist."
      },
      "6-8": {
        "intro": "Ikhlāṣ bedeutet, Gutes mit einer aufrichtigen Absicht zu tun.",
        "lines": [
          "Nicht jede gute Tat muss jemand bemerken.",
          "Ich kann helfen, ohne eine Belohnung von Menschen zu erwarten.",
          "Wenn ich gelobt werde, darf ich mich bedanken und bescheiden bleiben.",
          "Ich frage mich, warum ich etwas Gutes tue."
        ],
        "evidence": "Qurʾān 98:5 erinnert an aufrichtige Anbetung. In al-Buḫārī 1 erklärt der Prophet ﷺ die Bedeutung der Absicht."
      },
      "9-10": {
        "intro": "Wir unterscheiden die äußere Handlung von der Absicht dahinter.",
        "lines": [
          "Zwei Menschen können äußerlich dasselbe tun, obwohl ihre Absichten verschieden sind.",
          "Qurʾān 98:5 fordert die Aufrichtigkeit gegenüber Allah.",
          "Der Anfangsḥadīṯ in Ṣaḥīḥ al-Buḫārī erklärt die Bedeutung der Niyyah.",
          "Ikhlāṣ bedeutet nicht, Freundlichkeit abzulehnen; auch Lob dürfen wir höflich annehmen."
        ],
        "evidence": "Der Qurʾān betont aufrichtige Anbetung; al-Buḫārī 1 behandelt die Absicht. Wir fügen den Quellen keine erfundenen Gedanken oder angebliche Salaf-Zitate hinzu."
      }
    },
    "hint": "Niyyah heißt Absicht. Ikhlāṣ heißt Aufrichtigkeit.",
    "sample": "Ich helfe, weil ich Gutes für Allah tun möchte, nicht nur für Applaus.",
    "sourceAudit": {
      "hadithUrl": "https://dorar.net/hadith/sharh/3429",
      "hadithNumber": "1",
      "quranReference": "98:5",
      "authenticity": "Ṣaḥīḥ",
      "quranTextType": "excerpt",
      "verifiedDate": "2026-10-11",
      "note": "German translations and lesson illustrations are educational paraphrases, not original prophetic words."
    },
    "lines": [
      "Nicht jede gute Tat muss jemand bemerken.",
      "Ich kann helfen, ohne eine Belohnung von Menschen zu erwarten.",
      "Wenn ich gelobt werde, darf ich mich bedanken und bescheiden bleiben.",
      "Ich frage mich, warum ich etwas Gutes tue."
    ],
    "questions": {
      "4-5": [
        {
          "type": "choice",
          "prompt": "Was kannst du hier Gutes tun?",
          "options": [
            "Ich kann mich trotzdem über die gute Tat freuen.",
            "Ich werde gemein, weil niemand klatscht."
          ],
          "correct": 0,
          "hint": "Niyyah heißt Absicht. Ikhlāṣ heißt Aufrichtigkeit.",
          "explain": "Ich helfe, weil ich Gutes für Allah tun möchte, nicht nur für Applaus."
        },
        {
          "type": "choice",
          "prompt": "Was merken wir uns?",
          "options": [
            "Ich helfe, weil ich Gutes für Allah tun möchte, nicht nur für Applaus.",
            "Ich muss andere absichtlich verletzen."
          ],
          "correct": 0,
          "hint": "Wir bemühen uns, Gutes für Allah zu tun.",
          "explain": "Ich übe eine gute Absicht, ohne auf Lob zu warten."
        }
      ],
      "6-8": [
        {
          "type": "choice",
          "prompt": "Welche Handlung passt zu dieser Lehre?",
          "options": [
            "Ich kann mich trotzdem über die gute Tat freuen.",
            "Ich werde gemein, weil niemand klatscht."
          ],
          "correct": 0,
          "hint": "Niyyah heißt Absicht. Ikhlāṣ heißt Aufrichtigkeit.",
          "explain": "Ich helfe, weil ich Gutes für Allah tun möchte, nicht nur für Applaus."
        },
        {
          "type": "text",
          "prompt": "Erkläre an einem eigenen Beispiel: Gutes mit richtiger Absicht.",
          "sample": "Ich übe eine gute Absicht, ohne auf Lob zu warten.",
          "hint": "Niyyah heißt Absicht. Ikhlāṣ heißt Aufrichtigkeit."
        },
        {
          "type": "choice",
          "prompt": "Woher stammen die religiösen Belege?",
          "options": [
            "Aus dem Qurʾān und einer authentischen Überlieferung.",
            "Aus einer ausgedachten Geschichte ohne Quelle."
          ],
          "correct": 0,
          "hint": "Qurʾān 98:5 · Ṣaḥīḥ al-Buḫārī, Nr. 1; Ṣaḥīḥ Muslim, Nr. 1907 · überliefert von ʿUmar ibn al-Ḫaṭṭāb",
          "explain": "Ich übe eine gute Absicht, ohne auf Lob zu warten."
        }
      ],
      "9-10": [
        {
          "type": "choice",
          "prompt": "Welche Handlung ist durch den Unterricht begründet?",
          "options": [
            "Ich kann mich trotzdem über die gute Tat freuen.",
            "Ich werde gemein, weil niemand klatscht."
          ],
          "correct": 0,
          "hint": "Niyyah heißt Absicht. Ikhlāṣ heißt Aufrichtigkeit.",
          "explain": "Ich helfe, weil ich Gutes für Allah tun möchte, nicht nur für Applaus."
        },
        {
          "type": "text",
          "prompt": "Wie unterscheiden sich Niyyah und Ikhlāṣ?",
          "sample": "Niyyah heißt Absicht, während Ikhlāṣ die Aufrichtigkeit dieser Absicht gegenüber Allah beschreibt.",
          "hint": "Vergleiche Qurʾān 98:5 mit der authentischen Überlieferung."
        },
        {
          "type": "text",
          "prompt": "Beschreibe eine sichere Alltagshandlung zu Gutes mit richtiger Absicht und erkläre, wie sie zu den Quellen passt.",
          "sample": "Ich helfe, weil ich Gutes für Allah tun möchte, nicht nur für Applaus.",
          "hint": "Niyyah heißt Absicht. Ikhlāṣ heißt Aufrichtigkeit."
        }
      ]
    }
  },
  "akhlaq-wut-ruhig-bleiben": {
    "id": "akhlaq-wut-ruhig-bleiben",
    "pillar": "akhlaq",
    "subject": "akhlaq",
    "topic": "Stark sein bei Wut",
    "title": "Akhlāq · Stärke bei Wut",
    "lead": "Stark sein bedeutet auch, sich bei Ärger zu beherrschen.",
    "goal": "Ich lerne, wütend sein zu dürfen und trotzdem niemanden zu verletzen.",
    "quran": {
      "surah": 3,
      "ayah": 134,
      "label": "Sūrat Āl ʿImrān · 3:134",
      "arabic": "وَالْكَاظِمِينَ الْغَيْظَ وَالْعَافِينَ عَنِ النَّاسِ",
      "meaning": "Diejenigen, die ihren Zorn zurückhalten und den Menschen vergeben.",
      "excerpt": true
    },
    "hadith": {
      "source": "Ṣaḥīḥ al-Buḫārī, Nr. 6114; Ṣaḥīḥ Muslim, Nr. 2609 · überliefert von Abū Hurayrah",
      "text": "Der Prophet ﷺ erklärte, dass wahre Stärke nicht darin besteht, andere zu besiegen, sondern sich bei Wut zu beherrschen."
    },
    "ageText": {
      "4-5": {
        "intro": "Manchmal werde ich wütend. Ich darf Hilfe holen.",
        "lines": [
          "Wut ist ein Gefühl, das jeder mal kennt.",
          "Ich darf sagen: Ich bin wütend.",
          "Ich schlage niemanden und werfe nichts nach anderen.",
          "Ich hole Hilfe und versuche ruhig zu werden."
        ],
        "evidence": "Allah lobt Menschen, die ihren Ärger zügeln. Der Prophet ﷺ zeigte uns, dass Beherrschung eine Stärke ist."
      },
      "6-8": {
        "intro": "Wir können Ärger bemerken, ohne damit andere zu verletzen.",
        "lines": [
          "Wenn mich etwas ärgert, darf ich das freundlich sagen.",
          "Ich kann Abstand nehmen und mit einer vertrauten Person sprechen.",
          "Stärke bedeutet nicht, bei jedem Streit zu gewinnen.",
          "Der Prophet ﷺ lehrte, sich bei Wut zu beherrschen."
        ],
        "evidence": "Qurʾān 3:134 lobt die Zurückhaltung von Wut. In al-Buḫārī 6114 erklärt der Prophet ﷺ eine andere Art von Stärke."
      },
      "9-10": {
        "intro": "Wir prüfen, was die Quellen über Selbstbeherrschung und Vergeben sagen.",
        "lines": [
          "Wut ist nicht automatisch falsch; entscheidend ist unser Umgang damit.",
          "Der Qurʾān lobt Menschen, die Wut beherrschen und vergeben.",
          "Der authentische Ḥadīṯ beschreibt Selbstbeherrschung als Stärke.",
          "Bei Gewalt oder Angst müssen Kinder sich in Sicherheit bringen und Erwachsenen davon erzählen."
        ],
        "evidence": "Qurʾān 3:134 spricht vom Zurückhalten des Zorns; al-Buḫārī 6114 lehrt Beherrschung. Vergeben bedeutet nicht, gefährliche Situationen zu dulden."
      }
    },
    "hint": "Gefühle darfst du sagen. Niemand muss sich verletzen lassen.",
    "sample": "Ich sage, dass ich wütend bin, und bitte bei Bedarf um Hilfe.",
    "sourceAudit": {
      "hadithUrl": "https://dorar.net/hadith/sharh/151201",
      "hadithNumber": "6114",
      "quranReference": "3:134",
      "authenticity": "Ṣaḥīḥ",
      "quranTextType": "excerpt",
      "verifiedDate": "2026-10-11",
      "note": "German translations and lesson illustrations are educational paraphrases, not original prophetic words."
    },
    "lines": [
      "Wenn mich etwas ärgert, darf ich das freundlich sagen.",
      "Ich kann Abstand nehmen und mit einer vertrauten Person sprechen.",
      "Stärke bedeutet nicht, bei jedem Streit zu gewinnen.",
      "Der Prophet ﷺ lehrte, sich bei Wut zu beherrschen."
    ],
    "questions": {
      "4-5": [
        {
          "type": "choice",
          "prompt": "Was kannst du hier Gutes tun?",
          "options": [
            "Ich spreche ruhig oder hole Unterstützung.",
            "Ich haue das andere Kind."
          ],
          "correct": 0,
          "hint": "Gefühle darfst du sagen. Niemand muss sich verletzen lassen.",
          "explain": "Ich sage, dass ich wütend bin, und bitte bei Bedarf um Hilfe."
        },
        {
          "type": "choice",
          "prompt": "Was merken wir uns?",
          "options": [
            "Ich sage, dass ich wütend bin, und bitte bei Bedarf um Hilfe.",
            "Ich muss andere absichtlich verletzen."
          ],
          "correct": 0,
          "hint": "Stark sein bedeutet auch, sich bei Ärger zu beherrschen.",
          "explain": "Ich lerne, wütend sein zu dürfen und trotzdem niemanden zu verletzen."
        }
      ],
      "6-8": [
        {
          "type": "choice",
          "prompt": "Welche Handlung passt zu dieser Lehre?",
          "options": [
            "Ich spreche ruhig oder hole Unterstützung.",
            "Ich haue das andere Kind."
          ],
          "correct": 0,
          "hint": "Gefühle darfst du sagen. Niemand muss sich verletzen lassen.",
          "explain": "Ich sage, dass ich wütend bin, und bitte bei Bedarf um Hilfe."
        },
        {
          "type": "text",
          "prompt": "Erkläre an einem eigenen Beispiel: Stark sein bei Wut.",
          "sample": "Ich lerne, wütend sein zu dürfen und trotzdem niemanden zu verletzen.",
          "hint": "Gefühle darfst du sagen. Niemand muss sich verletzen lassen."
        },
        {
          "type": "choice",
          "prompt": "Woher stammen die religiösen Belege?",
          "options": [
            "Aus dem Qurʾān und einer authentischen Überlieferung.",
            "Aus einer ausgedachten Geschichte ohne Quelle."
          ],
          "correct": 0,
          "hint": "Qurʾān 3:134 · Ṣaḥīḥ al-Buḫārī, Nr. 6114; Ṣaḥīḥ Muslim, Nr. 2609 · überliefert von Abū Hurayrah",
          "explain": "Ich lerne, wütend sein zu dürfen und trotzdem niemanden zu verletzen."
        }
      ],
      "9-10": [
        {
          "type": "choice",
          "prompt": "Welche Handlung ist durch den Unterricht begründet?",
          "options": [
            "Ich spreche ruhig oder hole Unterstützung.",
            "Ich haue das andere Kind."
          ],
          "correct": 0,
          "hint": "Gefühle darfst du sagen. Niemand muss sich verletzen lassen.",
          "explain": "Ich sage, dass ich wütend bin, und bitte bei Bedarf um Hilfe."
        },
        {
          "type": "text",
          "prompt": "Warum ist Selbstbeherrschung nach dem Ḥadīṯ eine Stärke?",
          "sample": "Sie bedeutet, eigene Handlungen zu steuern, auch wenn man sehr verärgert ist.",
          "hint": "Vergleiche Qurʾān 3:134 mit der authentischen Überlieferung."
        },
        {
          "type": "text",
          "prompt": "Beschreibe eine sichere Alltagshandlung zu Stark sein bei Wut und erkläre, wie sie zu den Quellen passt.",
          "sample": "Ich sage, dass ich wütend bin, und bitte bei Bedarf um Hilfe.",
          "hint": "Gefühle darfst du sagen. Niemand muss sich verletzen lassen."
        }
      ]
    }
  },
  "adab-erlaubnis-anklopfen": {
    "id": "adab-erlaubnis-anklopfen",
    "pillar": "adab",
    "subject": "adab",
    "topic": "Erst um Erlaubnis bitten",
    "title": "Adab · Anklopfen und Privatsphäre",
    "lead": "Wir respektieren die Privatsphäre anderer.",
    "goal": "Ich frage vor dem Eintreten und respektiere ein Nein.",
    "quran": {
      "surah": 24,
      "ayah": 27,
      "label": "Sūrat an-Nūr · 24:27",
      "arabic": "لَا تَدْخُلُوا بُيُوتًا غَيْرَ بُيُوتِكُمْ حَتَّىٰ تَسْتَأْنِسُوا وَتُسَلِّمُوا عَلَىٰ أَهْلِهَا",
      "meaning": "Betretet keine fremden Häuser, bevor ihr um Erlaubnis gebeten und ihre Bewohner begrüßt habt.",
      "excerpt": true
    },
    "hadith": {
      "source": "Ṣaḥīḥ al-Buḫārī, Nr. 6245; Ṣaḥīḥ Muslim, Nr. 2153 · überliefert von Abū Saʿīd al-Ḫudrī",
      "text": "Der Prophet ﷺ lehrte, beim Eintritt um Erlaubnis zu bitten und nach höchstens drei erfolglosen Bitten wieder zu gehen."
    },
    "ageText": {
      "4-5": {
        "intro": "Bevor ich in ein geschlossenes Zimmer gehe, frage ich.",
        "lines": [
          "Ich sehe eine geschlossene Tür.",
          "Ich klopfe freundlich an.",
          "Ich warte, bis jemand antwortet.",
          "Wenn ich kein Ja höre, gehe ich nicht einfach hinein."
        ],
        "evidence": "Allah lehrt den respektvollen Umgang mit fremden Häusern. Der Prophet ﷺ lehrte, um Erlaubnis zu bitten."
      },
      "6-8": {
        "intro": "Eine geschlossene Tür kann bedeuten: Jemand möchte Ruhe.",
        "lines": [
          "Andere Menschen brauchen manchmal ihren eigenen Raum.",
          "Vor dem Eintreten bitte ich um Erlaubnis.",
          "Ich respektiere es, wenn jemand gerade nicht öffnen möchte.",
          "Bei fremden Erwachsenen folge ich den Sicherheitsregeln meiner Eltern."
        ],
        "evidence": "Qurʾān 24:27 spricht vom Fragen vor dem Eintritt. Der Ḥadīṯ 6245 erklärt ein gutes Verhalten bei der Bitte um Erlaubnis."
      },
      "9-10": {
        "intro": "Wir verbinden die islamischen Regeln des Erlaubnisbittens mit sicherem Verhalten.",
        "lines": [
          "Im Qurʾān wird beschrieben, dass wir fremde Häuser nicht ohne Erlaubnis betreten.",
          "Der Prophet ﷺ begrenzte wiederholtes Erlaubnisbitten und empfahl, sonst zurückzukehren.",
          "Auch im Familienalltag achten wir auf geschlossene Türen und persönliche Grenzen.",
          "Kinder besuchen fremde Wohnungen nicht allein, nur weil jemand die Tür öffnet."
        ],
        "evidence": "Qurʾān 24:27 und al-Buḫārī 6245 ergänzen einander: erst fragen, Antwort beachten und nicht in die Privatsphäre anderer eindringen."
      }
    },
    "hint": "Nur bei Personen, zu denen du gehen darfst, anklopfen. Fremde Türen öffnest du nicht selbst.",
    "sample": "Ich klopfe an und frage, ob ich eintreten darf.",
    "sourceAudit": {
      "hadithUrl": "https://sunnah.com/bukhari:6245",
      "hadithNumber": "6245",
      "quranReference": "24:27",
      "authenticity": "Ṣaḥīḥ",
      "quranTextType": "excerpt",
      "verifiedDate": "2026-10-11",
      "note": "German translations and lesson illustrations are educational paraphrases, not original prophetic words."
    },
    "lines": [
      "Andere Menschen brauchen manchmal ihren eigenen Raum.",
      "Vor dem Eintreten bitte ich um Erlaubnis.",
      "Ich respektiere es, wenn jemand gerade nicht öffnen möchte.",
      "Bei fremden Erwachsenen folge ich den Sicherheitsregeln meiner Eltern."
    ],
    "questions": {
      "4-5": [
        {
          "type": "choice",
          "prompt": "Was kannst du hier Gutes tun?",
          "options": [
            "Ich klopfe an und warte auf ihre Erlaubnis.",
            "Ich stürme einfach hinein."
          ],
          "correct": 0,
          "hint": "Nur bei Personen, zu denen du gehen darfst, anklopfen. Fremde Türen öffnest du nicht selbst.",
          "explain": "Ich klopfe an und frage, ob ich eintreten darf."
        },
        {
          "type": "choice",
          "prompt": "Was merken wir uns?",
          "options": [
            "Ich klopfe an und frage, ob ich eintreten darf.",
            "Ich muss andere absichtlich verletzen."
          ],
          "correct": 0,
          "hint": "Wir respektieren die Privatsphäre anderer.",
          "explain": "Ich frage vor dem Eintreten und respektiere ein Nein."
        }
      ],
      "6-8": [
        {
          "type": "choice",
          "prompt": "Welche Handlung passt zu dieser Lehre?",
          "options": [
            "Ich klopfe an und warte auf ihre Erlaubnis.",
            "Ich stürme einfach hinein."
          ],
          "correct": 0,
          "hint": "Nur bei Personen, zu denen du gehen darfst, anklopfen. Fremde Türen öffnest du nicht selbst.",
          "explain": "Ich klopfe an und frage, ob ich eintreten darf."
        },
        {
          "type": "text",
          "prompt": "Erkläre an einem eigenen Beispiel: Erst um Erlaubnis bitten.",
          "sample": "Ich frage vor dem Eintreten und respektiere ein Nein.",
          "hint": "Nur bei Personen, zu denen du gehen darfst, anklopfen. Fremde Türen öffnest du nicht selbst."
        },
        {
          "type": "choice",
          "prompt": "Woher stammen die religiösen Belege?",
          "options": [
            "Aus dem Qurʾān und einer authentischen Überlieferung.",
            "Aus einer ausgedachten Geschichte ohne Quelle."
          ],
          "correct": 0,
          "hint": "Qurʾān 24:27 · Ṣaḥīḥ al-Buḫārī, Nr. 6245; Ṣaḥīḥ Muslim, Nr. 2153 · überliefert von Abū Saʿīd al-Ḫudrī",
          "explain": "Ich frage vor dem Eintreten und respektiere ein Nein."
        }
      ],
      "9-10": [
        {
          "type": "choice",
          "prompt": "Welche Handlung ist durch den Unterricht begründet?",
          "options": [
            "Ich klopfe an und warte auf ihre Erlaubnis.",
            "Ich stürme einfach hinein."
          ],
          "correct": 0,
          "hint": "Nur bei Personen, zu denen du gehen darfst, anklopfen. Fremde Türen öffnest du nicht selbst.",
          "explain": "Ich klopfe an und frage, ob ich eintreten darf."
        },
        {
          "type": "text",
          "prompt": "Warum schützt das Erlaubnisbitten die Privatsphäre?",
          "sample": "Weil der andere Mensch zuerst zustimmen kann, bevor man seinen Raum betritt.",
          "hint": "Vergleiche Qurʾān 24:27 mit der authentischen Überlieferung."
        },
        {
          "type": "text",
          "prompt": "Beschreibe eine sichere Alltagshandlung zu Erst um Erlaubnis bitten und erkläre, wie sie zu den Quellen passt.",
          "sample": "Ich klopfe an und frage, ob ich eintreten darf.",
          "hint": "Nur bei Personen, zu denen du gehen darfst, anklopfen. Fremde Türen öffnest du nicht selbst."
        }
      ]
    }
  },
  "akhlaq-tarbiyah-sanft-lernen": {
    "id": "akhlaq-tarbiyah-sanft-lernen",
    "pillar": "tarbiyah",
    "subject": "akhlaq",
    "topic": "Tarbiyah – freundlich lernen",
    "title": "Tarbiyah · Lernen ohne Überforderung",
    "lead": "Gutes Lernen braucht Geduld und liebevolle Anleitung.",
    "goal": "Ich kann in kleinen Schritten üben und bei Bedarf Hilfe erbitten.",
    "quran": {
      "surah": 20,
      "ayah": 132,
      "label": "Sūrat Ṭāhā · 20:132",
      "arabic": "وَأْمُرْ أَهْلَكَ بِالصَّلَاةِ وَاصْطَبِرْ عَلَيْهَا",
      "meaning": "Fordere deine Familie zum Gebet auf und bleibe dabei geduldig und beständig.",
      "excerpt": true
    },
    "hadith": {
      "source": "Ṣaḥīḥ al-Buḫārī, Nr. 69; Ṣaḥīḥ Muslim, Nr. 1734 · überliefert von Anas ibn Mālik",
      "text": "Der Prophet ﷺ lehrte, Dinge zu erleichtern statt sie unnötig schwer zu machen, und Menschen zu ermutigen statt abzuschrecken."
    },
    "ageText": {
      "4-5": {
        "intro": "Wir lernen langsam. Wir dürfen Fragen stellen.",
        "lines": [
          "Ein neues Wort ist noch schwer.",
          "Ich darf fragen: Was bedeutet das?",
          "Ich übe einen kleinen Schritt.",
          "Wenn ich Hilfe brauche, sage ich es."
        ],
        "evidence": "Allah lehrt uns Geduld. Der Prophet ﷺ lehrte, anderen das Gute leicht zu machen."
      },
      "6-8": {
        "intro": "Tarbiyah heißt, auf gute Weise beim Wachsen und Lernen begleitet zu werden.",
        "lines": [
          "Manchmal brauche ich mehrere Versuche, um etwas zu verstehen.",
          "Ich darf neue Begriffe nachfragen, statt sie nur auswendig zu sagen.",
          "Eine gute Lehrperson erklärt klar und freundlich.",
          "Ich übe weiter und darf zwischendurch eine Pause machen."
        ],
        "evidence": "Qurʾān 20:132 spricht von Geduld und Beständigkeit. Der authentische Ḥadīṯ 69 ermutigt dazu, Menschen nicht unnötig zu überfordern."
      },
      "9-10": {
        "intro": "Wir untersuchen Geduld beim Lernen und freundliche religiöse Unterweisung.",
        "lines": [
          "Im Qurʾān wird Geduld bei der Anleitung zum Gebet hervorgehoben.",
          "Der Prophet ﷺ legte Wert auf das Erleichtern und Ermutigen beim Vermitteln des Guten.",
          "Wir dürfen Fragen stellen und uns neue Aufgaben in erreichbare Schritte aufteilen.",
          "Tarbiyah ist ein pädagogischer Begriff; wir unterscheiden unsere Übungsregeln von Originalzitaten."
        ],
        "evidence": "Der Qurʾān-Vers 20:132 betrifft die Anleitung der Familie zum Gebet. Der Ḥadīṯ al-Buḫārī 69 lehrt erleichternde Vermittlung; unsere Lernmethodik ist eine pädagogische Anwendung."
      }
    },
    "hint": "Du darfst fragen und Pausen machen. Lernen soll verständlich sein.",
    "sample": "Ich lerne Schritt für Schritt und frage, wenn ich ein Wort nicht verstehe.",
    "sourceAudit": {
      "hadithUrl": "https://dorar.net/hadith/sharh/61",
      "hadithNumber": "69",
      "quranReference": "20:132",
      "authenticity": "Ṣaḥīḥ",
      "quranTextType": "excerpt",
      "verifiedDate": "2026-10-11",
      "note": "German translations and lesson illustrations are educational paraphrases, not original prophetic words."
    },
    "lines": [
      "Manchmal brauche ich mehrere Versuche, um etwas zu verstehen.",
      "Ich darf neue Begriffe nachfragen, statt sie nur auswendig zu sagen.",
      "Eine gute Lehrperson erklärt klar und freundlich.",
      "Ich übe weiter und darf zwischendurch eine Pause machen."
    ],
    "questions": {
      "4-5": [
        {
          "type": "choice",
          "prompt": "Was kannst du hier Gutes tun?",
          "options": [
            "Ich bitte um eine einfache Erklärung und übe langsam.",
            "Ich gebe auf, ohne um Hilfe zu bitten."
          ],
          "correct": 0,
          "hint": "Du darfst fragen und Pausen machen. Lernen soll verständlich sein.",
          "explain": "Ich lerne Schritt für Schritt und frage, wenn ich ein Wort nicht verstehe."
        },
        {
          "type": "choice",
          "prompt": "Was merken wir uns?",
          "options": [
            "Ich lerne Schritt für Schritt und frage, wenn ich ein Wort nicht verstehe.",
            "Ich muss andere absichtlich verletzen."
          ],
          "correct": 0,
          "hint": "Gutes Lernen braucht Geduld und liebevolle Anleitung.",
          "explain": "Ich kann in kleinen Schritten üben und bei Bedarf Hilfe erbitten."
        }
      ],
      "6-8": [
        {
          "type": "choice",
          "prompt": "Welche Handlung passt zu dieser Lehre?",
          "options": [
            "Ich bitte um eine einfache Erklärung und übe langsam.",
            "Ich gebe auf, ohne um Hilfe zu bitten."
          ],
          "correct": 0,
          "hint": "Du darfst fragen und Pausen machen. Lernen soll verständlich sein.",
          "explain": "Ich lerne Schritt für Schritt und frage, wenn ich ein Wort nicht verstehe."
        },
        {
          "type": "text",
          "prompt": "Erkläre an einem eigenen Beispiel: Tarbiyah – freundlich lernen.",
          "sample": "Ich kann in kleinen Schritten üben und bei Bedarf Hilfe erbitten.",
          "hint": "Du darfst fragen und Pausen machen. Lernen soll verständlich sein."
        },
        {
          "type": "choice",
          "prompt": "Woher stammen die religiösen Belege?",
          "options": [
            "Aus dem Qurʾān und einer authentischen Überlieferung.",
            "Aus einer ausgedachten Geschichte ohne Quelle."
          ],
          "correct": 0,
          "hint": "Qurʾān 20:132 · Ṣaḥīḥ al-Buḫārī, Nr. 69; Ṣaḥīḥ Muslim, Nr. 1734 · überliefert von Anas ibn Mālik",
          "explain": "Ich kann in kleinen Schritten üben und bei Bedarf Hilfe erbitten."
        }
      ],
      "9-10": [
        {
          "type": "choice",
          "prompt": "Welche Handlung ist durch den Unterricht begründet?",
          "options": [
            "Ich bitte um eine einfache Erklärung und übe langsam.",
            "Ich gebe auf, ohne um Hilfe zu bitten."
          ],
          "correct": 0,
          "hint": "Du darfst fragen und Pausen machen. Lernen soll verständlich sein.",
          "explain": "Ich lerne Schritt für Schritt und frage, wenn ich ein Wort nicht verstehe."
        },
        {
          "type": "text",
          "prompt": "Warum ist die methodische Übung kein wörtlicher Ḥadīṯ?",
          "sample": "Weil der Ḥadīṯ zur Erleichterung ermutigt; die konkrete Übung ist eine moderne pädagogische Anwendung.",
          "hint": "Vergleiche Qurʾān 20:132 mit der authentischen Überlieferung."
        },
        {
          "type": "text",
          "prompt": "Beschreibe eine sichere Alltagshandlung zu Tarbiyah – freundlich lernen und erkläre, wie sie zu den Quellen passt.",
          "sample": "Ich lerne Schritt für Schritt und frage, wenn ich ein Wort nicht verstehe.",
          "hint": "Du darfst fragen und Pausen machen. Lernen soll verständlich sein."
        }
      ]
    }
  },
  "akhlaq-nafs-gutes-herz": {
    "id": "akhlaq-nafs-gutes-herz",
    "pillar": "nafs",
    "subject": "akhlaq",
    "topic": "Tazkiyah – gute innere Haltung",
    "title": "Tazkiyat an-Nafs · Das Herz pflegen",
    "lead": "Gute Worte und gute Taten helfen uns, an uns zu arbeiten.",
    "goal": "Ich kann mein Verhalten betrachten und einen guten Schritt zur Besserung wählen.",
    "quran": {
      "surah": 91,
      "ayah": 9,
      "label": "Sūrat aš-Šams · 91:9",
      "arabic": "قَدْ أَفْلَحَ مَنْ زَكَّاهَا",
      "meaning": "Erfolg hat gewiss, wer seine Seele läutert.",
      "excerpt": false
    },
    "hadith": {
      "source": "Ṣaḥīḥ Muslim, Nr. 2564 · überliefert von Abū Hurayrah",
      "text": "Der Prophet ﷺ erklärte, dass nicht Aussehen und Besitz das Entscheidende sind, sondern Herzen und Taten."
    },
    "ageText": {
      "4-5": {
        "intro": "Es ist schön, wenn wir freundlich miteinander umgehen.",
        "lines": [
          "Ein guter Freund hilft anderen.",
          "Wenn ich etwas Gemeines gesagt habe, kann ich mich entschuldigen.",
          "Ich darf immer wieder üben, freundlich zu sein.",
          "Allah liebt gute Taten."
        ],
        "evidence": "Der Qurʾān spricht davon, sich innerlich zu verbessern. Der Prophet ﷺ lehrte, dass unsere Taten wichtig sind."
      },
      "6-8": {
        "intro": "Tazkiyah heißt: Ich arbeite an meinen guten Gewohnheiten.",
        "lines": [
          "Nicht unsere Kleidung oder unser Besitz macht unseren Charakter gut.",
          "Wichtig ist, wie wir denken und handeln.",
          "Wenn ich einen Fehler mache, kann ich ihn ehrlich zugeben und verbessern.",
          "Ich versuche täglich eine kleine gute Tat."
        ],
        "evidence": "Qurʾān 91:9 beschreibt die Läuterung der Seele. Der authentische Ḥadīṯ 2564 lenkt den Blick auf Herz und Handeln."
      },
      "9-10": {
        "intro": "Wir unterscheiden äußere Merkmale von innerer Haltung und konkreten Handlungen.",
        "lines": [
          "Der Qurʾān lobt die Läuterung der eigenen Seele.",
          "Der Prophet ﷺ erklärte, dass Aussehen und Besitz nicht das Maß unserer inneren Qualität sind.",
          "Gute Absichten und Taten gehören zusammen, und wir können aus Fehlern lernen.",
          "Tazkiyah bedeutet, Verhalten und Gewohnheiten zu verbessern, nicht andere Menschen zu verurteilen."
        ],
        "evidence": "Qurʾān 91:9 nennt das Läutern des Selbst. In Ṣaḥīḥ Muslim 2564 wird auf Herzen und Taten verwiesen; Kinder sollen daraus Selbstreflexion statt Bewertungen anderer ableiten."
      }
    },
    "hint": "Du bist mehr als dein Aussehen. Gute Gedanken und Taten sind wichtig.",
    "sample": "Ich denke über mein Verhalten nach und versuche eine kleine gute Tat.",
    "sourceAudit": {
      "hadithUrl": "https://dorar.net/hadith/sharh/207905",
      "hadithNumber": "2564",
      "quranReference": "91:9",
      "authenticity": "Ṣaḥīḥ",
      "quranTextType": "complete",
      "verifiedDate": "2026-10-11",
      "note": "German translations and lesson illustrations are educational paraphrases, not original prophetic words."
    },
    "lines": [
      "Nicht unsere Kleidung oder unser Besitz macht unseren Charakter gut.",
      "Wichtig ist, wie wir denken und handeln.",
      "Wenn ich einen Fehler mache, kann ich ihn ehrlich zugeben und verbessern.",
      "Ich versuche täglich eine kleine gute Tat."
    ],
    "questions": {
      "4-5": [
        {
          "type": "choice",
          "prompt": "Was kannst du hier Gutes tun?",
          "options": [
            "Ich entschuldige mich und versuche es besser zu machen.",
            "Ich mache ihn erneut absichtlich traurig."
          ],
          "correct": 0,
          "hint": "Du bist mehr als dein Aussehen. Gute Gedanken und Taten sind wichtig.",
          "explain": "Ich denke über mein Verhalten nach und versuche eine kleine gute Tat."
        },
        {
          "type": "choice",
          "prompt": "Was merken wir uns?",
          "options": [
            "Ich denke über mein Verhalten nach und versuche eine kleine gute Tat.",
            "Ich muss andere absichtlich verletzen."
          ],
          "correct": 0,
          "hint": "Gute Worte und gute Taten helfen uns, an uns zu arbeiten.",
          "explain": "Ich kann mein Verhalten betrachten und einen guten Schritt zur Besserung wählen."
        }
      ],
      "6-8": [
        {
          "type": "choice",
          "prompt": "Welche Handlung passt zu dieser Lehre?",
          "options": [
            "Ich entschuldige mich und versuche es besser zu machen.",
            "Ich mache ihn erneut absichtlich traurig."
          ],
          "correct": 0,
          "hint": "Du bist mehr als dein Aussehen. Gute Gedanken und Taten sind wichtig.",
          "explain": "Ich denke über mein Verhalten nach und versuche eine kleine gute Tat."
        },
        {
          "type": "text",
          "prompt": "Erkläre an einem eigenen Beispiel: Tazkiyah – gute innere Haltung.",
          "sample": "Ich kann mein Verhalten betrachten und einen guten Schritt zur Besserung wählen.",
          "hint": "Du bist mehr als dein Aussehen. Gute Gedanken und Taten sind wichtig."
        },
        {
          "type": "choice",
          "prompt": "Woher stammen die religiösen Belege?",
          "options": [
            "Aus dem Qurʾān und einer authentischen Überlieferung.",
            "Aus einer ausgedachten Geschichte ohne Quelle."
          ],
          "correct": 0,
          "hint": "Qurʾān 91:9 · Ṣaḥīḥ Muslim, Nr. 2564 · überliefert von Abū Hurayrah",
          "explain": "Ich kann mein Verhalten betrachten und einen guten Schritt zur Besserung wählen."
        }
      ],
      "9-10": [
        {
          "type": "choice",
          "prompt": "Welche Handlung ist durch den Unterricht begründet?",
          "options": [
            "Ich entschuldige mich und versuche es besser zu machen.",
            "Ich mache ihn erneut absichtlich traurig."
          ],
          "correct": 0,
          "hint": "Du bist mehr als dein Aussehen. Gute Gedanken und Taten sind wichtig.",
          "explain": "Ich denke über mein Verhalten nach und versuche eine kleine gute Tat."
        },
        {
          "type": "text",
          "prompt": "Wie ergänzen sich Qurʾān 91:9 und Ṣaḥīḥ Muslim 2564?",
          "sample": "Der Vers spricht vom Läutern der Seele, und der Ḥadīṯ betont Herz und Taten gegenüber äußeren Merkmalen.",
          "hint": "Vergleiche Qurʾān 91:9 mit der authentischen Überlieferung."
        },
        {
          "type": "text",
          "prompt": "Beschreibe eine sichere Alltagshandlung zu Tazkiyah – gute innere Haltung und erkläre, wie sie zu den Quellen passt.",
          "sample": "Ich denke über mein Verhalten nach und versuche eine kleine gute Tat.",
          "hint": "Du bist mehr als dein Aussehen. Gute Gedanken und Taten sind wichtig."
        }
      ]
    }
  }
};
for(const [id,lesson] of Object.entries(additions)){
 if(id!==lesson.id||old[id])throw Error("V25 duplicate curriculum id "+id);
 for(const age of ["4-5","6-8","9-10"])
  if(lesson.ageText[age].lines.length!==4||lesson.questions[age].length<2)
   throw Error("V25 no complete age instruction: "+id+" "+age);
}
window.DARKidsAcademyCurriculum=Object.freeze({...old,...additions});
window.DARKidsAcademyCurriculumV25=Object.freeze({version:"20261011-v25",count:7,
 ids:Object.keys(additions),pillars:Object.fromEntries(Object.values(additions).map(l=>[l.id,l.pillar])),
 religiousSourcesVerified:true,voiceRecordingsApproved:false});
})();
