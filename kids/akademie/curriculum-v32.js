/* KIDS V32 · Unterricht 75–78; altersgerechte Originalbelege, eigene pädagogische Übungen.
 * Kein TTS, keine Fortschrittsänderungen für bestehende Kinder, keine Freigabe von Audio.
 */
(function(){
"use strict";
const prior=window.DARKidsAcademyCurriculum;
if(!prior||!prior["family-ehrliche-freundschaften-pflegen"])return;
const additions={
  "aqidah-allah-versorgt-geschopfe": {
    "id": "aqidah-allah-versorgt-geschopfe",
    "subject": "aqidah",
    "pillar": "tawhid",
    "topic": "Allah versorgt uns",
    "title": "Tawḥīd · Allah ist der Versorger",
    "lead": "Wir erkennen Allah als Versorger und lernen, dankbar mit Lebensmitteln umzugehen.",
    "goal": "Ich weiß, dass Versorgung von Allah kommt, und verstehe, warum Menschen sich verantwortungsvoll darum bemühen.",
    "quran": {
      "surah": 11,
      "ayah": 6,
      "label": "Sūrat Hūd · 11:6",
      "arabic": "وَمَا مِنْ دَابَّةٍ فِي الْأَرْضِ إِلَّا عَلَى اللَّهِ رِزْقُهَا",
      "meaning": "Es gibt kein Lebewesen auf der Erde, dessen Versorgung nicht bei Allah liegt. (Sinngemäßer Versauszug)",
      "excerpt": true
    },
    "hadith": {
      "source": "Ǧāmiʿ at-Tirmiḏī, Nr. 2344 · ʿUmar ibn al-Ḫaṭṭāb · authentisch eingestuft",
      "text": "Der Prophet ﷺ verglich das Vertrauen auf Allah mit Vögeln, die morgens hungrig ausfliegen und abends versorgt zurückkommen. (Sinngemäße Bedeutung)"
    },
    "sourceAudit": {
      "hadithUrl": "https://dorar.net/hadith/sharh/35572",
      "hadithNumber": "2344",
      "narrator": "ʿUmar ibn al-Ḫaṭṭāb",
      "authenticity": "Ṣaḥīḥ",
      "quranReference": "11:6",
      "quranTextType": "excerpt",
      "hadithMeaningIsParaphrase": true,
      "verifiedDate": "2026-10-13",
      "note": "Der Ḥadīṯ wird bei Tirmiḏī überliefert und authentisch eingestuft. Tawakkul ersetzt keineswegs Bemühung, Hilfesuche und elterliche Fürsorge. Keinem Kind bei Hunger ausschließlich Geduld oder Gebet empfehlen; es braucht verlässliche menschliche Hilfe."
    },
    "hint": "Erwachsene bleiben verantwortlich, Kindern Essen und Hilfe bereitzustellen. Kein Versprechen, dass niemand je hungert.",
    "sample": "Allah ist unser Versorger. Wir bemühen uns um Gutes und sind dankbar.",
    "ageText": {
      "4-5": {
        "intro": "Wir haben Wasser, Brot und Obst. Dafür können wir dankbar sein.",
        "lines": [
          "Allah ist der Versorger.",
          "Tiere suchen Futter und wir erhalten Essen.",
          "Ich sage al-ḥamdu lillāh und gehe achtsam mit Essen um.",
          "Wenn ich Hunger habe, sage ich es einem Erwachsenen."
        ],
        "evidence": "Qurʾān 11:6 nennt Allahs Versorgung; die Alltagsszene ist eine eigene Erklärung."
      },
      "6-8": {
        "intro": "Woher kommt unsere Versorgung?",
        "lines": [
          "In Qurʾān 11:6 wird Allah als Versorger der Lebewesen beschrieben.",
          "Der Prophet ﷺ nannte das Beispiel von Vögeln, die morgens Nahrung suchen.",
          "Vertrauen auf Allah und sich bemühen gehören zusammen.",
          "Wir verschwenden nicht, teilen wo möglich und bitten bei Bedarf um Hilfe."
        ],
        "evidence": "Vögel im Ḥadīṯ zeigen Vertrauen und tätiges Suchen, nicht Untätigkeit."
      },
      "9-10": {
        "intro": "Wir lernen Tawakkul: Allah vertrauen und zugleich erlaubte Mittel nutzen.",
        "lines": [
          "Qurʾān 11:6 betont Allahs Wissen und Versorgung der Geschöpfe.",
          "At-Tirmiḏī 2344 beschreibt Vögel, die morgens zur Nahrungssuche aufbrechen.",
          "Daraus lernen wir, uns auf Allah zu verlassen, ohne die Verantwortung für notwendige Schritte zu vernachlässigen.",
          "Weder verspricht der Ḥadīṯ ein stets leichtes Leben noch entbindet er Erwachsene davon, hilfsbedürftige Menschen zu unterstützen."
        ],
        "evidence": "Das Beispiel mit Lebensmitteln ist didaktisch. Der Ḥadīṯ betrifft Vertrauen und aktive Bemühung."
      }
    },
    "questions": {
      "4-5": [
        {
          "type": "choice",
          "prompt": "Wer ist der Versorger?",
          "options": [
            "Allah.",
            "Ein Gegenstand."
          ],
          "correct": 0,
          "hint": "Denk an den Qurʾān.",
          "explain": "Allah versorgt die Geschöpfe."
        },
        {
          "type": "choice",
          "prompt": "Was machst du, wenn du Hunger hast?",
          "options": [
            "Ich sage es einer vertrauenswürdigen erwachsenen Person.",
            "Ich darf niemandem etwas sagen."
          ],
          "correct": 0,
          "hint": "Du darfst Hilfe holen.",
          "explain": "Versorgung ist Aufgabe der Erwachsenen."
        }
      ],
      "6-8": [
        {
          "type": "choice",
          "prompt": "Was machen die Vögel im Ḥadīṯ?",
          "options": [
            "Sie fliegen los und suchen Nahrung.",
            "Sie tun niemals etwas."
          ],
          "correct": 0,
          "hint": "Sieh das Beispiel im Ḥadīṯ.",
          "explain": "Sie bemühen sich und vertrauen Allah."
        },
        {
          "type": "choice",
          "prompt": "Was passt zu Dankbarkeit?",
          "options": [
            "Mit Essen achtsam umgehen.",
            "Absichtlich alles wegwerfen."
          ],
          "correct": 0,
          "hint": "Dankbar handeln.",
          "explain": "Wir vermeiden Verschwendung."
        },
        {
          "type": "text",
          "prompt": "Was bedeutet Tawakkul im Alltag?",
          "sample": "Ich vertraue Allah, bemühe mich und bitte bei Bedarf um Hilfe.",
          "hint": "Vertrauen und Handeln gehören zusammen."
        }
      ],
      "9-10": [
        {
          "type": "choice",
          "prompt": "Was folgt nicht aus dem Ḥadīṯ?",
          "options": [
            "Dass wir nie etwas tun oder Hilfe holen müssten.",
            "Dass wir uns an Allah wenden und zugleich handeln."
          ],
          "correct": 0,
          "hint": "Beachte die Nahrungssuche der Vögel.",
          "explain": "Vertrauen heißt nicht Untätigkeit."
        },
        {
          "type": "text",
          "prompt": "Verbinde Qurʾān 11:6 mit at-Tirmiḏī 2344.",
          "sample": "Allah ist Versorger; die Vögel suchen dennoch aktiv Nahrung.",
          "hint": "Unterscheide Gottes Versorgung und menschliche Handlung."
        },
        {
          "type": "text",
          "prompt": "Was ist bei einem hungrigen Kind besonders wichtig?",
          "sample": "Zuverlässige Erwachsene sorgen für Essen und praktische Hilfe.",
          "hint": "Ein Kind darf nicht mit bloßen Worten abgespeist werden."
        }
      ]
    },
    "voiceApproved": false
  },
  "aqidah-engel-aufgaben-kennen": {
    "id": "aqidah-engel-aufgaben-kennen",
    "subject": "aqidah",
    "pillar": "iman",
    "topic": "Aufgaben der Engel",
    "title": "Īmān · Engel haben Aufgaben",
    "lead": "Wir lernen aus Qurʾān und Sunnah einige Aufgaben der Engel.",
    "goal": "Ich kenne die im Qurʾān genannten aufzeichnenden Engel und eine weitere authentisch überlieferte Aufgabe.",
    "quran": {
      "surah": 82,
      "ayah": 10,
      "label": "Sūrat al-Infiṭār · 82:10–12",
      "arabic": "وَإِنَّ عَلَيْكُمْ لَحَافِظِينَ ۝ كِرَامًا كَاتِبِينَ ۝ يَعْلَمُونَ مَا تَفْعَلُونَ",
      "meaning": "Über euch sind Hüter gesetzt: ehrenvolle Aufschreibende, die wissen, was ihr tut. (Sinngemäße Bedeutung)",
      "excerpt": false
    },
    "hadith": {
      "source": "Ṣaḥīḥ al-Buḫārī, Nr. 555; Ṣaḥīḥ Muslim, Nr. 632 · Abū Hurayrah",
      "text": "Der Prophet ﷺ berichtete von Engeln, die einander nachts und tagsüber ablösen und bei Faǧr und ʿAṣr zusammenkommen. (Sinngemäße Bedeutung)"
    },
    "sourceAudit": {
      "hadithUrl": "https://dorar.net/hadith/sharh/7560",
      "hadithNumber": "555",
      "narrator": "Abū Hurayrah",
      "authenticity": "Ṣaḥīḥ",
      "quranReference": "82:10-12",
      "quranTextType": "complete",
      "hadithMeaningIsParaphrase": true,
      "verifiedDate": "2026-10-13",
      "note": "Qurʾān 82:10–12 lehrt aufzeichnende Engel, der Ḥadīṯ weitere Engel bei den Gebetszeiten. Nicht behaupten, dass im Ḥadīṯ ausdrücklich dieselben Engel wie in 82:10–12 gemeint seien. Keine erfundenen Darstellungen, Namen oder Details."
    },
    "hint": "Engel nicht als Drohkulisse darstellen. Keine Illustrationen von Engeln oder Spekulationen über ihr Aussehen.",
    "sample": "Allah hat Engeln Aufgaben gegeben; darüber lernen wir aus Qurʾān und Sunnah.",
    "ageText": {
      "4-5": {
        "intro": "Allah hat Engel erschaffen.",
        "lines": [
          "Allah sagt uns im Qurʾān, dass es Engel gibt.",
          "Einige Engel schreiben die Taten der Menschen auf.",
          "Der Prophet ﷺ erzählte auch von Engeln am Tag und in der Nacht.",
          "Wie Engel genau aussehen, denken wir uns nicht aus."
        ],
        "evidence": "Die Aufgaben sind in Qurʾān 82:10–12 und Ṣaḥīḥ al-Buḫārī 555 beschrieben."
      },
      "6-8": {
        "intro": "Wir lernen zwei belegte Aufgaben von Engeln.",
        "lines": [
          "Qurʾān 82:10–12 nennt ehrenvolle Engel, die Taten aufschreiben.",
          "In al-Buḫārī 555 werden Engel erwähnt, die sich nachts und tagsüber abwechseln.",
          "Sie kommen zu den Zeiten von Faǧr und ʿAṣr zusammen.",
          "Wir beschreiben sie nur soweit Qurʾān und authentische Sunnah uns informieren."
        ],
        "evidence": "Wir dürfen nicht ohne Beleg behaupten, dass beide Berichte dieselbe Engelgruppe beschreiben."
      },
      "9-10": {
        "intro": "Bei den Engeln unterscheiden wir Offenbarung von Spekulation.",
        "lines": [
          "Die Verse 82:10–12 nennen Hüter und ehrenvolle Aufschreibende, die wissen, was Menschen tun.",
          "Abū Hurayrah überliefert in al-Buḫārī 555 Engel, die nachts und tagsüber einander ablösen.",
          "Der Ḥadīṯ nennt Faǧr und ʿAṣr; der Qurʾānabschnitt nennt das Aufschreiben der Taten.",
          "Wir setzen diese Aufgaben nicht ohne Beleg gleich und erfinden keine Gestalten, Farben oder Geschichten."
        ],
        "evidence": "Beide Aufgaben sind unabhängig belegt; ihre Identität und ungenannte Einzelheiten lassen wir offen."
      }
    },
    "questions": {
      "4-5": [
        {
          "type": "choice",
          "prompt": "Hat Allah Engel erschaffen?",
          "options": [
            "Ja.",
            "Nein."
          ],
          "correct": 0,
          "hint": "Der Qurʾān nennt sie.",
          "explain": "Ja, sie sind Geschöpfe Allahs."
        },
        {
          "type": "choice",
          "prompt": "Dürfen wir ihr Aussehen erfinden?",
          "options": [
            "Nein.",
            "Ja."
          ],
          "correct": 0,
          "hint": "Nur gesichertes Wissen übernehmen.",
          "explain": "Wir erfinden keine Formen."
        }
      ],
      "6-8": [
        {
          "type": "choice",
          "prompt": "Was steht in Qurʾān 82:10–12?",
          "options": [
            "Es gibt aufschreibende Engel.",
            "Alle Engel haben genau dieselbe Aufgabe."
          ],
          "correct": 0,
          "hint": "Schau auf den Vers.",
          "explain": "Einige Engel schreiben Taten auf."
        },
        {
          "type": "choice",
          "prompt": "Wann treffen sich Engel laut al-Buḫārī 555?",
          "options": [
            "Bei Faǧr und ʿAṣr.",
            "Nur zum Mittagsessen."
          ],
          "correct": 0,
          "hint": "Sieh den Ḥadīṯ.",
          "explain": "Der Ḥadīṯ nennt die beiden Gebetszeiten."
        },
        {
          "type": "text",
          "prompt": "Wie sprechen wir über unbekannte Details der Engel?",
          "sample": "Wir erfinden nichts, sondern bleiben bei Qurʾān und authentischer Sunnah.",
          "hint": "Keine Vermutungen als Fakten erzählen."
        }
      ],
      "9-10": [
        {
          "type": "choice",
          "prompt": "Was darf man aus beiden Belegen nicht folgern?",
          "options": [
            "Dass beide Texte ausdrücklich dieselben Engel meinen.",
            "Dass es Engel mit Aufgaben gibt."
          ],
          "correct": 0,
          "hint": "Beide Texte haben verschiedene Aussagen.",
          "explain": "Die Identität bleibt unbelegt."
        },
        {
          "type": "text",
          "prompt": "Nenne die zwei getrennten Quellen mit ihren Aufgaben.",
          "sample": "82:10–12: aufschreibende Engel; al-Buḫārī 555: Engel wechseln nachts und tagsüber.",
          "hint": "Trenne die Aufgaben."
        },
        {
          "type": "text",
          "prompt": "Weshalb erfinden wir keine Engelbilder?",
          "sample": "Weil wir nur das berichten dürfen, was die Offenbarung zuverlässig mitteilt.",
          "hint": "Erkenne die Grenzen des Wissens."
        }
      ]
    },
    "voiceApproved": false
  },
  "aqidah-ikhlas-gutes-ungesehen": {
    "id": "aqidah-ikhlas-gutes-ungesehen",
    "subject": "aqidah",
    "pillar": "ikhlas",
    "topic": "Gutes tun, wenn niemand zuschaut",
    "title": "Ikhlāṣ · Gutes ohne Applaus",
    "lead": "Wir lernen, gute Taten mit guter Absicht zu tun, auch ohne Anerkennung.",
    "goal": "Ich kann eine hilfreiche Tat wählen, ohne Lob von Menschen zu verlangen.",
    "quran": {
      "surah": 76,
      "ayah": 9,
      "label": "Sūrat al-Insān · 76:9",
      "arabic": "إِنَّمَا نُطْعِمُكُمْ لِوَجْهِ اللَّهِ لَا نُرِيدُ مِنْكُمْ جَزَاءً وَلَا شُكُورًا",
      "meaning": "Wir speisen euch nur um Allahs willen. Wir wünschen von euch weder Lohn noch Dank. (Sinngemäße Bedeutung)",
      "excerpt": false
    },
    "hadith": {
      "source": "Ṣaḥīḥ al-Buḫārī, Nr. 1; Ṣaḥīḥ Muslim, Nr. 1907 · ʿUmar ibn al-Ḫaṭṭāb",
      "text": "Der Prophet ﷺ lehrte, dass die Taten nach den Absichten beurteilt werden. (Sinngemäße Bedeutung)"
    },
    "sourceAudit": {
      "hadithUrl": "https://dorar.net/h/RZGdSuHO?osoul=1",
      "hadithNumber": "1",
      "narrator": "ʿUmar ibn al-Ḫaṭṭāb",
      "authenticity": "Ṣaḥīḥ",
      "quranReference": "76:9",
      "quranTextType": "complete",
      "hadithMeaningIsParaphrase": true,
      "verifiedDate": "2026-10-13",
      "note": "Die Dorar-Direktquelle führt den authentischen Text von al-Buḫārī Nr. 1. Der Vers 76:9 beschreibt reines Geben; Schulbeispiele sind eigene Didaktik. 'Ungesehen' bedeutet niemals, dass Kinder Geheimnisse vor sicheren Erwachsenen bewahren müssen."
    },
    "hint": "Kein Geheimhaltungszwang. Gefährliche Situationen sind Erwachsenen mitzuteilen; unbemerkte gute Taten sind freiwillige Lernbeispiele.",
    "sample": "Ich helfe aus guter Absicht, auch wenn niemand mir dafür applaudiert.",
    "ageText": {
      "4-5": {
        "intro": "Ich kann helfen, ohne ein Geschenk zu erwarten.",
        "lines": [
          "Ich lege ein Buch zurück an seinen Platz.",
          "Vielleicht merkt es niemand.",
          "Trotzdem war die Hilfe etwas Gutes.",
          "Ich darf mich über die gute Tat freuen."
        ],
        "evidence": "Qurʾān 76:9 lehrt Geben ohne Gegenleistung; das Buch ist unsere Übung."
      },
      "6-8": {
        "intro": "Ikhlāṣ bedeutet, eine gute Tat aufrichtig für Allah zu tun.",
        "lines": [
          "In Qurʾān 76:9 geben Menschen Nahrung und verlangen keinen Dank.",
          "Der Prophet ﷺ erklärte, dass Taten nach den Absichten beurteilt werden.",
          "Wenn ich helfe, muss nicht immer mein Name genannt werden.",
          "Ich darf trotzdem Unterstützung oder Lob annehmen, ohne dass die gute Tat falsch wird."
        ],
        "evidence": "Der Text verbindet zwei belegte Prinzipien mit einer Schulhofübung."
      },
      "9-10": {
        "intro": "Wir unterscheiden die gute Handlung und die Absicht dahinter.",
        "lines": [
          "Der Vers 76:9 nennt Menschen, die um Allahs willen geben und weder Gegenleistung noch Dank verlangen.",
          "Ṣaḥīḥ al-Buḫārī 1 lehrt den Grundsatz, dass Taten nach ihren Absichten beurteilt werden.",
          "Eine hilfreiche Tat wird nicht wertlos, nur weil niemand von ihr erfährt.",
          "Der Unterricht fordert weder Geheimhaltung gegenüber Vertrauenspersonen noch das Verstecken riskanter Situationen."
        ],
        "evidence": "Die Beispiele für den heutigen Alltag sind eigene pädagogische Anwendungen."
      }
    },
    "questions": {
      "4-5": [
        {
          "type": "choice",
          "prompt": "Du hilfst und niemand klatscht. Ist es trotzdem gut?",
          "options": [
            "Ja.",
            "Nein."
          ],
          "correct": 0,
          "hint": "Lob ist nicht nötig.",
          "explain": "Helfen kann auch ohne Applaus gut sein."
        },
        {
          "type": "choice",
          "prompt": "Warum hilft man am besten?",
          "options": [
            "Aus guter Absicht.",
            "Nur für ein Geschenk."
          ],
          "correct": 0,
          "hint": "Denke an Ikhlāṣ.",
          "explain": "Eine gute Absicht zählt."
        }
      ],
      "6-8": [
        {
          "type": "choice",
          "prompt": "Worauf kommt es laut al-Buḫārī 1 besonders an?",
          "options": [
            "Auf die Absicht.",
            "Nur auf den Applaus."
          ],
          "correct": 0,
          "hint": "Der Ḥadīṯ spricht von Niyyah.",
          "explain": "Absichten sind wichtig."
        },
        {
          "type": "choice",
          "prompt": "Was lehren die Worte in Qurʾān 76:9?",
          "options": [
            "Gutes geben ohne Gegenleistung zu fordern.",
            "Immer etwas im Gegenzug verlangen."
          ],
          "correct": 0,
          "hint": "Man hilft um Allahs willen.",
          "explain": "Die Gebenden erwarten keinen Dank."
        },
        {
          "type": "text",
          "prompt": "Nenne eine gute Tat ohne Wunsch nach Lob.",
          "sample": "Ich räume etwas weg, um zu helfen, auch wenn niemand zusieht.",
          "hint": "Ein ungefährliches Beispiel genügt."
        }
      ],
      "9-10": [
        {
          "type": "choice",
          "prompt": "Weshalb passen Vers 76:9 und al-Buḫārī 1 zusammen?",
          "options": [
            "Beide betonen die innere Ausrichtung guter Handlungen.",
            "Beide fordern, Hilfe zu verweigern."
          ],
          "correct": 0,
          "hint": "Verbinde Absicht und selbstloses Geben.",
          "explain": "Gute Absicht und Hilfe passen zusammen."
        },
        {
          "type": "text",
          "prompt": "Was ist der Unterschied zwischen äußerer Tat und Niyyah?",
          "sample": "Die Tat ist das sichtbare Handeln; die Absicht beschreibt, wofür man es tut.",
          "hint": "Trenne Handlung und Beweggrund."
        },
        {
          "type": "text",
          "prompt": "Wann solltest du trotzdem Erwachsene informieren?",
          "sample": "Wenn jemand unter Druck gesetzt wird, in Gefahr ist oder Hilfe benötigt.",
          "hint": "Ikhlāṣ bedeutet keine gefährliche Geheimhaltung."
        }
      ]
    },
    "voiceApproved": false
  },
  "akhlaq-mitgefuehl-andere-troesten": {
    "id": "akhlaq-mitgefuehl-andere-troesten",
    "subject": "akhlaq",
    "pillar": "akhlaq",
    "topic": "Andere trösten",
    "title": "Akhlāq · Andere nicht allein lassen",
    "lead": "Wir üben freundliche Worte und freiwillige Hilfe für traurige Menschen.",
    "goal": "Ich kann einem traurigen Kind respektvoll zuhören und sichere Hilfe anbieten.",
    "quran": {
      "surah": 93,
      "ayah": 9,
      "label": "Sūrat aḍ-Ḍuḥā · 93:9",
      "arabic": "فَأَمَّا الْيَتِيمَ فَلَا تَقْهَرْ",
      "meaning": "Was die Waise betrifft, so unterdrücke sie nicht. (Sinngemäße Bedeutung)",
      "excerpt": false
    },
    "hadith": {
      "source": "Ṣaḥīḥ Muslim, Nr. 2586; Ṣaḥīḥ al-Buḫārī, Nr. 6011 · an-Nuʿmān ibn Bašīr",
      "text": "Der Prophet ﷺ verglich die Gläubigen in ihrer Liebe, Barmherzigkeit und Anteilnahme mit einem einzigen Körper. (Sinngemäße Bedeutung)"
    },
    "sourceAudit": {
      "hadithUrl": "https://dorar.net/hadith/sharh/4341",
      "hadithNumber": "2586",
      "narrator": "an-Nuʿmān ibn Bašīr",
      "authenticity": "Ṣaḥīḥ",
      "quranReference": "93:9",
      "quranTextType": "complete",
      "hadithMeaningIsParaphrase": true,
      "verifiedDate": "2026-10-13",
      "note": "93:9 betrifft insbesondere den Schutz von Waisen; der Ḥadīṯ die Anteilnahme unter Gläubigen. Das allgemeine Trösten eines traurigen Mitschülers ist eine gekennzeichnete pädagogische Anwendung, kein wörtliches Zitat. Kinder müssen nicht fremde Verantwortung übernehmen."
    },
    "hint": "Nicht auf Körperkontakt drängen; Traurigkeit respektieren, bei ernsten Sorgen vertrauenswürdige Erwachsene holen.",
    "sample": "Ich sehe, dass du traurig bist. Möchtest du, dass ich zuhöre?",
    "ageText": {
      "4-5": {
        "intro": "Ein Kind ist traurig. Ich kann freundlich sein.",
        "lines": [
          "Ich frage: Möchtest du reden?",
          "Vielleicht möchte das Kind zuerst Ruhe.",
          "Ich kann zuhören oder einen Erwachsenen holen.",
          "Ich muss niemanden zum Reden zwingen."
        ],
        "evidence": "Der Qurʾān lehrt Schutz Schwächerer; die Trostszene ist eine eigene Übung."
      },
      "6-8": {
        "intro": "Mitgefühl bedeutet, zu bemerken, wenn andere Hilfe brauchen.",
        "lines": [
          "In Qurʾān 93:9 verbietet Allah, Waisen schlecht zu behandeln.",
          "Der Prophet ﷺ verglich mitfühlende Gläubige mit einem Körper.",
          "Wir können jemanden fragen, ob er reden oder eine Pause möchte.",
          "Bei großen Sorgen holen wir eine vertrauenswürdige erwachsene Person."
        ],
        "evidence": "Das Beispiel einer traurigen Mitschülerin ist keine konkrete Prophetenerzählung."
      },
      "9-10": {
        "intro": "Wir üben Anteilnahme ohne Druck oder Überforderung.",
        "lines": [
          "Sūrat aḍ-Ḍuḥā 93:9 nennt ausdrücklich, Waisen nicht zu unterdrücken.",
          "Muslim 2586 vergleicht die Barmherzigkeit und Anteilnahme der Gläubigen mit der Verbundenheit eines Körpers.",
          "Trost kann bedeuten, zuzuhören, Beistand anzubieten und persönliche Grenzen zu achten.",
          "Niemand muss schwere Probleme allein lösen: Bei Gefahr oder anhaltender Not werden Erwachsene einbezogen."
        ],
        "evidence": "Wir erweitern die Grundwerte zu einer altersgerechten Trostübung, ohne ein erfundenes religiöses Originalzitat."
      }
    },
    "questions": {
      "4-5": [
        {
          "type": "choice",
          "prompt": "Ein Kind weint. Was hilft?",
          "options": [
            "Freundlich fragen, ob es Hilfe möchte.",
            "Es auslachen."
          ],
          "correct": 0,
          "hint": "Zeige Mitgefühl.",
          "explain": "Freundliche Worte können helfen."
        },
        {
          "type": "choice",
          "prompt": "Musst du jemanden zum Reden zwingen?",
          "options": [
            "Nein.",
            "Ja."
          ],
          "correct": 0,
          "hint": "Andere dürfen Ruhe wollen.",
          "explain": "Wir achten Grenzen."
        }
      ],
      "6-8": [
        {
          "type": "choice",
          "prompt": "Was verbietet Qurʾān 93:9?",
          "options": [
            "Eine Waise zu unterdrücken.",
            "Hilfsbereitschaft."
          ],
          "correct": 0,
          "hint": "Schau auf den Vers.",
          "explain": "Schutz und Respekt sind wichtig."
        },
        {
          "type": "choice",
          "prompt": "Was sagt Muslim 2586 über Mitgefühl?",
          "options": [
            "Die Gläubigen gleichen einem verbundenen Körper.",
            "Man soll über Leid lachen."
          ],
          "correct": 0,
          "hint": "Der Ḥadīṯ beschreibt Anteilnahme.",
          "explain": "Wir achten aufeinander."
        },
        {
          "type": "text",
          "prompt": "Was kannst du einem traurigen Kind sagen?",
          "sample": "Möchtest du reden oder soll ich dir Hilfe holen?",
          "hint": "Biete freundlich an, dränge nicht."
        }
      ],
      "9-10": [
        {
          "type": "choice",
          "prompt": "Wie passt der Ḥadīṯ zu dieser Unterrichtsübung?",
          "options": [
            "Er betont Anteilnahme; wir üben praktisches Zuhören.",
            "Er fordert, jede Person zum Reden zu zwingen."
          ],
          "correct": 0,
          "hint": "Vergleiche Quelle und Anwendung.",
          "explain": "Zuhören ist eine mögliche gute Handlung."
        },
        {
          "type": "text",
          "prompt": "Was ist die besondere Aussage in Qurʾān 93:9?",
          "sample": "Der Vers schützt ausdrücklich Waisen vor Unterdrückung.",
          "hint": "Nicht den spezifischen Kontext verlieren."
        },
        {
          "type": "text",
          "prompt": "Was tust du bei einer ernsten Sorge eines anderen Kindes?",
          "sample": "Ich nehme es ernst und suche eine zuverlässige erwachsene Vertrauensperson.",
          "hint": "Kinder müssen solche Probleme nicht allein lösen."
        }
      ]
    },
    "voiceApproved": false
  }
};
for(const [id,l] of Object.entries(additions)){
 if(prior[id]||!l.quran||!l.hadith||!l.sourceAudit?.hadithUrl?.startsWith("https://dorar.net/")||l.voiceApproved!==false)throw Error("V32 invalid "+id);
 for(const age of ["4-5","6-8","9-10"])if(l.ageText?.[age]?.lines?.length!==4||l.questions?.[age]?.length<(age==="4-5"?2:3))throw Error("V32 age "+id+" "+age);
}
window.DARKidsAcademyCurriculum=Object.freeze({...prior,...additions});
window.DARKidsAcademyCurriculumV32=Object.freeze({"version":"20261013-v32","count":4,"ids":["aqidah-allah-versorgt-geschopfe","aqidah-engel-aufgaben-kennen","aqidah-ikhlas-gutes-ungesehen","akhlaq-mitgefuehl-andere-troesten"],"pillars":{"aqidah-allah-versorgt-geschopfe":"tawhid","aqidah-engel-aufgaben-kennen":"iman","aqidah-ikhlas-gutes-ungesehen":"ikhlas","akhlaq-mitgefuehl-andere-troesten":"akhlaq"},"religiousSourcesVerified":true,"voiceRecordingsApproved":false,"requiresHumanAudioApproval":true});
})();
