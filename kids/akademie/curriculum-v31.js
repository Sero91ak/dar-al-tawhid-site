/* DĀR AL TAWḤĪD KIDS V31 · Unterricht 71–74. Altersgerechte, quellengebundene Inhalte.
 * Originalbelege und eigene Didaktik getrennt; niemals ungeprüfte Masterstimme abspielen.
 */
(function(){
"use strict";
const prior=window.DARKidsAcademyCurriculum;
if(!prior||!prior["fiqh-wudu-wasser-sparen"])return;
const additions={
  "quran-al-ikhlas-verstehen": {
    "id": "quran-al-ikhlas-verstehen",
    "subject": "aqidah",
    "pillar": "quran",
    "topic": "Sūrat al-Ikhlāṣ verstehen",
    "title": "Qurʾān · Allah ist einzig",
    "lead": "Wir lernen die vier Verse von Sūrat al-Ikhlāṣ und ihre Bedeutung.",
    "goal": "Ich weiß: Allah ist Einer, Er braucht niemanden und nichts ist Ihm gleich.",
    "quran": {
      "surah": 112,
      "ayah": 1,
      "label": "Sūrat al-Ikhlāṣ · 112:1–4",
      "arabic": "قُلْ هُوَ اللَّهُ أَحَدٌ ۝ اللَّهُ الصَّمَدُ ۝ لَمْ يَلِدْ وَلَمْ يُولَدْ ۝ وَلَمْ يَكُنْ لَهُ كُفُوًا أَحَدٌ",
      "meaning": "Sprich: Er ist Allah, Einer. Allah, der Unabhängige, den alle brauchen. Er hat weder gezeugt noch wurde Er gezeugt. Und niemand ist Ihm gleich. (Sinngemäße Gesamtübersetzung)",
      "excerpt": false
    },
    "hadith": {
      "source": "Ṣaḥīḥ al-Buḫārī, Nr. 5013 · Abū Saʿīd al-Ḫudrī",
      "text": "Der Prophet ﷺ erklärte, dass die Sūrah „Qul huwa llāhu aḥad“ einem Drittel des Qurʾān gleichkommt – hinsichtlich ihres besonderen Vorzugs, nicht als Ersatz für andere Pflichtlektüre. (Sinngemäß)"
    },
    "sourceAudit": {
      "hadithUrl": "https://dorar.net/hadith/sharh/72699",
      "hadithNumber": "5013",
      "narrator": "Abū Saʿīd al-Ḫudrī",
      "authenticity": "Ṣaḥīḥ",
      "quranReference": "112:1-4",
      "quranTextType": "complete",
      "hadithMeaningIsParaphrase": true,
      "verifiedDate": "2026-10-13",
      "note": "Qurʾān 112:1–4 vollständig. 'Ein Drittel' bedeutet Vorzug/Belohnung, kein Erlass von anderem Qurʾān-Unterricht. Qurʾān niemals durch nachgeahmte Masterstimme rezitieren; nur belegte menschliche Rezitation."
    },
    "hint": "Arabische Qurʾān-Rezitation nur von einer echten freigegebenen Rezitation, nicht per Stimmklon. Bedeutungen erklären, keine Bilder von Allah.",
    "sample": "Allah ist einzig. Allah braucht niemanden. Nichts ist wie Er.",
    "ageText": {
      "4-5": {
        "intro": "Wir lernen: Allah ist Einer.",
        "lines": [
          "Sūrat al-Ikhlāṣ ist kurz und sehr wichtig.",
          "Im ersten Vers steht: Allah ist Einer.",
          "Allah braucht niemanden; wir alle brauchen Ihn.",
          "Niemand ist Allah gleich."
        ],
        "evidence": "Alle vier Aussagen erklären die Verse 112:1–4 in einfachen eigenen Worten."
      },
      "6-8": {
        "intro": "Diese vier Verse lehren uns, wie wir über Allah sprechen.",
        "lines": [
          "Im Qurʾān 112:1 steht, dass Allah Einer ist.",
          "Aṣ-Ṣamad in Vers 2 bedeutet: Allah ist vollkommen unabhängig und alle Geschöpfe brauchen Ihn.",
          "In Vers 3 steht, dass Allah weder Kinder hat noch selbst geboren wurde.",
          "Vers 4 lehrt, dass niemand Ihm gleich ist."
        ],
        "evidence": "Die Erklärung ist eine vereinfachte deutsche Bedeutungswiedergabe, nicht der arabische Wortlaut."
      },
      "9-10": {
        "intro": "Wir unterscheiden den genauen Versinhalt und die Aussage des authentischen Ḥadīṯ.",
        "lines": [
          "Sūrat al-Ikhlāṣ 112:1–4 beschreibt Allahs Einzigkeit und Unvergleichbarkeit.",
          "Aṣ-Ṣamad bedeutet unter anderem: vollkommene Unabhängigkeit Allahs bei gleichzeitiger Bedürftigkeit aller Geschöpfe.",
          "Abū Saʿīd berichtete, dass diese Sūrah einem Drittel des Qurʾān gleichkommt.",
          "Der Vorzug der Sūrah ersetzt nicht das Lernen und Lesen anderer Qurʾān-Stellen."
        ],
        "evidence": "Qurʾāntext, eigene deutsche Bedeutungserklärung und Ḥadīṯ zum Vorzug sind getrennt."
      }
    },
    "questions": {
      "4-5": [
        {
          "type": "choice",
          "prompt": "Wie viele Götter gibt es, die wir anbeten?",
          "options": [
            "Nur Allah.",
            "Viele gleiche Götter."
          ],
          "correct": 0,
          "hint": "Denke an Vers 1.",
          "explain": "Allah allein ist anbetungswürdig."
        },
        {
          "type": "choice",
          "prompt": "Ist jemand genauso wie Allah?",
          "options": [
            "Nein.",
            "Ja, alle Menschen."
          ],
          "correct": 0,
          "hint": "Denke an den vierten Vers.",
          "explain": "Niemand ist Ihm gleich."
        }
      ],
      "6-8": [
        {
          "type": "choice",
          "prompt": "Was bedeutet al-Aḥad?",
          "options": [
            "Allah ist einzig.",
            "Allah braucht andere."
          ],
          "correct": 0,
          "hint": "Das steht in Vers 1.",
          "explain": "Allah ist Einer."
        },
        {
          "type": "choice",
          "prompt": "Was bedeutet aṣ-Ṣamad?",
          "options": [
            "Allah braucht niemanden; alle brauchen Ihn.",
            "Allah braucht unsere Hilfe."
          ],
          "correct": 0,
          "hint": "Vers 2 erklärt eine Eigenschaft Allahs.",
          "explain": "Allah ist unabhängig."
        },
        {
          "type": "text",
          "prompt": "Was lernen wir aus Vers 4?",
          "sample": "Nichts und niemand ist Allah gleich.",
          "hint": "Antworte in deinen eigenen Worten."
        }
      ],
      "9-10": [
        {
          "type": "choice",
          "prompt": "Was sagt der Ḥadīṯ über Sūrat al-Ikhlāṣ?",
          "options": [
            "Sie kommt hinsichtlich ihres Vorzugs einem Drittel des Qurʾān gleich.",
            "Sie ersetzt alle anderen Sūren und Pflichten."
          ],
          "correct": 0,
          "hint": "Sieh al-Buḫārī 5013.",
          "explain": "Ihr großer Vorzug ist authentisch belegt."
        },
        {
          "type": "text",
          "prompt": "Nenne die vier Aussagen der Sūrah nacheinander.",
          "sample": "Allah ist Einer, aṣ-Ṣamad, weder zeugte Er noch wurde Er gezeugt, und nichts ist Ihm gleich.",
          "hint": "Beziehe dich auf 112:1–4."
        },
        {
          "type": "text",
          "prompt": "Warum darf man aus ihrem Vorzug keine Ersatzpflicht ableiten?",
          "sample": "Besonderer Lohn bedeutet nicht, dass andere Qurʾān-Stellen oder ihre Pflichten entfallen.",
          "hint": "Unterscheide Vorzug und Verpflichtung."
        }
      ]
    },
    "voiceApproved": false
  },
  "sirah-ibrahim-tawhid-zeugen": {
    "id": "sirah-ibrahim-tawhid-zeugen",
    "subject": "aqidah",
    "pillar": "sirah",
    "topic": "Ibrāhīm عليه السلام und Tawḥīd",
    "title": "Prophet Ibrāhīm · Der eine Schöpfer",
    "lead": "Ibrāhīm erklärte seinem Volk, dass Allah Himmel und Erde erschaffen hat.",
    "goal": "Ich erkenne die Botschaft des Tawḥīd in Ibrāhīms Worten.",
    "quran": {
      "surah": 21,
      "ayah": 56,
      "label": "Sūrat al-Anbiyāʾ · 21:56",
      "arabic": "قَالَ بَلْ رَبُّكُمْ رَبُّ السَّمَاوَاتِ وَالْأَرْضِ الَّذِي فَطَرَهُنَّ وَأَنَا عَلَىٰ ذَٰلِكُمْ مِنَ الشَّاهِدِينَ",
      "meaning": "Er sagte: Vielmehr ist euer Herr der Herr der Himmel und der Erde, der sie erschaffen hat; dafür bin ich Zeuge. (Sinngemäße Bedeutung)",
      "excerpt": false
    },
    "hadith": {
      "source": "Ṣaḥīḥ Muslim, Nr. 532 · Ǧundub ibn ʿAbdillāh",
      "text": "Der Prophet ﷺ berichtete, Allah habe ihn zum Ḫalīl genommen, wie Er auch Ibrāhīm zu Seinem Ḫalīl genommen hatte. (Auszug, sinngemäß)"
    },
    "sourceAudit": {
      "hadithUrl": "https://dorar.net/hadith/sharh/141468",
      "hadithNumber": "532",
      "narrator": "Ǧundub ibn ʿAbdillāh",
      "authenticity": "Ṣaḥīḥ",
      "quranReference": "21:56",
      "quranTextType": "complete",
      "hadithMeaningIsParaphrase": true,
      "verifiedDate": "2026-10-13",
      "note": "Qurʾān 21:52–56 schildert Ibrāhīms Gespräch über die Statuen. Nur den genannten Wortlaut nutzen; keine Details zu Alter, Gesicht, Stimme oder Herkunft erfinden. Muslim 532 bestätigt Ibrāhīms Rang als Ḫalīl, nicht eine genaue Szene seines Gesprächs."
    },
    "hint": "Keine Darstellung des Propheten Ibrāhīm oder unbelegter historischer Einzelheiten. Kindgerecht und ohne Schilderung späterer Bedrohungen.",
    "sample": "Ibrāhīm erklärte: Allah ist der Schöpfer von Himmel und Erde.",
    "ageText": {
      "4-5": {
        "intro": "Ibrāhīm war ein Prophet Allahs.",
        "lines": [
          "Die Menschen um ihn herum hatten Statuen.",
          "Ibrāhīm erklärte, wer Himmel und Erde erschaffen hat.",
          "Er sagte: Allah ist der Herr von Himmel und Erde.",
          "Wir beten allein Allah an."
        ],
        "evidence": "Die Aussagen stammen sinngemäß aus Qurʾān 21:52–56; das sind keine ausgedachten Dialoge."
      },
      "6-8": {
        "intro": "Wir lesen, was Allah über Ibrāhīm im Qurʾān berichtet.",
        "lines": [
          "Ibrāhīm fragte nach den Statuen, die sein Volk verehrte.",
          "In Qurʾān 21:56 erklärte er, dass Allah der Schöpfer von Himmel und Erde ist.",
          "Damit lehrte er den Tawḥīd: Allah allein ist anbetungswürdig.",
          "In Ṣaḥīḥ Muslim 532 wird Ibrāhīm als Ḫalīl Allahs bezeichnet."
        ],
        "evidence": "Wir verwenden nur die Qurʾānstellen 21:52–56 und Muslim 532 als Belege."
      },
      "9-10": {
        "intro": "Ibrāhīms Botschaft ist ein Beispiel dafür, wie der Qurʾān Tawḥīd erläutert.",
        "lines": [
          "In Qurʾān 21:52–53 ist das Gespräch über die verehrten Statuen überliefert.",
          "Ibrāhīm erklärt in 21:56, dass der Herr der Himmel und der Erde ihr Schöpfer ist.",
          "Die Aussage begründet Tawḥīd, ohne Menschen und Geschöpfen eine göttliche Stellung zu geben.",
          "Ṣaḥīḥ Muslim 532 bestätigt zusätzlich die besondere Stellung Ibrāhīms als Ḫalīl Allahs."
        ],
        "evidence": "Der Ḥadīṯ behandelt Ibrāhīms Rang; der eigentliche Gesprächsinhalt stammt aus Qurʾān 21:52–56."
      }
    },
    "questions": {
      "4-5": [
        {
          "type": "choice",
          "prompt": "Wer erschuf Himmel und Erde?",
          "options": [
            "Allah.",
            "Die Statuen."
          ],
          "correct": 0,
          "hint": "Ibrāhīms Worte nennen den Schöpfer.",
          "explain": "Allah ist der Schöpfer."
        },
        {
          "type": "choice",
          "prompt": "Wen beten wir an?",
          "options": [
            "Allah allein.",
            "Gegenstände."
          ],
          "correct": 0,
          "hint": "Denke an Tawḥīd.",
          "explain": "Wir beten Allah allein an."
        }
      ],
      "6-8": [
        {
          "type": "choice",
          "prompt": "Was sagte Ibrāhīm laut Qurʾān 21:56?",
          "options": [
            "Allah ist der Schöpfer von Himmel und Erde.",
            "Die Statuen haben das Weltall erschaffen."
          ],
          "correct": 0,
          "hint": "Lies den Vers.",
          "explain": "Ibrāhīm bezeugte Allahs Schöpfersein."
        },
        {
          "type": "choice",
          "prompt": "Welche Glaubenslehre erkennen wir?",
          "options": [
            "Tawḥīd.",
            "Mehrere Götter."
          ],
          "correct": 0,
          "hint": "Allah allein anbeten.",
          "explain": "Tawḥīd bedeutet Allahs Einzigkeit."
        },
        {
          "type": "text",
          "prompt": "Welche Quelle erzählt das Gespräch Ibrāhīms?",
          "sample": "Der Qurʾān in Sūrat al-Anbiyāʾ 21:52–56.",
          "hint": "Nenne Sūrah und Verse."
        }
      ],
      "9-10": [
        {
          "type": "choice",
          "prompt": "Welchen Beleg enthält Qurʾān 21:56?",
          "options": [
            "Ibrāhīm nennt Allah den Schöpfer von Himmel und Erde.",
            "Ibrāhīm nennt die Statuen seine Schöpfer."
          ],
          "correct": 0,
          "hint": "Beziehe dich auf den genauen Wortlaut.",
          "explain": "Die Schöpfung gehört Allah."
        },
        {
          "type": "text",
          "prompt": "Was bestätigt Muslim 532 zusätzlich?",
          "sample": "Ibrāhīm war ein Ḫalīl Allahs.",
          "hint": "Der Ḥadīṯ belegt Ibrāhīms Rang."
        },
        {
          "type": "text",
          "prompt": "Welche Teile der Geschichte sind direkt belegt?",
          "sample": "Das Gespräch und Ibrāhīms Erklärung stehen im Qurʾān; der Ḥadīṯ bestätigt seinen Rang als Ḫalīl.",
          "hint": "Keine erfundenen historischen Einzelheiten."
        }
      ]
    },
    "voiceApproved": false
  },
  "dua-schlafengehen-allah-gedenken": {
    "id": "dua-schlafengehen-allah-gedenken",
    "subject": "adab",
    "pillar": "dua",
    "topic": "Vor dem Schlafen Allah gedenken",
    "title": "Duʿāʾ · Vor dem Schlafen",
    "lead": "Wir lernen einen kurzen authentischen Dhikr vor dem Schlafengehen.",
    "goal": "Ich kann den Schlaf-Dhikr verstehen und mit Unterstützung sprechen.",
    "quran": {
      "surah": 33,
      "ayah": 41,
      "label": "Sūrat al-Aḥzāb · 33:41",
      "arabic": "يَا أَيُّهَا الَّذِينَ آمَنُوا اذْكُرُوا اللَّهَ ذِكْرًا كَثِيرًا",
      "meaning": "O ihr, die ihr glaubt, gedenkt Allahs häufig.",
      "excerpt": false
    },
    "hadith": {
      "source": "Ṣaḥīḥ al-Buḫārī, Nr. 6312 · Ḥuḏayfah ibn al-Yamān",
      "text": "Wenn der Prophet ﷺ schlafen ging, sagte er: «بِاسْمِكَ أَمُوتُ وَأَحْيَا» – 'In Deinem Namen sterbe und lebe ich.' (Deutsche Bedeutungswiedergabe)"
    },
    "sourceAudit": {
      "hadithUrl": "https://dorar.net/hadith/sharh/1652",
      "hadithNumber": "6312",
      "narrator": "Ḥuḏayfah ibn al-Yamān",
      "authenticity": "Ṣaḥīḥ",
      "quranReference": "33:41",
      "quranTextType": "complete",
      "hadithMeaningIsParaphrase": true,
      "verifiedDate": "2026-10-13",
      "note": "33:41 gebietet häufiges Gedenken allgemein; der Zeitpunkt vor dem Schlafen ist konkret in al-Buḫārī 6312 überliefert. 'Sterben und Leben' in diesem Dhikr Kindern behutsam erläutern und nicht als Bedrohung darstellen. Keine synthetische 'Qurʾān-Rezitation'."
    },
    "hint": "Kindgerecht ohne Angst vor dem Einschlafen; arabischer Wortlaut bleibt unverändert. Freigegebenes Audio nur nach echter Serhat-Aufnahme und manueller Abnahme.",
    "sample": "بِاسْمِكَ أَمُوتُ وَأَحْيَا — In Deinem Namen sterbe und lebe ich.",
    "ageText": {
      "4-5": {
        "intro": "Vor dem Schlafengehen können wir Allah gedenken.",
        "lines": [
          "Ich mache es mir gemütlich.",
          "Ich darf mich an Allah erinnern.",
          "Der Prophet ﷺ lehrte einen kurzen Schlaf-Dhikr.",
          "Ein Erwachsener kann ihn mir vorsprechen."
        ],
        "evidence": "Der arabische Schlaf-Dhikr stammt aus Ṣaḥīḥ al-Buḫārī 6312."
      },
      "6-8": {
        "intro": "Dhikr heißt: Allah gedenken.",
        "lines": [
          "Qurʾān 33:41 erinnert daran, Allah häufig zu gedenken.",
          "Vor dem Schlafen sagte der Prophet ﷺ: «بِاسْمِكَ أَمُوتُ وَأَحْيَا».",
          "Wir sprechen die Worte aufmerksam und lernen ihre Bedeutung.",
          "Das darf ruhig und ohne Druck geschehen."
        ],
        "evidence": "Nur der Schlaf-Dhikr stammt wörtlich aus dem Ḥadīṯ; die übrigen Sätze sind Lernhilfe."
      },
      "9-10": {
        "intro": "Wir lernen einen authentisch überlieferten Dhikr und seine Quelle.",
        "lines": [
          "Qurʾān 33:41 fordert allgemein zum häufigen Gedenken Allahs auf.",
          "Al-Buḫārī 6312 überliefert konkret die Worte beim Zubettgehen: «بِاسْمِكَ أَمُوتُ وَأَحْيَا».",
          "Die Überlieferung verbindet Schlaf und Erwachen mit dem Vertrauen auf Allah.",
          "Wir unterscheiden die feste Ḥadīṯ-Formulierung von unseren eigenen deutschen Erklärungen."
        ],
        "evidence": "Die arabischen Wörter im Ḥadīṯ bleiben unverändert; eine sinngemäße Übersetzung ist als solche markiert."
      }
    },
    "questions": {
      "4-5": [
        {
          "type": "choice",
          "prompt": "Woran kannst du vor dem Schlafen denken?",
          "options": [
            "An Allah und den Dhikr.",
            "An absichtlichen Streit."
          ],
          "correct": 0,
          "hint": "Vor dem Schlafen kannst du Allah gedenken.",
          "explain": "Dhikr gehört zur Sunnah."
        },
        {
          "type": "choice",
          "prompt": "Wer kann dir beim Lernen helfen?",
          "options": [
            "Eine vertraute erwachsene Person.",
            "Niemand darf mithelfen."
          ],
          "correct": 0,
          "hint": "Gemeinsam üben ist gut.",
          "explain": "Hilfe ist erlaubt."
        }
      ],
      "6-8": [
        {
          "type": "choice",
          "prompt": "Was bedeutet Dhikr?",
          "options": [
            "Allah gedenken.",
            "Sich über andere lustig machen."
          ],
          "correct": 0,
          "hint": "Denk an den Qurʾānvers.",
          "explain": "Dhikr ist Gedenken Allahs."
        },
        {
          "type": "choice",
          "prompt": "Welche Quelle enthält die Schlafworte?",
          "options": [
            "Ṣaḥīḥ al-Buḫārī 6312.",
            "Eine frei erfundene Geschichte."
          ],
          "correct": 0,
          "hint": "Prüfe die Quellenangabe.",
          "explain": "Es ist authentische Sunnah."
        },
        {
          "type": "text",
          "prompt": "Wie lautet der kurze arabische Schlaf-Dhikr?",
          "sample": "بِاسْمِكَ أَمُوتُ وَأَحْيَا",
          "hint": "Du kannst die Wörter mit einem Erwachsenen üben."
        }
      ],
      "9-10": [
        {
          "type": "choice",
          "prompt": "Welche Aussage unterscheidet Qurʾān und Sunnah richtig?",
          "options": [
            "Qurʾān 33:41 nennt Dhikr allgemein; al-Buḫārī 6312 die Schlafworte.",
            "Qurʾān 33:41 nennt genau diese Schlafworte."
          ],
          "correct": 0,
          "hint": "Unterscheide allgemeine und spezielle Quelle.",
          "explain": "Beide Quellen ergänzen sich."
        },
        {
          "type": "text",
          "prompt": "Zitiere den arabischen Wortlaut aus al-Buḫārī 6312.",
          "sample": "بِاسْمِكَ أَمُوتُ وَأَحْيَا",
          "hint": "Halte den überlieferten Wortlaut ein."
        },
        {
          "type": "text",
          "prompt": "Was ist der Unterschied zwischen Ḥadīṯ und Unterrichtserklärung?",
          "sample": "Der Ḥadīṯ hat einen festen Wortlaut; die deutschen Lernhilfen sind eigene Erklärungen.",
          "hint": "Trenne Original und Didaktik."
        }
      ]
    },
    "voiceApproved": false
  },
  "family-ehrliche-freundschaften-pflegen": {
    "id": "family-ehrliche-freundschaften-pflegen",
    "subject": "akhlaq",
    "pillar": "family",
    "topic": "Freundschaften ehrlich pflegen",
    "title": "Gemeinschaft · Gute Freundschaften",
    "lead": "Wir lernen, wie Ehrlichkeit und freundlicher Umgang Freundschaften stärken.",
    "goal": "Ich kann freundlich, ehrlich und sicher mit Freundinnen und Freunden umgehen.",
    "quran": {
      "surah": 9,
      "ayah": 119,
      "label": "Sūrat at-Tawbah · 9:119",
      "arabic": "يَا أَيُّهَا الَّذِينَ آمَنُوا اتَّقُوا اللَّهَ وَكُونُوا مَعَ الصَّادِقِينَ",
      "meaning": "O ihr, die ihr glaubt, fürchtet Allah und seid mit den Wahrhaftigen.",
      "excerpt": false
    },
    "hadith": {
      "source": "Ṣaḥīḥ Muslim, Nr. 2564 · Abū Hurayrah",
      "text": "Der Prophet ﷺ verbot Hass, Neid und Geringschätzung und lehrte, dass Muslime einander nicht Unrecht tun sollen. (Auszug, sinngemäß)"
    },
    "sourceAudit": {
      "hadithUrl": "https://dorar.net/hadith/sharh/17126",
      "hadithNumber": "2564",
      "narrator": "Abū Hurayrah",
      "authenticity": "Ṣaḥīḥ",
      "quranReference": "9:119",
      "quranTextType": "complete",
      "hadithMeaningIsParaphrase": true,
      "verifiedDate": "2026-10-13",
      "note": "Qurʾānvers betont Wahrhaftigkeit und Nähe zu Wahrhaftigen; Ḥadīṯ Muslim 2564 behandelt Rechte der Muslime. Die Schulhofgeschichte ist eigene Didaktik. Sicherer Umgang und Grenzen: ein Kind darf Hilfe suchen, Nein sagen und eine verletzende Freundschaft verlassen."
    },
    "hint": "Nicht alle Freunde müssen gleich sein; keine Ausgrenzung oder Abwertung nichtmuslimischer Kinder. Ehrliche Freundschaft bedeutet niemals Zwang, Geheimhaltungsdruck oder Beschämung.",
    "sample": "Ich sage ehrlich, was ich denke, und gehe respektvoll mit anderen um.",
    "ageText": {
      "4-5": {
        "intro": "Gute Freunde dürfen ehrlich miteinander sein.",
        "lines": [
          "Meine Freundin fragt, ob ich spielen will.",
          "Ich sage freundlich, wenn ich erst eine Pause brauche.",
          "Wir lachen niemanden aus.",
          "Wenn etwas weh tut, suche ich Hilfe."
        ],
        "evidence": "Qurʾān 9:119 lehrt Wahrhaftigkeit; die Spielszene ist eine Übung."
      },
      "6-8": {
        "intro": "Freundschaft wächst, wenn wir ehrlich und rücksichtsvoll handeln.",
        "lines": [
          "Im Qurʾān 9:119 sollen wir mit Wahrhaftigen sein.",
          "Der Prophet ﷺ warnte davor, andere zu verachten oder ihnen Unrecht zu tun.",
          "Ich kann fair spielen, Versprechen ernst nehmen und respektvoll Nein sagen.",
          "Bei Druck oder Streit kann ich eine vertrauenswürdige Person um Hilfe bitten."
        ],
        "evidence": "Die Beispiele aus dem Alltag sind keine wörtlichen Ḥadīṯe."
      },
      "9-10": {
        "intro": "Wir lernen zwei Prinzipien guter Beziehungen: Wahrhaftigkeit und Respekt.",
        "lines": [
          "Sūrat at-Tawbah 9:119 ruft zur Gottesfurcht und Gemeinschaft mit Wahrhaftigen auf.",
          "Ṣaḥīḥ Muslim 2564 untersagt Herabwürdigung und Unrecht gegenüber anderen Muslimen.",
          "Freundschaften sollten von Aufrichtigkeit, Rücksicht und angemessenen Grenzen geprägt sein.",
          "Echte Freundschaft braucht keine erzwungenen Geheimnisse; bei Ausgrenzung oder Drohung suchen wir Unterstützung."
        ],
        "evidence": "Diese Beispiele sind pädagogische Anwendungen der Quellen und keine zusätzlichen Rechtstexte."
      }
    },
    "questions": {
      "4-5": [
        {
          "type": "choice",
          "prompt": "Was ist bei Freunden gut?",
          "options": [
            "Ehrlich und freundlich sein.",
            "Andere absichtlich verletzen."
          ],
          "correct": 0,
          "hint": "Gute Worte helfen.",
          "explain": "Freundlichkeit stärkt Freundschaft."
        },
        {
          "type": "choice",
          "prompt": "Darfst du freundlich Nein sagen?",
          "options": [
            "Ja.",
            "Nein, Freunde müssen immer alles tun."
          ],
          "correct": 0,
          "hint": "Du darfst Grenzen haben.",
          "explain": "Nein sagen ist erlaubt."
        }
      ],
      "6-8": [
        {
          "type": "choice",
          "prompt": "Wozu ruft Qurʾān 9:119 auf?",
          "options": [
            "Mit den Wahrhaftigen sein.",
            "Freunde belügen."
          ],
          "correct": 0,
          "hint": "Achte auf den Vers.",
          "explain": "Wahrhaftigkeit ist wichtig."
        },
        {
          "type": "choice",
          "prompt": "Was hilft bei Streit?",
          "options": [
            "Ruhig sprechen und Hilfe holen.",
            "Jemanden beschämen."
          ],
          "correct": 0,
          "hint": "Fair bleiben.",
          "explain": "Hilfe zu suchen ist richtig."
        },
        {
          "type": "text",
          "prompt": "Wie sagst du ehrlich Nein, ohne unfreundlich zu sein?",
          "sample": "Danke, heute möchte ich nicht mitspielen.",
          "hint": "Du darfst respektvoll entscheiden."
        }
      ],
      "9-10": [
        {
          "type": "choice",
          "prompt": "Welche zwei Werte passen zu unseren Belegen?",
          "options": [
            "Wahrhaftigkeit und Respekt.",
            "Lüge und Ausgrenzung."
          ],
          "correct": 0,
          "hint": "Vergleiche Vers und Ḥadīṯ.",
          "explain": "Beides schützt Beziehungen."
        },
        {
          "type": "text",
          "prompt": "Wie lassen sich Qurʾān 9:119 und Muslim 2564 auf Freundschaften beziehen?",
          "sample": "Der Vers lehrt Wahrhaftigkeit, der Ḥadīṯ verbietet Geringschätzung und Unrecht.",
          "hint": "Trenne Quelle und Schulbeispiel."
        },
        {
          "type": "text",
          "prompt": "Was kann man tun, wenn eine Freundschaft Druck macht?",
          "sample": "Grenzen setzen, sich distanzieren und vertrauenswürdige Erwachsene um Hilfe bitten.",
          "hint": "Sicherheit geht vor."
        }
      ]
    },
    "voiceApproved": false
  }
};
for(const [id,lesson] of Object.entries(additions)){
 if(prior[id]||!lesson.quran||!lesson.hadith||!lesson.sourceAudit?.hadithUrl?.startsWith("https://dorar.net/hadith/sharh/")||lesson.voiceApproved!==false)throw Error("V31 invalid lesson "+id);
 for(const age of ["4-5","6-8","9-10"])if(lesson.ageText?.[age]?.lines?.length!==4||lesson.questions?.[age]?.length<(age==="4-5"?2:3))throw Error("V31 incomplete age content "+id+" "+age);
}
window.DARKidsAcademyCurriculum=Object.freeze({...prior,...additions});
window.DARKidsAcademyCurriculumV31=Object.freeze({"version":"20261013-v31","count":4,"ids":["quran-al-ikhlas-verstehen","sirah-ibrahim-tawhid-zeugen","dua-schlafengehen-allah-gedenken","family-ehrliche-freundschaften-pflegen"],"pillars":{"quran-al-ikhlas-verstehen":"quran","sirah-ibrahim-tawhid-zeugen":"sirah","dua-schlafengehen-allah-gedenken":"dua","family-ehrliche-freundschaften-pflegen":"family"},"religiousSourcesVerified":true,"voiceRecordingsApproved":false,"requiresHumanAudioApproval":true});
})();
