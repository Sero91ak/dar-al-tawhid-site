/* DĀR AL TAWḤĪD KIDS V29: Unterricht 63–66, four independent sourced lessons.
 * Each lesson includes distinct age texts (4–5, 6–8, 9–10), child-safe exercises.
 * Exact Qurʾān passages and Ṣaḥīḥ references; paraphrases clearly marked.
 * No unapproved speech recordings or learning-progress changes.
 */
(function(){
"use strict";
const prior=window.DARKidsAcademyCurriculum;
if(!prior||!prior["family-geschwister-unterstuetzen"])return;
const additions={
  "aqidah-allah-pflanzen-wachsen": {
    "id": "aqidah-allah-pflanzen-wachsen",
    "subject": "aqidah",
    "pillar": "tawhid",
    "topic": "Allah ließ Pflanzen wachsen",
    "title": "Tawḥīd · Allah lässt Pflanzen wachsen",
    "lead": "Wir sehen, wie Pflanzen durch Allahs Schöpfung wachsen.",
    "goal": "Ich erkenne Allah als Schöpfer und kann Pflanzen behutsam pflegen.",
    "quran": {
      "surah": 6,
      "ayah": 99,
      "label": "Sūrat al-Anʿām · 6:99",
      "arabic": "وَهُوَ الَّذِي أَنْزَلَ مِنَ السَّمَاءِ مَاءً فَأَخْرَجْنَا بِهِ نَبَاتَ كُلِّ شَيْءٍ",
      "meaning": "Er ist es, Der Wasser vom Himmel herabkommen lässt, wodurch Wir Pflanzen aller Art hervorbringen. (Versauszug)",
      "excerpt": true
    },
    "hadith": {
      "source": "Ṣaḥīḥ al-Buḫārī, Nr. 2320; Ṣaḥīḥ Muslim, Nr. 1553 · Anas ibn Mālik",
      "text": "Wer sät oder pflanzt und dessen Pflanzen Menschen oder Tiere ernähren, dem wird dies als gute Wohltat angerechnet. (Sinngemäße Bedeutung)"
    },
    "sourceAudit": {
      "hadithUrl": "https://dorar.net/hadith/sharh/4998",
      "hadithNumber": "2320",
      "narrator": "Anas ibn Mālik",
      "authenticity": "Ṣaḥīḥ",
      "quranReference": "6:99",
      "quranTextType": "excerpt",
      "hadithMeaningIsParaphrase": true,
      "verifiedDate": "2026-10-12",
      "note": "Der Vers nennt Regen und Pflanzen; der Ḥadīṯ berichtet vom Lohn für hilfreiches Pflanzen. Das Keimversuch-Beispiel ist eigene altersgerechte Didaktik."
    },
    "hint": "Pflanzen wachsen mit Wasser, Licht und Pflege; der Glaube an Allah als Schöpfer schließt das Beobachten natürlicher Abläufe nicht aus.",
    "sample": "Allah ist der Schöpfer. Ich kann ein Samenkorn behutsam pflanzen und seine Entwicklung beobachten.",
    "ageText": {
      "4-5": {
        "intro": "Schau dir einen kleinen Samen an. Daraus kann eine Pflanze werden.",
        "lines": [
          "Allah hat die Pflanzen erschaffen.",
          "Ein Samenkorn kann zu einer Pflanze wachsen.",
          "Mit einem Erwachsenen darf ich es einpflanzen.",
          "Ich gieße vorsichtig und beobachte, wie es wächst."
        ],
        "evidence": "Qurʾān 6:99 erzählt vom Regen und von Pflanzen. Der Prophet ﷺ lehrte, dass Pflanzen für andere nützlich sein kann."
      },
      "6-8": {
        "intro": "Warum kommen nach Regen und Wärme neue Pflanzen aus der Erde?",
        "lines": [
          "Der Qurʾān nennt den Regen und das Hervorbringen der Pflanzen.",
          "Allah ist ihr Schöpfer; wir können die Entwicklung Schritt für Schritt beobachten.",
          "Im authentischen Ḥadīṯ wird hilfreiches Pflanzen als gute Tat beschrieben.",
          "Ich kann einen Samen mit Erlaubnis pflanzen und regelmäßig, aber nicht zu viel gießen."
        ],
        "evidence": "Qurʾān 6:99 behandelt Allahs Schöpfung; al-Buḫārī 2320 den Nutzen von Pflanzen für Menschen und Tiere."
      },
      "9-10": {
        "intro": "Wir betrachten die religiöse Aussage über den Schöpfer und ein beobachtbares Naturbeispiel.",
        "lines": [
          "Qurʾān 6:99 spricht von Wasser, das Allah herabkommen lässt, und davon, dass Pflanzen hervorgebracht werden.",
          "Anas ibn Mālik überlieferte den Ṣaḥīḥ-Ḥadīṯ über das Pflanzen, dessen Ertrag anderen zugutekommt.",
          "Das Keimen eines Samens können wir durch Beobachtung nachvollziehen.",
          "Die Aussage über den Schöpfer ist Qurʾān; unsere Pflanzaufgabe ist ein heutiges Lernexperiment."
        ],
        "evidence": "Die Quelle ist ein Versauszug; der Ḥadīṯ handelt vom Nutzen und Lohn guter Bepflanzung, nicht vom genauen biologischen Wachstum."
      }
    },
    "questions": {
      "4-5": [
        {
          "type": "choice",
          "prompt": "Wer hat die Pflanzen erschaffen?",
          "options": [
            "Allah",
            "Ein Spielzeugauto"
          ],
          "correct": 0,
          "hint": "Denke an den Qurʾān.",
          "explain": "Allah ist der Schöpfer."
        },
        {
          "type": "choice",
          "prompt": "Was tust du mit einem Samenkorn?",
          "options": [
            "Mit Hilfe vorsichtig einpflanzen.",
            "Es auf andere werfen."
          ],
          "correct": 0,
          "hint": "Wir gehen sorgsam mit Pflanzen um.",
          "explain": "Ich pflanze es behutsam."
        }
      ],
      "6-8": [
        {
          "type": "choice",
          "prompt": "Was nennt Qurʾān 6:99?",
          "options": [
            "Wasser vom Himmel und Pflanzen.",
            "Eine moderne Maschine."
          ],
          "correct": 0,
          "hint": "Regen hilft Pflanzen zu wachsen.",
          "explain": "Der Vers erwähnt Wasser und Pflanzen."
        },
        {
          "type": "choice",
          "prompt": "Welchen Nutzen erwähnt al-Buḫārī 2320?",
          "options": [
            "Menschen oder Tiere können von Pflanzen essen.",
            "Man soll alle Pflanzen absichtlich zerstören."
          ],
          "correct": 0,
          "hint": "Pflanzen können anderen nützen.",
          "explain": "Ihr Nutzen kann eine gute Tat sein."
        },
        {
          "type": "text",
          "prompt": "Wie kannst du einen Samen sicher beobachten?",
          "sample": "Ich pflanze mit Erlaubnis, gieße angemessen und notiere das Wachstum.",
          "hint": "Das ist unsere Unterrichtsübung."
        }
      ],
      "9-10": [
        {
          "type": "choice",
          "prompt": "Welche Aussage ist quellengetreu?",
          "options": [
            "Qurʾān 6:99 nennt Wasser und Pflanzen; al-Buḫārī 2320 den Nutzen des Pflanzens.",
            "Der Ḥadīṯ erklärt eine genaue botanische Messmethode."
          ],
          "correct": 0,
          "hint": "Trenne Qurʾān und Sunnah.",
          "explain": "Die Quellen haben verschiedene Schwerpunkte."
        },
        {
          "type": "text",
          "prompt": "Welche Teile der Unterrichtseinheit sind Anwendung statt Originalzitat?",
          "sample": "Das Einpflanzen und Beobachten eines Samens sind unsere Lernaufgaben.",
          "hint": "Keine erfundenen Prophetenworte."
        },
        {
          "type": "text",
          "prompt": "Warum widerspricht das Beobachten natürlicher Abläufe nicht dem Glauben an Allah als Schöpfer?",
          "sample": "Wir lernen, wie Pflanzen wachsen, und glauben, dass Allah die Schöpfung hervorgebracht hat.",
          "hint": "Zwei unterschiedliche Fragen: Schöpfer und beobachtbare Vorgänge."
        }
      ]
    },
    "voiceApproved": false
  },
  "aqidah-iman-an-engel": {
    "id": "aqidah-iman-an-engel",
    "subject": "aqidah",
    "pillar": "iman",
    "topic": "Īmān an die Engel",
    "title": "Īmān · Ich glaube an Allahs Engel",
    "lead": "Die Engel gehören zum Glauben, den der Prophet ﷺ erklärt hat.",
    "goal": "Ich weiß, dass der Glaube an die Engel eine Grundlage des Īmān ist.",
    "quran": {
      "surah": 2,
      "ayah": 285,
      "label": "Sūrat al-Baqarah · 2:285",
      "arabic": "كُلٌّ آمَنَ بِاللَّهِ وَمَلَائِكَتِهِ وَكُتُبِهِ وَرُسُلِهِ",
      "meaning": "Alle glauben an Allah, Seine Engel, Seine Bücher und Seine Gesandten. (Versauszug)",
      "excerpt": true
    },
    "hadith": {
      "source": "Ṣaḥīḥ Muslim, Nr. 8 · ʿUmar ibn al-Khaṭṭāb (Ḥadīṯ Ǧibrīl)",
      "text": "Der Prophet ﷺ erklärte den Īmān: an Allah, Seine Engel, Seine Bücher, Seine Gesandten, den Jüngsten Tag und die Bestimmung zu glauben. (Sinngemäß)"
    },
    "sourceAudit": {
      "hadithUrl": "https://dorar.net/hadith/sharh/1189",
      "hadithNumber": "8",
      "narrator": "ʿUmar ibn al-Khaṭṭāb",
      "authenticity": "Ṣaḥīḥ",
      "quranReference": "2:285",
      "quranTextType": "excerpt",
      "hadithMeaningIsParaphrase": true,
      "verifiedDate": "2026-10-12",
      "note": "Der Ḥadīṯ bei Muslim Nr. 8 ist primäre Quelle; die Dorar-Nachweisseite führt auch eine spätere Einstufung als Sekundärnachweis an. Keine erfundenen Namen, Formen, Farben oder Darstellungen von Engeln."
    },
    "hint": "Engel sind Geschöpfe Allahs, über die wir aus Qurʾān und authentischer Sunnah wissen. Keine Illustrationen oder Spekulationen über ihr Aussehen.",
    "sample": "Ich glaube an Allahs Engel, weil der Qurʾān und der Prophet ﷺ uns davon berichten.",
    "ageText": {
      "4-5": {
        "intro": "Zum Īmān gehört auch, an Allahs Engel zu glauben.",
        "lines": [
          "Īmān bedeutet: Glaube.",
          "Allah berichtet uns von Engeln.",
          "Die Engel gehören zu Allahs Schöpfung.",
          "Ich muss mir ihr Aussehen nicht ausdenken."
        ],
        "evidence": "In Qurʾān 2:285 werden Engel genannt; der Prophet ﷺ erklärte den Glauben an sie."
      },
      "6-8": {
        "intro": "Manche Dinge kennen wir aus authentischer Offenbarung, auch wenn wir sie nicht selbst sehen.",
        "lines": [
          "Qurʾān 2:285 nennt den Glauben an die Engel.",
          "Der Ḥadīṯ von Ǧibrīl zählt den Glauben an die Engel zu den Glaubensgrundlagen.",
          "Wir sprechen darüber nur so, wie Qurʾān und Sunnah sie beschreiben.",
          "Wir erfinden keine Geschichten und keine Bilder von Engeln."
        ],
        "evidence": "Muslim 8 beschreibt die Grundlagen des Īmān; diese Stunde vertieft nur den Glauben an Engel."
      },
      "9-10": {
        "intro": "Wir lernen die Engel als Teil des Īmān und halten die Grenzen unseres Wissens ein.",
        "lines": [
          "Im Vers 2:285 wird neben dem Glauben an Allah auch der Glaube an Engel genannt.",
          "Im authentischen Ḥadīṯ von Ǧibrīl wird der Īmān ausdrücklich erklärt.",
          "Wir wissen nicht alles über die Engel und vermeiden ausgedachte Einzelheiten.",
          "Wir unterscheiden Offenbarungsaussagen von Bildern, Gerüchten oder eigenen Vermutungen."
        ],
        "evidence": "Die Unterrichtsübung ist, echte Quellen zu unterscheiden; das Erfinden von Details ist kein religiöses Wissen."
      }
    },
    "questions": {
      "4-5": [
        {
          "type": "choice",
          "prompt": "Gehört der Glaube an Engel zum Īmān?",
          "options": [
            "Ja.",
            "Nein, der Qurʾān sagt nichts davon."
          ],
          "correct": 0,
          "hint": "Der Vers nennt Engel.",
          "explain": "Ja, er gehört zum Īmān."
        },
        {
          "type": "choice",
          "prompt": "Dürfen wir das Aussehen der Engel einfach erfinden?",
          "options": [
            "Nein.",
            "Ja, wie wir möchten."
          ],
          "correct": 0,
          "hint": "Wir bleiben bei den Quellen.",
          "explain": "Nein, wir erfinden nichts."
        }
      ],
      "6-8": [
        {
          "type": "choice",
          "prompt": "Wo nennt der Qurʾān die Engel?",
          "options": [
            "In 2:285.",
            "In einer erfundenen Geschichte."
          ],
          "correct": 0,
          "hint": "Schau auf den Vers.",
          "explain": "Qurʾān 2:285."
        },
        {
          "type": "choice",
          "prompt": "Welcher Ḥadīṯ erklärt die sechs Glaubensgrundlagen?",
          "options": [
            "Der Ḥadīṯ von Ǧibrīl.",
            "Ein Märchen."
          ],
          "correct": 0,
          "hint": "Quelle: Muslim 8.",
          "explain": "Der Ḥadīṯ von Ǧibrīl."
        },
        {
          "type": "text",
          "prompt": "Wie lernen wir über Engel?",
          "sample": "Aus Qurʾān und authentischer Sunnah, ohne neue Details zu erfinden.",
          "hint": "Unterscheide Wissen von Vermutungen."
        }
      ],
      "9-10": [
        {
          "type": "choice",
          "prompt": "Welche Aussage ist belegbar?",
          "options": [
            "Engel sind im Qurʾān und im Ḥadīṯ von Ǧibrīl genannt.",
            "Wir wissen sicher jede Farbe und Form der Engel."
          ],
          "correct": 0,
          "hint": "Bleibe bei belegbaren Texten.",
          "explain": "Der Glaube an die Engel ist belegt."
        },
        {
          "type": "text",
          "prompt": "Wie stimmen Qurʾān 2:285 und Muslim 8 überein?",
          "sample": "Beide nennen die Engel als Gegenstand des Glaubens.",
          "hint": "Vergleiche die ausdrücklich genannten Grundlagen."
        },
        {
          "type": "text",
          "prompt": "Was machst du bei einer unbelegten Geschichte über Engel?",
          "sample": "Ich erkläre freundlich, dass ich erst den authentischen Nachweis prüfen möchte.",
          "hint": "Nicht weiterverbreiten, solange unbelegt."
        }
      ]
    },
    "voiceApproved": false
  },
  "akhlaq-helfen-ohne-gegenleistung": {
    "id": "akhlaq-helfen-ohne-gegenleistung",
    "subject": "akhlaq",
    "pillar": "ikhlas",
    "topic": "Helfen ohne Gegenleistung",
    "title": "Ikhlāṣ · Gutes tun ohne Gegenleistung",
    "lead": "Wir helfen, weil es gut ist, und verlangen nicht jedes Mal eine Belohnung.",
    "goal": "Ich erkenne eine aufrichtige Hilfe, die nicht auf Lob oder ein Geschenk abzielt.",
    "quran": {
      "surah": 76,
      "ayah": 9,
      "label": "Sūrat al-Insān · 76:9",
      "arabic": "إِنَّمَا نُطْعِمُكُمْ لِوَجْهِ اللَّهِ لَا نُرِيدُ مِنْكُمْ جَزَاءً وَلَا شُكُورًا",
      "meaning": "Wir geben euch zu essen um Allahs willen; wir wollen von euch weder Belohnung noch Dank.",
      "excerpt": false
    },
    "hadith": {
      "source": "Ṣaḥīḥ Muslim, Nr. 2699 · Abū Hurayrah",
      "text": "Der Prophet ﷺ erklärte, dass Allah Seinem Diener hilft, solange dieser seinem Bruder hilft. (Sinngemäße Bedeutung)"
    },
    "sourceAudit": {
      "hadithUrl": "https://dorar.net/hadith/sharh/123965",
      "hadithNumber": "2699",
      "narrator": "Abū Hurayrah",
      "authenticity": "Ṣaḥīḥ",
      "quranReference": "76:9",
      "quranTextType": "complete",
      "hadithMeaningIsParaphrase": true,
      "verifiedDate": "2026-10-12",
      "note": "Die Dorar-Seite beinhaltet mehrere Überlieferungsvarianten; die verwendete Aussage ist ausdrücklich als Ṣaḥīḥ Muslim Nr. 2699 dort aufgeführt. Die Hilfe im Unterricht ist freiwillig und keine unbezahlte Pflichtarbeit für Kinder."
    },
    "hint": "Für freiwillige Freundlichkeit muss es nicht immer ein Geschenk geben. Hilfsbereitschaft schließt Grenzen, Ruhezeiten und das Bitten um Hilfe nicht aus.",
    "sample": "Ich helfe bei einer kleinen guten Sache, ohne dafür ein Geschenk zu verlangen.",
    "ageText": {
      "4-5": {
        "intro": "Manchmal kann ich etwas Gutes tun, ohne dafür ein Geschenk zu bekommen.",
        "lines": [
          "Ein Freund lässt seine Stifte fallen.",
          "Ich darf freundlich einen Stift aufheben.",
          "Ich muss dafür keine Süßigkeit bekommen.",
          "Wenn ich nicht helfen kann, darf ich freundlich Nein sagen."
        ],
        "evidence": "Qurʾān 76:9 spricht von Gutes-Tun um Allahs willen. Der Prophet ﷺ lehrte gegenseitige Hilfe."
      },
      "6-8": {
        "intro": "Eine gute Tat bleibt gut, auch wenn niemand dafür klatscht.",
        "lines": [
          "Der Qurʾān nennt Menschen, die Gutes um Allahs willen tun.",
          "Im Ḥadīṯ bei Muslim 2699 wird gegenseitige Hilfe gelobt.",
          "Ich kann jemandem freiwillig eine kleine Unterstützung anbieten.",
          "Ich muss nicht für jeden guten Schritt Lob, Punkte oder ein Geschenk erwarten."
        ],
        "evidence": "Der Vers beschreibt aufrichtiges Geben; der Ḥadīṯ die Hilfe unter Menschen. Unsere Schulbeispiele sind eigene Anwendungen."
      },
      "9-10": {
        "intro": "Wir betrachten den Unterschied zwischen Hilfsbereitschaft und der Erwartung einer Belohnung.",
        "lines": [
          "Qurʾān 76:9 nennt eine aufrichtige Hilfe, für die kein Dank verlangt wird.",
          "In Muslim 2699 lehrt der Prophet ﷺ über den Wert, anderen Menschen zu helfen.",
          "Ikhlāṣ bezieht sich auf die Absicht; über die Absicht anderer urteilen wir nicht.",
          "Aufrichtig helfen darf freiwillig und begrenzt sein: Kinder müssen sich nicht überfordern oder ihre Sicherheit gefährden."
        ],
        "evidence": "Dass Hilfe gut ist, ist belegt; eine konkrete Schulaufgabe ist ein modernes Unterrichtsbeispiel."
      }
    },
    "questions": {
      "4-5": [
        {
          "type": "choice",
          "prompt": "Was ist eine freundliche Hilfe?",
          "options": [
            "Einen heruntergefallenen Stift aufheben.",
            "Jemanden absichtlich ärgern."
          ],
          "correct": 0,
          "hint": "Eine kleine gute Tat reicht.",
          "explain": "Ich hebe den Stift auf."
        },
        {
          "type": "choice",
          "prompt": "Musst du dafür ein Geschenk verlangen?",
          "options": [
            "Nein.",
            "Ja, sonst ist Hilfe verboten."
          ],
          "correct": 0,
          "hint": "Gutes geht auch ohne Geschenk.",
          "explain": "Ich kann ohne Geschenk helfen."
        }
      ],
      "6-8": [
        {
          "type": "choice",
          "prompt": "Was bedeutet aufrichtig helfen?",
          "options": [
            "Gutes tun, ohne immer eine Belohnung zu erwarten.",
            "Andere nur gegen Geschenke unterstützen."
          ],
          "correct": 0,
          "hint": "Die Absicht zählt.",
          "explain": "Hilfe kann freiwillig sein."
        },
        {
          "type": "choice",
          "prompt": "Was lehrt Muslim 2699?",
          "options": [
            "Gegenseitige Hilfe ist wertvoll.",
            "Kinder müssen alles alleine schaffen."
          ],
          "correct": 0,
          "hint": "Der Prophet ﷺ lobte Hilfe.",
          "explain": "Helfen ist gut."
        },
        {
          "type": "text",
          "prompt": "Wann darfst du Nein sagen?",
          "sample": "Wenn ich erschöpft bin, mich unsicher fühle oder die Aufgabe zu groß ist.",
          "hint": "Gute Hilfe ist freiwillig und sicher."
        }
      ],
      "9-10": [
        {
          "type": "choice",
          "prompt": "Was macht Qurʾān 76:9 deutlich?",
          "options": [
            "Aufrichtige Hilfe kann ohne Forderung nach Dank geschehen.",
            "Dank darf niemals angenommen werden."
          ],
          "correct": 0,
          "hint": "Unterscheide Fordern von Erhalten.",
          "explain": "Keinen Dank einzufordern heißt nicht, Dank zu verbieten."
        },
        {
          "type": "text",
          "prompt": "Wie ergänzt Muslim 2699 den Qurʾānvers?",
          "sample": "Der Vers spricht von aufrichtigem Geben, der Ḥadīṯ vom Wert der gegenseitigen Hilfe.",
          "hint": "Gib beide Quellen getrennt an."
        },
        {
          "type": "text",
          "prompt": "Warum beurteilen wir fremde Absichten nicht?",
          "sample": "Wir kennen nicht sicher das Herz anderer; wir verbessern unsere eigenen Absichten.",
          "hint": "Ikhlāṣ betrifft die innere Haltung."
        }
      ]
    },
    "voiceApproved": false
  },
  "akhlaq-fehler-ehrlich-zugeben": {
    "id": "akhlaq-fehler-ehrlich-zugeben",
    "subject": "akhlaq",
    "pillar": "akhlaq",
    "topic": "Fehler ohne Ausreden zugeben",
    "title": "Akhlāq · Fehler ehrlich zugeben",
    "lead": "Ein Fehler kann passieren. Wir dürfen ehrlich sein und lernen, ihn zu berichtigen.",
    "goal": "Ich benenne einen Fehler wahrheitsgemäß und finde einen sicheren nächsten Schritt.",
    "quran": {
      "surah": 33,
      "ayah": 70,
      "label": "Sūrat al-Aḥzāb · 33:70",
      "arabic": "يَا أَيُّهَا الَّذِينَ آمَنُوا اتَّقُوا اللَّهَ وَقُولُوا قَوْلًا سَدِيدًا",
      "meaning": "O die ihr glaubt, fürchtet Allah und sagt treffende, aufrichtige Worte.",
      "excerpt": false
    },
    "hadith": {
      "source": "Ṣaḥīḥ al-Buḫārī, Nr. 6094; Ṣaḥīḥ Muslim, Nr. 2607 · ʿAbdullāh ibn Masʿūd",
      "text": "Der Prophet ﷺ erklärte, dass Wahrhaftigkeit zur Rechtschaffenheit führt. (Sinngemäße Bedeutung)"
    },
    "sourceAudit": {
      "hadithUrl": "https://dorar.net/hadith/sharh/3232",
      "hadithNumber": "6094",
      "narrator": "ʿAbdullāh ibn Masʿūd",
      "authenticity": "Ṣaḥīḥ",
      "quranReference": "33:70",
      "quranTextType": "complete",
      "hadithMeaningIsParaphrase": true,
      "verifiedDate": "2026-10-12",
      "note": "Eigenständiges Lernziel gegenüber Ṣidq: nicht bloß die Wahrheit kennen, sondern einen konkreten eigenen Fehler zugeben, um Hilfe bitten und wenn möglich wiedergutmachen. Kein Kind zur Offenbarung privater oder gefährlicher Details vor der Gruppe nötigen."
    },
    "hint": "Erwachsene müssen auf ein Eingeständnis ohne Beschämung oder Bedrohung reagieren. Ein Kind muss gefährliche Geheimnisse nicht bewahren und darf sich jederzeit an eine sichere Vertrauensperson wenden.",
    "sample": "Ich sage: Das ist mir passiert. Es tut mir leid. Wie kann ich es wieder gutmachen?",
    "ageText": {
      "4-5": {
        "intro": "Manchmal fällt mir etwas herunter oder ich mache einen Fehler.",
        "lines": [
          "Ein Becher kippt um.",
          "Ich darf sagen: Das ist mir passiert.",
          "Ich bitte ruhig um Hilfe beim Aufwischen.",
          "Wir lernen daraus, ohne andere auszulachen."
        ],
        "evidence": "Der Qurʾān lehrt, aufrichtig zu sprechen. Der Prophet ﷺ lehrte die Bedeutung der Wahrheit."
      },
      "6-8": {
        "intro": "Fehler zuzugeben kann Mut brauchen. Es ist ein guter erster Schritt zum Bessermachen.",
        "lines": [
          "Qurʾān 33:70 lehrt gute, aufrichtige Worte.",
          "Die Sunnah lehrt, dass Wahrhaftigkeit zu Gutem führt.",
          "Wenn ich etwas falsch gemacht habe, darf ich es ehrlich erklären.",
          "Ich kann mich entschuldigen und helfen, einen entstandenen Schaden zu beheben."
        ],
        "evidence": "Die Szene mit dem umgekippten Becher ist eine pädagogische Geschichte; kein historischer Ḥadīṯ."
      },
      "9-10": {
        "intro": "Wir verbinden eine wahrhaftige Aussage mit Verantwortung für das eigene Verhalten.",
        "lines": [
          "Im Qurʾān 33:70 werden die Gläubigen zu treffenden und aufrichtigen Worten aufgefordert.",
          "Ibn Masʿūd überlieferte einen Ṣaḥīḥ-Ḥadīṯ über die Bedeutung von Wahrhaftigkeit.",
          "Einen Fehler zuzugeben ist nicht das Ende; man kann Wiedergutmachung anbieten und Hilfe suchen.",
          "Ehrlichkeit bedeutet nicht, sich in einer gefährlichen Situation zu exponieren; bei Bedrohung wendet man sich an eine Vertrauensperson."
        ],
        "evidence": "Die Aussage über Wahrhaftigkeit stammt aus al-Buḫārī 6094, das Schulbeispiel ist unsere Anwendung."
      }
    },
    "questions": {
      "4-5": [
        {
          "type": "choice",
          "prompt": "Du verschüttest Wasser. Was kannst du sagen?",
          "options": [
            "Das ist mir passiert.",
            "Ich beschuldige absichtlich jemand anderen."
          ],
          "correct": 0,
          "hint": "Ein Fehler kann passieren.",
          "explain": "Ich sage ehrlich, was passiert ist."
        },
        {
          "type": "choice",
          "prompt": "Was ist ein guter nächster Schritt?",
          "options": [
            "Hilfe zum Aufwischen holen.",
            "Alle auslachen."
          ],
          "correct": 0,
          "hint": "Wir machen es zusammen besser.",
          "explain": "Ich bitte um Hilfe."
        }
      ],
      "6-8": [
        {
          "type": "choice",
          "prompt": "Du möchtest etwas erzählen, obwohl es schwerfällt, ehrlich zu sein. Was sollen wir nach dem Unterricht beim Sprechen beachten?",
          "options": [
            "Aufrichtig und richtig sprechen.",
            "Nur ehrlich sein, wenn es uns leichtfällt."
          ],
          "correct": 0,
          "hint": "Denk an die Worte.",
          "explain": "Wir sprechen wahrhaftig."
        },
        {
          "type": "choice",
          "prompt": "Was kannst du nach einem Fehler anbieten?",
          "options": [
            "Eine Entschuldigung und passende Wiedergutmachung.",
            "Eine Ausrede über jemand anderen."
          ],
          "correct": 0,
          "hint": "Versuche es besser zu machen.",
          "explain": "Ich übernehme Verantwortung."
        },
        {
          "type": "text",
          "prompt": "Wie sprichst du über einen Fehler ohne jemand anderen zu beschuldigen?",
          "sample": "Das ist mir passiert. Ich möchte es wieder gutmachen.",
          "hint": "Du musst keine Angst haben, um Hilfe zu bitten."
        }
      ],
      "9-10": [
        {
          "type": "choice",
          "prompt": "Was ist das Ziel dieser Unterrichtseinheit?",
          "options": [
            "Einen Fehler ehrlich benennen und eine gute Lösung suchen.",
            "Fehler durch Ausreden verstecken."
          ],
          "correct": 0,
          "hint": "Gutes Verhalten geht über ein Wort hinaus.",
          "explain": "Ehrlichkeit und Wiedergutmachung."
        },
        {
          "type": "text",
          "prompt": "Wir haben einen Qurʾān-Vers über richtiges Sprechen und eine Überlieferung über Wahrhaftigkeit kennengelernt. Welche gemeinsame Lehre erkennst du darin?",
          "sample": "Beide bekräftigen wahrhaftiges Reden und seine gute Wirkung.",
          "hint": "Überlege, was beide Quellen über aufrichtiges Sprechen lehren."
        },
        {
          "type": "text",
          "prompt": "Welche Grenzen gelten bei einer ehrlichen Aussage?",
          "sample": "Ich kann mir in unsicheren Situationen Unterstützung einer Vertrauensperson holen.",
          "hint": "Ehrlichkeit bedeutet nicht, dass Kinder gefährlichen Druck aushalten müssen."
        }
      ]
    },
    "voiceApproved": false
  }
};
for(const [id,l] of Object.entries(additions)){
 if(l.id!==id||prior[id]||!l.quran?.surah||!l.sourceAudit?.hadithUrl||l.voiceApproved)throw Error("V29 unsafe lesson "+id);
 for(const age of ["4-5","6-8","9-10"]){
  if(l.ageText?.[age]?.lines?.length!==4||l.questions?.[age]?.length<2)throw Error("V29 incomplete age content "+id);
 }
}
window.DARKidsAcademyCurriculum=Object.freeze({...prior,...additions});
window.DARKidsAcademyCurriculumV29=Object.freeze({"version":"20261012-v29","count":4,"ids":["aqidah-allah-pflanzen-wachsen","aqidah-iman-an-engel","akhlaq-helfen-ohne-gegenleistung","akhlaq-fehler-ehrlich-zugeben"],"pillars":{"aqidah-allah-pflanzen-wachsen":"tawhid","aqidah-iman-an-engel":"iman","akhlaq-helfen-ohne-gegenleistung":"ikhlas","akhlaq-fehler-ehrlich-zugeben":"akhlaq"},"religiousSourcesVerified":true,"voiceRecordingsApproved":false,"requiresHumanAudioApproval":true});
})();