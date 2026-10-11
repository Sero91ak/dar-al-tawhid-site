/* DĀR AL TAWḤĪD KIDS · protected creator-only draft lessons 39–44.
 * Source-checked Qurʾān EXCERPTS and cited Ṣaḥīḥ reports, German hadith PARAPHRASES.
 * Three authored age tiers. NO visitor release, NO master voice/audio approval.
 * Inject ONLY in test/kids/akademie/index.html on kids-creator-staging.
 */
(function(){
"use strict";
const existing=window.DARKidsAcademyCurriculum;
if(!existing || !existing["aqidah-dua-allah-bitten"])throw Error("KIDS Creator: initial 38-lesson curriculum not loaded");
const additions={
  "tarbiyyah-kleine-aufgaben": {
    "id": "tarbiyyah-kleine-aufgaben",
    "editorialSlot": 39,
    "subject": "akhlaq",
    "editorialCategory": "tarbiyyah",
    "topic": "Mithilfe zu Hause",
    "title": "Kleine Aufgaben mit Freude übernehmen",
    "lead": "Auch kleine Hände können zu Hause Gutes tun.",
    "goal": "Ich suche mir eine sichere, passende Aufgabe und helfe zuverlässig.",
    "quran": {
      "surah": 5,
      "ayah": 2,
      "label": "Sūrat al-Māʾidah · 5:2",
      "arabic": "وَتَعَاوَنُوا عَلَى الْبِرِّ وَالتَّقْوَى",
      "meaning": "Helft einander bei Güte und Gottesfurcht.",
      "excerpt": true
    },
    "hadith": {
      "source": "Ṣaḥīḥ al-Buḫārī, Nr. 676",
      "text": "ʿĀʾischah berichtete, dass der Prophet ﷺ seiner Familie bei Aufgaben zu Hause half."
    },
    "sourceAudit": {
      "quranUrl": "https://quran.com/5/2",
      "hadithUrl": "https://dorar.net/hadith/sharh/6702",
      "quranReference": "5:2",
      "authenticity": "Ṣaḥīḥ",
      "arabicTextType": "excerpt",
      "sourceCheckedDate": "2026-10-11",
      "hadithTextType": "German paraphrase; not a verbatim quotation"
    },
    "hint": "Auch kleine Hände können zu Hause Gutes tun.",
    "sample": "Ich suche mir eine sichere, passende Aufgabe und helfe zuverlässig.",
    "lines": [
      "Allah lehrt uns, bei guten Dingen zusammenzuarbeiten.",
      "Der Prophet ﷺ half zu Hause seiner Familie.",
      "Ich vereinbare eine kleine Aufgabe, die ich selbst schaffen kann.",
      "Scharfe, heiße oder schwere Dinge überlasse ich Erwachsenen."
    ],
    "ageText": {
      "4-5": {
        "intro": "Auch ich kann zu Hause helfen.",
        "lines": [
          "Ich räume meine Spielsachen an ihren Platz.",
          "Ich frage: Kann ich dir helfen?",
          "Ich übernehme eine einfache, sichere Aufgabe.",
          "Wir freuen uns, wenn wir einander helfen."
        ],
        "evidence": "Qurʾān und authentische Sunnah lehren uns dieses Thema.",
        "activity": "Suche mit einem Erwachsenen drei Spielsachen und räume sie zurück."
      },
      "6-8": {
        "intro": "Unsere Familie ist ein Team. Jeder kann nach seinen Möglichkeiten helfen.",
        "lines": [
          "Allah lehrt uns, bei guten Dingen zusammenzuarbeiten.",
          "Der Prophet ﷺ half zu Hause seiner Familie.",
          "Ich vereinbare eine kleine Aufgabe, die ich selbst schaffen kann.",
          "Scharfe, heiße oder schwere Dinge überlasse ich Erwachsenen."
        ],
        "evidence": "Qurʾān 5:2; Ṣaḥīḥ al-Buḫārī, Nr. 676. Die Alltagssituationen sind pädagogische Beispiele, keine wörtlichen Offenbarungstexte.",
        "activity": "Wähle eine Aufgabe: Tischdecken, Bücher sortieren oder Kleidung zusammenlegen."
      },
      "9-10": {
        "intro": "Mithilfe ist keine Aufgabe für eine bestimmte Person allein.",
        "lines": [
          "Qurʾān 5:2 fordert uns zur Zusammenarbeit im Guten auf.",
          "ʿĀʾischah beschreibt die Mithilfe des Propheten ﷺ im Haushalt.",
          "Ich plane eine geeignete Aufgabe und erledige sie ohne großes Aufheben.",
          "Ich erkenne Grenzen: Für gefährliche Arbeiten brauche ich Erwachsene."
        ],
        "evidence": "Qurʾān 5:2; Ṣaḥīḥ al-Buḫārī, Nr. 676. Die Alltagssituationen sind pädagogische Beispiele, keine wörtlichen Offenbarungstexte.",
        "activity": "Erstelle mit deiner Familie einen freundlichen Wochenplan für zwei kleine Aufgaben."
      }
    },
    "questions": {
      "4-5": [
        {
          "type": "choice",
          "prompt": "Womit kannst du heute sicher helfen?",
          "options": [
            "Meine Spielsachen wegräumen.",
            "Mit einem scharfen Messer ohne Erwachsene hantieren."
          ],
          "correct": 0,
          "hint": "Auch kleine Hände können zu Hause Gutes tun.",
          "explain": "Meine Spielsachen wegräumen."
        },
        {
          "type": "choice",
          "prompt": "Was nehmen wir uns für heute vor?",
          "options": [
            "Ich suche mir eine sichere, passende Aufgabe und helfe zuverlässig.",
            "Ich muss niemandem zuhören und nichts üben."
          ],
          "correct": 0,
          "hint": "Auch kleine Hände können zu Hause Gutes tun.",
          "explain": "Ich suche mir eine sichere, passende Aufgabe und helfe zuverlässig."
        }
      ],
      "6-8": [
        {
          "type": "choice",
          "prompt": "Wie hilft der Prophet ﷺ laut ʿĀʾischahs Bericht zu Hause?",
          "options": [
            "Er half seiner Familie bei Arbeiten.",
            "Er verbot jede Mithilfe."
          ],
          "correct": 0,
          "hint": "Unsere Familie ist ein Team. Jeder kann nach seinen Möglichkeiten helfen.",
          "explain": "Er half seiner Familie bei Arbeiten."
        },
        {
          "type": "text",
          "prompt": "Welche kleine Alltagsübung passt zu „Kleine Aufgaben mit Freude übernehmen“?",
          "sample": "Wähle eine Aufgabe: Tischdecken, Bücher sortieren oder Kleidung zusammenlegen.",
          "hint": "Ich suche mir eine sichere, passende Aufgabe und helfe zuverlässig."
        },
        {
          "type": "choice",
          "prompt": "Wo findest du die religiöse Grundlage?",
          "options": [
            "Qurʾān 5:2 und Ṣaḥīḥ al-Buḫārī, Nr. 676",
            "In einer Geschichte ohne überprüfbare Quelle."
          ],
          "correct": 0,
          "hint": "Wir trennen Quellen und Übungen.",
          "explain": "Qurʾān 5:2; Ṣaḥīḥ al-Buḫārī, Nr. 676"
        }
      ],
      "9-10": [
        {
          "type": "choice",
          "prompt": "Wie hilft der Prophet ﷺ laut ʿĀʾischahs Bericht zu Hause?",
          "options": [
            "Er half seiner Familie bei Arbeiten.",
            "Er verbot jede Mithilfe."
          ],
          "correct": 0,
          "hint": "Mithilfe ist keine Aufgabe für eine bestimmte Person allein.",
          "explain": "Er half seiner Familie bei Arbeiten."
        },
        {
          "type": "text",
          "prompt": "Was unterscheidet selbstständige Mithilfe von gefährlichen Arbeiten?",
          "sample": "Erstelle mit deiner Familie einen freundlichen Wochenplan für zwei kleine Aufgaben.",
          "hint": "Mithilfe ist keine Aufgabe für eine bestimmte Person allein."
        },
        {
          "type": "text",
          "prompt": "Erkläre, warum Qurʾān 5:2 und al-Buḫārī 676 beide zum Helfen motivieren.",
          "sample": "Qurʾān 5:2 und Ṣaḥīḥ al-Buḫārī, Nr. 676 vermitteln den Grundgedanken; die Übung ist unsere heutige Anwendung.",
          "hint": "Gib die Fundstellen exakt an und trenne eigene Beispiele vom Quellentext."
        }
      ]
    },
    "editorialStatus": "SOURCE_CHECKED_DRAFT_NOT_APPROVED",
    "audioApproved": false,
    "visitorReleased": false
  },
  "familie-geschwister-freundlich": {
    "id": "familie-geschwister-freundlich",
    "editorialSlot": 40,
    "subject": "adab",
    "editorialCategory": "familie",
    "topic": "Geschwisterliebe",
    "title": "Geschwister freundlich behandeln",
    "lead": "Freundlichkeit macht unser Zuhause schöner.",
    "goal": "Ich rede freundlich, teile fair und löse Streit ohne Verletzungen.",
    "quran": {
      "surah": 49,
      "ayah": 10,
      "label": "Sūrat al-Ḥuǧurāt · 49:10",
      "arabic": "إِنَّمَا الْمُؤْمِنُونَ إِخْوَةٌ",
      "meaning": "Die Gläubigen sind doch Geschwister.",
      "excerpt": true
    },
    "hadith": {
      "source": "Ṣaḥīḥ al-Buḫārī, Nr. 13; Ṣaḥīḥ Muslim, Nr. 45",
      "text": "Der Prophet ﷺ lehrte, dass zum vollkommenen Glauben gehört, für den Glaubensbruder Gutes zu wünschen wie für sich selbst."
    },
    "sourceAudit": {
      "quranUrl": "https://quran.com/49/10",
      "hadithUrl": "https://dorar.net/hadith/sharh/7323",
      "quranReference": "49:10",
      "authenticity": "Ṣaḥīḥ",
      "arabicTextType": "excerpt",
      "sourceCheckedDate": "2026-10-11",
      "hadithTextType": "German paraphrase; not a verbatim quotation"
    },
    "hint": "Freundlichkeit macht unser Zuhause schöner.",
    "sample": "Ich rede freundlich, teile fair und löse Streit ohne Verletzungen.",
    "lines": [
      "Der Qurʾān nennt die Gläubigen Geschwister.",
      "Der Prophet ﷺ lehrt, anderen Gutes zu wünschen.",
      "Ich höre die Wünsche meiner Geschwister an.",
      "Bei einem Streit bitte ich nötigenfalls Erwachsene um Hilfe."
    ],
    "ageText": {
      "4-5": {
        "intro": "Ich kann nett mit meinen Geschwistern sprechen.",
        "lines": [
          "Ich darf mein Spielzeug freundlich anbieten.",
          "Wenn ich etwas haben möchte, frage ich zuerst.",
          "Wenn ich wütend werde, darf ich eine Pause machen.",
          "Wir hauen und beschimpfen einander nicht."
        ],
        "evidence": "Qurʾān und authentische Sunnah lehren uns dieses Thema.",
        "activity": "Übt gemeinsam: Bitte, danke und Darf ich auch mal?"
      },
      "6-8": {
        "intro": "Geschwister streiten manchmal. Wir üben, gerecht und freundlich zu bleiben.",
        "lines": [
          "Der Qurʾān nennt die Gläubigen Geschwister.",
          "Der Prophet ﷺ lehrt, anderen Gutes zu wünschen.",
          "Ich höre die Wünsche meiner Geschwister an.",
          "Bei einem Streit bitte ich nötigenfalls Erwachsene um Hilfe."
        ],
        "evidence": "Qurʾān 49:10; Ṣaḥīḥ al-Buḫārī, Nr. 13; Ṣaḥīḥ Muslim, Nr. 45. Die Alltagssituationen sind pädagogische Beispiele, keine wörtlichen Offenbarungstexte.",
        "activity": "Spielt einen Streit um ein Buch nach und findet eine faire Lösung."
      },
      "9-10": {
        "intro": "Verwandtschaft ist ein besonderer Ort, um Rücksicht einzuüben.",
        "lines": [
          "Qurʾān 49:10 spricht von der Glaubensgeschwisterschaft.",
          "Der Ḥadīṯ in al-Buḫārī 13 betrifft das Wohlwollen für andere Gläubige allgemein.",
          "Ich übertrage diesen Grundsatz als Alltagspraxis auf meine Geschwister.",
          "Ich kann Grenzen setzen, ohne zu verletzen oder ungerecht zu werden."
        ],
        "evidence": "Qurʾān 49:10; Ṣaḥīḥ al-Buḫārī, Nr. 13; Ṣaḥīḥ Muslim, Nr. 45. Die Alltagssituationen sind pädagogische Beispiele, keine wörtlichen Offenbarungstexte.",
        "activity": "Formuliere drei Sätze für eine friedliche Konfliktlösung mit Geschwistern."
      }
    },
    "questions": {
      "4-5": [
        {
          "type": "choice",
          "prompt": "Dein Geschwisterkind möchte mitspielen. Was passt?",
          "options": [
            "Ich spreche freundlich und wir finden eine Lösung.",
            "Ich schubse es weg."
          ],
          "correct": 0,
          "hint": "Freundlichkeit macht unser Zuhause schöner.",
          "explain": "Ich spreche freundlich und wir finden eine Lösung."
        },
        {
          "type": "choice",
          "prompt": "Was nehmen wir uns für heute vor?",
          "options": [
            "Ich rede freundlich, teile fair und löse Streit ohne Verletzungen.",
            "Ich muss niemandem zuhören und nichts üben."
          ],
          "correct": 0,
          "hint": "Freundlichkeit macht unser Zuhause schöner.",
          "explain": "Ich rede freundlich, teile fair und löse Streit ohne Verletzungen."
        }
      ],
      "6-8": [
        {
          "type": "choice",
          "prompt": "Was bedeutet es, anderen Gutes zu wünschen?",
          "options": [
            "Ich freue mich auch über ihr Wohl.",
            "Nur mein Vorteil ist wichtig."
          ],
          "correct": 0,
          "hint": "Geschwister streiten manchmal. Wir üben, gerecht und freundlich zu bleiben.",
          "explain": "Ich freue mich auch über ihr Wohl."
        },
        {
          "type": "text",
          "prompt": "Welche kleine Alltagsübung passt zu „Geschwister freundlich behandeln“?",
          "sample": "Spielt einen Streit um ein Buch nach und findet eine faire Lösung.",
          "hint": "Ich rede freundlich, teile fair und löse Streit ohne Verletzungen."
        },
        {
          "type": "choice",
          "prompt": "Wo findest du die religiöse Grundlage?",
          "options": [
            "Qurʾān 49:10 und Ṣaḥīḥ al-Buḫārī, Nr. 13; Ṣaḥīḥ Muslim, Nr. 45",
            "In einer Geschichte ohne überprüfbare Quelle."
          ],
          "correct": 0,
          "hint": "Wir trennen Quellen und Übungen.",
          "explain": "Qurʾān 49:10; Ṣaḥīḥ al-Buḫārī, Nr. 13; Ṣaḥīḥ Muslim, Nr. 45"
        }
      ],
      "9-10": [
        {
          "type": "choice",
          "prompt": "Was bedeutet es, anderen Gutes zu wünschen?",
          "options": [
            "Ich freue mich auch über ihr Wohl.",
            "Nur mein Vorteil ist wichtig."
          ],
          "correct": 0,
          "hint": "Verwandtschaft ist ein besonderer Ort, um Rücksicht einzuüben.",
          "explain": "Ich freue mich auch über ihr Wohl."
        },
        {
          "type": "text",
          "prompt": "Warum spricht der Ḥadīṯ allgemein von Glaubensgeschwistern und nicht nur von leiblichen Geschwistern?",
          "sample": "Formuliere drei Sätze für eine friedliche Konfliktlösung mit Geschwistern.",
          "hint": "Verwandtschaft ist ein besonderer Ort, um Rücksicht einzuüben."
        },
        {
          "type": "text",
          "prompt": "Beschreibe eine gerechte Lösung, wenn zwei Geschwister dasselbe Spielzeug wollen.",
          "sample": "Qurʾān 49:10 und Ṣaḥīḥ al-Buḫārī, Nr. 13; Ṣaḥīḥ Muslim, Nr. 45 vermitteln den Grundgedanken; die Übung ist unsere heutige Anwendung.",
          "hint": "Gib die Fundstellen exakt an und trenne eigene Beispiele vom Quellentext."
        }
      ]
    },
    "editorialStatus": "SOURCE_CHECKED_DRAFT_NOT_APPROVED",
    "audioApproved": false,
    "visitorReleased": false
  },
  "iman-offenbarte-buecher": {
    "id": "iman-offenbarte-buecher",
    "editorialSlot": 41,
    "subject": "aqidah",
    "editorialCategory": "iman",
    "topic": "Glaube an die Bücher",
    "title": "Die offenbarten Bücher kennenlernen",
    "lead": "Allah hat den Menschen Rechtleitung offenbart.",
    "goal": "Ich weiß: Der Glaube an Allahs Bücher gehört zum Īmān.",
    "quran": {
      "surah": 2,
      "ayah": 285,
      "label": "Sūrat al-Baqarah · 2:285",
      "arabic": "كُلٌّ آمَنَ بِاللَّهِ وَمَلَائِكَتِهِ وَكُتُبِهِ وَرُسُلِهِ",
      "meaning": "Alle glauben an Allah, Seine Engel, Seine Bücher und Seine Gesandten.",
      "excerpt": true
    },
    "hadith": {
      "source": "Ṣaḥīḥ Muslim, Nr. 8a (Ḥadīṯ Ǧibrīl)",
      "text": "Auf die Frage nach Īmān nannte der Prophet ﷺ auch den Glauben an Allahs offenbarte Bücher."
    },
    "sourceAudit": {
      "quranUrl": "https://quran.com/2/285",
      "hadithUrl": "https://dorar.net/hadith/sharh/138657",
      "quranReference": "2:285",
      "authenticity": "Ṣaḥīḥ",
      "arabicTextType": "excerpt",
      "sourceCheckedDate": "2026-10-11",
      "hadithTextType": "German paraphrase; not a verbatim quotation"
    },
    "hint": "Allah hat den Menschen Rechtleitung offenbart.",
    "sample": "Ich weiß: Der Glaube an Allahs Bücher gehört zum Īmān.",
    "lines": [
      "Im Qurʾān 2:285 werden Allahs Bücher als Teil des Glaubens genannt.",
      "Der Prophet ﷺ nennt die Bücher auch im Ḥadīṯ Ǧibrīl.",
      "Wir kennen den Qurʾān; der Qurʾān spricht zudem von früheren Offenbarungen.",
      "Beim Lernen frage ich nach einer Quelle und höre aufmerksam zu."
    ],
    "ageText": {
      "4-5": {
        "intro": "Wir Muslime glauben an Allahs offenbarte Bücher.",
        "lines": [
          "Allah ließ Propheten Seine Botschaften überbringen.",
          "Der Qurʾān ist das Buch, das wir lernen und lesen.",
          "Wir sprechen mit Achtung über Allahs Offenbarung.",
          "Heute üben wir: Allahs Bücher gehören zum Glauben."
        ],
        "evidence": "Qurʾān und authentische Sunnah lehren uns dieses Thema.",
        "activity": "Zeige auf den Qurʾān und sage: Das ist unsere Offenbarungsschrift."
      },
      "6-8": {
        "intro": "Allah hat Seine Botschaft an Propheten übermittelt.",
        "lines": [
          "Im Qurʾān 2:285 werden Allahs Bücher als Teil des Glaubens genannt.",
          "Der Prophet ﷺ nennt die Bücher auch im Ḥadīṯ Ǧibrīl.",
          "Wir kennen den Qurʾān; der Qurʾān spricht zudem von früheren Offenbarungen.",
          "Beim Lernen frage ich nach einer Quelle und höre aufmerksam zu."
        ],
        "evidence": "Qurʾān 2:285; Ṣaḥīḥ Muslim, Nr. 8a (Ḥadīṯ Ǧibrīl). Die Alltagssituationen sind pädagogische Beispiele, keine wörtlichen Offenbarungstexte.",
        "activity": "Notiere zwei Beispiele: Qurʾān und Tawrāh; frage, welchem Propheten sie zugeordnet werden."
      },
      "9-10": {
        "intro": "Wir unterscheiden den Glauben an die Offenbarung von Fragen über einzelne Handschriften.",
        "lines": [
          "Qurʾān 2:285 bestätigt den Glauben an Allah, Engel, Bücher und Gesandte.",
          "Im Ḥadīṯ Ǧibrīl in Muslim 8a sind die offenbarten Bücher ein Glaubensgrundsatz.",
          "Der Qurʾān ist die letzte an Muḥammad ﷺ offenbarte Schrift.",
          "Wir lernen über Tawrāh, Zabūr und Inǧīl aus gesicherten Qurʾān-Stellen, ohne eigene Geschichten zu erfinden."
        ],
        "evidence": "Qurʾān 2:285; Ṣaḥīḥ Muslim, Nr. 8a (Ḥadīṯ Ǧibrīl). Die Alltagssituationen sind pädagogische Beispiele, keine wörtlichen Offenbarungstexte.",
        "activity": "Ordne Qurʾān, Tawrāh und Inǧīl den bekannten Propheten zu; überprüfe die Belege mit Erwachsenen."
      }
    },
    "questions": {
      "4-5": [
        {
          "type": "choice",
          "prompt": "Woran glauben Muslime?",
          "options": [
            "An die von Allah offenbarten Bücher.",
            "An selbst erfundene heilige Geschichten."
          ],
          "correct": 0,
          "hint": "Allah hat den Menschen Rechtleitung offenbart.",
          "explain": "An die von Allah offenbarten Bücher."
        },
        {
          "type": "choice",
          "prompt": "Was nehmen wir uns für heute vor?",
          "options": [
            "Ich weiß: Der Glaube an Allahs Bücher gehört zum Īmān.",
            "Ich muss niemandem zuhören und nichts üben."
          ],
          "correct": 0,
          "hint": "Allah hat den Menschen Rechtleitung offenbart.",
          "explain": "Ich weiß: Der Glaube an Allahs Bücher gehört zum Īmān."
        }
      ],
      "6-8": [
        {
          "type": "choice",
          "prompt": "Welcher Ḥadīṯ nennt den Glauben an die Bücher?",
          "options": [
            "Der Ḥadīṯ Ǧibrīl in Ṣaḥīḥ Muslim 8a.",
            "Ein unbekanntes Sprichwort."
          ],
          "correct": 0,
          "hint": "Allah hat Seine Botschaft an Propheten übermittelt.",
          "explain": "Der Ḥadīṯ Ǧibrīl in Ṣaḥīḥ Muslim 8a."
        },
        {
          "type": "text",
          "prompt": "Welche kleine Alltagsübung passt zu „Die offenbarten Bücher kennenlernen“?",
          "sample": "Notiere zwei Beispiele: Qurʾān und Tawrāh; frage, welchem Propheten sie zugeordnet werden.",
          "hint": "Ich weiß: Der Glaube an Allahs Bücher gehört zum Īmān."
        },
        {
          "type": "choice",
          "prompt": "Wo findest du die religiöse Grundlage?",
          "options": [
            "Qurʾān 2:285 und Ṣaḥīḥ Muslim, Nr. 8a (Ḥadīṯ Ǧibrīl)",
            "In einer Geschichte ohne überprüfbare Quelle."
          ],
          "correct": 0,
          "hint": "Wir trennen Quellen und Übungen.",
          "explain": "Qurʾān 2:285; Ṣaḥīḥ Muslim, Nr. 8a (Ḥadīṯ Ǧibrīl)"
        }
      ],
      "9-10": [
        {
          "type": "choice",
          "prompt": "Welcher Ḥadīṯ nennt den Glauben an die Bücher?",
          "options": [
            "Der Ḥadīṯ Ǧibrīl in Ṣaḥīḥ Muslim 8a.",
            "Ein unbekanntes Sprichwort."
          ],
          "correct": 0,
          "hint": "Wir unterscheiden den Glauben an die Offenbarung von Fragen über einzelne Handschriften.",
          "explain": "Der Ḥadīṯ Ǧibrīl in Ṣaḥīḥ Muslim 8a."
        },
        {
          "type": "text",
          "prompt": "Wodurch unterscheiden sich Qurʾān und eine frei erfundene religiöse Erzählung?",
          "sample": "Ordne Qurʾān, Tawrāh und Inǧīl den bekannten Propheten zu; überprüfe die Belege mit Erwachsenen.",
          "hint": "Wir unterscheiden den Glauben an die Offenbarung von Fragen über einzelne Handschriften."
        },
        {
          "type": "text",
          "prompt": "Nenne den Beleg in Qurʾān 2:285 und erkläre den Bezug zum Ḥadīṯ Ǧibrīl.",
          "sample": "Qurʾān 2:285 und Ṣaḥīḥ Muslim, Nr. 8a (Ḥadīṯ Ǧibrīl) vermitteln den Grundgedanken; die Übung ist unsere heutige Anwendung.",
          "hint": "Gib die Fundstellen exakt an und trenne eigene Beispiele vom Quellentext."
        }
      ]
    },
    "editorialStatus": "SOURCE_CHECKED_DRAFT_NOT_APPROVED",
    "audioApproved": false,
    "visitorReleased": false
  },
  "iman-juengster-tag": {
    "id": "iman-juengster-tag",
    "editorialSlot": 42,
    "subject": "aqidah",
    "editorialCategory": "iman",
    "topic": "Der Jüngste Tag",
    "title": "Der Glaube an den Jüngsten Tag",
    "lead": "Das Leben hat Verantwortung und Hoffnung.",
    "goal": "Ich weiß, dass der Jüngste Tag zum Glauben gehört und gute Taten wichtig sind.",
    "quran": {
      "surah": 2,
      "ayah": 4,
      "label": "Sūrat al-Baqarah · 2:4",
      "arabic": "وَبِالْآخِرَةِ هُمْ يُوقِنُونَ",
      "meaning": "Und sie sind vom Jenseits überzeugt.",
      "excerpt": true
    },
    "hadith": {
      "source": "Ṣaḥīḥ Muslim, Nr. 8a (Ḥadīṯ Ǧibrīl)",
      "text": "Im Ḥadīṯ Ǧibrīl nennt der Prophet ﷺ den Glauben an den Jüngsten Tag als Bestandteil des Īmān."
    },
    "sourceAudit": {
      "quranUrl": "https://quran.com/2/4",
      "hadithUrl": "https://dorar.net/hadith/sharh/138657",
      "quranReference": "2:4",
      "authenticity": "Ṣaḥīḥ",
      "arabicTextType": "excerpt",
      "sourceCheckedDate": "2026-10-11",
      "hadithTextType": "German paraphrase; not a verbatim quotation"
    },
    "hint": "Das Leben hat Verantwortung und Hoffnung.",
    "sample": "Ich weiß, dass der Jüngste Tag zum Glauben gehört und gute Taten wichtig sind.",
    "lines": [
      "Qurʾān 2:4 lobt den festen Glauben an das Jenseits.",
      "Der Prophet ﷺ nannte den Jüngsten Tag im Ḥadīṯ Ǧibrīl.",
      "Wir bemühen uns um gute Taten und geben Fehler ehrlich zu.",
      "Wir sprechen darüber ohne Angstgeschichten oder erfundene Einzelheiten."
    ],
    "ageText": {
      "4-5": {
        "intro": "Wir glauben daran, dass wir zu Allah zurückkehren.",
        "lines": [
          "Allah kennt unsere guten Handlungen.",
          "Es ist schön, ehrlich und freundlich zu sein.",
          "Wir lernen: Es gibt einen Jüngsten Tag.",
          "Ich darf Allah um Gutes bitten und auf Seine Barmherzigkeit hoffen."
        ],
        "evidence": "Qurʾān und authentische Sunnah lehren uns dieses Thema.",
        "activity": "Male ein Herz und erzähle von einer guten Tat."
      },
      "6-8": {
        "intro": "Der Glaube an den Jüngsten Tag hilft uns, sorgfältig zu handeln.",
        "lines": [
          "Qurʾān 2:4 lobt den festen Glauben an das Jenseits.",
          "Der Prophet ﷺ nannte den Jüngsten Tag im Ḥadīṯ Ǧibrīl.",
          "Wir bemühen uns um gute Taten und geben Fehler ehrlich zu.",
          "Wir sprechen darüber ohne Angstgeschichten oder erfundene Einzelheiten."
        ],
        "evidence": "Qurʾān 2:4; Ṣaḥīḥ Muslim, Nr. 8a (Ḥadīṯ Ǧibrīl). Die Alltagssituationen sind pädagogische Beispiele, keine wörtlichen Offenbarungstexte.",
        "activity": "Schreibe eine gute Tat auf, die du morgen tun möchtest."
      },
      "9-10": {
        "intro": "Der Glaube an die Āḫirah verbindet Hoffnung mit Verantwortung.",
        "lines": [
          "Die Überzeugung vom Jenseits steht ausdrücklich in Qurʾān 2:4.",
          "Der Ḥadīṯ Ǧibrīl zählt sie zu den Glaubensgrundlagen.",
          "Wir vertrauen auf Allahs Gerechtigkeit und Seine Barmherzigkeit.",
          "Wir behaupten über den Ablauf des Jüngsten Tages nur, was durch Quellen belegt ist."
        ],
        "evidence": "Qurʾān 2:4; Ṣaḥīḥ Muslim, Nr. 8a (Ḥadīṯ Ǧibrīl). Die Alltagssituationen sind pädagogische Beispiele, keine wörtlichen Offenbarungstexte.",
        "activity": "Erkläre an zwei Alltagssituationen, wie Verantwortung unser Verhalten verändert."
      }
    },
    "questions": {
      "4-5": [
        {
          "type": "choice",
          "prompt": "Was gehört zum Glauben?",
          "options": [
            "Der Glaube an den Jüngsten Tag.",
            "Dass es niemals Verantwortung gibt."
          ],
          "correct": 0,
          "hint": "Das Leben hat Verantwortung und Hoffnung.",
          "explain": "Der Glaube an den Jüngsten Tag."
        },
        {
          "type": "choice",
          "prompt": "Was nehmen wir uns für heute vor?",
          "options": [
            "Ich weiß, dass der Jüngste Tag zum Glauben gehört und gute Taten wichtig sind.",
            "Ich muss niemandem zuhören und nichts üben."
          ],
          "correct": 0,
          "hint": "Das Leben hat Verantwortung und Hoffnung.",
          "explain": "Ich weiß, dass der Jüngste Tag zum Glauben gehört und gute Taten wichtig sind."
        }
      ],
      "6-8": [
        {
          "type": "choice",
          "prompt": "Wie sprechen wir über das Jenseits?",
          "options": [
            "Mit Qurʾān- und Sunnah-Belegen und Hoffnung.",
            "Mit erfundenen Angstgeschichten."
          ],
          "correct": 0,
          "hint": "Der Glaube an den Jüngsten Tag hilft uns, sorgfältig zu handeln.",
          "explain": "Mit Qurʾān- und Sunnah-Belegen und Hoffnung."
        },
        {
          "type": "text",
          "prompt": "Welche kleine Alltagsübung passt zu „Der Glaube an den Jüngsten Tag“?",
          "sample": "Schreibe eine gute Tat auf, die du morgen tun möchtest.",
          "hint": "Ich weiß, dass der Jüngste Tag zum Glauben gehört und gute Taten wichtig sind."
        },
        {
          "type": "choice",
          "prompt": "Wo findest du die religiöse Grundlage?",
          "options": [
            "Qurʾān 2:4 und Ṣaḥīḥ Muslim, Nr. 8a (Ḥadīṯ Ǧibrīl)",
            "In einer Geschichte ohne überprüfbare Quelle."
          ],
          "correct": 0,
          "hint": "Wir trennen Quellen und Übungen.",
          "explain": "Qurʾān 2:4; Ṣaḥīḥ Muslim, Nr. 8a (Ḥadīṯ Ǧibrīl)"
        }
      ],
      "9-10": [
        {
          "type": "choice",
          "prompt": "Wie sprechen wir über das Jenseits?",
          "options": [
            "Mit Qurʾān- und Sunnah-Belegen und Hoffnung.",
            "Mit erfundenen Angstgeschichten."
          ],
          "correct": 0,
          "hint": "Der Glaube an die Āḫirah verbindet Hoffnung mit Verantwortung.",
          "explain": "Mit Qurʾān- und Sunnah-Belegen und Hoffnung."
        },
        {
          "type": "text",
          "prompt": "Warum passen Hoffnung und Verantwortung beim Glauben an die Āḫirah zusammen?",
          "sample": "Erkläre an zwei Alltagssituationen, wie Verantwortung unser Verhalten verändert.",
          "hint": "Der Glaube an die Āḫirah verbindet Hoffnung mit Verantwortung."
        },
        {
          "type": "text",
          "prompt": "Welche Aussage findest du in 2:4 und welche im Ḥadīṯ Ǧibrīl?",
          "sample": "Qurʾān 2:4 und Ṣaḥīḥ Muslim, Nr. 8a (Ḥadīṯ Ǧibrīl) vermitteln den Grundgedanken; die Übung ist unsere heutige Anwendung.",
          "hint": "Gib die Fundstellen exakt an und trenne eigene Beispiele vom Quellentext."
        }
      ]
    },
    "editorialStatus": "SOURCE_CHECKED_DRAFT_NOT_APPROVED",
    "audioApproved": false,
    "visitorReleased": false
  },
  "iman-allahs-wissen-weisheit": {
    "id": "iman-allahs-wissen-weisheit",
    "editorialSlot": 43,
    "subject": "aqidah",
    "editorialCategory": "iman",
    "topic": "Allahs Wissen und Weisheit",
    "title": "Allahs Wissen und Weisheit",
    "lead": "Allah weiß, was wir Menschen nicht wissen.",
    "goal": "Ich kann sagen: Allah ist allwissend und allweise; ich lerne bescheiden.",
    "quran": {
      "surah": 2,
      "ayah": 32,
      "label": "Sūrat al-Baqarah · 2:32",
      "arabic": "إِنَّكَ أَنْتَ الْعَلِيمُ الْحَكِيمُ",
      "meaning": "Du bist wahrlich der Allwissende, der Allweise.",
      "excerpt": true
    },
    "hadith": {
      "source": "Ṣaḥīḥ al-Buḫārī, Nr. 1166 (Duʿāʾ al-Istiḫārah)",
      "text": "Der Prophet ﷺ lehrte ein Bittgebet, in dem der Mensch bekennt: Allah weiß, und ich weiß nicht."
    },
    "sourceAudit": {
      "quranUrl": "https://quran.com/2/32",
      "hadithUrl": "https://dorar.net/h/HkHepnlN",
      "quranReference": "2:32",
      "authenticity": "Ṣaḥīḥ",
      "arabicTextType": "excerpt",
      "sourceCheckedDate": "2026-10-11",
      "hadithTextType": "German paraphrase; not a verbatim quotation"
    },
    "hint": "Allah weiß, was wir Menschen nicht wissen.",
    "sample": "Ich kann sagen: Allah ist allwissend und allweise; ich lerne bescheiden.",
    "lines": [
      "In Qurʾān 2:32 werden Allahs Wissen und Weisheit genannt.",
      "Der Prophet ﷺ lehrte in einem Duʿāʾ: Allah weiß, der Mensch weiß nicht.",
      "Wir verwechseln menschliche Vermutungen nicht mit sicheren Quellen.",
      "Wenn mir etwas unklar ist, frage ich und lerne weiter."
    ],
    "ageText": {
      "4-5": {
        "intro": "Allah weiß mehr als wir.",
        "lines": [
          "Ich kann vieles lernen, aber nicht alles wissen.",
          "Allah ist al-ʿAlīm: der Allwissende.",
          "Ich sage ehrlich, wenn ich etwas nicht weiß.",
          "Ich darf Erwachsene freundlich fragen."
        ],
        "evidence": "Qurʾān und authentische Sunnah lehren uns dieses Thema.",
        "activity": "Sage einen Satz: Das weiß ich schon; das möchte ich noch lernen."
      },
      "6-8": {
        "intro": "Wissen ist wertvoll. Wer etwas nicht weiß, darf nachfragen.",
        "lines": [
          "In Qurʾān 2:32 werden Allahs Wissen und Weisheit genannt.",
          "Der Prophet ﷺ lehrte in einem Duʿāʾ: Allah weiß, der Mensch weiß nicht.",
          "Wir verwechseln menschliche Vermutungen nicht mit sicheren Quellen.",
          "Wenn mir etwas unklar ist, frage ich und lerne weiter."
        ],
        "evidence": "Qurʾān 2:32; Ṣaḥīḥ al-Buḫārī, Nr. 1166 (Duʿāʾ al-Istiḫārah). Die Alltagssituationen sind pädagogische Beispiele, keine wörtlichen Offenbarungstexte.",
        "activity": "Schreibe drei Fragen auf, die du mit Eltern oder Lehrkraft klären möchtest."
      },
      "9-10": {
        "intro": "Die im Qurʾān genannten Namen Allahs lehren uns Bescheidenheit.",
        "lines": [
          "In 2:32 sprechen die Engel davon, nur das zu wissen, was Allah sie gelehrt hat.",
          "Die Worte al-ʿAlīm und al-Ḥakīm werden dort zusammen genannt.",
          "Das Istiḫārah-Gebet in al-Buḫārī 1166 betont Allahs Wissen und unser begrenztes Wissen.",
          "Wir erfinden keine Erklärungen über Allahs Verborgenes und bleiben beim überlieferten Text."
        ],
        "evidence": "Qurʾān 2:32; Ṣaḥīḥ al-Buḫārī, Nr. 1166 (Duʿāʾ al-Istiḫārah). Die Alltagssituationen sind pädagogische Beispiele, keine wörtlichen Offenbarungstexte.",
        "activity": "Vergleiche die Formulierung in Qurʾān 2:32 mit der im Istiḫārah-Duʿāʾ."
      }
    },
    "questions": {
      "4-5": [
        {
          "type": "choice",
          "prompt": "Was darf ich sagen, wenn ich etwas nicht weiß?",
          "options": [
            "Ich frage freundlich nach.",
            "Ich behaupte einfach etwas Erfundenes."
          ],
          "correct": 0,
          "hint": "Allah weiß, was wir Menschen nicht wissen.",
          "explain": "Ich frage freundlich nach."
        },
        {
          "type": "choice",
          "prompt": "Was nehmen wir uns für heute vor?",
          "options": [
            "Ich kann sagen: Allah ist allwissend und allweise; ich lerne bescheiden.",
            "Ich muss niemandem zuhören und nichts üben."
          ],
          "correct": 0,
          "hint": "Allah weiß, was wir Menschen nicht wissen.",
          "explain": "Ich kann sagen: Allah ist allwissend und allweise; ich lerne bescheiden."
        }
      ],
      "6-8": [
        {
          "type": "choice",
          "prompt": "Welche zwei Namen kommen in 2:32 zusammen vor?",
          "options": [
            "al-ʿAlīm und al-Ḥakīm.",
            "Namen, die wir selbst erfunden haben."
          ],
          "correct": 0,
          "hint": "Wissen ist wertvoll. Wer etwas nicht weiß, darf nachfragen.",
          "explain": "al-ʿAlīm und al-Ḥakīm."
        },
        {
          "type": "text",
          "prompt": "Welche kleine Alltagsübung passt zu „Allahs Wissen und Weisheit“?",
          "sample": "Schreibe drei Fragen auf, die du mit Eltern oder Lehrkraft klären möchtest.",
          "hint": "Ich kann sagen: Allah ist allwissend und allweise; ich lerne bescheiden."
        },
        {
          "type": "choice",
          "prompt": "Wo findest du die religiöse Grundlage?",
          "options": [
            "Qurʾān 2:32 und Ṣaḥīḥ al-Buḫārī, Nr. 1166 (Duʿāʾ al-Istiḫārah)",
            "In einer Geschichte ohne überprüfbare Quelle."
          ],
          "correct": 0,
          "hint": "Wir trennen Quellen und Übungen.",
          "explain": "Qurʾān 2:32; Ṣaḥīḥ al-Buḫārī, Nr. 1166 (Duʿāʾ al-Istiḫārah)"
        }
      ],
      "9-10": [
        {
          "type": "choice",
          "prompt": "Welche zwei Namen kommen in 2:32 zusammen vor?",
          "options": [
            "al-ʿAlīm und al-Ḥakīm.",
            "Namen, die wir selbst erfunden haben."
          ],
          "correct": 0,
          "hint": "Die im Qurʾān genannten Namen Allahs lehren uns Bescheidenheit.",
          "explain": "al-ʿAlīm und al-Ḥakīm."
        },
        {
          "type": "text",
          "prompt": "Welche Grenze hat menschliches Wissen im Vergleich zu Allahs Wissen?",
          "sample": "Vergleiche die Formulierung in Qurʾān 2:32 mit der im Istiḫārah-Duʿāʾ.",
          "hint": "Die im Qurʾān genannten Namen Allahs lehren uns Bescheidenheit."
        },
        {
          "type": "text",
          "prompt": "Erläutere, wie Qurʾān 2:32 und al-Buḫārī 1166 zur Bescheidenheit erziehen.",
          "sample": "Qurʾān 2:32 und Ṣaḥīḥ al-Buḫārī, Nr. 1166 (Duʿāʾ al-Istiḫārah) vermitteln den Grundgedanken; die Übung ist unsere heutige Anwendung.",
          "hint": "Gib die Fundstellen exakt an und trenne eigene Beispiele vom Quellentext."
        }
      ]
    },
    "editorialStatus": "SOURCE_CHECKED_DRAFT_NOT_APPROVED",
    "audioApproved": false,
    "visitorReleased": false
  },
  "aqidah-fragen-respektvoll": {
    "id": "aqidah-fragen-respektvoll",
    "editorialSlot": 44,
    "subject": "aqidah",
    "editorialCategory": "aqidah",
    "topic": "Respektvolle Glaubensfragen",
    "title": "Fragen über den Glauben respektvoll stellen",
    "lead": "Eine ehrliche Frage ist ein guter Anfang zum Lernen.",
    "goal": "Ich stelle Fragen höflich und unterscheide sichere Belege von Vermutungen.",
    "quran": {
      "surah": 16,
      "ayah": 43,
      "label": "Sūrat an-Naḥl · 16:43",
      "arabic": "فَاسْأَلُوا أَهْلَ الذِّكْرِ إِنْ كُنْتُمْ لَا تَعْلَمُونَ",
      "meaning": "Fragt die Wissenden, wenn ihr es nicht wisst.",
      "excerpt": true
    },
    "hadith": {
      "source": "Ṣaḥīḥ Muslim, Nr. 8a (Ḥadīṯ Ǧibrīl)",
      "text": "Ǧibrīl stellte dem Propheten ﷺ Fragen zum Glauben; die Anwesenden lernten durch dieses Gespräch."
    },
    "sourceAudit": {
      "quranUrl": "https://quran.com/16/43",
      "hadithUrl": "https://dorar.net/hadith/sharh/138657",
      "quranReference": "16:43",
      "authenticity": "Ṣaḥīḥ",
      "arabicTextType": "excerpt",
      "sourceCheckedDate": "2026-10-11",
      "hadithTextType": "German paraphrase; not a verbatim quotation"
    },
    "hint": "Eine ehrliche Frage ist ein guter Anfang zum Lernen.",
    "sample": "Ich stelle Fragen höflich und unterscheide sichere Belege von Vermutungen.",
    "lines": [
      "Der Qurʾān spricht davon, bei fehlendem Wissen Kundige zu fragen.",
      "Ǧibrīl stellte im bekannten Ḥadīṯ Fragen über den Glauben.",
      "Ich frage nach dem Beleg und höre die Erklärung an.",
      "Wenn jemand keine Antwort weiß, suchen wir eine verlässliche Auskunft."
    ],
    "ageText": {
      "4-5": {
        "intro": "Wenn ich etwas nicht verstehe, frage ich freundlich.",
        "lines": [
          "Ich darf sagen: Kannst du mir das erklären?",
          "Ich höre der Antwort aufmerksam zu.",
          "Ich muss nicht so tun, als wüsste ich alles.",
          "Wir behandeln andere mit Respekt."
        ],
        "evidence": "Qurʾān und authentische Sunnah lehren uns dieses Thema.",
        "activity": "Übe mit einem Erwachsenen die Frage: Kannst du mir das bitte erklären?"
      },
      "6-8": {
        "intro": "Auch schwierige Themen können wir ruhig besprechen.",
        "lines": [
          "Der Qurʾān spricht davon, bei fehlendem Wissen Kundige zu fragen.",
          "Ǧibrīl stellte im bekannten Ḥadīṯ Fragen über den Glauben.",
          "Ich frage nach dem Beleg und höre die Erklärung an.",
          "Wenn jemand keine Antwort weiß, suchen wir eine verlässliche Auskunft."
        ],
        "evidence": "Qurʾān 16:43; Ṣaḥīḥ Muslim, Nr. 8a (Ḥadīṯ Ǧibrīl). Die Alltagssituationen sind pädagogische Beispiele, keine wörtlichen Offenbarungstexte.",
        "activity": "Formuliere drei freundliche Fragen und ordne ihnen eine geeignete Vertrauensperson zu."
      },
      "9-10": {
        "intro": "Aufrichtige Fragen sollen zu gesichertem Wissen führen.",
        "lines": [
          "Qurʾān 16:43 verweist im Zusammenhang mit früheren Gesandten auf Menschen mit Schriftkenntnis.",
          "Der Ḥadīṯ Ǧibrīl zeigt, wie Fragen zur Vermittlung religiösen Wissens dienen.",
          "Für Fragen zur ʿAqīdah suchen wir qualifizierte Menschen und überprüfbare Quellen.",
          "Ich unterscheide ausdrücklich Textbeleg, Erklärung und persönliche Vermutung."
        ],
        "evidence": "Qurʾān 16:43; Ṣaḥīḥ Muslim, Nr. 8a (Ḥadīṯ Ǧibrīl). Die Alltagssituationen sind pädagogische Beispiele, keine wörtlichen Offenbarungstexte.",
        "activity": "Schreibe eine Frage auf und dokumentiere, welche Qurʾān- oder Ḥadīṯ-Stelle die Antwort trägt."
      }
    },
    "questions": {
      "4-5": [
        {
          "type": "choice",
          "prompt": "Du verstehst ein Glaubensthema nicht. Was tust du?",
          "options": [
            "Ich frage höflich nach.",
            "Ich lache andere aus."
          ],
          "correct": 0,
          "hint": "Eine ehrliche Frage ist ein guter Anfang zum Lernen.",
          "explain": "Ich frage höflich nach."
        },
        {
          "type": "choice",
          "prompt": "Was nehmen wir uns für heute vor?",
          "options": [
            "Ich stelle Fragen höflich und unterscheide sichere Belege von Vermutungen.",
            "Ich muss niemandem zuhören und nichts üben."
          ],
          "correct": 0,
          "hint": "Eine ehrliche Frage ist ein guter Anfang zum Lernen.",
          "explain": "Ich stelle Fragen höflich und unterscheide sichere Belege von Vermutungen."
        }
      ],
      "6-8": [
        {
          "type": "choice",
          "prompt": "Was zeigt uns der Ḥadīṯ Ǧibrīl über das Lernen?",
          "options": [
            "Fragen können Wissen vermitteln.",
            "Fragen sind grundsätzlich verboten."
          ],
          "correct": 0,
          "hint": "Auch schwierige Themen können wir ruhig besprechen.",
          "explain": "Fragen können Wissen vermitteln."
        },
        {
          "type": "text",
          "prompt": "Welche kleine Alltagsübung passt zu „Fragen über den Glauben respektvoll stellen“?",
          "sample": "Formuliere drei freundliche Fragen und ordne ihnen eine geeignete Vertrauensperson zu.",
          "hint": "Ich stelle Fragen höflich und unterscheide sichere Belege von Vermutungen."
        },
        {
          "type": "choice",
          "prompt": "Wo findest du die religiöse Grundlage?",
          "options": [
            "Qurʾān 16:43 und Ṣaḥīḥ Muslim, Nr. 8a (Ḥadīṯ Ǧibrīl)",
            "In einer Geschichte ohne überprüfbare Quelle."
          ],
          "correct": 0,
          "hint": "Wir trennen Quellen und Übungen.",
          "explain": "Qurʾān 16:43; Ṣaḥīḥ Muslim, Nr. 8a (Ḥadīṯ Ǧibrīl)"
        }
      ],
      "9-10": [
        {
          "type": "choice",
          "prompt": "Was zeigt uns der Ḥadīṯ Ǧibrīl über das Lernen?",
          "options": [
            "Fragen können Wissen vermitteln.",
            "Fragen sind grundsätzlich verboten."
          ],
          "correct": 0,
          "hint": "Aufrichtige Fragen sollen zu gesichertem Wissen führen.",
          "explain": "Fragen können Wissen vermitteln."
        },
        {
          "type": "text",
          "prompt": "Welchen ursprünglichen Zusammenhang hat Qurʾān 16:43?",
          "sample": "Schreibe eine Frage auf und dokumentiere, welche Qurʾān- oder Ḥadīṯ-Stelle die Antwort trägt.",
          "hint": "Aufrichtige Fragen sollen zu gesichertem Wissen führen."
        },
        {
          "type": "text",
          "prompt": "Erkläre den Unterschied zwischen einem überprüfbaren religiösen Beleg und einer Vermutung.",
          "sample": "Qurʾān 16:43 und Ṣaḥīḥ Muslim, Nr. 8a (Ḥadīṯ Ǧibrīl) vermitteln den Grundgedanken; die Übung ist unsere heutige Anwendung.",
          "hint": "Gib die Fundstellen exakt an und trenne eigene Beispiele vom Quellentext."
        }
      ]
    },
    "editorialStatus": "SOURCE_CHECKED_DRAFT_NOT_APPROVED",
    "audioApproved": false,
    "visitorReleased": false
  }
};
for(const [id,l] of Object.entries(additions)){
 if(existing[id]||id!==l.id)throw Error("KIDS creator duplicate or invalid ID: "+id);
 for(const age of ["4-5","6-8","9-10"]){
  if(l.ageText[age].lines.length!==4||l.questions[age].length<2||!l.ageText[age].activity)throw Error("Incomplete age tier: "+id+" "+age);
 }
 if(!l.quran.excerpt||!l.sourceAudit.hadithUrl||l.audioApproved||l.visitorReleased)throw Error("Release guard: "+id);
}
window.DARKidsAcademyCurriculum=Object.freeze({...existing,...additions});
window.DARKidsAcademyCreatorDraftsV23=Object.freeze({ids:Object.keys(additions),count:6,ageVersions:18,sourceChecked:true,editorialApproved:false,voiceApproved:false,visitorReleased:false});
})();
